import React from 'react';
import {
  Building2,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { useHRMS } from '../../context/HRMSContext';

export const OvertimePolicySettings: React.FC = () => {
  const {
    departments,
    departmentOtPolicies,
    updateDepartmentOtPolicy,
    currentUser
  } = useHRMS();

  const isHrOrCeo =
    currentUser?.role === 'CEO' ||
    currentUser?.role === 'HR Manager' ||
    currentUser?.role === 'HR Admin' ||
    currentUser?.role === 'Super Admin' ||
    currentUser?.role === 'Management' ||
    currentUser?.role === 'ERP Administrator';

  // Dynamic department overtime policy mapping:
  // Only display departments actively created in Organization!
  const activeDepartmentPolicies = departments.map(dept => {
    const existing = departmentOtPolicies.find(
      p => p.department.toLowerCase() === dept.name.toLowerCase() || p.id === dept.id
    );
    return existing || {
      id: `DOT-${dept.id}`,
      department: dept.name,
      otAllowed: true,
      policyId: 'OTP-001',
      maxOtHoursDaily: 4.0,
      maxOtHoursMonthly: 60,
      minOtDurationMinutes: 30,
      approvalRequired: true,
      calculationMethod: 'Shift End Based' as const,
      standardShiftHours: 9,
      otHourlyRate: 100
    };
  });

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '16px',
      border: '1px solid #E7ECF3',
      padding: '24px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
      display: 'flex',
      flexDirection: 'column',
      gap: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1E293B' }}>
            Department Overtime Eligibility Rules
          </h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>
            Define department standard shift duration, overtime authorization, and hourly overtime rate (e.g. 9 hrs shift; 10 hrs worked triggers 1 hr OT @ ₹100/hr).
          </p>
        </div>
        <span style={{ fontSize: '0.78rem', color: '#0E7490', fontWeight: 700, background: '#ECFEFF', padding: '4px 10px', borderRadius: '6px', border: '1px solid #CFFAFE' }}>
          {departments.length} Organization {departments.length === 1 ? 'Department' : 'Departments'}
        </span>
      </div>

      <div style={{ overflowX: 'auto', border: '1px solid #E7ECF3', borderRadius: '12px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
          <thead style={{ backgroundColor: '#F8FAFC', borderBottom: '1px solid #E7ECF3' }}>
            <tr>
              <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Department</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Standard Shift</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OT Allowed</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>OT Hourly Rate</th>
              <th style={{ padding: '12px 16px', fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overtime Trigger Rule</th>
            </tr>
          </thead>
          <tbody>
            {activeDepartmentPolicies.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B' }}>
                  <Building2 size={36} style={{ margin: '0 auto 10px', color: '#CBD5E1', display: 'block' }} />
                  <div style={{ fontWeight: 750, color: '#1E293B', fontSize: '0.92rem' }}>
                    No Organization Departments Added Yet
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '4px', maxWidth: '440px', margin: '4px auto 0' }}>
                    Departments created under <strong>Organization → Departments</strong> will dynamically appear here for overtime policy configuration.
                  </div>
                </td>
              </tr>
            ) : (
              activeDepartmentPolicies.map(dept => {
                const shiftHours = dept.standardShiftHours ?? 9;
                const hourlyRate = dept.otHourlyRate ?? 100;
                return (
                  <tr key={dept.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={16} color="#0E7490" />
                      {dept.department}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {isHrOrCeo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <input
                            type="number"
                            step="0.5"
                            min="4"
                            max="16"
                            value={shiftHours}
                            onChange={e => updateDepartmentOtPolicy(dept.id, { department: dept.department, standardShiftHours: Number(e.target.value) })}
                            style={{
                              width: '58px',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1px solid #E2E8F0',
                              fontSize: '0.82rem',
                              fontFamily: 'monospace',
                              color: '#1E293B',
                              backgroundColor: '#FFFFFF'
                            }}
                          />
                          <span style={{ color: '#64748B', fontSize: '0.78rem', fontWeight: 600 }}>hrs</span>
                        </div>
                      ) : (
                        <span style={{ color: '#1E293B', fontWeight: 600 }}>{shiftHours} hrs</span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {isHrOrCeo ? (
                        <button
                          type="button"
                          onClick={() => updateDepartmentOtPolicy(dept.id, { department: dept.department, otAllowed: !dept.otAllowed })}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '5px 12px',
                            borderRadius: '9999px',
                            border: 'none',
                            fontSize: '0.75rem',
                            fontWeight: 750,
                            cursor: 'pointer',
                            backgroundColor: dept.otAllowed ? '#DCFCE7' : '#F1F5F9',
                            color: dept.otAllowed ? '#15803D' : '#64748B',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)'
                          }}
                        >
                          {dept.otAllowed ? (
                            <>
                              <ToggleRight size={16} color="#15803D" /> YES
                            </>
                          ) : (
                            <>
                              <ToggleLeft size={16} color="#94A3B8" /> NO
                            </>
                          )}
                        </button>
                      ) : (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: dept.otAllowed ? '#DCFCE7' : '#F1F5F9',
                          color: dept.otAllowed ? '#15803D' : '#64748B'
                        }}>
                          {dept.otAllowed ? 'YES' : 'NO'}
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {isHrOrCeo ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#0E7490', fontWeight: 700, fontSize: '0.85rem' }}>₹</span>
                          <input
                            type="number"
                            step="10"
                            min="0"
                            value={hourlyRate}
                            onChange={e => updateDepartmentOtPolicy(dept.id, { department: dept.department, otHourlyRate: Number(e.target.value) })}
                            disabled={!dept.otAllowed}
                            style={{
                              width: '72px',
                              padding: '6px 8px',
                              borderRadius: '8px',
                              border: '1px solid #E2E8F0',
                              fontSize: '0.82rem',
                              fontFamily: 'monospace',
                              color: !dept.otAllowed ? '#94A3B8' : '#1E293B',
                              backgroundColor: !dept.otAllowed ? '#F8FAFC' : '#FFFFFF'
                            }}
                          />
                          <span style={{ color: '#64748B', fontSize: '0.78rem' }}>/ hr</span>
                        </div>
                      ) : (
                        <span style={{ color: dept.otAllowed ? '#0E7490' : '#94A3B8', fontWeight: 700 }}>
                          ₹{hourlyRate} / hr
                        </span>
                      )}
                    </td>

                    <td style={{ padding: '14px 16px' }}>
                      {dept.otAllowed ? (
                        <div style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#ECFEFF',
                            border: '1px solid #CFFAFE',
                            fontWeight: 700,
                            color: '#0E7490'
                          }}>
                            Work &gt; {shiftHours} hrs
                          </span>
                          <span style={{ color: '#64748B' }}>
                            (e.g., 10 hrs work = 1 hr OT → <strong>₹{hourlyRate}</strong>)
                          </span>
                        </div>
                      ) : (
                        <span style={{
                          padding: '3px 10px',
                          borderRadius: '6px',
                          backgroundColor: '#F1F5F9',
                          color: '#94A3B8',
                          fontSize: '0.75rem',
                          fontWeight: 600
                        }}>
                          Overtime Restricted
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
