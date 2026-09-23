import { z } from 'zod';

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'firstName is required'),
  lastName: z.string().optional().default(''),
  email: z.string().email('Invalid email address format'),
  department: z.string().optional().default('General'),
  designation: z.string().optional().default('Staff'),
  basicSalary: z.number().positive().optional().default(15000),
  grossSalary: z.number().positive().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  employeeId: z.string().optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  department: z.string().optional(),
  designation: z.string().optional(),
  basicSalary: z.number().positive().optional(),
  grossSalary: z.number().positive().optional(),
  bankName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  employeeId: z.string().optional(),
});
