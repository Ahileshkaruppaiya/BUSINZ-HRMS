/**
 * Businz Enterprise HRMS - Centralized Production API Configuration
 * Dynamically resolves API endpoint across Localhost, Vercel, Plesk, IISNode, and Custom Domains.
 */

export const getApiBaseUrl = (): string => {
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL;
  const cleanEnvBase = typeof envBase === 'string' ? envBase.trim().replace(/\/$/, '') : '';
  const isLocalApi = (url: string) =>
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('0.0.0.0');

  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    // 1. Running on a remote domain (production server like testhrms.vrmstructures.in)
    if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
      // If an explicit remote production API URL is set in env
      if (cleanEnvBase && !isLocalApi(cleanEnvBase)) {
        return cleanEnvBase;
      }
      // Same-origin API on the domain
      return `${origin}/api/v1`;
    }
  }

  // 2. Local development fallback
  if (cleanEnvBase) {
    return cleanEnvBase;
  }

  return '/api/v1';
};

// Evaluates dynamically in template literals via primitive coercion
export const API_BASE_URL = {
  toString: () => getApiBaseUrl(),
  valueOf: () => getApiBaseUrl(),
  [Symbol.toPrimitive]: () => getApiBaseUrl(),
} as unknown as string;
