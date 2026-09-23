import { Employee } from '../types/hrms';

/**
 * Generates the next sequential, collision-free Employee ID.
 * Analyzes existing employees' IDs to determine the next numeric index based on
 * configured prefix (e.g. 'EMP', 'VRM') and digits count.
 */
export const generateNextEmployeeId = (
  existingEmployees: Employee[] = [],
  configPrefix: string = 'EMP',
  configDigits: number = 3,
  startingNumber: number = 1
): string => {
  let rawPrefix = (configPrefix || 'EMP').trim();
  if (!rawPrefix) rawPrefix = 'EMP';

  // Normalize prefix: strip trailing dashes, underscores, or spaces
  const cleanPrefix = rawPrefix.replace(/[-_ ]+$/, '');
  const prefixWithHyphen = `${cleanPrefix}-`;
  const minDigits = configDigits && configDigits > 0 ? configDigits : 3;
  const startNum = startingNumber && startingNumber > 0 ? startingNumber : 1;

  let maxNum = startNum - 1;

  // Scan existing employees
  for (const emp of existingEmployees) {
    const id = (emp.employeeId || emp.id || '').trim();
    if (!id) continue;

    // Pattern 1: Match prefix directly e.g. "EMP-012" or "EMP012"
    const prefixRegex = new RegExp(`^${cleanPrefix}[-_ ]?([0-9]+)$`, 'i');
    const match = id.match(prefixRegex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
      continue;
    }

    // Pattern 2: Any matching alphabetic prefix with trailing digits e.g. "VRM-005"
    const genericMatch = id.match(/^([A-Za-z]+)[-_ ]?([0-9]+)$/);
    if (genericMatch) {
      if (genericMatch[1].toUpperCase() === cleanPrefix.toUpperCase()) {
        const num = parseInt(genericMatch[2], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  let nextNum = Math.max(startNum, maxNum + 1);
  let candidate = `${prefixWithHyphen}${String(nextNum).padStart(minDigits, '0')}`;

  // Ensure collision-free against any existing employee
  const existingSet = new Set(
    existingEmployees.map(e => (e.employeeId || e.id || '').trim().toLowerCase())
  );

  while (existingSet.has(candidate.toLowerCase())) {
    nextNum++;
    candidate = `${prefixWithHyphen}${String(nextNum).padStart(minDigits, '0')}`;
  }

  return candidate;
};
