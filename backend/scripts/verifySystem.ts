import { app } from '../src/app.js';
import { env } from '../src/config/env.js';
import jwt from 'jsonwebtoken';
import type { Server } from 'http';

interface TestResult {
  category: 'CONNECTIVITY' | 'PAYLOAD VALIDATION' | 'FUNCTIONALITY';
  module: string;
  testName: string;
  httpStatus: number;
  expectedStatus: number;
  latencyMs: number;
  passed: boolean;
  notes?: string;
}

const results: TestResult[] = [];

async function recordTest(
  category: TestResult['category'],
  module: string,
  testName: string,
  fn: () => Promise<{ status: number; expectedStatus: number; passed: boolean; notes?: string }>
) {
  const start = performance.now();
  try {
    const res = await fn();
    const duration = Math.round(performance.now() - start);
    results.push({
      category,
      module,
      testName,
      httpStatus: res.status,
      expectedStatus: res.expectedStatus,
      latencyMs: duration,
      passed: res.passed,
      notes: res.notes,
    });
  } catch (err: any) {
    const duration = Math.round(performance.now() - start);
    results.push({
      category,
      module,
      testName,
      httpStatus: 0,
      expectedStatus: 200,
      latencyMs: duration,
      passed: false,
      notes: `Exception: ${err.message}`,
    });
  }
}

async function run() {
  console.log('='.repeat(90));
  console.log('🔍 VRM ENTERPRISE HRMS — PAYLOAD, CONNECTIVITY & FUNCTIONALITY TEST SUITE');
  console.log('='.repeat(90));

  // Spin up temporary isolated server on port 8009
  const port = 8009;
  let server: Server;
  await new Promise<void>((resolve) => {
    server = app.listen(port, () => {
      console.log(`📡 Verification test server bound to http://localhost:${port}\n`);
      resolve();
    });
  });

  const BASE_URL = `http://localhost:${port}`;

  const adminToken = jwt.sign(
    {
      id: 'usr-admin',
      email: 'admin@vrmstructures.in',
      role: 'Super Admin',
      employeeId: 'EMP-001',
      name: 'System Admin',
    },
    env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${adminToken}`,
  };

  const devMockHeaders = {
    'Content-Type': 'application/json',
    'x-user-role': 'Super Admin',
    'x-employee-id': 'EMP-001',
    'x-dev-mock-auth': 'true',
  };

  try {
    // ========================================================================
    // 1. CONNECTIVITY & SECURITY TESTS
    // ========================================================================
    await recordTest('CONNECTIVITY', 'Server Health', 'GET /health responds with healthy status', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.success === true && data.status === 'healthy',
      };
    });

    await recordTest('CONNECTIVITY', 'CORS Protocol', 'OPTIONS responds with CORS Access-Control headers', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payroll/settings`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:5173',
          'Access-Control-Request-Method': 'GET',
        },
      });
      const allowOrigin = res.headers.get('access-control-allow-origin');
      return {
        status: res.status,
        expectedStatus: 204,
        passed: res.status === 204 && (allowOrigin === 'http://localhost:5173' || allowOrigin === '*'),
      };
    });

    await recordTest('CONNECTIVITY', 'Transport Security', 'Helmet headers (nosniff, no x-powered-by)', async () => {
      const res = await fetch(`${BASE_URL}/health`);
      const nosniff = res.headers.get('x-content-type-options');
      const poweredBy = res.headers.get('x-powered-by');
      return {
        status: res.status,
        expectedStatus: 200,
        passed: nosniff === 'nosniff' && !poweredBy,
        notes: `nosniff=${nosniff}, x-powered-by=${poweredBy ?? 'hidden'}`,
      };
    });

    await recordTest('CONNECTIVITY', 'Auth Guard', 'Rejects unauthenticated request with 401', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/employees`);
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 401,
        passed: res.status === 401 && data.error?.code === 'UNAUTHORIZED',
      };
    });

    await recordTest('CONNECTIVITY', 'Token Security', 'Rejects forged token with 403', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/employees`, {
        headers: { Authorization: 'Bearer forged.tampered.token' },
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 403,
        passed: res.status === 403 && data.error?.code === 'FORBIDDEN',
      };
    });

    await recordTest('CONNECTIVITY', 'Dev Mock Handshake', 'Accepts x-dev-mock-auth in dev/test environment', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/employees`, { headers: devMockHeaders });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.success === true,
      };
    });

    // ========================================================================
    // 2. PAYLOAD VALIDATION TESTS (ZOD SCHEMAS)
    // ========================================================================
    await recordTest('PAYLOAD VALIDATION', 'Auth', 'Rejects malformed email in login with 422', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'not-an-email', password: 'Password@123' }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 422,
        passed: res.status === 422 && data.error?.code === 'VALIDATION_ERROR',
      };
    });

    await recordTest('PAYLOAD VALIDATION', 'Employees', 'Rejects missing firstName in employee create with 422', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/employees`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ firstName: '', email: 'valid@vrmstructures.com' }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 422,
        passed: res.status === 422 && data.error?.code === 'VALIDATION_ERROR',
      };
    });

    await recordTest('PAYLOAD VALIDATION', 'Attendance', 'Rejects invalid punch type with 422', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/attendance/punch`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ employeeId: 'EMP-001', type: 'INVALID_PUNCH' }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 422,
        passed: res.status === 422 && data.error?.code === 'VALIDATION_ERROR',
      };
    });

    await recordTest('PAYLOAD VALIDATION', 'Attendance', 'Rejects out-of-range GPS latitude (>90) with 422', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/attendance/punch`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ employeeId: 'EMP-001', type: 'IN', locationLat: 120.0 }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 422,
        passed: res.status === 422 && data.error?.code === 'VALIDATION_ERROR',
      };
    });

    await recordTest('PAYLOAD VALIDATION', 'Leaves', 'Rejects endDate earlier than startDate with 422', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leaves`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          employeeId: 'EMP-001',
          startDate: '2026-10-10',
          endDate: '2026-10-05',
          leaveType: 'Casual',
        }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 422,
        passed: res.status === 422 && data.error?.code === 'VALIDATION_ERROR',
      };
    });

    await recordTest('PAYLOAD VALIDATION', 'Leaves', 'Rejects invalid leave review decision with 422', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leaves/lv-001/decision`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ decision: 'Undecided' }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 422,
        passed: res.status === 422 && data.error?.code === 'VALIDATION_ERROR',
      };
    });

    await recordTest('PAYLOAD VALIDATION', 'Tracking', 'Rejects assignment missing customerSiteName with 422', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/tracking/assignments`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ employeeId: 'EMP-004' }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 422,
        passed: res.status === 422 && data.error?.code === 'VALIDATION_ERROR',
      };
    });

    await recordTest('PAYLOAD VALIDATION', 'Tracking', 'Rejects telemetry points missing tripId with 422', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/tracking/points`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify([{ latitude: 13.08, longitude: 80.27 }]),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 422,
        passed: res.status === 422 && data.error?.code === 'VALIDATION_ERROR',
      };
    });

    await recordTest('PAYLOAD VALIDATION', 'Settings', 'Rejects invalid company contact email with 422', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/settings/company`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ contactEmail: 'invalid-email-format' }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 422,
        passed: res.status === 422 && data.error?.code === 'VALIDATION_ERROR',
      };
    });

    await recordTest('PAYLOAD VALIDATION', 'Payroll', 'Rejects salary structure with percentages != 100% with 422', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/employees/EMP-001/salary-structure`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          monthlySalary: 30000,
          basicPercentage: 40,
          daPercentage: 20,
          conveyancePercentage: 10,
          hraPercentage: 20, // Sum = 90%
        }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 422,
        passed: res.status === 422 && data.error?.code === 'VALIDATION_ERROR',
      };
    });

    // ========================================================================
    // 3. FULL DOMAIN FUNCTIONALITY & LIFECYCLE WORKFLOWS
    // ========================================================================
    let userToken = '';
    await recordTest('FUNCTIONALITY', 'Auth Workflow', 'POST /auth/login authenticates and returns user profile', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'hr@vrmstructures.com', password: 'Password@123' }),
      });
      const data = await res.json();
      userToken = data.data?.accessToken;
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && !!userToken && data.data.user.role === 'HR Manager',
        notes: `User: ${data.data?.user?.name} (${data.data?.user?.role})`,
      };
    });

    await recordTest('FUNCTIONALITY', 'Auth Workflow', 'GET /auth/me verifies Bearer token claims', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
        headers: { Authorization: `Bearer ${userToken}` },
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.data?.email === 'hr@vrmstructures.com',
      };
    });

    let createdStaffId = '';
    await recordTest('FUNCTIONALITY', 'Employee Lifecycle', 'POST /employees creates new employee', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/employees`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          firstName: 'Karthik',
          lastName: 'Balaji',
          email: `karthik.${Date.now()}@vrmstructures.com`,
          department: 'Procurement',
          designation: 'MMS Specialist',
          basicSalary: 32000,
          grossSalary: 80000,
        }),
      });
      const data = await res.json();
      createdStaffId = data.data?.id;
      return {
        status: res.status,
        expectedStatus: 201,
        passed: res.status === 201 && data.data?.firstName === 'Karthik',
        notes: `Created: ${data.data?.employeeId}`,
      };
    });

    await recordTest('FUNCTIONALITY', 'Employee Lifecycle', 'PUT /employees/:id updates staff info', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/employees/${createdStaffId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ designation: 'Lead MMS Specialist' }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.data?.designation === 'Lead MMS Specialist',
      };
    });

    await recordTest('FUNCTIONALITY', 'Employee Lifecycle', 'DELETE /employees/:id removes created staff record', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/employees/${createdStaffId}`, {
        method: 'DELETE',
        headers: authHeaders,
      });
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200,
      };
    });

    await recordTest('FUNCTIONALITY', 'Attendance & Biometrics', 'POST /attendance/punch records geofenced punch', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/attendance/punch`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          employeeId: 'EMP-001',
          type: 'IN',
          method: 'Face Scan',
          inGeofence: true,
          locationLat: 13.0827,
          locationLng: 80.2707,
          locationAddress: 'Plant HQ Gate 2',
        }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 201,
        passed: res.status === 201 && data.data?.employeeId === 'EMP-001',
      };
    });

    await recordTest('FUNCTIONALITY', 'Attendance & Biometrics', 'POST /attendance/verify-face verifies biometric face scan', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/attendance/verify-face`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ employeeId: 'EMP-001' }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.data?.verified === true && data.data?.confidence >= 0.9,
        notes: `Confidence: ${(data.data?.confidence * 100).toFixed(1)}%`,
      };
    });

    await recordTest('FUNCTIONALITY', 'Attendance & Biometrics', 'GET /attendance/summary returns daily KPI metrics', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/attendance/summary`, { headers: authHeaders });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.data?.totalEmployees > 0 && typeof data.data?.presentCount === 'number',
        notes: `Total: ${data.data?.totalEmployees}, Present: ${data.data?.presentCount}`,
      };
    });

    let testLeaveId = '';
    await recordTest('FUNCTIONALITY', 'Leave Management', 'POST /leaves creates leave application', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leaves`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          employeeId: 'EMP-004',
          leaveType: 'Casual',
          startDate: '2026-11-01',
          endDate: '2026-11-02',
          reason: 'Solar Conference Attendance',
        }),
      });
      const data = await res.json();
      testLeaveId = data.data?.id;
      return {
        status: res.status,
        expectedStatus: 201,
        passed: res.status === 201 && data.data?.status === 'Pending',
        notes: `Leave ID: ${testLeaveId}`,
      };
    });

    await recordTest('FUNCTIONALITY', 'Leave Management', 'PATCH /leaves/:id/decision approves leave application', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leaves/${testLeaveId}/decision`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ decision: 'Approved', comment: 'Approved for conference' }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.data?.status === 'Approved',
      };
    });

    await recordTest('FUNCTIONALITY', 'Leave Management', 'GET /leaves/balances/:id returns quota balances', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leaves/balances/EMP-004`, { headers: authHeaders });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && typeof data.data?.casual?.remaining === 'number',
        notes: `Casual remaining: ${data.data?.casual?.remaining}/${data.data?.casual?.total}`,
      };
    });

    let testShiftId = '';
    await recordTest('FUNCTIONALITY', 'Shifts & Rostering', 'POST /shifts creates shift definition', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/shifts`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          shiftName: 'MMS Fabrication Morning Shift',
          startTime: '06:00',
          endTime: '14:30',
          breakDurationMins: 30,
          workingHours: 8.0,
          gracePeriodMins: 10,
          color: '#0E7490',
        }),
      });
      const data = await res.json();
      testShiftId = data.data?.id;
      return {
        status: res.status,
        expectedStatus: 201,
        passed: res.status === 201 && data.data?.shiftName === 'MMS Fabrication Morning Shift',
      };
    });

    await recordTest('FUNCTIONALITY', 'Shifts & Rostering', 'PUT /shifts/:id/assignments assigns employees to shift', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/shifts/${testShiftId}/assignments`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({ employeeIds: ['EMP-002', 'EMP-003'] }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.data?.assignedEmployeeCount === 2,
      };
    });

    let testAssignId = '';
    let testTripId = '';
    await recordTest('FUNCTIONALITY', 'Tracking & Telemetry', 'POST /tracking/assignments assigns field site visit', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/tracking/assignments`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          employeeId: 'EMP-004',
          dutyType: 'Site Visit',
          scheduleType: 'One Day',
          customerSiteName: 'Adani Kamuthi Solar Power Project',
          siteAddress: 'Kamuthi, Ramanathapuram, Tamil Nadu',
          siteLat: 9.3512,
          siteLng: 78.3845,
          allowedRadiusMeters: 300,
        }),
      });
      const data = await res.json();
      testAssignId = data.data?.id;
      return {
        status: res.status,
        expectedStatus: 201,
        passed: res.status === 201 && !!testAssignId,
        notes: `Assignment: ${testAssignId}`,
      };
    });

    await recordTest('FUNCTIONALITY', 'Tracking & Telemetry', 'POST /tracking/trips/start starts field trip session', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/tracking/trips/start`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          assignmentId: testAssignId,
          employeeId: 'EMP-004',
          startLat: 13.0827,
          startLng: 80.2707,
          startAddress: 'VRM Manufacturing Facility',
        }),
      });
      const data = await res.json();
      testTripId = data.data?.id;
      return {
        status: res.status,
        expectedStatus: 201,
        passed: res.status === 201 && data.data?.status === 'Active',
        notes: `Trip: ${testTripId}`,
      };
    });

    await recordTest('FUNCTIONALITY', 'Tracking & Telemetry', 'POST /tracking/points streams GPS coordinate telemetry', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/tracking/points`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify([
          {
            tripId: testTripId,
            assignmentId: testAssignId,
            employeeId: 'EMP-004',
            latitude: 13.09,
            longitude: 80.28,
            speed: 50,
            batteryLevel: 95,
          },
          {
            tripId: testTripId,
            assignmentId: testAssignId,
            employeeId: 'EMP-004',
            latitude: 13.11,
            longitude: 80.3,
            speed: 55,
            batteryLevel: 93,
          },
        ]),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.data?.added === 2 && data.data?.totalKm > 0,
        notes: `Accumulated: ${data.data?.totalKm} km`,
      };
    });

    await recordTest('FUNCTIONALITY', 'Tracking & Telemetry', 'GET /tracking/points/:tripId retrieves route for Leaflet', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/tracking/points/${testTripId}`, { headers: authHeaders });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && Array.isArray(data.data) && data.data.length >= 2,
      };
    });

    await recordTest('FUNCTIONALITY', 'Tracking & Telemetry', 'POST /tracking/trips/:id/end concludes trip and saves km', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/tracking/trips/${testTripId}/end`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          endLat: 13.11,
          endLng: 80.3,
          endAddress: 'Customer Solar Site Pier 4',
          totalKm: 18.5,
        }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.data?.status === 'Completed' && data.data?.totalKm === 18.5,
      };
    });

    await recordTest('FUNCTIONALITY', 'Tracking & Telemetry', 'GET /tracking/overview returns KPI metrics dashboard', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/tracking/overview`, { headers: authHeaders });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && typeof data.data?.fieldEmployeesToday === 'number',
        notes: `Field Staff: ${data.data?.fieldEmployeesToday}, Total Km: ${data.data?.totalKmToday}`,
      };
    });

    await recordTest('FUNCTIONALITY', 'Tracking & Telemetry', 'PUT /tracking/alerts/:id/resolve resolves outage alert', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/tracking/alerts/alt-001/resolve`, {
        method: 'PUT',
        headers: authHeaders,
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.data?.status === 'Resolved',
      };
    });

    await recordTest('FUNCTIONALITY', 'Settings Management', 'PUT /settings/company updates company profile', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/settings/company`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          companyName: 'VRM Structures India Private Limited',
          city: 'Sriperumbudur, Chennai',
        }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.data?.companyName.includes('VRM Structures'),
      };
    });

    await recordTest('FUNCTIONALITY', 'Settings Management', 'PUT /settings/geofence updates HQ plant perimeter', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/settings/geofence`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          latitude: 13.0827,
          longitude: 80.2707,
          radiusMeters: 250,
        }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.data?.radiusMeters === 250,
      };
    });

    await recordTest('FUNCTIONALITY', 'Payroll & Compliance', 'POST /employees/:id/salary-structure sets Section 49 structure', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/employees/EMP-001/salary-structure`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          monthlySalary: 30000,
          basicPercentage: 40,
          daPercentage: 20,
          conveyancePercentage: 5,
          hraPercentage: 35,
        }),
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 201,
        passed: res.status === 201 && data.data?.monthlySalary === 30000,
      };
    });

    await recordTest('FUNCTIONALITY', 'Payroll & Compliance', 'POST /payroll/preview calculates exact deductions & Net', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payroll/preview`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          employee_id: 'EMP-001',
          payroll_month: 8,
          payroll_year: 2026,
        }),
      });
      const data = await res.json();
      const s = data.data?.salary;
      const d = data.data?.deductions;
      const e = data.data?.earnings;
      const calculatedNet = e?.gross - d?.total;
      const passed =
        res.status === 200 &&
        s?.basic > 0 &&
        s?.da > 0 &&
        s?.conveyance > 0 &&
        s?.hra > 0 &&
        d?.pf > 0 &&
        data.data?.net_salary === calculatedNet;
      return {
        status: res.status,
        expectedStatus: 200,
        passed,
        notes: `Gross: ₹${e?.gross?.toLocaleString()} | PF: ₹${d?.pf} | Deductions: ₹${d?.total} | Net: ₹${data.data?.net_salary?.toLocaleString()}`,
      };
    });

    let testRunId = '';
    const uniqueYear = 2035;
    const uniqueMonth = 11;
    await recordTest('FUNCTIONALITY', 'Payroll & Compliance', 'POST /payroll/runs creates new monthly payroll run', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payroll/runs`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ payroll_month: uniqueMonth, payroll_year: uniqueYear }),
      });
      const data = await res.json();
      testRunId = data.data?.id;
      return {
        status: res.status,
        expectedStatus: 201,
        passed: res.status === 201 && data.data?.status === 'DRAFT',
        notes: `Run ID: ${testRunId}`,
      };
    });

    await recordTest('FUNCTIONALITY', 'Payroll & Compliance', 'POST /payroll/runs/:id/process computes employee payrolls', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payroll/runs/${testRunId}/process`, {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.data?.status === 'PROCESSED' && data.data?.totalGross > 0,
        notes: `Employees: ${data.data?.totalEmployees}, Total Net: ₹${data.data?.totalNet?.toLocaleString()}`,
      };
    });

    await recordTest('FUNCTIONALITY', 'Payroll & Compliance', 'POST /payroll/runs/:id/approve approves processed payroll run', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payroll/runs/${testRunId}/approve`, {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.data?.status === 'APPROVED',
        notes: `Approved by: ${data.data?.approvedBy}`,
      };
    });

    await recordTest('FUNCTIONALITY', 'Payroll & Compliance', 'POST /payroll/runs/:id/pay marks run as Paid', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payroll/runs/${testRunId}/pay`, {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.data?.status === 'PAID',
      };
    });

    await recordTest('FUNCTIONALITY', 'Payroll & Compliance', 'GET /payroll/payslips/:id returns breakdown payslip', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payroll/payslips/EMP-001?month=8&year=2026`, {
        headers: authHeaders,
      });
      const data = await res.json();
      return {
        status: res.status,
        expectedStatus: 200,
        passed: res.status === 200 && data.data?.employee?.employeeId === 'EMP-001' && data.data?.netSalary > 0,
        notes: `Payslip Net: ₹${data.data?.netSalary?.toLocaleString()} (Company: ${data.data?.company?.companyName})`,
      };
    });
  } finally {
    server!.close();
  }

  // ========================================================================
  // SUMMARY REPORT
  // ========================================================================
  console.log('\n' + '='.repeat(110));
  console.log('📊 VERIFICATION TEST EXECUTION MATRIX');
  console.log('='.repeat(110));

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  console.table(
    results.map((r, i) => ({
      '#': i + 1,
      Category: r.category,
      Module: r.module,
      Test: r.testName,
      Status: `${r.httpStatus} (Exp: ${r.expectedStatus})`,
      Latency: `${r.latencyMs}ms`,
      Result: r.passed ? '✅ PASS' : '❌ FAIL',
      Notes: r.notes || '',
    }))
  );

  console.log('='.repeat(110));
  console.log(`TOTAL TESTS: ${total} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log('='.repeat(110));

  if (failed > 0) {
    console.error('\n❌ Verification failed: Some checks did not pass.');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL PAYLOAD, CONNECTIVITY & FUNCTIONALITY VERIFICATIONS PASSED SUCCESSFULLY!\n');
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Fatal execution error in verifySystem:', err);
  process.exit(1);
});
