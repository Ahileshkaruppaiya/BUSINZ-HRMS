import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  Award, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Save, 
  X, 
  Gift, 
  TrendingUp, 
  Star, 
  Target, 
  Sliders 
} from 'lucide-react';

export const PerformanceRewardSettings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'review_cycles' | 'kpis' | 'rating_scales' | 'rewards'>('rewards');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Review Cycles
  const [cycles, setCycles] = useState([
    { id: 'rc1', name: 'Q1 FY26 Performance Appraisal', period: 'Apr 2026 - Jun 2026', status: 'Completed', deadline: '15 Jul 2026' },
    { id: 'rc2', name: 'Q2 FY26 Mid-Year Review', period: 'Jul 2026 - Sep 2026', status: 'Active (Open)', deadline: '15 Oct 2026' },
    { id: 'rc3', name: 'Annual Leadership Appraisal 2026', period: 'Apr 2026 - Mar 2027', status: 'Upcoming', deadline: '30 Apr 2027' }
  ]);

  // KRA / KPI Templates
  const [kpis, setKpis] = useState([
    { id: 'kpi1', category: 'Operational Productivity', metric: 'Fabrication Output Tonnage vs Monthly Target', target: '>= 95%', weight: '30%' },
    { id: 'kpi2', category: 'Safety & EHS Compliance', metric: 'Zero Lost Time Incidents (LTI) on Project Site', target: '0 Incidents', weight: '25%' },
    { id: 'kpi3', category: 'Attendance & Discipline', metric: 'On-Time Punch In and Minimum 95% Monthly Attendance', target: '>= 95%', weight: '20%' },
    { id: 'kpi4', category: 'Quality & QA/QC', metric: 'Weld Defect Rate Under 1.5% in Inspection Tests', target: '< 1.5%', weight: '25%' }
  ]);

  // Reward Types (Preserving existing Reward Configuration from RewardsSettings.tsx)
  const [rewards, setRewards] = useState([
    { id: 'rw1', name: '100% Monthly Attendance Award', rewardType: 'Cash Bonus', value: '₹1,500', cycle: 'Monthly', status: 'Active' },
    { id: 'rw2', name: 'Employee of the Month (Star Performer)', rewardType: 'Cash + Certificate', value: '₹5,000', cycle: 'Monthly', status: 'Active' },
    { id: 'rw3', name: 'Zero Incident Safety Champion Award', rewardType: 'Cash Bonus', value: '₹3,000', cycle: 'Quarterly', status: 'Active' },
    { id: 'rw4', name: 'Long Service Excellence Award (5+ Years)', rewardType: 'Gold Coin Memento', value: '₹25,000', cycle: 'Annual', status: 'Active' }
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
          { id: 'rewards', label: `Rewards & Recognitions (${rewards.length})`, icon: Gift },
          { id: 'review_cycles', label: `Review Cycles (${cycles.length})`, icon: TrendingUp },
          { id: 'kpis', label: `KPI & KRA Templates (${kpis.length})`, icon: Target },
          { id: 'rating_scales', label: 'Rating Scales', icon: Star }
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

      {/* TAB: REWARDS */}
      {activeTab === 'rewards' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>Reward Types & Spot Awards</h2>
              <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '4px 0 0' }}>Monetary and recognition awards tied to attendance punctuality, safety and milestone achievements</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {rewards.map(rw => (
              <div key={rw.id} style={{ border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', backgroundColor: '#F8FAFC' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                  <span style={{ backgroundColor: '#ECFEFF', color: '#0E7490', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                    {rw.cycle.toUpperCase()}
                  </span>
                  <span style={{ fontSize: '1.05rem', fontWeight: 900, color: '#0E7490' }}>{rw.value}</span>
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>{rw.name}</h4>
                <div style={{ fontSize: '0.82rem', color: '#64748B' }}>Type: <b>{rw.rewardType}</b></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: REVIEW CYCLES */}
      {activeTab === 'review_cycles' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>Performance Appraisal Cycles</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px' }}>Periodic evaluation windows for self-appraisal, manager feedback, and normalization</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {cycles.map(cy => (
              <div key={cy.id} style={{ border: '1px solid #E2E8F0', borderRadius: '14px', padding: '18px', backgroundColor: '#F8FAFC' }}>
                <span style={{ 
                  backgroundColor: cy.status.includes('Active') ? '#DCFCE7' : '#F1F5F9', 
                  color: cy.status.includes('Active') ? '#166534' : '#64748B', 
                  padding: '3px 8px', 
                  borderRadius: '4px', 
                  fontSize: '0.75rem', 
                  fontWeight: 700, 
                  display: 'inline-block', 
                  marginBottom: '8px' 
                }}>
                  {cy.status}
                </span>
                <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>{cy.name}</h4>
                <div style={{ fontSize: '0.82rem', color: '#64748B', marginBottom: '4px' }}>Period: {cy.period}</div>
                <div style={{ fontSize: '0.82rem', color: '#0E7490', fontWeight: 600 }}>Deadline: {cy.deadline}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: KPIS */}
      {activeTab === 'kpis' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>KRA & KPI Performance Templates</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px' }}>Standard industrial metric weightages governing employee evaluation scores</p>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #F1F5F9', backgroundColor: '#F8FAFC' }}>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Category</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Metric Definition</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Benchmark Target</th>
                  <th style={{ padding: '12px 16px', fontSize: '0.78rem', fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Weightage</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map(kpi => (
                  <tr key={kpi.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                    <td style={{ padding: '14px 16px', fontWeight: 700, color: '#1E293B', fontSize: '0.88rem' }}>{kpi.category}</td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', color: '#475569' }}>{kpi.metric}</td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem', fontWeight: 700, color: '#0E7490' }}>{kpi.target}</td>
                    <td style={{ padding: '14px 16px', fontSize: '0.85rem' }}>
                      <span style={{ backgroundColor: '#ECFEFF', color: '#0E7490', padding: '3px 8px', borderRadius: '4px', fontWeight: 800, fontSize: '0.78rem' }}>
                        {kpi.weight}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: RATING SCALES */}
      {activeTab === 'rating_scales' && (
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px' }}>5-Point Performance Rating Scale</h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '0 0 20px' }}>Standardized evaluation scoring matrix applied in annual increments and appraisals</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '750px' }}>
            {[
              { score: 5, label: 'Exceptional (Role Model)', desc: 'Consistently surpasses stretch targets; demonstrated leadership and zero errors', color: '#166534', bg: '#DCFCE7' },
              { score: 4, label: 'Exceeds Expectations', desc: 'Frequently beats deadlines; high-quality fabrication and proactive problem resolution', color: '#0E7490', bg: '#ECFEFF' },
              { score: 3, label: 'Meets Expectations (Proficient)', desc: 'Reliably accomplishes assigned milestones in adherence to safety protocols', color: '#1E40AF', bg: '#DBEAFE' },
              { score: 2, label: 'Needs Improvement', desc: 'Output inconsistency or attendance shortcomings requiring active PIP supervision', color: '#854D0E', bg: '#FEF9C3' },
              { score: 1, label: 'Unsatisfactory', desc: 'Substantial failure to meet basic performance and safety compliance criteria', color: '#991B1B', bg: '#FEE2E2' }
            ].map(r => (
              <div key={r.score} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', backgroundColor: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: r.bg, color: r.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '0.9rem' }}>
                    {r.score}
                  </span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#1E293B' }}>{r.label}</h4>
                    <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748B' }}>{r.desc}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
export default PerformanceRewardSettings;
