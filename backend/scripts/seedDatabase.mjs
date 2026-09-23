import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Client } = pg;

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  console.log('Seeding Supabase PostgreSQL database...');

  // 1. Roles: get role IDs
  const rolesRes = await client.query('SELECT id, key FROM public.roles');
  const roleMap = {};
  rolesRes.rows.forEach(r => { roleMap[r.key] = r.id; });
  console.log('Roles found:', Object.keys(roleMap));

  const superAdminRoleId = roleMap['super_admin'] || roleMap['admin'] || rolesRes.rows[0]?.id;
  const hrAdminRoleId = roleMap['hr_admin'] || superAdminRoleId;

  // 2. Departments
  console.log('Seeding departments...');
  const deptData = [
    { name: 'Management', code: 'MGMT' },
    { name: 'Human Resources', code: 'HR' },
    { name: 'Engineering', code: 'ENG' },
    { name: 'Operations', code: 'OPS' },
    { name: 'Finance & Accounts', code: 'FIN' },
    { name: 'Sales & Marketing', code: 'SALES' },
  ];

  for (const d of deptData) {
    await client.query(`
      INSERT INTO public.departments (name, code)
      VALUES ($1, $2)
      ON CONFLICT (code) DO NOTHING
    `, [d.name, d.code]);
  }

  const mgmtDeptRes = await client.query("SELECT id FROM public.departments WHERE code = 'MGMT'");
  const hrDeptRes = await client.query("SELECT id FROM public.departments WHERE code = 'HR'");
  const mgmtDeptId = mgmtDeptRes.rows[0]?.id;
  const hrDeptId = hrDeptRes.rows[0]?.id;

  // 3. Shifts
  console.log('Seeding shifts...');
  await client.query(`
    INSERT INTO public.shifts (shift_name, start_time, end_time, break_duration_mins, working_hours, grace_period_mins, color)
    VALUES 
      ('Shift 1 (09:00 AM - 06:00 PM)', '09:00', '18:00', 45, 8.25, 15, '#0E7490'),
      ('General Day Shift', '09:30', '18:30', 60, 8.00, 15, '#3B82F6')
    ON CONFLICT DO NOTHING
  `);

  // 4. Employees
  console.log('Seeding employees...');
  const emp0 = await client.query(`
    INSERT INTO public.employees (
      employee_id, first_name, last_name, email, phone, designation,
      department_id, basic_salary, role_id, status, attendance_method,
      must_change_password, account_status, credential_email_status
    ) VALUES (
      'EMP-000', 'Admin', 'User', 'admin@businz.com', '+91 98765 43210', 'CEO',
      $1, 250000, $2, 'Active', 'Exempt',
      false, 'ACTIVE', 'SENT'
    )
    ON CONFLICT (employee_id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      email = EXCLUDED.email,
      role_id = EXCLUDED.role_id,
      basic_salary = EXCLUDED.basic_salary
    RETURNING id;
  `, [mgmtDeptId, superAdminRoleId]);

  const emp1 = await client.query(`
    INSERT INTO public.employees (
      employee_id, first_name, last_name, email, phone, designation,
      department_id, basic_salary, role_id, status, attendance_method,
      must_change_password, account_status, credential_email_status
    ) VALUES (
      'EMP-001', 'HR', 'Admin', 'hr@businz.com', '+91 98765 43211', 'HR Manager',
      $1, 60000, $2, 'Active', 'Face Scan',
      false, 'ACTIVE', 'SENT'
    )
    ON CONFLICT (employee_id) DO UPDATE SET
      first_name = EXCLUDED.first_name,
      email = EXCLUDED.email,
      role_id = EXCLUDED.role_id,
      basic_salary = EXCLUDED.basic_salary
    RETURNING id;
  `, [hrDeptId, hrAdminRoleId]);

  const emp0Id = emp0.rows[0]?.id;
  const emp1Id = emp1.rows[0]?.id;

  // 5. Salary structures
  if (emp0Id) {
    await client.query(`
      INSERT INTO public.salary_structures (employee_id, monthly_salary, basic_percentage, da_percentage, conveyance_percentage, hra_percentage, is_active)
      VALUES ($1, 250000, 40, 20, 5, 35, true)
      ON CONFLICT DO NOTHING
    `, [emp0Id]);
  }
  if (emp1Id) {
    await client.query(`
      INSERT INTO public.salary_structures (employee_id, monthly_salary, basic_percentage, da_percentage, conveyance_percentage, hra_percentage, is_active)
      VALUES ($1, 60000, 40, 20, 5, 35, true)
      ON CONFLICT DO NOTHING
    `, [emp1Id]);
  }

  // 6. Check counts
  const empCount = await client.query('SELECT count(*) FROM public.employees');
  const deptCount = await client.query('SELECT count(*) FROM public.departments');
  const shiftCount = await client.query('SELECT count(*) FROM public.shifts');
  console.log(`\nSeed successful:`);
  console.log(`Employees in DB: ${empCount.rows[0].count}`);
  console.log(`Departments in DB: ${deptCount.rows[0].count}`);
  console.log(`Shifts in DB: ${shiftCount.rows[0].count}`);

  await client.end();
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
