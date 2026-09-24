import { getSupabaseAdmin, isRealSupabaseConfigured } from '../config/supabase.js';
const inMemoryOvertime = [];
export class OvertimeRepository {
    async getApprovedOvertimeForMonth(employeeId, _month, _year) {
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
            }
            catch {
                // fallback
            }
        }
        return inMemoryOvertime.filter(ot => ot.employeeId === employeeId && ot.status === 'APPROVED');
    }
    async getAllOvertime() {
        return inMemoryOvertime;
    }
    async createOvertime(record) {
        const amount = Number((record.hours * record.hourlyRate).toFixed(2));
        const newRecord = {
            id: `ot-${Date.now()}`,
            ...record,
            amount,
            status: 'PENDING',
            createdAt: new Date().toISOString(),
        };
        inMemoryOvertime.unshift(newRecord);
        return newRecord;
    }
    async approveOvertime(id, approverName) {
        const rec = inMemoryOvertime.find(r => r.id === id);
        if (!rec)
            return null;
        rec.status = 'APPROVED';
        rec.approvedBy = approverName;
        rec.approvedAt = new Date().toISOString();
        return rec;
    }
}
export const overtimeRepository = new OvertimeRepository();
//# sourceMappingURL=overtimeRepository.js.map