import { z } from 'zod';

export const createLeaveSchema = z.object({
  employeeId: z.string().optional(),
  leaveType: z.enum(['Casual', 'Sick', 'Earned', 'Maternity', 'Paternity', 'Unpaid']).default('Casual'),
  startDate: z.string().min(1, 'startDate is required'),
  endDate: z.string().min(1, 'endDate is required'),
  reason: z.string().optional().default('Personal Leave'),
  daysCount: z.number().positive().optional(),
}).refine(
  (data) => {
    if (!data.startDate || !data.endDate) return true;
    return new Date(data.endDate) >= new Date(data.startDate);
  },
  {
    message: 'endDate must be greater than or equal to startDate',
    path: ['endDate'],
  }
);

export const reviewLeaveSchema = z.object({
  decision: z.enum(['Approved', 'Rejected', 'approved', 'rejected'], {
    errorMap: () => ({ message: 'decision must be either Approved or Rejected' }),
  }),
  comment: z.string().optional(),
});
