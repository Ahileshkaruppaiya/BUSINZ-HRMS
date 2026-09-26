import React, { useState, useMemo, useEffect } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { FilterReportsModal, FilterReportsState, initialFilterReportsState } from '../common/FilterReportsModal';
import { 
  Calendar, 
  UserX, 
  UserCheck, 
  Clock, 
  LogOut, 
  CircleDot, 
  Timer, 
  ClipboardList, 
  SlidersHorizontal, 
  Download, 
  FileText, 
  Search,
  CheckCircle2,
  AlertCircle,
  Home,
  Flame,
  MapPin,
  X,
  Plus
} from 'lucide-react';
import { toNum } from '../../utils/numbers';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';
import { downloadCSV, downloadExcel, downloadPDF } from '../../utils/exportUtils';
import { downloadPagarBookMusterRollExcel } from '../../utils/pagarBookMusterRollExporter';
import { ExportDropdown } from '../common/ExportDropdown';
import { MusterRollModule } from './MusterRollModule';
import { ManualAttendanceEntryModal } from './ManualAttendanceEntryModal';

export type ReportTypeKey = 
  | 'muster' 
  | 'absent' 
  | 'present' 
  | 'late' 
  | 'early' 
  | 'halfday' 
  | 'overtime' 
  | 'leave';

interface AttendanceReportsViewProps {
  onOpenFilter?: () => void;
  filterReports?: FilterReportsState;
  title?: string;
  subtitle?: string;
}

export const AttendanceReportsView: React.FC<AttendanceReportsViewProps> = ({ 
  onOpenFilter, 
  filterReports: externalFilterReports,
  title,
  subtitle
}) => {
  const { employees, attendanceRecords, leaveRequests, departments, currentUser, shifts, businessSettings, companyInfo } = useHRMS();

  const isHrOrCeo =
    currentUser?.role === 'Super Admin' ||
    currentUser?.role === 'CEO' ||
    currentUser?.role === 'HR Manager' ||
    currentUser?.role === 'HR Admin' ||
    currentUser?.role === 'Management';

  const [isManualAttendanceModalOpen, setIsManualAttendanceModalOpen] = useState<boolean>(false);

  // Filter Modal & Active Filters State
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [activeFilters, setActiveFilters] = useState<FilterReportsState>(() => {
    return externalFilterReports || initialFilterReportsState;
  });

  useEffect(() => {
    if (externalFilterReports) {
      setActiveFilters(externalFilterReports);
    }
  }, [externalFilterReports]);

  const handleOpenFilter = () => {
    if (onOpenFilter) onOpenFilter();
    setIsFilterModalOpen(true);
  };

  const handleApplyFilter = (newFilters: FilterReportsState) => {
    setActiveFilters(newFilters);
    setIsFilterModalOpen(false);
  };

  const handleResetFilter = () => {
    setActiveFilters(initialFilterReportsState);
    setIsFilterModalOpen(false);
  };

  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += (activeFilters.branches || []).length;
    count += (activeFilters.departments || []).length;
    const branchDepts = activeFilters.branchDepartments || {};
    Object.values(branchDepts).forEach(depts => {
      count += depts.length;
    });
    count += (activeFilters.shifts || []).length;
    count += (activeFilters.employmentTypes || []).length;
    count += (activeFilters.modesOfWork || []).length;
    return count;
  }, [activeFilters]);

  // Date Range (default: 01-09-2026 to 03-09-2026 as shown in design)
  const [fromDate, setFromDate] = useState<string>('2026-09-01');
  const [toDate, setToDate] = useState<string>('2026-09-03');
  const [selectedReportType, setSelectedReportType] = useState<ReportTypeKey>('muster');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Generate array of date strings between fromDate and toDate
  const dateRangeList = useMemo(() => {
    const dates: string[] = [];
    try {
      const current = new Date(fromDate);
      const end = new Date(toDate);
      while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
    } catch {
      dates.push('2026-09-01', '2026-09-02', '2026-09-03');
    }
    return dates.length > 0 ? dates : ['2026-09-01', '2026-09-02', '2026-09-03'];
  }, [fromDate, toDate]);

  // Filtered employees based on Scope Filters
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      // Scope filters: branch
      if (activeFilters.branches && activeFilters.branches.length > 0) {
        const empBranch = (emp.workLocation || (emp as any).branch || '').toLowerCase().trim();
        const matchesBranch = activeFilters.branches.some(b => {
          const target = b.toLowerCase().trim();
          return empBranch === target || empBranch.includes(target) || target.includes(empBranch);
        });
        if (!matchesBranch) return false;
      }

      // Scope filters: department
      if (activeFilters.departments && activeFilters.departments.length > 0) {
        const empDept = (emp.department || '').toLowerCase().trim();
        const matchesDept = activeFilters.departments.some(d => {
          const target = d.toLowerCase().trim();
          return empDept === target || empDept.includes(target) || target.includes(empDept);
        });
        if (!matchesDept) return false;
      }

      // Legacy Scope filters: branch / department
      const branchDepts = activeFilters.branchDepartments || {};
      const activeBranches = Object.keys(branchDepts);
      if (activeBranches.length > 0) {
        let matchesBranchDept = false;
        for (const branch of activeBranches) {
          const depts = branchDepts[branch] || [];
          if (depts.length === 0 || depts.includes(emp.department)) {
            matchesBranchDept = true;
            break;
          }
        }
        if (!matchesBranchDept) return false;
      }

      // Employment types
      if (activeFilters.employmentTypes && activeFilters.employmentTypes.length > 0) {
        if (!activeFilters.employmentTypes.includes(emp.employmentType)) return false;
      }

      // Shift filter based on Company Shifts
      if (activeFilters.shifts && activeFilters.shifts.length > 0) {
        const empShift = emp.workShift || 
          shifts.find(s => s.assignments?.some(a => a.employeeId === emp.employeeId || a.employeeId === emp.id))?.shiftName || 
          shifts[0]?.shiftName;
        const matchesShift = activeFilters.shifts.some(selectedShift => 
          empShift && (
            empShift === selectedShift || 
            empShift.toLowerCase().includes(selectedShift.toLowerCase()) || 
            selectedShift.toLowerCase().includes(empShift.toLowerCase())
          )
        );
        if (!matchesShift) return false;
      }

      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
        if (!fullName.includes(q) && !emp.employeeId.toLowerCase().includes(q) && !emp.department.toLowerCase().includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [employees, activeFilters, searchQuery, shifts]);

  // Attendance Records inside date range & matching employees
  const filteredAttendance = useMemo(() => {
    const validEmpIds = new Set(filteredEmployees.map(e => e.employeeId));
    return attendanceRecords.filter(r => {
      return r.date >= fromDate && r.date <= toDate && validEmpIds.has(r.employeeId);
    });
  }, [attendanceRecords, fromDate, toDate, filteredEmployees]);

  // Filtered Leave Requests based on Scope Filters, Search Query, and Date Range
  const filteredLeaveRequests = useMemo(() => {
    return leaveRequests.filter(l => {
      // Scope filters: branch
      if (activeFilters.branches && activeFilters.branches.length > 0) {
        const leaveBranch = ((l as any).workLocation || (l as any).branch || '').toLowerCase().trim();
        if (leaveBranch) {
          const matchesBranch = activeFilters.branches.some(b => {
            const target = b.toLowerCase().trim();
            return leaveBranch === target || leaveBranch.includes(target) || target.includes(leaveBranch);
          });
          if (!matchesBranch) return false;
        }
      }

      // Scope filters: department
      if (activeFilters.departments && activeFilters.departments.length > 0) {
        const leaveDept = (l.department || '').toLowerCase().trim();
        const matchesDept = activeFilters.departments.some(d => {
          const target = d.toLowerCase().trim();
          return leaveDept === target || leaveDept.includes(target) || target.includes(leaveDept);
        });
        if (!matchesDept) return false;
      }

      // Legacy Scope filters: branch / department
      const branchDepts = activeFilters.branchDepartments || {};
      const activeBranches = Object.keys(branchDepts);
      if (activeBranches.length > 0) {
        let matchesBranchDept = false;
        for (const branch of activeBranches) {
          const depts = branchDepts[branch] || [];
          if (depts.length === 0 || depts.includes(l.department)) {
            matchesBranchDept = true;
            break;
          }
        }
        if (!matchesBranchDept) return false;
      }

      // Search Query filter (matches employee name, ID, department, leave type, reason, or status)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = (l.employeeName || '').toLowerCase().includes(q);
        const matchesId = (l.employeeId || '').toLowerCase().includes(q);
        const matchesDept = (l.department || '').toLowerCase().includes(q);
        const matchesType = (l.leaveType || '').toLowerCase().includes(q);
        const matchesReason = (l.reason || '').toLowerCase().includes(q);
        const matchesStatus = (l.status || '').toLowerCase().includes(q);

        if (!matchesName && !matchesId && !matchesDept && !matchesType && !matchesReason && !matchesStatus) {
          return false;
        }
      }

      // Date Range overlap check (leave overlaps [fromDate, toDate])
      // Only enforce date boundary if user isn't searching for a specific employee
      if (fromDate && toDate && !searchQuery.trim()) {
        if (l.startDate > toDate || l.endDate < fromDate) {
          return false;
        }
      }

      return true;
    });
  }, [leaveRequests, activeFilters, searchQuery, fromDate, toDate]);

  // Format date display (e.g. 01/09/2026)
  const formatDateDisplay = (isoStr: string) => {
    return formatDateDDMMYYYY(isoStr);
  };

  // Report Types Metadata
  const reportCards = [
    {
      key: 'muster' as ReportTypeKey,
      title: 'Muster Roll',
      subtitle: 'Monthly calendar view',
      icon: <Calendar size={20} color="#0891b2" />,
      iconBg: '#ecfeff'
    },
    {
      key: 'absent' as ReportTypeKey,
      title: 'Absent Report',
      subtitle: 'List of absentees',
      icon: <UserX size={19} color="#ef4444" />,
      iconBg: '#fee2e2'
    },
    {
      key: 'present' as ReportTypeKey,
      title: 'Present Report',
      subtitle: 'List of present employees',
      icon: <UserCheck size={19} color="#10b981" />,
      iconBg: '#dcfce7'
    },
    {
      key: 'late' as ReportTypeKey,
      title: 'Late Arrivals',
      subtitle: 'Tardy check-ins report',
      icon: <Clock size={19} color="#f59e0b" />,
      iconBg: '#fef3c7'
    },
    {
      key: 'early' as ReportTypeKey,
      title: 'Early Departures',
      subtitle: 'Left before shift end',
      icon: <LogOut size={19} color="#06b6d4" />,
      iconBg: '#cffafe'
    },
    {
      key: 'remote' as ReportTypeKey,
      title: 'Remote / WFH',
      subtitle: 'Offsite employees log',
      icon: <Home size={19} color="#8b5cf6" />,
      iconBg: '#ede9fe'
    },
    {
      key: 'overtime' as ReportTypeKey,
      title: 'Overtime Hours',
      subtitle: 'Calculated overtime list',
      icon: <Flame size={19} color="#f97316" />,
      iconBg: '#ffedd5'
    },
    {
      key: 'leave' as ReportTypeKey,
      title: 'Leave Report',
      subtitle: 'Approved leaves',
      icon: <ClipboardList size={19} color="#64748b" />,
      iconBg: '#f1f5f9'
    }
  ];

  // Export helpers for CSV, Excel, and PDF
  const getStructuredReportData = () => {
    let columns: { key: string; label: string }[] = [];
    let data: Record<string, any>[] = [];

    if (selectedReportType === 'muster') {
      columns = [
        { key: 'empId', label: 'Employee ID' },
        { key: 'name', label: 'Employee Name' },
        { key: 'dept', label: 'Department' },
        ...dateRangeList.map(d => ({ key: `day_${d}`, label: formatDateDisplay(d) })),
        { key: 'present', label: 'Present' },
        { key: 'absent', label: 'Absent' },
        { key: 'rate', label: 'Attendance %' }
      ];

      filteredEmployees.forEach(emp => {
        let pCount = 0;
        let aCount = 0;
        const row: Record<string, any> = {
          empId: emp.employeeId,
          name: `${emp.firstName} ${emp.lastName}`,
          dept: emp.department
        };
        dateRangeList.forEach(d => {
          const rec = filteredAttendance.find(r => r.employeeId === emp.employeeId && r.date === d);
          if (!rec) {
            aCount++;
            row[`day_${d}`] = 'A';
          } else if (rec.status === 'Present' || rec.status === 'Late') {
            pCount++;
            row[`day_${d}`] = 'P';
          } else if (rec.status === 'Work From Home') {
            pCount++;
            row[`day_${d}`] = 'WFH';
          } else if (rec.status === 'Half Day') {
            pCount += 0.5;
            row[`day_${d}`] = 'HD';
          } else {
            aCount++;
            row[`day_${d}`] = 'A';
          }
        });
        const totalDays = dateRangeList.length;
        row.present = pCount;
        row.absent = aCount;
        row.rate = totalDays > 0 ? `${Math.round((pCount / totalDays) * 100)}%` : '0%';
        data.push(row);
      });
    } else if (selectedReportType === 'absent') {
      columns = [
        { key: 'empId', label: 'Employee ID' },
        { key: 'name', label: 'Employee Name' },
        { key: 'dept', label: 'Department' },
        { key: 'date', label: 'Date' },
        { key: 'status', label: 'Status' },
        { key: 'phone', label: 'Phone' }
      ];
      filteredEmployees.forEach(emp => {
        dateRangeList.forEach(d => {
          const rec = filteredAttendance.find(r => r.employeeId === emp.employeeId && r.date === d);
          const isWfh = rec?.status === 'Work From Home' || filteredLeaveRequests.some(l => 
            l.employeeId === emp.employeeId && l.status === 'Approved' && 
            (l.leaveType === 'Work From Home' || l.leaveType.toLowerCase().includes('work from home')) &&
            l.startDate <= d && l.endDate >= d
          );
          if (!isWfh && (!rec || rec.status === 'Absent')) {
            data.push({
              empId: emp.employeeId,
              name: `${emp.firstName} ${emp.lastName}`,
              dept: emp.department,
              date: d,
              status: 'Absent',
              phone: emp.phone || 'N/A'
            });
          }
        });
      });
    } else if (selectedReportType === 'present') {
      columns = [
        { key: 'empId', label: 'Employee ID' },
        { key: 'name', label: 'Employee Name' },
        { key: 'dept', label: 'Department' },
        { key: 'date', label: 'Date' },
        { key: 'checkIn', label: 'Check In' },
        { key: 'checkOut', label: 'Check Out' },
        { key: 'workingHours', label: 'Hours' },
        { key: 'method', label: 'Method' }
      ];
      filteredAttendance.filter(r => r.status === 'Present' || r.status === 'Late' || r.status === 'Work From Home').forEach(r => {
        data.push({
          empId: r.employeeId,
          name: r.employeeName,
          dept: r.department,
          date: r.date,
          checkIn: r.checkIn || '09:00 AM',
          checkOut: r.checkOut || '06:00 PM',
          workingHours: r.workingHours || 8,
          method: r.status === 'Work From Home' ? 'Work From Home [WFH]' : (r.method || 'Face Recognition')
        });
      });
    } else if (selectedReportType === 'leave') {
      columns = [
        { key: 'empId', label: 'Employee ID' },
        { key: 'name', label: 'Employee Name' },
        { key: 'dept', label: 'Department' },
        { key: 'leaveType', label: 'Leave Type' },
        { key: 'startDate', label: 'From Date' },
        { key: 'endDate', label: 'To Date' },
        { key: 'daysCount', label: 'Days' },
        { key: 'reason', label: 'Reason' },
        { key: 'status', label: 'Status' }
      ];
      filteredLeaveRequests.forEach(l => {
        data.push({
          empId: l.employeeId,
          name: l.employeeName,
          dept: l.department,
          leaveType: l.leaveType,
          startDate: l.startDate,
          endDate: l.endDate,
          daysCount: l.daysCount,
          reason: l.reason,
          status: l.status
        });
      });
    } else {
      columns = [
        { key: 'id', label: 'Record ID' },
        { key: 'empId', label: 'Employee ID' },
        { key: 'name', label: 'Name' },
        { key: 'dept', label: 'Department' },
        { key: 'date', label: 'Date' },
        { key: 'status', label: 'Status' },
        { key: 'workingHours', label: 'Hours' }
      ];
      filteredAttendance.forEach(r => {
        data.push({
          id: r.id,
          empId: r.employeeId,
          name: r.employeeName,
          dept: r.department,
          date: r.date,
          status: r.status,
          workingHours: r.workingHours
        });
      });
    }

    return { columns, data };
  };

  const handleExportCSV = () => {
    const { columns, data } = getStructuredReportData();
    downloadCSV(data, `Attendance_${selectedReportType.toUpperCase()}_Report_${fromDate}_to_${toDate}`, columns);
  };

  const handleExportExcel = () => {
    if (selectedReportType === 'muster') {
      downloadPagarBookMusterRollExcel(
        filteredEmployees,
        attendanceRecords,
        leaveRequests,
        fromDate,
        toDate,
        businessSettings?.businessName || companyInfo?.companyName || 'BUSINZ'
      );
      return;
    }
    const { columns, data } = getStructuredReportData();
    downloadExcel(data, `Attendance_${selectedReportType.toUpperCase()}_Report_${fromDate}_to_${toDate}`, columns);
  };

  const handleExportPDF = () => {
    const { columns, data } = getStructuredReportData();
    downloadPDF(data, `Attendance ${selectedReportType.toUpperCase()} Report (${fromDate} to ${toDate})`, `Attendance_${selectedReportType.toUpperCase()}_Report_${fromDate}_to_${toDate}`, columns);
  };

  return (
    <div style={{ backgroundColor: '#ffffff', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '28px', marginTop: '12px' }}>
      
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            {title || 'Attendance Reports'}
          </h1>
          <p style={{ fontSize: '0.86rem', color: '#64748b', margin: '4px 0 0' }}>
            {subtitle || 'Generate detailed attendance, muster roll, and leave reports.'}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {isHrOrCeo && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => setIsManualAttendanceModalOpen(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                borderRadius: '10px',
                padding: '9px 18px',
                fontSize: '0.84rem',
                fontWeight: 700,
                backgroundColor: '#0E7490',
                borderColor: '#0E7490',
                boxShadow: '0 2px 8px rgba(14, 116, 144, 0.25)',
                color: '#FFFFFF'
              }}
            >
              <Plus size={16} strokeWidth={2.5} />
              <span>Manual Attendance</span>
            </button>
          )}

          <ExportDropdown 
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            onExportCSV={handleExportCSV}
            label="Download"
          />
        </div>
      </div>

      {/* 2. FROM DATE / TO DATE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '20px' }}>
        
        {/* FROM DATE */}
        <div>
          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            FROM DATE
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type="date"
              className="form-control"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.88rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontWeight: 600,
                backgroundColor: '#ffffff'
              }}
            />
          </div>
        </div>

        {/* TO DATE */}
        <div>
          <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
            TO DATE
          </label>
          <div style={{ position: 'relative' }}>
            <input 
              type="date"
              className="form-control"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: '0.88rem',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                fontWeight: 600,
                backgroundColor: '#ffffff'
              }}
            />
          </div>
        </div>

      </div>

      {/* 3. SCOPE FILTERS */}
      <div style={{ marginBottom: '24px' }}>
        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '6px' }}>
          SCOPE FILTERS
        </label>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          backgroundColor: activeFilterCount > 0 ? '#ECFEFF' : '#f8fafc',
          border: activeFilterCount > 0 ? '1px solid #A5F3FC' : '1px solid #e2e8f0',
          borderRadius: '10px',
          padding: '12px 18px',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div>
            <span style={{ fontSize: '0.85rem', color: activeFilterCount > 0 ? '#0E7490' : '#475569', fontWeight: activeFilterCount > 0 ? 700 : 500 }}>
              {activeFilterCount > 0
                ? `Active Filters (${activeFilterCount} selected): Department, shift, and employment filters are applied.`
                : 'Department, shift, employment type, and work mode. Defaults include all filters (can be adjusted).'
              }
            </span>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={handleResetFilter}
                style={{
                  marginLeft: '12px',
                  background: 'none',
                  border: 'none',
                  color: '#EF4444',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  textDecoration: 'underline',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Reset All Filters
              </button>
            )}
          </div>
          <button 
            type="button"
            onClick={handleOpenFilter}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              padding: '7px 16px',
              borderRadius: '8px',
              border: '1.5px solid #0E7490',
              backgroundColor: activeFilterCount > 0 ? '#0E7490' : '#ffffff',
              color: activeFilterCount > 0 ? '#ffffff' : '#0E7490',
              fontSize: '0.82rem',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(14, 116, 144, 0.15)',
              transition: 'all 0.15s ease'
            }}
          >
            <SlidersHorizontal size={14} color={activeFilterCount > 0 ? '#ffffff' : '#0E7490'} />
            <span>Filters</span>
            {activeFilterCount > 0 && (
              <span style={{
                backgroundColor: '#ffffff',
                color: '#0E7490',
                borderRadius: '9999px',
                padding: '1px 6px',
                fontSize: '11px',
                fontWeight: 800
              }}>
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 4. SELECT REPORT TYPE */}
      <div style={{ marginBottom: '28px' }}>
        <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '12px' }}>
          SELECT REPORT TYPE
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
          {reportCards.map(card => {
            const isSelected = selectedReportType === card.key;
            return (
              <button
                key={card.key}
                type="button"
                onClick={() => setSelectedReportType(card.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: isSelected ? '2px solid #0E7490' : '1px solid #e2e8f0',
                  backgroundColor: isSelected ? '#ECFEFF' : '#ffffff',
                  boxShadow: isSelected ? '0 2px 8px rgba(14, 116, 144, 0.2)' : '0 1px 2px rgba(0,0,0,0.02)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: card.key === 'muster' ? '8px' : '99px',
                  backgroundColor: card.iconBg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  {card.icon}
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 800, color: isSelected ? '#0E7490' : '#1e293b' }}>
                    {card.title}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: isSelected ? '#155E75' : '#64748b', marginTop: '2px' }}>
                    {card.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* DIVIDER */}
      <hr style={{ border: 'none', borderBottom: '1px solid #e2e8f0', margin: '24px 0' }} />

      {/* 5. GENERATED REPORT DATA TABLE */}
      <div>
        
        {/* Table Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              {reportCards.find(c => c.key === selectedReportType)?.title}
            </h3>
            <span style={{ 
              backgroundColor: '#f0fdf4', 
              color: '#15803d', 
              border: '1px solid #bbf7d0', 
              fontSize: '0.72rem', 
              fontWeight: 700, 
              padding: '2px 8px', 
              borderRadius: '6px' 
            }}>
              {formatDateDisplay(fromDate)} to {formatDateDisplay(toDate)}
            </span>
          </div>

          <div style={{ position: 'relative', minWidth: '260px' }}>
            <Search size={15} color="#94a3b8" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
            <input 
              type="text"
              placeholder="Search employee, ID, or dept..."
              className="form-control"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: '32px', paddingRight: searchQuery ? '28px' : '12px', fontSize: '0.82rem', padding: '6px 12px 6px 32px', borderRadius: '8px' }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                title="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Table Content based on Report Type */}
        {selectedReportType === 'muster' ? (
          <MusterRollModule 
            searchQueryProp={searchQuery}
            fromDateProp={fromDate}
            toDateProp={toDate}
          />
        ) : (
          <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '10px' }}>
            {/* B. ABSENT REPORT VIEW */}
          {selectedReportType === 'absent' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Employee</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Department</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Date of Absence</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Contact Info</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  const absentRows: Array<{ emp: any; date: string }> = [];
                  filteredEmployees.forEach(emp => {
                    dateRangeList.forEach(d => {
                      const rec = filteredAttendance.find(r => r.employeeId === emp.employeeId && r.date === d);
                      const isWfh = rec?.status === 'Work From Home' || filteredLeaveRequests.some(l => 
                        l.employeeId === emp.employeeId && l.status === 'Approved' && 
                        (l.leaveType === 'Work From Home' || l.leaveType.toLowerCase().includes('work from home')) &&
                        l.startDate <= d && l.endDate >= d
                      );
                      if (!isWfh && (!rec || rec.status === 'Absent')) {
                        absentRows.push({ emp, date: d });
                      }
                    });
                  });

                  if (absentRows.length === 0) {
                    return (
                      <tr>
                        <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>
                          No absentees logged for the selected dates!
                        </td>
                      </tr>
                    );
                  }

                  return absentRows.map((item, idx) => (
                    <tr key={`${item.emp.id}-${item.date}-${idx}`} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{item.emp.firstName} {item.emp.lastName}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{item.emp.employeeId}</div>
                      </td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{item.emp.department}</td>
                      <td style={{ padding: '10px 14px', color: '#0f172a', fontWeight: 600 }}>{formatDateDisplay(item.date)}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{item.emp.phone || item.emp.email}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '3px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.75rem' }}>
                          Absent
                        </span>
                      </td>
                    </tr>
                  ));
                })()}
              </tbody>
            </table>
          )}

          {/* C. PRESENT REPORT VIEW */}
          {selectedReportType === 'present' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Employee</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Check In</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Check Out</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Working Hours</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Verification / Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.filter(r => r.status === 'Present' || r.status === 'Late' || r.status === 'Work From Home').length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      No present records found for this date range.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.filter(r => r.status === 'Present' || r.status === 'Late' || r.status === 'Work From Home').map(r => {
                    const isWfh = r.status === 'Work From Home';
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.employeeName}</div>
                          <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{r.employeeId} • {r.department}</div>
                        </td>
                        <td style={{ padding: '10px 14px', fontWeight: 600 }}>{formatDateDisplay(r.date)}</td>
                        <td style={{ padding: '10px 14px', color: isWfh ? '#4338CA' : '#15803d', fontWeight: 700 }}>{r.checkIn || '09:00 AM'}</td>
                        <td style={{ padding: '10px 14px', color: '#475569' }}>{r.checkOut || '06:00 PM'}</td>
                        <td style={{ padding: '10px 14px', fontWeight: 700 }}>{toNum(r.workingHours) || 8} hrs</td>
                        <td style={{ padding: '10px 14px' }}>
                          {isWfh ? (
                            <span style={{ backgroundColor: '#E0E7FF', color: '#4338CA', border: '1px solid #C7D2FE', padding: '3px 9px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                              🏠 [WFH] Remote Work
                            </span>
                          ) : (
                            <span style={{ backgroundColor: '#f0fdf4', color: '#15803d', border: '1px solid #bbf7d0', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600 }}>
                              {r.method || 'Face Recognition'}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {/* D. LATE REPORT VIEW */}
          {selectedReportType === 'late' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Employee</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Shift Time</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Actual Punch In</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Delay Duration</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Policy Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.filter(r => r.status === 'Late' || r.lateStatus?.includes('Late')).length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#16a34a', fontWeight: 600 }}>
                      No latecomers recorded in this timeframe!
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.filter(r => r.status === 'Late' || r.lateStatus?.includes('Late')).map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.employeeName}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{r.employeeId} • {r.department}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{formatDateDisplay(r.date)}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>09:30 AM</td>
                      <td style={{ padding: '10px 14px', color: '#d97706', fontWeight: 700 }}>{r.checkIn || '09:54 AM'}</td>
                      <td style={{ padding: '10px 14px', color: '#b45309', fontWeight: 700 }}>+24 mins</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ backgroundColor: '#fef3c7', color: '#92400e', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          Grace Exceeded
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* E. EARLY LEAVING REPORT VIEW */}
          {selectedReportType === 'early' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Employee</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Shift End</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Punch Out</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Early By</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Working Hours</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.filter(r => r.workingHours < 7.5 && r.workingHours > 0).length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#06b6d4', fontWeight: 600 }}>
                      No early leaving instances recorded!
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.filter(r => r.workingHours < 7.5 && r.workingHours > 0).map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.employeeName}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{r.employeeId} • {r.department}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{formatDateDisplay(r.date)}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>06:30 PM</td>
                      <td style={{ padding: '10px 14px', color: '#0e7490', fontWeight: 700 }}>{r.checkOut || '04:15 PM'}</td>
                      <td style={{ padding: '10px 14px', color: '#0891b2', fontWeight: 700 }}>2h 15m early</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{toNum(r.workingHours)} hrs</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* F. HALF-DAY VIEW */}
          {selectedReportType === 'halfday' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Employee</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Session</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Logged Hours</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.filter(r => r.status === 'Half Day').length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ padding: '30px', textAlign: 'center', color: '#94a3b8' }}>
                      No half-day records for this date range.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.filter(r => r.status === 'Half Day').map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.employeeName}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{r.employeeId} • {r.department}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{formatDateDisplay(r.date)}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>First Half (Morning)</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{toNum(r.workingHours)} hrs</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          Half-Day Approved
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* G. OVERTIME VIEW */}
          {selectedReportType === 'overtime' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Employee</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Date</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Standard Hours</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Total Hours</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>OT Logged</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Multiplier</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttendance.filter(r => r.workingHours > 8.5).length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '30px', textAlign: 'center', color: '#64748b', fontWeight: 600 }}>
                      No overtime logged for this timeframe.
                    </td>
                  </tr>
                ) : (
                  filteredAttendance.filter(r => r.workingHours > 8.5).map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{r.employeeName}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{r.employeeId} • {r.department}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 600 }}>{formatDateDisplay(r.date)}</td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>8.0 hrs</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{toNum(r.workingHours)} hrs</td>
                      <td style={{ padding: '10px 14px', color: '#0E7490', fontWeight: 800 }}>+{(toNum(r.workingHours) - 8).toFixed(1)} hrs</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ backgroundColor: '#ECFEFF', color: '#0E7490', border: '1px solid #A5F3FC', padding: '3px 8px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700 }}>
                          1.5x Rate
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {/* H. LEAVE REPORT VIEW */}
          {selectedReportType === 'leave' && (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Employee</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Leave Type</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>From Date</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>To Date</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Days</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Reason</th>
                  <th style={{ padding: '10px 14px', fontWeight: 700 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaveRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '36px', textAlign: 'center', color: '#94a3b8' }}>
                      {searchQuery.trim() ? (
                        <span>No leave requests match "<strong>{searchQuery}</strong>".</span>
                      ) : (
                        <span>No leave requests found for the selected date range.</span>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredLeaveRequests.map(l => (
                    <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{l.employeeName}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{l.employeeId} • {l.department}</div>
                      </td>
                      <td style={{ padding: '10px 14px', fontWeight: 700, color: '#0f172a' }}>{l.leaveType}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{formatDateDisplay(l.startDate)}</td>
                      <td style={{ padding: '10px 14px', color: '#475569' }}>{formatDateDisplay(l.endDate)}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{l.daysCount} days</td>
                      <td style={{ padding: '10px 14px', color: '#64748b' }}>{l.reason}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ 
                          backgroundColor: l.status === 'Approved' ? '#dcfce7' : l.status === 'Pending' ? '#fef3c7' : '#fee2e2', 
                          color: l.status === 'Approved' ? '#15803d' : l.status === 'Pending' ? '#b45309' : '#b91c1c', 
                          padding: '3px 8px', 
                          borderRadius: '6px', 
                          fontSize: '0.75rem', 
                          fontWeight: 700 
                        }}>
                          {l.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            )}
          </div>
        )}

      </div>

      <ManualAttendanceEntryModal
        isOpen={isManualAttendanceModalOpen}
        onClose={() => setIsManualAttendanceModalOpen(false)}
      />

      <FilterReportsModal
        isOpen={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        currentFilters={activeFilters}
        onApply={handleApplyFilter}
        onReset={handleResetFilter}
      />

    </div>
  );
};
