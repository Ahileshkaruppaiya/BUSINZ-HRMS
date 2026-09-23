import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  GitFork, 
  Plus, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  Save, 
  X, 
  ShieldCheck, 
  Clock, 
  ArrowRight,
  UserCheck,
  Check
} from 'lucide-react';
import { ApprovalWorkflowItem, ApprovalWorkflowLevel } from '../../types/hrms';

export const ApprovalWorkflowSettings: React.FC = () => {
  const { 
    approvalWorkflows, 
    addApprovalWorkflow, 
    updateApprovalWorkflow, 
    deleteApprovalWorkflow 
  } = useHRMS();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>(approvalWorkflows[0]?.id || 'wf-leave');
  
  // Modal for adding a new stage
  const [isStageModalOpen, setIsStageModalOpen] = useState(false);
  const [stageForm, setStageForm] = useState({
    role: 'Department Head',
    title: 'Department Sign-Off',
    timeLimitHours: 24
  });

  const selectedWorkflow = approvalWorkflows.find(w => w.id === selectedWorkflowId) || approvalWorkflows[0];

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAddStage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedWorkflow) return;
    const newLevel: ApprovalWorkflowLevel = {
      level: selectedWorkflow.levels.length + 1,
      role: stageForm.role,
      title: stageForm.title,
      timeLimitHours: stageForm.timeLimitHours
    };
    const updatedLevels = [...selectedWorkflow.levels, newLevel];
    updateApprovalWorkflow(selectedWorkflow.id, { levels: updatedLevels });
    setIsStageModalOpen(false);
    triggerToast(`Added Level ${newLevel.level} to "${selectedWorkflow.workflowName}"`);
  };

  const handleDeleteStage = (levelIdx: number) => {
    if (!selectedWorkflow || selectedWorkflow.levels.length <= 1) {
      alert('Workflows must retain at least one approval level');
      return;
    }
    const updatedLevels = selectedWorkflow.levels
      .filter((_, idx) => idx !== levelIdx)
      .map((lvl, idx) => ({ ...lvl, level: idx + 1 }));
    updateApprovalWorkflow(selectedWorkflow.id, { levels: updatedLevels });
    triggerToast(`Approval level removed`);
  };

  const handleToggleWorkflowActive = (id: string, current: boolean) => {
    updateApprovalWorkflow(id, { active: !current });
    triggerToast(`Workflow status updated`);
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

      {/* Main Two-Pane Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 340px) 1fr', gap: '20px' }}>
        {/* Left Pane: Workflow Selector */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '20px' }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.05rem', fontWeight: 800, color: '#1E293B' }}>Approval Modules</h3>
          <p style={{ margin: '0 0 16px', fontSize: '0.82rem', color: '#64748B' }}>Select workflow to configure sequential multi-tier stages</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {approvalWorkflows.map(wf => {
              const isSelected = selectedWorkflow?.id === wf.id;
              return (
                <div
                  key={wf.id}
                  onClick={() => setSelectedWorkflowId(wf.id)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: isSelected ? '1px solid #0E7490' : '1px solid #F1F5F9',
                    backgroundColor: isSelected ? '#ECFEFF' : '#F8FAFC',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: isSelected ? '#0E7490' : '#64748B' }}>
                      {wf.module.toUpperCase()}
                    </span>
                    <span style={{ 
                      backgroundColor: wf.active ? '#DCFCE7' : '#F1F5F9', 
                      color: wf.active ? '#166534' : '#64748B', 
                      padding: '2px 6px', 
                      borderRadius: '4px', 
                      fontSize: '0.7rem', 
                      fontWeight: 700 
                    }}>
                      {wf.active ? 'ACTIVE' : 'PAUSED'}
                    </span>
                  </div>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, color: isSelected ? '#0E7490' : '#1E293B' }}>
                    {wf.workflowName}
                  </h4>
                  <div style={{ fontSize: '0.78rem', color: '#64748B', marginTop: '4px' }}>
                    {wf.levels.length} Tier Sequential Sequence
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Selected Workflow Sequence Designer */}
        {selectedWorkflow && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '16px', border: '1px solid #E7ECF3', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ backgroundColor: '#ECFEFF', color: '#0E7490', padding: '3px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 800 }}>
                  {selectedWorkflow.module.toUpperCase()} WORKFLOW
                </span>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: '6px 0 2px' }}>
                  {selectedWorkflow.workflowName}
                </h2>
                <p style={{ fontSize: '0.85rem', color: '#64748B', margin: 0 }}>
                  {selectedWorkflow.description}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleToggleWorkflowActive(selectedWorkflow.id, selectedWorkflow.active)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    background: '#ffffff',
                    fontWeight: 600,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  {selectedWorkflow.active ? 'Pause Workflow' : 'Activate Workflow'}
                </button>
                <button
                  onClick={() => setIsStageModalOpen(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    backgroundColor: '#0E7490',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '8px 16px',
                    fontWeight: 700,
                    fontSize: '0.82rem',
                    cursor: 'pointer'
                  }}
                >
                  <Plus size={15} />
                  <span>Add Approval Level</span>
                </button>
              </div>
            </div>

            {/* Stages Flow Visualizer */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {selectedWorkflow.levels.map((lvl, idx) => (
                <div key={lvl.level} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Step Card */}
                  <div style={{
                    flex: 1,
                    padding: '16px 20px',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    backgroundColor: '#F8FAFC',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        backgroundColor: '#0E7490',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem'
                      }}>
                        L{lvl.level}
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#0E7490', textTransform: 'uppercase' }}>
                          Role: {lvl.role}
                        </span>
                        <h4 style={{ margin: '2px 0 0', fontSize: '1rem', fontWeight: 800, color: '#1E293B' }}>
                          {lvl.title}
                        </h4>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#64748B' }}>
                        <Clock size={14} />
                        <span>SLA: {lvl.timeLimitHours || 24} Hours</span>
                      </div>
                      <button
                        onClick={() => handleDeleteStage(idx)}
                        title="Remove Stage"
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '4px' }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Flow Arrow */}
                  {idx < selectedWorkflow.levels.length - 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', color: '#94A3B8' }}>
                      <ArrowRight size={20} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Final Execution Banner */}
            <div style={{
              marginTop: '24px',
              padding: '14px 18px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <CheckCircle2 size={18} color="#166534" />
              <span style={{ fontSize: '0.85rem', color: '#166534', fontWeight: 600 }}>
                Upon Level {selectedWorkflow.levels.length} authorization, the request will auto-finalize and trigger balance debit or payroll adjustment.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* STAGE MODAL */}
      {isStageModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.45)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div style={{ backgroundColor: '#ffffff', borderRadius: '20px', width: '100%', maxWidth: '480px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#1E293B' }}>Add Approval Level</h3>
              <button onClick={() => setIsStageModalOpen(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddStage} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Approver Role *</label>
                <select
                  value={stageForm.role}
                  onChange={e => setStageForm({ ...stageForm, role: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                >
                  <option value="Reporting Manager">Direct Reporting Manager</option>
                  <option value="Department Head">Department Head / Production Head</option>
                  <option value="HR Admin">HR Administrator</option>
                  <option value="Finance Manager">Finance & Accounts Manager</option>
                  <option value="CEO / Super Admin">Managing Director / CEO</option>
                  <option value="Store Keeper / IT Admin">IT Admin / Tool Store Keeper</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>Stage Title *</label>
                <input
                  type="text"
                  required
                  value={stageForm.title}
                  onChange={e => setStageForm({ ...stageForm, title: e.target.value })}
                  placeholder="e.g. Budget Verification & Sanction"
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>SLA / Auto-Escalation (Hours)</label>
                <input
                  type="number"
                  min={1}
                  value={stageForm.timeLimitHours}
                  onChange={e => setStageForm({ ...stageForm, timeLimitHours: Number(e.target.value) })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsStageModalOpen(false)} style={{ padding: '10px 18px', borderRadius: '10px', border: '1px solid #CBD5E1', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '10px 20px', borderRadius: '10px', border: 'none', background: '#0E7490', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Add Level</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default ApprovalWorkflowSettings;
