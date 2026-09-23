import { describe, it, expect } from 'vitest';
import { 
  parseShiftTime, 
  calculateShiftDateTimes, 
  evaluateBackendShiftAttendance 
} from '../src/services/shiftAttendanceEngine.js';
import { ShiftRecord, AttendanceLogRecord } from '../src/types/hrms.js';

describe('Shift Attendance & 3-Hour Early Check-In Window Test Suite', () => {
  const sampleShift: ShiftRecord = {
    id: 'SH-01',
    shiftName: 'Day Shift (09:00 AM - 06:00 PM)',
    startTime: '09:00',
    endTime: '18:00',
    breakDurationMins: 45,
    workingHours: 8.25,
    gracePeriodMins: 15,
    color: '#0E7490',
  };

  const nightShift: ShiftRecord = {
    id: 'SH-NIGHT',
    shiftName: 'Night Shift (10:00 PM - 06:00 AM)',
    startTime: '22:00',
    endTime: '06:00',
    breakDurationMins: 60,
    workingHours: 8.0,
    gracePeriodMins: 15,
    color: '#1E293B',
  };

  it('1. Correctly calculates 3-hour early window: 09:00 AM start -> 06:00 AM window open', () => {
    const times = calculateShiftDateTimes('2026-09-21', sampleShift);
    expect(times.shiftStartDateTime.getHours()).toBe(9);
    expect(times.shiftStartDateTime.getMinutes()).toBe(0);

    // Window opens strictly 3 hours early: 06:00 AM
    expect(times.earlyCheckInDateTime.getHours()).toBe(6);
    expect(times.earlyCheckInDateTime.getMinutes()).toBe(0);
    expect(times.isNightShift).toBe(false);
  });

  it('2. Correctly calculates early window for Night Shift (crossing midnight): 22:00 start -> 19:00 window open', () => {
    const times = calculateShiftDateTimes('2026-09-21', nightShift);
    expect(times.shiftStartDateTime.getHours()).toBe(22);
    expect(times.earlyCheckInDateTime.getHours()).toBe(19);
    expect(times.isNightShift).toBe(true);
    // End time is on next calendar day: 22-Sep 06:00 AM
    expect(times.shiftEndDateTime.getDate()).toBe(22);
    expect(times.shiftEndDateTime.getHours()).toBe(6);
  });

  it('3. State = UPCOMING when before the 3-hour window (e.g. 21-Sep 05:59 AM) -> Check In Disabled', () => {
    const now = new Date(2026, 8, 21, 5, 59, 0); // 21-Sep 05:59 AM
    const res = evaluateBackendShiftAttendance({
      employeeId: 'EMP-001',
      assignedShift: sampleShift,
      attendanceLogs: [],
      now,
    });

    expect(res.state).toBe('UPCOMING');
    expect(res.canCheckIn).toBe(false);
    expect(res.canCheckOut).toBe(false);
    expect(res.countdownSeconds).toBe(60); // 1 minute to 06:00 AM
  });

  it('4. State = CHECK_IN_AVAILABLE at 06:00 AM sharp (3h before 09:00 AM) -> Check In Enabled', () => {
    const now = new Date(2026, 8, 21, 6, 0, 0); // 21-Sep 06:00 AM
    const res = evaluateBackendShiftAttendance({
      employeeId: 'EMP-001',
      assignedShift: sampleShift,
      attendanceLogs: [],
      now,
    });

    expect(res.state).toBe('CHECK_IN_AVAILABLE');
    expect(res.canCheckIn).toBe(true);
    expect(res.canCheckOut).toBe(false);
  });

  it('5. State = CHECK_IN_AVAILABLE within early window: 07:00 AM, 08:30 AM, 09:00 AM -> Check In Enabled', () => {
    const timesToTest = [
      new Date(2026, 8, 21, 7, 0, 0),
      new Date(2026, 8, 21, 8, 30, 0),
      new Date(2026, 8, 21, 9, 0, 0),
    ];

    for (const testNow of timesToTest) {
      const res = evaluateBackendShiftAttendance({
        employeeId: 'EMP-001',
        assignedShift: sampleShift,
        attendanceLogs: [],
        now: testNow,
      });

      expect(res.state).toBe('CHECK_IN_AVAILABLE');
      expect(res.canCheckIn).toBe(true);
      expect(res.canCheckOut).toBe(false);
    }
  });

  it('6. State = CHECKED_IN after employee punches IN -> Check In Disabled, Check Out Enabled', () => {
    const now = new Date(2026, 8, 21, 9, 5, 0); // Checked in at 09:05 AM
    const logs: AttendanceLogRecord[] = [
      {
        id: 'att-1',
        employeeId: 'EMP-001',
        date: '2026-09-21',
        shiftId: sampleShift.id,
        shiftDate: '2026-09-21',
        checkIn: '09:05',
        workingHours: 8.0,
        status: 'Present',
        method: 'Face Scan',
        inGeofence: true,
      },
    ];

    const res = evaluateBackendShiftAttendance({
      employeeId: 'EMP-001',
      assignedShift: sampleShift,
      attendanceLogs: logs,
      now,
    });

    expect(res.state).toBe('CHECKED_IN');
    expect(res.canCheckIn).toBe(false);
    expect(res.canCheckOut).toBe(true);
  });

  it('7. MAIN RULE: Once checked out, employee CANNOT check in again immediately (e.g. 21-Sep after checkout) -> Check In Disabled', () => {
    const now = new Date(2026, 8, 21, 18, 15, 0); // 21-Sep 06:15 PM (just after checkout)
    const logs: AttendanceLogRecord[] = [
      {
        id: 'att-1',
        employeeId: 'EMP-001',
        date: '2026-09-21',
        shiftId: sampleShift.id,
        shiftDate: '2026-09-21',
        checkIn: '09:05',
        checkOut: '18:10',
        workingHours: 9.08,
        status: 'Present',
        method: 'Face Scan',
        inGeofence: true,
      },
    ];

    const res = evaluateBackendShiftAttendance({
      employeeId: 'EMP-001',
      assignedShift: sampleShift,
      attendanceLogs: logs,
      now,
    });

    // 21-Sep after checkout -> Check In Disabled
    expect(res.state).toBe('WAITING_FOR_NEXT_SHIFT');
    expect(res.canCheckIn).toBe(false);
    expect(res.canCheckOut).toBe(false);
    expect(res.shiftDate).toBe('2026-09-22'); // Links to tomorrow's shift
  });

  it('8. Next day 22-Sep 05:59 AM -> Check In Disabled; 22-Sep 06:00 AM -> Check In Enabled', () => {
    const logs: AttendanceLogRecord[] = [
      {
        id: 'att-1',
        employeeId: 'EMP-001',
        date: '2026-09-21',
        shiftId: sampleShift.id,
        shiftDate: '2026-09-21',
        checkIn: '09:05',
        checkOut: '18:10',
        workingHours: 9.08,
        status: 'Present',
        method: 'Face Scan',
        inGeofence: true,
      },
    ];

    // At 22-Sep 05:59 AM
    const resBefore = evaluateBackendShiftAttendance({
      employeeId: 'EMP-001',
      assignedShift: sampleShift,
      attendanceLogs: logs,
      now: new Date(2026, 8, 22, 5, 59, 0),
    });
    expect(resBefore.canCheckIn).toBe(false);

    // At 22-Sep 06:00 AM sharp
    const resOpen = evaluateBackendShiftAttendance({
      employeeId: 'EMP-001',
      assignedShift: sampleShift,
      attendanceLogs: logs,
      now: new Date(2026, 8, 22, 6, 0, 0),
    });
    expect(resOpen.canCheckIn).toBe(true);
    expect(resOpen.state).toBe('CHECK_IN_AVAILABLE');
    expect(resOpen.shiftDate).toBe('2026-09-22');
  });
});
