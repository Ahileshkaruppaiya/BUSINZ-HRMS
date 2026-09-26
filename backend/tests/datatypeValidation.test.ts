import { describe, it, expect } from 'vitest';
import {
  citySchema,
  universitySchema,
  specializationSchema,
  pincodeSchema,
  panNumberSchema,
  ifscCodeSchema,
  accountNumberSchema,
  uanNumberSchema,
  lastDrawnSalarySchema,
  totalExperienceSchema,
  yearOfPassingSchema,
  employeeEmailSchema,
  createEmployeeSchema,
  updateEmployeeSchema,
} from '../src/validators/employeeValidators.js';

describe('Backend Datatype & Character-level Validation Test Suite', () => {
  // ============================================================================
  // 1. CITY VALIDATION (letters and spaces ONLY, VARCHAR)
  // ============================================================================
  describe('City Validation', () => {
    it('rejects numbers, alphanumeric, and special characters', () => {
      const invalidCities = ['8988', 'Chennai123', 'Chennai@123', '12345', 'Bangalore#1', ''];
      for (const city of invalidCities) {
        const result = citySchema.safeParse(city);
        expect(result.success, `Expected city "${city}" to be rejected`).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toContain('City must contain letters and spaces only.');
        }
      }
    });

    it('accepts letters and spaces only', () => {
      const validCities = ['Chennai', 'Coimbatore', 'New Delhi', 'Kolkata', 'Mumbai'];
      for (const city of validCities) {
        const result = citySchema.safeParse(city);
        expect(result.success, `Expected city "${city}" to be accepted`).toBe(true);
      }
    });
  });

  // ============================================================================
  // 2. UNIVERSITY / INSTITUTION VALIDATION (letters and spaces, VARCHAR, no digits)
  // ============================================================================
  describe('University / Institution Validation', () => {
    it('rejects numeric strings, numbers in name, and special symbols', () => {
      const invalidUniversities = ['12345', 'Anna University 123', 'Anna@University', 'VIT#99', ''];
      for (const univ of invalidUniversities) {
        const result = universitySchema.safeParse(univ);
        expect(result.success, `Expected university "${univ}" to be rejected`).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('University must contain valid characters.');
        }
      }
    });

    it('accepts legitimate university names with letters, spaces, &, -, .', () => {
      const validUniversities = [
        'Anna University',
        'Vellore Institute of Technology',
        'SRM Institute of Science and Technology',
        'Indian Institute of Technology - Madras',
      ];
      for (const univ of validUniversities) {
        const result = universitySchema.safeParse(univ);
        expect(result.success, `Expected university "${univ}" to be accepted`).toBe(true);
      }
    });
  });

  // ============================================================================
  // 3. PINCODE VALIDATION (STRING/VARCHAR, NOT INTEGER, exactly 6 digits)
  // ============================================================================
  describe('Pincode Validation', () => {
    it('rejects invalid lengths and non-digits', () => {
      const invalidPincodes = ['12345', '1234567', 'ABC123', '63030', '6303021'];
      for (const pin of invalidPincodes) {
        const result = pincodeSchema.safeParse(pin);
        expect(result.success, `Expected pincode "${pin}" to be rejected`).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Pincode must be exactly 6 digits.');
        }
      }
    });

    it('accepts exactly 6 digits and preserves leading zeros as string', () => {
      const result = pincodeSchema.safeParse('630302');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('630302');
      }

      const leadingZero = pincodeSchema.safeParse('012345');
      expect(leadingZero.success).toBe(true);
      if (leadingZero.success) {
        expect(leadingZero.data).toBe('012345');
      }
    });
  });

  // ============================================================================
  // 4. PAN CARD NUMBER VALIDATION (VARCHAR(10), uppercase, 5 letters + 4 digits + 1 letter)
  // ============================================================================
  describe('PAN Card Validation', () => {
    it('rejects invalid PAN formats', () => {
      const invalidPANs = ['12304567890', 'ABCDE12345', 'ABC123', 'ABCDEF1234', '1234567890'];
      for (const pan of invalidPANs) {
        const result = panNumberSchema.safeParse(pan);
        expect(result.success, `Expected PAN "${pan}" to be rejected`).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid PAN format.');
        }
      }
    });

    it('accepts valid 10-char PAN and auto-converts lowercase to uppercase', () => {
      const result = panNumberSchema.safeParse('ABCDE1234F');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('ABCDE1234F');
      }

      const lowerCase = panNumberSchema.safeParse('abcde1234f');
      expect(lowerCase.success).toBe(true);
      if (lowerCase.success) {
        expect(lowerCase.data).toBe('ABCDE1234F');
      }
    });
  });

  // ============================================================================
  // 5. IFSC CODE VALIDATION (VARCHAR(11), 4 letters + 0 + 6 alphanumeric)
  // ============================================================================
  describe('IFSC Code Validation', () => {
    it('rejects invalid IFSC formats', () => {
      const invalidIFSCs = ['12345678901', 'ABC123', 'SBI@000123', 'SBIN1001234', 'SBIN000123'];
      for (const ifsc of invalidIFSCs) {
        const result = ifscCodeSchema.safeParse(ifsc);
        expect(result.success, `Expected IFSC "${ifsc}" to be rejected`).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Invalid IFSC format.');
        }
      }
    });

    it('accepts valid IFSC and auto-converts lowercase to uppercase', () => {
      const result = ifscCodeSchema.safeParse('SBIN0001234');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('SBIN0001234');
      }

      const lowerCase = ifscCodeSchema.safeParse('sbin0001234');
      expect(lowerCase.success).toBe(true);
      if (lowerCase.success) {
        expect(lowerCase.data).toBe('SBIN0001234');
      }
    });
  });

  // ============================================================================
  // 6. BANK ACCOUNT NUMBER VALIDATION (STRING/VARCHAR, 9 to 18 digits)
  // ============================================================================
  describe('Bank Account Number Validation', () => {
    it('rejects alphabets and invalid lengths', () => {
      const invalidAccounts = ['ABC123456', '12345', '12345678', '12345678901234567890'];
      for (const acc of invalidAccounts) {
        const result = accountNumberSchema.safeParse(acc);
        expect(result.success, `Expected account number "${acc}" to be rejected`).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Account number must be between 9 and 18 digits.');
        }
      }
    });

    it('accepts 9 to 18 digits and preserves leading zeros as string', () => {
      const validAccounts = ['001234567890', '123456789', '987654321012345678'];
      for (const acc of validAccounts) {
        const result = accountNumberSchema.safeParse(acc);
        expect(result.success, `Expected account "${acc}" to be accepted`).toBe(true);
        if (result.success) {
          expect(result.data).toBe(acc);
        }
      }
    });
  });

  // ============================================================================
  // 7. UAN / PF NUMBER VALIDATION (VARCHAR, exactly 12 digits when provided)
  // ============================================================================
  describe('UAN / PF Number Validation', () => {
    it('rejects invalid lengths and alphabets', () => {
      const invalidUans = ['12345', 'ABC123456789', '12345678901', '1234567890123'];
      for (const uan of invalidUans) {
        const result = uanNumberSchema.safeParse(uan);
        expect(result.success, `Expected UAN "${uan}" to be rejected`).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('UAN must be exactly 12 digits.');
        }
      }
    });

    it('accepts exactly 12 digits and preserves leading zeros', () => {
      const result = uanNumberSchema.safeParse('101234567890');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('101234567890');
      }

      const leadingZero = uanNumberSchema.safeParse('001234567890');
      expect(leadingZero.success).toBe(true);
      if (leadingZero.success) {
        expect(leadingZero.data).toBe('001234567890');
      }

      // Optional field
      const empty = uanNumberSchema.safeParse('');
      expect(empty.success).toBe(true);
    });
  });

  // ============================================================================
  // 8. SALARY VALIDATION (Decimal/Number, positive only)
  // ============================================================================
  describe('Salary Validation', () => {
    it('rejects alphabets and negative numbers', () => {
      const invalidSalaries = [-5000, -1, 'abc', '-5000', '25000abc'];
      for (const sal of invalidSalaries) {
        const result = lastDrawnSalarySchema.safeParse(sal);
        expect(result.success, `Expected salary "${sal}" to be rejected`).toBe(false);
      }
    });

    it('accepts positive numbers and decimal values', () => {
      const validSalaries = [25000, 25000.5, '25000', '80000.75'];
      for (const sal of validSalaries) {
        const result = lastDrawnSalarySchema.safeParse(sal);
        expect(result.success, `Expected salary "${sal}" to be accepted`).toBe(true);
      }
    });
  });

  // ============================================================================
  // 9. EXPERIENCE VALIDATION (Decimal, >= 0)
  // ============================================================================
  describe('Experience Validation', () => {
    it('rejects alphabets and negative values', () => {
      const invalidExps = [-2, -0.5, 'abc', '-2'];
      for (const exp of invalidExps) {
        const result = totalExperienceSchema.safeParse(exp);
        expect(result.success, `Expected experience "${exp}" to be rejected`).toBe(false);
      }
    });

    it('accepts zero and positive decimal values', () => {
      const validExps = [0, 1, 2, 2.5, 8, '2.5'];
      for (const exp of validExps) {
        const result = totalExperienceSchema.safeParse(exp);
        expect(result.success, `Expected experience "${exp}" to be accepted`).toBe(true);
      }
    });
  });

  // ============================================================================
  // 10. YEAR OF PASSING VALIDATION (Integer, 4-digit, not in the future)
  // ============================================================================
  describe('Year of Passing Validation', () => {
    it('rejects non-numeric strings and future years', () => {
      const invalidYears = ['abc', '2099', 2099, '25', '1899'];
      for (const year of invalidYears) {
        const result = yearOfPassingSchema.safeParse(year);
        expect(result.success, `Expected year "${year}" to be rejected`).toBe(false);
      }
    });

    it('accepts valid 4-digit past/present years', () => {
      const validYears = [2020, 2023, 2024, '2023', '2020'];
      for (const year of validYears) {
        const result = yearOfPassingSchema.safeParse(year);
        expect(result.success, `Expected year "${year}" to be accepted`).toBe(true);
      }
    });
  });

  // ============================================================================
  // 10B. SPECIALIZATION VALIDATION (Letters, spaces, and &, -, . ONLY)
  // ============================================================================
  describe('Specialization Validation', () => {
    it('rejects numbers, digits, and invalid symbols', () => {
      const invalidSpecs = ['34353535454', 'CSE 123', '12345', 'Specialization#1', 'Tech@123', ''];
      for (const spec of invalidSpecs) {
        const result = specializationSchema.safeParse(spec);
        expect(result.success, `Expected specialization "${spec}" to be rejected`).toBe(false);
      }
    });

    it('accepts valid letters, spaces, &, -, . characters', () => {
      const validSpecs = [
        'Civil Engineering',
        'Mechanical & Automation',
        'Electronics - Communication',
        'Computer Science',
        'Artificial Intelligence & Data Science'
      ];
      for (const spec of validSpecs) {
        const result = specializationSchema.safeParse(spec);
        expect(result.success, `Expected specialization "${spec}" to be accepted`).toBe(true);
      }
    });
  });

  // ============================================================================
  // 11. COMPOSITE UPDATE / CREATE VALIDATION INTEGRATION
  // ============================================================================
  describe('Composite Employee Schema Field Validation', () => {
    it('rejects invalid city in updateEmployeeSchema', () => {
      const result = updateEmployeeSchema.safeParse({ city: '8988' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('City must contain letters and spaces only.');
      }
    });

    it('rejects invalid university in updateEmployeeSchema', () => {
      const result = updateEmployeeSchema.safeParse({ university: '12345' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('University must contain valid characters.');
      }
    });

    it('rejects invalid pincode in updateEmployeeSchema', () => {
      const result = updateEmployeeSchema.safeParse({ pincode: '12345' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Pincode must be exactly 6 digits.');
      }
    });

    it('rejects invalid PAN in updateEmployeeSchema', () => {
      const result = updateEmployeeSchema.safeParse({ panNumber: '12304567890' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid PAN format.');
      }
    });

    it('rejects invalid IFSC in updateEmployeeSchema', () => {
      const result = updateEmployeeSchema.safeParse({ ifscCode: '12345678901' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Invalid IFSC format.');
      }
    });

    it('rejects invalid account number in updateEmployeeSchema', () => {
      const result = updateEmployeeSchema.safeParse({ accountNumber: 'ABC123456' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('Account number must be between 9 and 18 digits.');
      }
    });

    it('rejects invalid UAN in updateEmployeeSchema', () => {
      const result = updateEmployeeSchema.safeParse({ uanNumber: '12345' });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('UAN must be exactly 12 digits.');
      }
    });

    it('accepts all valid fields in updateEmployeeSchema', () => {
      const result = updateEmployeeSchema.safeParse({
        city: 'Chennai',
        university: 'Anna University',
        pincode: '630302',
        panNumber: 'ABCDE1234F',
        ifscCode: 'SBIN0001234',
        accountNumber: '001234567890',
        uanNumber: '101234567890',
        lastDrawnSalary: 25000,
        totalExperience: 2.5,
      });
      expect(result.success).toBe(true);
    });

    it('accepts full onboarding payload in createEmployeeSchema', () => {
      const result = createEmployeeSchema.safeParse({
        firstName: 'Siddharth',
        lastName: 'Ranganathan',
        email: 'siddharth@example.com',
        currentAddress: {
          line1: 'No. 56, Anna Nagar',
          city: 'Chennai',
          state: 'Tamil Nadu',
          country: 'India',
          pincode: '630302',
        },
        educationalDetails: {
          highestQualification: 'B.E / B.Tech',
          degreeName: 'B.Tech Civil Engineering',
          specialization: 'Civil Engineering',
          university: 'Anna University',
          yearOfPassing: '2023',
          gradePercentage: '78.5',
        },
        experienceDetails: {
          experienceType: 'Experienced',
          totalExperience: '2.5',
          previousCompany: 'L&T Construction',
          previousDesignation: 'Project Engineer',
          previousDepartment: 'Engineering',
          lastDrawnSalary: '25000',
        },
        bankDetails: {
          bankName: 'State Bank of India',
          accountNumber: '001234567890',
          ifscCode: 'SBIN0001234',
        },
        salaryDetails: {
          panNumber: 'ABCDE1234F',
          uanNumber: '101234567890',
        },
      });
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // 15. EMPLOYEE EMAIL VALIDATION (format, lowercase conversion, no spaces)
  // ============================================================================
  describe('Employee Email Validation', () => {
    it('accepts valid email format', () => {
      const validEmails = ['arun@company.com', 'hr@businz.com', 'john.doe@domain.co.in', 'emp123@vrm.org'];
      for (const email of validEmails) {
        const result = employeeEmailSchema.safeParse(email);
        expect(result.success, `Expected email "${email}" to be accepted`).toBe(true);
        if (result.success) {
          expect(result.data).toBe(email);
        }
      }
    });

    it('automatically converts uppercase letters to lowercase', () => {
      const upperEmails = [
        { input: 'Arun@Company.COM', expected: 'arun@company.com' },
        { input: 'EMPLOYEE@COMPANY.COM', expected: 'employee@company.com' },
        { input: 'HR@Businz.Com', expected: 'hr@businz.com' },
      ];
      for (const { input, expected } of upperEmails) {
        const result = employeeEmailSchema.safeParse(input);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toBe(expected);
        }
      }
    });

    it('automatically removes leading and trailing spaces', () => {
      const result = employeeEmailSchema.safeParse('   arun@company.com   ');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('arun@company.com');
      }
    });

    it('rejects email with spaces inside', () => {
      const invalidWithSpaces = ['ar un@company.com', 'arun @company.com', 'arun@ company.com', 'arun@company .com'];
      for (const email of invalidWithSpaces) {
        const result = employeeEmailSchema.safeParse(email);
        expect(result.success, `Expected email "${email}" to be rejected`).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Please enter a valid email ID.');
        }
      }
    });

    it('rejects invalid email formats with "Please enter a valid email ID."', () => {
      const invalidEmails = ['invalid-email', 'arun@', '@company.com', 'arun@company', 'arun@.com'];
      for (const email of invalidEmails) {
        const result = employeeEmailSchema.safeParse(email);
        expect(result.success, `Expected email "${email}" to be rejected`).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Please enter a valid email ID.');
        }
      }
    });

    it('rejects empty email with "Email ID is required."', () => {
      const result = employeeEmailSchema.safeParse('');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Email ID is required.');
      }
    });

    it('normalizes email in createEmployeeSchema automatically', () => {
      const payload = {
        firstName: 'Vijay',
        lastName: 'Kumar',
        email: '  VIJAY@Company.COM  ',
        basicSalary: 25000,
      };
      const result = createEmployeeSchema.safeParse(payload);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.email).toBe('vijay@company.com');
      }
    });
  });
});
