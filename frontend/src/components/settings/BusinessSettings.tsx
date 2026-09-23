import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Phone, 
  Mail, 
  FileText, 
  Clock, 
  CheckCircle2, 
  Save, 
  Upload, 
  ChevronRight,
  Image as ImageIcon,
  Tag,
  Briefcase,
  Receipt,
  UserCheck,
  IndianRupee,
  BookOpen,
  Send,
  Landmark,
  Repeat,
  ShieldCheck,
  X,
  Plus,
  ExternalLink,
  Edit3,
  Building
} from 'lucide-react';

export const BusinessSettings: React.FC = () => {
  const { 
    setActiveModule, 
    currentUser,
    businessSettings,
    updateBusinessSettings,
    policyDocuments,
    addPolicyDocument,
    updatePolicyDocument,
    deletePolicyDocument
  } = useHRMS();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Business Data derived dynamically from HRMSContext businessSettings
  const businessData = {
    ...businessSettings,
    logoStatus: businessSettings.logoStatus || 'Added',
    policyDocumentsCount: policyDocuments.length,
    availableEntities: [
      { id: '1', name: 'Businz HQ', code: 'BSZ001', isCurrent: businessSettings.activeEntity === 'Businz HQ' || !businessSettings.activeEntity || businessSettings.activeEntity === 'VRM Structures (Madhavaram HQ)' },
      { id: '2', name: 'Regional Office (North)', code: 'BSZ002', isCurrent: businessSettings.activeEntity === 'Regional Office (North)' },
      { id: '3', name: 'Operations Center (South)', code: 'BSZ003', isCurrent: businessSettings.activeEntity === 'Operations Center (South)' }
    ],
    policies: policyDocuments
  };

  // State for adding / editing Policy Documents
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docFormData, setDocFormData] = useState({
    title: '',
    category: 'Corporate Governance',
    version: 'v1.0',
    description: '',
    status: 'Active' as 'Active' | 'Archived'
  });

  // Active Modal for editing specific card
  type ModalType = 
    | null 
    | 'logo' 
    | 'businessName' 
    | 'email' 
    | 'address' 
    | 'employeeCode' 
    | 'currency' 
    | 'policyDocument' 
    | 'emailConfig' 
    | 'category' 
    | 'phone' 
    | 'type' 
    | 'gstin' 
    | 'administrator' 
    | 'timeZone' 
    | 'bankDetails' 
    | 'switchBusiness'
    | 'editAll';

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [modalFormData, setModalFormData] = useState<any>({});

  const openModal = (type: ModalType) => {
    setActiveModal(type);
    setModalFormData({ ...businessSettings, ...businessData });
    setIsAddingDoc(false);
    setEditingDocId(null);
  };

  const closeModal = () => {
    setActiveModal(null);
    setIsAddingDoc(false);
    setEditingDocId(null);
  };

  const handleModalSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeModal !== 'policyDocument') {
      updateBusinessSettings(modalFormData);
    }
    setActiveModal(null);
    setToastMessage('Business Settings updated successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0 auto', fontFamily: 'var(--font-primary)', paddingBottom: '60px', boxSizing: 'border-box' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          backgroundColor: '#eff6ff',
          border: '1px solid #bfdbfe',
          color: '#1e40af',
          padding: '12px 20px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.12)',
          fontWeight: 700,
          zIndex: 1300,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} color="#0E7490" /> {toastMessage}
        </div>
      )}


      {/* 2. SUBTITLE (MATCHING USER SCREENSHOT) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h2 style={{ 
            fontSize: '1.45rem', 
            fontWeight: 800, 
            color: '#0f172a', 
            margin: '0 0 4px 0',
            letterSpacing: '-0.02em'
          }}>
            Business Settings
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
            Change Your Profile and Business Settings
          </p>
        </div>

        <button
          onClick={() => openModal('editAll')}
          style={{
            backgroundColor: '#0E7490',
            color: '#ffffff',
            padding: '10px 18px',
            borderRadius: '12px',
            border: 'none',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(14, 116, 144, 0.25)',
            transition: 'all 0.15s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0891B2')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0E7490')}
        >
          <Edit3 size={16} /> Edit All Business Details
        </button>
      </div>

      {/* 3. TWO-COLUMN GRID OF THE 16 SETTINGS TILES (USING VRM PREMIUM SAAS UI) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '14px',
        width: '100%',
        boxSizing: 'border-box'
      }}>

        {/* -------------------- ROW 1 -------------------- */}
        {/* Left 1: Logo */}
        <div 
          onClick={() => openModal('logo')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#ECFEFF', '#0E7490')}>
            <ImageIcon size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>Logo</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <img src={businessData.logoUrl} alt="Logo" style={{ height: '22px', maxWidth: '80px', objectFit: 'contain', flexShrink: 0 }} />
              <span style={pillStyle('#DCFCE7', '#166534')}>{businessData.logoStatus}</span>
            </div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

        {/* Right 1: Category */}
        <div 
          onClick={() => openModal('category')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#FEF3C7', '#D97706')}>
            <Tag size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>Category</div>
            <div style={valueStyle} title={businessData.category}>{businessData.category}</div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

        {/* -------------------- ROW 2 -------------------- */}
        {/* Left 2: Business Name (FHAA0072 / VRM001) */}
        <div 
          onClick={() => openModal('businessName')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#ECFEFF', '#0E7490')}>
            <Building2 size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>Software / Business Name ({businessData.businessCode})</div>
            <div style={valueStyle} title={businessData.businessName}>{businessData.businessName}</div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

        {/* Right 2: Phone Number */}
        <div 
          onClick={() => openModal('phone')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#EFF6FF', '#2563EB')}>
            <Phone size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>Phone Number</div>
            <div style={valueStyle} title={businessData.phone}>{businessData.phone}</div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

        {/* -------------------- ROW 3 -------------------- */}
        {/* Left 3: Email Address */}
        <div 
          onClick={() => openModal('email')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#EFF6FF', '#2563EB')}>
            <Mail size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>Email Address</div>
            <div style={valueStyle} title={businessData.email}>{businessData.email}</div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

        {/* Right 3: Type */}
        <div 
          onClick={() => openModal('type')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#F1F5F9', '#475569')}>
            <Briefcase size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>Type</div>
            <div style={valueStyle} title={businessData.type}>{businessData.type}</div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

        {/* -------------------- ROW 4 -------------------- */}
        {/* Left 4: Business Address 🚩 */}
        <div 
          onClick={() => openModal('address')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#FEF3C7', '#D97706')}>
            <MapPin size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>
              Business Address <span style={{ fontSize: '0.85rem' }}>🚩</span>
            </div>
            <div style={valueStyle} title={businessData.address}>
              {businessData.address}
            </div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

        {/* Right 4: GSTIN */}
        <div 
          onClick={() => openModal('gstin')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#F0FDF4', '#16A34A')}>
            <Receipt size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>GSTIN</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{ ...valueStyle, letterSpacing: '0.04em' }}>
                {businessData.gstin}
              </span>
              <span style={pillStyle('#DCFCE7', '#166534')}>Verified</span>
            </div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

        {/* -------------------- ROW 5 -------------------- */}
        {/* Left 5: Employee Code */}
        <div 
          onClick={() => openModal('employeeCode')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#ECFEFF', '#0E7490')}>
            <UserCheck size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>Employee Code</div>
            <div style={valueStyle}>
              {businessData.employeeCodeGeneration} ({businessData.employeeCodeSample})
            </div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

        {/* Right 5: Administrator */}
        <div 
          onClick={() => openModal('administrator')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#EFF6FF', '#2563EB')}>
            <ShieldCheck size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>Administrator</div>
            <div style={valueStyle} title={businessData.administrator}>{businessData.administrator}</div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

        {/* -------------------- ROW 6 -------------------- */}
        {/* Left 6: Currency */}
        <div 
          onClick={() => openModal('currency')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#F0FDF4', '#16A34A')}>
            <IndianRupee size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>Currency</div>
            <div style={valueStyle}>{businessData.currency}</div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

        {/* Right 6: Time Zone */}
        <div 
          onClick={() => openModal('timeZone')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#FEF3C7', '#D97706')}>
            <Clock size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>Time Zone</div>
            <div style={valueStyle} title={businessData.timeZone}>{businessData.timeZone}</div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

        {/* -------------------- ROW 7 -------------------- */}
        {/* Left 7: Policy Document */}
        <div 
          onClick={() => openModal('policyDocument')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#FDF2F8', '#DB2777')}>
            <BookOpen size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>Policy Document</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{ ...valueStyle, width: 'auto' }}>
                Business Policy ({businessData.policyDocumentsCount})
              </span>
              <span style={pillStyle('#FDF2F8', '#BE185D')}>Active</span>
            </div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

        {/* Right 7: Bank Details */}
        <div 
          onClick={() => openModal('bankDetails')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#ECFEFF', '#0E7490')}>
            <Landmark size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>Bank Details</div>
            <div style={valueStyle} title={`${businessData.bankName} • A/C: ${businessData.bankAccountNo.slice(-4)}`}>
              {businessData.bankName} • A/C: {businessData.bankAccountNo.slice(-4)}
            </div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

        {/* -------------------- ROW 8 -------------------- */}
        {/* Left 8: Email Configuration */}
        <div 
          onClick={() => openModal('emailConfig')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#EFF6FF', '#2563EB')}>
            <Send size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>Email Configuration</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{ ...valueStyle, width: 'auto' }} title={businessData.emailConfig}>
                {businessData.emailConfig}
              </span>
              <span style={pillStyle('#DCFCE7', '#166534')}>Active</span>
            </div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

        {/* Right 8: Switch Business */}
        <div 
          onClick={() => openModal('switchBusiness')}
          className="business-setting-card"
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#EDE9FE', '#7C3AED')}>
            <Repeat size={20} />
          </div>
          <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
            <div style={labelStyle}>Switch Business</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
              <span style={{ ...valueStyle, width: 'auto' }} title={businessData.activeEntity}>
                {businessData.activeEntity}
              </span>
              <span style={pillStyle('#EDE9FE', '#6D28D9')}>
                {businessData.availableEntities.length} Entities
              </span>
            </div>
          </div>
          <ChevronRight size={18} color="#94a3b8" style={{ flexShrink: 0, marginLeft: 'auto' }} />
        </div>

      </div>

      {/* 4. INTERACTIVE MODALS FOR UPDATING ANY SETTING ITEM */}
      {activeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.55)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1400,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '20px',
            maxWidth: activeModal === 'policyDocument' || activeModal === 'switchBusiness' || activeModal === 'editAll' ? '680px' : '520px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '28px',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            border: '1px solid #e2e8f0',
            position: 'relative'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ECFEFF', color: '#0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Building2 size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {activeModal === 'logo' && 'Update Business Logo'}
                    {activeModal === 'category' && 'Industry & Business Category'}
                    {activeModal === 'businessName' && 'Business Name & Entity Code'}
                    {activeModal === 'phone' && 'Official Contact Number'}
                    {activeModal === 'email' && 'Primary Corporate Email'}
                    {activeModal === 'type' && 'Business Registration Type'}
                    {activeModal === 'address' && 'Registered Business Address'}
                    {activeModal === 'gstin' && 'GSTIN & Statutory Tax Numbers'}
                    {activeModal === 'employeeCode' && 'Employee Code Generation'}
                    {activeModal === 'administrator' && 'System Administrator'}
                    {activeModal === 'currency' && 'Operating Currency'}
                    {activeModal === 'timeZone' && 'Standard Time Zone'}
                    {activeModal === 'policyDocument' && 'Business Policy Documents'}
                    {activeModal === 'bankDetails' && 'Corporate Bank Account'}
                    {activeModal === 'emailConfig' && 'SMTP Email Server Configuration'}
                    {activeModal === 'switchBusiness' && 'Switch Business Entity / Branch'}
                    {activeModal === 'editAll' && 'Edit All Business Settings'}
                  </h3>
                  <p style={{ fontSize: '0.8rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    Configure corporate parameters for Businz Enterprise HRM
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body Based on activeModal */}
            <form onSubmit={handleModalSave}>
              {/* Logo Modal */}
              {activeModal === 'logo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                    <img src={modalFormData.logoUrl} alt="Preview" style={{ height: '48px', maxWidth: '140px', objectFit: 'contain', backgroundColor: '#ffffff', padding: '6px', borderRadius: '8px', border: '1px solid #cbd5e1' }} />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>Active Corporate Logo</div>
                      <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Used in payslips, invoices, header, and official documents</div>
                    </div>
                  </div>
                  <div>
                    <label style={modalLabelStyle}>Logo Image URL / File Path</label>
                    <input
                      type="text"
                      value={modalFormData.logoUrl}
                      onChange={(e) => setModalFormData({ ...modalFormData, logoUrl: e.target.value })}
                      style={modalInputStyle}
                    />
                  </div>
                </div>
              )}

              {/* Category Modal */}
              {activeModal === 'category' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={modalLabelStyle}>Industry / Category</label>
                    <input
                      type="text"
                      value={modalFormData.category}
                      onChange={(e) => setModalFormData({ ...modalFormData, category: e.target.value })}
                      style={modalInputStyle}
                    />
                  </div>
                </div>
              )}

              {/* Business Name Modal */}
              {activeModal === 'businessName' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={modalLabelStyle}>Software / Business Name</label>
                    <input
                      type="text"
                      value={modalFormData.businessName}
                      onChange={(e) => setModalFormData({ ...modalFormData, businessName: e.target.value })}
                      style={modalInputStyle}
                    />
                  </div>
                  <div>
                    <label style={modalLabelStyle}>Business Unit Code</label>
                    <input
                      type="text"
                      value={modalFormData.businessCode}
                      onChange={(e) => setModalFormData({ ...modalFormData, businessCode: e.target.value })}
                      style={modalInputStyle}
                    />
                  </div>
                </div>
              )}

              {/* Phone Modal */}
              {activeModal === 'phone' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={modalLabelStyle}>Official Phone Number</label>
                    <input
                      type="text"
                      value={modalFormData.phone}
                      onChange={(e) => setModalFormData({ ...modalFormData, phone: e.target.value })}
                      style={modalInputStyle}
                    />
                  </div>
                </div>
              )}

              {/* Email Modal */}
              {activeModal === 'email' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={modalLabelStyle}>Official Contact Email</label>
                    <input
                      type="email"
                      value={modalFormData.email}
                      onChange={(e) => setModalFormData({ ...modalFormData, email: e.target.value })}
                      style={modalInputStyle}
                    />
                  </div>
                </div>
              )}

              {/* Type Modal */}
              {activeModal === 'type' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={modalLabelStyle}>Business Entity Legal Type</label>
                    <select
                      value={modalFormData.type}
                      onChange={(e) => setModalFormData({ ...modalFormData, type: e.target.value })}
                      style={modalInputStyle}
                    >
                      <option value="Private Limited Company">Private Limited Company</option>
                      <option value="Public Limited Company">Public Limited Company</option>
                      <option value="Partnership">Partnership</option>
                      <option value="Sole Proprietorship">Sole Proprietorship</option>
                      <option value="Limited Liability Partnership (LLP)">Limited Liability Partnership (LLP)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Address Modal */}
              {activeModal === 'address' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={modalLabelStyle}>Complete Registered Address (with Flag 🚩)</label>
                    <textarea
                      rows={4}
                      value={modalFormData.address}
                      onChange={(e) => setModalFormData({ ...modalFormData, address: e.target.value })}
                      style={{ ...modalInputStyle, resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {/* GSTIN Modal */}
              {activeModal === 'gstin' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={modalLabelStyle}>GSTIN Number (15 Digits)</label>
                    <input
                      type="text"
                      value={modalFormData.gstin}
                      onChange={(e) => setModalFormData({ ...modalFormData, gstin: e.target.value })}
                      style={{ ...modalInputStyle, fontWeight: 700, letterSpacing: '0.04em' }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={modalLabelStyle}>PAN Number</label>
                      <input
                        type="text"
                        value={modalFormData.pan}
                        onChange={(e) => setModalFormData({ ...modalFormData, pan: e.target.value })}
                        style={modalInputStyle}
                      />
                    </div>
                    <div>
                      <label style={modalLabelStyle}>CIN Number</label>
                      <input
                        type="text"
                        value={modalFormData.cin}
                        onChange={(e) => setModalFormData({ ...modalFormData, cin: e.target.value })}
                        style={modalInputStyle}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Employee Code Modal */}
              {activeModal === 'employeeCode' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={modalLabelStyle}>Employee Code Generation Mode</label>
                    <select
                      value={modalFormData.employeeCodeGeneration}
                      onChange={(e) => setModalFormData({ ...modalFormData, employeeCodeGeneration: e.target.value })}
                      style={modalInputStyle}
                    >
                      <option value="Auto">Auto Generated (System Sequence)</option>
                      <option value="Manual">Manual Input on Onboarding</option>
                    </select>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={modalLabelStyle}>Code Prefix</label>
                      <input
                        type="text"
                        value={modalFormData.employeeCodePrefix}
                        onChange={(e) => setModalFormData({ ...modalFormData, employeeCodePrefix: e.target.value, employeeCodeSample: `${e.target.value}001` })}
                        style={modalInputStyle}
                      />
                    </div>
                    <div>
                      <label style={modalLabelStyle}>Sample Format</label>
                      <input
                        type="text"
                        disabled
                        value={modalFormData.employeeCodeSample}
                        style={{ ...modalInputStyle, backgroundColor: '#f8fafc', fontWeight: 700 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Administrator Modal */}
              {activeModal === 'administrator' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={modalLabelStyle}>Designated System Administrator</label>
                    <input
                      type="text"
                      value={modalFormData.administrator}
                      onChange={(e) => setModalFormData({ ...modalFormData, administrator: e.target.value })}
                      style={modalInputStyle}
                    />
                  </div>
                </div>
              )}

              {/* Currency Modal */}
              {activeModal === 'currency' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={modalLabelStyle}>Operating Currency</label>
                    <select
                      value={modalFormData.currency}
                      onChange={(e) => setModalFormData({ ...modalFormData, currency: e.target.value })}
                      style={modalInputStyle}
                    >
                      <option value="INR - ₹ (India)">INR - ₹ (India)</option>
                      <option value="USD - $ (United States)">USD - $ (United States)</option>
                      <option value="EUR - € (Eurozone)">EUR - € (Eurozone)</option>
                      <option value="AED - د.إ (UAE)">AED - د.إ (UAE)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Time Zone Modal */}
              {activeModal === 'timeZone' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={modalLabelStyle}>Standard System Time Zone</label>
                    <select
                      value={modalFormData.timeZone}
                      onChange={(e) => setModalFormData({ ...modalFormData, timeZone: e.target.value })}
                      style={modalInputStyle}
                    >
                      <option value="Indian Standard Time (IST) (UTC+05:30)">Indian Standard Time (IST) (UTC+05:30)</option>
                      <option value="Gulf Standard Time (GST) (UTC+04:00)">Gulf Standard Time (GST) (UTC+04:00)</option>
                      <option value="Singapore Time (SGT) (UTC+08:00)">Singapore Time (SGT) (UTC+08:00)</option>
                      <option value="UTC (Coordinated Universal Time)">UTC (Coordinated Universal Time)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Policy Document Modal */}
              {activeModal === 'policyDocument' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>
                      Corporate Policies ({policyDocuments.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (isAddingDoc) {
                          setIsAddingDoc(false);
                          setEditingDocId(null);
                        } else {
                          setIsAddingDoc(true);
                          setEditingDocId(null);
                          setDocFormData({
                            title: '',
                            category: 'Corporate Governance',
                            version: `v${policyDocuments.length + 1}.0`,
                            description: '',
                            status: 'Active'
                          });
                        }
                      }}
                      style={{
                        fontSize: '0.78rem',
                        color: '#0E7490',
                        fontWeight: 700,
                        background: '#ECFEFF',
                        border: '1px solid #A5F3FC',
                        borderRadius: '8px',
                        padding: '6px 12px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      {isAddingDoc ? <X size={14} /> : <Plus size={14} />}
                      {isAddingDoc ? 'Close Form' : 'Upload / Add Policy Document'}
                    </button>
                  </div>

                  {/* Add / Edit Form */}
                  {isAddingDoc && (
                    <div style={{
                      backgroundColor: '#f8fafc',
                      padding: '16px',
                      borderRadius: '12px',
                      border: '1.5px solid #0E7490',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#0E7490' }}>
                        {editingDocId ? 'Edit Policy Document' : 'Publish New Policy Document'}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={modalLabelStyle}>Policy Document Title *</label>
                          <input
                            type="text"
                            placeholder="e.g. Remote Work & Anti-Harassment Guidelines"
                            value={docFormData.title}
                            onChange={(e) => setDocFormData({ ...docFormData, title: e.target.value })}
                            style={modalInputStyle}
                          />
                        </div>
                        <div>
                          <label style={modalLabelStyle}>Version *</label>
                          <input
                            type="text"
                            placeholder="v1.0"
                            value={docFormData.version}
                            onChange={(e) => setDocFormData({ ...docFormData, version: e.target.value })}
                            style={modalInputStyle}
                          />
                        </div>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                        <div>
                          <label style={modalLabelStyle}>Category</label>
                          <select
                            value={docFormData.category}
                            onChange={(e) => setDocFormData({ ...docFormData, category: e.target.value })}
                            style={modalInputStyle}
                          >
                            <option value="Corporate Governance">Corporate Governance</option>
                            <option value="Workplace Safety & EHS">Workplace Safety & EHS</option>
                            <option value="HR & Employee Conduct">HR & Employee Conduct</option>
                            <option value="Finance & Travel">Finance & Travel</option>
                            <option value="IT & Data Security">IT & Data Security</option>
                            <option value="Operations & Quality">Operations & Quality</option>
                          </select>
                        </div>
                        <div>
                          <label style={modalLabelStyle}>Status</label>
                          <select
                            value={docFormData.status}
                            onChange={(e) => setDocFormData({ ...docFormData, status: e.target.value as any })}
                            style={modalInputStyle}
                          >
                            <option value="Active">Active (Mandatory for all staff)</option>
                            <option value="Archived">Archived / Deprecated</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label style={modalLabelStyle}>Scope & Description</label>
                        <textarea
                          rows={2}
                          placeholder="Brief summary of policy coverage, compliance requirements..."
                          value={docFormData.description}
                          onChange={(e) => setDocFormData({ ...docFormData, description: e.target.value })}
                          style={{ ...modalInputStyle, resize: 'vertical' }}
                        />
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => { setIsAddingDoc(false); setEditingDocId(null); }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '8px',
                            border: '1px solid #cbd5e1',
                            background: '#ffffff',
                            color: '#475569',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (!docFormData.title) return;
                            const today = new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
                            if (editingDocId) {
                              updatePolicyDocument(editingDocId, {
                                title: docFormData.title,
                                category: docFormData.category,
                                version: docFormData.version,
                                description: docFormData.description,
                                status: docFormData.status,
                                updated: today
                              });
                              setToastMessage('Policy document updated successfully!');
                            } else {
                              addPolicyDocument({
                                title: docFormData.title,
                                category: docFormData.category,
                                version: docFormData.version || 'v1.0',
                                description: docFormData.description,
                                status: docFormData.status,
                                updated: today
                              });
                              setToastMessage('New policy document published!');
                            }
                            setTimeout(() => setToastMessage(null), 3000);
                            setIsAddingDoc(false);
                            setEditingDocId(null);
                          }}
                          style={{
                            padding: '8px 16px',
                            borderRadius: '8px',
                            border: 'none',
                            background: '#0E7490',
                            color: '#ffffff',
                            fontWeight: 700,
                            cursor: 'pointer'
                          }}
                        >
                          {editingDocId ? 'Save Changes' : 'Publish Document'}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of Policies */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '360px', overflowY: 'auto' }}>
                    {policyDocuments.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '0.88rem' }}>
                        No corporate policy documents defined. Click "+ Upload / Add Policy Document" above to create one.
                      </div>
                    ) : (
                      policyDocuments.map((pol) => (
                        <div 
                          key={pol.id} 
                          style={{ 
                            display: 'flex', 
                            justifyContent: 'space-between', 
                            alignItems: 'center', 
                            padding: '12px 14px', 
                            backgroundColor: '#f8fafc', 
                            borderRadius: '10px', 
                            border: '1px solid #e2e8f0' 
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0, flex: 1 }}>
                            <FileText size={20} color="#0E7490" style={{ flexShrink: 0 }} />
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {pol.title}
                              </div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                                <span>Version: {pol.version}</span>
                                <span>•</span>
                                <span>{pol.category}</span>
                                <span>•</span>
                                <span>Updated: {pol.updated}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                            <span style={pillStyle(pol.status === 'Active' ? '#DCFCE7' : '#F1F5F9', pol.status === 'Active' ? '#166534' : '#64748B')}>
                              {pol.status}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingDoc(true);
                                setEditingDocId(pol.id);
                                setDocFormData({
                                  title: pol.title,
                                  category: pol.category,
                                  version: pol.version,
                                  description: pol.description || '',
                                  status: pol.status
                                });
                              }}
                              title="Edit Policy Document"
                              style={{
                                border: 'none',
                                background: '#e0f2fe',
                                color: '#0284c7',
                                borderRadius: '6px',
                                padding: '5px 8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Delete policy document "${pol.title}"?`)) {
                                  deletePolicyDocument(pol.id);
                                  setToastMessage('Policy document deleted.');
                                  setTimeout(() => setToastMessage(null), 3000);
                                }
                              }}
                              title="Delete Policy Document"
                              style={{
                                border: 'none',
                                background: '#fee2e2',
                                color: '#dc2626',
                                borderRadius: '6px',
                                padding: '5px 8px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center'
                              }}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Bank Details Modal */}
              {activeModal === 'bankDetails' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={modalLabelStyle}>Bank Name</label>
                    <input
                      type="text"
                      value={modalFormData.bankName}
                      onChange={(e) => setModalFormData({ ...modalFormData, bankName: e.target.value })}
                      style={modalInputStyle}
                    />
                  </div>
                  <div>
                    <label style={modalLabelStyle}>Account Number</label>
                    <input
                      type="text"
                      value={modalFormData.bankAccountNo}
                      onChange={(e) => setModalFormData({ ...modalFormData, bankAccountNo: e.target.value })}
                      style={modalInputStyle}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={modalLabelStyle}>IFSC Code</label>
                      <input
                        type="text"
                        value={modalFormData.bankIfsc}
                        onChange={(e) => setModalFormData({ ...modalFormData, bankIfsc: e.target.value })}
                        style={modalInputStyle}
                      />
                    </div>
                    <div>
                      <label style={modalLabelStyle}>Branch</label>
                      <input
                        type="text"
                        value={modalFormData.bankBranch}
                        onChange={(e) => setModalFormData({ ...modalFormData, bankBranch: e.target.value })}
                        style={modalInputStyle}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Email Config (SMTP) Modal */}
              {activeModal === 'emailConfig' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div>
                    <label style={modalLabelStyle}>SMTP Server Host</label>
                    <input
                      type="text"
                      value={modalFormData.smtpHost}
                      onChange={(e) => setModalFormData({ ...modalFormData, smtpHost: e.target.value })}
                      style={modalInputStyle}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={modalLabelStyle}>SMTP Port</label>
                      <input
                        type="text"
                        value={modalFormData.smtpPort}
                        onChange={(e) => setModalFormData({ ...modalFormData, smtpPort: e.target.value })}
                        style={modalInputStyle}
                      />
                    </div>
                    <div>
                      <label style={modalLabelStyle}>Security</label>
                      <input
                        type="text"
                        disabled
                        value="STARTTLS (Port 587)"
                        style={{ ...modalInputStyle, backgroundColor: '#f8fafc' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={modalLabelStyle}>System Sender Email</label>
                    <input
                      type="email"
                      value={modalFormData.smtpUser}
                      onChange={(e) => setModalFormData({ ...modalFormData, smtpUser: e.target.value })}
                      style={modalInputStyle}
                    />
                  </div>
                </div>
              )}

              {/* Switch Business Modal */}
              {activeModal === 'switchBusiness' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '0 0 8px 0' }}>
                    Select an active legal entity or factory branch to manage in the HRM portal:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {modalFormData.availableEntities?.map((ent: any) => (
                      <div
                        key={ent.id}
                        onClick={() => {
                          setModalFormData({
                            ...modalFormData,
                            activeEntity: ent.name,
                            businessCode: ent.code,
                            availableEntities: modalFormData.availableEntities.map((item: any) => ({
                              ...item,
                              isCurrent: item.id === ent.id
                            }))
                          });
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '14px 16px',
                          borderRadius: '12px',
                          border: modalFormData.activeEntity === ent.name ? '2px solid #0E7490' : '1px solid #e2e8f0',
                          backgroundColor: modalFormData.activeEntity === ent.name ? '#ECFEFF' : '#ffffff',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <Building size={20} color={modalFormData.activeEntity === ent.name ? '#0E7490' : '#64748b'} />
                          <div>
                            <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0f172a' }}>{ent.name}</div>
                            <div style={{ fontSize: '0.78rem', color: '#64748b' }}>Entity ID: {ent.code}</div>
                          </div>
                        </div>
                        {modalFormData.activeEntity === ent.name && (
                          <span style={pillStyle('#0E7490', '#ffffff')}>Active</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit All Modal */}
              {activeModal === 'editAll' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                    <div>
                      <label style={modalLabelStyle}>Business Name</label>
                      <input
                        type="text"
                        value={modalFormData.businessName}
                        onChange={(e) => setModalFormData({ ...modalFormData, businessName: e.target.value })}
                        style={modalInputStyle}
                      />
                    </div>
                    <div>
                      <label style={modalLabelStyle}>Category</label>
                      <input
                        type="text"
                        value={modalFormData.category}
                        onChange={(e) => setModalFormData({ ...modalFormData, category: e.target.value })}
                        style={modalInputStyle}
                      />
                    </div>
                    <div>
                      <label style={modalLabelStyle}>Phone Number</label>
                      <input
                        type="text"
                        value={modalFormData.phone}
                        onChange={(e) => setModalFormData({ ...modalFormData, phone: e.target.value })}
                        style={modalInputStyle}
                      />
                    </div>
                    <div>
                      <label style={modalLabelStyle}>Email Address</label>
                      <input
                        type="email"
                        value={modalFormData.email}
                        onChange={(e) => setModalFormData({ ...modalFormData, email: e.target.value })}
                        style={modalInputStyle}
                      />
                    </div>
                    <div>
                      <label style={modalLabelStyle}>GSTIN</label>
                      <input
                        type="text"
                        value={modalFormData.gstin}
                        onChange={(e) => setModalFormData({ ...modalFormData, gstin: e.target.value })}
                        style={modalInputStyle}
                      />
                    </div>
                    <div>
                      <label style={modalLabelStyle}>Type</label>
                      <input
                        type="text"
                        value={modalFormData.type}
                        onChange={(e) => setModalFormData({ ...modalFormData, type: e.target.value })}
                        style={modalInputStyle}
                      />
                    </div>
                  </div>
                  <div>
                    <label style={modalLabelStyle}>Business Address 🚩</label>
                    <textarea
                      rows={2}
                      value={modalFormData.address}
                      onChange={(e) => setModalFormData({ ...modalFormData, address: e.target.value })}
                      style={{ ...modalInputStyle, resize: 'vertical' }}
                    />
                  </div>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    backgroundColor: '#ffffff',
                    color: '#475569',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type={activeModal === 'policyDocument' ? 'button' : 'submit'}
                  onClick={activeModal === 'policyDocument' ? closeModal : undefined}
                  style={{
                    padding: '9px 22px',
                    borderRadius: '10px',
                    border: 'none',
                    backgroundColor: '#0E7490',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(14, 116, 144, 0.25)'
                  }}
                >
                  {activeModal === 'policyDocument' ? 'Done' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

// UI Styling Constants matching VRM Enterprise Design System
const cardStyle: React.CSSProperties = {
  backgroundColor: '#ffffff',
  borderRadius: '14px',
  border: '1px solid #e2e8f0',
  padding: '0 18px',
  height: '76px',
  minHeight: '76px',
  maxHeight: '76px',
  display: 'flex',
  alignItems: 'center',
  gap: '14px',
  cursor: 'pointer',
  transition: 'all 0.15s ease',
  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
  boxSizing: 'border-box',
  overflow: 'hidden',
  width: '100%',
  minWidth: 0
};

const handleCardHover = (e: React.MouseEvent<HTMLDivElement>) => {
  e.currentTarget.style.borderColor = '#0E7490';
  e.currentTarget.style.boxShadow = '0 4px 14px rgba(14, 116, 144, 0.1)';
  e.currentTarget.style.transform = 'translateY(-1px)';
};

const handleCardLeave = (e: React.MouseEvent<HTMLDivElement>) => {
  e.currentTarget.style.borderColor = '#e2e8f0';
  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.03)';
  e.currentTarget.style.transform = 'translateY(0)';
};

const iconBadgeStyle = (bg: string, color: string): React.CSSProperties => ({
  width: '42px',
  height: '42px',
  borderRadius: '10px',
  backgroundColor: bg,
  color: color,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0
});

const labelStyle: React.CSSProperties = {
  fontSize: '0.82rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: '3px',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis'
};

const valueStyle: React.CSSProperties = {
  fontSize: '0.88rem',
  fontWeight: 600,
  color: '#0f172a',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'block',
  minWidth: 0
};

const pillStyle = (bg: string, color: string): React.CSSProperties => ({
  backgroundColor: bg,
  color: color,
  fontSize: '0.72rem',
  fontWeight: 700,
  padding: '2px 8px',
  borderRadius: '999px',
  display: 'inline-flex',
  alignItems: 'center',
  flexShrink: 0
});

const modalLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.82rem',
  fontWeight: 700,
  color: '#334155',
  marginBottom: '6px'
};

const modalInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  border: '1.5px solid #cbd5e1',
  fontSize: '0.9rem',
  outline: 'none',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff'
};
