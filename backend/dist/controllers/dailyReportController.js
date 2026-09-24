import { dailyReportRepository } from '../repositories/dailyReportRepository.js';
import { dailyReportSubmitSchema, reviewDailyReportSchema } from '../validators/taskValidators.js';
const isAdministrativeRole = (role) => {
    return role === 'Super Admin' || role === 'CEO' || role === 'HR Manager' || role === 'HR Admin' || role === 'ERP Administrator';
};
export class DailyReportController {
    async getMyDailyReports(req, res) {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required' } });
                return;
            }
            const empId = user.employeeId || user.id;
            const reports = await dailyReportRepository.getEmployeeReports(empId);
            res.json({ success: true, data: reports, count: reports.length });
        }
        catch (err) {
            res.status(500).json({ success: false, error: { message: err.message } });
        }
    }
    async getReportById(req, res) {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required' } });
                return;
            }
            const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            const report = await dailyReportRepository.getReportById(reportId);
            if (!report) {
                res.status(404).json({ success: false, error: { message: 'Daily report not found' } });
                return;
            }
            const isAdmin = isAdministrativeRole(user.role);
            const empId = user.employeeId || user.id;
            // Enforce security rule: An employee may only access their own daily report.
            // Even a task assigner does NOT gain access to the assignee's personal daily report!
            if (!isAdmin && report.employeeId !== empId) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: 'Access denied. You may only view your own personal daily task reports.',
                    }
                });
                return;
            }
            res.json({ success: true, data: report });
        }
        catch (err) {
            res.status(500).json({ success: false, error: { message: err.message } });
        }
    }
    async saveDraft(req, res) {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required' } });
                return;
            }
            const { reportDate, overallSummary, nextDayPlan, otherWork, workItems } = req.body;
            if (!reportDate) {
                res.status(400).json({ success: false, error: { message: 'reportDate is required (YYYY-MM-DD)' } });
                return;
            }
            const empId = user.employeeId || user.id;
            const draft = await dailyReportRepository.saveDraft(empId, reportDate, { overallSummary, nextDayPlan, otherWork, workItems }, {
                id: user.id,
                name: user.name || 'User',
                role: user.role,
                employeeId: user.employeeId,
                department: user.department,
            });
            res.json({ success: true, data: draft, message: 'Daily report draft saved successfully.' });
        }
        catch (err) {
            res.status(400).json({ success: false, error: { message: err.message } });
        }
    }
    async submitReport(req, res) {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required' } });
                return;
            }
            const parsed = dailyReportSubmitSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ success: false, error: { message: 'Validation failed', details: parsed.error.issues } });
                return;
            }
            const empId = user.employeeId || user.id;
            const submitted = await dailyReportRepository.submitReport(empId, parsed.data.reportDate, {
                overallSummary: parsed.data.overallSummary,
                nextDayPlan: parsed.data.nextDayPlan,
                otherWork: parsed.data.otherWork,
                workItems: parsed.data.workItems,
            }, {
                id: user.id,
                name: user.name || 'User',
                role: user.role,
                employeeId: user.employeeId,
                department: user.department,
            });
            res.status(201).json({ success: true, data: submitted, message: `Daily report for ${submitted.reportDate} submitted successfully.` });
        }
        catch (err) {
            res.status(400).json({ success: false, error: { message: err.message } });
        }
    }
    async reviewReport(req, res) {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required' } });
                return;
            }
            const isAdmin = isAdministrativeRole(user.role);
            if (!isAdmin) {
                res.status(403).json({ success: false, error: { message: 'Only HR or CEO can review daily reports.' } });
                return;
            }
            const parsed = reviewDailyReportSchema.safeParse(req.body);
            if (!parsed.success) {
                res.status(400).json({ success: false, error: { message: 'Validation failed', details: parsed.error.issues } });
                return;
            }
            const reportId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
            if (parsed.data.action === 'REVIEW') {
                const reviewed = await dailyReportRepository.reviewReport(reportId, { id: user.id, name: user.name || 'Admin', role: user.role }, parsed.data.reviewComments);
                res.json({ success: true, data: reviewed, message: 'Report marked as Reviewed' });
            }
            else {
                const result = await dailyReportRepository.returnReportForCorrection(reportId, parsed.data.returnReason, { id: user.id, name: user.name || 'Admin', role: user.role });
                res.json({
                    success: true,
                    data: result.returnedReport,
                    nextRevision: result.nextDraftRevision,
                    message: `Report returned for correction. Revision ${result.nextDraftRevision.revision} opened for employee.`
                });
            }
        }
        catch (err) {
            res.status(400).json({ success: false, error: { message: err.message } });
        }
    }
    async getManagementReports(req, res) {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({ success: false, error: { message: 'Authentication required' } });
                return;
            }
            const isAdmin = isAdministrativeRole(user.role);
            if (!isAdmin) {
                res.status(403).json({ success: false, error: { message: 'Only HR or CEO can view the management reporting dashboard.' } });
                return;
            }
            const { reportDate, department, status, search } = req.query;
            const reports = await dailyReportRepository.getManagementDailyReports({
                reportDate: reportDate,
                department: department,
                status: status,
                search: search,
            });
            res.json({ success: true, data: reports, count: reports.length });
        }
        catch (err) {
            res.status(500).json({ success: false, error: { message: err.message } });
        }
    }
}
export const dailyReportController = new DailyReportController();
//# sourceMappingURL=dailyReportController.js.map