import { getSupabaseAdmin, isRealSupabaseConfigured } from '../config/supabase.js';
import { SalaryStructureInput } from '../types/payroll.js';
import { memoryCache } from '../services/cacheService.js';

import { AccountStatus, CredentialEmailStatus } from '../types/auth.js';

export interface EmployeeRecord {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  department: string;
  designation: string;
  basicSalary: number;
  grossSalary: number;
  da?: number;
  conveyance?: number;
  hra?: number;
  withPf?: boolean;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  authUserId?: string;
  mustChangePassword?: boolean;
  accountStatus?: AccountStatus;
  credentialEmailStatus?: CredentialEmailStatus;
  credentialEmailSentAt?: string;
  lastLoginAt?: string;
  status?: string;
  phone?: string;
  branch?: string;
  joiningDate?: string;
  attendanceMethod?: string;
  workShift?: string;
  shiftId?: string;
  password?: string;
}

export interface EmployeeSalaryStructureRecord extends SalaryStructureInput {
  id: string;
  employeeId: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  withPf?: boolean;
}

// Initial seed employees for local/test mode. System Super Admin EMP-000 is
// intentionally auth-only and excluded from the workforce directory.
const fallbackEmployees: EmployeeRecord[] = [
  {
    id: 'e01a1111-0000-0000-0000-000000000001',
    employeeId: 'EMP-001',
    firstName: 'Pavithra',
    lastName: 'S',
    email: 'hr@vrmstructures.com',
    department: 'HR',
    designation: 'HR Manager',
    basicSalary: 15000,
    grossSalary: 15000,
    bankName: 'HDFC Bank',
    accountNumber: '****1001',
    ifscCode: 'HDFC0001234',
    authUserId: 'usr-001',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
    credentialEmailStatus: 'SENT',
    credentialEmailSentAt: '2026-01-01T09:00:00.000Z',
    status: 'Active',
    attendanceMethod: 'Face Scan',
    workShift: 'SH-01',
    password: 'Password@123',
  },
  {
    id: 'e01a1111-0000-0000-0000-000000000002',
    employeeId: 'EMP-002',
    firstName: 'Ramesh',
    lastName: 'Kumar',
    email: 'finance@vrmstructures.com',
    department: 'Finance',
    designation: 'Finance Manager',
    basicSalary: 18000,
    grossSalary: 45000,
    bankName: 'ICICI Bank',
    accountNumber: '****1002',
    ifscCode: 'ICIC0001234',
    authUserId: 'usr-002',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
    credentialEmailStatus: 'SENT',
    credentialEmailSentAt: '2026-01-01T09:00:00.000Z',
    status: 'Active',
    attendanceMethod: 'Face Scan',
    workShift: 'SH-01',
    password: 'Password@123',
  },
  {
    id: 'e01a1111-0000-0000-0000-000000000003',
    employeeId: 'EMP-003',
    firstName: 'Meena',
    lastName: 'Ravi',
    email: 'meena@vrmstructures.com',
    department: 'Operations',
    designation: 'Operations Executive',
    basicSalary: 14000,
    grossSalary: 28000,
    bankName: 'Axis Bank',
    accountNumber: '****1003',
    ifscCode: 'UTIB0001234',
    authUserId: 'usr-003',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
    credentialEmailStatus: 'SENT',
    credentialEmailSentAt: '2026-01-01T09:00:00.000Z',
    status: 'Active',
    attendanceMethod: 'Face Scan',
    workShift: 'SH-01',
    password: 'Password@123',
  },
  {
    id: 'e01a1111-0000-0000-0000-000000000004',
    employeeId: 'EMP-004',
    firstName: 'Karthik',
    lastName: 'Rajan',
    email: 'field@vrmstructures.com',
    department: 'Field Operations',
    designation: 'Field Engineer',
    basicSalary: 16000,
    grossSalary: 36000,
    bankName: 'State Bank of India',
    accountNumber: '****1004',
    ifscCode: 'SBIN0001234',
    authUserId: 'usr-004',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
    credentialEmailStatus: 'SENT',
    credentialEmailSentAt: '2026-01-01T09:00:00.000Z',
    status: 'Active',
    attendanceMethod: 'GPS Location',
    workShift: 'SH-01',
    password: 'Password@123',
  },
  {
    id: 'e01a1111-0000-0000-0000-000000000009',
    employeeId: 'EMP-009',
    firstName: 'Suresh',
    lastName: 'Kumar',
    email: 'suresh@vrmstructures.com',
    department: 'Installation',
    designation: 'Solar Technician',
    basicSalary: 15000,
    grossSalary: 30000,
    bankName: 'Canara Bank',
    accountNumber: '****1009',
    ifscCode: 'CNRB0001234',
    authUserId: 'usr-009',
    accountStatus: 'ACTIVE',
    mustChangePassword: false,
    credentialEmailStatus: 'SENT',
    credentialEmailSentAt: '2026-01-01T09:00:00.000Z',
    status: 'Active',
    attendanceMethod: 'Face Scan',
    workShift: 'SH-01',
    password: 'Password@123',
  },
];

// Fallback in-memory salary structures (Default: 40% Basic, 20% DA, 5% Conveyance, 35% HRA)
const inMemoryStructures = new Map<string, EmployeeSalaryStructureRecord>([
  [
    'EMP-000',
    {
      id: 'ss-000',
      employeeId: 'EMP-000',
      monthlySalary: 250000,
      basicPercentage: 40,
      daPercentage: 20,
      conveyancePercentage: 5,
      hraPercentage: 35,
      effectiveFrom: '2026-01-01',
      isActive: true,
    },
  ],
  [
    'EMP-001',
    {
      id: 'ss-001',
      employeeId: 'EMP-001',
      monthlySalary: 15000,
      basicPercentage: 40,
      daPercentage: 20,
      conveyancePercentage: 5,
      hraPercentage: 35,
      effectiveFrom: '2026-01-01',
      isActive: true,
    },
  ],
]);

export class EmployeeRepository {
  async getEmployeeById(idOrEmpId: string): Promise<EmployeeRecord | null> {
    if (!idOrEmpId || typeof idOrEmpId !== 'string') return null;
    const cleanId = idOrEmpId.trim();

    // High-speed memory cache check
    const cacheKey = `emp_${cleanId}`;
    const cached = memoryCache.get<EmployeeRecord>(cacheKey);
    if (cached) return cached;

    // Check local fallback master store
    const local = fallbackEmployees.find(e => e.id === cleanId || e.employeeId === cleanId);
    if (local) {
      memoryCache.set(cacheKey, local, 30000);
      return local;
    }

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
          .from('employees')
          .select('*')
          .or(`id.eq.${cleanId},employee_id.eq.${cleanId}`)
          .single();

        if (data && !error) {
          const emp: EmployeeRecord = {
            id: data.id,
            employeeId: data.employee_id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            department: data.department || 'General',
            designation: data.designation || 'Staff',
            basicSalary: Number(data.basic_salary) || 0,
            grossSalary: Number(data.basic_salary) * 2.5 || 15000,
            bankName: data.bank_name,
            accountNumber: data.account_number,
            ifscCode: data.ifsc_code,
            password: data.password || 'Password@123',
            mustChangePassword: data.must_change_password,
            accountStatus: data.account_status,
            credentialEmailStatus: data.credential_email_status,
            credentialEmailSentAt: data.credential_email_sent_at,
            lastLoginAt: data.last_login_at,
          };
          memoryCache.set(cacheKey, emp, 30000);
          return emp;
        }
      } catch {
        // Fall back to null
      }
    }

    return null;
  }

  async findByEmail(email: string): Promise<EmployeeRecord | null> {
    if (!email) return null;
    const clean = email.toLowerCase().trim();
    const local = fallbackEmployees.find((e) => e.email.toLowerCase().trim() === clean);
    if (local) return local;

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('employees').select('*').eq('email', clean).single();
        if (data && !error) {
          return {
            id: data.id,
            employeeId: data.employee_id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            department: data.department || 'General',
            designation: data.designation || 'Staff',
            basicSalary: Number(data.basic_salary) || 0,
            grossSalary: Number(data.basic_salary) * 2.5 || 15000,
            bankName: data.bank_name,
            accountNumber: data.account_number,
            ifscCode: data.ifsc_code,
            authUserId: data.auth_id,
            password: data.password || 'Password@123',
            mustChangePassword: data.must_change_password,
            accountStatus: data.account_status,
            credentialEmailStatus: data.credential_email_status,
            credentialEmailSentAt: data.credential_email_sent_at,
            lastLoginAt: data.last_login_at,
          };
        }
      } catch {
        // non-blocking
      }
    }

    return null;
  }

  async findByEmployeeId(empId: string): Promise<EmployeeRecord | null> {
    if (!empId) return null;
    const clean = empId.toLowerCase().trim();
    const local = fallbackEmployees.find((e) => e.employeeId.toLowerCase().trim() === clean);
    if (local) return local;

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('employees').select('*').ilike('employee_id', clean).single();
        if (data && !error) {
          return {
            id: data.id,
            employeeId: data.employee_id,
            firstName: data.first_name,
            lastName: data.last_name,
            email: data.email,
            department: data.department || 'General',
            designation: data.designation || 'Staff',
            basicSalary: Number(data.basic_salary) || 0,
            grossSalary: Number(data.basic_salary) * 2.5 || 15000,
            bankName: data.bank_name,
            accountNumber: data.account_number,
            ifscCode: data.ifsc_code,
            authUserId: data.auth_id,
            password: data.password || 'Password@123',
            mustChangePassword: data.must_change_password,
            accountStatus: data.account_status,
            credentialEmailStatus: data.credential_email_status,
            credentialEmailSentAt: data.credential_email_sent_at,
            lastLoginAt: data.last_login_at,
          };
        }
      } catch {
        // non-blocking
      }
    }

    return null;
  }


  async getAllEmployees(): Promise<EmployeeRecord[]> {
    const cacheKey = 'employees_all_active';
    const cached = memoryCache.get<EmployeeRecord[]>(cacheKey);
    if (cached) return cached;

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.from('employees').select('*').eq('status', 'Active');
        if (data && !error && data.length > 0) {
          const list = data
            .filter(d => d.employee_id !== 'EMP-000' && d.email?.toLowerCase() !== 'admin@businz.com')
            .map(d => ({
            id: d.id,
            employeeId: d.employee_id,
            firstName: d.first_name,
            lastName: d.last_name,
            email: d.email,
            department: d.department || 'General',
            designation: d.designation || 'Staff',
            basicSalary: Number(d.basic_salary) || 0,
            grossSalary: Number(d.basic_salary) * 2.5 || 15000,
            bankName: d.bank_name,
            accountNumber: d.account_number,
            ifscCode: d.ifsc_code,
            password: d.password || 'Password@123',
            mustChangePassword: d.must_change_password,
            accountStatus: d.account_status,
            credentialEmailStatus: d.credential_email_status,
            credentialEmailSentAt: d.credential_email_sent_at,
            lastLoginAt: d.last_login_at,
          }));
          memoryCache.set(cacheKey, list, 30000);
          return list;
        }
      } catch {
        // fallback
      }
    }
    memoryCache.set(cacheKey, fallbackEmployees, 30000);
    return fallbackEmployees;
  }

  async getSalaryStructure(employeeId: string): Promise<EmployeeSalaryStructureRecord | null> {
    if (!employeeId) return null;
    const cleanId = employeeId.trim();
    const cacheKey = `ss_${cleanId}`;
    const cached = memoryCache.get<EmployeeSalaryStructureRecord>(cacheKey);
    if (cached) return cached;

    const emp = await this.getEmployeeById(cleanId);
    const key = emp ? emp.employeeId : cleanId;

    const found = inMemoryStructures.get(key);
    if (found) {
      if (found.withPf === undefined && emp?.withPf !== undefined) {
        found.withPf = emp.withPf;
      }
      memoryCache.set(cacheKey, found, 30000);
      return found;
    }

    if (isRealSupabaseConfigured() && emp) {
      try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase
          .from('salary_structures')
          .select('*')
          .eq('employee_id', emp.id)
          .eq('is_active', true)
          .single();

        if (data && !error) {
          const struct: EmployeeSalaryStructureRecord = {
            id: data.id,
            employeeId: key,
            monthlySalary: Number(data.monthly_salary),
            basicPercentage: Number(data.basic_percentage),
            daPercentage: Number(data.da_percentage),
            conveyancePercentage: Number(data.conveyance_percentage),
            hraPercentage: Number(data.hra_percentage),
            effectiveFrom: data.effective_from,
            effectiveTo: data.effective_to,
            isActive: data.is_active,
          };
          memoryCache.set(cacheKey, struct, 30000);
          return struct;
        }
      } catch {
        // fallback
      }
    }

    // Default structure (40% Basic, 20% DA, 5% Conveyance, 35% HRA) for monthly salary 15000
    const defaultStructure: EmployeeSalaryStructureRecord = {
      id: `ss-${key}`,
      employeeId: key,
      monthlySalary: 15000,
      basicPercentage: 40,
      daPercentage: 20,
      conveyancePercentage: 5,
      hraPercentage: 35,
      withPf: emp?.withPf !== undefined ? emp.withPf : true,
      effectiveFrom: '2026-01-01',
      isActive: true,
    };
    inMemoryStructures.set(key, defaultStructure);
    memoryCache.set(cacheKey, defaultStructure, 30000);
    return defaultStructure;
  }

  async saveSalaryStructure(
    employeeId: string,
    structure: SalaryStructureInput & { effectiveFrom?: string; effectiveTo?: string | null }
  ): Promise<EmployeeSalaryStructureRecord> {
    const emp = await this.getEmployeeById(employeeId);
    const key = emp ? emp.employeeId : employeeId;

    const record: EmployeeSalaryStructureRecord = {
      id: `ss-${key}-${Date.now()}`,
      employeeId: key,
      monthlySalary: structure.monthlySalary,
      basicPercentage: structure.basicPercentage,
      daPercentage: structure.daPercentage,
      conveyancePercentage: structure.conveyancePercentage,
      hraPercentage: structure.hraPercentage,
      withPf: structure.withPf !== undefined ? structure.withPf : (emp?.withPf !== undefined ? emp.withPf : true),
      effectiveFrom: structure.effectiveFrom || new Date().toISOString().split('T')[0],
      effectiveTo: structure.effectiveTo || null,
      isActive: true,
    };

    inMemoryStructures.set(key, record);
    memoryCache.invalidate(`ss_${key}`);
    memoryCache.invalidate(`ss_${employeeId}`);

    if (isRealSupabaseConfigured() && emp) {
      try {
        const supabase = getSupabaseAdmin();
        // Deactivate old structures
        await supabase
          .from('salary_structures')
          .update({ is_active: false })
          .eq('employee_id', emp.id);

        // Insert new active structure
        await supabase.from('salary_structures').insert({
          employee_id: emp.id,
          monthly_salary: structure.monthlySalary,
          basic_percentage: structure.basicPercentage,
          da_percentage: structure.daPercentage,
          conveyance_percentage: structure.conveyancePercentage,
          hra_percentage: structure.hraPercentage,
          effective_from: record.effectiveFrom,
          is_active: true,
        });
      } catch (err) {
        console.warn('Could not persist salary structure to Supabase:', err);
      }
    }

    return record;
  }

  async getEmployees(filters?: { department?: string; status?: string; search?: string }): Promise<EmployeeRecord[]> {
    let list = await this.getAllEmployees();

    if (filters?.department && filters.department !== 'All') {
      list = list.filter((e) => e.department.toLowerCase() === filters.department?.toLowerCase());
    }

    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (e) =>
          e.firstName.toLowerCase().includes(q) ||
          e.lastName.toLowerCase().includes(q) ||
          e.employeeId.toLowerCase().includes(q) ||
          e.email.toLowerCase().includes(q)
      );
    }

    return list;
  }

  async createEmployee(data: Partial<EmployeeRecord>): Promise<EmployeeRecord> {
    const id = `e01a1111-0000-0000-0000-${Date.now().toString(16).padStart(12, '0').slice(-12)}`;
    const empId = data.employeeId || `EMP-${(fallbackEmployees.length + 1).toString().padStart(3, '0')}`;
    
    const newEmp: EmployeeRecord = {
      id,
      employeeId: empId,
      firstName: data.firstName || 'New',
      lastName: data.lastName || 'Employee',
      email: data.email || `${empId.toLowerCase()}@businz.com`,
      department: data.department || 'General',
      designation: data.designation || 'Staff',
      basicSalary: data.basicSalary || 15000,
      grossSalary: data.grossSalary || 30000,
      bankName: data.bankName || 'State Bank of India',
      accountNumber: data.accountNumber || '****0000',
      ifscCode: data.ifscCode || 'SBIN000123',
      authUserId: data.authUserId,
      mustChangePassword: data.mustChangePassword !== undefined ? data.mustChangePassword : true,
      accountStatus: data.accountStatus || 'ACTIVE',
      credentialEmailStatus: data.credentialEmailStatus || 'PENDING',
      credentialEmailSentAt: data.credentialEmailSentAt,
      lastLoginAt: data.lastLoginAt,
      status: data.status || 'Active',
      phone: data.phone,
      branch: data.branch,
      joiningDate: data.joiningDate,
      attendanceMethod: data.attendanceMethod || 'Face Scan',
      password: data.password || 'Password@123',
    };

    fallbackEmployees.push(newEmp);
    memoryCache.invalidatePattern('emp_');
    memoryCache.invalidatePattern('ss_');

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        let roleId = (data as any).roleId;
        if (!roleId) {
          const { data: roleData } = await supabase
            .from('roles')
            .select('id')
            .eq('key', 'employee')
            .maybeSingle();
          roleId = roleData?.id || '965e3410-4ab8-4930-9740-89aa34216ac3';
        }

        const insertRes = await supabase.from('employees').insert({
          employee_id: newEmp.employeeId,
          first_name: newEmp.firstName,
          last_name: newEmp.lastName,
          email: newEmp.email,
          basic_salary: newEmp.basicSalary,
          designation: newEmp.designation,
          phone: newEmp.phone,
          branch: newEmp.branch,
          role_id: roleId,
          status: newEmp.status || 'Active',
          attendance_method: newEmp.attendanceMethod || 'Face Scan',
          must_change_password: newEmp.mustChangePassword,
          account_status: newEmp.accountStatus,
          credential_email_status: newEmp.credentialEmailStatus,
          password: newEmp.password || 'Password@123',
        }).select('id').single();

        if (insertRes.data?.id) {
          newEmp.id = insertRes.data.id;
        }
      } catch (err) {
        console.warn('Could not insert employee to Supabase, fallback stored:', err);
      }
    }

    return newEmp;
  }

  async updateEmployee(id: string, updates: Partial<EmployeeRecord>): Promise<EmployeeRecord | null> {
    const emp = await this.getEmployeeById(id);
    if (!emp) return null;

    Object.assign(emp, updates);
    memoryCache.invalidatePattern('emp_');
    memoryCache.invalidatePattern('ss_');

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const payload: any = {
          first_name: emp.firstName,
          last_name: emp.lastName,
          email: emp.email,
          basic_salary: emp.basicSalary,
        };
        if (emp.password) {
          payload.password = emp.password;
        }
        await supabase
          .from('employees')
          .update(payload)
          .eq('employee_id', emp.employeeId);
      } catch (err) {
        console.warn('Could not update employee in Supabase:', err);
      }
    }

    return emp;
  }

  async deleteEmployee(id: string): Promise<boolean> {
    if (!id) return false;
    const cleanId = id.trim();
    let deleted = false;

    const idx = fallbackEmployees.findIndex((e) => e.id === cleanId || e.employeeId === cleanId);
    if (idx >= 0) {
      fallbackEmployees.splice(idx, 1);
      deleted = true;
    }

    memoryCache.invalidatePattern('emp_');
    memoryCache.invalidatePattern('ss_');
    memoryCache.invalidate('employees_all_active');

    if (isRealSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();
        const { error } = await supabase
          .from('employees')
          .delete()
          .or(`id.eq.${cleanId},employee_id.eq.${cleanId}`);
        if (!error) {
          deleted = true;
        } else {
          console.warn('Could not delete employee from Supabase:', error);
        }
      } catch (err) {
        console.warn('Supabase delete exception:', err);
      }
    }

    return deleted;
  }
}

export const employeeRepository = new EmployeeRepository();
