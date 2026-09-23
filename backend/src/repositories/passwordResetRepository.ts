import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { getSupabaseAdmin, isRealSupabaseConfigured } from '../config/supabase.js';

export interface PasswordResetRecord {
  id: string;
  employeeId: string;
  otpHash: string;
  expiresAt: Date;
  attemptCount: number;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// In-memory store for development, test, and graceful fallback
const inMemoryResets: PasswordResetRecord[] = [];

export class PasswordResetRepository {
  /**
   * Count requests created for an employee within the specified window in minutes.
   * Enforces: Maximum 3 OTP requests within 15 minutes.
   */
  async countRecentRequests(employeeId: string, windowMinutes: number = 15): Promise<number> {
    const cutoff = new Date(Date.now() - windowMinutes * 60 * 1000);
    const cleanId = employeeId.trim().toLowerCase();

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { count, error } = await supabase
          .from('password_resets')
          .select('id', { count: 'exact', head: true })
          .ilike('employee_id', cleanId)
          .gte('created_at', cutoff.toISOString());

        if (!error && count !== null) {
          return count;
        }
      } catch {
        // Fallback to memory
      }
    }

    return inMemoryResets.filter(
      (r) => r.employeeId.toLowerCase() === cleanId && r.createdAt >= cutoff
    ).length;
  }

  /**
   * Stores a newly generated hashed OTP record.
   */
  async createResetRecord(params: {
    employeeId: string;
    otpHash: string;
    expiresAt: Date;
  }): Promise<PasswordResetRecord> {
    const record: PasswordResetRecord = {
      id: `rst-${Date.now().toString(16)}-${Math.random().toString(36).substring(2, 7)}`,
      employeeId: params.employeeId.trim(),
      otpHash: params.otpHash,
      expiresAt: params.expiresAt,
      attemptCount: 0,
      isUsed: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    inMemoryResets.push(record);

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase.from('password_resets').insert({
          id: record.id,
          employee_id: record.employeeId,
          otp_hash: record.otpHash,
          expires_at: record.expiresAt.toISOString(),
          attempt_count: 0,
          is_used: false,
          created_at: record.createdAt.toISOString(),
          updated_at: record.updatedAt.toISOString(),
        });
      } catch (err) {
        console.warn('Could not persist password reset to Supabase:', err);
      }
    }

    return record;
  }

  /**
   * Retrieves the latest active (unused) reset request for an employee.
   */
  async getLatestActiveReset(employeeId: string): Promise<PasswordResetRecord | null> {
    const cleanId = employeeId.trim().toLowerCase();

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
          .from('password_resets')
          .select('*')
          .ilike('employee_id', cleanId)
          .eq('is_used', false)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (!error && data) {
          return {
            id: data.id,
            employeeId: data.employee_id,
            otpHash: data.otp_hash,
            expiresAt: new Date(data.expires_at),
            attemptCount: data.attempt_count || 0,
            isUsed: data.is_used || false,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at),
          };
        }
      } catch {
        // Fallback to memory
      }
    }

    const matches = inMemoryResets
      .filter((r) => r.employeeId.toLowerCase() === cleanId && !r.isUsed)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    return matches[0] || null;
  }

  /**
   * Increments verification attempt count for security defense (max 5 attempts).
   */
  async incrementAttempt(id: string): Promise<number> {
    const mem = inMemoryResets.find((r) => r.id === id);
    let newCount = 1;
    if (mem) {
      mem.attemptCount += 1;
      mem.updatedAt = new Date();
      newCount = mem.attemptCount;
    }

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
          .from('password_resets')
          .select('attempt_count')
          .eq('id', id)
          .single();

        if (data) {
          newCount = (data.attempt_count || 0) + 1;
          await supabase
            .from('password_resets')
            .update({ attempt_count: newCount, updated_at: new Date().toISOString() })
            .eq('id', id);
        }
      } catch (err) {
        console.warn('Could not increment attempt in Supabase:', err);
      }
    }

    return newCount;
  }

  /**
   * Marks OTP as used so it cannot be re-verified (single-use constraint).
   */
  async markAsUsed(id: string): Promise<void> {
    const mem = inMemoryResets.find((r) => r.id === id);
    if (mem) {
      mem.isUsed = true;
      mem.updatedAt = new Date();
    }

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        await supabase
          .from('password_resets')
          .update({ is_used: true, updated_at: new Date().toISOString() })
          .eq('id', id);
      } catch (err) {
        console.warn('Could not mark reset as used in Supabase:', err);
      }
    }
  }

  /**
   * Issues a signed, temporary reset token (JWT) valid for 15 minutes
   * once OTP has been verified.
   */
  generateResetToken(employeeId: string, email: string): string {
    return jwt.sign(
      {
        sub: employeeId,
        email,
        purpose: 'password_reset',
      },
      env.JWT_SECRET,
      { expiresIn: '15m' }
    );
  }

  /**
   * Verifies and decodes the reset token.
   */
  verifyResetToken(token: string): { employeeId: string; email: string } | null {
    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as {
        sub: string;
        email: string;
        purpose?: string;
      };

      if (decoded.purpose !== 'password_reset' || !decoded.sub) {
        return null;
      }

      return {
        employeeId: decoded.sub,
        email: decoded.email,
      };
    } catch {
      return null;
    }
  }
}

export const passwordResetRepository = new PasswordResetRepository();
