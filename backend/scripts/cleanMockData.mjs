import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanMockData() {
  const client = await pool.connect();
  console.log('🚀 Connected to Supabase PostgreSQL database.');

  try {
    await client.query('BEGIN');

    // 1. Clean company_settings keys for transactional modules
    console.log('1. Clearing mock data in company_settings...');
    const emptyKeys = [
      'leave_requests_data',
      'overtime_records_data',
      'attendance_records_data',
      'payroll_records_data',
      'loan_records_data',
      'field_assignments_data',
      'expenses_data',
      'assets_data',
      'mom_meetings_data',
      'employee_rewards_data',
      'trip_sessions_data',
      'tracking_alerts_data'
    ];

    for (const key of emptyKeys) {
      const res = await client.query(
        "UPDATE public.company_settings SET setting_val = '[]'::jsonb, updated_at = NOW() WHERE setting_key = $1 RETURNING setting_key;",
        [key]
      );
      if (res.rowCount > 0) {
        console.log(`  - Reset company_settings.${key} -> []`);
      }
    }

    // 2. Clean shifts_data in company_settings to only retain the single real standard Morning shift
    const cleanShifts = [
      {
        id: "3ca44b69-6583-4784-9a5b-67383e3e4163",
        color: "#0E7490",
        endTime: "18:00:00",
        shiftName: "Morning",
        startTime: "09:00:00",
        assignments: [],
        workingHours: 8.25,
        gracePeriodMins: 15,
        breakDurationMins: 45,
        assignedEmployeeCount: 0
      }
    ];
    await client.query(
      "UPDATE public.company_settings SET setting_val = $1::jsonb, updated_at = NOW() WHERE setting_key = 'shifts_data';",
      [JSON.stringify(cleanShifts)]
    );
    console.log('  - Cleaned company_settings.shifts_data (removed duplicate test shifts)');

    // 3. Clean relational tables
    console.log('2. Clearing mock rows from relational tables...');
    
    const delPayroll = await client.query('DELETE FROM public.payroll_records;');
    console.log(`  - Deleted ${delPayroll.rowCount} rows from public.payroll_records`);

    const delAtt = await client.query('DELETE FROM public.attendance_records;');
    console.log(`  - Deleted ${delAtt.rowCount} rows from public.attendance_records`);

    const delTasks = await client.query("DELETE FROM public.enterprise_tasks WHERE id = 'TSK-1790344931120' OR title LIKE '%b;nhhcsjcoksd%';");
    console.log(`  - Deleted ${delTasks.rowCount} test tasks from public.enterprise_tasks`);

    const delLeaves = await client.query('DELETE FROM public.leave_requests;');
    console.log(`  - Deleted ${delLeaves.rowCount} rows from public.leave_requests`);

    await client.query('COMMIT');
    console.log('✅ All mock data successfully cleaned from Supabase!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error cleaning mock data:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanMockData().catch(err => {
  console.error(err);
  process.exit(1);
});
