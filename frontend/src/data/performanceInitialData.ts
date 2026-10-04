import {
  BenchmarkConfig,
  ProductIncentiveRule,
  IncentiveSplit,
  KpiWeights,
  EmployeePerformanceDetail,
  DepartmentPerformanceDetail,
  DepartmentPerformanceTemplate,
  PipRecord,
  GoalItem,
  PerformanceReviewRecord,
  PerformanceSettingsConfig,
  CompanyDepartment,
  KpiItem,
  KraItem
} from '../types/performance';

// 1. Overall Team Sales Benchmark (Clean Slate)
export const BENCHMARK_CONFIG: BenchmarkConfig = {
  monthlyBenchmarkAmount: 0,
  currentAchievedAmount: 0,
  benchmarkPeriod: 'Current Cycle',
  lastMonthAchieved: 0
};

// 2. Product Incentive Rules (Clean Slate)
export const PRODUCT_INCENTIVE_RULES: ProductIncentiveRule[] = [];

// 3. Incentive Split Formula
export const INCENTIVE_SPLIT: IncentiveSplit = {
  salespersonShare: 50.0,
  techSupportManagerShare: 20.0,
  supportPoolShare: 30.0
};

// 4. KPI Weights Configuration
export const KPI_WEIGHTS: KpiWeights = {
  attendancePoints: 5.0,
  feedbackQualityPoints: 20.0,
  newCustomerPoints: 20.0,
  invoicePoints: 20.0,
  fullBosKitsSupply: 35.0
};

// 5. Department KRA & KPI Templates (Clean Slate)
export const DEPARTMENT_TEMPLATES: DepartmentPerformanceTemplate[] = [];

// Helper to compute incentive
export function calculateEmployeeIncentive(
  roleCategory: EmployeePerformanceDetail['roleCategory'],
  mmsSales: number,
  bosSales: number
): { incentiveAmount: number; sharePercent: number } {
  if (PRODUCT_INCENTIVE_RULES.length < 2) {
    return { incentiveAmount: 0, sharePercent: 0 };
  }
  const mmsIncentivePool = mmsSales * (PRODUCT_INCENTIVE_RULES[0].ratePercentage / 100);
  const bosIncentivePool = bosSales * (PRODUCT_INCENTIVE_RULES[1].ratePercentage / 100);
  const totalPool = mmsIncentivePool + bosIncentivePool;

  if (roleCategory === 'Sales') {
    return {
      incentiveAmount: Math.round(totalPool * (INCENTIVE_SPLIT.salespersonShare / 100)),
      sharePercent: INCENTIVE_SPLIT.salespersonShare
    };
  } else if (roleCategory === 'Tech Support' || roleCategory === 'Management') {
    return {
      incentiveAmount: Math.round(totalPool * (INCENTIVE_SPLIT.techSupportManagerShare / 100)),
      sharePercent: INCENTIVE_SPLIT.techSupportManagerShare
    };
  } else {
    return {
      incentiveAmount: Math.round(totalPool * (INCENTIVE_SPLIT.supportPoolShare / 100) * 0.25),
      sharePercent: INCENTIVE_SPLIT.supportPoolShare
    };
  }
}

// 6. Detailed Employee Performance Records (Clean Slate)
export const INITIAL_EMPLOYEE_PERFORMANCE: EmployeePerformanceDetail[] = [];

// 7. Department Performance Summary Records (Clean Slate)
export const INITIAL_DEPARTMENT_PERFORMANCE: DepartmentPerformanceDetail[] = [];

// 8. Individual Goals & Objectives (Clean Slate)
export const INITIAL_GOALS: GoalItem[] = [];

// 9. Performance Appraisal Reviews (Clean Slate)
export const INITIAL_REVIEWS: PerformanceReviewRecord[] = [];

// 10. Performance Improvement Plans (PIP) (Clean Slate)
export const INITIAL_PIP_RECORDS: PipRecord[] = [];

// 11. Performance Settings Configuration
export const INITIAL_PERFORMANCE_SETTINGS: PerformanceSettingsConfig = {
  general: {
    currentCycle: 'Quarterly',
    ratingScale: '1-5 Stars',
    scoreCalculation: 'Weighted Average',
    minimumPassingScore: 70,
    exceptionalThreshold: 90
  },
  kraSettings: {
    defaultKraWeightage: 30,
    maxKrasPerEmployee: 6,
    allowEmployeeKraProposal: true
  },
  kpiSettings: {
    calculationMethod: 'Linear Metric Achievement',
    targetTypes: ['Percentage (%)', 'Monetary Value (₹)', 'Numeric Count', 'Hours / Time']
  },
  reviewSettings: {
    reviewFrequency: 'Quarterly',
    reviewerRules: 'Direct Manager + HR Approval',
    approvalWorkflow: 'Multi-tier HR + CEO Approval'
  },
  pipSettings: {
    defaultDurationDays: 60,
    reviewFrequency: 'Weekly',
    escalationRules: 'If progress < 50% after 30 days, mandatory HR review meeting'
  },
  attendanceTaskIntegration: {
    enableAttendanceImpact: true,
    attendanceWeight: 10,
    enableTaskImpact: true,
    taskWeight: 15,
    kraWeight: 35,
    kpiWeight: 25,
    goalsWeight: 15
  }
};
