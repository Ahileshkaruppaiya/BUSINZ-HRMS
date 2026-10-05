import { LoanPolicy } from '../types/settings';
import { LoanRecord } from '../types/hrms';

export const DEFAULT_LOAN_POLICIES: LoanPolicy[] = [
  {
    id: 'POL-ADV-DEFAULT',
    policyName: 'Advance Salary',
    policyType: 'Advance Salary',
    description: 'Default advance salary policy for employee self-service requests.',
    applicableEmployees: 'ALL',
    applicableDepartments: 'ALL',
    applicableBranches: 'ALL',
    effectiveFrom: '2026-01-01',
    status: 'Active',
    minimumEmploymentMonths: 1,
    minLoanAmount: 1000,
    maxLoanAmount: 50000,
    maxSalaryPercent: 100,
    maxLoanLimitType: 'PERCENTAGE_SALARY',
    maxLoanLimitValue: 100,
    requestLimit: 'NO_LIMIT',
    allowPreviousPending: false,
    maxActiveLoans: 1,
    repaymentType: 'MONTHLY_EMI',
    minRepaymentMonths: 1,
    maxRepaymentMonths: 3,
    deductionStart: 'NEXT_MONTH',
    deductionStartRule: 'NEXT_PAYROLL_CYCLE',
    approvalBy: 'HR_OR_CEO',
    approvalWorkflow: 'HR_OR_CEO',
    reasonRequired: true,
    lowSalaryRule: 'REQUIRE_HR_REVIEW',
    payslipVisibility: 'DETAILED',
    createdAt: '2026-01-01 00:00',
    createdBy: 'System',
    updatedAt: '2026-01-01 00:00',
    updatedBy: 'System'
  }
];

export const INITIAL_LOAN_RECORDS: LoanRecord[] = [];
