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

async function inspectDb() {
  const client = await pool.connect();
  try {
    const emps = await client.query('SELECT id, employee_id, first_name, last_name, email, department_id, designation FROM public.employees');
    console.log('EMPLOYEES:');
    console.log(emps.rows);

    const depts = await client.query('SELECT id, name FROM public.departments');
    console.log('\nDEPARTMENTS:');
    console.log(depts.rows);

    const settings = await client.query('SELECT setting_key, setting_val FROM public.company_settings WHERE setting_key IN (\'reward_policies_data\', \'master_attendance_policies_data\', \'holiday_policies_data\', \'department_ot_policies_data\', \'designations_data\', \'departments_data\')');
    console.log('\nSETTINGS:');
    for (const r of settings.rows) {
      console.log(r.setting_key, JSON.stringify(r.setting_val, null, 2));
    }
  } finally {
    client.release();
    await pool.end();
  }
}

inspectDb().catch(console.error);
