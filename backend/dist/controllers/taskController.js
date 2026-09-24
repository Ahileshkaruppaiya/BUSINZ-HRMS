import { taskRepository } from '../repositories/taskRepository.js';
export const getTasks = async (req, res) => {
    try {
        const user = req.user;
        const filters = {
            employee: req.query.employee,
            assigned_by: req.query.assigned_by,
            assigned_to: req.query.assigned_to,
            department: req.query.department,
            status: req.query.status,
            priority: req.query.priority,
            due_date: req.query.due_date,
            overdue: req.query.overdue === 'true',
            search: req.query.search,
        };
        const tasks = await taskRepository.getTasks(user, filters);
        res.json({
            success: true,
            data: tasks,
            total: tasks.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message || 'Failed to fetch tasks',
            },
        });
    }
};
export const getTaskById = async (req, res) => {
    try {
        const user = req.user;
        const id = String(req.params.id);
        const task = await taskRepository.getTaskById(id, user);
        if (!task) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Task not found or you do not have permission to view it',
                },
            });
            return;
        }
        const history = await taskRepository.getTaskHistory(task.id);
        res.json({
            success: true,
            data: {
                ...task,
                history,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message || 'Failed to retrieve task',
            },
        });
    }
};
export const createTask = async (req, res) => {
    try {
        const user = req.user;
        const { title, description, assigned_to, department, department_id, priority, start_date, due_date, task_type, estimated_hours, attachment, remarks, } = req.body;
        if (!title || !description || !assigned_to || !due_date) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Title, description, assigned_to and due_date are required fields',
                },
            });
            return;
        }
        // Validation: cannot assign task to oneself
        const userEmpId = user.employeeId || user.id;
        if (assigned_to === userEmpId || (user.name && assigned_to.toLowerCase() === user.name.toLowerCase())) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'SELF_ASSIGNMENT_FORBIDDEN',
                    message: 'Tasks cannot be self-assigned. Please assign to another team member.',
                },
            });
            return;
        }
        const input = {
            title,
            description,
            assigned_to,
            department,
            department_id,
            priority: priority || 'Medium',
            start_date,
            due_date,
            task_type,
            estimated_hours: Number(estimated_hours) || 8,
            attachment,
            remarks,
        };
        const task = await taskRepository.createTask(input, user);
        res.status(201).json({
            success: true,
            data: task,
            message: 'Task created and assigned successfully',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message || 'Failed to create task',
            },
        });
    }
};
export const updateTaskStatus = async (req, res) => {
    try {
        const user = req.user;
        const id = String(req.params.id);
        const { status, remarks } = req.body;
        const validStatuses = ['Pending', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_STATUS',
                    message: `Status must be one of: ${validStatuses.join(', ')}`,
                },
            });
            return;
        }
        const updatedTask = await taskRepository.updateTaskStatus(id, status, user, remarks);
        if (!updatedTask) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Task not found',
                },
            });
            return;
        }
        res.json({
            success: true,
            data: updatedTask,
            message: `Task status successfully updated to ${status}`,
        });
    }
    catch (error) {
        res.status(403).json({
            success: false,
            error: {
                code: 'FORBIDDEN',
                message: error.message || 'Unauthorized to update this task status',
            },
        });
    }
};
export const getDailyReports = async (req, res) => {
    try {
        const user = req.user;
        const filters = {
            taskId: req.query.taskId,
            employeeId: req.query.employeeId,
            department: req.query.department,
            date: req.query.date,
        };
        const reports = await taskRepository.getDailyReports(user, filters);
        res.json({
            success: true,
            data: reports,
            total: reports.length,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message || 'Failed to fetch daily reports',
            },
        });
    }
};
export const createDailyReport = async (req, res) => {
    try {
        const user = req.user;
        const id = String(req.params.id);
        const { report_date, work_completed, progress, hours_spent, blockers, next_action, remarks, attachment, } = req.body;
        if (!work_completed || !work_completed.trim()) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Work completed description is required',
                },
            });
            return;
        }
        const input = {
            report_date,
            work_completed,
            progress: progress !== undefined ? Number(progress) : undefined,
            hours_spent: hours_spent !== undefined ? Number(hours_spent) : 8,
            blockers,
            next_action,
            remarks,
            attachment,
        };
        const report = await taskRepository.createDailyReport(id, input, user);
        res.status(201).json({
            success: true,
            data: report,
            message: 'Daily report logged successfully and dispatched to CEO, HR & Assigner',
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message || 'Failed to submit daily report',
            },
        });
    }
};
export const getDashboardStats = async (req, res) => {
    try {
        const user = req.user;
        const stats = await taskRepository.getDashboardStats(user);
        res.json({
            success: true,
            data: stats,
        });
    }
    catch (error) {
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message || 'Failed to fetch dashboard statistics',
            },
        });
    }
};
//# sourceMappingURL=taskController.js.map