import { getSupabaseAdmin, isRealSupabaseConfigured } from '../config/supabase.js';

export interface OvertimeModel {
  id: string;
  employeeId: string;
  date: string;
  hours: number;
  hourlyRate: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PAID';
  reason?: string;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
}

const inMemoryOvertime: OvertimeModel[] = [];

export class OvertimeRepository {
  async getApprovedOvertimeForMonth(employeeId: string, _month: number, _year: number): Promise<OvertimeModel[]> {
    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
          .from('overtime_records')
          .select('*')
          .eq('status', 'APPROVED');

        if (data && !error) {
          return data.map(d => ({
            id: d.id,
            employeeId: d.employee_id,
            date: d.date,
            hours: Number(d.hours),
            hourlyRate: Number(d.hourly_rate),
            amount: Number(d.amount),
            status: d.status,
            reason: d.reason,
            approvedBy: d.approved_by,
            approvedAt: d.approved_at,
            createdAt: d.created_at,
          }));
        }
      } catch {
        // fallback
      }
    }

    return inMemoryOvertime.filter(ot => ot.employeeId === employeeId && ot.status === 'APPROVED');
  }

  async getAllOvertime(): Promise<OvertimeModel[]> {
    return inMemoryOvertime;
  }

  async createOvertime(record: Omit<OvertimeModel, 'id' | 'createdAt' | 'status' | 'amount'>): Promise<OvertimeModel> {
    const amount = Number((record.hours * record.hourlyRate).toFixed(2));
    const newRecord: OvertimeModel = {
      id: `ot-${Date.now()}`,
      ...record,
      amount,
      status: 'PENDING',
      createdAt: new Date().toISOString(),
    };
    inMemoryOvertime.unshift(newRecord);
    return newRecord;
  }

  async approveOvertime(id: string, approverName: string): Promise<OvertimeModel | null> {
    const rec = inMemoryOvertime.find(r => r.id === id);
    if (!rec) return null;
    rec.status = 'APPROVED';
    rec.approvedBy = approverName;
    rec.approvedAt = new Date().toISOString();
    return rec;
  }
}

export const overtimeRepository = new OvertimeRepository();
