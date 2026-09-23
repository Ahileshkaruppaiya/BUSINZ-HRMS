// Automated Test Suite for All 10 Sandwich Leave Edge Cases
import { calculateSandwichLeave } from '../services/sandwichLeaveEngine';
import { Employee, HolidayItem, LeaveRequest, SandwichLeavePolicy } from '../types/hrms';
import { initialSandwichPolicies } from '../data/sandwichPolicyInitialData';

const mockEmployee: Employee = {
  id: 'EMP-TEST-001',
  employeeId: 'EMP-001',
  firstName: 'Arun',
  lastName: 'Kumar',
  email: 'arun@vrm.com',
  phone: '9876543210',
  dob: '1990-01-01',
  gender: 'Male',
  address: 'Chennai HQ',
  department: 'Engineering',
  designation: 'Senior Developer',
  reportingManagerId: 'MGR-001',
  reportingManagerName: 'Manager',
  joiningDate: '2023-01-01',
  employmentType: 'Full-Time',
  status: 'Active',
  avatar: '',
  basicSalary: 26000, // ₹1,000 daily salary for clean arithmetic
  allowances: { hra: 0, transport: 0, medical: 0, special: 0 },
  bankDetails: { bankName: '', accountNumber: '', ifscCode: '', branch: '' },
  attendanceMethod: 'Face Scan',
  gpsAllowed: true,
  faceRegistered: true,
  documents: [],
  workLocation: 'Chennai Branch',
  shiftDetails: {
    weeklyOff: 'Sunday, Saturday'
  }
};

const mockHolidays: HolidayItem[] = [
  {
    id: 'HOL-01',
    name: 'Independence Day',
    date: '2026-08-15',
    daysCount: 1,
    type: 'Compulsory',
    applicableLocation: 'All Sites'
  },
  {
    id: 'HOL-02',
    name: 'Midweek Festival',
    date: '2026-09-15', // Tuesday
    daysCount: 1,
    type: 'Compulsory',
    applicableLocation: 'All Sites'
  },
  {
    id: 'HOL-03',
    name: 'Bangalore State Holiday',
    date: '2026-09-16', // Wednesday
    daysCount: 1,
    type: 'State Specific',
    applicableLocation: 'Bangalore Branch'
  }
];

export function runAllSandwichTests(): { passed: number; failed: number; results: string[] } {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(caseName: string, condition: boolean, detail: string) {
    if (condition) {
      passed++;
      results.push(`✅ [PASS] ${caseName}: ${detail}`);
    } else {
      failed++;
      results.push(`❌ [FAIL] ${caseName}: ${detail}`);
    }
  }

  // ----------------------------------------------------
  // CASE 1: Friday Leave + Saturday Off + Sunday Off + Monday Working
  // Expected: NO sandwich applied when both sides mandatory. Total = 1 day (Friday).
  // ----------------------------------------------------
  const case1 = calculateSandwichLeave({
    employee: mockEmployee,
    leaveType: 'Casual Leave',
    startDate: '2026-09-11', // Friday
    endDate: '2026-09-11',   // Friday
    policies: initialSandwichPolicies,
    holidays: mockHolidays,
    weeklyOffSchedule: ['Saturday', 'Sunday']
  });
  assert('CASE 1', case1.totalDays === 1 && case1.sandwichDays === 0, `Total days: ${case1.totalDays}, Sandwich: ${case1.sandwichDays}`);

  // ----------------------------------------------------
  // CASE 2: Friday Leave + Saturday Off + Sunday Off + Monday Leave
  // Expected: Sandwich applied. Total = 4 days (Fri + Sat + Sun + Mon).
  // ----------------------------------------------------
  const case2 = calculateSandwichLeave({
    employee: mockEmployee,
    leaveType: 'Casual Leave',
    startDate: '2026-09-11', // Friday
    endDate: '2026-09-14',   // Monday
    policies: initialSandwichPolicies,
    holidays: mockHolidays,
    weeklyOffSchedule: ['Saturday', 'Sunday']
  });
  assert('CASE 2', case2.totalDays === 4 && case2.sandwichDays === 2, `Total days: ${case2.totalDays}, Sandwich: ${case2.sandwichDays}`);

  // ----------------------------------------------------
  // CASE 3: Thursday Leave + Friday Leave + Saturday Off + Sunday Off + Monday Leave
  // Expected: Sandwich applied once. Total = 5 days (Thu + Fri + Sat + Sun + Mon), no double counting.
  // ----------------------------------------------------
  const case3 = calculateSandwichLeave({
    employee: mockEmployee,
    leaveType: 'Casual Leave',
    startDate: '2026-09-10', // Thursday
    endDate: '2026-09-14',   // Monday
    policies: initialSandwichPolicies,
    holidays: mockHolidays,
    weeklyOffSchedule: ['Saturday', 'Sunday']
  });
  assert('CASE 3', case3.totalDays === 5 && case3.sandwichDays === 2, `Total days: ${case3.totalDays}, Sandwich: ${case3.sandwichDays}`);

  // ----------------------------------------------------
  // CASE 4: Monday Holiday + Tuesday Leave (No Leave Before Monday)
  // Expected: NO holiday sandwich applied if both sides mandatory. Total = 1 day (Tuesday).
  // ----------------------------------------------------
  const case4 = calculateSandwichLeave({
    employee: mockEmployee,
    leaveType: 'Casual Leave',
    startDate: '2026-09-15', // Tuesday (Holiday)
    endDate: '2026-09-16',   // Wednesday (Working)
    policies: initialSandwichPolicies,
    holidays: mockHolidays, // Sep 15 is Holiday
    weeklyOffSchedule: ['Saturday', 'Sunday']
  });
  assert('CASE 4', case4.sandwichDays === 0, `Sandwich days: ${case4.sandwichDays}, Total: ${case4.totalDays}`);

  // ----------------------------------------------------
  // CASE 5: Monday Leave + Tuesday Holiday + Wednesday Leave
  // Expected: Holiday sandwich applied. Total = 3 days (Mon + Tue + Wed).
  // ----------------------------------------------------
  const case5 = calculateSandwichLeave({
    employee: mockEmployee,
    leaveType: 'Casual Leave',
    startDate: '2026-09-14', // Monday
    endDate: '2026-09-16',   // Wednesday (Sep 15 is Holiday)
    policies: initialSandwichPolicies,
    holidays: mockHolidays,
    weeklyOffSchedule: ['Saturday', 'Sunday']
  });
  assert('CASE 5', case5.totalDays === 3 && case5.sandwichDays === 1, `Total days: ${case5.totalDays}, Sandwich: ${case5.sandwichDays}`);

  // ----------------------------------------------------
  // CASE 6: Employee has Monday + Tuesday Weekly Off (Custom Schedule)
  // Expected: Uses employee's actual weekly offs (Mon & Tue), not Sat/Sun!
  // E.g. Sun Leave + Mon Off + Tue Off + Wed Leave = 4 days
  // ----------------------------------------------------
  const case6 = calculateSandwichLeave({
    employee: {
      ...mockEmployee,
      shiftDetails: { weeklyOff: 'Monday, Tuesday' }
    },
    leaveType: 'Casual Leave',
    startDate: '2026-09-20', // Sunday
    endDate: '2026-09-23',   // Wednesday
    policies: initialSandwichPolicies,
    holidays: [],
    weeklyOffSchedule: ['Monday', 'Tuesday']
  });
  assert('CASE 6', case6.totalDays === 4 && case6.sandwichDays === 2, `Total days: ${case6.totalDays}, Sandwich: ${case6.sandwichDays} (Mon+Tue Off)`);

  // ----------------------------------------------------
  // CASE 7: Holiday belongs to another branch (Bangalore only, employee in Chennai)
  // Expected: Holiday is NOT counted for this employee.
  // ----------------------------------------------------
  const case7 = calculateSandwichLeave({
    employee: { ...mockEmployee, workLocation: 'Chennai Branch' },
    leaveType: 'Casual Leave',
    startDate: '2026-09-16', // Wednesday (Bangalore Holiday only)
    endDate: '2026-09-16',
    policies: initialSandwichPolicies,
    holidays: mockHolidays,
    weeklyOffSchedule: ['Saturday', 'Sunday']
  });
  assert('CASE 7', case7.publicHolidayDays === 0 && case7.totalDays === 1, `Holiday was properly excluded for Chennai employee (Total: ${case7.totalDays})`);

  // ----------------------------------------------------
  // CASE 8: Sandwich Policy Disabled
  // Expected: Normal leave calculation, weekly off not converted.
  // ----------------------------------------------------
  const disabledPolicy: SandwichLeavePolicy = {
    ...initialSandwichPolicies[0],
    sandwichRuleEnabled: false
  };
  const case8 = calculateSandwichLeave({
    employee: mockEmployee,
    leaveType: 'Casual Leave',
    startDate: '2026-09-11', // Friday
    endDate: '2026-09-14',   // Monday
    policies: [disabledPolicy],
    holidays: mockHolidays,
    weeklyOffSchedule: ['Saturday', 'Sunday']
  });
  assert('CASE 8', case8.sandwichDays === 0 && case8.totalDays === 2, `Sandwich days: ${case8.sandwichDays}, Total: ${case8.totalDays}`);

  // ----------------------------------------------------
  // CASE 9: Leave type excluded from sandwich policy (e.g. Comp Off or Earned Leave)
  // Expected: Normal leave calculation, no sandwich.
  // ----------------------------------------------------
  const selectivePolicy: SandwichLeavePolicy = {
    ...initialSandwichPolicies[0],
    applicableLeaveTypes: ['Sick Leave'] // Only Sick Leave, NOT Casual Leave
  };
  const case9 = calculateSandwichLeave({
    employee: mockEmployee,
    leaveType: 'Casual Leave',
    startDate: '2026-09-11', // Friday
    endDate: '2026-09-14',   // Monday
    policies: [selectivePolicy],
    holidays: mockHolidays,
    weeklyOffSchedule: ['Saturday', 'Sunday']
  });
  assert('CASE 9', case9.sandwichDays === 0 && case9.totalDays === 2, `Excluded leave type resulted in sandwichDays: ${case9.sandwichDays}`);

  // ----------------------------------------------------
  // CASE 10: Combination Rule (Fri Leave + Sat Off + Sun Off + Mon Holiday + Tue Leave)
  // Expected: 5 days total (Fri + Sat + Sun + Mon + Tue).
  // ----------------------------------------------------
  const comboHolidays: HolidayItem[] = [
    {
      id: 'HOL-MON',
      name: 'Monday Public Holiday',
      date: '2026-09-14', // Monday
      daysCount: 1,
      type: 'Compulsory',
      applicableLocation: 'All Sites'
    }
  ];
  const case10 = calculateSandwichLeave({
    employee: mockEmployee,
    leaveType: 'Casual Leave',
    startDate: '2026-09-11', // Friday
    endDate: '2026-09-15',   // Tuesday
    policies: initialSandwichPolicies,
    holidays: comboHolidays,
    weeklyOffSchedule: ['Saturday', 'Sunday']
  });
  assert('CASE 10', case10.totalDays === 5 && case10.sandwichDays === 3, `Combination of Weekly Off (2) + Holiday (1) = 3 sandwich days, Total: ${case10.totalDays}`);

  return { passed, failed, results };
}
