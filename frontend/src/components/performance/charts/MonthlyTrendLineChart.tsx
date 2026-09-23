import React from 'react';

interface Props {
  data: { month: string; score: number }[];
}

export const MonthlyTrendLineChart: React.FC<Props> = ({ data }) => {
  const chartHeight = 120;
  const chartWidth = 580;
  const paddingLeft = 36;
  const paddingRight = 16;
  const paddingTop = 16;
  const paddingBottom = 22;

  const usableWidth = chartWidth - paddingLeft - paddingRight;
  const usableHeight = chartHeight - paddingTop - paddingBottom;

  const minY = 50;
  const maxY = 100;
  const rangeY = maxY - minY;

  const getX = (index: number) => paddingLeft + (index / (data.length - 1)) * usableWidth;
  const getY = (score: number) => paddingTop + usableHeight - ((score - minY) / rangeY) * usableHeight;

  // Build SVG path points
  const points = data.map((d, i) => `${getX(i)},${getY(d.score)}`).join(' ');

  // Area path for gradient fill
  const firstX = getX(0);
  const lastX = getX(data.length - 1);
  const bottomY = paddingTop + usableHeight;
  const areaPath = `M ${firstX} ${bottomY} L ${points.replace(/,/g, ' ')} L ${lastX} ${bottomY} Z`;

  // Determine trend
  const firstScore = data[0]?.score || 78;
  const lastScore = data[data.length - 1]?.score || 88;
  const scoreDiff = lastScore - firstScore;
  const trendLabel = scoreDiff > 1 ? 'Improving' : scoreDiff < -1 ? 'Declining' : 'Stable';
  const trendColor = scoreDiff > 1 ? '#15803D' : scoreDiff < -1 ? '#B91C1C' : '#0E7490';
  const trendBg = scoreDiff > 1 ? '#DCFCE7' : scoreDiff < -1 ? '#FEE2E2' : '#ECFEFF';

  const yTicks = [50, 65, 80, 100];

  return (
    <div style={{ width: '100%', maxWidth: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#0F172A' }}>
          Monthly Performance Trend
        </span>
        <span style={{
          padding: '2px 8px',
          borderRadius: '9999px',
          fontSize: '0.72rem',
          fontWeight: 700,
          backgroundColor: trendBg,
          color: trendColor
        }}>
          Trend: {trendLabel} ({scoreDiff > 0 ? `+${scoreDiff}%` : `${scoreDiff}%`})
        </span>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          style={{ width: '100%', maxHeight: '140px', minHeight: '100px', display: 'block' }}
        >
          <defs>
            <linearGradient id="trendAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0E7490" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#0E7490" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yTicks.map(tick => {
            const y = getY(tick);
            return (
              <g key={tick}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={chartWidth - paddingRight}
                  y2={y}
                  stroke="#E2E8F0"
                  strokeDasharray={tick === 50 ? 'none' : '3 3'}
                  strokeWidth={tick === 50 ? '1' : '0.8'}
                />
                <text
                  x={paddingLeft - 6}
                  y={y + 3}
                  fill="#94A3B8"
                  fontSize="8"
                  fontWeight="500"
                  textAnchor="end"
                  fontFamily="sans-serif"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaPath} fill="url(#trendAreaGrad)" />

          {/* Trend line */}
          <polyline
            fill="none"
            stroke="#0E7490"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            points={points}
          />

          {/* Data points & tooltips */}
          {data.map((d, i) => {
            const cx = getX(i);
            const cy = getY(d.score);
            const isLatest = i === data.length - 1;

            return (
              <g key={d.month}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={isLatest ? 4 : 3}
                  fill={isLatest ? '#0E7490' : '#ffffff'}
                  stroke="#0E7490"
                  strokeWidth="2"
                />
                {/* Score label above point */}
                <text
                  x={cx}
                  y={cy - 6}
                  fill="#0F172A"
                  fontSize="8.5"
                  fontWeight={isLatest ? '800' : '600'}
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {d.score}%
                </text>
                {/* Month label below axis */}
                <text
                  x={cx}
                  y={chartHeight - 6}
                  fill={isLatest ? '#0E7490' : '#64748B'}
                  fontSize="9"
                  fontWeight={isLatest ? '700' : '500'}
                  textAnchor="middle"
                  fontFamily="sans-serif"
                >
                  {d.month}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
