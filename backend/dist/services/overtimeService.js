import { overtimeRepository } from '../repositories/overtimeRepository.js';
export class OvertimeService {
    async getAllOvertime() {
        return overtimeRepository.getAllOvertime();
    }
    async createOvertime(data) {
        return overtimeRepository.createOvertime({
            employeeId: data.employee_id,
            date: data.date,
            hours: data.hours,
            hourlyRate: data.hourly_rate ?? 100,
            reason: data.reason,
        });
    }
    async approveOvertime(id, approverName = 'Authorized Manager') {
        const approved = await overtimeRepository.approveOvertime(id, approverName);
        if (!approved) {
            throw new Error(`Overtime record ${id} not found`);
        }
        return approved;
    }
}
export const overtimeService = new OvertimeService();
//# sourceMappingURL=overtimeService.js.map