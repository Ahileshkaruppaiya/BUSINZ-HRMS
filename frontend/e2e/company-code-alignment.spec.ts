import { expect, test } from '@playwright/test';

test.describe('BUSINZ HRMS - Company Code & Form Alignment Verification', () => {

  test('Company Code configuration dynamically sets Employee ID prefix and form alignment is clean', async ({ page }) => {
    test.setTimeout(60000);
    // 1. Authenticate session as Admin
    const adminUser = {
      id: 'USR-001',
      name: 'Businz Super Admin',
      email: 'admin@businz.com',
      role: 'Super Admin',
      employeeId: 'EMP-000',
      company_id: 'company-a',
      companyId: 'company-a'
    };
    const token = 'vrm_session_' + Buffer.from(JSON.stringify(adminUser)).toString('base64');
    await page.addInitScript(({ token, user }) => {
      localStorage.setItem('vrm_auth_token', token);
      localStorage.setItem('vrm_hrms_current_user', JSON.stringify(user));
    }, { token, user: adminUser });

    await page.goto('/');

    const sidebar = page.locator('aside.hrms-sidebar');
    await expect(sidebar).toBeVisible({ timeout: 15000 });
    await sidebar.hover();

    // 2. Navigate to Settings -> Company Details
    const settingsLink = sidebar.locator('a, button').filter({ hasText: /Settings/i }).first();
    await expect(settingsLink).toBeVisible({ timeout: 10000 });
    await settingsLink.click();

    // Click Company Details card
    const companyCard = page.locator('h3:has-text("Company Details")');
    await expect(companyCard).toBeVisible({ timeout: 10000 });
    await companyCard.click();

    // 3. Verify clean sections and alignment
    await expect(page.locator('text=1. Legal & Brand Identity')).toBeVisible();
    await expect(page.locator('text=2. Statutory & Tax Registration')).toBeVisible();
    await expect(page.locator('text=3. Official Corporate Communications')).toBeVisible();
    await expect(page.locator('text=4. Office & Operating Addresses')).toBeVisible();
    await expect(page.locator('text=5. Executive Management & Signatories')).toBeVisible();
    await expect(page.locator('text=6. Official Branding & Media Assets')).toBeVisible();

    // 4. Verify Company Code field exists
    const companyCodeInput = page.locator('input[placeholder*="BUSINZ, HDFC, SBI, KVB"]');
    await expect(companyCodeInput).toBeVisible();

    // 5. Test changing company code to HDFC
    await companyCodeInput.fill('HDFC');
    const saveBtn = page.locator('button:has-text("Save Company Details")');
    await expect(saveBtn).toBeVisible();
    await saveBtn.click();

    // Check success alert
    await expect(page.locator('text=Company details saved')).toBeVisible({ timeout: 5000 });

    // 6. Navigate to Employee Directory
    await sidebar.hover();
    const empNavLink = sidebar.locator('a').filter({ hasText: /Employee Directory/i }).first();
    await expect(empNavLink).toBeVisible({ timeout: 10000 });
    await empNavLink.click();

    // 7. Click Add Employee
    const addEmpBtn = page.locator('button:has-text("Add Employee")').first();
    await expect(addEmpBtn).toBeVisible({ timeout: 10000 });
    await addEmpBtn.click();

    // 8. Verify the auto-generated Employee ID begins with HDFC-
    const empIdInput = page.getByPlaceholder(/Enter Employee ID/i);
    await expect(empIdInput).toBeVisible({ timeout: 10000 });
    const empIdValue = await empIdInput.inputValue();
    console.log('Generated Employee ID with HDFC company code:', empIdValue);
    expect(empIdValue).toBe('HDFC-001');

    // Close Add Employee modal
    const closeBtn = page.locator('button:has-text("Cancel & Exit")').first();
    await closeBtn.click();

    // 9. Now test changing company code to SBI
    await sidebar.hover();
    await settingsLink.click();
    await companyCard.click();

    await companyCodeInput.fill('SBI');
    await saveBtn.click();
    await expect(page.locator('text=Company details saved')).toBeVisible({ timeout: 5000 });

    // Navigate to Employee Directory -> Add Employee again
    await sidebar.hover();
    await empNavLink.click();
    await addEmpBtn.click();

    const empIdInputSbi = page.getByPlaceholder(/Enter Employee ID/i);
    await expect(empIdInputSbi).toBeVisible({ timeout: 10000 });
    const empIdSbiValue = await empIdInputSbi.inputValue();
    console.log('Generated Employee ID with SBI company code:', empIdSbiValue);
    expect(empIdSbiValue).toBe('SBI-001');

    // 10. Test KVB as requested by the user
    const closeBtn2 = page.locator('button:has-text("Cancel & Exit")').first();
    await closeBtn2.click();

    await sidebar.hover();
    await settingsLink.click();
    await companyCard.click();

    await companyCodeInput.fill('KVB');
    await saveBtn.click();
    await expect(page.locator('text=Company details saved')).toBeVisible({ timeout: 5000 });

    await sidebar.hover();
    await empNavLink.click();
    await addEmpBtn.click();

    const empIdInputKvb = page.getByPlaceholder(/Enter Employee ID/i);
    await expect(empIdInputKvb).toBeVisible({ timeout: 10000 });
    const empIdKvbValue = await empIdInputKvb.inputValue();
    console.log('Generated Employee ID with KVB company code:', empIdKvbValue);
    expect(empIdKvbValue).toBe('KVB-001');
  });

});
