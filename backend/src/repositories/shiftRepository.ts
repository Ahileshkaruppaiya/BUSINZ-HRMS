import { getSupabaseAdmin, isRealSupabaseConfigured } from '../config/supabase.js';
import { ShiftRecord } from '../types/hrms.js';

export class ShiftRepository {
  async getShifts(): Promise<ShiftRecord[]> {
    if (!isRealSupabaseConfigured()) {
      return [];
    }

    try {
      const supabase = getSupabaseAdmin();

      // 1. Check company_settings for shifts_data
      const { data: csData } = await supabase
        .from('company_settings')
        .select('setting_val')
        .eq('setting_key', 'shifts_data')
        .maybeSingle();

      if (csData?.setting_val && Array.isArray(csData.setting_val) && csData.setting_val.length > 0) {
        return csData.setting_val.map((s: any) => ({
          id: s.id || `sh-${Date.now()}`,
          shiftName: s.shiftName || s.name || 'Shift',
          startTime: s.startTime || '09:00',
          endTime: s.endTime || '18:00',
          breakDurationMins: Number(s.breakDurationMins) || 45,
          workingHours: Number(s.workingHours) || 8.0,
          gracePeriodMins: Number(s.gracePeriodMins) || 15,
          color: s.color || '#0E7490',
          assignedEmployeeCount: Number(s.assignedEmployeeCount) || (Array.isArray(s.assignments) ? s.assignments.length : 0),
          assignments: Array.isArray(s.assignments) ? s.assignments : [],
        }));
      }

      // 2. Check shifts table
      const { data: dbShifts } = await supabase
        .from('shifts')
        .select('*')
        .order('created_at', { ascending: true });

      if (dbShifts && dbShifts.length > 0) {
        return dbShifts.map((s: any) => ({
          id: s.id,
          shiftName: s.name || s.shift_name || 'Shift',
          startTime: s.start_time || '09:00',
          endTime: s.end_time || '18:00',
          breakDurationMins: Number(s.break_duration_mins) || 45,
          workingHours: Number(s.working_hours) || 8.0,
          gracePeriodMins: Number(s.grace_period_mins) || 15,
          color: s.color || '#0E7490',
          assignedEmployeeCount: 0,
          assignments: [],
        }));
      }
    } catch (err) {
      console.warn('Database error in getShifts:', err);
    }

    return [];
  }

  async getShiftById(id: string): Promise<ShiftRecord | null> {
    if (!id) return null;
    const all = await this.getShifts();
    return all.find((s) => s.id === id) || null;
  }

  async createShift(data: Partial<ShiftRecord>): Promise<ShiftRecord> {
    const newShift: ShiftRecord = {
      id: `SH-${Date.now()}`,
      shiftName: data.shiftName || 'Shift',
      startTime: data.startTime || '09:00',
      endTime: data.endTime || '18:00',
      breakDurationMins: data.breakDurationMins || 45,
      workingHours: data.workingHours || 8.0,
      gracePeriodMins: data.gracePeriodMins || 15,
      color: data.color || '#0E7490',
      assignedEmployeeCount: 0,
      assignments: [],
    };

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const currentShifts = await this.getShifts();
        const updatedShifts = [...currentShifts, newShift];

        // Save to company_settings
        const { data: existingSetting } = await supabase
          .from('company_settings')
          .select('id')
          .eq('setting_key', 'shifts_data')
          .maybeSingle();

        if (existingSetting?.id) {
          await supabase
            .from('company_settings')
            .update({ setting_val: updatedShifts, updated_at: new Date().toISOString() })
            .eq('id', existingSetting.id);
        } else {
          await supabase
            .from('company_settings')
            .insert({
              setting_key: 'shifts_data',
              setting_val: updatedShifts,
            });
        }
      } catch (err) {
        console.warn('Could not persist shift to Supabase:', err);
      }
    }

    return newShift;
  }

  async assignEmployees(shiftId: string, employeeIds: string[]): Promise<ShiftRecord | null> {
    const shifts = await this.getShifts();
    const shift = shifts.find((s) => s.id === shiftId);
    if (!shift) return null;

    shift.assignments = Array.from(new Set(employeeIds));
    shift.assignedEmployeeCount = shift.assignments.length;

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data: existingSetting } = await supabase
          .from('company_settings')
          .select('id')
          .eq('setting_key', 'shifts_data')
          .maybeSingle();

        if (existingSetting?.id) {
          await supabase
            .from('company_settings')
            .update({ setting_val: shifts, updated_at: new Date().toISOString() })
            .eq('id', existingSetting.id);
        }
      } catch (err) {
        console.warn('Could not update shift assignments in Supabase:', err);
      }
    }

    return shift;
  }
}

export const shiftRepository = new ShiftRepository();
