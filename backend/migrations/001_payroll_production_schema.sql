-- ==============================================================================
-- VRM Enterprise HRMS — Production Payroll & Statutory Architecture Migration
-- Targets: PostgreSQL 15+ / Supabase
-- Target Tables:
--   1. payroll_settings (Singleton dynamic statutory & salary config)
--   2. salary_structures (Per-employee monthly salary & percentage allocation)
--   3. payroll_runs (Monthly processing batch headers)
--   4. payroll_records (Authoritative processed employee pay records)
--   5. payroll_earnings (Detailed breakdown of earnings per record)
--   6. payroll_deductions (Detailed breakdown of deductions per record)
--   7. payroll_attendance (Snapshot of attendance & working days per record)
--   8. overtime_records (Overtime hours, rate, and approval tracking)
--   9. advance_salary_records (Employee loans & advance recovery ledger)
--  10. payslips (Certified payslip document snapshots)
--  11. payroll_audit_logs (Immutable audit trail for all payroll mutations)
-- ==============================================================================

BEGIN;

-- 1. Helper function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. PAYROLL SETTINGS TABLE (Singleton Org-Level Statutory Policy)
CREATE TABLE IF NOT EXISTS public.payroll_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    org_key TEXT NOT NULL UNIQUE DEFAULT 'global',
    
    -- PF Configuration
    pf_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    pf_rate NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    pf_wage_ceiling NUMERIC(12, 2) NOT NULL DEFAULT 15000.00,
    pf_wage_components JSONB NOT NULL DEFAULT '{"basic": true, "da": true, "conveyance": true, "hra": false, "attendance_bonus": false, "overtime": false, "other_earnings": false}'::jsonb,
    
    -- ESIC Configuration
    esic_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    esic_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.75,
    esic_salary_threshold NUMERIC(12, 2) NOT NULL DEFAULT 21000.00,
    esic_wage_components JSONB NOT NULL DEFAULT '{"basic": true, "da": true, "conveyance": true, "hra": true, "attendance_bonus": true, "overtime": true, "other_earnings": true}'::jsonb,
    
    -- Statutory & Operational Policies
    professional_tax_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    professional_tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 200.00,
    lop_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    attendance_bonus_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    overtime_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    
    standard_working_days INT NOT NULL DEFAULT 26,
    payroll_cycle_day INT NOT NULL DEFAULT 1,
    
    company_metadata JSONB NOT NULL DEFAULT '{"companyName": "VRM Industrial Structures Private Limited", "legalName": "VRM Structures India Pvt Ltd", "address": "Plot 42, Heavy Industrial Estate, Guindy, Chennai", "pan": "AAACV1234F", "gst": "33AAACV1234F1Z5"}'::jsonb,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed default global settings row if missing
INSERT INTO public.payroll_settings (org_key, pf_enabled, pf_rate, esic_enabled, esic_rate, professional_tax_enabled, professional_tax_amount)
VALUES ('global', TRUE, 12.00, TRUE, 0.75, TRUE, 200.00)
ON CONFLICT (org_key) DO NOTHING;

-- 3. SALARY STRUCTURES TABLE (Per Employee Configuration)
CREATE TABLE IF NOT EXISTS public.salary_structures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    
    monthly_salary NUMERIC(12, 2) NOT NULL CHECK (monthly_salary >= 0),
    
    -- Component Percentages (Must sum to 100)
    basic_percentage NUMERIC(5, 2) NOT NULL DEFAULT 40.00 CHECK (basic_percentage >= 0 AND basic_percentage <= 100),
    da_percentage NUMERIC(5, 2) NOT NULL DEFAULT 20.00 CHECK (da_percentage >= 0 AND da_percentage <= 100),
    conveyance_percentage NUMERIC(5, 2) NOT NULL DEFAULT 5.00 CHECK (conveyance_percentage >= 0 AND conveyance_percentage <= 100),
    hra_percentage NUMERIC(5, 2) NOT NULL DEFAULT 35.00 CHECK (hra_percentage >= 0 AND hra_percentage <= 100),
    
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    effective_to DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT check_percentages_sum CHECK (
        (basic_percentage + da_percentage + conveyance_percentage + hra_percentage) = 100.00
    )
);

CREATE INDEX IF NOT EXISTS idx_salary_structures_employee ON public.salary_structures(employee_id);
CREATE INDEX IF NOT EXISTS idx_salary_structures_active ON public.salary_structures(employee_id, is_active);

-- 4. OVERTIME RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.overtime_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    hours NUMERIC(5, 2) NOT NULL CHECK (hours >= 0),
    hourly_rate NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (hourly_rate >= 0),
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (amount >= 0),
    
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'PAID')),
    reason TEXT,
    approved_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_overtime_records_employee ON public.overtime_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_overtime_records_status ON public.overtime_records(status);

-- 5. ADVANCE SALARY RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.advance_salary_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
    remaining_amount NUMERIC(12, 2) NOT NULL CHECK (remaining_amount >= 0),
    recovery_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (recovery_amount >= 0),
    monthly_emi NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (monthly_emi >= 0),
    tenure_months INT NOT NULL DEFAULT 1,
    
    status TEXT NOT NULL DEFAULT 'APPROVED' CHECK (status IN ('PENDING', 'APPROVED', 'ACTIVE', 'COMPLETED', 'REJECTED')),
    reason TEXT,
    approved_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    approved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_advance_salary_employee ON public.advance_salary_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_advance_salary_status ON public.advance_salary_records(status);

-- 6. PAYROLL RUNS TABLE (Processing Batches)
CREATE TABLE IF NOT EXISTS public.payroll_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_month INT NOT NULL CHECK (payroll_month >= 1 AND payroll_month <= 12),
    payroll_year INT NOT NULL CHECK (payroll_year >= 2020),
    
    status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PROCESSING', 'PROCESSED', 'APPROVED', 'PAID', 'CANCELLED')),
    
    total_employees INT NOT NULL DEFAULT 0,
    total_gross NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_deductions NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    total_net NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
    
    processed_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    approved_by UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    processed_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    paid_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_payroll_run_month_year UNIQUE (payroll_month, payroll_year)
);

-- 7. ENHANCED PAYROLL RECORDS TABLE
CREATE TABLE IF NOT EXISTS public.payroll_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_run_id UUID REFERENCES public.payroll_runs(id) ON DELETE CASCADE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    salary_structure_id UUID REFERENCES public.salary_structures(id) ON DELETE SET NULL,
    
    payroll_month INT NOT NULL CHECK (payroll_month >= 1 AND payroll_month <= 12),
    payroll_year INT NOT NULL CHECK (payroll_year >= 2020),
    
    -- Earnings Breakdown
    basic_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    da NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    conveyance NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    hra NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    attendance_bonus NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    overtime_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    bonus NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    incentive NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    commission NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    other_earnings NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    gross_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    -- Statutory & Other Deductions Breakdown
    pf_base NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    pf_rate NUMERIC(5, 2) NOT NULL DEFAULT 12.00,
    pf_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    esic_base NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    esic_rate NUMERIC(5, 2) NOT NULL DEFAULT 0.75,
    esic_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    professional_tax NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    lop_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    lop_amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    advance_recovery NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    loan_recovery NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    other_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    total_deductions NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    net_salary NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    
    status TEXT NOT NULL DEFAULT 'PROCESSED' CHECK (status IN ('DRAFT', 'PROCESSED', 'APPROVED', 'PAID')),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT uq_employee_payroll_month_year UNIQUE (employee_id, payroll_month, payroll_year)
);

CREATE INDEX IF NOT EXISTS idx_payroll_records_employee ON public.payroll_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_run ON public.payroll_records(payroll_run_id);
CREATE INDEX IF NOT EXISTS idx_payroll_records_month_year ON public.payroll_records(payroll_month, payroll_year);

-- 8. PAYROLL EARNINGS DETAIL TABLE
CREATE TABLE IF NOT EXISTS public.payroll_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_record_id UUID NOT NULL REFERENCES public.payroll_records(id) ON DELETE CASCADE,
    component_name TEXT NOT NULL,
    component_type TEXT NOT NULL, -- 'FIXED', 'INCENTIVE', 'BONUS', 'OVERTIME', 'OTHER'
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PAYROLL DEDUCTIONS DETAIL TABLE
CREATE TABLE IF NOT EXISTS public.payroll_deductions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_record_id UUID NOT NULL REFERENCES public.payroll_records(id) ON DELETE CASCADE,
    deduction_type TEXT NOT NULL, -- 'PF', 'ESIC', 'PT', 'LOP', 'ADVANCE_RECOVERY', 'OTHER'
    amount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. PAYROLL ATTENDANCE SNAPSHOT TABLE
CREATE TABLE IF NOT EXISTS public.payroll_attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_record_id UUID NOT NULL REFERENCES public.payroll_records(id) ON DELETE CASCADE UNIQUE,
    
    working_days INT NOT NULL DEFAULT 26,
    present_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    paid_leave_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    unpaid_leave_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    absent_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    half_days INT NOT NULL DEFAULT 0,
    lop_days NUMERIC(5, 2) NOT NULL DEFAULT 0.00,
    overtime_hours NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. PAYSLIPS TABLE
CREATE TABLE IF NOT EXISTS public.payslips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payroll_record_id UUID NOT NULL REFERENCES public.payroll_records(id) ON DELETE CASCADE UNIQUE,
    employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
    payslip_number TEXT NOT NULL UNIQUE,
    document_url TEXT,
    payload_snapshot JSONB NOT NULL,
    generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. PAYROLL AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.payroll_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. TRIGGERS FOR UPDATED_AT
DROP TRIGGER IF EXISTS trg_payroll_settings_updated_at ON public.payroll_settings;
CREATE TRIGGER trg_payroll_settings_updated_at BEFORE UPDATE ON public.payroll_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_salary_structures_updated_at ON public.salary_structures;
CREATE TRIGGER trg_salary_structures_updated_at BEFORE UPDATE ON public.salary_structures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_payroll_runs_updated_at ON public.payroll_runs;
CREATE TRIGGER trg_payroll_runs_updated_at BEFORE UPDATE ON public.payroll_runs FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_payroll_records_updated_at ON public.payroll_records;
CREATE TRIGGER trg_payroll_records_updated_at BEFORE UPDATE ON public.payroll_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_overtime_records_updated_at ON public.overtime_records;
CREATE TRIGGER trg_overtime_records_updated_at BEFORE UPDATE ON public.overtime_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_advance_salary_records_updated_at ON public.advance_salary_records;
CREATE TRIGGER trg_advance_salary_records_updated_at BEFORE UPDATE ON public.advance_salary_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 14. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.payroll_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.salary_structures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_deductions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payroll_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payslips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.overtime_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advance_salary_records ENABLE ROW LEVEL SECURITY;

-- Helper permissions
CREATE POLICY payroll_settings_read ON public.payroll_settings FOR SELECT TO authenticated USING (TRUE);
CREATE POLICY payroll_settings_write ON public.payroll_settings FOR ALL TO authenticated USING (
    public.get_current_role_key() IN ('super_admin', 'hr_admin', 'finance_manager')
);

CREATE POLICY salary_structures_select ON public.salary_structures FOR SELECT TO authenticated USING (
    public.get_current_role_key() IN ('super_admin', 'hr_admin', 'finance_manager')
    OR employee_id = public.get_current_employee_id()
);
CREATE POLICY salary_structures_write ON public.salary_structures FOR ALL TO authenticated USING (
    public.get_current_role_key() IN ('super_admin', 'hr_admin', 'finance_manager')
);

CREATE POLICY payroll_records_select ON public.payroll_records FOR SELECT TO authenticated USING (
    public.get_current_role_key() IN ('super_admin', 'hr_admin', 'finance_manager')
    OR employee_id = public.get_current_employee_id()
);
CREATE POLICY payroll_records_write ON public.payroll_records FOR ALL TO authenticated USING (
    public.get_current_role_key() IN ('super_admin', 'hr_admin', 'finance_manager')
);

CREATE POLICY payslips_select ON public.payslips FOR SELECT TO authenticated USING (
    public.get_current_role_key() IN ('super_admin', 'hr_admin', 'finance_manager')
    OR employee_id = public.get_current_employee_id()
);

COMMIT;
