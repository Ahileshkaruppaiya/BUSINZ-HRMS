import { getSupabaseAdmin, isRealSupabaseConfigured } from '../config/supabase.js';
import { LeaveRecord, LeaveBalance } from '../types/hrms.js';
import { employeeRepository } from './employeeRepository.js';

const inMemoryLeaves: LeaveRecord[] = [];

export class LeaveRepository {
  async getLeaves(filters?: { employeeId?: string; status?: string }): Promise<LeaveRecord[]> {
    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        let query = supabase.from('leave_requests').select('*').order('created_at', { ascending: false });

        if (filters?.employeeId) query = query.eq('employee_id', filters.employeeId);
        if (filters?.status) query = query.eq('status', filters.status);

        const { data, error } = await query;
        if (data && !error && data.length > 0) {
          return data.map((d: any) => ({
            id: d.id,
            employeeId: d.employee_id,
            leaveType: d.leave_type || 'Casual',
            startDate: d.start_date,
            endDate: d.end_date,
            daysCount: Number(d.days_count) || 1,
            reason: d.reason || '',
            status: d.status || 'Pending',
            appliedDate: d.applied_date || d.created_at?.split('T')[0] || '2026-09-01',
            approvedBy: d.approved_by,
            comment: d.comment,
          }));
        }
      } catch {
        // fallback
      }
    }

    let results = [...inMemoryLeaves];
    if (filters?.employeeId) {
      results = results.filter((r) => r.employeeId === filters.employeeId);
    }
    if (filters?.status) {
      results = results.filter((r) => r.status.toLowerCase() === filters.status?.toLowerCase());
    }
    return results;
  }

  async createLeave(data: Partial<LeaveRecord>): Promise<LeaveRecord> {
    const emp = await employeeRepository.getEmployeeById(data.employeeId || 'EMP-001');
    const empName = emp ? `${emp.firstName} ${emp.lastName}`.trim() : data.employeeId || 'Staff';

    const s = new Date(data.startDate || new Date().toISOString().split('T')[0]);
    const e = new Date(data.endDate || data.startDate || new Date().toISOString().split('T')[0]);
    const diffTime = Math.abs(e.getTime() - s.getTime());
    const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const newRecord: LeaveRecord = {
      id: `lv-${Date.now()}`,
      employeeId: data.employeeId || 'EMP-001',
      employeeName: empName,
      department: emp?.department || 'General',
      leaveType: data.leaveType || 'Casual',
      startDate: data.startDate || new Date().toISOString().split('T')[0],
      endDate: data.endDate || new Date().toISOString().split('T')[0],
      daysCount: data.daysCount || days || 1,
      reason: data.reason || 'Personal Leave',
      status: 'Pending',
      appliedDate: new Date().toISOString().split('T')[0],
    };

    inMemoryLeaves.unshift(newRecord);

    if (isRealSupabaseConfigured() && emp) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('leave_requests').insert({
          employee_id: emp.id,
          leave_type: newRecord.leaveType === 'Casual' ? 'Casual Leave' : newRecord.leaveType === 'Sick' ? 'Sick Leave' : 'Casual Leave',
          start_date: newRecord.startDate,
          end_date: newRecord.endDate,
          days_count: newRecord.daysCount,
          reason: newRecord.reason,
          status: newRecord.status,
        });
      } catch (err) {
        console.warn('Could not persist leave to Supabase:', err);
      }
    }

    return newRecord;
  }

  async updateLeaveStatus(
    id: string,
    status: 'Approved' | 'Rejected',
    approverName: string,
    comment?: string
  ): Promise<LeaveRecord | null> {
    const item = inMemoryLeaves.find((l) => l.id === id);
    if (!item) return null;

    item.status = status;
    item.approvedBy = approverName;
    item.approvedAt = new Date().toISOString();
    if (comment) item.comment = comment;

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('leave_requests')
          .update({
            status,
            approved_by: approverName,
            comment,
          })
          .eq('id', id);
      } catch (err) {
        console.warn('Could not update leave in Supabase:', err);
      }
    }

    return item;
  }

  async getLeaveBalances(employeeId: string): Promise<LeaveBalance> {
    const employeeLeaves = inMemoryLeaves.filter((l) => l.employeeId === employeeId && l.status === 'Approved');
    const usedCasual = employeeLeaves.filter((l) => l.leaveType === 'Casual').reduce((s, l) => s + l.daysCount, 0);
    const usedSick = employeeLeaves.filter((l) => l.leaveType === 'Sick').reduce((s, l) => s + l.daysCount, 0);
    const usedEarned = employeeLeaves.filter((l) => l.leaveType === 'Earned').reduce((s, l) => s + l.daysCount, 0);

    return {
      employeeId,
      casual: { total: 12, used: usedCasual, remaining: Math.max(0, 12 - usedCasual) },
      sick: { total: 10, used: usedSick, remaining: Math.max(0, 10 - usedSick) },
      earned: { total: 15, used: usedEarned, remaining: Math.max(0, 15 - usedEarned) },
    };
  }
}

export const leaveRepository = new LeaveRepository();
