/**
 * Businz Enterprise HRMS - Centralized Production API Configuration
 * Dynamically resolves API endpoint across Localhost, Vercel, Plesk, IISNode, and Custom Domains.
 */

export const getApiBaseUrl = (): string => {
  // 1. Explicit environment variable override (e.g. from Vercel / .env)
  const envBase = (import.meta as any).env?.VITE_API_BASE_URL;
  if (envBase && typeof envBase === 'string' && envBase.trim()) {
    return envBase.trim().replace(/\/$/, '');
  }

  // 2. Runtime browser environment
  if (typeof window !== 'undefined') {
    const { hostname, origin } = window.location;
    // Local development (Vite dev server)
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:8000/api/v1';
    }
    // Production deployment on same origin (Plesk / reverse proxy / unified server)
    return `${origin}/api/v1`;
  }

  return 'http://localhost:8000/api/v1';
};

export const API_BASE_URL = getApiBaseUrl();
