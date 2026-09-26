import { z } from 'zod';
export const updateCompanySettingsSchema = z.object({
    companyName: z.string().optional(),
    legalEntity: z.string().optional(),
    taxIdGst: z.string().optional(),
    pfRegistrationNumber: z.string().optional(),
    esiRegistrationNumber: z.string().optional(),
    address: z.string().optional(),
    city: z.string().trim().regex(/^[A-Za-z ]+$/, 'City must contain letters and spaces only.').optional().or(z.literal('')),
    state: z.string().trim().regex(/^[A-Za-z\s&.\-()]+$/, 'State must contain valid alphabetic characters').optional().or(z.literal('')),
    pincode: z.string().trim().regex(/^[0-9]{6}$/, 'Pincode must be exactly 6 digits.').optional().or(z.literal('')),
    contactEmail: z.string().email('Invalid email address').optional(),
    contactPhone: z.string().optional(),
    website: z.string().url('Invalid website URL').optional().or(z.literal('')),
});
export const updateGeofenceSettingsSchema = z.object({
    officeName: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    radiusMeters: z.number().positive().optional(),
    isEnabled: z.boolean().optional(),
    strictMode: z.boolean().optional(),
});
//# sourceMappingURL=settingsValidators.js.map