import { Request, Response, NextFunction } from 'express';
import { salaryStructureService } from '../services/salaryStructureService.js';
import { salaryStructureSchema } from '../validators/payrollValidators.js';

export class SalaryStructureController {
  async getStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const structure = await salaryStructureService.getStructure(req.params.employeeId as string);
      res.json({ success: true, data: structure });
    } catch (err) {
      next(err);
    }
  }

  async saveStructure(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = salaryStructureSchema.parse(req.body);
      const saved = await salaryStructureService.saveStructure(req.params.employeeId as string, validated);
      res.status(201).json({ success: true, data: saved });
    } catch (err) {
      next(err);
    }
  }
}

export const salaryStructureController = new SalaryStructureController();
