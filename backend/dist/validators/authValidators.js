import { z } from 'zod';
export const loginSchema = z.union([
    z.object({
        identifier: z.string().min(1, 'User ID or Email is required'),
        password: z.string().min(1, 'Password is required'),
    }),
    z.object({
        email: z.string().email('Invalid email address format'),
        password: z.string().min(1, 'Password is required'),
    }),
]);
export const changePasswordSchema = z
    .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(10, 'New password must be at least 10 characters'),
    confirmPassword: z.string().min(1, 'Password confirmation is required'),
})
    .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New password and confirmation do not match',
    path: ['confirmPassword'],
});
export const updateAccountStatusSchema = z.object({
    status: z.enum(['ACTIVE', 'LOCKED', 'DISABLED'], {
        errorMap: () => ({ message: "Status must be 'ACTIVE', 'LOCKED', or 'DISABLED'" }),
    }),
});
export const forgotPasswordSchema = z.object({
    email_or_employee_id: z.string().min(1, 'Registered Email or Employee ID is required'),
});
export const verifyResetOtpSchema = z.object({
    email_or_employee_id: z.string().min(1, 'Registered Email or Employee ID is required'),
    otp: z.string().length(6, 'Verification code must be exactly 6 digits'),
});
export const resetPasswordSchema = z
    .object({
    reset_token: z.string().min(1, 'Reset token is required'),
    new_password: z
        .string()
        .min(8, 'Password must be at least 8 characters')
        .regex(/[A-Z]/, 'Password must contain at least 1 uppercase letter')
        .regex(/[a-z]/, 'Password must contain at least 1 lowercase letter')
        .regex(/[0-9]/, 'Password must contain at least 1 number')
        .regex(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/, 'Password must contain at least 1 special character'),
    confirm_password: z.string().min(1, 'Password confirmation is required'),
})
    .refine((data) => data.new_password === data.confirm_password, {
    message: 'New password and confirmation do not match',
    path: ['confirm_password'],
});
//# sourceMappingURL=authValidators.js.map