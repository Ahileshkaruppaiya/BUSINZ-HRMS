import { describe, it, expect, beforeAll } from 'vitest';
import { generateTemporaryPassword, validatePasswordComplexity } from '../src/services/passwordService.js';
import { sendCredentialEmail, formatCredentialEmailBody } from '../src/services/emailService.js';

const BASE_URL = 'http://localhost:8000';
let hrAuthToken: string;

beforeAll(async () => {
  // Obtain HR Admin token for authenticated endpoints
  const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'hr@vrmstructures.com', password: 'Password@123' }),
  });

  expect(loginRes.status).toBe(200);
  const loginData = await loginRes.json();
  hrAuthToken = loginData.data.accessToken;
});

describe('VRM Enterprise HRMS — Password Service Security Standards', () => {
  it('generates secure temporary passwords adhering to Vrm@xxxxxxX pattern', () => {
    const tempPw = generateTemporaryPassword();
    expect(tempPw).toMatch(/^Vrm@\d{6}[A-Z]$/);
    expect(tempPw.length).toBe(11);
    expect(tempPw.length).toBeGreaterThanOrEqual(10);
    expect(/[A-Z]/.test(tempPw)).toBe(true);
    expect(/[a-z]/.test(tempPw)).toBe(true);
    expect(/[0-9]/.test(tempPw)).toBe(true);
    expect(/[!@#$%^&*]/.test(tempPw)).toBe(true);
  });

  it('rejects trivial, common, and weak passwords', () => {
    expect(validatePasswordComplexity('123456').valid).toBe(false);
    expect(validatePasswordComplexity('password').valid).toBe(false);
    expect(validatePasswordComplexity('employee123').valid).toBe(false);
    expect(validatePasswordComplexity('Short1!').valid).toBe(false);
    expect(validatePasswordComplexity('NoSpecialChar1234').valid).toBe(false);
    expect(validatePasswordComplexity('nonumeric!@#ABCDEF').valid).toBe(false);
  });

  it('accepts strong compliant passwords', () => {
    const validResult = validatePasswordComplexity('VrmSecure@2026!');
    expect(validResult.valid).toBe(true);
    expect(validResult.message).toBeUndefined();
  });
});

describe('VRM Enterprise HRMS — Credential Email Service', () => {
  it('formats credential email body according to enterprise specification', () => {
    const emailBody = formatCredentialEmailBody({
      to: 'suresh@vrmstructures.in',
      employeeName: 'Suresh Kumar',
      employeeCode: 'EMP-055',
      temporaryPassword: 'Vrm@482971A',
      loginUrl: 'http://localhost:5173/login',
    });

    expect(emailBody).toContain('Dear Suresh Kumar,');
    expect(emailBody).toContain('EMP-055');
    expect(emailBody).toContain('suresh@vrmstructures.in');
    expect(emailBody).toContain('Vrm@482971A');
    expect(emailBody).toContain('http://localhost:5173/login');
    expect(emailBody).toContain('change your temporary password when you log in for the first time');
    expect(emailBody).toContain('Businz Technologies Private Limited');
  });

  it('records delivery status correctly for valid and invalid recipients', async () => {
    const successRes = await sendCredentialEmail({
      to: 'valid.worker@vrmstructures.com',
      employeeName: 'Valid Worker',
      employeeCode: 'EMP-077',
      temporaryPassword: 'Vrm@123456B',
    });
    expect(successRes.status).toBe('SENT');
    expect(successRes.sentAt).toBeDefined();

    const failRes = await sendCredentialEmail({
      to: 'not-an-email',
      employeeName: 'Invalid Worker',
      employeeCode: 'EMP-078',
      temporaryPassword: 'Vrm@123456B',
    });
    expect(failRes.status).toBe('FAILED');
  });
});

describe('VRM Enterprise HRMS — Full Employee Onboarding & Login Account Creation Flow', () => {
  const testEmpCode = `EMP-TEST-${Date.now().toString().slice(-4)}`;
  const testEmail = `onboard.${Date.now()}@vrmstructures.com`;
  let tempPasswordCaptured: string;

  it('rejects duplicate email and duplicate Employee Code', async () => {
    // Attempt with existing HR email
    const duplicateEmailRes = await fetch(`${BASE_URL}/api/v1/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrAuthToken}`,
      },
      body: JSON.stringify({
        firstName: 'Duplicate',
        lastName: 'Check',
        email: 'hr@vrmstructures.com',
        department: 'HR',
      }),
    });

    expect(duplicateEmailRes.status).toBe(409);
    const emailErr = await duplicateEmailRes.json();
    expect(emailErr.error.code).toBe('DUPLICATE_EMAIL');

    // Attempt with existing employee ID
    const duplicateIdRes = await fetch(`${BASE_URL}/api/v1/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrAuthToken}`,
      },
      body: JSON.stringify({
        employeeId: 'EMP-001',
        firstName: 'Duplicate',
        lastName: 'ID',
        email: `unique.${Date.now()}@vrmstructures.com`,
      }),
    });

    expect(duplicateIdRes.status).toBe(409);
    const idErr = await duplicateIdRes.json();
    expect(idErr.error.code).toBe('DUPLICATE_EMPLOYEE_CODE');
  });

  it('successfully onboards employee, auto-creates login account, and dispatches email', async () => {
    const createRes = await fetch(`${BASE_URL}/api/v1/employees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrAuthToken}`,
      },
      body: JSON.stringify({
        employeeId: testEmpCode,
        firstName: 'Aarav',
        lastName: 'Sharma',
        email: testEmail,
        department: 'Procurement',
        designation: 'Solar Logistics Executive',
        basicSalary: 32000,
        grossSalary: 64000,
      }),
    });

    expect(createRes.status).toBe(201);
    const createData = await createRes.json();
    expect(createData.success).toBe(true);
    expect(createData.status).toBe('CREATED');
    expect(createData.data.employeeId).toBe(testEmpCode);
    expect(createData.data.email).toBe(testEmail);
    expect(createData.data.authUserId).toBeDefined();
    expect(createData.data.accountStatus).toBe('ACTIVE');
    expect(createData.data.mustChangePassword).toBe(true);
    expect(createData.data.credentialEmailStatus).toBe('SENT');
    expect(createData.data.credentialEmailSentAt).toBeDefined();

    // Plaintext password MUST NOT be returned in employee body
    expect(createData.data.password).toBeUndefined();
    expect(createData.data.temporaryPassword).toBeUndefined();

    // Inspect account info to verify creation state
    const accountRes = await fetch(`${BASE_URL}/api/v1/employees/${testEmpCode}/login-account`, {
      headers: { Authorization: `Bearer ${hrAuthToken}` },
    });
    expect(accountRes.status).toBe(200);
    const accountData = await accountRes.json();
    expect(accountData.data.authAccount).toBe('Created');
    expect(accountData.data.credentialEmailStatus).toBe('SENT');
  });

  it('resets login credentials and captures temporary password for subsequent login tests', async () => {
    // Reset login via HR action
    const resetRes = await fetch(`${BASE_URL}/api/v1/employees/${testEmpCode}/reset-login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrAuthToken}`,
      },
    });

    expect(resetRes.status).toBe(200);
    const resetData = await resetRes.json();
    expect(resetData.success).toBe(true);
    expect(resetData.data.mustChangePassword).toBe(true);
    expect(resetData.data.emailStatus).toBe('SENT');
    expect(resetData.data.temporaryPassword).toBeDefined();
    tempPasswordCaptured = resetData.data.temporaryPassword;

    // Retrieve account info to confirm temporary password state
    const accountRes = await fetch(`${BASE_URL}/api/v1/employees/${testEmpCode}/login-account`, {
      headers: {
        Authorization: `Bearer ${hrAuthToken}`,
      },
    });

    expect(accountRes.status).toBe(200);
    const accountData = await accountRes.json();
    expect(accountData.data.userId).toBe(testEmpCode);
    expect(accountData.data.accountStatus).toBe('ACTIVE');
    expect(accountData.data.mustChangePassword).toBe(true);
    expect(accountData.data.passwordStatus).toBe('Temporary Password Active');
    expect(accountData.data.password).toBeUndefined(); // Never exposed in account view
  });

  it('authenticates via Employee Code (Option A) and forces password change on first login', async () => {
    expect(tempPasswordCaptured).toBeDefined();

    // 1. Wrong password rejected
    const wrongRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmpCode, password: 'WrongPassword@999' }),
    });

    expect(wrongRes.status).toBe(401);
    const wrongData = await wrongRes.json();
    expect(wrongData.error.code).toBe('INVALID_CREDENTIALS');

    // 2. Option A: Login with Employee Code
    const loginByCodeRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmpCode, password: tempPasswordCaptured }),
    });

    expect(loginByCodeRes.status).toBe(200);
    const codeData = await loginByCodeRes.json();
    expect(codeData.success).toBe(true);
    expect(codeData.data.user.employeeId).toBe(testEmpCode);
    expect(codeData.data.user.mustChangePassword).toBe(true);
    const empAccessToken = codeData.data.accessToken;
    expect(empAccessToken).toBeDefined();

    // 3. Option B: Login with Email works equally well
    const loginByEmailRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmail, password: tempPasswordCaptured }),
    });

    expect(loginByEmailRes.status).toBe(200);
    const emailData = await loginByEmailRes.json();
    expect(emailData.data.user.email).toBe(testEmail);

    // 4. Perform First Login Password Change - weak password fails
    const weakChangeRes = await fetch(`${BASE_URL}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${empAccessToken}`,
      },
      body: JSON.stringify({
        currentPassword: tempPasswordCaptured,
        newPassword: 'short',
        confirmPassword: 'short',
      }),
    });
    expect(weakChangeRes.status).toBe(422);

    // Valid strong new password
    const validNewPassword = 'VrmEmp#2026Secure!';
    const successfulChangeRes = await fetch(`${BASE_URL}/api/v1/auth/change-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${empAccessToken}`,
      },
      body: JSON.stringify({
        currentPassword: tempPasswordCaptured,
        newPassword: validNewPassword,
        confirmPassword: validNewPassword,
      }),
    });

    expect(successfulChangeRes.status).toBe(200);
    const changeData = await successfulChangeRes.json();
    expect(changeData.success).toBe(true);

    // 5. Old temporary password no longer works
    const oldPwAttempt = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmpCode, password: tempPasswordCaptured }),
    });
    expect(oldPwAttempt.status).toBe(401);

    // 6. New password logs in with mustChangePassword = false
    const newPwLogin = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmpCode, password: validNewPassword }),
    });
    expect(newPwLogin.status).toBe(200);
    const newPwData = await newPwLogin.json();
    expect(newPwData.data.user.mustChangePassword).toBe(false);
  });

  it('disables login access and prevents authenticated entry until re-enabled', async () => {
    // HR disables login for this employee
    const disableRes = await fetch(`${BASE_URL}/api/v1/employees/${testEmpCode}/login-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrAuthToken}`,
      },
      body: JSON.stringify({ status: 'DISABLED' }),
    });

    expect(disableRes.status).toBe(200);
    const disableData = await disableRes.json();
    expect(disableData.data.accountStatus).toBe('DISABLED');

    // Attempting login now yields 403 Forbidden
    const loginAttempt = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmpCode, password: 'VrmEmp#2026Secure!' }),
    });

    expect(loginAttempt.status).toBe(403);
    const attemptData = await loginAttempt.json();
    expect(attemptData.error.code).toBe('ACCOUNT_DISABLED');

    // Re-enable login
    const enableRes = await fetch(`${BASE_URL}/api/v1/employees/${testEmpCode}/login-status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${hrAuthToken}`,
      },
      body: JSON.stringify({ status: 'ACTIVE' }),
    });

    expect(enableRes.status).toBe(200);
    const enableData = await enableRes.json();
    expect(enableData.data.accountStatus).toBe('ACTIVE');

    // Login succeeds once again
    const restoredLogin = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: testEmpCode, password: 'VrmEmp#2026Secure!' }),
    });
    expect(restoredLogin.status).toBe(200);
  });

  it('maintains a comprehensive audit log trail with zero password leaks', async () => {
    const accountRes = await fetch(`${BASE_URL}/api/v1/employees/${testEmpCode}/login-account`, {
      headers: { Authorization: `Bearer ${hrAuthToken}` },
    });
    expect(accountRes.status).toBe(200);
    const accountData = await accountRes.json();
    const logs = accountData.data.auditLogs;

    expect(logs.length).toBeGreaterThanOrEqual(3);
    const actions = logs.map((l: any) => l.action);
    expect(actions).toContain('EMPLOYEE_LOGIN_CREATED');
    expect(actions).toContain('EMPLOYEE_LOGIN_DISABLED');
    expect(actions).toContain('EMPLOYEE_LOGIN_ENABLED');

    for (const log of logs) {
      const metaString = JSON.stringify(log.metadata || {});
      expect(metaString).not.toContain('VrmEmp#2026Secure!');
      expect(metaString).not.toContain('Vrm@');
      expect(metaString).not.toContain('passwordHash');
    }
  });
});
