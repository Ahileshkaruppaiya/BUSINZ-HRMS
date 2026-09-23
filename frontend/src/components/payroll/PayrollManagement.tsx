import React, { useState, useMemo } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { CreditCard, IndianRupee, CheckCircle2, FileText, Download, X, Edit3, ShieldAlert, ShieldCheck } from 'lucide-react';
import { PayrollRecord, Employee } from '../../types/hrms';
import { SalaryComponentConfig } from '../../types/settings';
import { toNum, formatCurrency } from '../../utils/numbers';
import { downloadElementAsPDF, downloadCSV, downloadExcel, downloadPDF } from '../../utils/exportUtils';
import { ExportDropdown } from '../common/ExportDropdown';
import { StandardFloatingActionBar } from '../common/StandardFloatingActionBar';
import { StandardTablePagination } from '../common/StandardTablePagination';

export const PayrollManagement: React.FC = () => {
  const { 
    payrollRecords, 
    processPayrollBatch, 
    updatePayrollRecordAdvanceDeduction,
    employees, 
    currentUser, 
    hasPermission, 
    businessSettings,
    masterAttendancePolicies,
    masterLeavePolicies,
    activeLoanPolicy,
    loanPolicies,
    loanRecords,
    payrollSettingsConfig
  } = useHRMS();

  const [selectedPayslip, setSelectedPayslip] = useState<PayrollRecord | null>(null);

  // Multi-row selection state
  const [selectedPayslipIds, setSelectedPayslipIds] = useState<string[]>([]);

  // Advance Salary / Loan Recovery ("Others") Editing State
  const [editingAdvance, setEditingAdvance] = useState<{ recordId: string; employeeName: string; currentAmount: number } | null>(null);
  const [advanceInputVal, setAdvanceInputVal] = useState<number>(0);

  // Pagination state (Standardized to [5, 10] per design system)
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Define strict approval authority: CEO, Super Admin, HR Manager, HR Admin
  const isApprovalAuthority = 
    ['CEO', 'Super Admin', 'HR Manager', 'HR Admin'].includes(currentUser.role) ||
    (currentUser as any).designation?.toLowerCase().includes('ceo') ||
    (currentUser as any).designation?.toLowerCase().includes('managing director');

  // Define Accounts Department users: Finance Manager or Accounts/Finance department/designation
  const isAccountsUser = 
    currentUser.role === 'Finance Manager' ||
    (currentUser.department && (currentUser.department.toLowerCase().includes('accounts') || currentUser.department.toLowerCase().includes('finance'))) ||
    (currentUser.designation && (currentUser.designation.toLowerCase().includes('account') || currentUser.designation.toLowerCase().includes('finance')));

  const isEmployeeRole = currentUser.role === 'Employee' && !isAccountsUser && !isApprovalAuthority;
  const isPrivilegedViewer = isAccountsUser || isApprovalAuthority;
  const canProcessPayroll = isApprovalAuthority;

  // If user is a Finance employee or admin, show all employees' payroll details
  const visibleRecords = isEmployeeRole
    ? payrollRecords.filter(p => p.employeeId === (currentUser.employeeId || 'EMP-001'))
    : payrollRecords;

  const totalEntries = visibleRecords.length;
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedRecords = visibleRecords.slice(startIndex, startIndex + pageSize);

  const totalPayout = visibleRecords.reduce((acc, curr) => acc + toNum(curr.netSalary), 0);
  const processedCount = visibleRecords.filter(p => p.status === 'Processed' || p.status === 'Paid').length;

  const handleTogglePayslip = (id: string) => {
    setSelectedPayslipIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const handleToggleSelectAll = () => {
    if (paginatedRecords.length > 0 && paginatedRecords.every(p => selectedPayslipIds.includes(p.id))) {
      setSelectedPayslipIds(prev => prev.filter(id => !paginatedRecords.some(p => p.id === id)));
    } else {
      const pageIds = paginatedRecords.map(p => p.id);
      setSelectedPayslipIds(prev => Array.from(new Set([...prev, ...pageIds])));
    }
  };

  const openAdvanceModal = (p: PayrollRecord) => {
    setEditingAdvance({
      recordId: p.id,
      employeeName: p.employeeName,
      currentAmount: toNum(p.advanceDeduction || 0)
    });
    setAdvanceInputVal(toNum(p.advanceDeduction || 0));
  };

  const handleSaveAdvanceDeduction = () => {
    if (editingAdvance) {
      updatePayrollRecordAdvanceDeduction(editingAdvance.recordId, advanceInputVal);
      if (selectedPayslip && selectedPayslip.id === editingAdvance.recordId) {
        setSelectedPayslip(prev => prev ? { ...prev, advanceDeduction: advanceInputVal } : null);
      }
      setEditingAdvance(null);
    }
  };

  // Active Policy visibility flags
  const activeAttPolicy = masterAttendancePolicies.find(p => p.status === 'Active');
  const activeLeavePolicy = masterLeavePolicies.find(p => p.status === 'Active');
  const activeLoanPol = activeLoanPolicy || loanPolicies.find(p => p.status === 'Active');
  const isAttGeneric = activeAttPolicy ? activeAttPolicy.deductionVisibility === 'GENERIC' : true;
  const isLeaveGeneric = activeLeavePolicy ? activeLeavePolicy.deductionVisibility === 'GENERIC' : true;
  const isLoanGeneric = activeLoanPol ? activeLoanPol.payslipVisibility === 'GENERIC' : true;

  // Dynamic Salary Components from Payroll Settings
  const activeEarnings = useMemo(() => {
    return (payrollSettingsConfig?.components || []).filter(c => c.active && c.type === 'EARNING');
  }, [payrollSettingsConfig]);

  const activeDeductions = useMemo(() => {
    return (payrollSettingsConfig?.components || []).filter(c => c.active && c.type === 'DEDUCTION');
  }, [payrollSettingsConfig]);

  // Evaluates a salary component's dynamic value for an employee payroll record
  const getComponentValue = (comp: SalaryComponentConfig, p: PayrollRecord, emp?: Employee): number => {
    const code = (comp.code || '').toUpperCase().trim();
    const basic = toNum(p.basicSalary);
    
    // Direct matches if available on PayrollRecord or Employee
    if (code === 'BASIC') {
      return basic;
    }
    if (code === 'DA') {
      if (p.da !== undefined) return toNum(p.da);
    }
    if (code === 'HRA') {
      if (p.hra !== undefined) return toNum(p.hra);
    }
    if (code === 'CONV' || code === 'CONVEYANCE') {
      if (p.conveyance !== undefined) return toNum(p.conveyance);
    }

    // Check employee allowances object if present
    if (emp && emp.allowances) {
      const custom = (emp.allowances as any)[comp.code.toLowerCase()] ?? (emp.allowances as any)[comp.code];
      if (custom !== undefined && custom !== null && toNum(custom) > 0) {
        return toNum(custom);
      }
    }

    // Calculate dynamically based on component calculationMethod
    if (comp.calculationMethod === 'PERCENTAGE') {
      const basicComp = activeEarnings.find(c => c.code === 'BASIC' || c.name.toLowerCase().includes('basic'));
      const basicPercent = (basicComp?.calculationMethod === 'PERCENTAGE' && basicComp.defaultValue > 0) ? basicComp.defaultValue : 40;
      const ctc = emp?.salaryDetails?.monthlyCtc || (basicPercent > 0 ? Math.round(basic / (basicPercent / 100)) : basic);
      const base = comp.percentageBase === 'BASIC' ? basic : ctc;
      return Math.round((base * (comp.defaultValue || 0)) / 100);
    }

    if (comp.calculationMethod === 'FIXED_AMOUNT') {
      return toNum(comp.defaultValue || 0);
    }

    return 0;
  };

  // Dynamic salary formula banner text
  const salaryFormulaText = useMemo(() => {
    if (activeEarnings.length === 0) {
      return 'Salary Formula: Basic Salary + Allowances (Custom components can be configured in Settings → Payroll Settings)';
    }
    const parts = activeEarnings.map(c => {
      if (c.calculationMethod === 'PERCENTAGE') {
        return `${c.name} (${c.defaultValue}%)`;
      }
      if (c.calculationMethod === 'FIXED_AMOUNT') {
        return `${c.name} (${formatCurrency(c.defaultValue)})`;
      }
      return c.name;
    });
    const totalPercent = activeEarnings
      .filter(c => c.calculationMethod === 'PERCENTAGE' && (c.percentageBase === 'CTC' || !c.percentageBase))
      .reduce((sum, c) => sum + c.defaultValue, 0);
    return `Salary Formula: ${parts.join(' + ')}${totalPercent > 0 ? ` = ${totalPercent}% CTC` : ''}`;
  }, [activeEarnings]);

  // Export Handlers (Excel, PDF, CSV)
  const getPayrollExportData = () => {
    const dynamicColumns = activeEarnings.length > 0
      ? activeEarnings.map(comp => ({
          key: comp.code.toLowerCase(),
          label: `${comp.name}${comp.calculationMethod === 'PERCENTAGE' ? ` (${comp.defaultValue}%)` : ''}`,
          comp
        }))
      : [
          { key: 'basicSalary', label: 'Basic Salary', comp: null },
          { key: 'allowances', label: 'Allowances', comp: null }
        ];

    const columns = [
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'employeeName', label: 'Employee Name' },
      { key: 'department', label: 'Department' },
      ...dynamicColumns.map(d => ({ key: d.key, label: d.label })),
      { key: 'advanceDeduction', label: 'Advance / Loan EMI' },
      { key: 'epfDeduction', label: 'EPF (12%)' },
      { key: 'esiDeduction', label: 'ESIC (0.75%)' },
      { key: 'professionalTax', label: 'PT' },
      { key: 'workingDays', label: 'Working Days' },
      { key: 'netSalary', label: 'Net Payout' },
      { key: 'status', label: 'Status' }
    ];

    const data = payrollRecords.map(p => {
      const emp = employees.find(e => e.employeeId === p.employeeId || e.id === p.employeeId);
      const rowData: Record<string, any> = {
        employeeId: p.employeeId,
        employeeName: p.employeeName,
        department: p.department,
        advanceDeduction: toNum(p.advanceDeduction || 0),
        epfDeduction: toNum(p.epfDeduction || 0),
        esiDeduction: toNum(p.esiDeduction || 0),
        professionalTax: toNum(p.professionalTax || 0),
        workingDays: `${p.presentDays || 0} / ${p.workingDays || 0}`,
        netSalary: toNum(p.netSalary),
        status: p.status
      };

      if (activeEarnings.length > 0) {
        dynamicColumns.forEach(d => {
          if (d.comp) {
            rowData[d.key] = getComponentValue(d.comp, p, emp);
          }
        });
      } else {
        rowData.basicSalary = toNum(p.basicSalary);
        rowData.allowances = toNum(p.allowances);
      }

      return rowData;
    });

    return { columns, data };
  };

  const handleExportCSV = () => {
    const { columns, data } = getPayrollExportData();
    downloadCSV(data, `Payroll_Register_${new Date().toISOString().slice(0, 10)}`, columns);
  };

  const handleExportExcel = () => {
    const { columns, data } = getPayrollExportData();
    downloadExcel(data, `Payroll_Register_${new Date().toISOString().slice(0, 10)}`, columns);
  };

  const handleExportPDF = () => {
    const { columns, data } = getPayrollExportData();
    downloadPDF(data, 'Monthly Processed Payroll Register', `Payroll_Register_${new Date().toISOString().slice(0, 10)}`, columns);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Page Header */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 className="page-title">
            {isEmployeeRole ? 'My Payroll & Payslips' : 'Payroll Management'}
          </h1>
          <p className="page-subtitle">
            {isEmployeeRole 
              ? 'View official monthly salary slips, itemized allowances, statutory deductions, and download signed records.'
              : 'Automated calculation engine based on configured payroll components, statutory compliance, and batch disbursement.'}
          </p>
        </div>

        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {canProcessPayroll ? (
            <button className="btn btn-primary" onClick={processPayrollBatch}>
              <CreditCard size={16} /> Process August Payroll Batch
            </button>
          ) : isAccountsUser ? (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 14px',
              borderRadius: '10px',
              backgroundColor: '#ECFEFF',
              border: '1px solid #A5F3FC',
              color: '#0E7490',
              fontSize: '0.82rem',
              fontWeight: 700
            }}>
              <ShieldCheck size={16} /> Accounts Disbursal Access • Approved by HR / CEO
            </div>
          ) : null}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span>Total August Net Payout</span>
            <div className="kpi-icon-wrapper emerald"><IndianRupee size={20} /></div>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-value">{formatCurrency(totalPayout)}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span>Total Staff Included</span>
            <div className="kpi-icon-wrapper blue"><CreditCard size={20} /></div>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-value">{isEmployeeRole ? 1 : employees.length}</div>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-card-header">
            <span>Processed Payroll Runs</span>
            <div className="kpi-icon-wrapper purple"><CheckCircle2 size={20} /></div>
          </div>
          <div className="kpi-card-body">
            <div className="kpi-value">{processedCount}</div>
          </div>
        </div>
      </div>

      {/* Payroll Records Table */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 className="card-title" style={{ margin: 0 }}>
              {isEmployeeRole ? 'My Payslips History' : 'August 2026 Processed Salary Batch'}
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
              {salaryFormulaText}
            </span>
          </div>
          <ExportDropdown 
            onExportExcel={handleExportExcel}
            onExportPDF={handleExportPDF}
            onExportCSV={handleExportCSV}
          />
        </div>

        <div className="table-responsive">
          <table className="hrms-table">
            <thead>
              <tr>
                <th style={{ width: '40px', minWidth: '40px', textAlign: 'center' }}>
                  <input
                    type="checkbox"
                    checked={paginatedRecords.length > 0 && paginatedRecords.every(p => selectedPayslipIds.includes(p.id))}
                    onChange={handleToggleSelectAll}
                    style={{ accentColor: '#0E7490', cursor: 'pointer', width: '16px', height: '16px' }}
                    aria-label="Select all payslips"
                  />
                </th>
                <th>Employee</th>
                <th>Department</th>
                {activeEarnings.length > 0 ? (
                  activeEarnings.map(comp => (
                    <th key={comp.id}>
                      {comp.name} {comp.calculationMethod === 'PERCENTAGE' ? `(${comp.defaultValue}%)` : ''}
                    </th>
                  ))
                ) : (
                  <>
                    <th>Basic Salary</th>
                    <th>Allowances</th>
                  </>
                )}
                <th>Others (Advance / Loan)</th>
                <th>Statutory & Tax</th>
                <th>Working Days</th>
                <th>Net Salary</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRecords.map(p => {
                const isSelected = selectedPayslipIds.includes(p.id);
                const emp = employees.find(e => e.employeeId === p.employeeId || e.id === p.employeeId);
                const basic = toNum(p.basicSalary);
                const advance = toNum(p.advanceDeduction || 0);
                const statutoryTax = toNum(p.epfDeduction || 0) + toNum(p.esiDeduction || 0) + toNum(p.professionalTax || 0);

                return (
                  <tr 
                    key={p.id}
                    style={{
                      backgroundColor: isSelected ? '#ECFEFF' : undefined,
                      borderLeft: isSelected ? '4px solid #0E7490' : undefined,
                      transition: 'background-color 0.15s ease'
                    }}
                  >
                    <td style={{ textAlign: 'center', verticalAlign: 'middle', width: '40px' }} onClick={e => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTogglePayslip(p.id)}
                        style={{ accentColor: '#0E7490', cursor: 'pointer', width: '16px', height: '16px' }}
                        aria-label={`Select payslip for ${p.employeeName}`}
                      />
                    </td>
                    <td>
                      <div>
                        <strong>{p.employeeName}</strong>
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', marginTop: '2px' }}>
                          <span style={{ fontSize: '0.72rem', color: '#64748B' }}>{p.employeeId}</span>
                          {p.withPf === false ? (
                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#FEF3C7', color: '#92400E', fontWeight: 600 }}>
                              No PF (&lt;6M)
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: '#ECFDF5', color: '#065F46', fontWeight: 600 }}>
                              PF Active
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>{p.department}</td>
                    {activeEarnings.length > 0 ? (
                      activeEarnings.map(comp => {
                        const val = getComponentValue(comp, p, emp);
                        return (
                          <td key={comp.id}>
                            {formatCurrency(val)}
                          </td>
                        );
                      })
                    ) : (
                      <>
                        <td>{formatCurrency(basic)}</td>
                        <td>+{formatCurrency(p.allowances)}</td>
                      </>
                    )}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ 
                          color: advance > 0 ? 'var(--accent-rose)' : '#94A3B8', 
                          fontWeight: advance > 0 ? 700 : 400 
                        }}>
                          {advance > 0 ? `-${formatCurrency(advance)}` : '₹0.00'}
                        </span>
                        {canProcessPayroll && (
                          <button
                            type="button"
                            title="Edit Advance / Loan Recovery installment"
                            onClick={(e) => {
                              e.stopPropagation();
                              openAdvanceModal(p);
                            }}
                            style={{
                              background: '#F1F5F9',
                              border: '1px solid #CBD5E1',
                              borderRadius: '4px',
                              padding: '2px 5px',
                              fontSize: '0.7rem',
                              cursor: 'pointer',
                              color: '#0E7490',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '2px'
                            }}
                          >
                            <Edit3 size={11} /> Edit
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ color: 'var(--accent-rose)' }}>
                      -{formatCurrency(statutoryTax)}
                    </td>
                    <td>{p.presentDays} / {p.workingDays} days</td>
                    <td><strong style={{ color: 'var(--accent-emerald)', fontSize: '0.95rem' }}>{formatCurrency(p.netSalary)}</strong></td>
                    <td><span className="status-pill approved">{p.status}</span></td>
                    <td>
                      <button 
                        className="btn btn-secondary btn-sm" 
                        onClick={() => setSelectedPayslip(p)}
                        title="View Payslip"
                        aria-label="View Payslip"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '6px 10px',
                          borderRadius: '8px',
                          color: '#0E7490'
                        }}
                      >
                        <FileText size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Standardized Table Pagination */}
        <StandardTablePagination
          currentPage={currentPage}
          totalEntries={totalEntries}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeOptions={[5, 10]}
        />
      </div>

      {/* Floating Action Bar per AGENTS.md */}
      <StandardFloatingActionBar
        selectedCount={selectedPayslipIds.length}
        onClearSelection={() => setSelectedPayslipIds([])}
        onEdit={selectedPayslipIds.length === 1 ? () => {
          const rec = visibleRecords.find(p => p.id === selectedPayslipIds[0]);
          if (rec) setSelectedPayslip(rec);
        } : undefined}
      />

      {/* Modal: Edit Advance / Loan Recovery ("Others") */}
      {editingAdvance && (
        <div className="modal-overlay" style={{ zIndex: 1100 }}>
          <div className="modal-content" style={{ maxWidth: '420px', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <div className="modal-header" style={{ padding: '16px 20px', borderBottom: '1px solid #E2E8F0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit3 size={18} color="#0E7490" />
                <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                  Edit Advance Salary / Loan Recovery
                </h3>
              </div>
              <button 
                type="button" 
                onClick={() => setEditingAdvance(null)} 
                style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>
            <div className="modal-body" style={{ padding: '18px 20px' }}>
              <div style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '8px', padding: '10px 12px', marginBottom: '16px', fontSize: '0.82rem' }}>
                <div>Employee: <strong>{editingAdvance.employeeName}</strong></div>
                <div style={{ color: '#64748B', marginTop: '2px' }}>Deduction Category: <strong>Others (Advance / Loan Recovery)</strong></div>
              </div>

              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Monthly Recovery Amount (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  className="form-control"
                  value={advanceInputVal}
                  onChange={(e) => setAdvanceInputVal(Math.max(0, Number(e.target.value) || 0))}
                  style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0E7490', width: '100%' }}
                  placeholder="0"
                  autoFocus
                />
                <span style={{ fontSize: '0.72rem', color: '#64748B', marginTop: '6px', display: 'block' }}>
                  Adjustable by HR, CEO, and Accounts team. Set to ₹0.00 to pause or defer deduction for this run.
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
                <button 
                  type="button" 
                  className="btn btn-secondary btn-sm" 
                  onClick={() => setEditingAdvance(null)}
                >
                  Cancel
                </button>
                <button 
                  type="button" 
                  className="btn btn-primary btn-sm"
                  style={{ backgroundColor: '#0E7490', border: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                  onClick={handleSaveAdvanceDeduction}
                >
                  Save Recovery Amount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Printable Payslip Modal */}
      {selectedPayslip && (() => {
        const basicSalary = toNum(selectedPayslip.basicSalary);
        const da = toNum(selectedPayslip.da ?? Math.round(basicSalary * 0.5));
        const conveyance = toNum(selectedPayslip.conveyance ?? Math.round(basicSalary * 0.125));
        const hra = toNum(selectedPayslip.hra ?? Math.round(basicSalary * 0.875));
        const attBonus = toNum(selectedPayslip.attendanceBonus || 0);
        const otAmount = toNum(selectedPayslip.overtimeAmount || 0);
        const rewardBonus = toNum(selectedPayslip.bonus) + toNum(selectedPayslip.rewardEarnings || 0);

        const totalGross = basicSalary + da + conveyance + hra + attBonus + otAmount + rewardBonus;

        const isWithPf = selectedPayslip.withPf !== undefined 
          ? selectedPayslip.withPf 
          : (toNum(selectedPayslip.epfDeduction) > 0);

        const epfDeduction = isWithPf 
          ? toNum(selectedPayslip.epfDeduction || Math.round((basicSalary + da + conveyance) * 0.12))
          : 0;
        const esiDeduction = isWithPf
          ? toNum(selectedPayslip.esiDeduction || (totalGross <= 21000 ? Math.round(totalGross * 0.0075) : 0))
          : 0;
        const ptDeduction = toNum(selectedPayslip.professionalTax || 0);
        const advanceRecovery = toNum(selectedPayslip.advanceDeduction || 0);
        const leaveDeduction = toNum(selectedPayslip.leaveDeduction || 0);
        const lateDeduction = toNum(selectedPayslip.lateAttendanceDeduction || 0);

        const totalDeductions = epfDeduction + esiDeduction + ptDeduction + advanceRecovery + leaveDeduction + lateDeduction;
        const netSalary = Math.max(0, totalGross - totalDeductions);

        return (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '720px' }}>
              <div className="modal-header">
                <h2>Official Employee Payslip</h2>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    type="button"
                    className="btn btn-primary btn-sm" 
                    onClick={() => downloadElementAsPDF('printable-payslip-content', `Payslip_${selectedPayslip.employeeName.replace(/\s+/g, '_')}_${selectedPayslip.month}_${selectedPayslip.year}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '6px', backgroundColor: '#0E7490', border: 'none' }}
                  >
                    <Download size={14} /> Download PDF
                  </button>
                  <button onClick={() => setSelectedPayslip(null)}><X size={20} /></button>
                </div>
              </div>
              <div className="modal-body">
                <div className="payslip-container" id="printable-payslip-content">
                  <div className="payslip-header">
                    <div>
                      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0E7490' }}>
                        {businessSettings?.businessName || 'Businz'}
                      </h2>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {businessSettings?.address || 'Plot 42, Heavy Industrial Growth Estate, Guindy, Chennai, Tamil Nadu - 600032'}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>PAYSLIP: {selectedPayslip.month.toUpperCase()} {selectedPayslip.year}</h3>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ref: {selectedPayslip.id}</span>
                    </div>
                  </div>

                  {/* Scheme & Details Banner */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: isWithPf ? '#ECFDF5' : '#FFFBEB', border: isWithPf ? '1px solid #A7F3D0' : '1px solid #FDE68A', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isWithPf ? <ShieldCheck size={16} color="#059669" /> : <ShieldAlert size={16} color="#D97706" />}
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isWithPf ? '#065F46' : '#92400E' }}>
                        Salary Scheme: {isWithPf ? 'With PF & ESIC Deductions (Active)' : 'Without PF & ESIC (Probation / < 6 Months Policy)'}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                      {salaryFormulaText}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', fontSize: '0.82rem', marginBottom: '20px', backgroundColor: '#f8fafc', padding: '12px', borderRadius: 'var(--radius-sm)' }}>
                    <div><strong>Employee Name:</strong> {selectedPayslip.employeeName}</div>
                    <div><strong>Employee ID:</strong> {selectedPayslip.employeeId}</div>
                    <div><strong>Department:</strong> {selectedPayslip.department}</div>
                    <div><strong>Designation:</strong> {selectedPayslip.designation}</div>
                    <div>
                      <strong>Attendance:</strong> {selectedPayslip.presentDays} / {selectedPayslip.workingDays} days
                      {selectedPayslip.presentDays === selectedPayslip.workingDays && (
                        <span style={{ marginLeft: '6px', fontSize: '0.7rem', padding: '1px 6px', borderRadius: '4px', backgroundColor: '#DCFCE7', color: '#166534', fontWeight: 600 }}>
                          100% Perfect Attendance
                        </span>
                      )}
                    </div>
                    <div><strong>Payment Status:</strong> <span className="status-pill approved">{selectedPayslip.status}</span></div>
                  </div>

                  <table className="payslip-table">
                    <thead>
                      <tr style={{ backgroundColor: '#f1f5f9' }}>
                        <th style={{ width: '35%' }}>Earnings & Allowances</th>
                        <th style={{ width: '15%', textAlign: 'right' }}>Amount (₹)</th>
                        <th style={{ width: '35%' }}>Deductions & Recoveries</th>
                        <th style={{ width: '15%', textAlign: 'right' }}>Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(() => {
                        const emp = employees.find(e => e.employeeId === selectedPayslip.employeeId || e.id === selectedPayslip.employeeId);
                        const earningsList: { label: string; amount: number; isBold?: boolean; isGreen?: boolean; sub?: string }[] = [];

                        if (activeEarnings.length > 0) {
                          activeEarnings.forEach(comp => {
                            earningsList.push({
                              label: `${comp.name} ${comp.calculationMethod === 'PERCENTAGE' ? `(${comp.defaultValue}%)` : ''}`,
                              amount: getComponentValue(comp, selectedPayslip, emp)
                            });
                          });
                        } else {
                          earningsList.push({ label: 'Basic Salary', amount: basicSalary });
                          if (da > 0) earningsList.push({ label: 'Dearness Allowance (DA)', amount: da });
                          if (conveyance > 0) earningsList.push({ label: 'Conveyance Allowance', amount: conveyance });
                          if (hra > 0) earningsList.push({ label: 'House Rent Allowance (HRA)', amount: hra });
                        }

                        if (attBonus > 0) {
                          earningsList.push({ label: 'Attendance Bonus', amount: attBonus, isGreen: true, sub: 'Awarded for 0 LOP in Month' });
                        }
                        if (otAmount > 0) {
                          earningsList.push({ label: 'Overtime Earnings', amount: otAmount });
                        }
                        if (rewardBonus > 0) {
                          earningsList.push({ label: 'Performance Bonus & Rewards', amount: rewardBonus });
                        }

                        const deductionsList: { label: string; amount: number; isRed?: boolean; sub?: string; isExempt?: boolean }[] = [];
                        deductionsList.push({
                          label: 'EPF Employee Contribution (12%)',
                          amount: epfDeduction,
                          isExempt: !isWithPf,
                          sub: !isWithPf ? 'Exempt (< 6 Months)' : undefined
                        });
                        deductionsList.push({
                          label: 'ESIC Contribution (0.75%)',
                          amount: esiDeduction,
                          isExempt: !isWithPf,
                          sub: !isWithPf ? 'Exempt (< 6 Months)' : undefined
                        });
                        if (ptDeduction > 0) {
                          deductionsList.push({ label: 'Professional Tax (PT)', amount: ptDeduction });
                        }
                        if (advanceRecovery > 0) {
                          const remainingBal = loanRecords.find(r => r.employeeId === selectedPayslip.employeeId && (r.status === 'Active' || r.status === 'Disbursed'))?.outstandingBalance;
                          deductionsList.push({
                            label: 'Others (Advance Salary / Loan Recovery)',
                            amount: advanceRecovery,
                            isRed: true,
                            sub: remainingBal ? `Remaining Balance: ${formatCurrency(remainingBal)}` : undefined
                          });
                        }
                        if (leaveDeduction > 0) {
                          deductionsList.push({ label: 'Loss of Pay (Unpaid Leave Deduction)', amount: leaveDeduction, isRed: true });
                        }
                        if (lateDeduction > 0) {
                          deductionsList.push({ label: 'Late Attendance Penalty', amount: lateDeduction, isRed: true });
                        }

                        const maxRows = Math.max(earningsList.length, deductionsList.length);
                        return Array.from({ length: maxRows }).map((_, idx) => {
                          const earn = earningsList[idx];
                          const ded = deductionsList[idx];
                          return (
                            <tr key={idx}>
                              <td>
                                {earn ? (
                                  <>
                                    <span>{earn.label}</span>
                                    {earn.sub && <span style={{ display: 'block', fontSize: '0.68rem', color: '#059669' }}>{earn.sub}</span>}
                                  </>
                                ) : ''}
                              </td>
                              <td style={{ textAlign: 'right', color: earn?.isGreen ? '#059669' : 'inherit', fontWeight: earn?.isGreen ? 700 : 400 }}>
                                {earn ? formatCurrency(earn.amount) : ''}
                              </td>
                              <td>
                                {ded ? (
                                  <>
                                    <span>{ded.label}</span>
                                    {ded.sub && (
                                      <span style={{ display: 'block', fontSize: '0.68rem', color: ded.isExempt ? '#D97706' : '#64748B' }}>
                                        {ded.sub}
                                      </span>
                                    )}
                                  </>
                                ) : ''}
                              </td>
                              <td style={{ 
                                textAlign: 'right', 
                                color: ded?.isRed ? 'var(--accent-rose)' : (ded?.isExempt ? '#94A3B8' : 'inherit'),
                                fontWeight: ded?.isRed ? 600 : 400
                              }}>
                                {ded ? (ded.amount > 0 ? (ded.isRed ? `-${formatCurrency(ded.amount)}` : formatCurrency(ded.amount)) : (ded.isExempt ? '₹0.00' : '₹0.00')) : ''}
                              </td>
                            </tr>
                          );
                        });
                      })()}

                      <tr style={{ fontWeight: 800, backgroundColor: '#f8fafc' }}>
                        <td>Total Gross Earnings</td>
                        <td style={{ textAlign: 'right', color: '#0E7490' }}>{formatCurrency(totalGross)}</td>
                        <td>Total Deductions</td>
                        <td style={{ textAlign: 'right', color: 'var(--accent-rose)' }}>{formatCurrency(totalDeductions)}</td>
                      </tr>
                    </tbody>
                  </table>

                  <div style={{ borderTop: '2px solid var(--primary-600)', paddingTop: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '1rem', fontWeight: 800 }}>NET PAYABLE SALARY:</span>
                      <p style={{ fontSize: '0.72rem', color: '#64748B', margin: '2px 0 0 0' }}>
                        Direct Bank Transfer to Registered Account
                      </p>
                    </div>
                    <span style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                      {formatCurrency(netSalary)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
