import React, { useState, useMemo } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  calculateCompanyPerformance, 
  calculateSingleEmployeePerformance 
} from './performanceEngine';
import { PerformanceDashboardView } from './PerformanceDashboardView';
import { EmployeeDetailPerformanceView } from './EmployeeDetailPerformanceView';

export const PerformanceTracking: React.FC = () => {
  const { currentUser, employees, attendanceRecords, enhancedTasks, orgStructure } = useHRMS();

  // Filters State
  const [selectedMonth, setSelectedMonth] = useState<string>('September 2026');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('ALL');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('ALL');

  // CEO/HR drilldown view state
  const [viewingEmpDetailId, setViewingEmpDetailId] = useState<string | null>(null);

  const isEmployeeRole = currentUser.role === 'Employee';

  // Compute real data profiles
  const { employeeProfiles, companySummary } = useMemo(() => {
    return calculateCompanyPerformance(
      employees, 
      attendanceRecords, 
      enhancedTasks, 
      orgStructure?.departments || []
    );
  }, [employees, attendanceRecords, enhancedTasks, orgStructure?.departments]);

  // Find target employee profile for personal view / drilldown
  const currentEmpProfile = useMemo(() => {
    if (isEmployeeRole) {
      const targetEmpId = currentUser.employeeId || 'EMP-001';
      const found = employeeProfiles.find(e => e.employeeId === targetEmpId);
      if (found) return found;

      // Fallback calculation directly for current employee
      const empObj = employees.find(e => e.employeeId === targetEmpId) || employees[0];
      return calculateSingleEmployeePerformance(empObj, attendanceRecords, enhancedTasks);
    }

    if (viewingEmpDetailId) {
      return employeeProfiles.find(e => e.employeeId === viewingEmpDetailId) || employeeProfiles[0];
    }

    return null;
  }, [isEmployeeRole, currentUser.employeeId, viewingEmpDetailId, employeeProfiles, employees, attendanceRecords, enhancedTasks]);

  // ========================================================
  // 1. STRICT ROLE ISOLATION: EMPLOYEE SELF VIEW
  // ========================================================
  if (isEmployeeRole) {
    if (!currentEmpProfile) {
      return (
        <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
          No performance record found for your employee profile.
        </div>
      );
    }

    return (
      <EmployeeDetailPerformanceView
        performance={currentEmpProfile}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        isDrilldownView={false}
      />
    );
  }

  // ========================================================
  // 2. CEO / HR DRILLDOWN DETAIL VIEW
  // ========================================================
  if (viewingEmpDetailId && currentEmpProfile) {
    return (
      <EmployeeDetailPerformanceView
        performance={currentEmpProfile}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        isDrilldownView={true}
        onBackToDashboard={() => setViewingEmpDetailId(null)}
      />
    );
  }

  // ========================================================
  // 3. CEO / HR MANAGEMENT DASHBOARD VIEW
  // ========================================================
  return (
    <PerformanceDashboardView
      companySummary={companySummary}
      employeeProfiles={employeeProfiles}
      selectedMonth={selectedMonth}
      onMonthChange={setSelectedMonth}
      selectedDepartment={selectedDepartment}
      onDepartmentChange={setSelectedDepartment}
      selectedEmployeeId={selectedEmployeeId}
      onEmployeeChange={setSelectedEmployeeId}
      onViewEmployeeDetail={(empId) => setViewingEmpDetailId(empId)}
    />
  );
};
