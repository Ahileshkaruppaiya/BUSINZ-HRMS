import { z } from 'zod';

export const salaryStructureSchema = z.object({
  monthlySalary: z.number().positive('Monthly salary must be greater than zero'),
  basicPercentage: z.number().min(0).max(100),
  daPercentage: z.number().min(0).max(100),
  conveyancePercentage: z.number().min(0).max(100),
  hraPercentage: z.number().min(0).max(100),
  effectiveFrom: z.string().optional(),
  effectiveTo: z.string().optional().nullable(),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    const sum = data.basicPercentage + data.daPercentage + data.conveyancePercentage + data.hraPercentage;
    return Math.abs(sum - 100) <= 0.01;
  },
  {
    message: 'The sum of basic, DA, conveyance, and HRA percentages must equal exactly 100%',
    path: ['basicPercentage'],
  }
);

export const payrollPreviewSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  payroll_month: z.number().int().min(1).max(12),
  payroll_year: z.number().int().min(2020),
  attendance_bonus: z.number().min(0).default(0),
  overtime_hours: z.number().min(0).default(0),
  overtime_rate: z.number().min(0).default(0),
  bonus: z.number().min(0).default(0),
  incentive: z.number().min(0).default(0),
  commission: z.number().min(0).default(0),
  other_earnings: z.number().min(0).default(0),
  lop_days: z.number().min(0).default(0),
  advance_recovery: z.number().min(0).default(0),
  loan_recovery: z.number().min(0).default(0),
  other_deductions: z.number().min(0).default(0),
});

export const payrollRunCreateSchema = z.object({
  payroll_month: z.number().int().min(1).max(12),
  payroll_year: z.number().int().min(2020),
});

export const payrollSettingsUpdateSchema = z.object({
  pfEnabled: z.boolean().optional(),
  pfRate: z.number().min(0).max(100).optional(),
  pfWageCeiling: z.number().positive().optional(),
  pfWageComponents: z.record(z.boolean()).optional(),
  esicEnabled: z.boolean().optional(),
  esicRate: z.number().min(0).max(100).optional(),
  esicSalaryThreshold: z.number().positive().optional(),
  esicWageComponents: z.record(z.boolean()).optional(),
  professionalTaxEnabled: z.boolean().optional(),
  professionalTaxAmount: z.number().min(0).optional(),
  lopEnabled: z.boolean().optional(),
  attendanceBonusEnabled: z.boolean().optional(),
  overtimeEnabled: z.boolean().optional(),
  standardWorkingDays: z.number().int().min(1).max(31).optional(),
});

export const overtimeCreateSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  hours: z.number().positive('Hours must be positive'),
  hourly_rate: z.number().min(0).default(0),
  reason: z.string().optional(),
});

export const advanceRecoveryCreateSchema = z.object({
  employee_id: z.string().min(1, 'Employee ID is required'),
  amount: z.number().positive('Amount must be positive'),
  monthly_emi: z.number().positive('Monthly EMI must be positive'),
  tenure_months: z.number().int().positive('Tenure months must be positive'),
  reason: z.string().optional(),
});
