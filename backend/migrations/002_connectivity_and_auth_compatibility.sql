-- ============================================================
-- Migration 002: Production Database Connectivity & Schema Sync
-- Synchronizes attendance, employees, and supporting tables
-- ============================================================

-- 1. Attendance Records enhancements
ALTER TABLE public.attendance_records
  ADD COLUMN IF NOT EXISTS shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS shift_date DATE,
  ADD COLUMN IF NOT EXISTS late_duration_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS early_checkout_minutes INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS calculated_ot_hours DOUBLE PRECISION DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS approved_ot_hours DOUBLE PRECISION DEFAULT 0.00,
  ADD COLUMN IF NOT EXISTS ot_status TEXT DEFAULT 'None',
  ADD COLUMN IF NOT EXISTS ot_reason TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Employees auth and lifecycle columns
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS credential_email_status TEXT NOT NULL DEFAULT 'PENDING',
  ADD COLUMN IF NOT EXISTS credential_email_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS work_shift TEXT;

-- 3. Password Resets
CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Salary Structures
CREATE TABLE IF NOT EXISTS public.salary_structures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  monthly_salary DOUBLE PRECISION NOT NULL DEFAULT 15000.00,
  basic_percentage DOUBLE PRECISION NOT NULL DEFAULT 40.00,
  da_percentage DOUBLE PRECISION NOT NULL DEFAULT 20.00,
  conveyance_percentage DOUBLE PRECISION NOT NULL DEFAULT 5.00,
  hra_percentage DOUBLE PRECISION NOT NULL DEFAULT 35.00,
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Payroll Settings
CREATE TABLE IF NOT EXISTS public.payroll_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_key TEXT NOT NULL UNIQUE DEFAULT 'global',
  pf_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  pf_rate DOUBLE PRECISION NOT NULL DEFAULT 12.00,
  pf_wage_ceiling DOUBLE PRECISION NOT NULL DEFAULT 15000.00,
  pf_wage_components JSONB NOT NULL DEFAULT '{"basic": true, "da": true, "conveyance": false, "hra": false}'::jsonb,
  esic_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  esic_rate DOUBLE PRECISION NOT NULL DEFAULT 0.75,
  esic_salary_threshold DOUBLE PRECISION NOT NULL DEFAULT 21000.00,
  esic_wage_components JSONB NOT NULL DEFAULT '{"basic": true, "da": true, "conveyance": true, "hra": true}'::jsonb,
  professional_tax_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  professional_tax_amount DOUBLE PRECISION NOT NULL DEFAULT 200.00,
  lop_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  attendance_bonus_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  overtime_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  standard_working_days INTEGER NOT NULL DEFAULT 26,
  payroll_cycle_day INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_shift_date ON public.attendance_records(shift_id, shift_date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_emp ON public.attendance_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
CREATE INDEX IF NOT EXISTS idx_employees_empid ON public.employees(employee_id);
