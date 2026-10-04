import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function cleanMockData() {
  const client = await pool.connect();
  console.log('🚀 Connected to Supabase PostgreSQL database.');

  try {
    await client.query('BEGIN');

    // 1. Delete mock employee (EMP-011 - dfxcvbn fcg)
    const delEmp = await client.query(
      "DELETE FROM public.employees WHERE employee_id = 'EMP-011' OR first_name ILIKE '%dfxcvbn%';"
    );
    console.log(`  - Deleted ${delEmp.rowCount} mock employees (EMP-011)`);

    // 2. Delete mock assets (dfgfg, dfbfgng, cvffv, AST-325, AST-169, AST-248)
    const delAssets = await client.query('DELETE FROM public.assets;');
    console.log(`  - Deleted ${delAssets.rowCount} mock assets from public.assets`);

    // 3. Deduplicate public.departments
    // Canonical departments to keep:
    // HR: 7ca37f4f-f388-47e8-b522-2b4a56a60a2f
    // CEO: 277d9f58-b196-4593-9f58-cf9048a37937
    // Sales: 545d5be0-9076-450a-ba6f-3262773edc8c
    // Accounts: 8fc3ae7b-15c9-4656-bbc9-6ded583794ea
    const canonicalIds = [
      '7ca37f4f-f388-47e8-b522-2b4a56a60a2f',
      '277d9f58-b196-4593-9f58-cf9048a37937',
      '545d5be0-9076-450a-ba6f-3262773edc8c',
      '8fc3ae7b-15c9-4656-bbc9-6ded583794ea'
    ];

    // Re-point any employees referencing duplicate departments to canonical
    await client.query(`
      UPDATE public.employees 
      SET department_id = '7ca37f4f-f388-47e8-b522-2b4a56a60a2f'
      WHERE department_id IS NOT NULL AND department_id NOT IN ('7ca37f4f-f388-47e8-b522-2b4a56a60a2f', '277d9f58-b196-4593-9f58-cf9048a37937', '545d5be0-9076-450a-ba6f-3262773edc8c', '8fc3ae7b-15c9-4656-bbc9-6ded583794ea')
      AND department_id IN (SELECT id FROM public.departments WHERE LOWER(name) LIKE '%hr%');
    `);
    await client.query(`
      UPDATE public.employees 
      SET department_id = '277d9f58-b196-4593-9f58-cf9048a37937'
      WHERE department_id IS NOT NULL AND department_id NOT IN ('7ca37f4f-f388-47e8-b522-2b4a56a60a2f', '277d9f58-b196-4593-9f58-cf9048a37937', '545d5be0-9076-450a-ba6f-3262773edc8c', '8fc3ae7b-15c9-4656-bbc9-6ded583794ea')
      AND department_id IN (SELECT id FROM public.departments WHERE LOWER(name) LIKE '%ceo%');
    `);
    await client.query(`
      UPDATE public.employees 
      SET department_id = '545d5be0-9076-450a-ba6f-3262773edc8c'
      WHERE department_id IS NOT NULL AND department_id NOT IN ('7ca37f4f-f388-47e8-b522-2b4a56a60a2f', '277d9f58-b196-4593-9f58-cf9048a37937', '545d5be0-9076-450a-ba6f-3262773edc8c', '8fc3ae7b-15c9-4656-bbc9-6ded583794ea')
      AND department_id IN (SELECT id FROM public.departments WHERE LOWER(name) LIKE '%sale%');
    `);

    // Standardize department casing and names
    await client.query("UPDATE public.departments SET name = 'HR' WHERE id = '7ca37f4f-f388-47e8-b522-2b4a56a60a2f';");
    await client.query("UPDATE public.departments SET name = 'CEO' WHERE id = '277d9f58-b196-4593-9f58-cf9048a37937';");
    await client.query("UPDATE public.departments SET name = 'Sales' WHERE id = '545d5be0-9076-450a-ba6f-3262773edc8c';");
    await client.query("UPDATE public.departments SET name = 'Accounts' WHERE id = '8fc3ae7b-15c9-4656-bbc9-6ded583794ea';");

    // Delete redundant departments
    const delDepts = await client.query(
      "DELETE FROM public.departments WHERE id NOT IN ($1, $2, $3, $4);",
      canonicalIds
    );
    console.log(`  - Deleted ${delDepts.rowCount} duplicate department rows from public.departments`);

    // 4. Clean company_settings keys
    console.log('4. Clearing mock policies and transactional data in company_settings...');
    const emptyKeys = [
      'leave_requests_data',
      'overtime_records_data',
      'attendance_records_data',
      'payroll_records_data',
      'loan_records_data',
      'field_assignments_data',
      'expenses_data',
      'assets_data',
      'mom_meetings_data',
      'employee_rewards_data',
      'trip_sessions_data',
      'tracking_alerts_data',
      'master_attendance_policies_data',
      'reward_policies_data',
      'holiday_policies_data',
      'designations_data',
      'department_ot_policies_data',
      'loan_policies_data',
      'company_branches_data'
    ];

    for (const key of emptyKeys) {
      await client.query(
        "INSERT INTO public.company_settings (setting_key, setting_val, updated_at) VALUES ($1, '[]'::jsonb, NOW()) ON CONFLICT (setting_key) DO UPDATE SET setting_val = '[]'::jsonb, updated_at = NOW();",
        [key]
      );
      console.log(`  - Reset company_settings.${key} -> []`);
    }

    // Canonical departments data in company_settings
    const canonicalDeptsData = [
      { id: "7ca37f4f-f388-47e8-b522-2b4a56a60a2f", code: "HR", name: "HR", budget: 0, headId: "ba8dc5c1-3eb3-489b-985a-b00e1736f54b", headName: "Mohamed AM", employeeCount: 3 },
      { id: "277d9f58-b196-4593-9f58-cf9048a37937", code: "CEO", name: "CEO", budget: 0, headId: "261d056d-ff95-44a1-8100-fa0f9a8afabd", headName: "VELMURUKAN P", employeeCount: 1 },
      { id: "545d5be0-9076-450a-ba6f-3262773edc8c", code: "SALE", name: "Sales", budget: 0, headId: "61106c4f-e446-44a1-8290-d456f7dcf025", headName: "AJITH KUMAR", employeeCount: 1 },
      { id: "8fc3ae7b-15c9-4656-bbc9-6ded583794ea", code: "ACCO", name: "Accounts", budget: 0, headId: "", headName: "Unassigned", employeeCount: 0 }
    ];
    await client.query(
      "INSERT INTO public.company_settings (setting_key, setting_val, updated_at) VALUES ('departments_data', $1::jsonb, NOW()) ON CONFLICT (setting_key) DO UPDATE SET setting_val = $1::jsonb, updated_at = NOW();",
      [JSON.stringify(canonicalDeptsData)]
    );
    console.log('  - Updated company_settings.departments_data to 4 canonical departments');

    // Clean shifts_data in company_settings
    const cleanShifts = [
      {
        id: "3ca44b69-6583-4784-9a5b-67383e3e4163",
        color: "#0E7490",
        endTime: "18:00:00",
        shiftName: "Morning",
        startTime: "09:00:00",
        assignments: [],
        workingHours: 8.25,
        gracePeriodMins: 15,
        breakDurationMins: 45,
        assignedEmployeeCount: 0
      }
    ];
    await client.query(
      "INSERT INTO public.company_settings (setting_key, setting_val, updated_at) VALUES ('shifts_data', $1::jsonb, NOW()) ON CONFLICT (setting_key) DO UPDATE SET setting_val = $1::jsonb, updated_at = NOW();",
      [JSON.stringify(cleanShifts)]
    );
    console.log('  - Cleaned company_settings.shifts_data');

    // Blank out company_info and company_info_company-b
    const blankCompany = {
      id: 'comp-a',
      company_id: 'company-a',
      companyCode: '',
      logoUrl: '',
      companyName: '',
      legalCompanyName: '',
      companyType: 'Private Limited',
      industry: '',
      registrationNumber: '',
      gstNumber: '',
      panNumber: '',
      cinNumber: '',
      website: '',
      officialEmail: '',
      officialPhone: '',
      registeredAddress: '',
      branchAddress: '',
      ownerName: '',
      authorizedSignatoryName: '',
      authorizedSignatoryDesignation: '',
      signatureImageUrl: '',
      stampImageUrl: '',
      createdAt: new Date().toISOString(),
      createdBy: 'System',
      updatedAt: new Date().toISOString(),
      updatedBy: 'System'
    };
    await client.query(
      "UPDATE public.company_settings SET setting_val = $1::jsonb, updated_at = NOW() WHERE setting_key = 'company_info';",
      [JSON.stringify(blankCompany)]
    );
    await client.query(
      "UPDATE public.company_settings SET setting_val = $1::jsonb, updated_at = NOW() WHERE setting_key = 'company_info_company-b';",
      [JSON.stringify({ ...blankCompany, id: 'comp-b', company_id: 'company-b' })]
    );
    console.log('  - Cleared company_settings.company_info and company_info_company-b');

    // 5. Clean relational tables
    console.log('5. Clearing mock rows from relational tables...');
    await client.query('DELETE FROM public.payroll_records;');
    await client.query('DELETE FROM public.attendance_records;');
    await client.query("DELETE FROM public.enterprise_tasks WHERE id = 'TSK-1790344931120' OR title LIKE '%b;nhhcsjcoksd%';");
    await client.query('DELETE FROM public.leave_requests;');

    await client.query('COMMIT');
    console.log('✅ Database mock data cleanup completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error cleaning mock data:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

cleanMockData().catch(err => {
  console.error(err);
  process.exit(1);
});
