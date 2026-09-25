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

const INITIAL_LEAVES = [
  {
    id: 'LR-001',
    employeeId: 'EMP-001',
    employeeName: 'Sarah Jenkins',
    department: 'Engineering',
    leaveType: 'Casual Leave',
    startDate: '2026-03-20',
    endDate: '2026-03-21',
    daysCount: 2,
    reason: 'Family occasion',
    status: 'Pending',
    appliedDate: '2026-03-15'
  },
  {
    id: 'LR-002',
    employeeId: 'EMP-002',
    employeeName: 'Marcus Vance',
    department: 'Sales',
    leaveType: 'Medical Leave',
    startDate: '2026-03-10',
    endDate: '2026-03-12',
    daysCount: 3,
    reason: 'Medical rest',
    status: 'Approved',
    appliedDate: '2026-03-08'
  }
];

const INITIAL_ATTENDANCE = [
  {
    id: 'ATT-001',
    employeeId: 'EMP-001',
    employeeName: 'Sarah Jenkins',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:02 AM',
    checkOut: '06:05 PM',
    workingHours: 8.5,
    status: 'Present',
    lateStatus: 'On Time',
    method: 'Face Scan'
  },
  {
    id: 'ATT-002',
    employeeId: 'EMP-002',
    employeeName: 'Marcus Vance',
    date: new Date().toISOString().split('T')[0],
    checkIn: '09:25 AM',
    checkOut: '06:00 PM',
    workingHours: 8.0,
    status: 'Late',
    lateStatus: 'Late (25m)',
    method: 'Face Scan'
  }
];

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

const INITIAL_LOAN_RECORDS = [
  {
    id: 'LOAN-1001',
    employeeId: 'EMP-001',
    employeeName: 'Sarah Jenkins',
    department: 'Engineering',
    policyId: 'LP-ADV-01',
    policyName: 'Standard Advance Salary',
    requestedAmount: 15000,
    approvedAmount: 15000,
    installmentMonths: 2,
    monthlyDeduction: 7500,
    status: 'Approved',
    purpose: 'Festival expenses advance',
    requestDate: '2026-03-01',
    disbursementStatus: 'Disbursed',
    disbursedAt: '2026-03-02',
    deductionStartMonth: '2026-03',
    repaidAmount: 7500,
    remainingBalance: 7500,
    installments: [
      { month: '2026-03', emiAmount: 7500, status: 'Deducted', deductedAt: '2026-03-31' },
      { month: '2026-04', emiAmount: 7500, status: 'Pending' }
    ]
  }
];

const INITIAL_ASSETS = [
  {
    id: 'AST-001',
    assetTag: 'AST-LTP-001',
    name: 'MacBook Pro 16" M3',
    category: 'Laptop',
    serialNumber: 'C02G1234MD6R',
    assignedTo: 'EMP-001',
    assignedEmployeeName: 'Sarah Jenkins',
    assignedDepartment: 'Engineering',
    assignedDate: '2026-01-15',
    purchaseDate: '2026-01-10',
    purchaseCost: 249900,
    warrantyExpiry: '2027-01-10',
    status: 'Allocated',
    condition: 'Excellent',
    notes: 'Development machine assigned to Tech Lead'
  },
  {
    id: 'AST-002',
    assetTag: 'AST-MON-002',
    name: 'Dell UltraSharp 27" 4K',
    category: 'Monitor',
    serialNumber: 'CN-0K752D-72872',
    assignedTo: 'EMP-002',
    assignedEmployeeName: 'Marcus Vance',
    assignedDepartment: 'Sales',
    assignedDate: '2026-02-01',
    purchaseDate: '2026-01-20',
    purchaseCost: 45000,
    warrantyExpiry: '2028-01-20',
    status: 'Allocated',
    condition: 'Good',
    notes: 'Office workstation display'
  }
];

const INITIAL_EXPENSES = [
  {
    id: 'EXP-001',
    employeeId: 'EMP-002',
    employeeName: 'Marcus Vance',
    category: 'Client Travel',
    amount: 3450,
    date: '2026-03-18',
    description: 'Cab fare and airport transit for Bangalore client pitch',
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    status: 'Approved',
    approvedBy: 'Admin'
  },
  {
    id: 'EXP-002',
    employeeId: 'EMP-001',
    employeeName: 'Sarah Jenkins',
    category: 'Team Lunch',
    amount: 5200,
    date: '2026-03-22',
    description: 'Quarterly sprint retrospective celebration',
    receiptUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    status: 'Pending'
  }
];

const INITIAL_MOM_MEETINGS = [
  {
    id: 'MOM-001',
    meetingNumber: 'MOM-2026-001',
    meetingTitle: 'Enterprise HRMS Q1 Review & Deployment Sync',
    meetingDate: '2026-03-24',
    startTime: '10:00 AM',
    endTime: '11:30 AM',
    location: 'Conference Room Alpha / Google Meet',
    department: 'Management',
    organizerName: 'Admin',
    attendees: ['Sarah Jenkins', 'Marcus Vance', 'Admin'],
    summary: 'Reviewed multi-tenant cloud sync architecture, attendance tracking accuracy, and Plesk hosting stability.',
    actionItems: [
      { id: 'ACT-1', description: 'Enable Supabase cloud sync across all modules', assignedTo: 'Sarah Jenkins', dueDate: '2026-03-26', status: 'Completed' },
      { id: 'ACT-2', description: 'Verify cross-system login and shift schedule visibility', assignedTo: 'Marcus Vance', dueDate: '2026-03-27', status: 'In Progress' }
    ]
  }
];

const INITIAL_PAYROLL = [
  {
    id: 'PAY-001',
    employeeId: 'EMP-001',
    employeeName: 'Sarah Jenkins',
    month: 'March 2026',
    basicSalary: 65000,
    allowances: 15000,
    deductions: 5000,
    netSalary: 75000,
    status: 'Paid',
    paymentDate: '2026-03-31'
  },
  {
    id: 'PAY-002',
    employeeId: 'EMP-002',
    employeeName: 'Marcus Vance',
    month: 'March 2026',
    basicSalary: 45000,
    allowances: 10000,
    deductions: 3500,
    netSalary: 51500,
    status: 'Generated',
    paymentDate: '2026-03-31'
  }
];

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
