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

async function checkDepts() {
  const client = await pool.connect();
  try {
    const depts = await client.query('SELECT * FROM public.departments ORDER BY name, id');
    console.log('All departments in DB:');
    console.log(depts.rows);

    const emps = await client.query('SELECT employee_id, first_name, last_name, department_id FROM public.employees');
    console.log('\nEmployees and their department_id:');
    console.log(emps.rows);

    const jobs = await client.query('SELECT id, title, department_id FROM public.job_openings');
    console.log('\nJobs and their department_id:');
    console.log(jobs.rows);
  } finally {
    client.release();
    await pool.end();
  }
}

checkDepts().catch(console.error);
