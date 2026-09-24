import { Router } from 'express';
import { dailyReportController } from '../controllers/dailyReportController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
export const dailyReportRouter = Router();
dailyReportRouter.use(authenticateToken);
dailyReportRouter.get('/my', (req, res) => dailyReportController.getMyDailyReports(req, res));
dailyReportRouter.get('/management', (req, res) => dailyReportController.getManagementReports(req, res));
dailyReportRouter.get('/:id', (req, res) => dailyReportController.getReportById(req, res));
dailyReportRouter.post('/draft', (req, res) => dailyReportController.saveDraft(req, res));
dailyReportRouter.post('/submit', (req, res) => dailyReportController.submitReport(req, res));
dailyReportRouter.post('/:id/review', (req, res) => dailyReportController.reviewReport(req, res));
//# sourceMappingURL=dailyReportRoutes.js.map