import { employeeRepository } from '../repositories/employeeRepository.js';
import { computeSalaryStructure } from './calculationEngine.js';
export class SalaryStructureService {
    async getStructure(employeeId) {
        const structure = await employeeRepository.getSalaryStructure(employeeId);
        if (!structure) {
            throw new Error(`Salary structure for employee ${employeeId} not found`);
        }
        return structure;
    }
    async saveStructure(employeeId, input) {
        // Validate that the structure satisfies the 100% percentage rule
        computeSalaryStructure(input);
        return employeeRepository.saveSalaryStructure(employeeId, input);
    }
}
export const salaryStructureService = new SalaryStructureService();
//# sourceMappingURL=salaryStructureService.js.map