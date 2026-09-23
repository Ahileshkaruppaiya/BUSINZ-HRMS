import React, { useState, useEffect, useRef } from 'react';
import { Clock, X } from 'lucide-react';

interface AttendanceTimePickerModalProps {
  employeeName: string;
  date: string;
  initialCheckIn?: string | null;
  initialCheckOut?: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (checkIn: string, checkOut: string) => void;
}

export const AttendanceTimePickerModal: React.FC<AttendanceTimePickerModalProps> = (props) => {
  if (!props.isOpen) return null;
  return <AttendanceTimePickerModalInner {...props} />;
};

const AttendanceTimePickerModalInner: React.FC<AttendanceTimePickerModalProps> = ({
  employeeName,
  date,
  initialCheckIn,
  initialCheckOut,
  isOpen,
  onClose,
  onSave
}) => {
  const [inTime, setInTime] = useState<string>(initialCheckIn || '09:59 AM');
  const [outTime, setOutTime] = useState<string>(initialCheckOut || '06:35 PM');
  const [activePickerField, setActivePickerField] = useState<'in' | 'out' | null>('out'); // default open on Out Time as in Screenshot 1

  // Time picker state for active field
  const [selectedHour, setSelectedHour] = useState<string>('06');
  const [selectedMinute, setSelectedMinute] = useState<string>('35');
  const [selectedAmpm, setSelectedAmpm] = useState<'AM' | 'PM'>('PM');

  const hoursList = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'];
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

  const hoursScrollRef = useRef<HTMLDivElement>(null);
  const minutesScrollRef = useRef<HTMLDivElement>(null);

  // Sync state when active field changes
  const syncWithActiveField = (field: 'in' | 'out') => {
    const timeVal = field === 'in' ? inTime : outTime;
    if (timeVal) {
      const parts = timeVal.trim().split(' ');
      if (parts.length === 2) {
        const [h, m] = parts[0].split(':');
        const hourStr = h.padStart(2, '0');
        const minStr = m.padStart(2, '0');
        const ampmStr = parts[1].toUpperCase() as 'AM' | 'PM';
        setSelectedHour(hourStr);
        setSelectedMinute(minStr);
        setSelectedAmpm(ampmStr);
      }
    }
  };

  const handleOpenPicker = (field: 'in' | 'out') => {
    setActivePickerField(field);
    syncWithActiveField(field);
  };

  // Auto-update active time string when wheel values change
  const updateTimeValue = (h: string, m: string, ampm: 'AM' | 'PM') => {
    const formatted = `${h}:${m} ${ampm}`;
    if (activePickerField === 'in') {
      setInTime(formatted);
    } else if (activePickerField === 'out') {
      setOutTime(formatted);
    }
  };

  const handleSelectHour = (h: string) => {
    setSelectedHour(h);
    updateTimeValue(h, selectedMinute, selectedAmpm);
  };

  const handleSelectMinute = (m: string) => {
    setSelectedMinute(m);
    updateTimeValue(selectedHour, m, selectedAmpm);
  };

  const handleSelectAmpm = (ampm: 'AM' | 'PM') => {
    setSelectedAmpm(ampm);
    updateTimeValue(selectedHour, selectedMinute, ampm);
  };

  // Scroll active elements into view on open
  useEffect(() => {
    if (activePickerField) {
      setTimeout(() => {
        const activeHourEl = document.getElementById(`hour-item-${selectedHour}`);
        if (activeHourEl && hoursScrollRef.current) {
          hoursScrollRef.current.scrollTop = activeHourEl.offsetTop - 50;
        }
        const activeMinEl = document.getElementById(`minute-item-${selectedMinute}`);
        if (activeMinEl && minutesScrollRef.current) {
          minutesScrollRef.current.scrollTop = activeMinEl.offsetTop - 50;
        }
      }, 50);
    }
  }, [activePickerField]);

  // Format date display: e.g. "08 Sep 2026"
  const formattedDate = (() => {
    if (!date) return '08 Sep 2026';
    if (date.includes('-')) {
      const [y, m, d] = date.split('-');
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = parseInt(m, 10) - 1;
      return `${d} ${monthNames[monthIdx] || m} ${y}`;
    }
    return date;
  })();

  const handleSaveAll = () => {
    onSave(inTime, outTime);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1200,
        padding: '20px'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          maxWidth: '480px',
          width: '100%',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '24px 28px',
          position: 'relative',
          fontFamily: "'DM Sans', 'Plus Jakarta Sans', sans-serif"
        }}
      >
        {/* Title Header matching Screenshot 1: "JAYASURYA V | 08 Sep 2026" */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2
            style={{
              fontSize: '1.2rem',
              fontWeight: 800,
              color: '#1E293B',
              margin: 0,
              letterSpacing: '-0.01em',
              textTransform: 'uppercase'
            }}
          >
            {employeeName} <span style={{ color: '#64748B', fontWeight: 500, textTransform: 'none' }}>| {formattedDate}</span>
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              borderRadius: '6px'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Gray Container for In Time / Out Time Inputs */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            borderRadius: '16px',
            padding: '18px 20px',
            marginBottom: '20px',
            border: '1px solid #F1F5F9',
            position: 'relative'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* In Time Input Box */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                In Time
              </div>
              <div
                onClick={() => handleOpenPicker('in')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: activePickerField === 'in' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  padding: '11px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'border-color 0.15s'
                }}
              >
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                  {inTime}
                </span>
                <Clock size={16} style={{ color: '#64748B' }} />
              </div>
            </div>

            {/* Out Time Input Box */}
            <div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                Out Time
              </div>
              <div
                onClick={() => handleOpenPicker('out')}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: activePickerField === 'out' ? '2px solid #2563EB' : '1px solid #E2E8F0',
                  padding: '11px 14px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                  transition: 'border-color 0.15s'
                }}
              >
                <span style={{ fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>
                  {outTime}
                </span>
                <Clock size={16} style={{ color: '#64748B' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Floating Time Wheel Popover matching Screenshot 1 */}
        {activePickerField && (
          <div
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 12px 28px -6px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.05)',
              padding: '16px 20px',
              marginBottom: '22px'
            }}
          >
            {/* Header Titles: Hours, Minutes */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 70px',
                gap: '14px',
                textAlign: 'center',
                marginBottom: '10px'
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Hours</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}>Minutes</div>
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#64748B' }}></div>
            </div>

            {/* 3 Columns: Hours, Minutes, AM/PM */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 70px', gap: '14px', height: '170px' }}>
              {/* Hours Column */}
              <div
                ref={hoursScrollRef}
                style={{
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  paddingRight: '4px',
                  scrollBehavior: 'smooth'
                }}
              >
                {hoursList.map(h => {
                  const isSelected = selectedHour === h;
                  return (
                    <div
                      key={h}
                      id={`hour-item-${h}`}
                      onClick={() => handleSelectHour(h)}
                      style={{
                        padding: '7px 0',
                        borderRadius: '8px',
                        fontSize: '0.92rem',
                        fontWeight: isSelected ? 800 : 500,
                        cursor: 'pointer',
                        textAlign: 'center',
                        backgroundColor: isSelected ? '#2563EB' : 'transparent',
                        color: isSelected ? '#FFFFFF' : '#334155',
                        transition: 'background-color 0.1s'
                      }}
                    >
                      {h}
                    </div>
                  );
                })}
              </div>

              {/* Minutes Column */}
              <div
                ref={minutesScrollRef}
                style={{
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                  paddingRight: '4px',
                  scrollBehavior: 'smooth'
                }}
              >
                {minutesList.map(m => {
                  const isSelected = selectedMinute === m;
                  return (
                    <div
                      key={m}
                      id={`minute-item-${m}`}
                      onClick={() => handleSelectMinute(m)}
                      style={{
                        padding: '7px 0',
                        borderRadius: '8px',
                        fontSize: '0.92rem',
                        fontWeight: isSelected ? 800 : 500,
                        cursor: 'pointer',
                        textAlign: 'center',
                        backgroundColor: isSelected ? '#2563EB' : 'transparent',
                        color: isSelected ? '#FFFFFF' : '#334155',
                        transition: 'background-color 0.1s'
                      }}
                    >
                      {m}
                    </div>
                  );
                })}
              </div>

              {/* AM / PM Toggle Column matching Screenshot 1 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                <button
                  type="button"
                  onClick={() => handleSelectAmpm('AM')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: selectedAmpm === 'AM' ? '#2563EB' : '#F1F5F9',
                    color: selectedAmpm === 'AM' ? '#FFFFFF' : '#475569',
                    transition: 'all 0.15s'
                  }}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handleSelectAmpm('PM')}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    backgroundColor: selectedAmpm === 'PM' ? '#2563EB' : '#F1F5F9',
                    color: selectedAmpm === 'PM' ? '#FFFFFF' : '#475569',
                    transition: 'all 0.15s'
                  }}
                >
                  PM
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons matching Screenshot 1: Outline Cancel & Solid Blue Save */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '10px 30px',
              borderRadius: '9999px',
              border: '1.5px solid #2563EB',
              backgroundColor: '#FFFFFF',
              color: '#2563EB',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSaveAll}
            style={{
              padding: '10px 36px',
              borderRadius: '9999px',
              border: 'none',
              backgroundColor: '#2563EB',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.92rem',
              cursor: 'pointer',
              boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)',
              transition: 'all 0.15s ease'
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};
