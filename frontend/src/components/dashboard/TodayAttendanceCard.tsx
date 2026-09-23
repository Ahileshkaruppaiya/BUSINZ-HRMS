import React, { useState } from 'react';
import { AttendanceCategoryType } from './AttendanceCategoryModal';

interface TodayAttendanceCardProps {
  total: number;
  present: number;
  absent: number;
  leave: number;
  onSelectCategory?: (category: AttendanceCategoryType) => void;
  onOpenLeaves?: () => void;
}

export const TodayAttendanceCard: React.FC<TodayAttendanceCardProps> = ({
  total,
  present,
  absent,
  leave,
  onSelectCategory,
  onOpenLeaves
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // SVG parameters (Big, Bold & Perfectly Centered)
  const size = 196;
  const cx = size / 2;
  const cy = size / 2;
  const r = 68;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * r;

  // Safe percentages
  const safeTotal = total > 0 ? total : 1;
  const pPct = present / safeTotal;
  const aPct = absent / safeTotal;
  const lPct = leave / safeTotal;

  const gap = safeTotal > 1 ? 3 : 0;
  const pLength = Math.max(0, pPct * circumference - (pPct > 0 && safeTotal > 1 ? gap : 0));
  const aLength = Math.max(0, aPct * circumference - (aPct > 0 && safeTotal > 1 ? gap : 0));
  const lLength = Math.max(0, lPct * circumference - (lPct > 0 && safeTotal > 1 ? gap : 0));

  const pOffset = 0;
  const aOffset = -(pPct * circumference);
  const lOffset = -((pPct + aPct) * circumference);

  return (
    <div className="dashboard-widget-card">
      {/* Header matching ControlRoom 'DISPATCH ORDERS BY STATUS' card */}
      <div className="dashboard-widget-header" style={{ marginBottom: '8px' }}>
        <h3 className="dashboard-widget-title">
          ATTENDANCE BY STATUS
        </h3>
        <span className="dashboard-widget-badge">
          {total} TOTAL STAFF
        </span>
      </div>

      {/* Donut & Legend Container - Centered */}
      <div 
        className="dashboard-widget-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0',
          overflow: 'hidden'
        }}
      >
        {/* Donut Chart with Center Count - Big & Centered Horizontally */}
        <div style={{ 
          position: 'relative', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '100%',
          margin: '0 auto'
        }}>
          <svg 
            width={size} 
            height={size} 
            viewBox={`0 0 ${size} ${size}`}
            style={{ overflow: 'visible', display: 'block', margin: '0 auto' }}
          >
            {/* Base Background Track */}
            <circle
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke="#F1F5F9"
              strokeWidth={strokeWidth}
            />

            <g transform={`rotate(-90 ${cx} ${cy})`}>
              {/* Present Arc (Cyan / Primary Teal #0E7490) */}
              {present > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="#0E7490"
                  strokeWidth={hoveredSegment === 'present' ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${pLength} ${circumference}`}
                  strokeDashoffset={pOffset}
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease',
                    opacity: hoveredSegment && hoveredSegment !== 'present' ? 0.65 : 1
                  }}
                  onMouseEnter={() => setHoveredSegment('present')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() => onSelectCategory && onSelectCategory('present')}
                >
                  <title>Present: {present}</title>
                </circle>
              )}

              {/* Leave Arc (Solar Orange #F97316) */}
              {leave > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="#F97316"
                  strokeWidth={hoveredSegment === 'leave' ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${lLength} ${circumference}`}
                  strokeDashoffset={lOffset}
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease',
                    opacity: hoveredSegment && hoveredSegment !== 'leave' ? 0.65 : 1
                  }}
                  onMouseEnter={() => setHoveredSegment('leave')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() => onOpenLeaves ? onOpenLeaves() : onSelectCategory && onSelectCategory('total')}
                >
                  <title>Leave: {leave}</title>
                </circle>
              )}

              {/* Absent Arc (Rose Red #EF4444) */}
              {absent > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth={hoveredSegment === 'absent' ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${aLength} ${circumference}`}
                  strokeDashoffset={aOffset}
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease',
                    opacity: hoveredSegment && hoveredSegment !== 'absent' ? 0.65 : 1
                  }}
                  onMouseEnter={() => setHoveredSegment('absent')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() => onSelectCategory && onSelectCategory('absent')}
                >
                  <title>Absent: {absent}</title>
                </circle>
              )}
            </g>

            {/* Center Count */}
            <text
              x={cx}
              y={cy - 2}
              textAnchor="middle"
              fill="#0B1A2D"
              fontSize="28px"
              fontWeight="800"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => onSelectCategory && onSelectCategory('total')}
            >
              {total}
            </text>
            <text
              x={cx}
              y={cy + 16}
              textAnchor="middle"
              fill="#64748B"
              fontSize="10px"
              fontWeight="750"
              letterSpacing="0.06em"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => onSelectCategory && onSelectCategory('total')}
            >
              TOTAL STAFF
            </text>
          </svg>
        </div>

        {/* Legend Below Chart (Full Width, Clean List) */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
          {/* Present */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: '8px',
              transition: 'background 0.15s ease'
            }}
            onClick={() => onSelectCategory && onSelectCategory('present')}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; setHoveredSegment('present'); }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; setHoveredSegment(null); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#0E7490' }} />
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0B1A2D', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Present
              </span>
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 750, color: '#0B1A2D' }}>
              {((present / safeTotal) * 100).toFixed(0)}% <span style={{ color: '#64748B', fontWeight: 500 }}>{present}</span>
            </span>
          </div>

          {/* Leave */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: '8px',
              transition: 'background 0.15s ease'
            }}
            onClick={() => onOpenLeaves ? onOpenLeaves() : onSelectCategory && onSelectCategory('total')}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; setHoveredSegment('leave'); }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; setHoveredSegment(null); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#F97316' }} />
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0B1A2D', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                On Leave
              </span>
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 750, color: '#0B1A2D' }}>
              {((leave / safeTotal) * 100).toFixed(0)}% <span style={{ color: '#64748B', fontWeight: 500 }}>{leave}</span>
            </span>
          </div>

          {/* Absent */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: '8px',
              transition: 'background 0.15s ease'
            }}
            onClick={() => onSelectCategory && onSelectCategory('absent')}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; setHoveredSegment('absent'); }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; setHoveredSegment(null); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '9px', height: '9px', borderRadius: '50%', backgroundColor: '#EF4444' }} />
              <span style={{ fontSize: '0.84rem', fontWeight: 600, color: '#0B1A2D', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Absent
              </span>
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 750, color: '#0B1A2D' }}>
              {((absent / safeTotal) * 100).toFixed(0)}% <span style={{ color: '#64748B', fontWeight: 500 }}>{absent}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
