import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  SalaryComponentConfig, 
  IncrementPolicyConfig, 
  IncrementSlab 
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
  TrendingUp,
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
  const [activeTab, setActiveTab] = useState<'components' | 'increment' | 'formula_tester'>('components');

  // Increment Policy State
  const defaultIncrementPolicy: IncrementPolicyConfig = {
    active: false,
    cycle: '',
    effectiveMonth: 'April',
    standardBaseIncrement: 0,
    allowManagerRecommendation: false,
    slabs: []
  };

  const [incrementConfig, setIncrementConfig] = useState<IncrementPolicyConfig>(() => {
    const policy = payrollSettingsConfig.incrementPolicy;
    if (policy?.slabs?.some((s: any) => typeof s.id === 'string' && s.id.startsWith('inc-'))) {
      return defaultIncrementPolicy;
    }
    return policy || defaultIncrementPolicy;
  });
  const [incrementSaved, setIncrementSaved] = useState(false);

  // Increment Slab Modal State
  const [isSlabModalOpen, setIsSlabModalOpen] = useState(false);
  const [editingSlab, setEditingSlab] = useState<IncrementSlab | null>(null);
  const [slabForm, setSlabForm] = useState<{
    name: string;
    ratingMin: number;
    ratingMax: number;
    incrementPercentage: number;
    applicableCadre: string;
    effectiveCycle: string;
    status: 'Active' | 'Inactive';
  }>({
    name: '',
    ratingMin: 4.0,
    ratingMax: 5.0,
    incrementPercentage: 10,
    applicableCadre: 'All Confirmed Staff',
    effectiveCycle: 'April Annual Appraisal',
    status: 'Active'
  });

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

  const handleClearIncrementPolicy = () => {
    const cleared: IncrementPolicyConfig = {
      active: false,
      cycle: '',
      effectiveMonth: 'April',
      standardBaseIncrement: 0,
      allowManagerRecommendation: false,
      slabs: []
    };
    setIncrementConfig(cleared);
    updatePayrollSettingsConfig({ incrementPolicy: cleared });
  };

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

  // Increment Policy Handlers
  const handleSaveIncrementPolicy = (e: React.FormEvent) => {
    e.preventDefault();
    updatePayrollSettingsConfig({ incrementPolicy: incrementConfig });
    setIncrementSaved(true);
    setTimeout(() => setIncrementSaved(false), 2500);
  };

  const openAddSlabModal = () => {
    setEditingSlab(null);
    setSlabForm({
      name: '',
      ratingMin: 4.0,
      ratingMax: 5.0,
      incrementPercentage: 10,
      applicableCadre: 'All Confirmed Staff',
      effectiveCycle: incrementConfig.cycle,
      status: 'Active'
    });
    setIsSlabModalOpen(true);
  };

  const openEditSlabModal = (slab: IncrementSlab) => {
    setEditingSlab(slab);
    setSlabForm({
      name: slab.name,
      ratingMin: slab.ratingMin,
      ratingMax: slab.ratingMax,
      incrementPercentage: slab.incrementPercentage,
      applicableCadre: slab.applicableCadre,
      effectiveCycle: slab.effectiveCycle,
      status: slab.status
    });
    setIsSlabModalOpen(true);
  };

  const handleDeleteSlab = (slabId: string, slabName: string) => {
    if (window.confirm(`Are you sure you want to delete the increment slab "${slabName}"?`)) {
      const updatedSlabs = incrementConfig.slabs.filter(s => s.id !== slabId);
      const newConfig = { ...incrementConfig, slabs: updatedSlabs };
      setIncrementConfig(newConfig);
      updatePayrollSettingsConfig({ incrementPolicy: newConfig });
    }
  };

  const handleSaveSlab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!slabForm.name.trim()) return;

    let updatedSlabs: IncrementSlab[];
    if (editingSlab) {
      updatedSlabs = incrementConfig.slabs.map(s => {
        if (s.id === editingSlab.id) {
          return {
            ...s,
            name: slabForm.name,
            ratingMin: Number(slabForm.ratingMin),
            ratingMax: Number(slabForm.ratingMax),
            incrementPercentage: Number(slabForm.incrementPercentage),
            applicableCadre: slabForm.applicableCadre,
            effectiveCycle: slabForm.effectiveCycle,
            status: slabForm.status
          };
        }
        return s;
      });
    } else {
      const newSlab: IncrementSlab = {
        id: `inc-${Date.now()}`,
        name: slabForm.name,
        ratingMin: Number(slabForm.ratingMin),
        ratingMax: Number(slabForm.ratingMax),
        incrementPercentage: Number(slabForm.incrementPercentage),
        applicableCadre: slabForm.applicableCadre,
        effectiveCycle: slabForm.effectiveCycle,
        status: slabForm.status
      };
      updatedSlabs = [...incrementConfig.slabs, newSlab];
    }
    const newConfig = { ...incrementConfig, slabs: updatedSlabs };
    setIncrementConfig(newConfig);
    updatePayrollSettingsConfig({ incrementPolicy: newConfig });
    setIsSlabModalOpen(false);
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
            onClick={() => setActiveTab('increment')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '7px 14px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: activeTab === 'increment' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'increment' ? '#0E7490' : '#64748B',
              boxShadow: activeTab === 'increment' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
              fontWeight: activeTab === 'increment' ? 750 : 600,
              fontSize: '0.82rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            <TrendingUp size={15} />
            <span>Increment Policies</span>
            <span style={{
              fontSize: '0.7rem',
              padding: '1px 6px',
              borderRadius: '999px',
              backgroundColor: activeTab === 'increment' ? '#ECFEFF' : '#E2E8F0',
              color: activeTab === 'increment' ? '#0E7490' : '#64748B',
              fontWeight: 700
            }}>
              {incrementConfig.slabs.length}
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

      {/* TAB 3: INCREMENT POLICIES & SLABS */}
      {activeTab === 'increment' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Policy Overview Card */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', backgroundColor: '#ECFEFF', color: '#0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
                    Annual & Performance Increment Rules
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>
                    Standard company increment cycle, appraisal rating-based salary hike slabs, and managerial recommendation flow
                  </p>
                </div>
              </div>
              <span className={`status-pill ${incrementConfig.active ? 'approved' : 'overdue'}`}>
                {incrementConfig.active ? 'Active' : 'Inactive'}
              </span>
            </div>

            <form onSubmit={handleSaveIncrementPolicy} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
                <div>
                  <label className="form-label">Increment Appraisal Cycle</label>
                  <input
                    type="text"
                    className="form-control"
                    value={incrementConfig.cycle}
                    onChange={e => setIncrementConfig({ ...incrementConfig, cycle: e.target.value })}
                    placeholder="e.g. Annual Appraisal Cycle (April)"
                  />
                </div>

                <div>
                  <label className="form-label">Effective Appraisal Month</label>
                  <select
                    className="form-control"
                    value={incrementConfig.effectiveMonth}
                    onChange={e => setIncrementConfig({ ...incrementConfig, effectiveMonth: e.target.value })}
                  >
                    <option value="January">January</option>
                    <option value="April">April (Financial Year)</option>
                    <option value="July">July</option>
                    <option value="October">October</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Standard Base Increment (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    className="form-control"
                    value={incrementConfig.standardBaseIncrement}
                    onChange={e => setIncrementConfig({ ...incrementConfig, standardBaseIncrement: parseFloat(e.target.value) || 0 })}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '10px', borderTop: '1px solid #F1F5F9' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.84rem' }}>
                  <input
                    type="checkbox"
                    checked={incrementConfig.active}
                    onChange={e => setIncrementConfig({ ...incrementConfig, active: e.target.checked })}
                  />
                  Enable Annual / Performance Increment Policy
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {incrementSaved && (
                    <span style={{ color: '#16A34A', fontSize: '0.82rem', fontWeight: 600 }}>
                      ✓ Increment policy settings saved!
                    </span>
                  )}
                  <button type="button" className="btn btn-secondary btn-sm" onClick={handleClearIncrementPolicy}>
                    Clear
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm">
                    Save Policy Settings
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Performance Appraisal Increment Slabs Table */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                  Appraisal Rating Increment Slabs ({incrementConfig.slabs.length})
                </h3>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#64748B' }}>
                  Configured salary increment percentage linked directly to employee annual appraisal ratings (1.0 to 5.0)
                </p>
              </div>

              {isPrivileged && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={openAddSlabModal}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={15} /> Add Increment Slab
                </button>
              )}
            </div>

            <table className="hrms-table">
              <thead>
                <tr>
                  <th>Slab Name</th>
                  <th>Performance Rating</th>
                  <th>Increment %</th>
                  <th>Applicable Staff</th>
                  <th>Effective Cycle</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {incrementConfig.slabs.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '36px 16px', color: '#64748B' }}>
                      No increment slabs configured yet. Click "+ Add Increment Slab" to manually add appraisal slabs.
                    </td>
                  </tr>
                ) : (
                  incrementConfig.slabs.map(slab => (
                  <tr key={slab.id}>
                    <td><strong>{slab.name}</strong></td>
                    <td>
                      <span className="status-pill eta">
                        ★ {slab.ratingMin} - {slab.ratingMax}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: '#0E7490', fontSize: '0.95rem' }}>
                        +{slab.incrementPercentage}%
                      </strong>
                    </td>
                    <td>{slab.applicableCadre}</td>
                    <td><span style={{ fontSize: '0.8rem', color: '#64748B' }}>{slab.effectiveCycle}</span></td>
                    <td>
                      <span className={`status-pill ${slab.status === 'Active' ? 'approved' : 'overdue'}`}>
                        {slab.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px' }}
                          onClick={() => openEditSlabModal(slab)}
                        >
                          <Edit3 size={13} /> Edit
                        </button>
                        {isPrivileged && (
                          <button
                            className="btn btn-secondary btn-sm"
                            style={{ padding: '4px 8px', color: '#DC2626', borderColor: '#FECACA' }}
                            onClick={() => handleDeleteSlab(slab.id, slab.name)}
                            title="Delete Slab"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: FORMULA BUILDER & TESTER */}
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

      {/* Increment Slab Modal */}
      {isSlabModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="modal-content" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '18px',
            width: '100%',
            maxWidth: '520px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden'
          }}>
            <div className="modal-header" style={{
              padding: '18px 24px',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
                {editingSlab ? 'Edit Increment Slab' : 'Add Increment Slab'}
              </h3>
              <button
                type="button"
                className="close-btn"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
                onClick={() => setIsSlabModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveSlab}>
              <div className="modal-body" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label className="form-label">Slab Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Outstanding Performer"
                    value={slabForm.name}
                    onChange={e => setSlabForm({ ...slabForm, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Min Rating (★)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      className="form-control"
                      value={slabForm.ratingMin}
                      onChange={e => setSlabForm({ ...slabForm, ratingMin: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Max Rating (★)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="5"
                      className="form-control"
                      value={slabForm.ratingMax}
                      onChange={e => setSlabForm({ ...slabForm, ratingMax: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label className="form-label">Increment Percentage (%)</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="form-control"
                      value={slabForm.incrementPercentage}
                      onChange={e => setSlabForm({ ...slabForm, incrementPercentage: parseFloat(e.target.value) || 0 })}
                      required
                    />
                  </div>
                  <div>
                    <label className="form-label">Status</label>
                    <select
                      className="form-control"
                      value={slabForm.status}
                      onChange={e => setSlabForm({ ...slabForm, status: e.target.value as any })}
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label">Applicable Staff Cadre</label>
                  <input
                    type="text"
                    className="form-control"
                    value={slabForm.applicableCadre}
                    onChange={e => setSlabForm({ ...slabForm, applicableCadre: e.target.value })}
                    placeholder="e.g. All Confirmed Staff"
                  />
                </div>

                <div>
                  <label className="form-label">Effective Cycle</label>
                  <input
                    type="text"
                    className="form-control"
                    value={slabForm.effectiveCycle}
                    onChange={e => setSlabForm({ ...slabForm, effectiveCycle: e.target.value })}
                    placeholder="e.g. April Annual Appraisal"
                  />
                </div>
              </div>

              <div className="modal-footer" style={{
                padding: '16px 24px',
                borderTop: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '10px'
              }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsSlabModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSlab ? 'Update Slab' : 'Create Slab'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
