import fs from 'fs';
import path from 'path';

const filePath = path.resolve('frontend/src/context/HRMSContext.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Define mapEmployeeFromDb replacement
const mapEmployeeCode = `  // Supabase Database Employee Entity Mapper
  const mapEmployeeFromDb = (d: any): Employee => ({
    id: d.id,
    employeeId: d.employeeId || d.employee_id,
    firstName: d.firstName || d.first_name || '',
    lastName: d.lastName || d.last_name || '',
    email: d.email || '',
    phone: d.phone || '+91 98765 43210',
    dob: d.dob || '1995-01-01',
    gender: (d.gender as any) || 'Male',
    address: d.address || 'Chennai, Tamil Nadu',
    department: d.department || (d.departments && d.departments.name) || 'General',
    designation: d.designation || 'Staff',
    reportingManagerId: d.reportingManagerId || d.reporting_manager_id || '',
    reportingManagerName: d.reportingManagerName || d.reporting_manager_name || '',
    joiningDate: d.joiningDate || d.created_at?.split('T')[0] || '2026-01-01',
    employmentType: (d.employmentType || d.employment_type || 'Full-Time') as any,
    status: (d.status === 'Active' || d.status === 'Terminated' || d.status === 'On Leave') ? d.status : 'Active',
    avatar: d.avatar || d.avatar_url || '',
    basicSalary: Number(d.basicSalary || d.basic_salary) || 15000,
    allowances: {
      hra: Number(d.hra || d.allowances_hra) || 0,
      transport: Number(d.conveyance || d.allowances_transport) || 0,
      medical: Number(d.allowances_medical) || 0,
      special: Number(d.allowances_special) || 0,
      da: Number(d.da) || 0,
      conveyance: Number(d.conveyance) || 0,
    },
    withPf: d.withPf ?? true,
    bankDetails: {
      bankName: d.bankName || d.bank_name || 'HDFC Bank',
      accountNumber: d.accountNumber || d.account_number || '****1001',
      ifscCode: d.ifscCode || d.ifsc_code || 'HDFC0001234',
      branch: d.branch || 'Main Branch',
    },
    attendanceMethod: (d.attendanceMethod || d.attendance_method || (d.designation === 'CEO' || (d.designation && d.designation.toLowerCase().includes('ceo')) ? 'Exempt' : 'Face Scan')) as any,
    gpsAllowed: d.gpsAllowed ?? (d.designation === 'CEO' ? false : true),
    faceRegistered: d.faceRegistered ?? false,
    facePhotoUrl: d.facePhotoUrl || d.face_photo_url || '',
    workShift: d.workShift || d.work_shift || 'SH-01',
    documents: Array.isArray(d.documents) ? d.documents : [],
    departmentId: d.departmentId || d.department_id,
    designationId: d.designationId || d.designation_id,
    branchId: d.branchId || d.branch_id,
    role: (d.role === 'CEO' || d.designation === 'CEO' || (d.designation && d.designation.toLowerCase().includes('ceo')) || d.role_id === '42a8b0c3-22e5-40a0-bf78-2dd14475c6d6')
      ? 'CEO'
      : (d.role || (d.designation === 'HR Manager' ? 'HR Manager' : 'Employee')),
    mustChangePassword: d.mustChangePassword ?? d.must_change_password ?? false,
    accountStatus: d.accountStatus || d.account_status || 'ACTIVE',
    credentialEmailStatus: d.credentialEmailStatus || d.credential_email_status || 'SENT',
    credentialEmailSentAt: d.credentialEmailSentAt || d.credential_email_sent_at || '',
    authUserId: d.authUserId || d.auth_id || d.id,
    password: d.password,
  });`;

// Replace lines from `// Live Supabase Database synchronization for employees` to the end of `refreshTasks = async () => { ... };`
const oldSyncStartStr = '// Live Supabase Database synchronization for employees';
const oldSyncEndStr = 'console.warn(\'Notice refreshing tasks from Supabase:\', err);\r\n    }\r\n  };';
const oldSyncEndStrAlt = 'console.warn(\'Notice refreshing tasks from Supabase:\', err);\n    }\n  };';

let startIndex = content.indexOf(oldSyncStartStr);
let endIndex = content.indexOf(oldSyncEndStr);
let endLength = oldSyncEndStr.length;

if (endIndex === -1) {
  endIndex = content.indexOf(oldSyncEndStrAlt);
  endLength = oldSyncEndStrAlt.length;
}

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not locate old sync block! startIndex:', startIndex, 'endIndex:', endIndex);
  process.exit(1);
}

content = content.slice(0, startIndex) + mapEmployeeCode + content.slice(endIndex + endLength);
console.log('Successfully replaced old partial sync block with mapEmployeeFromDb!');

// 2. Define master syncAllModulesFromDatabase and cloud sync triggers
const masterSyncCode = `
  // ============================================================================
  // MASTER SUPABASE CLOUD SYNCHRONIZATION ENGINE
  // Connects and synchronizes all HRM modules across all devices and browsers
  // ============================================================================
  const syncAllModulesFromDatabase = async (isInitial = false) => {
    if (isSyncingFromCloud.current) return;
    try {
      isSyncingFromCloud.current = true;

      // Parallel batch fetch directly from Supabase Cloud
      const [rawEmployees, rawTasks, cloudSettings, cloudDepts] = await Promise.all([
        supabaseDirect.getEmployees().catch(() => []),
        supabaseDirect.getTasks().catch(() => []),
        supabaseDirect.getAllCompanySettings().catch(() => ({})),
        supabaseDirect.getDepartments().catch(() => [])
      ]);

      // 1. Synchronize Employees
      if (Array.isArray(rawEmployees) && rawEmployees.length > 0) {
        const mapped = rawEmployees.map(mapEmployeeFromDb);
        setEmployees(mapped);
        try { localStorage.setItem('vrm_hrms_employees', JSON.stringify(mapped)); } catch {}
      }

      // 2. Synchronize Enterprise Tasks
      if (Array.isArray(rawTasks) && rawTasks.length > 0) {
        const sanitized = rawTasks.map(sanitizeSelfAssignedTask);
        setEnhancedTasks(sanitized);
        try { localStorage.setItem('vrm_hrms_enhanced_tasks', JSON.stringify(sanitized)); } catch {}
      }

      // 3. Synchronize All Company Settings & Core Modules
      if (cloudSettings && typeof cloudSettings === 'object') {
        // Organization Structure & Departments
        const cloudOrg = cloudSettings.org_structure;
        if (cloudOrg && typeof cloudOrg === 'object') {
          const deptNames = Array.isArray(cloudOrg.departments) ? [...cloudOrg.departments] : [];
          if (Array.isArray(cloudDepts)) {
            cloudDepts.forEach((d: any) => {
              if (d.name && !deptNames.includes(d.name)) deptNames.push(d.name);
            });
          }
          const mergedOrg: OrganizationStructure = {
            departments: deptNames,
            designations: Array.isArray(cloudOrg.designations) ? cloudOrg.designations : [],
            employmentTypes: Array.isArray(cloudOrg.employmentTypes) ? cloudOrg.employmentTypes : [],
            workLocations: Array.isArray(cloudOrg.workLocations) ? cloudOrg.workLocations : [],
            reportingManagers: Array.isArray(cloudOrg.reportingManagers) ? cloudOrg.reportingManagers : [],
            teams: Array.isArray(cloudOrg.teams) ? cloudOrg.teams : []
          };
          setOrgStructure(mergedOrg);
          try { localStorage.setItem('vrm_hrms_org_structure', JSON.stringify(mergedOrg)); } catch {}

          setDepartments(mergedOrg.departments.map(name => ({
            id: \`dept-\${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}\`,
            name,
            code: name.substring(0, 4).toUpperCase(),
            headName: 'Unassigned',
            headId: '',
            employeeCount: 0,
            budget: 0
          })));
        } else if (Array.isArray(cloudDepts) && cloudDepts.length > 0) {
          setOrgStructure(prev => ({ ...prev, departments: cloudDepts.map(d => d.name) }));
          setDepartments(cloudDepts.map(d => ({
            id: d.id,
            name: d.name,
            code: d.code,
            headName: 'Unassigned',
            headId: d.head_id || '',
            employeeCount: 0,
            budget: d.budget || 0
          })));
        }

        // Company Details & Branches
        if (cloudSettings.company_info && typeof cloudSettings.company_info === 'object' && cloudSettings.company_info.companyName) {
          setCompanyInfo(cloudSettings.company_info);
          try { localStorage.setItem('vrm_hrms_company_info', JSON.stringify(cloudSettings.company_info)); } catch {}
        }
        if (Array.isArray(cloudSettings.company_branches) && cloudSettings.company_branches.length > 0) {
          setCompanyBranches(cloudSettings.company_branches);
          try { localStorage.setItem('vrm_hrms_company_branches', JSON.stringify(cloudSettings.company_branches)); } catch {}
        }

        // Shifts
        if (Array.isArray(cloudSettings.shifts_data) && cloudSettings.shifts_data.length > 0) {
          setShifts(cloudSettings.shifts_data);
          try { localStorage.setItem('vrm_hrms_shifts', JSON.stringify(cloudSettings.shifts_data)); } catch {}
        } else if (isInitial) {
          supabaseDirect.saveCompanySetting('shifts_data', shifts);
        }

        // Shift Requests
        if (Array.isArray(cloudSettings.shift_requests_data)) {
          setShiftRequests(cloudSettings.shift_requests_data);
          try { localStorage.setItem('vrm_hrms_shift_requests', JSON.stringify(cloudSettings.shift_requests_data)); } catch {}
        }

        // Leave Requests
        if (Array.isArray(cloudSettings.leave_requests_data) && cloudSettings.leave_requests_data.length > 0) {
          setLeaveRequests(cloudSettings.leave_requests_data);
          try { localStorage.setItem('vrm_hrms_leave_requests', JSON.stringify(cloudSettings.leave_requests_data)); } catch {}
        } else if (isInitial) {
          supabaseDirect.saveCompanySetting('leave_requests_data', leaveRequests);
        }

        // Holiday Policies
        if (Array.isArray(cloudSettings.holiday_policies_data) && cloudSettings.holiday_policies_data.length > 0) {
          setHolidayPolicies(cloudSettings.holiday_policies_data);
          try { localStorage.setItem('vrm_hrms_holiday_policies', JSON.stringify(cloudSettings.holiday_policies_data)); } catch {}
        }

        // Attendance Records
        if (Array.isArray(cloudSettings.attendance_records_data) && cloudSettings.attendance_records_data.length > 0) {
          setAttendanceRecords(cloudSettings.attendance_records_data);
          try { localStorage.setItem('vrm_hrms_attendance_records', JSON.stringify(cloudSettings.attendance_records_data)); } catch {}
        } else if (isInitial) {
          supabaseDirect.saveCompanySetting('attendance_records_data', attendanceRecords);
        }

        // Loan Policies
        if (Array.isArray(cloudSettings.loan_policies_data) && cloudSettings.loan_policies_data.length > 0) {
          setLoanPolicies(cloudSettings.loan_policies_data);
          try { localStorage.setItem('vrm_hrms_loan_policies', JSON.stringify(cloudSettings.loan_policies_data)); } catch {}
        } else if (isInitial) {
          supabaseDirect.saveCompanySetting('loan_policies_data', loanPolicies);
        }

        // Loan Records
        if (Array.isArray(cloudSettings.loan_records_data) && cloudSettings.loan_records_data.length > 0) {
          setLoanRecords(cloudSettings.loan_records_data);
          try { localStorage.setItem('hrms_loan_records', JSON.stringify(cloudSettings.loan_records_data)); } catch {}
        } else if (isInitial) {
          supabaseDirect.saveCompanySetting('loan_records_data', loanRecords);
        }

        // Assets
        if (Array.isArray(cloudSettings.assets_data) && cloudSettings.assets_data.length > 0) {
          setAssets(cloudSettings.assets_data);
          try { localStorage.setItem('vrm_hrms_assets', JSON.stringify(cloudSettings.assets_data)); } catch {}
        } else if (isInitial) {
          supabaseDirect.saveCompanySetting('assets_data', assets);
        }

        // Expenses
        if (Array.isArray(cloudSettings.expenses_data) && cloudSettings.expenses_data.length > 0) {
          setExpenses(cloudSettings.expenses_data);
          try { localStorage.setItem('vrm_hrms_expenses', JSON.stringify(cloudSettings.expenses_data)); } catch {}
        } else if (isInitial) {
          supabaseDirect.saveCompanySetting('expenses_data', expenses);
        }

        // MOM Meetings
        if (Array.isArray(cloudSettings.mom_meetings_data) && cloudSettings.mom_meetings_data.length > 0) {
          setMomMeetings(cloudSettings.mom_meetings_data);
          try { localStorage.setItem('vrm_hrms_mom_meetings', JSON.stringify(cloudSettings.mom_meetings_data)); } catch {}
        } else if (isInitial) {
          supabaseDirect.saveCompanySetting('mom_meetings_data', momMeetings);
        }

        // Payroll Records
        if (Array.isArray(cloudSettings.payroll_records_data) && cloudSettings.payroll_records_data.length > 0) {
          setPayrollRecords(cloudSettings.payroll_records_data);
          try { localStorage.setItem('vrm_hrms_payroll_records', JSON.stringify(cloudSettings.payroll_records_data)); } catch {}
        } else if (isInitial) {
          supabaseDirect.saveCompanySetting('payroll_records_data', payrollRecords);
        }

        // Geofence Config
        if (cloudSettings.geofence_config && typeof cloudSettings.geofence_config === 'object' && cloudSettings.geofence_config.officeName) {
          setGeofenceConfig(cloudSettings.geofence_config);
          try { localStorage.setItem('vrm_hrms_geofence_config', JSON.stringify(cloudSettings.geofence_config)); } catch {}
        }

        // Field Duty & Tracking
        if (Array.isArray(cloudSettings.field_assignments_data) && cloudSettings.field_assignments_data.length > 0) {
          setFieldAssignments(cloudSettings.field_assignments_data);
          try { localStorage.setItem('vrm_hrms_field_assignments', JSON.stringify(cloudSettings.field_assignments_data)); } catch {}
        }
        if (Array.isArray(cloudSettings.trip_sessions_data) && cloudSettings.trip_sessions_data.length > 0) {
          setTripSessions(cloudSettings.trip_sessions_data);
          try { localStorage.setItem('vrm_hrms_trip_sessions', JSON.stringify(cloudSettings.trip_sessions_data)); } catch {}
        }
        if (Array.isArray(cloudSettings.tracking_alerts_data) && cloudSettings.tracking_alerts_data.length > 0) {
          setTrackingAlerts(cloudSettings.tracking_alerts_data);
          try { localStorage.setItem('vrm_hrms_tracking_alerts', JSON.stringify(cloudSettings.tracking_alerts_data)); } catch {}
        }
      }
    } catch (err) {
      console.warn('[HRMSContext] syncAllModulesFromDatabase notice:', err);
    } finally {
      isSyncingFromCloud.current = false;
      isCloudInitialized.current = true;
    }
  };

  useEffect(() => {
    let isCancelled = false;
    syncAllModulesFromDatabase(true);

    // Live Supabase auto-sync poll (every 15 seconds) across all devices
    const syncInterval = setInterval(() => {
      if (!isCancelled) {
        syncAllModulesFromDatabase(false);
      }
    }, 15000);

    // Sync immediately whenever user switches tabs or window receives focus
    const onFocusWindow = () => {
      if (!isCancelled) {
        syncAllModulesFromDatabase(false);
      }
    };
    window.addEventListener('focus', onFocusWindow);

    return () => {
      isCancelled = true;
      clearInterval(syncInterval);
      window.removeEventListener('focus', onFocusWindow);
    };
  }, []);

  const refreshEmployees = async () => {
    await syncAllModulesFromDatabase(false);
  };

  const refreshSettings = async () => {
    await syncAllModulesFromDatabase(false);
  };

  const refreshTasks = async () => {
    await syncAllModulesFromDatabase(false);
  };

  const syncAllWithCloud = async () => {
    await syncAllModulesFromDatabase(false);
  };
`;

// Insert masterSyncCode right before `return (`
const returnTarget = '  return (\r\n    <HRMSContext.Provider value={{';
const returnTargetAlt = '  return (\n    <HRMSContext.Provider value={{';

let retIndex = content.indexOf(returnTarget);
let retLen = returnTarget.length;
let useAlt = false;

if (retIndex === -1) {
  retIndex = content.indexOf(returnTargetAlt);
  retLen = returnTargetAlt.length;
  useAlt = true;
}

if (retIndex === -1) {
  console.error('Could not locate return (<HRMSContext.Provider!');
  process.exit(1);
}

content = content.slice(0, retIndex) + masterSyncCode + '\n' + content.slice(retIndex);

// Also add syncAllWithCloud to provider value
const refreshValueTarget = '      refreshEmployees,\r\n      refreshSettings,';
const refreshValueTargetAlt = '      refreshEmployees,\n      refreshSettings,';
let refIndex = content.indexOf(refreshValueTarget);
let refLen = refreshValueTarget.length;

if (refIndex === -1) {
  refIndex = content.indexOf(refreshValueTargetAlt);
  refLen = refreshValueTargetAlt.length;
}

if (refIndex !== -1) {
  const replacement = '      refreshEmployees,\n      refreshSettings,\n      syncAllWithCloud,';
  content = content.slice(0, refIndex) + replacement + content.slice(refIndex + refLen);
  console.log('Added syncAllWithCloud to HRMSContext.Provider value!');
} else {
  console.warn('Could not locate refreshEmployees in provider value, checking manually');
}

fs.writeFileSync(filePath, content, 'utf8');
console.log('Successfully updated HRMSContext.tsx with full Supabase cloud database sync!');
