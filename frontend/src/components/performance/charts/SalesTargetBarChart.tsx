import React from 'react';
import { EmployeeSalesMetric } from '../performanceEngine';

interface Props {
  metrics: EmployeeSalesMetric[];
}

export const SalesTargetBarChart: React.FC<Props> = ({ metrics }) => {
  const chartHeight = 150;
  const chartWidth = 750;
  const paddingLeft = 45;
  const paddingRight = 20;
  const paddingTop = 20;
  const paddingBottom = 28;

  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  // Max value for scale (in Lakhs)
  const maxLakhs = Math.max(...metrics.map(m => Math.max(m.monthlyTarget, m.monthlyAchieved))) / 100000;
  const scaleMax = Math.ceil(maxLakhs * 1.25) || 20;

  const slotWidth = usableWidth / metrics.length;
  const singleBarWidth = 22;

  const formatLakhs = (amount: number) => {
    return `₹${(amount / 100000).toFixed(1)}L`;
  };

  const yTicks = [0, Math.round(scaleMax * 0.33), Math.round(scaleMax * 0.66), scaleMax];

  return (
    <div style={{ width: '100%', overflowX: 'auto', display: 'flex', justifyContent: 'flex-start' }}>
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        preserveAspectRatio="xMinYMid meet"
        style={{ width: '100%', maxWidth: `${chartWidth}px`, maxHeight: '165px', height: 'auto', display: 'block', minWidth: '450px', margin: 0 }}
      >
        {/* Y Grid Lines */}
        {yTicks.map(tick => {
          const y = paddingTop + usableHeight - (tick / scaleMax) * usableHeight;
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
                ₹{tick}L
              </text>
            </g>
          );
        })}

        {/* Legend */}
        <g transform={`translate(${chartWidth - 160}, 4)`}>
          <rect x="0" y="0" width="10" height="10" rx="2" fill="#94A3B8" />
          <text x="14" y="9" fill="#475569" fontSize="10" fontWeight="600" fontFamily="sans-serif">
            Target
          </text>
          <rect x="65" y="0" width="10" height="10" rx="2" fill="#0E7490" />
          <text x="79" y="9" fill="#475569" fontSize="10" fontWeight="600" fontFamily="sans-serif">
            Actual
          </text>
        </g>

        {/* Grouped Bars per Sales Member */}
        {metrics.map((m, i) => {
          const xCenter = paddingLeft + (i * slotWidth) + (slotWidth / 2);

          const targetLakhs = m.monthlyTarget / 100000;
          const targetBarH = (targetLakhs / scaleMax) * usableHeight;
          const targetY = paddingTop + usableHeight - targetBarH;

          const actualLakhs = m.monthlyAchieved / 100000;
          const actualBarH = (actualLakhs / scaleMax) * usableHeight;
          const actualY = paddingTop + usableHeight - actualBarH;

          const isExceeded = m.monthlyAchieved >= m.monthlyTarget;
          const actualColor = isExceeded ? '#22C55E' : '#0E7490';

          return (
            <g key={m.employeeId}>
              {/* Target Bar */}
              <rect
                x={xCenter - singleBarWidth - 2}
                y={targetY}
                width={singleBarWidth}
                height={targetBarH}
                rx="3"
                fill="#94A3B8"
                opacity="0.85"
              />
              <text
                x={xCenter - singleBarWidth / 2 - 2}
                y={targetY - 5}
                fill="#64748B"
                fontSize="10"
                fontWeight="600"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {formatLakhs(m.monthlyTarget)}
              </text>

              {/* Actual Bar */}
              <rect
                x={xCenter + 2}
                y={actualY}
                width={singleBarWidth}
                height={actualBarH}
                rx="3"
                fill={actualColor}
              />
              <text
                x={xCenter + singleBarWidth / 2 + 2}
                y={actualY - 5}
                fill={actualColor}
                fontSize="10"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {formatLakhs(m.monthlyAchieved)}
              </text>

              {/* Employee Label */}
              <text
                x={xCenter}
                y={chartHeight - 12}
                fill="#1E293B"
                fontSize="11"
                fontWeight="700"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {m.employeeName}
              </text>
              <text
                x={xCenter}
                y={chartHeight - 2}
                fill="#64748B"
                fontSize="9"
                fontWeight="600"
                textAnchor="middle"
                fontFamily="sans-serif"
              >
                {m.achievementRate}% Achieved
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};
