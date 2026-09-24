import { salaryStructureService } from '../services/salaryStructureService.js';
import { salaryStructureSchema } from '../validators/payrollValidators.js';
export class SalaryStructureController {
    async getStructure(req, res, next) {
        try {
            const structure = await salaryStructureService.getStructure(req.params.employeeId);
            res.json({ success: true, data: structure });
        }
        catch (err) {
            next(err);
        }
    }
    async saveStructure(req, res, next) {
        try {
            const validated = salaryStructureSchema.parse(req.body);
            const saved = await salaryStructureService.saveStructure(req.params.employeeId, validated);
            res.status(201).json({ success: true, data: saved });
        }
        catch (err) {
            next(err);
        }
    }
}
export const salaryStructureController = new SalaryStructureController();
//# sourceMappingURL=salaryStructureController.js.map