-- Migration: 004_case_insensitive_citext_email.sql
-- Enables CITEXT extension and updates employees.email to CITEXT UNIQUE NOT NULL

-- 1. Safely enable the PostgreSQL citext extension
CREATE EXTENSION IF NOT EXISTS citext;

-- 2. Clean and convert existing employee emails to lowercase
UPDATE employees 
SET email = LOWER(TRIM(email))
WHERE email IS NOT NULL;

-- 3. Safely handle any potential duplicate emails before applying constraint
-- (Keeps earliest record as-is, updates any subsequent duplicates with unique suffix)
WITH duplicate_ranks AS (
  SELECT id, email,
         ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(email)) ORDER BY created_at ASC NULLS LAST, id ASC) as rnk
  FROM employees
  WHERE email IS NOT NULL AND TRIM(email) <> ''
)
UPDATE employees e
SET email = e.email || '.duplicate.' || SUBSTRING(e.id::text FROM 1 FOR 6)
FROM duplicate_ranks d
WHERE e.id = d.id AND d.rnk > 1;

-- 4. Alter column type to CITEXT
ALTER TABLE employees ALTER COLUMN email TYPE CITEXT;

-- 5. Ensure column is NOT NULL
ALTER TABLE employees ALTER COLUMN email SET NOT NULL;

-- 6. Ensure unique index / constraint is applied
DO $$
BEGIN
    -- Drop duplicate/redundant non-unique index if needed
    DROP INDEX IF EXISTS idx_employees_email;

    -- Ensure a robust unique constraint exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'employees_email_unique' AND conrelid = 'employees'::regclass
    ) AND NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'employees_email_key' AND conrelid = 'employees'::regclass
    ) THEN
        ALTER TABLE employees ADD CONSTRAINT employees_email_unique UNIQUE (email);
    END IF;

    -- Re-create index if needed
    CREATE INDEX IF NOT EXISTS idx_employees_email_citext ON employees (email);
END $$;
