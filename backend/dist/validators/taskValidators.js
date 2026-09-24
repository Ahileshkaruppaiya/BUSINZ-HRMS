import { z } from 'zod';
export const createTaskSchema = z.object({
    title: z.string().min(1, 'Task title is required').max(255).trim(),
    assigneeId: z.string().min(1, 'Assignee is required').trim(),
    dueDate: z.string().min(1, 'Due date is required'),
    startDate: z.string().optional(),
    priority: z.enum(['Low', 'Normal', 'High', 'Urgent']).default('Normal'),
    taskCategory: z.string().default('General'),
    description: z.string().optional(),
    estimatedHours: z.number().min(0).max(1000).optional(),
    checklists: z.array(z.string().min(1)).optional(),
    attachments: z.array(z.object({
        fileName: z.string().min(1),
        fileUrl: z.string().min(1),
        fileType: z.string().optional(),
        fileSize: z.string().optional(),
    })).optional(),
    pastDueDateConfirmed: z.boolean().optional(),
}).refine(data => {
    if (data.startDate && data.dueDate) {
        const start = new Date(data.startDate);
        const due = new Date(data.dueDate);
        if (!isNaN(start.getTime()) && !isNaN(due.getTime())) {
            return due >= start;
        }
    }
    return true;
}, {
    message: 'Due date cannot be earlier than start date',
    path: ['dueDate'],
});
export const updateTaskStatusSchema = z.object({
    status: z.enum(['To Do', 'In Progress', 'On Hold', 'Completed', 'Cancelled']),
    progress: z.number().min(0).max(100).optional(),
    blockerReason: z.string().optional(),
    completionSummary: z.string().optional(),
    cancellationReason: z.string().optional(),
    reopenReason: z.string().optional(),
    expectedVersion: z.number().int().positive().optional(),
    unfinishedChecklistAcknowledged: z.boolean().optional(),
}).refine(data => {
    if (data.status === 'On Hold' && (!data.blockerReason || data.blockerReason.trim().length === 0)) {
        return false;
    }
    return true;
}, {
    message: 'Blocker reason is required when putting a task on hold',
    path: ['blockerReason'],
}).refine(data => {
    if (data.status === 'Completed' && (!data.completionSummary || data.completionSummary.trim().length === 0)) {
        return false;
    }
    return true;
}, {
    message: 'Completion summary is required when marking a task completed',
    path: ['completionSummary'],
}).refine(data => {
    if (data.status === 'Cancelled' && (!data.cancellationReason || data.cancellationReason.trim().length === 0)) {
        return false;
    }
    return true;
}, {
    message: 'Cancellation reason is required when cancelling a task',
    path: ['cancellationReason'],
});
export const reassignTaskSchema = z.object({
    newAssigneeId: z.string().min(1, 'New assignee is required'),
    reason: z.string().optional(),
    expectedVersion: z.number().int().positive().optional(),
});
export const editTaskScopeSchema = z.object({
    title: z.string().min(1).max(255).trim().optional(),
    description: z.string().optional(),
    priority: z.enum(['Low', 'Normal', 'High', 'Urgent']).optional(),
    dueDate: z.string().optional(),
    startDate: z.string().optional(),
    estimatedHours: z.number().min(0).optional(),
    expectedVersion: z.number().int().positive().optional(),
});
export const recordWorkLogSchema = z.object({
    workDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Work date must be in YYYY-MM-DD format'),
    whatWasDone: z.string().min(1, 'Description of work done is required').trim(),
    progressAfter: z.number().min(0).max(100),
    timeSpentMinutes: z.number().min(0).max(1440, 'Time spent cannot exceed 1440 minutes (24 hours) in a single day'),
    blockerOrSupport: z.string().optional(),
    attachmentUrl: z.string().optional(),
});
export const addCommentSchema = z.object({
    content: z.string().min(1, 'Comment content cannot be empty').trim(),
});
export const dailyReportSubmitSchema = z.object({
    reportDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Report date must be in YYYY-MM-DD format'),
    overallSummary: z.string().optional(),
    nextDayPlan: z.string().optional(),
    otherWork: z.string().optional(),
    workItems: z.array(z.object({
        taskId: z.string().optional(),
        taskNumber: z.string().optional(),
        taskTitle: z.string(),
        taskStatus: z.string(),
        progressPercentage: z.number().min(0).max(100),
        workDoneToday: z.string().optional(),
        timeSpentMinutes: z.number().min(0).max(1440).default(0),
        blockersOrIssues: z.string().optional(),
        isCarriedForward: z.boolean().default(false),
    })).optional(),
}).refine(data => {
    const hasWorkLogs = (data.workItems || []).some(w => !w.isCarriedForward && w.workDoneToday && w.workDoneToday.trim().length > 0);
    const hasOtherWork = Boolean(data.otherWork && data.otherWork.trim().length > 0);
    const hasSummary = Boolean(data.overallSummary && data.overallSummary.trim().length > 0);
    // Requirement: report needs either at least one work entry or an explanation of why no work was recorded
    return hasWorkLogs || hasOtherWork || hasSummary;
}, {
    message: 'Daily report must have at least one work entry or an explanation in the overall summary',
    path: ['overallSummary'],
});
export const reviewDailyReportSchema = z.object({
    action: z.enum(['REVIEW', 'RETURN']),
    reviewComments: z.string().optional(),
    returnReason: z.string().optional(),
}).refine(data => {
    if (data.action === 'RETURN' && (!data.returnReason || data.returnReason.trim().length === 0)) {
        return false;
    }
    return true;
}, {
    message: 'Mandatory return reason is required when returning a daily report for correction',
    path: ['returnReason'],
});
//# sourceMappingURL=taskValidators.js.map