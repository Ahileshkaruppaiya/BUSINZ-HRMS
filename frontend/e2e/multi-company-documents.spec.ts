import { expect, test } from '@playwright/test';

test.describe('BUSINZ HRMS - Dynamic Multi-Company Offer Letter & Payslip Verification', () => {

  test('Company A (Businz): Offer Letter & Payslip dynamically load Company A branding, signatory, and payroll lines', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    // 1. Authenticate session as Company A Administrator
    const companyAUser = {
      id: 'USR-001',
      name: 'Businz Super Admin',
      email: 'admin@businz.com',
      role: 'Super Admin',
      employeeId: 'EMP-000',
      department: 'Management',
      designation: 'CEO',
      company_id: 'company-a',
      companyId: 'company-a'
    };
    const tokenA = 'vrm_session_' + Buffer.from(JSON.stringify(companyAUser)).toString('base64');
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('vrm_auth_token', token);
      localStorage.setItem('vrm_hrms_current_user', JSON.stringify(user));
    }, { token: tokenA, user: companyAUser });

    await page.goto('/');

    const sidebar = page.locator('aside.hrms-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 15000 });
    await sidebar.hover();

    // 2. Navigate to Employee Directory
    const empNavLink = sidebar.locator('a').filter({ hasText: /Employee Directory/i }).first();
    await expect(empNavLink).toBeVisible({ timeout: 10000 });
    await empNavLink.click();

    // Verify Employee Directory loaded
    const empTable = page.locator('table, .employee-table, .employee-grid').first();
    await expect(empTable).toBeVisible({ timeout: 10000 });

    // Look for Offer Letter trigger button
    const offerLetterBtn = page.locator('button[title*="Offer" i], button[aria-label*="Offer" i], button:has-text("Offer")').first();
    await expect(offerLetterBtn).toBeVisible({ timeout: 10000 });
    await offerLetterBtn.click();


    // 3. Verify Offer Letter Modal loaded with Company A branding
    const printableLetter = page.locator('#printable-offer-letter');
    await expect(printableLetter).toBeVisible({ timeout: 10000 });

    // Check Company A Details in Offer Letter
    await expect(printableLetter).toContainText('Businz Technologies');
    await expect(printableLetter).toContainText('Chennai');
    await expect(printableLetter).toContainText('Velmurukan P');
    await expect(printableLetter).toContainText('Chief Executive Officer');

    // Check Print and Download buttons
    const printBtn = page.locator('button').filter({ hasText: /Print/i }).first();
    await expect(printBtn).toBeVisible();
    const downloadPdfBtn = page.locator('button').filter({ hasText: /Download PDF/i }).first();
    await expect(downloadPdfBtn).toBeVisible();

    // Close Offer Letter Modal
    const closeBtn = page.locator('.modal-header button, .modal-content button').filter({ has: page.locator('svg') }).first();
    await closeBtn.click();

    // 4. Navigate to Payroll Management
    await sidebar.hover();
    const payrollNavLink = sidebar.locator('a').filter({ hasText: /Payroll/i }).first();
    await expect(payrollNavLink).toBeVisible({ timeout: 10000 });
    await payrollNavLink.click();

    // 5. Open Payslip Modal for first record
    const viewPayslipBtn = page.locator('button[title*="Payslip" i], button:has-text("Payslip"), button:has-text("View")').first();
    await expect(viewPayslipBtn).toBeVisible({ timeout: 10000 });
    await viewPayslipBtn.click();

    // Verify Payslip Modal
    const printablePayslip = page.locator('#printable-payslip-content');
    await expect(printablePayslip).toBeVisible({ timeout: 10000 });

    // Check Company A Details in Payslip
    await expect(printablePayslip).toContainText('Businz Technologies');
    await expect(printablePayslip).toContainText('Velmurukan P');

    // Verify dynamic earnings & deductions rendered without re-calculation
    await expect(printablePayslip.locator('.document-table, table').first()).toBeVisible();
    await expect(printablePayslip).toContainText('Basic Salary');
    const payslipTextA = await printablePayslip.textContent();
    expect(payslipTextA).toMatch(/Allowances|House Rent|Statutory|Total Deductions/i);
    await expect(printablePayslip).toContainText('NET PAY');


    // Check Print & PDF Download buttons exist on Payslip modal
    const payslipPrintBtn = page.locator('.modal-content button').filter({ hasText: /Print/i }).first();
    await expect(payslipPrintBtn).toBeVisible();
    const payslipPdfBtn = page.locator('.modal-content button').filter({ hasText: /Download PDF/i }).first();
    await expect(payslipPdfBtn).toBeVisible();

    expect(pageErrors, `Browser runtime errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });

  test('Company B (Nexus Industrial Solutions): Dynamically loads Nexus branding, signatory, and isolated employees', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', error => pageErrors.push(error.message));

    // 1. Authenticate session as Company B Administrator
    const companyBUser = {
      id: 'USR-B001',
      name: 'Nexus Administrator',
      email: 'admin@nexus-solutions.com',
      role: 'Super Admin',
      employeeId: 'EMP-B001',
      department: 'Operations',
      designation: 'VP Operations',
      company_id: 'company-b',
      companyId: 'company-b'
    };
    const tokenB = 'vrm_session_' + Buffer.from(JSON.stringify(companyBUser)).toString('base64');
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('vrm_auth_token', token);
      localStorage.setItem('vrm_hrms_current_user', JSON.stringify(user));
    }, { token: tokenB, user: companyBUser });

    await page.goto('/');

    const sidebar = page.locator('aside.hrms-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 15000 });
    await sidebar.hover();

    // 2. Navigate to Employee Directory
    const empNavLink = sidebar.locator('a').filter({ hasText: /Employee Directory/i }).first();
    await expect(empNavLink).toBeVisible({ timeout: 10000 });
    await empNavLink.click();

    // 3. Verify Multi-Company Isolation: Company B employees visible, Company A employees NOT visible
    const pageContent = await page.textContent('body');
    expect(pageContent).toContain('Vikram Malhotra');
    expect(pageContent).toContain('EMP-B101');
    expect(pageContent).not.toContain('Ajith Kumar'); // Company A employee must NOT be shown

    // 4. Open Offer Letter Modal for Company B employee
    const offerLetterBtn = page.locator('button[title*="Offer" i], button[aria-label*="Offer" i], button:has-text("Offer")').first();
    await expect(offerLetterBtn).toBeVisible({ timeout: 10000 });
    await offerLetterBtn.click();

    // Verify Offer Letter Modal loaded with Company B branding
    const printableLetter = page.locator('#printable-offer-letter');
    await expect(printableLetter).toBeVisible({ timeout: 10000 });

    // Verify Company B dynamic details
    await expect(printableLetter).toContainText('Nexus Industrial Solutions');
    await expect(printableLetter).toContainText('Noida');
    await expect(printableLetter).toContainText('Ananya Deshmukh');
    await expect(printableLetter).toContainText('Vice President — Human Resources');

    // Close Offer Letter Modal
    const closeBtn = page.locator('.modal-header button, .modal-content button').filter({ has: page.locator('svg') }).first();
    await closeBtn.click();

    // 5. Navigate to Payroll Management
    await sidebar.hover();
    const payrollNavLink = sidebar.locator('a').filter({ hasText: /Payroll/i }).first();
    await expect(payrollNavLink).toBeVisible({ timeout: 10000 });
    await payrollNavLink.click();

    // 6. Verify Company B payroll records & open Payslip
    const viewPayslipBtn = page.locator('button[title*="Payslip" i], button:has-text("Payslip"), button:has-text("View")').first();
    await expect(viewPayslipBtn).toBeVisible({ timeout: 10000 });
    await viewPayslipBtn.click();

    // Verify Payslip Modal
    const printablePayslip = page.locator('#printable-payslip-content');
    await expect(printablePayslip).toBeVisible({ timeout: 10000 });

    // Verify Company B branding in Payslip
    await expect(printablePayslip).toContainText('Nexus Industrial Solutions');
    await expect(printablePayslip).toContainText('Ananya Deshmukh');
    await expect(printablePayslip).toContainText('Vice President — Human Resources');

    // Verify Company B dynamic payroll component (e.g. Special Allowance or Quality Incentive)
    const payslipText = await printablePayslip.textContent();
    expect(payslipText).toMatch(/Special Allowance|Quality Incentive|Robotics/i);

    expect(pageErrors, `Browser runtime errors:\n${pageErrors.join('\n')}`).toEqual([]);
  });

});
