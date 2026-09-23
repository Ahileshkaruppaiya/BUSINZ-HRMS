import {
  MissedPunchRequest,
  OvertimeRequest,
  DepartmentOtPolicy,
  EmployeeOtPolicy,
  AttendanceGlobalSettings,
  OvertimePolicy,
  AttendancePolicyConfig
} from '../types/attendanceEnterprise';

export const INITIAL_OVERTIME_POLICY: OvertimePolicy = {
  id: 'OTP-001',
  policyName: 'Standard Corporate Overtime Policy',
  enabled: true,
  calculationMethod: 'Shift Based',
  minimumOtDurationMinutes: 30,
  maximumDailyOtHours: 4.0,
  maximumMonthlyOtHours: 60.0,
  approvalRequired: true,
  approver: 'HR_AND_CEO',
  rateMethod: 'Daily Salary Based', // Daily Salary ÷ Standard Working Hours = Hourly Rate
  fixedRatePerHour: 100,
  regularMultiplier: 1.0,
  weekendMultiplier: 1.5,
  holidayMultiplier: 2.0
};

export const INITIAL_ATTENDANCE_POLICY_CONFIG: AttendancePolicyConfig = {
  id: 'APC-001',
  halfDayEnabled: true,
  minWorkingHoursHalfDay: 4.5,
  halfDayPercentageBased: false,
  halfDayPercentageThreshold: 50,
  halfDayDeductionType: 'Half Day Salary Deduction',
  halfDayDeductionValue: 50,

  absentDeductionType: 'Full Day Salary',
  absentDeductionValue: 100,

  gracePeriodMinutes: 10,
  lateAction: 'Mark Late',
  lateDeductionType: 'Fixed Amount',
  lateDeductionValue: 100,

  earlyCheckoutMinutes: 10,
  earlyCheckoutAction: 'Mark Early Checkout',
  earlyCheckoutDeductionType: 'Fixed Amount',
  earlyCheckoutDeductionValue: 100
};

export const INITIAL_MISSED_PUNCH_REQUESTS: MissedPunchRequest[] = [];

export const INITIAL_OVERTIME_REQUESTS: OvertimeRequest[] = [];

export const INITIAL_DEPARTMENT_OT_POLICIES: DepartmentOtPolicy[] = [];

export const INITIAL_EMPLOYEE_OT_POLICIES: EmployeeOtPolicy[] = [];

export const INITIAL_ATTENDANCE_GLOBAL_SETTINGS: AttendanceGlobalSettings = {
  attendanceEnabled: true,
  checkInEnabled: true,
  checkOutEnabled: true,
  gracePeriodMinutes: 10,
  minWorkingHoursFullDay: 9.0,
  halfDayThresholdHours: 4.5,
  maxCorrectionDays: 30,
  allowFutureDates: false,
  approvalFlow: 'HR_AND_CEO',
  otCalculationMethod: 'Shift End Based',
  otRateType: 'Fixed Amount Per Hour',
  fixedOtRatePerHour: 100
};
