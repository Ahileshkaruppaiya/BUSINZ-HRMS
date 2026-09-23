import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  Laptop, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Save, 
  X, 
  ShieldCheck, 
  Tag, 
  AlertCircle 
} from 'lucide-react';

export const AssetSettings: React.FC = () => {
  const { assets } = useHRMS();

  const [activeTab, setActiveTab] = useState<'categories' | 'statuses' | 'conditions' | 'rules'>('categories');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Asset Categories
  const [categories, setCategories] = useState([
    { id: 'ac1', name: 'Laptops & Engineering Workstations', code: 'IT-LAP', count: assets.filter(a => a.category.includes('Laptop')).length, status: 'Active' },
    { id: 'ac2', name: 'Mobile Devices & Field Tablets', code: 'MOB-TAB', count: assets.filter(a => a.category.includes('Mobile')).length, status: 'Active' },
    { id: 'ac3', name: 'Heavy Machinery & Fabrication Tools', code: 'HEAVY-EQ', count: 18, status: 'Active' },
    { id: 'ac4', name: 'Survey Equipment & Total Stations', code: 'SURV-INST', count: 6, status: 'Active' },
    { id: 'ac5', name: 'Personal Protective Equipment (PPE)', code: 'PPE-GEAR', count: 120, status: 'Active' }
  ]);

  // Asset Statuses
  const [statuses] = useState([
    { status: 'Available in Store', color: '#166534', bg: '#DCFCE7', desc: 'In central inventory ready for employee allocation' },
    { status: 'Assigned to Employee', color: '#0E7490', bg: '#ECFEFF', desc: 'Currently deployed with active custodian staff' },
    { status: 'Under Maintenance', color: '#854D0E', bg: '#FEF9C3', desc: 'Sent for factory calibration or workshop repair' },
    { status: 'Scrapped', color: '#991B1B', bg: '#FEE2E2', desc: 'Decommissioned following end-of-life inspection' },
    { status: 'Lost / Damaged', color: '#7F1D1D', bg: '#FEE2E2', desc: 'Reported missing or damaged during transit' }
  ]);

  const [assignmentRules, setAssignmentRules] = useState({
    requireSerialTracking: true,
    blockEmployeeDeletionIfAssetHeld: true,
    requireDepartmentHeadApproval: true,
    maximumLaptopsPerStaff: 1,
    annualPhysicalAuditMonth: 'November'
  });

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSaveRules = (e: React.FormEvent) => {
    e.preventDefault();
    triggerToast('Asset assignment and return policies saved');
  };

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
          { id: 'categories', label: `Asset Categories (${categories.length})`, icon: Tag },
          { id: 'statuses', label: `Statuses (${statuses.length})`, icon: ShieldCheck },
          { id: 'rules', label: 'Assignment & Return Rules', icon: Laptop }
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

      {/* TAB: CATEGORIES */}
      {activeTab === 'categories' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Corporate Asset Categories</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px' }}>Equipment classifications tracked in central registry and assigned to employees</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {categories.map(cat => (
              <div key={cat.id} style={{ padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                <span style={{ backgroundColor: '#ECFEFF', color: '#0E7490', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800, display: 'inline-block', marginBottom: '8px' }}>
                  {cat.code}
                </span>
                <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>{cat.name}</h4>
                <div style={{ fontSize: '0.82rem', color: '#64748B' }}>{cat.count} Registered Assets</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: STATUSES */}
      {activeTab === 'statuses' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Asset Operational Statuses</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px' }}>Lifecycle states governing asset availability, warranty claim, and decommissioning</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {statuses.map(st => (
              <div key={st.status} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                <span style={{ backgroundColor: st.bg, color: st.color, padding: '4px 10px', borderRadius: '9999px', fontSize: '0.78rem', fontWeight: 800, display: 'inline-block', marginBottom: '8px' }}>
                  {st.status}
                </span>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#64748B' }}>{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: RULES */}
      {activeTab === 'rules' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Assignment & Return Enforcement Policies</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 24px' }}>Referential safeguards preventing missing company equipment during offboarding</p>

          <form onSubmit={handleSaveRules} style={{ maxWidth: '650px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: '#1E293B' }}>Strict Deletion Guard</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>Prevent deleting an employee record if any asset is currently allocated</p>
              </div>
              <input
                type="checkbox"
                checked={assignmentRules.blockEmployeeDeletionIfAssetHeld}
                onChange={e => setAssignmentRules({ ...assignmentRules, blockEmployeeDeletionIfAssetHeld: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#0E7490' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.92rem', fontWeight: 700, color: '#1E293B' }}>Mandatory Serial Number Tracking</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>Hardware serial number or IMEI required before asset issuance sign-off</p>
              </div>
              <input
                type="checkbox"
                checked={assignmentRules.requireSerialTracking}
                onChange={e => setAssignmentRules({ ...assignmentRules, requireSerialTracking: e.target.checked })}
                style={{ width: '20px', height: '20px', accentColor: '#0E7490' }}
              />
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
                padding: '11px 24px',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: 'pointer',
                alignSelf: 'flex-start'
              }}
            >
              <Save size={16} />
              <span>Save Asset Policies</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
export default AssetSettings;
