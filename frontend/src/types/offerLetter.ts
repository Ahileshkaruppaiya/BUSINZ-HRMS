export interface OfferLetterTemplate {
  id: string;
  name: string;
  category: 'Full-Time' | 'Engineering' | 'Executive' | 'Internship' | 'Remote';
  badgeColor: string;
  description: string;
  subject: string;
  content: string;
}

export interface OfferLetterPlaceholder {
  key: string;
  label: string;
  example: string;
}

export const OFFER_LETTER_PLACEHOLDERS: OfferLetterPlaceholder[] = [
  { key: '{{candidate_name}}', label: 'Candidate Full Name', example: 'Alex Morgan' },
  { key: '{{employee_id}}', label: 'Employee ID', example: 'EMP-009' },
  { key: '{{designation}}', label: 'Job Title / Designation', example: 'Senior Software Engineer' },
  { key: '{{department}}', label: 'Department', example: 'Engineering' },
  { key: '{{joining_date}}', label: 'Date of Joining', example: '2026-09-15' },
  { key: '{{employment_type}}', label: 'Employment Type', example: 'Full-Time' },
  { key: '{{reporting_manager}}', label: 'Reporting Manager', example: 'Sarah Jenkins' },
  { key: '{{basic_salary}}', label: 'Monthly Basic Salary', example: '₹65,000' },
  { key: '{{monthly_gross}}', label: 'Monthly Gross Salary', example: '₹85,000' },
  { key: '{{annual_ctc}}', label: 'Annual CTC', example: '₹10,20,000' },
  { key: '{{work_location}}', label: 'Office Location / Branch', example: 'Kolkata Sector V' },
  { key: '{{company_name}}', label: 'Company Name', example: 'Businz Technologies Pvt. Ltd.' },
  { key: '{{issue_date}}', label: 'Letter Issue Date', example: '2026-09-02' }
];
