/**
 * Businz Enterprise HRMS - Centralized Production API Configuration
 * Dynamically resolves API endpoint across Localhost, Vercel, Plesk, IISNode, and Custom Domains.
 */

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    // 1. Running on a remote domain (production server like testhrms.vrmstructures.in)
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      const envBase = (import.meta as any).env?.VITE_API_BASE_URL;
      // If an explicit remote production API URL is set in env
      if (envBase && typeof envBase === 'string' && envBase.trim() && !envBase.includes('localhost') && !envBase.includes('127.0.0.1')) {
        return envBase.trim().replace(/\/$/, '');
      }
      // Same-origin API on the domain
      return `${origin}/api/v1`;
    }
  }

  // 2. Local development fallback
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envBase && typeof envBase === 'string' && envBase.trim()) {
    return envBase.trim().replace(/\/$/, '');
  }

  return 'http://localhost:8000/api/v1';
};

// Evaluates dynamically in template literals via primitive coercion
export const API_BASE_URL = {
  toString: () => getApiBaseUrl(),
  valueOf: () => getApiBaseUrl(),
  [Symbol.toPrimitive]: () => getApiBaseUrl(),
} as unknown as string;

