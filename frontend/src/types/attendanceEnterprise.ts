// VRM Enterprise HRMS - Attendance, Shifts, Overtime & Policy Data Models
// Aligned with Section 29 Enterprise Schema

export type MissedPunchRequestType =
  | 'Missed Check-In'
  | 'Missed Check-Out'
  | 'Wrong Check-In'
  | 'Wrong Check-Out'
  | 'Missing Attendance'
  | 'Other Attendance Issue'
  // Backward-compatible aliases
  | 'Check In'
  | 'Check Out'
  | 'Full Attendance'
  | 'Correction';

export interface MissedPunchRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  shiftName?: string;
  requestType: MissedPunchRequestType;
  existingCheckIn?: string | null;
  existingCheckOut?: string | null;
  requestedCheckIn?: string;
  requestedCheckOut?: string;
  reason: string;
  description?: string;
  attachmentUrl?: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  hrRemarks?: string;
  adjustedCheckIn?: string;
  adjustedCheckOut?: string;
}

export type OvertimeMultiplierType =
  | 'Fixed Amount Per Hour'
  | 'Half Day'
  | 'Full Day'
  | 'Regularize'
  | '1x Salary'
  | '1.5x Salary'
  | '2x Salary';

export interface OvertimeRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  date: string;
  shiftName?: string;
  shiftEnd: string;
  actualCheckOut: string;
  potentialOtHours: number;
  requestedOtHours: number;
  approvedOtHours: number;
  reason: string;
  workDescription?: string;
  attachmentUrl?: string;
  status: 'Pending Approval' | 'Approved' | 'Partially Approved' | 'Rejected' | 'Manually Added';
  source?: 'Employee Request' | 'Manual OT';
  multiplier: OvertimeMultiplierType;
  hourlyRate: number;
  calculatedAmount: number;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewRemarks?: string;
}

export interface ShiftModel {
  id: string;
  shiftName: string;
  shiftCode: string;
  startTime: string; // '09:00' or '09:00 AM'
  endTime: string;   // '18:00' or '06:00 PM'
  requiredWorkingHours: number; // 9.0
  breakDurationMinutes: number; // 60
  gracePeriodMinutes: number;   // 10
  lateThresholdMinutes: number; // 15
  earlyCheckoutThresholdMinutes: number; // 10
  otStartsAfter: string; // 'After required working hours completed'
  maximumDailyOtHours: number; // 4
  color?: string;
  assignedEmployeeCount?: number;
}

export type OtCalculationMethod = 'Shift Based' | 'Working Hours Based' | 'Manual';
export type OtRateType =
  | 'Fixed Amount Per Hour'
  | 'Basic Salary Based'
  | 'Daily Salary Based'
  | 'Hourly Salary Based'
  | 'Percentage Based';

export interface OvertimePolicy {
  id: string;
  policyName: string;
  enabled: boolean;
  calculationMethod: OtCalculationMethod;
  minimumOtDurationMinutes: number; // e.g. 30 mins
  maximumDailyOtHours: number;      // e.g. 4 hours
  maximumMonthlyOtHours: number;    // e.g. 60 hours
  approvalRequired: boolean;
  approver: 'HR' | 'CEO' | 'HR_AND_CEO';
  rateMethod: OtRateType;
  fixedRatePerHour: number;         // e.g. 100
  regularMultiplier: number;        // e.g. 1.0
  weekendMultiplier: number;        // e.g. 1.5
  holidayMultiplier: number;        // e.g. 2.0
}

export interface DepartmentOtPolicy {
  id: string;
  department: string;
  otAllowed: boolean;
  policyId?: string;
  maxOtHoursDaily: number;
  maxOtHoursMonthly?: number;
  minOtDurationMinutes: number;
  approvalRequired: boolean;
  calculationMethod?: 'Actual Extra Hours' | 'Shift End Based' | 'Approved OT Only' | 'Manual OT Only';
  standardShiftHours?: number;        // e.g. 9 hrs
  otHourlyRate?: number;              // e.g. ₹100 / hr
}

export type IndividualOtException = 'Follow Department Policy' | 'Allow OT' | 'Block OT';

export interface EmployeeOtPolicy {
  id: string;
  employeeId: string;
  employeeName: string;
  department: string;
  otAllowed: boolean;
  maxOtDaily: number;
  maxOtMonthly: number;
  minOtDurationMinutes?: number;
  policyId?: string;
  approvalRequired: boolean;
  individualException: IndividualOtException;
  allowIndividualException?: boolean; // Backward compatibility
}

export interface AttendancePolicyConfig {
  id: string;
  // Half-Day Policy
  halfDayEnabled: boolean;
  minWorkingHoursHalfDay: number; // e.g. 4.5
  halfDayPercentageBased: boolean;
  halfDayPercentageThreshold: number; // e.g. 50
  halfDayDeductionType: 'No Deduction' | 'Fixed Deduction' | 'Half Day Salary Deduction' | 'Percentage Deduction';
  halfDayDeductionValue: number; // e.g. 50 (for 50% or fixed ₹450)

  // Absent Deduction Policy
  absentDeductionType: 'Full Day Salary' | 'Fixed Amount' | 'Percentage' | 'No Deduction';
  absentDeductionValue: number; // e.g. 100 (for 100% full day salary)

  // Late Arrival Policy
  gracePeriodMinutes: number; // e.g. 10
  lateAction: 'Mark Late' | 'Salary Deduction' | 'Warning Only';
  lateDeductionType: 'Per Minute' | 'Fixed Amount' | 'Percentage' | 'No Deduction';
  lateDeductionValue: number; // e.g. 5 (₹5 per min or 5%)

  // Early Checkout Policy
  earlyCheckoutMinutes: number; // e.g. 10
  earlyCheckoutAction: 'Mark Early Checkout' | 'Deduct Salary' | 'Warning Only';
  earlyCheckoutDeductionType: 'Per Minute' | 'Fixed Amount' | 'Percentage' | 'No Deduction';
  earlyCheckoutDeductionValue: number;
}

export interface SalaryImpactSummary {
  dailySalary: number;
  standardWorkingHours: number;
  hourlyRate: number;
  regularWorkHours: number;
  otHours: number;
  otAmount: number;
  halfDayDeduction: number;
  lateDeduction: number;
  absentDeduction: number;
  earlyCheckoutDeduction: number;
  netAdjustment: number;
}

export interface MonthlyAttendanceSummary {
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  weeklyOffDays: number;
  holidayDays: number;
  lateDays: number;
  earlyCheckoutDays: number;
  missingAttendanceDays: number;
  approvedOtHours: number;
  pendingOtHours: number;
  rejectedOtHours: number;
  totalOtAmount: number;
  totalDeductionAmount: number;
  netImpact: number;
}

export interface AttendanceGlobalSettings {
  attendanceEnabled: boolean;
  checkInEnabled: boolean;
  checkOutEnabled: boolean;
  gracePeriodMinutes: number;
  minWorkingHoursFullDay: number;
  halfDayThresholdHours: number;
  maxCorrectionDays: number;
  allowFutureDates: boolean;
  approvalFlow: 'HR_ONLY' | 'CEO_ONLY' | 'HR_AND_CEO';
  otCalculationMethod: 'Actual Extra Hours' | 'Shift End Based' | 'Approved OT Only' | 'Manual OT Only';
  otRateType: 'Fixed Amount Per Hour' | 'Percentage of Basic' | 'Percentage of Hourly Rate';
  fixedOtRatePerHour: number;
}
