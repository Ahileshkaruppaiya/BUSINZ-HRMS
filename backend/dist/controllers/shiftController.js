import { shiftRepository } from '../repositories/shiftRepository.js';
import { createShiftSchema, assignEmployeesSchema } from '../validators/shiftValidators.js';
export const getShifts = async (_req, res, next) => {
    try {
        const shifts = await shiftRepository.getShifts();
        res.status(200).json({
            success: true,
            data: shifts,
        });
    }
    catch (err) {
        next(err);
    }
};
export const createShift = async (req, res, next) => {
    try {
        const validated = createShiftSchema.parse(req.body);
        const newShift = await shiftRepository.createShift(validated);
        res.status(201).json({
            success: true,
            data: newShift,
        });
    }
    catch (err) {
        next(err);
    }
};
export const assignEmployeesToShift = async (req, res, next) => {
    try {
        const id = String(req.params.id);
        const validated = assignEmployeesSchema.parse(req.body);
        const updatedShift = await shiftRepository.assignEmployees(id, validated.employeeIds);
        if (!updatedShift) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: `Shift ${id} not found`,
                    details: [],
                },
            });
            return;
        }
        res.status(200).json({
            success: true,
            data: updatedShift,
        });
    }
    catch (err) {
        next(err);
    }
};
//# sourceMappingURL=shiftController.js.map