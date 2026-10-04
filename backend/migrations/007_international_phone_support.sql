-- Migration 007: International Phone Support
-- Updates chk_employees_phone to accept both 10-digit Indian numbers and valid international numbers with country codes

DO $$
BEGIN
    ALTER TABLE public.employees DROP CONSTRAINT IF EXISTS chk_employees_phone;
    ALTER TABLE public.employees 
    ADD CONSTRAINT chk_employees_phone 
    CHECK (
        phone IS NULL 
        OR (length(phone) = 10 AND phone ~ '^[6-9][0-9]{9}$')
        OR phone ~ '^\+[1-9][0-9]{0,3}[\s-]?[0-9]{6,14}$'
    ) 
    NOT VALID;
END $$;
