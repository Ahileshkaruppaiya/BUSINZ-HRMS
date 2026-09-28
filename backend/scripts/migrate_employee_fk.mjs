import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function migrate() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Connected to Supabase PostgreSQL database.');

  const sql = `
    -- 1. leave_requests: cascade delete when employee is deleted
    ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_employee_id_fkey;
    ALTER TABLE public.leave_requests ADD CONSTRAINT leave_requests_employee_id_fkey 
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

    -- 2. payroll_records: cascade delete when employee is deleted
    ALTER TABLE public.payroll_records DROP CONSTRAINT IF EXISTS payroll_records_employee_id_fkey;
    ALTER TABLE public.payroll_records ADD CONSTRAINT payroll_records_employee_id_fkey 
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

    -- 3. tasks.responsible_person_id: allow NULL and set NULL on delete (so team tasks are not blocked or lost)
    ALTER TABLE public.tasks ALTER COLUMN responsible_person_id DROP NOT NULL;
    ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_responsible_person_id_fkey;
    ALTER TABLE public.tasks ADD CONSTRAINT tasks_responsible_person_id_fkey 
      FOREIGN KEY (responsible_person_id) REFERENCES public.employees(id) ON DELETE SET NULL;

    -- 4. task_updates: cascade delete when employee is deleted
    ALTER TABLE public.task_updates DROP CONSTRAINT IF EXISTS task_updates_employee_id_fkey;
    ALTER TABLE public.task_updates ADD CONSTRAINT task_updates_employee_id_fkey 
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

    -- 5. performance_scores: cascade delete when employee is deleted
    ALTER TABLE public.performance_scores DROP CONSTRAINT IF EXISTS performance_scores_employee_id_fkey;
    ALTER TABLE public.performance_scores ADD CONSTRAINT performance_scores_employee_id_fkey 
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

    -- 6. expenses: cascade delete when employee is deleted
    ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_employee_id_fkey;
    ALTER TABLE public.expenses ADD CONSTRAINT expenses_employee_id_fkey 
      FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;
  `;

  await client.query(sql);
  console.log('Successfully updated all foreign key constraints to ON DELETE CASCADE / SET NULL!');

  // Verify constraints
  const verifyQ = `
    SELECT
      tc.table_name,
      kcu.column_name,
      rc.delete_rule
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
    JOIN information_schema.referential_constraints AS rc
      ON rc.constraint_name = tc.constraint_name
    WHERE ccu.table_name = 'employees' AND rc.delete_rule = 'RESTRICT';
  `;

  const verifyRes = await client.query(verifyQ);
  console.log('Remaining RESTRICT constraints pointing to employees:');
  console.table(verifyRes.rows);

  await client.end();
}

migrate().catch(console.error);
