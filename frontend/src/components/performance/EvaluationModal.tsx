import React, { useState, useEffect } from 'react';
import { EmployeePerformanceDetail } from '../../types/performance';
import { calculateEmployeeIncentive } from '../../data/performanceInitialData';
import { formatCurrency } from '../../utils/numbers';
import {
  X,
  Award,
  Target,
  IndianRupee,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  employee: EmployeePerformanceDetail | null;
  onSaveEvaluation: (updated: EmployeePerformanceDetail) => void;
}

type EvaluationModalInnerProps = Omit<EvaluationModalProps, 'employee'> & {
  employee: EmployeePerformanceDetail;
};

export const EvaluationModal: React.FC<EvaluationModalProps> = (props) => {
  if (!props.isOpen || !props.employee) return null;
  return <EvaluationModalInner {...props} employee={props.employee} />;
};

const EvaluationModalInner: React.FC<EvaluationModalInnerProps> = ({
  isOpen,
  onClose,
  employee,
  onSaveEvaluation
}) => {
  const [attPercent, setAttPercent] = useState<number>(employee.kpiBreakdown.attendancePercent);
  const [feedbackRating, setFeedbackRating] = useState<number>(employee.kpiBreakdown.feedbackRating);
  const [newCustCount, setNewCustCount] = useState<number>(employee.kpiBreakdown.newCustomersCount);
  const [invoiceRate, setInvoiceRate] = useState<number>(employee.kpiBreakdown.invoiceClearanceRate);
  const [bosKitsCount, setBosKitsCount] = useState<number>(employee.kpiBreakdown.bosKitsSuppliedCount);

  const [mmsSales, setMmsSales] = useState<number>(employee.mmsSalesAmount);
  const [bosSales, setBosSales] = useState<number>(employee.bosSalesAmount);
  const [managerNotes, setManagerNotes] = useState<string>(employee.managerAppraisalNotes);
  const [flagForPip, setFlagForPip] = useState<boolean>(employee.hasActivePip);

  // Computed 5 KPI points based on spreadsheet weights
  const attendanceScore = Number(((attPercent / 100) * 5.0).toFixed(1));
  const feedbackScore = Number(((feedbackRating / 5.0) * 20.0).toFixed(1));
  const newCustScore = Number((Math.min(newCustCount / 10, 1) * 20.0).toFixed(1));
  const invoiceScore = Number(((invoiceRate / 100) * 20.0).toFixed(1));
  const bosKitsScore = Number((Math.min(bosKitsCount / 40, 1) * 35.0).toFixed(1));

  const totalScore = Number((attendanceScore + feedbackScore + newCustScore + invoiceScore + bosKitsScore).toFixed(1));

  // Computed incentive
  const { incentiveAmount, sharePercent } = calculateEmployeeIncentive(employee.roleCategory, mmsSales, bosSales);

  const getGrade = (score: number): EmployeePerformanceDetail['performanceGrade'] => {
    if (score >= 90) return 'Exceptional';
    if (score >= 80) return 'Exceeds Expectations';
    if (score >= 70) return 'Meets Expectations';
    if (score >= 55) return 'Needs Improvement';
    return 'Critical / PIP';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const updatedEmployee: EmployeePerformanceDetail = {
      ...employee,
      overallScore: totalScore,
      performanceGrade: getGrade(totalScore),
      kpiBreakdown: {
        attendanceScore,
        attendancePercent: attPercent,
        feedbackQualityScore: feedbackScore,
        feedbackRating,
        newCustomerScore: newCustScore,
        newCustomersCount: newCustCount,
        invoiceScore,
        invoiceClearanceRate: invoiceRate,
        fullBosKitsSupplyScore: bosKitsScore,
        bosKitsSuppliedCount: bosKitsCount
      },
      mmsSalesAmount: mmsSales,
      bosSalesAmount: bosSales,
      totalSalesAchieved: mmsSales + bosSales,
      calculatedIncentive: incentiveAmount,
      incentiveRoleShare: sharePercent,
      incentiveStatus: incentiveAmount > 0 ? 'Eligible' : 'Not Applicable',
      hasActivePip: flagForPip || totalScore < 60,
      managerAppraisalNotes: managerNotes,
      lastEvaluationDate: new Date().toISOString().split('T')[0]
    };

    onSaveEvaluation(updatedEmployee);
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.55)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1100,
      padding: '20px'
    }}>
      <div style={{
        background: '#FFFFFF',
        borderRadius: '20px',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '90vh',
        boxShadow: '0 25px 30px -5px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#F8FAFC'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Award size={18} color="#0E7490" />
              Evaluation & Scoring: {employee.employeeName}
            </h3>
            <span style={{ fontSize: '12px', color: '#64748B' }}>
              ID: {employee.employeeId} • {employee.designation} ({employee.department})
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Live Score Preview Strip */}
          <div style={{
            padding: '14px 18px',
            borderRadius: '12px',
            backgroundColor: '#ECFEFF',
            border: '1px solid #A5F3FC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0E7490', textTransform: 'uppercase' }}>
                Computed Overall Score
              </span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '24px', fontWeight: 800, color: '#094E67' }}>
                  {totalScore}
                </span>
                <span style={{ fontSize: '12px', color: '#0E7490' }}>/ 100 Points</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#0E7490', textTransform: 'uppercase' }}>
                Projected Incentive Payout
              </span>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#094E67' }}>
                {formatCurrency(incentiveAmount)}
              </div>
            </div>
          </div>

          {/* 5-KPI Sliders / Inputs */}
          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Target size={16} color="#0E7490" />
              5-Tier KPI Weights Scoring (Sum: 100.0)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px' }}>
              {/* Attendance (5.0) */}
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#1E293B' }}>1. Attendance Presence</span>
                  <span style={{ fontWeight: 800, color: '#0E7490' }}>{attendanceScore} / 5.0 pts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min={50}
                    max={100}
                    value={attPercent}
                    onChange={(e) => setAttPercent(Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#0E7490' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', minWidth: '38px' }}>{attPercent}%</span>
                </div>
              </div>

              {/* Feedback Quality (20.0) */}
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#1E293B' }}>2. Feedback Quality</span>
                  <span style={{ fontWeight: 800, color: '#D97706' }}>{feedbackScore} / 20.0 pts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={0.1}
                    value={feedbackRating}
                    onChange={(e) => setFeedbackRating(Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#F59E0B' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', minWidth: '38px' }}>{feedbackRating}★</span>
                </div>
              </div>

              {/* New Customer Points (20.0) */}
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#1E293B' }}>3. New Customers</span>
                  <span style={{ fontWeight: 800, color: '#16A34A' }}>{newCustScore} / 20.0 pts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min={0}
                    max={15}
                    value={newCustCount}
                    onChange={(e) => setNewCustCount(Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#22C55E' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', minWidth: '38px' }}>{newCustCount} clients</span>
                </div>
              </div>

              {/* Invoice Points (20.0) */}
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#1E293B' }}>4. Invoice Clearances</span>
                  <span style={{ fontWeight: 800, color: '#7C3AED' }}>{invoiceScore} / 20.0 pts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min={30}
                    max={100}
                    value={invoiceRate}
                    onChange={(e) => setInvoiceRate(Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#8B5CF6' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 700, color: '#475569', minWidth: '38px' }}>{invoiceRate}%</span>
                </div>
              </div>

              {/* Full BOS Kits Supply (35.0) */}
              <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: '#F0FDFA', border: '1px solid #0E7490', gridColumn: 'span 2' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 800, color: '#094E67' }}>5. Full BOS Kits Supply (Highest Weight)</span>
                  <span style={{ fontWeight: 800, color: '#0E7490' }}>{bosKitsScore} / 35.0 pts</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="range"
                    min={0}
                    max={50}
                    value={bosKitsCount}
                    onChange={(e) => setBosKitsCount(Number(e.target.value))}
                    style={{ flex: 1, accentColor: '#0E7490' }}
                  />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#094E67', minWidth: '45px' }}>{bosKitsCount} kits</span>
                </div>
              </div>
            </div>
          </div>

          {/* Solar Sales Achievements Inputs */}
          <div>
            <h4 style={{ margin: '0 0 12px', fontSize: '13px', fontWeight: 800, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <IndianRupee size={16} color="#0E7490" />
              Monthly Solar Sales Figures (₹)
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                  Module Mounting Structures (MMS) Sales (₹)
                </label>
                <input
                  type="number"
                  step={50000}
                  value={mmsSales}
                  onChange={(e) => setMmsSales(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    color: '#1E293B'
                  }}
                />
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>Benchmark: ₹50,00,000 @ 0.7%</span>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 700, color: '#64748B', display: 'block', marginBottom: '4px' }}>
                  Balance of System (BOS) Sales (₹)
                </label>
                <input
                  type="number"
                  step={50000}
                  value={bosSales}
                  onChange={(e) => setBosSales(Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    fontSize: '13px',
                    color: '#1E293B'
                  }}
                />
                <span style={{ fontSize: '10px', color: '#94A3B8' }}>Benchmark: ₹1,00,00,000 @ 0.3%</span>
              </div>
            </div>
          </div>

          {/* Supervisor Appraisal Remarks */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
              Supervisor Evaluation & Feedback Remarks
            </label>
            <textarea
              rows={3}
              value={managerNotes}
              onChange={(e) => setManagerNotes(e.target.value)}
              placeholder="Record developmental feedback, major quarterly wins, or coaching suggestions..."
              style={{
                width: '100%',
                padding: '9px 12px',
                borderRadius: '10px',
                border: '1px solid #E2E8F0',
                fontSize: '13px',
                color: '#1E293B',
                fontFamily: 'inherit',
                lineHeight: 1.5
              }}
            />
          </div>

          {/* Flag for PIP Checkbox */}
          <div style={{
            padding: '12px 14px',
            borderRadius: '10px',
            backgroundColor: flagForPip ? '#FFF5F5' : '#F8FAFC',
            border: flagForPip ? '1px solid #FECACA' : '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <input
              type="checkbox"
              id="flagPip"
              checked={flagForPip}
              onChange={(e) => setFlagForPip(e.target.checked)}
              style={{ accentColor: '#DC2626', width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="flagPip" style={{ fontSize: '12px', fontWeight: 600, color: flagForPip ? '#B91C1C' : '#475569', cursor: 'pointer' }}>
              Flag this employee for Performance Improvement Plan (PIP) monitoring
            </label>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #E2E8F0' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '9px 16px',
                borderRadius: '10px',
                border: '1px solid #CBD5E1',
                backgroundColor: '#FFFFFF',
                color: '#475569',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '9px 20px',
                borderRadius: '10px',
                border: 'none',
                backgroundColor: '#0E7490',
                color: '#FFFFFF',
                fontSize: '13px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(14, 116, 144, 0.2)'
              }}
            >
              Save Evaluation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
