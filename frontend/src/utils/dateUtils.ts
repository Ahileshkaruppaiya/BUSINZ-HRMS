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

