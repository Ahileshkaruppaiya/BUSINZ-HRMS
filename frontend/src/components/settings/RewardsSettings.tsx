import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { RewardPolicy, RewardType, RewardValueType, EmployeeRewardRecord } from '../../types/settings';
import { formatCurrency } from '../../utils/numbers';
import { 
  Gift, 
  Award, 
  Plus, 
  Edit3, 
  Archive, 
  CreditCard, 
  CheckCircle2, 
  Send, 
  Trophy, 
  Star, 
  Users, 
  BadgeCheck,
  X
} from 'lucide-react';

export const RewardsSettings: React.FC = () => {
  const { 
    rewardPolicies, 
    addRewardPolicy, 
    updateRewardPolicy, 
    archiveRewardPolicy, 
    toggleRewardPolicyStatus,
    employeeRewardRecords,
    grantRewardToEmployee,
    employees,
    currentUser 
  } = useHRMS();

  const isPrivileged = currentUser.role === 'Super Admin' || currentUser.role === 'HR Admin' || currentUser.role === 'Management';
  const [activeTab, setActiveTab] = useState<'policies' | 'grants'>('policies');

  // Policy Modal
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<RewardPolicy | null>(null);
  const [policyForm, setPolicyForm] = useState<{
    rewardName: string;
    rewardType: RewardType;
    description: string;
    eligibilityRule: string;
    valueType: RewardValueType;
    amountValue: number | '';
    giftDescription: string;
    addToPayroll: boolean;
    status: 'Active' | 'Inactive';
  }>({
    rewardName: '',
    rewardType: 'Employee of the Month',
    description: '',
    eligibilityRule: '',
    valueType: 'FIXED_AMOUNT',
    amountValue: '',
    giftDescription: '',
    addToPayroll: true,
    status: 'Active'
  });

  // Grant Modal State
  const [isGrantModalOpen, setIsGrantModalOpen] = useState(false);
  const [grantForm, setGrantForm] = useState<{
    rewardPolicyId: string;
    employeeId: string;
    amount: number | '';
    notes: string;
  }>({
    rewardPolicyId: rewardPolicies[0]?.id || '',
    employeeId: employees[0]?.employeeId || '',
    amount: '',
    notes: ''
  });

  const openAddPolicyModal = () => {
    setEditingPolicy(null);
    setPolicyForm({
      rewardName: '',
      rewardType: 'Employee of the Month',
      description: '',
      eligibilityRule: '',
      valueType: 'FIXED_AMOUNT',
      amountValue: '',
      giftDescription: '',
      addToPayroll: true,
      status: 'Active'
    });
    setIsPolicyModalOpen(true);
  };

  const openEditPolicyModal = (p: RewardPolicy) => {
    setEditingPolicy(p);
    setPolicyForm({
      rewardName: p.rewardName,
      rewardType: p.rewardType,
      description: p.description,
      eligibilityRule: p.eligibilityRule,
      valueType: p.valueType,
      amountValue: p.amountValue,
      giftDescription: p.giftDescription || '',
      addToPayroll: p.addToPayroll,
      status: p.status === 'Archived' ? 'Inactive' : p.status
    });
    setIsPolicyModalOpen(true);
  };

  const handleSavePolicy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!policyForm.rewardName.trim()) return;

    const payload = {
      rewardName: policyForm.rewardName.trim(),
      rewardType: policyForm.rewardType,
      description: policyForm.description.trim(),
      applicableEmployees: 'ALL' as const,
      applicableDepartments: 'ALL' as const,
      eligibilityRule: policyForm.eligibilityRule.trim(),
      valueType: policyForm.valueType,
      amountValue: policyForm.amountValue === '' ? 0 : Number(policyForm.amountValue) || 0,
      giftDescription: policyForm.giftDescription.trim() || undefined,
      addToPayroll: policyForm.addToPayroll,
      status: policyForm.status
    };

    if (editingPolicy) {
      updateRewardPolicy(editingPolicy.id, payload);
    } else {
      addRewardPolicy(payload);
    }
    setIsPolicyModalOpen(false);
  };

  const openGrantModal = (policy?: RewardPolicy) => {
    const selectedPolicy = policy || rewardPolicies[0];
    setGrantForm({
      rewardPolicyId: selectedPolicy ? selectedPolicy.id : '',
      employeeId: employees[0]?.employeeId || '',
      amount: selectedPolicy ? selectedPolicy.amountValue : '',
      notes: ''
    });
    setIsGrantModalOpen(true);
  };

  const handleConfirmGrant = (e: React.FormEvent) => {
    e.preventDefault();
    const policy = rewardPolicies.find(p => p.id === grantForm.rewardPolicyId);
    const emp = employees.find(e => e.employeeId === grantForm.employeeId);
    if (!policy || !emp) return;

    grantRewardToEmployee({
      rewardPolicyId: policy.id,
      rewardName: policy.rewardName,
      rewardType: policy.rewardType,
      employeeId: emp.employeeId,
      employeeName: `${emp.firstName} ${emp.lastName}`,
      department: emp.department,
      valueType: policy.valueType,
      amount: Number(grantForm.amount) || 0,
      giftDescription: policy.giftDescription,
      grantedBy: `${currentUser.name} (${currentUser.role === 'Super Admin' ? 'CEO' : currentUser.role})`,
      addToPayroll: policy.addToPayroll,
      notes: grantForm.notes
    });

    setIsGrantModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Integrated Navigation & Actions Bar */}
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
        {/* Navigation Tabs (Segmented Pills) */}
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
            onClick={() => setActiveTab('policies')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'policies' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'policies' ? '#0E7490' : '#64748B',
              boxShadow: activeTab === 'policies' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              fontWeight: activeTab === 'policies' ? 750 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Award size={15} />
            <span>Reward Policies</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '1px 6px',
              borderRadius: '999px',
              backgroundColor: activeTab === 'policies' ? '#ECFEFF' : '#E2E8F0',
              color: activeTab === 'policies' ? '#0E7490' : '#64748B',
              fontWeight: 700
            }}>
              {rewardPolicies.filter(p => p.status !== 'Archived').length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grants')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'grants' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'grants' ? '#0E7490' : '#64748B',
              boxShadow: activeTab === 'grants' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              fontWeight: activeTab === 'grants' ? 750 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Trophy size={15} />
            <span>Granted Employee Awards</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '1px 6px',
              borderRadius: '999px',
              backgroundColor: activeTab === 'grants' ? '#ECFEFF' : '#E2E8F0',
              color: activeTab === 'grants' ? '#0E7490' : '#64748B',
              fontWeight: 700
            }}>
              {employeeRewardRecords.length}
            </span>
          </button>
        </div>

        {/* Action Buttons on Right */}
        {isPrivileged && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => openGrantModal()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                padding: '7px 14px',
                borderRadius: '10px'
              }}
            >
              <Send size={15} /> Grant Award
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={openAddPolicyModal}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.82rem',
                padding: '7px 14px',
                borderRadius: '10px'
              }}
            >
              <Plus size={15} /> Create Policy
            </button>
          </div>
        )}
      </div>

      {/* TAB 1: REWARD POLICIES */}
      {activeTab === 'policies' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          {rewardPolicies.map(policy => {
            const isActive = policy.status === 'Active';
            const isArchived = policy.status === 'Archived';

            return (
              <div
                key={policy.id}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  border: isActive ? '2px solid #0E7490' : '1px solid #E7ECF3',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                  opacity: isArchived ? 0.6 : 1
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
                          {policy.rewardName}
                        </h4>
                      </div>
                      <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                        {policy.rewardType} • v{policy.version}
                      </span>
                    </div>

                    <span className={`status-pill ${isActive ? 'approved' : isArchived ? 'overdue' : 'pending'}`}>
                      {policy.status}
                    </span>
                  </div>

                  <p style={{ margin: '0 0 14px', fontSize: '0.82rem', color: '#475569' }}>
                    {policy.description}
                  </p>

                  <div style={{
                    backgroundColor: '#F8FAFC',
                    padding: '12px',
                    borderRadius: '12px',
                    fontSize: '0.8rem',
                    marginBottom: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Reward Value:</span>
                      <strong style={{ color: '#166534', fontSize: '0.9rem' }}>
                        {policy.valueType === 'FIXED_AMOUNT' ? formatCurrency(policy.amountValue) : policy.valueType}
                      </strong>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#64748B' }}>Payroll Auto-Payout:</span>
                      <strong style={{ color: policy.addToPayroll ? '#0E7490' : '#64748B' }}>
                        {policy.addToPayroll ? '✓ Added to Payroll Earnings' : 'Non-Payroll Recognition'}
                      </strong>
                    </div>

                    <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '6px', fontSize: '0.76rem', color: '#64748B' }}>
                      <strong>Eligibility Rule:</strong> {policy.eligibilityRule}
                    </div>
                  </div>
                </div>

                {isPrivileged && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openGrantModal(policy)}
                      >
                        <Trophy size={14} /> Grant
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => openEditPolicyModal(policy)}
                      >
                        <Edit3 size={14} /> Edit
                      </button>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => toggleRewardPolicyStatus(policy.id)}
                        disabled={isArchived}
                      >
                        {isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </div>

                    {!isArchived && (
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ color: '#EF4444' }}
                        onClick={() => {
                          if (window.confirm(`Archive "${policy.rewardName}"?`)) {
                            archiveRewardPolicy(policy.id);
                          }
                        }}
                      >
                        <Archive size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: GRANTED EMPLOYEE AWARDS */}
      {activeTab === 'grants' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
            Active Award Grant History & Payroll Status
          </h3>

          <table className="hrms-table">
            <thead>
              <tr>
                <th>Award Name</th>
                <th>Employee Recipient</th>
                <th>Department</th>
                <th>Reward Value</th>
                <th>Granted Date</th>
                <th>Granted By</th>
                <th>Payroll Linkage</th>
              </tr>
            </thead>
            <tbody>
              {employeeRewardRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8' }}>
                    No employee awards granted yet.
                  </td>
                </tr>
              ) : (
                employeeRewardRecords.map(rec => (
                  <tr key={rec.id}>
                    <td>
                      <strong>{rec.rewardName}</strong>
                      <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{rec.rewardType}</div>
                    </td>
                    <td><strong>{rec.employeeName}</strong> ({rec.employeeId})</td>
                    <td>{rec.department}</td>
                    <td>
                      <strong style={{ color: '#166534', fontSize: '0.92rem' }}>
                        {formatCurrency(rec.amount)}
                      </strong>
                    </td>
                    <td>{rec.grantedDate}</td>
                    <td>{rec.grantedBy}</td>
                    <td>
                      {rec.addToPayroll ? (
                        <span className={`status-pill ${rec.payrollStatus === 'ProcessedInPayroll' ? 'approved' : 'pending'}`}>
                          {rec.payrollStatus === 'ProcessedInPayroll' ? 'Processed in Payroll' : 'Pending August Batch'}
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Non-Monetary</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE / EDIT POLICY MODAL */}
      {isPolicyModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>{editingPolicy ? `Edit Policy: ${editingPolicy.rewardName}` : 'Create New Reward Policy'}</h3>
              <button className="close-btn" title="Close" onClick={() => setIsPolicyModalOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSavePolicy}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Reward Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Employee of the Month"
                    value={policyForm.rewardName}
                    onChange={e => setPolicyForm({ ...policyForm, rewardName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Reward Classification</label>
                  <select
                    className="form-control"
                    value={policyForm.rewardType}
                    onChange={e => setPolicyForm({ ...policyForm, rewardType: e.target.value as any })}
                  >
                    <option value="Employee of the Month">Employee of the Month</option>
                    <option value="Performance Bonus">Performance Bonus</option>
                    <option value="Spot Award">Spot Award</option>
                    <option value="Referral Reward">Referral Reward</option>
                    <option value="Sales Incentive">Sales Incentive</option>
                    <option value="Attendance Reward">Attendance Reward</option>
                    <option value="Anniversary Reward">Anniversary Reward</option>
                    <option value="Custom Reward">Custom Reward</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Reward Value Type</label>
                  <select
                    className="form-control"
                    value={policyForm.valueType}
                    onChange={e => setPolicyForm({ ...policyForm, valueType: e.target.value as any })}
                  >
                    <option value="FIXED_AMOUNT">Fixed Monetary Amount (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="GIFT_NON_MONETARY">Gift / Non-Monetary</option>
                    <option value="CERTIFICATE">Official Certificate</option>
                    <option value="POINTS">Reward Points</option>
                  </select>
                </div>

                {policyForm.valueType === 'FIXED_AMOUNT' ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Monetary Amount (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      placeholder="e.g. 1000"
                      value={policyForm.amountValue}
                      onChange={e => setPolicyForm({ ...policyForm, amountValue: e.target.value === '' ? '' : (parseFloat(e.target.value) || 0) })}
                      required
                    />
                  </div>
                ) : policyForm.valueType === 'GIFT_NON_MONETARY' ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Gift Description</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Smart Watch / Safety Equipment Gift Card"
                      value={policyForm.giftDescription}
                      onChange={e => setPolicyForm({ ...policyForm, giftDescription: e.target.value })}
                    />
                  </div>
                ) : null}

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Eligibility Rule & Criteria</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 100% attendance, zero safety hazards, high rating"
                    value={policyForm.eligibilityRule}
                    onChange={e => setPolicyForm({ ...policyForm, eligibilityRule: e.target.value })}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Summary of award..."
                    value={policyForm.description}
                    onChange={e => setPolicyForm({ ...policyForm, description: e.target.value })}
                  />
                </div>

                <div style={{ gridColumn: '1 / -1', backgroundColor: '#ECFEFF', padding: '12px', borderRadius: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 700, color: '#0E7490' }}>
                    <input
                      type="checkbox"
                      checked={policyForm.addToPayroll}
                      onChange={e => setPolicyForm({ ...policyForm, addToPayroll: e.target.checked })}
                    />
                    Add Automatically to Payroll Earnings & Payslips
                  </label>
                  <p style={{ margin: '4px 0 0 24px', fontSize: '0.78rem', color: '#0E7490' }}>
                    When checked, granting this reward will automatically disburse funds via monthly payroll.
                  </p>
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

      {/* GRANT AWARD MODAL */}
      {isGrantModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3>Grant Recognition Award to Employee</h3>
              <button className="close-btn" title="Close" onClick={() => setIsGrantModalOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleConfirmGrant}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label className="form-label">Select Reward Program</label>
                  <select
                    className="form-control"
                    value={grantForm.rewardPolicyId}
                    onChange={e => {
                      const pid = e.target.value;
                      const pol = rewardPolicies.find(p => p.id === pid);
                      setGrantForm({
                        ...grantForm,
                        rewardPolicyId: pid,
                        amount: pol ? pol.amountValue : 0
                      });
                    }}
                  >
                    {rewardPolicies.filter(p => p.status === 'Active').map(p => (
                      <option key={p.id} value={p.id}>{p.rewardName} ({formatCurrency(p.amountValue)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Recipient Employee</label>
                  <select
                    className="form-control"
                    value={grantForm.employeeId}
                    onChange={e => setGrantForm({ ...grantForm, employeeId: e.target.value })}
                  >
                    {employees.map(emp => (
                      <option key={emp.employeeId} value={emp.employeeId}>
                        {emp.firstName} {emp.lastName} ({emp.employeeId}) • {emp.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Monetary Amount (₹)</label>
                  <input
                    type="number"
                    className="form-control"
                    value={grantForm.amount}
                    onChange={e => setGrantForm({ ...grantForm, amount: parseFloat(e.target.value) || 0 })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Grant Citation / Citation Notes</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    placeholder="Specific achievement or rationale for this award..."
                    value={grantForm.notes}
                    onChange={e => setGrantForm({ ...grantForm, notes: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsGrantModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm & Disburse Award
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
