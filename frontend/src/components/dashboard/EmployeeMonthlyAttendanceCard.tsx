import React, { useState, useMemo } from 'react';
import { useHRMS } from '../../context/HRMSContext';

interface EmployeeMonthlyAttendanceCardProps {
  onOpenAttendance?: () => void;
  onOpenLeaves?: () => void;
}

export const EmployeeMonthlyAttendanceCard: React.FC<EmployeeMonthlyAttendanceCardProps> = ({
  onOpenAttendance,
  onOpenLeaves
}) => {
  const { currentUser, attendanceRecords, leaveRequests } = useHRMS();
  const [hoveredSegment, setHoveredSegment] = useState<string | null>(null);

  // Compute monthly stats for current employee for September 2026
  const stats = useMemo(() => {
    const userEmpId = (currentUser.employeeId || currentUser.id || '').trim().toLowerCase();
    const userName = (currentUser.name || '').trim().toLowerCase();

    // Filter attendance records for current user
    const userRecords = attendanceRecords.filter(a => {
      const recId = (a.employeeId || '').trim().toLowerCase();
      const recName = (a.employeeName || '').trim().toLowerCase();
      if (userEmpId && recId && userEmpId === recId) return true;
      if (userName && recName && (recName === userName || recName.includes(userName) || userName.includes(recName))) return true;
      return false;
    });

    // Check user's approved leaves
    const userLeaves = leaveRequests.filter(l => {
      const lId = (l.employeeId || '').trim().toLowerCase();
      const lName = (l.employeeName || '').trim().toLowerCase();
      const matchesUser = (userEmpId && lId && userEmpId === lId) ||
        (userName && lName && (lName === userName || lName.includes(userName) || userName.includes(lName)));
      return matchesUser && l.status === 'Approved';
    });

    // September 2026 working days calculation
    // Total calendar days: 30 | Sundays (Weekly Off): 4 | Total Working Days: 26
    const totalWorkingDays = 26;
    
    // Dynamic calibrated count based on user records + realistic month-to-date schedule
    const userPresentCount = userRecords.filter(r => r.status === 'Present' || r.status === 'Work From Home').length;
    const userLateCount = userRecords.filter(r => r.status === 'Late' || r.status === 'Half Day').length;
    const userLeaveCount = userLeaves.reduce((acc, l) => acc + (l.daysCount || 1), 0);

    const realPresent = userPresentCount;
    const realLeave = userLeaveCount;
    const realLate = userLateCount;
    const realAbsent = Math.max(0, totalWorkingDays - realPresent - realLeave - realLate);

    const attendanceRate = totalWorkingDays > 0 ? Math.round(((realPresent + (realLate * 0.5)) / totalWorkingDays) * 100) : 0;

    return {
      monthName: 'September 2026',
      totalWorkingDays,
      present: realPresent,
      leave: realLeave,
      late: realLate,
      absent: realAbsent,
      attendanceRate
    };
  }, [currentUser, attendanceRecords, leaveRequests]);

  // Donut chart SVG geometry (Big, Bold & Perfectly Proportioned)
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 70;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * r;

  const { totalWorkingDays, present, leave, late, absent, attendanceRate } = stats;
  const safeTotal = totalWorkingDays > 0 ? totalWorkingDays : 1;

  const pPct = present / safeTotal;
  const lPct = leave / safeTotal;
  const hPct = late / safeTotal;
  const aPct = absent / safeTotal;

  const gap = 2.5;
  const pLen = Math.max(0, pPct * circumference - gap);
  const lLen = Math.max(0, lPct * circumference - gap);
  const hLen = Math.max(0, hPct * circumference - gap);
  const aLen = Math.max(0, aPct * circumference - (aPct > 0 ? gap : 0));

  const pOffset = 0;
  const lOffset = -(pPct * circumference);
  const hOffset = -((pPct + lPct) * circumference);
  const aOffset = -((pPct + lPct + hPct) * circumference);

  return (
    <div className="dashboard-widget-card">
      {/* Header */}
      <div className="dashboard-widget-header" style={{ marginBottom: '8px' }}>
        <h3 className="dashboard-widget-title">
          MY MONTHLY ATTENDANCE
        </h3>
        <span className="dashboard-widget-badge">
          SEP 2026
        </span>
      </div>

      {/* Donut & Legend Container */}
      <div 
        className="dashboard-widget-body"
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '0',
          overflow: 'visible',
          flex: 1
        }}
      >
        {/* Donut Chart */}
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
              {/* 1. Present Arc (#0E7490 Teal) */}
              {present > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="#0E7490"
                  strokeWidth={hoveredSegment === 'present' ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${pLen} ${circumference}`}
                  strokeDashoffset={pOffset}
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease',
                    opacity: hoveredSegment && hoveredSegment !== 'present' ? 0.65 : 1
                  }}
                  onMouseEnter={() => setHoveredSegment('present')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() => onOpenAttendance?.()}
                >
                  <title>Present: {present} Days</title>
                </circle>
              )}

              {/* 2. On Leave Arc (#F97316 Solar Orange) */}
              {leave > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="#F97316"
                  strokeWidth={hoveredSegment === 'leave' ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${lLen} ${circumference}`}
                  strokeDashoffset={lOffset}
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease',
                    opacity: hoveredSegment && hoveredSegment !== 'leave' ? 0.65 : 1
                  }}
                  onMouseEnter={() => setHoveredSegment('leave')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() => onOpenLeaves?.()}
                >
                  <title>On Leave: {leave} Days</title>
                </circle>
              )}

              {/* 3. Half Day / Late Arc (#F59E0B Amber) */}
              {late > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth={hoveredSegment === 'late' ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${hLen} ${circumference}`}
                  strokeDashoffset={hOffset}
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease',
                    opacity: hoveredSegment && hoveredSegment !== 'late' ? 0.65 : 1
                  }}
                  onMouseEnter={() => setHoveredSegment('late')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() => onOpenAttendance?.()}
                >
                  <title>Late / Half Day: {late} Days</title>
                </circle>
              )}

              {/* 4. Absent Arc (#EF4444 Rose Red) */}
              {absent > 0 && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={r}
                  fill="none"
                  stroke="#EF4444"
                  strokeWidth={hoveredSegment === 'absent' ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={`${aLen} ${circumference}`}
                  strokeDashoffset={aOffset}
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s ease',
                    opacity: hoveredSegment && hoveredSegment !== 'absent' ? 0.65 : 1
                  }}
                  onMouseEnter={() => setHoveredSegment('absent')}
                  onMouseLeave={() => setHoveredSegment(null)}
                  onClick={() => onOpenAttendance?.()}
                >
                  <title>Absent: {absent} Days</title>
                </circle>
              )}
            </g>

            {/* Center Rate / Count */}
            <text
              x={cx}
              y={cy - 2}
              textAnchor="middle"
              fill="#0B1A2D"
              fontSize="30px"
              fontWeight="800"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => onOpenAttendance?.()}
            >
              {attendanceRate}%
            </text>
            <text
              x={cx}
              y={cy + 17}
              textAnchor="middle"
              fill="#64748B"
              fontSize="10.5px"
              fontWeight="750"
              letterSpacing="0.06em"
              fontFamily="'Plus Jakarta Sans', sans-serif"
              style={{ cursor: 'pointer', userSelect: 'none' }}
              onClick={() => onOpenAttendance?.()}
            >
              ATTENDANCE
            </text>
          </svg>
        </div>

        {/* Legend Below Chart */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '1px', marginTop: '2px' }}>
          {/* Present */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: '6px',
              transition: 'background 0.15s ease'
            }}
            onClick={() => onOpenAttendance?.()}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; setHoveredSegment('present'); }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; setHoveredSegment(null); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0E7490', flexShrink: 0 }} />
              <span style={{ fontSize: '0.80rem', fontWeight: 600, color: '#0B1A2D' }}>
                Present
              </span>
            </div>
            <span style={{ fontSize: '0.80rem', fontWeight: 750, color: '#0B1A2D' }}>
              {((present / safeTotal) * 100).toFixed(0)}% <span style={{ color: '#64748B', fontWeight: 500 }}>{present} Days</span>
            </span>
          </div>

          {/* On Leave */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: '6px',
              transition: 'background 0.15s ease'
            }}
            onClick={() => onOpenLeaves?.()}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; setHoveredSegment('leave'); }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; setHoveredSegment(null); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F97316', flexShrink: 0 }} />
              <span style={{ fontSize: '0.80rem', fontWeight: 600, color: '#0B1A2D' }}>
                On Leave
              </span>
            </div>
            <span style={{ fontSize: '0.80rem', fontWeight: 750, color: '#0B1A2D' }}>
              {((leave / safeTotal) * 100).toFixed(0)}% <span style={{ color: '#64748B', fontWeight: 500 }}>{leave} Days</span>
            </span>
          </div>

          {/* Half Day / Late */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: '6px',
              transition: 'background 0.15s ease'
            }}
            onClick={() => onOpenAttendance?.()}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; setHoveredSegment('late'); }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; setHoveredSegment(null); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B', flexShrink: 0 }} />
              <span style={{ fontSize: '0.80rem', fontWeight: 600, color: '#0B1A2D' }}>
                Half Day / Late
              </span>
            </div>
            <span style={{ fontSize: '0.80rem', fontWeight: 750, color: '#0B1A2D' }}>
              {((late / safeTotal) * 100).toFixed(0)}% <span style={{ color: '#64748B', fontWeight: 500 }}>{late} Days</span>
            </span>
          </div>

          {/* Absent */}
          <div 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              cursor: 'pointer',
              padding: '2px 8px',
              borderRadius: '6px',
              transition: 'background 0.15s ease'
            }}
            onClick={() => onOpenAttendance?.()}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F8FAFC'; setHoveredSegment('absent'); }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; setHoveredSegment(null); }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#EF4444', flexShrink: 0 }} />
              <span style={{ fontSize: '0.80rem', fontWeight: 600, color: '#0B1A2D' }}>
                Absent
              </span>
            </div>
            <span style={{ fontSize: '0.80rem', fontWeight: 750, color: '#0B1A2D' }}>
              {((absent / safeTotal) * 100).toFixed(0)}% <span style={{ color: '#64748B', fontWeight: 500 }}>{absent} {absent === 1 ? 'Day' : 'Days'}</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
