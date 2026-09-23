import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar, 
  ChevronDown,
  Check,
  Clock
} from 'lucide-react';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';

interface OvertimeReviewItem {
  id: string;
  employeeId: string;
  employeeName: string;
  inTime: string;
  outTime: string;
  otDuration: string;
  otMinutes: number;
  date: string;
  shiftHours: string;
  hourlyRate: number;
  multiplier: 'Fixed Amount Per Hour' | 'Half Day' | 'Full Day' | 'Regularize' | '1x Salary' | '1.5x Salary' | '2x Salary';
  calculatedAmount: number;
  status: 'Approval Pending' | 'Approved' | 'Rejected' | 'Paid';
  isSelected: boolean;
}

export const ReviewOvertimeView: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { addNotification } = useHRMS();

  const [selectedDateStr, setSelectedDateStr] = useState<string>('08 Sep 2026');
  const [globalMultiplier, setGlobalMultiplier] = useState<string>('Fixed Amount');
  const [globalAmount, setGlobalAmount] = useState<number>(0);
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [showOtherDates, setShowOtherDates] = useState<boolean>(false);

  // Overtime items
  const [otItems, setOtItems] = useState<OvertimeReviewItem[]>([]);

  const [selectAll, setSelectAll] = useState<boolean>(false);

  const handleToggleSelectAll = () => {
    const nextVal = !selectAll;
    setSelectAll(nextVal);
    setOtItems(prev => prev.map(item => ({ ...item, isSelected: nextVal })));
  };

  const handleToggleItem = (id: string) => {
    setOtItems(prev => prev.map(item => item.id === id ? { ...item, isSelected: !item.isSelected } : item));
  };

  const multiplierOptions: OvertimeReviewItem['multiplier'][] = [
    'Fixed Amount Per Hour',
    'Half Day',
    'Full Day',
    'Regularize',
    '1x Salary',
    '1.5x Salary',
    '2x Salary'
  ];

  const handleApplyBatchMultiplier = () => {
    setOtItems(prev => prev.map(item => {
      if (item.isSelected || selectAll) {
        let mult = item.multiplier;
        if (globalMultiplier.includes('1.5')) mult = '1.5x Salary';
        else if (globalMultiplier.includes('2x')) mult = '2x Salary';
        else if (globalMultiplier.includes('1x')) mult = '1x Salary';
        else if (globalMultiplier.includes('Half')) mult = 'Half Day';
        else if (globalMultiplier.includes('Full')) mult = 'Full Day';
        else if (globalMultiplier.includes('Per Hour')) mult = 'Fixed Amount Per Hour';
        else if (globalMultiplier.includes('Regularize')) mult = 'Regularize';

        const factor = mult === '2x Salary' ? 2 : mult === '1.5x Salary' ? 1.5 : 1;
        const newAmt = globalAmount > 0 ? globalAmount : Math.round((item.otMinutes / 60) * item.hourlyRate * factor * 100) / 100;

        return {
          ...item,
          multiplier: mult,
          calculatedAmount: newAmt
        };
      }
      return item;
    }));

    addNotification({
      title: 'Batch Multiplier Applied',
      message: `Applied ${globalMultiplier} to selected overtime records.`,
      priority: 'Normal',
      category: 'Attendance'
    });
  };

  const handleItemMultiplierChange = (id: string, newMultiplier: OvertimeReviewItem['multiplier']) => {
    setOtItems(prev => prev.map(item => {
      if (item.id === id) {
        const factor = newMultiplier === '2x Salary' ? 2 : newMultiplier === '1.5x Salary' ? 1.5 : 1;
        const newAmt = Math.round((item.otMinutes / 60) * item.hourlyRate * factor * 100) / 100;
        return {
          ...item,
          multiplier: newMultiplier,
          calculatedAmount: newAmt
        };
      }
      return item;
    }));
  };

  const handleSaveItem = (id: string) => {
    setOtItems(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, status: 'Approved' };
      }
      return item;
    }));

    addNotification({
      title: 'Overtime Approved',
      message: `Overtime record for ${id} has been approved and queued for payroll.`,
      priority: 'Normal',
      category: 'Payroll'
    });
  };

  return (
    <div
      style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid #E7ECF3',
        padding: '28px 32px',
        fontFamily: "'DM Sans', 'Plus Jakarta Sans', sans-serif"
      }}
    >
      {/* Top Header matching Screenshots 1 & 4 */}
      <div style={{ marginBottom: '20px' }}>
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              color: '#2563EB',
              fontSize: '0.92rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 0 12px 0'
            }}
          >
            ← Back
          </button>
        )}

        {/* Notice Bar for pending items */}
        {otItems.length > 0 && (
          <div
            style={{
              backgroundColor: '#FEF9C3',
              border: '1px solid #FEF08A',
              borderRadius: '12px',
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '24px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  backgroundColor: '#EAB308',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 800
                }}
              >
                i
              </div>
              <span style={{ fontSize: '0.92rem', fontWeight: 600, color: '#854D0E' }}>
                Approval pending for other dates
              </span>
            </div>
            <button
              type="button"
              onClick={() => setShowOtherDates(!showOtherDates)}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563EB',
                fontWeight: 700,
                fontSize: '0.9rem',
                cursor: 'pointer'
              }}
            >
              View
            </button>
          </div>
        )}

        {/* Other dates flyout notice */}
        {showOtherDates && otItems.length > 0 && (
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '10px',
              padding: '12px 16px',
              marginBottom: '20px',
              fontSize: '0.85rem',
              color: '#475569'
            }}
          >
            <strong>Pending Dates:</strong> Check previous dates with recorded overtime punches.
          </div>
        )}

        {/* Title + Subtitle + Date Navigator Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
              Review Overtime
            </h1>
            <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '4px 0 0 0' }}>
              Review overtimes to approve, or reject.
            </p>
          </div>

          {/* Date Navigator Pill matching Screenshot 1 */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              border: '1px solid #E2E8F0',
              borderRadius: '12px',
              padding: '6px 14px',
              backgroundColor: '#FFFFFF'
            }}
          >
            <button
              type="button"
              onClick={() => setSelectedDateStr('07 Sep 2026')}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
            >
              <ChevronLeft size={16} />
            </button>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B' }}>
              {selectedDateStr}
            </span>
            <button
              type="button"
              onClick={() => setSelectedDateStr('08 Sep 2026')}
              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center' }}
            >
              <ChevronRight size={16} />
            </button>
            <Calendar size={18} style={{ color: '#64748B', marginLeft: '4px' }} />
          </div>
        </div>
      </div>

      {/* Batch Calculation Toolbar Card matching Screenshots 1 & 4 */}
      <div
        style={{
          border: '1px solid #E2E8F0',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
          backgroundColor: '#FFFFFF',
          flexWrap: 'wrap',
          gap: '14px'
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.92rem', fontWeight: 700, color: '#1E293B', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={selectAll}
            onChange={handleToggleSelectAll}
            style={{ width: '18px', height: '18px', accentColor: '#2563EB', borderRadius: '4px', cursor: 'pointer' }}
          />
          Select All
        </label>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', position: 'relative' }}>
          {/* Multiplier Dropdown Selector */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: '#1E293B',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                minWidth: '160px',
                justifyContent: 'space-between'
              }}
            >
              <span>{globalMultiplier}</span>
              <ChevronDown size={16} />
            </button>

            {/* Dropdown Options Popup matching Screenshot 4 */}
            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '110%',
                  right: 0,
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 12px 28px -4px rgba(0,0,0,0.15)',
                  width: '230px',
                  zIndex: 200,
                  padding: '6px 0'
                }}
              >
                {multiplierOptions.map(opt => (
                  <div
                    key={opt}
                    onClick={() => {
                      setGlobalMultiplier(opt);
                      setDropdownOpen(false);
                    }}
                    style={{
                      padding: '10px 18px',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      color: globalMultiplier === opt ? '#2563EB' : '#334155',
                      backgroundColor: globalMultiplier === opt ? '#F1F5F9' : 'transparent',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'background 0.1s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                    onMouseLeave={e => e.currentTarget.style.backgroundColor = globalMultiplier === opt ? '#F1F5F9' : 'transparent'}
                  >
                    <span>{opt}</span>
                    {globalMultiplier === opt && <Check size={14} color="#2563EB" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Amount Input */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid #CBD5E1',
              borderRadius: '10px',
              padding: '6px 14px',
              backgroundColor: '#FFFFFF'
            }}
          >
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', marginRight: '6px' }}>₹</span>
            <input
              type="number"
              value={globalAmount}
              onChange={e => setGlobalAmount(Number(e.target.value))}
              style={{
                border: 'none',
                outline: 'none',
                width: '60px',
                fontSize: '0.92rem',
                fontWeight: 700,
                color: '#0F172A'
              }}
            />
          </div>

          {/* Apply Button matching Screenshot 1 & 4 */}
          <button
            type="button"
            onClick={handleApplyBatchMultiplier}
            style={{
              padding: '8px 24px',
              borderRadius: '10px',
              border: 'none',
              backgroundColor: '#CBD5E1',
              color: '#334155',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              transition: 'background 0.15s'
            }}
          >
            Apply
          </button>
        </div>
      </div>

      {/* OVERTIME CARDS LIST matching Screenshot 1 & 2 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {otItems.length === 0 ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', color: '#64748B' }}>
            <Clock size={36} color="#94A3B8" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.7 }} />
            <h3 style={{ margin: '0 0 4px', fontSize: '1rem', fontWeight: 700, color: '#1E293B' }}>No Overtime Pending Review</h3>
            <p style={{ margin: 0, fontSize: '0.85rem' }}>There are currently no overtime requests awaiting approval for {selectedDateStr}.</p>
          </div>
        ) : (
          otItems.map(item => (
            <div
              key={item.id}
              style={{
                border: '1px solid #E2E8F0',
                borderRadius: '18px',
                padding: '20px',
                backgroundColor: '#FFFFFF',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
              }}
            >
              {/* Top Row: Employee Summary */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <input
                    type="checkbox"
                    checked={item.isSelected}
                    onChange={() => handleToggleItem(item.id)}
                    style={{ width: '18px', height: '18px', accentColor: '#2563EB', borderRadius: '4px', cursor: 'pointer' }}
                  />
                  <div>
                    <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A' }}>
                      {item.employeeName}
                    </div>
                    <div style={{ fontSize: '0.82rem', color: '#64748B', marginTop: '2px' }}>
                      In: <strong style={{ color: '#1E293B' }}>{item.inTime}</strong> | Out: <strong style={{ color: '#1E293B' }}>{item.outTime}</strong>
                    </div>
                  </div>
                </div>

                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E293B' }}>
                    {item.otDuration}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    {item.otMinutes} min
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B' }}>
                    {formatDateDDMMYYYY(item.date)}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: '#64748B' }}>
                    {item.shiftHours}
                  </div>
                </div>
              </div>

              {/* Expandable Overtime Section */}
              <div
                style={{
                  backgroundColor: '#F8FAFC',
                  borderRadius: '14px',
                  padding: '16px 20px',
                  border: '1px solid #F1F5F9',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px'
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', cursor: 'pointer' }}>
                  <input type="checkbox" defaultChecked style={{ width: '16px', height: '16px', accentColor: '#2563EB' }} />
                  Overtime
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                  {/* Hours Box */}
                  <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>Hours</div>
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '6px 14px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      color: '#1E293B'
                    }}
                  >
                    00 : {item.otMinutes} hrs
                  </div>
                </div>

                {/* Overtime Amount / Rate Selector Box */}
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#64748B', marginBottom: '4px' }}>Overtime Amount</div>
                  <div
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '4px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <select
                      value={item.multiplier}
                      onChange={e => handleItemMultiplierChange(item.id, e.target.value as any)}
                      style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: '0.9rem',
                        fontWeight: 700,
                        color: '#1E293B',
                        cursor: 'pointer'
                      }}
                    >
                      {multiplierOptions.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                    <span style={{ borderLeft: '1px solid #E2E8F0', paddingLeft: '10px', color: '#475569', fontSize: '0.9rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                      ₹ {item.hourlyRate} <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>/HR</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Status & Save Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: item.status === 'Approved' ? '#15803D' : '#B45309',
                      backgroundColor: item.status === 'Approved' ? '#DCFCE7' : '#FEF3C7',
                      padding: '3px 10px',
                      borderRadius: '6px',
                      marginBottom: '4px'
                    }}
                  >
                    {item.status}
                  </div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569' }}>
                    Amount: ₹{item.calculatedAmount}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveItem(item.id)}
                  style={{
                    padding: '8px 24px',
                    borderRadius: '20px',
                    border: 'none',
                    backgroundColor: item.status === 'Approved' ? '#10B981' : '#2563EB',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {item.status === 'Approved' ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
    </div>
  );
};
