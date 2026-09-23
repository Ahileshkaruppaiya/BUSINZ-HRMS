import { 
  TaskItemEnhanced, 
  MOMMeeting, 
  TaskMasterItem, 
  TaskEscalationRule, 
  TaskPerformanceWeights 
} from '../types/tasks';

export const INITIAL_ENHANCED_TASKS: TaskItemEnhanced[] = [];

export const INITIAL_MOM_MEETINGS: MOMMeeting[] = [];

export const INITIAL_TASK_MASTERS: TaskMasterItem[] = [
  // Task Categories
  { id: 'MST-CAT-01', type: 'TaskCategory', name: 'Compliance & Audit', code: 'Compliance', color: '#dc2626', order: 1, isActive: true },
  { id: 'MST-CAT-02', type: 'TaskCategory', name: 'Technical & Engineering', code: 'Technical', color: '#2563eb', order: 2, isActive: true },
  { id: 'MST-CAT-03', type: 'TaskCategory', name: 'Operations & Facilities', code: 'Operations', color: '#059669', order: 3, isActive: true },
  { id: 'MST-CAT-04', type: 'TaskCategory', name: 'Strategic Initiatives', code: 'Strategy', color: '#7c3aed', order: 4, isActive: true },
  { id: 'MST-CAT-05', type: 'TaskCategory', name: 'Human Resources & Welfare', code: 'HR', color: '#db2777', order: 5, isActive: true },

  // Priorities
  { id: 'MST-PRI-01', type: 'Priority', name: 'Urgent / Critical', code: 'Urgent', color: '#ef4444', order: 1, isActive: true },
  { id: 'MST-PRI-02', type: 'Priority', name: 'High Priority', code: 'High', color: '#f97316', order: 2, isActive: true },
  { id: 'MST-PRI-03', type: 'Priority', name: 'Medium Priority', code: 'Medium', color: '#3b82f6', order: 3, isActive: true },
  { id: 'MST-PRI-04', type: 'Priority', name: 'Low Priority', code: 'Low', color: '#64748b', order: 4, isActive: true },

  // Task Statuses
  { id: 'MST-STA-01', type: 'TaskStatus', name: 'Open / Not Started', code: 'OPEN', color: '#64748b', order: 1, isActive: true },
  { id: 'MST-STA-02', type: 'TaskStatus', name: 'In Progress', code: 'IN PROGRESS', color: '#2563eb', order: 2, isActive: true },
  { id: 'MST-STA-03', type: 'TaskStatus', name: 'Partially Completed', code: 'PARTIALLY COMPLETED', color: '#d97706', order: 3, isActive: true },
  { id: 'MST-STA-04', type: 'TaskStatus', name: 'Completed (All Done)', code: 'COMPLETED', color: '#16a34a', order: 4, isActive: true },
  { id: 'MST-STA-05', type: 'TaskStatus', name: 'Closed & Verified', code: 'CLOSED', color: '#0f766e', order: 5, isActive: true },
  { id: 'MST-STA-06', type: 'TaskStatus', name: 'Overdue', code: 'OVERDUE', color: '#dc2626', order: 6, isActive: true },

  // Due Statuses
  { id: 'MST-DUE-01', type: 'DueStatus', name: 'On Track', code: 'On Track', color: '#10b981', order: 1, isActive: true },
  { id: 'MST-DUE-02', type: 'DueStatus', name: 'Due Tomorrow', code: 'Due Tomorrow', color: '#f59e0b', order: 2, isActive: true },
  { id: 'MST-DUE-03', type: 'DueStatus', name: 'Due Today', code: 'Due Today', color: '#f97316', order: 3, isActive: true },
  { id: 'MST-DUE-04', type: 'DueStatus', name: 'Overdue', code: 'Overdue', color: '#ef4444', order: 4, isActive: true },

  // Reason For Delay
  { id: 'MST-DEL-01', type: 'ReasonForDelay', name: 'Awaiting Dependency from Another Dept', code: 'DEP_BLOCK', color: '#f59e0b', order: 1, isActive: true },
  { id: 'MST-DEL-02', type: 'ReasonForDelay', name: 'Third-Party Vendor Delay', code: 'VENDOR_DELAY', color: '#f59e0b', order: 2, isActive: true },
  { id: 'MST-DEL-03', type: 'ReasonForDelay', name: 'Technical Infrastructure Impediment', code: 'INFRA_ISSUE', color: '#ef4444', order: 3, isActive: true },
  { id: 'MST-DEL-04', type: 'ReasonForDelay', name: 'Staff On Leave / Reduced Capacity', code: 'LEAVE_ABSENCE', color: '#64748b', order: 4, isActive: true }
];

export const INITIAL_ESCALATION_RULES: TaskEscalationRule[] = [
  {
    id: 'ESC-01',
    level: 1,
    triggerEvent: 'Overdue',
    triggerDelayHours: 0, // Immediately upon becoming overdue
    notifyRoles: ['Assignee', 'Responsible Person'],
    escalationAction: 'Send urgent in-app alert and tag task as Overdue',
    isActive: true
  },
  {
    id: 'ESC-02',
    level: 2,
    triggerEvent: 'Overdue',
    triggerDelayHours: 24, // 24 hours overdue
    notifyRoles: ['Responsible Person', 'Manager'],
    escalationAction: 'Alert Department Head and raise task priority level',
    isActive: true
  },
  {
    id: 'ESC-03',
    level: 3,
    triggerEvent: 'Overdue',
    triggerDelayHours: 48, // 48 hours overdue
    notifyRoles: ['Department Head', 'Management'],
    escalationAction: 'Flag on Executive Task Dashboard as High-Risk Bottleneck',
    isActive: true
  },
  {
    id: 'ESC-04',
    level: 1,
    triggerEvent: 'NoUpdate',
    triggerDelayHours: 72, // 3 days with no assignee progress or comment
    notifyRoles: ['Assignee', 'Responsible Person'],
    escalationAction: 'Send automated reminder to update status',
    isActive: true
  }
];

export const INITIAL_TASK_WEIGHTS: TaskPerformanceWeights = {
  taskCompletionWeight: 40,
  onTimeCompletionWeight: 25,
  attendanceWeight: 15,
  managerRatingWeight: 10,
  goalAchievementWeight: 10
};
