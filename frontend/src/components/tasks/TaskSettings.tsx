import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  Sliders, 
  Bell, 
  ShieldAlert, 
  Award, 
  Check, 
  RefreshCw, 
  AlertTriangle, 
  Info 
} from 'lucide-react';
import { TaskEscalationRule, TaskPerformanceWeights } from '../../types/tasks';

export const TaskSettings: React.FC = () => {
  const { escalationRules, updateEscalationRule, taskWeights, updateTaskWeights } = useHRMS();

  // Local weights state
  const [weights, setWeights] = useState<TaskPerformanceWeights>({ ...taskWeights });
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Notification triggers toggles
  const [notifyRules, setNotifyRules] = useState({
    onAssigned: true,
    onStarted: true,
    onProgressUpdate: true,
    onEvidenceSubmitted: true,
    onTaskCompleted: true,
    onTaskClosed: true,
    onOverdueTrigger: true
  });

  const totalWeight = 
    Number(weights.taskCompletionWeight) +
    Number(weights.onTimeCompletionWeight) +
    Number(weights.attendanceWeight) +
    Number(weights.managerRatingWeight) +
    Number(weights.goalAchievementWeight);

  const handleSaveWeights = (e: React.FormEvent) => {
    e.preventDefault();
    if (totalWeight !== 100) {
      alert(`The sum of all performance weights must equal exactly 100%. Current sum: ${totalWeight}%`);
      return;
    }

    updateTaskWeights(weights);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="task-settings-container">
      {/* Header */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={22} color="#3b82f6" /> Task Policies, Escalations & Performance Weights
        </h2>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
          Configure multi-level automated escalation hierarchies, notification event triggers, and performance scorecard weighting.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
        {/* Left Side: Escalation Rules & Notification Triggers */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Automated Escalation Hierarchy */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldAlert size={20} color="#ef4444" />
                <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Automated Escalation Rules</h3>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Background cron trigger</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {escalationRules.map(rule => (
                <div 
                  key={rule.id} 
                  style={{ 
                    border: '1px solid var(--border-light)', 
                    borderRadius: '8px', 
                    padding: '14px', 
                    background: rule.isActive ? '#fff' : '#f8fafc' 
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ 
                        background: rule.level === 3 ? '#fee2e2' : rule.level === 2 ? '#ffedd5' : '#e0e7ff',
                        color: rule.level === 3 ? '#dc2626' : rule.level === 2 ? '#ea580c' : '#4338ca',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '4px'
                      }}>
                        LEVEL {rule.level} ESCALATION
                      </span>
                      <strong style={{ fontSize: '0.85rem' }}>{rule.triggerEvent}</strong>
                    </div>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={() => updateEscalationRule(rule.id, { isActive: !rule.isActive })}
                      />
                      <span>Active</span>
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '12px', fontSize: '0.78rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Trigger Delay:</span>
                      <div style={{ fontWeight: 700, marginTop: '2px' }}>+{rule.triggerDelayHours} Hours overdue</div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Notified Roles:</span>
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                        {rule.notifyRoles.map(role => (
                          <span key={role} style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', fontSize: '0.7rem' }}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginTop: '8px', fontSize: '0.75rem', color: '#475569', background: '#f8fafc', padding: '6px 10px', borderRadius: '4px' }}>
                    Action: <strong>{rule.escalationAction}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Automated Notification Triggers */}
          <div className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Bell size={20} color="#3b82f6" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Notification Trigger Events</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.82rem' }}>
              {[
                { key: 'onAssigned', label: 'Notify Assignees when a new task is assigned' },
                { key: 'onStarted', label: 'Notify Responsible Person when an employee starts work' },
                { key: 'onProgressUpdate', label: 'Send update alert when progress % is modified' },
                { key: 'onEvidenceSubmitted', label: 'Notify Reviewer when deliverable evidence is uploaded' },
                { key: 'onTaskCompleted', label: 'Notify Lead when all assignees hit 100% completion' },
                { key: 'onTaskClosed', label: 'Broadcast closure sign-off confirmation to all assignees' },
                { key: 'onOverdueTrigger', label: 'Send automated escalation warning upon passing due date' }
              ].map(item => (
                <label key={item.key} style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', padding: '4px 0' }}>
                  <input 
                    type="checkbox"
                    checked={(notifyRules as any)[item.key]}
                    onChange={() => setNotifyRules(prev => ({ ...prev, [item.key]: !(prev as any)[item.key] }))}
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side: HRMS Performance Module Weights Connection */}
        <div>
          <form onSubmit={handleSaveWeights} className="card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <Award size={20} color="#f59e0b" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0 }}>Performance Module Weighting</h3>
            </div>

            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '16px', lineHeight: '1.5' }}>
              Configure how live task completion metrics feed directly into the employee's holistic HRMS Performance Scorecard.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  <span>Task Completion Rate:</span>
                  <span style={{ color: '#2563eb' }}>{weights.taskCompletionWeight}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="80"
                  value={weights.taskCompletionWeight}
                  onChange={e => setWeights(prev => ({ ...prev, taskCompletionWeight: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  <span>On-Time Task Delivery Rate:</span>
                  <span style={{ color: '#2563eb' }}>{weights.onTimeCompletionWeight}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="60"
                  value={weights.onTimeCompletionWeight}
                  onChange={e => setWeights(prev => ({ ...prev, onTimeCompletionWeight: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  <span>Attendance & Punctuality Score:</span>
                  <span style={{ color: '#2563eb' }}>{weights.attendanceWeight}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="40"
                  value={weights.attendanceWeight}
                  onChange={e => setWeights(prev => ({ ...prev, attendanceWeight: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  <span>Manager Qualitative Rating:</span>
                  <span style={{ color: '#2563eb' }}>{weights.managerRatingWeight}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="30"
                  value={weights.managerRatingWeight}
                  onChange={e => setWeights(prev => ({ ...prev, managerRatingWeight: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600, marginBottom: '4px' }}>
                  <span>Goal / KPI Achievement:</span>
                  <span style={{ color: '#2563eb' }}>{weights.goalAchievementWeight}%</span>
                </div>
                <input 
                  type="range"
                  min="0"
                  max="30"
                  value={weights.goalAchievementWeight}
                  onChange={e => setWeights(prev => ({ ...prev, goalAchievementWeight: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Total Weight Verification Banner */}
            <div style={{ 
              padding: '12px 14px', 
              borderRadius: '8px', 
              background: totalWeight === 100 ? '#f0fdf4' : '#fef2f2',
              border: totalWeight === 100 ? '1px solid #86efac' : '1px solid #fecaca',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '16px'
            }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: totalWeight === 100 ? '#166534' : '#991b1b' }}>
                Total Allocated Weight:
              </span>
              <span style={{ fontSize: '1.1rem', fontWeight: 800, color: totalWeight === 100 ? '#166534' : '#991b1b' }}>
                {totalWeight}% {totalWeight === 100 ? '✓' : '(Must be 100%)'}
              </span>
            </div>

            {saveSuccess && (
              <div style={{ background: '#ecfdf5', color: '#059669', padding: '10px', borderRadius: '6px', fontSize: '0.8rem', textAlign: 'center', marginBottom: '14px' }}>
                ✓ Performance scorecard weights updated and synced successfully!
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={totalWeight !== 100}
              style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
            >
              <Check size={16} /> Save Performance Weights
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
