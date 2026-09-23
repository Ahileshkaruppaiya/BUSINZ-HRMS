import { employeeRepository, EmployeeSalaryStructureRecord } from '../repositories/employeeRepository.js';
import { SalaryStructureInput } from '../types/payroll.js';
import { computeSalaryStructure } from './calculationEngine.js';

export class SalaryStructureService {
  async getStructure(employeeId: string): Promise<EmployeeSalaryStructureRecord> {
    const structure = await employeeRepository.getSalaryStructure(employeeId);
    if (!structure) {
      throw new Error(`Salary structure for employee ${employeeId} not found`);
    }
    return structure;
  }

  async saveStructure(
    employeeId: string,
    input: SalaryStructureInput & { effectiveFrom?: string; effectiveTo?: string | null }
  ): Promise<EmployeeSalaryStructureRecord> {
    // Validate that the structure satisfies the 100% percentage rule
    computeSalaryStructure(input);
    return employeeRepository.saveSalaryStructure(employeeId, input);
  }
}

export const salaryStructureService = new SalaryStructureService();
