import { Router } from 'express';
import { overtimeController } from '../controllers/overtimeController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';

export const overtimeRouter = Router();

overtimeRouter.use('/overtime', authenticateToken);

overtimeRouter.get('/overtime', (req, res, next) => overtimeController.getAllOvertime(req, res, next));

overtimeRouter.post('/overtime', (req, res, next) => overtimeController.createOvertime(req, res, next));

overtimeRouter.put(
  '/overtime/:id/approve',
  requireRoles(['Super Admin', 'CEO', 'HR Manager', 'Department Manager', 'Finance Manager']),
  (req, res, next) => overtimeController.approveOvertime(req, res, next)
);
