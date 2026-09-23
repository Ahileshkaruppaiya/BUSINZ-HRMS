import { OfferLetterTemplate } from '../types/offerLetter';

export const INITIAL_OFFER_LETTER_TEMPLATES: OfferLetterTemplate[] = [
  {
    id: 'TPL-FT-01',
    name: 'Standard Corporate Full-Time Offer',
    category: 'Full-Time',
    badgeColor: '#155DFC',
    description: 'Comprehensive employment agreement suitable for general business, sales, finance, and operations roles.',
    subject: 'Offer of Employment — {{designation}} at {{company_name}}',
    content: `Dear {{candidate_name}},

On behalf of {{company_name}}, we are pleased to extend an offer of employment for the position of {{designation}} in the {{department}} Department, reporting directly to {{reporting_manager}}.

1. APPOINTMENT & COMMENCEMENT
Your employment will commence on {{joining_date}}. You will be based out of our {{work_location}} office under {{employment_type}} status.

2. COMPENSATION & EMOLUMENTS
Your Total Cost to Company (CTC) will be {{annual_ctc}} per annum, with a monthly gross entitlement of {{monthly_gross}} (Basic Salary: {{basic_salary}} plus applicable allowances such as HRA, Medical, and Transport as per company policy). Statutory deductions including Provident Fund and Professional Tax will apply as mandated by law.

3. PROBATION & CONFIRMATION
You will be placed on probation for an initial period of three (3) months from your Date of Joining. Upon satisfactory evaluation of your performance, your employment will be confirmed in writing.

4. WORKING HOURS & CODE OF CONDUCT
Official business hours are Monday through Friday, 09:30 AM to 06:30 PM. You are expected to observe professional punctuality, uphold corporate governance, and adhere to the employee code of conduct.

5. NOTICE PERIOD & SEPARATION
During probation, either party may terminate this engagement by serving fifteen (15) days written notice. Post confirmation, the required notice period shall be thirty (30) days or basic salary in lieu thereof.

Please sign and return the duplicate copy of this letter within five (5) business days to signify your acceptance of this offer.

We welcome you to the {{company_name}} family and look forward to a mutually fulfilling career journey!

Sincerely,
Authorized Signatory
Human Resources Department
{{company_name}}`
  },
  {
    id: 'TPL-TECH-02',
    name: 'Software Engineer & Tech Professional Offer',
    category: 'Engineering',
    badgeColor: '#7c3aed',
    description: 'Technical employment agreement including IP assignment, equipment allocation, security compliance, and tech stack details.',
    subject: 'Job Offer: {{designation}} — Technology & Product Team',
    content: `Dear {{candidate_name}},

We are thrilled to offer you the position of {{designation}} within our {{department}} Engineering team at {{company_name}}! We were deeply impressed with your technical acumen, problem-solving skills, and architectural depth.

1. ROLE & REPORTING
You will report to {{reporting_manager}} and collaborate cross-functionally with Product, QA, and DevOps teams. Your official date of joining will be {{joining_date}} at {{work_location}}.

2. REMUNERATION PACKAGE
Your annual compensation package is structured as follows:
- Annual Fixed CTC: {{annual_ctc}}
- Monthly Gross Remuneration: {{monthly_gross}}
- Monthly Basic Pay: {{basic_salary}}
- Performance-linked incentives & annual technology appraisal based on engineering milestones.

3. INTELLECTUAL PROPERTY & DATA PRIVACY
All software code, algorithms, system architecture, designs, and innovations developed during your tenure remain the exclusive intellectual property of {{company_name}}. Strict compliance with ISO/IEC 27001 data security guidelines and proprietary confidentiality is required.

4. HARDWARE & DEVELOPMENT TOOLING
The organization will furnish a high-performance workstation (Apple MacBook Pro / Dell Precision), dual monitors, corporate software licenses, and access to cloud infrastructure to facilitate your engineering responsibilities.

5. PROBATION & NOTICE PERIOD
A three (3) month probation applies. The standard notice period post confirmation is sixty (60) days to ensure seamless knowledge transfer and release management.

We are excited about the prospect of building scalable next-generation systems together. Welcome aboard!

Warm regards,
Head of Technology & Talent Acquisition
{{company_name}}`
  },
  {
    id: 'TPL-EXEC-03',
    name: 'Executive Leadership & Senior Management Offer',
    category: 'Executive',
    badgeColor: '#d97706',
    description: 'Executive contract tailored for Directors, VPs, and Department Heads featuring strategic milestones, executive perks, and confidentiality.',
    subject: 'Executive Appointment: {{designation}} — {{company_name}}',
    content: `Dear {{candidate_name}},

The Board of Directors and Executive Committee of {{company_name}} take immense pleasure in appointing you to the executive leadership role of {{designation}} leading the {{department}} organization.

1. EXECUTIVE APPOINTMENT & EFFECTIVE DATE
Your leadership appointment takes effect on {{joining_date}}. In this role, you will be stationed at {{work_location}} and will report to {{reporting_manager}} (Board of Management).

2. EXECUTIVE REMUNERATION & PERQUISITES
- Annual Guaranteed CTC: {{annual_ctc}}
- Monthly Entitlement: {{monthly_gross}} (Basic Salary: {{basic_salary}})
- Executive Health Cover for self and family (₹15,00,000 corporate policy)
- Annual Executive Performance Incentive based on key corporate business metrics and EBITDA targets.

3. STRATEGIC RESPONSIBILITIES
You will exercise leadership over departmental strategy, budget allocation, headcount growth, operational efficiency, and board compliance.

4. NON-COMPETE & CONFIDENTIALITY
You agree that for a period of twelve (12) months following separation, you shall not directly engage with or solicit clients, suppliers, or strategic personnel of {{company_name}}.

5. NOTICE PERIOD
Due to the strategic importance of this executive position, the separation notice period is ninety (90) days from either party.

We eagerly anticipate your transformative vision in steering {{company_name}} toward greater heights.

On behalf of the Board,
Chief Executive Officer & Board Director
{{company_name}}`
  },
  {
    id: 'TPL-INT-04',
    name: 'Graduate Trainee & Internship Offer',
    category: 'Internship',
    badgeColor: '#059669',
    description: 'Structured internship offer with monthly stipend, mentorship pairing, and evaluation criteria for full-time conversion.',
    subject: 'Internship Offer Letter — {{designation}} ({{department}})',
    content: `Dear {{candidate_name}},

Congratulations! Following your recent interview and technical assessment, we are delighted to offer you an Internship as {{designation}} in the {{department}} Department at {{company_name}}.

1. INTERNSHIP DURATION & SCHEDULE
Your internship begins on {{joining_date}} for an initial period of six (6) months. You will be mentored directly by {{reporting_manager}} at {{work_location}}.

2. MONTHLY STIPEND
During your internship, you will receive an all-inclusive consolidated monthly stipend of {{basic_salary}} (Total CTC equivalent {{annual_ctc}}), disbursed on the last working day of each calendar month.

3. LEARNING OBJECTIVES & MENTORSHIP
You will be assigned a dedicated senior mentor, participate in live enterprise sprints, and receive continuous weekly feedback on software engineering, product workflows, and corporate practices.

4. FULL-TIME CONVERSION POTENTIAL
Subject to high performance, positive peer feedback, and organizational headcount availability at the completion of your term, you may be extended an offer for regular full-time employment as an Associate.

5. CONFIDENTIALITY
As an intern, you will handle proprietary information and must maintain strict confidentiality regarding all company assets and data.

Please sign this letter to confirm your enthusiasm to begin your professional journey with us!

Sincerely,
Campus Relations & Talent Development
{{company_name}}`
  },
  {
    id: 'TPL-REM-05',
    name: 'Remote & Hybrid Workforce Offer Letter',
    category: 'Remote',
    badgeColor: '#0284c7',
    description: 'Work-from-anywhere agreement outlining home office setup allowances, communication SLA, and remote security protocols.',
    subject: 'Remote Employment Offer: {{designation}} — {{company_name}}',
    content: `Dear {{candidate_name}},

We are excited to welcome you to the distributed workforce of {{company_name}} as {{designation}} within the {{department}} team, operating under our flexible Remote Work policy.

1. VIRTUAL COMMENCEMENT & REPORTING
Your remote employment starts on {{joining_date}}. While your geographic location is recorded as {{work_location}}, your daily reporting will be conducted virtually with {{reporting_manager}} via Slack, Zoom, and Jira.

2. COMPENSATION & HOME OFFICE ALLOWANCE
- Total Annual CTC: {{annual_ctc}}
- Monthly Gross Pay: {{monthly_gross}}
- Basic Pay: {{basic_salary}}
- In addition, you will receive a monthly High-Speed Internet & Workspace Reimbursement of ₹3,500 and a one-time Home Office Setup Grant of ₹25,000.

3. CORE HOURS & SYNCHRONIZATION
To ensure smooth collaboration with our global teams, you are expected to maintain core availability between 10:00 AM and 05:00 PM IST, participate in daily standups, and maintain active status on company communication channels.

4. INFORMATION SECURITY IN REMOTE WORK
You will be provided with a secure VPN profile, encrypted hardware, and multi-factor authentication. Connecting company systems to unsecured public Wi-Fi networks without VPN is strictly prohibited.

5. PROBATION & NOTICE
A standard three (3) month probation applies. The mutual notice period is thirty (30) days.

We take pride in fostering a high-trust, asynchronous, and productive remote environment. Welcome to the team!

Warm regards,
Head of People Operations
{{company_name}}`
  }
];
