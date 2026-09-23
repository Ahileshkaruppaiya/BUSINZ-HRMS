import { Request, Response, NextFunction } from 'express';
import { payrollService } from '../services/payrollService.js';
import {
  payrollPreviewSchema,
  payrollRunCreateSchema,
  payrollSettingsUpdateSchema,
} from '../validators/payrollValidators.js';
import { PayrollSettingsModel } from '../types/payroll.js';

export class PayrollController {
  async getSettings(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await payrollService.getSettings();
      res.json({ success: true, data: settings });
    } catch (err) {
      next(err);
    }
  }

  async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = payrollSettingsUpdateSchema.parse(req.body);
      const updated = await payrollService.updateSettings(validated as unknown as Partial<PayrollSettingsModel>);
      res.json({ success: true, data: updated });
    } catch (err) {
      next(err);
    }
  }

  /**
   * Authoritative Preview API matching exact specification:
   * POST /api/v1/payroll/preview
   */
  async previewPayroll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = payrollPreviewSchema.parse(req.body);
      const result = await payrollService.previewPayroll(validated);

      res.json({
        success: true,
        data: {
          employee_id: result.employeeId,
          payroll_month: result.payrollMonth,
          payroll_year: result.payrollYear,

          salary: {
            basic: result.basicSalary,
            da: result.da,
            conveyance: result.conveyance,
            hra: result.hra,
          },

          earnings: {
            attendance_bonus: result.attendanceBonus,
            overtime: result.overtimeAmount,
            bonus: result.bonus,
            incentive: result.incentive,
            commission: result.commission,
            others: result.otherEarnings,
            gross: result.grossSalary,
          },

          deductions: {
            pf_base: result.pfBase,
            pf_rate: result.pfRate,
            pf: result.pfAmount,

            esic_base: result.esicBase,
            esic_rate: result.esicRate,
            esic: result.esicAmount,

            professional_tax: result.professionalTax,
            lop: result.lopAmount,
            advance_recovery: result.advanceRecovery,
            loan_recovery: result.loanRecovery,
            other: result.otherDeductions,

            total: result.totalDeductions,
          },

          net_salary: result.netSalary,
          breakdown: {
            earnings: result.earningsBreakdown,
            deductions: result.deductionsBreakdown,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  }

  async createRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = payrollRunCreateSchema.parse(req.body);
      const run = await payrollService.createPayrollRun(validated.payroll_month, validated.payroll_year);
      res.status(201).json({ success: true, data: run });
    } catch (err) {
      next(err);
    }
  }

  async getAllRuns(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const runs = await payrollService.getAllRuns();
      res.json({ success: true, data: runs });
    } catch (err) {
      next(err);
    }
  }

  async getRunById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const run = await payrollService.getRunById(req.params.id as string);
      if (!run) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: `Payroll run ${req.params.id} not found`, details: [] },
        });
        return;
      }
      res.json({ success: true, data: run });
    } catch (err) {
      next(err);
    }
  }

  async processRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const processor = req.user?.name || 'Finance Admin';
      const run = await payrollService.processPayrollRun(req.params.id as string, processor);
      res.json({ success: true, data: run });
    } catch (err) {
      next(err);
    }
  }

  async approveRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const approver = req.user?.name || 'Authorized Signatory';
      const run = await payrollService.approvePayrollRun(req.params.id as string, approver);
      res.json({ success: true, data: run });
    } catch (err) {
      next(err);
    }
  }

  async payRun(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const run = await payrollService.payPayrollRun(req.params.id as string);
      res.json({ success: true, data: run });
    } catch (err) {
      next(err);
    }
  }

  async getRecords(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const month = req.query.month ? Number(req.query.month) : undefined;
      const year = req.query.year ? Number(req.query.year) : undefined;
      const employeeId = req.query.employeeId as string | undefined;

      const records = await payrollService.getRecords({ month, year, employeeId });
      res.json({ success: true, data: records, total: records.length });
    } catch (err) {
      next(err);
    }
  }

  async getPayslip(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const empId = (req.params.employeeId || req.params.id) as string;
      const month = req.query.month ? Number(req.query.month) : 8;
      const year = req.query.year ? Number(req.query.year) : 2026;

      const payslip = await payrollService.getPayslip(empId, month, year);
      res.json({ success: true, data: payslip });
    } catch (err) {
      next(err);
    }
  }
}

export const payrollController = new PayrollController();
