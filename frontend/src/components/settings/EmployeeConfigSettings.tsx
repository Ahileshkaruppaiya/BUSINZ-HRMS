import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  UserCheck, 
  Hash, 
  FileText, 
  Sliders, 
  Clock, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Save, 
  AlertCircle,
  X,
  Shield,
  Layers
} from 'lucide-react';
import { CustomFieldItem, DocumentTypeItem } from '../../types/hrms';

export const EmployeeConfigSettings: React.FC = () => {
  const { 
    employeeConfig, 
    updateEmployeeConfig, 
    businessSettings, 
    updateBusinessSettings, 
    employees 
  } = useHRMS();

  const [activeTab, setActiveTab] = useState<'id_format' | 'probation' | 'custom_fields' | 'documents' | 'statuses'>('id_format');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local state for forms
  const [configState, setConfigState] = useState({ ...employeeConfig });

  // Custom Field Modal
  const [isFieldModalOpen, setIsFieldModalOpen] = useState(false);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldForm, setFieldForm] = useState<CustomFieldItem>({
    id: '',
    label: '',
    fieldName: '',
    fieldType: 'text',
    category: 'Personal',
    required: false,
    options: []
  });

  // Document Type Modal
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docForm, setDocForm] = useState<DocumentTypeItem>({
    id: '',
    name: '',
    code: '',
    mandatory: true,
    maxSizeMb: 5,
    allowedFormats: ['PDF', 'JPG', 'PNG']
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveIdFormat = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmployeeConfig({
      idFormatPrefix: configState.idFormatPrefix,
      idFormatDigits: configState.idFormatDigits,
      idStartingNumber: configState.idStartingNumber,
      autoGenerateId: configState.autoGenerateId
    });
    // Sync with businessSettings prefix
    updateBusinessSettings({
      employeeCodePrefix: configState.idFormatPrefix
    });
    triggerToast('Employee ID format settings saved successfully');
  };

  const handleSaveProbation = (e: React.FormEvent) => {
    e.preventDefault();
    updateEmployeeConfig({
      defaultProbationMonths: configState.defaultProbationMonths,
      defaultNoticeDays: configState.defaultNoticeDays,
      autoConfirmProbation: configState.autoConfirmProbation
    });
    triggerToast('Probation and notice period settings updated');
  };

  const openAddField = () => {
    setEditingFieldId(null);
    setFieldForm({
      id: `cf-${Date.now()}`,
      label: '',
      fieldName: '',
      fieldType: 'text',
      category: 'Personal',
      required: false,
      options: []
    });
    setIsFieldModalOpen(true);
  };

  const handleSaveCustomField = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fieldForm.label.trim()) return;
    const generatedName = fieldForm.fieldName || fieldForm.label.toLowerCase().replace(/[^a-z0-9]/g, '');
    let updatedFields = [...configState.customFields];
    if (editingFieldId) {
      updatedFields = updatedFields.map(f => f.id === editingFieldId ? { ...fieldForm, fieldName: generatedName } : f);
    } else {
      updatedFields.push({ ...fieldForm, fieldName: generatedName, id: `cf-${Date.now()}` });
    }
    setConfigState(prev => ({ ...prev, customFields: updatedFields }));
    updateEmployeeConfig({ customFields: updatedFields });
    setIsFieldModalOpen(false);
    triggerToast(`Custom Field "${fieldForm.label}" saved`);
  };

  const handleDeleteCustomField = (id: string) => {
    const updated = configState.customFields.filter(f => f.id !== id);
    setConfigState(prev => ({ ...prev, customFields: updated }));
    updateEmployeeConfig({ customFields: updated });
    triggerToast('Custom field removed');
  };

  const openAddDoc = () => {
    setEditingDocId(null);
    setDocForm({
      id: `dt-${Date.now()}`,
      name: '',
      code: '',
      mandatory: true,
      maxSizeMb: 5,
      allowedFormats: ['PDF', 'JPG', 'PNG']
    });
    setIsDocModalOpen(true);
  };

  const handleSaveDocType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.name.trim()) return;
    let updatedDocs = [...configState.documentTypes];
    if (editingDocId) {
      updatedDocs = updatedDocs.map(d => d.id === editingDocId ? docForm : d);
    } else {
      updatedDocs.push({ ...docForm, id: `dt-${Date.now()}` });
    }
    setConfigState(prev => ({ ...prev, documentTypes: updatedDocs }));
    updateEmployeeConfig({ documentTypes: updatedDocs });
    setIsDocModalOpen(false);
    triggerToast(`Document Type "${docForm.name}" saved`);
  };

  const handleDeleteDocType = (id: string) => {
    const updated = configState.documentTypes.filter(d => d.id !== id);
    setConfigState(prev => ({ ...prev, documentTypes: updated }));
    updateEmployeeConfig({ documentTypes: updated });
    triggerToast('Document type removed');
  };

  const previewId = `${configState.idFormatPrefix}-${String(configState.idStartingNumber).padStart(configState.idFormatDigits, '0')}`;

  return (
    <div style={{ padding: '0 4px' }}>
      {toastMessage && (
        <div style={{
          position: 'fixed',
          top: '24px',
          right: '24px',
          zIndex: 9999,
          backgroundColor: '#0E7490',
          color: '#ffffff',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 8px 24px rgba(14, 116, 144, 0.25)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '0.9rem'
        }}>
          <CheckCircle2 size={18} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sub-tabs */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        overflowX: 'auto',
        paddingBottom: '12px',
        marginBottom: '20px',
        borderBottom: '1px solid #E7ECF3'
      }}>
        {[
          { id: 'id_format', label: 'Employee ID Format', icon: Hash },
          { id: 'probation', label: 'Probation & Notice Rules', icon: Clock },
          { id: 'custom_fields', label: `Custom Fields (${configState.customFields.length})`, icon: Sliders },
          { id: 'documents', label: `Document Types (${configState.documentTypes.length})`, icon: FileText },
          { id: 'statuses', label: 'Employee Statuses', icon: UserCheck }
        ].map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '9999px',
                border: isActive ? '1px solid #0E7490' : '1px solid #E2E8F0',
                backgroundColor: isActive ? '#ECFEFF' : '#ffffff',
                color: isActive ? '#0E7490' : '#64748B',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease'
              }}
            >
              <Icon size={15} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB: EMPLOYEE ID FORMAT */}
      {activeTab === 'id_format' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Employee ID Generation Rules</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px' }}>Configure automated employee code serialization automatically generated in onboarding forms</p>

          <form onSubmit={handleSaveIdFormat} style={{ maxWidth: '650px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ padding: '16px 20px', backgroundColor: '#ECFEFF', border: '1px solid #A5F3FC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0E7490', textTransform: 'uppercase' }}>Live Format Preview</span>
                <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#0E7490', letterSpacing: '0.05em' }}>{previewId}</div>
              </div>
              <span style={{ fontSize: '0.82rem', color: '#0E7490', fontWeight: 600 }}>Next Employee ID: {configState.idFormatPrefix}-{String(employees.length + 1).padStart(configState.idFormatDigits, '0')}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>ID Prefix *</label>
                <input
                  type="text"
                  required
                  value={configState.idFormatPrefix}
                  onChange={e => setConfigState({ ...configState, idFormatPrefix: e.target.value.toUpperCase() })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Number of Digits</label>
                <select
                  value={configState.idFormatDigits}
                  onChange={e => setConfigState({ ...configState, idFormatDigits: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                >
                  <option value={3}>3 Digits (e.g. 001)</option>
                  <option value={4}>4 Digits (e.g. 0001)</option>
                  <option value={5}>5 Digits (e.g. 00001)</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Starting Number</label>
                <input
                  type="number"
                  min={1}
                  value={configState.idStartingNumber}
                  onChange={e => setConfigState({ ...configState, idStartingNumber: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <input
                type="checkbox"
                id="autoGen"
                checked={configState.autoGenerateId}
                onChange={e => setConfigState({ ...configState, autoGenerateId: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#0E7490' }}
              />
              <label htmlFor="autoGen" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>
                Automatically pre-fill next sequential ID on Add Employee form
              </label>
            </div>

            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0E7490',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 24px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                alignSelf: 'flex-start'
              }}
            >
              <Save size={16} />
              <span>Save ID Configuration</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB: PROBATION & NOTICE */}
      {activeTab === 'probation' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Probation & Notice Period Settings</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px' }}>Default tenure rules applied when onboarding new permanent and contractual staff</p>

          <form onSubmit={handleSaveProbation} style={{ maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Default Probation Duration</label>
              <select
                value={configState.defaultProbationMonths}
                onChange={e => setConfigState({ ...configState, defaultProbationMonths: Number(e.target.value) })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
              >
                <option value={3}>3 Months (Fast-Track / Lateral Hires)</option>
                <option value={6}>6 Months (Standard Industrial Default)</option>
                <option value={12}>12 Months (Graduate Trainees / Apprentices)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Default Notice Period</label>
              <select
                value={configState.defaultNoticeDays}
                onChange={e => setConfigState({ ...configState, defaultNoticeDays: Number(e.target.value) })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
              >
                <option value={15}>15 Days (Probation Period Notice)</option>
                <option value={30}>30 Days (1 Month Standard)</option>
                <option value={60}>60 Days (2 Months - Engineering / Senior)</option>
                <option value={90}>90 Days (3 Months - Executive / Plant Heads)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', backgroundColor: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
              <input
                type="checkbox"
                id="autoConfirm"
                checked={configState.autoConfirmProbation}
                onChange={e => setConfigState({ ...configState, autoConfirmProbation: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#0E7490' }}
              />
              <label htmlFor="autoConfirm" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>
                Auto-confirm employee status to 'Active' upon probation completion if no negative appraisal submitted
              </label>
            </div>

            <button
              type="submit"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#0E7490',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '10px 24px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                alignSelf: 'flex-start'
              }}
            >
              <Save size={16} />
              <span>Save Probation Settings</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB: CUSTOM FIELDS */}
      {activeTab === 'custom_fields' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Custom Employee Fields</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '4px 0 0' }}>Dynamic fields appearing throughout employee profiles and onboarding wizards</p>
            </div>
            <button
              onClick={openAddField}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#0E7490',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '9px 18px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              <span>Add Custom Field</span>
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Field Label</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>API Key</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Type</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Section</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Mandatory</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {configState.customFields.map(f => (
                  <tr key={f.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1E293B', fontSize: '0.88rem' }}>{f.label}</td>
                    <td style={{ padding: '14px 16px', fontSize: '0.82rem', fontFamily: 'monospace', color: '#0E7490' }}>{f.fieldName}</td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                      <span style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '3px 8px', borderRadius: '4px', fontWeight: 600, fontSize: '0.78rem' }}>
                        {f.fieldType.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#64748B' }}>{f.category}</td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                      {f.required ? (
                        <span style={{ color: '#DC2626', fontWeight: 700 }}>Required *</span>
                      ) : (
                        <span style={{ color: '#94A3B8' }}>Optional</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <button onClick={() => handleDeleteCustomField(f.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: DOCUMENT TYPES */}
      {activeTab === 'documents' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Onboarding Document Types</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '4px 0 0' }}>Required certifications, proof of identity, and tax documents collected during joining</p>
            </div>
            <button
              onClick={openAddDoc}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#0E7490',
                color: '#ffffff',
                border: 'none',
                borderRadius: '12px',
                padding: '9px 18px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              <Plus size={16} />
              <span>Add Document Type</span>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
            {configState.documentTypes.map(d => (
              <div key={d.id} style={{ border: '1px solid #E2E8F0', borderRadius: '14px', padding: '16px', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <span style={{ backgroundColor: d.mandatory ? '#FEE2E2' : '#F1F5F9', color: d.mandatory ? '#DC2626' : '#64748B', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.72rem' }}>
                    {d.mandatory ? 'MANDATORY' : 'OPTIONAL'}
                  </span>
                  <button onClick={() => handleDeleteDocType(d.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>{d.name}</h4>
                <p style={{ margin: '0 0 10px', fontSize: '0.78rem', color: '#64748B' }}>Code: <b>{d.code}</b> | Max: {d.maxSizeMb} MB</p>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {d.allowedFormats.map(fmt => (
                    <span key={fmt} style={{ backgroundColor: '#ffffff', border: '1px solid #CBD5E1', padding: '2px 6px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 600, color: '#475569' }}>
                      .{fmt.toLowerCase()}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: EMPLOYEE STATUSES */}
      {activeTab === 'statuses' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Employee Lifecycle Statuses</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px' }}>Standard operational states recognized in directory, attendance eligibility, and payroll</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
            {[
              { status: 'Active', color: '#166534', bg: '#DCFCE7', desc: 'Active confirmed payroll and biometric roster' },
              { status: 'Probation', color: '#854D0E', bg: '#FEF9C3', desc: 'Under review period prior to confirmation' },
              { status: 'Notice Period', color: '#9A3412', bg: '#FFEDD5', desc: 'Resignation accepted; FNF clearance scheduled' },
              { status: 'On Leave', color: '#1E40AF', bg: '#DBEAFE', desc: 'Approved sabbatical or maternity leave' },
              { status: 'Terminated', color: '#991B1B', bg: '#FEE2E2', desc: 'Offboarded; access revoked and FNF settled' }
            ].map(st => (
              <div key={st.status} style={{ border: '1px solid #E2E8F0', borderRadius: '12px', padding: '16px', backgroundColor: '#F8FAFC' }}>
                <span style={{ backgroundColor: st.bg, color: st.color, padding: '4px 10px', borderRadius: '9999px', fontWeight: 800, fontSize: '0.8rem', display: 'inline-block', marginBottom: '8px' }}>
                  {st.status}
                </span>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD CUSTOM FIELD */}
      {isFieldModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1E293B' }}>Add Custom Field</h3>
              <button onClick={() => setIsFieldModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveCustomField} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Field Display Label *</label>
                <input
                  type="text"
                  required
                  value={fieldForm.label}
                  onChange={e => setFieldForm({ ...fieldForm, label: e.target.value })}
                  placeholder="e.g. Safety Induction Date"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Field Type</label>
                <select
                  value={fieldForm.fieldType}
                  onChange={e => setFieldForm({ ...fieldForm, fieldType: e.target.value as any })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                >
                  <option value="text">Text Input</option>
                  <option value="number">Number</option>
                  <option value="date">Date Picker</option>
                  <option value="select">Dropdown Select</option>
                  <option value="boolean">Yes / No Toggle</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Profile Section</label>
                <select
                  value={fieldForm.category}
                  onChange={e => setFieldForm({ ...fieldForm, category: e.target.value as any })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                >
                  <option value="Personal">Personal Details</option>
                  <option value="Job">Job & Deployment</option>
                  <option value="Payroll">Payroll & Accounts</option>
                  <option value="Compliance">Statutory & Compliance</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="fReq"
                  checked={fieldForm.required}
                  onChange={e => setFieldForm({ ...fieldForm, required: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#0E7490' }}
                />
                <label htmlFor="fReq" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>Mandatory field</label>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsFieldModalOpen(false)} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#0E7490', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save Field</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD DOCUMENT TYPE */}
      {isDocModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1E293B' }}>Add Document Type</h3>
              <button onClick={() => setIsDocModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveDocType} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Document Name *</label>
                <input
                  type="text"
                  required
                  value={docForm.name}
                  onChange={e => setDocForm({ ...docForm, name: e.target.value })}
                  placeholder="e.g. Previous Relieving Letter"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Document Code *</label>
                <input
                  type="text"
                  required
                  value={docForm.code}
                  onChange={e => setDocForm({ ...docForm, code: e.target.value.toUpperCase() })}
                  placeholder="e.g. RELIEVING_DOC"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  id="docMand"
                  checked={docForm.mandatory}
                  onChange={e => setDocForm({ ...docForm, mandatory: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: '#0E7490' }}
                />
                <label htmlFor="docMand" style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1E293B', cursor: 'pointer' }}>Mandatory for employee completion</label>
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsDocModalOpen(false)} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#0E7490', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save Document Type</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default EmployeeConfigSettings;
