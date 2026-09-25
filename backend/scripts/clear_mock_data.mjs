import dotenv from 'dotenv';
import pg from 'pg';
dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  console.log('Clearing stale mock attendance data from company_settings...');
  await client.query("UPDATE company_settings SET setting_val = '[]'::jsonb WHERE setting_key = 'attendance_records_data'");
  console.log('Cleared attendance_records_data in company_settings.');
  client.release();
  await pool.end();
}

run().catch(console.error);
