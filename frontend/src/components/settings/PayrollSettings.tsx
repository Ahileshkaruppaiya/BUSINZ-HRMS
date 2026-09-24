import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  SalaryComponentConfig 
} from '../../types/settings';
import { validateFormula, evaluateFormula } from '../../services/policyEngine';
import { payrollApi } from '../../services/payrollApi';
import { INITIAL_PAYROLL_CONFIG } from '../../data/settingsInitialData';
import { formatCurrency } from '../../utils/numbers';
import { 
  CreditCard, 
  Plus, 
  Edit3, 
  Calculator, 
  CheckCircle2, 
  Sliders, 
  FileText, 
  Layers, 
  Play, 
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Info,
  RotateCcw,
  X
} from 'lucide-react';

export const PayrollSettings: React.FC = () => {
  const { 
    payrollSettingsConfig, 
    updatePayrollSettingsConfig, 
    toggleSalaryComponent,
    currentUser 
  } = useHRMS();

  const isPrivileged = currentUser.role !== 'Employee';
  const [activeTab, setActiveTab] = useState<'components' | 'formula_tester'>('components');

  // Formula Sandbox Tester State
  const [sandboxFormula, setSandboxFormula] = useState('');
  const [sandboxInputs, setSandboxInputs] = useState({
    BASIC: 0,
    HRA: 0,
    GROSS: 0,
    CTC: 0,
    DAILY_SALARY: 0,
    WORKING_DAYS: 26,
    PAID_DAYS: 26,
    UNPAID_DAYS: 0,
    LATE_COUNT: 0,
    LEAVE_DAYS: 0,
    INCENTIVE: 0,
    BONUS: 0,
    REWARD: 0
  });
  const [sandboxResult, setSandboxResult] = useState<number | null>(null);
  const [sandboxValidation, setSandboxValidation] = useState<{ isValid: boolean; error?: string }>({ isValid: true });



  // Component Edit Modal
  const [isCompModalOpen, setIsCompModalOpen] = useState(false);
  const [editingComp, setEditingComp] = useState<SalaryComponentConfig | null>(null);
  const [compForm, setCompForm] = useState<{
    name: string;
    code: string;
    type: 'EARNING' | 'DEDUCTION';
    calculationMethod: 'FIXED_AMOUNT' | 'PERCENTAGE' | 'FORMULA';
    defaultValue: number;
    percentageBase: 'BASIC' | 'GROSS' | 'CTC';
    formula: string;
    isStatutory: boolean;
    isConfidential: boolean;
    description: string;
  }>({
    name: '',
    code: '',
    type: 'EARNING',
    calculationMethod: 'FIXED_AMOUNT',
    defaultValue: 0,
    percentageBase: 'BASIC',
    formula: '',
    isStatutory: false,
    isConfidential: false,
    description: ''
  });

  const runSandboxCalculation = () => {
    const valid = validateFormula(sandboxFormula);
    setSandboxValidation(valid);
    if (valid.isValid) {
      const res = evaluateFormula(sandboxFormula, sandboxInputs);
      setSandboxResult(res);
    } else {
      setSandboxResult(null);
    }
  };

  const openAddCompModal = () => {
    openAddCompModalWithType('EARNING');
  };

  const openAddCompModalWithType = (type: 'EARNING' | 'DEDUCTION') => {
    setEditingComp(null);
    setCompForm({
      name: '',
      code: '',
      type: type,
      calculationMethod: type === 'EARNING' ? 'PERCENTAGE' : 'FIXED_AMOUNT',
      defaultValue: type === 'EARNING' ? 10 : 0,
      percentageBase: type === 'EARNING' ? 'CTC' : 'GROSS',
      formula: '',
      isStatutory: false,
      isConfidential: false,
      description: ''
    });
    setIsCompModalOpen(true);
  };

  const openEditCompModal = (c: SalaryComponentConfig) => {
    setEditingComp(c);
    setCompForm({
      name: c.name,
      code: c.code,
      type: c.type,
      calculationMethod: c.calculationMethod,
      defaultValue: c.defaultValue,
      percentageBase: c.percentageBase || 'BASIC',
      formula: c.formula || '',
      isStatutory: c.isStatutory,
      isConfidential: c.isConfidential,
      description: c.description
    });
    setIsCompModalOpen(true);
  };

  const handleSaveComp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!compForm.name.trim() || !compForm.code.trim()) return;

    if (editingComp) {
      const updated = payrollSettingsConfig.components.map(c => {
        if (c.id === editingComp.id) {
          return {
            ...c,
            name: compForm.name,
            code: compForm.code.toUpperCase().replace(/\s+/g, '_'),
            type: compForm.type,
            calculationMethod: compForm.calculationMethod,
            defaultValue: Number(compForm.defaultValue) || 0,
            percentageBase: compForm.percentageBase,
            formula: compForm.formula,
            isStatutory: compForm.isStatutory,
            isConfidential: compForm.isConfidential,
            description: compForm.description
          };
        }
        return c;
      });
      updatePayrollSettingsConfig({ components: updated });
    } else {
      const newComp: SalaryComponentConfig = {
        id: `c-${Date.now()}`,
        name: compForm.name,
        code: compForm.code.toUpperCase().replace(/\s+/g, '_'),
        type: compForm.type,
        calculationMethod: compForm.calculationMethod,
        defaultValue: Number(compForm.defaultValue) || 0,
        percentageBase: compForm.percentageBase,
        formula: compForm.formula,
        isStatutory: compForm.isStatutory,
        active: true,
        isConfidential: compForm.isConfidential,
        description: compForm.description
      };
      updatePayrollSettingsConfig({ components: [...payrollSettingsConfig.components, newComp] });
    }
    setIsCompModalOpen(false);
  };

  const handleDeleteComp = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to permanently delete the salary component "${name}"?`)) {
      const updated = payrollSettingsConfig.components.filter(c => c.id !== id);
      updatePayrollSettingsConfig({ components: updated });
    }
  };

  // Official company earnings (Basic 40%, DA 20%, HRA 35%, Conveyance 5% = 100% CTC)
  const earnings = payrollSettingsConfig.components.filter(c => c.type === 'EARNING');
  const deductions = payrollSettingsConfig.components.filter(c => c.type === 'DEDUCTION');

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
          borderRadius: '10px',
          flexWrap: 'wrap'
        }}>
          <button
            type="button"
            onClick={() => setActiveTab('components')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'components' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'components' ? '#0E7490' : '#64748B',
              boxShadow: activeTab === 'components' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              fontWeight: activeTab === 'components' ? 750 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Layers size={15} />
            <span>Salary Components</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '1px 6px',
              borderRadius: '999px',
              backgroundColor: activeTab === 'components' ? '#ECFEFF' : '#E2E8F0',
              color: activeTab === 'components' ? '#0E7490' : '#64748B',
              fontWeight: 700
            }}>
              {earnings.length + deductions.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('formula_tester')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'formula_tester' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'formula_tester' ? '#0E7490' : '#64748B',
              boxShadow: activeTab === 'formula_tester' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              fontWeight: activeTab === 'formula_tester' ? 750 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <Calculator size={15} />
            <span>Safe Formula Builder</span>
          </button>
        </div>

        {/* Top Add Component Button */}
        {activeTab === 'components' && (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => openAddCompModal()}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px', 
              borderRadius: '10px', 
              fontWeight: 750,
              backgroundColor: '#0E7490',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 16px',
              fontSize: '0.84rem',
              cursor: 'pointer',
              boxShadow: '0 2px 5px rgba(14, 116, 144, 0.25)'
            }}
          >
            <Plus size={16} /> Add Salary Component
          </button>
        )}
      </div>

      {/* TAB 1: SALARY COMPONENTS */}
      {activeTab === 'components' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Earnings Table */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#166534', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E' }} />
                Earnings & Allowances ({earnings.length})
              </h3>
            </div>

            <table className="hrms-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Code</th>
                  <th>Method</th>
                  <th>Calculation Details</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {earnings.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B', fontSize: '13px' }}>
                      No earnings & allowances configured. Click <strong>+ Add Salary Component</strong> to create one.
                    </td>
                  </tr>
                ) : (
                  earnings.map(comp => (
                    <tr key={comp.id} style={{ opacity: comp.active ? 1 : 0.55 }}>
                      <td>
                        <strong>{comp.name}</strong>
                        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{comp.description}</div>
                      </td>
                      <td><code>{comp.code}</code></td>
                      <td><span className="status-pill eta">{comp.calculationMethod.replace(/_/g, ' ')}</span></td>
                      <td>
                        {comp.calculationMethod === 'FIXED_AMOUNT' && formatCurrency(comp.defaultValue)}
                        {comp.calculationMethod === 'PERCENTAGE' && `${comp.defaultValue}% of ${comp.percentageBase || 'CTC'}`}
                        {comp.calculationMethod === 'FORMULA' && `Formula: ${comp.formula}`}
                      </td>
                      <td>
                        <span className={`status-pill ${comp.active ? 'approved' : 'overdue'}`}>
                          {comp.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => openEditCompModal(comp)}
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => toggleSalaryComponent(comp.code)}
                          >
                            {comp.active ? 'Disable' : 'Enable'}
                          </button>
                          {isPrivileged && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', color: '#DC2626', borderColor: '#FECACA' }}
                              onClick={() => handleDeleteComp(comp.id, comp.name)}
                              title="Delete Component"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Deductions Table */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#991B1B', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                Deductions & Statutory Contributions ({deductions.length})
              </h3>
            </div>

            <table className="hrms-table">
              <thead>
                <tr>
                  <th>Component</th>
                  <th>Code</th>
                  <th>Method</th>
                  <th>Calculation Details</th>
                  <th>Employee Visibility</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {deductions.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '32px 16px', color: '#64748B', fontSize: '13px' }}>
                      No deductions configured. Click <strong>+ Add Salary Component</strong> to create one.
                    </td>
                  </tr>
                ) : (
                  deductions.map(comp => (
                    <tr key={comp.id} style={{ opacity: comp.active ? 1 : 0.55 }}>
                      <td>
                        <strong>{comp.name}</strong>
                        <div style={{ fontSize: '0.74rem', color: '#64748B' }}>{comp.description}</div>
                      </td>
                      <td><code>{comp.code}</code></td>
                      <td><span className="status-pill eta">{comp.calculationMethod.replace(/_/g, ' ')}</span></td>
                      <td>
                        {comp.code === 'EPF' ? (
                          <span style={{ fontWeight: 600, color: '#0F172A' }}>12% of Base (Basic + DA + Conveyance)</span>
                        ) : comp.code === 'ESIC' ? (
                          <span style={{ fontWeight: 600, color: '#0F172A' }}>0.75% of Gross (wage ceiling ₹21,000.00)</span>
                        ) : (
                          <>
                            {comp.calculationMethod === 'FIXED_AMOUNT' && formatCurrency(comp.defaultValue)}
                            {comp.calculationMethod === 'PERCENTAGE' && `${comp.defaultValue}% of ${comp.percentageBase || 'Gross'}`}
                            {comp.calculationMethod === 'FORMULA' && `Formula: ${comp.formula}`}
                          </>
                        )}
                      </td>
                      <td>
                        {comp.isConfidential ? (
                          <span style={{ fontSize: '0.76rem', color: '#DC2626', fontWeight: 600 }}>
                            Confidential (OTHERS)
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.76rem', color: '#16A34A', fontWeight: 600 }}>
                            Visible
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`status-pill ${comp.active ? 'approved' : 'overdue'}`}>
                          {comp.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => openEditCompModal(comp)}
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px' }}
                            onClick={() => toggleSalaryComponent(comp.code)}
                          >
                            {comp.active ? 'Disable' : 'Enable'}
                          </button>
                          {isPrivileged && (
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ padding: '4px 8px', color: '#DC2626', borderColor: '#FECACA' }}
                              onClick={() => handleDeleteComp(comp.id, comp.name)}
                              title="Delete Component"
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: FORMULA BUILDER & TESTER */}
      {activeTab === 'formula_tester' && (
        <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <div style={{ marginBottom: '18px' }}>
            <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              Safe Formula Builder & Mathematical Sandbox
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: '#64748B' }}>
              Test formulas in real-time with sample payroll, attendance, and leave variables before saving into master policies.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px' }}>
            <div>
              <label className="form-label" style={{ fontWeight: 700 }}>Expression Formula</label>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                <input
                  type="text"
                  className="form-control"
                  style={{ fontFamily: 'monospace', fontSize: '0.95rem' }}
                  value={sandboxFormula}
                  onChange={e => setSandboxFormula(e.target.value)}
                  placeholder="e.g. BASIC * 12 / 100 or DAILY_SALARY * UNPAID_DAYS"
                />
                <button className="btn btn-primary" onClick={runSandboxCalculation} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Play size={15} /> Evaluate
                </button>
              </div>

              {sandboxValidation.isValid ? (
                <div style={{
                  padding: '16px',
                  backgroundColor: '#ECFEFF',
                  border: '1px solid #A5F3FC',
                  borderRadius: '12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <div>
                    <span style={{ fontSize: '0.78rem', color: '#0E7490', fontWeight: 700, textTransform: 'uppercase' }}>
                      Calculated Output Result
                    </span>
                    <div style={{ fontSize: '1.6rem', fontWeight: 800, color: '#0E7490' }}>
                      {sandboxResult !== null ? formatCurrency(sandboxResult) : '—'}
                    </div>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: '#166534', fontWeight: 600 }}>
                    ✓ Valid Syntax & Precedence
                  </span>
                </div>
              ) : (
                <div style={{ padding: '12px', backgroundColor: '#FEE2E2', border: '1px solid #FECACA', borderRadius: '12px', color: '#DC2626', fontSize: '0.85rem', fontWeight: 600 }}>
                  ⚠ Formula Error: {sandboxValidation.error}
                </div>
              )}

              {/* Supported Variables Legend */}
              <div style={{ marginTop: '18px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                  Available Engine Variables
                </span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                  {['BASIC', 'HRA', 'GROSS', 'CTC', 'DAILY_SALARY', 'WORKING_DAYS', 'PAID_DAYS', 'UNPAID_DAYS', 'LATE_COUNT', 'LEAVE_DAYS', 'INCENTIVE', 'BONUS', 'REWARD'].map(v => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSandboxFormula(prev => prev ? `${prev} + ${v}` : v)}
                      style={{
                        padding: '4px 8px',
                        borderRadius: '6px',
                        border: '1px solid #E2E8F0',
                        backgroundColor: '#F8FAFC',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        fontFamily: 'monospace'
                      }}
                      title={`Insert ${v}`}
                    >
                      +{v}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mock Inputs Simulator */}
            <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>
                Test Input Variables
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B' }}>BASIC (₹)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={sandboxInputs.BASIC}
                    onChange={e => setSandboxInputs({ ...sandboxInputs, BASIC: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B' }}>GROSS (₹)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={sandboxInputs.GROSS}
                    onChange={e => setSandboxInputs({ ...sandboxInputs, GROSS: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B' }}>DAILY_SALARY (₹)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={sandboxInputs.DAILY_SALARY}
                    onChange={e => setSandboxInputs({ ...sandboxInputs, DAILY_SALARY: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B' }}>UNPAID_DAYS</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={sandboxInputs.UNPAID_DAYS}
                    onChange={e => setSandboxInputs({ ...sandboxInputs, UNPAID_DAYS: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B' }}>LATE_COUNT</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={sandboxInputs.LATE_COUNT}
                    onChange={e => setSandboxInputs({ ...sandboxInputs, LATE_COUNT: parseFloat(e.target.value) || 0 })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#64748B' }}>REWARD (₹)</label>
                  <input
                    type="number"
                    className="form-control form-control-sm"
                    value={sandboxInputs.REWARD}
                    onChange={e => setSandboxInputs({ ...sandboxInputs, REWARD: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* COMPONENT CREATE / EDIT MODAL */}
      {isCompModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3>{editingComp ? `Edit Component: ${editingComp.name}` : 'Create Salary Component'}</h3>
              <button className="close-btn" title="Close" onClick={() => setIsCompModalOpen(false)}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSaveComp}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="form-label">Component Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={compForm.name}
                    onChange={e => setCompForm({ ...compForm, name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Component Code</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. HRA"
                    value={compForm.code}
                    onChange={e => setCompForm({ ...compForm, code: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 750 }}>Component Classification</label>
                  <select
                    className="form-control"
                    value={compForm.type}
                    onChange={e => {
                      const newType = e.target.value as 'EARNING' | 'DEDUCTION';
                      setCompForm(prev => ({
                        ...prev,
                        type: newType,
                        calculationMethod: newType === 'EARNING' ? 'PERCENTAGE' : 'FIXED_AMOUNT',
                        defaultValue: newType === 'EARNING' ? 10 : 0,
                        percentageBase: newType === 'EARNING' ? 'BASIC' : 'GROSS'
                      }));
                    }}
                    style={{ fontWeight: 700 }}
                  >
                    <option value="EARNING">Earning & Allowance (+)</option>
                    <option value="DEDUCTION">Deduction & Statutory (-)</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Calculation Method</label>
                  <select
                    className="form-control"
                    value={compForm.calculationMethod}
                    onChange={e => setCompForm({ ...compForm, calculationMethod: e.target.value as any })}
                  >
                    <option value="FIXED_AMOUNT">Fixed Monthly Amount (₹)</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FORMULA">Custom Formula</option>
                  </select>
                </div>

                {compForm.calculationMethod === 'PERCENTAGE' ? (
                  <>
                    <div>
                      <label className="form-label">Percentage Value (%)</label>
                      <input
                        type="number"
                        className="form-control"
                        value={compForm.defaultValue}
                        onChange={e => setCompForm({ ...compForm, defaultValue: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="form-label">Base Salary</label>
                      <select
                        className="form-control"
                        value={compForm.percentageBase}
                        onChange={e => setCompForm({ ...compForm, percentageBase: e.target.value as any })}
                      >
                        <option value="BASIC">Basic Salary</option>
                        <option value="GROSS">Gross Salary</option>
                        <option value="CTC">Total CTC</option>
                      </select>
                    </div>
                  </>
                ) : compForm.calculationMethod === 'FIXED_AMOUNT' ? (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Fixed Amount (₹)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={compForm.defaultValue}
                      onChange={e => setCompForm({ ...compForm, defaultValue: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                ) : (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label">Mathematical Formula</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. BASIC * 12 / 100"
                      value={compForm.formula}
                      onChange={e => setCompForm({ ...compForm, formula: e.target.value })}
                    />
                  </div>
                )}

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Description / Purpose</label>
                  <textarea
                    className="form-control"
                    rows={2}
                    value={compForm.description}
                    onChange={e => setCompForm({ ...compForm, description: e.target.value })}
                  />
                </div>

                {compForm.type === 'DEDUCTION' && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem' }}>
                      <input
                        type="checkbox"
                        checked={compForm.isConfidential}
                        onChange={e => setCompForm({ ...compForm, isConfidential: e.target.checked })}
                      />
                      Mark as Confidential (Displays under generic OTHERS on employee payslips)
                    </label>
                  </div>
                )}
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsCompModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingComp ? 'Update Component' : 'Create Component'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
