// VRM Enterprise HRM - Performance, KRA, KPI, Goals & PIP Types

export type CompanyDepartment = 
  | 'HR'
  | 'Sales'
  | 'Accounts'
  | 'Procurement'
  | 'Dispatch'
  | 'Design'
  | 'Finance'
  | 'Technical Support';

export interface BenchmarkConfig {
  monthlyBenchmarkAmount: number;     // e.g. 60,00,000 (₹6 Crores)
  currentAchievedAmount: number;      // e.g. ₹5,42,00,000
  benchmarkPeriod: string;            // e.g. 'September 2026'
  lastMonthAchieved: number;
}

export interface ProductIncentiveRule {
  id: string;
  productName: 'Module Mounting Structures' | 'Balance of System' | string;
  benchmarkAmount: number;            // e.g. ₹50,00,000 or ₹1,00,00,000
  ratePercentage: number;             // e.g. 0.7% or 0.3%
  description?: string;
}

export interface IncentiveSplit {
  salespersonShare: number;           // 50.0%
  techSupportManagerShare: number;    // 20.0%
  supportPoolShare: number;           // 30.0%
}

export interface KpiWeights {
  attendancePoints: number;           // 5.0
  feedbackQualityPoints: number;      // 20.0
  newCustomerPoints: number;          // 20.0
  invoicePoints: number;              // 20.0
  fullBosKitsSupply: number;          // 35.0
}

export interface EmployeeKpiBreakdown {
  attendanceScore: number;            // max 5.0
  attendancePercent: number;          // e.g. 98%
  feedbackQualityScore: number;       // max 20.0
  feedbackRating: number;             // e.g. 4.8 / 5.0
  newCustomerScore: number;           // max 20.0
  newCustomersCount: number;          // e.g. 8 accounts
  invoiceScore: number;               // max 20.0
  invoiceClearanceRate: number;       // e.g. 95%
  fullBosKitsSupplyScore: number;     // max 35.0
  bosKitsSuppliedCount: number;       // e.g. 42 full kits
}

export interface KraItem {
  id: string;
  title: string;
  description: string;
  department?: CompanyDepartment | string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  weightage: number;                  // percentage (e.g. 25%)
  targetMetric: string;               // e.g. '₹1.5 Cr Order Booking' or '100 Tickets'
  achievedMetric: string;             // e.g. '₹1.62 Cr (108%)' or '92'
  achievementPercentage?: number;     // 0 - 100
  progressPercentage?: number;        // 0 - 100
  score?: number;                     // 0 - 100
  reviewPeriod?: string;              // 'Q3 2026' or 'Monthly'
  status: 'Exceeded' | 'On Track' | 'At Risk' | 'Behind' | 'Completed' | 'Good';
  isArchived?: boolean;
}

export interface KpiItem {
  id: string;
  title: string;
  department: CompanyDepartment | string;
  target: string;
  actual: string;
  achievementPercentage: number;
  weightage: number;
  score: number;
  unit?: string;
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  period?: string;
}

export interface GoalItem {
  id: string;
  goalName: string;
  description: string;
  employeeId: string;
  employeeName: string;
  department: CompanyDepartment | string;
  startDate: string;
  dueDate: string;
  targetMetric: string;
  currentProgress: number; // 0 - 100
  weightage: number;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Overdue';
  approvedBy?: string;
  reviewNotes?: string;
}

export type ReviewCycleType = 'Monthly' | 'Quarterly' | 'Half-Yearly' | 'Yearly';

export interface PerformanceReviewRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: CompanyDepartment | string;
  designation: string;
  reviewPeriod: ReviewCycleType;
  reviewPeriodLabel: string; // e.g. 'Q3 2026' or 'August 2026'
  reviewerName: string;
  reviewerRole: string;
  reviewDate: string;
  
  // Evaluation Scores
  kraScore: number;
  kpiScore: number;
  goalScore: number;
  taskPerformance: number;
  attendanceImpact: number;
  overallScore: number;
  
  // Rating 1 - 5
  rating: 1 | 2 | 3 | 4 | 5;
  ratingLabel: 'Poor' | 'Needs Improvement' | 'Meets Expectations' | 'Exceeds Expectations' | 'Outstanding';
  
  // Qualitative Feedback
  strengths: string[];
  areasForImprovement: string[];
  managerComments: string;
  hrComments: string;
  finalComments: string;
  status: 'Draft' | 'Submitted' | 'Approved' | 'Completed';
}

export interface PipMilestone {
  id: string;
  title: string;
  targetDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
  notes?: string;
}

export type PipStatus = 
  | 'Draft'
  | 'Active' 
  | 'Under Review' 
  | 'Successfully Completed' 
  | 'Extended' 
  | 'Failed' 
  | 'Closed';

export interface PipRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: CompanyDepartment | string;
  designation: string;
  initiatorName: string;
  mentorName: string;
  assignedReviewer: string;
  startDate: string;
  targetEndDate: string;
  durationDays: 30 | 60 | 90 | number;
  
  // Five Core Clear Questions
  reason: string;
  performanceIssue: string;    // What is the problem?
  improvementArea: string;     // What should improve?
  expectedTarget: string;      // What is the target?
  supportRequired: string;     // What support is provided?
  actionPlan: string;
  reviewFrequency: 'Weekly' | 'Bi-Weekly' | 'Monthly'; // When will it be reviewed?
  
  focusAreas: string[];
  milestones: PipMilestone[];
  status: PipStatus;
  progressPercentage: number;
  reviewNotes: string;
}

export interface AttendanceImpactSummary {
  attendancePercent: number;
  lateDays: number;
  absentDays: number;
  leaveDays: number;
  overtimeHours: number;
}

export interface TaskPerformanceSummary {
  tasksAssigned: number;
  tasksCompleted: number;
  completionRate: number;
  overdueTasks: number;
}

export interface EmployeePerformanceDetail {
  id: string;
  employeeId: string;
  employeeName: string;
  department: CompanyDepartment | string;
  designation: string;
  avatar?: string;
  reportingManager: string;
  roleCategory: 'Sales' | 'Tech Support' | 'Management' | 'Operations' | 'Support Pool';
  
  // Overall Scoring
  overallScore: number;               // 0 - 100
  performanceGrade: 'Exceptional' | 'Exceeds Expectations' | 'Meets Expectations' | 'Needs Improvement' | 'Critical / PIP';
  performanceStatus: 'Outstanding' | 'Good Performance' | 'Average' | 'Needs Improvement' | 'Critical / PIP';
  
  // Breakdown
  kraScore: number;                   // e.g. 88%
  kpiScore: number;                   // e.g. 84%
  goalScore: number;                  // e.g. 86%
  taskScore: number;                  // e.g. 90%
  attendanceScore: number;            // e.g. 95%
  
  // 5 KPIs from spreadsheet
  kpiBreakdown: EmployeeKpiBreakdown;
  
  // Integrated Attendance & Task Summaries
  attendanceImpact: AttendanceImpactSummary;
  taskPerformance: TaskPerformanceSummary;
  
  // Solar Sales Contribution (if applicable)
  mmsSalesAmount: number;
  bosSalesAmount: number;
  totalSalesAchieved: number;
  
  // Calculated Incentive Payout
  calculatedIncentive: number;
  incentiveRoleShare: number;
  incentiveStatus: 'Eligible' | 'Paid' | 'Processing' | 'Not Applicable';
  
  // KRAs & KPIs
  kras: KraItem[];
  kpis?: KpiItem[];
  
  // Goals
  goals?: GoalItem[];
  
  // PIP link
  hasActivePip: boolean;
  activePipId?: string;
  
  // History & Appraisal
  monthlyHistory: { month: string; score: number }[];
  managerAppraisalNotes: string;
  lastEvaluationDate: string;
}

export interface DepartmentPerformanceDetail {
  id: string;
  departmentName: CompanyDepartment | string;
  headcount: number;
  headName: string;
  avgOverallScore: number;
  avgKpiScore: number;
  avgKraScore: number;
  goalCompletionRate: number;
  attendanceImpactScore: number;
  taskCompletionRate: number;
  reviewStatus: 'Up to Date' | 'Pending Reviews' | 'Action Required';
  pipCount: number;
  
  // Solar/Sales targets if applicable
  salesTargetAmount?: number;
  salesAchievedAmount?: number;
  salesAchievementPercent?: number;
  totalIncentiveGenerated: number;
  supportPoolAllocation: number;
  
  topPerformerName: string;
  topPerformerScore: number;
  improvementNeededCount: number;
  
  avgKpiScores: {
    attendance: number;
    feedback: number;
    newCustomers: number;
    invoicing: number;
    bosKits: number;
  };
}

export interface DepartmentKpiTemplate {
  title: string;
  target: string;
  weightage: number;
  unit: string;
}

export interface DepartmentKraTemplate {
  title: string;
  description: string;
  weightage: number;
  targetMetric: string;
}

export interface DepartmentPerformanceTemplate {
  department: CompanyDepartment;
  kras: DepartmentKraTemplate[];
  kpis: DepartmentKpiTemplate[];
}

export interface PerformanceSettingsConfig {
  general: {
    currentCycle: ReviewCycleType;
    ratingScale: '1-5 Stars' | '1-10 Scale' | 'Percentage (0-100%)';
    scoreCalculation: 'Weighted Average' | 'Sum Total' | 'Balanced Scorecard';
    minimumPassingScore: number;
    exceptionalThreshold: number;
  };
  kraSettings: {
    defaultKraWeightage: number;
    maxKrasPerEmployee: number;
    allowEmployeeKraProposal: boolean;
  };
  kpiSettings: {
    calculationMethod: 'Linear Metric Achievement' | 'Capped at 100%' | 'Step Scale';
    targetTypes: string[];
  };
  reviewSettings: {
    reviewFrequency: ReviewCycleType;
    reviewerRules: 'Direct Manager + HR Approval' | 'Manager Only' | 'Peer 360 Review';
    approvalWorkflow: 'Single Step' | 'Multi-tier HR + CEO Approval';
  };
  pipSettings: {
    defaultDurationDays: number;
    reviewFrequency: 'Weekly' | 'Bi-Weekly' | 'Monthly';
    escalationRules: string;
  };
  attendanceTaskIntegration: {
    enableAttendanceImpact: boolean;
    attendanceWeight: number; // percentage in overall score
    enableTaskImpact: boolean;
    taskWeight: number;       // percentage in overall score
    kraWeight: number;
    kpiWeight: number;
    goalsWeight: number;
  };
}

export interface EvaluationFormData {
  employeeId: string;
  attendancePercent: number;
  feedbackRating: number;
  newCustomersCount: number;
  invoiceClearanceRate: number;
  bosKitsSuppliedCount: number;
  mmsSalesAmount: number;
  bosSalesAmount: number;
  managerAppraisalNotes: string;
  flagForPip: boolean;
  pipReason?: string;
}
