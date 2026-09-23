import React, { useState, useEffect } from 'react';
import { Employee } from '../../types/hrms';
import { OfferLetterTemplate } from '../../types/offerLetter';
import { INITIAL_OFFER_LETTER_TEMPLATES } from '../../data/offerLetterTemplates';
import { useHRMS } from '../../context/HRMSContext';
import { downloadElementAsPDF } from '../../utils/exportUtils';
import { formatCurrency } from '../../utils/numbers';
import { 
  X, 
  Download, 
  Copy, 
  Check, 
  FileText, 
  Edit3, 
  Eye, 
  Building2, 
  CheckCircle2, 
  User, 
  Plus, 
  Save, 
  Sparkles 
} from 'lucide-react';

interface OfferLetterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmployee?: Employee | null;
}

export const OfferLetterModal: React.FC<OfferLetterModalProps> = ({
  isOpen,
  onClose,
  initialEmployee
}) => {
  const { employees, updateEmployee, currentUser, businessSettings, companyInfo } = useHRMS();

  // Selected Employee
  const [selectedEmpId, setSelectedEmpId] = useState<string>(
    initialEmployee?.id || (employees.length > 0 ? employees[0].id : '')
  );

  // Template List (in-memory only; authoritative templates belong to the backend)
  const [templates, setTemplates] = useState<OfferLetterTemplate[]>(INITIAL_OFFER_LETTER_TEMPLATES);

  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(INITIAL_OFFER_LETTER_TEMPLATES[0].id);
  const [activeMode, setActiveMode] = useState<'preview' | 'edit' | 'create_template'>('preview');

  // Editable Letter Content
  const [customizedContent, setCustomizedContent] = useState<string>('');
  const [copiedToast, setCopiedToast] = useState(false);
  const [savedToProfileToast, setSavedToProfileToast] = useState(false);

  // New Template Form state
  const [newTemplateForm, setNewTemplateForm] = useState({
    name: '',
    category: 'Full-Time' as OfferLetterTemplate['category'],
    badgeColor: '#2563eb',
    description: '',
    subject: '',
    content: ''
  });

  // Sync selected employee when prop changes
  useEffect(() => {
    if (initialEmployee) {
      setSelectedEmpId(initialEmployee.id);
    }
  }, [initialEmployee]);

  const currentEmployee = employees.find(e => e.id === selectedEmpId) || initialEmployee || employees[0];
  const currentTemplate = templates.find(t => t.id === selectedTemplateId) || templates[0];

  // Calculate salary figures safely
  const basicPay = Number(currentEmployee?.basicSalary) || 50000;
  const hra = Number(currentEmployee?.allowances?.hra) || Math.round(basicPay * 0.4);
  const transport = Number(currentEmployee?.allowances?.transport) || 3000;
  const medical = Number(currentEmployee?.allowances?.medical) || 2500;
  const special = Number(currentEmployee?.allowances?.special) || 4500;
  const monthlyGross = basicPay + hra + transport + medical + special;
  const annualCtc = monthlyGross * 12;

  // Replace placeholders helper
  const replacePlaceholders = (text: string) => {
    if (!currentEmployee) return text;

    const todayStr = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const values: { [key: string]: string } = {
      '{{candidate_name}}': `${currentEmployee.firstName} ${currentEmployee.lastName}`,
      '{{employee_name}}': `${currentEmployee.firstName} ${currentEmployee.lastName}`,
      '{{employee_id}}': currentEmployee.employeeId,
      '{{designation}}': currentEmployee.designation,
      '{{department}}': currentEmployee.department,
      '{{joining_date}}': currentEmployee.joiningDate || todayStr,
      '{{employment_type}}': currentEmployee.employmentType || 'Full-Time',
      '{{reporting_manager}}': currentEmployee.reportingManagerName || 'Executive Leadership',
      '{{basic_salary}}': formatCurrency(basicPay),
      '{{monthly_gross}}': formatCurrency(monthlyGross),
      '{{annual_ctc}}': formatCurrency(annualCtc),
      '{{work_location}}': currentEmployee.bankDetails?.branch ? `${currentEmployee.bankDetails.branch} Office` : 'Head Office',
      '{{company_name}}': businessSettings?.businessName || companyInfo?.companyName || 'Businz',
      '{{issue_date}}': todayStr
    };

    let result = text;
    Object.entries(values).forEach(([k, v]) => {
      result = result.split(k).join(v);
    });
    return result;
  };

  // Update customized content whenever template or employee changes
  useEffect(() => {
    if (currentTemplate) {
      setCustomizedContent(replacePlaceholders(currentTemplate.content));
    }
  }, [selectedTemplateId, selectedEmpId]);

  if (!isOpen) return null;

  // Copy to clipboard
  const handleCopy = () => {
    navigator.clipboard.writeText(customizedContent);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  // Save/Attach to Employee Profile Documents
  const handleAttachToProfile = () => {
    if (!currentEmployee) return;
    const docName = `Offer_Letter_${currentEmployee.firstName}_${currentEmployee.employeeId}.pdf`;
    const today = new Date().toISOString().split('T')[0];

    const currentDocs = currentEmployee.documents || [];
    const exists = currentDocs.some(d => d.name === docName);
    const updatedDocs = exists 
      ? currentDocs.map(d => d.name === docName ? { ...d, uploadDate: today } : d)
      : [...currentDocs, { name: docName, type: 'PDF', url: '#', uploadDate: today }];

    updateEmployee(currentEmployee.id, { documents: updatedDocs });
    setSavedToProfileToast(true);
    setTimeout(() => setSavedToProfileToast(false), 2500);
  };

  // Download PDF Document
  const handleDownloadPDF = () => {
    downloadElementAsPDF(
      'printable-offer-letter', 
      `Offer_Letter_${currentEmployee?.firstName || 'Employee'}_${currentEmployee?.employeeId || ''}`,
      'VRM Structures Pvt. Ltd.'
    );
  };

  // Download text file
  const handleDownloadTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([customizedContent], { type: 'text/plain;charset=utf-8' });
    element.href = URL.createObjectURL(file);
    element.download = `Offer_Letter_${currentEmployee?.firstName || 'Employee'}_${currentEmployee?.employeeId || 'ID'}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Create Custom Template
  const handleSaveNewTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateForm.name || !newTemplateForm.content) return;

    const newTpl: OfferLetterTemplate = {
      id: `TPL-CUSTOM-${Date.now()}`,
      name: newTemplateForm.name,
      category: newTemplateForm.category,
      badgeColor: newTemplateForm.badgeColor,
      description: newTemplateForm.description || 'Custom corporate employment offer template.',
      subject: newTemplateForm.subject || `Offer of Employment — {{designation}}`,
      content: newTemplateForm.content
    };

    const updated = [...templates, newTpl];
    setTemplates(updated);
    setSelectedTemplateId(newTpl.id);
    setActiveMode('preview');
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 110 }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '920px', 
          width: '95%',
          maxHeight: '92vh',
          backgroundColor: '#ffffff', 
          borderRadius: '16px', 
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* MODAL HEADER */}
        <div className="modal-header" style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#ecfeff', color: '#0891b2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Corporate Offer Letter Generator
              </h2>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: 0 }}>
                Generate, customize, and issue formal employment offer letters with dynamic candidate data
              </p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
            <X size={20} />
          </button>
        </div>

        {/* TOP CONFIGURATION STRIP */}
        <div style={{ backgroundColor: '#f8fafc', padding: '14px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center' }}>
          
          {/* Employee Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: '280px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <User size={15} color="#0891b2" /> Candidate:
            </span>
            <select
              className="form-control"
              value={selectedEmpId}
              onChange={(e) => setSelectedEmpId(e.target.value)}
              style={{ fontSize: '0.84rem', padding: '6px 12px', borderRadius: '8px', minWidth: '240px', borderColor: '#cbd5e1' }}
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} ({emp.employeeId}) &mdash; {emp.designation}
                </option>
              ))}
            </select>
          </div>

          {/* Mode Tabs */}
          <div style={{ display: 'flex', gap: '6px', backgroundColor: '#e2e8f0', padding: '3px', borderRadius: '8px' }}>
            <button
              type="button"
              onClick={() => setActiveMode('preview')}
              style={{
                border: 'none',
                background: activeMode === 'preview' ? '#ffffff' : 'transparent',
                color: activeMode === 'preview' ? '#0891b2' : '#64748b',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeMode === 'preview' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Eye size={14} color={activeMode === 'preview' ? '#155DFC' : 'currentColor'} /> Preview Document
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('edit')}
              style={{
                border: 'none',
                background: activeMode === 'edit' ? '#ffffff' : 'transparent',
                color: activeMode === 'edit' ? '#155DFC' : '#64748b',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeMode === 'edit' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Edit3 size={14} color={activeMode === 'edit' ? '#155DFC' : 'currentColor'} /> Edit Clauses
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('create_template')}
              style={{
                border: 'none',
                background: activeMode === 'create_template' ? '#ffffff' : 'transparent',
                color: activeMode === 'create_template' ? '#155DFC' : '#64748b',
                padding: '6px 14px',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: activeMode === 'create_template' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
              }}
            >
              <Plus size={14} color={activeMode === 'create_template' ? '#155DFC' : 'currentColor'} /> New Template
            </button>
          </div>

        </div>

        {/* TEMPLATE PICKER STRIP */}
        {activeMode !== 'create_template' && (
          <div style={{ backgroundColor: '#ffffff', padding: '10px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap', flexShrink: 0 }}>
              Templates ({templates.length}):
            </span>
            <div 
              className="hide-scrollbar" 
              style={{ 
                display: 'flex', 
                gap: '8px', 
                overflowX: 'auto', 
                flex: 1, 
                padding: '4px 2px',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none'
              }}
            >
              {templates.map(tpl => {
                const isSelected = tpl.id === selectedTemplateId;
                return (
                  <button
                    key={tpl.id}
                    onClick={() => setSelectedTemplateId(tpl.id)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: '8px',
                      border: isSelected ? '1.5px solid #155DFC' : '1px solid #e2e8f0',
                      backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                      color: isSelected ? '#155DFC' : '#475569',
                      fontSize: '0.8rem',
                      fontWeight: isSelected ? 700 : 500,
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: isSelected ? '0 1px 4px rgba(21, 93, 252, 0.25)' : 'none',
                      transition: 'all 0.15s ease',
                      flexShrink: 0
                    }}
                  >
                    <span style={{ width: '8px', height: '8px', borderRadius: '99px', backgroundColor: isSelected ? '#155DFC' : tpl.badgeColor }} />
                    {tpl.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* MODAL BODY */}
        <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1, backgroundColor: '#f1f5f9' }}>
          
          {/* MODE 1: DOCUMENT PREVIEW */}
          {activeMode === 'preview' && (
            <div 
              id="printable-offer-letter"
              style={{ 
                backgroundColor: '#ffffff', 
                borderRadius: '8px', 
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)', 
                padding: '40px 48px', 
                maxWidth: '780px', 
                margin: '0 auto',
                fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
                color: '#1e293b',
                lineHeight: 1.65,
                border: '1px solid #e2e8f0'
              }}
            >
              {/* Corporate Letterhead Header */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                borderBottom: '2.5px solid #155DFC', 
                paddingBottom: '18px', 
                marginBottom: '22px', 
                gap: '16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 auto' }}>
                  <img 
                    src="/logo.png" 
                    alt={`${businessSettings?.businessName || companyInfo?.companyName || 'Businz'} Logo`} 
                    style={{ height: '48px', maxWidth: '200px', objectFit: 'contain', flexShrink: 0 }} 
                  />
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.72rem', color: '#64748b', lineHeight: 1.5, flexShrink: 0 }}>
                  <div><strong style={{ color: '#334155' }}>CIN:</strong> {businessSettings?.cin || companyInfo?.cinNumber || 'U72900TN2022PTC150000'}</div>
                  <div>{businessSettings?.address || 'Businz Corporate Park, Tech Corridor, Chennai, TN — 600096'}</div>
                  <div>{businessSettings?.email || companyInfo?.officialEmail || 'careers@businz.com'} &bull; {companyInfo?.website || 'www.businz.com'}</div>
                </div>
              </div>

              {/* Letter Metadata */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.82rem', marginBottom: '20px', color: '#475569' }}>
                <div>
                  <div><strong style={{ color: '#0f172a' }}>Ref No:</strong> BSZ-HR-OL-2026-{currentEmployee?.employeeId || 'EMP-001'}</div>
                  <div><strong style={{ color: '#0f172a' }}>Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ backgroundColor: '#eff6ff', color: '#155DFC', padding: '4px 12px', borderRadius: '6px', fontWeight: 700, fontSize: '0.74rem', border: '1px solid #bfdbfe', letterSpacing: '0.03em' }}>
                    OFFICIAL APPOINTMENT
                  </span>
                </div>
              </div>

              {/* Candidate Addressing */}
              <div style={{ 
                marginBottom: '22px', 
                padding: '14px 18px', 
                backgroundColor: '#f8fafc', 
                borderRadius: '8px', 
                border: '1px solid #e2e8f0', 
                borderLeft: '4px solid #155DFC' 
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                  Addressed To:
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0f172a', marginBottom: '6px' }}>
                  {currentEmployee?.firstName} {currentEmployee?.lastName}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 16px', fontSize: '0.82rem', color: '#475569' }}>
                  <div><strong style={{ color: '#334155' }}>Employee ID:</strong> {currentEmployee?.employeeId}</div>
                  <div><strong style={{ color: '#334155' }}>Designation:</strong> {currentEmployee?.designation}</div>
                  <div><strong style={{ color: '#334155' }}>Email:</strong> {currentEmployee?.email}</div>
                  <div><strong style={{ color: '#334155' }}>Contact:</strong> {currentEmployee?.phone || '+91 98765 43210'}</div>
                  <div style={{ gridColumn: 'span 2' }}><strong style={{ color: '#334155' }}>Residential Address:</strong> {currentEmployee?.address || 'Salt Lake Sector V, Kolkata, West Bengal'}</div>
                </div>
              </div>

              {/* Subject */}
              <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#0f172a', marginBottom: '18px' }}>
                <span style={{ borderBottom: '2px solid #0f172a', paddingBottom: '2px' }}>
                  Subject: {replacePlaceholders(currentTemplate.subject)}
                </span>
              </div>

              {/* Letter Body */}
              <div style={{ fontSize: '0.86rem', whiteSpace: 'pre-line', color: '#334155', marginBottom: '26px' }}>
                {customizedContent}
              </div>

              {/* SALARY & COMPENSATION ANNEXURE */}
              <div style={{ marginTop: '28px', marginBottom: '28px', pageBreakInside: 'avoid' }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0f172a', textTransform: 'uppercase', marginBottom: '8px' }}>
                  Annexure A: Compensation & Benefits Structure
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', border: '1px solid #cbd5e1' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 700 }}>Salary Component</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Monthly (INR)</th>
                      <th style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>Annualized (INR)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px' }}>Basic Salary</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right' }}>{formatCurrency(basicPay)}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right' }}>{formatCurrency(basicPay * 12)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px' }}>House Rent Allowance (HRA)</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right' }}>{formatCurrency(hra)}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right' }}>{formatCurrency(hra * 12)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px' }}>Transport Allowance</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right' }}>{formatCurrency(transport)}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right' }}>{formatCurrency(transport * 12)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '7px 12px' }}>Medical Reimbursement</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right' }}>{formatCurrency(medical)}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right' }}>{formatCurrency(medical * 12)}</td>
                    </tr>
                    <tr style={{ borderBottom: '1px solid #cbd5e1' }}>
                      <td style={{ padding: '7px 12px' }}>Special Corporate Allowance</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right' }}>{formatCurrency(special)}</td>
                      <td style={{ padding: '7px 12px', textAlign: 'right' }}>{formatCurrency(special * 12)}</td>
                    </tr>
                    <tr style={{ backgroundColor: '#f0fdf4', fontWeight: 800, color: '#15803d', borderTop: '2px solid #bbf7d0' }}>
                      <td style={{ padding: '9px 12px' }}>Total Cost to Company (CTC)</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right' }}>{formatCurrency(monthlyGross)}</td>
                      <td style={{ padding: '9px 12px', textAlign: 'right' }}>{formatCurrency(annualCtc)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Signature Blocks */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '40px', paddingTop: '20px', borderTop: '1px solid #e2e8f0', pageBreakInside: 'avoid' }}>
                <div>
                  <div style={{ height: '45px', display: 'flex', alignItems: 'flex-end' }}>
                    <div style={{ fontFamily: 'cursive', fontSize: '1.2rem', color: '#0f172a', transform: 'rotate(-3deg)' }}>
                      {currentUser?.name || 'HR Manager'}
                    </div>
                  </div>
                  <div style={{ borderTop: '1px solid #475569', paddingTop: '6px', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>{currentUser?.name || 'Authorized Signatory'}</div>
                    <div style={{ color: '#64748b' }}>HR Manager</div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem' }}>{businessSettings?.businessName || companyInfo?.companyName || 'Businz Technologies Pvt. Ltd.'}</div>
                  </div>
                </div>

                <div>
                  <div style={{ height: '45px' }}></div>
                  <div style={{ borderTop: '1px dashed #94a3b8', paddingTop: '6px', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 800, color: '#0f172a' }}>Candidate Acceptance Signature</div>
                    <div style={{ color: '#64748b' }}>Name: {currentEmployee?.firstName} {currentEmployee?.lastName}</div>
                    <div style={{ color: '#64748b', fontSize: '0.72rem' }}>Date: ________________________</div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* MODE 2: EDIT CLAUSES / TEXT */}
          {activeMode === 'edit' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '20px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>
                  Customize Offer Letter Clauses
                </h3>
                <span style={{ fontSize: '0.78rem', color: '#64748b' }}>
                  Edit the text directly. Dynamic variables are already prefilled.
                </span>
              </div>

              <textarea
                rows={18}
                className="form-control"
                value={customizedContent}
                onChange={(e) => setCustomizedContent(e.target.value)}
                style={{
                  fontFamily: "'Courier New', Courier, monospace",
                  fontSize: '0.86rem',
                  lineHeight: 1.6,
                  padding: '16px',
                  borderRadius: '8px'
                }}
              />

              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCustomizedContent(replacePlaceholders(currentTemplate.content))}
                >
                  Reset to Original Template
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setActiveMode('preview')}
                >
                  <Eye size={14} /> Preview Changes
                </button>
              </div>
            </div>
          )}

          {/* MODE 3: CREATE NEW TEMPLATE */}
          {activeMode === 'create_template' && (
            <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>
                Create New Offer Letter Template
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '20px' }}>
                Build a reusable corporate offer template. You can use placeholders such as <code>{'{{candidate_name}}'}</code>, <code>{'{{designation}}'}</code>, <code>{'{{annual_ctc}}'}</code>, etc.
              </p>

              <form onSubmit={handleSaveNewTemplate} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                      Template Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Data Scientist Offer"
                      className="form-control"
                      value={newTemplateForm.name}
                      onChange={(e) => setNewTemplateForm(s => ({ ...s, name: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                      Category / Department *
                    </label>
                    <select
                      className="form-control"
                      value={newTemplateForm.category}
                      onChange={(e) => setNewTemplateForm(s => ({ ...s, category: e.target.value as any }))}
                    >
                      <option value="Full-Time">Full-Time Corporate</option>
                      <option value="Engineering">Engineering & Technology</option>
                      <option value="Executive">Executive Leadership</option>
                      <option value="Internship">Internship & Graduate</option>
                      <option value="Remote">Remote & Hybrid</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                    Letter Subject Line *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Offer of Employment: {{designation}} at {{company_name}}"
                    className="form-control"
                    value={newTemplateForm.subject}
                    onChange={(e) => setNewTemplateForm(s => ({ ...s, subject: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: '6px', display: 'block' }}>
                    Template Body Content *
                  </label>
                  <textarea
                    rows={12}
                    required
                    placeholder="Dear {{candidate_name}},&#10;&#10;We are pleased to offer you the position of {{designation}}..."
                    className="form-control"
                    value={newTemplateForm.content}
                    onChange={(e) => setNewTemplateForm(s => ({ ...s, content: e.target.value }))}
                    style={{ fontFamily: "'Courier New', Courier, monospace", fontSize: '0.84rem' }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => setActiveMode('preview')}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm" style={{ background: 'linear-gradient(135deg, #155DFC, #1d4ed8)', color: '#ffffff', fontWeight: 700, boxShadow: '0 4px 12px rgba(21, 93, 252, 0.35)' }}>
                    <Save size={14} /> Save Template
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>

        {/* MODAL FOOTER WITH ACTION BUTTONS */}
        <div className="modal-footer" style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {copiedToast && (
              <span style={{ fontSize: '0.8rem', color: '#0891b2', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={16} /> Copied to clipboard!
              </span>
            )}
            {savedToProfileToast && (
              <span style={{ fontSize: '0.8rem', color: '#0891b2', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <CheckCircle2 size={16} /> Attached to {currentEmployee?.firstName}'s Profile!
              </span>
            )}
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              onClick={handleCopy}
              title="Copy Letter Text"
            >
              <Copy size={15} /> Copy Text
            </button>

            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              onClick={handleDownloadTxt}
              title="Download Letter as Text"
            >
              <Download size={15} /> Download (.txt)
            </button>

            <button 
              type="button" 
              className="btn btn-secondary btn-sm" 
              onClick={handleAttachToProfile}
              title="Save directly into Employee Profile Documents"
              style={{ backgroundColor: '#ecfeff', color: '#0891b2', borderColor: '#a5f3fc', fontWeight: 700 }}
            >
              <Save size={15} /> Save to Profile
            </button>

            <button 
              type="button" 
              className="btn btn-primary btn-sm" 
              onClick={handleDownloadPDF}
              style={{ background: 'linear-gradient(135deg, #0E7490, #0891B2)', color: '#ffffff', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', boxShadow: '0 4px 12px rgba(14, 116, 144, 0.35)', border: 'none' }}
            >
              <Download size={15} /> Download PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
