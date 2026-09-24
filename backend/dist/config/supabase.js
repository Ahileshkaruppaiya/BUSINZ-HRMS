import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';
let supabaseAdminClient = null;
let supabaseAnonClient = null;
export const isRealSupabaseConfigured = () => {
    return !env.SUPABASE_URL.includes('mock-supabase.local') && env.SUPABASE_ANON_KEY !== 'mock-anon-key';
};
/**
 * Service Role Client with elevated permissions for server-side payroll calculations.
 */
export const getSupabaseAdmin = () => {
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
export const getSupabaseAnon = () => {
    if (!supabaseAnonClient) {
        supabaseAnonClient = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    }
    return supabaseAnonClient;
};
//# sourceMappingURL=supabase.js.map