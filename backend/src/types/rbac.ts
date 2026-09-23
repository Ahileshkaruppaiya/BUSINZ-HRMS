export type PermissionAction = 
  | 'view' 
  | 'create' 
  | 'edit' 
  | 'delete' 
  | 'approve' 
  | 'reject' 
  | 'assign' 
  | 'export';

export type DataAccessLevel = 
  | 'own' 
  | 'team' 
  | 'department' 
  | 'all';

export type RoleStatus = 'Active' | 'Inactive';

export interface RoleDefinition {
  id: string;
  name: string;
  description: string;
  department: string;
  status: RoleStatus;
  isDefault: boolean;
  userCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ModuleDefinition {
  id: string;
  key: string;
  name: string;
  category: string;
  isCustom: boolean;
  description?: string;
}

export interface SpecialPermissionItem {
  key: string;
  label: string;
  category: 'Payroll' | 'Documents' | 'Attendance' | 'Leave' | 'Tasks' | 'Advance Salary' | 'Tracking' | 'Reports' | 'Administration';
  description?: string;
}

export interface RolePermissionConfig {
  roleId: string;
  roleName: string;
  dataAccess: DataAccessLevel;
  modulePermissions: Record<string, PermissionAction[]>;
  specialPermissions: string[];
  updatedAt: string;
  updatedBy: string;
}

export interface PermissionAuditLog {
  id: string;
  changedBy: string;
  role: string;
  permissionChanged: string;
  oldPermission: string;
  newPermission: string;
  date: string;
  time: string;
  timestamp: number;
}

export interface RBACDataResponse {
  roles: RoleDefinition[];
  modules: ModuleDefinition[];
  permissionsByRole: Record<string, RolePermissionConfig>;
  specialPermissionsList: SpecialPermissionItem[];
  auditLogs: PermissionAuditLog[];
}
