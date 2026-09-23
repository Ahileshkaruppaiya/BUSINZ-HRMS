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

// 1. Overall Team Sales Benchmark
export const BENCHMARK_CONFIG: BenchmarkConfig = {
  monthlyBenchmarkAmount: 60000000, // ₹6,00,00,000 (₹6 Crores)
  currentAchievedAmount: 0,
  benchmarkPeriod: 'Current Cycle',
  lastMonthAchieved: 0
};

// 2. Product Incentive Rules
export const PRODUCT_INCENTIVE_RULES: ProductIncentiveRule[] = [
  {
    id: 'PIR-01',
    productName: 'Module Mounting Structures',
    benchmarkAmount: 5000000,       // ₹50,00,000
    ratePercentage: 0.7,            // 0.7%
    description: 'Hot-dip galvanized solar ground and rooftop mounting structure channels'
  },
  {
    id: 'PIR-02',
    productName: 'Balance of System',
    benchmarkAmount: 10000000,      // ₹1,00,00,000
    ratePercentage: 0.3,            // 0.3%
    description: 'Solar BOS electrical balance of system kits, combiner boxes, cabling & fasteners'
  }
];

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

// 5. 8 Realistic Department KRA & KPI Templates
export const DEPARTMENT_TEMPLATES: DepartmentPerformanceTemplate[] = [
  {
    department: 'HR',
    kras: [
      { title: 'Employee Management', description: 'Maintain employee lifecycle records, compliance & query resolutions', weightage: 25, targetMetric: '100% Policy Compliance' },
      { title: 'Recruitment', description: 'Timely hiring of engineering, sales, and plant personnel within budget', weightage: 25, targetMetric: 'Avg Time-to-Hire < 25 Days' },
      { title: 'Attendance & Leave', description: 'Punctuality governance, biometric sync, and leave policy oversight', weightage: 20, targetMetric: '99% Attendance Accuracy' },
      { title: 'Employee Engagement', description: 'Organize quarterly wellness, awards, training & team feedback sessions', weightage: 15, targetMetric: '4.5/5 Satisfaction Score' },
      { title: 'HR Operations', description: 'Payroll coordination, statutory compliance, insurance & onboarding', weightage: 15, targetMetric: 'Zero Audit Non-conformances' }
    ],
    kpis: [
      { title: 'Recruitment Completion', target: '100%', weightage: 25, unit: '%' },
      { title: 'Employee Onboarding Completion', target: '100%', weightage: 20, unit: '%' },
      { title: 'Attendance Accuracy', target: '99%', weightage: 20, unit: '%' },
      { title: 'Leave Processing Time', target: '< 24 Hours', weightage: 20, unit: 'hrs' },
      { title: 'Employee Issue Resolution', target: '95%', weightage: 15, unit: '%' }
    ]
  },
  {
    department: 'Sales',
    kras: [
      { title: 'Sales Target', description: 'Achieve monthly and quarterly booking quota for MMS & BOS systems', weightage: 35, targetMetric: '₹80 Lakhs Quota' },
      { title: 'Customer Acquisition', description: 'Identify and convert tier-1 rooftop solar EPCs and contractors', weightage: 25, targetMetric: '8 New EPC Accounts' },
      { title: 'Revenue Growth', description: 'Upsell complete BOS packages with structure channel deliveries', weightage: 20, targetMetric: '35 Full BOS Bundles' },
      { title: 'Customer Relationship', description: 'Nurture client loyalty, rapid quotation turnarounds & repeat deals', weightage: 20, targetMetric: '90% Repeat Retention' }
    ],
    kpis: [
      { title: 'Monthly Sales Target', target: '₹80,00,000', weightage: 30, unit: '₹' },
      { title: 'New Customers', target: '8 Accounts', weightage: 25, unit: 'qty' },
      { title: 'Conversion Rate', target: '25%', weightage: 15, unit: '%' },
      { title: 'Revenue Generated', target: '₹95,00,000', weightage: 20, unit: '₹' },
      { title: 'Follow-up Completion', target: '95%', weightage: 10, unit: '%' }
    ]
  },
  {
    department: 'Accounts',
    kras: [
      { title: 'Accounting Accuracy', description: 'Ledger reconciliations, daily vouchers, and GST/TDS filings', weightage: 30, targetMetric: '100% Error-free Books' },
      { title: 'Invoice Management', description: 'Generate client dispatch invoices and verify purchase receipts', weightage: 25, targetMetric: '< 24hr Invoice Issuance' },
      { title: 'Receivables', description: 'DSO recovery from solar EPCs and milestone payment collections', weightage: 25, targetMetric: '95% Recovery Rate' },
      { title: 'Payables', description: 'Vendor disbursements, freight settlements, and cash discount optimization', weightage: 20, targetMetric: 'On-time Vendor Payouts' }
    ],
    kpis: [
      { title: 'Invoice Accuracy', target: '99.5%', weightage: 25, unit: '%' },
      { title: 'Payment Processing', target: '98%', weightage: 25, unit: '%' },
      { title: 'Reconciliation Completion', target: '100%', weightage: 25, unit: '%' },
      { title: 'Error Rate', target: '< 0.5%', weightage: 15, unit: '%' },
      { title: 'On-time Reporting', target: '100%', weightage: 10, unit: '%' }
    ]
  },
  {
    department: 'Procurement',
    kras: [
      { title: 'Vendor Management', description: 'Evaluate coil suppliers, galvanizers, and fastner manufacturers', weightage: 25, targetMetric: 'Avg 92% Vendor SLA' },
      { title: 'Purchase Management', description: 'Issue POs with optimal lead-time and transparent commercial terms', weightage: 25, targetMetric: '< 48h PO Turnaround' },
      { title: 'Cost Optimization', description: 'Negotiate volume rates on HR coils and stainless steel hardware', weightage: 25, targetMetric: '5% Annual Savings' },
      { title: 'Material Availability', description: 'Zero raw material stockouts in roll-forming and cutting lines', weightage: 25, targetMetric: 'Zero Production Stoppage' }
    ],
    kpis: [
      { title: 'Purchase Order Completion', target: '95%', weightage: 25, unit: '%' },
      { title: 'Vendor Delivery Performance', target: '92%', weightage: 25, unit: '%' },
      { title: 'Cost Savings', target: '5%', weightage: 20, unit: '%' },
      { title: 'Purchase Accuracy', target: '98%', weightage: 15, unit: '%' },
      { title: 'On-time Procurement', target: '94%', weightage: 15, unit: '%' }
    ]
  },
  {
    department: 'Dispatch',
    kras: [
      { title: 'Order Dispatch', description: 'Load-out planning, truck allotment, and dock management', weightage: 30, targetMetric: '100% Scheduled Outflow' },
      { title: 'Delivery Coordination', description: 'In-transit vehicle tracking and site coordination with EPC engineers', weightage: 25, targetMetric: '< 1% In-transit Delay' },
      { title: 'Accuracy', description: 'Zero short-shipments of fasteners, clamps, and channel accessories', weightage: 25, targetMetric: '99.8% Packing Accuracy' },
      { title: 'Timeliness', description: 'Dispatch milestone clearance matching delivery promises', weightage: 20, targetMetric: 'Zero Delivery Penalties' }
    ],
    kpis: [
      { title: 'On-time Dispatch', target: '98%', weightage: 30, unit: '%' },
      { title: 'Dispatch Accuracy', target: '99.5%', weightage: 30, unit: '%' },
      { title: 'Order Processing Time', target: '< 3 Hours', weightage: 20, unit: 'hrs' },
      { title: 'Delivery Issue Rate', target: '< 1%', weightage: 20, unit: '%' }
    ]
  },
  {
    department: 'Design',
    kras: [
      { title: 'Design Quality', description: 'Structural wind-load calculations, STAAD-Pro simulations & 3D models', weightage: 30, targetMetric: 'Zero Structural Failures' },
      { title: 'Creative Output', description: 'Deliver complete fabrication drawings, BOMs and sales proposal layouts', weightage: 25, targetMetric: '50 Project Layouts / Month' },
      { title: 'Timeliness', description: 'Fast turnaround on customized rooftop structure layout drafts', weightage: 25, targetMetric: '< 24hr Standard Layouts' },
      { title: 'Brand Compliance', description: 'Consistent drawing borders, technical datasheets & catalog updates', weightage: 20, targetMetric: '100% Standard Template' }
    ],
    kpis: [
      { title: 'Design Completion', target: '96%', weightage: 25, unit: '%' },
      { title: 'Revision Rate', target: '< 10%', weightage: 25, unit: '%' },
      { title: 'On-time Delivery', target: '95%', weightage: 20, unit: '%' },
      { title: 'Quality Rating', target: '4.8 / 5.0', weightage: 15, unit: 'pts' },
      { title: 'Creative Consistency', target: '98%', weightage: 15, unit: '%' }
    ]
  },
  {
    department: 'Finance',
    kras: [
      { title: 'Financial Reporting', description: 'Prepare P&L, balance sheets, cashflow statements & statutory MIS', weightage: 30, targetMetric: '3rd of Month Closing' },
      { title: 'Budget Management', description: 'Departmental budget variance monitoring and capex expenditure audit', weightage: 25, targetMetric: '< 3% Budget Variance' },
      { title: 'Cash Flow', description: 'Working capital financing, LC management, and banking lines', weightage: 25, targetMetric: 'Positive Working Capital' },
      { title: 'Compliance', description: 'Direct/Indirect taxation, company law compliance and external audit', weightage: 20, targetMetric: '100% Compliant' }
    ],
    kpis: [
      { title: 'Report Accuracy', target: '99.8%', weightage: 25, unit: '%' },
      { title: 'Budget Variance', target: '< 3%', weightage: 25, unit: '%' },
      { title: 'Payment Processing', target: '97%', weightage: 20, unit: '%' },
      { title: 'Financial Closing', target: 'By 3rd of Month', weightage: 15, unit: 'day' },
      { title: 'Compliance Completion', target: '100%', weightage: 15, unit: '%' }
    ]
  },
  {
    department: 'Technical Support',
    kras: [
      { title: 'Ticket Resolution', description: 'Solve field installation doubts, structural questions & torque specs', weightage: 30, targetMetric: '120 Tickets Closed / Mo' },
      { title: 'Customer Support', description: 'Field site visits, commissioning guidance, and pre-sales engineering', weightage: 25, targetMetric: '4.8/5 CSAT Score' },
      { title: 'Technical Quality', description: 'Provide accurate engineering troubleshooting and installation SOPs', weightage: 25, targetMetric: 'Zero Misalignment Rework' },
      { title: 'Response Time', description: 'Maintain rapid response SLA on WhatsApp and portal helpdesk', weightage: 20, targetMetric: '< 15 Mins First Response' }
    ],
    kpis: [
      { title: 'Tickets Resolved', target: '120 Tickets', weightage: 30, unit: 'qty' },
      { title: 'First Response Time', target: '< 15 Mins', weightage: 25, unit: 'min' },
      { title: 'Resolution Time', target: '< 4 Hours', weightage: 20, unit: 'hrs' },
      { title: 'Customer Satisfaction', target: '4.8 / 5.0', weightage: 15, unit: 'pts' },
      { title: 'Escalation Rate', target: '< 2%', weightage: 10, unit: '%' }
    ]
  }
];

// Helper to compute incentive
export function calculateEmployeeIncentive(
  roleCategory: EmployeePerformanceDetail['roleCategory'],
  mmsSales: number,
  bosSales: number
): { incentiveAmount: number; sharePercent: number } {
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
