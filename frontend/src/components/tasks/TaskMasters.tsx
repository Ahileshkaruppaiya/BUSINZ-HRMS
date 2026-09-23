import React, { useState } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { 
  Settings2, 
  Plus, 
  Trash2, 
  Edit2, 
  Check, 
  X, 
  CheckSquare,
  Tag, 
  Flag, 
  CheckCircle2, 
  AlertCircle, 
  ListOrdered 
} from 'lucide-react';
import { TaskMasterItem } from '../../types/tasks';

export const TaskMasters: React.FC = () => {
  const { taskMasters, addTaskMaster, updateTaskMaster, deleteTaskMaster } = useHRMS();

  const [activeType, setActiveType] = useState<
    'TaskCategory' | 'Priority' | 'TaskStatus' | 'ReasonForDelay' | 'ProgressBand' | 'DependencyType'
  >('TaskCategory');

  // Form State to Add New Master
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newCode, setNewCode] = useState<string>('');
  const [newColor, setNewColor] = useState<string>('#3b82f6');

  // Editing Item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editCode, setEditCode] = useState<string>('');
  const [editColor, setEditColor] = useState<string>('');

  const currentMasters = taskMasters.filter(m => m.type === activeType);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newCode.trim()) return;

    addTaskMaster({
      type: activeType,
      name: newName.trim(),
      code: newCode.trim().toUpperCase(),
      color: newColor,
      order: currentMasters.length + 1,
      isActive: true
    });

    setNewName('');
    setNewCode('');
    setShowAddForm(false);
  };

  const startEdit = (item: TaskMasterItem) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditCode(item.code);
    setEditColor(item.color || '#3b82f6');
  };

  const handleSaveEdit = (id: string) => {
    updateTaskMaster(id, {
      name: editName.trim(),
      code: editCode.trim().toUpperCase(),
      color: editColor
    });
    setEditingId(null);
  };

  return (
    <div className="task-masters-container">
      {/* Header */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Settings2 size={22} color="#3b82f6" /> Task Module Masters & Configuration
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Configure task categories, priority thresholds, lifecycle statuses, and reasons for delay.
            </p>
          </div>

          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowAddForm(!showAddForm)}
            style={{ fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
          >
            <Plus size={14} /> Add {activeType.replace('_', ' ')}
          </button>
        </div>
      </div>

      {/* Master Types Sub-Tabs */}
      <div className="tab-container" style={{ marginBottom: '20px' }}>
        {[
          { id: 'TaskCategory', label: 'Task Categories', icon: Tag },
          { id: 'Priority', label: 'Task Priorities', icon: Flag },
          { id: 'TaskStatus', label: 'Overall Statuses', icon: CheckCircle2 },
          { id: 'ReasonForDelay', label: 'Reasons for Delay', icon: AlertCircle },
          { id: 'ProgressBand', label: 'Progress Bands', icon: ListOrdered },
          { id: 'DependencyType', label: 'Dependency Types', icon: CheckSquare }
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeType === tab.id ? 'active' : ''}`}
              onClick={() => { setActiveType(tab.id as any); setShowAddForm(false); setEditingId(null); }}
              style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Icon size={14} /> {tab.label}
            </button>
          );
        })}
      </div>

      {/* Inline Create Form */}
      {showAddForm && (
        <form onSubmit={handleCreate} className="card" style={{ padding: '16px', marginBottom: '20px', background: '#f8fafc', border: '1px solid #cbd5e1' }}>
          <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '12px' }}>
            Add New {activeType.replace('_', ' ').toUpperCase()}
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '12px', alignItems: 'flex-end' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Name / Label *</label>
              <input 
                type="text"
                placeholder="e.g. Cybersecurity Audit"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="form-control"
                style={{ height: '36px', fontSize: '0.82rem', marginTop: '3px' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Code *</label>
              <input 
                type="text"
                placeholder="e.g. CYBER"
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                className="form-control"
                style={{ height: '36px', fontSize: '0.82rem', marginTop: '3px' }}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 600 }}>Color Badge</label>
              <input 
                type="color"
                value={newColor}
                onChange={e => setNewColor(e.target.value)}
                style={{ width: '100%', height: '36px', padding: '2px', borderRadius: '6px', border: '1px solid var(--border-medium)', marginTop: '3px' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button type="submit" className="btn btn-primary btn-sm" style={{ height: '36px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Check size={14} /> Save
              </button>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShowAddForm(false)} style={{ height: '36px' }}>
                <X size={14} />
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Master Data Table */}
      <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
        <div className="table-responsive">
          <table className="hrms-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Color</th>
                <th>Name / Description</th>
                <th>System Code</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentMasters.map(item => {
                const isEditing = editingId === item.id;

                return (
                  <tr key={item.id}>
                    <td>
                      {isEditing ? (
                        <input 
                          type="color" 
                          value={editColor} 
                          onChange={e => setEditColor(e.target.value)}
                          style={{ width: '32px', height: '32px', border: 'none', background: 'transparent' }}
                        />
                      ) : (
                        <span 
                          style={{ 
                            display: 'inline-block', 
                            width: '20px', 
                            height: '20px', 
                            borderRadius: '4px', 
                            background: item.color || '#94a3b8' 
                          }} 
                        />
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)}
                          className="form-control"
                          style={{ height: '32px', fontSize: '0.82rem' }}
                        />
                      ) : (
                        <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{item.name}</span>
                      )}
                    </td>

                    <td>
                      {isEditing ? (
                        <input 
                          type="text" 
                          value={editCode} 
                          onChange={e => setEditCode(e.target.value)}
                          className="form-control"
                          style={{ height: '32px', fontSize: '0.82rem' }}
                        />
                      ) : (
                        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.75rem' }}>
                          {item.code}
                        </code>
                      )}
                    </td>

                    <td>
                      <span 
                        onClick={() => updateTaskMaster(item.id, { isActive: !item.isActive })}
                        style={{ 
                          cursor: 'pointer',
                          fontSize: '0.72rem', 
                          padding: '2px 8px', 
                          borderRadius: '99px',
                          background: item.isActive ? '#ecfdf5' : '#f1f5f9',
                          color: item.isActive ? '#059669' : '#64748b',
                          fontWeight: 700 
                        }}
                      >
                        {item.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      {isEditing ? (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px' }}>
                          <button className="btn btn-primary btn-sm" onClick={() => handleSaveEdit(item.id)} style={{ padding: '3px 8px' }}>
                            <Check size={13} />
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => setEditingId(null)} style={{ padding: '3px 8px' }}>
                            <X size={13} />
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => startEdit(item)} style={{ padding: '4px 8px' }}>
                            <Edit2 size={13} />
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => deleteTaskMaster(item.id)} style={{ padding: '4px 8px', color: '#ef4444' }}>
                            <Trash2 size={13} />
                          </button>
                        </div>
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
  );
};
