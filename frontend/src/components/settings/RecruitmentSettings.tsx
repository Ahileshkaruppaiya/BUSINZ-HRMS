import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  Briefcase, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Save, 
  X, 
  FileText, 
  Users, 
  Layers, 
  UserCheck, 
  Check 
} from 'lucide-react';

export const RecruitmentSettings: React.FC = () => {
  const { departments, designations } = useHRMS();

  const [activeTab, setActiveTab] = useState<'stages' | 'sources' | 'interview_types' | 'offer_templates'>('stages');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initial persistent recruitment configuration
  const [stages, setStages] = useState([
    { id: 'st1', name: 'Applied / Sourced', color: '#64748B', count: 12, order: 1 },
    { id: 'st2', name: 'Resume Shortlisted', color: '#0E7490', count: 8, order: 2 },
    { id: 'st3', name: 'Technical Round 1', color: '#8B5CF6', count: 5, order: 3 },
    { id: 'st4', name: 'Managerial Round 2', color: '#F59E0B', count: 3, order: 4 },
    { id: 'st5', name: 'Offer Extended', color: '#3B82F6', count: 2, order: 5 },
    { id: 'st6', name: 'Joined / Onboarded', color: '#22C55E', count: 4, order: 6 },
    { id: 'st7', name: 'Rejected / Archived', color: '#EF4444', count: 9, order: 7 }
  ]);

  const [sources, setSources] = useState([
    { id: 'sc1', name: 'LinkedIn Professional Jobs', active: true },
    { id: 'sc2', name: 'Naukri.com Enterprise Portal', active: true },
    { id: 'sc3', name: 'Internal Employee Referral', active: true },
    { id: 'sc4', name: 'Engineering College Campus Placement', active: true },
    { id: 'sc5', name: 'Direct Factory Walk-In Drive', active: true }
  ]);

  const [interviewRounds, setInterviewRounds] = useState([
    { id: 'ir1', name: 'Screening Phone Interview', durationMins: 30, mode: 'Telephonic' },
    { id: 'ir2', name: 'Structural & Technical Assessment', durationMins: 60, mode: 'In-Person Site' },
    { id: 'ir3', name: 'Plant Head Technical Interview', durationMins: 45, mode: 'Video Call' },
    { id: 'ir4', name: 'HR Culture & Compensation Discussion', durationMins: 45, mode: 'In-Person HQ' }
  ]);

  const [offerTemplates, setOfferTemplates] = useState([
    { id: 'ot1', name: 'Standard Site Engineer Offer Letter', designation: 'Site Engineer', probationMonths: 6, noticeDays: 30 },
    { id: 'ot2', name: 'Plant Operations Senior Engineer', designation: 'Production Head', probationMonths: 6, noticeDays: 60 },
    { id: 'ot3', name: 'Graduate Engineering Trainee (GET)', designation: 'Trainee Engineer', probationMonths: 12, noticeDays: 15 }
  ]);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
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
          { id: 'stages', label: `Hiring Pipeline Stages (${stages.length})`, icon: Layers },
          { id: 'sources', label: `Candidate Sources (${sources.length})`, icon: Users },
          { id: 'interview_types', label: `Interview Rounds (${interviewRounds.length})`, icon: UserCheck },
          { id: 'offer_templates', label: `Offer Letter Templates (${offerTemplates.length})`, icon: FileText }
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

      {/* TAB: HIRING PIPELINE STAGES */}
      {activeTab === 'stages' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Recruitment Pipeline Stages</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px' }}>Kanban workflow columns controlling candidate progression from sourcing to onboarding</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '700px' }}>
            {stages.map((st, idx) => (
              <div key={st.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: st.color, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.78rem' }}>
                    {idx + 1}
                  </span>
                  <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>{st.name}</h4>
                </div>
                <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>{st.count} Candidates in Stage</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: SOURCES */}
      {activeTab === 'sources' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Candidate Sourcing Channels</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px' }}>Channels tracked for recruitment cost-per-hire and conversion attribution</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {sources.map(sc => (
              <div key={sc.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>{sc.name}</h4>
                  <span style={{ backgroundColor: '#DCFCE7', color: '#166534', padding: '2px 8px', borderRadius: '4px', fontSize: '0.72rem', fontWeight: 700 }}>ACTIVE CHANNEL</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: INTERVIEW ROUNDS */}
      {activeTab === 'interview_types' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Interview Formats & Assessment Rounds</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px' }}>Standard evaluation rounds with expected durations and interviewing mediums</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {interviewRounds.map(ir => (
              <div key={ir.id} style={{ padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                <span style={{ backgroundColor: '#ECFEFF', color: '#0E7490', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, display: 'inline-block', marginBottom: '8px' }}>
                  {ir.mode}
                </span>
                <h4 style={{ margin: '0 0 6px', fontSize: '0.98rem', fontWeight: 800, color: '#1E293B' }}>{ir.name}</h4>
                <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Duration: <b>{ir.durationMins} Minutes</b></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: OFFER LETTER TEMPLATES */}
      {activeTab === 'offer_templates' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Offer Letter Templates & Variables</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px' }}>Official offer documents with placeholders for CTC, designation, and joining date</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
            {offerTemplates.map(ot => (
              <div key={ot.id} style={{ padding: '18px', borderRadius: '14px', border: '1px solid #E2E8F0', backgroundColor: '#F8FAFC' }}>
                <h4 style={{ margin: '0 0 8px', fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>{ot.name}</h4>
                <p style={{ margin: '0 0 8px', fontSize: '0.82rem', color: '#64748B' }}>Target Role: <b>{ot.designation}</b></p>
                <div style={{ fontSize: '0.8rem', color: '#475569', marginBottom: '12px' }}>
                  Probation: {ot.probationMonths} Mos | Notice: {ot.noticeDays} Days
                </div>
                <div style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: '#0E7490', backgroundColor: '#ECFEFF', padding: '6px 10px', borderRadius: '6px' }}>
                  Available: {'{{employee_name}}'}, {'{{ctc}}'}, {'{{joining_date}}'}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default RecruitmentSettings;
