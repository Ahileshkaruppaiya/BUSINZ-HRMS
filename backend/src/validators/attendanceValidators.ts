import { z } from 'zod';

export const punchSchema = z.object({
  employeeId: z.string().max(50).optional(),
  type: z.enum(['IN', 'OUT']).default('IN'),
  timestamp: z.string().optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  method: z.string().max(50).optional().default('Face Scan'),
  inGeofence: z.boolean().optional().default(true),
  locationAddress: z.string().max(300, 'Location address cannot exceed 300 characters').optional(),
  shiftId: z.string().max(50).optional(),
  shiftDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'shiftDate must be YYYY-MM-DD').optional(),
});

export const verifyFaceSchema = z.object({
  employeeId: z.string().max(50).optional(),
  facePhotoBase64: z.string().optional(),
});

export const attendanceFilterSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  employeeId: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
});
