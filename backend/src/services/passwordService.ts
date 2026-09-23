// VRM Enterprise HRMS — Password Generator & Complexity Validation Service

const TRIVIAL_PASSWORDS = new Set([
  '123456',
  'password',
  'password123',
  'employee123',
  'admin123',
  'vrm123',
  '12345678',
  '123456789',
  'qwerty',
  'welcome123',
]);

const UPPERCASE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

/**
 * Generates a secure temporary password following the enterprise pattern:
 * e.g., Vrm@482971A
 * Contains:
 * - Uppercase ('V' + random letter)
 * - Lowercase ('rm')
 * - Special character ('@')
 * - Numbers (6 random digits)
 * - Total length: 11 characters (>= 10)
 */
export function generateTemporaryPassword(): string {
  const digits = Math.floor(100000 + Math.random() * 900000).toString();
  const suffixChar = UPPERCASE_CHARS[Math.floor(Math.random() * UPPERCASE_CHARS.length)];
  const tempPassword = `Vrm@${digits}${suffixChar}`;
  return tempPassword;
}

export interface PasswordValidationResult {
  valid: boolean;
  message?: string;
  checks: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
    notTrivial: boolean;
  };
}

/**
 * Validates password complexity against VRM HRMS enterprise standards:
 * - Minimum 10 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one number
 * - At least one special character
 * - Not a trivial / common password
 */
export function validatePasswordComplexity(password: string): PasswordValidationResult {
  const clean = (password || '').trim();

  const minLength = clean.length >= 10;
  const hasUppercase = /[A-Z]/.test(clean);
  const hasLowercase = /[a-z]/.test(clean);
  const hasNumber = /[0-9]/.test(clean);
  const hasSpecialChar = /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(clean);
  const notTrivial = !TRIVIAL_PASSWORDS.has(clean.toLowerCase());

  const allPassed = minLength && hasUppercase && hasLowercase && hasNumber && hasSpecialChar && notTrivial;

  let message: string | undefined;
  if (!allPassed) {
    if (!minLength) {
      message = 'Password must be at least 10 characters long.';
    } else if (!hasUppercase) {
      message = 'Password must contain at least one uppercase letter.';
    } else if (!hasLowercase) {
      message = 'Password must contain at least one lowercase letter.';
    } else if (!hasNumber) {
      message = 'Password must contain at least one numeric digit.';
    } else if (!hasSpecialChar) {
      message = 'Password must contain at least one special character (e.g. @, #, $, %).';
    } else if (!notTrivial) {
      message = 'Password cannot be a common or trivial password.';
    }
  }

  return {
    valid: allPassed,
    message,
    checks: {
      minLength,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecialChar,
      notTrivial,
    },
  };
}
