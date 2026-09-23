import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { AttendanceAuditLog } from '../../types/hrms';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';
import { ShieldCheck, Search, Calendar, User, FileText, X, History } from 'lucide-react';

interface AttendanceAuditLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AttendanceAuditLogModal: React.FC<AttendanceAuditLogModalProps> = ({
  isOpen,
  onClose
}) => {
  const { attendanceAuditLogs } = useHRMS();
  const [searchTerm, setSearchTerm] = useState<string>('');

  if (!isOpen) return null;

  const filteredLogs = (attendanceAuditLogs || []).filter(log => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      log.employeeName.toLowerCase().includes(term) ||
      log.employeeId.toLowerCase().includes(term) ||
      log.changedBy.toLowerCase().includes(term) ||
      log.reason.toLowerCase().includes(term) ||
      log.fieldChanged.toLowerCase().includes(term)
    );
  });

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        maxWidth: '900px',
        width: '100%',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        border: '1px solid #E2E8F0'
      }}>
        {/* Header */}
        <div style={{
          backgroundColor: '#0F172A',
          color: '#FFFFFF',
          padding: '20px 28px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#1E293B',
              color: '#38BDF8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#FFFFFF' }}>
                Attendance Correction Audit Trail
              </h2>
              <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0 }}>
                Immutable security logs of all manual attendance overrides and punch adjustments
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#FFFFFF',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Bar */}
        <div style={{ padding: '16px 28px', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <Search className="w-4 h-4" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="text"
              placeholder="Search by Employee, HR/CEO Name, Field, or Reason..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px 8px 36px',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                fontSize: '0.875rem',
                backgroundColor: '#FFFFFF'
              }}
            />
          </div>
        </div>

        {/* Audit Log Table */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', flex: 1 }}>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
              <History className="w-10 h-10" style={{ margin: '0 auto 12px auto', color: '#94A3B8' }} />
              <p style={{ margin: 0, fontWeight: 600 }}>No audit logs found matching your filter criteria.</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E2E8F0', textAlign: 'left', color: '#475569', backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '10px 12px' }}>Timestamp & Actor</th>
                  <th style={{ padding: '10px 12px' }}>Target Employee</th>
                  <th style={{ padding: '10px 12px' }}>Action & Field</th>
                  <th style={{ padding: '10px 12px' }}>Before vs After</th>
                  <th style={{ padding: '10px 12px' }}>Reason / Justification</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#1E293B' }}>{log.timestamp}</div>
                      <div style={{ fontSize: '0.75rem', color: '#0E7490', fontWeight: 600 }}>By: {log.changedBy}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 700, color: '#0F172A' }}>{log.employeeName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{log.employeeId} | {formatDateDDMMYYYY(log.date)}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        backgroundColor: '#ECFEFF',
                        color: '#0891B2'
                      }}>
                        {log.fieldChanged}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.8rem' }}>
                      <div style={{ color: '#DC2626', textDecoration: 'line-through' }}>Old: {log.oldValue}</div>
                      <div style={{ color: '#16A34A', fontWeight: 700 }}>New: {log.newValue}</div>
                    </td>
                    <td style={{ padding: '12px', fontSize: '0.8rem', color: '#334155', fontStyle: 'italic', maxWidth: '200px' }}>
                      "{log.reason}"
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 28px', backgroundColor: '#F8FAFC', borderTop: '1px solid #E2E8F0', textAlign: 'right' }}>
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '8px 20px', borderRadius: '8px', fontWeight: 600 }}
          >
            Close Audit Trail
          </button>
        </div>
      </div>
    </div>
  );
};
