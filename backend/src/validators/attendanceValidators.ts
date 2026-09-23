import { z } from 'zod';

export const punchSchema = z.object({
  employeeId: z.string().optional(),
  type: z.enum(['IN', 'OUT']).default('IN'),
  timestamp: z.string().optional(),
  locationLat: z.number().min(-90).max(90).optional(),
  locationLng: z.number().min(-180).max(180).optional(),
  method: z.string().optional().default('Face Scan'),
  inGeofence: z.boolean().optional().default(true),
  locationAddress: z.string().optional(),
  shiftId: z.string().optional(),
  shiftDate: z.string().optional(),
});

export const verifyFaceSchema = z.object({
  employeeId: z.string().optional(),
  facePhotoBase64: z.string().optional(),
});

export const attendanceFilterSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD').optional(),
  employeeId: z.string().optional(),
  status: z.string().optional(),
});
