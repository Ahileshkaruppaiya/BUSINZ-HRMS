import React, { useState, useEffect } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { CompanyBranch, CompanyInfo } from '../../types/settings';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Edit3, 
  Plus, 
  Trash2, 
  Save, 
  CheckCircle2, 
  Globe, 
  Mail, 
  Phone, 
  FileText, 
  Clock, 
  Calendar, 
  User, 
  Users, 
  Briefcase, 
  X 
} from 'lucide-react';

export const CompanyDetailsSettings: React.FC = () => {
  const { 
    companyInfo, 
    updateCompanyInfo, 
    companyBranches, 
    addCompanyBranch, 
    updateCompanyBranch, 
    deleteCompanyBranch,
    orgStructure,
    updateOrgStructure,
    editDepartment,
    removeOrgDepartment,
    editDesignation,
    removeOrgDesignation,
    editEmploymentType,
    removeOrgEmploymentType,
    editWorkLocation,
    removeOrgWorkLocation,
    loadCompanyPreset,
    policyAuditLogs,
    currentUser,
    hasPermission
  } = useHRMS();

  const isPrivileged = currentUser.role !== 'Employee';
  const [activeTab, setActiveTab] = useState<'info' | 'branches' | 'org'>('info');

  // Edit states for Company Info
  const [infoForm, setInfoForm] = useState<CompanyInfo>(companyInfo || {
    companyName: '',
    legalCompanyName: '',
    companyType: 'Private Limited',
    industry: '',
    registrationNumber: '',
    gstNumber: '',
    panNumber: '',
    cinNumber: '',
    website: '',
    officialEmail: '',
    officialPhone: '',
    createdAt: new Date().toISOString(),
    createdBy: '',
    updatedAt: new Date().toISOString(),
    updatedBy: ''
  });
  const [isEditingInfo, setIsEditingInfo] = useState(true);
  const [infoSavedSuccess, setInfoSavedSuccess] = useState(false);

  useEffect(() => {
    if (companyInfo) {
      setInfoForm(companyInfo);
    }
  }, [companyInfo]);

  // Branch Modal State
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<CompanyBranch | null>(null);
  const [branchForm, setBranchForm] = useState<{
    branchName: string;
    branchCode: string;
    isHeadOffice: boolean;
    addressLine1: string;
    addressLine2: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    contactNumber: string;
    email: string;
    branchHr: string;
    workingDays: string[];
  }>({
    branchName: '',
    branchCode: '',
    isHeadOffice: false,
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    country: 'India',
    pincode: '',
    contactNumber: '',
    email: '',
    branchHr: '',
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  });

  // Organization Master Add States
  const [newDept, setNewDept] = useState('');
  const [newDesig, setNewDesig] = useState('');
  const [newEmpType, setNewEmpType] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDept, setNewTeamDept] = useState(orgStructure.departments[0] || 'Engineering');
  const [newTeamLead, setNewTeamLead] = useState('');

  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    updateCompanyInfo(infoForm);
    setInfoSavedSuccess(true);
    setTimeout(() => setInfoSavedSuccess(false), 3500);
  };

  const openAddBranchModal = () => {
    setEditingBranch(null);
    setBranchForm({
      branchName: '',
      branchCode: '',
      isHeadOffice: false,
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      country: 'India',
      pincode: '',
      contactNumber: '',
      email: '',
      branchHr: '',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    });
    setIsBranchModalOpen(true);
  };

  const openEditBranchModal = (b: CompanyBranch) => {
    setEditingBranch(b);
    setBranchForm({
      branchName: b.branchName,
      branchCode: b.branchCode,
      isHeadOffice: b.isHeadOffice,
      addressLine1: b.address.addressLine1,
      addressLine2: b.address.addressLine2 || '',
      city: b.address.city,
      state: b.address.state,
      country: b.address.country,
      pincode: b.address.pincode,
      contactNumber: b.contactNumber,
      email: b.email,
      branchHr: b.branchHr,
      workingDays: b.workingDays
    });
    setIsBranchModalOpen(true);
  };

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchForm.branchName || !branchForm.branchCode) return;

    if (editingBranch) {
      updateCompanyBranch(editingBranch.id, {
        branchName: branchForm.branchName,
        branchCode: branchForm.branchCode,
        isHeadOffice: branchForm.isHeadOffice,
        address: {
          addressLine1: branchForm.addressLine1,
          addressLine2: branchForm.addressLine2,
          city: branchForm.city,
          state: branchForm.state,
          country: branchForm.country,
          pincode: branchForm.pincode
        },
        contactNumber: branchForm.contactNumber,
        email: branchForm.email,
        branchHr: branchForm.branchHr,
        workingDays: branchForm.workingDays,
        workingHours: editingBranch.workingHours
      });
    } else {
      addCompanyBranch({
        branchName: branchForm.branchName,
        branchCode: branchForm.branchCode,
        isHeadOffice: branchForm.isHeadOffice,
        address: {
          addressLine1: branchForm.addressLine1,
          addressLine2: branchForm.addressLine2,
          city: branchForm.city,
          state: branchForm.state,
          country: branchForm.country,
          pincode: branchForm.pincode
        },
        contactNumber: branchForm.contactNumber,
        email: branchForm.email,
        branchHr: branchForm.branchHr,
        workingDays: branchForm.workingDays
      });
    }
    setIsBranchModalOpen(false);
  };

  // Edit Modal State for Org Structure items
  const [editingItem, setEditingItem] = useState<{
    type: 'dept' | 'desig' | 'empType' | 'location';
    oldValue: string;
    newValue: string;
  } | null>(null);

  const handleSaveEditedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.newValue.trim()) return;
    const trimmed = editingItem.newValue.trim();
    if (editingItem.type === 'dept') {
      editDepartment(editingItem.oldValue, trimmed);
    } else if (editingItem.type === 'desig') {
      editDesignation(editingItem.oldValue, trimmed);
    } else if (editingItem.type === 'empType') {
      editEmploymentType(editingItem.oldValue, trimmed);
    } else if (editingItem.type === 'location') {
      editWorkLocation(editingItem.oldValue, trimmed);
    }
    setEditingItem(null);
  };

  const handleAddDept = () => {
    if (!newDept.trim() || orgStructure.departments.includes(newDept.trim())) return;
    updateOrgStructure({ departments: [...orgStructure.departments, newDept.trim()] });
    setNewDept('');
  };

  const handleAddDesig = () => {
    if (!newDesig.trim() || orgStructure.designations.includes(newDesig.trim())) return;
    updateOrgStructure({ designations: [...orgStructure.designations, newDesig.trim()] });
    setNewDesig('');
  };

  const handleAddEmpType = () => {
    if (!newEmpType.trim() || orgStructure.employmentTypes.includes(newEmpType.trim())) return;
    updateOrgStructure({ employmentTypes: [...orgStructure.employmentTypes, newEmpType.trim()] });
    setNewEmpType('');
  };

  const handleAddLocation = () => {
    if (!newLocation.trim() || orgStructure.workLocations.includes(newLocation.trim())) return;
    updateOrgStructure({ workLocations: [...orgStructure.workLocations, newLocation.trim()] });
    setNewLocation('');
  };

  const handleRemoveLocation = (locToRemove: string) => {
    removeOrgWorkLocation(locToRemove);
  };

  const handleRemoveDept = (deptToRemove: string) => {
    removeOrgDepartment(deptToRemove);
  };

  const handleRemoveDesig = (desigToRemove: string) => {
    removeOrgDesignation(desigToRemove);
  };

  const handleRemoveEmpType = (typeToRemove: string) => {
    removeOrgEmploymentType(typeToRemove);
  };

  const handleAddTeam = () => {
    if (!newTeamName.trim()) return;
    const newTeam = {
      id: `TM-${Date.now()}`,
      name: newTeamName.trim(),
      departmentId: newTeamDept,
      leadEmployeeName: newTeamLead.trim() || 'Unassigned'
    };
    updateOrgStructure({ teams: [...orgStructure.teams, newTeam] });
    setNewTeamName('');
    setNewTeamLead('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Navigation Sub-Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        borderBottom: '1px solid #E2E8F0',
        paddingBottom: '2px'
      }}>
        <button
          onClick={() => setActiveTab('info')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            borderBottom: activeTab === 'info' ? '3px solid #0E7490' : '3px solid transparent',
            backgroundColor: activeTab === 'info' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'info' ? '#0E7490' : '#64748B',
            fontWeight: activeTab === 'info' ? 700 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          <Building2 size={16} /> A. Basic Company Information
        </button>

        <button
          onClick={() => setActiveTab('branches')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            borderBottom: activeTab === 'branches' ? '3px solid #0E7490' : '3px solid transparent',
            backgroundColor: activeTab === 'branches' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'branches' ? '#0E7490' : '#64748B',
            fontWeight: activeTab === 'branches' ? 700 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          <MapPin size={16} /> B. Address & Branches ({companyBranches.length})
        </button>

        <button
          onClick={() => setActiveTab('org')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            borderRadius: '10px 10px 0 0',
            border: 'none',
            borderBottom: activeTab === 'org' ? '3px solid #0E7490' : '3px solid transparent',
            backgroundColor: activeTab === 'org' ? '#FFFFFF' : 'transparent',
            color: activeTab === 'org' ? '#0E7490' : '#64748B',
            fontWeight: activeTab === 'org' ? 700 : 500,
            fontSize: '0.88rem',
            cursor: 'pointer'
          }}
        >
          <Layers size={16} /> C. Organization Structure
        </button>
      </div>

      {infoSavedSuccess && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '12px 16px',
          backgroundColor: '#DCFCE7',
          color: '#166534',
          borderRadius: '12px',
          fontSize: '0.88rem',
          fontWeight: 600
        }}>
          <CheckCircle2 size={18} /> Company details saved and logged into audit history successfully!
        </div>
      )}

      {/* TAB 1: BASIC COMPANY INFORMATION */}
      {activeTab === 'info' && (
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #E7ECF3',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <div style={{ marginBottom: '22px' }}>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>
              Corporate Legal & Identity Profile
            </h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
              Enter registered legal details, tax identifiers, and official corporate channels
            </p>
          </div>

          <form id="company-info-form" onSubmit={handleSaveInfo}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  Company Name (Brand)
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={infoForm.companyName}
                  onChange={e => setInfoForm({ ...infoForm, companyName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  Legal Registered Entity Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={infoForm.legalCompanyName}
                  onChange={e => setInfoForm({ ...infoForm, legalCompanyName: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  Company Type
                </label>
                <select
                  className="form-control"
                  value={infoForm.companyType}
                  onChange={e => setInfoForm({ ...infoForm, companyType: e.target.value })}
                >
                  <option value="Private Limited">Private Limited (Pvt. Ltd.)</option>
                  <option value="Public Limited">Public Limited (Ltd.)</option>
                  <option value="Limited Liability Partnership">LLP</option>
                  <option value="Partnership">Partnership</option>
                  <option value="Sole Proprietorship">Sole Proprietorship</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  Industry Sector
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={infoForm.industry}
                  onChange={e => setInfoForm({ ...infoForm, industry: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  ROC Registration Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={infoForm.registrationNumber}
                  onChange={e => setInfoForm({ ...infoForm, registrationNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  GST Number (GSTIN)
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={infoForm.gstNumber}
                  onChange={e => setInfoForm({ ...infoForm, gstNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  PAN Number
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={infoForm.panNumber}
                  onChange={e => setInfoForm({ ...infoForm, panNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  CIN Number (Corporate Identification)
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={infoForm.cinNumber}
                  onChange={e => setInfoForm({ ...infoForm, cinNumber: e.target.value })}
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  Official Website
                </label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <Globe size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
                  <input
                    type="url"
                    className="form-control"
                    style={{ paddingLeft: '34px' }}
                    value={infoForm.website}
                    onChange={e => setInfoForm({ ...infoForm, website: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  Official Corporate Email
                </label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <Mail size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
                  <input
                    type="email"
                    className="form-control"
                    style={{ paddingLeft: '34px' }}
                    value={infoForm.officialEmail}
                    onChange={e => setInfoForm({ ...infoForm, officialEmail: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569' }}>
                  Official Phone Number
                </label>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <Phone size={15} style={{ position: 'absolute', left: '12px', color: '#94A3B8' }} />
                  <input
                    type="tel"
                    className="form-control"
                    style={{ paddingLeft: '34px' }}
                    value={infoForm.officialPhone}
                    onChange={e => setInfoForm({ ...infoForm, officialPhone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Bottom Action Bar with Save Button */}
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'center',
              gap: '12px',
              marginTop: '28px',
              paddingTop: '20px',
              borderTop: '1px solid #F1F5F9'
            }}>
              <button
                type="button"
                onClick={() => setInfoForm(companyInfo)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: '1px solid #CBD5E1',
                  backgroundColor: '#FFFFFF',
                  color: '#475569',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = '#F8FAFC')}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = '#FFFFFF')}
              >
                Reset Changes
              </button>
              <button
                type="submit"
                style={{
                  backgroundColor: '#0E7490',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '11px 26px',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(14, 116, 144, 0.3)',
                  transition: 'all 0.15s ease'
                }}
                onMouseOver={e => (e.currentTarget.style.backgroundColor = '#0891B2')}
                onMouseOut={e => (e.currentTarget.style.backgroundColor = '#0E7490')}
              >
                <Save size={17} /> Save Company Details
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: ADDRESS & BRANCHES */}
      {activeTab === 'branches' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#0F172A' }}>
                Multi-Branch & Headquarters Network
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: '0.82rem', color: '#64748B' }}>
                Company hierarchy across Head Office, construction yards, engineering centers, and regional hubs
              </p>
            </div>
            {isPrivileged && (
              <button
                type="button"
                onClick={openAddBranchModal}
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
                <span>Add Branch</span>
              </button>
            )}
          </div>

          {companyBranches.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '48px 24px',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E7ECF3',
              color: '#64748B'
            }}>
              <Building2 size={40} color="#94A3B8" style={{ marginBottom: '12px' }} />
              <div style={{ fontWeight: 700, fontSize: '1rem', color: '#1E293B', marginBottom: '6px' }}>
                No Branches Configured
              </div>
              <div style={{ fontSize: '0.84rem', color: '#64748B', maxWidth: '400px', margin: '0 auto 16px' }}>
                Click the "+ Add Branch" button above to add your primary headquarters or branch offices manually.
              </div>
              {isPrivileged && (
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={openAddBranchModal}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={15} /> Add First Branch
                </button>
              )}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
              {companyBranches.map(branch => (
                <div
                  key={branch.id}
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: branch.isHeadOffice ? '2px solid #0E7490' : '1px solid #E7ECF3',
                    padding: '20px',
                    position: 'relative',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                        {branch.branchName}
                      </h4>
                      {branch.isHeadOffice && (
                        <span style={{
                          fontSize: '0.68rem',
                          fontWeight: 800,
                          backgroundColor: '#ECFEFF',
                          color: '#0E7490',
                          padding: '2px 8px',
                          borderRadius: '999px',
                          border: '1px solid #A5F3FC'
                        }}>
                          HEAD OFFICE
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                      Code: {branch.branchCode}
                    </span>
                  </div>

                  {isPrivileged && (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={() => openEditBranchModal(branch)}
                        title="Edit Branch"
                      >
                        <Edit3 size={14} />
                      </button>
                      {!branch.isHeadOffice && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ padding: '4px 8px', color: '#EF4444' }}
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${branch.branchName}?`)) {
                              deleteCompanyBranch(branch.id);
                            }
                          }}
                          title="Delete Branch"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.82rem', color: '#334155' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
                    <MapPin size={15} color="#0E7490" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>
                      {branch.address.addressLine1}, {branch.address.addressLine2 ? `${branch.address.addressLine2}, ` : ''}
                      {branch.address.city}, {branch.address.state} - {branch.address.pincode}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Phone size={15} color="#64748B" />
                    <span>{branch.contactNumber || 'N/A'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Mail size={15} color="#64748B" />
                    <span>{branch.email || 'N/A'}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <User size={15} color="#64748B" />
                    <span>Branch HR Lead: <strong>{branch.branchHr || 'Unassigned'}</strong></span>
                  </div>

                  {branch.workingHours?.startTime && branch.workingHours?.endTime && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={15} color="#64748B" />
                      <span>Working Hours: <strong>{branch.workingHours.startTime} - {branch.workingHours.endTime}</strong></span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          )}
        </div>
      )}

      {/* TAB 3: ORGANIZATION STRUCTURE */}
      {activeTab === 'org' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
            {/* Departments */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Layers size={16} color="#0E7490" /> Departments ({orgStructure.departments.length})
                </h4>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Add new department..."
                  value={newDept}
                  onChange={e => setNewDept(e.target.value)}
                  className="form-control form-control-sm"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddDept(); } }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddDept}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {orgStructure.departments.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
                    No departments added yet. Type above and click Add to create one.
                  </div>
                ) : (
                  orgStructure.departments.map(d => (
                    <span
                      key={d}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        backgroundColor: '#F1F5F9',
                        color: '#1E293B',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>{d}</span>
                      <button
                        type="button"
                        onClick={() => setEditingItem({ type: 'dept', oldValue: d, newValue: d })}
                        title={`Edit ${d}`}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          color: '#0E7490',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDept(d)}
                        title={`Remove ${d}`}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          color: '#94A3B8',
                          fontSize: '14px',
                          lineHeight: 1,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Designations */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Briefcase size={16} color="#0E7490" /> Designations ({orgStructure.designations.length})
                </h4>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Add new designation..."
                  value={newDesig}
                  onChange={e => setNewDesig(e.target.value)}
                  className="form-control form-control-sm"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddDesig(); } }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddDesig}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {orgStructure.designations.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
                    No designations added yet. Type above and click Add to create one.
                  </div>
                ) : (
                  orgStructure.designations.map(d => (
                    <span
                      key={d}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        backgroundColor: '#F1F5F9',
                        color: '#1E293B',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>{d}</span>
                      <button
                        type="button"
                        onClick={() => setEditingItem({ type: 'desig', oldValue: d, newValue: d })}
                        title={`Edit ${d}`}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          color: '#0E7490',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDesig(d)}
                        title={`Remove ${d}`}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          color: '#94A3B8',
                          fontSize: '14px',
                          lineHeight: 1,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Employment Types */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={16} color="#0E7490" /> Employment Types ({orgStructure.employmentTypes.length})
                </h4>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Add employment type..."
                  value={newEmpType}
                  onChange={e => setNewEmpType(e.target.value)}
                  className="form-control form-control-sm"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddEmpType(); } }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddEmpType}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {orgStructure.employmentTypes.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
                    No employment types added yet. Type above and click Add to create one.
                  </div>
                ) : (
                  orgStructure.employmentTypes.map(e => (
                    <span
                      key={e}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        backgroundColor: '#ECFEFF',
                        color: '#0E7490',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>{e}</span>
                      <button
                        type="button"
                        onClick={() => setEditingItem({ type: 'empType', oldValue: e, newValue: e })}
                        title={`Edit ${e}`}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          color: '#0E7490',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmpType(e)}
                        title={`Remove ${e}`}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          color: '#0891B2',
                          fontSize: '14px',
                          lineHeight: 1,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Work Locations */}
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MapPin size={16} color="#0E7490" /> Work Locations ({orgStructure.workLocations.length})
                </h4>
              </div>
              <div style={{ display: 'flex', gap: '6px', marginBottom: '12px' }}>
                <input
                  type="text"
                  placeholder="Add location (any city/site)..."
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  className="form-control form-control-sm"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddLocation(); } }}
                />
                <button className="btn btn-primary btn-sm" onClick={handleAddLocation}>Add</button>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {orgStructure.workLocations.length === 0 ? (
                  <div style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic', padding: '6px 0' }}>
                    No work locations added yet. Type above and click Add to create one.
                  </div>
                ) : (
                  orgStructure.workLocations.map(l => (
                    <span
                      key={l}
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        backgroundColor: '#FEF3C7',
                        color: '#92400E',
                        padding: '4px 8px',
                        borderRadius: '8px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px'
                      }}
                    >
                      <span>{l}</span>
                      <button
                        type="button"
                        onClick={() => setEditingItem({ type: 'location', oldValue: l, newValue: l })}
                        title={`Edit ${l}`}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          color: '#92400E',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        <Edit3 size={11} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveLocation(l)}
                        title={`Remove ${l}`}
                        style={{
                          border: 'none',
                          background: 'none',
                          cursor: 'pointer',
                          padding: 0,
                          color: '#B45309',
                          fontSize: '14px',
                          lineHeight: 1,
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}
                      >
                        ×
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Teams List */}
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '20px' }}>
            <h4 style={{ margin: '0 0 14px', fontSize: '0.95rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Users size={16} color="#0E7490" /> Operational Teams & Squads ({orgStructure.teams.length})
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr)) 120px', gap: '8px', marginBottom: '14px' }}>
              <input
                type="text"
                placeholder="Team / Squad Name"
                className="form-control form-control-sm"
                value={newTeamName}
                onChange={e => setNewTeamName(e.target.value)}
              />
              <select
                className="form-control form-control-sm"
                value={newTeamDept}
                onChange={e => setNewTeamDept(e.target.value)}
              >
                {orgStructure.departments.length === 0 ? (
                  <option value="">No departments (Add dept first)</option>
                ) : (
                  orgStructure.departments.map(d => <option key={d} value={d}>{d}</option>)
                )}
              </select>
              <input
                type="text"
                placeholder="Lead Name"
                className="form-control form-control-sm"
                value={newTeamLead}
                onChange={e => setNewTeamLead(e.target.value)}
              />
              <button className="btn btn-primary btn-sm" onClick={handleAddTeam}>Add Team</button>
            </div>

            <table className="hrms-table">
              <thead>
                <tr>
                  <th>Team Name</th>
                  <th>Department</th>
                  <th>Lead / Head</th>
                </tr>
              </thead>
              <tbody>
                {orgStructure.teams.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '24px', color: '#94A3B8', fontStyle: 'italic' }}>
                      No operational teams configured yet. Use the form above to add a team.
                    </td>
                  </tr>
                ) : (
                  orgStructure.teams.map(t => (
                    <tr key={t.id}>
                      <td><strong>{t.name}</strong></td>
                      <td>{t.departmentId}</td>
                      <td>{t.leadEmployeeName || 'Unassigned'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BRANCH CREATE / EDIT MODAL */}
      {isBranchModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '640px' }}>
            <div className="modal-header">
              <h3>{editingBranch ? 'Edit Branch Office' : 'Add New Branch'}</h3>
              <button className="close-btn" title="Close" onClick={() => setIsBranchModalOpen(false)}>
                <X size={22} />
              </button>
            </div>
            <form onSubmit={handleSaveBranch}>
              <div className="modal-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                <div>
                  <label className="form-label">Branch Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={branchForm.branchName}
                    onChange={e => setBranchForm({ ...branchForm, branchName: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Branch Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={branchForm.branchCode}
                    onChange={e => setBranchForm({ ...branchForm, branchCode: e.target.value })}
                    required
                  />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Address Line 1</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Street / Plot / Highway"
                    value={branchForm.addressLine1}
                    onChange={e => setBranchForm({ ...branchForm, addressLine1: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    className="form-control"
                    value={branchForm.city}
                    onChange={e => setBranchForm({ ...branchForm, city: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    className="form-control"
                    value={branchForm.state}
                    onChange={e => setBranchForm({ ...branchForm, state: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Pincode</label>
                  <input
                    type="text"
                    className="form-control"
                    value={branchForm.pincode}
                    onChange={e => setBranchForm({ ...branchForm, pincode: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Branch Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={branchForm.contactNumber}
                    onChange={e => setBranchForm({ ...branchForm, contactNumber: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Branch Email</label>
                  <input
                    type="email"
                    className="form-control"
                    value={branchForm.email}
                    onChange={e => setBranchForm({ ...branchForm, email: e.target.value })}
                  />
                </div>

                <div>
                  <label className="form-label">Branch HR Lead</label>
                  <input
                    type="text"
                    className="form-control"
                    value={branchForm.branchHr}
                    onChange={e => setBranchForm({ ...branchForm, branchHr: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsBranchModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBranch ? 'Update Branch' : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENAME / EDIT MODAL FOR ORG STRUCTURE ITEMS */}
      {editingItem && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            maxWidth: '440px',
            width: '100%',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            padding: '24px',
            boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)'
          }}>
            <h3 style={{ margin: '0 0 8px', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>
              Edit {editingItem.type === 'dept' ? 'Department' : editingItem.type === 'desig' ? 'Designation' : editingItem.type === 'empType' ? 'Employment Type' : 'Work Location'}
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '0.8rem', color: '#64748B' }}>
              Rename <strong>{editingItem.oldValue}</strong>. Existing employees and records will update automatically.
            </p>
            <form onSubmit={handleSaveEditedItem}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#475569', marginBottom: '6px' }}>
                  New Name / Title
                </label>
                <input
                  type="text"
                  value={editingItem.newValue}
                  onChange={e => setEditingItem({ ...editingItem, newValue: e.target.value })}
                  required
                  autoFocus
                  className="form-control"
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditingItem(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary btn-sm">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
