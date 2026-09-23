import pg from 'pg';
import { env } from '../config/env.js';
import { getSupabaseAdmin, isRealSupabaseConfigured } from '../config/supabase.js';

export interface DatabaseHealth {
  configured: boolean;
  postgres: { connected: boolean; latencyMs?: number; error?: string };
  supabaseRest: { connected: boolean; latencyMs?: number; error?: string };
}

const safeMessage = (error: unknown): string => {
  const message = error instanceof Error ? error.message : 'Unknown database error';
  return message.replace(/postgres(?:ql)?:\/\/[^\s]+/gi, '[redacted]');
};

export async function checkDatabaseHealth(): Promise<DatabaseHealth> {
  const result: DatabaseHealth = {
    configured: Boolean(env.DATABASE_URL) && isRealSupabaseConfigured(),
    postgres: { connected: false },
    supabaseRest: { connected: false },
  };

  if (env.DATABASE_URL) {
    const started = Date.now();
    const client = new pg.Client({
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    });
    try {
      await client.connect();
      await client.query('SELECT 1');
      result.postgres = { connected: true, latencyMs: Date.now() - started };
    } catch (error) {
      result.postgres = { connected: false, error: safeMessage(error) };
    } finally {
      await client.end().catch(() => undefined);
    }
  } else {
    result.postgres.error = 'DATABASE_URL is not configured';
  }

  if (isRealSupabaseConfigured()) {
    const started = Date.now();
    try {
      const { error } = await getSupabaseAdmin()
        .from('employees')
        .select('id', { count: 'exact', head: true });
      if (error) throw new Error(error.message);
      result.supabaseRest = { connected: true, latencyMs: Date.now() - started };
    } catch (error) {
      result.supabaseRest = { connected: false, error: safeMessage(error) };
    }
  } else {
    result.supabaseRest.error = 'Supabase is not configured';
  }

  return result;
}
