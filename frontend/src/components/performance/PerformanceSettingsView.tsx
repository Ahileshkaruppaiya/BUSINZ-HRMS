import React, { useState } from 'react';
import { PerformanceSettingsConfig } from '../../types/performance';
import { INITIAL_PERFORMANCE_SETTINGS } from '../../data/performanceInitialData';
import {
  Settings,
  Target,
  TrendingUp,
  Award,
  ShieldAlert,
  Clock,
  Save,
  CheckCircle2,
  CalendarCheck,
  CheckSquare
} from 'lucide-react';

export const PerformanceSettingsView: React.FC = () => {
  const [config, setConfig] = useState<PerformanceSettingsConfig>(INITIAL_PERFORMANCE_SETTINGS);
  const [savedFeedback, setSavedFeedback] = useState(false);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedFeedback(true);
    setTimeout(() => setSavedFeedback(false), 3000);
  };

  return (
    <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── TOP HEADER CARD ── */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E7ECF3',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{
            width: '46px',
            height: '46px',
            borderRadius: '12px',
            backgroundColor: '#ECFEFF',
            color: '#0E7490',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Settings size={24} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: '#1E293B', fontFamily: 'DM Sans, sans-serif', letterSpacing: '-0.02em' }}>
              Performance Management Settings
            </h1>
            <p style={{ margin: '3px 0 0', fontSize: '13px', color: '#64748B' }}>
              Configure appraisal cycles, rating formulas, attendance & task weights, and PIP rules
            </p>
          </div>
        </div>

        <button
          type="submit"
          style={{
            padding: '9px 20px',
            backgroundColor: '#0E7490',
            color: '#FFFFFF',
            borderRadius: '12px',
            border: 'none',
            fontSize: '13px',
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 2px 4px rgba(14, 116, 144, 0.2)'
          }}
        >
          <Save size={16} />
          <span>Save Settings</span>
        </button>
      </div>

      {savedFeedback && (
        <div style={{
          backgroundColor: '#DCFCE7',
          border: '1px solid #86EFAC',
          color: '#15803D',
          borderRadius: '12px',
          padding: '12px 18px',
          fontSize: '13px',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} />
          <span>Performance configuration settings updated successfully!</span>
        </div>
      )}

      {/* ── 1. GENERAL SETTINGS ── */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E7ECF3',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <h2 style={{ margin: '0 0 16px', fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>
          1. General Appraisal Settings
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Current Appraisal Cycle
            </label>
            <select
              value={config.general.currentCycle}
              onChange={e => setConfig({ ...config, general: { ...config.general, currentCycle: e.target.value as any } })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', backgroundColor: '#FFFFFF' }}
            >
              <option value="Monthly">Monthly Cycle</option>
              <option value="Quarterly">Quarterly Cycle (Standard)</option>
              <option value="Half-Yearly">Half-Yearly Cycle</option>
              <option value="Yearly">Yearly Cycle</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Default Rating Scale
            </label>
            <select
              value={config.general.ratingScale}
              onChange={e => setConfig({ ...config, general: { ...config.general, ratingScale: e.target.value as any } })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', backgroundColor: '#FFFFFF' }}
            >
              <option value="1-5 Stars">1–5 Stars Rating</option>
              <option value="1-10 Scale">1–10 Scale</option>
              <option value="Percentage (0-100%)">Percentage (0–100%)</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Minimum Passing Score (%)
            </label>
            <input
              type="number"
              value={config.general.minimumPassingScore}
              onChange={e => setConfig({ ...config, general: { ...config.general, minimumPassingScore: parseInt(e.target.value) || 70 } })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
              Exceptional Threshold (%)
            </label>
            <input
              type="number"
              value={config.general.exceptionalThreshold}
              onChange={e => setConfig({ ...config, general: { ...config.general, exceptionalThreshold: parseInt(e.target.value) || 90 } })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px' }}
            />
          </div>
        </div>
      </div>

      {/* ── 2. ATTENDANCE + TASK INTEGRATION RULES ── */}
      <div style={{
        backgroundColor: '#FFFFFF',
        border: '1px solid #E7ECF3',
        borderRadius: '16px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <CalendarCheck size={18} color="#0E7490" />
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1E293B' }}>
            2. Attendance & Task Integration into Performance
          </h2>
        </div>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#64748B' }}>
          Connect real-time biometric attendance and task completion rates into final overall performance scoring without arbitrary deductions.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {/* Attendance Weight */}
          <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: '#1E293B' }}>Enable Attendance Impact</strong>
              <input
                type="checkbox"
                checked={config.attendanceTaskIntegration.enableAttendanceImpact}
                onChange={e => setConfig({
                  ...config,
                  attendanceTaskIntegration: { ...config.attendanceTaskIntegration, enableAttendanceImpact: e.target.checked }
                })}
                style={{ width: '18px', height: '18px', accentColor: '#0E7490', cursor: 'pointer' }}
              />
            </div>
            <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#64748B' }}>
              Considers attendance punctuality, late hours, and unapproved leaves.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Overall Weight:</span>
              <input
                type="number"
                min={0}
                max={50}
                value={config.attendanceTaskIntegration.attendanceWeight}
                onChange={e => setConfig({
                  ...config,
                  attendanceTaskIntegration: { ...config.attendanceTaskIntegration, attendanceWeight: parseInt(e.target.value) || 10 }
                })}
                style={{ width: '70px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px' }}
              />
              <span style={{ fontSize: '12px', color: '#64748B' }}>%</span>
            </div>
          </div>

          {/* Task Performance Weight */}
          <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <strong style={{ fontSize: '13px', color: '#1E293B' }}>Enable Task Completion Impact</strong>
              <input
                type="checkbox"
                checked={config.attendanceTaskIntegration.enableTaskImpact}
                onChange={e => setConfig({
                  ...config,
                  attendanceTaskIntegration: { ...config.attendanceTaskIntegration, enableTaskImpact: e.target.checked }
                })}
                style={{ width: '18px', height: '18px', accentColor: '#0E7490', cursor: 'pointer' }}
              />
            </div>
            <p style={{ margin: '0 0 10px', fontSize: '11px', color: '#64748B' }}>
              Considers tasks assigned, on-time completion %, and overdue count.
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Overall Weight:</span>
              <input
                type="number"
                min={0}
                max={50}
                value={config.attendanceTaskIntegration.taskWeight}
                onChange={e => setConfig({
                  ...config,
                  attendanceTaskIntegration: { ...config.attendanceTaskIntegration, taskWeight: parseInt(e.target.value) || 15 }
                })}
                style={{ width: '70px', padding: '6px 10px', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '13px' }}
              />
              <span style={{ fontSize: '12px', color: '#64748B' }}>%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. KRA, KPI & REVIEW SETTINGS ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '20px'
      }}>
        {/* KRA & KPI Settings */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E7ECF3',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>
            3. KRA & KPI Configuration
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Default KRA Weightage (%)
              </label>
              <input
                type="number"
                value={config.kraSettings.defaultKraWeightage}
                onChange={e => setConfig({
                  ...config,
                  kraSettings: { ...config.kraSettings, defaultKraWeightage: parseInt(e.target.value) || 25 }
                })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                KPI Calculation Method
              </label>
              <select
                value={config.kpiSettings.calculationMethod}
                onChange={e => setConfig({
                  ...config,
                  kpiSettings: { ...config.kpiSettings, calculationMethod: e.target.value as any }
                })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', backgroundColor: '#FFFFFF' }}
              >
                <option value="Linear Metric Achievement">Linear Metric Achievement</option>
                <option value="Capped at 100%">Capped at 100% (No over-achievement bonus)</option>
                <option value="Step Scale">Step Scale (Tiered achievement)</option>
              </select>
            </div>
          </div>
        </div>

        {/* PIP & Escalation Rules */}
        <div style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E7ECF3',
          borderRadius: '16px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
        }}>
          <h3 style={{ margin: '0 0 14px', fontSize: '15px', fontWeight: 800, color: '#1E293B' }}>
            4. PIP (Improvement Plan) Rules
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Default PIP Duration (Days)
              </label>
              <select
                value={config.pipSettings.defaultDurationDays}
                onChange={e => setConfig({
                  ...config,
                  pipSettings: { ...config.pipSettings, defaultDurationDays: parseInt(e.target.value) || 60 }
                })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', backgroundColor: '#FFFFFF' }}
              >
                <option value={30}>30 Days</option>
                <option value={60}>60 Days</option>
                <option value={90}>90 Days</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px' }}>
                Mandatory Review Frequency
              </label>
              <select
                value={config.pipSettings.reviewFrequency}
                onChange={e => setConfig({
                  ...config,
                  pipSettings: { ...config.pipSettings, reviewFrequency: e.target.value as any }
                })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '13px', backgroundColor: '#FFFFFF' }}
              >
                <option value="Weekly">Weekly Review</option>
                <option value="Bi-Weekly">Bi-Weekly Review</option>
                <option value="Monthly">Monthly Review</option>
              </select>
            </div>
          </div>
        </div>
      </div>

    </form>
  );
};
