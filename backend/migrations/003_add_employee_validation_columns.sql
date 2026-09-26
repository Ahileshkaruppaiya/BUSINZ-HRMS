-- Migration: 003_add_employee_validation_columns.sql
-- Description: Safe additive migration to support structured Address, Education, Experience, Banking and Statutory fields.
-- Deployed safety: Additive only. Preserves all existing records and schema intact.

ALTER TABLE public.employees 
  ADD COLUMN IF NOT EXISTS address_line1 TEXT,
  ADD COLUMN IF NOT EXISTS address_line2 TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS country TEXT,
  ADD COLUMN IF NOT EXISTS pincode TEXT,
  ADD COLUMN IF NOT EXISTS highest_qualification TEXT,
  ADD COLUMN IF NOT EXISTS degree_name TEXT,
  ADD COLUMN IF NOT EXISTS specialization TEXT,
  ADD COLUMN IF NOT EXISTS university TEXT,
  ADD COLUMN IF NOT EXISTS year_of_passing INTEGER,
  ADD COLUMN IF NOT EXISTS grade_percentage NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS experience_profile TEXT,
  ADD COLUMN IF NOT EXISTS total_experience NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS previous_company TEXT,
  ADD COLUMN IF NOT EXISTS previous_designation TEXT,
  ADD COLUMN IF NOT EXISTS previous_department TEXT,
  ADD COLUMN IF NOT EXISTS employment_start_date DATE,
  ADD COLUMN IF NOT EXISTS employment_end_date DATE,
  ADD COLUMN IF NOT EXISTS last_drawn_salary NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS previous_company_location TEXT,
  ADD COLUMN IF NOT EXISTS pan_number TEXT,
  ADD COLUMN IF NOT EXISTS uan_number TEXT;
