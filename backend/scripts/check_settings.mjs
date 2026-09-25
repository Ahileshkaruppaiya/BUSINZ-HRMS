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
  const res = await client.query('SELECT setting_key, updated_at FROM public.company_settings ORDER BY setting_key ASC');
  console.log('Current keys in company_settings:');
  console.log(res.rows);
  client.release();
  await pool.end();
}

main().catch(console.error);
