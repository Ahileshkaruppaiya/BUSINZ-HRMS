import { Router } from 'express';
import {
  getLeaves,
  createLeave,
  reviewLeave,
  getLeaveBalances,
} from '../controllers/leaveController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';

export const leaveRouter = Router();

leaveRouter.use(authenticateToken);

leaveRouter.get('/', getLeaves);
leaveRouter.post('/', createLeave);
leaveRouter.patch(
  '/:id/decision',
  requireRoles(['Super Admin', 'CEO', 'HR Manager', 'HR Admin', 'Department Manager', 'Department Head']),
  reviewLeave
);
leaveRouter.get('/balances/:employeeId', getLeaveBalances);
