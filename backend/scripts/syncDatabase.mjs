import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function sync() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL not set in .env');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();
  console.log('Connected to Supabase PostgreSQL...');

  // 1. Add missing columns to attendance_records
  console.log('Synchronizing attendance_records columns...');
  await client.query(`
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
  `);

  // 2. Add missing columns to employees
  console.log('Synchronizing employees columns...');
  await client.query(`
    ALTER TABLE public.employees
      ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT TRUE,
      ADD COLUMN IF NOT EXISTS account_status TEXT NOT NULL DEFAULT 'ACTIVE',
      ADD COLUMN IF NOT EXISTS credential_email_status TEXT NOT NULL DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS credential_email_sent_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ,
      ADD COLUMN IF NOT EXISTS work_shift TEXT,
      ADD COLUMN IF NOT EXISTS password TEXT DEFAULT 'Password@123';
  `);

  // 3. Create missing tables
  console.log('Creating missing tables if not exists...');
  await client.query(`
    -- password_resets
    CREATE TABLE IF NOT EXISTS public.password_resets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL,
      token TEXT NOT NULL,
      expires_at TIMESTAMPTZ NOT NULL,
      used BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- salary_structures
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

    -- payroll_settings
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

    -- field_duty_assignments
    CREATE TABLE IF NOT EXISTS public.field_duty_assignments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
      client_name TEXT NOT NULL,
      location_name TEXT NOT NULL,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      radius_meters INTEGER NOT NULL DEFAULT 500,
      assigned_date DATE NOT NULL,
      start_time TIME,
      end_time TIME,
      status TEXT NOT NULL DEFAULT 'Assigned',
      notes TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- field_trip_sessions
    CREATE TABLE IF NOT EXISTS public.field_trip_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
      assignment_id UUID REFERENCES public.field_duty_assignments(id) ON DELETE SET NULL,
      start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      end_time TIMESTAMPTZ,
      start_lat DOUBLE PRECISION,
      start_lng DOUBLE PRECISION,
      end_lat DOUBLE PRECISION,
      end_lng DOUBLE PRECISION,
      total_km DOUBLE PRECISION NOT NULL DEFAULT 0.00,
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- field_location_points
    CREATE TABLE IF NOT EXISTS public.field_location_points (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      trip_id UUID REFERENCES public.field_trip_sessions(id) ON DELETE CASCADE,
      employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
      latitude DOUBLE PRECISION NOT NULL,
      longitude DOUBLE PRECISION NOT NULL,
      accuracy DOUBLE PRECISION,
      speed DOUBLE PRECISION,
      battery_level INTEGER,
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- field_tracking_alerts
    CREATE TABLE IF NOT EXISTS public.field_tracking_alerts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE,
      alert_type TEXT NOT NULL,
      message TEXT NOT NULL,
      latitude DOUBLE PRECISION,
      longitude DOUBLE PRECISION,
      severity TEXT NOT NULL DEFAULT 'Warning',
      resolved BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Insert default payroll_settings if not present
    INSERT INTO public.payroll_settings (org_key) 
    VALUES ('global')
    ON CONFLICT (org_key) DO NOTHING;
  `);

  // 4. Create missing indexes
  console.log('Creating indexes...');
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_attendance_shift_date ON public.attendance_records(shift_id, shift_date);
    CREATE INDEX IF NOT EXISTS idx_attendance_records_emp ON public.attendance_records(employee_id);
    CREATE INDEX IF NOT EXISTS idx_employees_email ON public.employees(email);
    CREATE INDEX IF NOT EXISTS idx_employees_empid ON public.employees(employee_id);
  `);

  // Verify all tables now
  const res = await client.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log(`\nAll public tables (${res.rows.length}):`);
  res.rows.forEach(r => console.log(' - ' + r.table_name));

  await client.end();
  console.log('\nDatabase synchronization completed successfully!');
}

sync().catch(err => {
  console.error('Database sync failed:', err);
  process.exit(1);
});
