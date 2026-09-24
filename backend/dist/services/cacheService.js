/**
 * High-Throughput In-Memory TTL Cache Service
 * Provides sub-millisecond memory lookups for frequently read static/semi-static data
 * such as payroll settings and active employee structures.
 */
export class MemoryCacheService {
    cache = new Map();
    cleanupInterval = null;
    constructor() {
        // Periodically sweep expired entries every 30 seconds
        this.cleanupInterval = setInterval(() => {
            this.sweep();
        }, 30000);
        // Prevent interval from hanging Node process on exit
        if (this.cleanupInterval.unref) {
            this.cleanupInterval.unref();
        }
    }
    /**
     * Get cached entry if not expired.
     */
    get(key) {
        const entry = this.cache.get(key);
        if (!entry)
            return undefined;
        if (Date.now() > entry.expiresAt) {
            this.cache.delete(key);
            return undefined;
        }
        return entry.value;
    }
    /**
     * Set cached entry with TTL in milliseconds (default: 30,000ms = 30s).
     */
    set(key, value, ttlMs = 30000) {
        this.cache.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
        });
    }
    /**
     * Remove a specific key from cache.
     */
    invalidate(key) {
        this.cache.delete(key);
    }
    /**
     * Invalidate all keys matching a prefix pattern.
     */
    invalidatePattern(prefix) {
        for (const key of this.cache.keys()) {
            if (key.startsWith(prefix)) {
                this.cache.delete(key);
            }
        }
    }
    /**
     * Clear entire cache.
     */
    clear() {
        this.cache.clear();
    }
    /**
     * Remove expired entries.
     */
    sweep() {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now > entry.expiresAt) {
                this.cache.delete(key);
            }
        }
    }
}
export const memoryCache = new MemoryCacheService();
//# sourceMappingURL=cacheService.js.map