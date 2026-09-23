import React, { useState } from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

export interface MonthlyBarData {
  month: string;       // e.g. 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  fullName: string;    // e.g. 'August 2026'
  score: number;       // 0 - 100 overall
  kpiRate: number;     // 0 - 100
  attendanceRate: number; // 0 - 100
  kriScore: number;    // 0 - 100
}

interface Props {
  data?: MonthlyBarData[];
  selectedMonth?: string;
  onSelectMonth?: (monthFullName: string) => void;
  title?: string;
}

const DEFAULT_MONTHS: MonthlyBarData[] = [
  { month: 'May', fullName: 'May 2026', score: 0, kpiRate: 0, attendanceRate: 0, kriScore: 0 },
  { month: 'Jun', fullName: 'June 2026', score: 0, kpiRate: 0, attendanceRate: 0, kriScore: 0 },
  { month: 'Jul', fullName: 'July 2026', score: 0, kpiRate: 0, attendanceRate: 0, kriScore: 0 },
  { month: 'Aug', fullName: 'August 2026', score: 0, kpiRate: 0, attendanceRate: 0, kriScore: 0 },
  { month: 'Sep', fullName: 'September 2026', score: 0, kpiRate: 0, attendanceRate: 0, kriScore: 0 },
  { month: 'Oct', fullName: 'October 2026', score: 0, kpiRate: 0, attendanceRate: 0, kriScore: 0 },
  { month: 'Nov', fullName: 'November 2026', score: 0, kpiRate: 0, attendanceRate: 0, kriScore: 0 },
  { month: 'Dec', fullName: 'December 2026', score: 0, kpiRate: 0, attendanceRate: 0, kriScore: 0 },
];

export const PerformancePillarBarChart: React.FC<Props> = ({
  data = DEFAULT_MONTHS,
  selectedMonth = 'September 2026',
  onSelectMonth,
  title = 'Performance Overview'
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [timeFilter, setTimeFilter] = useState<'2026' | 'Last 6M' | 'This Month'>('2026');

  // Active month is either currently hovered, or selected, or default to August / September (index 3 or 4)
  const selectedIndex = data.findIndex(d => d.fullName.toLowerCase() === selectedMonth.toLowerCase());
  const activeIndex = hoveredIndex !== null ? hoveredIndex : (selectedIndex !== -1 ? selectedIndex : 3);
  const activeItem = data[activeIndex] || data[3];

  return (
    <div style={{
      background: '#FFFFFF',
      borderRadius: '18px',
      border: '1px solid #E7ECF3',
      padding: '20px 24px',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.03)',
      position: 'relative',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between'
    }}>
      {/* Top Header Row with Title & Filter Dropdown */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px'
      }}>
        <div>
          <h3 style={{
            fontSize: '1rem',
            fontWeight: 750,
            color: '#0F172A',
            margin: 0
          }}>
            {title}
          </h3>
          <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '2px 0 0' }}>
            Monthly KPI, Attendance & KRI progression
          </p>
        </div>

        <div style={{ position: 'relative' }}>
          <select
            value={timeFilter}
            onChange={e => setTimeFilter(e.target.value as any)}
            style={{
              padding: '6px 28px 6px 12px',
              borderRadius: '9999px',
              border: '1px solid #E2E8F0',
              fontSize: '0.78rem',
              fontWeight: 600,
              color: '#475569',
              background: '#F8FAFC',
              cursor: 'pointer',
              outline: 'none',
              appearance: 'none',
              WebkitAppearance: 'none'
            }}
          >
            <option value="2026">Year 2026</option>
            <option value="Last 6M">Last 6 Months</option>
            <option value="This Month">This Month</option>
          </select>
          <ChevronDown
            size={13}
            style={{
              position: 'absolute',
              right: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              pointerEvents: 'none',
              color: '#64748B'
            }}
          />
        </div>
      </div>

      {/* Chart Canvas Area */}
      <div 
        onMouseLeave={() => setHoveredIndex(null)}
        style={{ position: 'relative', height: '220px', display: 'flex', alignItems: 'flex-end', marginTop: '10px' }}
      >
        {/* Y-Axis Labels Left */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '180px',
          paddingRight: '12px',
          fontSize: '0.7rem',
          color: '#94A3B8',
          fontWeight: 600,
          userSelect: 'none',
          marginBottom: '28px'
        }}>
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>

        {/* Horizontal Dotted Gridlines */}
        <div style={{
          position: 'absolute',
          left: '42px',
          right: '0',
          top: '12px',
          bottom: '28px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          pointerEvents: 'none',
          zIndex: 0
        }}>
          <div style={{ borderBottom: '1px dashed #F1F5F9', width: '100%' }} />
          <div style={{ borderBottom: '1px dashed #F1F5F9', width: '100%' }} />
          <div style={{ borderBottom: '1px dashed #F1F5F9', width: '100%' }} />
          <div style={{ borderBottom: '1px dashed #F1F5F9', width: '100%' }} />
          <div style={{ borderBottom: '1px solid #E2E8F0', width: '100%' }} />
        </div>

        {/* Floating Tooltip Card (Shown ONLY on Cursor Hover) */}
        {hoveredIndex !== null && data[hoveredIndex] && (
          <div
            style={{
              position: 'absolute',
              top: '8px',
              left: `${Math.max(18, Math.min(82, 10 + ((hoveredIndex + 0.5) / data.length) * 88))}%`,
              transform: 'translateX(-50%)',
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '10px 14px',
              boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.12), 0 8px 10px -6px rgba(15, 23, 42, 0.05)',
              border: '1px solid #E2E8F0',
              zIndex: 10,
              minWidth: '150px',
              pointerEvents: 'none',
              transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              animation: 'fadeIn 0.15s ease-in-out'
            }}
          >
            <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#0F172A', marginBottom: '6px' }}>
              {data[hoveredIndex].fullName}
            </div>
            {data[hoveredIndex].score > 0 ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '0.72rem', marginBottom: '3px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0E7490' }} />
                    KPI Target:
                  </span>
                  <span style={{ fontWeight: 750, color: '#0F172A' }}>{data[hoveredIndex].kpiRate}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '0.72rem', marginBottom: '3px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22C55E' }} />
                    Attendance:
                  </span>
                  <span style={{ fontWeight: 750, color: '#0F172A' }}>{data[hoveredIndex].attendanceRate}%</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: '0.72rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#64748B' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#8B5CF6' }} />
                    KRI Score:
                  </span>
                  <span style={{ fontWeight: 750, color: '#8B5CF6' }}>{data[hoveredIndex].kriScore}%</span>
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.72rem', color: '#64748B', fontStyle: 'italic' }}>
                No performance records logged
              </div>
            )}
          </div>
        )}

        {/* Pillars Area */}
        <div style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          height: '180px',
          zIndex: 1,
          paddingLeft: '6px',
          paddingRight: '6px',
          marginBottom: '28px'
        }}>
          {data.map((item, idx) => {
            const isActive = idx === activeIndex;
            // Bar height relative to 100% max (180px canvas)
            const heightPercent = item.score > 0 ? Math.max(8, Math.min(100, item.score)) : 0;

            return (
              <div
                key={item.month}
                onClick={() => onSelectMonth && onSelectMonth(item.fullName)}
                onMouseEnter={() => setHoveredIndex(idx)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  height: '100%',
                  cursor: 'pointer',
                  padding: '0 4px',
                  position: 'relative'
                }}
              >
                {/* Active Bar Highlight Dot on Top */}
                {isActive && item.score > 0 && (
                  <div
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#0E7490',
                      border: '2px solid #FFFFFF',
                      boxShadow: '0 0 0 2px #0891B2',
                      marginBottom: '4px',
                      animation: 'bounce 1s infinite alternate'
                    }}
                  />
                )}

                {/* Pillar Bar with rounded top and base */}
                <div
                  style={{
                    width: '100%',
                    maxWidth: '36px',
                    height: item.score > 0 ? `${heightPercent}%` : '4px',
                    borderRadius: item.score > 0 ? '10px 10px 6px 6px' : '9999px',
                    background: item.score > 0
                      ? (isActive
                        ? 'repeating-linear-gradient(45deg, #0891B2, #0891B2 6px, #0E7490 6px, #0E7490 12px)'
                        : '#CFFAFE')
                      : (isActive ? '#94A3B8' : '#E2E8F0'),
                    boxShadow: (isActive && item.score > 0) ? '0 4px 12px rgba(14, 116, 144, 0.25)' : 'none',
                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative'
                  }}
                />

                {/* X-Axis Month Label */}
                <div style={{
                  position: 'absolute',
                  bottom: '-24px',
                  fontSize: '0.72rem',
                  fontWeight: isActive ? 800 : 600,
                  color: isActive ? '#0E7490' : '#64748B',
                  transition: 'color 0.2s'
                }}>
                  {item.month}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
export default PerformancePillarBarChart;
