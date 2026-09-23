import { Router } from 'express';
import {
  getCompanySettings,
  updateCompanySettings,
  getGeofenceSettings,
  updateGeofenceSettings,
} from '../controllers/settingsController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';

export const settingsRouter = Router();

settingsRouter.use(authenticateToken);

// Company Profile Settings
settingsRouter.get('/company', getCompanySettings);
settingsRouter.put('/company', requireRoles(['Super Admin', 'CEO', 'HR Manager']), updateCompanySettings);

// Geofence Attendance Settings
settingsRouter.get('/geofence', getGeofenceSettings);
settingsRouter.put('/geofence', requireRoles(['Super Admin', 'CEO', 'HR Manager']), updateGeofenceSettings);
