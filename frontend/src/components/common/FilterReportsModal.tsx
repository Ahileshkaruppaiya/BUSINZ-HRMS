import React, { useState, useEffect, useMemo } from 'react';
import { X, Check } from 'lucide-react';
import { useHRMS } from '../../context/HRMSContext';

export interface FilterReportsState {
  branchDepartments: { [branch: string]: string[] };
  shifts: string[];
  employmentTypes: string[];
  modesOfWork: string[];
}

export const initialFilterReportsState: FilterReportsState = {
  branchDepartments: {},
  shifts: [],
  employmentTypes: [],
  modesOfWork: []
};

interface FilterReportsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: FilterReportsState;
  onApply: (filters: FilterReportsState) => void;
  onReset: () => void;
}

type FilterTab = 'branch_dept' | 'shift' | 'employment_type' | 'mode_of_work';

export const FilterReportsModal: React.FC<FilterReportsModalProps> = ({
  isOpen,
  onClose,
  currentFilters,
  onApply,
  onReset
}) => {
  const { branches, shifts } = useHRMS();
  const [activeTab, setActiveTab] = useState<FilterTab>('branch_dept');
  const [localFilters, setLocalFilters] = useState<FilterReportsState>(currentFilters);

  // Dynamic Shift Options sourced directly from Company Shifts in HRMSContext
  const shiftOptions = useMemo(() => {
    if (shifts && shifts.length > 0) {
      return shifts.map(s => s.shiftName);
    }
    return [];
  }, [shifts]);

  // Sync state when modal opens, preserving only valid shifts for this company
  useEffect(() => {
    if (isOpen) {
      const validShifts = (currentFilters.shifts || []).filter(s => shiftOptions.includes(s));
      setLocalFilters({
        ...currentFilters,
        shifts: validShifts
      });
    }
  }, [isOpen, currentFilters, shiftOptions]);

  if (!isOpen) return null;

  // Master Branch & Department Data sourced dynamically from Organization module in HRMSContext
  const branchData: { [branch: string]: string[] } = branches.reduce((acc, b) => {
    acc[b.name] = b.departments;
    return acc;
  }, {} as { [branch: string]: string[] });

  const employmentTypeOptions = [
    'Full-Time',
    'Intern',
    'Provisional'
  ];

  const modeOfWorkOptions = [
    'Work From Office (WFO)',
    'Work From Home (WFH)',
    'Hybrid',
    'On Field / Travel'
  ];

  // Helper to toggle department in branch
  const toggleBranchDept = (branch: string, dept: string) => {
    setLocalFilters(prev => {
      const currentBranchDepts = prev.branchDepartments[branch] || [];
      const exists = currentBranchDepts.includes(dept);
      const updated = exists 
        ? currentBranchDepts.filter(d => d !== dept)
        : [...currentBranchDepts, dept];

      const newBranchDepts = { ...prev.branchDepartments };
      if (updated.length === 0) {
        delete newBranchDepts[branch];
      } else {
        newBranchDepts[branch] = updated;
      }

      return {
        ...prev,
        branchDepartments: newBranchDepts
      };
    });
  };

  // Helper to toggle simple array options
  const toggleArrayItem = (key: 'shifts' | 'employmentTypes' | 'modesOfWork', item: string) => {
    setLocalFilters(prev => {
      const currentList = prev[key];
      const exists = currentList.includes(item);
      return {
        ...prev,
        [key]: exists ? currentList.filter(i => i !== item) : [...currentList, item]
      };
    });
  };

  // Select All / Deselect All logic for active tab
  const handleSelectAll = () => {
    if (activeTab === 'branch_dept') {
      // Check if all are already selected
      const totalPossible = Object.entries(branchData).reduce((acc, [, depts]) => acc + depts.length, 0);
      const totalSelected = Object.values(localFilters.branchDepartments).reduce((acc, depts) => acc + depts.length, 0);

      if (totalSelected === totalPossible) {
        // Deselect all
        setLocalFilters(prev => ({ ...prev, branchDepartments: {} }));
      } else {
        // Select all
        const allSelected: { [branch: string]: string[] } = {};
        Object.entries(branchData).forEach(([branch, depts]) => {
          allSelected[branch] = [...depts];
        });
        setLocalFilters(prev => ({ ...prev, branchDepartments: allSelected }));
      }
    } else if (activeTab === 'shift') {
      const allSelected = localFilters.shifts.length === shiftOptions.length;
      setLocalFilters(prev => ({ ...prev, shifts: allSelected ? [] : [...shiftOptions] }));
    } else if (activeTab === 'employment_type') {
      const allSelected = localFilters.employmentTypes.length === employmentTypeOptions.length;
      setLocalFilters(prev => ({ ...prev, employmentTypes: allSelected ? [] : [...employmentTypeOptions] }));
    } else if (activeTab === 'mode_of_work') {
      const allSelected = localFilters.modesOfWork.length === modeOfWorkOptions.length;
      setLocalFilters(prev => ({ ...prev, modesOfWork: allSelected ? [] : [...modeOfWorkOptions] }));
    }
  };

  // Active counts for tab badges
  const branchDeptCount = Object.values(localFilters.branchDepartments).reduce((acc, depts) => acc + depts.length, 0);
  const shiftCount = localFilters.shifts.length;
  const empTypeCount = localFilters.employmentTypes.length;
  const modeCount = localFilters.modesOfWork.length;

  const handleApply = () => {
    onApply(localFilters);
    onClose();
  };

  const handleReset = () => {
    setLocalFilters(initialFilterReportsState);
    onReset();
    onClose();
  };

  return (
    <div className="filter-modal-overlay" onClick={onClose}>
      <div className="filter-reports-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Modal Header */}
        <div className="filter-modal-header">
          <h2 className="filter-modal-title">Filter Reports</h2>
          <button 
            className="filter-modal-close-btn" 
            onClick={onClose}
            title="Close filter modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body with 2-Column Split */}
        <div className="filter-modal-body">
          
          {/* Left Column: Filter By Sidebar */}
          <div className="filter-sidebar">
            <div className="filter-sidebar-title">Filter By</div>

            <button 
              className={`filter-nav-item ${activeTab === 'branch_dept' ? 'active' : ''}`}
              onClick={() => setActiveTab('branch_dept')}
            >
              <span>Branch & Department</span>
              {branchDeptCount > 0 && <span className="filter-nav-count-badge">{branchDeptCount}</span>}
            </button>

            <button 
              className={`filter-nav-item ${activeTab === 'shift' ? 'active' : ''}`}
              onClick={() => setActiveTab('shift')}
            >
              <span>Shift</span>
              {shiftCount > 0 && <span className="filter-nav-count-badge">{shiftCount}</span>}
            </button>

            <button 
              className={`filter-nav-item ${activeTab === 'employment_type' ? 'active' : ''}`}
              onClick={() => setActiveTab('employment_type')}
            >
              <span>Employment Type</span>
              {empTypeCount > 0 && <span className="filter-nav-count-badge">{empTypeCount}</span>}
            </button>

            <button 
              className={`filter-nav-item ${activeTab === 'mode_of_work' ? 'active' : ''}`}
              onClick={() => setActiveTab('mode_of_work')}
            >
              <span>Mode of Work</span>
              {modeCount > 0 && <span className="filter-nav-count-badge">{modeCount}</span>}
            </button>
          </div>

          {/* Right Column: Filter Options Content Panel */}
          <div className="filter-content-panel">
            
            {/* Header with Title and Select All */}
            <div className="filter-content-header">
              <span className="filter-content-title">
                {activeTab === 'branch_dept' && 'Branches & Department'}
                {activeTab === 'shift' && 'Shift'}
                {activeTab === 'employment_type' && 'Employment Type'}
                {activeTab === 'mode_of_work' && 'Mode of Work'}
              </span>

              <button 
                className="filter-select-all-btn"
                onClick={handleSelectAll}
              >
                Select All
              </button>
            </div>

            {/* TAB 1: Branch & Department */}
            {activeTab === 'branch_dept' && (
              <div>
                {Object.keys(branchData).length === 0 ? (
                  <div style={{ padding: '24px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                    No branches configured. Please add branches in the Organization module.
                  </div>
                ) : (
                  Object.entries(branchData).map(([branch, depts], branchIdx) => (
                    <div key={branch} className="filter-group">
                      <h3 className="filter-group-header">{branch}</h3>
                      <div className="filter-items-list" style={{ gap: '10px' }}>
                        {depts.map((dept) => {
                          const isChecked = (localFilters.branchDepartments[branch] || []).includes(dept);
                          return (
                            <div 
                              key={dept} 
                              onClick={() => toggleBranchDept(branch, dept)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '4px 0',
                                cursor: 'pointer',
                                userSelect: 'none'
                              }}
                            >
                              <div style={{
                                width: '18px',
                                height: '18px',
                                borderRadius: '3px',
                                border: isChecked ? '1.5px solid #0E7490' : '1.5px solid #64748b',
                                backgroundColor: isChecked ? '#0E7490' : '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifySelf: 'center',
                                justifyContent: 'center',
                                flexShrink: 0,
                                transition: 'all 0.15s ease'
                              }}>
                                {isChecked && <Check size={13} color="#ffffff" strokeWidth={3} />}
                              </div>
                              <span style={{ fontSize: '0.94rem', color: isChecked ? '#0f172a' : '#334155', fontWeight: isChecked ? 600 : 400 }}>
                                {dept}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {branchIdx < Object.keys(branchData).length - 1 && (
                        <div className="filter-divider"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 2: Shift */}
            {activeTab === 'shift' && (
              <div className="filter-items-list" style={{ gap: '10px' }}>
                {shiftOptions.length === 0 ? (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: '#64748b', fontSize: '0.88rem' }}>
                    No shifts configured for this company. Please configure shifts in Shift Management.
                  </div>
                ) : (
                  shiftOptions.map((shift) => {
                    const isChecked = localFilters.shifts.includes(shift);
                    return (
                      <div 
                        key={shift}
                        onClick={() => toggleArrayItem('shifts', shift)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          padding: '4px 0',
                          cursor: 'pointer',
                          userSelect: 'none'
                        }}
                      >
                        <div style={{
                          width: '18px',
                          height: '18px',
                          borderRadius: '3px',
                          border: isChecked ? '1.5px solid #0E7490' : '1.5px solid #64748b',
                          backgroundColor: isChecked ? '#0E7490' : '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s ease'
                        }}>
                          {isChecked && <Check size={13} color="#ffffff" strokeWidth={3} />}
                        </div>
                        <span style={{ fontSize: '0.94rem', color: isChecked ? '#0f172a' : '#334155', fontWeight: isChecked ? 600 : 400 }}>
                          {shift}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* TAB 3: Employment Type */}
            {activeTab === 'employment_type' && (
              <div className="filter-items-list" style={{ gap: '10px' }}>
                {employmentTypeOptions.map((empType) => {
                  const isChecked = localFilters.employmentTypes.includes(empType);
                  return (
                    <div 
                      key={empType}
                      onClick={() => toggleArrayItem('employmentTypes', empType)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '4px 0',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '3px',
                        border: isChecked ? '1.5px solid #0E7490' : '1.5px solid #64748b',
                        backgroundColor: isChecked ? '#0E7490' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}>
                        {isChecked && <Check size={13} color="#ffffff" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: '0.94rem', color: isChecked ? '#0f172a' : '#334155', fontWeight: isChecked ? 600 : 400 }}>
                        {empType}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 4: Mode of Work */}
            {activeTab === 'mode_of_work' && (
              <div className="filter-items-list" style={{ gap: '10px' }}>
                {modeOfWorkOptions.map((mode) => {
                  const isChecked = localFilters.modesOfWork.includes(mode);
                  return (
                    <div 
                      key={mode}
                      onClick={() => toggleArrayItem('modesOfWork', mode)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '4px 0',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{
                        width: '18px',
                        height: '18px',
                        borderRadius: '3px',
                        border: isChecked ? '1.5px solid #0E7490' : '1.5px solid #64748b',
                        backgroundColor: isChecked ? '#0E7490' : '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        transition: 'all 0.15s ease'
                      }}>
                        {isChecked && <Check size={13} color="#ffffff" strokeWidth={3} />}
                      </div>
                      <span style={{ fontSize: '0.94rem', color: isChecked ? '#0f172a' : '#334155', fontWeight: isChecked ? 600 : 400 }}>
                        {mode}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>

        {/* Modal Footer */}
        <div className="filter-modal-footer">
          <button 
            className="filter-reset-btn"
            onClick={handleReset}
          >
            Reset
          </button>
          <button 
            className="filter-apply-btn"
            onClick={handleApply}
          >
            Apply
          </button>
        </div>

      </div>
    </div>
  );
};
export default FilterReportsModal;
