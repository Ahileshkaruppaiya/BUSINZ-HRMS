import { describe, it, expect } from 'vitest';
import { Decimal } from 'decimal.js';
import {
  computeSalaryStructure,
  calculatePF,
  calculateESIC,
  calculateLOP,
  computeFullPayroll,
  PayrollConfigurationError,
} from '../src/services/calculationEngine.js';
import { PayrollSettingsModel } from '../src/types/payroll.js';

const mockSettings: PayrollSettingsModel = {
  id: 'test-settings',
  orgKey: 'global',
  pfEnabled: true,
  pfRate: 12.0,
  pfWageCeiling: 15000.0,
  pfWageComponents: {
    basic: true,
    da: true,
    conveyance: true,
    hra: false,
    attendance_bonus: false,
    overtime: false,
    other_earnings: false,
  },
  esicEnabled: true,
  esicRate: 0.75,
  esicSalaryThreshold: 21000.0,
  esicWageComponents: {
    basic: true,
    da: true,
    conveyance: true,
    hra: true,
    attendance_bonus: true,
    overtime: true,
    other_earnings: true,
  },
  professionalTaxEnabled: false, // Set to false to test baseline ₹13,717.50 net
  professionalTaxAmount: 200.0,
  lopEnabled: true,
  attendanceBonusEnabled: true,
  overtimeEnabled: true,
  standardWorkingDays: 26,
  payrollCycleDay: 1,
};

describe('Production Payroll Calculation Engine — Specification Verifications', () => {
  // --------------------------------------------------------------------------
  // 1. ₹15,000 STANDARD SALARY STRUCTURE TEST (Section 49)
  // --------------------------------------------------------------------------
  it('computes 40% Basic, 20% DA, 5% Conveyance, 35% HRA for ₹15,000 accurately', () => {
    const structure = computeSalaryStructure({
      monthlySalary: 15000,
      basicPercentage: 40,
      daPercentage: 20,
      conveyancePercentage: 5,
      hraPercentage: 35,
    });

    expect(structure.basicSalary).toBe(6000.0);
    expect(structure.da).toBe(3000.0);
    expect(structure.conveyance).toBe(750.0);
    expect(structure.hra).toBe(5250.0);
    expect(structure.fixedGross).toBe(15000.0);
    expect(structure.percentagesSum).toBe(100.0);
    expect(structure.isValid).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 2. PF CALCULATION TEST: PF BASE = Basic + DA + Conveyance, RATE = 12%
  // --------------------------------------------------------------------------
  it('calculates PF base = ₹9,750 and PF 12% = ₹1,170 for ₹15,000 salary', () => {
    const basic = new Decimal(6000);
    const da = new Decimal(3000);
    const conveyance = new Decimal(750);
    const hra = new Decimal(5250);
    const zero = new Decimal(0);

    const pf = calculatePF(basic, da, conveyance, hra, zero, zero, zero, true, 12.0);

    expect(pf.pfBase.toNumber()).toBe(9750.0);
    expect(pf.pfRateApplied.toNumber()).toBe(12.0);
    expect(pf.pfAmount.toNumber()).toBe(1170.0);
  });

  // --------------------------------------------------------------------------
  // 3. ESIC CALCULATION TEST: ESIC BASE = ₹15,000, RATE = 0.75%
  // --------------------------------------------------------------------------
  it('calculates ESIC base = ₹15,000 and ESIC 0.75% = ₹112.50', () => {
    const basic = new Decimal(6000);
    const da = new Decimal(3000);
    const conveyance = new Decimal(750);
    const hra = new Decimal(5250);
    const zero = new Decimal(0);
    const gross = new Decimal(15000);

    const esic = calculateESIC(basic, da, conveyance, hra, zero, zero, zero, gross, true, 0.75, 21000);

    expect(esic.esicBase.toNumber()).toBe(15000.0);
    expect(esic.esicRateApplied.toNumber()).toBe(0.75);
    expect(esic.esicAmount.toNumber()).toBe(112.5);
  });

  // --------------------------------------------------------------------------
  // 4. NET SALARY VERIFICATION: Gross ₹15,000 - PF ₹1,170 - ESIC ₹112.50 = ₹13,717.50
  // --------------------------------------------------------------------------
  it('calculates Total Deductions = ₹1,282.50 and Net Salary = ₹13,717.50', () => {
    const result = computeFullPayroll({
      employeeId: 'EMP-001',
      monthlySalary: 15000,
      basicPercentage: 40,
      daPercentage: 20,
      conveyancePercentage: 5,
      hraPercentage: 35,
      payrollMonth: 9,
      payrollYear: 2026,
      settings: mockSettings,
      attendance: {
        workingDays: 26,
        presentDays: 26,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        absentDays: 0,
        halfDays: 0,
        lopDays: 0,
        overtimeHours: 0,
      },
    });

    expect(result.grossSalary).toBe(15000.0);
    expect(result.pfAmount).toBe(1170.0);
    expect(result.esicAmount).toBe(112.5);
    expect(result.totalDeductions).toBe(1282.5);
    expect(result.netSalary).toBe(13717.5);
  });

  // --------------------------------------------------------------------------
  // 5. ADDITIONAL EARNINGS & DYNAMIC ESIC TEST (Section 50)
  // Attendance Bonus = 500, OT = 1000, Other = 500 -> ESIC Base = 17,000, ESIC = 127.50
  // --------------------------------------------------------------------------
  it('calculates ESIC dynamically when additional earnings are present', () => {
    const result = computeFullPayroll({
      employeeId: 'EMP-001',
      monthlySalary: 15000,
      basicPercentage: 40,
      daPercentage: 20,
      conveyancePercentage: 5,
      hraPercentage: 35,
      payrollMonth: 9,
      payrollYear: 2026,
      settings: mockSettings,
      attendance: {
        workingDays: 26,
        presentDays: 26,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        absentDays: 0,
        halfDays: 0,
        lopDays: 0,
        overtimeHours: 10,
      },
      earnings: {
        attendanceBonus: 500,
        overtimeAmount: 1000,
        otherEarnings: 500,
      },
    });

    expect(result.grossSalary).toBe(17000.0);
    expect(result.esicBase).toBe(17000.0);
    expect(result.esicAmount).toBe(127.5); // 17000 * 0.75% = 127.50
  });

  // --------------------------------------------------------------------------
  // 6. MANDATORY RULE: PF CONFIGURATION FAILURE (Section 15)
  // When pf_enabled = true and pf_rate is missing/invalid, STOP payroll calculation.
  // DO NOT silently set PF = 0!
  // --------------------------------------------------------------------------
  it('halts calculation with PF_CONFIGURATION_ERROR if PF is enabled but configuration is invalid', () => {
    const basic = new Decimal(6000);
    const da = new Decimal(3000);
    const conveyance = new Decimal(750);
    const hra = new Decimal(5250);
    const zero = new Decimal(0);

    expect(() => {
      calculatePF(basic, da, conveyance, hra, zero, zero, zero, true, 0); // Invalid 0% rate with enabled PF
    }).toThrow(PayrollConfigurationError);

    expect(() => {
      calculatePF(basic, da, conveyance, hra, zero, zero, zero, true, null as unknown as number);
    }).toThrow(PayrollConfigurationError);
  });

  // --------------------------------------------------------------------------
  // 7. ESIC WAGE CEILING THRESHOLD TEST (Section 18)
  // If Gross Salary > ₹21,000, ESIC is 0 (Exempt/Ineligible)
  // --------------------------------------------------------------------------
  it('exempts employees from ESIC when Gross Salary exceeds threshold (₹21,000)', () => {
    const basic = new Decimal(10000);
    const da = new Decimal(5000);
    const conveyance = new Decimal(1250);
    const hra = new Decimal(8750);
    const zero = new Decimal(0);
    const gross = new Decimal(25000); // Exceeds ₹21,000

    const esic = calculateESIC(basic, da, conveyance, hra, zero, zero, zero, gross, true, 0.75, 21000);

    expect(esic.esicAmount.toNumber()).toBe(0);
    expect(esic.esicBase.toNumber()).toBe(0);
  });

  // --------------------------------------------------------------------------
  // 8. PERCENTAGE TOTAL VALIDATION TEST
  // --------------------------------------------------------------------------
  it('rejects salary structure when component percentages do not sum to 100%', () => {
    expect(() => {
      computeSalaryStructure({
        monthlySalary: 15000,
        basicPercentage: 40,
        daPercentage: 20,
        conveyancePercentage: 10, // 40 + 20 + 10 + 35 = 105%
        hraPercentage: 35,
      });
    }).toThrow(/must sum to 100%/);
  });

  // --------------------------------------------------------------------------
  // 9. LOP ATTENDANCE DEDUCTION TEST (Section 23)
  // Monthly ₹15,000 / 26 days = ₹576.92/day. 2 LOP days = ₹1,153.85
  // --------------------------------------------------------------------------
  it('calculates Loss of Pay (LOP) based on daily salary and unpaid days', () => {
    const monthly = new Decimal(15000);
    const lop = calculateLOP(monthly, 26, 2);

    expect(lop.dailySalary.toNumber()).toBe(576.92);
    expect(lop.lopAmount.toNumber()).toBe(1153.85);
  });

  // --------------------------------------------------------------------------
  // 10. DYNAMIC SALARY STRUCTURE REFLECTION TEST (Section 52)
  // 50% Basic, 20% DA, 5% Conveyance, 25% HRA
  // --------------------------------------------------------------------------
  it('calculates altered structure accurately (50% Basic, 20% DA, 5% Conv, 25% HRA)', () => {
    const structure = computeSalaryStructure({
      monthlySalary: 15000,
      basicPercentage: 50,
      daPercentage: 20,
      conveyancePercentage: 5,
      hraPercentage: 25,
    });

    expect(structure.basicSalary).toBe(7500.0);
    expect(structure.da).toBe(3000.0);
    expect(structure.conveyance).toBe(750.0);
    expect(structure.hra).toBe(3750.0);
    expect(structure.fixedGross).toBe(15000.0);
  });

  // --------------------------------------------------------------------------
  // 11. DUAL SCHEME TEST: withPf = false (New employee < 6 months)
  // PF = 0, ESIC = 0, Total Deductions = 0, Net = Gross ₹15,000
  // --------------------------------------------------------------------------
  it('exempts new employee (< 6 months) when withPf is false (PF = 0, ESIC = 0)', () => {
    const result = computeFullPayroll({
      employeeId: 'EMP-NEW',
      monthlySalary: 15000,
      basicPercentage: 40,
      daPercentage: 20,
      conveyancePercentage: 5,
      hraPercentage: 35,
      payrollMonth: 9,
      payrollYear: 2026,
      withPf: false,
      settings: mockSettings,
      attendance: {
        workingDays: 26,
        presentDays: 26,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        absentDays: 0,
        halfDays: 0,
        lopDays: 0,
        overtimeHours: 0,
      },
    });

    expect(result.grossSalary).toBe(15000.0);
    expect(result.pfAmount).toBe(0.0);
    expect(result.esicAmount).toBe(0.0);
    expect(result.totalDeductions).toBe(0.0);
    expect(result.netSalary).toBe(15000.0);
    expect(result.withPf).toBe(false);
  });

  // --------------------------------------------------------------------------
  // 12. ADVANCE SALARY / LOAN RECOVERY DEDUCTION ("OTHERS")
  // e.g. Advance ₹10,000 repayable across 2 months: Month 1 deduction = ₹5,000
  // --------------------------------------------------------------------------
  it('deducts Advance Salary / Loan Recovery accurately as Others deduction', () => {
    const result = computeFullPayroll({
      employeeId: 'EMP-001',
      monthlySalary: 15000,
      basicPercentage: 40,
      daPercentage: 20,
      conveyancePercentage: 5,
      hraPercentage: 35,
      payrollMonth: 9,
      payrollYear: 2026,
      withPf: true,
      settings: mockSettings,
      attendance: {
        workingDays: 26,
        presentDays: 26,
        paidLeaveDays: 0,
        unpaidLeaveDays: 0,
        absentDays: 0,
        halfDays: 0,
        lopDays: 0,
        overtimeHours: 0,
      },
      deductions: {
        advanceRecovery: 5000,
      },
    });

    expect(result.advanceRecovery).toBe(5000.0);
    // PF: 1,170 + ESIC: 112.50 + Advance: 5,000 = 6,282.50
    expect(result.totalDeductions).toBe(6282.5);
    // Net: 15,000 - 6,282.50 = 8,717.50
    expect(result.netSalary).toBe(8717.5);
  });
});
