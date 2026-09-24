import { Router } from 'express';
import { getRBACData, createRole, updateRole, duplicateRole, deleteRole, saveRolePermissions, addDynamicModule, getAuditLogs, } from '../controllers/rbacController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';
import { requireRoles } from '../middleware/rbacMiddleware.js';
export const rbacRouter = Router();
// Apply auth to all RBAC routes
rbacRouter.use(authenticateToken);
// Read RBAC schema and settings (Accessible to Admin, CEO, HR, Manager for role checks)
rbacRouter.get('/', getRBACData);
rbacRouter.get('/audit-logs', getAuditLogs);
// Role & Permissions modifications restricted to Super Admin, CEO, Admin, HR Manager
rbacRouter.post('/roles', requireRoles(['Super Admin', 'CEO', 'HR Manager', 'Admin']), createRole);
rbacRouter.put('/roles/:id', requireRoles(['Super Admin', 'CEO', 'HR Manager', 'Admin']), updateRole);
rbacRouter.post('/roles/:id/duplicate', requireRoles(['Super Admin', 'CEO', 'HR Manager', 'Admin']), duplicateRole);
rbacRouter.delete('/roles/:id', requireRoles(['Super Admin', 'CEO', 'Admin']), deleteRole);
rbacRouter.put('/roles/:id/permissions', requireRoles(['Super Admin', 'CEO', 'HR Manager', 'Admin']), saveRolePermissions);
rbacRouter.post('/modules', requireRoles(['Super Admin', 'CEO', 'Admin']), addDynamicModule);
//# sourceMappingURL=rbacRoutes.js.map