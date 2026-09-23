import { z } from 'zod';

export const createShiftSchema = z.object({
  shiftName: z.string().min(1, 'shiftName is required'),
  startTime: z.string().min(1, 'startTime is required'),
  endTime: z.string().min(1, 'endTime is required'),
  workingHours: z.number().positive().optional().default(8),
  graceMinutes: z.number().min(0).optional().default(15),
  breakDurationMinutes: z.number().min(0).optional().default(45),
  department: z.string().optional().default('General'),
  daysOfWeek: z.array(z.string()).optional(),
});

export const assignEmployeesSchema = z.object({
  employeeIds: z.array(z.string()).min(1, 'employeeIds must contain at least one employee ID'),
});
