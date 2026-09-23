// ============================================================================
// VRM Enterprise HRMS - Backend Shift Attendance Window Validation Engine
// Enforces 3-Hour Early Check-In Window and Completed Shift Closure
// ============================================================================

import { AttendanceLogRecord, AttendanceShiftState, ShiftRecord, ShiftWindowEvaluation } from '../types/hrms.js';

export interface ShiftTimeComponents {
  hours: number;
  minutes: number;
  display12: string;
}

export function parseShiftTime(timeStr?: string | null, fallback = '09:00'): ShiftTimeComponents {
  const clean = (timeStr || fallback).trim().toUpperCase();
  const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/);

  let hours = 9;
  let minutes = 0;

  if (match) {
    hours = parseInt(match[1], 10);
    minutes = parseInt(match[2], 10);
    const meridian = match[3];

    if (meridian) {
      if (meridian === 'PM' && hours < 12) hours += 12;
      if (meridian === 'AM' && hours === 12) hours = 0;
    }
  }

  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  const display12 = `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${ampm}`;

  return { hours, minutes, display12 };
}

export function formatDateISO(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function calculateShiftDateTimes(shiftDateStr: string, shift: ShiftRecord): {
  shiftStartDateTime: Date;
  shiftEndDateTime: Date;
  earlyCheckInDateTime: Date;
  isNightShift: boolean;
} {
  const [year, month, day] = shiftDateStr.split('-').map(Number);
  const start = parseShiftTime(shift.startTime, '09:00');
  const end = parseShiftTime(shift.endTime, '18:00');

  const shiftStartDateTime = new Date(year, month - 1, day, start.hours, start.minutes, 0, 0);

  // Early check-in window opens strictly 3 hours before shift start
  const earlyCheckInDateTime = new Date(shiftStartDateTime.getTime() - 3 * 60 * 60 * 1000);

  let isNightShift = false;
  let shiftEndDateTime: Date;

  if (end.hours < start.hours || (end.hours === start.hours && end.minutes < start.minutes)) {
    isNightShift = true;
    shiftEndDateTime = new Date(year, month - 1, day + 1, end.hours, end.minutes, 0, 0);
  } else {
    shiftEndDateTime = new Date(year, month - 1, day, end.hours, end.minutes, 0, 0);
  }

  return {
    shiftStartDateTime,
    shiftEndDateTime,
    earlyCheckInDateTime,
    isNightShift,
  };
}

export function evaluateBackendShiftAttendance(params: {
  employeeId: string;
  assignedShift: ShiftRecord;
  attendanceLogs: AttendanceLogRecord[];
  now?: Date;
}): ShiftWindowEvaluation {
  const now = params.now || new Date();
  const todayDateStr = formatDateISO(now);

  const shift = params.assignedShift;
  const todayTimes = calculateShiftDateTimes(todayDateStr, shift);

  // Check if there is an existing record for today's shift
  const existingToday = params.attendanceLogs.find(
    (l) => l.employeeId === params.employeeId && (l.shiftDate === todayDateStr || l.date === todayDateStr)
  );

  const startComp = parseShiftTime(shift.startTime, '09:00');
  const endComp = parseShiftTime(shift.endTime, '18:00');
  const earlyComp = parseShiftTime(
    `${todayTimes.earlyCheckInDateTime.getHours()}:${String(todayTimes.earlyCheckInDateTime.getMinutes()).padStart(2, '0')}`
  );

  // 1. If today's shift has checkout -> COMPLETED / WAITING_FOR_NEXT_SHIFT
  if (existingToday && existingToday.checkOut) {
    // Next shift begins tomorrow (or next working day)
    const nextDate = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const nextDateStr = formatDateISO(nextDate);
    const nextTimes = calculateShiftDateTimes(nextDateStr, shift);
    const nextEarlyComp = parseShiftTime(
      `${nextTimes.earlyCheckInDateTime.getHours()}:${String(nextTimes.earlyCheckInDateTime.getMinutes()).padStart(2, '0')}`
    );

    const isNextWindowOpen = now.getTime() >= nextTimes.earlyCheckInDateTime.getTime();

    if (isNextWindowOpen) {
      return {
        employeeId: params.employeeId,
        state: 'CHECK_IN_AVAILABLE',
        assignedShift: shift,
        shiftDate: nextDateStr,
        shiftStartDateTime: nextTimes.shiftStartDateTime.toISOString(),
        shiftEndDateTime: nextTimes.shiftEndDateTime.toISOString(),
        checkInOpenDateTime: nextTimes.earlyCheckInDateTime.toISOString(),
        canCheckIn: true,
        canCheckOut: false,
        message: `Check In available for next shift (${nextDateStr} ${startComp.display12})`,
        todayRecord: existingToday,
      };
    }

    const countdownSeconds = Math.max(0, Math.floor((nextTimes.earlyCheckInDateTime.getTime() - now.getTime()) / 1000));
    return {
      employeeId: params.employeeId,
      state: 'WAITING_FOR_NEXT_SHIFT',
      assignedShift: shift,
      shiftDate: nextDateStr,
      shiftStartDateTime: nextTimes.shiftStartDateTime.toISOString(),
      shiftEndDateTime: nextTimes.shiftEndDateTime.toISOString(),
      checkInOpenDateTime: nextTimes.earlyCheckInDateTime.toISOString(),
      canCheckIn: false,
      canCheckOut: false,
      message: `Shift completed. Next Check In opens at ${nextEarlyComp.display12} (${nextDateStr})`,
      countdownSeconds,
      todayRecord: existingToday,
    };
  }

  // 2. If employee checked in today but hasn't checked out -> CHECKED_IN
  if (existingToday && existingToday.checkIn && !existingToday.checkOut) {
    return {
      employeeId: params.employeeId,
      state: 'CHECKED_IN',
      assignedShift: shift,
      shiftDate: todayDateStr,
      shiftStartDateTime: todayTimes.shiftStartDateTime.toISOString(),
      shiftEndDateTime: todayTimes.shiftEndDateTime.toISOString(),
      checkInOpenDateTime: todayTimes.earlyCheckInDateTime.toISOString(),
      canCheckIn: false,
      canCheckOut: true,
      message: `Checked in at ${existingToday.checkIn}. Shift ends at ${endComp.display12}`,
      todayRecord: existingToday,
    };
  }

  // 3. Not checked in yet today: evaluate if we are within the 3-hour window
  if (now.getTime() < todayTimes.earlyCheckInDateTime.getTime()) {
    const countdownSeconds = Math.max(0, Math.floor((todayTimes.earlyCheckInDateTime.getTime() - now.getTime()) / 1000));
    return {
      employeeId: params.employeeId,
      state: 'UPCOMING',
      assignedShift: shift,
      shiftDate: todayDateStr,
      shiftStartDateTime: todayTimes.shiftStartDateTime.toISOString(),
      shiftEndDateTime: todayTimes.shiftEndDateTime.toISOString(),
      checkInOpenDateTime: todayTimes.earlyCheckInDateTime.toISOString(),
      canCheckIn: false,
      canCheckOut: false,
      message: `Shift starts at ${startComp.display12}. Check In opens at ${earlyComp.display12} (3h before)`,
      countdownSeconds,
    };
  }

  // 4. Within or after 3-hour window -> CHECK_IN_AVAILABLE
  return {
    employeeId: params.employeeId,
    state: 'CHECK_IN_AVAILABLE',
    assignedShift: shift,
    shiftDate: todayDateStr,
    shiftStartDateTime: todayTimes.shiftStartDateTime.toISOString(),
    shiftEndDateTime: todayTimes.shiftEndDateTime.toISOString(),
    checkInOpenDateTime: todayTimes.earlyCheckInDateTime.toISOString(),
    canCheckIn: true,
    canCheckOut: false,
    message: `Early Check In is OPEN for shift (${startComp.display12} – ${endComp.display12})`,
  };
}
