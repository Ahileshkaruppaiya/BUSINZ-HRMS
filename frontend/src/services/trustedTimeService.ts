import { getApiBaseUrl } from '../config/api';
import { AttendanceRecord } from '../types/hrms';

const STORAGE_KEY = 'vrm_hrms_last_trusted_attendance_time';
const MAX_DEVICE_DRIFT_MS = 5 * 60 * 1000;

let baseWallMs = Date.now();
let baseMonoMs = typeof performance !== 'undefined' ? performance.now() : 0;
let serverBaseMs: number | null = null;
let serverBaseMonoMs = baseMonoMs;
let calibrationStarted = false;

const readLastTrustedMs = () => {
  try {
    return Number(localStorage.getItem(STORAGE_KEY) || 0) || 0;
  } catch {
    return 0;
  }
};

const writeLastTrustedMs = (value: number) => {
  try {
    localStorage.setItem(STORAGE_KEY, String(Math.max(value, readLastTrustedMs())));
  } catch {
    // localStorage may be unavailable in private/restricted modes.
  }
};

const getMonoMs = () => (typeof performance !== 'undefined' ? performance.now() : Date.now() - baseWallMs);

const resolveServerHealthUrls = () => {
  const urls = new Set<string>();
  const apiBase = getApiBaseUrl().replace(/\/$/, '');
  const rootBase = apiBase.replace(/\/api\/v\d+$/i, '');
  urls.add(`${rootBase}/health`);
  urls.add('/health');
  urls.add(`${apiBase}/health`);
  return Array.from(urls);
};

export const calibrateTrustedTime = async () => {
  if (calibrationStarted) return;
  calibrationStarted = true;

  for (const url of resolveServerHealthUrls()) {
    try {
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) continue;
      const dateHeader = res.headers.get('date');
      const body = await res.clone().json().catch(() => null);
      const rawTimestamp = body?.timestamp || body?.serverTime || dateHeader;
      const parsed = rawTimestamp ? Date.parse(rawTimestamp) : NaN;
      if (Number.isFinite(parsed)) {
        serverBaseMs = parsed;
        serverBaseMonoMs = getMonoMs();
        writeLastTrustedMs(parsed);
        return;
      }
    } catch {
      // Try the next endpoint; attendance still has monotonic tamper detection.
    }
  }
};

export const getTrustedNow = (): Date => {
  const monoNow = getMonoMs();
  const trustedMs = serverBaseMs !== null
    ? serverBaseMs + (monoNow - serverBaseMonoMs)
    : baseWallMs + (monoNow - baseMonoMs);
  return new Date(trustedMs);
};

export const getTrustedClockStatus = () => {
  const trustedMs = getTrustedNow().getTime();
  const deviceMs = Date.now();
  const driftMs = deviceMs - trustedMs;
  const lastTrustedMs = readLastTrustedMs();
  const movedBackwards = lastTrustedMs > 0 && trustedMs + MAX_DEVICE_DRIFT_MS < lastTrustedMs;
  const deviceClockChanged = Math.abs(driftMs) > MAX_DEVICE_DRIFT_MS;

  return {
    trustedNow: new Date(trustedMs),
    trustedMs,
    deviceMs,
    driftMs,
    hasServerTime: serverBaseMs !== null,
    isSuspicious: movedBackwards || deviceClockChanged,
    message: movedBackwards
      ? 'Device/server time moved backwards. Attendance punch blocked for time integrity.'
      : deviceClockChanged
        ? 'Device time differs from trusted attendance clock. Attendance punch blocked.'
        : ''
  };
};

export const validateAttendancePunchTime = (records: AttendanceRecord[] = []) => {
  const status = getTrustedClockStatus();
  if (status.isSuspicious) {
    return { success: false, message: status.message, trustedNow: status.trustedNow };
  }

  const latestRecordMs = records.reduce((max, rec) => {
    const datePart = rec.shiftDate || rec.date;
    const timePart = rec.checkOut || rec.checkIn;
    if (!datePart || !timePart) return max;
    const parsed = Date.parse(`${datePart} ${timePart}`);
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0);

  if (latestRecordMs > 0 && status.trustedMs + MAX_DEVICE_DRIFT_MS < latestRecordMs) {
    return {
      success: false,
      message: 'Attendance clock is earlier than the latest punch record. Please correct system time or contact HR.',
      trustedNow: status.trustedNow
    };
  }

  return { success: true, message: '', trustedNow: status.trustedNow };
};

export const commitTrustedAttendanceTime = (date: Date = getTrustedNow()) => {
  writeLastTrustedMs(date.getTime());
};
