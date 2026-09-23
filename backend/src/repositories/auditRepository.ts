// VRM Enterprise HRMS — Auth & Login Lifecycle Audit Repository
import { AuthAuditAction, AuthAuditLog } from '../types/auth.js';
import { getSupabaseAdmin, isRealSupabaseConfigured } from '../config/supabase.js';

const SENSITIVE_KEYS = new Set([
  'password',
  'temppassword',
  'currentpassword',
  'newpassword',
  'confirmpassword',
  'temporary_password',
  'passwordhash',
  'hash',
  'token',
  'accesstoken',
  'secret',
]);

/**
 * Deeply sanitizes metadata to ensure no raw passwords, hashes, or tokens leak into audit logs.
 */
function sanitizeMetadata(data?: Record<string, any>): Record<string, any> | undefined {
  if (!data) return undefined;

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase().replace(/[-_]/g, ''))) {
      continue; // omit sensitive key completely
    }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      clean[key] = sanitizeMetadata(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

const inMemoryAuditLogs: AuthAuditLog[] = [];

export class AuditRepository {
  async recordLog(
    action: AuthAuditAction,
    employeeId: string,
    performedBy: string,
    metadata?: Record<string, any>
  ): Promise<AuthAuditLog> {
    const sanitized = sanitizeMetadata(metadata);
    const entry: AuthAuditLog = {
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      action,
      employee_id: employeeId,
      performed_by: performedBy || 'System',
      performed_at: new Date().toISOString(),
      metadata: sanitized,
    };

    inMemoryAuditLogs.push(entry);

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('auth_audit_logs').insert({
          action: entry.action,
          employee_id: entry.employee_id,
          performed_by: entry.performed_by,
          performed_at: entry.performed_at,
          metadata: entry.metadata,
        });
      } catch (err) {
        console.warn('Could not persist auth audit log to Supabase:', err);
      }
    }

    return entry;
  }

  async getLogs(filters?: {
    employeeId?: string;
    action?: AuthAuditAction;
    limit?: number;
  }): Promise<AuthAuditLog[]> {
    let list = [...inMemoryAuditLogs];

    if (filters?.employeeId) {
      const q = filters.employeeId.toLowerCase().trim();
      list = list.filter((l) => (l.employee_id || '').toLowerCase().trim() === q);
    }

    if (filters?.action) {
      list = list.filter((l) => l.action === filters.action);
    }

    // Sort descending by timestamp (most recent first)
    list.sort((a, b) => new Date(b.performed_at).getTime() - new Date(a.performed_at).getTime());

    if (filters?.limit && filters.limit > 0) {
      list = list.slice(0, filters.limit);
    }

    return list;
  }
}

export const auditRepository = new AuditRepository();
