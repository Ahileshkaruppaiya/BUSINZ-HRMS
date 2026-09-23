import React, { useState } from 'react';
import { HelpCircle, X } from 'lucide-react';

interface TerminologyTooltipProps {
  term: 'KRA' | 'KPI' | 'PIP' | 'Appraisal';
  inline?: boolean;
}

const TERMINOLOGY_DATA: Record<'KRA' | 'KPI' | 'PIP' | 'Appraisal', { title: string; subtitle: string; description: string; example: string }> = {
  KRA: {
    title: 'Key Result Area (KRA)',
    subtitle: 'Strategic focus areas',
    description: 'The primary, high-impact areas of responsibility where an employee is expected to achieve core business results.',
    example: 'Example: "Utility & C&I Order Booking", "Customer Relationship", "Accounting Accuracy".'
  },
  KPI: {
    title: 'Key Performance Indicator (KPI)',
    subtitle: 'Measurable targets',
    description: 'Specific, quantifiable metrics used to evaluate how successfully an employee is achieving their key objectives.',
    example: 'Example: "Monthly Sales Target (₹80L)", "Tickets Resolved (120)", "Attendance Accuracy (99%)".'
  },
  PIP: {
    title: 'Performance Improvement Plan (PIP)',
    subtitle: 'Structured coaching & support',
    description: 'A formal, supportive framework designed to help an employee overcome specific performance challenges with targets and mentor guidance.',
    example: 'Answers 5 questions: What is the problem? What should improve? Target? Support provided? When reviewed?'
  },
  Appraisal: {
    title: 'Performance Appraisal Cycle',
    subtitle: 'Periodic evaluation',
    description: 'A systematic assessment of employee accomplishments, growth, and feedback conducted on a monthly, quarterly, or yearly cadence.',
    example: 'Combines KRA, KPI, Goals, Attendance, and Task completion into an overall score and 1–5 rating.'
  }
};

export const PerformanceTerminologyTooltip: React.FC<TerminologyTooltipProps> = ({ term, inline = true }) => {
  const [isOpen, setIsOpen] = useState(false);
  const data = TERMINOLOGY_DATA[term];

  return (
    <span style={{ position: 'relative', display: inline ? 'inline-flex' : 'flex', alignItems: 'center' }}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(prev => !prev);
        }}
        title={`What is ${term}? Click for simple explanation`}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '2px',
          display: 'inline-flex',
          alignItems: 'center',
          color: '#0E7490',
          borderRadius: '50%',
          opacity: 0.85,
          transition: 'all 0.15s ease'
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.style.opacity = '0.85'}
      >
        <HelpCircle size={14} />
      </button>

      {isOpen && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 998 }}
            onClick={(e) => {
              e.stopPropagation();
              setIsOpen(false);
            }}
          />
          <div
            onClick={e => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '280px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E7ECF3',
              borderRadius: '12px',
              padding: '12px 14px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.04)',
              zIndex: 999,
              textAlign: 'left'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0E7490' }}>
                  {data.title}
                </span>
                <span style={{ display: 'block', fontSize: '11px', color: '#64748B' }}>
                  {data.subtitle}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  borderRadius: '6px',
                  width: '22px',
                  height: '22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B'
                }}
              >
                <X size={12} />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#1E293B', lineHeight: '1.45', margin: '0 0 6px' }}>
              {data.description}
            </p>
            <div style={{ background: '#ECFEFF', padding: '6px 8px', borderRadius: '6px', border: '1px solid #CFFAFE' }}>
              <span style={{ fontSize: '11px', color: '#0E7490', lineHeight: '1.35', display: 'block' }}>
                {data.example}
              </span>
            </div>
          </div>
        </>
      )}
    </span>
  );
};
