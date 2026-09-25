import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pg;

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to PostgreSQL Supabase!');

  await client.query(`
    CREATE TABLE IF NOT EXISTS public.company_settings (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      setting_key TEXT NOT NULL UNIQUE,
      setting_val JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'company_settings' AND policyname = 'anon_all_company_settings'
      ) THEN
        CREATE POLICY "anon_all_company_settings" ON public.company_settings 
        FOR ALL 
        TO anon, authenticated 
        USING (true) 
        WITH CHECK (true);
      END IF;
    END $$;
  `);

  console.log('Table company_settings created & policy enabled!');
  await client.end();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
