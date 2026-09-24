import { Router } from 'express';
import { getTasks, getTaskById, createTask, updateTaskStatus, getDailyReports, createDailyReport, getDashboardStats, } from '../controllers/taskController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
export const taskRouter = Router();
taskRouter.use(authenticateToken);
taskRouter.get('/', getTasks);
taskRouter.post('/', createTask); // Any authenticated user can create & assign tasks
taskRouter.get('/dashboard/stats', getDashboardStats);
taskRouter.get('/daily-reports', getDailyReports);
taskRouter.get('/:id', getTaskById);
taskRouter.patch('/:id/status', updateTaskStatus);
taskRouter.post('/:id/daily-reports', createDailyReport);
//# sourceMappingURL=taskRoutes.js.map