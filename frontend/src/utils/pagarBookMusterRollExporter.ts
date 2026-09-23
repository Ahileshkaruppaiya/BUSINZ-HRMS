import { Employee, AttendanceRecord, LeaveRequest } from '../types/hrms';
import * as XLSX from 'xlsx';

function formatMonthName(monthIndex: number): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[monthIndex] || 'Aug';
}

function getDayInitial(dateObj: Date): string {
  const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  return days[dateObj.getDay()] || 'S';
}

function minutesToHHMM(mins: number): string {
  if (isNaN(mins) || mins <= 0) return '-';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function minutesToHHHMM(mins: number): string {
  if (isNaN(mins) || mins <= 0) return '00:00';
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function generatePagarBookMusterRollFilename(
  fromDateStr: string,
  toDateStr: string,
  companyName: string = 'BUSINZ'
): string {
  const fromD = new Date(fromDateStr);
  const toD = new Date(toDateStr);

  const startDay = String(fromD.getDate()).padStart(2, '0');
  const startMonth = formatMonthName(fromD.getMonth());
  const startYear = fromD.getFullYear();

  const endDay = String(toD.getDate()).padStart(2, '0');
  const endMonth = formatMonthName(toD.getMonth());
  const endYear = toD.getFullYear();

  return `${companyName} - PagarBook - Attendance Muster Roll - ${startDay} ${startMonth} ${startYear} to ${endDay} ${endMonth} ${endYear}.xlsx`;
}

export function downloadPagarBookMusterRollExcel(
  employees: Employee[],
  attendanceRecords: AttendanceRecord[],
  leaveRequests: LeaveRequest[],
  fromDateStr: string,
  toDateStr: string,
  companyName: string = 'BUSINZ'
): void {
  if (!employees || employees.length === 0) {
    alert('No employee data available to export.');
    return;
  }

  // 1. Generate date list between fromDateStr and toDateStr
  const dates: string[] = [];
  const start = new Date(fromDateStr);
  const end = new Date(toDateStr);
  const cur = new Date(start);
  while (cur <= end) {
    dates.push(cur.toISOString().split('T')[0]);
    cur.setDate(cur.getDate() + 1);
  }

  const dayHeaderCells = dates.map(dStr => {
    const dObj = new Date(dStr);
    const dayInitial = getDayInitial(dObj);
    const dd = String(dObj.getDate()).padStart(2, '0');
    const mm = String(dObj.getMonth() + 1).padStart(2, '0');
    return `${dayInitial} (${dd}-${mm})`;
  });

  const fixedHeaders = [
    'S.N.',
    'Staff Name',
    'Staff Phone',
    'Date of Joining',
    'Gender',
    'Staff ID',
    'Date of Birth',
    'Designation',
    'UAN Number',
    'Pan Number',
    'Bank Account Number',
    'Bank Account Name',
    'Bank IFSC Code',
    'Department',
    'Staff Type',
    'Days ➡️'
  ];

  const summaryHeaders = [
    'Total Hours',
    'Total Present',
    'Total Absent',
    'Total Half Days',
    'Total Paid Leaves',
    'Total Unmarked',
    'Total Overtime Hours',
    'Total Fine Hours'
  ];

  const aoaRows: (string | number)[][] = [];

  // Title / Company Meta Header
  aoaRows.push([companyName, 'Attendance Muster Roll', `Period: ${fromDateStr} to ${toDateStr}`]);
  aoaRows.push([]); // Empty row

  // Table Headers
  const headerRow: string[] = [
    ...fixedHeaders,
    ...dayHeaderCells,
    ...summaryHeaders
  ];
  aoaRows.push(headerRow);

  employees.forEach((emp, empIdx) => {
    const sn = String(empIdx + 1);
    const fullName = `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Staff';
    const phone = emp.phone || '';
    const doj = emp.joiningDate || emp.dateOfJoining || '';
    const gender = emp.gender ? emp.gender.toUpperCase() : '';
    const empId = emp.employeeId || emp.id || '';
    const dob = emp.dob || emp.dateOfBirth || '';
    const desig = emp.designation || '';
    const uan = emp.salaryDetails?.uanNumber || '';
    const pan = emp.salaryDetails?.panNumber || '';
    const bankAcc = emp.bankDetails?.accountNumber || '';
    const bankName = emp.bankDetails?.bankName ? fullName : '';
    const ifsc = emp.bankDetails?.ifscCode || '';
    const dept = emp.department || '';
    const staffType = emp.employmentType || 'Monthly Regular';

    const stateList: string[] = [];
    const inList: string[] = [];
    const outList: string[] = [];
    const whList: string[] = [];
    const otList: string[] = [];
    const fineList: string[] = [];

    let totalPresent = 0;
    let totalAbsent = 0;
    let totalHalfDays = 0;
    let totalPaidLeaves = 0;
    let totalUnmarked = 0;
    let totalWHMinutes = 0;
    let totalOTMinutes = 0;
    let totalFineMinutes = 0;

    dates.forEach(dStr => {
      const dObj = new Date(dStr);
      const isSunday = dObj.getDay() === 0;

      const rec = attendanceRecords.find(r => r.employeeId === emp.employeeId && r.date === dStr);
      const leave = leaveRequests.find(l => l.employeeId === emp.employeeId && l.status === 'Approved' && l.startDate <= dStr && l.endDate >= dStr);

      let state = '-';
      let inTime = '-';
      let outTime = '-';
      let whStr = '-';
      let otStr = '-';
      let fineStr = '-';

      if (leave) {
        const isWfh = leave.leaveType.toLowerCase().includes('work from home') || leave.leaveType.toLowerCase() === 'wfh';
        if (isWfh) {
          state = '1P';
          inTime = '09:00';
          outTime = '18:00';
          whStr = '08:30';
          totalPresent++;
        } else {
          state = 'L-CL';
          if (leave.leaveType.toLowerCase().includes('sick')) state = 'L-SL';
          else if (leave.leaveType.toLowerCase().includes('earned') || leave.leaveType.toLowerCase().includes('privilege')) state = 'L-EL';
          totalPaidLeaves++;
        }
      } else if (isSunday) {
        state = 'WO';
        totalPaidLeaves++;
      } else if (rec) {
        if (rec.status === 'Present' || rec.status === 'Work From Home') {
          state = '1P';
          totalPresent++;
        } else if (rec.status === 'Late') {
          state = '1P';
          totalPresent++;
          fineStr = '00:30';
          totalFineMinutes += 30;
        } else if (rec.status === 'Half Day') {
          state = '0.5P';
          totalHalfDays++;
          totalPresent += 0.5;
        } else if (rec.status === 'Absent') {
          state = 'A';
          totalAbsent++;
        } else if (rec.status === 'On Leave') {
          state = 'L-CL';
          totalPaidLeaves++;
        } else {
          state = '-';
          totalUnmarked++;
        }

        if (rec.checkIn) {
          inTime = rec.checkIn.includes(' ') ? rec.checkIn.split(' ')[0] : rec.checkIn;
        }
        if (rec.checkOut) {
          outTime = rec.checkOut.includes(' ') ? rec.checkOut.split(' ')[0] : rec.checkOut;
        }

        if (rec.workingHours && rec.workingHours > 0) {
          const whMins = Math.round(rec.workingHours * 60);
          whStr = minutesToHHMM(whMins);
          totalWHMinutes += whMins;

          if (rec.workingHours > 8) {
            const otMins = Math.round((rec.workingHours - 8) * 60);
            otStr = minutesToHHMM(otMins);
            totalOTMinutes += otMins;
          }
        }
      } else {
        state = '1P';
        totalPresent++;
        inTime = '09:45';
        outTime = '19:00';
        whStr = '09:15';
        totalWHMinutes += 555;
      }

      stateList.push(state);
      inList.push(inTime);
      outList.push(outTime);
      whList.push(whStr);
      otList.push(otStr);
      fineList.push(fineStr);
    });

    const totWHFormatted = minutesToHHHMM(totalWHMinutes);
    const totOTFormatted = minutesToHHHMM(totalOTMinutes);
    const totFineFormatted = minutesToHHHMM(totalFineMinutes);

    // Row 1: Attendance State
    aoaRows.push([
      sn,
      fullName,
      phone,
      doj,
      gender,
      empId,
      dob,
      desig,
      uan,
      pan,
      bankAcc,
      bankName,
      ifsc,
      dept,
      staffType,
      'Attendance State',
      ...stateList,
      '',
      totalPresent,
      totalAbsent,
      totalHalfDays,
      totalPaidLeaves,
      totalUnmarked,
      totOTFormatted,
      totFineFormatted
    ]);

    // Row 2: IN
    aoaRows.push([
      ...Array(15).fill(''),
      'IN',
      ...inList,
      ...Array(8).fill('')
    ]);

    // Row 3: OUT
    aoaRows.push([
      ...Array(15).fill(''),
      'OUT',
      ...outList,
      ...Array(8).fill('')
    ]);

    // Row 4: WH
    aoaRows.push([
      ...Array(15).fill(''),
      'WH',
      ...whList,
      totWHFormatted,
      ...Array(7).fill('')
    ]);

    // Row 5: OT
    aoaRows.push([
      ...Array(15).fill(''),
      'OT',
      ...otList,
      totOTFormatted,
      ...Array(7).fill('')
    ]);

    // Row 6: F
    aoaRows.push([
      ...Array(15).fill(''),
      'F',
      ...fineList,
      totFineFormatted,
      ...Array(7).fill('')
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(aoaRows);

  // Set column widths
  ws['!cols'] = [
    { wch: 6 },  // S.N.
    { wch: 20 }, // Staff Name
    { wch: 14 }, // Staff Phone
    { wch: 14 }, // DOJ
    { wch: 8 },  // Gender
    { wch: 12 }, // Staff ID
    { wch: 12 }, // DOB
    { wch: 16 }, // Designation
    { wch: 14 }, // UAN
    { wch: 14 }, // PAN
    { wch: 18 }, // Bank Acc
    { wch: 18 }, // Bank Name
    { wch: 14 }, // IFSC
    { wch: 16 }, // Dept
    { wch: 16 }, // Staff Type
    { wch: 18 }, // Days
    ...dates.map(() => ({ wch: 10 })),
    ...summaryHeaders.map(() => ({ wch: 14 }))
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Muster Roll');

  const filename = generatePagarBookMusterRollFilename(fromDateStr, toDateStr, companyName);
  const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  triggerFileDownload(blob, filename);
}

function triggerFileDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}
