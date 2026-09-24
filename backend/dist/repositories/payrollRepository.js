import { getSupabaseAdmin, isRealSupabaseConfigured } from '../config/supabase.js';
import { employeeRepository } from './employeeRepository.js';
// In-memory data store for payroll runs & processed records (clean state, no stale cache)
const inMemoryRuns = [];
const inMemoryRecords = new Map();
export class PayrollRepository {
    async getRunByMonth(month, year) {
        const key = `run-${year}-${String(month).padStart(2, '0')}`;
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
                    .single();
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
            catch {
                // fallback
            }
        }
        return null;
    }
    async getRunById(id) {
        return inMemoryRuns.find(r => r.id === id) || null;
    }
    async getAllRuns() {
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
        return newRun;
    }
    async saveProcessedRun(runId, records, processorName) {
        const run = inMemoryRuns.find(r => r.id === runId);
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
        return run;
    }
    async updateRunStatus(runId, status, approverName) {
        const run = inMemoryRuns.find(r => r.id === runId);
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
        return run;
    }
    async getRecordsForRun(runId) {
        return inMemoryRecords.get(runId) || [];
    }
    async getAllProcessedRecords() {
        const all = [];
        for (const recs of inMemoryRecords.values()) {
            all.push(...recs);
        }
        return all;
    }
    async getRecordForEmployee(employeeId, month, year) {
        const all = await this.getAllProcessedRecords();
        return (all.find(r => {
            const matchesEmp = r.employeeId === employeeId;
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
        const months = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        return {
            company: {
                companyName: 'Businz Technologies Private Limited',
                legalName: 'Businz Technologies Pvt Ltd',
                address: 'Businz Towers, Tech Corridor, OMR, Chennai, Tamil Nadu - 600096',
                pan: 'AAACB1234F',
                gst: '33AAACB1234F1Z5',
            },
            employee: {
                id: emp?.id || employeeId,
                employeeId: emp?.employeeId || employeeId,
                firstName: emp?.firstName || 'Staff',
                lastName: emp?.lastName || 'Member',
                email: emp?.email || 'staff@businz.com',
                department: emp?.department || 'Engineering',
                designation: emp?.designation || 'Specialist',
                bankName: emp?.bankName,
                accountNumber: emp?.accountNumber,
                ifscCode: emp?.ifscCode,
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