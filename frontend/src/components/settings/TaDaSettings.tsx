import React, { useState } from 'react';
import { 
  MapPin, 
  Car, 
  Fuel, 
  Hotel, 
  Coffee, 
  Receipt, 
  CheckCircle2, 
  Save, 
  FileText, 
  AlertCircle,
  HelpCircle,
  Train,
  Plane
} from 'lucide-react';

const ToggleSwitch: React.FC<{ checked: boolean; onChange: (val: boolean) => void }> = ({ checked, onChange }) => {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: '46px',
        height: '24px',
        borderRadius: '99px',
        backgroundColor: checked ? '#0E7490' : '#94a3b8',
        padding: '2px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        display: 'inline-flex',
        alignItems: 'center',
        position: 'relative',
        flexShrink: 0
      }}
    >
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#ffffff',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transform: checked ? 'translateX(22px)' : 'translateX(0px)',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      />
    </div>
  );
};

export const TaDaSettings: React.FC = () => {
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // TA Mileage Rates
  const [rates, setRates] = useState({
    twoWheelerRate: 4.5,
    fourWheelerRate: 10.0,
    taxiActualCap: 16.0,
    busAutoRate: 8.0,

    // DA Food & Incidentals per day
    daTier1Metro: 800,
    daTier2City: 600,
    daTier3Site: 450,

    // Hotel / Lodging Caps per night
    hotelTier1Metro: 3500,
    hotelTier2City: 2200,
    hotelTier3Site: 1500,

    // Policies
    submissionDaysLimit: 15,
    receiptRequiredAbove: 200,
    autoApprovalLimit: 500,
    requireAdvanceForOutstation: true,
    gpsDistanceVerification: true
  });

  const handleRateChange = (key: keyof typeof rates, val: number | boolean) => {
    setRates(prev => ({ ...prev, [key]: val }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setToastMessage('Travel Allowance (TA) & Dearness Allowance (DA) slabs updated successfully!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', fontFamily: 'var(--font-primary)' }}>
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
          zIndex: 1200,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={18} color="#0E7490" /> {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#0f172a', margin: 0, letterSpacing: '-0.02em' }}>
            TA & DA Settings
          </h2>
          <p style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '4px', margin: 0 }}>
            Configure Travel Allowance (mileage rates per KM), Dearness Allowance (city tier slabs), and hotel limits
          </p>
        </div>
        <button
          onClick={handleSave}
          style={{
            backgroundColor: '#0E7490',
            color: '#ffffff',
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.9rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 12px rgba(14, 116, 144, 0.25)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = '#0891b2')}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = '#0E7490')}
        >
          <Save size={16} /> Save Changes
        </button>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Card 1: TA - Travel Mileage Rates */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#ECFEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0E7490' }}>
              <Fuel size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Travel Allowance (TA) - Per Kilometer Reimbursement
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Fuel and vehicle maintenance reimbursement rates for client and site visits</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🏍️</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>Two-Wheeler / Bike</span>
              </div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginBottom: '6px' }}>
                Rate per Kilometer
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: '#0E7490', fontSize: '1.05rem' }}>₹</span>
                <input
                  type="number"
                  step="0.5"
                  value={rates.twoWheelerRate}
                  onChange={(e) => handleRateChange('twoWheelerRate', Number(e.target.value))}
                  style={{ width: '90px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.95rem' }}
                />
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>/ km</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🚗</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>Four-Wheeler / Car</span>
              </div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginBottom: '6px' }}>
                Rate per Kilometer
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: '#0E7490', fontSize: '1.05rem' }}>₹</span>
                <input
                  type="number"
                  step="0.5"
                  value={rates.fourWheelerRate}
                  onChange={(e) => handleRateChange('fourWheelerRate', Number(e.target.value))}
                  style={{ width: '90px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.95rem' }}
                />
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>/ km</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ fontSize: '1.2rem' }}>🚖</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1e293b' }}>Cab / Taxi (Outstation)</span>
              </div>
              <label style={{ display: 'block', fontSize: '0.78rem', color: '#64748b', marginBottom: '6px' }}>
                Max Allowed Ceiling
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: '#0E7490', fontSize: '1.05rem' }}>₹</span>
                <input
                  type="number"
                  step="1"
                  value={rates.taxiActualCap}
                  onChange={(e) => handleRateChange('taxiActualCap', Number(e.target.value))}
                  style={{ width: '90px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700, fontSize: '0.95rem' }}
                />
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>/ km cap</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: DA - Dearness Allowance Daily Slabs */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#D97706' }}>
              <Coffee size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Dearness Allowance (DA) - Daily Meals & Incidentals
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Standard per-diem allowance graded by official city tiers</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>Tier 1 - Metro Cities</span>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                  Chennai, Bengaluru, Mumbai, Delhi
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 12px 0' }}>Daily food allowance per employee</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: '#0E7490', fontSize: '1.05rem' }}>₹</span>
                <input
                  type="number"
                  step="50"
                  value={rates.daTier1Metro}
                  onChange={(e) => handleRateChange('daTier1Metro', Number(e.target.value))}
                  style={{ width: '100px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>/ day</span>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>Tier 2 - Urban Centers</span>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                  Coimbatore, Madurai, Trichy, Kochi
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 12px 0' }}>Daily food allowance per employee</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: '#0E7490', fontSize: '1.05rem' }}>₹</span>
                <input
                  type="number"
                  step="50"
                  value={rates.daTier2City}
                  onChange={(e) => handleRateChange('daTier2City', Number(e.target.value))}
                  style={{ width: '100px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>/ day</span>
              </div>
            </div>

            <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#0f172a' }}>Tier 3 / Rural & Project Sites</span>
                <span style={{ fontSize: '0.75rem', backgroundColor: '#f8fafc', color: '#475569', padding: '2px 8px', borderRadius: '999px', fontWeight: 700 }}>
                  Site Camps & Non-Metro
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: '#64748b', margin: '0 0 12px 0' }}>Daily food allowance per employee</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: '#0E7490', fontSize: '1.05rem' }}>₹</span>
                <input
                  type="number"
                  step="50"
                  value={rates.daTier3Site}
                  onChange={(e) => handleRateChange('daTier3Site', Number(e.target.value))}
                  style={{ width: '100px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.82rem', color: '#64748b' }}>/ day</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Hotel & Lodging Night Caps */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16A34A' }}>
              <Hotel size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1e293b', margin: 0 }}>
                Hotel & Lodging Ceiling Limits
              </h3>
              <p style={{ fontSize: '0.8rem', color: '#64748b', margin: 0 }}>Upper limit reimbursement per night based on destination city tier</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Tier 1 Metro Hotel Cap
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: '#0E7490' }}>₹</span>
                <input
                  type="number"
                  step="100"
                  value={rates.hotelTier1Metro}
                  onChange={(e) => handleRateChange('hotelTier1Metro', Number(e.target.value))}
                  style={{ width: '100px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ night</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Tier 2 City Hotel Cap
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: '#0E7490' }}>₹</span>
                <input
                  type="number"
                  step="100"
                  value={rates.hotelTier2City}
                  onChange={(e) => handleRateChange('hotelTier2City', Number(e.target.value))}
                  style={{ width: '100px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ night</span>
              </div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '14px', borderRadius: '10px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: '4px' }}>
                Tier 3 / Site Hotel Cap
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, color: '#0E7490' }}>₹</span>
                <input
                  type="number"
                  step="100"
                  value={rates.hotelTier3Site}
                  onChange={(e) => handleRateChange('hotelTier3Site', Number(e.target.value))}
                  style={{ width: '100px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontWeight: 700 }}
                />
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>/ night</span>
              </div>
            </div>
          </div>
        </div>

        {/* Save Bar */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <button
            type="submit"
            style={{
              backgroundColor: '#0E7490',
              color: '#ffffff',
              padding: '12px 28px',
              borderRadius: '12px',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(14, 116, 144, 0.3)'
            }}
          >
            <Save size={18} /> Save TA & DA Settings
          </button>
        </div>
      </form>
    </div>
  );
};
