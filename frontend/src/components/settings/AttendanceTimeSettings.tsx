import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { AttendancePolicy, LateRuleType, DeductionVisibility } from '../../types/settings';
import { validateFormula } from '../../services/policyEngine';
import { GPSGeofenceSettings } from './GPSGeofenceSettings';
import { 
  Clock, 
  CalendarCheck, 
  Calendar,
  Plus, 
  Edit3, 
  Archive, 
  CheckCircle2, 
  XCircle, 
  Eye, 
  EyeOff, 
  Calculator, 
  AlertCircle,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Sliders,
  X
} from 'lucide-react';
import { OvertimePolicySettings } from './OvertimePolicySettings';
import { WeekOffCalendarSettings } from './WeekOffCalendarSettings';
import { formatCurrency } from '../../utils/numbers';

export const AttendanceTimeSettings: React.FC = () => {
  const { 
    masterAttendancePolicies, 
    addMasterAttendancePolicy, 
    updateMasterAttendancePolicy, 
    archiveMasterAttendancePolicy, 
    toggleMasterAttendancePolicyStatus,
    orgStructure,
    companyBranches,
    employees,
    currentUser
  } = useHRMS();

  const userRole = (currentUser?.role as string) || '';
  const isCEO = userRole === 'CEO' || 
                userRole === 'Super Admin' || 
                currentUser?.designation === 'CEO' || 
                currentUser?.employeeId === 'EMP-000' ||
                userRole.toLowerCase().includes('ceo');

  const isHR = userRole === 'HR Admin' || 
               userRole === 'HR Manager' || 
               userRole === 'HR' || 
               userRole.toLowerCase().includes('hr') ||
               currentUser?.department?.toLowerCase().includes('hr');

  const isPrivileged = isCEO || isHR || userRole === 'Management' || userRole === 'Super Admin' || userRole !== 'Employee';
  const [activeSubTab, setActiveSubTab] = useState<'policies' | 'week_off' | 'ot_policies' | 'gps'>('policies');

  // Policy Modal State
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<AttendancePolicy | null>(null);

  // Form State
  const [policyForm, setPolicyForm] = useState<{
    policyName: string;
    description: string;
    applicableEmployees: 'ALL' | string[];
    applicableDepartments: 'ALL' | string[];
    applicableBranches: 'ALL' | string[];
    effectiveFrom: string;
    effectiveTo: string;
    status: 'Active' | 'Inactive';
    shiftName: string;
    startTime: string;
    endTime: string;
    graceTimeMinutes: number;
    minWorkingHours: number;
    halfDayHours: number;
    fullDayHours: number;
    weeklyOff: string[];
    holidayCalendar: string;
    lateRuleType: LateRuleType;
    fixedAmount: number;
    percentageOfDailySalary: number;
    halfDayLateHoursThreshold: number;
    customFormula: string;
    deductionVisibility: DeductionVisibility;
    genericCategoryLabel: string;
  }>({
    policyName: '',
    description: '',
    applicableEmployees: 'ALL',
    applicableDepartments: 'ALL',
    applicableBranches: 'ALL',
    effectiveFrom: '2026-01-01',
    effectiveTo: '',
    status: 'Active',
    shiftName: '',
    startTime: '09:30',
    endTime: '18:30',
    graceTimeMinutes: 10,
    minWorkingHours: 8,
    halfDayHours: 4,
    fullDayHours: 8.5,
    weeklyOff: ['Sunday'],
    holidayCalendar: 'HQ Corporate Calendar 2026',
    lateRuleType: 'COUNT_BASED',
    fixedAmount: 100,
    percentageOfDailySalary: 5,
    halfDayLateHoursThreshold: 3,
    customFormula: '(LATE_COUNT * 100)',
    deductionVisibility: 'GENERIC',
    genericCategoryLabel: 'OTHERS'
  });

  // Formula test validation state
  const [formulaValidation, setFormulaValidation] = useState<{ isValid: boolean; error?: string; sampleResult?: number }>({ isValid: true });

  const openAddPolicyModal = () => {
    setEditingPolicy(null);
    setPolicyForm({
      policyName: '',
      description: '',
      applicableEmployees: 'ALL',
      applicableDepartments: 'ALL',
      applicableBranches: 'ALL',
      effectiveFrom: '2026-09-01',
      effectiveTo: '',
      status: 'Active',
      shiftName: 'Standard Corporate Shift',
      startTime: '09:30',
      endTime: '18:30',
      graceTimeMinutes: 10,
      minWorkingHours: 8,
      halfDayHours: 4,
      fullDayHours: 8.5,
      weeklyOff: ['Sunday'],
      holidayCalendar: 'HQ Corporate Calendar 2026',
      lateRuleType: 'COUNT_BASED',
      fixedAmount: 100,
      percentageOfDailySalary: 5,
      halfDayLateHoursThreshold: 3,
      customFormula: '(LATE_COUNT * 100)',
      deductionVisibility: 'GENERIC',
      genericCategoryLabel: 'OTHERS'
    });
    setFormulaValidation({ isValid: true });
    setIsPolicyModalOpen(true);
  };

  const openEditPolicyModal = (p: AttendancePolicy) => {
    setEditingPolicy(p);
    setPolicyForm({
      policyName: p.policyName,
      description: p.description,
      applicableEmployees: p.applicableEmployees,
      applicableDepartments: p.applicableDepartments,
      applicableBranches: p.applicableBranches,
      effectiveFrom: p.effectiveFrom,
      effectiveTo: p.effectiveTo || '',
      status: p.status === 'Archived' ? 'Inactive' : p.status,
      shiftName: p.shiftName,
      startTime: p.startTime,
      endTime: p.endTime,
      graceTimeMinutes: p.graceTimeMinutes,
      minWorkingHours: p.minWorkingHours,
      halfDayHours: p.halfDayHours,
      fullDayHours: p.fullDayHours,
      weeklyOff: p.weeklyOff,
      holidayCalendar: p.holidayCalendar,
      lateRuleType: p.lateRuleType,
      fixedAmount: p.fixedAmount || 100,
      percentageOfDailySalary: p.percentageOfDailySalary || 5,
      halfDayLateHoursThreshold: p.halfDayLateHoursThreshold || 3,
      customFormula: p.customFormula || '(LATE_COUNT * 100)',
      deductionVisibility: p.deductionVisibility,
      genericCategoryLabel: p.genericCategoryLabel || 'OTHERS'
    });
    setFormulaValidation(validateFormula(p.customFormula || '(LATE_COUNT * 100)'));
    setIsPolicyModalOpen(true);
  };

  const handleFormulaChange = (val: string) => {
    setPolicyForm(prev => ({ ...prev, customFormula: val }));
    const res = validateFormula(val);
    setFormulaValidation(res);
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyForm.policyName.trim()) return;

    if (policyForm.lateRuleType === 'CUSTOM_FORMULA' && !formulaValidation.isValid) {
      alert(`Cannot save: Invalid formula: ${formulaValidation.error}`);
      return;
    }

    const payload = {
      policyName: policyForm.policyName.trim(),
      description: policyForm.description.trim(),
      applicableEmployees: policyForm.applicableEmployees,
      applicableDepartments: policyForm.applicableDepartments,
      applicableBranches: policyForm.applicableBranches,
      effectiveFrom: policyForm.effectiveFrom,
      effectiveTo: policyForm.effectiveTo || undefined,
      status: policyForm.status,
      shiftName: policyForm.shiftName,
      startTime: policyForm.startTime,
      endTime: policyForm.endTime,
      graceTimeMinutes: Number(policyForm.graceTimeMinutes) || 10,
      minWorkingHours: Number(policyForm.minWorkingHours) || 8,
      halfDayHours: Number(policyForm.halfDayHours) || 4,
      fullDayHours: Number(policyForm.fullDayHours) || 8.5,
      weeklyOff: policyForm.weeklyOff,
      holidayCalendar: policyForm.holidayCalendar,
      lateRuleType: policyForm.lateRuleType,
      fixedAmount: Number(policyForm.fixedAmount) || 100,
      percentageOfDailySalary: Number(policyForm.percentageOfDailySalary) || 5,
      halfDayLateHoursThreshold: Number(policyForm.halfDayLateHoursThreshold) || 3,
      customFormula: policyForm.customFormula,
      deductionVisibility: policyForm.deductionVisibility,
      genericCategoryLabel: policyForm.genericCategoryLabel || 'OTHERS'
    };

    if (editingPolicy) {
      updateMasterAttendancePolicy(editingPolicy.id, payload);
    } else {
      addMasterAttendancePolicy(payload);
    }
    setIsPolicyModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Section Header & Integrated Navigation */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#FFFFFF',
        padding: '12px 18px',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(15, 23, 42, 0.02)'
      }}>
        {/* Navigation Tabs */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          backgroundColor: '#F1F5F9',
          padding: '4px',
          borderRadius: '10px'
        }}>
          <button
            type="button"
            onClick={() => setActiveSubTab('policies')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeSubTab === 'policies' ? '#FFFFFF' : 'transparent',
              color: activeSubTab === 'policies' ? '#0E7490' : '#64748B',
              boxShadow: activeSubTab === 'policies' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              fontWeight: activeSubTab === 'policies' ? 750 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <CalendarCheck size={15} />
            <span>Late Policy</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '1px 6px',
              borderRadius: '999px',
              backgroundColor: activeSubTab === 'policies' ? '#ECFEFF' : '#E2E8F0',
              color: activeSubTab === 'policies' ? '#0E7490' : '#64748B',
              fontWeight: 700
            }}>
              {masterAttendancePolicies.filter(p => p.status !== 'Archived').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('week_off')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeSubTab === 'week_off' ? '#FFFFFF' : 'transparent',
              color: activeSubTab === 'week_off' ? '#0E7490' : '#64748B',
              boxShadow: activeSubTab === 'week_off' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              fontWeight: activeSubTab === 'week_off' ? 750 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Calendar size={15} />
            <span>Week Off Calendar</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('ot_policies')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeSubTab === 'ot_policies' ? '#FFFFFF' : 'transparent',
              color: activeSubTab === 'ot_policies' ? '#0E7490' : '#64748B',
              boxShadow: activeSubTab === 'ot_policies' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              fontWeight: activeSubTab === 'ot_policies' ? 750 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Sliders size={15} />
            <span>Overtime (OT) Rules</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('gps')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeSubTab === 'gps' ? '#FFFFFF' : 'transparent',
              color: activeSubTab === 'gps' ? '#0E7490' : '#64748B',
              boxShadow: activeSubTab === 'gps' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              fontWeight: activeSubTab === 'gps' ? 750 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <MapPin size={15} />
            <span>GPS Geofence Perimeter</span>
          </button>
        </div>

        {/* Primary Action Button */}
        {isPrivileged && activeSubTab === 'policies' && (
          <button
            type="button"
            onClick={openAddPolicyModal}
            style={{ 
              backgroundColor: '#0E7490',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '8px',
              padding: '6px 13px',
              fontWeight: 650,
              fontSize: '0.80rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              boxShadow: '0 2px 6px rgba(14, 116, 144, 0.2)',
              transition: 'background-color 0.15s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#0891B2')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#0E7490')}
          >
            <Plus size={14} strokeWidth={2.2} />
            <span>Add Late Policy</span>
          </button>
        )}
      </div>

      {/* TAB 1: ATTENDANCE POLICIES LIST */}
      {activeSubTab === 'policies' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '16px' }}>
            {masterAttendancePolicies.length === 0 ? (
              <div style={{
                gridColumn: '1 / -1',
                backgroundColor: '#FFFFFF',
                borderRadius: '16px',
                border: '1.5px dashed #CBD5E1',
                padding: '48px 24px',
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#ECFEFF', color: '#0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Clock size={24} />
                </div>
                <div style={{ fontWeight: 750, fontSize: '1.05rem', color: '#0F172A' }}>No Attendance Policies Configured</div>
                <div style={{ color: '#64748B', fontSize: '0.86rem', maxWidth: '420px', lineHeight: 1.5 }}>
                  All default attendance policies have been removed. Click <strong>+ Add Late Policy</strong> above to configure your organization's custom shift hours, grace periods, and late deduction rules manually.
                </div>
              </div>
            ) : (
              masterAttendancePolicies.map(policy => {
                const isActive = policy.status === 'Active';
                const isArchived = policy.status === 'Archived';

                return (
                  <div
                    key={policy.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
                    opacity: isArchived ? 0.6 : 1,
                    transition: 'all 0.18s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(15, 23, 42, 0.06)'}
                  onMouseLeave={e => e.currentTarget.style.boxShadow = '0 1px 3px rgba(15, 23, 42, 0.03)'}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 750, color: '#0F172A', letterSpacing: '-0.01em' }}>
                            {policy.policyName}
                          </h4>
                          <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                            v{policy.version}
                          </span>
                        </div>
                        <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B', lineHeight: '1.4' }}>
                          {policy.description}
                        </p>
                      </div>

                      <span style={{
                        padding: '3px 10px',
                        borderRadius: '999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        backgroundColor: isActive ? '#DCFCE7' : '#F1F5F9',
                        color: isActive ? '#15803D' : '#64748B'
                      }}>
                        ● {policy.status}
                      </span>
                    </div>

                    {/* Shift & Grace info grid */}
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      padding: '12px 14px',
                      borderRadius: '12px',
                      fontSize: '0.82rem',
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      marginBottom: '12px',
                      border: '1px solid #F1F5F9'
                    }}>
                      <div>
                        <span style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 500 }}>Shift Hours:</span>
                        <div style={{ fontWeight: 700, color: '#1E293B', marginTop: '1px' }}>{policy.startTime} – {policy.endTime}</div>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 500 }}>Grace Period:</span>
                        <div style={{ fontWeight: 700, color: '#0E7490', marginTop: '1px' }}>+{policy.graceTimeMinutes} Mins Grace</div>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 500 }}>Minimum Hours:</span>
                        <div style={{ fontWeight: 700, color: '#1E293B', marginTop: '1px' }}>{policy.minWorkingHours} hrs <span style={{ color: '#94A3B8', fontWeight: 400 }}>(Full: {policy.fullDayHours}h)</span></div>
                      </div>
                      <div>
                        <span style={{ color: '#64748B', fontSize: '0.75rem', fontWeight: 500 }}>Weekly Off:</span>
                        <div style={{ fontWeight: 700, color: '#1E293B', marginTop: '1px' }}>{(policy.weeklyOff || []).join(', ') || 'None'}</div>
                      </div>
                    </div>

                    {/* Late rule breakdown */}
                    <div style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      marginBottom: '12px',
                      fontSize: '0.78rem'
                    }}>
                      <div style={{ fontWeight: 700, color: '#0F172A', marginBottom: '3px' }}>
                        Late Rule: <span style={{ color: '#0E7490' }}>{(policy.lateRuleType || 'DEFAULT').replace(/_/g, ' ')}</span>
                      </div>
                      <div style={{ color: '#475569' }}>
                        {policy.lateRuleType === 'FIXED_AMOUNT' && `${formatCurrency(policy.fixedAmount || 0)} deduction on every late check-in.`}
                        {policy.lateRuleType === 'PERCENTAGE_DAILY' && `${policy.percentageOfDailySalary}% of Daily Salary deducted per late punch.`}
                        {policy.lateRuleType === 'COUNT_BASED' && `Tiered: 1–3 free, 4–5: ${formatCurrency(100)} each, 6+: ${formatCurrency(200)} each.`}
                        {policy.lateRuleType === 'HALF_DAY_CONVERSION' && `More than ${policy.halfDayLateHoursThreshold} hrs late automatically converts to Half Day.`}
                        {policy.lateRuleType === 'CUSTOM_FORMULA' && `Custom Formula: ${policy.customFormula}`}
                      </div>
                    </div>

                    {/* Privacy Indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.76rem', color: '#64748B', marginBottom: '14px' }}>
                      {policy.deductionVisibility === 'GENERIC' ? (
                        <>
                          <EyeOff size={13} color="#94A3B8" />
                          <span>Payslip Privacy: Shows as <strong>{policy.genericCategoryLabel}</strong></span>
                        </>
                      ) : (
                        <>
                          <Eye size={13} color="#0E7490" />
                          <span>Payslip Privacy: Detailed Policy Label</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '14px', marginTop: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {isPrivileged ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            style={{ 
                              fontSize: '0.78rem', 
                              padding: '6px 14px', 
                              borderRadius: '8px', 
                              backgroundColor: '#0E7490', 
                              color: '#FFFFFF', 
                              border: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                            onClick={() => openEditPolicyModal(policy)}
                            title="Edit this Late Attendance Policy"
                          >
                            <Edit3 size={13} /> Edit Policy
                          </button>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            style={{ 
                              fontSize: '0.78rem', 
                              padding: '6px 12px', 
                              borderRadius: '8px',
                              backgroundColor: '#F8FAFC',
                              border: '1px solid #CBD5E1',
                              color: '#334155',
                              cursor: 'pointer',
                              fontWeight: 600
                            }}
                            onClick={() => toggleMasterAttendancePolicyStatus(policy.id)}
                            disabled={isArchived}
                          >
                            {isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                          🔒 Active Policy (CEO & HR Managed)
                        </span>
                      )}
                    </div>

                    {isPrivileged && !isArchived && (
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ 
                          color: '#EF4444', 
                          padding: '6px 12px', 
                          borderRadius: '8px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          backgroundColor: '#FEF2F2',
                          border: '1px solid #FECACA',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          if (window.confirm(`Archive "${policy.policyName}"? Historical payroll will remain intact.`)) {
                            archiveMasterAttendancePolicy(policy.id);
                          }
                        }}
                        title="Archive Policy"
                      >
                        <Archive size={13} /> Archive
                      </button>
                    )}
                  </div>
                </div>
              );
            }))}
          </div>
        </div>
      )}

      {/* TAB 2: WEEK OFF CALENDAR */}
      {activeSubTab === 'week_off' && (
        <WeekOffCalendarSettings />
      )}

      {/* TAB 3: OVERTIME (OT) POLICIES & RULES */}
      {activeSubTab === 'ot_policies' && (
        <OvertimePolicySettings />
      )}

      {/* TAB 3: GPS & GEOFENCE PERIMETER CONFIGURATION */}
      {activeSubTab === 'gps' && (
        <GPSGeofenceSettings />
      )}

      {/* POLICY CREATE / EDIT MODAL */}
      {isPolicyModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h3>{editingPolicy ? `Edit Policy: ${editingPolicy.policyName}` : 'Create New Attendance Policy'}</h3>
              <button className="close-btn" title="Close" onClick={() => setIsPolicyModalOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSavePolicy}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Basic Policy Meta */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Policy Name</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Corporate Headquarters Punctuality Policy"
                      value={policyForm.policyName}
                      onChange={e => setPolicyForm({ ...policyForm, policyName: e.target.value })}
                      required
                    />
                  </div>

                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={2}
                      placeholder="Objectives and scope of this attendance policy..."
                      value={policyForm.description}
                      onChange={e => setPolicyForm({ ...policyForm, description: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="form-label">Effective From Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={policyForm.effectiveFrom}
                      onChange={e => setPolicyForm({ ...policyForm, effectiveFrom: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label">Policy Status</label>
                    <select
                      className="form-control"
                      value={policyForm.status}
                      onChange={e => setPolicyForm({ ...policyForm, status: e.target.value as any })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                {/* Section B: Working Time Settings */}
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                    B. Working Time & Shift Parameters
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                    <div>
                      <label className="form-label">Shift Start Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={policyForm.startTime}
                        onChange={e => setPolicyForm({ ...policyForm, startTime: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Shift End Time</label>
                      <input
                        type="time"
                        className="form-control"
                        value={policyForm.endTime}
                        onChange={e => setPolicyForm({ ...policyForm, endTime: e.target.value })}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Grace Period (Minutes)</label>
                      <input
                        type="number"
                        className="form-control"
                        min={0}
                        max={60}
                        value={policyForm.graceTimeMinutes}
                        onChange={e => setPolicyForm({ ...policyForm, graceTimeMinutes: parseInt(e.target.value) || 0 })}
                        required
                      />
                    </div>

                    <div>
                      <label className="form-label">Minimum Work Hours</label>
                      <input
                        type="number"
                        className="form-control"
                        step="0.5"
                        value={policyForm.minWorkingHours}
                        onChange={e => setPolicyForm({ ...policyForm, minWorkingHours: parseFloat(e.target.value) || 8 })}
                      />
                    </div>

                    <div>
                      <label className="form-label">Half Day Hours</label>
                      <input
                        type="number"
                        className="form-control"
                        step="0.5"
                        value={policyForm.halfDayHours}
                        onChange={e => setPolicyForm({ ...policyForm, halfDayHours: parseFloat(e.target.value) || 4 })}
                      />
                    </div>

                    <div>
                      <label className="form-label">Full Day Standard Hours</label>
                      <input
                        type="number"
                        className="form-control"
                        step="0.5"
                        value={policyForm.fullDayHours}
                        onChange={e => setPolicyForm({ ...policyForm, fullDayHours: parseFloat(e.target.value) || 8.5 })}
                      />
                    </div>
                  </div>
                </div>

                {/* Section C: Custom Late Attendance Rules */}
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                    C. Late Attendance Deduction Rule Builder
                  </h4>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <div>
                      <label className="form-label">Select Rule Type</label>
                      <select
                        className="form-control"
                        value={policyForm.lateRuleType}
                        onChange={e => setPolicyForm({ ...policyForm, lateRuleType: e.target.value as LateRuleType })}
                      >
                        <option value="COUNT_BASED">Count-Based Tier (1-3 Free, 4-5 ₹100, 6+ ₹200)</option>
                        <option value="FIXED_AMOUNT">Fixed Amount Per Late Entry (e.g. ₹100)</option>
                        <option value="PERCENTAGE_DAILY">Percentage of Daily Salary (e.g. 5%)</option>
                        <option value="HALF_DAY_CONVERSION">Half Day Conversion (&gt;X hours late)</option>
                        <option value="CUSTOM_FORMULA">Custom Formula (e.g. LATE_COUNT * 100)</option>
                      </select>
                    </div>

                    {policyForm.lateRuleType === 'FIXED_AMOUNT' && (
                      <div>
                        <label className="form-label">Fixed Deduction Per Late Entry (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          value={policyForm.fixedAmount}
                          onChange={e => setPolicyForm({ ...policyForm, fixedAmount: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    )}

                    {policyForm.lateRuleType === 'PERCENTAGE_DAILY' && (
                      <div>
                        <label className="form-label">Percentage of Daily Salary (%)</label>
                        <input
                          type="number"
                          className="form-control"
                          step="0.5"
                          value={policyForm.percentageOfDailySalary}
                          onChange={e => setPolicyForm({ ...policyForm, percentageOfDailySalary: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    )}

                    {policyForm.lateRuleType === 'HALF_DAY_CONVERSION' && (
                      <div>
                        <label className="form-label">Threshold Late Hours to Convert to Half Day</label>
                        <input
                          type="number"
                          className="form-control"
                          step="0.5"
                          value={policyForm.halfDayLateHoursThreshold}
                          onChange={e => setPolicyForm({ ...policyForm, halfDayLateHoursThreshold: parseFloat(e.target.value) || 3 })}
                        />
                      </div>
                    )}

                    {policyForm.lateRuleType === 'CUSTOM_FORMULA' && (
                      <div style={{ backgroundColor: '#F8FAFC', padding: '12px', borderRadius: '10px' }}>
                        <label className="form-label">Custom Mathematical Formula</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. (LATE_COUNT * 100) or (DAILY_SALARY * 5 / 100)"
                          value={policyForm.customFormula}
                          onChange={e => handleFormulaChange(e.target.value)}
                        />
                        <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '4px' }}>
                          Allowed variables: <code>LATE_COUNT</code>, <code>DAILY_SALARY</code>, <code>BASIC</code>, <code>GROSS</code>
                        </div>

                        {formulaValidation.isValid ? (
                          <div style={{ marginTop: '8px', color: '#16A34A', fontSize: '0.8rem', fontWeight: 600 }}>
                            ✓ Valid Formula! Live Sample Result (with 4 late entries, ₹1,153 daily salary): ₹{formulaValidation.sampleResult}
                          </div>
                        ) : (
                          <div style={{ marginTop: '8px', color: '#DC2626', fontSize: '0.8rem', fontWeight: 600 }}>
                            ⚠ {formulaValidation.error}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section D: Privacy & Visibility Setting */}
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                  <h4 style={{ margin: '0 0 10px', fontSize: '0.92rem', fontWeight: 800, color: '#0F172A' }}>
                    D. Deduction Privacy Controls
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label">Employee Salary Slip Visibility</label>
                      <select
                        className="form-control"
                        value={policyForm.deductionVisibility}
                        onChange={e => setPolicyForm({ ...policyForm, deductionVisibility: e.target.value as DeductionVisibility })}
                      >
                        <option value="GENERIC">Show Generic Category Only (Recommended)</option>
                        <option value="DETAILED">Show Full Internal Details</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Generic Category Label</label>
                      <input
                        type="text"
                        className="form-control"
                        value={policyForm.genericCategoryLabel}
                        onChange={e => setPolicyForm({ ...policyForm, genericCategoryLabel: e.target.value })}
                        disabled={policyForm.deductionVisibility !== 'GENERIC'}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsPolicyModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingPolicy ? 'Update Policy' : 'Create Policy'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
