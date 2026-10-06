/**
 * Standard Date Formatting Utility for VRM Enterprise HRM
 * Formats dates strictly as DD/MM/YYYY across all modules and tables.
 */

export const formatDateDDMMYYYY = (dateInput: string | Date | null | undefined): string => {
  if (!dateInput) return '';

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim();
    if (!trimmed) return '';

    // If it's already in DD/MM/YYYY
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(trimmed)) {
      return trimmed;
    }

    // Standard ISO format: YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss...
    const ymdMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (ymdMatch) {
      const [, yyyy, mm, dd] = ymdMatch;
      return `${dd}/${mm}/${yyyy}`;
    }

    // DD-MM-YYYY format
    const dmyMatch = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})/);
    if (dmyMatch) {
      const [, dd, mm, yyyy] = dmyMatch;
      return `${dd}/${mm}/${yyyy}`;
    }
  }

  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return String(dateInput);

  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

export const formatDate = formatDateDDMMYYYY;

export const formatDateRange = (
  startDate: string | Date | null | undefined, 
  endDate: string | Date | null | undefined,
  separator: string = ' to '
): string => {
  const start = formatDateDDMMYYYY(startDate);
  const end = formatDateDDMMYYYY(endDate);
  if (!start && !end) return '';
  if (!end) return start;
  if (!start) return end;
  return `${start}${separator}${end}`;
};

export const normalizeToYYYYMMDD = (val: string | Date | null | undefined): string => {
  if (!val) return '';
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  const clean = String(val).trim();
  if (!clean) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    return clean.slice(0, 10);
  }
  const parts = clean.split(/[-/]/);
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    } else if (parts[0].length === 4) {
      return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
    }
  }
  const d = new Date(clean);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return clean;
};

/**
 * Standard Time Formatting Utility for VRM Enterprise HRM
 * Converts UTC ISO timestamps, 24-hr times, and date strings strictly into Indian Standard Time (IST) 12-hour AM/PM format (e.g. "06:18 PM").
 */
export const formatTimeDisplay = (timeInput?: string | Date | null, fallback = '—'): string => {
  if (!timeInput) return fallback;
  if (timeInput instanceof Date) {
    if (isNaN(timeInput.getTime())) return fallback;
    return timeInput.toLocaleTimeString('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  const raw = String(timeInput).trim();
  if (!raw || raw === '--:--' || raw === '—' || raw === '-' || raw.toLowerCase() === 'missing') {
    return fallback;
  }

  // 1. Full ISO timestamp or datetime string from PostgreSQL TIMESTAMPTZ (stored in UTC)
  if (raw.includes('T') || raw.includes('Z') || (raw.includes('-') && raw.includes(':'))) {
    let parsed: Date;
    if (raw.endsWith('Z') || raw.includes('+') || /-[0-9]{2}:?[0-9]{2}$/.test(raw)) {
      parsed = new Date(raw);
    } else if (raw.includes('T')) {
      parsed = new Date(raw.endsWith('Z') ? raw : raw + 'Z');
    } else {
      parsed = new Date(raw.replace(/\s+/, 'T') + 'Z');
    }

    if (!isNaN(parsed.getTime())) {
      return parsed.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    }
  }

  // 2. 12-hour AM/PM string (e.g. "6:18 PM", "06:18:30 PM", "9:17 AM")
  const ampmMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)$/i);
  if (ampmMatch) {
    const hh = ampmMatch[1].padStart(2, '0');
    const mm = ampmMatch[2];
    const mer = ampmMatch[3].toUpperCase();
    return `${hh}:${mm} ${mer}`;
  }

  // 3. 24-hour time string (e.g. "18:18", "09:17", "18:18:30")
  const hhmmMatch = raw.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (hhmmMatch) {
    let hours = parseInt(hhmmMatch[1], 10);
    const mins = hhmmMatch[2];
    const mer = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${String(hours).padStart(2, '0')}:${mins} ${mer}`;
  }

  return raw;
};

export const formatTime = formatTimeDisplay;

