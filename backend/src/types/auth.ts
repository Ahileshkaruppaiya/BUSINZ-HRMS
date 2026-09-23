// VRM Enterprise HRMS - Authenticated Context Types

export type UserRole = 
  | 'Super Admin' 
  | 'CEO' 
  | 'Admin'
  | 'HR'
  | 'HR Manager' 
  | 'HR Admin' 
  | 'Department Manager' 
  | 'Department Head'
  | 'Manager'
  | 'Team Leader'
  | 'Employee' 
  | 'Finance Manager'
  | 'Management'
  | 'ERP Administrator'
  | string;

export type AccountStatus = 'ACTIVE' | 'LOCKED' | 'DISABLED';
export type CredentialEmailStatus = 'PENDING' | 'SENT' | 'FAILED';

export type AuthAuditAction = 
  | 'EMPLOYEE_LOGIN_CREATED'
  | 'CREDENTIAL_EMAIL_SENT'
  | 'CREDENTIAL_EMAIL_RESENT'
  | 'TEMPORARY_LOGIN_RESET'
  | 'EMPLOYEE_LOGIN_DISABLED'
  | 'EMPLOYEE_LOGIN_ENABLED'
  | 'PASSWORD_CHANGED'
  | 'LOGIN_SUCCESS'
  | 'LOGIN_FAILED'
  | 'FORGOT_PASSWORD_ATTEMPT'
  | 'FORGOT_PASSWORD_RATE_LIMITED'
  | 'FORGOT_PASSWORD_NO_EMAIL'
  | 'PASSWORD_RESET_OTP_SENT'
  | 'PASSWORD_RESET_OTP_FAILED'
  | 'PASSWORD_RESET_OTP_VERIFIED'
  | 'PASSWORD_RESET_SUCCESS';

export interface AuthAuditLog {
  id: string;
  action: AuthAuditAction;
  employee_id: string;
  performed_by: string;
  performed_at: string;
  metadata?: Record<string, any>;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  name?: string;
  department?: string;
  designation?: string;
  mustChangePassword?: boolean;
  accountStatus?: AccountStatus;
  credentialEmailStatus?: CredentialEmailStatus;
  credentialEmailSentAt?: string;
  lastLoginAt?: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

