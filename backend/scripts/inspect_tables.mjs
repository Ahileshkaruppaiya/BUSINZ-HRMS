import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  const tables = ['shifts', 'leave_requests', 'attendance_records', 'assets', 'expenses', 'mom_meetings', 'payroll_records', 'company_settings'];
  for (const table of tables) {
    const res = await client.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [table]);
    console.log(`=== TABLE: ${table} ===`);
    console.log(res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
  }
  client.release();
  await pool.end();
}

main().catch(console.error);
