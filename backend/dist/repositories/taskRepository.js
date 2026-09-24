const today = new Date().toISOString().split('T')[0];
// Fallback seed tasks
const inMemoryTasks = [
    {
        id: 'tsk-001',
        task_number: 'TSK-2026-001',
        title: 'Solar Plant Inverter Health Inspection',
        description: 'Perform complete inspection of 12 central inverters at Tirunelveli Solar Park site. Verify DC bus voltages, thermal scans, and safety grounding.',
        created_by: 'EMP-000',
        assigned_by: 'EMP-000',
        assigned_to: 'EMP-003',
        department_id: 'dept-eng',
        department: 'Engineering',
        priority: 'High',
        status: 'In Progress',
        progress: 60,
        start_date: today,
        due_date: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
        estimated_hours: 16,
        task_type: 'Field Inspection',
        remarks: 'Carry calibrated thermal camera and safety kit.',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'tsk-002',
        task_number: 'TSK-2026-002',
        title: 'Q1 Statutory Payroll Compliance Audit',
        description: 'Verify PF ECR return filing, ESIC online payment confirmation, and PT challans across all registered branch units.',
        created_by: 'EMP-001',
        assigned_by: 'EMP-001',
        assigned_to: 'EMP-005',
        department_id: 'dept-hr',
        department: 'Human Resources',
        priority: 'Urgent',
        status: 'Pending',
        progress: 0,
        start_date: today,
        due_date: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
        estimated_hours: 24,
        task_type: 'Statutory Audit',
        remarks: 'Reconcile against bank salary outflow report.',
        created_at: new Date(Date.now() - 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
    {
        id: 'tsk-003',
        task_number: 'TSK-2026-003',
        title: 'Substation SCADA Relay Calibration',
        description: 'Calibrate overcurrent and earth fault protection relays for 33kV feed line. Prepare calibration certificates.',
        created_by: 'EMP-003',
        assigned_by: 'EMP-003',
        assigned_to: 'EMP-004',
        department_id: 'dept-eng',
        department: 'Operations',
        priority: 'Medium',
        status: 'In Progress',
        progress: 40,
        start_date: today,
        due_date: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0],
        estimated_hours: 12,
        task_type: 'Technical Calibration',
        remarks: 'Coordinate line shutdown with grid authorities.',
        created_at: new Date(Date.now() - 3 * 86400000).toISOString(),
        updated_at: new Date().toISOString(),
    },
];
const inMemoryDailyReports = [
    {
        id: 'dlr-001',
        task_id: 'tsk-001',
        task_number: 'TSK-2026-001',
        task_title: 'Solar Plant Inverter Health Inspection',
        employee_id: 'EMP-003',
        employee_name: 'Mugan',
        department: 'Engineering',
        assigned_by: 'Velmurugan (CEO)',
        report_date: today,
        work_completed: 'Completed thermal imaging on Inverters 1 to 6. All temperatures within standard nominal limits (<58C).',
        progress: 60,
        hours_spent: 8,
        blockers: 'None. Awaiting access permit for block B inverters tomorrow.',
        next_action: 'Complete Inverters 7 through 12 and download telemetry logs.',
        remarks: 'Site conditions normal.',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
    },
];
const inMemoryComments = [];
const inMemoryHistory = [
    {
        id: 'hist-001',
        task_id: 'tsk-001',
        action: 'TASK_CREATED',
        new_value: 'Pending',
        changed_by: 'Velmurugan (CEO)',
        remarks: 'Task created and assigned to Mugan',
        created_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    },
    {
        id: 'hist-002',
        task_id: 'tsk-001',
        action: 'STATUS_CHANGE',
        old_value: 'Pending',
        new_value: 'In Progress',
        changed_by: 'Mugan',
        remarks: 'Commenced inspection at Tirunelveli solar site',
        created_at: new Date(Date.now() - 86400000).toISOString(),
    },
];
const inMemoryAttachments = [];
export class TaskRepository {
    isExecutiveOrAdmin(role) {
        return (role === 'Super Admin' ||
            role === 'CEO' ||
            role === 'HR Manager' ||
            role === 'HR Admin' ||
            role === 'ERP Administrator');
    }
    computeIsOverdue(dueDate, status) {
        if (!dueDate)
            return false;
        const curDate = new Date().toISOString().split('T')[0];
        return dueDate < curDate && status !== 'Completed' && status !== 'Cancelled';
    }
    attachOverdueFlag(task) {
        return {
            ...task,
            is_overdue: this.computeIsOverdue(task.due_date, task.status),
        };
    }
    /**
     * Get Tasks filtered by strict RBAC and optional query filters
     * Rule:
     * - Employee: ONLY where assigned_to = user OR assigned_by = user
     * - HR/CEO/Admin: ALL tasks
     */
    async getTasks(user, filters) {
        const isExec = this.isExecutiveOrAdmin(user.role);
        const userEmpId = user.employeeId || user.id;
        let tasks = [...inMemoryTasks].map((t) => this.attachOverdueFlag(t));
        // 1. RBAC Isolation
        if (!isExec) {
            tasks = tasks.filter((t) => t.assigned_to === userEmpId ||
                t.assigned_by === userEmpId ||
                t.created_by === userEmpId ||
                (user.name && t.assigned_by.toLowerCase().includes(user.name.toLowerCase())) ||
                (user.name && t.assigned_to.toLowerCase().includes(user.name.toLowerCase())));
        }
        // 2. Query Filters
        if (filters?.assigned_to) {
            tasks = tasks.filter((t) => t.assigned_to === filters.assigned_to);
        }
        if (filters?.assigned_by) {
            tasks = tasks.filter((t) => t.assigned_by === filters.assigned_by);
        }
        if (filters?.department) {
            tasks = tasks.filter((t) => t.department?.toLowerCase() === filters.department?.toLowerCase());
        }
        if (filters?.status) {
            tasks = tasks.filter((t) => t.status.toLowerCase() === filters.status?.toLowerCase());
        }
        if (filters?.priority) {
            tasks = tasks.filter((t) => t.priority.toLowerCase() === filters.priority?.toLowerCase());
        }
        if (filters?.overdue) {
            tasks = tasks.filter((t) => t.is_overdue);
        }
        if (filters?.search) {
            const q = filters.search.toLowerCase().trim();
            tasks = tasks.filter((t) => t.task_number.toLowerCase().includes(q) ||
                t.title.toLowerCase().includes(q) ||
                t.description?.toLowerCase().includes(q) ||
                t.assigned_to.toLowerCase().includes(q) ||
                t.assigned_by.toLowerCase().includes(q) ||
                t.department?.toLowerCase().includes(q));
        }
        return tasks.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    /**
     * Get single task with permission validation
     */
    async getTaskById(taskId, user) {
        const task = inMemoryTasks.find((t) => t.id === taskId || t.task_number === taskId);
        if (!task)
            return null;
        const isExec = this.isExecutiveOrAdmin(user.role);
        const userEmpId = user.employeeId || user.id;
        if (!isExec) {
            const isAuthorized = task.assigned_to === userEmpId ||
                task.assigned_by === userEmpId ||
                task.created_by === userEmpId ||
                (user.name && task.assigned_by.toLowerCase().includes(user.name.toLowerCase())) ||
                (user.name && task.assigned_to.toLowerCase().includes(user.name.toLowerCase()));
            if (!isAuthorized) {
                return null;
            }
        }
        return this.attachOverdueFlag(task);
    }
    /**
     * Create Task - ANY authenticated user can create and assign to ANY other user
     */
    async createTask(input, user) {
        const userEmpId = user.employeeId || user.id;
        const taskNumber = `TSK-2026-${String(inMemoryTasks.length + 1).padStart(3, '0')}`;
        const nowIso = new Date().toISOString();
        const newTask = {
            id: `tsk-${Date.now()}`,
            task_number: taskNumber,
            title: input.title.trim(),
            description: input.description.trim(),
            created_by: userEmpId,
            assigned_by: userEmpId,
            assigned_to: input.assigned_to,
            department_id: input.department_id,
            department: input.department || user.department || 'General',
            priority: input.priority || 'Medium',
            status: 'Pending',
            progress: 0,
            start_date: input.start_date || today,
            due_date: input.due_date,
            estimated_hours: input.estimated_hours || 8,
            task_type: input.task_type || 'General',
            remarks: input.remarks,
            created_at: nowIso,
            updated_at: nowIso,
        };
        inMemoryTasks.unshift(newTask);
        inMemoryHistory.unshift({
            id: `hist-${Date.now()}`,
            task_id: newTask.id,
            action: 'TASK_CREATED',
            new_value: 'Pending',
            changed_by: user.name || user.email || 'User',
            remarks: `Task created and assigned to ${input.assigned_to}`,
            created_at: nowIso,
        });
        return this.attachOverdueFlag(newTask);
    }
    /**
     * Update Status: Pending -> In Progress -> On Hold -> Completed
     * Stores every transition inside task_history without overwriting.
     */
    async updateTaskStatus(taskId, newStatus, user, remarks) {
        const taskIndex = inMemoryTasks.findIndex((t) => t.id === taskId);
        if (taskIndex === -1)
            return null;
        const task = inMemoryTasks[taskIndex];
        const isExec = this.isExecutiveOrAdmin(user.role);
        const userEmpId = user.employeeId || user.id;
        // Check authority to update status
        const isAssignee = task.assigned_to === userEmpId ||
            (user.name && task.assigned_to.toLowerCase().includes(user.name.toLowerCase()));
        const isAssigner = task.assigned_by === userEmpId ||
            task.created_by === userEmpId ||
            (user.name && task.assigned_by.toLowerCase().includes(user.name.toLowerCase()));
        if (!isAssignee && !isAssigner && !isExec) {
            throw new Error('Unauthorized to update this task status');
        }
        const oldStatus = task.status;
        task.status = newStatus;
        task.updated_at = new Date().toISOString();
        if (newStatus === 'Completed') {
            task.progress = 100;
            task.completed_at = new Date().toISOString();
        }
        else if (newStatus === 'In Progress' && task.progress === 0) {
            task.progress = 25;
        }
        inMemoryTasks[taskIndex] = task;
        // Append history record
        inMemoryHistory.unshift({
            id: `hist-${Date.now()}`,
            task_id: task.id,
            action: 'STATUS_CHANGE',
            old_value: oldStatus,
            new_value: newStatus,
            changed_by: user.name || user.email || 'User',
            remarks: remarks || `Status transitioned from ${oldStatus} to ${newStatus}`,
            created_at: new Date().toISOString(),
        });
        return this.attachOverdueFlag(task);
    }
    /**
     * Daily Reports Query with strict confidentiality:
     * report.employee_id === user OR task.assigned_by === user OR role in [HR, CEO]
     */
    async getDailyReports(user, filters) {
        const isExec = this.isExecutiveOrAdmin(user.role);
        const userEmpId = user.employeeId || user.id;
        let reports = [...inMemoryDailyReports];
        if (!isExec) {
            reports = reports.filter((r) => {
                const linkedTask = inMemoryTasks.find((t) => t.id === r.task_id);
                const isOwner = r.employee_id === userEmpId;
                const isAssigner = linkedTask &&
                    (linkedTask.assigned_by === userEmpId ||
                        linkedTask.created_by === userEmpId ||
                        (user.name && linkedTask.assigned_by.toLowerCase().includes(user.name.toLowerCase())));
                return isOwner || isAssigner;
            });
        }
        if (filters?.taskId) {
            reports = reports.filter((r) => r.task_id === filters.taskId);
        }
        if (filters?.employeeId) {
            reports = reports.filter((r) => r.employee_id === filters.employeeId);
        }
        if (filters?.date) {
            reports = reports.filter((r) => r.report_date === filters.date);
        }
        return reports.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    /**
     * Submit Daily Report
     */
    async createDailyReport(taskId, input, user) {
        const task = inMemoryTasks.find((t) => t.id === taskId);
        if (!task) {
            throw new Error('Task not found');
        }
        const userEmpId = user.employeeId || user.id;
        const nowIso = new Date().toISOString();
        const report = {
            id: `dlr-${Date.now()}`,
            task_id: task.id,
            task_number: task.task_number,
            task_title: task.title,
            employee_id: userEmpId,
            employee_name: user.name || 'Employee',
            department: user.department || task.department || 'Operations',
            assigned_by: task.assigned_by,
            report_date: input.report_date || today,
            work_completed: input.work_completed.trim(),
            progress: input.progress ?? task.progress,
            hours_spent: input.hours_spent || 8,
            blockers: input.blockers?.trim(),
            next_action: input.next_action?.trim(),
            remarks: input.remarks?.trim(),
            attachment: input.attachment,
            created_at: nowIso,
            updated_at: nowIso,
        };
        inMemoryDailyReports.unshift(report);
        // Sync task progress and status if provided
        if (input.progress !== undefined) {
            task.progress = Math.min(100, Math.max(0, input.progress));
            if (task.progress === 100) {
                task.status = 'Completed';
                task.completed_at = nowIso;
            }
            else if (task.status === 'Pending') {
                task.status = 'In Progress';
            }
            task.updated_at = nowIso;
        }
        // Log to history
        inMemoryHistory.unshift({
            id: `hist-${Date.now()}`,
            task_id: task.id,
            action: 'DAILY_REPORT_SUBMITTED',
            changed_by: user.name || user.email || 'Employee',
            remarks: `Daily report logged for ${report.report_date}. Hours: ${report.hours_spent}h, Progress: ${task.progress}%`,
            created_at: nowIso,
        });
        return report;
    }
    /**
     * Get Task History
     */
    async getTaskHistory(taskId) {
        return inMemoryHistory
            .filter((h) => h.task_id === taskId)
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    /**
     * Get Dashboard Statistics based on role
     */
    async getDashboardStats(user) {
        const isExec = this.isExecutiveOrAdmin(user.role);
        const tasks = await this.getTasks(user);
        const userEmpId = user.employeeId || user.id;
        if (!isExec) {
            const myTasks = tasks.filter((t) => t.assigned_to === userEmpId);
            const assignedByMe = tasks.filter((t) => t.assigned_by === userEmpId || t.created_by === userEmpId);
            return {
                role: 'Employee',
                cards: {
                    myTasks: myTasks.length,
                    pending: myTasks.filter((t) => t.status === 'Pending').length,
                    inProgress: myTasks.filter((t) => t.status === 'In Progress').length,
                    completed: myTasks.filter((t) => t.status === 'Completed').length,
                    overdue: myTasks.filter((t) => t.is_overdue).length,
                    assignedByMe: assignedByMe.length,
                },
                myActiveTasks: myTasks.filter((t) => t.status !== 'Completed' && t.status !== 'Cancelled'),
                tasksAssignedByMe: assignedByMe,
                recentDailyReports: inMemoryDailyReports
                    .filter((r) => r.employee_id === userEmpId)
                    .slice(0, 5),
                upcomingDeadlines: myTasks
                    .filter((t) => t.status !== 'Completed')
                    .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                    .slice(0, 5),
            };
        }
        // HR / CEO organization-level stats
        const todayStr = new Date().toISOString().split('T')[0];
        const createdToday = tasks.filter((t) => t.created_at.startsWith(todayStr)).length;
        const reportsToday = inMemoryDailyReports.filter((r) => r.report_date === todayStr).length;
        const employeesWithPending = new Set(tasks.filter((t) => t.status === 'Pending').map((t) => t.assigned_to)).size;
        return {
            role: 'Executive',
            cards: {
                totalTasks: tasks.length,
                pendingTasks: tasks.filter((t) => t.status === 'Pending').length,
                inProgress: tasks.filter((t) => t.status === 'In Progress').length,
                completed: tasks.filter((t) => t.status === 'Completed').length,
                overdue: tasks.filter((t) => t.is_overdue).length,
                tasksCreatedToday: createdToday,
                reportsSubmittedToday: reportsToday,
                employeesWithPendingTasks: employeesWithPending,
            },
            overdueTasks: tasks.filter((t) => t.is_overdue),
            recentActivity: inMemoryHistory.slice(0, 8),
            recentDailyReports: inMemoryDailyReports.slice(0, 8),
            upcomingDeadlines: tasks
                .filter((t) => t.status !== 'Completed')
                .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
                .slice(0, 8),
        };
    }
}
export const taskRepository = new TaskRepository();
//# sourceMappingURL=taskRepository.js.map