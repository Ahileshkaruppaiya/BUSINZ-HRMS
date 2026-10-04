import { z } from 'zod';
export const createShiftSchema = z.object({
    shiftName: z.string().trim().min(2, 'shiftName must be at least 2 characters').max(100, 'shiftName cannot exceed 100 characters'),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'startTime must be valid 24-hour time (HH:MM or HH:MM:SS)'),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, 'endTime must be valid 24-hour time (HH:MM or HH:MM:SS)'),
    workingHours: z.number().positive().max(24, 'workingHours cannot exceed 24').optional().default(8),
    graceMinutes: z.number().min(0).max(180, 'graceMinutes cannot exceed 180').optional().default(15),
    breakDurationMinutes: z.number().min(0).max(360, 'breakDurationMinutes cannot exceed 360').optional().default(45),
    department: z.string().max(100).optional().default('General'),
    daysOfWeek: z.array(z.string()).optional(),
});
export const assignEmployeesSchema = z.object({
    employeeIds: z.array(z.string().max(50)).min(1, 'employeeIds must contain at least one employee ID'),
});
//# sourceMappingURL=shiftValidators.js.map