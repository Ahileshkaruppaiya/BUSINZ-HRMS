// VRM Enterprise HRM - Initial Settings & Policy Configuration Data
import { 
  CompanyInfo, 
  CompanyBranch, 
  OrganizationStructure, 
  AttendancePolicy, 
  AttendanceCorrectionRequest,
  MasterLeavePolicy, 
  PayrollSettingsConfig, 
  RewardPolicy, 
  EmployeeRewardRecord,
  PolicyAuditLog 
} from '../types/settings';

export const INITIAL_COMPANY_INFO: CompanyInfo = {
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
  createdAt: new Date().toISOString(),
  createdBy: '',
  updatedAt: new Date().toISOString(),
  updatedBy: ''
};

export const INITIAL_COMPANY_BRANCHES: CompanyBranch[] = [];

export const INITIAL_ORG_STRUCTURE: OrganizationStructure = {
  departments: ['CEO', 'HR', 'Accounts', 'Operations', 'Sales & Marketing', 'IT & Engineering'],
  designations: [],
  employmentTypes: ['Full-Time Regular', 'Contractual Basis', 'Probationary', 'Internship'],
  workLocations: ['Main Head Office', 'Branch Office 1'],
  reportingManagers: [],
  teams: []
};

export const DEFAULT_MASTER_ATTENDANCE_POLICIES: AttendancePolicy[] = [];

export const INITIAL_ATTENDANCE_CORRECTIONS: AttendanceCorrectionRequest[] = [];

export const DEFAULT_MASTER_LEAVE_POLICIES: MasterLeavePolicy[] = [];

export const INITIAL_PAYROLL_CONFIG: PayrollSettingsConfig = {
  components: [],

  pfPolicy: {
    active: false,
    calculationType: 'PERCENTAGE',
    percentage: 0,
    calculationBase: 'BASIC',
    formula: '',
    effectiveDate: '',
    version: 1
  },

  esicPolicy: {
    active: false,
    percentage: 0,
    grossSalaryLimit: 0,
    formula: '',
    effectiveDate: '',
    version: 1
  },

  incrementPolicy: {
    active: false,
    cycle: '',
    effectiveMonth: 'April',
    standardBaseIncrement: 0,
    allowManagerRecommendation: false,
    slabs: []
  },

  standardWorkingDaysPerMonth: 26,
  payrollCycleDay: 1,
  enableProfessionalTax: false,
  standardPtAmount: 0,
  updatedAt: new Date().toISOString(),
  updatedBy: ''
};

export const INITIAL_REWARD_POLICIES: RewardPolicy[] = [];

export const INITIAL_EMPLOYEE_REWARDS: EmployeeRewardRecord[] = [];

export const INITIAL_POLICY_AUDIT_LOGS: PolicyAuditLog[] = [];
