import { ShiftRecord } from '../types/hrms.js';

const inMemoryShifts: ShiftRecord[] = [
  {
    id: 'SH-01',
    shiftName: 'Shift 1 (09:00 AM - 06:00 PM)',
    startTime: '09:00',
    endTime: '18:00',
    breakDurationMins: 45,
    workingHours: 8.25,
    gracePeriodMins: 15,
    color: '#0E7490',
    assignedEmployeeCount: 0,
    assignments: [],
  },
  {
    id: 'SH-02',
    shiftName: 'Shift 2 (09:30 AM - 06:30 PM)',
    startTime: '09:30',
    endTime: '18:30',
    breakDurationMins: 45,
    workingHours: 8.25,
    gracePeriodMins: 15,
    color: '#2563EB',
    assignedEmployeeCount: 0,
    assignments: [],
  },
  {
    id: 'SH-03',
    shiftName: 'Shift 3 (10:00 AM - 07:00 PM)',
    startTime: '10:00',
    endTime: '19:00',
    breakDurationMins: 45,
    workingHours: 8.25,
    gracePeriodMins: 15,
    color: '#F59E0B',
    assignedEmployeeCount: 0,
    assignments: [],
  },
];

export class ShiftRepository {
  async getShifts(): Promise<ShiftRecord[]> {
    return inMemoryShifts;
  }

  async getShiftById(id: string): Promise<ShiftRecord | null> {
    return inMemoryShifts.find((s) => s.id === id) || null;
  }

  async createShift(data: Partial<ShiftRecord>): Promise<ShiftRecord> {
    const newShift: ShiftRecord = {
      id: `sh-${Date.now()}`,
      shiftName: data.shiftName || 'Custom Shift',
      startTime: data.startTime || '09:00',
      endTime: data.endTime || '18:00',
      breakDurationMins: data.breakDurationMins || 60,
      workingHours: data.workingHours || 8.0,
      gracePeriodMins: data.gracePeriodMins || 15,
      color: data.color || '#0E7490',
      assignedEmployeeCount: 0,
      assignments: [],
    };
    inMemoryShifts.push(newShift);
    return newShift;
  }

  async assignEmployees(shiftId: string, employeeIds: string[]): Promise<ShiftRecord | null> {
    const shift = inMemoryShifts.find((s) => s.id === shiftId);
    if (!shift) return null;

    shift.assignments = Array.from(new Set(employeeIds));
    shift.assignedEmployeeCount = shift.assignments.length;
    return shift;
  }
}

export const shiftRepository = new ShiftRepository();
