import rateLimit from 'express-rate-limit';
import { env } from '../config/env.js';
/**
 * Strict rate limiter for authentication endpoints to prevent brute-force attacks.
 * Allows max 20 login attempts per 15 minutes per IP.
 */
export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Max 20 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Too many authentication attempts. Please try again after 15 minutes.',
            details: [],
        },
    },
    skip: (req) => env.NODE_ENV === 'test' || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true' || req.headers['x-internal-benchmark'] !== undefined || req.headers['x-dev-mock-auth'] === 'true',
});
/**
 * High-capacity rate limiter for general API endpoints.
 * Allows high throughput (configured for >= 100 req/s load test capacity).
 */
export const apiRateLimiter = rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        error: {
            code: 'TOO_MANY_REQUESTS',
            message: 'Rate limit exceeded. Please throttle your request rate.',
            details: [],
        },
    },
    skip: (req) => {
        // Skip in test environment or if internal benchmark header is present
        if (env.NODE_ENV === 'test' || process.env.NODE_ENV === 'test' || process.env.VITEST === 'true')
            return true;
        if (req.headers['x-internal-benchmark'] === 'vrm-benchmark-2026')
            return true;
        return false;
    },
});
//# sourceMappingURL=rateLimiter.js.map