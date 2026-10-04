import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;
const ACCOUNT_NUM_REGEX = /^\d{9,18}$/;
const REPEATED_CHARS_REGEX = /(.)\1{3,}/i;

async function runAudit() {
  console.log('=====================================================');
  console.log('     BUSINZ HRMS - FULL DATABASE DATA AUDIT REPORT   ');
  console.log('=====================================================\n');

  const auditReport = {
    timestamp: new Date().toISOString(),
    summary: {
      totalEmployees: 0,
      invalidEmployees: 0,
      totalSalaryStructures: 0,
      invalidSalaryStructures: 0,
      totalPayrollRecords: 0,
      invalidPayrollRecords: 0,
      totalAttendanceRecords: 0,
      invalidAttendanceRecords: 0,
      totalCompanySettings: 0,
      invalidCompanySettings: 0,
    },
    findings: [],
  };

  const client = await pool.connect();
  try {
    // ----------------------------------------------------
    // 1. AUDIT EMPLOYEES
    // ----------------------------------------------------
    const empRes = await client.query(`
      SELECT e.*, d.name as dept_name 
      FROM employees e 
      LEFT JOIN departments d ON e.department_id = d.id
      ORDER BY e.created_at ASC
    `);

    auditReport.summary.totalEmployees = empRes.rows.length;
    console.log(`Auditing ${empRes.rows.length} employee records...`);

    for (const emp of empRes.rows) {
      const empIssues = [];

      // Phone Audit
      if (emp.phone === null || emp.phone === undefined || emp.phone.trim() === '') {
        empIssues.push({
          field: 'phone',
          value: emp.phone,
          severity: 'WARNING',
          message: 'Phone number is NULL or empty.'
        });
      } else {
        const cleanPhone = emp.phone.replace(/\D/g, '');
        if (!INDIAN_PHONE_REGEX.test(cleanPhone)) {
          empIssues.push({
            field: 'phone',
            value: emp.phone,
            severity: 'CRITICAL',
            message: `Invalid Indian phone number: "${emp.phone}". Must be exactly 10 digits starting with 6, 7, 8, or 9.`
          });
        }
        if (/^(\d)\1{9}$/.test(cleanPhone)) {
          empIssues.push({
            field: 'phone',
            value: emp.phone,
            severity: 'CRITICAL',
            message: `Unrealistic repeated phone number: "${emp.phone}".`
          });
        }
      }

      // First Name Audit
      const firstName = (emp.first_name || '').trim();
      if (!firstName || firstName.length < 2) {
        empIssues.push({
          field: 'first_name',
          value: emp.first_name,
          severity: 'CRITICAL',
          message: `First name "${emp.first_name}" is shorter than minimum 2 characters.`
        });
      } else if (firstName.length > 100) {
        empIssues.push({
          field: 'first_name',
          value: emp.first_name,
          severity: 'CRITICAL',
          message: `First name length (${firstName.length}) exceeds maximum 100 characters.`
        });
      } else if (!/^[A-Za-z\s.'-]+$/.test(firstName)) {
        empIssues.push({
          field: 'first_name',
          value: emp.first_name,
          severity: 'CRITICAL',
          message: `First name "${emp.first_name}" contains invalid characters. Numbers and disallowed symbols are prohibited.`
        });
      } else if (REPEATED_CHARS_REGEX.test(firstName)) {
        empIssues.push({
          field: 'first_name',
          value: emp.first_name,
          severity: 'CRITICAL',
          message: `First name "${emp.first_name}" contains 4+ consecutive identical characters (suspected gibberish).`
        });
      }

      // Last Name Audit
      const lastName = (emp.last_name || '').trim();
      if (lastName) {
        if (lastName.length > 100) {
          empIssues.push({
            field: 'last_name',
            value: emp.last_name,
            severity: 'CRITICAL',
            message: `Last name length (${lastName.length}) exceeds maximum 100 characters.`
          });
        } else if (!/^[A-Za-z\s.'-]+$/.test(lastName)) {
          empIssues.push({
            field: 'last_name',
            value: emp.last_name,
            severity: 'CRITICAL',
            message: `Last name "${emp.last_name}" contains invalid characters.`
          });
        } else if (REPEATED_CHARS_REGEX.test(lastName)) {
          empIssues.push({
            field: 'last_name',
            value: emp.last_name,
            severity: 'CRITICAL',
            message: `Last name "${emp.last_name}" contains 4+ consecutive identical characters.`
          });
        }
      }

      // Email Audit
      const email = (emp.email || '').trim().toLowerCase();
      if (!email || !EMAIL_REGEX.test(email)) {
        empIssues.push({
          field: 'email',
          value: emp.email,
          severity: 'CRITICAL',
          message: `Invalid email address format: "${emp.email}".`
        });
      }

      // Basic Salary Audit
      const basicSal = Number(emp.basic_salary);
      if (isNaN(basicSal) || basicSal < 0) {
        empIssues.push({
          field: 'basic_salary',
          value: emp.basic_salary,
          severity: 'CRITICAL',
          message: `Invalid or negative basic salary: ${emp.basic_salary}.`
        });
      }

      // PAN Audit
      if (emp.pan_number && emp.pan_number.trim()) {
        const cleanPan = emp.pan_number.trim().toUpperCase();
        if (!PAN_REGEX.test(cleanPan)) {
          empIssues.push({
            field: 'pan_number',
            value: emp.pan_number,
            severity: 'WARNING',
            message: `Invalid PAN format: "${emp.pan_number}". Must match ^[A-Z]{5}[0-9]{4}[A-Z]$.`
          });
        }
      }

      // IFSC Audit
      if (emp.ifsc_code && emp.ifsc_code.trim()) {
        const cleanIfsc = emp.ifsc_code.trim().toUpperCase();
        if (!IFSC_REGEX.test(cleanIfsc)) {
          empIssues.push({
            field: 'ifsc_code',
            value: emp.ifsc_code,
            severity: 'WARNING',
            message: `Invalid IFSC format: "${emp.ifsc_code}". Must match ^[A-Z]{4}0[A-Z0-9]{6}$.`
          });
        }
      }

      // Pincode Audit
      if (emp.pincode && emp.pincode.trim()) {
        const cleanPin = emp.pincode.trim();
        if (!PINCODE_REGEX.test(cleanPin)) {
          empIssues.push({
            field: 'pincode',
            value: emp.pincode,
            severity: 'WARNING',
            message: `Invalid Pincode: "${emp.pincode}". Indian pincodes must be 6 digits starting with 1-9.`
          });
        }
      }

      // Account Number Audit
      if (emp.account_number && emp.account_number.trim()) {
        const cleanAcc = emp.account_number.trim();
        if (!ACCOUNT_NUM_REGEX.test(cleanAcc)) {
          empIssues.push({
            field: 'account_number',
            value: emp.account_number,
            severity: 'WARNING',
            message: `Invalid Account Number: "${emp.account_number}". Must be 9 to 18 digits.`
          });
        }
      }

      // Department Foreign Key
      if (emp.department_id && !emp.dept_name) {
        empIssues.push({
          field: 'department_id',
          value: emp.department_id,
          severity: 'CRITICAL',
          message: `Orphan department_id reference: "${emp.department_id}". Department does not exist.`
        });
      }

      if (empIssues.length > 0) {
        auditReport.summary.invalidEmployees++;
        auditReport.findings.push({
          table: 'employees',
          id: emp.id,
          employeeId: emp.employee_id,
          name: `${emp.first_name} ${emp.last_name}`.trim(),
          issues: empIssues,
        });
      }
    }

    // ----------------------------------------------------
    // 2. AUDIT SALARY STRUCTURES
    // ----------------------------------------------------
    const ssRes = await client.query(`
      SELECT ss.*, e.employee_id, e.first_name, e.last_name 
      FROM salary_structures ss
      LEFT JOIN employees e ON ss.employee_id = e.id
    `);
    auditReport.summary.totalSalaryStructures = ssRes.rows.length;

    for (const ss of ssRes.rows) {
      const ssIssues = [];
      if (!ss.employee_id || !ss.first_name) {
        ssIssues.push({
          field: 'employee_id',
          value: ss.employee_id,
          severity: 'CRITICAL',
          message: `Orphan salary structure: employee_id "${ss.employee_id}" does not exist in employees table.`
        });
      }
      const monthly = Number(ss.monthly_salary);
      if (isNaN(monthly) || monthly < 0) {
        ssIssues.push({
          field: 'monthly_salary',
          value: ss.monthly_salary,
          severity: 'CRITICAL',
          message: `Invalid monthly salary: ${ss.monthly_salary}.`
        });
      }
      const sumPct = Number(ss.basic_percentage) + Number(ss.da_percentage) + Number(ss.conveyance_percentage) + Number(ss.hra_percentage);
      if (Math.abs(sumPct - 100) > 0.05) {
        ssIssues.push({
          field: 'percentages',
          value: `Basic: ${ss.basic_percentage}%, DA: ${ss.da_percentage}%, Conveyance: ${ss.conveyance_percentage}%, HRA: ${ss.hra_percentage}% (Sum: ${sumPct}%)`,
          severity: 'WARNING',
          message: `Salary breakdown percentages sum to ${sumPct}%, expected 100%.`
        });
      }

      if (ssIssues.length > 0) {
        auditReport.summary.invalidSalaryStructures++;
        auditReport.findings.push({
          table: 'salary_structures',
          id: ss.id,
          employee: ss.employee_id ? `${ss.first_name} ${ss.last_name} (${ss.employee_id})` : 'Unknown',
          issues: ssIssues,
        });
      }
    }

    // ----------------------------------------------------
    // 3. AUDIT PAYROLL RECORDS
    // ----------------------------------------------------
    const prRes = await client.query(`
      SELECT pr.*, e.employee_id, e.first_name, e.last_name 
      FROM payroll_records pr
      LEFT JOIN employees e ON pr.employee_id = e.id
    `);
    auditReport.summary.totalPayrollRecords = prRes.rows.length;

    for (const pr of prRes.rows) {
      const prIssues = [];
      if (!pr.employee_id || !pr.first_name) {
        prIssues.push({
          field: 'employee_id',
          value: pr.employee_id,
          severity: 'CRITICAL',
          message: `Orphan payroll record: employee_id "${pr.employee_id}" does not exist.`
        });
      }
      if (Number(pr.net_salary) < 0) {
        prIssues.push({
          field: 'net_salary',
          value: pr.net_salary,
          severity: 'CRITICAL',
          message: `Negative net salary: ${pr.net_salary}.`
        });
      }

      if (prIssues.length > 0) {
        auditReport.summary.invalidPayrollRecords++;
        auditReport.findings.push({
          table: 'payroll_records',
          id: pr.id,
          employee: pr.employee_id ? `${pr.first_name} ${pr.last_name} (${pr.employee_id})` : 'Unknown',
          issues: prIssues,
        });
      }
    }

    // ----------------------------------------------------
    // 4. AUDIT ATTENDANCE RECORDS
    // ----------------------------------------------------
    const attRes = await client.query(`
      SELECT ar.*, e.employee_id, e.first_name, e.last_name 
      FROM attendance_records ar
      LEFT JOIN employees e ON ar.employee_id = e.id
    `);
    auditReport.summary.totalAttendanceRecords = attRes.rows.length;

    for (const ar of attRes.rows) {
      const arIssues = [];
      if (!ar.employee_id || !ar.first_name) {
        arIssues.push({
          field: 'employee_id',
          value: ar.employee_id,
          severity: 'CRITICAL',
          message: `Orphan attendance record: employee_id "${ar.employee_id}" does not exist.`
        });
      }

      if (arIssues.length > 0) {
        auditReport.summary.invalidAttendanceRecords++;
        auditReport.findings.push({
          table: 'attendance_records',
          id: ar.id,
          issues: arIssues,
        });
      }
    }

    // ----------------------------------------------------
    // 5. AUDIT COMPANY SETTINGS (Contact Phone / Email)
    // ----------------------------------------------------
    const csRes = await client.query(`
      SELECT setting_key, setting_val 
      FROM company_settings 
      WHERE setting_key LIKE 'company_info%'
    `);
    auditReport.summary.totalCompanySettings = csRes.rows.length;

    for (const cs of csRes.rows) {
      const val = cs.setting_val;
      if (val && typeof val === 'object') {
        const csIssues = [];
        if (val.officialPhone && !INDIAN_PHONE_REGEX.test(val.officialPhone.replace(/\D/g, ''))) {
          csIssues.push({
            field: 'officialPhone',
            value: val.officialPhone,
            severity: 'WARNING',
            message: `Company official phone "${val.officialPhone}" does not match Indian 10-digit mobile/phone format.`
          });
        }
        if (val.contactPhone && !INDIAN_PHONE_REGEX.test(val.contactPhone.replace(/\D/g, ''))) {
          csIssues.push({
            field: 'contactPhone',
            value: val.contactPhone,
            severity: 'WARNING',
            message: `Company contact phone "${val.contactPhone}" does not match Indian 10-digit mobile/phone format.`
          });
        }
        if (val.officialEmail && !EMAIL_REGEX.test(val.officialEmail.trim())) {
          csIssues.push({
            field: 'officialEmail',
            value: val.officialEmail,
            severity: 'WARNING',
            message: `Company official email "${val.officialEmail}" is invalid.`
          });
        }

        if (csIssues.length > 0) {
          auditReport.summary.invalidCompanySettings++;
          auditReport.findings.push({
            table: 'company_settings',
            key: cs.setting_key,
            issues: csIssues,
          });
        }
      }
    }

  } finally {
    client.release();
  }

  // Save audit report to JSON
  const reportPath = path.resolve(__dirname, '../audit_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditReport, null, 2));

  console.log('----------------- AUDIT SUMMARY -----------------');
  console.log(`Total Employees Checked:       ${auditReport.summary.totalEmployees}`);
  console.log(`Employees with Validation Issues: ${auditReport.summary.invalidEmployees}`);
  console.log(`Total Salary Structures:       ${auditReport.summary.totalSalaryStructures}`);
  console.log(`Salary Structures with Issues: ${auditReport.summary.invalidSalaryStructures}`);
  console.log(`Total Payroll Records:         ${auditReport.summary.totalPayrollRecords}`);
  console.log(`Payroll Records with Issues:   ${auditReport.summary.invalidPayrollRecords}`);
  console.log(`Total Attendance Records:      ${auditReport.summary.totalAttendanceRecords}`);
  console.log(`Attendance Records with Issues:${auditReport.summary.invalidAttendanceRecords}`);
  console.log(`Company Settings Checked:      ${auditReport.summary.totalCompanySettings}`);
  console.log(`Company Settings with Issues:  ${auditReport.summary.invalidCompanySettings}`);
  console.log(`\nDetailed findings written to: ${reportPath}\n`);

  console.log('---------------- DETAILED FINDINGS ----------------');
  auditReport.findings.forEach(f => {
    console.log(`[${f.table.toUpperCase()}] ID: ${f.id || f.key || 'N/A'} - ${f.name || f.employee || ''}`);
    f.issues.forEach(i => {
      console.log(`   * [${i.severity}] Field: ${i.field} | Value: ${JSON.stringify(i.value)} | ${i.message}`);
    });
  });
  console.log('=====================================================\n');

  await pool.end();
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
