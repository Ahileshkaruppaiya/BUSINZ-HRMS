import { overtimeService } from '../services/overtimeService.js';
import { overtimeCreateSchema } from '../validators/payrollValidators.js';
export class OvertimeController {
    async getAllOvertime(_req, res, next) {
        try {
            const records = await overtimeService.getAllOvertime();
            res.json({ success: true, data: records });
        }
        catch (err) {
            next(err);
        }
    }
    async createOvertime(req, res, next) {
        try {
            const validated = overtimeCreateSchema.parse(req.body);
            const record = await overtimeService.createOvertime(validated);
            res.status(201).json({ success: true, data: record });
        }
        catch (err) {
            next(err);
        }
    }
    async approveOvertime(req, res, next) {
        try {
            const approver = req.user?.name || 'Authorized Manager';
            const approved = await overtimeService.approveOvertime(req.params.id, approver);
            res.json({ success: true, data: approved });
        }
        catch (err) {
            next(err);
        }
    }
}
export const overtimeController = new OvertimeController();
//# sourceMappingURL=overtimeController.js.map