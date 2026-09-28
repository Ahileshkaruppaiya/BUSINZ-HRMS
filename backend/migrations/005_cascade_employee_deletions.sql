-- Migration 005: Allow Clean Employee Deletion with CASCADE / SET NULL on Dependent Tables
-- Prevents Foreign Key Violations when removing employee profiles

BEGIN;

-- 1. leave_requests: cascade delete when employee is deleted
ALTER TABLE public.leave_requests DROP CONSTRAINT IF EXISTS leave_requests_employee_id_fkey;
ALTER TABLE public.leave_requests ADD CONSTRAINT leave_requests_employee_id_fkey 
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- 2. payroll_records: cascade delete when employee is deleted
ALTER TABLE public.payroll_records DROP CONSTRAINT IF EXISTS payroll_records_employee_id_fkey;
ALTER TABLE public.payroll_records ADD CONSTRAINT payroll_records_employee_id_fkey 
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- 3. tasks.responsible_person_id: allow NULL and set NULL on delete (so team tasks are preserved)
ALTER TABLE public.tasks ALTER COLUMN responsible_person_id DROP NOT NULL;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_responsible_person_id_fkey;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_responsible_person_id_fkey 
  FOREIGN KEY (responsible_person_id) REFERENCES public.employees(id) ON DELETE SET NULL;

-- 4. task_updates: cascade delete when employee is deleted
ALTER TABLE public.task_updates DROP CONSTRAINT IF EXISTS task_updates_employee_id_fkey;
ALTER TABLE public.task_updates ADD CONSTRAINT task_updates_employee_id_fkey 
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- 5. performance_scores: cascade delete when employee is deleted
ALTER TABLE public.performance_scores DROP CONSTRAINT IF EXISTS performance_scores_employee_id_fkey;
ALTER TABLE public.performance_scores ADD CONSTRAINT performance_scores_employee_id_fkey 
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

-- 6. expenses: cascade delete when employee is deleted
ALTER TABLE public.expenses DROP CONSTRAINT IF EXISTS expenses_employee_id_fkey;
ALTER TABLE public.expenses ADD CONSTRAINT expenses_employee_id_fkey 
  FOREIGN KEY (employee_id) REFERENCES public.employees(id) ON DELETE CASCADE;

COMMIT;
