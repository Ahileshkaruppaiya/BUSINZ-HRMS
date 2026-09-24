import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  await client.connect();
  const tables = ['employees', 'departments', 'shifts', 'attendance_records', 'leave_requests'];
  for (const t of tables) {
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = $1 
      ORDER BY ordinal_position;
    `, [t]);
    console.log(`\nTable ${t}:`);
    res.rows.forEach(r => console.log(`  - ${r.column_name} (${r.data_type})`));
  }
  await client.end();
}

main().catch(console.error);
