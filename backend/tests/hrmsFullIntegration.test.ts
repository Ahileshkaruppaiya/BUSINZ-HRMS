import { describe, it, expect } from 'vitest';

const BASE_URL = 'http://localhost:8000';
const HEADERS = {
  'Content-Type': 'application/json',
  'x-user-role': 'Super Admin',
  'x-employee-id': 'EMP-001',
  'x-dev-mock-auth': 'true',
};

describe('VRM Enterprise HRMS — Full Backend Integration & Connectivity Suite', () => {
  let authToken = '';

  // --------------------------------------------------------------------------
  // 1. Health & Service Verification
  // --------------------------------------------------------------------------
  it('GET /health confirms server is active and healthy', async () => {
    const res = await fetch(`${BASE_URL}/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.status).toBe('healthy');
  });

  // --------------------------------------------------------------------------
  // 2. Authentication & JWT Tokens
  // --------------------------------------------------------------------------
  it('POST /api/v1/auth/login succeeds with valid credentials', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hr@vrmstructures.com',
        password: 'Password@123',
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.accessToken).toBeDefined();
    expect(body.data.user.email).toBe('hr@vrmstructures.com');
    authToken = body.data.accessToken;
  });

  it('POST /api/v1/auth/login rejects invalid credentials with 401', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'hr@vrmstructures.com',
        password: 'WrongPassword999',
      }),
    });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('GET /api/v1/auth/me verifies Bearer token identity', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
      headers: {
        Authorization: `Bearer ${authToken}`,
      },
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.email).toBe('hr@vrmstructures.com');
  });

  // --------------------------------------------------------------------------
  // 3. Employee Master Data & CRUD
  // --------------------------------------------------------------------------
  let createdEmpId = '';

  it('GET /api/v1/employees returns employee directory', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/employees`, { headers: HEADERS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('GET /api/v1/employees/EMP-001 returns single employee profile', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/employees/EMP-001`, { headers: HEADERS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.employeeId).toBe('EMP-001');
    expect(body.data.firstName).toBe('Pavithra');
  });

  it('POST /api/v1/employees creates a new staff record', async () => {
    const newStaff = {
      firstName: 'Arun',
      lastName: 'Prasath',
      email: `arun.${Date.now()}@vrmstructures.com`,
      department: 'Design',
      designation: 'Solar Structural Engineer',
      basicSalary: 28000,
      grossSalary: 70000,
    };
    const res = await fetch(`${BASE_URL}/api/v1/employees`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(newStaff),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.firstName).toBe('Arun');
    createdEmpId = body.data.id;
  });

  it('PUT /api/v1/employees/:id updates staff record', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/employees/${createdEmpId}`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({ designation: 'Senior Solar Structural Engineer' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.designation).toBe('Senior Solar Structural Engineer');
  });

  it('DELETE /api/v1/employees/:id removes test staff record', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/employees/${createdEmpId}`, {
      method: 'DELETE',
      headers: HEADERS,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
  });

  // --------------------------------------------------------------------------
  // 4. Attendance & Biometrics
  // --------------------------------------------------------------------------
  it('GET /api/v1/attendance returns attendance logs', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/attendance`, { headers: HEADERS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('POST /api/v1/attendance/punch records IN punch', async () => {
    const shiftTime = new Date();
    shiftTime.setHours(9, 5, 0, 0);

    const punchPayload = {
      employeeId: 'EMP-001',
      type: 'IN',
      timestamp: shiftTime.toISOString(),
      method: 'Face Scan',
      inGeofence: true,
      locationLat: 13.0827,
      locationLng: 80.2707,
      locationAddress: 'VRM Corporate Plant HQ',
    };
    const res = await fetch(`${BASE_URL}/api/v1/attendance/punch`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(punchPayload),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.employeeId).toBe('EMP-001');
    expect(body.data.checkIn).toBeDefined();
  });

  it('POST /api/v1/attendance/verify-face authenticates biometric scan', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/attendance/verify-face`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({ employeeId: 'EMP-001' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.verified).toBe(true);
    expect(body.data.confidence).toBeGreaterThan(0.9);
  });

  it('GET /api/v1/attendance/summary returns today KPI counts', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/attendance/summary`, { headers: HEADERS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.totalEmployees).toBeGreaterThan(0);
    expect(body.data.presentCount).toBeGreaterThanOrEqual(0);
  });

  // --------------------------------------------------------------------------
  // 5. Leaves & Balances
  // --------------------------------------------------------------------------
  let leaveId = '';

  it('POST /api/v1/leaves creates a leave application', async () => {
    const leavePayload = {
      employeeId: 'EMP-004',
      leaveType: 'Casual',
      startDate: '2026-10-05',
      endDate: '2026-10-06',
      reason: 'Personal family emergency',
    };
    const res = await fetch(`${BASE_URL}/api/v1/leaves`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(leavePayload),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('Pending');
    leaveId = body.data.id;
  });

  it('PATCH /api/v1/leaves/:id/decision approves the leave application', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/leaves/${leaveId}/decision`, {
      method: 'PATCH',
      headers: HEADERS,
      body: JSON.stringify({ decision: 'Approved', comment: 'Approved by HR' }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('Approved');
  });

  it('GET /api/v1/leaves/balances/EMP-004 returns leave quota breakdown', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/leaves/balances/EMP-004`, { headers: HEADERS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.casual.total).toBe(12);
    expect(body.data.casual.remaining).toBeLessThanOrEqual(12);
  });

  // --------------------------------------------------------------------------
  // 6. Shifts & Scheduling
  // --------------------------------------------------------------------------
  let shiftId = '';

  it('GET /api/v1/shifts returns company work shifts', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/shifts`, { headers: HEADERS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThan(0);
  });

  it('POST /api/v1/shifts creates a solar installation shift', async () => {
    const shiftPayload = {
      shiftName: 'Solar Field Installation Shift',
      startTime: '07:00',
      endTime: '15:30',
      breakDurationMins: 45,
      workingHours: 8.0,
      gracePeriodMins: 15,
      color: '#0E7490',
    };
    const res = await fetch(`${BASE_URL}/api/v1/shifts`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(shiftPayload),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.shiftName).toBe('Solar Field Installation Shift');
    shiftId = body.data.id;
  });

  it('PUT /api/v1/shifts/:id/assignments assigns workers to the shift', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/shifts/${shiftId}/assignments`, {
      method: 'PUT',
      headers: HEADERS,
      body: JSON.stringify({ employeeIds: ['EMP-004', 'EMP-009'] }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.assignedEmployeeCount).toBe(2);
  });

  // --------------------------------------------------------------------------
  // 7. Tracking & GPS Field Operations (NEW PRIMARY MODULE)
  // --------------------------------------------------------------------------
  let assignmentId = '';
  let tripId = '';

  it('GET /api/v1/tracking/assignments returns field duty schedule', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/tracking/assignments`, { headers: HEADERS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('POST /api/v1/tracking/assignments assigns engineer to solar site visit', async () => {
    const dutyPayload = {
      employeeId: 'EMP-004',
      dutyType: 'Site Visit',
      scheduleType: 'One Day',
      startDate: '2026-09-15',
      endDate: '2026-09-15',
      startTime: '09:00',
      endTime: '18:00',
      customerSiteName: 'NTPC Ramagundam Floating Solar Plant',
      siteAddress: 'Ramagundam, Telangana',
      purpose: 'MMS structural integrity audit and hot-dip galvanizing thickness testing',
      trackingRequired: true,
      travelKmRequired: true,
      attendanceType: 'Site Geofence',
      siteLat: 18.7548,
      siteLng: 79.5126,
      allowedRadiusMeters: 300,
    };
    const res = await fetch(`${BASE_URL}/api/v1/tracking/assignments`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(dutyPayload),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.customerSiteName).toContain('NTPC Ramagundam');
    assignmentId = body.data.id;
  });

  it('POST /api/v1/tracking/trips/start starts a live trip session', async () => {
    const startPayload = {
      assignmentId,
      employeeId: 'EMP-004',
      startLat: 13.0827,
      startLng: 80.2707,
      startAddress: 'VRM Structures HQ, Chennai',
    };
    const res = await fetch(`${BASE_URL}/api/v1/tracking/trips/start`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(startPayload),
    });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('Active');
    expect(body.data.startLat).toBe(13.0827);
    tripId = body.data.id;
  });

  it('POST /api/v1/tracking/points records sequential GPS telemetry coordinates', async () => {
    const telemetryBatch = [
      {
        id: `pt-${Date.now()}-1`,
        tripId,
        assignmentId,
        employeeId: 'EMP-004',
        recordedAt: new Date().toISOString(),
        latitude: 13.085,
        longitude: 80.275,
        accuracy: 8,
        speed: 40,
        batteryLevel: 92,
      },
      {
        id: `pt-${Date.now()}-2`,
        tripId,
        assignmentId,
        employeeId: 'EMP-004',
        recordedAt: new Date().toISOString(),
        latitude: 13.095,
        longitude: 80.285,
        accuracy: 6,
        speed: 45,
        batteryLevel: 90,
      },
    ];
    const res = await fetch(`${BASE_URL}/api/v1/tracking/points`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(telemetryBatch),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.added).toBe(2);
    expect(body.data.totalKm).toBeGreaterThan(0);
  });

  it('GET /api/v1/tracking/points/:tripId retrieves route points for Leaflet map', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/tracking/points/${tripId}`, { headers: HEADERS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(2);
  });

  it('POST /api/v1/tracking/trips/:id/end concludes trip and saves final km', async () => {
    const endPayload = {
      endLat: 13.095,
      endLng: 80.285,
      endAddress: 'Customer Solar Site Gate 1',
      totalKm: 14.8,
    };
    const res = await fetch(`${BASE_URL}/api/v1/tracking/trips/${tripId}/end`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify(endPayload),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('Completed');
    expect(body.data.totalKm).toBe(14.8);
  });

  it('GET /api/v1/tracking/alerts lists GPS telemetry outage warnings', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/tracking/alerts`, { headers: HEADERS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('PUT /api/v1/tracking/alerts/:id/resolve marks outage alert as resolved', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/tracking/alerts/alt-001/resolve`, {
      method: 'PUT',
      headers: HEADERS,
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.status).toBe('Resolved');
  });

  it('GET /api/v1/tracking/overview returns CEO/HR 4 KPI summary cards', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/tracking/overview`, { headers: HEADERS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    const data = body.data;
    expect(data.fieldEmployeesToday).toBeGreaterThan(0);
    expect(typeof data.currentlyTravelling).toBe('number');
    expect(typeof data.gpsIssues).toBe('number');
    expect(typeof data.totalKmToday).toBe('number');
  });

  // --------------------------------------------------------------------------
  // 8. Company & Geofence Settings
  // --------------------------------------------------------------------------
  it('GET /api/v1/settings/company returns corporate profile', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/settings/company`, { headers: HEADERS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.companyName).toContain('Businz Technologies');
  });

  it('GET /api/v1/settings/geofence returns plant geofence coordinates', async () => {
    const res = await fetch(`${BASE_URL}/api/v1/settings/geofence`, { headers: HEADERS });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.latitude).toBe(13.0827);
    expect(body.data.radiusMeters).toBe(200);
  });
});
