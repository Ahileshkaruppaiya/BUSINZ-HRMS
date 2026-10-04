-- Migration 006: Data Validation Constraints and Integrity
-- Adds CHECK constraints to employees, salary_structures, and payroll_records
-- Designed to enforce strict validation for all new data without corrupting existing records.

DO $$
BEGIN
    -- 1. Phone number validation constraint (Indian mobile format: 10 digits starting with 6-9)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_employees_phone') THEN
        ALTER TABLE public.employees 
        ADD CONSTRAINT chk_employees_phone 
        CHECK (phone IS NULL OR (length(phone) = 10 AND phone ~ '^[6-9][0-9]{9}$')) 
        NOT VALID;
    END IF;

    -- 2. First name length and character constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_employees_first_name_length') THEN
        ALTER TABLE public.employees 
        ADD CONSTRAINT chk_employees_first_name_length 
        CHECK (length(trim(first_name)) >= 2 AND length(first_name) <= 100) 
        NOT VALID;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_employees_first_name_chars') THEN
        ALTER TABLE public.employees 
        ADD CONSTRAINT chk_employees_first_name_chars 
        CHECK (first_name ~ '^[A-Za-z][A-Za-z\s.''-]*$') 
        NOT VALID;
    END IF;

    -- 3. Last name length constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_employees_last_name_length') THEN
        ALTER TABLE public.employees 
        ADD CONSTRAINT chk_employees_last_name_length 
        CHECK (last_name IS NULL OR length(last_name) <= 100) 
        NOT VALID;
    END IF;

    -- 4. Non-negative basic salary constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_employees_basic_salary_non_negative') THEN
        ALTER TABLE public.employees 
        ADD CONSTRAINT chk_employees_basic_salary_non_negative 
        CHECK (basic_salary >= 0) 
        NOT VALID;
    END IF;

    -- 5. PAN card format constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_employees_pan_format') THEN
        ALTER TABLE public.employees 
        ADD CONSTRAINT chk_employees_pan_format 
        CHECK (pan_number IS NULL OR pan_number = '' OR pan_number ~ '^[A-Z]{5}[0-9]{4}[A-Z]$') 
        NOT VALID;
    END IF;

    -- 6. IFSC code format constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_employees_ifsc_format') THEN
        ALTER TABLE public.employees 
        ADD CONSTRAINT chk_employees_ifsc_format 
        CHECK (ifsc_code IS NULL OR ifsc_code = '' OR ifsc_code ~ '^[A-Z]{4}0[A-Z0-9]{6}$') 
        NOT VALID;
    END IF;

    -- 7. Pincode format constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_employees_pincode_format') THEN
        ALTER TABLE public.employees 
        ADD CONSTRAINT chk_employees_pincode_format 
        CHECK (pincode IS NULL OR pincode = '' OR pincode ~ '^[1-9][0-9]{5}$') 
        NOT VALID;
    END IF;

    -- 8. Bank account number format constraint
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_employees_account_number') THEN
        ALTER TABLE public.employees 
        ADD CONSTRAINT chk_employees_account_number 
        CHECK (account_number IS NULL OR account_number = '' OR account_number ~ '^[0-9]{9,18}$') 
        NOT VALID;
    END IF;

    -- 9. Salary structures non-negative monthly salary
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_salary_structures_monthly_salary') THEN
        ALTER TABLE public.salary_structures 
        ADD CONSTRAINT chk_salary_structures_monthly_salary 
        CHECK (monthly_salary >= 0) 
        NOT VALID;
    END IF;

    -- 10. Payroll records non-negative net salary
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_payroll_records_net_salary') THEN
        ALTER TABLE public.payroll_records 
        ADD CONSTRAINT chk_payroll_records_net_salary 
        CHECK (net_salary >= 0) 
        NOT VALID;
    END IF;
END $$;
