import { Router } from 'express';
import {
  getShifts,
  createShift,
  assignEmployeesToShift,
} from '../controllers/shiftController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';

export const shiftRouter = Router();

shiftRouter.use(authenticateToken);

shiftRouter.get('/', getShifts);
shiftRouter.post('/', requireRoles(['Super Admin', 'CEO', 'HR Manager', 'HR Admin']), createShift);
shiftRouter.put('/:id/assignments', requireRoles(['Super Admin', 'CEO', 'HR Manager', 'HR Admin']), assignEmployeesToShift);
