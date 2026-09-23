import React, { useState } from 'react';
import { DepartmentPerformanceSummary } from '../performanceEngine';

interface Props {
  data: DepartmentPerformanceSummary[];
}

export const CompanyPerformanceBarChart: React.FC<Props> = ({ data }) => {
  const [hoveredDept, setHoveredDept] = useState<string | null>(null);

  const chartHeight = 170;
  const chartWidth = 800;
  const paddingLeft = 42;
  const paddingRight = 20;
  const paddingTop = 22;
  const paddingBottom = 28;

  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  const barCount = data.length;
  const barSlotWidth = usableWidth / barCount;
  const barWidth = 26;

  const yTicks = [0, 25, 50, 75, 100];

  return (
    <div style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'flex-start' }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="xMinYMid meet"
        style={{
          width: '100%',
          maxWidth: `${chartWidth}px`,
          maxHeight: '185px',
          height: 'auto',
          display: 'block',
          minWidth: '550px',
          margin: 0
        }}
      >
        <defs>
          <linearGradient id="vrmBarGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0E7490" />
            <stop offset="100%" stopColor="#155E75" />
          </linearGradient>
          <linearGradient id="vrmBarHoverGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0891B2" />
            <stop offset="100%" stopColor="#0E7490" />
          </linearGradient>
        </defs>

        {/* Horizontal Grid lines & Y-Axis Labels */}
        {yTicks.map(tick => {
          const y = paddingTop + usableHeight - (tick / 100) * usableHeight;
          return (
            <g key={tick}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={chartWidth - paddingRight}
                y2={y}
                stroke="#E2E8F0"
                strokeDasharray={tick === 0 ? 'none' : '3 3'}
                strokeWidth={tick === 0 ? '1.5' : '1'}
              />
              <text
                x={paddingLeft - 8}
                y={y + 3.5}
                fill="#64748B"
                fontSize="10"
                fontWeight="500"
                textAnchor="end"
                fontFamily="sans-serif"
              >
                {tick}%
              </text>
            </g>
          );
        })}

        {/* Department Bars */}
        {data.map((dept, i) => {
          const xCenter = paddingLeft + (i * barSlotWidth) + (barSlotWidth / 2);
          const barHeight = (dept.averageScore / 100) * usableHeight;
          const y = paddingTop + usableHeight - barHeight;
          const isHovered = hoveredDept === dept.department;

          return (
            <g
              key={dept.department}
              onMouseEnter={() => setHoveredDept(dept.department)}
              onMouseLeave={() => setHoveredDept(null)}
              style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
            >
              {/* Bar */}
              <rect
                x={xCenter - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="4"
                fill={isHovered ? 'url(#vrmBarHoverGradient)' : 'url(#vrmBarGradient)'}
                filter={isHovered ? 'drop-shadow(0 3px 5px rgba(14, 116, 144, 0.30))' : 'none'}
              />

              {/* Value Label above bar */}
              <text
                x={xCenter}
                y={y - 6}
                fill={isHovered ? '#0E7490' : '#1E293B'}
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {dept.averageScore}%
              </text>

              {/* Department Name Label below X-Axis */}
              <text
                x={xCenter}
                y={chartHeight - 8}
                fill={isHovered ? '#0E7490' : '#475569'}
                fontSize="11"
                fontWeight={isHovered ? '700' : '500'}
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {dept.department === 'Technical Support' ? 'Tech Support' : dept.department}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
