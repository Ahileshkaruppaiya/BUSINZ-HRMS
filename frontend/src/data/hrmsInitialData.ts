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
// 1. EMPLOYEES ROSTER (Clean Workforce Directory - Master Super Admin excluded)
// ----------------------------------------------------------------------------
export const isSystemAdmin = (emp?: { employeeId?: string; email?: string; designation?: string; role?: string } | null): boolean => {
  if (!emp) return false;
  return (
    emp.employeeId === 'EMP-000' ||
    emp.email?.toLowerCase() === 'admin@businz.com' ||
    emp.designation === 'Super Administrator'
  );
};

export const INITIAL_EMPLOYEES: Employee[] = [];

// ----------------------------------------------------------------------------
// 2. SHIFTS & ASSIGNMENTS (Master Standard Company Shifts)
// ----------------------------------------------------------------------------
export const INITIAL_SHIFTS: Shift[] = [];

export const INITIAL_SHIFT_REQUESTS: ShiftRequest[] = [];

// ----------------------------------------------------------------------------
// 3. DEPARTMENTS (8 Standard Enterprise Departments)
// ----------------------------------------------------------------------------
export const INITIAL_DEPTS: DepartmentItem[] = [
  { id: 'dept-ceo', name: 'CEO', code: 'CEO', headName: 'Chief Executive Officer', headId: '', employeeCount: 0, budget: 0 },
  { id: 'dept-hr', name: 'HR', code: 'HR', headName: 'HR Manager', headId: '', employeeCount: 0, budget: 0 },
  { id: 'dept-accounts', name: 'Accounts', code: 'ACCT', headName: 'Accounts Manager', headId: '', employeeCount: 0, budget: 0 },
  { id: 'dept-ops', name: 'Operations', code: 'OPS', headName: 'Operations Lead', headId: '', employeeCount: 0, budget: 0 },
  { id: 'dept-sales', name: 'Sales & Marketing', code: 'SALES', headName: 'Sales Head', headId: '', employeeCount: 0, budget: 0 },
  { id: 'dept-it', name: 'IT & Engineering', code: 'IT', headName: 'Tech Lead', headId: '', employeeCount: 0, budget: 0 }
];

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
