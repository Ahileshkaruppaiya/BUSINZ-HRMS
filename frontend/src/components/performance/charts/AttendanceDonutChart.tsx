import React from 'react';

interface Props {
  attendanceRate: number; // e.g. 94%
  breakdown: {
    presentPercent: number;
    absentPercent: number;
    leavePercent: number;
    latePercent: number;
  };
}

export const AttendanceDonutChart: React.FC<Props> = ({ attendanceRate, breakdown }) => {
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Segments calculation
  const segments = [
    { label: 'Present', value: breakdown.presentPercent, color: '#22C55E' },
    { label: 'Absent', value: breakdown.absentPercent, color: '#EF4444' },
    { label: 'Leave', value: breakdown.leavePercent, color: '#F59E0B' },
    { label: 'Late', value: breakdown.latePercent, color: '#8B5CF6' }
  ];

  let accumulatedOffset = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      {/* SVG Donut */}
      <div style={{ position: 'relative', width: `${size}px`, height: `${size}px` }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#F1F5F9"
            strokeWidth={strokeWidth}
          />

          {/* Segment strokes */}
          {segments.map((seg, idx) => {
            const strokeDasharray = `${(seg.value / 100) * circumference} ${circumference}`;
            const strokeDashoffset = -accumulatedOffset;
            accumulatedOffset += (seg.value / 100) * circumference;

            return (
              <circle
                key={idx}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-dasharray 0.5s ease' }}
              />
            );
          })}
        </svg>

        {/* Center Attendance % */}
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#0F172A', lineHeight: 1 }}>
            {attendanceRate}%
          </div>
          <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#64748B', marginTop: '4px' }}>
            Attendance
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '8px 16px',
        width: '100%',
        maxWidth: '240px'
      }}>
        {segments.map(seg => (
          <div key={seg.label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: seg.color }} />
              <span style={{ color: '#475569', fontWeight: 500 }}>{seg.label}</span>
            </div>
            <span style={{ fontWeight: 700, color: '#1E293B' }}>{seg.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
};
