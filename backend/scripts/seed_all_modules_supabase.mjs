import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: 'backend/.env' });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Import mock data shapes from attendance & HRMS
const INITIAL_SHIFTS = [
  {
    id: 'SH-01',
    shiftName: 'Morning Standard',
    startTime: '09:00',
    endTime: '18:00',
    breakDurationMins: 60,
    workingHours: 8,
    gracePeriodMins: 15,
    color: '#0E7490',
    description: 'Standard day shift with 1 hour lunch break',
    assignments: []
  },
  {
    id: 'SH-02',
    shiftName: 'Afternoon Shift',
    startTime: '13:00',
    endTime: '22:00',
    breakDurationMins: 60,
    workingHours: 8,
    gracePeriodMins: 15,
    color: '#F59E0B',
    description: 'Support and operations shift',
    assignments: []
  },
  {
    id: 'SH-03',
    shiftName: 'Night Shift',
    startTime: '21:00',
    endTime: '06:00',
    breakDurationMins: 60,
    workingHours: 8,
    gracePeriodMins: 15,
    color: '#8B5CF6',
    description: 'Infrastructure and overnight monitoring shift',
    assignments: []
  }
];

const INITIAL_LEAVES = [];
const INITIAL_ATTENDANCE = [];
const INITIAL_LOAN_POLICIES = [
  {
    id: 'LP-ADV-01',
    name: 'Standard Advance Salary',
    policyType: 'Advance Salary',
    maxEligibleAmountType: 'Percentage of Basic',
    maxEligiblePercentage: 50,
    maxEligibleFixedAmount: 25000,
    minTenureMonthsRequired: 3,
    maxRepaymentMonths: 3,
    interestRatePercent: 0,
    requiresCeoApproval: false,
    active: true,
    description: 'Short term advance salary repaid within 1-3 monthly payroll cycles.'
  },
  {
    id: 'LP-LOAN-01',
    name: 'Long Term Employee Welfare Loan',
    policyType: 'Personal Loan',
    maxEligibleAmountType: 'Multiple of Gross',
    maxEligiblePercentage: 200,
    maxEligibleFixedAmount: 100000,
    minTenureMonthsRequired: 6,
    maxRepaymentMonths: 12,
    interestRatePercent: 2,
    requiresCeoApproval: true,
    active: true,
    description: 'Long term employee assistance loan up to 12 months EMI deduction.'
  }
];
const INITIAL_LOAN_RECORDS = [];
const INITIAL_ASSETS = [];
const INITIAL_EXPENSES = [];
const INITIAL_MOM_MEETINGS = [];
const INITIAL_PAYROLL = [];

async function seed() {
  const client = await pool.connect();
  console.log('Connected to PostgreSQL Supabase!');

  const modules = [
    { key: 'shifts_data', data: INITIAL_SHIFTS },
    { key: 'leave_requests_data', data: INITIAL_LEAVES },
    { key: 'attendance_records_data', data: INITIAL_ATTENDANCE },
    { key: 'loan_policies_data', data: INITIAL_LOAN_POLICIES },
    { key: 'loan_records_data', data: INITIAL_LOAN_RECORDS },
    { key: 'assets_data', data: INITIAL_ASSETS },
    { key: 'expenses_data', data: INITIAL_EXPENSES },
    { key: 'mom_meetings_data', data: INITIAL_MOM_MEETINGS },
    { key: 'payroll_records_data', data: INITIAL_PAYROLL }
  ];

  for (const mod of modules) {
    // Only insert if not exists so we don't overwrite user's live modifications
    const check = await client.query('SELECT 1 FROM public.company_settings WHERE setting_key = $1', [mod.key]);
    if (check.rows.length === 0) {
      await client.query(
        'INSERT INTO public.company_settings (setting_key, setting_val, updated_at) VALUES ($1, $2, NOW())',
        [mod.key, JSON.stringify(mod.data)]
      );
      console.log(`Seeded cloud setting: ${mod.key} (${mod.data.length} records)`);
    } else {
      console.log(`Setting ${mod.key} already exists in Supabase. Skipping seed.`);
    }
  }

  client.release();
  await pool.end();
  console.log('Supabase cloud seeding complete!');
}

seed().catch(console.error);
