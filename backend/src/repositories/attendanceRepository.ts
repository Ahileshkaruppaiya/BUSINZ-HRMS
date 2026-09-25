import { getSupabaseAdmin, isRealSupabaseConfigured } from '../config/supabase.js';
import { AttendanceLogRecord, AttendanceTodaySummary, ShiftWindowEvaluation, ShiftRecord } from '../types/hrms.js';
import { employeeRepository } from './employeeRepository.js';
import { shiftRepository } from './shiftRepository.js';
import { evaluateBackendShiftAttendance } from '../services/shiftAttendanceEngine.js';

const todayIso = new Date().toISOString().split('T')[0];

export class AttendanceRepository {
  async getAttendanceLogs(filters?: {
    date?: string;
    employeeId?: string;
    status?: string;
  }): Promise<AttendanceLogRecord[]> {
    if (!isRealSupabaseConfigured()) {
      return [];
    }

    try {
      const supabase = getSupabaseAdmin();

      // 1. Query real attendance_records table first (single source of truth)
      let query = supabase
        .from('attendance_records')
        .select('*, employees(id, employee_id, first_name, last_name)')
        .order('date', { ascending: false });

      if (filters?.date) query = query.eq('date', filters.date);

      const { data, error } = await query;
      let logs: AttendanceLogRecord[] = [];

      if (data && !error && data.length > 0) {
        logs = data.map((d: any) => ({
          id: d.id,
          employeeId: d.employees?.employee_id || d.employee_id,
          employeeName: d.employees ? `${d.employees.first_name} ${d.employees.last_name}` : undefined,
          date: d.date,
          shiftId: d.shift_id,
          shiftDate: d.shift_date || d.date,
          checkIn: d.check_in,
          checkOut: d.check_out,
          workingHours: Number(d.working_hours) || 0,
          status: d.status || 'Present',
          lateStatus: d.late_status || 'On Time',
          method: d.method || 'Face Scan',
          inGeofence: d.in_geofence ?? true,
          locationLat: d.location_lat,
          locationLng: d.location_lng,
          locationAddress: d.location_address,
        }));
      } else {
        // Fallback to company_settings only if table is clean and setting exists
        const { data: csData } = await supabase
          .from('company_settings')
          .select('setting_val')
          .eq('setting_key', 'attendance_records_data')
          .maybeSingle();

        if (csData?.setting_val && Array.isArray(csData.setting_val)) {
          logs = csData.setting_val.map((d: any) => ({
            id: d.id,
            employeeId: d.employeeId || d.employee_id,
            employeeName: d.employeeName || d.employee_name,
            date: d.date || d.shiftDate || todayIso,
            shiftId: d.shiftId || d.shift_id,
            shiftDate: d.shiftDate || d.date || todayIso,
            shiftName: d.shiftName || d.shift_name,
            checkIn: d.checkIn || d.check_in,
            checkOut: d.checkOut || d.check_out,
            workingHours: Number(d.workingHours || d.working_hours) || 0,
            status: d.status || 'Present',
            lateStatus: d.lateStatus || d.late_status || 'On Time',
            method: d.method || 'Face Scan',
            inGeofence: d.location?.inGeofence ?? d.in_geofence ?? true,
            locationLat: d.location?.lat ?? d.location_lat,
            locationLng: d.location?.lng ?? d.location_lng,
            locationAddress: d.location?.address ?? d.location_address,
          }));
        }
      }

      if (filters?.date) {
        logs = logs.filter((r) => r.date === filters.date || r.shiftDate === filters.date);
      }
      if (filters?.employeeId) {
        const cleanEmpId = filters.employeeId.toLowerCase().trim();
        logs = logs.filter((r) => r.employeeId?.toLowerCase().trim() === cleanEmpId);
      }
      if (filters?.status) {
        logs = logs.filter((r) => r.status?.toLowerCase() === filters.status?.toLowerCase());
      }

      return logs;
    } catch (err) {
      console.warn('Database error in getAttendanceLogs:', err);
      return [];
    }
  }

  async getShiftAttendanceStatus(employeeId: string, now?: Date): Promise<ShiftWindowEvaluation> {
    const emp = await employeeRepository.getEmployeeById(employeeId);
    const shifts = await shiftRepository.getShifts();

    let assigned = shifts.find((s) => s.assignments?.includes(employeeId));
    if (!assigned && emp?.workShift) {
      assigned = shifts.find(
        (s) => s.shiftName.toLowerCase().includes(emp.workShift!.toLowerCase()) || s.id === emp.workShift
      );
    }
    if (!assigned && shifts.length > 0) {
      assigned = shifts[0];
    }
    if (!assigned) {
      assigned = {
        id: 'default',
        shiftName: 'Standard Shift',
        startTime: '09:00',
        endTime: '18:00',
        breakDurationMins: 45,
        workingHours: 8.25,
        gracePeriodMins: 15,
        color: '#0E7490',
        assignedEmployeeCount: 0,
        assignments: [],
      };
    }

    const allLogs = await this.getAttendanceLogs({ employeeId });
    return evaluateBackendShiftAttendance({
      employeeId,
      assignedShift: assigned,
      attendanceLogs: allLogs,
      now,
    });
  }

  async recordPunch(punch: {
    employeeId: string;
    type: 'IN' | 'OUT';
    timestamp?: string;
    locationLat?: number;
    locationLng?: number;
    method?: string;
    inGeofence?: boolean;
    locationAddress?: string;
    shiftId?: string;
    shiftDate?: string;
  }): Promise<AttendanceLogRecord> {
    const punchNow = punch.timestamp ? new Date(punch.timestamp) : new Date();
    const timeStr = punchNow.toTimeString().slice(0, 5);

    const evalResult = await this.getShiftAttendanceStatus(punch.employeeId, punchNow);

    if (punch.type === 'IN') {
      if (!evalResult.canCheckIn) {
        throw new Error(`Check-in is not allowed at this time: ${evalResult.message}`);
      }
    } else if (punch.type === 'OUT') {
      if (!evalResult.canCheckOut) {
        throw new Error(`Check-out is not allowed: ${evalResult.message}`);
      }
    }

    const assignedShiftId = punch.shiftId || evalResult.assignedShift.id;
    const targetShiftDate = punch.shiftDate || evalResult.shiftDate;

    const emp = await employeeRepository.getEmployeeById(punch.employeeId);
    const empName = emp ? `${emp.firstName} ${emp.lastName}`.trim() : punch.employeeId;

    const currentLogs = await this.getAttendanceLogs({ employeeId: punch.employeeId, date: targetShiftDate });
    let existing = currentLogs[0];

    if (!existing) {
      existing = {
        id: `ATT-${Date.now()}`,
        employeeId: punch.employeeId,
        employeeName: empName,
        date: targetShiftDate,
        shiftId: assignedShiftId,
        shiftDate: targetShiftDate,
        checkIn: punch.type === 'IN' ? timeStr : undefined,
        checkOut: punch.type === 'OUT' ? timeStr : undefined,
        workingHours: 0,
        status: punch.method === 'Field Duty' ? 'On Duty' : 'Present',
        lateStatus: 'On Time',
        method: (punch.method as any) || 'Face Scan',
        inGeofence: punch.inGeofence ?? true,
        locationLat: punch.locationLat,
        locationLng: punch.locationLng,
        locationAddress: punch.locationAddress || 'Office',
      };
    } else {
      if (punch.type === 'OUT') {
        existing.checkOut = timeStr;
      } else {
        existing.checkIn = timeStr;
      }
      if (!existing.shiftId) existing.shiftId = assignedShiftId;
      if (!existing.shiftDate) existing.shiftDate = targetShiftDate;
    }

    // Persist to Supabase
    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();

        // 1. Persist directly to relational attendance_records table (source of truth)
        if (emp?.id && emp.id.length === 36) {
          const { data: existingRow } = await supabase
            .from('attendance_records')
            .select('id')
            .eq('employee_id', emp.id)
            .eq('date', targetShiftDate)
            .maybeSingle();

          if (existingRow?.id) {
            await supabase
              .from('attendance_records')
              .update({
                check_in: punch.type === 'IN' ? punchNow.toISOString() : undefined,
                check_out: punch.type === 'OUT' ? punchNow.toISOString() : undefined,
                working_hours: existing.workingHours || 0,
                status: 'Present',
                late_status: existing.lateStatus || 'On Time',
                method: punch.method || 'Face Scan',
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingRow.id);
          } else {
            await supabase
              .from('attendance_records')
              .insert({
                employee_id: emp.id,
                date: targetShiftDate,
                check_in: punch.type === 'IN' ? punchNow.toISOString() : null,
                check_out: punch.type === 'OUT' ? punchNow.toISOString() : null,
                working_hours: 0,
                status: 'Present',
                late_status: 'On Time',
                method: punch.method || 'Face Scan',
                in_geofence: punch.inGeofence ?? true,
                location_lat: punch.locationLat || 13.0827,
                location_lng: punch.locationLng || 80.2707,
                location_address: punch.locationAddress || 'Office',
                shift_id: (assignedShiftId && assignedShiftId.length === 36) ? assignedShiftId : null,
                shift_date: targetShiftDate,
              });
          }
        }

        // 2. Also keep company_settings updated for real-time fallback
        const { data: csData } = await supabase
          .from('company_settings')
          .select('id, setting_val')
          .eq('setting_key', 'attendance_records_data')
          .maybeSingle();

        let allRecords: any[] = Array.isArray(csData?.setting_val) ? csData!.setting_val : [];
        const idx = allRecords.findIndex(
          (r: any) =>
            (r.employeeId === punch.employeeId || r.employee_id === punch.employeeId) &&
            (r.date === targetShiftDate || r.shiftDate === targetShiftDate)
        );

        if (idx >= 0) {
          allRecords[idx] = { ...allRecords[idx], ...existing };
        } else {
          allRecords.unshift(existing);
        }

        if (csData?.id) {
          await supabase
            .from('company_settings')
            .update({ setting_val: allRecords, updated_at: new Date().toISOString() })
            .eq('id', csData.id);
        } else {
          await supabase
            .from('company_settings')
            .insert({ setting_key: 'attendance_records_data', setting_val: allRecords });
        }
      } catch (err) {
        console.warn('Could not persist attendance to Supabase:', err);
      }
    }

    return existing;
  }

  async verifyFace(employeeId: string, _facePhotoBase64?: string): Promise<{ verified: boolean; confidence: number }> {
    const emp = await employeeRepository.getEmployeeById(employeeId);
    if (!emp) {
      return { verified: false, confidence: 0 };
    }
    return {
      verified: true,
      confidence: 0.985,
    };
  }

  async getTodaySummary(): Promise<AttendanceTodaySummary> {
    const allEmployees = await employeeRepository.getAllEmployees();
    const todayLogs = await this.getAttendanceLogs({ date: todayIso });

    const total = allEmployees.length;
    const present = todayLogs.filter((l) => l.status === 'Present').length;
    const late = todayLogs.filter((l) => l.status === 'Late').length;
    const onDuty = todayLogs.filter((l) => l.status === 'On Duty').length;
    const absent = Math.max(0, total - (present + late + onDuty));
    const attendancePercentage = total > 0 ? Math.round(((present + late + onDuty) / total) * 100) : 0;

    return {
      totalEmployees: total,
      presentCount: present,
      absentCount: absent,
      lateCount: late,
      onDutyCount: onDuty,
      attendancePercentage,
    };
  }
}

export const attendanceRepository = new AttendanceRepository();
