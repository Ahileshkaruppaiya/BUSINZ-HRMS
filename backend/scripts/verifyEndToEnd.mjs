import pg from 'pg';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { Client } = pg;

async function runE2ECheck() {
  console.log('='.repeat(70));
  console.log('🏥 BUSINZ ENTERPRISE HRMS — END-TO-END CONNECTIVITY DIAGNOSTIC');
  console.log('='.repeat(70));

  let passed = 0;
  let failed = 0;

  // 1. Direct PostgreSQL Database Connection
  try {
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    await client.connect();
    const dbInfo = await client.query('SELECT current_database(), current_user, version()');
    const tableCount = await client.query("SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'");
    const empCount = await client.query('SELECT count(*) FROM public.employees');
    await client.end();
    console.log('✅ [1/5] Direct PostgreSQL (Supabase): CONNECTED');
    console.log(`       Database: ${dbInfo.rows[0].current_database}, Tables: ${tableCount.rows[0].count}, Employees in DB: ${empCount.rows[0].count}`);
    passed++;
  } catch (err) {
    console.error('❌ [1/5] Direct PostgreSQL: FAILED -', err.message);
    failed++;
  }

  // 2. Supabase PostgREST Client
  try {
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.from('employees').select('id, employee_id, first_name, email').limit(5);
    if (error) throw error;
    console.log('✅ [2/5] Supabase PostgREST API: CONNECTED');
    console.log(`       Retrieved ${data.length} records:`, data.map(e => `${e.employee_id} (${e.first_name})`).join(', '));
    passed++;
  } catch (err) {
    console.error('❌ [2/5] Supabase PostgREST: FAILED -', err.message);
    failed++;
  }

  // 3. Backend Express App Import & Health Check
  try {
    const { app } = await import('../dist/app.js');
    if (!app) throw new Error('Express app export not found in backend/dist/app.js');
    console.log('✅ [3/5] Backend Compiled Express App: LOADED');
    passed++;
  } catch (err) {
    console.error('❌ [3/5] Backend Compiled Express App: FAILED -', err.message);
    failed++;
  }

  // 4. Unified Production Server (app.js) Startup & HTTP Routing
  try {
    const testPort = 8188;
    const serverProcess = spawn('node', ['app.js'], {
      cwd: path.resolve(__dirname, '../..'),
      env: { ...process.env, PORT: String(testPort) },
      stdio: ['ignore', 'pipe', 'pipe']
    });

    await new Promise(r => setTimeout(r, 2000));

    const healthRes = await fetch(`http://localhost:${testPort}/health`);
    const healthJson = await healthRes.json();

    const apiHealthRes = await fetch(`http://localhost:${testPort}/api/v1/health`);
    const apiHealthJson = await apiHealthRes.json();

    const spaRes = await fetch(`http://localhost:${testPort}/attendance`);
    const isHtml = spaRes.headers.get('content-type')?.includes('text/html');

    serverProcess.kill();

    if (healthJson.status === 'healthy' && apiHealthJson.status === 'healthy' && isHtml) {
      console.log('✅ [4/5] Unified Server (app.js): RUNNING & ROUTING PROPERLY');
      console.log(`       /health: 200 OK | /api/v1/health: 200 OK | SPA route /attendance: 200 HTML`);
      passed++;
    } else {
      throw new Error(`Unexpected server responses: health=${healthJson.status}, api=${apiHealthJson.status}, isHtml=${isHtml}`);
    }
  } catch (err) {
    console.error('❌ [4/5] Unified Server (app.js): FAILED -', err.message);
    failed++;
  }

  // 5. Frontend Production Bundle Check
  try {
    const distIndex = path.resolve(__dirname, '../../dist/index.html');
    if (!fs.existsSync(distIndex)) throw new Error('dist/index.html not found. Run npm run build.');
    const indexContent = fs.readFileSync(distIndex, 'utf-8');
    if (!indexContent.includes('<div id="root">') && !indexContent.includes('id="root"')) {
      throw new Error('index.html is missing root container.');
    }
    console.log('✅ [5/5] Frontend Production Static Bundle: VERIFIED');
    console.log(`       dist/index.html present and verified for SPA deployment.`);
    passed++;
  } catch (err) {
    console.error('❌ [5/5] Frontend Production Static Bundle: FAILED -', err.message);
    failed++;
  }

  console.log('='.repeat(70));
  console.log(`DIAGNOSTIC SUMMARY: ${passed}/5 CHECKS PASSED, ${failed} FAILED`);
  console.log('='.repeat(70));

  if (failed > 0) process.exit(1);
}

runE2ECheck().catch(err => {
  console.error('Fatal diagnostic error:', err);
  process.exit(1);
});
