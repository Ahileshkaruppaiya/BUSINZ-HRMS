import React, { useState, useEffect } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  Building2, 
  Store, 
  Star, 
  LayoutDashboard, 
  CheckCircle2, 
  Layers, 
  UserCheck, 
  ShieldCheck, 
  Folder, 
  MapPin, 
  ChevronRight, 
  Save, 
  X, 
  Plus, 
  Check,
  Building,
  Users,
  Briefcase,
  GitFork,
  Network,
  Maximize2,
  Minimize2,
  Edit2,
  Trash2,
  Search,
  AlertCircle,
  RotateCcw
} from 'lucide-react';

interface OrgConfigEntry {
  id: string;
  [key: string]: string | number | boolean | undefined;
}

interface AccountConfigState {
  [section: string]: OrgConfigEntry[];
}

const initialAccountData = {
  // Left Column 1: Branches (4 Branches Created)
  branches: [
    { id: 'b1', name: 'Madhavaram Central Facility (HQ)', code: 'BR-01', location: 'Chennai, Tamil Nadu', type: 'Headquarters', active: true },
    { id: 'b2', name: 'Guindy Heavy Fabrication Yard', code: 'BR-02', location: 'Chennai, Tamil Nadu', type: 'Manufacturing Plant', active: true },
    { id: 'b3', name: 'Sri City Industrial Project Site', code: 'BR-03', location: 'Tirupati, Andhra Pradesh', type: 'Project Site', active: true },
    { id: 'b4', name: 'Coimbatore Regional Branch Office', code: 'BR-04', location: 'Coimbatore, Tamil Nadu', type: 'Regional Office', active: true }
  ],

  // Left Column 2: Dealerships (1 Dealerships Created)
  dealerships: [
    { id: 'd1', name: 'VRM Steel & Pre-Engineered Authorized Channel Partner', code: 'DLR-SOUTH-01', region: 'Southern Zone (TN & AP)', contact: '+91 44 2553 7890', active: true }
  ],

  // Left Column 3: Grade (5 Grade Created)
  grades: [
    { id: 'g1', code: 'L1', title: 'Executive Leadership', description: 'Director, VP, General Manager', level: 1 },
    { id: 'g2', code: 'M2', title: 'Senior Project Management', description: 'Senior Project Manager, Chief Engineer', level: 2 },
    { id: 'g3', code: 'M1', title: 'Middle Management', description: 'Assistant Manager, Technical Lead', level: 3 },
    { id: 'g4', code: 'E2', title: 'Senior Technical Officer', description: 'Senior Engineer, QA/QC Specialist', level: 4 },
    { id: 'g5', code: 'E1', title: 'Entry Professional / Trainee', description: 'Site Engineer, Graduate Trainee', level: 5 }
  ],

  // Left Column 4: Set Default Dashboard (3 Default Dashboard)
  defaultDashboards: [
    { id: 'dd1', name: 'Executive Leadership Dashboard', targetRoles: 'Super Admin, Management, CEO', active: true },
    { id: 'dd2', name: 'Human Resources & Workforce Hub', targetRoles: 'HR Admin, Department Managers', active: true },
    { id: 'dd3', name: 'Site Engineering & Project Tracker', targetRoles: 'Engineers, Site Supervisors, Technicians', active: true }
  ],

  // Left Column 5: Approval Stage (20 Stage)
  approvalStages: [
    { id: 'as1', workflow: 'Leave Approval Workflow', stages: 'L1 Manager -> L2 HR Admin -> Auto Finalize', count: 3 },
    { id: 'as2', workflow: 'Outstation Expense Reimbursement', stages: 'Project Head -> Finance Manager -> Accounts Disbursement', count: 3 },
    { id: 'as3', workflow: 'Overtime Authorization', stages: 'Site Supervisor -> Plant Manager -> HR Payroll', count: 3 },
    { id: 'as4', workflow: 'Attendance Regularization', stages: 'Line Manager -> HR Approval', count: 2 },
    { id: 'as5', workflow: 'Shift Swap & Change Request', stages: 'Reporting Officer -> Shift Coordinator', count: 2 },
    { id: 'as6', workflow: 'Asset Allocation & Issuance', stages: 'Department Head -> IT Admin -> Store Keeper', count: 3 },
    { id: 'as7', workflow: 'Full & Final (FNF) Clearance', stages: 'IT -> Site Store -> HR -> Finance Director', count: 4 }
  ],

  // Right Column 1: Departments (4 Departments Created)
  departments: [
    { id: 'dp1', name: 'Civil & Structural Engineering', head: 'Er. R. Sundararajan', staffCount: 42, active: true },
    { id: 'dp2', name: 'Plant & Site Operations', head: 'K. Rajendran', staffCount: 68, active: true },
    { id: 'dp3', name: 'Human Resources & Administration', head: 'Pavithra', staffCount: 12, active: true },
    { id: 'dp4', name: 'Finance, Accounts & Procurement', head: 'M. Senthilkumar', staffCount: 16, active: true }
  ],

  // Right Column 2: Designations (8 Designations Created)
  designations: [
    { id: 'ds1', title: 'Chief Executive Officer (CEO)', grade: 'L1', dept: 'Management' },
    { id: 'ds2', title: 'Project Director', grade: 'L1', dept: 'Operations' },
    { id: 'ds3', title: 'Senior Structural Engineer', grade: 'M2', dept: 'Engineering' },
    { id: 'ds4', title: 'Site Construction Supervisor', grade: 'E2', dept: 'Operations' },
    { id: 'ds5', title: 'QA / QC Lead Inspector', grade: 'E2', dept: 'Engineering' },
    { id: 'ds6', title: 'Human Resources Manager', grade: 'M1', dept: 'HR & Admin' },
    { id: 'ds7', title: 'Finance & Accounts Manager', grade: 'M1', dept: 'Finance' },
    { id: 'ds8', title: 'Procurement & Material Officer', grade: 'E1', dept: 'Finance' }
  ],

  // Right Column 3: Role (6 Role Created)
  roles: [
    { id: 'r1', name: 'Super Admin', permissions: 'Unrestricted Full Enterprise Control', active: true },
    { id: 'r2', name: 'HR Admin', permissions: 'Workforce, Attendance, Leaves, Payroll', active: true },
    { id: 'r3', name: 'Department Manager', permissions: 'Team Tasks, Attendance Approvals, Performance', active: true },
    { id: 'r4', name: 'Finance Manager', permissions: 'Expenses, Loans, Payroll Approval, FNF', active: true },
    { id: 'r5', name: 'Site Project Engineer', permissions: 'Site Tasks, Geofence Attendance, Overtime', active: true },
    { id: 'r6', name: 'Employee', permissions: 'Self-Service Portal, Payslips, Requests', active: true }
  ],

  // Right Column 4: Projects (3 Projects)
  projects: [
    { id: 'pr1', name: 'Chennai Metro Viaduct Package 4', client: 'CMRL', budget: '₹42.5 Cr', status: 'In Progress (72%)' },
    { id: 'pr2', name: 'Sri City Mega Pre-Engineered Warehouse', client: 'Industrial Logistics SEZ', budget: '₹28.0 Cr', status: 'In Progress (45%)' },
    { id: 'pr3', name: 'Coimbatore Industrial Solar Canopy Installation', client: 'CleanEnergy Corp', budget: '₹14.2 Cr', status: 'Commissioning (90%)' }
  ],

  // Right Column 5: Posting Location (4 Locations Created)
  postingLocations: [
    { id: 'pl1', name: 'Madhavaram Central Facility', city: 'Chennai', geofenceRadius: '200m', staffAssigned: 54 },
    { id: 'pl2', name: 'Guindy Industrial Fabrication Plant', city: 'Chennai', geofenceRadius: '300m', staffAssigned: 48 },
    { id: 'pl3', name: 'Sri City Special Economic Zone', city: 'Tirupati', geofenceRadius: '500m', staffAssigned: 26 },
    { id: 'pl4', name: 'Coimbatore Project Site Camp', city: 'Coimbatore', geofenceRadius: '250m', staffAssigned: 18 }
  ]
};

export const AccountSettings: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Account Data State (in-memory only; authoritative org config belongs to the backend)
  const [accountData, setAccountData] = useState<AccountConfigState>(initialAccountData);

  // Modal Dialogs
  type ModalType = 
    | null 
    | 'branches' 
    | 'dealerships' 
    | 'grade' 
    | 'dashboard' 
    | 'approval' 
    | 'departments' 
    | 'designations' 
    | 'role' 
    | 'projects' 
    | 'postingLocation';

  const [activeModal, setActiveModal] = useState<ModalType>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Temporary Form State for Adding / Editing
  const [formData, setFormData] = useState<any>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const openModal = (type: ModalType) => {
    setActiveModal(type);
    setIsAdding(false);
    setEditingId(null);
    setSearchQuery('');
    setFormData({});
  };

  const closeModal = () => {
    setActiveModal(null);
    setIsAdding(false);
    setEditingId(null);
    setFormData({});
    setIsFullScreen(false);
  };

  // Start Adding
  const handleStartAdd = () => {
    setEditingId(null);
    setIsAdding(true);
    // Initialize default fields based on activeModal
    switch (activeModal) {
      case 'branches':
        setFormData({ name: '', code: `BR-0${accountData.branches.length + 1}`, location: 'Chennai, Tamil Nadu', type: 'Regional Office', active: true });
        break;
      case 'departments':
        setFormData({ name: '', head: '', staffCount: 10, active: true });
        break;
      case 'dealerships':
        setFormData({ name: '', code: `DLR-0${accountData.dealerships.length + 1}`, region: 'Tamil Nadu', contact: '+91 98400 12345', active: true });
        break;
      case 'designations':
        setFormData({ title: '', grade: 'E2', dept: 'Engineering' });
        break;
      case 'grade':
        setFormData({ code: 'E3', title: '', description: '', level: accountData.grades.length + 1 });
        break;
      case 'role':
        setFormData({ name: '', permissions: '', active: true });
        break;
      case 'dashboard':
        setFormData({ name: '', targetRoles: '', active: true });
        break;
      case 'projects':
        setFormData({ name: '', client: '', budget: '₹10.0 Cr', status: 'In Progress (10%)' });
        break;
      case 'approval':
        setFormData({ workflow: '', stages: 'Line Manager -> HR Head', count: 2 });
        break;
      case 'postingLocation':
        setFormData({ name: '', city: 'Chennai', geofenceRadius: '250m', staffAssigned: 10 });
        break;
    }
  };

  // Start Editing
  const handleStartEdit = (item: any) => {
    setIsAdding(false);
    setEditingId(item.id);
    setFormData({ ...item });
  };

  const { 
    addDesignation, 
    canDeleteDepartment, 
    canDeleteDesignation, 
    deleteDepartment, 
    deleteDesignation 
  } = useHRMS();

  // Delete Item
  const handleDeleteItem = (id: string, entityKey: keyof typeof accountData) => {
    const itemToDelete = accountData[entityKey]?.find((it) => it.id === id);
    if (entityKey === 'departments' && itemToDelete) {
      const check = canDeleteDepartment(String(itemToDelete.name || ''));
      if (!check.canDelete) {
        alert(check.reason || 'Cannot delete department in use');
        return;
      }
      deleteDepartment(itemToDelete.id);
    }
    if (entityKey === 'designations' && itemToDelete) {
      const check = canDeleteDesignation(String(itemToDelete.title || ''));
      if (!check.canDelete) {
        alert(check.reason || 'Cannot delete designation in use');
        return;
      }
      deleteDesignation(itemToDelete.id);
    }

    if (confirm('Are you sure you want to delete this record?')) {
      setAccountData((prev: any) => ({
        ...prev,
        [entityKey]: prev[entityKey].filter((it: any) => it.id !== id)
      }));
      showToast('Record deleted successfully');
      if (editingId === id) {
        setEditingId(null);
        setFormData({});
      }
    }
  };

  // Submit Add or Edit
  const handleSubmitForm = (e: React.FormEvent, entityKey: keyof typeof accountData) => {
    e.preventDefault();

    if (isAdding) {
      const newItem = {
        ...formData,
        id: `${String(entityKey).charAt(0)}${Date.now()}`
      };
      if (entityKey === 'designations') {
        addDesignation({
          title: formData.title,
          department: formData.dept || 'Engineering',
          level: formData.grade || 'L3'
        });
      }
      setAccountData((prev: any) => ({
        ...prev,
        [entityKey]: [newItem, ...prev[entityKey]]
      }));
      showToast('New record added successfully!');
      setIsAdding(false);
      setFormData({});
    } else if (editingId) {
      setAccountData((prev: any) => ({
        ...prev,
        [entityKey]: prev[entityKey].map((it: any) => (it.id === editingId ? { ...formData } : it))
      }));
      showToast('Record updated successfully!');
      setEditingId(null);
      setFormData({});
    }
  };

  // Reset to initial defaults
  const handleResetDefaults = () => {
    if (confirm('Reset all account & organizational configurations to default factory values?')) {
      setAccountData(initialAccountData);
      showToast('Default configurations restored');
    }
  };

  // Compute live badges
  const totalStages = accountData.approvalStages.reduce((s: number, a: any) => s + (Number(a.count) || 0), 0);
  const totalStaffInDepts = accountData.departments.reduce((s: number, d: any) => s + (Number(d.staffCount) || 0), 0);

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
          zIndex: 1500,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} color="#0E7490" /> {toastMessage}
        </div>
      )}

      {/* Header & Subtitle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ 
            fontSize: '1.45rem', 
            fontWeight: 800, 
            color: '#0f172a', 
            margin: '0 0 4px 0',
            letterSpacing: '-0.02em'
          }}>
            Account Settings
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', margin: 0, fontWeight: 500 }}>
            Create and Update Your Account Settings
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleResetDefaults}
            style={{
              backgroundColor: '#f8fafc',
              color: '#475569',
              padding: '10px 16px',
              borderRadius: '12px',
              border: '1px solid #cbd5e1',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <RotateCcw size={15} /> Reset Defaults
          </button>
          <button
            onClick={() => {
              showToast('All organizational hierarchies, branches, and roles synchronized!');
            }}
            style={{
              backgroundColor: '#0E7490',
              color: '#ffffff',
              padding: '10px 20px',
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
            <Save size={16} /> Save Account Settings
          </button>
        </div>
      </div>

      {/* 2-COLUMN RESPONSIVE GRID (10 CARDS MATCHING USER SCREENSHOT) */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
        gap: '14px',
        width: '100%',
        boxSizing: 'border-box'
      }}>

        {/* -------------------- ROW 1 -------------------- */}
        {/* Left 1: Branches */}
        <div 
          onClick={() => openModal('branches')}
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#ECFEFF', '#0E7490')}>
            <Building2 size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={cardTitleStyle}>Branches</div>
            <div style={cardSubtextStyle}>
              {accountData.branches.length} Branches Created
              <span style={{ ...pillStyle('#DCFCE7', '#166534'), marginLeft: '8px' }}>Active</span>
            </div>
          </div>
          <span style={{ color: '#0E7490', fontWeight: 800, fontSize: '1.2rem', paddingRight: '4px' }}>»</span>
        </div>

        {/* Right 1: Departments */}
        <div 
          onClick={() => openModal('departments')}
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#EFF6FF', '#2563EB')}>
            <Layers size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={cardTitleStyle}>Departments</div>
            <div style={cardSubtextStyle}>
              {accountData.departments.length} Departments Created
              <span style={{ ...pillStyle('#EFF6FF', '#1D4ED8'), marginLeft: '8px' }}>{totalStaffInDepts} Staff</span>
            </div>
          </div>
          <span style={{ color: '#0E7490', fontWeight: 800, fontSize: '1.2rem', paddingRight: '4px' }}>»</span>
        </div>

        {/* -------------------- ROW 2 -------------------- */}
        {/* Left 2: Dealerships */}
        <div 
          onClick={() => openModal('dealerships')}
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#FEF3C7', '#D97706')}>
            <GitFork size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={cardTitleStyle}>Dealerships</div>
            <div style={cardSubtextStyle}>
              {accountData.dealerships.length} Dealerships Created
              <span style={{ ...pillStyle('#FEF3C7', '#B45309'), marginLeft: '8px' }}>Partners</span>
            </div>
          </div>
          <span style={{ color: '#0E7490', fontWeight: 800, fontSize: '1.2rem', paddingRight: '4px' }}>»</span>
        </div>

        {/* Right 2: Designations */}
        <div 
          onClick={() => openModal('designations')}
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#ECFEFF', '#0891B2')}>
            <UserCheck size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={cardTitleStyle}>Designations</div>
            <div style={cardSubtextStyle}>
              {accountData.designations.length} Designations Created
              <span style={{ ...pillStyle('#ECFEFF', '#0E7490'), marginLeft: '8px' }}>CEO to Trainee</span>
            </div>
          </div>
          <span style={{ color: '#0E7490', fontWeight: 800, fontSize: '1.2rem', paddingRight: '4px' }}>»</span>
        </div>

        {/* -------------------- ROW 3 -------------------- */}
        {/* Left 3: Grade */}
        <div 
          onClick={() => openModal('grade')}
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#FDF2F8', '#DB2777')}>
            <Star size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={cardTitleStyle}>Grade</div>
            <div style={cardSubtextStyle}>
              {accountData.grades.length} Grade Created
              <span style={{ ...pillStyle('#FDF2F8', '#BE185D'), marginLeft: '8px' }}>
                {accountData.grades[0]?.code || 'L1'} to {accountData.grades[accountData.grades.length - 1]?.code || 'E1'}
              </span>
            </div>
          </div>
          <span style={{ color: '#0E7490', fontWeight: 800, fontSize: '1.2rem', paddingRight: '4px' }}>»</span>
        </div>

        {/* Right 3: Role */}
        <div 
          onClick={() => openModal('role')}
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#F0FDF4', '#16A34A')}>
            <ShieldCheck size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={cardTitleStyle}>Role</div>
            <div style={cardSubtextStyle}>
              {accountData.roles.length} Role Created
              <span style={{ ...pillStyle('#DCFCE7', '#166534'), marginLeft: '8px' }}>RBAC</span>
            </div>
          </div>
          <span style={{ color: '#0E7490', fontWeight: 800, fontSize: '1.2rem', paddingRight: '4px' }}>»</span>
        </div>

        {/* -------------------- ROW 4 -------------------- */}
        {/* Left 4: Set Default Dashboard */}
        <div 
          onClick={() => openModal('dashboard')}
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#EDE9FE', '#7C3AED')}>
            <LayoutDashboard size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={cardTitleStyle}>Set Default Dashboard</div>
            <div style={cardSubtextStyle}>
              {accountData.defaultDashboards.length} Default Dashboard
              <span style={{ ...pillStyle('#EDE9FE', '#6D28D9'), marginLeft: '8px' }}>Role-Tailored</span>
            </div>
          </div>
          <span style={{ color: '#0E7490', fontWeight: 800, fontSize: '1.2rem', paddingRight: '4px' }}>»</span>
        </div>

        {/* Right 4: Projects */}
        <div 
          onClick={() => openModal('projects')}
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#EFF6FF', '#2563EB')}>
            <Folder size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={cardTitleStyle}>Projects</div>
            <div style={cardSubtextStyle}>
              {accountData.projects.length} Projects
              <span style={{ ...pillStyle('#EFF6FF', '#1E40AF'), marginLeft: '8px' }}>₹84.7 Cr Total</span>
            </div>
          </div>
          <span style={{ color: '#0E7490', fontWeight: 800, fontSize: '1.2rem', paddingRight: '4px' }}>»</span>
        </div>

        {/* -------------------- ROW 5 -------------------- */}
        {/* Left 5: Approval Stage */}
        <div 
          onClick={() => openModal('approval')}
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#F0FDF4', '#16A34A')}>
            <CheckCircle2 size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={cardTitleStyle}>Approval Stage</div>
            <div style={cardSubtextStyle}>
              {totalStages} Stage
              <span style={{ ...pillStyle('#DCFCE7', '#166534'), marginLeft: '8px' }}>{accountData.approvalStages.length} Workflows</span>
            </div>
          </div>
          <span style={{ color: '#0E7490', fontWeight: 800, fontSize: '1.2rem', paddingRight: '4px' }}>»</span>
        </div>

        {/* Right 5: Posting Location */}
        <div 
          onClick={() => openModal('postingLocation')}
          style={cardStyle}
          onMouseEnter={handleCardHover}
          onMouseLeave={handleCardLeave}
        >
          <div style={iconBadgeStyle('#FEF3C7', '#D97706')}>
            <MapPin size={22} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={cardTitleStyle}>Posting Location</div>
            <div style={cardSubtextStyle}>
              {accountData.postingLocations.length} Locations Created
              <span style={{ ...pillStyle('#FEF3C7', '#B45309'), marginLeft: '8px' }}>Geofenced</span>
            </div>
          </div>
          <span style={{ color: '#0E7490', fontWeight: 800, fontSize: '1.2rem', paddingRight: '4px' }}>»</span>
        </div>

      </div>

      {/* FULL SCREEN / WIDE MODAL WITH COMPLETE ADD & EDIT FUNCTIONALITY */}
      {activeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: isFullScreen ? 'stretch' : 'center',
          justifyContent: isFullScreen ? 'stretch' : 'center',
          zIndex: 1400,
          padding: isFullScreen ? '0' : '20px',
          transition: 'all 0.2s ease'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: isFullScreen ? '0' : '20px',
            width: isFullScreen ? '100vw' : '96vw',
            maxWidth: isFullScreen ? '100vw' : '1100px',
            height: isFullScreen ? '100vh' : '92vh',
            maxHeight: isFullScreen ? '100vh' : '92vh',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            border: isFullScreen ? 'none' : '1px solid #e2e8f0',
            overflow: 'hidden',
            transition: 'all 0.2s ease'
          }}>
            {/* Modal Top Header Bar */}
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              padding: '18px 24px', 
              borderBottom: '1px solid #f1f5f9',
              backgroundColor: '#f8fafc'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '42px', height: '42px', borderRadius: '12px', backgroundColor: '#ECFEFF', color: '#0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeModal === 'branches' && <Building2 size={24} />}
                  {activeModal === 'departments' && <Layers size={24} />}
                  {activeModal === 'dealerships' && <GitFork size={24} />}
                  {activeModal === 'designations' && <UserCheck size={24} />}
                  {activeModal === 'grade' && <Star size={24} />}
                  {activeModal === 'role' && <ShieldCheck size={24} />}
                  {activeModal === 'dashboard' && <LayoutDashboard size={24} />}
                  {activeModal === 'projects' && <Folder size={24} />}
                  {activeModal === 'approval' && <CheckCircle2 size={24} />}
                  {activeModal === 'postingLocation' && <MapPin size={24} />}
                </div>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {activeModal === 'branches' && 'Manage Corporate Branches'}
                    {activeModal === 'departments' && 'Manage Enterprise Departments'}
                    {activeModal === 'dealerships' && 'Manage Authorized Dealerships'}
                    {activeModal === 'designations' && 'Manage Staff Designations'}
                    {activeModal === 'grade' && 'Employee Grade & Pay Scale Structure'}
                    {activeModal === 'role' && 'RBAC System Roles & Permissions'}
                    {activeModal === 'dashboard' && 'Set Default Landing Dashboard by Role'}
                    {activeModal === 'projects' && 'Active Construction & Infrastructure Projects'}
                    {activeModal === 'approval' && 'Multi-Stage Approval Workflows'}
                    {activeModal === 'postingLocation' && 'Authorized Posting Locations & Geofences'}
                  </h3>
                  <p style={{ fontSize: '0.82rem', color: '#64748b', margin: '2px 0 0 0' }}>
                    Configure, add new records, and edit organizational structures with real-time sync
                  </p>
                </div>
              </div>

              {/* Header Right Actions: Add Button + Fullscreen Toggle + Close */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleStartAdd}
                  style={{
                    backgroundColor: '#0E7490',
                    color: '#ffffff',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    boxShadow: '0 2px 8px rgba(14, 116, 144, 0.25)'
                  }}
                >
                  <Plus size={16} /> Add New
                </button>

                {/* Full-Screen Toggle Button */}
                <button
                  type="button"
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  title={isFullScreen ? 'Exit Full Screen' : 'View Full Screen'}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    color: '#334155',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                  onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#ffffff')}
                >
                  {isFullScreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={closeModal}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    color: '#64748b',
                    padding: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  onMouseOver={(e) => (e.currentTarget.style.color = '#ef4444')}
                  onMouseOut={(e) => (e.currentTarget.style.color = '#64748b')}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body Container */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '24px', backgroundColor: '#ffffff' }}>
              
              {/* Search & Filter Bar */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', gap: '14px', flexWrap: 'wrap' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '420px' }}>
                  <Search size={16} color="#94a3b8" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                  <input 
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Quick search records..."
                    style={{
                      width: '100%',
                      padding: '10px 14px 10px 38px',
                      borderRadius: '10px',
                      border: '1px solid #e2e8f0',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => (e.target.style.borderColor = '#0E7490')}
                    onBlur={(e) => (e.target.style.borderColor = '#e2e8f0')}
                  />
                </div>

                <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 600 }}>
                  Showing {
                    activeModal === 'branches' ? accountData.branches.length :
                    activeModal === 'departments' ? accountData.departments.length :
                    activeModal === 'dealerships' ? accountData.dealerships.length :
                    activeModal === 'designations' ? accountData.designations.length :
                    activeModal === 'grade' ? accountData.grades.length :
                    activeModal === 'role' ? accountData.roles.length :
                    activeModal === 'dashboard' ? accountData.defaultDashboards.length :
                    activeModal === 'projects' ? accountData.projects.length :
                    activeModal === 'approval' ? accountData.approvalStages.length :
                    accountData.postingLocations.length
                  } Total Records
                </div>
              </div>

              {/* INLINE ADD / EDIT FORM (When isAdding or editingId is active) */}
              {(isAdding || editingId) && (
                <div style={{
                  backgroundColor: '#f8fafc',
                  border: '2px solid #0E7490',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '24px',
                  boxShadow: '0 4px 14px rgba(14, 116, 144, 0.08)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0E7490', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {isAdding ? <Plus size={18} /> : <Edit2 size={18} />}
                      {isAdding ? 'Add New Record' : 'Edit Existing Record'}
                    </div>
                    <button
                      type="button"
                      onClick={() => { setIsAdding(false); setEditingId(null); setFormData({}); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* 1. BRANCHES FORM */}
                  {activeModal === 'branches' && (
                    <form onSubmit={(e) => handleSubmitForm(e, 'branches')}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                        <div>
                          <label style={formLabelStyle}>Branch / Facility Name</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.name || ''} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            placeholder="e.g. Madhavaram Central Facility" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Branch Code</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.code || ''} 
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
                            placeholder="e.g. BR-05" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>City / Location</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.location || ''} 
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })} 
                            placeholder="e.g. Chennai, Tamil Nadu" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Branch Type</label>
                          <select 
                            value={formData.type || 'Headquarters'} 
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })} 
                            style={formInputStyle}
                          >
                            <option value="Headquarters">Headquarters</option>
                            <option value="Manufacturing Plant">Manufacturing Plant</option>
                            <option value="Project Site">Project Site</option>
                            <option value="Regional Office">Regional Office</option>
                            <option value="Warehouse / Logistics">Warehouse / Logistics</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} style={cancelBtnStyle}>Cancel</button>
                        <button type="submit" style={saveBtnStyle}>{isAdding ? 'Create Branch' : 'Save Changes'}</button>
                      </div>
                    </form>
                  )}

                  {/* 2. DEPARTMENTS FORM */}
                  {activeModal === 'departments' && (
                    <form onSubmit={(e) => handleSubmitForm(e, 'departments')}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                        <div>
                          <label style={formLabelStyle}>Department Name</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.name || ''} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            placeholder="e.g. Structural Engineering" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Head of Department (HOD)</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.head || ''} 
                            onChange={(e) => setFormData({ ...formData, head: e.target.value })} 
                            placeholder="e.g. Er. R. Sundararajan" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Assigned Staff Count</label>
                          <input 
                            required 
                            type="number" 
                            value={formData.staffCount || ''} 
                            onChange={(e) => setFormData({ ...formData, staffCount: Number(e.target.value) })} 
                            placeholder="e.g. 25" 
                            style={formInputStyle} 
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} style={cancelBtnStyle}>Cancel</button>
                        <button type="submit" style={saveBtnStyle}>{isAdding ? 'Create Department' : 'Save Changes'}</button>
                      </div>
                    </form>
                  )}

                  {/* 3. DEALERSHIPS FORM */}
                  {activeModal === 'dealerships' && (
                    <form onSubmit={(e) => handleSubmitForm(e, 'dealerships')}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                        <div>
                          <label style={formLabelStyle}>Channel Partner / Dealer Name</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.name || ''} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            placeholder="e.g. VRM Steel Authorized Partner" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Dealer Code</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.code || ''} 
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
                            placeholder="e.g. DLR-SOUTH-02" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Authorized Region</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.region || ''} 
                            onChange={(e) => setFormData({ ...formData, region: e.target.value })} 
                            placeholder="e.g. Southern Zone (TN & AP)" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Contact Number</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.contact || ''} 
                            onChange={(e) => setFormData({ ...formData, contact: e.target.value })} 
                            placeholder="e.g. +91 44 2553 7890" 
                            style={formInputStyle} 
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} style={cancelBtnStyle}>Cancel</button>
                        <button type="submit" style={saveBtnStyle}>{isAdding ? 'Create Dealer' : 'Save Changes'}</button>
                      </div>
                    </form>
                  )}

                  {/* 4. DESIGNATIONS FORM */}
                  {activeModal === 'designations' && (
                    <form onSubmit={(e) => handleSubmitForm(e, 'designations')}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                        <div>
                          <label style={formLabelStyle}>Designation Title</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.title || ''} 
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                            placeholder="e.g. Senior Structural Engineer" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Grade Band</label>
                          <select 
                            value={formData.grade || 'M2'} 
                            onChange={(e) => setFormData({ ...formData, grade: e.target.value })} 
                            style={formInputStyle}
                          >
                            <option value="L1">L1 - Executive Leadership</option>
                            <option value="M2">M2 - Senior Project Management</option>
                            <option value="M1">M1 - Middle Management</option>
                            <option value="E2">E2 - Senior Technical Officer</option>
                            <option value="E1">E1 - Entry Professional / Trainee</option>
                          </select>
                        </div>
                        <div>
                          <label style={formLabelStyle}>Department</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.dept || ''} 
                            onChange={(e) => setFormData({ ...formData, dept: e.target.value })} 
                            placeholder="e.g. Engineering" 
                            style={formInputStyle} 
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} style={cancelBtnStyle}>Cancel</button>
                        <button type="submit" style={saveBtnStyle}>{isAdding ? 'Create Designation' : 'Save Changes'}</button>
                      </div>
                    </form>
                  )}

                  {/* 5. GRADE FORM */}
                  {activeModal === 'grade' && (
                    <form onSubmit={(e) => handleSubmitForm(e, 'grade')}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                        <div>
                          <label style={formLabelStyle}>Grade Code</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.code || ''} 
                            onChange={(e) => setFormData({ ...formData, code: e.target.value })} 
                            placeholder="e.g. L2 or M3" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Grade Title</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.title || ''} 
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })} 
                            placeholder="e.g. Associate Director" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Hierarchy Level (1=Highest)</label>
                          <input 
                            required 
                            type="number" 
                            value={formData.level || 1} 
                            onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })} 
                            placeholder="1" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Cadres / Descriptions</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.description || ''} 
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })} 
                            placeholder="e.g. Director, VP, General Manager" 
                            style={formInputStyle} 
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} style={cancelBtnStyle}>Cancel</button>
                        <button type="submit" style={saveBtnStyle}>{isAdding ? 'Create Grade' : 'Save Changes'}</button>
                      </div>
                    </form>
                  )}

                  {/* 6. ROLE FORM */}
                  {activeModal === 'role' && (
                    <form onSubmit={(e) => handleSubmitForm(e, 'role')}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                        <div>
                          <label style={formLabelStyle}>Role Name</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.name || ''} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            placeholder="e.g. Quality Auditor" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={formLabelStyle}>Permissions Scope & Description</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.permissions || ''} 
                            onChange={(e) => setFormData({ ...formData, permissions: e.target.value })} 
                            placeholder="e.g. Quality Inspection, NCR Reports, Site Auditing" 
                            style={formInputStyle} 
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} style={cancelBtnStyle}>Cancel</button>
                        <button type="submit" style={saveBtnStyle}>{isAdding ? 'Create Role' : 'Save Changes'}</button>
                      </div>
                    </form>
                  )}

                  {/* 7. DASHBOARD FORM */}
                  {activeModal === 'dashboard' && (
                    <form onSubmit={(e) => handleSubmitForm(e, 'defaultDashboards')}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                        <div>
                          <label style={formLabelStyle}>Dashboard View Name</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.name || ''} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            placeholder="e.g. Site Quality & Operations Hub" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                          <label style={formLabelStyle}>Target User Roles</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.targetRoles || ''} 
                            onChange={(e) => setFormData({ ...formData, targetRoles: e.target.value })} 
                            placeholder="e.g. Site Engineers, Supervisors, Plant Officers" 
                            style={formInputStyle} 
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} style={cancelBtnStyle}>Cancel</button>
                        <button type="submit" style={saveBtnStyle}>{isAdding ? 'Create Dashboard' : 'Save Changes'}</button>
                      </div>
                    </form>
                  )}

                  {/* 8. PROJECTS FORM */}
                  {activeModal === 'projects' && (
                    <form onSubmit={(e) => handleSubmitForm(e, 'projects')}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                        <div>
                          <label style={formLabelStyle}>Project Name</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.name || ''} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            placeholder="e.g. Metro Elevated Station Package 2" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Client / Authority</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.client || ''} 
                            onChange={(e) => setFormData({ ...formData, client: e.target.value })} 
                            placeholder="e.g. Chennai Metro Rail Corp (CMRL)" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Project Budget / Value</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.budget || ''} 
                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })} 
                            placeholder="e.g. ₹35.0 Cr" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Current Execution Status</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.status || ''} 
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })} 
                            placeholder="e.g. In Progress (65%)" 
                            style={formInputStyle} 
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} style={cancelBtnStyle}>Cancel</button>
                        <button type="submit" style={saveBtnStyle}>{isAdding ? 'Create Project' : 'Save Changes'}</button>
                      </div>
                    </form>
                  )}

                  {/* 9. APPROVAL STAGE FORM */}
                  {activeModal === 'approval' && (
                    <form onSubmit={(e) => handleSubmitForm(e, 'approvalStages')}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                        <div>
                          <label style={formLabelStyle}>Workflow Name</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.workflow || ''} 
                            onChange={(e) => setFormData({ ...formData, workflow: e.target.value })} 
                            placeholder="e.g. Travel Advance & Per Diem" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Approval Hierarchy Flow</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.stages || ''} 
                            onChange={(e) => setFormData({ ...formData, stages: e.target.value })} 
                            placeholder="e.g. Reporting Officer -> Accounts Head -> Director" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Total Number of Stages</label>
                          <input 
                            required 
                            type="number" 
                            value={formData.count || 2} 
                            onChange={(e) => setFormData({ ...formData, count: Number(e.target.value) })} 
                            placeholder="3" 
                            style={formInputStyle} 
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} style={cancelBtnStyle}>Cancel</button>
                        <button type="submit" style={saveBtnStyle}>{isAdding ? 'Create Workflow' : 'Save Changes'}</button>
                      </div>
                    </form>
                  )}

                  {/* 10. POSTING LOCATION FORM */}
                  {activeModal === 'postingLocation' && (
                    <form onSubmit={(e) => handleSubmitForm(e, 'postingLocations')}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px', marginBottom: '16px' }}>
                        <div>
                          <label style={formLabelStyle}>Posting Location Name</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.name || ''} 
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                            placeholder="e.g. Sri City Project Site Unit 2" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>City / Region</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.city || ''} 
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })} 
                            placeholder="e.g. Tirupati" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Geofence Punch Radius</label>
                          <input 
                            required 
                            type="text" 
                            value={formData.geofenceRadius || ''} 
                            onChange={(e) => setFormData({ ...formData, geofenceRadius: e.target.value })} 
                            placeholder="e.g. 300m" 
                            style={formInputStyle} 
                          />
                        </div>
                        <div>
                          <label style={formLabelStyle}>Assigned Staff</label>
                          <input 
                            required 
                            type="number" 
                            value={formData.staffAssigned || 10} 
                            onChange={(e) => setFormData({ ...formData, staffAssigned: Number(e.target.value) })} 
                            placeholder="20" 
                            style={formInputStyle} 
                          />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => { setIsAdding(false); setEditingId(null); }} style={cancelBtnStyle}>Cancel</button>
                        <button type="submit" style={saveBtnStyle}>{isAdding ? 'Create Location' : 'Save Changes'}</button>
                      </div>
                    </form>
                  )}

                </div>
              )}

              {/* LIST / TABLE VIEW FOR CURRENT MODAL */}

              {/* 1. BRANCHES LIST */}
              {activeModal === 'branches' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {accountData.branches
                    .filter((b: any) => b.name.toLowerCase().includes(searchQuery.toLowerCase()) || b.code.toLowerCase().includes(searchQuery.toLowerCase()) || b.location.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((br: any) => (
                      <div key={br.id} style={listItemContainerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ECFEFF', color: '#0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Building2 size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{br.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                              Code: <span style={{ fontWeight: 600, color: '#334155' }}>{br.code}</span> • Location: {br.location}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={pillStyle('#DCFCE7', '#166534')}>{br.type}</span>
                          <button 
                            type="button"
                            onClick={() => handleStartEdit(br)}
                            title="Edit Branch"
                            style={iconActionBtnStyle('#0E7490', '#ECFEFF')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteItem(br.id, 'branches')}
                            title="Delete Branch"
                            style={iconActionBtnStyle('#EF4444', '#FEE2E2')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 2. DEPARTMENTS LIST */}
              {activeModal === 'departments' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {accountData.departments
                    .filter((dp: any) => dp.name.toLowerCase().includes(searchQuery.toLowerCase()) || dp.head.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((dp: any) => (
                      <div key={dp.id} style={listItemContainerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Layers size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{dp.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                              HOD: <span style={{ fontWeight: 600, color: '#334155' }}>{dp.head}</span> • Staff Assigned: {dp.staffCount}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={pillStyle('#EFF6FF', '#1D4ED8')}>{dp.staffCount} Staff</span>
                          <button 
                            type="button"
                            onClick={() => handleStartEdit(dp)}
                            title="Edit Department"
                            style={iconActionBtnStyle('#0E7490', '#ECFEFF')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteItem(dp.id, 'departments')}
                            title="Delete Department"
                            style={iconActionBtnStyle('#EF4444', '#FEE2E2')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 3. DEALERSHIPS LIST */}
              {activeModal === 'dealerships' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {accountData.dealerships
                    .filter((dl: any) => dl.name.toLowerCase().includes(searchQuery.toLowerCase()) || dl.region.toLowerCase().includes(searchQuery.toLowerCase()) || dl.code.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((dl: any) => (
                      <div key={dl.id} style={listItemContainerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <GitFork size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{dl.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                              Code: <span style={{ fontWeight: 600, color: '#334155' }}>{dl.code}</span> • Region: {dl.region} • Contact: {dl.contact}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={pillStyle('#FEF3C7', '#B45309')}>Channel Partner</span>
                          <button 
                            type="button"
                            onClick={() => handleStartEdit(dl)}
                            title="Edit Dealership"
                            style={iconActionBtnStyle('#0E7490', '#ECFEFF')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteItem(dl.id, 'dealerships')}
                            title="Delete Dealership"
                            style={iconActionBtnStyle('#EF4444', '#FEE2E2')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 4. DESIGNATIONS LIST */}
              {activeModal === 'designations' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {accountData.designations
                    .filter((ds: any) => ds.title.toLowerCase().includes(searchQuery.toLowerCase()) || ds.dept.toLowerCase().includes(searchQuery.toLowerCase()) || ds.grade.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((ds: any) => (
                      <div key={ds.id} style={listItemContainerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#ECFEFF', color: '#0891B2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <UserCheck size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{ds.title}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                              Department: <span style={{ fontWeight: 600, color: '#334155' }}>{ds.dept}</span>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={pillStyle('#ECFEFF', '#0E7490')}>Grade {ds.grade}</span>
                          <button 
                            type="button"
                            onClick={() => handleStartEdit(ds)}
                            title="Edit Designation"
                            style={iconActionBtnStyle('#0E7490', '#ECFEFF')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteItem(ds.id, 'designations')}
                            title="Delete Designation"
                            style={iconActionBtnStyle('#EF4444', '#FEE2E2')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 5. GRADE LIST */}
              {activeModal === 'grade' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {accountData.grades
                    .filter((g: any) => g.code.toLowerCase().includes(searchQuery.toLowerCase()) || g.title.toLowerCase().includes(searchQuery.toLowerCase()) || g.description.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((g: any) => (
                      <div key={g.id} style={listItemContainerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FDF2F8', color: '#DB2777', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Star size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{g.code} — {g.title}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                              Cadres: {g.description}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={pillStyle('#FDF2F8', '#BE185D')}>Level {g.level}</span>
                          <button 
                            type="button"
                            onClick={() => handleStartEdit(g)}
                            title="Edit Grade"
                            style={iconActionBtnStyle('#0E7490', '#ECFEFF')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteItem(g.id, 'grades')}
                            title="Delete Grade"
                            style={iconActionBtnStyle('#EF4444', '#FEE2E2')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 6. ROLE LIST */}
              {activeModal === 'role' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {accountData.roles
                    .filter((r: any) => r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.permissions.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((r: any) => (
                      <div key={r.id} style={listItemContainerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <ShieldCheck size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{r.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                              Privileges: {r.permissions}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={pillStyle('#DCFCE7', '#166534')}>Active RBAC</span>
                          <button 
                            type="button"
                            onClick={() => handleStartEdit(r)}
                            title="Edit Role"
                            style={iconActionBtnStyle('#0E7490', '#ECFEFF')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteItem(r.id, 'roles')}
                            title="Delete Role"
                            style={iconActionBtnStyle('#EF4444', '#FEE2E2')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 7. DASHBOARD LIST */}
              {activeModal === 'dashboard' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {accountData.defaultDashboards
                    .filter((dd: any) => dd.name.toLowerCase().includes(searchQuery.toLowerCase()) || dd.targetRoles.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((dd: any) => (
                      <div key={dd.id} style={listItemContainerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EDE9FE', color: '#7C3AED', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <LayoutDashboard size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{dd.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                              Assigned Roles: {dd.targetRoles}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={pillStyle('#EDE9FE', '#6D28D9')}>Default</span>
                          <button 
                            type="button"
                            onClick={() => handleStartEdit(dd)}
                            title="Edit Dashboard"
                            style={iconActionBtnStyle('#0E7490', '#ECFEFF')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteItem(dd.id, 'defaultDashboards')}
                            title="Delete Dashboard"
                            style={iconActionBtnStyle('#EF4444', '#FEE2E2')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 8. PROJECTS LIST */}
              {activeModal === 'projects' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {accountData.projects
                    .filter((pj: any) => pj.name.toLowerCase().includes(searchQuery.toLowerCase()) || pj.client.toLowerCase().includes(searchQuery.toLowerCase()) || pj.status.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((pj: any) => (
                      <div key={pj.id} style={listItemContainerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <Folder size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{pj.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                              Client: <span style={{ fontWeight: 600, color: '#334155' }}>{pj.client}</span> • Outlay: {pj.budget}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={pillStyle('#EFF6FF', '#1E40AF')}>{pj.status}</span>
                          <button 
                            type="button"
                            onClick={() => handleStartEdit(pj)}
                            title="Edit Project"
                            style={iconActionBtnStyle('#0E7490', '#ECFEFF')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteItem(pj.id, 'projects')}
                            title="Delete Project"
                            style={iconActionBtnStyle('#EF4444', '#FEE2E2')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 9. APPROVAL STAGES LIST */}
              {activeModal === 'approval' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {accountData.approvalStages
                    .filter((as: any) => as.workflow.toLowerCase().includes(searchQuery.toLowerCase()) || as.stages.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((as: any) => (
                      <div key={as.id} style={listItemContainerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#F0FDF4', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <CheckCircle2 size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{as.workflow}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                              Pipeline: {as.stages}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={pillStyle('#DCFCE7', '#166534')}>{as.count} Stages</span>
                          <button 
                            type="button"
                            onClick={() => handleStartEdit(as)}
                            title="Edit Workflow"
                            style={iconActionBtnStyle('#0E7490', '#ECFEFF')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteItem(as.id, 'approvalStages')}
                            title="Delete Workflow"
                            style={iconActionBtnStyle('#EF4444', '#FEE2E2')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* 10. POSTING LOCATIONS LIST */}
              {activeModal === 'postingLocation' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {accountData.postingLocations
                    .filter((pl: any) => pl.name.toLowerCase().includes(searchQuery.toLowerCase()) || pl.city.toLowerCase().includes(searchQuery.toLowerCase()) || pl.geofenceRadius.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((pl: any) => (
                      <div key={pl.id} style={listItemContainerStyle}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                          <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: '#FEF3C7', color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <MapPin size={20} />
                          </div>
                          <div>
                            <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>{pl.name}</div>
                            <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '2px' }}>
                              City: <span style={{ fontWeight: 600, color: '#334155' }}>{pl.city}</span> • Geofence Radius: {pl.geofenceRadius}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <span style={pillStyle('#FEF3C7', '#B45309')}>{pl.staffAssigned} Staff</span>
                          <button 
                            type="button"
                            onClick={() => handleStartEdit(pl)}
                            title="Edit Location"
                            style={iconActionBtnStyle('#0E7490', '#ECFEFF')}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => handleDeleteItem(pl.id, 'postingLocations')}
                            title="Delete Location"
                            style={iconActionBtnStyle('#EF4444', '#FEE2E2')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              )}

            </div>

            {/* Modal Bottom Bar */}
            <div style={{ 
              padding: '14px 24px', 
              borderTop: '1px solid #f1f5f9', 
              backgroundColor: '#f8fafc',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ fontSize: '0.82rem', color: '#64748b' }}>
                Tip: Click <b>Edit (✏️)</b> to alter values, <b>+ Add New</b> to create records, or toggle <b>Full Screen</b> for expanded view.
              </div>
              <button
                type="button"
                onClick={closeModal}
                style={{
                  padding: '9px 20px',
                  borderRadius: '10px',
                  border: '1px solid #cbd5e1',
                  backgroundColor: '#ffffff',
                  color: '#334155',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

// Styling Constants strictly adhering to VRM Enterprise HRM Design System
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

const cardTitleStyle: React.CSSProperties = {
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

const cardSubtextStyle: React.CSSProperties = {
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

const listItemContainerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '12px 16px',
  backgroundColor: '#f8fafc',
  borderRadius: '12px',
  border: '1px solid #e2e8f0',
  transition: 'all 0.15s ease'
};

const iconActionBtnStyle = (color: string, bg: string): React.CSSProperties => ({
  backgroundColor: bg,
  color: color,
  border: 'none',
  borderRadius: '8px',
  width: '34px',
  height: '34px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.15s ease'
});

const formLabelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.8rem',
  fontWeight: 700,
  color: '#475569',
  marginBottom: '6px'
};

const formInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  fontSize: '0.88rem',
  color: '#1e293b',
  backgroundColor: '#ffffff',
  outline: 'none',
  boxSizing: 'border-box'
};

const cancelBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
  borderRadius: '10px',
  border: '1px solid #cbd5e1',
  backgroundColor: '#ffffff',
  color: '#475569',
  fontSize: '0.85rem',
  fontWeight: 700,
  cursor: 'pointer'
};

const saveBtnStyle: React.CSSProperties = {
  padding: '8px 20px',
  borderRadius: '10px',
  border: 'none',
  backgroundColor: '#0E7490',
  color: '#ffffff',
  fontSize: '0.85rem',
  fontWeight: 700,
  cursor: 'pointer',
  boxShadow: '0 2px 8px rgba(14, 116, 144, 0.25)'
};

export default AccountSettings;
