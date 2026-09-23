import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from './env.js';

let supabaseAdminClient: SupabaseClient | null = null;
let supabaseAnonClient: SupabaseClient | null = null;

export const isRealSupabaseConfigured = (): boolean => {
  return !env.SUPABASE_URL.includes('mock-supabase.local') && env.SUPABASE_ANON_KEY !== 'mock-anon-key';
};

/**
 * Service Role Client with elevated permissions for server-side payroll calculations.
 */
export const getSupabaseAdmin = (): SupabaseClient => {
  if (!supabaseAdminClient) {
    supabaseAdminClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseAdminClient;
};

/**
 * Standard public/anon client for scoped operations.
 */
export const getSupabaseAnon = (): SupabaseClient => {
  if (!supabaseAnonClient) {
    supabaseAnonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  }
  return supabaseAnonClient;
};
