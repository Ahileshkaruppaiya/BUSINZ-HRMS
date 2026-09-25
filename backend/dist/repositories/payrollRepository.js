import { getSupabaseAdmin, isRealSupabaseConfigured } from '../config/supabase.js';
import { employeeRepository } from './employeeRepository.js';
import { settingsRepository } from './settingsRepository.js';
// In-memory data store for payroll runs & processed records during active session
const inMemoryRuns = [];
const inMemoryRecords = new Map();
export class PayrollRepository {
    async getRunByMonth(month, year) {
        const found = inMemoryRuns.find(r => r.payrollMonth === month && r.payrollYear === year);
        if (found)
            return found;
        if (isRealSupabaseConfigured()) {
            try {
                const supabase = getSupabaseAdmin();
                const { data, error } = await supabase
                    .from('payroll_runs')
                    .select('*')
                    .eq('payroll_month', month)
                    .eq('payroll_year', year)
                    .maybeSingle();
                if (data && !error) {
                    return {
                        id: data.id,
                        payrollMonth: data.payroll_month,
                        payrollYear: data.payroll_year,
                        status: data.status,
                        totalEmployees: data.total_employees,
                        totalGross: Number(data.total_gross),
                        totalDeductions: Number(data.total_deductions),
                        totalNet: Number(data.total_net),
                        processedBy: data.processed_by,
                        approvedBy: data.approved_by,
                        processedAt: data.processed_at,
                        approvedAt: data.approved_at,
                        paidAt: data.paid_at,
                        createdAt: data.created_at,
                        updatedAt: data.updated_at,
                    };
                }
            }
            catch (err) {
                console.warn('Database error in getRunByMonth:', err);
            }
        }
        return null;
    }
    async getRunById(id) {
        return inMemoryRuns.find(r => r.id === id) || null;
    }
    async getAllRuns() {
        if (isRealSupabaseConfigured()) {
            try {
                const supabase = getSupabaseAdmin();
                const { data, error } = await supabase
                    .from('payroll_runs')
                    .select('*')
                    .order('payroll_year', { ascending: false })
                    .order('payroll_month', { ascending: false });
                if (data && !error && data.length > 0) {
                    return data.map(d => ({
                        id: d.id,
                        payrollMonth: d.payroll_month,
                        payrollYear: d.payroll_year,
                        status: d.status,
                        totalEmployees: d.total_employees,
                        totalGross: Number(d.total_gross),
                        totalDeductions: Number(d.total_deductions),
                        totalNet: Number(d.total_net),
                        processedBy: d.processed_by,
                        approvedBy: d.approved_by,
                        processedAt: d.processed_at,
                        approvedAt: d.approved_at,
                        paidAt: d.paid_at,
                        createdAt: d.created_at,
                        updatedAt: d.updated_at,
                    }));
                }
            }
            catch (err) {
                console.warn('Database error in getAllRuns:', err);
            }
        }
        return inMemoryRuns;
    }
    async createRun(month, year) {
        const existing = await this.getRunByMonth(month, year);
        if (existing) {
            throw new Error(`Payroll run for ${month}/${year} already exists with status ${existing.status}`);
        }
        const id = `run-${year}-${String(month).padStart(2, '0')}`;
        const newRun = {
            id,
            payrollMonth: month,
            payrollYear: year,
            status: 'DRAFT',
            totalEmployees: 0,
            totalGross: 0,
            totalDeductions: 0,
            totalNet: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        inMemoryRuns.unshift(newRun);
        if (isRealSupabaseConfigured()) {
            try {
                const supabase = getSupabaseAdmin();
                await supabase.from('payroll_runs').insert({
                    id: newRun.id,
                    payroll_month: newRun.payrollMonth,
                    payroll_year: newRun.payrollYear,
                    status: newRun.status,
                    total_employees: newRun.totalEmployees,
                    total_gross: newRun.totalGross,
                    total_deductions: newRun.totalDeductions,
                    total_net: newRun.totalNet,
                });
            }
            catch (err) {
                console.warn('Could not insert payroll run to Supabase:', err);
            }
        }
        return newRun;
    }
    async saveProcessedRun(runId, records, processorName) {
        let run = inMemoryRuns.find(r => r.id === runId) || null;
        if (!run) {
            run = await this.getRunById(runId);
        }
        if (!run) {
            throw new Error(`Payroll run ${runId} not found`);
        }
        if (run.status === 'PAID') {
            throw new Error('Cannot re-process an already PAID payroll run');
        }
        const totalGross = records.reduce((acc, r) => acc + r.grossSalary, 0);
        const totalDeductions = records.reduce((acc, r) => acc + r.totalDeductions, 0);
        const totalNet = records.reduce((acc, r) => acc + r.netSalary, 0);
        run.status = 'PROCESSED';
        run.totalEmployees = records.length;
        run.totalGross = Number(totalGross.toFixed(2));
        run.totalDeductions = Number(totalDeductions.toFixed(2));
        run.totalNet = Number(totalNet.toFixed(2));
        run.processedBy = processorName;
        run.processedAt = new Date().toISOString();
        run.updatedAt = new Date().toISOString();
        inMemoryRecords.set(runId, records);
        if (isRealSupabaseConfigured()) {
            try {
                const supabase = getSupabaseAdmin();
                await supabase
                    .from('payroll_runs')
                    .update({
                    status: run.status,
                    total_employees: run.totalEmployees,
                    total_gross: run.totalGross,
                    total_deductions: run.totalDeductions,
                    total_net: run.totalNet,
                    processed_by: run.processedBy,
                    processed_at: run.processedAt,
                    updated_at: run.updatedAt,
                })
                    .eq('id', runId);
                // Also save to company_settings payroll_records_data for frontend synchronization
                const { data: csData } = await supabase
                    .from('company_settings')
                    .select('id, setting_val')
                    .eq('setting_key', 'payroll_records_data')
                    .maybeSingle();
                const currentRecords = Array.isArray(csData?.setting_val) ? csData.setting_val : [];
                const mergedRecords = [...records, ...currentRecords.filter(cr => !records.some(r => r.employeeId === cr.employeeId && r.payrollMonth === cr.payrollMonth && r.payrollYear === cr.payrollYear))];
                if (csData?.id) {
                    await supabase
                        .from('company_settings')
                        .update({ setting_val: mergedRecords, updated_at: new Date().toISOString() })
                        .eq('id', csData.id);
                }
                else {
                    await supabase
                        .from('company_settings')
                        .insert({ setting_key: 'payroll_records_data', setting_val: mergedRecords });
                }
            }
            catch (err) {
                console.warn('Could not persist processed run to Supabase:', err);
            }
        }
        return run;
    }
    async updateRunStatus(runId, status, approverName) {
        let run = inMemoryRuns.find(r => r.id === runId) || null;
        if (!run) {
            run = await this.getRunById(runId);
        }
        if (!run) {
            throw new Error(`Payroll run ${runId} not found`);
        }
        if (run.status === 'PAID' && status !== 'PAID') {
            throw new Error('Cannot change status of an already PAID payroll run');
        }
        if (status === 'PAID' && run.status !== 'APPROVED') {
            throw new Error('Payroll run must be APPROVED before it can be marked as PAID');
        }
        run.status = status;
        run.updatedAt = new Date().toISOString();
        if (status === 'APPROVED') {
            run.approvedBy = approverName || 'Authorized Signatory';
            run.approvedAt = new Date().toISOString();
        }
        else if (status === 'PAID') {
            run.paidAt = new Date().toISOString();
        }
        if (isRealSupabaseConfigured()) {
            try {
                const supabase = getSupabaseAdmin();
                const payload = {
                    status: run.status,
                    updated_at: run.updatedAt,
                };
                if (run.approvedBy)
                    payload.approved_by = run.approvedBy;
                if (run.approvedAt)
                    payload.approved_at = run.approvedAt;
                if (run.paidAt)
                    payload.paid_at = run.paidAt;
                await supabase
                    .from('payroll_runs')
                    .update(payload)
                    .eq('id', runId);
            }
            catch (err) {
                console.warn('Could not update run status in Supabase:', err);
            }
        }
        return run;
    }
    async getRecordsForRun(runId) {
        const memory = inMemoryRecords.get(runId);
        if (memory && memory.length > 0)
            return memory;
        if (isRealSupabaseConfigured()) {
            try {
                const supabase = getSupabaseAdmin();
                const { data: csData } = await supabase
                    .from('company_settings')
                    .select('setting_val')
                    .eq('setting_key', 'payroll_records_data')
                    .maybeSingle();
                if (csData?.setting_val && Array.isArray(csData.setting_val)) {
                    return csData.setting_val;
                }
            }
            catch (err) {
                console.warn('Could not get records from Supabase:', err);
            }
        }
        return [];
    }
    async getAllProcessedRecords() {
        const all = [];
        for (const recs of inMemoryRecords.values()) {
            all.push(...recs);
        }
        if (all.length > 0)
            return all;
        if (isRealSupabaseConfigured()) {
            try {
                const supabase = getSupabaseAdmin();
                const { data: csData } = await supabase
                    .from('company_settings')
                    .select('setting_val')
                    .eq('setting_key', 'payroll_records_data')
                    .maybeSingle();
                if (csData?.setting_val && Array.isArray(csData.setting_val)) {
                    return csData.setting_val;
                }
            }
            catch (err) {
                console.warn('Could not get records from Supabase:', err);
            }
        }
        return [];
    }
    async getRecordForEmployee(employeeId, month, year) {
        const all = await this.getAllProcessedRecords();
        return (all.find(r => {
            const matchesEmp = r.employeeId?.toLowerCase().trim() === employeeId.toLowerCase().trim();
            if (!month || !year)
                return matchesEmp;
            return matchesEmp && r.payrollMonth === month && r.payrollYear === year;
        }) || null);
    }
    async generatePayslip(employeeId, month, year) {
        const record = await this.getRecordForEmployee(employeeId, month, year);
        if (!record)
            return null;
        const emp = await employeeRepository.getEmployeeById(employeeId);
        if (!emp)
            return null;
        const compSettings = await settingsRepository.getCompanySettings();
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return {
            company: {
                companyName: compSettings.companyName || 'Corporate Organization',
                legalName: compSettings.legalEntity || compSettings.companyName || 'Corporate Organization',
                address: compSettings.address || '',
                pan: compSettings.panNumber || '',
                gst: compSettings.taxIdGst || '',
            },
            employee: {
                id: emp.id,
                employeeId: emp.employeeId,
                firstName: emp.firstName,
                lastName: emp.lastName,
                email: emp.email,
                department: emp.department,
                designation: emp.designation,
                bankName: emp.bankName,
                accountNumber: emp.accountNumber,
                ifscCode: emp.ifscCode,
            },
            payroll: {
                month: record.payrollMonth,
                year: record.payrollYear,
                monthName: months[record.payrollMonth - 1] || 'August',
                workingDays: record.workingDays,
                presentDays: record.presentDays,
                lopDays: record.lopDays,
                status: 'Processed',
            },
            earnings: {
                basicSalary: record.basicSalary,
                da: record.da,
                conveyance: record.conveyance,
                hra: record.hra,
                attendanceBonus: record.attendanceBonus,
                overtimeAmount: record.overtimeAmount,
                bonus: record.bonus,
                incentive: record.incentive,
                commission: record.commission,
                otherEarnings: record.otherEarnings,
                grossSalary: record.grossSalary,
            },
            deductions: {
                pf: record.pfAmount,
                pfRate: record.pfRate,
                esic: record.esicAmount,
                esicRate: record.esicRate,
                professionalTax: record.professionalTax,
                lopAmount: record.lopAmount,
                advanceRecovery: record.advanceRecovery,
                loanRecovery: record.loanRecovery,
                otherDeductions: record.otherDeductions,
                totalDeductions: record.totalDeductions,
            },
            netSalary: record.netSalary,
        };
    }
}
export const payrollRepository = new PayrollRepository();
//# sourceMappingURL=payrollRepository.js.map