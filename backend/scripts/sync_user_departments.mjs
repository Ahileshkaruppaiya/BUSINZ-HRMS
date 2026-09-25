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

  // Insert HR, ACCOUNTS, SALES into public.departments if not present
  await client.query(`
    INSERT INTO public.departments (name, code)
    VALUES 
      ('HR', 'HRM'),
      ('ACCOUNTS', 'ACCT'),
      ('SALES', 'SLS')
    ON CONFLICT (code) DO NOTHING;
  `);

  const res = await client.query('SELECT name, code FROM public.departments ORDER BY name');
  console.log('Current departments in Supabase:');
  console.log(res.rows);

  await client.end();
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
