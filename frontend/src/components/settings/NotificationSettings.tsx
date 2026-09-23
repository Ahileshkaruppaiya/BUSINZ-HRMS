import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  BellRing, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  CheckCircle2, 
  Save, 
  Sliders, 
  Send, 
  Info 
} from 'lucide-react';
import { NotificationTriggerConfig } from '../../types/hrms';

export const NotificationSettings: React.FC = () => {
  const { 
    notificationTriggers, 
    updateNotificationTrigger, 
    addNotification 
  } = useHRMS();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [templateText, setTemplateText] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleChannel = (id: string, channel: 'email' | 'sms' | 'whatsapp' | 'push', currentVal: boolean) => {
    updateNotificationTrigger(id, { [channel]: !currentVal });
    triggerToast(`Notification channel updated`);
  };

  const handleOpenEditTemplate = (trigger: NotificationTriggerConfig) => {
    setEditingId(trigger.id);
    setTemplateText(trigger.template);
  };

  const handleSaveTemplate = (id: string) => {
    updateNotificationTrigger(id, { template: templateText });
    setEditingId(null);
    triggerToast(`Notification message template saved`);
  };

  const handleSendTestDispatch = (trigger: NotificationTriggerConfig) => {
    addNotification({
      title: `[Test Dispatch] ${trigger.event}`,
      message: trigger.template.replace(/\{\{[^}]+\}\}/g, 'SAMPLE'),
      priority: 'Important',
      category: 'Announcement'
    });
    triggerToast(`Test notification simulated for "${trigger.event}"`);
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

      {/* Overview Cards */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Enterprise Notification Triggers & Channels</h2>
        <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px' }}>Enable automated alerts across Email, SMS, WhatsApp Business API, and In-App Push notifications</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          {[
            { channel: 'Email Alerts (SMTP)', icon: Mail, status: 'Active (SendGrid)', color: '#0E7490' },
            { channel: 'SMS Gateway (Twilio)', icon: MessageSquare, status: 'Active (Twilio Cloud)', color: '#3B82F6' },
            { channel: 'WhatsApp Cloud API', icon: Send, status: 'Active (Meta Business)', color: '#22C55E' },
            { channel: 'In-App Web Push', icon: BellRing, status: 'Active (Browser Service)', color: '#8B5CF6' }
          ].map(ch => (
            <div key={ch.channel} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                <ch.icon size={18} color={ch.color} />
                <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>{ch.channel}</h4>
              </div>
              <span style={{ fontSize: '0.78rem', color: '#166534', fontWeight: 600, backgroundColor: '#DCFCE7', padding: '2px 8px', borderRadius: '4px' }}>
                {ch.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Triggers Table */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px', overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
              <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase' }}>Event Trigger</th>
              <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Module</th>
              <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', textAlign: 'center' }}>Email</th>
              <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', textAlign: 'center' }}>SMS</th>
              <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', textAlign: 'center' }}>WhatsApp</th>
              <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', textAlign: 'center' }}>Push</th>
              <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {notificationTriggers.map(nt => (
              <React.Fragment key={nt.id}>
                <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1E293B', fontSize: '0.88rem' }}>
                    {nt.event}
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '0.82rem', color: '#64748B' }}>
                    <span style={{ backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '4px', fontWeight: 600 }}>
                      {nt.module}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={nt.email}
                      onChange={() => handleToggleChannel(nt.id, 'email', nt.email)}
                      style={{ width: '18px', height: '18px', accentColor: '#0E7490', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={nt.sms}
                      onChange={() => handleToggleChannel(nt.id, 'sms', nt.sms)}
                      style={{ width: '18px', height: '18px', accentColor: '#0E7490', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={nt.whatsapp}
                      onChange={() => handleToggleChannel(nt.id, 'whatsapp', nt.whatsapp)}
                      style={{ width: '18px', height: '18px', accentColor: '#0E7490', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <input
                      type="checkbox"
                      checked={nt.push}
                      onChange={() => handleToggleChannel(nt.id, 'push', nt.push)}
                      style={{ width: '18px', height: '18px', accentColor: '#0E7490', cursor: 'pointer' }}
                    />
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenEditTemplate(nt)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CBD5E1',
                          background: '#ffffff',
                          color: '#0E7490',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Edit Template
                      </button>
                      <button
                        onClick={() => handleSendTestDispatch(nt)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '8px',
                          border: 'none',
                          background: '#ECFEFF',
                          color: '#0E7490',
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer'
                        }}
                      >
                        Test
                      </button>
                    </div>
                  </td>
                </tr>

                {/* Inline Template Editor when clicked */}
                {editingId === nt.id && (
                  <tr style={{ backgroundColor: '#F8FAFC', borderBottom: '2px solid #CBD5E1' }}>
                    <td colSpan={7} style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B' }}>Edit Notification Message Template</span>
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Supported: {'{{name}}'}, {'{{date}}'}, {'{{amount}}'}, {'{{status}}'}</span>
                        </div>
                        <textarea
                          rows={3}
                          value={templateText}
                          onChange={e => setTemplateText(e.target.value)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            fontSize: '0.85rem',
                            fontFamily: 'inherit'
                          }}
                        />
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button onClick={() => setEditingId(null)} style={{ padding: '6px 14px', borderRadius: '8px', border: '1px solid #CBD5E1', background: '#fff', fontSize: '0.8rem', cursor: 'pointer' }}>Cancel</button>
                          <button onClick={() => handleSaveTemplate(nt.id)} style={{ padding: '6px 16px', borderRadius: '8px', border: 'none', background: '#0E7490', color: '#fff', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer' }}>Save Template</button>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default NotificationSettings;
