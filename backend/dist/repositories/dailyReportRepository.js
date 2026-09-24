import { getSupabaseAdmin, isRealSupabaseConfigured } from '../config/supabase.js';
import { employeeRepository } from './employeeRepository.js';
// In-memory fallback daily reports storage
const inMemoryReports = [
    {
        id: 'dr-1',
        organizationId: 'VRM-ORG-001',
        employeeId: 'EMP-001',
        employeeName: 'Pavithra',
        employeeCode: 'EMP-001',
        department: 'Human Resources',
        reportDate: '2026-09-16',
        status: 'Reviewed',
        revision: 1,
        overallSummary: 'Completed review of engineering task deliverables and verified staging database migration scripts.',
        nextDayPlan: 'Continue verification of payroll calculations and attendance tracking geofence.',
        otherWork: 'Assisted onboarding candidate interviews.',
        submittedAt: '2026-09-16T18:00:00Z',
        submittedBy: 'EMP-001',
        reviewedAt: '2026-09-16T19:00:00Z',
        reviewedBy: 'e01a1111-0000-0000-0000-000000000000',
        reviewComments: 'Approved. Good progress on the database scripts.',
        snapshots: [
            {
                id: 'drs-1',
                dailyReportId: 'dr-1',
                taskId: 't01a1111-0000-0000-0000-000000000001',
                taskNumber: 'TSK-2026-001',
                taskTitle: 'Deploy Production Database Migrations & Validation',
                taskStatus: 'In Progress',
                progressPercentage: 60,
                workDoneToday: 'Verified database connection pools and benchmarked queries under load.',
                timeSpentMinutes: 180,
                blockersOrIssues: '',
                isCarriedForward: false,
                createdAt: '2026-09-16T18:00:00Z',
            }
        ],
        createdAt: '2026-09-16T18:00:00Z',
        updatedAt: '2026-09-16T19:00:00Z',
    }
];
export class DailyReportRepository {
    async getEmployeeReports(employeeId) {
        if (isRealSupabaseConfigured()) {
            try {
                const supabase = getSupabaseAdmin();
                const { data, error } = await supabase
                    .from('daily_reports')
                    .select('*, daily_report_snapshots(*)')
                    .eq('employee_id', employeeId)
                    .order('report_date', { ascending: false });
                if (data && !error) {
                    return data.map((d) => this.mapDbRecordToDailyReport(d));
                }
            }
            catch {
                // Fallback
            }
        }
        return inMemoryReports
            .filter(r => r.employeeId === employeeId)
            .sort((a, b) => b.reportDate.localeCompare(a.reportDate));
    }
    async getReportById(reportId) {
        if (isRealSupabaseConfigured()) {
            try {
                const supabase = getSupabaseAdmin();
                const { data, error } = await supabase
                    .from('daily_reports')
                    .select('*, daily_report_snapshots(*)')
                    .eq('id', reportId)
                    .single();
                if (data && !error) {
                    return this.mapDbRecordToDailyReport(data);
                }
            }
            catch {
                // Fallback
            }
        }
        const found = inMemoryReports.find(r => r.id === reportId);
        return found ? { ...found } : null;
    }
    async getReportForDate(employeeId, reportDate) {
        const reports = inMemoryReports
            .filter(r => r.employeeId === employeeId && r.reportDate === reportDate)
            .sort((a, b) => b.revision - a.revision);
        return reports.length > 0 ? { ...reports[0] } : null;
    }
    async saveDraft(employeeId, reportDate, data, actor) {
        const existing = await this.getReportForDate(employeeId, reportDate);
        // If report is already submitted and not returned for correction, reject draft edit
        if (existing && (existing.status === 'Submitted' || existing.status === 'Reviewed')) {
            throw new Error('Submitted daily report is locked from direct edits.');
        }
        const now = new Date().toISOString();
        const emp = await employeeRepository.getEmployeeById(employeeId);
        const empName = emp ? `${emp.firstName} ${emp.lastName}`.trim() : actor.name;
        const department = emp?.department || actor.department || 'General';
        if (existing && (existing.status === 'Draft' || existing.status === 'Returned for Correction')) {
            existing.overallSummary = data.overallSummary;
            existing.nextDayPlan = data.nextDayPlan;
            existing.otherWork = data.otherWork;
            existing.updatedAt = now;
            if (data.workItems) {
                existing.snapshots = data.workItems.map((wi, idx) => ({
                    id: `drs-draft-${Date.now()}-${idx}`,
                    dailyReportId: existing.id,
                    taskId: wi.taskId,
                    taskNumber: wi.taskNumber,
                    taskTitle: wi.taskTitle,
                    taskStatus: wi.taskStatus,
                    progressPercentage: wi.progressPercentage,
                    workDoneToday: wi.workDoneToday,
                    timeSpentMinutes: wi.timeSpentMinutes,
                    blockersOrIssues: wi.blockersOrIssues,
                    isCarriedForward: wi.isCarriedForward || false,
                    createdAt: now,
                }));
            }
            return { ...existing };
        }
        const newId = `dr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const newReport = {
            id: newId,
            organizationId: 'VRM-ORG-001',
            employeeId,
            employeeName: empName,
            employeeCode: emp?.employeeId || employeeId,
            department,
            reportDate,
            status: 'Draft',
            revision: 1,
            overallSummary: data.overallSummary,
            nextDayPlan: data.nextDayPlan,
            otherWork: data.otherWork,
            snapshots: (data.workItems || []).map((wi, idx) => ({
                id: `drs-draft-${Date.now()}-${idx}`,
                dailyReportId: newId,
                taskId: wi.taskId,
                taskNumber: wi.taskNumber,
                taskTitle: wi.taskTitle,
                taskStatus: wi.taskStatus,
                progressPercentage: wi.progressPercentage,
                workDoneToday: wi.workDoneToday,
                timeSpentMinutes: wi.timeSpentMinutes,
                blockersOrIssues: wi.blockersOrIssues,
                isCarriedForward: wi.isCarriedForward || false,
                createdAt: now,
            })),
            createdAt: now,
            updatedAt: now,
        };
        inMemoryReports.unshift(newReport);
        return { ...newReport };
    }
    async submitReport(employeeId, reportDate, data, actor) {
        const existing = await this.getReportForDate(employeeId, reportDate);
        // Prevent duplicate submissions: if already submitted on this revision, return existing
        if (existing && existing.status === 'Submitted') {
            return { ...existing };
        }
        const now = new Date().toISOString();
        const emp = await employeeRepository.getEmployeeById(employeeId);
        const empName = emp ? `${emp.firstName} ${emp.lastName}`.trim() : actor.name;
        const department = emp?.department || actor.department || 'General';
        // Build immutable snapshots of the tasks as reported
        const reportId = existing ? existing.id : `dr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const frozenSnapshots = (data.workItems || []).map((wi, idx) => ({
            id: `drs-${Date.now()}-${idx}`,
            dailyReportId: reportId,
            taskId: wi.taskId,
            taskNumber: wi.taskNumber,
            taskTitle: wi.taskTitle,
            taskStatus: wi.taskStatus,
            progressPercentage: wi.progressPercentage,
            workDoneToday: wi.workDoneToday,
            timeSpentMinutes: wi.timeSpentMinutes,
            blockersOrIssues: wi.blockersOrIssues,
            isCarriedForward: wi.isCarriedForward || false,
            createdAt: now,
        }));
        if (existing) {
            existing.status = 'Submitted';
            existing.overallSummary = data.overallSummary;
            existing.nextDayPlan = data.nextDayPlan;
            existing.otherWork = data.otherWork;
            existing.submittedAt = now;
            existing.submittedBy = actor.employeeId || actor.id;
            existing.snapshots = frozenSnapshots;
            existing.updatedAt = now;
            return { ...existing };
        }
        const newReport = {
            id: reportId,
            organizationId: 'VRM-ORG-001',
            employeeId,
            employeeName: empName,
            employeeCode: emp?.employeeId || employeeId,
            department,
            reportDate,
            status: 'Submitted',
            revision: 1,
            overallSummary: data.overallSummary,
            nextDayPlan: data.nextDayPlan,
            otherWork: data.otherWork,
            submittedAt: now,
            submittedBy: actor.employeeId || actor.id,
            snapshots: frozenSnapshots,
            createdAt: now,
            updatedAt: now,
        };
        inMemoryReports.unshift(newReport);
        return { ...newReport };
    }
    async reviewReport(reportId, actor, reviewComments) {
        const report = await this.getReportById(reportId);
        if (!report)
            throw new Error('Daily report not found');
        if (report.status !== 'Submitted') {
            throw new Error(`Only submitted reports can be reviewed (current status: ${report.status})`);
        }
        report.status = 'Reviewed';
        report.reviewedAt = new Date().toISOString();
        report.reviewedBy = actor.id;
        report.reviewComments = reviewComments || 'Approved by reviewer.';
        report.updatedAt = report.reviewedAt;
        return { ...report };
    }
    async returnReportForCorrection(reportId, returnReason, actor) {
        const report = await this.getReportById(reportId);
        if (!report)
            throw new Error('Daily report not found');
        if (!returnReason || returnReason.trim().length === 0) {
            throw new Error('Mandatory return reason is required');
        }
        const now = new Date().toISOString();
        // 1. Mark current submitted report as 'Returned for Correction'
        report.status = 'Returned for Correction';
        report.returnReason = returnReason.trim();
        report.reviewedAt = now;
        report.reviewedBy = actor.id;
        report.updatedAt = now;
        // 2. Create new editable revision (Draft) for the employee to resubmit without erasing history
        const nextRevision = report.revision + 1;
        const newDraftId = `dr-${Date.now()}-rev${nextRevision}`;
        const nextDraft = {
            id: newDraftId,
            organizationId: report.organizationId,
            employeeId: report.employeeId,
            employeeName: report.employeeName,
            employeeCode: report.employeeCode,
            department: report.department,
            reportDate: report.reportDate,
            status: 'Draft',
            revision: nextRevision,
            overallSummary: report.overallSummary,
            nextDayPlan: report.nextDayPlan,
            otherWork: report.otherWork,
            returnReason: `Previous revision returned: ${returnReason}`,
            snapshots: (report.snapshots || []).map((s, idx) => ({
                ...s,
                id: `drs-rev${nextRevision}-${idx}`,
                dailyReportId: newDraftId,
                createdAt: now,
            })),
            createdAt: now,
            updatedAt: now,
        };
        inMemoryReports.unshift(nextDraft);
        return { returnedReport: { ...report }, nextDraftRevision: { ...nextDraft } };
    }
    async getManagementDailyReports(filters = {}) {
        const activeEmployees = await employeeRepository.getEmployees();
        const targetDate = filters.reportDate || new Date().toISOString().split('T')[0];
        const results = activeEmployees.map(emp => {
            // Find latest revision report for target date
            const reportsForEmp = inMemoryReports
                .filter(r => r.employeeId === (emp.employeeId || emp.id) && r.reportDate === targetDate)
                .sort((a, b) => b.revision - a.revision);
            const latestReport = reportsForEmp[0] || null;
            const isInactive = emp.status && emp.status.toLowerCase() !== 'active';
            let submissionStatus = 'Not Submitted';
            if (isInactive) {
                submissionStatus = 'Not Required';
            }
            else if (latestReport) {
                submissionStatus = latestReport.status;
            }
            const totalTimeMinutes = latestReport?.snapshots
                ? latestReport.snapshots.reduce((sum, s) => sum + (s.timeSpentMinutes || 0), 0)
                : 0;
            const blockersCount = latestReport?.snapshots
                ? latestReport.snapshots.filter(s => s.blockersOrIssues && s.blockersOrIssues.trim().length > 0).length
                : 0;
            return {
                employeeId: emp.employeeId || emp.id,
                employeeName: `${emp.firstName} ${emp.lastName}`.trim(),
                department: emp.department || 'General',
                designation: emp.designation || 'Staff',
                reportDate: targetDate,
                submissionStatus,
                reportId: latestReport?.id || null,
                revision: latestReport?.revision || 1,
                submittedAt: latestReport?.submittedAt || null,
                reportedTasksCount: latestReport?.snapshots?.filter(s => !s.isCarriedForward).length || 0,
                timeSpentMinutes: totalTimeMinutes,
                blockersCount,
                reviewStatus: latestReport?.status === 'Reviewed' ? 'Reviewed' : latestReport?.status === 'Returned for Correction' ? 'Returned' : 'Pending Review',
                returnReason: latestReport?.returnReason || null,
                reviewComments: latestReport?.reviewComments || null,
                snapshots: latestReport?.snapshots || [],
                overallSummary: latestReport?.overallSummary || '',
            };
        });
        if (filters.department) {
            return results.filter(r => r.department.toLowerCase() === filters.department?.toLowerCase());
        }
        if (filters.status) {
            return results.filter(r => r.submissionStatus.toLowerCase() === filters.status?.toLowerCase());
        }
        if (filters.search) {
            const term = filters.search.toLowerCase();
            return results.filter(r => r.employeeName.toLowerCase().includes(term) || r.employeeId.toLowerCase().includes(term));
        }
        return results;
    }
    mapDbRecordToDailyReport(d) {
        return {
            id: d.id,
            organizationId: d.organization_id || 'VRM-ORG-001',
            employeeId: d.employee_id,
            reportDate: d.report_date,
            status: d.status || 'Draft',
            revision: d.revision || 1,
            overallSummary: d.overall_summary,
            nextDayPlan: d.next_day_plan,
            otherWork: d.other_work,
            submittedAt: d.submitted_at,
            submittedBy: d.submitted_by,
            reviewedAt: d.reviewed_at,
            reviewedBy: d.reviewed_by,
            reviewComments: d.review_comments,
            returnReason: d.return_reason,
            createdAt: d.created_at,
            updatedAt: d.updated_at,
            snapshots: (d.daily_report_snapshots || []).map((s) => ({
                id: s.id,
                dailyReportId: s.daily_report_id,
                taskId: s.task_id,
                taskNumber: s.task_number,
                taskTitle: s.task_title,
                taskStatus: s.task_status,
                progressPercentage: s.progress_percentage,
                workDoneToday: s.work_done_today,
                timeSpentMinutes: s.time_spent_minutes,
                blockersOrIssues: s.blockers_or_issues,
                isCarriedForward: s.is_carried_forward,
                createdAt: s.created_at,
            })),
        };
    }
}
export const dailyReportRepository = new DailyReportRepository();
//# sourceMappingURL=dailyReportRepository.js.map