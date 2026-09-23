import React from 'react';
import { CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

interface Props {
  totalTasks: number;
  completed: number;
  pending: number;
  overdue: number;
  completionPercent: number;
}

export const TaskPerformanceChart: React.FC<Props> = ({
  totalTasks,
  completed,
  pending,
  overdue,
  completionPercent
}) => {
  const completedRatio = totalTasks > 0 ? (completed / totalTasks) * 100 : 80;
  const pendingRatio = totalTasks > 0 ? (pending / totalTasks) * 100 : 15;
  const overdueRatio = totalTasks > 0 ? (overdue / totalTasks) * 100 : 5;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
      {/* Top Header Metric */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
            {completionPercent}%
          </div>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginTop: '4px' }}>
            Task Completion Rate
          </div>
        </div>

        <div style={{
          padding: '4px 10px',
          borderRadius: '8px',
          backgroundColor: '#F1F5F9',
          fontSize: '0.78rem',
          fontWeight: 700,
          color: '#334155'
        }}>
          {completed} of {totalTasks} Completed
        </div>
      </div>

      {/* Segmented Progress Bar */}
      <div style={{
        width: '100%',
        height: '14px',
        borderRadius: '9999px',
        backgroundColor: '#F1F5F9',
        overflow: 'hidden',
        display: 'flex',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.06)'
      }}>
        <div
          style={{
            width: `${completedRatio}%`,
            backgroundColor: '#22C55E',
            transition: 'width 0.5s ease'
          }}
          title={`Completed: ${completed} (${Math.round(completedRatio)}%)`}
        />
        <div
          style={{
            width: `${pendingRatio}%`,
            backgroundColor: '#F59E0B',
            transition: 'width 0.5s ease'
          }}
          title={`Pending: ${pending} (${Math.round(pendingRatio)}%)`}
        />
        <div
          style={{
            width: `${overdueRatio}%`,
            backgroundColor: '#EF4444',
            transition: 'width 0.5s ease'
          }}
          title={`Overdue: ${overdue} (${Math.round(overdueRatio)}%)`}
        />
      </div>

      {/* Metric Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px'
      }}>
        {/* Completed */}
        <div style={{
          padding: '10px',
          borderRadius: '10px',
          backgroundColor: '#DCFCE7',
          border: '1px solid #BBF7D0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <CheckCircle2 size={16} color="#15803D" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#15803D' }}>{completed}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#166534' }}>Completed</div>
          </div>
        </div>

        {/* Pending */}
        <div style={{
          padding: '10px',
          borderRadius: '10px',
          backgroundColor: '#FEF3C7',
          border: '1px solid #FDE68A',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <Clock size={16} color="#B45309" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#B45309' }}>{pending}</div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#92400E' }}>Pending</div>
          </div>
        </div>

        {/* Overdue */}
        <div style={{
          padding: '10px',
          borderRadius: '10px',
          backgroundColor: overdue > 0 ? '#FEE2E2' : '#F8FAFC',
          border: overdue > 0 ? '1px solid #FECACA' : '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <AlertTriangle size={16} color={overdue > 0 ? '#B91C1C' : '#94A3B8'} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.95rem', fontWeight: 800, color: overdue > 0 ? '#B91C1C' : '#64748B' }}>
              {overdue}
            </div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: overdue > 0 ? '#991B1B' : '#94A3B8' }}>
              Overdue
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
