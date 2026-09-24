import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL Supabase directly!');

  const tables = [
    'employees',
    'departments',
    'shifts',
    'shift_assignments',
    'shift_requests',
    'attendance_records',
    'face_logs',
    'leave_requests',
    'payroll_records',
    'roles',
    'permissions',
    'designations',
    'tasks',
    'performance_scores',
    'job_openings',
    'candidates',
    'expenses',
    'notifications',
    'assets',
    'geofence_config',
    'workflow_config'
  ];

  for (const table of tables) {
    try {
      // Check if table exists
      const tableCheck = await client.query(
        "SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = $1",
        [table]
      );
      if (tableCheck.rows.length === 0) continue;

      // Create anon policies for all CRUD operations
      await client.query(`
        DO $$
        BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE schemaname = 'public' AND tablename = '${table}' AND policyname = 'anon_all_${table}'
          ) THEN
            CREATE POLICY "anon_all_${table}" ON public."${table}" 
            FOR ALL 
            TO anon, authenticated 
            USING (true) 
            WITH CHECK (true);
          END IF;
        END $$;
      `);
      console.log(`Enabled anon access policy for table: ${table}`);
    } catch (err) {
      console.warn(`Error on table ${table}:`, err.message);
    }
  }

  await client.end();
  console.log('Done enabling Supabase anon policies!');
}

main().catch(console.error);
