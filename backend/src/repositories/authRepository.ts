import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getSupabaseAdmin, isRealSupabaseConfigured } from '../config/supabase.js';
import { env } from '../config/env.js';
import { AccountStatus, AuthenticatedUser, CredentialEmailStatus, UserRole } from '../types/auth.js';
import { generateTemporaryPassword, validatePasswordComplexity } from '../services/passwordService.js';
import { sendCredentialEmail } from '../services/emailService.js';
import { auditRepository } from './auditRepository.js';

export interface UserAccount {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  employeeId: string;
  department: string;
  designation: string;
  isActive: boolean;
  mustChangePassword: boolean;
  accountStatus: AccountStatus;
  credentialEmailStatus?: CredentialEmailStatus;
  credentialEmailSentAt?: string;
  lastLoginAt?: string;
}

// Initial seed accounts for testing and fallback
const defaultHashedPassword = bcrypt.hashSync('Password@123', 10);

const fallbackUsers: Map<string, UserAccount> = new Map([
  [
    'admin@businz.com',
    {
      id: 'usr-businz-admin',
      email: 'admin@businz.com',
      passwordHash: defaultHashedPassword,
      name: 'Businz Super Admin',
      role: 'Super Admin',
      employeeId: 'EMP-000',
      department: 'Management',
      designation: 'Super Administrator',
      isActive: true,
      mustChangePassword: false,
      accountStatus: 'ACTIVE',
      credentialEmailStatus: 'SENT',
      credentialEmailSentAt: '2026-01-01T09:00:00.000Z',
    },
  ],
]);

export class AuthRepository {
  /**
   * Dual identifier search: Finds account by either registered email OR Employee Code (e.g. EMP-005)
   */
  async findByIdentifier(identifier: string): Promise<UserAccount | null> {
    if (!identifier) return null;
    const clean = identifier.trim();
    const cleanLower = clean.toLowerCase();

    // 1. Direct Map lookup if email
    if (fallbackUsers.has(cleanLower)) {
      return fallbackUsers.get(cleanLower)!;
    }

    // 2. Iterate memory accounts for match on employeeId or email
    for (const user of fallbackUsers.values()) {
      if (
        user.email.toLowerCase() === cleanLower ||
        user.employeeId.toLowerCase() === cleanLower ||
        user.id.toLowerCase() === cleanLower
      ) {
        return user;
      }
    }

    // 3. Query Supabase database if configured
    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const query = supabase
          .from('employees')
          .select('id, auth_id, employee_id, first_name, last_name, email, department, designation, status, must_change_password, account_status, credential_email_status, credential_email_sent_at, last_login_at');

        let response;
        if (clean.includes('@')) {
          response = await query.eq('email', cleanLower).single();
        } else {
          response = await query.ilike('employee_id', clean).single();
        }

        const data = response.data;
        if (data && !response.error) {
          const designationLower = (data.designation || '').toLowerCase();
          const departmentLower = (data.department || '').toLowerCase();
          const userRole: UserRole = designationLower.includes('ceo') || designationLower.includes('director') || departmentLower === 'management'
            ? 'CEO'
            : designationLower.includes('hr') || departmentLower === 'hr' || departmentLower === 'human resources'
            ? 'HR Manager'
            : designationLower.includes('account') || designationLower.includes('finance') || departmentLower === 'accounts' || departmentLower === 'finance'
            ? 'Finance Manager'
            : 'Employee';

          const accountStatus: AccountStatus = (data.account_status as AccountStatus) || (data.status === 'Active' ? 'ACTIVE' : 'DISABLED');

          const userAccount: UserAccount = {
            id: data.auth_id || data.id,
            email: data.email,
            passwordHash: defaultHashedPassword,
            name: `${data.first_name || ''} ${data.last_name || ''}`.trim() || 'Businz Staff',
            role: userRole,
            employeeId: data.employee_id || 'EMP-001',
            department: data.department || 'General',
            designation: data.designation || 'Staff',
            isActive: accountStatus === 'ACTIVE',
            mustChangePassword: data.must_change_password !== undefined ? data.must_change_password : false,
            accountStatus,
            credentialEmailStatus: data.credential_email_status as CredentialEmailStatus || 'SENT',
            credentialEmailSentAt: data.credential_email_sent_at || undefined,
            lastLoginAt: data.last_login_at || undefined,
          };

          fallbackUsers.set(userAccount.email.toLowerCase(), userAccount);
          return userAccount;
        }
      } catch {
        // Fallback gracefully
      }
    }

    return null;
  }

  async findByEmail(email: string): Promise<UserAccount | null> {
    return this.findByIdentifier(email);
  }

  async findById(id: string): Promise<UserAccount | null> {
    return this.findByIdentifier(id);
  }

  /**
   * Creates a linked authentication account for a newly created employee record
   */
  async createLoginAccount(params: {
    employeeDbId: string;
    employeeCode: string;
    email: string;
    firstName: string;
    lastName: string;
    department?: string;
    designation?: string;
    role?: UserRole;
    temporaryPassword?: string;
  }): Promise<{ user: UserAccount; temporaryPassword: string }> {
    const temporaryPassword = params.temporaryPassword || generateTemporaryPassword();
    const passwordHash = await bcrypt.hash(temporaryPassword, 10);
    const authUserId = `usr-${Date.now().toString(16)}-${Math.random().toString(36).substring(2, 6)}`;

    const userRole: UserRole = params.role || 'Employee';

    const account: UserAccount = {
      id: authUserId,
      email: params.email.toLowerCase().trim(),
      passwordHash,
      name: `${params.firstName || ''} ${params.lastName || ''}`.trim() || 'Businz Employee',
      role: userRole,
      employeeId: params.employeeCode.trim(),
      department: params.department || 'General',
      designation: params.designation || 'Staff',
      isActive: true,
      mustChangePassword: true,
      accountStatus: 'ACTIVE',
      credentialEmailStatus: 'PENDING',
    };

    fallbackUsers.set(account.email, account);

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('employees')
          .update({
            must_change_password: true,
            account_status: 'ACTIVE',
            credential_email_status: 'PENDING',
          })
          .eq('id', params.employeeDbId);
      } catch (err) {
        console.warn('Could not sync auth metadata to Supabase:', err);
      }
    }

    return { user: account, temporaryPassword };
  }

  /**
   * Updates employee's credential email dispatch status
   */
  async updateEmailStatus(
    email: string,
    status: CredentialEmailStatus,
    sentAt: string
  ): Promise<void> {
    const user = await this.findByEmail(email);
    if (user) {
      user.credentialEmailStatus = status;
      user.credentialEmailSentAt = sentAt;
    }
  }

  /**
   * Forces employee password change, verifies current password, and invalidates temporary password
   */
  async changePassword(
    identifier: string,
    currentPassword: string,
    newPassword: string,
    performedBy?: string
  ): Promise<{ success: boolean; message?: string }> {
    const user = await this.findByIdentifier(identifier);
    if (!user) {
      return { success: false, message: 'User account not found' };
    }

    const isMatch = await this.verifyPassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return { success: false, message: 'Current password does not match' };
    }

    const validation = validatePasswordComplexity(newPassword);
    if (!validation.valid) {
      return { success: false, message: validation.message || 'Password does not meet complexity requirements' };
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.mustChangePassword = false;

    // Record audit log with NO passwords in metadata
    await auditRepository.recordLog(
      'PASSWORD_CHANGED',
      user.employeeId,
      performedBy || user.email,
      { email: user.email }
    );

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('employees')
          .update({
            must_change_password: false,
          })
          .eq('email', user.email);
      } catch (err) {
        console.warn('Could not update password status in Supabase:', err);
      }
    }

    return { success: true };
  }

  /**
   * Resets credentials for an employee, generating a new temporary password and dispatching an email
   */
  async resetLoginCredentials(
    employeeId: string,
    performedBy: string
  ): Promise<{ success: boolean; temporaryPassword?: string; emailStatus?: CredentialEmailStatus; message?: string }> {
    const user = await this.findByIdentifier(employeeId);
    if (!user) {
      return { success: false, message: `No login account found for Employee ${employeeId}` };
    }

    const newTempPassword = generateTemporaryPassword();
    user.passwordHash = await bcrypt.hash(newTempPassword, 10);
    user.mustChangePassword = true;

    // Record reset audit
    await auditRepository.recordLog(
      'TEMPORARY_LOGIN_RESET',
      user.employeeId,
      performedBy,
      { email: user.email }
    );

    // Dispatch credential notification email
    const emailResult = await sendCredentialEmail({
      to: user.email,
      employeeName: user.name,
      employeeCode: user.employeeId,
      temporaryPassword: newTempPassword,
    });

    user.credentialEmailStatus = emailResult.status;
    user.credentialEmailSentAt = emailResult.sentAt;

    await auditRepository.recordLog(
      'CREDENTIAL_EMAIL_RESENT',
      user.employeeId,
      performedBy,
      { email: user.email, deliveryStatus: emailResult.status }
    );

    return {
      success: true,
      temporaryPassword: newTempPassword,
      emailStatus: emailResult.status,
    };
  }

  /**
   * Sets a newly chosen password after successful OTP verification.
   * Clears mustChangePassword flag.
   */
  async updatePasswordDirectly(
    employeeId: string,
    newPasswordHash: string,
    performedBy: string
  ): Promise<boolean> {
    const user = await this.findByIdentifier(employeeId);
    if (!user) return false;

    user.passwordHash = newPasswordHash;
    user.mustChangePassword = false;

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('employees')
          .update({
            must_change_password: false,
          })
          .eq('employee_id', user.employeeId);
      } catch (err) {
        console.warn('Could not sync password status to Supabase:', err);
      }
    }

    await auditRepository.recordLog(
      'PASSWORD_RESET_SUCCESS',
      user.employeeId,
      performedBy,
      { email: user.email }
    );

    return true;
  }

  /**
   * Enables or disables employee login access
   */
  async updateAccountStatus(
    employeeId: string,
    status: AccountStatus,
    performedBy: string
  ): Promise<{ success: boolean; message?: string }> {
    const user = await this.findByIdentifier(employeeId);
    if (!user) {
      return { success: false, message: `No login account found for Employee ${employeeId}` };
    }

    user.accountStatus = status;
    user.isActive = status === 'ACTIVE';

    const action = status === 'ACTIVE' ? 'EMPLOYEE_LOGIN_ENABLED' : 'EMPLOYEE_LOGIN_DISABLED';
    await auditRepository.recordLog(action, user.employeeId, performedBy, {
      accountStatus: status,
      email: user.email,
    });

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('employees')
          .update({
            account_status: status,
            status: status === 'ACTIVE' ? 'Active' : 'Terminated',
          })
          .ilike('employee_id', user.employeeId);
      } catch (err) {
        console.warn('Could not sync account status to Supabase:', err);
      }
    }

    return { success: true };
  }

  /**
   * Records last login timestamp upon successful authentication
   */
  async recordLoginSuccess(user: UserAccount): Promise<void> {
    const timestamp = new Date().toISOString();
    user.lastLoginAt = timestamp;

    await auditRepository.recordLog('LOGIN_SUCCESS', user.employeeId, user.email, {
      lastLoginAt: timestamp,
    });

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('employees')
          .update({ last_login_at: timestamp })
          .ilike('employee_id', user.employeeId);
      } catch {
        // non-blocking
      }
    }
  }

  generateToken(user: UserAccount): string {
    const payload: AuthenticatedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      employeeId: user.employeeId,
      name: user.name,
      department: user.department,
      designation: user.designation,
      mustChangePassword: user.mustChangePassword,
      accountStatus: user.accountStatus,
      credentialEmailStatus: user.credentialEmailStatus,
      credentialEmailSentAt: user.credentialEmailSentAt,
      lastLoginAt: user.lastLoginAt,
    };
    return jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  }

  async verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;
    return bcrypt.compare(password, hash);
  }
}

export const authRepository = new AuthRepository();
