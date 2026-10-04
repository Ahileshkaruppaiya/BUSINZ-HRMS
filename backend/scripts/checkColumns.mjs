import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
const res = await client.query(`
  SELECT column_name, data_type, character_maximum_length 
  FROM information_schema.columns 
  WHERE table_name = 'employees' 
    AND (column_name ILIKE '%country%' OR column_name ILIKE '%phone%' OR column_name ILIKE '%mobile%');
`);
console.log(JSON.stringify(res.rows, null, 2));
await client.end();
