import { Router } from 'express';
import { changePassword, forgotPassword, login, me, resetPassword, verifyResetOtp } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';
export const authRouter = Router();
authRouter.post('/login', authRateLimiter, login);
authRouter.get('/me', authenticateToken, me);
authRouter.post('/change-password', authenticateToken, changePassword);
// Secure Password Reset Lifecycle Routes
authRouter.post('/forgot-password', authRateLimiter, forgotPassword);
authRouter.post('/verify-reset-otp', authRateLimiter, verifyResetOtp);
authRouter.post('/reset-password', authRateLimiter, resetPassword);
//# sourceMappingURL=authRoutes.js.map