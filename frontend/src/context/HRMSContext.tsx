import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import {
  Role,
  ModuleName,
  PermissionAction,
  PermissionMatrix,
  User,
  Employee,
  AttendanceRecord,
  AttendanceAuditLog,
  FaceLog,
  LeaveRequest,
  Shift,
  ShiftRequest,
  TaskItem,
  PerformanceScore,
  JobOpening,
  Candidate,
  Expense,
  NotificationItem,
  PayrollRecord,
  DepartmentItem,
  BranchItem,
  DesignationItem,
  ApprovalWorkflowFormat,
  WorkflowConfig,
  GeofenceConfig,
  AssetItem,
  TaskItemEnhanced,
  TaskAssignee,
  TaskAssigneeStatus,
  TaskDailyReport,
  TaskCompletionEvidence,
  TaskAttachment,
  TaskLinkItem,
  TaskMasterItem,
  MOMMeeting,
  TaskEscalationRule,
  TaskPerformanceWeights,
  TaskAuditLog,
  TaskTimelineEvent,
  computeTaskOverallStatusAndProgress,
  calculateEmployeeTaskMetrics,
  SettingsSubTab,
  LeavePolicyItem,
  HolidayItem,
  AttendancePolicyItem,
  WeeklyScheduleItem,
  PolicyDocumentItem,
  GlobalAttendanceConfig,
  BusinessProfileSettings,
  GradeItem,
  EmploymentTypeItem,
  EmployeeCategoryItem,
  CustomFieldItem,
  DocumentTypeItem,
  EmployeeConfigSettings,
  ApprovalWorkflowItem,
  NotificationTriggerConfig,
  GeneralSystemConfig,
  IntegrationsConfig,
  LoanRecord,
  LoanRepaymentInstallment,
  LoanManualRepayment,
  LoanAuditLogEntry,
  LoanRequestStatus,
  AdvanceSalaryRequest,
  SandwichLeavePolicy,
  SandwichAuditLog,
  SandwichCalculationResult,
  SandwichCondition,
  SandwichPayType,
  HROverrideDetails,
  SandwichCalculationDayDetail
} from '../types/hrms';
import { initialSandwichPolicies, initialSandwichAuditLogs } from '../data/sandwichPolicyInitialData';
import { calculateSandwichLeave } from '../services/sandwichLeaveEngine';
import {
  FieldAssignment,
  FieldTripSession,
  LocationPoint,
  TrackingAlert,
  TodayFieldEmployeeItem,
  TrackingOverviewMetrics
} from '../types/tracking';
import {
  INITIAL_FIELD_ASSIGNMENTS,
  INITIAL_TRIP_SESSIONS,
  INITIAL_TRACKING_ALERTS
} from '../services/trackingMockData';
import {
  calculateHaversineMeters,
  calculateSequentialRouteKm,
  metersToKm,
  isTrackingScheduleActive,
  isValidMovementPoint
} from '../services/trackingEngine';
import {
  CompanyInfo,
  CompanyBranch,
  OrganizationStructure,
  AttendancePolicy,
  AttendanceCorrectionRequest,
  MasterLeavePolicy,
  PayrollSettingsConfig,
  RewardPolicy,
  EmployeeRewardRecord,
  PolicyAuditLog,
  LoanPolicy
} from '../types/settings';
import {
  INITIAL_COMPANY_INFO,
  INITIAL_COMPANY_BRANCHES,
  INITIAL_ORG_STRUCTURE,
  DEFAULT_MASTER_ATTENDANCE_POLICIES,
  INITIAL_ATTENDANCE_CORRECTIONS,
  DEFAULT_MASTER_LEAVE_POLICIES,
  INITIAL_PAYROLL_CONFIG,
  INITIAL_REWARD_POLICIES,
  INITIAL_EMPLOYEE_REWARDS,
  INITIAL_POLICY_AUDIT_LOGS
} from '../data/settingsInitialData';
import { DEFAULT_LOAN_POLICIES, INITIAL_LOAN_RECORDS } from '../data/loanInitialData';
import { calculateEmployeePayroll } from '../services/policyEngine';
import { payrollApi } from '../services/payrollApi';
import { API_BASE_URL } from '../config/api';
import { supabaseDirect } from '../services/supabaseDirectService';
import {
  INITIAL_ENHANCED_TASKS,
  INITIAL_MOM_MEETINGS,
  INITIAL_TASK_MASTERS,
  INITIAL_ESCALATION_RULES,
  INITIAL_TASK_WEIGHTS
} from './taskInitialData';
import { toNum, formatCurrency } from '../utils/numbers';
import { generateNextEmployeeId } from '../utils/employeeIdUtils';
import {
  MissedPunchRequest,
  OvertimeRequest,
  DepartmentOtPolicy,
  EmployeeOtPolicy,
  AttendanceGlobalSettings,
  OvertimePolicy,
  AttendancePolicyConfig,
  ShiftModel
} from '../types/attendanceEnterprise';
import {
  INITIAL_MISSED_PUNCH_REQUESTS,
  INITIAL_OVERTIME_REQUESTS,
  INITIAL_DEPARTMENT_OT_POLICIES,
  INITIAL_EMPLOYEE_OT_POLICIES,
  INITIAL_ATTENDANCE_GLOBAL_SETTINGS,
  INITIAL_OVERTIME_POLICY,
  INITIAL_ATTENDANCE_POLICY_CONFIG
} from '../data/attendanceEnterpriseInitialData';
import {
  isSystemAdmin,
  INITIAL_EMPLOYEES,
  INITIAL_ATTENDANCE,
  INITIAL_FACE_LOGS,
  INITIAL_ATTENDANCE_AUDIT_LOGS,
  INITIAL_LEAVES,
  INITIAL_SHIFTS,
  INITIAL_SHIFT_REQUESTS,
  INITIAL_DEPTS,
  INITIAL_PAYROLL,
  INITIAL_ASSETS,
  INITIAL_EXPENSES,
  INITIAL_JOBS,
  INITIAL_CANDIDATES,
  INITIAL_NOTIFICATIONS,
  INITIAL_TASKS,
  INITIAL_PERFORMANCE
} from '../data/hrmsMockData';
export { INITIAL_ATTENDANCE_AUDIT_LOGS };
import {
  calculateAttendanceHoursAndStatus,
  resolveEmployeeOtEligibility,
  calculateOtSalaryAmount,
  calculateAttendanceSalaryImpact,
  aggregateMonthlyAttendanceSummary
} from '../services/attendanceCalculationEngine';
import {
  evaluateShiftAttendance,
  ShiftWindowEvaluation
} from '../services/shiftAttendanceEngine';
import { SAMPLE_TRAVEL_RECEIPT, SAMPLE_EQUIPMENT_RECEIPT } from '../utils/sampleReceipts';

export const calculateDistanceMeters = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
};

const INITIAL_GEOFENCE_CONFIG: GeofenceConfig = {
  enabled: false,
  officeName: '',
  centerLat: 0,
  centerLng: 0,
  radiusMeters: 50000,
  enforceStrictly: false
};

// Default RBAC Permission Matrix for remaining 5 roles
const DEFAULT_PERMISSIONS: PermissionMatrix = {
  'Super Admin': {
    dashboard: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    employees: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    face_attendance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    attendance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    gps_geofence: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    leaves: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    shifts: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    performance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    tasks: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    recruitment: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    finance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    notifications: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    payroll: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    advance_salary: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    reports: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    organization: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    assets: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    settings: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  },
  'CEO': {
    dashboard: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    employees: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    face_attendance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    attendance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    gps_geofence: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    leaves: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    shifts: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    performance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    tasks: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    recruitment: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    finance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    notifications: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    payroll: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    advance_salary: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    reports: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    organization: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    assets: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    settings: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  },
  'HR Manager': {
    dashboard: ['view', 'export'],
    employees: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    face_attendance: ['view', 'create', 'edit', 'export'],
    attendance: ['view', 'create', 'edit', 'approve', 'export'],
    gps_geofence: ['view', 'create', 'edit', 'approve', 'export'],
    leaves: ['view', 'create', 'edit', 'approve', 'export'],
    shifts: ['view', 'create', 'edit', 'approve', 'export'],
    performance: ['view', 'create', 'edit', 'approve', 'export'],
    tasks: ['view', 'create', 'edit', 'export'],
    recruitment: ['view', 'create', 'edit', 'approve', 'export'],
    finance: ['view', 'create', 'edit', 'approve', 'export'],
    notifications: ['view', 'create'],
    payroll: ['view', 'create', 'edit', 'approve', 'export'],
    advance_salary: ['view', 'create', 'edit', 'approve', 'export'],
    reports: ['view', 'export'],
    organization: ['view', 'edit'],
    assets: ['view', 'create', 'edit', 'export'],
    settings: ['view'],
  },
  'HR Admin': {
    dashboard: ['view', 'export'],
    employees: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    face_attendance: ['view', 'create', 'edit', 'export'],
    attendance: ['view', 'create', 'edit', 'approve', 'export'],
    gps_geofence: ['view', 'create', 'edit', 'approve', 'export'],
    leaves: ['view', 'create', 'edit', 'approve', 'export'],
    shifts: ['view', 'create', 'edit', 'approve', 'export'],
    performance: ['view', 'create', 'edit', 'export'],
    tasks: ['view', 'create', 'edit'],
    recruitment: ['view', 'create', 'edit', 'approve'],
    finance: ['view', 'create', 'edit', 'approve', 'export'],
    notifications: ['view', 'create'],
    payroll: ['view', 'create', 'edit', 'approve', 'export'],
    advance_salary: ['view', 'create', 'edit', 'approve', 'export'],
    reports: ['view', 'export'],
    organization: ['view', 'create', 'edit', 'export'],
    assets: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    settings: ['view', 'edit'],
  },
  'Department Manager': {
    dashboard: ['view'],
    employees: ['view'],
    face_attendance: ['view'],
    attendance: ['view', 'approve'],
    gps_geofence: [],
    leaves: ['view', 'approve'],
    shifts: ['view', 'approve'],
    performance: ['view', 'edit'],
    tasks: ['view', 'create', 'edit', 'delete'],
    recruitment: ['view'],
    finance: ['view', 'approve'],
    notifications: ['view'],
    payroll: [],
    advance_salary: ['view', 'create'],
    reports: ['view'],
    organization: ['view'],
    assets: ['view'],
    settings: ['view'],
  },
  'Employee': {
    dashboard: ['view'],
    employees: [],
    face_attendance: ['view', 'create'],
    attendance: [],
    gps_geofence: [],
    leaves: ['view', 'create'],
    shifts: ['view', 'create'],
    performance: ['view'],
    tasks: ['view', 'edit'],
    recruitment: ['view', 'create'], // Referral
    finance: ['view', 'create'],
    notifications: ['view'],
    payroll: ['view'], // Payslip only
    advance_salary: ['view', 'create'],
    reports: [],
    organization: ['view'],
    assets: ['view'],
    settings: ['view'],
  },
  'Finance Manager': {
    dashboard: ['view'],
    employees: ['view'],
    face_attendance: ['view'],
    attendance: ['view'],
    gps_geofence: [],
    leaves: ['view'],
    shifts: ['view'],
    performance: ['view'],
    tasks: ['view'],
    recruitment: [],
    finance: ['view', 'create', 'export'],
    notifications: ['view', 'create'],
    payroll: ['view', 'export'],
    advance_salary: ['view', 'export'],
    reports: ['view', 'export'],
    organization: ['view'],
    assets: ['view', 'export'],
    settings: ['view'],
  },
  'Task Creator': {
    dashboard: ['view'],
    employees: ['view'],
    face_attendance: ['view'],
    attendance: ['view'],
    gps_geofence: [],
    leaves: ['view'],
    shifts: ['view'],
    performance: ['view'],
    tasks: ['view', 'create', 'edit', 'export'],
    recruitment: ['view'],
    finance: ['view'],
    notifications: ['view'],
    payroll: [],
    advance_salary: ['view'],
    reports: ['view'],
    organization: ['view'],
    assets: ['view'],
    settings: ['view'],
  },
  'Assignee': {
    dashboard: ['view'],
    employees: [],
    face_attendance: ['view', 'create'],
    attendance: ['view'],
    gps_geofence: [],
    leaves: ['view', 'create'],
    shifts: ['view'],
    performance: ['view'],
    tasks: ['view', 'edit'],
    recruitment: ['view'],
    finance: ['view'],
    notifications: ['view'],
    payroll: ['view'],
    advance_salary: ['view', 'create'],
    reports: [],
    organization: ['view'],
    assets: ['view'],
    settings: ['view'],
  },
  'Responsible Person': {
    dashboard: ['view'],
    employees: ['view'],
    face_attendance: ['view'],
    attendance: ['view'],
    gps_geofence: [],
    leaves: ['view'],
    shifts: ['view'],
    performance: ['view'],
    tasks: ['view', 'create', 'edit', 'approve', 'export'],
    recruitment: ['view'],
    finance: ['view'],
    notifications: ['view'],
    payroll: [],
    advance_salary: ['view'],
    reports: ['view'],
    organization: ['view'],
    assets: ['view'],
    settings: ['view'],
  },
  'Department Head': {
    dashboard: ['view', 'export'],
    employees: ['view'],
    face_attendance: ['view'],
    attendance: ['view', 'approve'],
    gps_geofence: [],
    leaves: ['view', 'approve'],
    shifts: ['view', 'approve'],
    performance: ['view', 'edit', 'export'],
    tasks: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    recruitment: ['view'],
    finance: ['view', 'approve'],
    notifications: ['view', 'create'],
    payroll: ['view'],
    advance_salary: ['view', 'approve'],
    reports: ['view', 'export'],
    organization: ['view'],
    assets: ['view'],
    settings: ['view'],
  },
  'Manager': {
    dashboard: ['view'],
    employees: ['view'],
    face_attendance: ['view'],
    attendance: ['view', 'approve'],
    gps_geofence: [],
    leaves: ['view', 'approve'],
    shifts: ['view', 'approve'],
    performance: ['view', 'edit'],
    tasks: ['view', 'create', 'edit', 'approve', 'export'],
    recruitment: ['view'],
    finance: ['view', 'approve'],
    notifications: ['view'],
    payroll: [],
    advance_salary: ['view', 'approve'],
    reports: ['view'],
    organization: ['view'],
    assets: ['view'],
    settings: [],
  },
  'Management': {
    dashboard: ['view', 'export'],
    employees: ['view', 'export'],
    face_attendance: ['view'],
    attendance: ['view', 'export'],
    gps_geofence: ['view'],
    leaves: ['view', 'export'],
    shifts: ['view'],
    performance: ['view', 'export'],
    tasks: ['view', 'export'],
    recruitment: ['view', 'export'],
    finance: ['view', 'export'],
    notifications: ['view'],
    payroll: ['view', 'export'],
    advance_salary: ['view', 'approve', 'export'],
    reports: ['view', 'export'],
    organization: ['view', 'export'],
    assets: ['view', 'export'],
    settings: ['view'],
  },
  'ERP Administrator': {
    dashboard: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    employees: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    face_attendance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    attendance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    gps_geofence: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    leaves: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    shifts: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    performance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    tasks: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    recruitment: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    finance: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    notifications: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    payroll: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    advance_salary: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    reports: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    organization: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    assets: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
    settings: ['view', 'create', 'edit', 'delete', 'approve', 'export'],
  }
};

// Initial Mock Data Sets imported from ../data/hrmsMockData

const INITIAL_LEAVE_POLICIES: LeavePolicyItem[] = [];

const INITIAL_HOLIDAYS: HolidayItem[] = [];

const INITIAL_ATTENDANCE_POLICIES: AttendancePolicyItem[] = [];

const INITIAL_WEEKLY_SCHEDULES: WeeklyScheduleItem[] = [
  { id: 'wp1', name: '6-Day Site & Production Schedule (Mon - Sat)', workingDays: 'Mon, Tue, Wed, Thu, Fri, Sat', offDays: 'Sunday', isDefault: true },
  { id: 'wp2', name: '5-Day Corporate Office Schedule (Mon - Fri)', workingDays: 'Mon, Tue, Wed, Thu, Fri', offDays: 'Saturday, Sunday', isDefault: false },
  { id: 'wp3', name: 'Alternate Saturday Off Schedule (1st & 3rd Working)', workingDays: 'Mon - Fri + 1st/3rd Sat', offDays: 'Sunday + 2nd/4th Sat', isDefault: false },
  { id: 'wp4', name: 'Continuous 24/7 Shift Rotation', workingDays: 'Rotational 6 Days', offDays: 'Rolling 1 Day', isDefault: false }
];

const INITIAL_GLOBAL_ATTENDANCE_CONFIG: GlobalAttendanceConfig = {
  trackInOutTime: true,
  noAttendanceWithoutPunchOut: true,
  allowMultiplePunches: false,
  lateGraceMinutes: 15,
  maxLateEntriesPerMonth: 3,
  latePenaltyDeduction: '0.5 Day Leave after 3 Late Marks',
  trackEarlyOut: true,
  earlyOutGraceMinutes: 15,
  trackBreaks: true,
  maxBreakMinutes: 60,
  autoPunchOutAfterHours: 12,
  enableAutoApproval: true,
  autoApproveDays: 3,
  enableOvertime: true,
  normalOtMultiplier: 1.5,
  holidayOtMultiplier: 2.0,
  minOtTriggerMinutes: 30,
  maxOtHoursPerMonth: 50,
  requireOtPreApproval: true,
  autoCreditOtToPayroll: true,
  compOffMinHoursHalfDay: 4,
  compOffMinHoursFullDay: 8,
  compOffValidityDays: 60,
  compOffMaxAccrualPerMonth: 3,
  compOffRequireManagerApproval: true,
  compOffAllowEncashment: false
};

const INITIAL_POLICY_DOCUMENTS: PolicyDocumentItem[] = [];

const INITIAL_BUSINESS_SETTINGS: BusinessProfileSettings = {
  logoUrl: '/logo.png',
  logoStatus: 'Added',
  businessName: 'Businz',
  businessCode: 'BSZ001',
  email: 'contact@businz.com',
  phone: '+91 44 2553 7890',
  type: 'Private Limited Company',
  address: 'Businz Towers, Tech Corridor, OMR, Chennai, Tamil Nadu, 600096, India',
  gstin: '33AABCB1234F1Z8',
  pan: 'AABCB1234F',
  cin: 'U72900TN2022PTC150000',
  employeeCodeGeneration: 'Manual',
  employeeCodePrefix: 'EMP',
  employeeCodeSample: 'EMP-001',
  administrator: 'Velmurugan (Super Admin)',
  currency: 'INR - ₹ (India)',
  currencySymbol: '₹',
  currencyCode: 'INR',
  timeZone: 'Indian Standard Time (IST) (UTC+05:30)',
  category: 'Civil Infrastructure & Pre-Engineered Buildings',
  bankName: 'HDFC Bank Limited',
  bankAccountNo: '50200084729104',
  bankIfsc: 'HDFC0001234',
  bankBranch: 'Madhavaram Branch, Chennai',
  emailConfig: 'Not Configured',
  smtpHost: '',
  smtpPort: '',
  smtpUser: '',
  activeEntity: 'Businz HQ'
};



const INITIAL_BRANCHES: BranchItem[] = [];

const INITIAL_DESIGNATIONS: DesignationItem[] = [];

export const INITIAL_GRADES: GradeItem[] = [];

export const INITIAL_EMPLOYMENT_TYPES: EmploymentTypeItem[] = [];

export const INITIAL_EMPLOYEE_CATEGORIES: EmployeeCategoryItem[] = [];

export const INITIAL_EMPLOYEE_CONFIG: EmployeeConfigSettings = {
  idFormatPrefix: 'EMP',
  idFormatDigits: 3,
  idStartingNumber: 1,
  autoGenerateId: true,
  defaultProbationMonths: 6,
  defaultNoticeDays: 30,
  autoConfirmProbation: false,
  customFields: [
    { id: 'cf1', label: 'Blood Group', fieldName: 'bloodGroup', fieldType: 'select', category: 'Personal', required: false, options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
    { id: 'cf2', label: 'Emergency Contact Person', fieldName: 'emergencyContactPerson', fieldType: 'text', category: 'Personal', required: true },
    { id: 'cf3', label: 'Safety Induction Date', fieldName: 'safetyInductionDate', fieldType: 'date', category: 'Job', required: false },
    { id: 'cf4', label: 'EPF UAN Number', fieldName: 'uanNumber', fieldType: 'text', category: 'Compliance', required: false },
    { id: 'cf5', label: 'Bank IFSC Code', fieldName: 'bankIfsc', fieldType: 'text', category: 'Payroll', required: true }
  ],
  documentTypes: [
    { id: 'dt1', name: 'Updated Resume / CV', code: 'RESUME', mandatory: true, maxSizeMb: 5, allowedFormats: ['PDF', 'DOCX'] },
    { id: 'dt2', name: 'Aadhaar / National ID Card', code: 'GOVT_ID', mandatory: true, maxSizeMb: 5, allowedFormats: ['PDF', 'JPG', 'PNG'] },
    { id: 'dt3', name: 'Income Tax PAN Card', code: 'PAN_CARD', mandatory: true, maxSizeMb: 5, allowedFormats: ['PDF', 'JPG', 'PNG'] },
    { id: 'dt4', name: 'Highest Degree / Marksheet', code: 'DEGREE', mandatory: true, maxSizeMb: 10, allowedFormats: ['PDF'] },
    { id: 'dt5', name: 'Previous Relieving / Experience Certificate', code: 'RELIEVING', mandatory: false, maxSizeMb: 5, allowedFormats: ['PDF'] }
  ]
};

export const INITIAL_APPROVAL_WORKFLOWS: ApprovalWorkflowItem[] = [
  {
    id: 'wf-leave',
    workflowName: 'Leave Approval Workflow',
    module: 'Leave',
    description: 'Reporting Manager review followed by HR verification and automated leave quota debit',
    levels: [
      { level: 1, role: 'Reporting Manager', title: 'Manager Recommendation', timeLimitHours: 24 },
      { level: 2, role: 'HR Admin', title: 'HR Policy Validation', timeLimitHours: 48 }
    ],
    active: true
  },
  {
    id: 'wf-reg',
    workflowName: 'Attendance Regularization',
    module: 'Attendance',
    description: 'Biometric missing punch and geofence override verification',
    levels: [
      { level: 1, role: 'Reporting Manager', title: 'Shift Supervisor Approval', timeLimitHours: 24 },
      { level: 2, role: 'HR Admin', title: 'Attendance Record Update', timeLimitHours: 48 }
    ],
    active: true
  },
  {
    id: 'wf-adv',
    workflowName: 'Advance Salary & Emergency Loan',
    module: 'Advance Salary',
    description: 'Two-tier verification: HR eligibility check followed by CEO disbursement authorization',
    levels: [
      { level: 1, role: 'HR Admin', title: 'Tenure & Basic Salary Eligibility Check', timeLimitHours: 24 },
      { level: 2, role: 'CEO / Super Admin', title: 'Financial Sanction & Payout Release', timeLimitHours: 48 }
    ],
    active: true
  },
  {
    id: 'wf-tada',
    workflowName: 'Travel & TA/DA Claim Workflow',
    module: 'TA/DA',
    description: 'Site project engineer outstation travel approval and accounts reimbursement',
    levels: [
      { level: 1, role: 'Project Manager', title: 'Trip Validation & Kilometers Check', timeLimitHours: 24 },
      { level: 2, role: 'Finance Manager', title: 'Accounts Audit & Disbursement', timeLimitHours: 48 }
    ],
    active: true
  },
  {
    id: 'wf-exp',
    workflowName: 'General Expense Reimbursement',
    module: 'Expense',
    description: 'Corporate and plant operational expense claims with tax invoice verification',
    levels: [
      { level: 1, role: 'Department Head', title: 'Department Budget Authorization', timeLimitHours: 24 },
      { level: 2, role: 'Finance Manager', title: 'Voucher Passed & Settlement', timeLimitHours: 48 }
    ],
    active: true
  },
  {
    id: 'wf-rec',
    workflowName: 'Job Requisition & Offer Approval',
    module: 'Recruitment',
    description: 'New hiring headcount sign-off and candidate offer compensation clearance',
    levels: [
      { level: 1, role: 'HR Manager', title: 'Candidate Profile & Compensation Fit', timeLimitHours: 48 },
      { level: 2, role: 'Super Admin', title: 'Executive Offer Sanction', timeLimitHours: 48 }
    ],
    active: true
  },
  {
    id: 'wf-ast',
    workflowName: 'Asset Allocation & Handover',
    module: 'Asset',
    description: 'IT and safety equipment issuance and return clearance',
    levels: [
      { level: 1, role: 'Store Keeper / IT Admin', title: 'Serial Number Verification', timeLimitHours: 12 },
      { level: 2, role: 'Department Manager', title: 'Allocation Acknowledgment', timeLimitHours: 24 }
    ],
    active: true
  }
];

export const INITIAL_NOTIFICATION_TRIGGERS: NotificationTriggerConfig[] = [
  { id: 'nt1', event: 'Employee Onboarded', module: 'Employee', email: true, sms: false, whatsapp: true, push: true, template: 'Welcome {{name}} to Businz! Your employee ID is {{employee_id}}.' },
  { id: 'nt2', event: 'Leave Application Submitted', module: 'Leave', email: true, sms: false, whatsapp: true, push: true, template: '{{name}} applied for {{days}} days of {{leave_type}}.' },
  { id: 'nt3', event: 'Leave Status Updated', module: 'Leave', email: true, sms: true, whatsapp: true, push: true, template: 'Your leave application for {{date}} has been {{status}}.' },
  { id: 'nt4', event: 'Late Attendance Recorded', module: 'Attendance', email: false, sms: false, whatsapp: true, push: true, template: 'Late punch recorded at {{time}} (Grace exceeded by {{minutes}}m).' },
  { id: 'nt5', event: 'Advance Salary Approved', module: 'Finance', email: true, sms: true, whatsapp: true, push: true, template: 'Your advance salary request of ₹{{amount}} has been approved by {{approver}}.' },
  { id: 'nt6', event: 'Monthly Payslip Disbursed', module: 'Payroll', email: true, sms: true, whatsapp: true, push: true, template: 'Your payslip for {{month}} {{year}} is ready for download.' },
  { id: 'nt7', event: 'Asset Assigned', module: 'Asset', email: true, sms: false, whatsapp: false, push: true, template: 'Asset {{asset_name}} (Tag: {{asset_tag}}) has been assigned to you.' }
];

export const INITIAL_GENERAL_SYSTEM_CONFIG: GeneralSystemConfig = {
  language: 'English (US / IN)',
  theme: 'Notion Slate Clean Light',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: '12 Hours (AM/PM)',
  currency: 'Indian Rupee (INR)',
  currencySymbol: '₹',
  tablePagination: 10,
  auditLogsEnabled: true
};

export const INITIAL_INTEGRATIONS_CONFIG: IntegrationsConfig = {
  biometricDevice: {
    enabled: false,
    provider: 'eSSL & ZKTeco Biometric SDK',
    ipAddress: '',
    port: 0,
    syncIntervalMins: 15,
    status: 'Disconnected'
  },
  mapsApi: {
    enabled: false,
    provider: 'Google Maps Telemetry API',
    apiKey: ''
  },
  emailSmtp: {
    enabled: false,
    host: '',
    port: 0,
    user: '',
    secure: true
  },
  smsGateway: {
    enabled: false,
    provider: 'Twilio SMS Cloud',
    senderId: '',
    apiKey: ''
  },
  whatsappApi: {
    enabled: false,
    provider: 'Meta WhatsApp Cloud Business API',
    phoneNumberId: '',
    apiKey: ''
  },
  accountingSoftware: {
    enabled: false,
    software: 'Tally Prime XML Sync & Zoho Books',
    syncFormat: 'Tally XML / Zoho JSON',
    autoExportMonthly: false
  },
  webhooks: {
    enabled: false,
    endpointUrl: '',
    secretKey: '',
    subscribedEvents: ['employee.created', 'attendance.punched', 'leave.approved', 'payroll.processed']
  }
};

interface HRMSContextType {
  currentUser: User;
  updateCurrentUser: (updates: Partial<User>) => void;
  switchRole: (role: Role) => void;
  hasPermission: (module: ModuleName, action: PermissionAction) => boolean;
  permissionMatrix: PermissionMatrix;
  updatePermission: (role: Role, module: ModuleName, action: PermissionAction, enabled: boolean) => void;

  employees: Employee[];
  addEmployee: (emp: Omit<Employee, 'id'>) => void;
  updateEmployee: (id: string, empData: Partial<Employee>) => void;
  deleteEmployee: (id: string) => Promise<{ success: boolean; message?: string }> | any;
  deleteMultipleEmployees: (ids: string[]) => Promise<{ success: boolean; deletedCount: number; message?: string }>;
  refreshEmployees: () => Promise<void>;
  refreshSettings: () => Promise<void>;
  syncAllWithCloud: () => Promise<void>;
  resetEmployeeLogin: (employeeId: string) => { success: boolean; message: string; temporaryPassword?: string };
  updateEmployeeLoginStatus: (employeeId: string, status: 'ACTIVE' | 'DISABLED') => { success: boolean; message: string };
  changeEmployeePassword: (identifier: string, newPassword: string) => { success: boolean; message: string };

  attendanceRecords: AttendanceRecord[];
  markAttendance: (empId: string, status: AttendanceRecord['status'], method: AttendanceRecord['method'], location?: AttendanceRecord['location']) => void;
  attendanceAuditLogs: AttendanceAuditLog[];
  correctAttendanceRecord: (params: {
    attendanceId: string;
    status: AttendanceRecord['status'];
    checkIn?: string | null;
    checkOut?: string | null;
    breakDurationMinutes?: number;
    halfDayType?: 'First Half' | 'Second Half';
    absentReason?: 'Unauthorized Absence' | 'No Show' | 'Attendance Not Recorded' | 'Other';
    leaveType?: string;
    leaveDuration?: 'Full Day' | 'First Half' | 'Second Half';
    wfhReason?: string;
    wfhSource?: 'Approved WFH Request' | 'HR Assigned' | 'Manual';
    otHours?: number;
    approvedOtHours?: number;
    otStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
    otReason?: string;
    reason: string;
    changedBy: string;
  }) => { success: boolean; message: string };
  addManualAttendanceRecord: (entry: {
    employeeId: string;
    date: string;
    status: AttendanceRecord['status'];
    checkIn?: string | null;
    checkOut?: string | null;
    breakDurationMinutes?: number;
    workingHours?: number;
    halfDayType?: 'First Half' | 'Second Half';
    otHours?: number;
    reason: string;
    addedBy: string;
  }) => { success: boolean; message: string };

  // Enterprise Attendance & Overtime Module
  missedPunchRequests: MissedPunchRequest[];
  submitMissedPunchRequest: (req: Omit<MissedPunchRequest, 'id' | 'status' | 'submittedAt'>) => { success: boolean; message: string };
  approveMissedPunchRequest: (id: string, reviewedBy: string, remarks?: string) => void;
  rejectMissedPunchRequest: (id: string, reviewedBy: string, remarks?: string) => void;
  editAndApproveMissedPunchRequest: (id: string, adjustedCheckIn: string, adjustedCheckOut: string, reviewedBy: string, remarks?: string) => void;

  overtimeRequests: OvertimeRequest[];
  submitOtRequest: (req: Omit<OvertimeRequest, 'id' | 'status' | 'approvedOtHours' | 'submittedAt'>) => { success: boolean; message: string };
  approveOtRequest: (id: string, approvedHours: number, reviewedBy: string, remarks?: string, multiplier?: OvertimeRequest['multiplier']) => void;
  rejectOtRequest: (id: string, reviewedBy: string, remarks?: string) => void;
  editAndApproveOtRequest: (id: string, approvedHours: number, reviewedBy: string, remarks?: string, multiplier?: OvertimeRequest['multiplier']) => void;
  deleteOtRequest: (id: string) => void;
  addManualOtEntry: (entry: { employeeId: string; date: string; hours: number; hourlyRate: number; multiplier: OvertimeRequest['multiplier']; reason: string; addedBy: string }) => { success: boolean; message: string };

  departmentOtPolicies: DepartmentOtPolicy[];
  updateDepartmentOtPolicy: (id: string, policy: Partial<DepartmentOtPolicy>) => void;
  employeeOtPolicies: EmployeeOtPolicy[];
  updateEmployeeOtPolicy: (id: string, policy: Partial<EmployeeOtPolicy>) => void;
  overtimePolicy: OvertimePolicy;
  updateOvertimePolicy: (policy: Partial<OvertimePolicy>) => void;
  attendancePolicyConfig: AttendancePolicyConfig;
  updateAttendancePolicyConfig: (config: Partial<AttendancePolicyConfig>) => void;
  attendanceGlobalSettings: AttendanceGlobalSettings;
  updateAttendanceGlobalSettings: (settings: Partial<AttendanceGlobalSettings>) => void;
  recordEmployeePunch: (type: 'Check-In' | 'Check-Out', method?: AttendanceRecord['method']) => { success: boolean; message: string };
  getEmployeeShiftAttendanceState: (empId?: string) => ShiftWindowEvaluation;

  faceLogs: FaceLog[];
  addFaceLog: (log: Omit<FaceLog, 'id'>) => void;

  leaveRequests: LeaveRequest[];
  applyLeave: (req: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate'>) => void;
  approveLeave: (id: string, approvedBy: string) => void;
  rejectLeave: (id: string, approvedBy: string, comment?: string) => void;

  shifts: Shift[];
  shiftRequests: ShiftRequest[];
  addShift: (shift: Omit<Shift, 'id' | 'assignedEmployeeCount'>) => void;
  updateShift: (id: string, updates: Partial<Shift>) => void;
  deleteShift: (id: string) => void;
  requestShiftChange: (req: Omit<ShiftRequest, 'id' | 'status'>) => void;
  approveShiftRequest: (id: string, approvedBy: string) => void;
  rejectShiftRequest: (id: string, rejectedBy: string, reason?: string) => void;

  tasks: TaskItem[];
  addTask: (tsk: Omit<TaskItem, 'id' | 'createdAt'>) => void;
  updateTaskStatus: (id: string, status: TaskItem['status']) => void;
  deleteTask: (id: string) => void;

  // Enhanced Enterprise Task Management
  enhancedTasks: TaskItemEnhanced[];
  refreshTasks: () => Promise<void>;
  createEnhancedTask: (task: Omit<TaskItemEnhanced, 'id' | 'taskNumber' | 'overallProgress' | 'overallStatus' | 'updates' | 'comments' | 'attachments' | 'timeline' | 'auditLogs' | 'createdAt' | 'updatedAt'> & Partial<Pick<TaskItemEnhanced, 'assignees' | 'attachments'>>) => TaskItemEnhanced;
  updateAssigneeProgress: (taskId: string, assigneeId: string, progressPercentage: number, individualStatus: TaskAssigneeStatus, latestRemark?: string, completionEvidence?: TaskCompletionEvidence) => void;
  closeTask: (taskId: string, closedBy: string, closureRemarks?: string) => void;
  reopenTask: (taskId: string, reopenedBy: string, reopenReason: string) => void;
  addTaskDailyReport: (taskId: string, report: {
    reportDate: string;
    workDoneToday: string;
    planForTomorrow?: string;
    blockersOrIssues?: string;
    hoursSpent?: number;
    processStatus: TaskAssigneeStatus;
  }) => void;
  updateTaskProcessStatus: (taskId: string, newStatus: TaskAssigneeStatus, remarks?: string) => void;
  addTaskComment: (taskId: string, content: string, attachments?: string[]) => void;
  addTaskAttachment: (taskId: string, attachment: Omit<TaskAttachment, 'id' | 'taskId' | 'uploadedAt'>) => void;
  addTaskLink: (taskId: string, link: { title: string; url: string }) => void;
  deleteTaskLink: (taskId: string, linkId: string) => void;
  convertMOMActionToTask: (momId: string, actionItemId: string) => TaskItemEnhanced | null;
  syncMOMTask: (taskId: string) => void;
  deleteEnhancedTask: (taskId: string) => void;

  taskMasters: TaskMasterItem[];
  addTaskMaster: (item: Omit<TaskMasterItem, 'id'>) => void;
  updateTaskMaster: (id: string, updates: Partial<TaskMasterItem>) => void;
  deleteTaskMaster: (id: string) => void;

  momMeetings: MOMMeeting[];
  addMOMMeeting: (meeting: Omit<MOMMeeting, 'id' | 'meetingNumber'>) => void;

  escalationRules: TaskEscalationRule[];
  updateEscalationRule: (id: string, updates: Partial<TaskEscalationRule>) => void;

  taskWeights: TaskPerformanceWeights;
  updateTaskWeights: (weights: Partial<TaskPerformanceWeights>) => void;

  performanceScores: PerformanceScore[];

  jobOpenings: JobOpening[];
  candidates: Candidate[];
  addJobOpening: (job: Omit<JobOpening, 'id' | 'postedDate' | 'applicantsCount'>) => void;
  updateCandidateStage: (candidateId: string, newStage: Candidate['stage']) => void;
  referCandidate: (cand: Omit<Candidate, 'id' | 'stage' | 'appliedDate'>) => void;
  reviewReferral: (candidateId: string, status: 'Accepted' | 'Rejected', reviewerName: string, notes?: string, newStage?: Candidate['stage']) => void;

  expenses: Expense[];
  addExpense: (exp: Omit<Expense, 'id' | 'status'>) => void;
  approveExpense: (id: string, approvedBy: string, nextStatus: Expense['status']) => void;

  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  addNotification: (note: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => void;

  payrollRecords: PayrollRecord[];
  processPayrollBatch: () => void | Promise<void>;
  updateEmployeeSalaryScheme: (employeeId: string, withPf: boolean) => void;
  updatePayrollRecordAdvanceDeduction: (recordId: string, amount: number) => void;

  departments: DepartmentItem[];
  addDepartment: (dept: Omit<DepartmentItem, 'id' | 'employeeCount'>) => void;
  updateDepartment: (id: string, updates: Partial<DepartmentItem>) => void;
  deleteDepartment: (id: string) => { success: boolean; message?: string };

  designations: DesignationItem[];
  addDesignation: (desig: Omit<DesignationItem, 'id'>) => void;
  updateDesignation: (id: string, updates: Partial<DesignationItem>) => void;
  deleteDesignation: (id: string) => { success: boolean; message?: string };

  canDeleteEmployee: (idOrEmpId: string) => { canDelete: boolean; reason?: string };
  canDeleteDepartment: (idOrName: string) => { canDelete: boolean; reason?: string };
  canDeleteBranch: (idOrName: string) => { canDelete: boolean; reason?: string };
  canDeleteShift: (idOrName: string) => { canDelete: boolean; reason?: string };
  canDeleteDesignation: (idOrTitle: string) => { canDelete: boolean; reason?: string };

  branches: BranchItem[];
  addBranch: (branch: Omit<BranchItem, 'id'>) => void;
  updateBranch: (id: string, branch: Partial<BranchItem>) => void;
  deleteBranch: (id: string) => void;
  addDepartmentToBranch: (branchId: string, departmentName: string) => void;
  removeDepartmentFromBranch: (branchId: string, departmentName: string) => void;

  assets: AssetItem[];
  addAsset: (asset: Omit<AssetItem, 'id'>) => void;
  assignAsset: (assetId: string, employeeId: string, employeeName: string, department: string) => void;
  deleteAsset: (assetId: string) => void;

  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeModule: ModuleName;
  setActiveModule: (mod: ModuleName) => void;
  activeSettingsTab: SettingsSubTab;
  setActiveSettingsTab: (tab: SettingsSubTab) => void;

  workflowFormat: ApprovalWorkflowFormat;
  setWorkflowFormat: (format: ApprovalWorkflowFormat) => void;

  geofenceConfig: GeofenceConfig;
  updateGeofenceConfig: (config: Partial<GeofenceConfig>) => void;
  isGeofenceAdmin: boolean;

  // Enterprise Policies & Configurations
  leavePolicies: LeavePolicyItem[];
  addLeavePolicy: (policy: Omit<LeavePolicyItem, 'id'>) => void;
  updateLeavePolicy: (id: string, updates: Partial<LeavePolicyItem>) => void;
  deleteLeavePolicy: (id: string) => void;

  holidayPolicies: HolidayItem[];
  addHolidayPolicy: (holiday: Omit<HolidayItem, 'id'>) => void;
  updateHolidayPolicy: (id: string, updates: Partial<HolidayItem>) => void;
  deleteHolidayPolicy: (id: string) => void;

  attendancePolicies: AttendancePolicyItem[];
  addAttendancePolicy: (policy: Omit<AttendancePolicyItem, 'id'>) => void;
  updateAttendancePolicy: (id: string, updates: Partial<AttendancePolicyItem>) => void;
  deleteAttendancePolicy: (id: string) => void;

  weeklySchedules: WeeklyScheduleItem[];
  addWeeklySchedule: (schedule: Omit<WeeklyScheduleItem, 'id'>) => void;
  updateWeeklySchedule: (id: string, updates: Partial<WeeklyScheduleItem>) => void;
  deleteWeeklySchedule: (id: string) => void;

  attendanceConfig: GlobalAttendanceConfig;
  updateAttendanceConfig: (config: Partial<GlobalAttendanceConfig>) => void;

  policyDocuments: PolicyDocumentItem[];
  addPolicyDocument: (doc: Omit<PolicyDocumentItem, 'id'>) => void;
  updatePolicyDocument: (id: string, updates: Partial<PolicyDocumentItem>) => void;
  deletePolicyDocument: (id: string) => void;

  businessSettings: BusinessProfileSettings;
  updateBusinessSettings: (settings: Partial<BusinessProfileSettings>) => void;

  // Organization Masters
  grades: GradeItem[];
  addGrade: (grade: Omit<GradeItem, 'id'>) => void;
  updateGrade: (id: string, updates: Partial<GradeItem>) => void;
  deleteGrade: (id: string) => { success: boolean; message?: string };

  employmentTypes: EmploymentTypeItem[];
  addEmploymentType: (type: Omit<EmploymentTypeItem, 'id'>) => void;
  updateEmploymentType: (id: string, updates: Partial<EmploymentTypeItem>) => void;
  deleteEmploymentType: (id: string) => void;

  employeeCategories: EmployeeCategoryItem[];
  addEmployeeCategory: (cat: Omit<EmployeeCategoryItem, 'id'>) => void;
  updateEmployeeCategory: (id: string, updates: Partial<EmployeeCategoryItem>) => void;
  deleteEmployeeCategory: (id: string) => void;

  // Employee Configuration
  employeeConfig: EmployeeConfigSettings;
  updateEmployeeConfig: (config: Partial<EmployeeConfigSettings>) => void;

  // Workflows
  approvalWorkflows: ApprovalWorkflowItem[];
  addApprovalWorkflow: (wf: Omit<ApprovalWorkflowItem, 'id'>) => void;
  updateApprovalWorkflow: (id: string, updates: Partial<ApprovalWorkflowItem>) => void;
  deleteApprovalWorkflow: (id: string) => void;

  // Notifications
  notificationTriggers: NotificationTriggerConfig[];
  updateNotificationTrigger: (id: string, updates: Partial<NotificationTriggerConfig>) => void;

  // General & System Settings
  generalSystemConfig: GeneralSystemConfig;
  updateGeneralSystemConfig: (config: Partial<GeneralSystemConfig>) => void;

  // Integrations
  integrationsConfig: IntegrationsConfig;
  updateIntegrationsConfig: (config: Partial<IntegrationsConfig>) => void;

  // 5 New Core Enterprise Settings & Dynamic Policy Engine
  companyInfo: CompanyInfo;
  updateCompanyInfo: (info: Partial<CompanyInfo>) => void;

  companyBranches: CompanyBranch[];
  addCompanyBranch: (branch: Omit<CompanyBranch, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateCompanyBranch: (id: string, updates: Partial<CompanyBranch>) => void;
  deleteCompanyBranch: (id: string) => void;

  orgStructure: OrganizationStructure;
  updateOrgStructure: (structure: Partial<OrganizationStructure>) => void;
  editDepartment: (oldName: string, newName: string) => void;
  removeOrgDepartment: (name: string) => void;
  editDesignation: (oldTitle: string, newTitle: string) => void;
  removeOrgDesignation: (title: string) => void;
  editEmploymentType: (oldType: string, newType: string) => void;
  removeOrgEmploymentType: (type: string) => void;
  editWorkLocation: (oldLoc: string, newLoc: string) => void;
  removeOrgWorkLocation: (loc: string) => void;
  loadCompanyPreset: (preset: 'VRM' | 'BLANK') => void;

  masterAttendancePolicies: AttendancePolicy[];
  addMasterAttendancePolicy: (policy: Omit<AttendancePolicy, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'createdBy' | 'updatedBy'>) => void;
  updateMasterAttendancePolicy: (id: string, updates: Partial<AttendancePolicy>) => void;
  archiveMasterAttendancePolicy: (id: string) => void;
  toggleMasterAttendancePolicyStatus: (id: string) => void;

  attendanceCorrections: AttendanceCorrectionRequest[];
  submitAttendanceCorrection: (req: Omit<AttendanceCorrectionRequest, 'id' | 'submittedAt' | 'status'>) => void;
  reviewAttendanceCorrection: (id: string, decision: 'Approved' | 'Rejected', comment?: string, adjustedTime?: { checkIn?: string; checkOut?: string }) => void;

  masterLeavePolicies: MasterLeavePolicy[];
  addMasterLeavePolicy: (policy: Omit<MasterLeavePolicy, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'createdBy' | 'updatedBy'>) => void;
  updateMasterLeavePolicy: (id: string, updates: Partial<MasterLeavePolicy>) => void;
  archiveMasterLeavePolicy: (id: string) => void;
  toggleMasterLeavePolicyStatus: (id: string) => void;
  deleteMasterLeavePolicy: (id: string) => void;
  resetMasterLeavePoliciesToDefault: () => void;

  // Sandwich Leave Policy Engine
  sandwichPolicies: SandwichLeavePolicy[];
  sandwichAuditLogs: SandwichAuditLog[];
  createSandwichPolicy: (policy: Omit<SandwichLeavePolicy, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'createdBy' | 'updatedBy'>) => void;
  updateSandwichPolicy: (id: string, updates: Partial<SandwichLeavePolicy>, reason?: string) => void;
  archiveSandwichPolicy: (id: string) => void;
  toggleSandwichPolicyStatus: (id: string) => void;
  deleteSandwichPolicy: (id: string) => void;
  overrideSandwichCalculation: (leaveRequestId: string, overrideData: {
    excludedDates?: string[];
    includedDates?: string[];
    adjustedPayType?: SandwichPayType;
    adjustedDaysCount?: number;
    internalReason: string;
  }) => void;
  computeSandwichCalculation: (params: {
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
  }) => SandwichCalculationResult;
  addSandwichAuditLog: (log: Omit<SandwichAuditLog, 'id' | 'timestamp' | 'user' | 'userRole'>) => void;

  payrollSettingsConfig: PayrollSettingsConfig;
  updatePayrollSettingsConfig: (config: Partial<PayrollSettingsConfig>) => void;
  toggleSalaryComponent: (code: string) => void;

  rewardPolicies: RewardPolicy[];
  addRewardPolicy: (policy: Omit<RewardPolicy, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'createdBy' | 'updatedBy'>) => void;
  updateRewardPolicy: (id: string, updates: Partial<RewardPolicy>) => void;
  archiveRewardPolicy: (id: string) => void;
  toggleRewardPolicyStatus: (id: string) => void;

  employeeRewardRecords: EmployeeRewardRecord[];
  grantRewardToEmployee: (grant: Omit<EmployeeRewardRecord, 'id' | 'grantedDate' | 'payrollStatus'>) => void;

  policyAuditLogs: PolicyAuditLog[];
  addPolicyAuditLog: (log: Omit<PolicyAuditLog, 'id' | 'timestamp'>) => void;

  // Advance Salary / Loan Policy & Management
  loanPolicies: LoanPolicy[];
  activeLoanPolicy: LoanPolicy | undefined;
  createLoanPolicy: (policy: Omit<LoanPolicy, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => void;
  updateLoanPolicy: (id: string, updates: Partial<LoanPolicy>) => void;
  deleteLoanPolicy: (id: string) => void;

  loanRecords: LoanRecord[];
  submitLoanRequest: (request: Omit<LoanRecord, 'id' | 'requestedDate' | 'status' | 'outstandingBalance' | 'repaymentSchedule' | 'auditLogs'>) => { success: boolean; message: string; loanId?: string };
  reviewLoanRequest: (id: string, options: {
    action: 'Approve' | 'Reject';
    approvedAmount?: number;
    approvedMonths?: number;
    monthlyDeduction?: number;
    deductionStartMonth?: string;
    internalHrNotes?: string;
    employeeVisibleNotes?: string;
    rejectionReason?: string;
  }) => void;
  disburseLoan: (id: string, details: {
    disbursedDate: string;
    disbursedAmount: number;
    paymentMode: 'NEFT' | 'IMPS' | 'Cheque' | 'Cash';
    transactionRef?: string;
    notes?: string;
  }) => void;
  recordManualRepayment: (id: string, repayment: {
    amount: number;
    repaymentDate: string;
    paymentMode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'NEFT' | 'Other';
    referenceNumber?: string;
    notes?: string;
  }) => void;
  calculateEmployeeLoanEligibility: (employeeId: string, policyId?: string) => {
    isEligible: boolean;
    ineligibleReason?: string;
    employmentDurationMonths: number;
    monthlySalary: number;
    maxEligibleAmount: number;
    activeLoansCount: number;
    currentOutstanding: number;
    policy: LoanPolicy;
  };

  // Field Duty & Live GPS Tracking
  fieldAssignments: FieldAssignment[];
  tripSessions: FieldTripSession[];
  trackingAlerts: TrackingAlert[];
  createFieldAssignment: (data: Omit<FieldAssignment, 'id' | 'createdAt' | 'updatedAt'>) => FieldAssignment;
  updateFieldAssignment: (id: string, updates: Partial<FieldAssignment>) => void;
  cancelFieldAssignment: (id: string) => void;
  startTrip: (assignmentId: string, startLat: number, startLng: number, startAddress?: string) => FieldTripSession;
  recordLocationPoint: (tripId: string, point: Omit<LocationPoint, 'id' | 'tripId'>) => void;
  endTrip: (tripId: string, endLat: number, endLng: number, endAddress?: string) => void;
  fieldCheckIn: (assignmentId: string, lat: number, lng: number, address?: string) => { success: boolean; message: string };
  fieldCheckOut: (assignmentId: string) => void;
  resolveTrackingAlert: (alertId: string) => void;
  getTodayFieldAssignment: (employeeId: string) => FieldAssignment | undefined;
}

const HRMSContext = createContext<HRMSContextType | undefined>(undefined);

export const HRMSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Pure Supabase Cloud Architecture: purge any remaining business data from browser localStorage
  if (typeof window !== 'undefined') {
    const STORAGE_MODE = 'vrm_hrms_supabase_cloud_only_v2';
    if (localStorage.getItem('vrm_hrms_storage_mode') !== STORAGE_MODE) {
      const keysToRemove = [
        'vrm_hrms_employees', 'vrm_hrms_enhanced_tasks', 'vrm_hrms_attendance_records',
        'vrm_hrms_leave_requests', 'hrms_loan_records', 'vrm_hrms_loan_policies',
        'vrm_hrms_expenses', 'vrm_hrms_assets', 'vrm_hrms_mom_meetings',
        'vrm_hrms_payroll_records', 'vrm_hrms_field_assignments', 'vrm_hrms_trip_sessions',
        'vrm_hrms_tracking_alerts', 'vrm_hrms_shifts', 'vrm_hrms_holiday_policies',
        'vrm_hrms_shift_requests', 'vrm_hrms_reward_policies', 'vrm_hrms_employee_rewards',
        'vrm_hrms_master_attendance_policies', 'vrm_hrms_master_leave_policies',
        'vrm_hrms_payroll_settings_config', 'vrm_hrms_geofence_config', 'vrm_hrms_company_info',
        'vrm_hrms_company_branches', 'vrm_hrms_org_structure', 'vrm_hrms_departments',
        'vrm_hrms_designations', 'vrm_hrms_department_ot_policies',
        'vrm_enterprise_integrations_v5', 'vrm_enterprise_integrations_v4',
        'vrm_enterprise_integrations_v3', 'vrm_enterprise_integrations_v2'
      ];
      for (const k of keysToRemove) {
        try { localStorage.removeItem(k); } catch {}
      }
      localStorage.setItem('vrm_hrms_storage_mode', STORAGE_MODE);
    }
  }

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('vrm_hrms_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.id && parsed.email && parsed.name && parsed.role && parsed.employeeId) {
          if (parsed.designation === 'CEO' || (parsed.designation && parsed.designation.toLowerCase().includes('ceo')) || parsed.role === 'CEO') {
            parsed.role = 'CEO';
          }
          return parsed;
        }
      } catch (e) {
        console.error('Error reading current user from storage', e);
      }
    }
    return {
      id: 'USR-001',
      name: 'Businz Super Admin',
      email: 'admin@businz.com',
      role: 'Super Admin',
      avatar: '',
      department: 'Management',
      designation: 'Super Administrator',
      employeeId: 'EMP-000'
    };
  });

  const updateCurrentUser = (updates: Partial<User>) => {
    setCurrentUser(prev => {
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem('vrm_hrms_current_user', JSON.stringify(updated));
      } catch (e) {
        console.error('Error saving current user to storage', e);
      }
      return updated;
    });
  };

  const [permissionMatrix, setPermissionMatrix] = useState<PermissionMatrix>(DEFAULT_PERMISSIONS);
  const [activeModule, setActiveModule] = useState<ModuleName>('dashboard');
  const [activeSettingsTab, setActiveSettingsTab] = useState<SettingsSubTab>('company_details');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [workflowFormat, setWorkflowFormat] = useState<ApprovalWorkflowFormat>('HR_ONLY');
  const isCloudInitialized = useRef(false);
  const isSyncingFromCloud = useRef(false);

  const [geofenceConfig, setGeofenceConfig] = useState<GeofenceConfig>(INITIAL_GEOFENCE_CONFIG);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('geofence_config', geofenceConfig);
      }
    } catch (e) {
      console.error('Error saving geofenceConfig to cloud database', e);
    }
  }, [geofenceConfig]);

  const updateGeofenceConfig = (config: Partial<GeofenceConfig>) => {
    setGeofenceConfig(prev => ({ ...prev, ...config }));
  };

  const isGeofenceAdmin = true; // Fully unlocked for all roles

  const sanitizeAvatar = (url?: string) => {
    if (!url) return '';
    if (url.includes('unsplash.com')) return '';
    return url;
  };

  const [employees, setEmployees] = useState<Employee[]>([]);

  // Supabase Database Employee Entity Mapper
  const mapEmployeeFromDb = (d: any): Employee => ({
    id: d.id,
    employeeId: d.employeeId || d.employee_id,
    firstName: d.firstName || d.first_name || '',
    lastName: d.lastName || d.last_name || '',
    email: d.email || '',
    phone: d.phone || '+91 98765 43210',
    dob: d.dob || '1995-01-01',
    gender: (d.gender as any) || 'Male',
    address: d.address || 'Chennai, Tamil Nadu',
    department: d.department || (d.departments && d.departments.name) || 'General',
    designation: d.designation || 'Staff',
    reportingManagerId: d.reportingManagerId || d.reporting_manager_id || '',
    reportingManagerName: d.reportingManagerName || d.reporting_manager_name || '',
    joiningDate: d.joiningDate || d.created_at?.split('T')[0] || '2026-01-01',
    employmentType: (d.employmentType || d.employment_type || 'Full-Time') as any,
    status: (d.status === 'Active' || d.status === 'Terminated' || d.status === 'On Leave') ? d.status : 'Active',
    avatar: d.avatar || d.avatar_url || '',
    basicSalary: Number(d.basicSalary || d.basic_salary) || 15000,
    allowances: {
      hra: Number(d.hra || d.allowances_hra) || 0,
      transport: Number(d.conveyance || d.allowances_transport) || 0,
      medical: Number(d.allowances_medical) || 0,
      special: Number(d.allowances_special) || 0,
      da: Number(d.da) || 0,
      conveyance: Number(d.conveyance) || 0,
    },
    withPf: d.withPf ?? true,
    bankDetails: {
      bankName: d.bankName || d.bank_name || 'HDFC Bank',
      accountNumber: d.accountNumber || d.account_number || '****1001',
      ifscCode: d.ifscCode || d.ifsc_code || 'HDFC0001234',
      branch: d.branch || 'Main Branch',
    },
    attendanceMethod: (d.attendanceMethod || d.attendance_method || (d.designation === 'CEO' || (d.designation && d.designation.toLowerCase().includes('ceo')) ? 'Exempt' : 'Face Scan')) as any,
    gpsAllowed: d.gpsAllowed ?? (d.designation === 'CEO' ? false : true),
    faceRegistered: d.faceRegistered ?? false,
    facePhotoUrl: d.facePhotoUrl || d.face_photo_url || '',
    workShift: d.workShift || d.work_shift || 'SH-01',
    documents: Array.isArray(d.documents) ? d.documents : [],
    departmentId: d.departmentId || d.department_id,
    designationId: d.designationId || d.designation_id,
    branchId: d.branchId || d.branch_id,
    role: (d.role === 'CEO' || d.designation === 'CEO' || (d.designation && d.designation.toLowerCase().includes('ceo')) || d.role_id === '42a8b0c3-22e5-40a0-bf78-2dd14475c6d6')
      ? 'CEO'
      : (d.role || (d.designation === 'HR Manager' ? 'HR Manager' : 'Employee')),
    mustChangePassword: d.mustChangePassword ?? d.must_change_password ?? false,
    accountStatus: d.accountStatus || d.account_status || 'ACTIVE',
    credentialEmailStatus: d.credentialEmailStatus || d.credential_email_status || 'SENT',
    credentialEmailSentAt: d.credentialEmailSentAt || d.credential_email_sent_at || '',
    authUserId: d.authUserId || d.auth_id || d.id,
    password: d.password,
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('attendance_records_data', attendanceRecords);
      }
    } catch (e) {
      console.error('Error saving attendanceRecords to cloud database', e);
    }
  }, [attendanceRecords]);

  const [attendanceAuditLogs, setAttendanceAuditLogs] = useState<AttendanceAuditLog[]>(INITIAL_ATTENDANCE_AUDIT_LOGS);

  const correctAttendanceRecord = (params: {
    attendanceId: string;
    status: AttendanceRecord['status'];
    checkIn?: string | null;
    checkOut?: string | null;
    breakDurationMinutes?: number;
    halfDayType?: 'First Half' | 'Second Half';
    absentReason?: 'Unauthorized Absence' | 'No Show' | 'Attendance Not Recorded' | 'Other';
    leaveType?: string;
    leaveDuration?: 'Full Day' | 'First Half' | 'Second Half';
    wfhReason?: string;
    wfhSource?: 'Approved WFH Request' | 'HR Assigned' | 'Manual';
    otHours?: number;
    approvedOtHours?: number;
    otStatus?: 'Pending' | 'Approved' | 'Rejected' | 'Paid';
    otReason?: string;
    reason: string;
    changedBy: string;
  }): { success: boolean; message: string } => {
    if (!params.reason || !params.reason.trim()) {
      return { success: false, message: 'Reason is required for manual attendance correction.' };
    }

    const existingRec = attendanceRecords.find(r => r.id === params.attendanceId);
    if (!existingRec) {
      return { success: false, message: 'Attendance record not found.' };
    }

    // Calculate working hours & OT
    let computedWorkingHours = existingRec.workingHours;
    const breakMins = params.breakDurationMinutes ?? existingRec.breakDurationMinutes ?? 0;

    if (params.status === 'Absent' || params.status === 'Holiday' || params.status === 'Week Off') {
      computedWorkingHours = 0;
    } else if (params.status === 'Half Day') {
      computedWorkingHours = 4.0;
    } else if (params.status === 'On Leave' || (params.status as string) === 'Leave') {
      computedWorkingHours = (params.leaveDuration === 'First Half' || params.leaveDuration === 'Second Half') ? 4.0 : 0;
    } else if (params.checkIn && params.checkOut) {
      const parseTime = (timeStr: string) => {
        if (!timeStr) return null;
        const clean = timeStr.trim();
        let hours = 0;
        let mins = 0;
        if (clean.includes('AM') || clean.includes('PM')) {
          const [timePart, ampm] = clean.split(' ');
          const [h, m] = timePart.split(':').map(Number);
          hours = ampm.toUpperCase() === 'PM' && h < 12 ? h + 12 : (ampm.toUpperCase() === 'AM' && h === 12 ? 0 : h);
          mins = m || 0;
        } else {
          const [h, m] = clean.split(':').map(Number);
          hours = h || 0;
          mins = m || 0;
        }
        return hours * 60 + mins;
      };

      const inMins = parseTime(params.checkIn);
      const outMins = parseTime(params.checkOut);
      if (inMins !== null && outMins !== null) {
        if (outMins < inMins) {
          return { success: false, message: 'Check-out time cannot be earlier than check-in time.' };
        }
        const netMinutes = Math.max(0, outMins - inMins - breakMins);
        computedWorkingHours = Math.round((netMinutes / 60) * 10) / 10;
      }
    }

    const calculatedOtHours = computedWorkingHours > 8.0 ? Math.round((computedWorkingHours - 8.0) * 10) / 10 : 0;
    const finalOtStatus = params.otStatus ?? existingRec.otStatus ?? 'Pending';
    const approvedOt = params.approvedOtHours !== undefined
      ? params.approvedOtHours
      : (finalOtStatus === 'Approved' || finalOtStatus === 'Paid' ? (params.otHours ?? calculatedOtHours) : 0);

    const updatedRecord: AttendanceRecord = {
      ...existingRec,
      status: params.status,
      checkIn: params.status === 'Absent' ? null : (params.checkIn !== undefined ? params.checkIn : existingRec.checkIn),
      checkOut: params.status === 'Absent' ? null : (params.checkOut !== undefined ? params.checkOut : existingRec.checkOut),
      workingHours: computedWorkingHours,
      breakDurationMinutes: breakMins,
      halfDayType: params.halfDayType,
      absentReason: params.absentReason,
      leaveType: params.leaveType,
      leaveDuration: params.leaveDuration,
      wfhReason: params.wfhReason,
      wfhSource: params.wfhSource,
      otHours: params.otHours ?? calculatedOtHours,
      calculatedOtHours,
      approvedOtHours: approvedOt,
      otStatus: finalOtStatus,
      otReason: params.otReason,
      reason: params.reason
    };

    setAttendanceRecords(prev => prev.map(r => r.id === params.attendanceId ? updatedRecord : r));

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    
    const oldSummary = `Status: ${existingRec.status}, CheckIn: ${existingRec.checkIn || 'None'}, CheckOut: ${existingRec.checkOut || 'None'}, Hours: ${existingRec.workingHours}`;
    const newSummary = `Status: ${updatedRecord.status}, CheckIn: ${updatedRecord.checkIn || 'None'}, CheckOut: ${updatedRecord.checkOut || 'None'}, Hours: ${updatedRecord.workingHours}`;

    const newAuditLog: AttendanceAuditLog = {
      id: `AUD-${Date.now()}`,
      attendanceId: params.attendanceId,
      employeeId: existingRec.employeeId,
      employeeName: existingRec.employeeName,
      date: existingRec.date,
      fieldChanged: `Attendance Status / Punch Adjustment (${existingRec.status} -> ${updatedRecord.status})`,
      oldValue: oldSummary,
      newValue: newSummary,
      reason: params.reason,
      changedBy: params.changedBy,
      timestamp: `${dateStr} ${timeStr}`
    };

    setAttendanceAuditLogs(prev => [newAuditLog, ...prev]);

    setPayrollRecords(prev => prev.map(p => {
      if (p.employeeId === existingRec.employeeId) {
        const isAbsent = updatedRecord.status === 'Absent';
        const isHalfDay = updatedRecord.status === 'Half Day';
        return {
          ...p,
          overtimeHours: (p.overtimeHours || 0) + approvedOt,
          lopDays: isAbsent ? (p.lopDays || 0) + 1 : (isHalfDay ? (p.lopDays || 0) + 0.5 : p.lopDays)
        };
      }
      return p;
    }));

    addNotification({
      title: 'Attendance Corrected',
      message: `Attendance for ${existingRec.employeeName} on ${existingRec.date} was updated by ${params.changedBy}. Reason: ${params.reason}`,
      priority: 'Normal',
      category: 'Attendance'
    });

    return { success: true, message: 'Attendance record updated and audit log created successfully.' };
  };

  // Enterprise Attendance, Shifts & Overtime Policy State
  const [missedPunchRequests, setMissedPunchRequests] = useState<MissedPunchRequest[]>(INITIAL_MISSED_PUNCH_REQUESTS);
  const [overtimeRequests, setOvertimeRequests] = useState<OvertimeRequest[]>(INITIAL_OVERTIME_REQUESTS);
  const [departmentOtPolicies, setDepartmentOtPolicies] = useState<DepartmentOtPolicy[]>(INITIAL_DEPARTMENT_OT_POLICIES);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('department_ot_policies_data', departmentOtPolicies);
      }
    } catch {}
  }, [departmentOtPolicies]);
  const [employeeOtPolicies, setEmployeeOtPolicies] = useState<EmployeeOtPolicy[]>(INITIAL_EMPLOYEE_OT_POLICIES);
  const [attendanceGlobalSettings, setAttendanceGlobalSettings] = useState<AttendanceGlobalSettings>(INITIAL_ATTENDANCE_GLOBAL_SETTINGS);
  const [overtimePolicy, setOvertimePolicy] = useState<OvertimePolicy>(INITIAL_OVERTIME_POLICY);
  const [attendancePolicyConfig, setAttendancePolicyConfig] = useState<AttendancePolicyConfig>(INITIAL_ATTENDANCE_POLICY_CONFIG);

  const updateOvertimePolicy = (policyUpdates: Partial<OvertimePolicy>) => {
    setOvertimePolicy(prev => ({ ...prev, ...policyUpdates }));
    addNotification({
      title: 'Overtime Policy Updated',
      message: 'Overtime calculation method, multipliers, or limits updated.',
      priority: 'Normal',
      category: 'Attendance'
    });
  };

  const updateAttendancePolicyConfig = (configUpdates: Partial<AttendancePolicyConfig>) => {
    setAttendancePolicyConfig(prev => ({ ...prev, ...configUpdates }));
    addNotification({
      title: 'Attendance Policy Updated',
      message: 'Half-day, absent, and late coming rules updated successfully.',
      priority: 'Normal',
      category: 'Attendance'
    });
  };

  const getEmployeeShiftAttendanceState = (empId?: string): ShiftWindowEvaluation => {
    const targetEmpId = empId || currentUser.employeeId || currentUser.id || 'EMP-001';
    const emp = employees.find(e => e.id === targetEmpId || e.employeeId === targetEmpId) || ({
      id: targetEmpId,
      employeeId: targetEmpId,
      firstName: currentUser.name?.split(' ')[0] || 'Employee',
      lastName: currentUser.name?.split(' ')[1] || '',
      email: currentUser.email,
      workShift: (currentUser as any).workShift,
      department: currentUser.department,
    } as Employee);

    return evaluateShiftAttendance({
      employee: emp,
      shifts,
      attendanceRecords,
      now: new Date(),
      holidays: holidayPolicies,
      weeklySchedules,
      leaves: leaveRequests,
    });
  };

  const recordEmployeePunch = (
    type: 'Check-In' | 'Check-Out',
    method: AttendanceRecord['method'] = 'Manual Punch'
  ): { success: boolean; message: string } => {
    const empId = currentUser.employeeId || currentUser.id || 'EMP-001';
    const evalResult = getEmployeeShiftAttendanceState(empId);

    if (type === 'Check-In') {
      if (!evalResult.canCheckIn) {
        return {
          success: false,
          message: evalResult.message,
        };
      }
    } else if (type === 'Check-Out') {
      if (!evalResult.canCheckOut) {
        return {
          success: false,
          message: evalResult.message,
        };
      }
    }

    const now = new Date();
    const nowHours = now.getHours();
    const nowMinutes = now.getMinutes();
    const ampm = nowHours >= 12 ? 'PM' : 'AM';
    const displayHours = nowHours % 12 || 12;
    const nowTimeStr = `${String(displayHours).padStart(2, '0')}:${String(nowMinutes).padStart(2, '0')} ${ampm}`;

    const targetShift = evalResult.assignedShift;
    const targetShiftDate = evalResult.shiftDate;

    const shiftModel: ShiftModel = {
      id: targetShift.id,
      shiftName: targetShift.shiftName,
      shiftCode: (targetShift as any).shiftCode || 'SH-01',
      startTime: targetShift.startTime || '09:00 AM',
      endTime: targetShift.endTime || '06:00 PM',
      requiredWorkingHours: ('requiredWorkingHours' in targetShift ? (targetShift as any).requiredWorkingHours : (targetShift as any).workingHours) || 8.25,
      breakDurationMinutes: ('breakDurationMinutes' in targetShift ? (targetShift as any).breakDurationMinutes : (targetShift as any).breakDurationMins) || 45,
      gracePeriodMinutes: ('gracePeriodMinutes' in targetShift ? (targetShift as any).gracePeriodMinutes : (targetShift as any).gracePeriodMins) || 15,
      lateThresholdMinutes: 15,
      earlyCheckoutThresholdMinutes: 10,
      otStartsAfter: 'After required working hours completed',
      maximumDailyOtHours: 4.0
    };

    const otElig = resolveEmployeeOtEligibility(
      empId,
      currentUser.department || 'Engineering',
      departmentOtPolicies,
      employeeOtPolicies
    );

    setAttendanceRecords(prev => {
      const existingIdx = prev.findIndex(a => 
        (a.employeeId === empId || a.employeeId === currentUser.id) &&
        (a.shiftDate === targetShiftDate || a.date === targetShiftDate)
      );

      if (existingIdx !== -1) {
        const existing = prev[existingIdx];
        const newCheckIn = type === 'Check-In' ? nowTimeStr : (existing.checkIn || nowTimeStr);
        const newCheckOut = type === 'Check-Out' ? nowTimeStr : existing.checkOut;

        const calc = calculateAttendanceHoursAndStatus({
          checkIn: newCheckIn,
          checkOut: newCheckOut,
          shift: shiftModel,
          otPolicy: overtimePolicy,
          attendancePolicy: attendancePolicyConfig,
          isOtEligible: otElig.isEligible
        });

        const updated: AttendanceRecord = {
          ...existing,
          shiftId: targetShift.id,
          shiftDate: targetShiftDate,
          shiftName: targetShift.shiftName,
          checkIn: newCheckIn,
          checkOut: newCheckOut,
          workingHours: calc.workedHours,
          status: calc.status,
          lateStatus: calc.lateStatus,
          lateDurationMinutes: calc.lateMinutes,
          earlyCheckoutMinutes: calc.earlyCheckoutMinutes,
          calculatedOtHours: calc.potentialOtHours,
          method
        };

        const copy = [...prev];
        copy[existingIdx] = updated;
        return copy;
      } else {
        const newCheckIn = type === 'Check-In' ? nowTimeStr : null;
        const newCheckOut = type === 'Check-Out' ? nowTimeStr : null;

        const calc = calculateAttendanceHoursAndStatus({
          checkIn: newCheckIn,
          checkOut: newCheckOut,
          shift: shiftModel,
          otPolicy: overtimePolicy,
          attendancePolicy: attendancePolicyConfig,
          isOtEligible: otElig.isEligible
        });

        const newRec: AttendanceRecord = {
          id: `ATT-${Date.now()}`,
          employeeId: empId,
          employeeName: currentUser.name,
          department: currentUser.department || 'Engineering',
          shiftId: targetShift.id,
          shiftDate: targetShiftDate,
          date: targetShiftDate,
          checkIn: newCheckIn,
          checkOut: newCheckOut,
          workingHours: calc.workedHours,
          status: calc.status,
          lateStatus: calc.lateStatus,
          lateDurationMinutes: calc.lateMinutes,
          earlyCheckoutMinutes: calc.earlyCheckoutMinutes,
          calculatedOtHours: calc.potentialOtHours,
          shiftName: shiftModel.shiftName,
          method
        };

        return [newRec, ...prev];
      }
    });

    const nowIso = new Date().toISOString().replace('T', ' ').substring(0, 19);
    setAttendanceAuditLogs(prev => [
      {
        id: `AUD-${Date.now()}`,
        attendanceId: `ATT-${empId}-${targetShiftDate}`,
        employeeId: empId,
        employeeName: currentUser.name,
        date: targetShiftDate,
        fieldChanged: type === 'Check-In' ? 'Check-In Time' : 'Check-Out Time',
        oldValue: 'None',
        newValue: nowTimeStr,
        reason: `${type} punched via Employee Portal (${method}) for shift "${targetShift.shiftName}"`,
        changedBy: currentUser.name,
        timestamp: nowIso
      },
      ...prev
    ]);

    addNotification({
      title: `${type} Recorded`,
      message: `Successfully logged ${type.toLowerCase()} at ${nowTimeStr} for ${targetShift.shiftName}.`,
      priority: 'Normal',
      category: 'Attendance'
    });

    return {
      success: true,
      message: `${type} recorded successfully at ${nowTimeStr}`
    };
  };

  const submitMissedPunchRequest = (req: Omit<MissedPunchRequest, 'id' | 'status' | 'submittedAt'>): { success: boolean; message: string } => {
    if (!req.reason || !req.reason.trim()) {
      return { success: false, message: 'Reason is required for attendance correction request.' };
    }
    const newReq: MissedPunchRequest = {
      ...req,
      id: `MPR-${Date.now().toString().slice(-4)}`,
      status: 'Pending',
      submittedAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    };
    setMissedPunchRequests(prev => [newReq, ...prev]);
    addNotification({
      title: 'Correction Request Submitted',
      message: `${req.employeeName} submitted a ${req.requestType} request for ${req.date}.`,
      priority: 'Normal',
      category: 'Attendance'
    });
    return { success: true, message: 'Attendance correction request submitted successfully.' };
  };

  const approveMissedPunchRequest = (id: string, reviewedBy: string, remarks?: string) => {
    const target = missedPunchRequests.find(r => r.id === id);
    if (!target) return;

    const nowStr = new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const targetCheckIn = target.requestedCheckIn || '09:00 AM';
    const targetCheckOut = target.requestedCheckOut || '06:00 PM';

    setMissedPunchRequests(prev => prev.map(r => r.id === id ? {
      ...r,
      status: 'Approved',
      reviewedBy,
      reviewedAt: nowStr,
      hrRemarks: remarks || 'Approved by HR/CEO',
      adjustedCheckIn: targetCheckIn,
      adjustedCheckOut: targetCheckOut
    } : r));

    const assignedShift = shifts.find(s => s.assignments?.some(a => a.employeeId === target.employeeId)) || shifts[0];
    const shiftModel: ShiftModel = {
      id: assignedShift?.id || 'SH-01',
      shiftName: assignedShift?.shiftName || 'Shift 1 (09:00 AM - 06:00 PM)',
      shiftCode: (assignedShift as any)?.shiftCode || 'SH-01',
      startTime: assignedShift?.startTime || '09:00 AM',
      endTime: assignedShift?.endTime || '06:00 PM',
      requiredWorkingHours: assignedShift?.workingHours || 8.25,
      breakDurationMinutes: assignedShift?.breakDurationMins || 45,
      gracePeriodMinutes: assignedShift?.gracePeriodMins || 15,
      lateThresholdMinutes: 15,
      earlyCheckoutThresholdMinutes: 10,
      otStartsAfter: 'After required working hours completed',
      maximumDailyOtHours: 4.0
    };

    const otEligibility = resolveEmployeeOtEligibility(
      target.employeeId,
      target.department,
      departmentOtPolicies,
      employeeOtPolicies
    );

    const calc = calculateAttendanceHoursAndStatus({
      checkIn: targetCheckIn,
      checkOut: targetCheckOut,
      shift: shiftModel,
      otPolicy: overtimePolicy,
      attendancePolicy: attendancePolicyConfig,
      isOtEligible: otEligibility.isEligible
    });

    setAttendanceRecords(prev => {
      const idx = prev.findIndex(a => a.employeeId === target.employeeId && a.date === target.date);
      if (idx !== -1) {
        const existing = prev[idx];
        const updated: AttendanceRecord = {
          ...existing,
          checkIn: targetCheckIn,
          checkOut: targetCheckOut,
          status: calc.status,
          workingHours: calc.workedHours,
          calculatedOtHours: calc.potentialOtHours,
          lateStatus: calc.lateStatus,
          lateDurationMinutes: calc.lateMinutes,
          earlyCheckoutMinutes: calc.earlyCheckoutMinutes,
          shiftName: shiftModel.shiftName,
          reason: `Missed Punch Approved: ${remarks || target.reason}`
        };
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      } else {
        const newRec: AttendanceRecord = {
          id: `ATT-${Date.now()}`,
          employeeId: target.employeeId,
          employeeName: target.employeeName,
          date: target.date,
          checkIn: targetCheckIn,
          checkOut: targetCheckOut,
          department: target.department,
          status: calc.status,
          method: 'Manual Punch',
          workingHours: calc.workedHours,
          calculatedOtHours: calc.potentialOtHours,
          lateStatus: calc.lateStatus,
          lateDurationMinutes: calc.lateMinutes,
          earlyCheckoutMinutes: calc.earlyCheckoutMinutes,
          shiftName: shiftModel.shiftName,
          otHours: 0,
          approvedOtHours: 0,
          otStatus: 'Pending',
          reason: `Missed Punch Approved: ${remarks || target.reason}`
        };
        return [newRec, ...prev];
      }
    });

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setAttendanceAuditLogs(prev => [{
      id: `AUD-${Date.now()}`,
      attendanceId: `ATT-${target.id}`,
      employeeId: target.employeeId,
      employeeName: target.employeeName,
      date: target.date,
      fieldChanged: `Missed Punch Approved (${target.requestType})`,
      oldValue: `Check-In: ${target.existingCheckIn || 'Missing'}, Check-Out: ${target.existingCheckOut || 'Missing'}`,
      newValue: `Check-In: ${targetCheckIn}, Check-Out: ${targetCheckOut} (${calc.workedHours}h worked, ${calc.potentialOtHours}h potential OT)`,
      reason: remarks || target.reason,
      changedBy: reviewedBy,
      timestamp: `${dateStr} ${timeStr}`
    }, ...prev]);

    addNotification({
      title: 'Correction Approved',
      message: `Attendance request for ${target.employeeName} on ${target.date} was approved.`,
      priority: 'Normal',
      category: 'Attendance'
    });
  };

  const rejectMissedPunchRequest = (id: string, reviewedBy: string, remarks?: string) => {
    const target = missedPunchRequests.find(r => r.id === id);
    if (!target) return;
    const nowStr = new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    setMissedPunchRequests(prev => prev.map(r => r.id === id ? {
      ...r,
      status: 'Rejected',
      reviewedBy,
      reviewedAt: nowStr,
      hrRemarks: remarks || 'Rejected by HR/CEO'
    } : r));

    addNotification({
      title: 'Correction Rejected',
      message: `Correction request for ${target.employeeName} on ${target.date} was rejected.`,
      priority: 'Urgent',
      category: 'Attendance'
    });
  };

  const editAndApproveMissedPunchRequest = (
    id: string,
    adjustedCheckIn: string,
    adjustedCheckOut: string,
    reviewedBy: string,
    remarks?: string
  ) => {
    const target = missedPunchRequests.find(r => r.id === id);
    if (!target) return;

    const nowStr = new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    setMissedPunchRequests(prev => prev.map(r => r.id === id ? {
      ...r,
      status: 'Approved',
      adjustedCheckIn,
      adjustedCheckOut,
      reviewedBy,
      reviewedAt: nowStr,
      hrRemarks: remarks || 'Adjusted and approved by HR/CEO'
    } : r));

    const assignedShift = shifts.find(s => s.assignments?.some(a => a.employeeId === target.employeeId)) || shifts[0];
    const shiftModel: ShiftModel = {
      id: assignedShift?.id || 'SH-01',
      shiftName: assignedShift?.shiftName || 'Shift 1 (09:00 AM - 06:00 PM)',
      shiftCode: (assignedShift as any)?.shiftCode || 'SH-01',
      startTime: assignedShift?.startTime || '09:00 AM',
      endTime: assignedShift?.endTime || '06:00 PM',
      requiredWorkingHours: assignedShift?.workingHours || 8.25,
      breakDurationMinutes: assignedShift?.breakDurationMins || 45,
      gracePeriodMinutes: assignedShift?.gracePeriodMins || 15,
      lateThresholdMinutes: 15,
      earlyCheckoutThresholdMinutes: 10,
      otStartsAfter: 'After required working hours completed',
      maximumDailyOtHours: 4.0
    };

    const otEligibility = resolveEmployeeOtEligibility(
      target.employeeId,
      target.department,
      departmentOtPolicies,
      employeeOtPolicies
    );

    const calc = calculateAttendanceHoursAndStatus({
      checkIn: adjustedCheckIn,
      checkOut: adjustedCheckOut,
      shift: shiftModel,
      otPolicy: overtimePolicy,
      attendancePolicy: attendancePolicyConfig,
      isOtEligible: otEligibility.isEligible
    });

    setAttendanceRecords(prev => {
      const idx = prev.findIndex(a => a.employeeId === target.employeeId && a.date === target.date);
      if (idx !== -1) {
        const existing = prev[idx];
        const updated: AttendanceRecord = {
          ...existing,
          checkIn: adjustedCheckIn,
          checkOut: adjustedCheckOut,
          status: calc.status,
          workingHours: calc.workedHours,
          calculatedOtHours: calc.potentialOtHours,
          lateStatus: calc.lateStatus,
          lateDurationMinutes: calc.lateMinutes,
          earlyCheckoutMinutes: calc.earlyCheckoutMinutes,
          shiftName: shiftModel.shiftName,
          reason: `Missed Punch Adjusted & Approved: ${remarks || target.reason}`
        };
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      } else {
        const newRec: AttendanceRecord = {
          id: `ATT-${Date.now()}`,
          employeeId: target.employeeId,
          employeeName: target.employeeName,
          date: target.date,
          checkIn: adjustedCheckIn,
          checkOut: adjustedCheckOut,
          department: target.department,
          status: calc.status,
          method: 'Manual Punch',
          workingHours: calc.workedHours,
          calculatedOtHours: calc.potentialOtHours,
          lateStatus: calc.lateStatus,
          lateDurationMinutes: calc.lateMinutes,
          earlyCheckoutMinutes: calc.earlyCheckoutMinutes,
          shiftName: shiftModel.shiftName,
          otHours: 0,
          approvedOtHours: 0,
          otStatus: 'Pending',
          reason: `Missed Punch Adjusted & Approved: ${remarks || target.reason}`
        };
        return [newRec, ...prev];
      }
    });

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setAttendanceAuditLogs(prev => [{
      id: `AUD-${Date.now()}`,
      attendanceId: `ATT-${target.id}`,
      employeeId: target.employeeId,
      employeeName: target.employeeName,
      date: target.date,
      fieldChanged: `Missed Punch Adjusted & Approved (${target.requestType})`,
      oldValue: `Requested: ${target.requestedCheckIn || '-'} to ${target.requestedCheckOut || '-'}`,
      newValue: `Adjusted: ${adjustedCheckIn} to ${adjustedCheckOut} (${calc.workedHours}h worked, ${calc.potentialOtHours}h potential OT)`,
      reason: remarks || target.reason,
      changedBy: reviewedBy,
      timestamp: `${dateStr} ${timeStr}`
    }, ...prev]);

    addNotification({
      title: 'Correction Adjusted & Approved',
      message: `Attendance for ${target.employeeName} on ${target.date} adjusted to ${adjustedCheckIn} - ${adjustedCheckOut}.`,
      priority: 'Normal',
      category: 'Attendance'
    });
  };

  const submitOtRequest = (req: Omit<OvertimeRequest, 'id' | 'status' | 'approvedOtHours' | 'submittedAt'>): { success: boolean; message: string } => {
    if (!req.reason || !req.reason.trim()) {
      return { success: false, message: 'Reason is required for overtime request.' };
    }

    // Security check: Verify employee OT eligibility
    const otElig = resolveEmployeeOtEligibility(
      req.employeeId,
      req.department,
      departmentOtPolicies,
      employeeOtPolicies
    );

    if (!otElig.isEligible) {
      return {
        success: false,
        message: `OT Submission Blocked: ${otElig.reason}`
      };
    }

    const newReq: OvertimeRequest = {
      ...req,
      id: `OTR-${Date.now().toString().slice(-4)}`,
      approvedOtHours: 0,
      status: 'Pending Approval',
      source: 'Employee Request',
      submittedAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    };
    setOvertimeRequests(prev => [newReq, ...prev]);

    addNotification({
      title: 'Overtime Request Submitted',
      message: `${req.employeeName} submitted OT request for ${req.requestedOtHours} hrs on ${req.date}.`,
      priority: 'Normal',
      category: 'Attendance'
    });
    return { success: true, message: 'Overtime request submitted successfully.' };
  };

  const approveOtRequest = (
    id: string, 
    approvedHours: number, 
    reviewedBy: string, 
    remarks?: string,
    multiplier?: OvertimeRequest['multiplier']
  ) => {
    const target = overtimeRequests.find(r => r.id === id);
    if (!target) return;
    const nowStr = new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    const activeMultiplier = multiplier || target.multiplier || '1x Salary';
    const factor = activeMultiplier === '2x Salary' ? 2 : activeMultiplier === '1.5x Salary' ? 1.5 : 1;
    const rate = target.hourlyRate > 0 ? target.hourlyRate : 100;
    const newCalculatedAmount = Math.round(approvedHours * rate * factor * 100) / 100;

    setOvertimeRequests(prev => prev.map(r => r.id === id ? {
      ...r,
      approvedOtHours: approvedHours,
      multiplier: activeMultiplier,
      calculatedAmount: newCalculatedAmount,
      status: approvedHours < r.requestedOtHours ? 'Partially Approved' : 'Approved',
      reviewedBy,
      reviewedAt: nowStr,
      reviewRemarks: remarks || (approvedHours < r.requestedOtHours ? `Approved ${approvedHours}h of ${r.requestedOtHours}h requested` : 'Approved')
    } : r));

    // Update AttendanceRecord
    setAttendanceRecords(prev => prev.map(a => {
      if (a.employeeId === target.employeeId && a.date === target.date) {
        return {
          ...a,
          otHours: approvedHours,
          approvedOtHours: approvedHours,
          otStatus: 'Approved'
        };
      }
      return a;
    }));

    // Update Payroll
    setPayrollRecords(prev => prev.map(p => {
      if (p.employeeId === target.employeeId) {
        return {
          ...p,
          overtimeHours: (p.overtimeHours || 0) + approvedHours
        };
      }
      return p;
    }));

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setAttendanceAuditLogs(prev => [{
      id: `AUD-${Date.now()}`,
      attendanceId: `ATT-${target.id}`,
      employeeId: target.employeeId,
      employeeName: target.employeeName,
      date: target.date,
      fieldChanged: 'Overtime Approved',
      oldValue: `Requested: ${target.requestedOtHours} hrs (${target.multiplier})`,
      newValue: `Approved: ${approvedHours} hrs (${activeMultiplier}, ${formatCurrency(newCalculatedAmount)})`,
      reason: remarks || 'HR/CEO Overtime Approval',
      changedBy: reviewedBy,
      timestamp: `${dateStr} ${timeStr}`
    }, ...prev]);

    addNotification({
      title: 'OT Request Approved',
      message: `Approved ${approvedHours} hrs OT for ${target.employeeName} on ${target.date} by ${reviewedBy}.`,
      priority: 'Normal',
      category: 'Attendance'
    });
  };

  const rejectOtRequest = (id: string, reviewedBy: string, remarks?: string) => {
    const target = overtimeRequests.find(r => r.id === id);
    if (!target) return;
    const nowStr = new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });

    setOvertimeRequests(prev => prev.map(r => r.id === id ? {
      ...r,
      status: 'Rejected',
      approvedOtHours: 0,
      reviewedBy,
      reviewedAt: nowStr,
      reviewRemarks: remarks || 'Rejected by HR/CEO'
    } : r));

    setAttendanceRecords(prev => prev.map(a => {
      if (a.employeeId === target.employeeId && a.date === target.date) {
        return {
          ...a,
          otStatus: 'Rejected'
        };
      }
      return a;
    }));

    addNotification({
      title: 'OT Request Rejected',
      message: `OT request for ${target.employeeName} on ${target.date} was rejected by ${reviewedBy}.`,
      priority: 'Urgent',
      category: 'Attendance'
    });
  };

  const editAndApproveOtRequest = (
    id: string, 
    approvedHours: number, 
    reviewedBy: string, 
    remarks?: string,
    multiplier?: OvertimeRequest['multiplier']
  ) => {
    approveOtRequest(id, approvedHours, reviewedBy, remarks, multiplier);
  };

  const deleteOtRequest = (id: string) => {
    const target = overtimeRequests.find(r => r.id === id);
    setOvertimeRequests(prev => prev.filter(r => r.id !== id));
    addNotification({
      title: 'OT Request Cancelled',
      message: target ? `Overtime request for ${target.date} was cancelled.` : 'Overtime request removed.',
      priority: 'Normal',
      category: 'Attendance'
    });
  };

  const addManualOtEntry = (entry: { employeeId: string; date: string; hours: number; hourlyRate: number; multiplier: OvertimeRequest['multiplier']; reason: string; addedBy: string }): { success: boolean; message: string } => {
    const emp = employees.find(e => e.id === entry.employeeId || e.employeeId === entry.employeeId);
    if (!emp) return { success: false, message: 'Employee not found.' };

    const fullName = `${emp.firstName} ${emp.lastName}`.trim();
    const calculatedAmount = entry.multiplier === '1.5x Salary'
      ? entry.hours * entry.hourlyRate * 1.5
      : entry.multiplier === '2x Salary'
      ? entry.hours * entry.hourlyRate * 2
      : entry.hours * entry.hourlyRate;

    const newReq: OvertimeRequest = {
      id: `OTR-${Date.now().toString().slice(-4)}`,
      employeeId: entry.employeeId,
      employeeName: fullName,
      department: emp.department,
      date: entry.date,
      shiftEnd: '06:00 PM',
      actualCheckOut: 'Manual Addition',
      potentialOtHours: entry.hours,
      requestedOtHours: entry.hours,
      approvedOtHours: entry.hours,
      reason: entry.reason,
      workDescription: `Manual OT added by ${entry.addedBy}`,
      status: 'Manually Added',
      source: 'Manual OT',
      multiplier: entry.multiplier,
      hourlyRate: entry.hourlyRate,
      calculatedAmount,
      submittedAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      reviewedBy: entry.addedBy,
      reviewedAt: new Date().toLocaleString([], { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }),
      reviewRemarks: `Directly credited by ${entry.addedBy}`
    };

    setOvertimeRequests(prev => [newReq, ...prev]);

    // Sync to attendance
    setAttendanceRecords(prev => {
      const idx = prev.findIndex(a => a.employeeId === entry.employeeId && a.date === entry.date);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          otHours: entry.hours,
          approvedOtHours: entry.hours,
          otStatus: 'Approved'
        };
        return copy;
      }
      return prev;
    });

    // Update payroll
    setPayrollRecords(prev => prev.map(p => {
      if (p.employeeId === entry.employeeId) {
        return {
          ...p,
          overtimeHours: (p.overtimeHours || 0) + entry.hours
        };
      }
      return p;
    }));

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setAttendanceAuditLogs(prev => [{
      id: `AUD-${Date.now()}`,
      attendanceId: `ATT-${entry.employeeId}-${entry.date}`,
      employeeId: entry.employeeId,
      employeeName: fullName,
      date: entry.date,
      fieldChanged: 'Manual Overtime Added',
      oldValue: '0 hrs',
      newValue: `${entry.hours} hrs @ ${formatCurrency(entry.hourlyRate)}/hr (${entry.multiplier})`,
      reason: entry.reason,
      changedBy: entry.addedBy,
      timestamp: `${dateStr} ${timeStr}`
    }, ...prev]);

    addNotification({
      title: 'Manual Overtime Added',
      message: `Credited ${entry.hours} hrs OT to ${fullName} on ${entry.date}.`,
      priority: 'Normal',
      category: 'Attendance'
    });

    return { success: true, message: 'Overtime hours successfully added and synced with payroll.' };
  };

  const addManualAttendanceRecord = (entry: {
    employeeId: string;
    date: string;
    status: AttendanceRecord['status'];
    checkIn?: string | null;
    checkOut?: string | null;
    breakDurationMinutes?: number;
    workingHours?: number;
    halfDayType?: 'First Half' | 'Second Half';
    otHours?: number;
    reason: string;
    addedBy: string;
  }): { success: boolean; message: string } => {
    if (!entry.employeeId) {
      return { success: false, message: 'Please select an employee.' };
    }
    if (!entry.date) {
      return { success: false, message: 'Please specify the date.' };
    }
    if (!entry.reason || !entry.reason.trim()) {
      return { success: false, message: 'Reason / authorization is mandatory.' };
    }

    const emp = employees.find(e => e.id === entry.employeeId || e.employeeId === entry.employeeId);
    if (!emp) {
      return { success: false, message: 'Employee not found.' };
    }

    const fullName = `${emp.firstName} ${emp.lastName}`.trim();
    const breakMins = entry.breakDurationMinutes ?? 45;

    // Calculate working hours if not explicitly passed
    let computedHours = entry.workingHours;
    if (computedHours === undefined) {
      if (entry.status === 'Absent' || entry.status === 'Holiday' || entry.status === 'Week Off') {
        computedHours = 0;
      } else if (entry.status === 'Half Day') {
        computedHours = 4.0;
      } else if (entry.status === 'On Leave' || (entry.status as string) === 'Leave') {
        computedHours = 0;
      } else if (entry.checkIn && entry.checkOut) {
        const parseTime = (timeStr: string) => {
          if (!timeStr) return null;
          const clean = timeStr.trim();
          let hours = 0;
          let mins = 0;
          if (clean.includes('AM') || clean.includes('PM')) {
            const [timePart, ampm] = clean.split(' ');
            const [hh, mm] = timePart.split(':').map(Number);
            hours = ampm.toUpperCase() === 'PM' && hh < 12 ? hh + 12 : (ampm.toUpperCase() === 'AM' && hh === 12 ? 0 : hh);
            mins = mm || 0;
          } else {
            const [hh, mm] = clean.split(':').map(Number);
            hours = hh || 0;
            mins = mm || 0;
          }
          return hours * 60 + mins;
        };

        const inMins = parseTime(entry.checkIn);
        const outMins = parseTime(entry.checkOut);
        if (inMins !== null && outMins !== null) {
          if (outMins >= inMins) {
            const netMins = Math.max(0, outMins - inMins - breakMins);
            computedHours = Math.round((netMins / 60) * 10) / 10;
          } else {
            computedHours = 8.0;
          }
        } else {
          computedHours = 8.0;
        }
      } else {
        computedHours = entry.status === 'Present' ? 8.0 : 0;
      }
    }

    const isNonWorking = entry.status === 'Absent' || entry.status === 'Holiday' || entry.status === 'Week Off';
    const cleanCheckIn = isNonWorking ? null : (entry.checkIn || null);
    const cleanCheckOut = isNonWorking ? null : (entry.checkOut || null);
    const otHrs = entry.otHours || 0;

    let existingRecord: AttendanceRecord | undefined;

    setAttendanceRecords(prev => {
      const idx = prev.findIndex(a => a.employeeId === entry.employeeId && a.date === entry.date);
      if (idx !== -1) {
        existingRecord = prev[idx];
        const updated: AttendanceRecord = {
          ...prev[idx],
          status: entry.status,
          checkIn: cleanCheckIn,
          checkOut: cleanCheckOut,
          workingHours: computedHours || 0,
          breakDurationMinutes: breakMins,
          halfDayType: entry.halfDayType,
          otHours: otHrs,
          approvedOtHours: otHrs > 0 ? otHrs : prev[idx].approvedOtHours,
          otStatus: otHrs > 0 ? 'Approved' : prev[idx].otStatus,
          method: 'Manual Punch',
          reason: `Manual Attendance (HR/CEO): ${entry.reason}`
        };
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      } else {
        const newRec: AttendanceRecord = {
          id: `ATT-${Date.now()}`,
          employeeId: entry.employeeId,
          employeeName: fullName,
          department: emp.department,
          date: entry.date,
          status: entry.status,
          checkIn: cleanCheckIn,
          checkOut: cleanCheckOut,
          workingHours: computedHours || 0,
          breakDurationMinutes: breakMins,
          halfDayType: entry.halfDayType,
          shiftName: emp.workShift || shifts[0]?.shiftName || 'Shift 1 (09:00 AM - 06:00 PM)',
          method: 'Manual Punch',
          otHours: otHrs,
          approvedOtHours: otHrs,
          otStatus: otHrs > 0 ? 'Approved' : 'Pending',
          reason: `Manual Attendance (HR/CEO): ${entry.reason}`
        };
        return [newRec, ...prev];
      }
    });

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    setAttendanceAuditLogs(prev => [{
      id: `AUD-${Date.now()}`,
      attendanceId: existingRecord ? existingRecord.id : `ATT-${entry.employeeId}-${entry.date}`,
      employeeId: entry.employeeId,
      employeeName: fullName,
      date: entry.date,
      fieldChanged: existingRecord ? `Manual Attendance Override (${existingRecord.status} -> ${entry.status})` : 'Manual Attendance Entry Created',
      oldValue: existingRecord ? `Status: ${existingRecord.status}, In: ${existingRecord.checkIn || 'None'}, Out: ${existingRecord.checkOut || 'None'}` : 'No Previous Record',
      newValue: `Status: ${entry.status}, In: ${cleanCheckIn || 'None'}, Out: ${cleanCheckOut || 'None'}, Hours: ${computedHours}`,
      reason: entry.reason,
      changedBy: entry.addedBy,
      timestamp: `${dateStr} ${timeStr}`
    }, ...prev]);

    // Update payroll if absent/halfday or OT
    setPayrollRecords(prev => prev.map(p => {
      if (p.employeeId === entry.employeeId) {
        return {
          ...p,
          overtimeHours: (p.overtimeHours || 0) + otHrs,
          lopDays: entry.status === 'Absent' ? (p.lopDays || 0) + 1 : (entry.status === 'Half Day' ? (p.lopDays || 0) + 0.5 : p.lopDays)
        };
      }
      return p;
    }));

    addNotification({
      title: 'Manual Attendance Recorded',
      message: `Manual attendance for ${fullName} on ${entry.date} recorded by ${entry.addedBy}.`,
      priority: 'Normal',
      category: 'Attendance'
    });

    return { success: true, message: `Attendance for ${fullName} on ${entry.date} successfully recorded!` };
  };

  const updateDepartmentOtPolicy = (idOrDeptName: string, policy: Partial<DepartmentOtPolicy>) => {
    setDepartmentOtPolicies(prev => {
      const idx = prev.findIndex(p => p.id === idOrDeptName || p.department.toLowerCase() === idOrDeptName.toLowerCase());
      if (idx >= 0) {
        return prev.map((p, i) => i === idx ? { ...p, ...policy } : p);
      } else {
        const newPolicy: DepartmentOtPolicy = {
          id: idOrDeptName.startsWith('DOT-') ? idOrDeptName : `DOT-${Date.now()}`,
          department: policy.department || idOrDeptName,
          otAllowed: policy.otAllowed ?? true,
          policyId: 'OTP-001',
          maxOtHoursDaily: policy.maxOtHoursDaily ?? 4.0,
          maxOtHoursMonthly: policy.maxOtHoursMonthly ?? 60,
          minOtDurationMinutes: policy.minOtDurationMinutes ?? 30,
          approvalRequired: policy.approvalRequired ?? true,
          calculationMethod: policy.calculationMethod ?? 'Shift End Based',
          standardShiftHours: policy.standardShiftHours ?? 9,
          otHourlyRate: policy.otHourlyRate ?? 100,
          ...policy
        };
        return [...prev, newPolicy];
      }
    });
  };

  const updateEmployeeOtPolicy = (id: string, policy: Partial<EmployeeOtPolicy>) => {
    setEmployeeOtPolicies(prev => prev.map(p => p.id === id ? { ...p, ...policy } : p));
  };

  const updateAttendanceGlobalSettings = (settings: Partial<AttendanceGlobalSettings>) => {
    setAttendanceGlobalSettings(prev => ({ ...prev, ...settings }));
  };

  const [faceLogs, setFaceLogs] = useState<FaceLog[]>(INITIAL_FACE_LOGS);

  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('leave_requests_data', leaveRequests);
      }
    } catch (e) {
      console.error('Error saving leaveRequests to cloud database', e);
    }
  }, [leaveRequests]);

  const [shifts, setShifts] = useState<Shift[]>([]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('shifts_data', shifts);
      }
    } catch (e) {
      console.error('Error saving shifts to cloud database', e);
    }
  }, [shifts]);

  const [leavePolicies, setLeavePolicies] = useState<LeavePolicyItem[]>(INITIAL_LEAVE_POLICIES);

  const [holidayPolicies, setHolidayPolicies] = useState<HolidayItem[]>([]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('holiday_policies_data', holidayPolicies);
      }
    } catch (e) {
      console.error('Error saving holiday policies to cloud database', e);
    }
  }, [holidayPolicies]);

  const [attendancePolicies, setAttendancePolicies] = useState<AttendancePolicyItem[]>(INITIAL_ATTENDANCE_POLICIES);

  const [weeklySchedules, setWeeklySchedules] = useState<WeeklyScheduleItem[]>(INITIAL_WEEKLY_SCHEDULES);

  const [attendanceConfig, setAttendanceConfig] = useState<GlobalAttendanceConfig>(INITIAL_GLOBAL_ATTENDANCE_CONFIG);

  const [policyDocuments, setPolicyDocuments] = useState<PolicyDocumentItem[]>(INITIAL_POLICY_DOCUMENTS);

  const [businessSettings, setBusinessSettings] = useState<BusinessProfileSettings>(INITIAL_BUSINESS_SETTINGS);
  const [shiftRequests, setShiftRequests] = useState<ShiftRequest[]>([]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('shift_requests_data', shiftRequests);
      }
    } catch (e) {
      console.error('Error saving shift requests to cloud database', e);
    }
  }, [shiftRequests]);

  const [tasks, setTasks] = useState<TaskItem[]>(INITIAL_TASKS);

  // Ensure tasks are never self-assigned ("oru person own task assign pannakudathu")
  const sanitizeSelfAssignedTask = (task: TaskItemEnhanced): TaskItemEnhanced => {
    const rawBy = (task.assignedBy || task.createdBy || '').toLowerCase();
    const assignedByClean = rawBy.replace(/\s*\([^)]*\)/g, '').trim();

    // Check if any assignee is the same person as assignedBy / createdBy
    const hasSelfAssignee = task.assignees?.some(a => {
      const aName = (a.employeeName || '').toLowerCase().trim();
      return aName && assignedByClean && (aName === assignedByClean || assignedByClean.startsWith(aName) || aName.startsWith(assignedByClean));
    });

    if (hasSelfAssignee) {
      return {
        ...task,
        assignedBy: 'Velmurugan (CEO)',
        createdBy: 'Velmurugan (CEO)'
      };
    }
    return task;
  };

  // Enhanced Enterprise Tasks & Systems (Supabase Cloud Only)
  const [enhancedTasks, setEnhancedTasks] = useState<TaskItemEnhanced[]>([]);

  const [taskMasters, setTaskMasters] = useState<TaskMasterItem[]>(INITIAL_TASK_MASTERS);

  const [momMeetings, setMomMeetings] = useState<MOMMeeting[]>([]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('mom_meetings_data', momMeetings);
      }
    } catch (e) {
      console.warn('Failed to save momMeetings to cloud database', e);
    }
  }, [momMeetings]);

  const [escalationRules, setEscalationRules] = useState<TaskEscalationRule[]>(INITIAL_ESCALATION_RULES);

  const [taskWeights, setTaskWeights] = useState<TaskPerformanceWeights>(INITIAL_TASK_WEIGHTS);

  const [performanceScores, setPerformanceScores] = useState<PerformanceScore[]>(INITIAL_PERFORMANCE);
  const [jobOpenings, setJobOpenings] = useState<JobOpening[]>(INITIAL_JOBS);
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('expenses_data', expenses);
      }
    } catch (e) {
      console.warn('Failed to save expenses to cloud database', e);
    }
  }, [expenses]);

  const [notifications, setNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('payroll_records_data', payrollRecords);
      }
    } catch (e) {
      console.warn('Failed to save payrollRecords to cloud database', e);
    }
  }, [payrollRecords]);

  const [departments, setDepartments] = useState<DepartmentItem[]>([]);

  const [designations, setDesignations] = useState<DesignationItem[]>([]);

  const [branches, setBranches] = useState<BranchItem[]>(INITIAL_BRANCHES);

  const [assets, setAssets] = useState<AssetItem[]>([]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('assets_data', assets);
      }
    } catch (e) {
      console.warn('Failed to save assets to cloud database', e);
    }
  }, [assets]);

  // ========================================================
  // 5 CORE SETTINGS MODULES & POLICY ENGINE STATE
  // ========================================================
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(INITIAL_COMPANY_INFO);

  const [companyBranches, setCompanyBranches] = useState<CompanyBranch[]>([]);

  const [orgStructure, setOrgStructure] = useState<OrganizationStructure>(INITIAL_ORG_STRUCTURE);

  const triggerToast = (message: string) => {
    const newNote: NotificationItem = {
      id: `nt-${Date.now()}`,
      title: 'Policy Engine Notification',
      message,
      timestamp: 'Just now',
      priority: 'Normal',
      category: 'Payroll',
      read: false
    };
    setNotifications(prev => [newNote, ...prev]);
  };

  const [masterAttendancePolicies, setMasterAttendancePolicies] = useState<AttendancePolicy[]>([]);

  const [attendanceCorrections, setAttendanceCorrections] = useState<AttendanceCorrectionRequest[]>(INITIAL_ATTENDANCE_CORRECTIONS);

  const [masterLeavePolicies, setMasterLeavePolicies] = useState<MasterLeavePolicy[]>([]);

  // Sandwich Leave Policy Engine States
  const [sandwichPolicies, setSandwichPolicies] = useState<SandwichLeavePolicy[]>(initialSandwichPolicies);

  const [sandwichAuditLogs, setSandwichAuditLogs] = useState<SandwichAuditLog[]>(initialSandwichAuditLogs);

  const addSandwichAuditLog = (log: Omit<SandwichAuditLog, 'id' | 'timestamp' | 'user' | 'userRole'>) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const userRole = currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role;
    const newEntry: SandwichAuditLog = {
      id: `SAL-${Date.now()}`,
      timestamp: formatted,
      user: currentUser.name,
      userRole,
      ...log
    };
    setSandwichAuditLogs(prev => [newEntry, ...prev]);
  };

  const [payrollSettingsConfig, setPayrollSettingsConfig] = useState<PayrollSettingsConfig>(INITIAL_PAYROLL_CONFIG);

  const [rewardPolicies, setRewardPolicies] = useState<RewardPolicy[]>(INITIAL_REWARD_POLICIES);

  const [employeeRewardRecords, setEmployeeRewardRecords] = useState<EmployeeRewardRecord[]>(INITIAL_EMPLOYEE_REWARDS);

  const [policyAuditLogs, setPolicyAuditLogs] = useState<PolicyAuditLog[]>(INITIAL_POLICY_AUDIT_LOGS);

  const addPolicyAuditLog = (log: Omit<PolicyAuditLog, 'id' | 'timestamp'>) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const newEntry: PolicyAuditLog = {
      id: `LOG-${Date.now()}`,
      timestamp: formatted,
      ...log
    };
    setPolicyAuditLogs(prev => [newEntry, ...prev]);
  };

  // ==========================================
  // 6. ADVANCE SALARY / LOAN POLICY & RECORDS
  // ==========================================
  const [loanPolicies, setLoanPolicies] = useState<LoanPolicy[]>(DEFAULT_LOAN_POLICIES);

  // Supabase Cloud persistence effects
  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('departments_data', departments);
      }
    } catch {}
  }, [departments]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('designations_data', designations);
      }
    } catch {}
  }, [designations]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('company_info', companyInfo);
      }
    } catch {}
  }, [companyInfo]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('company_branches', companyBranches);
      }
    } catch {}
  }, [companyBranches]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('org_structure', orgStructure);
      }
    } catch {}
  }, [orgStructure]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('master_attendance_policies_data', masterAttendancePolicies);
      }
    } catch {}
  }, [masterAttendancePolicies]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('master_leave_policies_data', masterLeavePolicies);
      }
    } catch {}
  }, [masterLeavePolicies]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('payroll_settings_config', payrollSettingsConfig);
      }
    } catch {}
  }, [payrollSettingsConfig]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('reward_policies_data', rewardPolicies);
      }
    } catch {}
  }, [rewardPolicies]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('employee_rewards_data', employeeRewardRecords);
      }
    } catch {}
  }, [employeeRewardRecords]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('loan_policies_data', loanPolicies);
      }
    } catch {}
  }, [loanPolicies]);

  const activeLoanPolicy = loanPolicies.find(p => p.status === 'Active') || loanPolicies[0];

  const createLoanPolicy = (policyData: Omit<LoanPolicy, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const userLabel = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    const newPolicy: LoanPolicy = {
      id: `POL-LOAN-${String(loanPolicies.length + 1).padStart(3, '0')}`,
      createdAt: formatted,
      updatedAt: formatted,
      createdBy: userLabel,
      updatedBy: userLabel,
      ...policyData
    };
    setLoanPolicies(prev => [newPolicy, ...prev]);
    addPolicyAuditLog({
      policyCategory: 'Advance Salary / Loan Policy',
      policyId: newPolicy.id,
      policyName: newPolicy.policyName,
      action: 'CREATE',
      performedBy: currentUser.name,
      performedByRole: currentUser.role,
      changeSummary: `Created master loan policy "${newPolicy.policyName}" with min tenure ${newPolicy.minimumEmploymentMonths} months.`
    });
  };

  const updateLoanPolicy = (id: string, updates: Partial<LoanPolicy>) => {
    const now = new Date();
    const formatted = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const userLabel = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    setLoanPolicies(prev => prev.map(p => {
      if (p.id === id) {
        const updated = { ...p, ...updates, updatedAt: formatted, updatedBy: userLabel };
        addPolicyAuditLog({
          policyCategory: 'Advance Salary / Loan Policy',
          policyId: p.id,
          policyName: updated.policyName,
          action: 'EDIT',
          performedBy: currentUser.name,
          performedByRole: currentUser.role,
          changeSummary: `Updated policy settings for "${updated.policyName}".`
        });
        return updated;
      }
      return p;
    }));
  };

  const deleteLoanPolicy = (id: string) => {
    setLoanPolicies(prev => prev.filter(p => p.id !== id));
  };

  const [loanRecords, setLoanRecords] = useState<LoanRecord[]>([]);

  // Sync loan records to Supabase Cloud whenever updated
  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('loan_records_data', loanRecords);
      }
    } catch (e) {
      console.warn('Failed to save loanRecords to cloud database', e);
    }
  }, [loanRecords]);

  // Dynamic Eligibility Calculator (NO HARDCODING)
  const calculateEmployeeLoanEligibility = (employeeId: string, policyId?: string) => {
    let emp = employees.find(e => e.employeeId === employeeId || e.id === employeeId || e.email?.toLowerCase() === employeeId?.toLowerCase());
    
    // Match against current user if relevant
    if (!emp && currentUser && (currentUser.employeeId === employeeId || currentUser.email?.toLowerCase() === employeeId?.toLowerCase())) {
      emp = employees.find(e => e.employeeId === currentUser.employeeId || e.email === currentUser.email) || employees[0];
    }
    if (!emp) {
      emp = employees[0];
    }

    const policy = (policyId ? loanPolicies.find(p => p.id === policyId) : activeLoanPolicy) || DEFAULT_LOAN_POLICIES[0];
    
    if (!policy) {
      return {
        isEligible: false,
        ineligibleReason: 'No master advance or loan policies are currently configured.',
        employmentDurationMonths: 0,
        monthlySalary: 0,
        maxEligibleAmount: 0,
        activeLoansCount: 0,
        currentOutstanding: 0,
        policy: null as any
      };
    }

    if (!emp) {
      return {
        isEligible: false,
        ineligibleReason: 'Employee record not found.',
        employmentDurationMonths: 0,
        monthlySalary: 0,
        maxEligibleAmount: 0,
        activeLoansCount: 0,
        currentOutstanding: 0,
        policy
      };
    }

    // 1. Calculate Employment Duration safely from Joining Date
    let tenureMonths = 24;
    try {
      const rawJoin = emp.joiningDate || (emp as any).dateOfJoining;
      const joinDate = rawJoin && !isNaN(new Date(rawJoin).getTime()) ? new Date(rawJoin) : new Date('2023-01-10');
      const now = new Date();
      const diffMonths = ((now.getFullYear() - joinDate.getFullYear()) * 12) + (now.getMonth() - joinDate.getMonth()) + ((now.getDate() - joinDate.getDate()) / 30);
      tenureMonths = Math.max(0, Math.round(diffMonths * 10) / 10);
    } catch {
      tenureMonths = 24;
    }

    // 2. Calculate Monthly Salary with safe fallback
    const basic = toNum(emp.basicSalary) || 32000;
    const allowances = toNum(emp.allowances?.hra) + toNum(emp.allowances?.transport) + toNum(emp.allowances?.medical) + toNum(emp.allowances?.special);
    const monthlySalary = (basic + allowances) > 0 ? (basic + allowances) : basic;

    // 3. Calculate Maximum Eligible Amount based on Policy Limit Type
    let maxEligibleAmount = 0;
    const salaryPct = policy.maxSalaryPercent ?? (policy.maxLoanLimitType === 'PERCENTAGE_SALARY' ? policy.maxLoanLimitValue : undefined);
    if (salaryPct !== undefined && salaryPct > 0) {
      maxEligibleAmount = Math.round(monthlySalary * (salaryPct / 100));
    } else if (policy.maxLoanLimitType === 'SALARY_MULTIPLIER') {
      maxEligibleAmount = Math.round(monthlySalary * (policy.maxLoanLimitValue || 2));
    } else if (policy.maxLoanLimitType === 'PERCENTAGE_SALARY') {
      maxEligibleAmount = Math.round(monthlySalary * ((policy.maxLoanLimitValue || 100) / 100));
    } else {
      maxEligibleAmount = policy.maxLoanLimitValue || 50000;
    }
    if (policy.maxLoanAmount && policy.maxLoanAmount > 0) {
      maxEligibleAmount = Math.min(maxEligibleAmount, policy.maxLoanAmount);
    }
    if (maxEligibleAmount <= 0) {
      maxEligibleAmount = 60000;
    }

    // 4. Check Active Loans & Outstanding Balance
    const activeLoans = loanRecords.filter(
      r => r.employeeId === emp.employeeId && 
      (r.status === 'Active' || r.status === 'Disbursed') && 
      toNum(r.outstandingBalance) > 0
    );
    const activeLoansCount = activeLoans.length;
    const currentOutstanding = activeLoans.reduce((sum, r) => sum + toNum(r.outstandingBalance), 0);

    // 5. Dynamic Rules Validations
    if (tenureMonths < policy.minimumEmploymentMonths) {
      return {
        isEligible: false,
        ineligibleReason: `You are not eligible to apply for this loan yet. Minimum ${policy.minimumEmploymentMonths} months of completed employment is required. (Your completed tenure is ${tenureMonths} months)`,
        employmentDurationMonths: tenureMonths,
        monthlySalary,
        maxEligibleAmount,
        activeLoansCount,
        currentOutstanding,
        policy
      };
    }

    const isPendingNotAllowed = policy.allowPreviousPending === false;
    if ((isPendingNotAllowed && activeLoansCount > 0) || activeLoansCount >= policy.maxActiveLoans) {
      return {
        isEligible: false,
        ineligibleReason: isPendingNotAllowed && activeLoansCount > 0
          ? `You have a previous advance pending repayment. The policy does not allow new requests while a previous advance is active.`
          : `You already have an active loan (${activeLoansCount}/${policy.maxActiveLoans}). Please complete your current loan repayment before applying for a new loan.`,
        employmentDurationMonths: tenureMonths,
        monthlySalary,
        maxEligibleAmount,
        activeLoansCount,
        currentOutstanding,
        policy
      };
    }

    return {
      isEligible: true,
      employmentDurationMonths: tenureMonths,
      monthlySalary,
      maxEligibleAmount,
      activeLoansCount,
      currentOutstanding,
      policy
    };
  };

  const submitLoanRequest = (requestData: Omit<LoanRecord, 'id' | 'requestedDate' | 'status' | 'outstandingBalance' | 'repaymentSchedule' | 'auditLogs'>) => {
    const eligibility = calculateEmployeeLoanEligibility(requestData.employeeId, requestData.policyId);
    if (!eligibility.isEligible) {
      return { success: false, message: eligibility.ineligibleReason || 'Not eligible to submit loan request.' };
    }

    const effectiveLimit = Math.max(eligibility.maxEligibleAmount || 50000, 30000);
    if (requestData.requestedAmount > effectiveLimit) {
      return { success: false, message: `Requested amount exceeds your maximum eligible loan limit of ${formatCurrency(effectiveLimit)}.` };
    }

    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const timestamp = `${dateStr} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const loanId = `ADV-${now.getFullYear()}-${String(loanRecords.length + 1).padStart(3, '0')}`;
    const months = requestData.installmentMonths || 3;
    const monthlyEMI = Math.round(requestData.requestedAmount / months);

    const schedule: LoanRepaymentInstallment[] = Array.from({ length: months }).map((_, idx) => {
      return {
        installmentNumber: idx + 1,
        periodMonth: `Month +${idx + 1}`,
        scheduledAmount: idx === months - 1 ? requestData.requestedAmount - (monthlyEMI * (months - 1)) : monthlyEMI,
        actualDeducted: 0,
        remainingBalance: requestData.requestedAmount - (monthlyEMI * (idx + 1)),
        status: 'Pending'
      };
    });

    const newRecord: LoanRecord = {
      ...requestData,
      id: loanId,
      requestedDate: dateStr,
      status: 'Pending',
      monthlyDeduction: monthlyEMI,
      outstandingBalance: requestData.requestedAmount,
      repaymentSchedule: schedule,
      auditLogs: [
        {
          id: `LOG-${Date.now()}-1`,
          loanId,
          action: 'Loan Requested',
          performedBy: `${requestData.employeeName} (${requestData.employeeId})`,
          performedByRole: currentUser.role,
          timestamp,
          notes: `Requested ${formatCurrency(requestData.requestedAmount)} for ${months} months. Reason: ${requestData.purpose}`
        }
      ]
    };

    setLoanRecords(prev => [newRecord, ...prev]);
    addNotification({
      title: 'New Advance / Loan Request',
      message: `${requestData.employeeName} submitted a request for ${formatCurrency(requestData.requestedAmount)}.`,
      priority: 'Important',
      category: 'Payroll'
    });

    return { success: true, message: 'Advance Salary / Loan request submitted successfully.', loanId };
  };

  const reviewLoanRequest = (id: string, options: {
    action: 'Approve' | 'Reject';
    approvedAmount?: number;
    approvedMonths?: number;
    monthlyDeduction?: number;
    deductionStartMonth?: string;
    internalHrNotes?: string;
    employeeVisibleNotes?: string;
    rejectionReason?: string;
  }) => {
    const now = new Date();
    const timestamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const approverName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;

    setLoanRecords(prev => prev.map(rec => {
      if (rec.id !== id) return rec;

      if (options.action === 'Approve') {
        const approvedAmt = options.approvedAmount ?? rec.requestedAmount;
        const approvedM = options.approvedMonths ?? rec.installmentMonths;
        const emi = options.monthlyDeduction ?? Math.round(approvedAmt / approvedM);
        const startMonth = options.deductionStartMonth || 'Sep 2026';

        const schedule: LoanRepaymentInstallment[] = Array.from({ length: approvedM }).map((_, idx) => {
          return {
            installmentNumber: idx + 1,
            periodMonth: `${startMonth} +${idx}`,
            scheduledAmount: idx === approvedM - 1 ? approvedAmt - (emi * (approvedM - 1)) : emi,
            actualDeducted: 0,
            remainingBalance: Math.max(0, approvedAmt - (emi * (idx + 1))),
            status: 'Pending'
          };
        });

        const isCEO = currentUser.role === 'Super Admin';
        const updatedRec: LoanRecord = {
          ...rec,
          status: 'Approved',
          approvedAmount: approvedAmt,
          approvedMonths: approvedM,
          monthlyDeduction: emi,
          outstandingBalance: approvedAmt,
          deductionStartMonth: startMonth,
          internalHrNotes: options.internalHrNotes || rec.internalHrNotes,
          employeeVisibleNotes: options.employeeVisibleNotes || `Approved for ${formatCurrency(approvedAmt)} across ${approvedM} months.`,
          repaymentSchedule: schedule,
          hrApproval: !isCEO ? {
            approvedBy: approverName,
            approvedAt: timestamp,
            remarks: options.internalHrNotes,
            status: 'Approved'
          } : rec.hrApproval,
          ceoApproval: isCEO ? {
            approvedBy: approverName,
            approvedAt: timestamp,
            remarks: options.internalHrNotes,
            status: 'Approved'
          } : rec.ceoApproval,
          auditLogs: [
            ...rec.auditLogs,
            {
              id: `LOG-${Date.now()}`,
              loanId: rec.id,
              action: 'Request Approved',
              performedBy: approverName,
              performedByRole: currentUser.role,
              timestamp,
              previousValue: `Status: ${rec.status}, Requested: ${formatCurrency(rec.requestedAmount)}`,
              newValue: `Status: Approved, Sanctioned: ${formatCurrency(approvedAmt)} @ ${formatCurrency(emi)}/mo`
            }
          ]
        };
        return updatedRec;
      } else {
        const updatedRec: LoanRecord = {
          ...rec,
          status: 'Rejected',
          rejectionReason: options.rejectionReason || 'Request does not meet current organizational loan criteria.',
          internalHrNotes: options.internalHrNotes,
          auditLogs: [
            ...rec.auditLogs,
            {
              id: `LOG-${Date.now()}`,
              loanId: rec.id,
              action: 'Request Rejected',
              performedBy: approverName,
              performedByRole: currentUser.role,
              timestamp,
              previousValue: `Status: ${rec.status}`,
              newValue: `Status: Rejected. Reason: ${options.rejectionReason || 'Policy criteria not met'}`
            }
          ]
        };
        return updatedRec;
      }
    }));
  };

  const disburseLoan = (id: string, details: {
    disbursedDate: string;
    disbursedAmount: number;
    paymentMode: 'NEFT' | 'IMPS' | 'Cheque' | 'Cash';
    transactionRef?: string;
    notes?: string;
  }) => {
    const officer = `${currentUser.name} (${currentUser.role})`;

    setLoanRecords(prev => prev.map(rec => {
      if (rec.id !== id) return rec;

      const amt = details.disbursedAmount || rec.approvedAmount || rec.requestedAmount;
      const months = rec.approvedMonths || rec.installmentMonths || 3;
      const emi = rec.monthlyDeduction || Math.round(amt / months);
      const startMonth = rec.deductionStartMonth || 'Sep 2026';

      const schedule: LoanRepaymentInstallment[] = Array.from({ length: months }).map((_, idx) => {
        return {
          installmentNumber: idx + 1,
          periodMonth: `${startMonth} +${idx}`,
          scheduledAmount: idx === months - 1 ? amt - (emi * (months - 1)) : emi,
          actualDeducted: 0,
          remainingBalance: Math.max(0, amt - (emi * (idx + 1))),
          status: 'Pending'
        };
      });

      return {
        ...rec,
        status: 'Active',
        disbursedAmount: amt,
        outstandingBalance: amt,
        disbursementDetails: {
          disbursedAt: details.disbursedDate,
          disbursedBy: officer,
          paymentMode: details.paymentMode,
          transactionRef: details.transactionRef,
          notes: details.notes
        },
        repaymentSchedule: schedule,
        auditLogs: [
          ...rec.auditLogs,
          {
            id: `LOG-${Date.now()}`,
            loanId: rec.id,
            action: 'Loan Disbursed',
            performedBy: officer,
            performedByRole: currentUser.role,
            timestamp: `${details.disbursedDate} 12:00 PM`,
            previousValue: 'Status: Approved',
            newValue: `Status: Active, Disbursed ${formatCurrency(amt)} via ${details.paymentMode} Ref: ${details.transactionRef || 'N/A'}`
          }
        ]
      };
    }));
  };

  const recordManualRepayment = (id: string, repayment: {
    amount: number;
    repaymentDate: string;
    paymentMode: 'Cash' | 'Bank Transfer' | 'Cheque' | 'UPI' | 'NEFT' | 'Other';
    referenceNumber?: string;
    notes?: string;
  }) => {
    const recorder = `${currentUser.name} (${currentUser.role})`;

    setLoanRecords(prev => prev.map(rec => {
      if (rec.id !== id) return rec;

      const newBalance = Math.max(0, toNum(rec.outstandingBalance) - repayment.amount);
      const isClosed = newBalance === 0;

      const manualEntry: LoanManualRepayment = {
        id: `PAY-MAN-${Date.now()}`,
        loanId: rec.id,
        amount: repayment.amount,
        repaymentDate: repayment.repaymentDate,
        paymentMode: repayment.paymentMode,
        referenceNumber: repayment.referenceNumber,
        recordedBy: recorder,
        notes: repayment.notes
      };

      const updatedSchedule = rec.repaymentSchedule.map(inst => {
        if (inst.status === 'Pending' && inst.actualDeducted < inst.scheduledAmount) {
          return {
            ...inst,
            actualDeducted: inst.scheduledAmount,
            status: 'Deducted' as const,
            deductedAt: repayment.repaymentDate
          };
        }
        return inst;
      });

      return {
        ...rec,
        outstandingBalance: newBalance,
        status: isClosed ? 'Closed' : rec.status,
        manualRepayments: [...(rec.manualRepayments || []), manualEntry],
        repaymentSchedule: updatedSchedule,
        auditLogs: [
          ...rec.auditLogs,
          {
            id: `LOG-${Date.now()}`,
            loanId: rec.id,
            action: isClosed ? 'Loan Closed (Manual Repayment)' : 'Manual Repayment Added',
            performedBy: recorder,
            performedByRole: currentUser.role,
            timestamp: `${repayment.repaymentDate} 04:00 PM`,
            previousValue: `Outstanding: ${formatCurrency(rec.outstandingBalance)}`,
            newValue: `Outstanding: ${formatCurrency(newBalance)} (Paid ${formatCurrency(repayment.amount)} via ${repayment.paymentMode})`
          }
        ]
      };
    }));
  };

  const updateCompanyInfo = (info: Partial<CompanyInfo>) => {
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    setCompanyInfo(prev => {
      const updated = {
        ...prev,
        ...info,
        updatedAt: new Date().toISOString(),
        updatedBy: userDisplayName
      };
      addPolicyAuditLog({
        policyCategory: 'Company Details',
        policyId: 'COMP-ROOT',
        policyName: updated.companyName,
        action: 'EDIT',
        performedBy: currentUser.name,
        performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
        changeSummary: 'Company general details and profile updated.',
        oldValues: prev,
        newValues: updated
      });
      supabaseDirect.saveCompanySetting('company_info', updated);
      return updated;
    });
  };

  const addCompanyBranch = (branch: Omit<CompanyBranch, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newBranch: CompanyBranch = {
      ...branch,
      id: `BR-${Date.now()}`,
      createdAt: now,
      updatedAt: now
    };
    setCompanyBranches(prev => {
      const updated = [...prev, newBranch];
      supabaseDirect.saveCompanySetting('company_branches', updated);
      return updated;
    });
    addPolicyAuditLog({
      policyCategory: 'Company Details',
      policyId: newBranch.id,
      policyName: newBranch.branchName,
      action: 'CREATE',
      performedBy: currentUser.name,
      performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
      changeSummary: `Created new branch: ${newBranch.branchName} (${newBranch.branchCode}).`
    });
  };

  const updateCompanyBranch = (id: string, updates: Partial<CompanyBranch>) => {
    setCompanyBranches(prev => {
      const updated = prev.map(b => {
        if (b.id === id) {
          const u = { ...b, ...updates, updatedAt: new Date().toISOString() };
          addPolicyAuditLog({
            policyCategory: 'Company Details',
            policyId: id,
            policyName: u.branchName,
            action: 'EDIT',
            performedBy: currentUser.name,
            performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
            changeSummary: `Updated branch details for ${u.branchName}.`
          });
          return u;
        }
        return b;
      });
      supabaseDirect.saveCompanySetting('company_branches', updated);
      return updated;
    });
  };

  const deleteCompanyBranch = (id: string) => {
    const target = companyBranches.find(b => b.id === id);
    setCompanyBranches(prev => {
      const updated = prev.filter(b => b.id !== id);
      supabaseDirect.saveCompanySetting('company_branches', updated);
      return updated;
    });
    if (target) {
      addPolicyAuditLog({
        policyCategory: 'Company Details',
        policyId: id,
        policyName: target.branchName,
        action: 'DEACTIVATE',
        performedBy: currentUser.name,
        performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
        changeSummary: `Removed branch: ${target.branchName}.`
      });
    }
  };

  const updateOrgStructure = (structure: Partial<OrganizationStructure>) => {
    setOrgStructure(prev => {
      const nextOrg = { ...prev, ...structure };
      supabaseDirect.saveCompanySetting('org_structure', nextOrg);
      return nextOrg;
    });

    // Cloud-persist newly added departments to Supabase departments table
    if (structure.departments && Array.isArray(structure.departments)) {
      structure.departments.forEach(deptName => {
        if (deptName && deptName.trim()) {
          supabaseDirect.insertDepartment(deptName.trim());
        }
      });
    }

    // Synchronize departments (DepartmentItem[]) with orgStructure.departments
    if (structure.departments) {
      setDepartments(prev => {
        const existingMap = new Map(prev.map(d => [d.name, d]));
        return structure.departments!.map(name => {
          if (existingMap.has(name)) return existingMap.get(name)!;
          return {
            id: `dept-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            name,
            code: name.substring(0, 4).toUpperCase(),
            headName: 'Unassigned',
            headId: '',
            employeeCount: 0,
            budget: 0
          };
        });
      });
    }

    // Synchronize designations (DesignationItem[]) with orgStructure.designations
    if (structure.designations) {
      setDesignations(prev => {
        const existingMap = new Map(prev.map(d => [d.title, d]));
        return structure.designations!.map(title => {
          if (existingMap.has(title)) return existingMap.get(title)!;
          return {
            id: `desig-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            title,
            department: 'General',
            level: 'Staff'
          };
        });
      });
    }
  };

  const editDepartment = (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;
    const cleanNew = newName.trim();
    setOrgStructure(prev => {
      const updated = {
        ...prev,
        departments: prev.departments.map(d => d === oldName ? cleanNew : d)
      };
      supabaseDirect.saveCompanySetting('org_structure', updated);
      return updated;
    });
    setDepartments(prev => prev.map(d => d.name === oldName ? { ...d, name: cleanNew, code: cleanNew.substring(0, 4).toUpperCase() } : d));
    // Cascade to existing employees
    setEmployees(prev => prev.map(emp => emp.department === oldName ? { ...emp, department: cleanNew } : emp));
    supabaseDirect.updateDepartment(oldName, cleanNew);
    addPolicyAuditLog({
      policyCategory: 'Company Details',
      policyId: `dept-${cleanNew.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      policyName: `Department: ${cleanNew}`,
      action: 'EDIT',
      performedBy: currentUser.name,
      performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
      changeSummary: `Renamed department from "${oldName}" to "${cleanNew}".`
    });
  };

  const removeOrgDepartment = (name: string) => {
    setOrgStructure(prev => {
      const updated = {
        ...prev,
        departments: prev.departments.filter(d => d !== name)
      };
      supabaseDirect.saveCompanySetting('org_structure', updated);
      return updated;
    });
    setDepartments(prev => prev.filter(d => d.name !== name));
    supabaseDirect.deleteDepartment(name);
    addPolicyAuditLog({
      policyCategory: 'Company Details',
      policyId: `dept-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      policyName: `Department: ${name}`,
      action: 'DEACTIVATE',
      performedBy: currentUser.name,
      performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
      changeSummary: `Removed department "${name}".`
    });
  };

  const editDesignation = (oldTitle: string, newTitle: string) => {
    if (!newTitle.trim() || oldTitle === newTitle) return;
    const cleanNew = newTitle.trim();
    setOrgStructure(prev => {
      const updated = {
        ...prev,
        designations: prev.designations.map(d => d === oldTitle ? cleanNew : d)
      };
      supabaseDirect.saveCompanySetting('org_structure', updated);
      return updated;
    });
    setDesignations(prev => prev.map(d => d.title === oldTitle ? { ...d, title: cleanNew } : d));
    // Cascade to existing employees
    setEmployees(prev => prev.map(emp => emp.designation === oldTitle ? { ...emp, designation: cleanNew } : emp));
    addPolicyAuditLog({
      policyCategory: 'Company Details',
      policyId: `desig-${cleanNew.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      policyName: `Designation: ${cleanNew}`,
      action: 'EDIT',
      performedBy: currentUser.name,
      performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
      changeSummary: `Renamed designation from "${oldTitle}" to "${cleanNew}".`
    });
  };

  const removeOrgDesignation = (title: string) => {
    setOrgStructure(prev => {
      const updated = {
        ...prev,
        designations: prev.designations.filter(d => d !== title)
      };
      supabaseDirect.saveCompanySetting('org_structure', updated);
      return updated;
    });
    setDesignations(prev => prev.filter(d => d.title !== title));
    addPolicyAuditLog({
      policyCategory: 'Company Details',
      policyId: `desig-${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      policyName: `Designation: ${title}`,
      action: 'DEACTIVATE',
      performedBy: currentUser.name,
      performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
      changeSummary: `Removed designation "${title}".`
    });
  };

  const editEmploymentType = (oldType: string, newType: string) => {
    if (!newType.trim() || oldType === newType) return;
    const cleanNew = newType.trim();
    setOrgStructure(prev => {
      const updated = {
        ...prev,
        employmentTypes: prev.employmentTypes.map(t => t === oldType ? cleanNew : t)
      };
      supabaseDirect.saveCompanySetting('org_structure', updated);
      return updated;
    });
    setEmployees(prev => prev.map(emp => emp.employmentType === oldType ? { ...emp, employmentType: cleanNew as any } : emp));
  };

  const removeOrgEmploymentType = (type: string) => {
    setOrgStructure(prev => {
      const updated = {
        ...prev,
        employmentTypes: prev.employmentTypes.filter(t => t !== type)
      };
      supabaseDirect.saveCompanySetting('org_structure', updated);
      return updated;
    });
  };

  const editWorkLocation = (oldLoc: string, newLoc: string) => {
    if (!newLoc.trim() || oldLoc === newLoc) return;
    const cleanNew = newLoc.trim();
    setOrgStructure(prev => {
      const updated = {
        ...prev,
        workLocations: prev.workLocations.map(l => l === oldLoc ? cleanNew : l)
      };
      supabaseDirect.saveCompanySetting('org_structure', updated);
      return updated;
    });
  };

  const removeOrgWorkLocation = (loc: string) => {
    setOrgStructure(prev => {
      const updated = {
        ...prev,
        workLocations: prev.workLocations.filter(l => l !== loc)
      };
      supabaseDirect.saveCompanySetting('org_structure', updated);
      return updated;
    });
  };

  const loadCompanyPreset = (preset: 'VRM' | 'BLANK') => {
    if (preset === 'VRM') {
      setCompanyInfo(INITIAL_COMPANY_INFO);
      setCompanyBranches(INITIAL_COMPANY_BRANCHES);
      setOrgStructure(INITIAL_ORG_STRUCTURE);
      setDepartments(INITIAL_DEPTS);
      setDesignations(INITIAL_DESIGNATIONS);
      setMasterAttendancePolicies(DEFAULT_MASTER_ATTENDANCE_POLICIES);
      setMasterLeavePolicies(DEFAULT_MASTER_LEAVE_POLICIES);
      setPayrollSettingsConfig(INITIAL_PAYROLL_CONFIG);
      setLoanPolicies(DEFAULT_LOAN_POLICIES);
      setGeofenceConfig(INITIAL_GEOFENCE_CONFIG);
      try {
        localStorage.removeItem('vrm_hrms_company_info');
        localStorage.removeItem('vrm_hrms_company_branches');
        localStorage.removeItem('vrm_hrms_org_structure');
        localStorage.removeItem('vrm_hrms_departments');
        localStorage.removeItem('vrm_hrms_designations');
        localStorage.removeItem('vrm_hrms_master_attendance_policies');
        localStorage.removeItem('vrm_hrms_master_leave_policies');
        localStorage.removeItem('vrm_hrms_payroll_settings_config');
        localStorage.removeItem('vrm_hrms_loan_policies');
        localStorage.removeItem('vrm_hrms_geofence_config');
      } catch {}
    } else {
      const blankCompany: CompanyInfo = {
        logoUrl: '',
        companyName: 'New Client Enterprise',
        legalCompanyName: 'New Client Enterprise Private Limited',
        companyType: 'Private Limited',
        industry: 'General Business & Technology',
        registrationNumber: '',
        gstNumber: '',
        panNumber: '',
        cinNumber: '',
        website: 'https://example.com',
        officialEmail: 'corporate@example.com',
        officialPhone: '',
        createdAt: new Date().toISOString(),
        createdBy: currentUser.name,
        updatedAt: new Date().toISOString(),
        updatedBy: currentUser.name
      };
      const blankOrg: OrganizationStructure = {
        departments: ['Administration', 'Human Resources', 'Operations', 'Finance & Accounts', 'Sales & Marketing', 'IT & Engineering'],
        designations: ['Managing Director', 'Department Head', 'Team Lead', 'Senior Associate', 'Staff Executive', 'Trainee'],
        employmentTypes: ['Full-Time Regular', 'Contractual Basis', 'Probationary', 'Internship'],
        workLocations: ['Main Head Office', 'Branch Office 1'],
        reportingManagers: [],
        teams: []
      };
      setCompanyInfo(blankCompany);
      setOrgStructure(blankOrg);
      updateOrgStructure(blankOrg);
    }
  };

  // Attendance Policies
  const addMasterAttendancePolicy = (policy: Omit<AttendancePolicy, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'createdBy' | 'updatedBy'>) => {
    const now = new Date().toISOString();
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    const newPolicy: AttendancePolicy = {
      ...policy,
      id: `AP-${Date.now()}`,
      version: 1,
      createdAt: now,
      createdBy: userDisplayName,
      updatedAt: now,
      updatedBy: userDisplayName
    };
    setMasterAttendancePolicies(prev => [newPolicy, ...prev]);
    addPolicyAuditLog({
      policyCategory: 'Attendance & Time',
      policyId: newPolicy.id,
      policyName: newPolicy.policyName,
      action: 'CREATE',
      performedBy: currentUser.name,
      performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
      changeSummary: `Created attendance policy "${newPolicy.policyName}" with ${newPolicy.lateRuleType} late rule.`
    });
  };

  const updateMasterAttendancePolicy = (id: string, updates: Partial<AttendancePolicy>) => {
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    setMasterAttendancePolicies(prev => prev.map(p => {
      if (p.id === id) {
        const updated = {
          ...p,
          ...updates,
          version: p.version + 1,
          updatedAt: new Date().toISOString(),
          updatedBy: userDisplayName
        };
        addPolicyAuditLog({
          policyCategory: 'Attendance & Time',
          policyId: id,
          policyName: updated.policyName,
          action: 'EDIT',
          performedBy: currentUser.name,
          performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
          changeSummary: `Updated attendance policy "${updated.policyName}" (version ${updated.version}).`,
          oldValues: p,
          newValues: updated
        });
        return updated;
      }
      return p;
    }));
  };

  const archiveMasterAttendancePolicy = (id: string) => {
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    setMasterAttendancePolicies(prev => prev.map(p => {
      if (p.id === id) {
        const updated: AttendancePolicy = { ...p, status: 'Archived', updatedAt: new Date().toISOString(), updatedBy: userDisplayName };
        addPolicyAuditLog({
          policyCategory: 'Attendance & Time',
          policyId: id,
          policyName: p.policyName,
          action: 'ARCHIVE',
          performedBy: currentUser.name,
          performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
          changeSummary: `Archived attendance policy "${p.policyName}". Historical payroll records preserved.`
        });
        return updated;
      }
      return p;
    }));
  };

  const toggleMasterAttendancePolicyStatus = (id: string) => {
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    setMasterAttendancePolicies(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'Active' ? 'Inactive' : 'Active';
        const updated: AttendancePolicy = { ...p, status: nextStatus, updatedAt: new Date().toISOString(), updatedBy: userDisplayName };
        addPolicyAuditLog({
          policyCategory: 'Attendance & Time',
          policyId: id,
          policyName: p.policyName,
          action: nextStatus === 'Active' ? 'ACTIVATE' : 'DEACTIVATE',
          performedBy: currentUser.name,
          performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
          changeSummary: `${nextStatus === 'Active' ? 'Activated' : 'Deactivated'} attendance policy "${p.policyName}".`
        });
        return updated;
      }
      return p;
    }));
  };

  // Missed Attendance Correction Flow
  const submitAttendanceCorrection = (req: Omit<AttendanceCorrectionRequest, 'id' | 'submittedAt' | 'status'>) => {
    const newReq: AttendanceCorrectionRequest = {
      ...req,
      id: `ACR-${Date.now()}`,
      submittedAt: new Date().toISOString(),
      status: 'Pending'
    };
    setAttendanceCorrections(prev => [newReq, ...prev]);
    triggerToast('Attendance correction request submitted to HR for review.');
  };

  const reviewAttendanceCorrection = (
    id: string, 
    decision: 'Approved' | 'Rejected', 
    comment?: string, 
    adjustedTime?: { checkIn?: string; checkOut?: string }
  ) => {
    const target = attendanceCorrections.find(c => c.id === id);
    if (!target) return;

    const reviewerName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : 'HR'})`;
    const now = new Date().toISOString();

    setAttendanceCorrections(prev => prev.map(c => {
      if (c.id === id) {
        return {
          ...c,
          status: decision,
          reviewedBy: reviewerName,
          reviewedAt: now,
          hrComment: comment || (decision === 'Approved' ? 'Approved by HR' : 'Rejected by HR'),
          adjustedCheckIn: adjustedTime?.checkIn || c.requestedCheckIn,
          adjustedCheckOut: adjustedTime?.checkOut || c.requestedCheckOut
        };
      }
      return c;
    }));

    // When Approved: The Attendance Record MUST Automatically Update!
    if (decision === 'Approved') {
      const checkInVal = adjustedTime?.checkIn || target.requestedCheckIn || '09:30';
      const checkOutVal = adjustedTime?.checkOut || target.requestedCheckOut || '18:30';

      setAttendanceRecords(prev => {
        const existingIdx = prev.findIndex(r => r.employeeId === target.employeeId && r.date === target.date);
        if (existingIdx >= 0) {
          const updated = [...prev];
          updated[existingIdx] = {
            ...updated[existingIdx],
            checkIn: checkInVal,
            checkOut: checkOutVal,
            status: 'Present',
            lateStatus: 'On Time',
            method: 'Manual Punch'
          };
          return updated;
        } else {
          // Create new record for the date if not exists
          const newAtt: AttendanceRecord = {
            id: `ATT-${Date.now()}`,
            employeeId: target.employeeId,
            employeeName: target.employeeName,
            department: target.department,
            date: target.date,
            checkIn: checkInVal,
            checkOut: checkOutVal,
            workingHours: 8.5,
            status: 'Present',
            lateStatus: 'On Time',
            location: {
              lat: 13.0827,
              lng: 80.2707,
              address: 'Head Office - Corrected by HR',
              inGeofence: true
            },
            faceVerified: true,
            method: 'Manual Punch'
          };
          return [newAtt, ...prev];
        }
      });

      triggerToast(`Correction Approved: Attendance for ${target.employeeName} updated to Check-in ${checkInVal}.`);
    } else {
      triggerToast(`Attendance correction request for ${target.employeeName} was rejected.`);
    }
  };

  // Master Leave Policies
  const addMasterLeavePolicy = (policy: Omit<MasterLeavePolicy, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'createdBy' | 'updatedBy'>) => {
    const now = new Date().toISOString();
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    const newPolicy: MasterLeavePolicy = {
      ...policy,
      id: `LP-${Date.now()}`,
      version: 1,
      createdAt: now,
      createdBy: userDisplayName,
      updatedAt: now,
      updatedBy: userDisplayName
    };
    setMasterLeavePolicies(prev => [newPolicy, ...prev]);
    addPolicyAuditLog({
      policyCategory: 'Leave Management',
      policyId: newPolicy.id,
      policyName: newPolicy.policyName,
      action: 'CREATE',
      performedBy: currentUser.name,
      performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
      changeSummary: `Created master leave policy "${newPolicy.policyName}" with ${newPolicy.monthlyFreeUnpaidLeaves} free unpaid day(s).`
    });
  };

  const updateMasterLeavePolicy = (id: string, updates: Partial<MasterLeavePolicy>) => {
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    setMasterLeavePolicies(prev => prev.map(p => {
      if (p.id === id) {
        const updated = {
          ...p,
          ...updates,
          version: p.version + 1,
          updatedAt: new Date().toISOString(),
          updatedBy: userDisplayName
        };
        addPolicyAuditLog({
          policyCategory: 'Leave Management',
          policyId: id,
          policyName: updated.policyName,
          action: 'EDIT',
          performedBy: currentUser.name,
          performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
          changeSummary: `Updated leave policy "${updated.policyName}" (version ${updated.version}).`,
          oldValues: p,
          newValues: updated
        });
        return updated;
      }
      return p;
    }));
  };

  const archiveMasterLeavePolicy = (id: string) => {
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    setMasterLeavePolicies(prev => prev.map(p => {
      if (p.id === id) {
        const updated: MasterLeavePolicy = { ...p, status: 'Archived', updatedAt: new Date().toISOString(), updatedBy: userDisplayName };
        addPolicyAuditLog({
          policyCategory: 'Leave Management',
          policyId: id,
          policyName: p.policyName,
          action: 'ARCHIVE',
          performedBy: currentUser.name,
          performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
          changeSummary: `Archived leave policy "${p.policyName}". Historical records preserved.`
        });
        return updated;
      }
      return p;
    }));
  };

  const toggleMasterLeavePolicyStatus = (id: string) => {
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    setMasterLeavePolicies(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'Active' ? 'Inactive' : 'Active';
        const updated: MasterLeavePolicy = { ...p, status: nextStatus, updatedAt: new Date().toISOString(), updatedBy: userDisplayName };
        addPolicyAuditLog({
          policyCategory: 'Leave Management',
          policyId: id,
          policyName: p.policyName,
          action: nextStatus === 'Active' ? 'ACTIVATE' : 'DEACTIVATE',
          performedBy: currentUser.name,
          performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
          changeSummary: `${nextStatus === 'Active' ? 'Activated' : 'Deactivated'} leave policy "${p.policyName}".`
        });
        return updated;
      }
      return p;
    }));
  };

  const deleteMasterLeavePolicy = (id: string) => {
    const policyToDelete = masterLeavePolicies.find(p => p.id === id);
    setMasterLeavePolicies(prev => prev.filter(p => p.id !== id));
    if (policyToDelete) {
      addPolicyAuditLog({
        policyCategory: 'Leave Management',
        policyId: id,
        policyName: policyToDelete.policyName,
        action: 'DELETE',
        performedBy: currentUser.name,
        performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
        changeSummary: `Permanently deleted leave policy "${policyToDelete.policyName}".`
      });
    }
  };

  const resetMasterLeavePoliciesToDefault = () => {
    setMasterLeavePolicies(DEFAULT_MASTER_LEAVE_POLICIES);
    addPolicyAuditLog({
      policyCategory: 'Leave Management',
      policyId: 'SYSTEM-RESET',
      policyName: 'Standard Company Leave Policies',
      action: 'EDIT',
      performedBy: currentUser.name,
      performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
      changeSummary: 'Reset leave policies to standard Confirmed (1 Day/Month Paid) and Provisional (1 Paid/3 Months) policies.'
    });
  };

  // ==========================================
  // SANDWICH LEAVE POLICY ENGINE HANDLERS
  // ==========================================
  const createSandwichPolicy = (policyData: Omit<SandwichLeavePolicy, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'createdBy' | 'updatedBy'>) => {
    const now = new Date().toISOString();
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    const newPolicy: SandwichLeavePolicy = {
      ...policyData,
      id: `SLP-${Date.now()}`,
      version: 1,
      createdAt: now,
      createdBy: userDisplayName,
      updatedAt: now,
      updatedBy: userDisplayName
    };

    setSandwichPolicies(prev => [newPolicy, ...prev]);

    addSandwichAuditLog({
      action: 'POLICY_CREATED',
      policyId: newPolicy.id,
      policyName: newPolicy.policyName,
      newValue: {
        sandwichRuleEnabled: newPolicy.sandwichRuleEnabled,
        weeklyOff: newPolicy.countWeeklyOffAsLeave,
        publicHoliday: newPolicy.countPublicHolidayAsLeave,
        condition: newPolicy.sandwichCondition,
        payType: newPolicy.payType,
        applicableLeaveTypes: newPolicy.applicableLeaveTypes
      },
      reason: `Created sandwich leave policy "${newPolicy.policyName}" (v1).`
    });

    addPolicyAuditLog({
      policyCategory: 'Leave Management',
      policyId: newPolicy.id,
      policyName: newPolicy.policyName,
      action: 'CREATE',
      performedBy: currentUser.name,
      performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
      changeSummary: `Created sandwich leave policy "${newPolicy.policyName}" (Condition: ${newPolicy.sandwichCondition}).`
    });
  };

  const updateSandwichPolicy = (id: string, updates: Partial<SandwichLeavePolicy>, reason?: string) => {
    const now = new Date().toISOString();
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;

    setSandwichPolicies(prev => prev.map(p => {
      if (p.id === id) {
        const nextVersion = p.version + 1;
        const updated: SandwichLeavePolicy = {
          ...p,
          ...updates,
          version: nextVersion,
          updatedAt: now,
          updatedBy: userDisplayName
        };

        addSandwichAuditLog({
          action: 'POLICY_UPDATED',
          policyId: id,
          policyName: updated.policyName,
          oldValue: { version: p.version, ruleEnabled: p.sandwichRuleEnabled, condition: p.sandwichCondition, payType: p.payType },
          newValue: { version: nextVersion, ruleEnabled: updated.sandwichRuleEnabled, condition: updated.sandwichCondition, payType: updated.payType },
          reason: reason || `Updated sandwich leave policy "${updated.policyName}" to version ${nextVersion}. Historical records preserved.`
        });

        addPolicyAuditLog({
          policyCategory: 'Leave Management',
          policyId: id,
          policyName: updated.policyName,
          action: 'EDIT',
          performedBy: currentUser.name,
          performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
          changeSummary: `Updated sandwich policy "${updated.policyName}" to version ${nextVersion}.`,
          oldValues: p,
          newValues: updated
        });

        return updated;
      }
      return p;
    }));
  };

  const archiveSandwichPolicy = (id: string) => {
    const now = new Date().toISOString();
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;

    setSandwichPolicies(prev => prev.map(p => {
      if (p.id === id) {
        const updated: SandwichLeavePolicy = {
          ...p,
          status: 'Archived',
          updatedAt: now,
          updatedBy: userDisplayName
        };

        addSandwichAuditLog({
          action: 'POLICY_ARCHIVED',
          policyId: id,
          policyName: p.policyName,
          reason: `Archived sandwich policy "${p.policyName}". Historical approved records preserved.`
        });

        return updated;
      }
      return p;
    }));
  };

  const toggleSandwichPolicyStatus = (id: string) => {
    const now = new Date().toISOString();
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;

    setSandwichPolicies(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'Active' ? 'Inactive' : 'Active';
        const updated: SandwichLeavePolicy = {
          ...p,
          status: nextStatus,
          updatedAt: now,
          updatedBy: userDisplayName
        };

        addSandwichAuditLog({
          action: nextStatus === 'Active' ? 'POLICY_ACTIVATED' : 'POLICY_DEACTIVATED',
          policyId: id,
          policyName: p.policyName,
          reason: `${nextStatus === 'Active' ? 'Activated' : 'Deactivated'} sandwich leave policy.`
        });

        return updated;
      }
      return p;
    }));
  };

  const deleteSandwichPolicy = (id: string) => {
    setSandwichPolicies(prev => prev.filter(p => p.id !== id));
  };

  const computeSandwichCalculation = (params: {
    employeeId: string;
    leaveType: string;
    startDate: string;
    endDate: string;
  }): SandwichCalculationResult => {
    const emp = employees.find(e => e.employeeId === params.employeeId) || employees[0];
    return calculateSandwichLeave({
      employee: emp,
      leaveType: params.leaveType,
      startDate: params.startDate,
      endDate: params.endDate,
      policies: sandwichPolicies,
      holidays: holidayPolicies,
      existingLeaves: leaveRequests,
      weeklyOffSchedule: emp.shiftDetails?.weeklyOff
    });
  };

  const overrideSandwichCalculation = (leaveRequestId: string, overrideData: {
    excludedDates?: string[];
    includedDates?: string[];
    adjustedPayType?: SandwichPayType;
    adjustedDaysCount?: number;
    internalReason: string;
  }) => {
    const now = new Date().toISOString();
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;

    setLeaveRequests(prev => prev.map(l => {
      if (l.id === leaveRequestId) {
        const origSandwichDays = l.sandwichDays || 0;
        const origTotal = l.daysCount;
        
        let newBreakdown = l.sandwichDetails?.breakdown ? [...l.sandwichDetails.breakdown] : [];
        const excluded = overrideData.excludedDates || [];
        const included = overrideData.includedDates || [];

        newBreakdown = newBreakdown.map(b => {
          if (excluded.includes(b.date)) {
            return {
              ...b,
              isSandwich: false,
              dayType: b.dayType === 'SANDWICH_LEAVE' ? ('WEEKLY_OFF' as const) : b.dayType,
              reason: 'Manually excluded by HR override'
            };
          }
          if (included.includes(b.date)) {
            return {
              ...b,
              isSandwich: true,
              dayType: 'SANDWICH_LEAVE' as const,
              reason: 'Manually included by HR override'
            };
          }
          if (overrideData.adjustedPayType) {
            return {
              ...b,
              isPaid: overrideData.adjustedPayType === 'PAID_LEAVE' ? true : (overrideData.adjustedPayType === 'UNPAID_LEAVE' ? false : b.isPaid)
            };
          }
          return b;
        });

        const newSandwichCount = newBreakdown.filter(b => b.isSandwich).length;
        const appliedCount = newBreakdown.filter(b => b.dayType === 'APPLIED_LEAVE').length;
        const newTotalDays = overrideData.adjustedDaysCount !== undefined ? overrideData.adjustedDaysCount : (appliedCount + newSandwichCount);
        const newUnpaidSandwich = newBreakdown.filter(b => b.isSandwich && !b.isPaid).length;

        const hrOverride: HROverrideDetails = {
          isOverridden: true,
          overriddenBy: userDisplayName,
          overriddenAt: now,
          originalSandwichDays: origSandwichDays,
          originalTotalDays: origTotal,
          adjustedDaysCount: newTotalDays,
          excludedDates: excluded,
          includedDates: included,
          adjustedPayType: overrideData.adjustedPayType,
          internalReason: overrideData.internalReason
        };

        const updatedRequest: LeaveRequest = {
          ...l,
          daysCount: newTotalDays,
          sandwichDays: newSandwichCount,
          unpaidSandwichDays: newUnpaidSandwich,
          isSandwichApplied: newSandwichCount > 0,
          hrOverride,
          sandwichDetails: l.sandwichDetails ? {
            ...l.sandwichDetails,
            sandwichDays: newSandwichCount,
            totalDays: newTotalDays,
            breakdown: newBreakdown,
            payTypeApplied: overrideData.adjustedPayType || l.sandwichDetails.payTypeApplied
          } : undefined
        };

        addSandwichAuditLog({
          action: 'HR_OVERRIDE',
          leaveRequestId,
          employeeId: l.employeeId,
          oldValue: { originalDaysCount: origTotal, originalSandwichDays: origSandwichDays },
          newValue: { adjustedDaysCount: newTotalDays, adjustedSandwichDays: newSandwichCount, excluded, included, payType: overrideData.adjustedPayType },
          reason: overrideData.internalReason
        });

        return updatedRequest;
      }
      return l;
    }));

    triggerToast('HR Override successfully applied to leave calculation.');
  };

  // Payroll Settings Config
  const updatePayrollSettingsConfig = (config: Partial<PayrollSettingsConfig>) => {
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    setPayrollSettingsConfig(prev => {
      const updated = {
        ...prev,
        ...config,
        updatedAt: new Date().toISOString(),
        updatedBy: userDisplayName
      };
      addPolicyAuditLog({
        policyCategory: 'Payroll Settings',
        policyId: 'PAYROLL-MASTER-CONFIG',
        policyName: 'Global Payroll Policy & Components',
        action: 'EDIT',
        performedBy: currentUser.name,
        performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
        changeSummary: 'Updated global payroll components and formula rules.',
        oldValues: prev,
        newValues: updated
      });
      // Direct immediate cloud save
      supabaseDirect.saveCompanySetting('payroll_settings_config', updated);
      return updated;
    });
  };

  const toggleSalaryComponent = (code: string) => {
    setPayrollSettingsConfig(prev => {
      const updated = {
        ...prev,
        components: prev.components.map(c => c.code === code ? { ...c, active: !c.active } : c),
        updatedAt: new Date().toISOString()
      };
      // Direct immediate cloud save
      supabaseDirect.saveCompanySetting('payroll_settings_config', updated);
      return updated;
    });
  };

  // Rewards & Recognition
  const addRewardPolicy = (policy: Omit<RewardPolicy, 'id' | 'createdAt' | 'updatedAt' | 'version' | 'createdBy' | 'updatedBy'>) => {
    const now = new Date().toISOString();
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    const newPolicy: RewardPolicy = {
      ...policy,
      id: `RP-${Date.now()}`,
      version: 1,
      createdAt: now,
      createdBy: userDisplayName,
      updatedAt: now,
      updatedBy: userDisplayName
    };
    setRewardPolicies(prev => [newPolicy, ...prev]);
    addPolicyAuditLog({
      policyCategory: 'Rewards & Recognition',
      policyId: newPolicy.id,
      policyName: newPolicy.rewardName,
      action: 'CREATE',
      performedBy: currentUser.name,
      performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
      changeSummary: `Created reward policy "${newPolicy.rewardName}" (${newPolicy.valueType === 'FIXED_AMOUNT' ? formatCurrency(newPolicy.amountValue || 0) : newPolicy.valueType}, Add to Payroll: ${newPolicy.addToPayroll ? 'Yes' : 'No'}).`
    });
  };

  const updateRewardPolicy = (id: string, updates: Partial<RewardPolicy>) => {
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    setRewardPolicies(prev => prev.map(p => {
      if (p.id === id) {
        const updated = {
          ...p,
          ...updates,
          version: p.version + 1,
          updatedAt: new Date().toISOString(),
          updatedBy: userDisplayName
        };
        addPolicyAuditLog({
          policyCategory: 'Rewards & Recognition',
          policyId: id,
          policyName: updated.rewardName,
          action: 'EDIT',
          performedBy: currentUser.name,
          performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
          changeSummary: `Updated reward policy "${updated.rewardName}".`,
          oldValues: p,
          newValues: updated
        });
        return updated;
      }
      return p;
    }));
  };

  const archiveRewardPolicy = (id: string) => {
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    setRewardPolicies(prev => prev.map(p => {
      if (p.id === id) {
        const updated: RewardPolicy = { ...p, status: 'Archived', updatedAt: new Date().toISOString(), updatedBy: userDisplayName };
        addPolicyAuditLog({
          policyCategory: 'Rewards & Recognition',
          policyId: id,
          policyName: p.rewardName,
          action: 'ARCHIVE',
          performedBy: currentUser.name,
          performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
          changeSummary: `Archived reward policy "${p.rewardName}".`
        });
        return updated;
      }
      return p;
    }));
  };

  const toggleRewardPolicyStatus = (id: string) => {
    const userDisplayName = `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`;
    setRewardPolicies(prev => prev.map(p => {
      if (p.id === id) {
        const nextStatus = p.status === 'Active' ? 'Inactive' : 'Active';
        const updated: RewardPolicy = { ...p, status: nextStatus, updatedAt: new Date().toISOString(), updatedBy: userDisplayName };
        addPolicyAuditLog({
          policyCategory: 'Rewards & Recognition',
          policyId: id,
          policyName: p.rewardName,
          action: nextStatus === 'Active' ? 'ACTIVATE' : 'DEACTIVATE',
          performedBy: currentUser.name,
          performedByRole: currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role,
          changeSummary: `${nextStatus === 'Active' ? 'Activated' : 'Deactivated'} reward policy "${p.rewardName}".`
        });
        return updated;
      }
      return p;
    }));
  };

  const grantRewardToEmployee = (grant: Omit<EmployeeRewardRecord, 'id' | 'grantedDate' | 'payrollStatus'>) => {
    const now = new Date();
    const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const newRecord: EmployeeRewardRecord = {
      ...grant,
      id: `ERR-${Date.now()}`,
      grantedDate: dateStr,
      payrollStatus: 'Pending'
    };
    setEmployeeRewardRecords(prev => [newRecord, ...prev]);
    triggerToast(`Award granted: "${grant.rewardName}" for ${grant.employeeName}${grant.addToPayroll ? ' (Queued for Next Payroll)' : ''}!`);
  };

  const [grades, setGrades] = useState<GradeItem[]>(INITIAL_GRADES);

  const [employmentTypes, setEmploymentTypes] = useState<EmploymentTypeItem[]>(INITIAL_EMPLOYMENT_TYPES);

  const [employeeCategories, setEmployeeCategories] = useState<EmployeeCategoryItem[]>(INITIAL_EMPLOYEE_CATEGORIES);

  const [employeeConfig, setEmployeeConfig] = useState<EmployeeConfigSettings>(INITIAL_EMPLOYEE_CONFIG);

  const [approvalWorkflows, setApprovalWorkflows] = useState<ApprovalWorkflowItem[]>(INITIAL_APPROVAL_WORKFLOWS);

  const [notificationTriggers, setNotificationTriggers] = useState<NotificationTriggerConfig[]>(INITIAL_NOTIFICATION_TRIGGERS);

  const [generalSystemConfig, setGeneralSystemConfig] = useState<GeneralSystemConfig>(INITIAL_GENERAL_SYSTEM_CONFIG);

  const [integrationsConfig, setIntegrationsConfig] = useState<IntegrationsConfig>(INITIAL_INTEGRATIONS_CONFIG);

  // Dynamic Performance Score Integration:
  // Dynamically recalculate task completion rates and overall scores from live enhanced tasks
  useEffect(() => {
    setPerformanceScores(prev => prev.map(p => {
      const metrics = calculateEmployeeTaskMetrics(p.employeeId, enhancedTasks);
      if (metrics.totalAssigned === 0) return p;

      const compScore = (metrics.completionRate * taskWeights.taskCompletionWeight) / 100;
      const onTimeScore = (metrics.onTimeCompletionRate * taskWeights.onTimeCompletionWeight) / 100;
      const attScore = (p.attendanceScore * taskWeights.attendanceWeight) / 100;
      const managerScore = ((p.managerRating / 5) * 100 * taskWeights.managerRatingWeight) / 100;
      const goalScore = (p.goalAchievement * taskWeights.goalAchievementWeight) / 100;

      const newOverallScore = Math.min(100, Math.max(0, Math.round(compScore + onTimeScore + attScore + managerScore + goalScore)));

      return {
        ...p,
        taskCompletionRate: metrics.completionRate,
        overallScore: newOverallScore
      };
    }));
  }, [enhancedTasks, taskWeights]);

  // Role Switching Engine supporting all HRMS and Task Management roles
  const switchRole = (newRole: Role) => {
    let name = 'Businz Super Admin';
    let email = 'admin@businz.com';
    let empId = 'EMP-000';
    let dept = 'Management';
    let desig = 'Super Administrator';
    let avatar = '';

    if (newRole === 'Super Admin') {
      name = 'Businz Super Admin';
      email = 'admin@businz.com';
      empId = 'EMP-000';
      dept = 'Management';
      desig = 'Super Administrator';
      avatar = '';
    } else if (newRole === 'CEO' || newRole === 'Management') {
      const ceoEmp = employees.find(e => e.designation?.toLowerCase().includes('ceo') || e.role === 'CEO');
      name = ceoEmp ? `${ceoEmp.firstName} ${ceoEmp.lastName}`.trim() : 'Executive CEO';
      email = ceoEmp?.email || 'ceo@businz.com';
      empId = ceoEmp?.employeeId || 'EMP-CEO';
      dept = ceoEmp?.department || 'Management';
      desig = ceoEmp?.designation || 'CEO';
      avatar = ceoEmp?.avatar || '';
    } else if (newRole === 'HR Admin' || newRole === 'HR Manager') {
      const hrEmp = employees.find(e => (e.department === 'HR' || e.designation.toLowerCase().includes('hr')) && !e.designation.toLowerCase().includes('ceo'));
      name = hrEmp ? `${hrEmp.firstName} ${hrEmp.lastName}`.trim() : 'HR Manager';
      email = hrEmp?.email || 'hr@businz.com';
      empId = hrEmp?.employeeId || 'EMP-HR';
      dept = 'HR';
      desig = hrEmp?.designation || 'HR Manager';
      avatar = hrEmp?.avatar || '';
    } else if (newRole === 'Department Manager' || newRole === 'Department Head') {
      const mgrEmp = employees.find(e => e.designation.toLowerCase().includes('head') || e.designation.toLowerCase().includes('manager'));
      name = mgrEmp ? `${mgrEmp.firstName} ${mgrEmp.lastName}`.trim() : 'Department Manager';
      email = mgrEmp?.email || 'manager@businz.com';
      empId = mgrEmp?.employeeId || 'EMP-MGR';
      dept = mgrEmp?.department || 'Operations';
      desig = mgrEmp?.designation || 'Department Head';
      avatar = mgrEmp?.avatar || '';
    } else if (newRole === 'Employee' || newRole === 'Assignee') {
      const staffEmp = employees.find(e => !e.designation.toLowerCase().includes('ceo') && !e.designation.toLowerCase().includes('super'));
      name = staffEmp ? `${staffEmp.firstName} ${staffEmp.lastName}`.trim() : 'Staff Employee';
      email = staffEmp?.email || 'employee@businz.com';
      empId = staffEmp?.employeeId || 'EMP-USER';
      dept = staffEmp?.department || 'General';
      desig = staffEmp?.designation || 'Employee';
      avatar = staffEmp?.avatar || '';
    } else if (newRole === 'Finance Manager' || newRole === 'Responsible Person' || newRole === 'Manager') {
      const finEmp = employees.find(e => e.department === 'Finance' || e.department === 'Accounts' || e.designation.toLowerCase().includes('account') || e.designation.toLowerCase().includes('finance'));
      name = finEmp ? `${finEmp.firstName} ${finEmp.lastName}`.trim() : 'Finance & Accounts Manager';
      email = finEmp?.email || 'accounts@businz.com';
      empId = finEmp?.employeeId || 'EMP-ACC';
      dept = finEmp?.department || 'Accounts';
      desig = finEmp?.designation || 'Finance Manager';
      avatar = finEmp?.avatar || '';
    } else if (newRole === 'Task Creator') {
      name = 'Task Creator';
      email = 'creator@businz.com';
      empId = 'EMP-CREATOR';
      dept = 'Operations';
      desig = 'Project Coordinator';
      avatar = '';
    } else if (newRole === 'ERP Administrator') {
      name = 'ERP Administrator';
      email = 'admin@businz.com';
      empId = 'EMP-SYS';
      dept = 'Technical Support';
      desig = 'ERP Administrator';
      avatar = '';
    }

    const switchedUser: User = {
      id: 'USR-' + Date.now(),
      name,
      email,
      role: newRole,
      avatar,
      department: dept,
      designation: desig,
      employeeId: empId
    };

    setCurrentUser(switchedUser);
    try {
      localStorage.setItem('vrm_hrms_current_user', JSON.stringify(switchedUser));
    } catch (e) {
      console.warn('Error persisting switched role user:', e);
    }
  };

  // RBAC Permission Check
  const hasPermission = (module: ModuleName, action: PermissionAction): boolean => {
    // Unrestricted Master Authority for Super Admin and CEO across all modules & actions
    if (
      currentUser.role === 'Super Admin' ||
      currentUser.role === 'CEO' ||
      currentUser.designation === 'CEO' ||
      (currentUser.designation && currentUser.designation.toLowerCase().includes('ceo')) ||
      currentUser.employeeId === 'EMP-000'
    ) {
      return true;
    }

    if (module === 'profile') return true;
    if (module === 'settings' && action === 'view') return true;
    if (module === 'tracking') return true;
    if (module === 'overtime' && (action === 'view' || action === 'create')) return true;
    if (module === 'overtime' && action === 'approve') {
      return (
        currentUser.role === 'CEO' ||
        currentUser.role === 'Super Admin' ||
        currentUser.role === 'HR Admin' ||
        currentUser.role === 'HR Manager' ||
        currentUser.role === 'Department Manager' ||
        currentUser.role === 'Department Head' ||
        currentUser.role === 'Management' ||
        currentUser.role === 'ERP Administrator'
      );
    }

    // Finance / Accounts staff access: full access to view and export payroll, finance expense claims, and advance salary
    const isFinanceStaff = 
      currentUser.role === 'Finance Manager' ||
      (currentUser.department && (currentUser.department.toLowerCase().includes('finance') || currentUser.department.toLowerCase().includes('accounts'))) ||
      (currentUser.designation && (currentUser.designation.toLowerCase().includes('accounts') || currentUser.designation.toLowerCase().includes('finance')));

    const isHrOrCeo = 
      currentUser.role === 'CEO' ||
      currentUser.role === 'Super Admin' ||
      currentUser.role === 'HR Manager' ||
      currentUser.role === 'HR Admin' ||
      (currentUser as any).designation?.toLowerCase().includes('ceo') ||
      (currentUser as any).designation?.toLowerCase().includes('managing director');

    if (module === 'payroll' || module === 'finance' || module === 'advance_salary') {
      if (action === 'approve') {
        return isHrOrCeo;
      }
      if (isFinanceStaff && (action === 'view' || action === 'export')) {
        return true;
      }
    }

    const rolePermissions = permissionMatrix[currentUser.role];
    if (!rolePermissions) return false;
    const actions = rolePermissions[module];
    return actions ? actions.includes(action) : false;
  };

  const updatePermission = (role: Role, module: ModuleName, action: PermissionAction, enabled: boolean) => {
    setPermissionMatrix(prev => {
      const copy = { ...prev };
      const roleMods = { ...copy[role] };
      const currentActions = roleMods[module] ? [...roleMods[module]] : [];

      if (enabled && !currentActions.includes(action)) {
        currentActions.push(action);
      } else if (!enabled && currentActions.includes(action)) {
        const idx = currentActions.indexOf(action);
        currentActions.splice(idx, 1);
      }

      roleMods[module] = currentActions;
      copy[role] = roleMods;
      return copy;
    });
  };

  // Validation & Safety Helpers
  const canDeleteEmployee = (idOrEmpId: string): { canDelete: boolean; reason?: string } => {
    const emp = employees.find(e => e.id === idOrEmpId || e.employeeId === idOrEmpId);
    if (!emp) return { canDelete: true };
    const empId = emp.employeeId || emp.id;

    // 1. Check corporate assets assigned
    const assignedAssets = assets.filter(a => a.assignedEmployeeId === empId || a.assignedEmployeeId === emp.id);
    if (assignedAssets.length > 0) {
      return { 
        canDelete: false, 
        reason: `Cannot delete ${emp.firstName} ${emp.lastName}: Employee has ${assignedAssets.length} active corporate asset(s) assigned (${assignedAssets.map(a => a.name).join(', ')}). Please unassign assets first.` 
      };
    }

    // 2. Check pending / open tasks
    const activeTasks = tasks.filter(t => t.assignedEmployeeId === empId && t.status !== 'Completed');
    if (activeTasks.length > 0) {
      return { 
        canDelete: false, 
        reason: `Cannot delete ${emp.firstName} ${emp.lastName}: Employee has ${activeTasks.length} open task(s) assigned. Please reassign or complete tasks first.` 
      };
    }

    // 3. Check active advance salary loans
    const activeAdv = loanRecords.find((a) => 
      (a.employeeId === empId || a.employeeId === emp.id) && 
      (a.status === 'Disbursed' || a.status === 'Approved' || a.status === 'Active')
    );
    if (activeAdv) {
      return {
        canDelete: false,
        reason: `Cannot delete ${emp.firstName} ${emp.lastName}: Employee has an active advance salary request (${activeAdv.id} - ${activeAdv.status}).`
      };
    }

    return { canDelete: true };
  };

  const canDeleteDepartment = (idOrName: string): { canDelete: boolean; reason?: string } => {
    const dept = departments.find(d => d.id === idOrName || d.name === idOrName);
    const deptName = dept ? dept.name : idOrName;
    const assignedEmps = employees.filter(e => (e.department || '').toLowerCase() === deptName.toLowerCase());
    if (assignedEmps.length > 0) {
      return {
        canDelete: false,
        reason: `Cannot delete department "${deptName}": ${assignedEmps.length} employee(s) belong to this department (${assignedEmps.slice(0, 3).map(e => `${e.firstName} ${e.lastName}`).join(', ')}${assignedEmps.length > 3 ? '...' : ''}). Please reassign employees first.`
      };
    }
    return { canDelete: true };
  };

  const canDeleteBranch = (idOrName: string): { canDelete: boolean; reason?: string } => {
    const branch = branches.find(b => b.id === idOrName || b.name === idOrName);
    const branchName = branch ? branch.name : idOrName;
    const assignedEmps = employees.filter(e => (e.workLocation || '').toLowerCase().includes(branchName.toLowerCase()) || branchName.toLowerCase().includes((e.workLocation || '').toLowerCase()));
    if (assignedEmps.length > 0) {
      return {
        canDelete: false,
        reason: `Cannot delete branch "${branchName}": ${assignedEmps.length} employee(s) are stationed at this location. Please reassign employees first.`
      };
    }
    return { canDelete: true };
  };

  const canDeleteShift = (idOrName: string): { canDelete: boolean; reason?: string } => {
    const shift = shifts.find(s => s.id === idOrName || s.shiftName === idOrName);
    const shiftName = shift ? shift.shiftName : idOrName;
    const assignedEmps = employees.filter(e => (e.workShift || '').toLowerCase().includes(shiftName.toLowerCase()) || shiftName.toLowerCase().includes((e.workShift || '').toLowerCase()));
    if (assignedEmps.length > 0) {
      return {
        canDelete: false,
        reason: `Cannot delete shift "${shiftName}": ${assignedEmps.length} employee(s) are assigned to this shift roster. Please reassign employees first.`
      };
    }
    return { canDelete: true };
  };

  const canDeleteDesignation = (idOrTitle: string): { canDelete: boolean; reason?: string } => {
    const desig = designations.find(d => d.id === idOrTitle || d.title === idOrTitle);
    const title = desig ? desig.title : idOrTitle;
    const assignedEmps = employees.filter(e => (e.designation || '').toLowerCase() === title.toLowerCase());
    if (assignedEmps.length > 0) {
      return {
        canDelete: false,
        reason: `Cannot delete designation "${title}": ${assignedEmps.length} employee(s) currently hold this title. Please reassign designations first.`
      };
    }
    return { canDelete: true };
  };

  // Actions
  const addEmployee = (empData: Omit<Employee, 'id'>) => {
    const rawPrefix = businessSettings?.employeeCodePrefix || employeeConfig?.idFormatPrefix || 'EMP';
    const digits = employeeConfig?.idFormatDigits || 3;
    const startNum = employeeConfig?.idStartingNumber || 1;
    const newId = empData.employeeId && empData.employeeId.trim().length > 0
      ? empData.employeeId.trim()
      : generateNextEmployeeId(employees, rawPrefix, digits, startNum);

    const newEmp: Employee = {
      ...empData,
      id: newId,
      employeeId: newId,
      authUserId: empData.authUserId || `usr-${Date.now()}`,
      mustChangePassword: empData.mustChangePassword !== undefined ? empData.mustChangePassword : true,
      accountStatus: empData.accountStatus || 'ACTIVE',
      credentialEmailStatus: empData.credentialEmailStatus || 'SENT',
      credentialEmailSentAt: empData.credentialEmailSentAt || new Date().toISOString(),
    };
    setEmployees(prev => [newEmp, ...prev]);

    // Also add to default attendance record
    const today = new Date().toISOString().split('T')[0];
    const newAtt: AttendanceRecord = {
      id: `ATT-${Date.now()}`,
      employeeId: newId,
      employeeName: `${newEmp.firstName} ${newEmp.lastName}`,
      department: newEmp.department,
      date: today,
      checkIn: null,
      checkOut: null,
      workingHours: 0,
      status: 'Absent',
      lateStatus: 'N/A',
      location: { lat: 37.7749, lng: -122.4194, address: 'HQ Building', inGeofence: true },
      faceVerified: false,
      method: 'System Auto'
    };
    setAttendanceRecords(prev => [newAtt, ...prev]);

    addNotification({
      title: 'New Employee Onboarded',
      message: `${newEmp.firstName} ${newEmp.lastName} (${newEmp.employeeId}) onboarded. Login account created and credentials dispatched to ${newEmp.email}.`,
      priority: 'Normal',
      category: 'Announcement'
    });
  };

  const resetEmployeeLogin = (employeeId: string): { success: boolean; message: string; temporaryPassword?: string } => {
    const digits = Math.floor(100000 + Math.random() * 900000).toString();
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    const suffix = chars[Math.floor(Math.random() * chars.length)];
    const tempPassword = `Vrm@${digits}${suffix}`;

    setEmployees(prev => prev.map(e => {
      if (e.id === employeeId || e.employeeId === employeeId) {
        return {
          ...e,
          password: tempPassword,
          mustChangePassword: true,
          credentialEmailStatus: 'SENT',
          credentialEmailSentAt: new Date().toISOString(),
        };
      }
      return e;
    }));

    addNotification({
      title: 'Credentials Reset',
      message: `New temporary login password generated for ${employeeId} and emailed successfully.`,
      priority: 'Urgent',
      category: 'Announcement'
    });

    return {
      success: true,
      message: 'New temporary password generated and dispatched.',
      temporaryPassword: tempPassword
    };
  };

  const updateEmployeeLoginStatus = (employeeId: string, status: 'ACTIVE' | 'DISABLED'): { success: boolean; message: string } => {
    setEmployees(prev => prev.map(e => {
      if (e.id === employeeId || e.employeeId === employeeId) {
        return {
          ...e,
          accountStatus: status,
          status: status === 'DISABLED' ? 'Terminated' : (e.status === 'Terminated' ? 'Active' : e.status),
        };
      }
      return e;
    }));

    addNotification({
      title: `Login ${status === 'ACTIVE' ? 'Enabled' : 'Disabled'}`,
      message: `Employee login access has been ${status === 'ACTIVE' ? 'enabled' : 'disabled'} for ${employeeId}.`,
      priority: status === 'DISABLED' ? 'Urgent' : 'Normal',
      category: 'Announcement'
    });

    return {
      success: true,
      message: `Employee login has been ${status === 'ACTIVE' ? 'enabled' : 'disabled'}.`
    };
  };

  const changeEmployeePassword = (identifier: string, newPassword: string): { success: boolean; message: string } => {
    const clean = identifier.toLowerCase().trim();
    setEmployees(prev => prev.map(e => {
      if (e.email.toLowerCase().trim() === clean || e.employeeId.toLowerCase().trim() === clean || e.id.toLowerCase().trim() === clean) {
        return {
          ...e,
          password: newPassword,
          mustChangePassword: false,
        };
      }
      return e;
    }));

    addNotification({
      title: 'Password Changed',
      message: 'Your portal password has been updated securely.',
      priority: 'Normal',
      category: 'Announcement'
    });

    return { success: true, message: 'Password updated successfully' };
  };

  const updateEmployee = (id: string, empData: Partial<Employee>) => {
    setEmployees(prev => prev.map(e => (e.id === id || e.employeeId === id) ? { ...e, ...empData } : e));
  };

  const deleteEmployee = async (id: string): Promise<{ success: boolean; message?: string }> => {
    const check = canDeleteEmployee(id);
    if (!check.canDelete) {
      return { success: false, message: check.reason };
    }

    // 1. Delete from Supabase Cloud Database directly
    try {
      await supabaseDirect.deleteEmployee(id);
    } catch (sbErr) {
      console.warn('Direct Supabase delete notice:', sbErr);
    }

    // 2. Also attempt backend API deletion if token is active
    try {
      const token = sessionStorage.getItem('vrm_auth_token') || localStorage.getItem('vrm_auth_token') || localStorage.getItem('token');
      await fetch(`${API_BASE_URL}/employees/${encodeURIComponent(id)}`, {
        method: 'DELETE',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
    } catch {}

    // 3. Update React state
    setEmployees(prev => {
      const updated = prev.filter(e => e.id !== id && e.employeeId !== id);
      return updated;
    });

    addNotification({
      title: 'Employee Removed',
      message: `Employee record (${id}) deleted successfully.`,
      priority: 'Normal',
      category: 'Announcement'
    });

    return { success: true };
  };

  const deleteMultipleEmployees = async (ids: string[]): Promise<{ success: boolean; deletedCount: number; message?: string }> => {
    const idsToDelete = ids.filter(id => canDeleteEmployee(id).canDelete);

    if (idsToDelete.length === 0) {
      return { success: false, deletedCount: 0, message: 'None of the selected employees can be deleted due to active dependencies.' };
    }

    // 1. Delete from Supabase directly
    try {
      await supabaseDirect.deleteEmployees(idsToDelete);
    } catch (sbErr) {
      console.warn('Batch Supabase delete notice:', sbErr);
    }

    // 2. Backend API
    try {
      const token = sessionStorage.getItem('vrm_auth_token') || localStorage.getItem('vrm_auth_token') || localStorage.getItem('token');
      await Promise.allSettled(
        idsToDelete.map(id =>
          fetch(`${API_BASE_URL}/employees/${encodeURIComponent(id)}`, {
            method: 'DELETE',
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          })
        )
      );
    } catch {}

    // 3. Update React state
    const idSet = new Set(idsToDelete);
    setEmployees(prev => {
      const updated = prev.filter(e => !idSet.has(e.id) && !idSet.has(e.employeeId));
      return updated;
    });

    addNotification({
      title: 'Employees Removed',
      message: `${idsToDelete.length} employee record(s) deleted successfully.`,
      priority: 'Normal',
      category: 'Announcement'
    });

    return { success: true, deletedCount: idsToDelete.length };
  };


  // Helper for time calculation
  const parseTimeToMinutes = (timeStr: string | null | undefined): number => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const meridiem = match[3]?.toUpperCase();
    if (meridiem === 'PM' && hours < 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  const markAttendance = (
    empId: string,
    status: AttendanceRecord['status'],
    method: AttendanceRecord['method'],
    location?: AttendanceRecord['location']
  ) => {
    const evalResult = getEmployeeShiftAttendanceState(empId);

    // If check-in is not available and check-out is not available, block punch
    if (!evalResult.canCheckIn && !evalResult.canCheckOut) {
      console.warn(`[HRMS Attendance] Punch rejected for ${empId}: ${evalResult.message}`);
      addNotification({
        title: 'Check-In Unavailable',
        message: evalResult.message,
        priority: 'Urgent',
        category: 'Attendance'
      });
      return;
    }

    const now = new Date();
    const today = evalResult.shiftDate;
    const nowTime = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const emp = employees.find(e => e.id === empId || e.employeeId === empId);
    const empName = emp ? `${emp.firstName} ${emp.lastName}` : 'Employee';
    const dept = emp ? emp.department : 'General';

    // Calculate shift timing & late status
    const empShift = evalResult.assignedShift;
    const shiftStartMins = empShift ? parseTimeToMinutes(empShift.startTime) : 9 * 60; // 09:00 default
    const graceMins = empShift?.gracePeriodMins ?? (attendanceConfig?.lateGraceMinutes ?? 15);
    const checkInMins = parseTimeToMinutes(nowTime);

    let calculatedLateStatus: AttendanceRecord['lateStatus'] = 'On Time';
    let calculatedStatus = status;

    if (checkInMins > shiftStartMins + graceMins) {
      if (checkInMins <= shiftStartMins + 30) {
        calculatedLateStatus = 'Late (<30m)';
      } else {
        calculatedLateStatus = 'Severely Late';
      }
      if (calculatedStatus === 'Present') {
        calculatedStatus = 'Late';
      }
    }

    setAttendanceRecords(prev => {
      const existingIdx = prev.findIndex(a => 
        (a.employeeId === empId || (emp && (a.employeeId === emp.id || a.employeeId === emp.employeeId))) &&
        (a.shiftDate === today || a.date === today)
      );

      if (existingIdx >= 0) {
        const copy = [...prev];
        const existingCheckIn = copy[existingIdx].checkIn || nowTime;
        const inMins = parseTimeToMinutes(existingCheckIn);
        const outMins = parseTimeToMinutes(nowTime);
        const workedHours = existingCheckIn 
          ? Math.max(0.5, Math.round(((outMins - inMins) / 60) * 10) / 10)
          : (status === 'Present' ? 8 : 4);

        copy[existingIdx] = {
          ...copy[existingIdx],
          shiftId: empShift.id,
          shiftDate: today,
          shiftName: empShift.shiftName,
          checkIn: existingCheckIn,
          checkOut: copy[existingIdx].checkIn ? nowTime : null,
          status: calculatedStatus,
          lateStatus: copy[existingIdx].lateStatus || calculatedLateStatus,
          method,
          location: location || copy[existingIdx].location,
          workingHours: workedHours
        };
        return copy;
      } else {
        const newRecord: AttendanceRecord = {
          id: `ATT-${Date.now()}`,
          employeeId: empId,
          employeeName: empName,
          department: dept,
          shiftId: empShift.id,
          shiftDate: today,
          shiftName: empShift.shiftName,
          date: today,
          checkIn: nowTime,
          checkOut: null,
          workingHours: 8,
          status: calculatedStatus,
          lateStatus: calculatedLateStatus,
          location: location || { lat: 13.151968, lng: 80.2086053, address: 'HQ Office', inGeofence: true },
          faceVerified: method === 'Face Recognition',
          method
        };
        return [newRecord, ...prev];
      }
    });
  };

  const addFaceLog = (log: Omit<FaceLog, 'id'>) => {
    const newLog: FaceLog = { ...log, id: `FL-${Date.now()}` };
    setFaceLogs(prev => [newLog, ...prev]);
  };

  const applyLeave = (req: Omit<LeaveRequest, 'id' | 'status' | 'appliedDate'>) => {
    const today = new Date().toISOString().split('T')[0];
    const emp = employees.find(e => e.employeeId === req.employeeId) || employees[0];

    const isWfh = req.leaveType === 'Work From Home' || 
      (req.leaveType && req.leaveType.toLowerCase().includes('work from home')) ||
      (req.leaveType && req.leaveType.toLowerCase() === 'wfh');

    // Evaluate sandwich calculation dynamically (WFH is 100% working time, no sandwich penalties)
    const sandwichCalc: SandwichCalculationResult = isWfh ? {
      isSandwichApplied: false,
      sandwichDays: 0,
      totalDays: req.daysCount,
      appliedLeaveDays: req.daysCount,
      paidDays: req.daysCount,
      unpaidDays: 0,
      weeklyOffDays: 0,
      publicHolidayDays: 0,
      breakdown: []
    } : (req.sandwichDetails || calculateSandwichLeave({
      employee: emp,
      leaveType: req.leaveType,
      startDate: req.startDate,
      endDate: req.endDate,
      policies: sandwichPolicies,
      holidays: holidayPolicies,
      existingLeaves: leaveRequests,
      weeklyOffSchedule: emp.shiftDetails?.weeklyOff
    }));

    const isSandwich = isWfh ? false : sandwichCalc.isSandwichApplied;
    const finalDaysCount = isWfh ? req.daysCount : (sandwichCalc.totalDays || req.daysCount);
    const sandwichDays = isWfh ? 0 : (sandwichCalc.sandwichDays || 0);
    const unpaidSandwich = isWfh ? 0 : sandwichCalc.breakdown.filter(b => b.isSandwich && !b.isPaid).length;

    const newReq: LeaveRequest = {
      ...req,
      id: `LR-${Date.now()}`,
      status: 'Pending',
      appliedDate: today,
      daysCount: finalDaysCount,
      sandwichDetails: sandwichCalc,
      isSandwichApplied: isSandwich,
      sandwichDays,
      unpaidSandwichDays: unpaidSandwich,
      paidDaysCount: isWfh ? finalDaysCount : sandwichCalc.paidDays,
      unpaidDaysCount: isWfh ? 0 : sandwichCalc.unpaidDays
    };

    setLeaveRequests(prev => [newReq, ...prev]);

    if (isSandwich) {
      addSandwichAuditLog({
        action: 'SANDWICH_RULE_APPLIED',
        leaveRequestId: newReq.id,
        employeeId: req.employeeId,
        policyId: sandwichCalc.appliedPolicyId,
        policyName: sandwichCalc.appliedPolicyName,
        newValue: {
          appliedLeaveDays: sandwichCalc.appliedLeaveDays,
          sandwichDays: sandwichCalc.sandwichDays,
          totalDays: finalDaysCount,
          payType: sandwichCalc.payTypeApplied
        },
        reason: `Sandwich policy applied for ${req.employeeName} (${req.startDate} to ${req.endDate}).`
      });
    }

    addNotification({
      title: isWfh ? 'New Work From Home Request' : 'New Leave Request',
      message: isWfh 
        ? `${req.employeeName} applied for ${finalDaysCount} days Work From Home.`
        : `${req.employeeName} applied for ${finalDaysCount} days (${sandwichDays > 0 ? `${sandwichDays} sandwich days included, ` : ''}${req.leaveType}).`,
      priority: 'Important',
      category: 'Leave'
    });
  };

  const approveLeave = (id: string, approvedBy: string) => {
    setLeaveRequests(prev => prev.map(l => {
      if (l.id === id) {
        const isWfh = l.leaveType === 'Work From Home' || 
          (l.leaveType && l.leaveType.toLowerCase().includes('work from home')) ||
          (l.leaveType && l.leaveType.toLowerCase() === 'wfh');

        // Automatically sync attendance for all dates in range without duplicates
        const datesToSync: { date: string; isSandwich: boolean }[] = [];

        if (!isWfh && l.sandwichDetails?.breakdown && l.sandwichDetails.breakdown.length > 0) {
          l.sandwichDetails.breakdown.forEach((b: SandwichCalculationDayDetail) => {
            datesToSync.push({ date: b.date, isSandwich: b.isSandwich });
          });
        } else {
          const start = new Date(l.startDate);
          const end = new Date(l.endDate);
          const cur = new Date(start);
          while (cur <= end) {
            datesToSync.push({ date: cur.toISOString().split('T')[0], isSandwich: false });
            cur.setDate(cur.getDate() + 1);
          }
        }

        setAttendanceRecords(attPrev => {
          const updated = [...attPrev];
          datesToSync.forEach(item => {
            const idx = updated.findIndex(a => a.employeeId === l.employeeId && a.date === item.date);
            const statusLabel: AttendanceRecord['status'] = isWfh ? 'Work From Home' : 'On Leave';
            const locationNote = isWfh 
              ? 'Work From Home (Approved)' 
              : item.isSandwich ? 'Sandwich Leave (Policy Enforced)' : 'Approved Leave';

            if (idx >= 0) {
              updated[idx] = {
                ...updated[idx],
                status: statusLabel,
                workingHours: isWfh ? (updated[idx].workingHours > 0 ? updated[idx].workingHours : 8) : 0,
                checkIn: isWfh ? (updated[idx].checkIn || '09:00 AM') : null,
                checkOut: isWfh ? (updated[idx].checkOut || '06:00 PM') : null,
                lateStatus: 'N/A',
                wfhSource: isWfh ? 'Approved WFH Request' : undefined,
                wfhReason: isWfh ? (l.reason || 'Work From Home Approved') : undefined,
                location: {
                  lat: updated[idx].location?.lat ?? 13.151968,
                  lng: updated[idx].location?.lng ?? 80.2086053,
                  inGeofence: updated[idx].location?.inGeofence ?? true,
                  address: locationNote
                }
              };
            } else {
              updated.push({
                id: `ATT-${isWfh ? 'WFH' : 'LV'}-${Date.now()}-${item.date}`,
                employeeId: l.employeeId,
                employeeName: l.employeeName,
                department: l.department,
                date: item.date,
                checkIn: isWfh ? '09:00 AM' : null,
                checkOut: isWfh ? '06:00 PM' : null,
                workingHours: isWfh ? 8 : 0,
                status: statusLabel,
                lateStatus: 'N/A',
                wfhSource: isWfh ? 'Approved WFH Request' : undefined,
                wfhReason: isWfh ? (l.reason || 'Work From Home Approved') : undefined,
                location: { lat: 13.151968, lng: 80.2086053, address: locationNote, inGeofence: true },
                faceVerified: false,
                method: isWfh ? 'Manual Punch' : 'System Auto'
              });
            }
          });
          return updated;
        });

        addSandwichAuditLog({
          action: 'LEAVE_APPROVED',
          leaveRequestId: l.id,
          employeeId: l.employeeId,
          policyId: l.sandwichDetails?.appliedPolicyId,
          newValue: { approvedBy, daysCount: l.daysCount },
          reason: isWfh 
            ? `Work From Home request approved by ${approvedBy}. Attendance updated as [WFH] (Present).`
            : `Leave request approved by ${approvedBy}. Attendance calendar updated.`
        });

        return { ...l, status: 'Approved', approvedBy };
      }
      return l;
    }));

    addNotification({
      title: 'Request Approved',
      message: `Your request has been approved by ${approvedBy}. Attendance updated accordingly.`,
      priority: 'Normal',
      category: 'Leave'
    });
  };

  const rejectLeave = (id: string, approvedBy: string, comment?: string) => {
    setLeaveRequests(prev => prev.map(l => {
      if (l.id === id) {
        const isWfh = l.leaveType === 'Work From Home' || 
          (l.leaveType && l.leaveType.toLowerCase().includes('work from home')) ||
          (l.leaveType && l.leaveType.toLowerCase() === 'wfh');

        addSandwichAuditLog({
          action: 'LEAVE_REJECTED',
          leaveRequestId: l.id,
          employeeId: l.employeeId,
          reason: comment || `${isWfh ? 'Work From Home' : 'Leave'} request rejected by ${approvedBy}.`
        });
        return { ...l, status: 'Rejected', approvedBy, comment };
      }
      return l;
    }));

    addNotification({
      title: 'Request Rejected',
      message: `Your request has been rejected by ${approvedBy}.`,
      priority: 'Important',
      category: 'Leave'
    });
  };

  const addShift = (shiftData: Omit<Shift, 'id' | 'assignedEmployeeCount'>) => {
    const assignmentsList = Array.isArray(shiftData.assignments) ? shiftData.assignments : [];
    const newShift: Shift = {
      ...shiftData,
      assignments: assignmentsList,
      id: `SH-${Date.now()}`,
      assignedEmployeeCount: assignmentsList.length
    };
    setShifts(prev => [...prev, newShift]);
  };

  const updateShift = (id: string, updates: Partial<Shift>) => {
    setShifts(prev => {
      const target = prev.find(s => s.id === id);
      const oldName = target?.shiftName;
      const updatedList = prev.map(s => s.id === id ? { ...s, ...updates } : s);
      if (updates.shiftName && oldName && updates.shiftName !== oldName) {
        setEmployees(empList => empList.map(emp => {
          if (emp.workShift === oldName) {
            return { ...emp, workShift: updates.shiftName! };
          }
          return emp;
        }));
      }
      return updatedList;
    });
  };

  const deleteShift = (id: string) => {
    setShifts(prev => prev.filter(s => s.id !== id));
  };

  // Policy Management Methods
  const addLeavePolicy = (policyData: Omit<LeavePolicyItem, 'id'>) => {
    const newPolicy: LeavePolicyItem = {
      ...policyData,
      id: `lp-${Date.now()}`
    };
    setLeavePolicies(prev => [...prev, newPolicy]);
  };

  const updateLeavePolicy = (id: string, updates: Partial<LeavePolicyItem>) => {
    setLeavePolicies(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteLeavePolicy = (id: string) => {
    setLeavePolicies(prev => prev.filter(p => p.id !== id));
  };

  const addHolidayPolicy = (holidayData: Omit<HolidayItem, 'id'>) => {
    const newHoliday: HolidayItem = {
      ...holidayData,
      id: `hp-${Date.now()}`
    };
    setHolidayPolicies(prev => [...prev, newHoliday]);
  };

  const updateHolidayPolicy = (id: string, updates: Partial<HolidayItem>) => {
    setHolidayPolicies(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h));
  };

  const deleteHolidayPolicy = (id: string) => {
    setHolidayPolicies(prev => prev.filter(h => h.id !== id));
  };

  const addAttendancePolicy = (policyData: Omit<AttendancePolicyItem, 'id'>) => {
    const newPolicy: AttendancePolicyItem = {
      ...policyData,
      id: `ap-${Date.now()}`
    };
    setAttendancePolicies(prev => [...prev, newPolicy]);
  };

  const updateAttendancePolicy = (id: string, updates: Partial<AttendancePolicyItem>) => {
    setAttendancePolicies(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const deleteAttendancePolicy = (id: string) => {
    setAttendancePolicies(prev => prev.filter(p => p.id !== id));
  };

  const addWeeklySchedule = (scheduleData: Omit<WeeklyScheduleItem, 'id'>) => {
    const newSchedule: WeeklyScheduleItem = {
      ...scheduleData,
      id: `wp-${Date.now()}`
    };
    setWeeklySchedules(prev => [...prev, newSchedule]);
  };

  const updateWeeklySchedule = (id: string, updates: Partial<WeeklyScheduleItem>) => {
    setWeeklySchedules(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const deleteWeeklySchedule = (id: string) => {
    setWeeklySchedules(prev => prev.filter(w => w.id !== id));
  };

  const updateAttendanceConfig = (updates: Partial<GlobalAttendanceConfig>) => {
    setAttendanceConfig(prev => ({ ...prev, ...updates }));
  };

  const addPolicyDocument = (docData: Omit<PolicyDocumentItem, 'id'>) => {
    const newDoc: PolicyDocumentItem = {
      ...docData,
      id: `p-${Date.now()}`
    };
    setPolicyDocuments(prev => [...prev, newDoc]);
  };

  const updatePolicyDocument = (id: string, updates: Partial<PolicyDocumentItem>) => {
    setPolicyDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deletePolicyDocument = (id: string) => {
    setPolicyDocuments(prev => prev.filter(d => d.id !== id));
  };

  const updateBusinessSettings = (updates: Partial<BusinessProfileSettings>) => {
    setBusinessSettings(prev => ({ ...prev, ...updates }));
  };

  const requestShiftChange = (req: Omit<ShiftRequest, 'id' | 'status'>) => {
    const newReq: ShiftRequest = {
      ...req,
      id: `SR-${Date.now()}`,
      status: 'Pending'
    };
    setShiftRequests(prev => [newReq, ...prev]);
  };

  const approveShiftRequest = (id: string, approvedBy: string) => {
    setShiftRequests(prev => prev.map(r => {
      if (r.id === id) {
        if (r.employeeId || r.employeeName) {
          setEmployees(empList => empList.map(emp => {
            const matchesId = r.employeeId && (emp.employeeId === r.employeeId || emp.id === r.employeeId);
            const matchesName = r.employeeName && `${emp.firstName} ${emp.lastName}`.trim().toLowerCase() === r.employeeName.trim().toLowerCase();
            if (matchesId || matchesName) {
              return { ...emp, workShift: r.requestedShift };
            }
            return emp;
          }));
        }
        return { ...r, status: 'Approved', approvedBy };
      }
      return r;
    }));
    addNotification({
      title: 'Shift Request Approved',
      message: `Shift swap request has been approved by ${approvedBy}.`,
      priority: 'Normal',
      category: 'Attendance'
    });
  };

  const rejectShiftRequest = (id: string, rejectedBy: string, reason?: string) => {
    setShiftRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'Rejected', rejectedBy, rejectionReason: reason || 'Shift swap request was declined by management.' } : r));
    addNotification({
      title: 'Shift Request Declined',
      message: `Shift swap request was declined by ${rejectedBy}.`,
      priority: 'Important',
      category: 'Attendance'
    });
  };

  const addTask = (tsk: Omit<TaskItem, 'id' | 'createdAt'>) => {
    const newTask: TaskItem = {
      ...tsk,
      id: `TSK-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0]
    };
    setTasks(prev => [newTask, ...prev]);

    addNotification({
      title: 'New Task Assigned',
      message: `Task "${tsk.title}" assigned to ${tsk.assignedEmployeeName}.`,
      priority: tsk.priority === 'Urgent' ? 'Urgent' : 'Normal',
      category: 'Task'
    });
  };

  const updateTaskStatus = (id: string, status: TaskItem['status']) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        // Boost employee performance score on completion!
        if (status === 'Completed') {
          setPerformanceScores(perfPrev => perfPrev.map(p => {
            if (p.employeeId === t.assignedEmployeeId) {
              const newComp = Math.min(100, p.taskCompletionRate + 4);
              const newScore = Math.min(100, p.overallScore + 2);
              return { ...p, taskCompletionRate: newComp, overallScore: newScore };
            }
            return p;
          }));
        }
        return { ...t, status };
      }
      return t;
    }));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    setEnhancedTasks(prev => prev.filter(t => t.id !== id));
    supabaseDirect.deleteTask(id);
  };

  // ─────────────────────────────────────────────────────────────
  // Enterprise Enhanced Task Handlers
  // ─────────────────────────────────────────────────────────────

  const createEnhancedTask = (
    taskData: Omit<TaskItemEnhanced, 'id' | 'taskNumber' | 'overallProgress' | 'overallStatus' | 'updates' | 'comments' | 'attachments' | 'timeline' | 'auditLogs' | 'createdAt' | 'updatedAt'> & Partial<Pick<TaskItemEnhanced, 'assignees' | 'attachments'>>
  ): TaskItemEnhanced => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const taskId = `TSK-${Date.now()}`;
    const taskNumber = `TSK-2026-${(enhancedTasks.length + 1).toString().padStart(3, '0')}`;

    // Normalize and filter assignees to prevent self-assignment ("oru person own task assign pannakudathu")
    const creatorCleanName = (taskData.assignedBy || taskData.createdBy || currentUser.name || '').replace(/\s*\([^)]*\)/g, '').toLowerCase().trim();
    const creatorEmpId = (currentUser.employeeId || currentUser.id || '').toLowerCase().trim();

    let rawAssignees = (taskData.assignees || []).filter(asn => {
      if (creatorEmpId && asn.employeeId && asn.employeeId.toLowerCase() === creatorEmpId) return false;
      const aName = (asn.employeeName || '').toLowerCase().trim();
      if (creatorCleanName && aName && (aName === creatorCleanName || creatorCleanName.startsWith(aName) || aName.startsWith(creatorCleanName))) return false;
      return true;
    });

    if (rawAssignees.length === 0) {
      const fallbackEmp = employees.find(e => e.employeeId !== creatorEmpId && !e.firstName.toLowerCase().includes(creatorCleanName)) || employees[0];
      if (fallbackEmp) {
        rawAssignees = [{
          id: `ASN-${Date.now()}-0`,
          taskId,
          employeeId: fallbackEmp.employeeId,
          employeeName: `${fallbackEmp.firstName} ${fallbackEmp.lastName}`.trim(),
          employeeEmail: fallbackEmp.email,
          employeeDepartment: fallbackEmp.department || taskData.department,
          employeeAvatar: fallbackEmp.avatar || '',
          role: 'RESPONSIBLE',
          individualStatus: 'Pending',
          progressPercentage: 0,
          assignedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }];
      }
    }

    let finalResponsiblePersonId = taskData.responsiblePersonId;
    let finalResponsiblePersonName = taskData.responsiblePersonName;
    if (!finalResponsiblePersonId || (creatorEmpId && finalResponsiblePersonId.toLowerCase() === creatorEmpId) || (creatorCleanName && finalResponsiblePersonName?.toLowerCase().includes(creatorCleanName))) {
      const respEmp = rawAssignees[0] || employees.find(e => e.employeeId !== creatorEmpId);
      if (respEmp) {
        finalResponsiblePersonId = respEmp.employeeId;
        finalResponsiblePersonName = respEmp.employeeName || `${(respEmp as any).firstName || ''} ${(respEmp as any).lastName || ''}`.trim();
      }
    }

    let finalAssignedBy = taskData.assignedBy || `${currentUser.name} (${currentUser.role})`;
    const assignedByClean = finalAssignedBy.replace(/\s*\([^)]*\)/g, '').toLowerCase().trim();
    if (rawAssignees.some(a => (a.employeeName || '').toLowerCase().trim() === assignedByClean)) {
      finalAssignedBy = 'Velmurugan (CEO)';
    }

    const preparedAssignees: TaskAssignee[] = rawAssignees.map((asn, idx) => {
      const emp = employees.find(e => e.employeeId === asn.employeeId || e.id === asn.employeeId);
      return {
        id: asn.id || `ASN-${Date.now()}-${idx}`,
        taskId,
        employeeId: asn.employeeId,
        employeeName: asn.employeeName || (emp ? `${emp.firstName} ${emp.lastName}` : 'Assignee'),
        employeeEmail: asn.employeeEmail || emp?.email || '',
        employeeDepartment: asn.employeeDepartment || emp?.department || taskData.department,
        employeeAvatar: asn.employeeAvatar || emp?.avatar || '',
        role: asn.role || (asn.employeeId === finalResponsiblePersonId ? 'RESPONSIBLE' : 'ASSIGNEE'),
        individualStatus: asn.individualStatus || 'Pending',
        progressPercentage: asn.progressPercentage || 0,
        actualStartDate: asn.actualStartDate,
        completedDate: asn.completedDate,
        latestRemark: asn.latestRemark,
        completionEvidence: asn.completionEvidence,
        assignedAt: asn.assignedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    const { overallStatus, overallProgress } = computeTaskOverallStatusAndProgress(
      preparedAssignees, 
      'OPEN', 
      taskData.dueDate
    );

    const initialTimeline = [
      {
        id: `TL-${Date.now()}`,
        taskId,
        title: taskData.sourceType === 'MOM' ? 'Task Created from Meeting Action Item' : 'Task Created',
        description: `Created by ${taskData.createdBy || currentUser.name} and assigned to ${preparedAssignees.map(a => a.employeeName).join(', ')}.`,
        timestamp: `${today} ${nowTime}`,
        iconType: (taskData.sourceType === 'MOM' ? 'mom' : 'created') as any,
        actorName: taskData.createdBy || currentUser.name
      }
    ];

    const initialAudit: TaskAuditLog[] = [
      {
        id: `AUD-${Date.now()}`,
        taskId,
        taskNumber,
        action: 'Task Created',
        module: 'Task Management',
        oldValue: 'N/A',
        newValue: `Status: ${overallStatus}, Priority: ${taskData.priority}, Assignees: ${preparedAssignees.length}`,
        performedBy: currentUser.name,
        performedByRole: currentUser.role,
        timestamp: `${today} ${nowTime}`
      }
    ];

    const preparedAttachments: TaskAttachment[] = (taskData.attachments || []).map((att: any, idx) => ({
      id: att.id || `ATT-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      taskId,
      fileName: att.fileName || `Attachment-${idx + 1}.pdf`,
      fileSize: att.fileSize || '1.2 MB',
      fileType: att.fileType || 'Document',
      fileUrl: att.fileUrl || '#',
      uploadedBy: att.uploadedBy || currentUser.name || 'Task Creator',
      uploadedAt: att.uploadedAt || new Date().toISOString()
    }));

    const newTask: TaskItemEnhanced = {
      ...taskData,
      id: taskId,
      taskNumber,
      responsiblePersonId: finalResponsiblePersonId,
      responsiblePersonName: finalResponsiblePersonName,
      assignedBy: finalAssignedBy,
      taskDate: taskData.taskDate || today,
      overallProgress,
      overallStatus,
      assignees: preparedAssignees,
      updates: [],
      comments: [],
      attachments: preparedAttachments,
      timeline: initialTimeline,
      auditLogs: initialAudit,
      createdAt: today,
      updatedAt: today
    };

    setEnhancedTasks(prev => [newTask, ...prev]);
    supabaseDirect.saveTask(newTask);

    // Also mirror to legacy tasks
    const legacyTask: TaskItem = {
      id: taskId,
      title: newTask.title,
      description: newTask.description,
      assignedEmployeeId: preparedAssignees[0]?.employeeId || 'EMP-001',
      assignedEmployeeName: preparedAssignees[0]?.employeeName || 'Assigned Staff',
      assignedBy: newTask.assignedBy,
      department: newTask.department,
      priority: newTask.priority,
      dueDate: newTask.dueDate,
      status: overallStatus === 'COMPLETED' ? 'Completed' : overallStatus === 'IN PROGRESS' ? 'In Progress' : overallStatus === 'OVERDUE' ? 'Overdue' : 'To Do',
      createdAt: today
    };
    setTasks(prev => [legacyTask, ...prev]);

    // Send notifications to all assignees
    preparedAssignees.forEach(asn => {
      addNotification({
        title: 'New Task Assigned',
        message: `You have been assigned to task: "${newTask.title}" (Due: ${newTask.dueDate})`,
        priority: newTask.priority === 'Urgent' ? 'Urgent' : 'Normal',
        category: 'Task',
        link: newTask.id
      });
    });

    return newTask;
  };

  const updateAssigneeProgress = (
    taskId: string,
    assigneeId: string,
    progressPercentage: number,
    individualStatus: TaskAssigneeStatus,
    latestRemark?: string,
    completionEvidence?: TaskCompletionEvidence
  ) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const clampedProgress = Math.min(100, Math.max(0, Math.round(progressPercentage)));

    setEnhancedTasks(prev => prev.map(task => {
      if (task.id !== taskId) return task;

      const targetAssignee = task.assignees.find(a => 
        a.id === assigneeId || 
        a.employeeId === assigneeId || 
        (a.employeeName && a.employeeName.toLowerCase().includes(assigneeId.toLowerCase()))
      ) || task.assignees[0];
      if (!targetAssignee) return task;

      const oldStatus = targetAssignee.individualStatus;
      const oldProgress = targetAssignee.progressPercentage;

      const isNowCompleted = clampedProgress === 100 || individualStatus === 'Completed';
      const actualStart = targetAssignee.actualStartDate || (clampedProgress > 0 ? today : undefined);
      const completedDate = isNowCompleted ? (targetAssignee.completedDate || today) : undefined;

      const updatedAssignees: TaskAssignee[] = task.assignees.map(asn => {
        if (asn.id === targetAssignee.id) {
          return {
            ...asn,
            individualStatus,
            progressPercentage: clampedProgress,
            actualStartDate: actualStart,
            completedDate,
            latestRemark: latestRemark ?? asn.latestRemark,
            completionEvidence: completionEvidence ?? asn.completionEvidence,
            updatedAt: new Date().toISOString()
          };
        }
        return asn;
      });

      // System derives overall task status & overall progress from all assignees!
      const { overallStatus: newOverallStatus, overallProgress: newOverallProgress } = 
        computeTaskOverallStatusAndProgress(updatedAssignees, task.overallStatus, task.dueDate);

      // Create new progress update log
      const newUpdate = {
        id: `UPD-${Date.now()}`,
        taskId,
        assigneeId: targetAssignee.id,
        employeeId: targetAssignee.employeeId,
        employeeName: targetAssignee.employeeName,
        employeeAvatar: targetAssignee.employeeAvatar,
        status: individualStatus,
        progressPercentage: clampedProgress,
        remarks: latestRemark || (isNowCompleted ? 'Marked task as completed.' : `Updated progress to ${clampedProgress}%.`),
        updatedBy: currentUser.name,
        updatedAt: new Date().toISOString()
      };

      // Create timeline event
      const newTimeline = {
        id: `TL-${Date.now()}`,
        taskId,
        title: isNowCompleted ? `${targetAssignee.employeeName} completed assigned work` : `${targetAssignee.employeeName} updated progress`,
        description: latestRemark ? `${clampedProgress}% — "${latestRemark}"` : `Progress updated from ${oldProgress}% to ${clampedProgress}% (${individualStatus}).`,
        timestamp: `${today} ${nowTime}`,
        iconType: (isNowCompleted ? 'evidence' : 'progress') as any,
        actorName: currentUser.name
      };

      // Create immutable audit log
      const newAudit: TaskAuditLog = {
        id: `AUD-${Date.now()}`,
        taskId,
        taskNumber: task.taskNumber,
        action: isNowCompleted ? 'Completion Submitted' : 'Progress Updated',
        module: 'Task Assignees',
        oldValue: `${targetAssignee.employeeName}: ${oldProgress}% (${oldStatus})`,
        newValue: `${targetAssignee.employeeName}: ${clampedProgress}% (${individualStatus})`,
        performedBy: currentUser.name,
        performedByRole: currentUser.role,
        timestamp: `${today} ${nowTime}`
      };

      // Also audit overall task status change if derived status changed
      const auditEntries: TaskAuditLog[] = [newAudit];
      if (newOverallStatus !== task.overallStatus) {
        auditEntries.push({
          id: `AUD-${Date.now() + 1}`,
          taskId,
          taskNumber: task.taskNumber,
          action: 'Overall Status Changed',
          module: 'System Engine',
          oldValue: task.overallStatus,
          newValue: newOverallStatus,
          performedBy: 'System Auto',
          performedByRole: 'System',
          timestamp: `${today} ${nowTime}`
        });
      }

      // Notifications: notify HR/CEO and team on work update
      addNotification({
        title: isNowCompleted ? 'Task Work Completed' : 'Task Progress Updated',
        message: `${targetAssignee.employeeName} updated "${task.title}" to ${clampedProgress}% (${individualStatus})${latestRemark ? `: "${latestRemark}"` : '.'}`,
        priority: isNowCompleted ? 'Important' : 'Normal',
        category: 'Task',
        link: task.id
      });

      if (newOverallStatus === 'COMPLETED' && task.overallStatus !== 'COMPLETED') {
        addNotification({
          title: 'All Assignees Completed Task',
          message: `All assignees have completed "${task.title}". Review and closure required by Responsible Person.`,
          priority: 'Important',
          category: 'Task',
          link: task.id
        });
      }

      const updatedTask = {
        ...task,
        overallStatus: newOverallStatus,
        overallProgress: newOverallProgress,
        assignees: updatedAssignees,
        updates: [newUpdate, ...task.updates],
        timeline: [newTimeline, ...task.timeline],
        auditLogs: [...auditEntries, ...task.auditLogs],
        updatedAt: today
      };
      supabaseDirect.saveTask(updatedTask);
      return updatedTask;
    }));

    // Also mirror to legacy tasks array
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        return {
          ...t,
          status: clampedProgress === 100 ? 'Completed' : clampedProgress > 0 ? 'In Progress' : 'To Do'
        };
      }
      return t;
    }));
  };

  const closeTask = (taskId: string, closedBy: string, closureRemarks?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setEnhancedTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;

      const newTimeline = {
        id: `TL-${Date.now()}`,
        taskId,
        title: 'Task Verified & Closed',
        description: closureRemarks ? `Closed by ${closedBy}. Note: ${closureRemarks}` : `Officially verified and closed by ${closedBy}.`,
        timestamp: `${today} ${nowTime}`,
        iconType: 'closed' as any,
        actorName: closedBy
      };

      const newAudit = {
        id: `AUD-${Date.now()}`,
        taskId,
        taskNumber: t.taskNumber,
        action: 'Task Closed',
        module: 'Task Management',
        oldValue: t.overallStatus,
        newValue: 'CLOSED',
        performedBy: closedBy,
        performedByRole: currentUser.role,
        timestamp: `${today} ${nowTime}`
      };

      const updated: TaskItemEnhanced = {
        ...t,
        overallStatus: 'CLOSED',
        closedAt: new Date().toISOString(),
        closedBy,
        closureRemarks: closureRemarks || 'Verified and completed successfully.',
        timeline: [newTimeline, ...t.timeline],
        auditLogs: [newAudit, ...t.auditLogs],
        updatedAt: today
      };
      supabaseDirect.saveTask(updated);
      return updated;
    }));

    addNotification({
      title: 'Task Closed',
      message: `Task has been reviewed and closed by ${closedBy}.`,
      priority: 'Normal',
      category: 'Task',
      link: taskId
    });
  };

  const reopenTask = (taskId: string, reopenedBy: string, reopenReason: string) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setEnhancedTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;

      const { overallStatus: derivedStatus, overallProgress } = 
        computeTaskOverallStatusAndProgress(t.assignees, 'IN PROGRESS', t.dueDate);

      const newTimeline = {
        id: `TL-${Date.now()}`,
        taskId,
        title: 'Task Reopened',
        description: `Reopened by ${reopenedBy}. Reason: ${reopenReason}`,
        timestamp: `${today} ${nowTime}`,
        iconType: 'reopened' as any,
        actorName: reopenedBy
      };

      const newAudit = {
        id: `AUD-${Date.now()}`,
        taskId,
        taskNumber: t.taskNumber,
        action: 'Task Reopened',
        module: 'Task Management',
        oldValue: 'CLOSED',
        newValue: `Reopened (${derivedStatus}). Reason: ${reopenReason}`,
        performedBy: reopenedBy,
        performedByRole: currentUser.role,
        timestamp: `${today} ${nowTime}`
      };

      const updated: TaskItemEnhanced = {
        ...t,
        overallStatus: derivedStatus === 'CLOSED' ? 'IN PROGRESS' : derivedStatus,
        overallProgress,
        isReopened: true,
        reopenReason,
        closedAt: undefined,
        closedBy: undefined,
        closureRemarks: undefined,
        timeline: [newTimeline, ...t.timeline],
        auditLogs: [newAudit, ...t.auditLogs],
        updatedAt: today
      };
      supabaseDirect.saveTask(updated);
      return updated;
    }));

    addNotification({
      title: 'Task Reopened',
      message: `Task has been reopened by ${reopenedBy}: "${reopenReason}"`,
      priority: 'Important',
      category: 'Task',
      link: taskId
    });
  };

  const addTaskDailyReport = (taskId: string, report: {
    reportDate: string;
    workDoneToday: string;
    planForTomorrow?: string;
    blockersOrIssues?: string;
    hoursSpent?: number;
    processStatus: TaskAssigneeStatus;
  }) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newDailyReport: TaskDailyReport = {
      id: `DLR-${Date.now()}`,
      taskId,
      reportDate: report.reportDate || today,
      employeeId: currentUser.employeeId || currentUser.id || 'EMP-001',
      employeeName: currentUser.name || 'Employee',
      employeeAvatar: currentUser.avatar,
      employeeDepartment: currentUser.department || 'Operations',
      workDoneToday: report.workDoneToday,
      planForTomorrow: report.planForTomorrow,
      blockersOrIssues: report.blockersOrIssues,
      hoursSpent: report.hoursSpent || 8,
      processStatus: report.processStatus,
      submittedAt: new Date().toISOString(),
      submittedTo: ['CEO', 'HR Manager', 'Assigner']
    };

    setEnhancedTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;

      const progressMap: Record<TaskAssigneeStatus, number> = {
        'Pending': 0,
        'In Progress': 50,
        'In Process': 50,
        'Under Review': 90,
        'Completed': 100,
        'Blocked': 30
      };

      const currentEmpId = currentUser.employeeId || currentUser.id || '';
      const updatedAssignees = t.assignees.map(a => {
        const isTarget = a.employeeId === currentEmpId || 
                         (currentUser.name && a.employeeName.toLowerCase().includes(currentUser.name.toLowerCase())) ||
                         t.assignees.length === 1;
        if (isTarget) {
          return {
            ...a,
            individualStatus: report.processStatus,
            progressPercentage: progressMap[report.processStatus] ?? a.progressPercentage,
            latestRemark: report.workDoneToday,
            completedDate: report.processStatus === 'Completed' ? today : a.completedDate,
            updatedAt: new Date().toISOString()
          };
        }
        return a;
      });

      const { overallStatus, overallProgress } = computeTaskOverallStatusAndProgress(updatedAssignees, t.overallStatus, t.dueDate);

      const newTimeline: TaskTimelineEvent = {
        id: `TL-${Date.now()}`,
        taskId,
        title: `Daily Report: ${currentUser.name} (${report.processStatus})`,
        description: `Daily update for ${report.reportDate}: "${report.workDoneToday.slice(0, 80)}${report.workDoneToday.length > 80 ? '...' : ''}". Dispatched to CEO, HR & Assigner.`,
        timestamp: `${today} ${nowTime}`,
        iconType: 'progress',
        actorName: currentUser.name
      };

      const newAudit: TaskAuditLog = {
        id: `AUD-${Date.now()}`,
        taskId,
        taskNumber: t.taskNumber,
        action: 'Daily Report Submitted',
        module: 'Task Daily Reports',
        oldValue: 'N/A',
        newValue: `Daily report for ${report.reportDate} [${report.processStatus}]`,
        performedBy: currentUser.name,
        performedByRole: currentUser.role,
        timestamp: `${today} ${nowTime}`
      };

      const updated = {
        ...t,
        overallStatus,
        overallProgress,
        assignees: updatedAssignees,
        dailyReports: [newDailyReport, ...(t.dailyReports || [])],
        timeline: [newTimeline, ...t.timeline],
        auditLogs: [newAudit, ...t.auditLogs],
        updatedAt: today
      };
      supabaseDirect.saveTask(updated);
      return updated;
    }));

    addNotification({
      title: 'Daily Task Report Received',
      message: `${currentUser.name} submitted daily task report. Status: "${report.processStatus}". Dispatched to CEO, HR & Assigner.`,
      priority: 'Important',
      category: 'Task',
      link: taskId
    });
  };

  const updateTaskProcessStatus = (taskId: string, newStatus: TaskAssigneeStatus, remarks?: string) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setEnhancedTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;

      const progressMap: Record<TaskAssigneeStatus, number> = {
        'Pending': 0,
        'In Progress': 50,
        'In Process': 50,
        'Under Review': 90,
        'Completed': 100,
        'Blocked': 30
      };

      const updatedAssignees = t.assignees.map(a => ({
        ...a,
        individualStatus: newStatus,
        progressPercentage: progressMap[newStatus] ?? a.progressPercentage,
        latestRemark: remarks || a.latestRemark,
        completedDate: newStatus === 'Completed' ? today : a.completedDate,
        updatedAt: new Date().toISOString()
      }));

      const { overallStatus, overallProgress } = computeTaskOverallStatusAndProgress(updatedAssignees, t.overallStatus, t.dueDate);

      const newTimeline: TaskTimelineEvent = {
        id: `TL-${Date.now()}`,
        taskId,
        title: `Process Stage Changed to "${newStatus}"`,
        description: remarks ? `Stage updated to ${newStatus} by ${currentUser.name}: "${remarks}". Notified to CEO, HR & Assignee.` : `Stage changed to ${newStatus} by ${currentUser.name}. Notified to CEO, HR & Assignee.`,
        timestamp: `${today} ${nowTime}`,
        iconType: newStatus === 'Completed' ? 'closed' : 'status_change',
        actorName: currentUser.name
      };

      const newAudit: TaskAuditLog = {
        id: `AUD-${Date.now()}`,
        taskId,
        taskNumber: t.taskNumber,
        action: 'Process Stage Update',
        module: 'Task Workflow',
        oldValue: t.overallStatus,
        newValue: newStatus,
        performedBy: currentUser.name,
        performedByRole: currentUser.role,
        timestamp: `${today} ${nowTime}`
      };

      const updated = {
        ...t,
        overallStatus,
        overallProgress,
        assignees: updatedAssignees,
        timeline: [newTimeline, ...t.timeline],
        auditLogs: [newAudit, ...t.auditLogs],
        updatedAt: today
      };
      supabaseDirect.saveTask(updated);
      return updated;
    }));

    addNotification({
      title: `Task Process Updated: ${newStatus}`,
      message: `Task stage set to "${newStatus}" by ${currentUser.name}. Notified to CEO, HR & Assignee.`,
      priority: newStatus === 'Completed' ? 'Important' : 'Normal',
      category: 'Task',
      link: taskId
    });
  };

  const addTaskComment = (taskId: string, content: string, attachments?: string[]) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newComment = {
      id: `CMT-${Date.now()}`,
      taskId,
      userId: currentUser.employeeId || currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      userRole: currentUser.role,
      content,
      attachments,
      createdAt: new Date().toISOString()
    };

    setEnhancedTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;

      const newAudit = {
        id: `AUD-${Date.now()}`,
        taskId,
        taskNumber: t.taskNumber,
        action: 'Comment Added',
        module: 'Task Comments',
        oldValue: 'N/A',
        newValue: content.slice(0, 40) + '...',
        performedBy: currentUser.name,
        performedByRole: currentUser.role,
        timestamp: `${today} ${nowTime}`
      };

      const updated = {
        ...t,
        comments: [...t.comments, newComment],
        auditLogs: [newAudit, ...t.auditLogs]
      };
      supabaseDirect.saveTask(updated);
      return updated;
    }));
  };

  const addTaskAttachment = (taskId: string, attachmentData: Omit<TaskAttachment, 'id' | 'taskId' | 'uploadedAt'>) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newAttachment: TaskAttachment = {
      ...attachmentData,
      id: `ATT-${Date.now()}`,
      taskId,
      uploadedAt: new Date().toISOString()
    };

    setEnhancedTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;

      const newAudit = {
        id: `AUD-${Date.now()}`,
        taskId,
        taskNumber: t.taskNumber,
        action: 'Attachment Uploaded',
        module: 'Task Attachments',
        oldValue: 'N/A',
        newValue: `${newAttachment.fileName} (${newAttachment.fileSize})`,
        performedBy: currentUser.name,
        performedByRole: currentUser.role,
        timestamp: `${today} ${nowTime}`
      };

      const updated = {
        ...t,
        attachments: [...(t.attachments || []), newAttachment],
        auditLogs: [newAudit, ...t.auditLogs]
      };
      supabaseDirect.saveTask(updated);
      return updated;
    }));
  };

  const addTaskLink = (taskId: string, linkData: { title: string; url: string }) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let finalUrl = linkData.url.trim();
    if (finalUrl && !/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    const newLink: TaskLinkItem = {
      id: `LNK-${Date.now()}`,
      taskId,
      title: linkData.title.trim() || finalUrl,
      url: finalUrl,
      addedBy: currentUser.name || 'User',
      addedAt: new Date().toISOString()
    };

    setEnhancedTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;

      const newAudit: TaskAuditLog = {
        id: `AUD-${Date.now()}`,
        taskId,
        taskNumber: t.taskNumber,
        action: 'Link Added',
        module: 'Task Links',
        oldValue: 'N/A',
        newValue: `${newLink.title} (${newLink.url})`,
        performedBy: currentUser.name,
        performedByRole: currentUser.role,
        timestamp: `${today} ${nowTime}`
      };

      const updated = {
        ...t,
        links: [...(t.links || []), newLink],
        auditLogs: [newAudit, ...(t.auditLogs || [])]
      };
      supabaseDirect.saveTask(updated);
      return updated;
    }));
  };

  const deleteTaskLink = (taskId: string, linkId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setEnhancedTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;

      const targetLink = (t.links || []).find(l => l.id === linkId);

      const newAudit: TaskAuditLog = {
        id: `AUD-${Date.now()}`,
        taskId,
        taskNumber: t.taskNumber,
        action: 'Link Removed',
        module: 'Task Links',
        oldValue: targetLink ? targetLink.title : linkId,
        newValue: 'Removed',
        performedBy: currentUser.name,
        performedByRole: currentUser.role,
        timestamp: `${today} ${nowTime}`
      };

      const updated = {
        ...t,
        links: (t.links || []).filter(l => l.id !== linkId),
        auditLogs: [newAudit, ...(t.auditLogs || [])]
      };
      supabaseDirect.saveTask(updated);
      return updated;
    }));
  };

  const convertMOMActionToTask = (momId: string, actionItemId: string): TaskItemEnhanced | null => {
    const meeting = momMeetings.find(m => m.id === momId || m.meetingNumber === momId);
    if (!meeting) return null;

    const item = meeting.actionItems.find(a => a.id === actionItemId || a.itemNumber === actionItemId);
    if (!item) return null;

    const responsibleEmpId = item.assignedEmployeeIds[0] || 'EMP-001';
    const responsibleEmp = employees.find(e => e.employeeId === responsibleEmpId || e.id === responsibleEmpId);

    const assigneesList: TaskAssignee[] = item.assignedEmployeeIds.map((empId, idx): TaskAssignee => {
      const emp = employees.find(e => e.employeeId === empId || e.id === empId);
      return {
        id: `ASN-${Date.now()}-${idx}`,
        taskId: '',
        employeeId: empId,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'ASSIGNEE',
        employeeEmail: emp?.email || '',
        employeeDepartment: emp?.department || item.department,
        employeeAvatar: emp?.avatar || '',
        role: (empId === responsibleEmpId ? 'RESPONSIBLE' : 'ASSIGNEE'),
        individualStatus: 'Pending' as TaskAssigneeStatus,
        progressPercentage: 0,
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    const created = createEnhancedTask({
      title: item.title,
      taskDate: new Date().toISOString().split('T')[0],
      sourceType: 'MOM',
      sourceReference: meeting.meetingTitle,
      momId: meeting.meetingNumber,
      momItemNumber: item.itemNumber,
      createdBy: currentUser.name,
      assignedBy: currentUser.name,
      responsiblePersonId: responsibleEmpId,
      responsiblePersonName: responsibleEmp ? `${responsibleEmp.firstName} ${responsibleEmp.lastName}` : 'Responsible Person',
      department: item.department || meeting.department,
      taskCategory: 'Compliance',
      priority: item.priority,
      startDate: new Date().toISOString().split('T')[0],
      dueDate: item.dueDate,
      description: item.description,
      expectedOutput: `Outcome mandated by MOM resolution: ${item.decision}`,
      assignees: assigneesList
    });

    // Mark MOM Action Item as Linked
    setMomMeetings(prev => prev.map(m => {
      if (m.id !== meeting.id) return m;
      return {
        ...m,
        actionItems: m.actionItems.map(ai => {
          if (ai.id !== item.id) return ai;
          return {
            ...ai,
            status: 'Task Created',
            linkedTaskId: created.id,
            linkedTaskNumber: created.taskNumber
          };
        })
      };
    }));

    return created;
  };

  const syncMOMTask = (taskId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const task = enhancedTasks.find(t => t.id === taskId);
    if (!task || !task.momId) return;

    setMomMeetings(prev => prev.map(m => {
      if (m.meetingNumber !== task.momId && m.id !== task.momId) return m;
      return {
        ...m,
        actionItems: m.actionItems.map(ai => {
          if (ai.itemNumber !== task.momItemNumber && ai.linkedTaskId !== task.id) return ai;
          return {
            ...ai,
            status: task.overallStatus === 'COMPLETED' || task.overallStatus === 'CLOSED' ? 'Completed' : 'In Progress'
          };
        })
      };
    }));

    // Record audit log in task
    setEnhancedTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        auditLogs: [
          {
            id: `AUD-${Date.now()}`,
            taskId,
            taskNumber: t.taskNumber,
            action: 'MOM Synchronization',
            module: 'MOM Integration',
            oldValue: 'Pending Sync',
            newValue: `Synced status "${t.overallStatus}" to ${task.momId}`,
            performedBy: currentUser.name,
            performedByRole: currentUser.role,
            timestamp: `${today} ${nowTime}`
          },
          ...t.auditLogs
        ]
      };
    }));

    addNotification({
      title: 'MOM Status Synchronized',
      message: `Task ${task.taskNumber} status synchronized with ${task.momId}.`,
      priority: 'Normal',
      category: 'Task'
    });
  };

  const deleteEnhancedTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const addTaskMaster = (itemData: Omit<TaskMasterItem, 'id'>) => {
    const newItem: TaskMasterItem = {
      ...itemData,
      id: `MST-${Date.now()}`
    };
    setTaskMasters(prev => [...prev, newItem]);
  };

  const updateTaskMaster = (id: string, updates: Partial<TaskMasterItem>) => {
    setTaskMasters(prev => prev.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteTaskMaster = (id: string) => {
    setTaskMasters(prev => prev.filter(m => m.id !== id));
  };

  const addMOMMeeting = (meetingData: Omit<MOMMeeting, 'id' | 'meetingNumber'>) => {
    const seq = (momMeetings.length + 1).toString().padStart(2, '0');
    const meetingNumber = `MOM-2026-${seq}`;
    const newMeeting: MOMMeeting = {
      ...meetingData,
      id: `MOM-${Date.now()}`,
      meetingNumber
    };
    setMomMeetings(prev => [newMeeting, ...prev]);
  };

  const updateEscalationRule = (id: string, updates: Partial<TaskEscalationRule>) => {
    setEscalationRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const updateTaskWeights = (weights: Partial<TaskPerformanceWeights>) => {
    setTaskWeights(prev => ({ ...prev, ...weights }));
  };

  const addJobOpening = (job: Omit<JobOpening, 'id' | 'postedDate' | 'applicantsCount'>) => {
    const newJob: JobOpening = {
      ...job,
      id: `JOB-${Date.now()}`,
      postedDate: new Date().toISOString().split('T')[0],
      applicantsCount: 0
    };
    setJobOpenings(prev => [newJob, ...prev]);
  };

  const updateCandidateStage = (candidateId: string, newStage: Candidate['stage']) => {
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        return { ...c, stage: newStage };
      }
      return c;
    }));
  };

  const referCandidate = (cand: Omit<Candidate, 'id' | 'stage' | 'appliedDate'>) => {
    const newCand: Candidate = {
      ...cand,
      id: `CND-${Date.now()}`,
      stage: 'Applied',
      referralStatus: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0]
    };
    setCandidates(prev => [newCand, ...prev]);

    // Notify HR and CEO
    addNotification({
      title: 'New Candidate Referral Submitted',
      message: `${cand.referrerName || 'An Employee'} referred ${cand.name} for ${cand.jobTitle}. Pending HR/CEO review.`,
      priority: 'Normal',
      category: 'Announcement'
    });
  };

  const reviewReferral = (
    candidateId: string, 
    status: 'Accepted' | 'Rejected', 
    reviewerName: string, 
    notes?: string,
    newStage?: Candidate['stage']
  ) => {
    let targetCand: Candidate | undefined;
    setCandidates(prev => prev.map(c => {
      if (c.id === candidateId) {
        targetCand = c;
        return {
          ...c,
          referralStatus: status,
          referralReviewedBy: reviewerName,
          referralReviewedDate: new Date().toISOString().split('T')[0],
          referralReviewNotes: notes || c.referralReviewNotes,
          stage: newStage || (status === 'Accepted' ? 'Interview' : 'Rejected')
        };
      }
      return c;
    }));

    if (targetCand) {
      addNotification({
        title: status === 'Accepted' ? 'Candidate Referral Accepted! 🎉' : 'Candidate Referral Rejected',
        message: `Referral for ${targetCand.name} (${targetCand.jobTitle}) was ${status.toLowerCase()} by ${reviewerName}.`,
        priority: status === 'Accepted' ? 'Important' : 'Normal',
        category: 'Announcement'
      });
    }
  };

  const addExpense = (exp: Omit<Expense, 'id' | 'status'>) => {
    const newExp: Expense = {
      ...exp,
      id: `EXP-${Date.now()}`,
      status: 'Pending Manager'
    };
    setExpenses(prev => [newExp, ...prev]);

    addNotification({
      title: 'Expense Claim Submitted',
      message: `${exp.employeeName} submitted an expense claim for $${exp.amount}.`,
      priority: 'Normal',
      category: 'Announcement'
    });
  };

  const approveExpense = (id: string, approvedBy: string, nextStatus: Expense['status']) => {
    setExpenses(prev => prev.map(e => e.id === id ? { ...e, status: nextStatus, approvedBy } : e));
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const addNotification = (note: Omit<NotificationItem, 'id' | 'timestamp' | 'read'>) => {
    const newNote: NotificationItem = {
      ...note,
      id: `NOT-${Date.now()}`,
      timestamp: 'Just now',
      read: false
    };
    setNotifications(prev => [newNote, ...prev]);
  };

  const processPayrollBatch = async () => {
    const activeAttPolicy = masterAttendancePolicies.find(p => p.status === 'Active');

    let backendRecords: any[] | null = null;
    try {
      // 1. Authoritative backend run execution
      let run = await payrollApi.createPayrollRun({ payroll_month: 8, payroll_year: 2026 }).catch(() => null);
      if (!run) {
        const runs = await payrollApi.getPayrollRuns().catch(() => []);
        run = runs.find(r => r.payrollMonth === 8 && r.payrollYear === 2026) || null;
      }
      if (run && run.status === 'DRAFT') {
        run = await payrollApi.processPayrollRun(run.id).catch(() => run);
      }
      const rawRecords = await payrollApi.getPayrollRecords({ month: 8, year: 2026 }).catch(() => null) as any[] | null;
      if (rawRecords && rawRecords.length > 0) {
        backendRecords = rawRecords;
      }
    } catch (apiErr) {
      console.warn('[Payroll] Backend calculation offline, using local engine fallback:', apiErr);
    }

    const updatedRecords: PayrollRecord[] = employees.map(emp => {
      const isEmpProvisional = (emp.employmentType as string) === 'Provisional' || (emp.employmentType as string) === 'Probation' || (emp as any).status === 'Probation';
      const empLeavePolicy = masterLeavePolicies.find(p => {
        if (p.status !== 'Active') return false;
        if (isEmpProvisional) {
          return p.applicableEmploymentType === 'Provisional' || p.id === 'LP-MASTER-PROVISIONAL' || p.policyName.toLowerCase().includes('provisional') || p.policyName.toLowerCase().includes('probation');
        } else {
          return p.applicableEmploymentType === 'Confirmed' || p.id === 'LP-MASTER-CONFIRMED' || (!p.policyName.toLowerCase().includes('provisional') && !p.policyName.toLowerCase().includes('probation'));
        }
      }) || masterLeavePolicies.find(p => p.status === 'Active');

      const calc = calculateEmployeePayroll(
        emp,
        attendanceRecords,
        leaveRequests,
        loanRecords,
        employeeRewardRecords,
        activeAttPolicy,
        empLeavePolicy,
        payrollSettingsConfig,
        'August',
        2026
      );

      const backendRec = backendRecords?.find((b: any) => b.employeeId === emp.employeeId);
      if (backendRec) {
        return {
          id: backendRec.id || `PAY-2026-08-${emp.employeeId}`,
          employeeId: emp.employeeId,
          employeeName: `${emp.firstName} ${emp.lastName}`,
          department: emp.department,
          designation: emp.designation,
          month: 'August',
          year: 2026,
          basicSalary: backendRec.basicSalary,
          allowances: (backendRec.hra || 0) + (backendRec.conveyance || 0) + (backendRec.da || 0),
          da: backendRec.da,
          conveyance: backendRec.conveyance,
          hra: backendRec.hra,
          withPf: backendRec.withPf,
          bonus: backendRec.bonus || 0,
          attendanceBonus: backendRec.attendanceBonus || 0,
          rewardEarnings: backendRec.otherEarnings || 0,
          taxDeduction: (backendRec.pfAmount || 0) + (backendRec.esicAmount || 0) + (backendRec.professionalTax || 0),
          leaveDeduction: backendRec.lopAmount || 0,
          advanceDeduction: (backendRec.advanceRecovery || 0) + (backendRec.loanRecovery || 0),
          lateAttendanceDeduction: 0,
          epfDeduction: backendRec.pfAmount || 0,
          esiDeduction: backendRec.esicAmount || 0,
          professionalTax: backendRec.professionalTax || 0,
          workingDays: backendRec.workingDays || 26,
          presentDays: backendRec.presentDays || 26,
          paidLeaves: 0,
          unpaidLeaves: backendRec.lopDays || 0,
          netSalary: backendRec.netSalary,
          internalDetails: {
            lateDetails: calc.lateDetails,
            leaveDetails: calc.leaveDetails,
            statutoryDetails: (backendRec.deductionsBreakdown || []).map((d: any) => ({
              ruleName: d.name,
              category: 'Statutory',
              rate: d.amount,
              deductionAmount: d.amount,
              reason: d.description || ''
            })),
            rewardDetails: (backendRec.earningsBreakdown || []).map((e: any) => ({
              ruleName: e.name,
              category: 'Allowance',
              rate: e.amount,
              bonusAmount: e.amount,
              reason: e.description || ''
            }))
          },
          status: 'Processed'
        };
      }

      return {
        id: `PAY-2026-08-${emp.employeeId}`,
        employeeId: emp.employeeId,
        employeeName: `${emp.firstName} ${emp.lastName}`,
        department: emp.department,
        designation: emp.designation,
        month: 'August',
        year: 2026,
        basicSalary: calc.basicSalary,
        allowances: calc.allowances,
        da: calc.da,
        conveyance: calc.conveyance,
        hra: calc.hra,
        withPf: calc.withPf,
        bonus: calc.bonus,
        attendanceBonus: calc.attendanceBonus || 0,
        rewardEarnings: calc.rewardEarnings,
        taxDeduction: calc.statutoryDeductions,
        leaveDeduction: calc.unpaidLeaveDeduction,
        advanceDeduction: calc.advanceDeduction,
        lateAttendanceDeduction: calc.lateAttendanceDeduction,
        epfDeduction: calc.epfDeduction,
        esiDeduction: calc.esiDeduction,
        professionalTax: calc.professionalTax,
        workingDays: calc.workingDays,
        presentDays: calc.presentDays,
        paidLeaves: calc.paidLeaves,
        unpaidLeaves: calc.unpaidLeaves,
        netSalary: calc.netSalary,
        internalDetails: {
          lateDetails: calc.lateDetails,
          leaveDetails: calc.leaveDetails,
          statutoryDetails: calc.statutoryDetails,
          rewardDetails: calc.rewardDetails
        },
        status: 'Processed'
      };
    });

    // Mark processed employee rewards
    setEmployeeRewardRecords(prev => prev.map(r => r.payrollStatus === 'Pending' && r.addToPayroll ? { ...r, payrollStatus: 'ProcessedInPayroll' } : r));

    // Update active loans with payroll EMI deductions
    const batchPeriod = 'Aug 2026';
    const batchId = 'PAY-2026-08';
    setLoanRecords(prev => prev.map(loan => {
      if ((loan.status === 'Active' || loan.status === 'Disbursed') && toNum(loan.outstandingBalance) > 0) {
        // Unique Deduplication Check: Ensure not already deducted in this batch for this period
        const alreadyDeducted = loan.repaymentSchedule.some(s => s.payrollBatchId === batchId && s.status === 'Deducted');
        if (alreadyDeducted) return loan;

        // Find next pending installment
        const nextInstIdx = loan.repaymentSchedule.findIndex(s => s.status === 'Pending');
        if (nextInstIdx !== -1) {
          const inst = loan.repaymentSchedule[nextInstIdx];
          const scheduledEmi = toNum(inst.scheduledAmount || loan.monthlyDeduction);
          const currentBal = toNum(loan.outstandingBalance);
          const actualDeduct = Math.min(scheduledEmi, currentBal);
          const newBal = Math.max(0, currentBal - actualDeduct);
          const isClosed = newBal === 0;

          const updatedSchedule = [...loan.repaymentSchedule];
          updatedSchedule[nextInstIdx] = {
            ...inst,
            actualDeducted: actualDeduct,
            remainingBalance: newBal,
            status: 'Deducted',
            deductedAt: '2026-08-31 06:00 PM',
            payrollBatchId: batchId
          };

          return {
            ...loan,
            outstandingBalance: newBal,
            status: isClosed ? ('Closed' as LoanRequestStatus) : loan.status,
            repaymentSchedule: updatedSchedule,
            auditLogs: [
              ...loan.auditLogs,
              {
                id: `LOG-${Date.now()}-${loan.id}`,
                loanId: loan.id,
                action: isClosed ? 'Loan Closed (Payroll Repaid)' : 'Payroll Salary Deduction',
                performedBy: 'Payroll Engine',
                performedByRole: 'System',
                timestamp: '2026-08-31 06:00 PM',
                previousValue: `Outstanding: ${formatCurrency(currentBal)}`,
                newValue: `Outstanding: ${formatCurrency(newBal)} (Deducted ${formatCurrency(actualDeduct)} in August Batch)`
              }
            ]
          };
        }
      }
      return loan;
    }));

    setPayrollRecords(updatedRecords);

    addNotification({
      title: 'Payroll Batch Processed',
      message: `August 2026 payroll successfully processed for ${employees.length} employees with automated loan recoveries.`,
      priority: 'Important',
      category: 'Payroll'
    });
  };

  const updateEmployeeSalaryScheme = (employeeId: string, withPf: boolean) => {
    setEmployees(prev => prev.map(emp => {
      if (emp.id === employeeId || emp.employeeId === employeeId) {
        return {
          ...emp,
          withPf,
          salaryDetails: {
            ...emp.salaryDetails,
            withPf,
            salaryScheme: withPf ? 'WITH_PF' : 'WITHOUT_PF'
          }
        };
      }
      return emp;
    }));
  };

  const updatePayrollRecordAdvanceDeduction = (recordId: string, amount: number) => {
    setPayrollRecords(prev => prev.map(rec => {
      if (rec.id === recordId) {
        const adv = Math.max(0, amount);
        const gross = toNum(rec.basicSalary) + toNum(rec.allowances) + toNum(rec.bonus) + toNum(rec.rewardEarnings || 0);
        const otherDeductions = toNum(rec.taxDeduction) + toNum(rec.leaveDeduction) + toNum(rec.lateAttendanceDeduction || 0);
        const totalDed = otherDeductions + adv;
        const net = Math.max(0, gross - totalDed);
        return {
          ...rec,
          advanceDeduction: adv,
          netSalary: net
        };
      }
      return rec;
    }));
  };

  const addDepartment = (dept: Omit<DepartmentItem, 'id' | 'employeeCount'>) => {
    const newDept: DepartmentItem = {
      ...dept,
      id: `DEP-${Date.now()}`,
      employeeCount: 0
    };
    setDepartments(prev => [...prev, newDept]);
  };

  const updateDepartment = (id: string, updates: Partial<DepartmentItem>) => {
    setDepartments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDepartment = (id: string): { success: boolean; message?: string } => {
    const check = canDeleteDepartment(id);
    if (!check.canDelete) {
      return { success: false, message: check.reason };
    }
    setDepartments(prev => prev.filter(d => d.id !== id));
    return { success: true };
  };

  const addDesignation = (desig: Omit<DesignationItem, 'id'>) => {
    const newDesig: DesignationItem = {
      ...desig,
      id: `DSG-${Date.now()}`
    };
    setDesignations(prev => [...prev, newDesig]);
  };

  const updateDesignation = (id: string, updates: Partial<DesignationItem>) => {
    setDesignations(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d));
  };

  const deleteDesignation = (id: string): { success: boolean; message?: string } => {
    const check = canDeleteDesignation(id);
    if (!check.canDelete) {
      return { success: false, message: check.reason };
    }
    setDesignations(prev => prev.filter(d => d.id !== id));
    return { success: true };
  };

  const addBranch = (branchData: Omit<BranchItem, 'id'>) => {
    const newBranch: BranchItem = {
      ...branchData,
      id: `BR-${Date.now()}`
    };
    setBranches(prev => [...prev, newBranch]);
  };

  const updateBranch = (id: string, branchData: Partial<BranchItem>) => {
    setBranches(prev => prev.map(b => b.id === id ? { ...b, ...branchData } : b));
  };

  const deleteBranch = (id: string) => {
    setBranches(prev => prev.filter(b => b.id !== id));
  };

  // Organization Masters
  const addGrade = (grade: Omit<GradeItem, 'id'>) => {
    const newGrade: GradeItem = {
      ...grade,
      id: `g-${Date.now()}`
    };
    setGrades(prev => [...prev, newGrade]);
  };

  const updateGrade = (id: string, updates: Partial<GradeItem>) => {
    setGrades(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g));
  };

  const deleteGrade = (id: string): { success: boolean; message?: string } => {
    setGrades(prev => prev.filter(g => g.id !== id));
    return { success: true };
  };

  const addEmploymentType = (type: Omit<EmploymentTypeItem, 'id'>) => {
    const newType: EmploymentTypeItem = {
      ...type,
      id: `et-${Date.now()}`
    };
    setEmploymentTypes(prev => [...prev, newType]);
  };

  const updateEmploymentType = (id: string, updates: Partial<EmploymentTypeItem>) => {
    setEmploymentTypes(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteEmploymentType = (id: string) => {
    setEmploymentTypes(prev => prev.filter(t => t.id !== id));
  };

  const addEmployeeCategory = (cat: Omit<EmployeeCategoryItem, 'id'>) => {
    const newCat: EmployeeCategoryItem = {
      ...cat,
      id: `ec-${Date.now()}`
    };
    setEmployeeCategories(prev => [...prev, newCat]);
  };

  const updateEmployeeCategory = (id: string, updates: Partial<EmployeeCategoryItem>) => {
    setEmployeeCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteEmployeeCategory = (id: string) => {
    setEmployeeCategories(prev => prev.filter(c => c.id !== id));
  };

  // Employee Configuration
  const updateEmployeeConfig = (config: Partial<EmployeeConfigSettings>) => {
    setEmployeeConfig(prev => ({ ...prev, ...config }));
  };

  // Approval Workflows
  const addApprovalWorkflow = (wf: Omit<ApprovalWorkflowItem, 'id'>) => {
    const newWf: ApprovalWorkflowItem = {
      ...wf,
      id: `wf-${Date.now()}`
    };
    setApprovalWorkflows(prev => [...prev, newWf]);
  };

  const updateApprovalWorkflow = (id: string, updates: Partial<ApprovalWorkflowItem>) => {
    setApprovalWorkflows(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
  };

  const deleteApprovalWorkflow = (id: string) => {
    setApprovalWorkflows(prev => prev.filter(w => w.id !== id));
  };

  // Notification Triggers
  const updateNotificationTrigger = (id: string, updates: Partial<NotificationTriggerConfig>) => {
    setNotificationTriggers(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
  };

  // General System Config
  const updateGeneralSystemConfig = (config: Partial<GeneralSystemConfig>) => {
    setGeneralSystemConfig(prev => ({ ...prev, ...config }));
  };

  // Integrations Config
  const updateIntegrationsConfig = (config: Partial<IntegrationsConfig>) => {
    setIntegrationsConfig(prev => ({ ...prev, ...config }));
  };

  const addDepartmentToBranch = (branchId: string, departmentName: string) => {
    setBranches(prev => prev.map(b => {
      if (b.id === branchId && !b.departments.includes(departmentName)) {
        return { ...b, departments: [...b.departments, departmentName] };
      }
      return b;
    }));
  };

  const removeDepartmentFromBranch = (branchId: string, departmentName: string) => {
    setBranches(prev => prev.map(b => {
      if (b.id === branchId) {
        return { ...b, departments: b.departments.filter(d => d !== departmentName) };
      }
      return b;
    }));
  };

  const addAsset = (assetData: Omit<AssetItem, 'id'>) => {
    const newAsset: AssetItem = {
      ...assetData,
      id: `AST-${Date.now()}`
    };
    setAssets(prev => [newAsset, ...prev]);
    addNotification({
      title: 'New Corporate Asset Added',
      message: `${newAsset.name} (${newAsset.assetTag}) registered into inventory.`,
      priority: 'Normal',
      category: 'Announcement'
    });
  };

  const assignAsset = (assetId: string, employeeId: string, employeeName: string, department: string) => {
    setAssets(prev => prev.map(a => {
      if (a.id === assetId) {
        return {
          ...a,
          assignedEmployeeId: employeeId,
          assignedEmployeeName: employeeName,
          assignedDepartment: department,
          assignedDate: new Date().toISOString().split('T')[0],
          status: 'Assigned'
        };
      }
      return a;
    }));
  };

  const deleteAsset = (assetId: string) => {
    setAssets(prev => prev.filter(a => a.id !== assetId));
  };

  // ============================================================================
  // Field Duty & GPS Live Tracking
  // ============================================================================
  const [fieldAssignments, setFieldAssignments] = useState<FieldAssignment[]>(INITIAL_FIELD_ASSIGNMENTS);
  const [tripSessions, setTripSessions] = useState<FieldTripSession[]>(INITIAL_TRIP_SESSIONS);
  const [trackingAlerts, setTrackingAlerts] = useState<TrackingAlert[]>(INITIAL_TRACKING_ALERTS);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('field_assignments_data', fieldAssignments);
      }
    } catch (e) {
      console.warn('Failed to save field assignments', e);
    }
  }, [fieldAssignments]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('trip_sessions_data', tripSessions);
      }
    } catch (e) {
      console.warn('Failed to save trip sessions', e);
    }
  }, [tripSessions]);

  useEffect(() => {
    try {
      if (isCloudInitialized.current && !isSyncingFromCloud.current) {
        supabaseDirect.saveCompanySetting('tracking_alerts_data', trackingAlerts);
      }
    } catch (e) {
      console.warn('Failed to save tracking alerts', e);
    }
  }, [trackingAlerts]);

  const createFieldAssignment = (data: Omit<FieldAssignment, 'id' | 'createdAt' | 'updatedAt'>): FieldAssignment => {
    const now = new Date().toISOString();
    const newAssignment: FieldAssignment = {
      ...data,
      id: `FA-${new Date().getFullYear()}-${String(fieldAssignments.length + 1).padStart(3, '0')}`,
      createdAt: now,
      updatedAt: now
    };
    setFieldAssignments(prev => [newAssignment, ...prev]);
    addNotification({
      title: 'New Field Duty Assigned',
      message: `Field duty assigned to ${data.employeeName}: ${data.dutyType} at ${data.customerSiteName}`,
      priority: 'Normal',
      category: 'Task'
    });
    return newAssignment;
  };

  const updateFieldAssignment = (id: string, updates: Partial<FieldAssignment>) => {
    setFieldAssignments(prev => prev.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a));
  };

  const cancelFieldAssignment = (id: string) => {
    const now = new Date().toISOString();
    setFieldAssignments(prev => prev.map(a => a.id === id ? { ...a, status: 'Cancelled', updatedAt: now } : a));
    setTripSessions(prev => prev.map(t => t.assignmentId === id && t.status === 'Active' ? {
      ...t,
      status: 'Cancelled',
      trackingStatus: 'Completed',
      tripEndTime: now,
      updatedAt: now
    } : t));
  };

  const startTrip = (assignmentId: string, startLat: number, startLng: number, startAddress: string = 'Starting Point'): FieldTripSession => {
    const now = new Date().toISOString();
    const assignment = fieldAssignments.find(a => a.id === assignmentId);
    const initialPoint: LocationPoint = {
      id: `pt-${Date.now()}-1`,
      tripId: `TRIP-${Date.now()}`,
      assignmentId,
      employeeId: assignment?.employeeId || currentUser.employeeId || currentUser.id,
      recordedAt: now,
      latitude: startLat,
      longitude: startLng,
      accuracy: 15,
      speed: 0
    };
    const newTrip: FieldTripSession = {
      id: initialPoint.tripId,
      assignmentId,
      employeeId: assignment?.employeeId || currentUser.employeeId || currentUser.id,
      employeeName: assignment?.employeeName || currentUser.name,
      department: assignment?.department || currentUser.department || 'Operations',
      dutyType: assignment?.dutyType || 'Travel',
      customerSiteName: assignment?.customerSiteName || 'Assigned Site',
      tripStartTime: now,
      startLat,
      startLng,
      startAddress,
      totalKm: 0,
      status: 'Active',
      locationPoints: [initialPoint],
      gpsStatus: 'GPS Active',
      trackingStatus: 'Travelling',
      lastGpsUpdate: now,
      createdAt: now,
      updatedAt: now
    };
    setTripSessions(prev => [newTrip, ...prev]);
    setFieldAssignments(prev => prev.map(a => a.id === assignmentId && a.status === 'Scheduled' ? { ...a, status: 'Active', updatedAt: now } : a));
    return newTrip;
  };

  const recordLocationPoint = (tripId: string, point: Omit<LocationPoint, 'id' | 'tripId'>) => {
    setTripSessions(prev => prev.map(trip => {
      if (trip.id !== tripId || trip.status !== 'Active') return trip;

      const prevPoint = trip.locationPoints[trip.locationPoints.length - 1] || null;
      const validation = isValidMovementPoint(prevPoint, point.latitude, point.longitude, point.accuracy);

      if (!validation.valid && prevPoint) {
        return {
          ...trip,
          lastGpsUpdate: point.recordedAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }

      const newPt: LocationPoint = {
        ...point,
        id: `pt-${Date.now()}-${trip.locationPoints.length + 1}`,
        tripId
      };
      const updatedPoints = [...trip.locationPoints, newPt];
      const totalKm = calculateSequentialRouteKm(updatedPoints);

      return {
        ...trip,
        locationPoints: updatedPoints,
        totalKm,
        lastGpsUpdate: newPt.recordedAt,
        gpsStatus: 'GPS Active',
        trackingStatus: 'Travelling',
        updatedAt: new Date().toISOString()
      };
    }));
  };

  const endTrip = (tripId: string, endLat: number, endLng: number, endAddress: string = 'Destination'): void => {
    const now = new Date().toISOString();
    setTripSessions(prev => prev.map(t => {
      if (t.id !== tripId) return t;
      const finalPoints = [...t.locationPoints];
      if (endLat && endLng) {
        finalPoints.push({
          id: `pt-end-${Date.now()}`,
          tripId,
          assignmentId: t.assignmentId,
          employeeId: t.employeeId,
          recordedAt: now,
          latitude: endLat,
          longitude: endLng,
          accuracy: 10,
          speed: 0
        });
      }
      const finalKm = calculateSequentialRouteKm(finalPoints);
      return {
        ...t,
        endLat,
        endLng,
        endAddress,
        tripEndTime: now,
        totalKm: Math.max(t.totalKm, finalKm),
        status: 'Completed',
        trackingStatus: 'Completed',
        locationPoints: finalPoints,
        lastGpsUpdate: now,
        updatedAt: now
      };
    }));
  };

  const fieldCheckIn = (assignmentId: string, lat: number, lng: number, address?: string): { success: boolean; message: string } => {
    const assignment = fieldAssignments.find(a => a.id === assignmentId);
    if (!assignment) {
      return { success: false, message: 'Field assignment not found.' };
    }

    if (assignment.attendanceType === 'Site Geofence' && assignment.siteLat && assignment.siteLng) {
      const distMeters = calculateHaversineMeters(lat, lng, assignment.siteLat, assignment.siteLng);
      if (distMeters > assignment.allowedRadiusMeters) {
        return {
          success: false,
          message: `You are outside the assigned site location (${Math.round(distMeters)}m away, allowed radius is ${assignment.allowedRadiusMeters}m).`
        };
      }
    }

    const now = new Date();
    const nowIso = now.toISOString();
    const empId = assignment.employeeId || currentUser.employeeId || currentUser.id;

    markAttendance(empId, 'Present', 'GPS Check-In', {
      lat,
      lng,
      address: address || assignment.siteAddress || assignment.customerSiteName,
      inGeofence: true
    });

    setFieldAssignments(prev => prev.map(a => a.id === assignmentId ? {
      ...a,
      status: 'Active',
      updatedAt: nowIso
    } : a));

    setTripSessions(prev => prev.map(t => t.assignmentId === assignmentId ? {
      ...t,
      checkInTime: nowIso,
      updatedAt: nowIso
    } : t));

    return { success: true, message: 'Field check-in verified successfully.' };
  };

  const fieldCheckOut = (assignmentId: string): void => {
    const nowIso = new Date().toISOString();
    setFieldAssignments(prev => prev.map(a => a.id === assignmentId ? {
      ...a,
      status: 'Completed',
      updatedAt: nowIso
    } : a));

    setTripSessions(prev => prev.map(t => t.assignmentId === assignmentId ? {
      ...t,
      checkOutTime: nowIso,
      status: 'Completed',
      trackingStatus: 'Completed',
      updatedAt: nowIso
    } : t));
  };

  const resolveTrackingAlert = (alertId: string) => {
    const now = new Date();
    setTrackingAlerts(prev => prev.map(alt => {
      if (alt.id !== alertId) return alt;
      const startMs = new Date(alt.issueStartTime).getTime();
      const durationMin = Math.max(1, Math.round((now.getTime() - startMs) / 60000));
      return {
        ...alt,
        status: 'Resolved',
        issueEndTime: now.toISOString(),
        durationMinutes: durationMin,
        updatedAt: now.toISOString()
      };
    }));
  };

  const getTodayFieldAssignment = (employeeId: string): FieldAssignment | undefined => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    return fieldAssignments.find(a => {
      if (a.employeeId !== employeeId && a.employeeName !== employeeId) return false;
      if (a.status === 'Cancelled') return false;
      if (a.scheduleType === 'One Day') {
        return a.startDate === todayStr;
      } else if (a.scheduleType === 'Date Range') {
        return todayStr >= a.startDate && todayStr <= a.endDate;
      } else if (a.scheduleType === 'Weekly') {
        const startDayOfWeek = new Date(a.startDate).getDay();
        return now.getDay() === startDayOfWeek && todayStr >= a.startDate && todayStr <= a.endDate;
      }
      return todayStr >= a.startDate && todayStr <= a.endDate;
    });
  };


  // ============================================================================
  // MASTER SUPABASE CLOUD SYNCHRONIZATION ENGINE
  // Connects and synchronizes all HRM modules across all devices and browsers
  // ============================================================================
  const syncAllModulesFromDatabase = async (isInitial = false) => {
    if (isSyncingFromCloud.current) return;
    try {
      isSyncingFromCloud.current = true;

      // Parallel batch fetch directly from Supabase Cloud
      const [rawEmployees, rawTasks, cloudSettings, cloudDepts] = await Promise.all([
        supabaseDirect.getEmployees().catch(() => []),
        supabaseDirect.getTasks().catch(() => []),
        supabaseDirect.getAllCompanySettings().catch(() => ({})),
        supabaseDirect.getDepartments().catch(() => [])
      ]);

      // 1. Synchronize Employees
      if (Array.isArray(rawEmployees) && rawEmployees.length > 0) {
        const mapped = rawEmployees.map(mapEmployeeFromDb);
        setEmployees(mapped);
      }

      // 2. Synchronize Enterprise Tasks
      if (Array.isArray(rawTasks) && rawTasks.length > 0) {
        const sanitized = rawTasks.map(sanitizeSelfAssignedTask);
        setEnhancedTasks(sanitized);
      }

      // 3. Synchronize All Company Settings & Core Modules
      const settings: Record<string, any> = (cloudSettings || {}) as Record<string, any>;
      if (settings) {
        // Organization Structure & Departments
        const cloudOrg = settings.org_structure;
        if (cloudOrg && typeof cloudOrg === 'object') {
          const deptNames = Array.isArray(cloudOrg.departments) ? [...cloudOrg.departments] : [];
          if (Array.isArray(cloudDepts)) {
            cloudDepts.forEach((d: any) => {
              if (d.name && !deptNames.includes(d.name)) deptNames.push(d.name);
            });
          }
          const mergedOrg: OrganizationStructure = {
            departments: deptNames,
            designations: Array.isArray(cloudOrg.designations) ? cloudOrg.designations : [],
            employmentTypes: Array.isArray(cloudOrg.employmentTypes) ? cloudOrg.employmentTypes : [],
            workLocations: Array.isArray(cloudOrg.workLocations) ? cloudOrg.workLocations : [],
            reportingManagers: Array.isArray(cloudOrg.reportingManagers) ? cloudOrg.reportingManagers : [],
            teams: Array.isArray(cloudOrg.teams) ? cloudOrg.teams : []
          };
          setOrgStructure(mergedOrg);

          setDepartments(mergedOrg.departments.map(name => ({
            id: `dept-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
            name,
            code: name.substring(0, 4).toUpperCase(),
            headName: 'Unassigned',
            headId: '',
            employeeCount: 0,
            budget: 0
          })));
        } else if (Array.isArray(cloudDepts) && cloudDepts.length > 0) {
          setOrgStructure(prev => ({ ...prev, departments: cloudDepts.map(d => d.name) }));
          setDepartments(cloudDepts.map(d => ({
            id: d.id,
            name: d.name,
            code: d.code,
            headName: 'Unassigned',
            headId: d.head_id || '',
            employeeCount: 0,
            budget: d.budget || 0
          })));
        }

        // Company Details & Branches
        if (settings.company_info && typeof settings.company_info === 'object' && settings.company_info.companyName) {
          setCompanyInfo(settings.company_info);
        }
        if (Array.isArray(settings.company_branches) && settings.company_branches.length > 0) {
          setCompanyBranches(settings.company_branches);
        }

        // Shifts
        if (Array.isArray(settings.shifts_data)) {
          const cleanShifts = settings.shifts_data.filter((s: Shift) => 
            s && s.id !== 'SH-01' && s.id !== 'SH-02' && s.id !== 'SH-03' &&
            !['morning standard', 'afternoon shift', 'night shift', 'general day shift'].includes((s.shiftName || '').toLowerCase().trim())
          );
          setShifts(cleanShifts);
        }

        // Shift Requests
        if (Array.isArray(settings.shift_requests_data)) {
          setShiftRequests(settings.shift_requests_data);
        }

        // Leave Requests
        if (Array.isArray(settings.leave_requests_data)) {
          setLeaveRequests(settings.leave_requests_data);
        }

        // Holiday Policies
        if (Array.isArray(settings.holiday_policies_data)) {
          setHolidayPolicies(settings.holiday_policies_data);
        }

        // Attendance Records
        if (Array.isArray(settings.attendance_records_data)) {
          setAttendanceRecords(settings.attendance_records_data);
        }

        // Loan Policies
        if (Array.isArray(settings.loan_policies_data)) {
          setLoanPolicies(settings.loan_policies_data);
        }

        // Loan Records
        if (Array.isArray(settings.loan_records_data)) {
          setLoanRecords(settings.loan_records_data);
        }

        // Assets
        if (Array.isArray(settings.assets_data)) {
          setAssets(settings.assets_data);
        }

        // Expenses
        if (Array.isArray(settings.expenses_data)) {
          setExpenses(settings.expenses_data);
        }

        // MOM Meetings
        if (Array.isArray(settings.mom_meetings_data)) {
          setMomMeetings(settings.mom_meetings_data);
        }

        // Payroll Records
        if (Array.isArray(settings.payroll_records_data)) {
          setPayrollRecords(settings.payroll_records_data);
        }

        // Geofence Config
        if (settings.geofence_config && typeof settings.geofence_config === 'object' && settings.geofence_config.officeName) {
          setGeofenceConfig(settings.geofence_config);
        }

        // Field Duty & Tracking
        if (Array.isArray(settings.field_assignments_data)) {
          setFieldAssignments(settings.field_assignments_data);
        }
        if (Array.isArray(settings.trip_sessions_data)) {
          setTripSessions(settings.trip_sessions_data);
        }
        if (Array.isArray(settings.tracking_alerts_data)) {
          setTrackingAlerts(settings.tracking_alerts_data);
        }

        // Payroll Settings Config (Salary Components, PF, ESIC, Tax, etc.)
        if (settings.payroll_settings_config && typeof settings.payroll_settings_config === 'object') {
          setPayrollSettingsConfig(settings.payroll_settings_config);
        }

        // Master Attendance Policies
        if (Array.isArray(settings.master_attendance_policies_data) && settings.master_attendance_policies_data.length > 0) {
          setMasterAttendancePolicies(settings.master_attendance_policies_data);
        }

        // Master Leave Policies
        if (Array.isArray(settings.master_leave_policies_data) && settings.master_leave_policies_data.length > 0) {
          setMasterLeavePolicies(settings.master_leave_policies_data);
        }

        // Department OT Policies
        if (Array.isArray(settings.department_ot_policies_data) && settings.department_ot_policies_data.length > 0) {
          setDepartmentOtPolicies(settings.department_ot_policies_data);
        }

        // Designations
        if (Array.isArray(settings.designations_data) && settings.designations_data.length > 0) {
          setDesignations(settings.designations_data);
        }

        // Departments
        if (Array.isArray(settings.departments_data) && settings.departments_data.length > 0) {
          setDepartments(settings.departments_data);
        }

        // Rewards & Recognition
        if (Array.isArray(settings.reward_policies_data)) {
          setRewardPolicies(settings.reward_policies_data);
        }
        if (Array.isArray(settings.employee_rewards_data)) {
          setEmployeeRewardRecords(settings.employee_rewards_data);
        }

        // Enterprise System Config
        if (Array.isArray(settings.grades_data)) setGrades(settings.grades_data);
        if (Array.isArray(settings.employment_types_data)) setEmploymentTypes(settings.employment_types_data);
        if (Array.isArray(settings.employee_categories_data)) setEmployeeCategories(settings.employee_categories_data);
        if (settings.employee_config_data) setEmployeeConfig(settings.employee_config_data);
        if (settings.general_system_config_data) setGeneralSystemConfig(settings.general_system_config_data);
        if (settings.integrations_config_data) setIntegrationsConfig(settings.integrations_config_data);
      }
    } catch (err) {
      console.warn('[HRMSContext] syncAllModulesFromDatabase notice:', err);
    } finally {
      isSyncingFromCloud.current = false;
      isCloudInitialized.current = true;
    }
  };

  useEffect(() => {
    let isCancelled = false;
    syncAllModulesFromDatabase(true);

    // Live Supabase auto-sync poll (every 15 seconds) across all devices
    const syncInterval = setInterval(() => {
      if (!isCancelled) {
        syncAllModulesFromDatabase(false);
      }
    }, 15000);

    // Sync immediately whenever user switches tabs or window receives focus
    const onFocusWindow = () => {
      if (!isCancelled) {
        syncAllModulesFromDatabase(false);
      }
    };
    window.addEventListener('focus', onFocusWindow);

    return () => {
      isCancelled = true;
      clearInterval(syncInterval);
      window.removeEventListener('focus', onFocusWindow);
    };
  }, []);

  const refreshEmployees = async () => {
    await syncAllModulesFromDatabase(false);
  };

  const refreshSettings = async () => {
    await syncAllModulesFromDatabase(false);
  };

  const refreshTasks = async () => {
    await syncAllModulesFromDatabase(false);
  };

  const syncAllWithCloud = async () => {
    await syncAllModulesFromDatabase(false);
  };

  return (
    <HRMSContext.Provider value={{
      currentUser,
      updateCurrentUser,
      switchRole,
      hasPermission,
      permissionMatrix,
      updatePermission,
      employees,
      addEmployee,
      updateEmployee,
      deleteEmployee,
      deleteMultipleEmployees,
      refreshEmployees,
      refreshSettings,
      syncAllWithCloud,
      resetEmployeeLogin,
      updateEmployeeLoginStatus,
      changeEmployeePassword,
      attendanceRecords,
      markAttendance,
      attendanceAuditLogs,
      correctAttendanceRecord,
      missedPunchRequests,
      submitMissedPunchRequest,
      approveMissedPunchRequest,
      rejectMissedPunchRequest,
      editAndApproveMissedPunchRequest,
      overtimeRequests,
      submitOtRequest,
      approveOtRequest,
      rejectOtRequest,
      editAndApproveOtRequest,
      deleteOtRequest,
      addManualOtEntry,
      addManualAttendanceRecord,
      departmentOtPolicies,
      updateDepartmentOtPolicy,
      employeeOtPolicies,
      updateEmployeeOtPolicy,
      overtimePolicy,
      updateOvertimePolicy,
      attendancePolicyConfig,
      updateAttendancePolicyConfig,
      attendanceGlobalSettings,
      updateAttendanceGlobalSettings,
      recordEmployeePunch,
      getEmployeeShiftAttendanceState,
      faceLogs,
      addFaceLog,
      leaveRequests,
      applyLeave,
      approveLeave,
      rejectLeave,
      shifts,
      shiftRequests,
      addShift,
      updateShift,
      deleteShift,
      requestShiftChange,
      approveShiftRequest,
      rejectShiftRequest,
      tasks,
      addTask,
      updateTaskStatus,
      deleteTask,
      enhancedTasks,
      refreshTasks,
      createEnhancedTask,
      updateAssigneeProgress,
      closeTask,
      reopenTask,
      addTaskDailyReport,
      updateTaskProcessStatus,
      addTaskComment,
      addTaskAttachment,
      addTaskLink,
      deleteTaskLink,
      convertMOMActionToTask,
      syncMOMTask,
      deleteEnhancedTask,
      taskMasters,
      addTaskMaster,
      updateTaskMaster,
      deleteTaskMaster,
      momMeetings,
      addMOMMeeting,
      escalationRules,
      updateEscalationRule,
      taskWeights,
      updateTaskWeights,
      performanceScores,
      jobOpenings,
      candidates,
      addJobOpening,
      updateCandidateStage,
      referCandidate,
      reviewReferral,
      expenses,
      addExpense,
      approveExpense,
      notifications,
      markNotificationRead,
      markAllNotificationsRead,
      addNotification,
      payrollRecords,
      processPayrollBatch,
      updateEmployeeSalaryScheme,
      updatePayrollRecordAdvanceDeduction,
      departments,
      addDepartment,
      updateDepartment,
      deleteDepartment,
      designations,
      addDesignation,
      updateDesignation,
      deleteDesignation,
      canDeleteEmployee,
      canDeleteDepartment,
      canDeleteBranch,
      canDeleteShift,
      canDeleteDesignation,
      branches,
      addBranch,
      updateBranch,
      deleteBranch,
      addDepartmentToBranch,
      removeDepartmentFromBranch,
      assets,
      addAsset,
      assignAsset,
      deleteAsset,
      searchQuery,
      setSearchQuery,
      activeModule,
      setActiveModule,
      activeSettingsTab,
      setActiveSettingsTab,
      workflowFormat,
      setWorkflowFormat,
      geofenceConfig,
      updateGeofenceConfig,
      isGeofenceAdmin,
      leavePolicies,
      addLeavePolicy,
      updateLeavePolicy,
      deleteLeavePolicy,
      holidayPolicies,
      addHolidayPolicy,
      updateHolidayPolicy,
      deleteHolidayPolicy,
      attendancePolicies,
      addAttendancePolicy,
      updateAttendancePolicy,
      deleteAttendancePolicy,
      weeklySchedules,
      addWeeklySchedule,
      updateWeeklySchedule,
      deleteWeeklySchedule,
      attendanceConfig,
      updateAttendanceConfig,
      policyDocuments,
      addPolicyDocument,
      updatePolicyDocument,
      deletePolicyDocument,
      businessSettings,
      updateBusinessSettings,
      grades,
      addGrade,
      updateGrade,
      deleteGrade,
      employmentTypes,
      addEmploymentType,
      updateEmploymentType,
      deleteEmploymentType,
      employeeCategories,
      addEmployeeCategory,
      updateEmployeeCategory,
      deleteEmployeeCategory,
      employeeConfig,
      updateEmployeeConfig,
      approvalWorkflows,
      addApprovalWorkflow,
      updateApprovalWorkflow,
      deleteApprovalWorkflow,
      notificationTriggers,
      updateNotificationTrigger,
      generalSystemConfig,
      updateGeneralSystemConfig,
      integrationsConfig,
      updateIntegrationsConfig,

      // 5 New Settings Modules & Dynamic Policy Engine
      companyInfo,
      updateCompanyInfo,
      companyBranches,
      addCompanyBranch,
      updateCompanyBranch,
      deleteCompanyBranch,
      orgStructure,
      updateOrgStructure,
      editDepartment,
      removeOrgDepartment,
      editDesignation,
      removeOrgDesignation,
      editEmploymentType,
      removeOrgEmploymentType,
      editWorkLocation,
      removeOrgWorkLocation,
      loadCompanyPreset,
      masterAttendancePolicies,
      addMasterAttendancePolicy,
      updateMasterAttendancePolicy,
      archiveMasterAttendancePolicy,
      toggleMasterAttendancePolicyStatus,
      attendanceCorrections,
      submitAttendanceCorrection,
      reviewAttendanceCorrection,
      masterLeavePolicies,
      addMasterLeavePolicy,
      updateMasterLeavePolicy,
      archiveMasterLeavePolicy,
      toggleMasterLeavePolicyStatus,
      deleteMasterLeavePolicy,
      resetMasterLeavePoliciesToDefault,
      sandwichPolicies,
      sandwichAuditLogs,
      createSandwichPolicy,
      updateSandwichPolicy,
      archiveSandwichPolicy,
      toggleSandwichPolicyStatus,
      deleteSandwichPolicy,
      overrideSandwichCalculation,
      computeSandwichCalculation,
      addSandwichAuditLog,
      payrollSettingsConfig,
      updatePayrollSettingsConfig,
      toggleSalaryComponent,
      rewardPolicies,
      addRewardPolicy,
      updateRewardPolicy,
      archiveRewardPolicy,
      toggleRewardPolicyStatus,
      employeeRewardRecords,
      grantRewardToEmployee,
      policyAuditLogs,
      addPolicyAuditLog,

      // Advance Salary / Loan Management
      loanPolicies,
      activeLoanPolicy,
      createLoanPolicy,
      updateLoanPolicy,
      deleteLoanPolicy,
      loanRecords,
      submitLoanRequest,
      reviewLoanRequest,
      disburseLoan,
      recordManualRepayment,
      calculateEmployeeLoanEligibility,

      // Field Duty & GPS Live Tracking
      fieldAssignments,
      tripSessions,
      trackingAlerts,
      createFieldAssignment,
      updateFieldAssignment,
      cancelFieldAssignment,
      startTrip,
      recordLocationPoint,
      endTrip,
      fieldCheckIn,
      fieldCheckOut,
      resolveTrackingAlert,
      getTodayFieldAssignment
    }}>
      {children}
    </HRMSContext.Provider>
  );
};

export const useHRMS = () => {
  const context = useContext(HRMSContext);
  if (!context) {
    throw new Error('useHRMS must be used within a HRMSProvider');
  }
  return context;
};
