import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import { env } from '../src/config/env.js';

const BASE_URL = 'http://localhost:8000';

const adminToken = jwt.sign(
  {
    id: 'usr-001',
    email: 'admin@vrmstructures.com',
    role: 'Super Admin',
    employeeId: 'EMP-001',
    name: 'Admin User',
  },
  env.JWT_SECRET,
  { expiresIn: '1h' }
);

const authHeaders = {
  Authorization: `Bearer ${adminToken}`,
  'Content-Type': 'application/json',
};

describe('VRM Enterprise HRMS — Comprehensive Input Validation Test Suite (Zod)', () => {
  // --------------------------------------------------------------------------
  // 1. Auth Endpoint Validation
  // --------------------------------------------------------------------------
  describe('Authentication Validation', () => {
    it('rejects login with malformed email format with 422', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'not-a-valid-email',
          password: 'Password@123',
        }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects login with missing password with 422', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'hr@vrmstructures.com',
        }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // --------------------------------------------------------------------------
  // 2. Employee Directory Validation
  // --------------------------------------------------------------------------
  describe('Employee Input Validation', () => {
    it('rejects creating employee with invalid email format', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/employees`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          firstName: 'Karthik',
          lastName: 'Rajan',
          email: 'invalid-email-address',
          basicSalary: 25000,
        }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects creating employee with empty firstName', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/employees`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          firstName: '',
          email: 'test@vrmstructures.com',
        }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // --------------------------------------------------------------------------
  // 3. Attendance Punch Validation
  // --------------------------------------------------------------------------
  describe('Attendance Input Validation', () => {
    it('rejects invalid punch type', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/attendance/punch`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          employeeId: 'EMP-001',
          type: 'INVALID_PUNCH',
        }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects punch with out-of-range GPS latitude (> 90)', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/attendance/punch`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          employeeId: 'EMP-001',
          type: 'IN',
          locationLat: 150.0,
          locationLng: 80.27,
        }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // --------------------------------------------------------------------------
  // 4. Leave Request Validation
  // --------------------------------------------------------------------------
  describe('Leave Input Validation', () => {
    it('rejects leave request when endDate is before startDate', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leaves`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          employeeId: 'EMP-001',
          leaveType: 'Casual',
          startDate: '2026-09-20',
          endDate: '2026-09-15',
          reason: 'Backwards dates test',
        }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects invalid leave decision review', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/leaves/lv-001/decision`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          decision: 'Tentative',
          comment: 'Not a valid decision',
        }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // --------------------------------------------------------------------------
  // 5. Field Duty & GPS Tracking Validation
  // --------------------------------------------------------------------------
  describe('Field Duty & GPS Telemetry Validation', () => {
    it('rejects field assignment creation missing required customerSiteName', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/tracking/assignments`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          employeeId: 'EMP-004',
          siteAddress: 'Kamuthi',
        }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects starting trip with invalid latitude', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/tracking/trips/start`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          assignmentId: 'fa-001',
          startLat: 199.99,
          startLng: 80.27,
        }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects recording location points missing tripId', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/tracking/points`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          latitude: 13.0827,
          longitude: 80.2707,
        }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // --------------------------------------------------------------------------
  // 6. Settings Validation
  // --------------------------------------------------------------------------
  describe('Settings Input Validation', () => {
    it('rejects company profile update with invalid email', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/settings/company`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          contactEmail: 'not-an-email',
        }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects geofence update with invalid latitude coordinate', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/settings/geofence`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          latitude: 95.0,
        }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });

  // --------------------------------------------------------------------------
  // 7. Payroll & Salary Structure Validation
  // --------------------------------------------------------------------------
  describe('Payroll & Salary Validation', () => {
    it('rejects salary structure where percentages sum is not 100%', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/employees/EMP-001/salary-structure`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          monthlySalary: 50000,
          basicPercentage: 50,
          daPercentage: 20,
          conveyancePercentage: 10,
          hraPercentage: 10, // Sum = 90%, not 100%
        }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });

    it('rejects payroll preview with invalid month (> 12)', async () => {
      const res = await fetch(`${BASE_URL}/api/v1/payroll/preview`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          employee_id: 'EMP-001',
          payroll_month: 13,
          payroll_year: 2026,
        }),
      });
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('VALIDATION_ERROR');
    });
  });
});
