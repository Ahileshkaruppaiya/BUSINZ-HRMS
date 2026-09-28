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

async function main() {
  const tables = await pool.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_type='BASE TABLE' ORDER BY table_name;"
  );

  console.log('--- TABLE ROW COUNTS ---');
  for (const r of tables.rows) {
    try {
      const res = await pool.query(`SELECT count(*) FROM public."${r.table_name}";`);
      const count = parseInt(res.rows[0].count);
      if (count > 0) {
        console.log(`${r.table_name}: ${count}`);
      }
    } catch (e) {
      console.error(`Error querying ${r.table_name}:`, e.message);
    }
  }

  console.log('\n--- COMPANY_SETTINGS KEYS ---');
  const settings = await pool.query("SELECT setting_key, jsonb_typeof(setting_val) as type, CASE WHEN jsonb_typeof(setting_val) = 'array' THEN jsonb_array_length(setting_val) ELSE NULL END as len FROM public.company_settings ORDER BY setting_key;");
  for (const s of settings.rows) {
    console.log(`${s.setting_key}: type=${s.type}, len=${s.len}`);
  }

  await pool.end();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
