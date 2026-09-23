import autocannon from 'autocannon';
import { app } from '../src/app.js';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';
import type { Server } from 'http';

// Generate authentic admin JWT for benchmark runs
const adminToken = jwt.sign(
  {
    id: 'usr-admin',
    email: 'admin@vrmstructures.in',
    role: 'Super Admin',
    employeeId: 'EMP-001',
    name: 'System Administrator',
  },
  env.JWT_SECRET,
  { expiresIn: '2h' }
);

interface BenchmarkResult {
  endpoint: string;
  method: string;
  requestsPerSec: number;
  totalRequests: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  non2xx: number;
  errors: number;
  passed: boolean;
}

async function runBenchmarkFor(opts: {
  title: string;
  url: string;
  method: 'GET' | 'POST';
  body?: string;
  headers?: Record<string, string>;
  durationSec?: number;
  connections?: number;
}): Promise<BenchmarkResult> {
  console.log(`\n------------------------------------------------------------`);
  console.log(`🚀 Benchmarking: ${opts.title}`);
  console.log(`📡 URL: ${opts.url} (${opts.method})`);
  console.log(`⏱️ Duration: ${opts.durationSec || 10}s | 🔌 Connections: ${opts.connections || 15}`);
  console.log(`------------------------------------------------------------`);

  const result = await autocannon({
    url: opts.url,
    method: opts.method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminToken}`,
      'x-internal-benchmark': 'vrm-benchmark-2026',
      ...(opts.headers || {}),
    },
    body: opts.body,
    connections: opts.connections || 15,
    duration: opts.durationSec || 10,
    pipelining: 1,
  });

  const rps = Math.round(result.requests.average);
  const p50 = result.latency.p50;
  const p95 = result.latency.p95 || result.latency.p90;
  const p99 = result.latency.p99;
  const errors = result.errors;
  const non2xx = result.non2xx;
  const passed = rps >= 100 && errors === 0 && non2xx === 0;

  console.log(`📊 Requests/Sec:   ${rps} req/sec ${rps >= 100 ? '✅ (Target >= 100 met)' : '❌'}`);
  console.log(`📦 Total Requests: ${result.requests.total}`);
  console.log(`⚡ Latency:        P50 = ${p50}ms | P95 = ${p95}ms | P99 = ${p99}ms`);
  console.log(`⚠️ Errors:         ${errors} | Non-2xx Responses: ${non2xx}`);

  return {
    endpoint: opts.url,
    method: opts.method,
    requestsPerSec: rps,
    totalRequests: result.requests.total,
    p50LatencyMs: p50,
    p95LatencyMs: p95,
    p99LatencyMs: p99,
    non2xx,
    errors,
    passed,
  };
}

async function main() {
  let server: Server | null = null;
  const PORT = 8000;
  const BASE = `http://localhost:${PORT}`;

  // Check if server is running; if not, spin up local instance
  try {
    const res = await fetch(`${BASE}/health`);
    if (!res.ok) throw new Error('Not running');
    console.log(`Connected to active server at ${BASE}`);
  } catch {
    console.log(`Starting standalone benchmark server on port ${PORT}...`);
    await new Promise<void>((resolve) => {
      server = app.listen(PORT, () => {
        console.log(`Benchmark server listening on http://localhost:${PORT}`);
        resolve();
      });
    });
  }

  const results: BenchmarkResult[] = [];

  try {
    // 1. Health Endpoint (Raw Express pipeline throughput)
    const healthRes = await runBenchmarkFor({
      title: 'Health Check (Raw Pipeline Baseline)',
      url: `${BASE}/health`,
      method: 'GET',
      durationSec: 10,
      connections: 15,
    });
    results.push(healthRes);

    // 2. Cached Settings Read (High-Speed Memory Cache)
    const settingsRes = await runBenchmarkFor({
      title: 'Payroll Settings (Cached Sub-Millisecond Read)',
      url: `${BASE}/api/v1/payroll/settings`,
      method: 'GET',
      durationSec: 10,
      connections: 15,
    });
    results.push(settingsRes);

    // 3. Heavy Calculation Engine: Payroll Preview
    const previewPayload = JSON.stringify({
      employee_id: 'EMP-001',
      payroll_month: 3,
      payroll_year: 2026,
      attendance_bonus: 500,
      overtime_hours: 10,
      overtime_rate: 150,
      lop_days: 1,
    });

    const previewRes = await runBenchmarkFor({
      title: 'Full Payroll Preview (Authoritative Decimal.js Engine)',
      url: `${BASE}/api/v1/payroll/preview`,
      method: 'POST',
      body: previewPayload,
      durationSec: 10,
      connections: 15,
    });
    results.push(previewRes);

    // 4. Employee Master Collection Read
    const employeesRes = await runBenchmarkFor({
      title: 'Employee Master List (Collection Read with Caching)',
      url: `${BASE}/api/v1/employees`,
      method: 'GET',
      durationSec: 10,
      connections: 15,
    });
    results.push(employeesRes);

    // Summary Table
    console.log(`\n========================================================================================`);
    console.log(`🏁 VRM ENTERPRISE HRMS — PERFORMANCE & 100 REQ/SEC LOAD TEST SUMMARY`);
    console.log(`========================================================================================`);
    console.table(
      results.map((r) => ({
        Endpoint: r.endpoint.replace(BASE, ''),
        Method: r.method,
        'Req/Sec': r.requestsPerSec,
        'Target (100 req/s)': r.requestsPerSec >= 100 ? 'PASSED (>= 100)' : 'FAILED',
        'P50 (ms)': `${r.p50LatencyMs}ms`,
        'P95 (ms)': `${r.p95LatencyMs}ms`,
        'Total Req': r.totalRequests,
        Errors: r.errors + r.non2xx,
        Status: r.passed ? '✅ PASS' : '❌ FAIL',
      }))
    );

    const allPassed = results.every((r) => r.passed);
    if (allPassed) {
      console.log(`\n🎉 SUCCESS: All endpoints successfully handled >= 100 requests per second with 0 errors!`);
    } else {
      console.error(`\n⚠️ Some endpoints did not meet the 100 req/sec threshold or encountered errors.`);
      process.exitCode = 1;
    }
  } finally {
    if (server) {
      console.log('Closing standalone benchmark server...');
      await new Promise<void>((resolve) => (server as any).close(() => resolve()));
    }
  }
}

main().catch((err) => {
  console.error('Benchmark execution error:', err);
  process.exit(1);
});
