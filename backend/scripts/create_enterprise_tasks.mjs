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
    CREATE TABLE IF NOT EXISTS public.enterprise_tasks (
      id TEXT PRIMARY KEY,
      task_number TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      assigned_by TEXT,
      responsible_person_id TEXT,
      responsible_person_name TEXT,
      department TEXT,
      priority TEXT,
      due_date DATE,
      overall_status TEXT,
      overall_progress INT DEFAULT 0,
      task_data JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE public.enterprise_tasks ENABLE ROW LEVEL SECURITY;

    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'enterprise_tasks' AND policyname = 'anon_all_enterprise_tasks'
      ) THEN
        CREATE POLICY "anon_all_enterprise_tasks" ON public.enterprise_tasks 
        FOR ALL 
        TO anon, authenticated 
        USING (true) 
        WITH CHECK (true);
      END IF;
    END $$;
  `);

  console.log('Table enterprise_tasks created & policy enabled!');
  await client.end();
}

run().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
