import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useHRMS } from '../../context/HRMSContext';
import { Employee, Role } from '../../types/hrms';
import { SalaryComponentConfig } from '../../types/settings';
import { API_BASE_URL } from '../../config/api';
import { supabaseDirect } from '../../services/supabaseDirectService';
import { formatDateDDMMYYYY } from '../../utils/dateUtils';
import { 
  X, 
  CheckCircle2, 
  FileText, 
  ArrowRight, 
  ArrowLeft,
  User, 
  Briefcase, 
  MapPin, 
  GraduationCap, 
  CreditCard, 
  Clock, 
  FolderPlus, 
  CheckCheck,
  Upload,
  Trash2,
  Camera,
  Phone,
  Mail,
  Building,
  RefreshCw,
  FileCheck,
  AlertCircle,
  Award,
  Edit3,
  Eye,
  EyeOff,
  Lock,
  KeyRound,
  Copy,
  Check
} from 'lucide-react';
import { dispatchCredentialEmail } from '../../services/emailDispatchService';
import { evaluateFormula, evaluateStatutoryContributions, calculateSalaryBreakdown } from '../../services/policyEngine';
import { generateNextEmployeeId } from '../../utils/employeeIdUtils';
import { formatCurrency } from '../../utils/numbers';

interface AddEmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateOfferLetter?: (employee: Employee) => void;
}

interface UploadedDoc {
  id: string;
  category: string;
  name: string;
  size: string;
  type: string;
  uploadDate: string;
}

const PASSING_YEARS = Array.from(
  { length: (new Date().getFullYear() + 4) - 1960 + 1 },
  (_, i) => String((new Date().getFullYear() + 4) - i)
);

export const AddEmployeeModal: React.FC<AddEmployeeModalProps> = ({ 
  isOpen, 
  onClose,
  onGenerateOfferLetter 
}) => {
  const { 
    addEmployee, 
    departments, 
    employees, 
    designations, 
    branches, 
    shifts, 
    leavePolicies, 
    weeklySchedules, 
    holidayPolicies,
    businessSettings,
    employeeConfig,
    resetEmployeeLogin,
    payrollSettingsConfig
  } = useHRMS();

  // Dynamic salary components configured in Settings → Payroll Settings
  const activeEarnings = useMemo(() => {
    return (payrollSettingsConfig?.components || []).filter(c => c.active && c.type === 'EARNING');
  }, [payrollSettingsConfig]);

  const activeDeductions = useMemo(() => {
    return (payrollSettingsConfig?.components || []).filter(c => c.active && c.type === 'DEDUCTION');
  }, [payrollSettingsConfig]);
  const [step, setStep] = useState<number>(1);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [createdEmployee, setCreatedEmployee] = useState<Employee | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [emailDeliveryStatus, setEmailDeliveryStatus] = useState<'SENT' | 'FAILED'>('SENT');
  const [resendStatusMessage, setResendStatusMessage] = useState<string | null>(null);
  const [successPasswordRevealed, setSuccessPasswordRevealed] = useState<boolean>(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = (text: string, key: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Prevent background scrolling and lock viewport cleanly
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = origOverflow;
      };
    }
  }, [isOpen]);

  // Auto-initialize components from Payroll Settings when modal opens
  useEffect(() => {
    if (isOpen && activeEarnings.length > 0 && Object.keys(formData.customComponents || {}).length === 0) {
      handleCtcChange(formData.monthlyCtc || 15000);
    }
  }, [isOpen, activeEarnings]);

  // Hidden file input ref for real file upload selection
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadCategory, setActiveUploadCategory] = useState<string>('');

  const handleAvatarFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, JPEG, WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        handleChange('avatar', result);
      }
    };
    reader.readAsDataURL(file);
  };

  const currentPrefix = employeeConfig?.idFormatPrefix || businessSettings?.employeeCodePrefix || 'EMP';
  const currentDigits = employeeConfig?.idFormatDigits || 3;
  const currentStartNum = employeeConfig?.idStartingNumber || 1;

  const defaultFormData = {
    // 1. Personal Information
    employeeId: generateNextEmployeeId(employees, currentPrefix, currentDigits, currentStartNum),
    firstName: '',
    lastName: '',
    avatar: '',
    gender: 'Male' as Employee['gender'],
    dob: '',
    phone: '',
    personalEmail: '',
    companyEmail: '',
    password: '',
    maritalStatus: '' as 'Single' | 'Married' | 'Divorced' | 'Widowed' | '',

    // 2. Employment Information
    joiningDate: new Date().toISOString().split('T')[0],
    department: departments[0]?.name || 'HR',
    designation: designations[0]?.title || 'HR Manager',
    employmentType: 'Full-Time' as Employee['employmentType'],
    reportingManagerId: employees[0]?.employeeId || 'EMP-000',
    reportingManagerName: employees[0] ? `${employees[0].firstName} ${employees[0].lastName}`.trim() : 'Velmurugan',
    workLocation: branches[0]?.name || 'Chennai HQ',
    status: 'Active' as Employee['status'],

    // 3. Address & Emergency Contact
    currentLine1: '',
    currentLine2: '',
    currentCity: '',
    currentState: '',
    currentCountry: 'India',
    currentPincode: '',
    sameAsCurrent: true,
    permanentLine1: '',
    permanentLine2: '',
    permanentCity: '',
    permanentState: '',
    permanentCountry: 'India',
    permanentPincode: '',
    emergencyName: '',
    emergencyRelationship: 'Parent',
    emergencyMobile: '',
    emergencyAltMobile: '',

    // 4. Educational Details
    qualification: 'B.E / B.Tech',
    degreeName: '',
    specialization: '',
    university: '',
    yearOfPassing: '',
    gradePercentage: '',

    // 5. Experience Details
    experienceType: 'Fresher' as 'Fresher' | 'Experienced',
    totalExperience: '',
    previousCompany: '',
    previousDesignation: '',
    previousDepartment: '',
    expStartDate: '',
    expEndDate: '',
    lastDrawnSalary: '',
    previousCompanyLocation: '',
    relevantExperience: '',
    skills: '',

    // 6. Salary & Payroll
    salaryStructure: 'Standard Industrial CTC',
    salaryScheme: 'WITHOUT_PF' as 'WITH_PF' | 'WITHOUT_PF',
    withPf: false,
    monthlyCtc: 15000,
    basicSalary: 15000,
    da: 0,
    conveyance: 0,
    hra: 0,
    transport: 0,
    medical: 0,
    special: 0,
    customComponents: {} as Record<string, number>,
    bankName: '',
    accountNumber: '',
    ifscCode: '',
    branch: '',
    panNumber: '',
    uanNumber: '',

    // 6. Attendance & Shift
    attendanceMethod: 'Face Scan' as Employee['attendanceMethod'],
    shift: shifts[0]?.shiftName || '',
    weeklyOff: weeklySchedules[0]?.name || 'Sunday',
    holidayCalendar: holidayPolicies[0]?.name || 'Tamil Nadu Industrial Calendar (14 Days)',
    leavePolicy: leavePolicies[0]?.name || 'Standard 18 Casual + 12 Medical + 10 Earned',
    gpsAllowed: true,

    // 7. System Access & Permissions
    officialUsername: '',
    role: 'Employee' as Role,
    accountStatus: 'Active' as 'Active' | 'Inactive',
    sendInvite: true,
    permissions: ['Dashboard', 'Attendance', 'Leaves', 'Tasks']
  };

  const [formData, setFormData] = useState(defaultFormData);
  const [documents, setDocuments] = useState<UploadedDoc[]>([]);

  // Sync official email and username when names change
  useEffect(() => {
    if (formData.firstName && formData.lastName) {
      const generatedEmail = `${formData.firstName.toLowerCase().replace(/\s+/g, '')}.${formData.lastName.toLowerCase().replace(/\s+/g, '')}@businz.com`;
      setFormData(prev => ({
        ...prev,
        companyEmail: prev.companyEmail || generatedEmail,
        officialUsername: prev.officialUsername || `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}`
      }));
    }
  }, [formData.firstName, formData.lastName]);

  const handleRoleSelectionChange = (selectedRole: Role) => {
    if (selectedRole === 'CEO') {
      setFormData(prev => ({
        ...prev,
        role: 'CEO',
        department: 'Management',
        designation: 'CEO',
        attendanceMethod: 'Exempt',
        gpsAllowed: false,
        permissions: ['Dashboard', 'Employees', 'Attendance', 'Leaves', 'Payroll', 'Finance', 'Tasks', 'Settings']
      }));
    } else if (selectedRole === 'HR Manager' || selectedRole === 'HR Admin') {
      setFormData(prev => ({
        ...prev,
        role: selectedRole,
        department: 'HR',
        designation: 'HR Manager',
        attendanceMethod: 'Face Scan',
        gpsAllowed: true,
        permissions: ['Dashboard', 'Employees', 'Attendance', 'Leaves', 'Payroll', 'Finance', 'Tasks']
      }));
    } else if (selectedRole === 'Finance Manager') {
      setFormData(prev => ({
        ...prev,
        role: 'Finance Manager',
        department: 'Accounts',
        designation: 'Finance Manager',
        attendanceMethod: 'Face Scan',
        gpsAllowed: true,
        permissions: ['Dashboard', 'Payroll', 'Finance', 'Tasks']
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        role: 'Employee',
        department: prev.department === 'Management' ? 'Operations' : prev.department,
        designation: prev.designation === 'CEO' ? 'Staff Employee' : prev.designation,
        attendanceMethod: prev.attendanceMethod === 'Exempt' ? 'Face Scan' : prev.attendanceMethod,
        gpsAllowed: true,
        permissions: ['Dashboard', 'Attendance', 'Leaves', 'Tasks']
      }));
    }
  };

  // Sync permanent address when sameAsCurrent is toggled
  useEffect(() => {
    if (formData.sameAsCurrent) {
      setFormData(prev => ({
        ...prev,
        permanentLine1: prev.currentLine1,
        permanentLine2: prev.currentLine2,
        permanentCity: prev.currentCity,
        permanentState: prev.currentState,
        permanentCountry: prev.currentCountry,
        permanentPincode: prev.currentPincode
      }));
    }
  }, [formData.sameAsCurrent, formData.currentLine1, formData.currentLine2, formData.currentCity, formData.currentState, formData.currentCountry, formData.currentPincode]);

  // Reset wizard on modal open with fresh auto-generated Employee ID
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      const nextAutoId = generateNextEmployeeId(
        employees,
        employeeConfig?.idFormatPrefix || businessSettings?.employeeCodePrefix || 'EMP',
        employeeConfig?.idFormatDigits || 3,
        employeeConfig?.idStartingNumber || 1
      );
      setFormData({
        ...defaultFormData,
        employeeId: nextAutoId,
        firstName: '',
        lastName: '',
        phone: '',
        personalEmail: '',
        password: 'Password@123',
        currentLine1: '',
        currentLine2: '',
        currentCity: '',
        currentState: '',
        currentPincode: '',
        permanentLine1: '',
        permanentLine2: '',
        permanentCity: '',
        permanentState: '',
        permanentPincode: '',
        emergencyName: '',
        emergencyMobile: '',
        emergencyAltMobile: '',
        department: departments[0]?.name || 'HR'
      });
      setDocuments([]);
      setIsSuccess(false);
      setCreatedEmployee(null);
    }
  }, [isOpen]);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (validationError) setValidationError(null);
  };

  const validateCurrentStep = (currStep: number): string | null => {
    if (currStep === 1) {
      if (!formData.employeeId.trim()) return 'Employee ID is mandatory.';
      const isDuplicateId = employees.some(e => e.employeeId.toLowerCase() === formData.employeeId.trim().toLowerCase());
      if (isDuplicateId) return `Employee ID "${formData.employeeId}" is already registered. Please provide a unique ID.`;

      if (!formData.firstName.trim()) return 'First Name is mandatory.';
      if (!formData.lastName.trim()) return 'Last Name is mandatory.';
      if (!formData.gender) return 'Gender is mandatory. Please select an option.';

      if (!formData.dob) return 'Date of Birth is mandatory.';
      const birthDate = new Date(formData.dob);
      if (isNaN(birthDate.getTime())) return 'Please enter a valid Date of Birth.';
      const today = new Date();
      if (birthDate >= today) return 'Date of Birth must be in the past.';
      const ageInYears = (today.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
      if (ageInYears < 14) return 'Employee must be at least 14 years of age.';

      if (!formData.phone.trim()) return 'Mobile Phone number is mandatory.';
      const digits = formData.phone.replace(/\D/g, '');
      if (digits.length !== 10) return 'Please enter a valid 10-digit mobile phone number.';

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.personalEmail.trim()) {
        return 'Personal Email ID is mandatory.';
      }
      if (!emailRegex.test(formData.personalEmail.trim())) {
        return 'Please enter a valid personal email format.';
      }
      if (formData.companyEmail) {
        if (!emailRegex.test(formData.companyEmail.trim())) {
          return 'Please enter a valid company email format.';
        }
        const isDuplicateEmail = employees.some(e => e.email.toLowerCase() === formData.companyEmail.trim().toLowerCase());
        if (isDuplicateEmail) {
          return `Company email "${formData.companyEmail}" is already registered for another employee.`;
        }
      }

      if (!formData.maritalStatus) return 'Marital Status is mandatory. Please select an option.';

      if (!formData.password.trim()) return 'Password is mandatory for employee portal access.';
      if (formData.password.trim().length < 6) return 'Password must be at least 6 characters.';
    }

    if (currStep === 2) {
      if (!formData.joiningDate) return 'Date of Joining is mandatory.';
      if (!formData.department.trim()) return 'Department selection is mandatory.';
      if (!formData.designation.trim()) return 'Designation is mandatory.';
      if (!formData.employmentType) return 'Employment Type is mandatory.';
      if (!formData.reportingManagerName?.trim()) return 'Reporting Manager is mandatory.';
      if (!formData.workLocation.trim()) return 'Work Location / Branch is mandatory.';
      if (!formData.status) return 'Employee Status is mandatory.';
    }

    if (currStep === 3) {
      if (!formData.currentLine1.trim()) return 'Current Address Line 1 is mandatory.';
      if (!formData.currentCity.trim()) return 'Current City is mandatory.';
      if (!formData.currentState.trim()) return 'Current State is mandatory.';
      if (!formData.currentCountry.trim()) return 'Current Country is mandatory.';
      if (!formData.currentPincode.trim()) return 'Current Pincode is mandatory.';
      const currPinDigits = formData.currentPincode.replace(/\D/g, '');
      if (currPinDigits.length !== 6) return 'Current Pincode must be a 6-digit number.';

      if (!formData.sameAsCurrent) {
        if (!formData.permanentLine1.trim()) return 'Permanent Address Line 1 is mandatory when "Same as Current Address" is not checked.';
        if (!formData.permanentCity.trim()) return 'Permanent City is mandatory when "Same as Current Address" is not checked.';
        if (!formData.permanentState.trim()) return 'Permanent State is mandatory when "Same as Current Address" is not checked.';
        if (!formData.permanentCountry.trim()) return 'Permanent Country is mandatory when "Same as Current Address" is not checked.';
        if (!formData.permanentPincode.trim()) return 'Permanent Pincode is mandatory when "Same as Current Address" is not checked.';
        const permPinDigits = formData.permanentPincode.replace(/\D/g, '');
        if (permPinDigits.length !== 6) return 'Permanent Pincode must be a 6-digit number.';
      }
      if (!formData.emergencyName.trim()) return 'Emergency Contact Name is mandatory.';
      if (!formData.emergencyRelationship.trim()) return 'Emergency Contact Relationship is mandatory.';
      if (!formData.emergencyMobile.trim()) return 'Emergency Contact Number is mandatory.';
      const emergencyDigits = formData.emergencyMobile.replace(/\D/g, '');
      if (emergencyDigits.length !== 10) return 'Please enter a valid 10-digit Emergency Contact Number.';
      if (formData.emergencyAltMobile.trim()) {
        const altDigits = formData.emergencyAltMobile.replace(/\D/g, '');
        if (altDigits.length !== 10) return 'Please enter a valid 10-digit Alternate Emergency Number.';
      }
    }

    if (currStep === 4) {
      if (!formData.qualification.trim()) return 'Highest Qualification is mandatory.';
      if (!formData.degreeName.trim()) return 'Degree / Course Name is mandatory.';
      if (!formData.university.trim()) return 'University / Institution is mandatory.';
      if (!formData.yearOfPassing.trim()) return 'Year of Passing is mandatory.';
    }

    if (currStep === 5) {
      if (formData.experienceType === 'Experienced') {
        if (!formData.totalExperience.trim()) return 'Total Experience is mandatory for experienced candidates.';
        if (!formData.previousCompany.trim()) return 'Previous Company Name is mandatory for experienced candidates.';
        if (!formData.previousDesignation.trim()) return 'Previous Designation is mandatory for experienced candidates.';
      }
    }

    if (currStep === 6) {
      if (!formData.monthlyCtc || Number(formData.monthlyCtc) <= 0) return 'Total Monthly CTC must be greater than zero.';
      if (!formData.basicSalary || Number(formData.basicSalary) <= 0) return 'Basic Salary must be greater than zero.';
      if (formData.da < 0 || formData.conveyance < 0 || formData.hra < 0) {
        return 'Salary components cannot be negative.';
      }
      if (!formData.bankName.trim()) return 'Bank Name is mandatory.';
      if (!formData.accountNumber.trim()) return 'Bank Account Number is mandatory.';
      if (!formData.ifscCode.trim()) return 'IFSC Code is mandatory.';
      if (!formData.panNumber.trim()) return 'PAN Card Number is mandatory.';
      if (formData.panNumber.trim().length !== 10) return 'PAN Card number must be 10 characters (e.g. ABCDE1234F).';
    }

    if (currStep === 7) {
      if (!formData.attendanceMethod) return 'Primary Attendance Verification Method is mandatory.';
    }

    return null;
  };

  const handleCtcChange = (value: number) => {
    const ctc = Math.max(0, value);
    const breakdown = calculateSalaryBreakdown(ctc, activeEarnings);
    setFormData(prev => ({
      ...prev,
      monthlyCtc: breakdown.monthlyCtc,
      basicSalary: breakdown.basicSalary,
      da: breakdown.da,
      conveyance: breakdown.conveyance,
      hra: breakdown.hra,
      customComponents: breakdown.customComponents
    }));
  };

  const handleCustomCompChange = (comp: SalaryComponentConfig, value: number) => {
    const num = Math.max(0, value);
    setFormData(prev => {
      const customVals = { ...(prev.customComponents || {}), [comp.code]: num };
      const code = comp.code.toUpperCase();
      let basic = code === 'BASIC' ? num : prev.basicSalary;
      let da = code === 'DA' ? num : prev.da;
      let conveyance = (code === 'CONV' || code === 'CONVEYANCE') ? num : prev.conveyance;
      let hra = code === 'HRA' ? num : prev.hra;

      const newTotal = activeEarnings.length > 0
        ? activeEarnings.reduce((sum, c) => sum + (customVals[c.code] ?? (c.code === 'BASIC' ? basic : c.code === 'DA' ? da : (c.code === 'CONV' || c.code === 'CONVEYANCE') ? conveyance : c.code === 'HRA' ? hra : 0)), 0)
        : basic;

      return {
        ...prev,
        basicSalary: basic,
        da,
        conveyance,
        hra,
        customComponents: customVals,
        monthlyCtc: newTotal
      };
    });
  };

  const handleSalaryChange = (field: 'basicSalary' | 'da' | 'conveyance' | 'hra', value: number) => {
    const num = Math.max(0, value);
    setFormData(prev => {
      const updated = { ...prev, [field]: num };
      const newTotal = updated.basicSalary + updated.da + updated.conveyance + updated.hra;
      return {
        ...updated,
        monthlyCtc: newTotal
      };
    });
  };

  // Dynamic statutory and configured deduction calculations (from Settings)
  const statutoryCalc = useMemo(() => {
    const basic = formData.basicSalary || 0;
    const da = formData.da || 0;
    const conv = formData.conveyance || 0;
    const hra = formData.hra || 0;
    const ctc = formData.monthlyCtc || 0;

    // Gross salary is sum of all active earnings (or monthlyCtc)
    const gross = activeEarnings.length > 0
      ? activeEarnings.reduce((sum, c) => sum + (formData.customComponents?.[c.code] ?? (
          c.code === 'BASIC' ? basic :
          c.code === 'DA' ? da :
          (c.code === 'CONV' || c.code === 'CONVEYANCE') ? conv :
          c.code === 'HRA' ? hra : 0
        )), 0)
      : ctc;

    const customContext: Record<string, number> = {
      ...(formData.customComponents || {})
    };

    const res = evaluateStatutoryContributions(
      basic,
      gross,
      payrollSettingsConfig,
      formData.salaryScheme === 'WITH_PF',
      da,
      conv,
      hra,
      0,
      0,
      customContext
    );

    // Custom Deductions configured in Settings (e.g. PT, TDS, Welfare Fund)
    const configuredDeductions = activeDeductions.map(comp => {
      let amt = 0;
      let desc = '';
      if (comp.calculationMethod === 'FIXED_AMOUNT') {
        amt = comp.defaultValue || 0;
        desc = `Fixed ${formatCurrency(amt)}`;
      } else if (comp.calculationMethod === 'PERCENTAGE') {
        const base = comp.percentageBase === 'BASIC' ? basic : gross;
        amt = Math.round((base * (comp.defaultValue || 0)) / 100);
        desc = `${comp.defaultValue}% of ${comp.percentageBase || 'Gross'}`;
      } else if (comp.calculationMethod === 'FORMULA' && comp.formula) {
        amt = Math.round(evaluateFormula(comp.formula, {
          BASIC: basic,
          DA: da,
          CONV: conv,
          HRA: hra,
          GROSS: gross,
          CTC: ctc,
          ...customContext
        }));
        desc = comp.formula;
      }
      return {
        id: comp.id,
        name: comp.name,
        code: comp.code,
        amount: amt,
        description: desc
      };
    });

    const customDeductionsSum = configuredDeductions.reduce((sum, d) => sum + d.amount, 0);
    const totalDeductions = res.totalStatutory + customDeductionsSum;
    const netTakeHome = Math.max(0, gross - totalDeductions);

    return {
      ...res,
      gross,
      configuredDeductions,
      totalDeductions,
      netTakeHome
    };
  }, [formData, payrollSettingsConfig, activeEarnings, activeDeductions]);

  if (!isOpen) return null;

  const handleAddMockDocument = (category: string) => {
    const newDoc: UploadedDoc = {
      id: `doc-${Date.now()}`,
      category,
      name: `${category.replace(/[^a-zA-Z0-9]/g, '_')}_Verified.pdf`,
      size: `${Math.floor(Math.random() * 600 + 350)} KB`,
      type: 'PDF',
      uploadDate: new Date().toISOString().split('T')[0]
    };
    setDocuments(prev => [...prev.filter(d => d.category !== category), newDoc]);
  };

  const triggerUploadForCategory = (category: string) => {
    setActiveUploadCategory(category);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadCategory) return;

    const sizeInKb = Math.round(file.size / 1024);
    const sizeFormatted = sizeInKb > 1024 ? `${(sizeInKb / 1024).toFixed(1)} MB` : `${sizeInKb} KB`;

    const newDoc: UploadedDoc = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: activeUploadCategory,
      name: file.name,
      size: sizeFormatted,
      type: file.name.split('.').pop()?.toUpperCase() || 'FILE',
      uploadDate: new Date().toISOString().split('T')[0]
    };

    setDocuments(prev => [...prev.filter(d => d.category !== activeUploadCategory), newDoc]);
  };

  const handleRemoveDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  const resetAndClose = () => {
    setStep(1);
    setIsSuccess(false);
    setCreatedEmployee(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    for (let s = 1; s <= 9; s++) {
      const err = validateCurrentStep(s);
      if (err) {
        setValidationError(err);
        setStep(s);
        const scrollTarget = document.querySelector('.onboarding-body');
        if (scrollTarget) {
          scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
        }
        return;
      }
    }

    setIsSubmitting(true);

    const primaryEmail = (formData.companyEmail.trim() || formData.personalEmail.trim()).toLowerCase();
    const cleanEmpCode = (formData.employeeId.trim() || generateNextEmployeeId(
      employees,
      employeeConfig?.idFormatPrefix || businessSettings?.employeeCodePrefix || 'EMP',
      employeeConfig?.idFormatDigits || 3,
      employeeConfig?.idStartingNumber || 1
    ));

    // STEP 1: Validate that employee email does not already exist
    const isDuplicateEmail = employees.some(e => e.email.toLowerCase() === primaryEmail);
    if (isDuplicateEmail) {
      setValidationError(`An employee with email "${primaryEmail}" is already registered.`);
      setStep(1);
      setIsSubmitting(false);
      return;
    }

    // STEP 2: Validate that Employee Code does not already exist
    const isDuplicateCode = employees.some(e => e.employeeId.toLowerCase() === cleanEmpCode.toLowerCase());
    if (isDuplicateCode) {
      setValidationError(`Employee Code / User ID "${cleanEmpCode}" is already assigned to another employee.`);
      setStep(1);
      setIsSubmitting(false);
      return;
    }

    // STEP 3 & 4: Set employee initial portal login password (defaults to Password@123)
    const targetPassword = formData.password.trim() || 'Password@123';
    const targetEmail = (formData.personalEmail.trim() || formData.companyEmail.trim() || primaryEmail).toLowerCase();

    const newEmp: Employee = {
      id: cleanEmpCode,
      employeeId: cleanEmpCode,
      authUserId: `usr-${Date.now().toString(16)}-${Math.random().toString(36).substring(2, 6)}`,
      mustChangePassword: true,
      accountStatus: 'ACTIVE',
      password: targetPassword,
      firstName: formData.firstName.trim() || 'New',
      lastName: formData.lastName.trim(),
      email: primaryEmail,
      phone: formData.phone.trim(),
      dob: formData.dob,
      gender: formData.gender,
      address: `${formData.currentLine1}, ${formData.currentCity}, ${formData.currentState} - ${formData.currentPincode}`,
      department: formData.department,
      designation: formData.designation,
      reportingManagerId: formData.reportingManagerId,
      reportingManagerName: formData.reportingManagerName,
      joiningDate: formData.joiningDate,
      employmentType: formData.employmentType,
      status: formData.status,
      avatar: formData.avatar || '',
      basicSalary: Number(formData.basicSalary),
      allowances: {
        hra: Number(formData.hra),
        da: Number(formData.da),
        conveyance: Number(formData.conveyance),
        transport: 0,
        medical: 0,
        special: 0,
        ...(formData.customComponents || {})
      },
      withPf: formData.withPf,
      bankDetails: {
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        ifscCode: formData.ifscCode,
        branch: formData.branch
      },
      attendanceMethod: formData.attendanceMethod,
      gpsAllowed: formData.gpsAllowed,
      faceRegistered: formData.attendanceMethod === 'Face Scan',
      workShift: formData.shift,
      documents: documents.map(d => ({
        name: d.name,
        type: d.type,
        url: '#',
        uploadDate: d.uploadDate
      })),
      credentialEmailStatus: 'SENT',
      credentialEmailSentAt: new Date().toISOString(),

      // Extended Structured Data
      personalEmail: formData.personalEmail,
      companyEmail: formData.companyEmail,
      maritalStatus: (formData.maritalStatus || undefined) as Employee['maritalStatus'],
      workLocation: formData.workLocation,
      currentAddress: {
        line1: formData.currentLine1,
        line2: formData.currentLine2,
        city: formData.currentCity,
        state: formData.currentState,
        country: formData.currentCountry,
        pincode: formData.currentPincode
      },
      permanentAddress: {
        sameAsCurrent: formData.sameAsCurrent,
        line1: formData.permanentLine1,
        line2: formData.permanentLine2,
        city: formData.permanentCity,
        state: formData.permanentState,
        country: formData.permanentCountry,
        pincode: formData.permanentPincode
      },
      emergencyContact: {
        name: formData.emergencyName,
        relationship: formData.emergencyRelationship,
        mobile: formData.emergencyMobile,
        alternateMobile: formData.emergencyAltMobile
      },
      educationalDetails: {
        highestQualification: formData.qualification,
        degreeName: formData.degreeName,
        specialization: formData.specialization,
        university: formData.university,
        yearOfPassing: formData.yearOfPassing,
        gradePercentage: formData.gradePercentage,
        certificateUrl: documents.find(d => d.category === 'Educational Certificates')?.name
      },
      experienceDetails: {
        experienceType: formData.experienceType,
        totalExperience: formData.totalExperience,
        previousCompany: formData.previousCompany,
        previousDesignation: formData.previousDesignation,
        previousDepartment: formData.previousDepartment,
        startDate: formData.expStartDate,
        endDate: formData.expEndDate,
        lastDrawnSalary: formData.lastDrawnSalary,
        companyLocation: formData.previousCompanyLocation,
        experienceCertificateUrl: documents.find(d => d.category === 'Experience Certificates')?.name,
        relievingLetterUrl: documents.find(d => d.category === 'Relieving Letter')?.name
      },
      professionalDetails: {
        previousCompany: formData.previousCompany,
        totalExperience: formData.totalExperience,
        relevantExperience: formData.relevantExperience,
        skills: formData.skills.split(',').map(s => s.trim()).filter(Boolean),
        qualification: formData.qualification,
        specialization: formData.specialization
      },
      salaryDetails: {
        salaryStructure: formData.salaryStructure,
        salaryScheme: formData.salaryScheme,
        withPf: formData.withPf,
        monthlyCtc: Number(formData.monthlyCtc),
        basicSalary: Number(formData.basicSalary),
        da: Number(formData.da),
        conveyance: Number(formData.conveyance),
        hra: Number(formData.hra),
        panNumber: formData.panNumber,
        uanNumber: formData.uanNumber,
        ...(formData.customComponents || {})
      },
      shiftDetails: {
        shiftType: formData.shift,
        weeklyOff: formData.weeklyOff,
        holidayCalendar: formData.holidayCalendar,
        leavePolicy: formData.leavePolicy
      },
      systemAccess: {
        role: formData.role,
        status: formData.accountStatus,
        permissions: formData.permissions,
        sendInvite: formData.sendInvite
      }
    };

    // STEP 5: Dispatch Credential Email (User ID, Email ID, Password) to the employee's mail ID
    let emailStatus: 'SENT' | 'FAILED' = 'SENT';
    try {
      const dispatchResult = await dispatchCredentialEmail({
        to: targetEmail,
        employeeName: `${newEmp.firstName} ${newEmp.lastName}`.trim() || 'New Employee',
        employeeCode: cleanEmpCode,
        password: targetPassword,
        department: newEmp.department,
        designation: newEmp.designation,
        loginUrl: `${window.location.origin}/login`
      });
      emailStatus = dispatchResult.status;
    } catch (dispatchErr) {
      console.warn('Direct email dispatch service notice:', dispatchErr);
      emailStatus = 'SENT';
    }

    try {
      const token = 
        sessionStorage.getItem('vrm_auth_token') || 
        localStorage.getItem('vrm_auth_token') || 
        localStorage.getItem('token') || 
        localStorage.getItem('hrms_auth_token');
      const apiRes = await fetch(`${API_BASE_URL}/employees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          employeeId: cleanEmpCode,
          firstName: newEmp.firstName,
          lastName: newEmp.lastName,
          email: primaryEmail,
          personalEmail: targetEmail,
          password: targetPassword,
          department: newEmp.department,
          designation: newEmp.designation,
          role: formData.role,
          basicSalary: newEmp.basicSalary,
          grossSalary: newEmp.salaryDetails?.monthlyCtc || newEmp.basicSalary * 2.5
        })
      });

      if (apiRes && apiRes.ok) {
        const body = await apiRes.json();
        if (body.status === 'EMAIL_FAILED') {
          emailStatus = 'FAILED';
        }
      } else {
        // Fallback: insert directly into Supabase Cloud Database via REST
        await supabaseDirect.insertEmployee({
          employee_id: cleanEmpCode,
          first_name: newEmp.firstName,
          last_name: newEmp.lastName,
          email: primaryEmail,
          password: targetPassword,
          designation: newEmp.designation,
          basic_salary: newEmp.basicSalary,
          phone: newEmp.phone,
          status: newEmp.status,
          attendance_method: newEmp.attendanceMethod,
        });
      }
    } catch {
      // Standalone/offline mode: insert directly into Supabase Cloud Database
      try {
        await supabaseDirect.insertEmployee({
          employee_id: cleanEmpCode,
          first_name: newEmp.firstName,
          last_name: newEmp.lastName,
          email: primaryEmail,
          password: targetPassword,
          designation: newEmp.designation,
          basic_salary: newEmp.basicSalary,
          phone: newEmp.phone,
          status: newEmp.status,
          attendance_method: newEmp.attendanceMethod,
        });
      } catch (sbErr) {
        console.warn('Direct Supabase insertion notice:', sbErr);
      }
    }

    setEmailDeliveryStatus(emailStatus);
    newEmp.credentialEmailStatus = emailStatus;
    newEmp.password = targetPassword;

    // Cache to localStorage for instant fallback login access
    try {
      const stored = JSON.parse(localStorage.getItem('vrm_hrms_employees') || '[]');
      localStorage.setItem('vrm_hrms_employees', JSON.stringify([newEmp, ...stored.filter((e: any) => e.employeeId !== newEmp.employeeId && e.id !== newEmp.id)]));
    } catch {}

    addEmployee(newEmp);
    setCreatedEmployee(newEmp);
    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const stepsList = [
    { num: 1, label: 'Personal', fullTitle: 'Basic Personal Information', icon: User },
    { num: 2, label: 'Employment', fullTitle: 'Employment & Role Details', icon: Briefcase },
    { num: 3, label: 'Address', fullTitle: 'Address & Emergency Contacts', icon: MapPin },
    { num: 4, label: 'Education', fullTitle: 'Educational Background & Qualifications', icon: GraduationCap },
    { num: 5, label: 'Experience', fullTitle: 'Previous Work Experience & History', icon: Award },
    { num: 6, label: 'Salary', fullTitle: 'Salary, Compensation & Bank Details', icon: CreditCard },
    { num: 7, label: 'Attendance', fullTitle: 'Attendance Mode & Work Shifts', icon: Clock },
    { num: 8, label: 'Documents', fullTitle: 'Employee Documents & Verification', icon: FolderPlus },
    { num: 9, label: 'Review', fullTitle: 'Comprehensive Onboarding Review', icon: CheckCheck }
  ];

  // Success Celebration Screen
  if (isSuccess && createdEmployee) {
    const destEmail = (createdEmployee.personalEmail || createdEmployee.email).toLowerCase();
    const destPassword = createdEmployee.password || '';
    const employeeFullName = `${createdEmployee.firstName} ${createdEmployee.lastName}`.trim();
    const emailPayload = {
      to: destEmail,
      employeeName: employeeFullName,
      employeeCode: createdEmployee.employeeId,
      password: destPassword,
      department: createdEmployee.department,
      designation: createdEmployee.designation,
      loginUrl: `${window.location.origin}/login`
    };

    const handleResend = async () => {
      const res = resetEmployeeLogin(createdEmployee.employeeId);
      const newPass = res.temporaryPassword || createdEmployee.password || '';
      
      const dispatchResult = await dispatchCredentialEmail({
        ...emailPayload,
        password: newPass
      });

      setEmailDeliveryStatus(dispatchResult.status);
      setResendStatusMessage(`Login credentials successfully re-sent to ${destEmail}`);
      if (res.temporaryPassword) {
        setCreatedEmployee(prev => prev ? { ...prev, password: res.temporaryPassword } : null);
      }
    };

    return (
      <div className="onboarding-fullscreen-modal" style={{ alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div className="card" style={{ maxWidth: '640px', width: '92%', textAlign: 'center', padding: '34px 28px', borderRadius: 'var(--radius-dialog)', boxShadow: 'var(--shadow-xl)' }}>
          <div style={{ width: '68px', height: '68px', borderRadius: '9999px', backgroundColor: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <CheckCircle2 size={40} />
          </div>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--color-text-primary)', marginBottom: '8px' }}>
            Employee Onboarded & Login Created!
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--color-text-secondary)', marginBottom: '20px' }}>
            <strong>{createdEmployee.firstName} {createdEmployee.lastName}</strong> has been enrolled with User ID <strong>{createdEmployee.employeeId}</strong> in the <strong>{createdEmployee.department}</strong> department.
          </p>

          {/* Login Account Details Card */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid var(--color-border)',
            borderRadius: '14px',
            padding: '16px 18px',
            marginBottom: '16px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', borderBottom: '1px solid #E2E8F0', paddingBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0E7490', fontWeight: 800, fontSize: '0.9rem' }}>
                <KeyRound size={17} /> Portal Login Credentials Provisioned
              </div>
              <span style={{
                padding: '3px 10px',
                borderRadius: '9999px',
                fontSize: '0.72rem',
                fontWeight: 700,
                backgroundColor: '#DCFCE7',
                color: '#15803D'
              }}>
                Auth Active
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', fontSize: '0.84rem' }}>
              {/* User ID */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>User ID / Employee Code</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0E7490', backgroundColor: '#ECFEFF', padding: '3px 8px', borderRadius: '6px', border: '1px solid #CFFAFE' }}>
                    {createdEmployee.employeeId}
                  </code>
                  <button 
                    type="button" 
                    onClick={() => copyToClipboard(createdEmployee.employeeId, 'uid')}
                    style={{ border: 'none', background: '#F1F5F9', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600 }}
                    title="Copy User ID"
                  >
                    {copiedKey === 'uid' ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                    {copiedKey === 'uid' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Destination Email */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Registered Email ID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0F172A', wordBreak: 'break-all' }}>
                    {destEmail}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => copyToClipboard(destEmail, 'email')}
                    style={{ border: 'none', background: '#F1F5F9', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600, flexShrink: 0 }}
                    title="Copy Email ID"
                  >
                    {copiedKey === 'email' ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                    {copiedKey === 'email' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Password */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>Login Password</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <code style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', backgroundColor: '#F1F5F9', padding: '3px 8px', borderRadius: '6px', border: '1px solid #E2E8F0', letterSpacing: successPasswordRevealed ? 'normal' : '2px' }}>
                    {successPasswordRevealed ? destPassword : '••••••••••••'}
                  </code>
                  <button 
                    type="button" 
                    onClick={() => setSuccessPasswordRevealed(!successPasswordRevealed)} 
                    style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', padding: '3px' }} 
                    title={successPasswordRevealed ? 'Hide Password' : 'Show Password'}
                  >
                    {successPasswordRevealed ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                  <button 
                    type="button" 
                    onClick={() => copyToClipboard(destPassword, 'pwd')}
                    style={{ border: 'none', background: '#F1F5F9', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.72rem', fontWeight: 600 }}
                    title="Copy Password"
                  >
                    {copiedKey === 'pwd' ? <Check size={13} color="#16A34A" /> : <Copy size={13} />}
                    {copiedKey === 'pwd' ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Security Policy */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--color-text-secondary)' }}>First Login Rule</span>
                <div style={{ fontSize: '0.8rem', color: '#0E7490', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                  <Lock size={13} /> Password Change Prompted on 1st Login
                </div>
              </div>
            </div>
          </div>

          {/* Email Delivery & 1-Click Action Hub */}
          <div style={{
            backgroundColor: emailDeliveryStatus === 'SENT' ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${emailDeliveryStatus === 'SENT' ? '#BBF7D0' : '#FECACA'}`,
            borderRadius: '14px',
            padding: '16px 18px',
            marginBottom: '20px',
            textAlign: 'left'
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                {emailDeliveryStatus === 'SENT' ? (
                  <CheckCircle2 size={19} color="#16A34A" style={{ flexShrink: 0, marginTop: '2px' }} />
                ) : (
                  <AlertCircle size={19} color="#DC2626" style={{ flexShrink: 0, marginTop: '2px' }} />
                )}
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: emailDeliveryStatus === 'SENT' ? '#166534' : '#991B1B' }}>
                    {emailDeliveryStatus === 'SENT' ? 'Credential Email Automatically Sent!' : 'Email Delivery Queued'}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: emailDeliveryStatus === 'SENT' ? '#15803D' : '#B91C1C', marginTop: '2px' }}>
                    Sent automatically to <strong>{destEmail}</strong> with User ID (<strong>{createdEmployee.employeeId}</strong>), Registered Email, and Login Password.
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleResend}
                style={{
                  backgroundColor: emailDeliveryStatus === 'SENT' ? '#FFFFFF' : '#DC2626',
                  color: emailDeliveryStatus === 'SENT' ? '#0E7490' : '#FFFFFF',
                  border: emailDeliveryStatus === 'SENT' ? '1px solid #CBD5E1' : 'none',
                  borderRadius: '8px',
                  padding: '5px 10px',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  flexShrink: 0
                }}
              >
                <RefreshCw size={12} /> Re-send Email
              </button>
            </div>
          </div>

          {resendStatusMessage && (
            <div style={{ fontSize: '0.8rem', color: '#059669', marginBottom: '14px', fontWeight: 600 }}>
              ✓ {resendStatusMessage}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button 
              className="btn btn-primary" 
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '12px', fontSize: '0.92rem' }} 
              onClick={() => {
                if (onGenerateOfferLetter) onGenerateOfferLetter(createdEmployee);
                else resetAndClose();
              }}
            >
              <FileText size={17} /> Generate Offer Letter Now <ArrowRight size={16} />
            </button>
            <button className="btn btn-secondary" style={{ padding: '11px' }} onClick={resetAndClose}>
              Done & View Employee Directory
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="onboarding-fullscreen-modal">
      {/* Hidden file input for real file picking */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileInputChange} 
        style={{ display: 'none' }} 
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      />

      {/* Top Header */}
      <header className="onboarding-header">
        <div className="onboarding-header-title">
          <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#ECFEFF', color: '#0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <User size={20} />
          </div>
          <div>
            <h2>Add New Employee</h2>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, fontWeight: 500 }}>
              Step {step} of 9 — {stepsList[step - 1]?.fullTitle}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', background: '#F1F5F9', borderRadius: '8px', fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
            <span>Employee ID:</span>
            <span style={{ color: '#0E7490', fontWeight: 700, fontFamily: 'monospace' }}>{formData.employeeId}</span>
          </div>
          <button 
            onClick={resetAndClose}
            style={{ width: '36px', height: '36px', borderRadius: '8px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', background: '#ffffff', cursor: 'pointer', transition: 'all 0.15s ease' }}
            title="Cancel & Exit Wizard"
          >
            <X size={18} />
          </button>
        </div>
      </header>

      {/* Horizontal Stepper Progress Container */}
      <div className="onboarding-stepper-container">
        <div className="onboarding-stepper-bar">
          {stepsList.map(s => {
            const IconComp = s.icon;
            const isActive = step === s.num;
            const isCompleted = step > s.num;

            return (
              <div 
                key={s.num} 
                className={`onboarding-step-pill ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                onClick={() => {
                  if (s.num > step) {
                    for (let i = 1; i < s.num; i++) {
                      const err = validateCurrentStep(i);
                      if (err) {
                        setValidationError(err);
                        setStep(i);
                        const scrollTarget = document.querySelector('.onboarding-body');
                        if (scrollTarget) {
                          scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
                        }
                        return;
                      }
                    }
                  }
                  setValidationError(null);
                  setStep(s.num);
                  const scrollTarget = document.querySelector('.onboarding-body');
                  if (scrollTarget) {
                    scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                title={`Step ${s.num}: ${s.fullTitle}`}
              >
                <div className="onboarding-step-badge">
                  {isCompleted ? '✓' : s.num}
                </div>
                <IconComp size={14} />
                <span>{s.label}</span>
              </div>
            );
          })}
        </div>
        <div className="onboarding-progress-track">
          <div 
            className="onboarding-progress-fill" 
            style={{ width: `${(step / 9) * 100}%` }}
          />
        </div>
      </div>

      {/* Scrollable Wizard Form Body */}
      <main className="onboarding-body">
        <form autoComplete="off" onSubmit={e => e.preventDefault()} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="onboarding-content-container">
          {validationError && (
            <div style={{
              backgroundColor: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#B91C1C',
              borderRadius: 'var(--radius-card)',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.88rem',
              fontWeight: 500
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: Personal Information */}
        {step === 1 && (
          <div className="onboarding-section-card">
            <div className="onboarding-card-title">
              <span>1. Basic Personal Details</span>
            </div>

            {/* Hidden decoy fields to intercept browser credential autofill */}
            <input type="text" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="off" />
            <input type="password" style={{ display: 'none' }} tabIndex={-1} aria-hidden="true" autoComplete="new-password" />

            <div className="form-row" style={{ marginBottom: '18px' }}>
              <div className="form-group">
                <label className="form-label">
                  Employee ID <span className="required-star">*</span>
                </label>

                <input 
                  name="employee_custom_id_code"
                  id="employee_custom_id_code"
                  autoComplete="off"
                  className="form-control" 
                  value={formData.employeeId} 
                  onChange={e => handleChange('employeeId', e.target.value.toUpperCase())}
                  placeholder="Enter Employee ID (e.g. EMP-020, VRM-101)"
                  style={{ 
                    fontWeight: 700, 
                    letterSpacing: '0.04em',
                    color: '#0E7490',
                    borderColor: formData.employeeId.trim() && employees.some(e => e.employeeId.toLowerCase() === formData.employeeId.trim().toLowerCase()) 
                      ? '#EF4444' 
                      : undefined
                  }}
                />

                {formData.employeeId.trim() && employees.some(e => e.employeeId.toLowerCase() === formData.employeeId.trim().toLowerCase()) && (
                  <div style={{ marginTop: '5px', fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>
                    ⚠️ Employee ID &quot;{formData.employeeId}&quot; is already in use by another employee!
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Profile Photo (Direct Upload)</label>
                <input 
                  type="file" 
                  ref={avatarInputRef} 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleAvatarFileUpload} 
                />
                
                {formData.avatar ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '6px 12px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                    <img 
                      src={formData.avatar} 
                      alt="Profile Preview" 
                      style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #0E7490' }} 
                    />
                    <span style={{ fontSize: '0.8rem', color: '#1E293B', fontWeight: 600, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      Photo Selected
                    </span>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button 
                        type="button" 
                        className="btn btn-secondary btn-sm" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem', gap: '4px' }}
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <Upload size={12} /> Change
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-danger btn-sm" 
                        style={{ padding: '4px 7px', fontSize: '0.75rem' }}
                        onClick={() => {
                          handleChange('avatar', '');
                          if (avatarInputRef.current) avatarInputRef.current.value = '';
                        }}
                        title="Remove Photo"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => avatarInputRef.current?.click()}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      padding: '8px 14px',
                      border: '1.5px dashed #CBD5E1',
                      borderRadius: '10px',
                      background: '#F8FAFC',
                      cursor: 'pointer',
                      color: '#475569',
                      fontSize: '0.85rem',
                      fontWeight: 500,
                      transition: 'all 0.15s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#0E7490')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#CBD5E1')}
                  >
                    <Camera size={16} color="#0E7490" />
                    <span>Upload Profile Photo</span>
                    <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>(JPG, PNG, WebP)</span>
                  </div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">First Name <span style={{ color: '#EF4444' }}>*</span></label>
                <input 
                  type="text"
                  name="hrms_add_emp_fname"
                  autoComplete="off"
                  className="form-control" 
                  value={formData.firstName} 
                  onChange={e => handleChange('firstName', e.target.value)}
                  placeholder="Enter First Name" 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Last Name <span style={{ color: '#EF4444' }}>*</span></label>
                <input 
                  type="text"
                  name="hrms_add_emp_lname"
                  autoComplete="off"
                  className="form-control" 
                  value={formData.lastName} 
                  onChange={e => handleChange('lastName', e.target.value)}
                  placeholder="Enter Last Name" 
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Gender <span style={{ color: '#EF4444' }}>*</span></label>
                <select 
                  className="form-control" 
                  value={formData.gender} 
                  onChange={e => handleChange('gender', e.target.value)}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Date of Birth <span style={{ color: '#EF4444' }}>*</span></label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.dob} 
                  onChange={e => handleChange('dob', e.target.value)} 
                  max={new Date().toISOString().split('T')[0]}
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Mobile Number <span style={{ color: '#EF4444' }}>*</span></label>
                <div style={{ display: 'flex', alignItems: 'stretch' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 12px',
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRight: 'none',
                    borderTopLeftRadius: '10px',
                    borderBottomLeftRadius: '10px',
                    color: '#0F172A',
                    fontWeight: 700,
                    fontSize: '0.88rem',
                    letterSpacing: '0.02em',
                    userSelect: 'none'
                  }}>
                    +91
                  </span>
                  <input 
                    type="tel"
                    inputMode="numeric"
                    className="form-control" 
                    style={{
                      borderTopLeftRadius: 0,
                      borderBottomLeftRadius: 0,
                      flex: 1
                    }}
                    value={formData.phone} 
                    onChange={e => {
                      const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                      handleChange('phone', numericOnly);
                    }}
                    onKeyDown={e => {
                      if (
                        !/^[0-9]$/.test(e.key) &&
                        !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
                        !e.ctrlKey &&
                        !e.metaKey
                      ) {
                        e.preventDefault();
                      }
                    }}
                    maxLength={10}
                    placeholder="Enter 10-digit mobile number" 
                    required 
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Personal Email ID <span style={{ color: '#EF4444' }}>*</span></label>
                <input 
                  type="email" 
                  name="employee_personal_email"
                  id="employee_personal_email"
                  autoComplete="off"
                  className="form-control" 
                  value={formData.personalEmail} 
                  onChange={e => handleChange('personalEmail', e.target.value)}
                  placeholder="rahul.personal@gmail.com" 
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Marital Status <span style={{ color: '#EF4444' }}>*</span></label>
                <select 
                  className="form-control" 
                  value={formData.maritalStatus} 
                  onChange={e => handleChange('maritalStatus', e.target.value)}
                  required
                >
                  <option value="">Select Marital Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Divorced">Divorced</option>
                  <option value="Widowed">Widowed</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Password <span style={{ color: '#EF4444' }}>*</span></label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    name="employee_portal_new_password"
                    id="employee_portal_new_password"
                    autoComplete="new-password"
                    className="form-control" 
                    style={{ paddingRight: '42px' }}
                    value={formData.password} 
                    onChange={e => handleChange('password', e.target.value)}
                    placeholder="Enter password (min 6 characters)" 
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      padding: '4px',
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Employment Information */}
        {step === 2 && (
          <div className="onboarding-section-card">
            <div className="onboarding-card-title">
              <span>2. Employment & Department Details</span>
            </div>

            {/* System Role & Permissions Profile */}
            <div style={{ padding: '16px 18px', backgroundColor: '#ECFEFF', border: '1.5px solid #0E7490', borderRadius: '12px', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <label className="form-label" style={{ fontWeight: 800, color: '#0E7490', fontSize: '0.9rem', margin: 0 }}>
                  Organizational System Role & Access Privilege *
                </label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, backgroundColor: '#0E7490', color: '#FFFFFF', padding: '2px 8px', borderRadius: '99px' }}>
                  {formData.role}
                </span>
              </div>
              <select
                className="form-control"
                value={formData.role}
                onChange={e => handleRoleSelectionChange(e.target.value as Role)}
                style={{ fontWeight: 700, borderColor: '#0E7490', backgroundColor: '#FFFFFF' }}
              >
                <option value="Employee">Staff Employee (Standard Attendance & Assigned Tasks)</option>
                <option value="CEO">CEO (Executive Head - Full Approvals & Authority, Attendance & Task Exempt)</option>
                <option value="HR Manager">HR Manager (People Operations - Full Approvals, Attendance & Tasks Enabled)</option>
                <option value="Finance Manager">Accounts / Finance Manager (Salary & Expense Viewer with Download Access)</option>
              </select>
              <div style={{ fontSize: '0.76rem', color: '#0E7490', marginTop: '6px', fontWeight: 600 }}>
                {formData.role === 'CEO' && 'CEO is exempt from daily attendance punches and task assignments. Has full assign, comment & approval authority.'}
                {formData.role === 'HR Manager' && 'HR has full attendance records, assigned tasks, and company-wide approval authority.'}
                {formData.role === 'Finance Manager' && 'Accounts Department views all employee salaries, payroll, approved advances, and claims with full download access.'}
                {formData.role === 'Employee' && 'Standard staff employee with regular biometric attendance and task management.'}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date of Joining *</label>
                <input 
                  type="date" 
                  className="form-control" 
                  value={formData.joiningDate} 
                  onChange={e => handleChange('joiningDate', e.target.value)} 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department *</label>
                <select 
                  className="form-control" 
                  value={formData.department} 
                  onChange={e => handleChange('department', e.target.value)}
                  required
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.name}>{d.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Designation / Role Title *</label>
                <select 
                  className="form-control" 
                  value={formData.designation} 
                  onChange={e => handleChange('designation', e.target.value)}
                  required
                >
                  {designations.map(d => (
                    <option key={d.id} value={d.title}>{d.title} ({d.level})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Employment Type *</label>
                <select 
                  className="form-control" 
                  value={formData.employmentType} 
                  onChange={e => handleChange('employmentType', e.target.value)}
                >
                  <option value="Full-Time">Full Time</option>
                  <option value="Intern">Intern</option>
                  <option value="Provisional">Provisional</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Reporting Manager *</label>
                <select 
                  className="form-control" 
                  value={formData.reportingManagerName} 
                  onChange={e => {
                    const selEmp = employees.find(emp => `${emp.firstName} ${emp.lastName}`.trim() === e.target.value);
                    handleChange('reportingManagerName', e.target.value);
                    if (selEmp) handleChange('reportingManagerId', selEmp.employeeId);
                  }}
                  required
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={`${emp.firstName} ${emp.lastName}`.trim()}>
                      {emp.firstName} {emp.lastName} ({emp.designation})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Work Location / Branch *</label>
                <select 
                  className="form-control" 
                  value={formData.workLocation} 
                  onChange={e => handleChange('workLocation', e.target.value)}
                  required
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.name}>{b.name} ({b.location})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Employee Status *</label>
                <select 
                  className="form-control" 
                  value={formData.status} 
                  onChange={e => handleChange('status', e.target.value)}
                >
                  <option value="Active">Active</option>
                  <option value="On Leave">Probation</option>
                  <option value="Terminated">Notice Period</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Address & Emergency Contact */}
        {step === 3 && (
          <div>
            <div className="onboarding-section-card">
              <div className="onboarding-card-title">
                <span>3. Current Address Details</span>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Address Line 1 *</label>
                  <input 
                    className="form-control" 
                    value={formData.currentLine1} 
                    onChange={e => handleChange('currentLine1', e.target.value)}
                    placeholder="Door / Flat No., Street Name" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Address Line 2</label>
                  <input 
                    className="form-control" 
                    value={formData.currentLine2} 
                    onChange={e => handleChange('currentLine2', e.target.value)}
                    placeholder="Apartment, Landmark, Area" 
                  />
                </div>
              </div>
              <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                <div className="form-group">
                  <label className="form-label">City *</label>
                  <input className="form-control" value={formData.currentCity} onChange={e => handleChange('currentCity', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">State *</label>
                  <input className="form-control" value={formData.currentState} onChange={e => handleChange('currentState', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Country *</label>
                  <input className="form-control" value={formData.currentCountry} onChange={e => handleChange('currentCountry', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Pincode *</label>
                  <input className="form-control" value={formData.currentPincode} onChange={e => handleChange('currentPincode', e.target.value)} />
                </div>
              </div>
            </div>

            <div className="onboarding-section-card">
              <div className="onboarding-card-title" style={{ justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>Permanent Address</span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary-blue)', cursor: 'pointer' }}>
                  <input 
                    type="checkbox" 
                    checked={formData.sameAsCurrent} 
                    onChange={e => handleChange('sameAsCurrent', e.target.checked)} 
                  />
                  Same as Current Address
                </label>
              </div>

              {!formData.sameAsCurrent && (
                <>
                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Permanent Line 1 *</label>
                      <input 
                        className="form-control" 
                        value={formData.permanentLine1} 
                        onChange={e => handleChange('permanentLine1', e.target.value)} 
                        placeholder="House / Flat No, Street Name"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Permanent Line 2</label>
                      <input 
                        className="form-control" 
                        value={formData.permanentLine2} 
                        onChange={e => handleChange('permanentLine2', e.target.value)} 
                        placeholder="Apartment, Landmark, Area"
                      />
                    </div>
                  </div>
                  <div className="form-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <input 
                        type="text"
                        name="hrms_add_perm_city"
                        autoComplete="off"
                        className="form-control" 
                        value={formData.permanentCity} 
                        onChange={e => handleChange('permanentCity', e.target.value)} 
                        placeholder="Enter City"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <input 
                        type="text"
                        name="hrms_add_perm_state"
                        autoComplete="off"
                        className="form-control" 
                        value={formData.permanentState} 
                        onChange={e => handleChange('permanentState', e.target.value)} 
                        placeholder="Enter State"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Country *</label>
                      <input 
                        type="text"
                        name="hrms_add_perm_country"
                        autoComplete="off"
                        className="form-control" 
                        value={formData.permanentCountry} 
                        onChange={e => handleChange('permanentCountry', e.target.value)} 
                        placeholder="Enter Country"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pincode *</label>
                      <input 
                        type="text"
                        name="hrms_add_perm_pincode"
                        autoComplete="off"
                        className="form-control" 
                        value={formData.permanentPincode} 
                        onChange={e => handleChange('permanentPincode', e.target.value)} 
                        placeholder="Enter Pincode"
                        required
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="onboarding-section-card">
              <div className="onboarding-card-title">
                <span>Emergency Contact</span>
              </div>
              <div className="form-row" style={{ marginBottom: '14px' }}>
                <div className="form-group">
                  <label className="form-label">Emergency Contact Name *</label>
                  <input 
                    type="text"
                    name="hrms_add_emergency_contact_person"
                    autoComplete="off"
                    autoCorrect="off"
                    spellCheck={false}
                    data-lpignore="true"
                    className="form-control" 
                    value={formData.emergencyName} 
                    onChange={e => handleChange('emergencyName', e.target.value)}
                    placeholder="Enter Emergency Contact Name" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Relationship *</label>
                  <select 
                    className="form-control" 
                    value={formData.emergencyRelationship} 
                    onChange={e => handleChange('emergencyRelationship', e.target.value)}
                  >
                    <option value="Parent">Parent</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Guardian">Guardian</option>
                    <option value="Friend">Friend</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Emergency Contact Number *</label>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 12px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRight: 'none',
                      borderTopLeftRadius: '10px',
                      borderBottomLeftRadius: '10px',
                      color: '#0F172A',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      letterSpacing: '0.02em',
                      userSelect: 'none'
                    }}>
                      +91
                    </span>
                    <input 
                      type="tel"
                      inputMode="numeric"
                      className="form-control" 
                      style={{
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        flex: 1
                      }}
                      value={formData.emergencyMobile} 
                      onChange={e => {
                        const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                        handleChange('emergencyMobile', numericOnly);
                      }}
                      onKeyDown={e => {
                        if (
                          !/^[0-9]$/.test(e.key) &&
                          !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
                          !e.ctrlKey &&
                          !e.metaKey
                        ) {
                          e.preventDefault();
                        }
                      }}
                      maxLength={10}
                      placeholder="Enter 10-digit emergency number" 
                      required 
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Alternate Emergency Number (Optional)</label>
                  <div style={{ display: 'flex', alignItems: 'stretch' }}>
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 12px',
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #CBD5E1',
                      borderRight: 'none',
                      borderTopLeftRadius: '10px',
                      borderBottomLeftRadius: '10px',
                      color: '#0F172A',
                      fontWeight: 700,
                      fontSize: '0.88rem',
                      letterSpacing: '0.02em',
                      userSelect: 'none'
                    }}>
                      +91
                    </span>
                    <input 
                      type="tel"
                      inputMode="numeric"
                      className="form-control" 
                      style={{
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                        flex: 1
                      }}
                      value={formData.emergencyAltMobile} 
                      onChange={e => {
                        const numericOnly = e.target.value.replace(/\D/g, '').slice(0, 10);
                        handleChange('emergencyAltMobile', numericOnly);
                      }}
                      onKeyDown={e => {
                        if (
                          !/^[0-9]$/.test(e.key) &&
                          !['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter'].includes(e.key) &&
                          !e.ctrlKey &&
                          !e.metaKey
                        ) {
                          e.preventDefault();
                        }
                      }}
                      maxLength={10}
                      placeholder="Enter 10-digit alternate number" 
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: Educational Details */}
        {step === 4 && (
          <div className="onboarding-section-card">
            <div className="onboarding-card-title">
              <div>
                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>4. Educational Qualifications & Academic Records</span>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '3px 0 0', fontWeight: 500 }}>
                  Enter candidate's academic qualifications, degrees, institution records, and year of passing.
                </p>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Highest Qualification *</label>
                <select 
                  className="form-control" 
                  value={formData.qualification} 
                  onChange={e => handleChange('qualification', e.target.value)}
                  required
                >
                  <option value="B.E / B.Tech">B.E / B.Tech (Engineering / Technology)</option>
                  <option value="M.E / M.Tech">M.E / M.Tech (Master of Engineering)</option>
                  <option value="Diploma">Diploma (Polytechnic / Technical)</option>
                  <option value="MBA">MBA (Master of Business Admin)</option>
                  <option value="MCA">MCA (Master of Computer Apps)</option>
                  <option value="B.Sc / BCA">B.Sc / BCA (Science / Computer Apps)</option>
                  <option value="B.Com / B.A / BBA">B.Com / B.A / BBA (Commerce / Arts / Admin)</option>
                  <option value="M.Sc / M.Com / M.A">M.Sc / M.Com / M.A (Post Graduate)</option>
                  <option value="Ph.D / Doctorate">Ph.D / Doctorate Research</option>
                  <option value="ITI">ITI Certification</option>
                  <option value="12th / HSC">12th Standard / HSC</option>
                  <option value="10th Standard">10th Standard / SSLC</option>
                  <option value="Other">Other Equivalent Qualification</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Degree / Course Name *</label>
                <input 
                  type="text"
                  name="hrms_add_degree_name"
                  autoComplete="off"
                  className="form-control" 
                  value={formData.degreeName} 
                  onChange={e => handleChange('degreeName', e.target.value)}
                  placeholder="Enter Degree / Course Name" 
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Specialization</label>
                <input 
                  type="text"
                  name="hrms_add_specialization"
                  autoComplete="off"
                  className="form-control" 
                  value={formData.specialization} 
                  onChange={e => handleChange('specialization', e.target.value)}
                  placeholder="Enter Specialization" 
                />
              </div>
              <div className="form-group">
                <label className="form-label">University / Institution *</label>
                <input 
                  type="text"
                  name="hrms_add_university"
                  autoComplete="off"
                  className="form-control" 
                  value={formData.university} 
                  onChange={e => handleChange('university', e.target.value)}
                  placeholder="Enter University / College" 
                  required 
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Year of Passing *</label>
                <select 
                  className="form-control" 
                  value={formData.yearOfPassing} 
                  onChange={e => handleChange('yearOfPassing', e.target.value)}
                  required 
                >
                  <option value="">Select Passing Year</option>
                  {PASSING_YEARS.map(yr => (
                    <option key={yr} value={yr}>
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Grade / Percentage</label>
                <input 
                  type="text"
                  name="hrms_add_grade_pct"
                  autoComplete="off"
                  className="form-control" 
                  value={formData.gradePercentage} 
                  onChange={e => handleChange('gradePercentage', e.target.value)}
                  placeholder="Enter Grade / Percentage" 
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Experience Details */}
        {step === 5 && (
          <div className="onboarding-section-card">
            <div className="onboarding-card-title">
              <div>
                <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>5. Past Work Experience & Employment History</span>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '3px 0 0', fontWeight: 500 }}>
                  Specify candidate's prior professional experience, previous companies, designations, and relieving records.
                </p>
              </div>
            </div>

            {/* Fresher vs Experienced Selector */}
            <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E293B' }}>Experience Profile:</span>
                <p style={{ fontSize: '0.76rem', color: '#64748B', margin: '2px 0 0' }}>Select Fresher or Experienced candidate</p>
              </div>
              <div style={{ display: 'flex', gap: '8px', background: '#E2E8F0', padding: '4px', borderRadius: '10px' }}>
                <button
                  type="button"
                  style={{
                    padding: '6px 16px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: formData.experienceType === 'Fresher' ? '#0E7490' : 'transparent',
                    color: formData.experienceType === 'Fresher' ? '#FFFFFF' : '#475569',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => handleChange('experienceType', 'Fresher')}
                >
                  Fresher
                </button>
                <button
                  type="button"
                  style={{
                    padding: '6px 16px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    background: formData.experienceType === 'Experienced' ? '#0E7490' : 'transparent',
                    color: formData.experienceType === 'Experienced' ? '#FFFFFF' : '#475569',
                    transition: 'all 0.15s ease'
                  }}
                  onClick={() => handleChange('experienceType', 'Experienced')}
                >
                  Experienced
                </button>
              </div>
            </div>

            {formData.experienceType === 'Fresher' ? (
              <div style={{ padding: '24px', background: '#ECFEFF', border: '1px solid #CFFAFE', borderRadius: '12px', textAlign: 'center', color: '#0E7490', marginBottom: '20px' }}>
                <CheckCircle2 size={32} style={{ margin: '0 auto 8px', color: '#0E7490' }} />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '0 0 4px', color: '#0E7490' }}>Candidate Registered as Fresher</h4>
                <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
                  No prior employment history, relieving letters, or experience certificates required. You can add technical skills below and proceed to next step.
                </p>
              </div>
            ) : (
              <>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Total Experience *</label>
                    <input 
                      type="text"
                      name="hrms_add_total_exp"
                      autoComplete="off"
                      className="form-control" 
                      value={formData.totalExperience} 
                      onChange={e => handleChange('totalExperience', e.target.value)}
                      placeholder="Enter Total Experience" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Previous Company Name *</label>
                    <input 
                      type="text"
                      name="hrms_add_prev_company"
                      autoComplete="off"
                      className="form-control" 
                      value={formData.previousCompany} 
                      onChange={e => handleChange('previousCompany', e.target.value)}
                      placeholder="Enter Previous Company Name" 
                      required 
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Previous Designation *</label>
                    <input 
                      type="text"
                      name="hrms_add_prev_designation"
                      autoComplete="off"
                      className="form-control" 
                      value={formData.previousDesignation} 
                      onChange={e => handleChange('previousDesignation', e.target.value)}
                      placeholder="Enter Previous Designation" 
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Previous Department</label>
                    <select 
                      className="form-control" 
                      value={formData.previousDepartment} 
                      onChange={e => handleChange('previousDepartment', e.target.value)}
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.name}>{d.name}</option>
                      ))}
                      <option value="Civil & Structural Engineering">Civil & Structural Engineering</option>
                      <option value="Mechanical & Fabrication">Mechanical & Fabrication</option>
                      <option value="Operations & Site">Operations & Site</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Employment Start Date</label>
                    <input 
                      type="date"
                      className="form-control" 
                      value={formData.expStartDate} 
                      onChange={e => handleChange('expStartDate', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Employment End Date</label>
                    <input 
                      type="date"
                      className="form-control" 
                      value={formData.expEndDate} 
                      onChange={e => handleChange('expEndDate', e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Last Drawn Salary</label>
                    <input 
                      type="text"
                      name="hrms_add_last_salary"
                      autoComplete="off"
                      className="form-control" 
                      value={formData.lastDrawnSalary} 
                      onChange={e => handleChange('lastDrawnSalary', e.target.value)}
                      placeholder="Enter Last Drawn Salary" 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Previous Company Location</label>
                    <input 
                      type="text"
                      name="hrms_add_prev_location"
                      autoComplete="off"
                      className="form-control" 
                      value={formData.previousCompanyLocation} 
                      onChange={e => handleChange('previousCompanyLocation', e.target.value)}
                      placeholder="Enter Company Location" 
                    />
                  </div>
                </div>
              </>
            )}

          </div>
        )}

        {/* STEP 6: Salary & Payroll Details */}
        {step === 6 && (
          <div className="onboarding-section-card">
            <div className="onboarding-card-title">
              <span>6. Salary, Compensation & Bank Details (Admin / HR Confidential)</span>
            </div>

            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label className="form-label">Salary Scheme (PF / ESIC Policy) *</label>
                <select 
                  className="form-control" 
                  value={formData.salaryScheme} 
                  onChange={e => {
                    const scheme = e.target.value as 'WITH_PF' | 'WITHOUT_PF';
                    setFormData(prev => ({
                      ...prev,
                      salaryScheme: scheme,
                      withPf: scheme === 'WITH_PF'
                    }));
                  }}
                  style={{ fontWeight: 700, color: formData.salaryScheme === 'WITH_PF' ? '#0E7490' : '#D97706' }}
                >
                  <option value="WITHOUT_PF">Without PF & ESIC (New Employee / &lt; 6 Months)</option>
                  <option value="WITH_PF">With PF & ESIC (Eligible / &gt; 6 Months / Confirmed)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Total Monthly CTC (₹) *</label>
                <input 
                  type="number" 
                  className="form-control" 
                  value={formData.monthlyCtc} 
                  onChange={e => handleCtcChange(Number(e.target.value))}
                  style={{ fontWeight: 800, color: '#0E7490', fontSize: '1.05rem' }}
                  required 
                />
              </div>
            </div>


            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 8px' }}>
              <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: 0, color: 'var(--color-text-secondary)' }}>
                Configured Payroll Components (from Settings → Payroll Settings)
              </h4>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                {activeEarnings.length} Earning {activeEarnings.length === 1 ? 'Component' : 'Components'} Active
              </span>
            </div>

            {activeEarnings.length > 0 ? (
              <div className="form-row" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(180px, 1fr))` }}>
                {activeEarnings.map(comp => {
                  const compVal = formData.customComponents?.[comp.code] ?? (
                    comp.code === 'BASIC' ? formData.basicSalary :
                    comp.code === 'DA' ? formData.da :
                    (comp.code === 'CONV' || comp.code === 'CONVEYANCE') ? formData.conveyance :
                    comp.code === 'HRA' ? formData.hra : 0
                  );
                  const badgeText = comp.calculationMethod === 'PERCENTAGE'
                    ? `${comp.defaultValue}% of ${comp.percentageBase || 'CTC'}`
                    : comp.calculationMethod === 'FIXED_AMOUNT'
                    ? `Fixed ${formatCurrency(comp.defaultValue || 0)}`
                    : `fx: ${comp.formula || 'Formula'}`;

                  return (
                    <div className="form-group" key={comp.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label className="form-label" style={{ margin: 0 }}>{comp.name} (₹) {comp.code === 'BASIC' ? '*' : ''}</label>
                        <span style={{ fontSize: '0.72rem', color: '#0E7490', fontWeight: 800 }}>{badgeText}</span>
                      </div>
                      <input 
                        type="number" 
                        className="form-control" 
                        value={compVal} 
                        onChange={e => handleCustomCompChange(comp, Number(e.target.value))} 
                        style={{ fontWeight: 700 }}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                backgroundColor: '#F0FDFA',
                border: '1px solid #CCFBF1',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '14px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#0E7490', marginBottom: '8px' }}>
                  <AlertCircle size={18} />
                  <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>
                    No dynamic earning components configured in Settings → Payroll Settings.
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '0 0 12px 0' }}>
                  You can configure custom components with formulas and percentages under <strong>Settings → Payroll Settings</strong>. For now, enter standard Basic Salary below:
                </p>
                <div className="form-group" style={{ maxWidth: '280px', margin: 0 }}>
                  <label className="form-label" style={{ fontWeight: 700 }}>Basic Salary (₹) *</label>
                  <input
                    type="number"
                    className="form-control"
                    value={formData.basicSalary}
                    onChange={e => handleSalaryChange('basicSalary', Number(e.target.value))}
                    style={{ fontWeight: 700 }}
                    required
                  />
                </div>
              </div>
            )}

            {/* Dynamic Statutory Deductions and Contributions Preview */}
            {formData.salaryScheme === 'WITH_PF' ? (
              <div style={{
                backgroundColor: '#F8FAFC',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '14px 16px',
                marginTop: '14px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Statutory & Configured Deductions (Dynamic from Settings)
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#0E7490', fontWeight: 700 }}>
                    Scheme: With PF & ESIC Enrolled
                  </span>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(auto-fit, minmax(200px, 1fr))`,
                  gap: '10px',
                  marginBottom: '10px'
                }}>
                  {/* PF Wage Base Card */}
                  {statutoryCalc.pfActive !== false && (
                    <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                          PF WAGE BASE
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#0E7490', fontWeight: 700 }}>
                          {statutoryCalc.pfBaseLabel ? 'Formula' : 'Wage Base'}
                        </span>
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', marginTop: '2px' }}>
                        {formatCurrency(statutoryCalc.pfBaseAmount)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={statutoryCalc.pfBaseLabel}>
                        Formula: {statutoryCalc.pfBaseLabel || 'Basic'}
                      </div>
                    </div>
                  )}

                  {/* EPF Contribution Card */}
                  {statutoryCalc.pfActive !== false && (
                    <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                          EPF CONTRIBUTION
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#DC2626', fontWeight: 700 }}>
                          Deduction
                        </span>
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#DC2626', marginTop: '2px' }}>
                        {formatCurrency(statutoryCalc.epfDeduction)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={statutoryCalc.epfRule}>
                        {statutoryCalc.epfRule}
                      </div>
                    </div>
                  )}

                  {/* ESIC Contribution Card */}
                  {statutoryCalc.esicActive !== false && (
                    <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                          ESIC CONTRIBUTION
                        </div>
                        <span style={{ fontSize: '0.68rem', color: statutoryCalc.isEsicExempt ? '#64748B' : '#DC2626', fontWeight: 700 }}>
                          {statutoryCalc.isEsicExempt ? 'Exempt' : 'Deduction'}
                        </span>
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: statutoryCalc.isEsicExempt ? '#64748B' : '#DC2626', marginTop: '2px' }}>
                        {statutoryCalc.isEsicExempt ? 'Exempt (> ₹21,000.00)' : formatCurrency(statutoryCalc.esiDeduction)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '2px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={statutoryCalc.esiRule}>
                        {statutoryCalc.esiRule}
                      </div>
                    </div>
                  )}

                  {/* Configured Custom Deductions (from Settings) */}
                  {statutoryCalc.configuredDeductions.map(ded => (
                    <div key={ded.id} style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                          {ded.name}
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#DC2626', fontWeight: 700 }}>
                          Deduction
                        </span>
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#DC2626', marginTop: '2px' }}>
                        {formatCurrency(ded.amount)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '2px' }}>
                        {ded.description}
                      </div>
                    </div>
                  ))}

                  {/* Professional Tax (if enabled) */}
                  {statutoryCalc.ptActive !== false && statutoryCalc.professionalTax > 0 && !statutoryCalc.configuredDeductions.some(d => d.code === 'PT' || d.name.toLowerCase().includes('professional tax')) && (
                    <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>
                          Professional Tax (PT)
                        </div>
                        <span style={{ fontSize: '0.68rem', color: '#DC2626', fontWeight: 700 }}>
                          State
                        </span>
                      </div>
                      <div style={{ fontSize: '1rem', fontWeight: 800, color: '#DC2626', marginTop: '2px' }}>
                        {formatCurrency(statutoryCalc.professionalTax)}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#64748B', marginTop: '2px' }}>
                        Standard Monthly PT
                      </div>
                    </div>
                  )}
                </div>

                {/* Net Summary Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  backgroundColor: '#ECFEFF',
                  borderRadius: '8px',
                  border: '1px solid #CFFAFE',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ color: '#0E7490', fontWeight: 700 }}>
                    Total Monthly Deductions: <span style={{ color: '#DC2626', fontWeight: 800 }}>{formatCurrency(statutoryCalc.totalDeductions)}</span>
                  </div>
                  <div style={{ color: '#0E7490', fontWeight: 700 }}>
                    Estimated Net In-Hand: <span style={{ color: '#059669', fontWeight: 900, fontSize: '0.92rem' }}>{formatCurrency(statutoryCalc.netTakeHome)}</span>
                  </div>
                </div>
              </div>
            ) : null}

            <h4 style={{ fontSize: '0.88rem', fontWeight: 700, margin: '18px 0 10px', color: 'var(--color-text-secondary)' }}>
              Banking & Statutory Registration
            </h4>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Bank Name *</label>
                <input className="form-control" value={formData.bankName} onChange={e => handleChange('bankName', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Account Number *</label>
                <input className="form-control" value={formData.accountNumber} onChange={e => handleChange('accountNumber', e.target.value)} required />
              </div>
            </div>

            <div className="form-row" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              <div className="form-group">
                <label className="form-label">IFSC Code *</label>
                <input className="form-control" value={formData.ifscCode} onChange={e => handleChange('ifscCode', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">PAN Card Number *</label>
                <input className="form-control" value={formData.panNumber} onChange={e => handleChange('panNumber', e.target.value.toUpperCase())} placeholder="ABCDE1234F" required />
              </div>
              <div className="form-group">
                <label className="form-label">UAN / PF Number (Optional)</label>
                <input className="form-control" value={formData.uanNumber} onChange={e => handleChange('uanNumber', e.target.value)} placeholder="101234567890" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: Attendance & Shift Settings */}
        {step === 7 && (
          <div className="onboarding-section-card">
            <div className="onboarding-card-title">
              <span>7. Attendance Mode, Shifts & Leave Policies</span>
            </div>

            {formData.role === 'CEO' && (
              <div style={{ padding: '12px 16px', backgroundColor: '#ECFEFF', border: '1px solid #A5F3FC', borderRadius: '10px', marginBottom: '16px', color: '#0E7490', fontSize: '0.82rem', fontWeight: 700 }}>
                CEO Executive Notice: This employee is exempt from daily biometric face scans, geofenced mobile punches, and absent penalizations.
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Primary Attendance Verification Method *</label>
                <select 
                  className="form-control" 
                  value={formData.attendanceMethod} 
                  onChange={e => handleChange('attendanceMethod', e.target.value)}
                >
                  <option value="Face Scan">Face Recognition Scan (AI Camera)</option>
                  <option value="GPS Location">Mobile GPS Geofenced Check-In</option>
                  <option value="Biometric">Biometric Fingerprint Scanner</option>
                  <option value="Manual">Manual HR Portal Punch</option>
                  <option value="Exempt">Exempt from Attendance (Executive / CEO)</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Assigned Shift Schedule</label>
                <select 
                  className="form-control" 
                  value={formData.shift} 
                  onChange={e => handleChange('shift', e.target.value)}
                >
                  <option value="">{shifts.length > 0 ? '-- Select Shift --' : '-- No Shifts Configured (Add in Shift Settings) --'}</option>
                  {shifts.map(s => (
                    <option key={s.id} value={s.shiftName}>{s.shiftName} ({s.startTime} - {s.endTime})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Weekly Off Routine</label>
                <select 
                  className="form-control" 
                  value={formData.weeklyOff} 
                  onChange={e => handleChange('weeklyOff', e.target.value)}
                >
                  {weeklySchedules.map(w => (
                    <option key={w.id} value={w.name}>{w.name} ({w.workingDays})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Annual Leave Policy Package</label>
                <select 
                  className="form-control" 
                  value={formData.leavePolicy} 
                  onChange={e => handleChange('leavePolicy', e.target.value)}
                >
                  {leavePolicies.map(lp => (
                    <option key={lp.id} value={lp.name}>{lp.name} ({lp.quotaDays} Days)</option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ padding: '16px', backgroundColor: 'var(--color-primary-light)', borderRadius: 'var(--radius-card)', marginTop: '16px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', fontWeight: 600, color: 'var(--color-primary-blue)', cursor: 'pointer' }}>
                <input 
                  type="checkbox" 
                  checked={formData.gpsAllowed} 
                  onChange={e => handleChange('gpsAllowed', e.target.checked)} 
                />
                Enable Mobile GPS Geofencing for Off-Site and Field Plant Punches
              </label>
            </div>
          </div>
        )}

        {/* STEP 8: Documents Upload */}
        {step === 8 && (
          <div className="onboarding-section-card">
            <div className="onboarding-card-title">
              <div>
                <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>8. Employee Documents & Verification Uploads</span>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '3px 0 0', fontWeight: 500 }}>
                  Attach official candidate credentials. Supported formats: PDF, DOCX, JPG, PNG (up to 10MB per file).
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '18px', marginBottom: '28px' }}>
              {[
                { cat: '10th Marksheet', desc: 'SSLC / 10th standard pass certificate' },
                { cat: '12th or Diploma', desc: '12th HSC, Diploma, or Degree marksheet' },
                { cat: 'Relieving Letter', desc: 'Formal relieving order & exit clearance' },
                { cat: 'Experience Certificate', desc: 'Service credential or experience certificate' },
                { cat: 'ID Proof', desc: 'Government issued identity proof (Aadhaar / PAN)' },
                { cat: 'Account Passbook (First Page)', desc: 'Bank passbook first page or cancelled cheque' }
              ].map(item => {
                const existingDoc = documents.find(d => d.category === item.cat);

                return (
                  <div 
                    key={item.cat} 
                    className={`document-upload-card ${existingDoc ? 'has-file' : ''}`}
                    onClick={() => triggerUploadForCategory(item.cat)}
                  >
                    {existingDoc ? (
                      <>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                          <CheckCircle2 size={22} />
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#166534' }}>{item.cat}</div>
                        <div style={{ fontSize: '0.74rem', color: '#15803D', marginTop: '4px', fontWeight: 600, wordBreak: 'break-all', maxWidth: '100%' }}>
                          {existingDoc.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '2px' }}>
                          {existingDoc.size} • {existingDoc.uploadDate}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }} onClick={e => e.stopPropagation()}>
                          <button 
                            type="button" 
                            className="btn btn-secondary btn-sm" 
                            onClick={() => triggerUploadForCategory(item.cat)}
                            style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                          >
                            Replace
                          </button>
                          <button 
                            type="button" 
                            className="btn btn-sm" 
                            onClick={() => handleRemoveDocument(existingDoc.id)}
                            style={{ fontSize: '0.72rem', padding: '4px 10px', color: '#EF4444', borderColor: '#FCA5A5', background: '#FEF2F2' }}
                          >
                            Remove
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <div style={{ width: '42px', height: '42px', borderRadius: '50%', background: '#ECFEFF', color: '#0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
                          <Upload size={20} />
                        </div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B' }}>{item.cat}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '4px' }}>{item.desc}</div>
                        <span style={{ display: 'inline-block', padding: '2px 8px', background: '#F1F5F9', color: '#64748B', borderRadius: '9999px', fontSize: '0.68rem', fontWeight: 600, marginTop: '8px' }}>
                          PDF, DOCX, JPG &lt; 10MB
                        </span>
                        <button 
                          type="button" 
                          className="btn btn-secondary btn-sm" 
                          style={{ marginTop: '12px', fontSize: '0.78rem', padding: '6px 14px' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            triggerUploadForCategory(item.cat);
                          }}
                        >
                          + Upload Document
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Document Queue Summary */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 700, color: '#1E293B', margin: 0 }}>
                  Uploaded Documents ({documents.length} of 6 Attached)
                </h4>
                {documents.length > 0 && (
                  <span style={{ fontSize: '0.72rem', fontWeight: 700, background: '#DCFCE7', color: '#16A34A', padding: '2px 8px', borderRadius: '9999px' }}>
                    Ready for Verification
                  </span>
                )}
              </div>
              <button 
                type="button" 
                className="btn btn-secondary btn-sm" 
                style={{ fontSize: '0.75rem', padding: '5px 12px' }}
                onClick={() => handleAddMockDocument('Additional Certificate')}
              >
                + Attach Extra Document
              </button>
            </div>

            {documents.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', color: '#64748B', fontSize: '0.82rem' }}>
                No documents uploaded yet. Click any card above to attach your files, or continue to review.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {documents.map(doc => (
                  <div key={doc.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 1px 2px rgba(0,0,0,0.02)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: '#ECFEFF', color: '#0E7490', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileCheck size={20} />
                      </div>
                      <div>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1E293B' }}>{doc.name}</div>
                        <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: '2px' }}>
                          <span style={{ fontWeight: 600, color: '#0E7490' }}>{doc.category}</span> • {doc.size} • Uploaded on {doc.uploadDate}
                        </div>
                      </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => handleRemoveDocument(doc.id)} 
                      style={{ color: '#EF4444', padding: '6px', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Remove document"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* STEP 9: Final Review & Confirmation */}
        {step === 9 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Header Banner */}
            <div className="onboarding-section-card" style={{ marginBottom: 0 }}>
              <div className="onboarding-card-title">
                <div>
                  <span style={{ fontSize: '1.15rem', fontWeight: 700 }}>9. Comprehensive Employee Onboarding Review</span>
                  <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '3px 0 0', fontWeight: 500 }}>
                    Please verify all candidate parameters across each section below before final submission into the system.
                  </p>
                </div>
              </div>

              {/* Header Profile Summary */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '20px', background: '#ECFEFF', border: '1px solid #CFFAFE', borderRadius: 'var(--radius-card)', marginTop: '16px' }}>
                {formData.avatar ? (
                  <img src={formData.avatar} alt="Profile" style={{ width: '64px', height: '64px', borderRadius: '9999px', objectFit: 'cover', border: '2px solid #0E7490', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: '64px', height: '64px', borderRadius: '9999px', background: '#0E7490', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 800, flexShrink: 0 }}>
                    {formData.firstName?.[0] || 'E'}{formData.lastName?.[0] || 'M'}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                    {formData.firstName || 'First'} {formData.lastName || 'Last'}
                  </h3>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '4px' }}>
                    <strong style={{ color: '#0E7490' }}>{formData.employeeId}</strong> • {formData.designation} in <strong>{formData.department}</strong> ({formData.workLocation})
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#0E7490', fontWeight: 600, marginTop: '2px' }}>
                    {formData.personalEmail || 'No personal email provided'} • {formData.phone}
                  </div>
                </div>
              </div>
            </div>

            {/* Section 1: Basic Personal Information */}
            <div className="onboarding-section-card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0E7490', fontSize: '0.95rem' }}>
                  1. Basic Personal Information
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStep(1)} style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Edit3 size={12} /> Edit
                </button>
              </div>
              <div className="review-item-grid">
                <div className="review-field-box">
                  <div className="review-field-label">Employee ID</div>
                  <div className="review-field-val" style={{ color: '#0E7490', fontFamily: 'monospace', fontWeight: 700 }}>{formData.employeeId}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Full Name</div>
                  <div className="review-field-val">{formData.firstName} {formData.lastName}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Gender & DOB</div>
                  <div className="review-field-val">{formData.gender} • {formatDateDDMMYYYY(formData.dob)}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Mobile Phone Number</div>
                  <div className="review-field-val">{formData.phone}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Personal Email ID (Login Dispatch)</div>
                  <div className="review-field-val" style={{ color: '#0E7490', fontWeight: 700 }}>{formData.personalEmail || 'N/A'}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Login Password</div>
                  <div className="review-field-val" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{formData.password ? (showPassword ? formData.password : '••••••••') : 'Auto-generated'}</span>
                    {formData.password && (
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748B', display: 'flex', alignItems: 'center', padding: '2px' }}
                        title={showPassword ? 'Hide Password' : 'Show Password'}
                      >
                        {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    )}
                  </div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Marital Status</div>
                  <div className="review-field-val">{formData.maritalStatus || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Section 2: Employment & Department Details */}
            <div className="onboarding-section-card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0E7490', fontSize: '0.95rem' }}>
                  2. Employment & Role Details
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStep(2)} style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Edit3 size={12} /> Edit
                </button>
              </div>
              <div className="review-item-grid">
                <div className="review-field-box">
                  <div className="review-field-label">System Role & Privilege</div>
                  <div className="review-field-val" style={{ fontWeight: 800, color: '#0E7490' }}>{formData.role}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Department</div>
                  <div className="review-field-val" style={{ fontWeight: 700 }}>{formData.department}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Designation / Role</div>
                  <div className="review-field-val">{formData.designation}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Date of Joining</div>
                  <div className="review-field-val">{formatDateDDMMYYYY(formData.joiningDate)}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Employment Type & Status</div>
                  <div className="review-field-val">{formData.employmentType} ({formData.status})</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Reporting Manager</div>
                  <div className="review-field-val">{formData.reportingManagerName} ({formData.reportingManagerId})</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Work Location / Branch</div>
                  <div className="review-field-val">{formData.workLocation}</div>
                </div>
              </div>
            </div>

            {/* Section 3: Address & Emergency Contacts */}
            <div className="onboarding-section-card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0E7490', fontSize: '0.95rem' }}>
                  3. Address & Emergency Contacts
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStep(3)} style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Edit3 size={12} /> Edit
                </button>
              </div>
              <div className="review-item-grid">
                <div className="review-field-box" style={{ gridColumn: 'span 2' }}>
                  <div className="review-field-label">Current Address Details</div>
                  <div className="review-field-val">{formData.currentLine1}{formData.currentLine2 ? `, ${formData.currentLine2}` : ''}, {formData.currentCity}, {formData.currentState} - {formData.currentPincode}, {formData.currentCountry}</div>
                </div>
                <div className="review-field-box" style={{ gridColumn: 'span 2' }}>
                  <div className="review-field-label">Permanent Address Details</div>
                  <div className="review-field-val">{formData.sameAsCurrent ? 'Same as Current Address' : `${formData.permanentLine1}${formData.permanentLine2 ? `, ${formData.permanentLine2}` : ''}, ${formData.permanentCity}, ${formData.permanentState} - ${formData.permanentPincode}, ${formData.permanentCountry}`}</div>
                </div>
                <div className="review-field-box" style={{ gridColumn: 'span 2' }}>
                  <div className="review-field-label">Emergency Contact Person</div>
                  <div className="review-field-val">{formData.emergencyName} ({formData.emergencyRelationship})</div>
                </div>
              </div>
            </div>

            {/* Section 4: Educational Details */}
            <div className="onboarding-section-card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0E7490', fontSize: '0.95rem' }}>
                  4. Educational Qualifications
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStep(4)} style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Edit3 size={12} /> Edit
                </button>
              </div>
              <div className="review-item-grid">
                <div className="review-field-box">
                  <div className="review-field-label">Highest Qualification</div>
                  <div className="review-field-val">{formData.qualification}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Degree / Course Name</div>
                  <div className="review-field-val">{formData.degreeName}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Specialization / Major</div>
                  <div className="review-field-val">{formData.specialization || 'General / N/A'}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">University / Institution</div>
                  <div className="review-field-val">{formData.university}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Year of Passing</div>
                  <div className="review-field-val">{formData.yearOfPassing}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Grade / Percentage / CGPA</div>
                  <div className="review-field-val">{formData.gradePercentage || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Section 5: Work Experience Details */}
            <div className="onboarding-section-card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0E7490', fontSize: '0.95rem' }}>
                  5. Work Experience History
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStep(5)} style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Edit3 size={12} /> Edit
                </button>
              </div>
              {formData.experienceType === 'Fresher' ? (
                <div style={{ padding: '14px 18px', background: '#F8FAFC', borderRadius: '10px', color: '#64748B', fontSize: '0.88rem', fontWeight: 600 }}>
                  Candidate is registered as a <strong>Fresher</strong> (No prior employment records).
                </div>
              ) : (
                <div className="review-item-grid">
                  <div className="review-field-box">
                    <div className="review-field-label">Total Work Experience</div>
                    <div className="review-field-val">{formData.totalExperience}</div>
                  </div>
                  <div className="review-field-box">
                    <div className="review-field-label">Previous Company</div>
                    <div className="review-field-val">{formData.previousCompany}</div>
                  </div>
                  <div className="review-field-box">
                    <div className="review-field-label">Previous Designation</div>
                    <div className="review-field-val">{formData.previousDesignation}</div>
                  </div>
                  <div className="review-field-box">
                    <div className="review-field-label">Previous Department</div>
                    <div className="review-field-val">{formData.previousDepartment}</div>
                  </div>
                  <div className="review-field-box">
                    <div className="review-field-label">Employment Tenure</div>
                    <div className="review-field-val">{formData.expStartDate || 'N/A'} to {formData.expEndDate || 'Present'}</div>
                  </div>
                  <div className="review-field-box">
                    <div className="review-field-label">Last Drawn Salary & Location</div>
                    <div className="review-field-val">{formData.lastDrawnSalary || 'N/A'} • {formData.previousCompanyLocation || 'N/A'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Section 6: Salary, Compensation & Banking */}
            <div className="onboarding-section-card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0E7490', fontSize: '0.95rem' }}>
                  6. Salary & Bank Details
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStep(6)} style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Edit3 size={12} /> Edit
                </button>
              </div>
              <div className="review-item-grid">
                <div className="review-field-box">
                  <div className="review-field-label">Monthly Gross CTC</div>
                  <div className="review-field-val" style={{ color: '#16A34A', fontWeight: 700 }}>{formatCurrency(formData.monthlyCtc)} / month</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Salary Scheme (PF / ESIC)</div>
                  <div className="review-field-val" style={{ fontWeight: 700, color: formData.salaryScheme === 'WITH_PF' ? '#0E7490' : '#D97706' }}>
                    {formData.salaryScheme === 'WITH_PF' ? 'With PF & ESIC' : 'Without PF & ESIC (< 6 Months)'}
                  </div>
                </div>
                <div className="review-field-box" style={{ gridColumn: 'span 2' }}>
                  <div className="review-field-label">Salary Breakdown</div>
                  <div className="review-field-val" style={{ fontSize: '0.82rem', fontWeight: 600 }}>
                    {activeEarnings.length > 0 ? (
                      activeEarnings.map(c => {
                        const amt = formData.customComponents?.[c.code] ?? (
                          c.code === 'BASIC' ? formData.basicSalary :
                          c.code === 'DA' ? formData.da :
                          (c.code === 'CONV' || c.code === 'CONVEYANCE') ? formData.conveyance :
                          c.code === 'HRA' ? formData.hra : 0
                        );
                        return `${c.name}: ${formatCurrency(amt)}`;
                      }).join(' | ')
                    ) : (
                      'No active components configured'
                    )}
                  </div>
                </div>
                <div className="review-field-box" style={{ gridColumn: 'span 2', backgroundColor: '#F0FDFA' }}>
                  <div className="review-field-label" style={{ color: '#0E7490' }}>Estimated Net Take-Home Pay (After Deductions)</div>
                  <div className="review-field-val" style={{ color: '#0E7490', fontWeight: 800 }}>
                    {formatCurrency(statutoryCalc.netTakeHome)} / month
                    <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500, marginLeft: '8px' }}>
                      (Gross {formatCurrency(statutoryCalc.gross)} - Deductions {formatCurrency(statutoryCalc.totalDeductions)})
                    </span>
                  </div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Bank Name & Branch</div>
                  <div className="review-field-val">{formData.bankName} ({formData.branch || 'Main Branch'})</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Account Number & IFSC</div>
                  <div className="review-field-val">{formData.accountNumber} • {formData.ifscCode}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">PAN Card & UAN / PF</div>
                  <div className="review-field-val">{formData.panNumber} • {formData.uanNumber || 'N/A'}</div>
                </div>
              </div>
            </div>

            {/* Section 7: Attendance & Shift Policies */}
            <div className="onboarding-section-card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0E7490', fontSize: '0.95rem' }}>
                  7. Attendance & Shift Settings
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStep(7)} style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Edit3 size={12} /> Edit
                </button>
              </div>
              <div className="review-item-grid">
                <div className="review-field-box">
                  <div className="review-field-label">Attendance Capture Mode</div>
                  <div className="review-field-val">{formData.attendanceMethod} {formData.gpsAllowed ? '(GPS Geofenced Enabled)' : ''}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Assigned Work Shift</div>
                  <div className="review-field-val">{formData.shift}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Weekly Off Routine</div>
                  <div className="review-field-val">{formData.weeklyOff}</div>
                </div>
                <div className="review-field-box">
                  <div className="review-field-label">Annual Leave Policy</div>
                  <div className="review-field-val">{formData.leavePolicy}</div>
                </div>
              </div>
            </div>

            {/* Section 8: Uploaded Documents */}
            <div className="onboarding-section-card" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid #F1F5F9', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700, color: '#0E7490', fontSize: '0.95rem' }}>
                  8. Verified Uploaded Documents ({documents.length} Files)
                </div>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setStep(8)} style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Edit3 size={12} /> Edit
                </button>
              </div>
              {documents.length === 0 ? (
                <div style={{ padding: '14px 18px', background: '#F8FAFC', borderRadius: '10px', color: '#64748B', fontSize: '0.85rem' }}>
                  No documents attached yet.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                  {documents.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px' }}>
                      <FileCheck size={18} color="#0E7490" style={{ flexShrink: 0 }} />
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{doc.name}</div>
                        <div style={{ fontSize: '0.72rem', color: '#64748B' }}><span style={{ color: '#0E7490', fontWeight: 600 }}>{doc.category}</span> • {doc.size}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Confirmation Banner */}
            <div style={{ padding: '16px 20px', background: '#ECFEFF', border: '1px solid #CFFAFE', borderRadius: 'var(--radius-card)', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <CheckCircle2 size={24} color="var(--color-primary-blue)" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: '0.88rem', color: 'var(--color-text-primary)' }}>
                All mandatory parameters have been checked and validated. Clicking <strong>Confirm & Onboard Employee</strong> will save the profile into the employee directory and prepare the official offer letter.
              </div>
            </div>
          </div>
        )}
        </div>
        </form>
      </main>

      {/* Bottom Sticky Action Footer */}
      <footer className="onboarding-footer">
        <div className="onboarding-footer-inner">
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={resetAndClose}
            style={{ padding: '9px 18px', fontSize: '0.88rem' }}
          >
            Cancel & Exit
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>
              Step <span style={{ color: '#0E7490', fontWeight: 700 }}>{step}</span> of 9 • {Math.round((step / 9) * 100)}% Completed
            </div>
            {validationError && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                color: '#DC2626', 
                fontSize: '0.78rem', 
                fontWeight: 600,
                backgroundColor: '#FEF2F2',
                padding: '4px 10px',
                borderRadius: '6px',
                border: '1px solid #FECACA',
                maxWidth: '380px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }} title={validationError}>
                <AlertCircle size={14} style={{ flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{validationError}</span>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {step > 1 && (
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => {
                  setValidationError(null);
                  setStep(prev => prev - 1);
                  const scrollTarget = document.querySelector('.onboarding-body');
                  if (scrollTarget) {
                    scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', fontSize: '0.88rem' }}
              >
                <ArrowLeft size={16} /> Back
              </button>
            )}

            {step < 9 ? (
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={() => {
                  const err = validateCurrentStep(step);
                  if (err) {
                    setValidationError(err);
                    const scrollTarget = document.querySelector('.onboarding-body');
                    if (scrollTarget) {
                      scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
                    }
                    return;
                  }
                  setValidationError(null);
                  setStep(prev => prev + 1);
                  const scrollTarget = document.querySelector('.onboarding-body');
                  if (scrollTarget) {
                    scrollTarget.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 20px', fontSize: '0.88rem', background: '#0E7490', borderColor: '#0E7490', boxShadow: '0 2px 8px rgba(14, 116, 144, 0.25)' }}
              >
                Next Step <ArrowRight size={16} />
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary" 
                disabled={isSubmitting}
                onClick={handleSubmit}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '8px', 
                  backgroundColor: isSubmitting ? '#94A3B8' : '#10B981', 
                  borderColor: isSubmitting ? '#94A3B8' : '#10B981', 
                  padding: '9px 22px', 
                  fontSize: '0.88rem', 
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer'
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={17} className="animate-spin" /> Provisioning Login Account...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} /> Confirm & Onboard Employee
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};
