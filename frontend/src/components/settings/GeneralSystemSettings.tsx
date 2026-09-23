import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { downloadCSV, downloadExcel, downloadPDF } from '../../utils/exportUtils';
import { ExportDropdown } from '../common/ExportDropdown';
import { 
  Globe, 
  Palette, 
  Clock, 
  Calendar, 
  IndianRupee, 
  Sliders, 
  CheckCircle2, 
  Save, 
  FileText, 
  FileSpreadsheet,
  Download, 
  Upload, 
  History 
} from 'lucide-react';

export const GeneralSystemSettings: React.FC = () => {
  const { 
    generalSystemConfig, 
    updateGeneralSystemConfig,
    employees,
    attendanceRecords 
  } = useHRMS();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [formState, setFormState] = useState({ ...generalSystemConfig });

  const [auditLogs] = useState<{ id: string; timestamp: string; user: string; action: string; ip: string }[]>([]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateGeneralSystemConfig(formState);
    triggerToast('General system preferences saved');
  };

  // Export handlers
  const empColumns = [
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'name', label: 'Employee Name' },
    { key: 'email', label: 'Email' },
    { key: 'department', label: 'Department' },
    { key: 'designation', label: 'Designation' },
    { key: 'status', label: 'Status' }
  ];
  const empData = employees.map(e => ({
    employeeId: e.employeeId,
    name: `${e.firstName} ${e.lastName}`,
    email: e.email,
    department: e.department,
    designation: e.designation,
    status: e.status
  }));

  const handleExportEmpExcel = () => downloadExcel(empData, `Employee_Master_${new Date().toISOString().split('T')[0]}`, empColumns);
  const handleExportEmpPDF = () => downloadPDF(empData, 'Employee Master Database', `Employee_Master_${new Date().toISOString().split('T')[0]}`, empColumns);
  const handleExportEmpCSV = () => downloadCSV(empData, `Employee_Master_${new Date().toISOString().split('T')[0]}`, empColumns);

  const attColumns = [
    { key: 'employeeId', label: 'Employee ID' },
    { key: 'employeeName', label: 'Employee Name' },
    { key: 'date', label: 'Date' },
    { key: 'checkIn', label: 'Check In' },
    { key: 'checkOut', label: 'Check Out' },
    { key: 'status', label: 'Status' },
    { key: 'hoursWorked', label: 'Hours' }
  ];
  const attData = attendanceRecords.map(r => ({
    employeeId: r.employeeId,
    employeeName: r.employeeName,
    date: r.date,
    checkIn: r.checkIn || '-',
    checkOut: r.checkOut || '-',
    status: r.status,
    hoursWorked: r.workingHours || 0
  }));

  const handleExportAttExcel = () => downloadExcel(attData, `Attendance_Register_${new Date().toISOString().split('T')[0]}`, attColumns);
  const handleExportAttPDF = () => downloadPDF(attData, 'Monthly Attendance Register', `Attendance_Register_${new Date().toISOString().split('T')[0]}`, attColumns);
  const handleExportAttCSV = () => downloadCSV(attData, `Attendance_Register_${new Date().toISOString().split('T')[0]}`, attColumns);

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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* System Configuration Form */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Localization & Global Preferences</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px' }}>Global formatting applied throughout tables, payslips, and timestamp records</p>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Application Language</label>
              <select
                value={formState.language}
                onChange={e => setFormState({ ...formState, language: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
              >
                <option value="English (US / IN)">English (US / IN)</option>
                <option value="Tamil (தமிழ்)">Tamil (தமிழ்)</option>
                <option value="Hindi (हिन्दी)">Hindi (हिन्दी)</option>
                <option value="Telugu (తెలుగు)">Telugu (తెలుగు)</option>
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Theme & Aesthetics</label>
              <select
                value={formState.theme}
                onChange={e => setFormState({ ...formState, theme: e.target.value })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
              >
                <option value="Notion Slate Clean Light">Notion Slate Clean Light (#0E7490 Teal)</option>
                <option value="Linear Dark Modern">Linear Dark Modern</option>
                <option value="System Auto">Follow OS Theme</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Date Format</label>
                <select
                  value={formState.dateFormat}
                  onChange={e => setFormState({ ...formState, dateFormat: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  <option value="DD MMM YYYY">DD MMM YYYY</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Time Format</label>
                <select
                  value={formState.timeFormat}
                  onChange={e => setFormState({ ...formState, timeFormat: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                >
                  <option value="12 Hours (AM/PM)">12 Hours (AM/PM)</option>
                  <option value="24 Hours Industrial">24 Hours Industrial</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Default Table Pagination</label>
              <select
                value={formState.tablePagination}
                onChange={e => setFormState({ ...formState, tablePagination: Number(e.target.value) as 5 | 10 })}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
              >
                <option value={5}>5 Rows Per Page (Compact)</option>
                <option value={10}>10 Rows Per Page (Standard Enterprise)</option>
              </select>
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
                marginTop: '8px',
                alignSelf: 'flex-start'
              }}
            >
              <Save size={16} />
              <span>Save System Preferences</span>
            </button>
          </form>
        </div>

        {/* Data Management & Export/Import */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Data Portability & Backup</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px' }}>Bulk master import and export tools for audits, compliance and backups</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>Export Employee Master</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>Complete employee database with statutory UAN and PAN fields</p>
              </div>
              <div>
                <ExportDropdown 
                  onExportExcel={handleExportEmpExcel}
                  onExportPDF={handleExportEmpPDF}
                  onExportCSV={handleExportEmpCSV}
                  label="Download"
                />
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>Monthly Attendance Register</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>Complete monthly punch records with OT and late penalty metrics</p>
              </div>
              <div>
                <ExportDropdown 
                  onExportExcel={handleExportAttExcel}
                  onExportPDF={handleExportAttPDF}
                  onExportCSV={handleExportAttCSV}
                  label="Download"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#1E293B' }}>System Audit Trail</h3>
            <p style={{ margin: '4px 0 0', fontSize: '0.82rem', color: '#64748B' }}>Immutable compliance log recording all system events, policy modifications and approvals</p>
          </div>
          <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '3px 10px', borderRadius: '9999px', fontWeight: 700, fontSize: '0.75rem' }}>
            AUDITING ACTIVE
          </span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
              <th style={{ padding: '10px 14px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Timestamp</th>
              <th style={{ padding: '10px 14px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>User Identity</th>
              <th style={{ padding: '10px 14px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Action Details</th>
              <th style={{ padding: '10px 14px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>IP Address</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: '32px 14px', textAlign: 'center', color: '#64748B', fontSize: '0.85rem' }}>
                  No audit trail records logged yet. System actions and policy modifications will appear here.
                </td>
              </tr>
            ) : (
              auditLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#64748B', fontFamily: 'monospace' }}>{log.timestamp}</td>
                  <td style={{ padding: '12px 14px', fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>{log.user}</td>
                  <td style={{ padding: '12px 14px', fontSize: '0.85rem', color: '#334155' }}>{log.action}</td>
                  <td style={{ padding: '12px 14px', fontSize: '0.82rem', color: '#64748B', fontFamily: 'monospace' }}>{log.ip}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default GeneralSystemSettings;
