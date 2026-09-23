import { Request, Response, NextFunction } from 'express';
import { rbacRepository } from '../repositories/rbacRepository.js';

export const getRBACData = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const data = rbacRepository.getAllRBACData();
    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
};

export const createRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, description, department, status, cloneFromRoleId } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Role Name is required.',
        },
      });
      return;
    }

    const changedBy = req.user?.name || req.user?.role || 'Admin';
    const role = rbacRepository.createRole({
      name,
      description: description || '',
      department: department || 'General',
      status: status === 'Inactive' ? 'Inactive' : 'Active',
      cloneFromRoleId,
    }, changedBy);

    res.status(201).json({
      success: true,
      message: `Role "${role.name}" created successfully.`,
      data: role,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'ROLE_CREATION_FAILED',
        message: err.message || 'Failed to create role.',
      },
    });
  }
};

export const updateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { name, description, department, status } = req.body;
    const changedBy = req.user?.name || req.user?.role || 'Admin';

    const updated = rbacRepository.updateRole(id, {
      name,
      description,
      department,
      status,
    }, changedBy);

    res.status(200).json({
      success: true,
      message: `Role "${updated.name}" updated successfully.`,
      data: updated,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'ROLE_UPDATE_FAILED',
        message: err.message || 'Failed to update role.',
      },
    });
  }
};

export const duplicateRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { newName } = req.body;
    if (!newName || typeof newName !== 'string' || !newName.trim()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'New Role Name is required for duplicate.',
        },
      });
      return;
    }

    const changedBy = req.user?.name || req.user?.role || 'Admin';
    const duplicated = rbacRepository.duplicateRole(id, newName, changedBy);

    res.status(201).json({
      success: true,
      message: `Role duplicated successfully as "${duplicated.name}".`,
      data: duplicated,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'ROLE_DUPLICATION_FAILED',
        message: err.message || 'Failed to duplicate role.',
      },
    });
  }
};

export const deleteRole = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const changedBy = req.user?.name || req.user?.role || 'Admin';

    rbacRepository.deleteRole(id, changedBy);

    res.status(200).json({
      success: true,
      message: 'Role deleted successfully.',
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'ROLE_DELETION_FAILED',
        message: err.message || 'Failed to delete role.',
      },
    });
  }
};

export const saveRolePermissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const id = String(req.params.id);
    const { dataAccess, modulePermissions, specialPermissions } = req.body;

    if (!dataAccess || !modulePermissions) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Data Access Level and Module Permissions are required.',
        },
      });
      return;
    }

    const changedBy = req.user?.name || req.user?.role || 'Admin';
    const savedConfig = rbacRepository.saveRolePermissions(id, {
      dataAccess,
      modulePermissions,
      specialPermissions: Array.isArray(specialPermissions) ? specialPermissions : [],
    }, changedBy);

    res.status(200).json({
      success: true,
      message: `Permissions for role "${savedConfig.roleName}" saved successfully.`,
      data: savedConfig,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'PERMISSIONS_SAVE_FAILED',
        message: err.message || 'Failed to save permissions.',
      },
    });
  }
};

export const addDynamicModule = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { key, name, category, description } = req.body;
    if (!name || typeof name !== 'string' || !name.trim()) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Module Name is required.',
        },
      });
      return;
    }

    const modKey = key && key.trim() ? key : name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    const changedBy = req.user?.name || req.user?.role || 'Admin';

    const newModule = rbacRepository.addDynamicModule({
      key: modKey,
      name,
      category,
      description,
    }, changedBy);

    res.status(201).json({
      success: true,
      message: `Module "${newModule.name}" registered successfully.`,
      data: newModule,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'MODULE_REGISTRATION_FAILED',
        message: err.message || 'Failed to register module.',
      },
    });
  }
};

export const getAuditLogs = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const logs = rbacRepository.getAuditLogs();
    res.status(200).json({
      success: true,
      data: logs,
    });
  } catch (err) {
    next(err);
  }
};
