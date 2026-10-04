import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function run() {
  const res = await pool.query("SELECT setting_key, setting_val FROM public.company_settings WHERE setting_key LIKE '%company%'");
  for (const row of res.rows) {
    console.log('KEY:', row.setting_key);
    console.log(JSON.stringify(row.setting_val, null, 2));
  }
  await pool.end();
}

run().catch(console.error);
