import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  Calendar, 
  Clock, 
  Users, 
  Link2, 
  CheckCircle2, 
  ArrowRight, 
  Plus, 
  RefreshCw, 
  FileText, 
  CheckSquare, 
  AlertCircle,
  Building,
  UserCheck
} from 'lucide-react';
import { MOMMeeting, MOMActionItem, TaskPriority } from '../../types/tasks';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';

interface MOMIntegrationViewProps {
  onOpenTask: (taskId: string) => void;
}

export const MOMIntegrationView: React.FC<MOMIntegrationViewProps> = ({ onOpenTask }) => {
  const { momMeetings, enhancedTasks, employees, convertMOMActionToTask, syncMOMTask, currentUser } = useHRMS();

  const [selectedMeetingId, setSelectedMeetingId] = useState<string>(momMeetings[0]?.id || '');
  
  const currentEmpId = currentUser.employeeId || currentUser.id || '';
  const currentEmpName = (currentUser.name || '').trim().toLowerCase();

  // Tasks cannot be assigned to oneself ("oru person own task assign pannakudathu")
  const isSelf = (empOrId: string | { id?: string; employeeId?: string; firstName?: string; lastName?: string }) => {
    if (!empOrId) return false;
    const empId = typeof empOrId === 'string' ? empOrId : (empOrId.employeeId || empOrId.id || '');
    const empObj = typeof empOrId === 'object' && (empOrId.firstName || empOrId.lastName)
      ? empOrId 
      : employees.find(e => e.employeeId === empId || e.id === empId);

    if (currentEmpId && empId && (empId.toLowerCase() === currentEmpId.toLowerCase())) return true;
    if (currentUser.id && empId && (empId.toLowerCase() === currentUser.id.toLowerCase())) return true;
    if (currentUser.employeeId && empId && (empId.toLowerCase() === currentUser.employeeId.toLowerCase())) return true;

    if (currentUser.email && empObj && (empObj as any).email && ((empObj as any).email.toLowerCase() === currentUser.email.toLowerCase())) return true;

    const targetName = empObj ? `${empObj.firstName || ''} ${empObj.lastName || ''}`.trim().toLowerCase() : '';
    if (currentEmpName && targetName) {
      if (targetName === currentEmpName) return true;
      if (currentEmpName.includes(targetName) || targetName.includes(currentEmpName)) return true;
      const currentParts = currentEmpName.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(p => p.length > 2 && !['admin', 'manager', 'head', 'ceo', 'lead', 'specialist', 'executive'].includes(p));
      const targetParts = targetName.replace(/[^a-z0-9]/g, ' ').split(/\s+/).filter(p => p.length > 2);
      if (currentParts.some(cp => targetParts.some(tp => cp === tp || cp.includes(tp) || tp.includes(cp)))) {
        return true;
      }
    }
    return false;
  };

  const assignableEmployees = employees.filter(emp => !isSelf(emp));
  const defaultEmp = assignableEmployees.find(e => e.designation !== 'CEO' && e.employeeId !== 'EMP-000') || assignableEmployees[0];
  const defaultEmpId = defaultEmp?.employeeId || (assignableEmployees[0]?.employeeId) || '';

  // Convert Action Item Modal State
  const [convertingItem, setConvertingItem] = useState<{ meeting: MOMMeeting; item: MOMActionItem } | null>(null);
  const [assigneeEmployeeIds, setAssigneeEmployeeIds] = useState<string[]>(defaultEmpId ? [defaultEmpId] : []);
  const [responsiblePersonId, setResponsiblePersonId] = useState<string>(defaultEmpId);
  const [targetCategory, setTargetCategory] = useState<string>('Operations');

  const selectedMeeting = momMeetings.find(m => m.id === selectedMeetingId) || momMeetings[0];

  const handleOpenConvertModal = (meeting: MOMMeeting, item: MOMActionItem) => {
    setConvertingItem({ meeting, item });
    setAssigneeEmployeeIds(defaultEmpId ? [defaultEmpId] : []);
    setResponsiblePersonId(defaultEmpId);
  };

  const handleExecuteConvert = (e: React.FormEvent) => {
    e.preventDefault();
    if (!convertingItem) return;

    const { meeting, item } = convertingItem;
    const respEmp = employees.find(e => e.employeeId === responsiblePersonId);

    const assignees = assigneeEmployeeIds.map((empId, idx) => {
      const emp = employees.find(e => e.employeeId === empId);
      return {
        id: `ASN-${Date.now()}-${idx}`,
        taskId: '',
        employeeId: empId,
        employeeName: emp ? `${emp.firstName} ${emp.lastName}` : 'Assignee',
        employeeEmail: emp?.email || '',
        employeeDepartment: emp?.department || item.department,
        employeeAvatar: emp?.avatar || '',
        role: (empId === responsiblePersonId ? 'RESPONSIBLE' : 'ASSIGNEE'),
        individualStatus: 'Pending' as any,
        progressPercentage: 0,
        assignedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    const newTask = convertMOMActionToTask(meeting.id, item.id);
    setConvertingItem(null);
    if (newTask) {
      onOpenTask(newTask.id);
    }
  };

  const handleSyncAll = () => {
    if (!selectedMeeting) return;
    selectedMeeting.actionItems.forEach(item => {
      if (item.linkedTaskId) {
        syncMOMTask(item.linkedTaskId);
      }
    });
    alert('Synchronized MOM action item statuses with live Task Manager.');
  };

  return (
    <div className="mom-integration-container">
      {/* Top Selector & Actions */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Link2 size={22} color="#8b5cf6" /> Minutes of Meeting (MOM) & Task Generator
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Convert recorded meeting action items directly into enterprise tasks with multi-employee assignment and automatic status synchronization.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleSyncAll}
              style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
              <RefreshCw size={13} /> Sync All Statuses
            </button>
          </div>
        </div>
      </div>

      {/* Main Layout: Meeting Selector List + Selected Meeting Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px' }}>
        {/* Left Side: Meeting List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#475569', margin: '0 0 4px 4px' }}>
            Available Meetings ({momMeetings.length})
          </h3>
          {momMeetings.map(meeting => {
            const isSelected = selectedMeeting?.id === meeting.id;
            const convertedCount = meeting.actionItems.filter(i => i.linkedTaskId).length;

            return (
              <div
                key={meeting.id}
                onClick={() => setSelectedMeetingId(meeting.id)}
                className="card"
                style={{ 
                  padding: '14px', 
                  border: isSelected ? '2px solid #8b5cf6' : '1px solid var(--border-light)',
                  background: isSelected ? '#faf5ff' : '#fff',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem', color: '#7c3aed' }}>
                    {meeting.meetingNumber}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {meeting.meetingDate}
                  </span>
                </div>

                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0f172a', margin: '0 0 6px 0' }}>
                  {meeting.meetingTitle}
                </h4>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  <span>{meeting.department}</span>
                  <span style={{ color: convertedCount > 0 ? '#10b981' : '#64748b', fontWeight: 600 }}>
                    {convertedCount}/{meeting.actionItems.length} Tasks Created
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Side: Meeting Action Items & Details */}
        {selectedMeeting && (
          <div>
            {/* Meeting Info Card */}
            <div className="card" style={{ padding: '20px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ background: '#f5f3ff', color: '#7c3aed', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem' }}>
                      {selectedMeeting.meetingNumber}
                    </span>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {selectedMeeting.meetingDate} • {selectedMeeting.startTime} - {selectedMeeting.endTime}
                    </span>
                  </div>
                  <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                    {selectedMeeting.meetingTitle}
                  </h2>
                </div>

                <div style={{ textAlign: 'right', fontSize: '0.78rem' }}>
                  <div style={{ fontWeight: 600, color: '#334155' }}>Organizer: {selectedMeeting.organizerName}</div>
                  <div style={{ color: 'var(--text-muted)' }}>{selectedMeeting.department}</div>
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: '12px 14px', borderRadius: '8px', fontSize: '0.82rem', color: '#475569', lineHeight: '1.5' }}>
                <strong>Executive Summary:</strong> {selectedMeeting.summary}
              </div>
            </div>

            {/* Action Items List Table */}
            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0 }}>
                  Recorded Action Items ({selectedMeeting.actionItems.length})
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Click "Convert to Task" to generate multi-assignee task
                </span>
              </div>

              <div className="table-responsive">
                <table className="hrms-table">
                  <thead>
                    <tr>
                      <th>Item No</th>
                      <th>Action Item Title</th>
                      <th>Department</th>
                      <th>Due Date</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Integration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedMeeting.actionItems.map(item => {
                      const linkedTask = item.linkedTaskId ? enhancedTasks.find(t => t.id === item.linkedTaskId) : null;

                      return (
                        <tr key={item.id}>
                          <td>
                            <span style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: '0.78rem', color: '#7c3aed' }}>
                              {item.itemNumber}
                            </span>
                          </td>

                          <td>
                            <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0f172a' }}>
                              {item.title}
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                              {item.description}
                            </div>
                          </td>

                          <td>
                            <span style={{ fontSize: '0.78rem', color: '#475569' }}>{item.department}</span>
                          </td>

                          <td>
                            <span style={{ fontSize: '0.78rem' }}>{formatDateDDMMYYYY(item.dueDate)}</span>
                          </td>

                          <td>
                            <span className={`priority-pill ${item.priority.toLowerCase()}`} style={{ fontSize: '0.72rem' }}>
                              {item.priority}
                            </span>
                          </td>

                          <td>
                            <span className={`status-pill ${
                              item.status === 'Completed' ? 'present' :
                              item.status === 'Task Created' ? 'late' : 'half-day'
                            }`} style={{ fontSize: '0.7rem' }}>
                              {item.status}
                            </span>
                          </td>

                          <td style={{ textAlign: 'right' }}>
                            {item.linkedTaskId && linkedTask ? (
                              <button 
                                className="btn btn-secondary btn-sm"
                                onClick={() => onOpenTask(item.linkedTaskId!)}
                                style={{ fontSize: '0.75rem', color: '#2563eb', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              >
                                <CheckSquare size={13} /> {linkedTask.taskNumber}
                              </button>
                            ) : (
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={() => handleOpenConvertModal(selectedMeeting, item)}
                                style={{ fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#8b5cf6', borderColor: '#8b5cf6' }}
                              >
                                <Plus size={13} /> Convert to Task
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Convert MOM Action Item to Task Modal */}
      {convertingItem && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Convert MOM Action Item to Task</h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {convertingItem.meeting.meetingNumber} • Item {convertingItem.item.itemNumber}
                </span>
              </div>
              <button onClick={() => setConvertingItem(null)}>✕</button>
            </div>

            <form onSubmit={handleExecuteConvert} className="modal-body" style={{ padding: '20px' }}>
              <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', padding: '12px', borderRadius: '8px', marginBottom: '16px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#581c87' }}>
                  {convertingItem.item.title}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#6b21a8', marginTop: '4px' }}>
                  {convertingItem.item.description}
                </div>
                <div style={{ display: 'flex', gap: '16px', fontSize: '0.72rem', color: '#7e22ce', marginTop: '6px' }}>
                  <span>Department: <strong>{convertingItem.item.department}</strong></span>
                  <span>Due Date: <strong>{formatDateDDMMYYYY(convertingItem.item.dueDate)}</strong></span>
                  <span>Priority: <strong>{convertingItem.item.priority}</strong></span>
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Responsible Person (Lead Reviewer) *</label>
                <select 
                  value={responsiblePersonId}
                  onChange={e => {
                    setResponsiblePersonId(e.target.value);
                    if (!assigneeEmployeeIds.includes(e.target.value)) {
                      setAssigneeEmployeeIds(prev => [...prev, e.target.value]);
                    }
                  }}
                  className="form-control"
                  style={{ marginTop: '4px' }}
                  required
                >
                  {assignableEmployees.map(emp => (
                    <option key={emp.id} value={emp.employeeId}>
                      {emp.firstName} {emp.lastName} ({emp.department} - {emp.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Assign Employees (Multi-Assignee)</label>
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: '6px', padding: '8px', marginTop: '4px' }}>
                  {assignableEmployees.map(emp => (
                    <label key={emp.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '4px', cursor: 'pointer', fontSize: '0.8rem' }}>
                      <input 
                        type="checkbox"
                        checked={assigneeEmployeeIds.includes(emp.employeeId)}
                        onChange={() => {
                          setAssigneeEmployeeIds(prev => 
                            prev.includes(emp.employeeId)
                              ? prev.filter(id => id !== emp.employeeId)
                              : [...prev, emp.employeeId]
                          );
                        }}
                      />
                      <span>{emp.firstName} {emp.lastName} ({emp.department})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setConvertingItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: '#8b5cf6', borderColor: '#8b5cf6' }}>
                  Generate Task Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
