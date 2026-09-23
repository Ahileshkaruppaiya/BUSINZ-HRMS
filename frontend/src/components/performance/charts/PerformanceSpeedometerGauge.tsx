import React from 'react';
import { TrendingUp, ArrowUpRight, CheckCircle2, CalendarCheck } from 'lucide-react';

interface Props {
  percentage: number;
  label?: string;
  subLabel?: string;
  leftStat?: {
    label: string;
    value: string | number;
    trend?: string;
    isPositive?: boolean;
  };
  rightStat?: {
    label: string;
    value: string | number;
    trend?: string;
    isPositive?: boolean;
  };
}

export const PerformanceSpeedometerGauge: React.FC<Props> = ({
  percentage = 0,
  label = 'Goal Achievement',
  subLabel,
  leftStat = { label: 'Completed Tasks', value: '0 / 0', trend: '0%', isPositive: true },
  rightStat = { label: 'Attendance Score', value: '0%', trend: '0%', isPositive: true }
}) => {
  const clamped = Math.min(100, Math.max(0, percentage));
  const totalSegments = 16;
  const activeCount = Math.round((clamped / 100) * totalSegments);

  // SVG dimensions & radius
  const cx = 130;
  const cy = 110;
  const innerR = 64;
  const outerR = 88;
  const gapDeg = 2.5;
  const segmentSpan = (180 - (totalSegments - 1) * gapDeg) / totalSegments;

  // Segment colors matching the reference image's gradient (rich blue/cyan to light cyan)
  const getSegmentColor = (index: number, isActive: boolean) => {
    if (!isActive) return '#EEF2F6';
    // Interpolate from deep brand teal to vibrant cyan
    const palette = [
      '#0E7490', '#0E7490', '#0891B2', '#0891B2',
      '#06B6D4', '#06B6D4', '#22D3EE', '#38BDF8',
      '#38BDF8', '#60A5FA', '#60A5FA', '#93C5FD',
      '#93C5FD', '#BFDBFE', '#BFDBFE', '#DBEAFE'
    ];
    return palette[index] || '#0891B2';
  };

  // Generate SVG path for a circular ring segment
  const renderSegment = (index: number) => {
    // Angles in degrees from 180 (left) down to 0 (right)
    const startAngle = 180 - index * (segmentSpan + gapDeg);
    const endAngle = startAngle - segmentSpan;

    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const x1 = cx + outerR * Math.cos(toRad(startAngle));
    const y1 = cy - outerR * Math.sin(toRad(startAngle));
    const x2 = cx + outerR * Math.cos(toRad(endAngle));
    const y2 = cy - outerR * Math.sin(toRad(endAngle));

    const x3 = cx + innerR * Math.cos(toRad(endAngle));
    const y3 = cy - innerR * Math.sin(toRad(endAngle));
    const x4 = cx + innerR * Math.cos(toRad(startAngle));
    const y4 = cy - innerR * Math.sin(toRad(startAngle));

    const pathData = `
      M ${x1} ${y1}
      A ${outerR} ${outerR} 0 0 1 ${x2} ${y2}
      L ${x3} ${y3}
      A ${innerR} ${innerR} 0 0 0 ${x4} ${y4}
      Z
    `;

    const isActive = index < activeCount;
    const fillColor = getSegmentColor(index, isActive);

    return (
      <path
        key={index}
        d={pathData}
        fill={fillColor}
        style={{
          transition: 'fill 0.3s ease',
          cursor: 'pointer'
        }}
      >
        <title>{`Segment ${index + 1}/${totalSegments}: ${isActive ? 'Active' : 'Remaining'}`}</title>
      </path>
    );
  };

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '18px',
      border: '1px solid #E7ECF3',
      padding: '20px 22px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      height: '100%',
      position: 'relative'
    }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 750,
          color: '#0F172A',
          margin: 0
        }}>
          Goal & KRI Completion
        </h3>
      </div>

      {/* Speedometer Gauge Visual */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', margin: '4px 0' }}>
        <svg
          viewBox="0 0 260 130"
          style={{ width: '100%', maxWidth: '270px', overflow: 'visible' }}
        >
          {Array.from({ length: totalSegments }).map((_, i) => renderSegment(i))}
        </svg>

        {/* Center Readout inside the semi-circle */}
        <div style={{
          position: 'absolute',
          bottom: '8px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          pointerEvents: 'none'
        }}>
          <div style={{
            fontSize: '2rem',
            fontWeight: 800,
            color: '#0F172A',
            letterSpacing: '-0.03em',
            lineHeight: 1.1
          }}>
            {clamped}%
          </div>
          <div style={{
            fontSize: '0.72rem',
            fontWeight: 600,
            color: '#64748B',
            marginTop: '2px',
            whiteSpace: 'nowrap'
          }}>
            {label}
          </div>
        </div>
      </div>

      {/* Bottom 2 Mini Metric Tiles matching reference image */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px',
        marginTop: '16px',
        paddingTop: '16px',
        borderTop: '1px solid #F1F5F9'
      }}>
        {/* Left Stat */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: '12px',
          padding: '10px 14px',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
            {leftStat.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              {leftStat.value}
            </span>
            {leftStat.trend && (
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#D97706',
                background: '#FEF3C7',
                padding: '2px 6px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                {leftStat.trend} ↗
              </span>
            )}
          </div>
        </div>

        {/* Right Stat */}
        <div style={{
          background: '#F8FAFC',
          borderRadius: '12px',
          padding: '10px 14px',
          border: '1px solid #E2E8F0'
        }}>
          <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600, marginBottom: '4px' }}>
            {rightStat.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
            <span style={{ fontSize: '1.15rem', fontWeight: 800, color: '#0F172A' }}>
              {rightStat.value}
            </span>
            {rightStat.trend && (
              <span style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: '#15803D',
                background: '#DCFCE7',
                padding: '2px 6px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '2px'
              }}>
                {rightStat.trend} ↗
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default PerformanceSpeedometerGauge;
