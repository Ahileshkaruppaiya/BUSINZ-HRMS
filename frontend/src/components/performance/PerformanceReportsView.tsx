import React, { useState } from 'react';
import {
  EmployeePerformanceDetail,
  DepartmentPerformanceDetail,
  PipRecord,
  GoalItem
} from '../../types/performance';
import {
  FileText,
  Download,
  Printer,
  Table,
  Filter,
  CheckCircle2,
  Calendar,
  Building2,
  Users,
  Award,
  AlertTriangle,
  TrendingUp
} from 'lucide-react';
import { ExportDropdown } from '../common/ExportDropdown';
import { downloadCSV, downloadExcel, downloadPDF } from '../../utils/exportUtils';

interface PerformanceReportsViewProps {
  employees: EmployeePerformanceDetail[];
  departments: DepartmentPerformanceDetail[];
  pipRecords: PipRecord[];
  goals: GoalItem[];
}

type ReportType =
  | 'employee_performance'
  | 'department_performance'
  | 'kra_report'
  | 'kpi_report'
  | 'goal_achievement'
  | 'pip_report'
  | 'performance_trend'
  | 'top_performers'
  | 'low_performance';

export const PerformanceReportsView: React.FC<PerformanceReportsViewProps> = ({
  employees,
  departments,
  pipRecords,
  goals
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('employee_performance');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const reportOptions: { id: ReportType; label: string; icon: any; description: string }[] = [
    { id: 'employee_performance', label: 'Employee Performance Report', icon: Users, description: 'Overall scores, grades, KRA, KPI, and task performance across all staff' },
    { id: 'department_performance', label: 'Department Performance Report', icon: Building2, description: 'Comparative scores, goal achievements, and staffing across all 8 departments' },
    { id: 'kra_report', label: 'KRA Report', icon: Table, description: 'Detailed breakdown of assigned Key Result Areas, targets, and achievement metrics' },
    { id: 'kpi_report', label: 'KPI Report', icon: TrendingUp, description: 'Quantifiable Key Performance Indicator progress, targets, and percentages' },
    { id: 'goal_achievement', label: 'Goal Achievement Report', icon: Award, description: 'Status and completion percentages of personal and departmental goals' },
    { id: 'pip_report', label: 'PIP Report', icon: AlertTriangle, description: 'Performance Improvement Plans, active mentoring, and milestone status' },
    { id: 'performance_trend', label: 'Performance Trend Report', icon: TrendingUp, description: 'Quarterly historical performance progression across cycles' },
    { id: 'top_performers', label: 'Top Performers (Score ≥ 90%)', icon: Award, description: 'Recognition roster of employees exceeding benchmark expectations' },
    { id: 'low_performance', label: 'Low Performance / Support Needed', icon: AlertTriangle, description: 'Audit list of employees requiring intervention or coaching' }
  ];

  // Helper to generate CSV data based on active report
  const generateReportData = () => {
    switch (selectedReport) {
      case 'employee_performance':
        return employees.map(e => ({
          'Employee ID': e.employeeId,
          'Name': e.employeeName,
          'Department': e.department,
          'Designation': e.designation,
          'Overall Score': `${e.overallScore}%`,
          'Grade': e.performanceGrade,
          'KRA Score': `${e.kraScore}%`,
          'KPI Score': `${e.kpiScore}%`,
          'Goal Score': `${e.goalScore}%`,
          'Task Score': `${e.taskScore}%`,
          'Attendance': `${e.attendanceImpact.attendancePercent}%`,
          'Active PIP': e.hasActivePip ? 'Yes' : 'No'
        }));

      case 'department_performance':
        return departments.map(d => ({
          'Department': d.departmentName,
          'Head of Dept': d.headName,
          'Staff Count': d.headcount,
          'Overall Score': `${d.avgOverallScore}%`,
          'KPI Score': `${d.avgKpiScore}%`,
          'KRA Score': `${d.avgKraScore}%`,
          'Goal Completion': `${d.goalCompletionRate}%`,
          'Attendance Impact': `${d.attendanceImpactScore}%`,
          'PIP Count': d.pipCount,
          'Top Performer': d.topPerformerName
        }));

      case 'top_performers':
        return employees.filter(e => e.overallScore >= 90).map(e => ({
          'Employee ID': e.employeeId,
          'Name': e.employeeName,
          'Department': e.department,
          'Designation': e.designation,
          'Overall Score': `${e.overallScore}%`,
          'Grade': e.performanceGrade,
          'Reporting Manager': e.reportingManager
        }));

      case 'low_performance':
        return employees.filter(e => e.overallScore < 75 || e.hasActivePip).map(e => ({
          'Employee ID': e.employeeId,
          'Name': e.employeeName,
          'Department': e.department,
          'Designation': e.designation,
          'Overall Score': `${e.overallScore}%`,
          'Status': e.hasActivePip ? 'Active PIP' : 'Needs Support',
          'Attendance': `${e.attendanceImpact.attendancePercent}%`,
          'Overdue Tasks': e.taskPerformance.overdueTasks
        }));

      case 'pip_report':
        return pipRecords.map(p => ({
          'PIP ID': p.id,
          'Employee ID': p.employeeId,
          'Employee Name': p.employeeName,
          'Department': p.department,
          'Duration': `${p.durationDays} Days`,
          'Review Frequency': p.reviewFrequency,
          'Mentor': p.mentorName,
          'Status': p.status,
          'Progress': `${p.progressPercentage}%`,
          'Problem': p.performanceIssue || p.reason
        }));

      case 'goal_achievement':
        return goals.map(g => ({
          'Goal ID': g.id,
          'Goal Name': g.goalName,
          'Employee': g.employeeName,
          'Department': g.department,
          'Target Metric': g.targetMetric,
          'Progress': `${g.currentProgress}%`,
          'Weightage': `${g.weightage}%`,
          'Due Date': g.dueDate,
          'Status': g.status
        }));

      default:
        return employees.map(e => ({
          'Employee ID': e.employeeId,
          'Name': e.employeeName,
          'Department': e.department,
          'Score': `${e.overallScore}%`
        }));
    }
  };

  const reportData = generateReportData();

  // Export to CSV
  const handleExportCSV = () => {
    if (reportData.length === 0) return;
    const columns = Object.keys(reportData[0]).map(k => ({ key: k, label: k }));
    downloadCSV(reportData, `${selectedReport}_${new Date().toISOString().split('T')[0]}`, columns);
    setExportFeedback('CSV Report downloaded successfully!');
    setTimeout(() => setExportFeedback(null), 3500);
  };

  // Export to Excel (.xls)
  const handleExportExcel = () => {
    if (reportData.length === 0) return;
    const columns = Object.keys(reportData[0]).map(k => ({ key: k, label: k }));
    downloadExcel(reportData, `${selectedReport}_${new Date().toISOString().split('T')[0]}`, columns);
    setExportFeedback('Excel Workbook (.xls) downloaded successfully!');
    setTimeout(() => setExportFeedback(null), 3500);
  };

  // Export to PDF
  const handlePrintPDF = () => {
    if (reportData.length === 0) return;
    const columns = Object.keys(reportData[0] || {}).map(k => ({ key: k, label: k }));
    const title = reportOptions.find(r => r.id === selectedReport)?.label || 'Performance Report';
    downloadPDF(reportData, title, `${selectedReport}_${new Date().toISOString().split('T')[0]}`, columns);
    setExportFeedback('PDF Report generated successfully!');
    setTimeout(() => setExportFeedback(null), 3500);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* ── TOP HEADER CARD ── */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E7ECF3',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#ECFEFF',
            color: '#0E7490',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <FileText size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1E293B', fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em' }}>
              Performance Analytics & Audit Reports
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748B' }}>
              Generate comprehensive reports and export directly to PDF, Excel, and CSV formats
            </p>
          </div>
        </div>

        {/* Export Actions Strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ExportDropdown
            onExportExcel={handleExportExcel}
            onExportPDF={handlePrintPDF}
            onExportCSV={handleExportCSV}
          />
        </div>
      </div>

      {/* Export Notification Feedback */}
      {exportFeedback && (
        <div style={{
          backgroundColor: '#DCFCE7',
          border: '1px solid #86EFAC',
          color: '#15803D',
          borderRadius: '10px',
          padding: '10px 16px',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          <span>{exportFeedback}</span>
        </div>
      )}

      {/* ── REPORT SELECTOR GRID (9 REPORTS) ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '12px'
      }}>
        {reportOptions.map(rep => {
          const isSelected = selectedReport === rep.id;
          const Icon = rep.icon;
          return (
            <div
              key={rep.id}
              onClick={() => setSelectedReport(rep.id)}
              style={{
                backgroundColor: isSelected ? '#ECFEFF' : '#FFFFFF',
                border: isSelected ? '2px solid #0E7490' : '1px solid #E7ECF3',
                borderRadius: '14px',
                padding: '14px 16px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: isSelected ? '#0E7490' : '#F1F5F9',
                  color: isSelected ? '#FFFFFF' : '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Icon size={16} />
                </div>
                <strong style={{ fontSize: '13px', color: isSelected ? '#0E7490' : '#1E293B' }}>
                  {rep.label}
                </strong>
              </div>
              <span style={{ fontSize: '11px', color: '#64748B', display: 'block', lineHeight: '1.4' }}>
                {rep.description}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── REPORT PREVIEW TABLE ── */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E7ECF3',
        borderRadius: '16px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>
              Preview: {reportOptions.find(r => r.id === selectedReport)?.label}
            </h3>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              {reportData.length} records populated
            </span>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #E2E8F0' }}>
                {Object.keys(reportData[0] || {}).map(header => (
                  <th key={header} style={{ padding: '10px 14px', fontSize: '12px', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, idx) => (
                <tr
                  key={idx}
                  style={{
                    borderBottom: '1px solid #E7ECF3',
                    backgroundColor: idx % 2 === 0 ? '#FFFFFF' : '#FAFCFE'
                  }}
                >
                  {Object.keys(row).map(header => (
                    <td key={header} style={{ padding: '10px 14px', fontSize: '13px', color: '#1E293B' }}>
                      {(row as any)[header]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
