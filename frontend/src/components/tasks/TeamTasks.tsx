import React, { useState, useMemo } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  Users, 
  CheckCircle2, 
  ChevronRight,
  Filter,
  UserCheck,
  Building,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Eye
} from 'lucide-react';
import { computeDueStatus } from '../../types/tasks';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';

interface TeamTasksProps {
  onSelectTask: (taskId: string) => void;
}

export const TeamTasks: React.FC<TeamTasksProps> = ({ onSelectTask }) => {
  const { enhancedTasks, departments, currentUser } = useHRMS();

  const isManager = currentUser.role === 'Department Manager' || currentUser.role === 'Department Head' || currentUser.role === 'Manager';
  const targetDept = isManager ? currentUser.department : 'All';

  const [selectedDept, setSelectedDept] = useState<string>(targetDept || 'All');

  // Scoped tasks: Only include tasks with more than 2 members (> 2 assignees)
  // Requirement: "TEAM TASK LA INTHA MATHIRI 2 MEMBER KU MELA IRUTHA THA TEAM TASK LA VARANUM"
  const departmentTasks = useMemo(() => {
    return enhancedTasks.filter(t => {
      if (selectedDept !== 'All' && t.department !== selectedDept) return false;
      if (isManager && currentUser.department && t.department !== currentUser.department) return false;
      // Must have more than 2 members assigned
      const assigneeCount = t.assignees ? t.assignees.length : 0;
      return assigneeCount > 2;
    });
  }, [enhancedTasks, selectedDept, isManager, currentUser]);

  // Tasks to display
  const displayedTasks = departmentTasks;

  return (
    <div className="team-tasks-container">
      {/* Actionable Team Tasks Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, margin: 0, color: '#0F172A' }}>
            Team Tasks ({displayedTasks.length})
          </h3>

          {!isManager && (
            <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <select 
                value={selectedDept} 
                onChange={e => setSelectedDept(e.target.value)}
                className="form-select"
                style={{ 
                  fontSize: '0.82rem', 
                  fontWeight: 600,
                  color: '#0F172A',
                  height: '36px', 
                  lineHeight: '34px',
                  width: '210px',
                  borderRadius: '8px',
                  borderColor: '#CBD5E1',
                  paddingTop: 0,
                  paddingBottom: 0,
                  paddingLeft: '12px',
                  paddingRight: '32px',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  boxSizing: 'border-box',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.04)'
                }}
              >
                <option value="All">All Departments</option>
                {departments.map(d => (
                  <option key={d.id} value={d.name}>{d.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="table-responsive no-scrollbar" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
          <table className="hrms-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Task Number & Title</th>
                <th>Assignees</th>
                <th>Responsible Lead</th>
                <th>Due Date</th>
                <th>Priority</th>
                <th style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {displayedTasks.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    No team tasks with more than 2 members found for this department.
                  </td>
                </tr>
              ) : (
                displayedTasks.map(task => {
                  const dueStatus = computeDueStatus(task.dueDate, task.overallStatus);

                  return (
                    <tr key={task.id}>
                      <td>
                        <div 
                          style={{ fontWeight: 700, color: '#0E7490', cursor: 'pointer' }}
                          onClick={() => onSelectTask(task.id)}
                        >
                          {task.taskNumber}: {task.title}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {task.taskCategory} • {task.department}
                        </div>
                      </td>

                      <td>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          {task.assignees.map((a, idx) => (
                            a.employeeAvatar ? (
                              <img 
                                key={a.id || idx}
                                src={a.employeeAvatar}
                                alt={a.employeeName}
                                title={`${a.employeeName} (${a.progressPercentage}% - ${a.individualStatus})`}
                                style={{ 
                                  width: '24px', 
                                  height: '24px', 
                                  borderRadius: '99px', 
                                  border: '2px solid #fff', 
                                  marginLeft: idx > 0 ? '-6px' : '0',
                                  objectFit: 'cover'
                                }}
                              />
                            ) : (
                              <div
                                key={a.id || idx}
                                title={`${a.employeeName} (${a.progressPercentage}% - ${a.individualStatus})`}
                                style={{
                                  width: '24px',
                                  height: '24px',
                                  borderRadius: '99px',
                                  backgroundColor: '#0E7490',
                                  color: '#fff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.65rem',
                                  fontWeight: 700,
                                  border: '2px solid #fff',
                                  marginLeft: idx > 0 ? '-6px' : '0',
                                  flexShrink: 0
                                }}
                              >
                                {a.employeeName.charAt(0)}
                              </div>
                            )
                          ))}
                        </div>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.8rem', color: '#1e293b' }}>
                          {task.responsiblePersonName}
                        </span>
                      </td>

                      <td>
                        <span style={{ fontSize: '0.78rem', color: dueStatus === 'Overdue' ? '#dc2626' : 'inherit', fontWeight: dueStatus === 'Overdue' ? 700 : 400 }}>
                          {formatDateDDMMYYYY(task.dueDate)}
                        </span>
                      </td>

                      <td>
                        <span className={`priority-pill ${task.priority.toLowerCase()}`} style={{ fontSize: '0.72rem' }}>
                          {task.priority}
                        </span>
                      </td>

                      <td style={{ minWidth: '180px', whiteSpace: 'nowrap' }}>
                        <span className={`status-pill ${
                          task.overallStatus === 'COMPLETED' ? 'present' :
                          task.overallStatus === 'CLOSED' ? 'present' :
                          task.overallStatus === 'OVERDUE' ? 'rejected' :
                          task.overallStatus === 'IN PROGRESS' ? 'late' : 'half-day'
                        }`} style={{ fontSize: '0.70rem', padding: '3px 8px', whiteSpace: 'nowrap', display: 'inline-block' }}>
                          {task.overallStatus}
                        </span>
                      </td>

                      <td style={{ textAlign: 'right' }}>
                        <button 
                          type="button"
                          className="btn btn-sm"
                          onClick={() => onSelectTask(task.id)}
                          title="View Task Details"
                          aria-label="View Task Details"
                          style={{
                            width: '32px',
                            height: '32px',
                            padding: 0,
                            borderRadius: '8px',
                            border: '1px solid #CFFAFE',
                            background: '#ECFEFF',
                            color: '#0E7490',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = '#0E7490';
                            e.currentTarget.style.color = '#FFFFFF';
                            e.currentTarget.style.borderColor = '#0E7490';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = '#ECFEFF';
                            e.currentTarget.style.color = '#0E7490';
                            e.currentTarget.style.borderColor = '#CFFAFE';
                          }}
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
