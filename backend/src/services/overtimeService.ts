import { overtimeRepository, OvertimeModel } from '../repositories/overtimeRepository.js';

export class OvertimeService {
  async getAllOvertime(): Promise<OvertimeModel[]> {
    return overtimeRepository.getAllOvertime();
  }

  async createOvertime(data: {
    employee_id: string;
    date: string;
    hours: number;
    hourly_rate?: number;
    reason?: string;
  }): Promise<OvertimeModel> {
    return overtimeRepository.createOvertime({
      employeeId: data.employee_id,
      date: data.date,
      hours: data.hours,
      hourlyRate: data.hourly_rate ?? 100,
      reason: data.reason,
    });
  }

  async approveOvertime(id: string, approverName = 'Authorized Manager'): Promise<OvertimeModel> {
    const approved = await overtimeRepository.approveOvertime(id, approverName);
    if (!approved) {
      throw new Error(`Overtime record ${id} not found`);
    }
    return approved;
  }
}

export const overtimeService = new OvertimeService();
