// ============================================================================
// Businz Enterprise HRM — Production Master Initial Data Repository
// Master Super Admin (CEO) profile & system structural templates
// Transactional records initialized to empty arrays for real data entry
// ============================================================================

import {
  Employee,
  AttendanceRecord,
  FaceLog,
  AttendanceAuditLog,
  LeaveRequest,
  Shift,
  ShiftRequest,
  DepartmentItem,
  PayrollRecord,
  AssetItem,
  Expense,
  JobOpening,
  Candidate,
  NotificationItem,
  TaskItem,
  PerformanceScore
} from '../types/hrms';

// ----------------------------------------------------------------------------
// 1. EMPLOYEES ROSTER (Master Super Admin CEO Account)
// ----------------------------------------------------------------------------
export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'EMP-000',
    employeeId: 'EMP-000',
    firstName: 'Businz',
    lastName: 'Admin',
    email: 'admin@businz.com',
    phone: '+91 98765 43210',
    dob: '1985-01-01',
    gender: 'Male',
    address: 'Businz Towers, Tech Corridor, OMR, Chennai',
    department: 'Management',
    designation: 'Super Administrator',
    reportingManagerId: '',
    reportingManagerName: 'Board of Directors',
    joiningDate: '2020-01-01',
    employmentType: 'Full-Time',
    status: 'Active',
    avatar: '',
    basicSalary: 250000,
    allowances: { hra: 60000, transport: 15000, medical: 10000, special: 25000 },
    bankDetails: { bankName: 'HDFC Bank', accountNumber: '****1001', ifscCode: 'HDFC0001234', branch: 'Chennai HQ' },
    attendanceMethod: 'Exempt',
    gpsAllowed: false,
    faceRegistered: false,
    workShift: 'Shift 1 (09:00 AM - 06:00 PM)',
    documents: [],
    authUserId: 'usr-businz-admin',
    password: 'Password@123',
    mustChangePassword: false,
    accountStatus: 'ACTIVE',
    credentialEmailStatus: 'SENT',
    credentialEmailSentAt: '2026-01-01T09:00:00.000Z',
    lastLoginAt: '16 Sep 2026, 08:50 AM'
  }
];

// ----------------------------------------------------------------------------
// 2. SHIFTS & ASSIGNMENTS (Master Standard Company Shifts)
// ----------------------------------------------------------------------------
export const INITIAL_SHIFTS: Shift[] = [];

export const INITIAL_SHIFT_REQUESTS: ShiftRequest[] = [];

// ----------------------------------------------------------------------------
// 3. DEPARTMENTS (8 Standard Enterprise Departments)
// ----------------------------------------------------------------------------
export const INITIAL_DEPTS: DepartmentItem[] = [];

// ----------------------------------------------------------------------------
// 4. ATTENDANCE & BIOMETRIC LOGS (Clean Slate)
// ----------------------------------------------------------------------------
export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];
export const INITIAL_FACE_LOGS: FaceLog[] = [];
export const INITIAL_ATTENDANCE_AUDIT_LOGS: AttendanceAuditLog[] = [];

// ----------------------------------------------------------------------------
// 5. LEAVES & TIME OFF (Clean Slate)
// ----------------------------------------------------------------------------
export const INITIAL_LEAVES: LeaveRequest[] = [];

// ----------------------------------------------------------------------------
// 6. PAYROLL DISBURSEMENTS (Clean Slate)
// ----------------------------------------------------------------------------
export const INITIAL_PAYROLL: PayrollRecord[] = [];

// ----------------------------------------------------------------------------
// 7. ASSET MANAGEMENT (Clean Slate)
// ----------------------------------------------------------------------------
export const INITIAL_ASSETS: AssetItem[] = [];

// ----------------------------------------------------------------------------
// 8. EXPENSES & CLAIMS (Clean Slate)
// ----------------------------------------------------------------------------
export const INITIAL_EXPENSES: Expense[] = [];

// ----------------------------------------------------------------------------
// 9. RECRUITMENT — JOBS & CANDIDATES (Clean Slate)
// ----------------------------------------------------------------------------
export const INITIAL_JOBS: JobOpening[] = [];
export const INITIAL_CANDIDATES: Candidate[] = [];

// ----------------------------------------------------------------------------
// 10. SYSTEM NOTIFICATIONS (Clean Slate)
// ----------------------------------------------------------------------------
export const INITIAL_NOTIFICATIONS: NotificationItem[] = [];

// ----------------------------------------------------------------------------
// 11. TASKS & GOALS (Clean Slate)
// ----------------------------------------------------------------------------
export const INITIAL_TASKS: TaskItem[] = [];

// ----------------------------------------------------------------------------
// 12. PERFORMANCE EVALUATIONS (Clean Slate)
// ----------------------------------------------------------------------------
export const INITIAL_PERFORMANCE: PerformanceScore[] = [];
