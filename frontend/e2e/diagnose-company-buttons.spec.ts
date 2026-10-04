import { test, expect } from '@playwright/test';

test('Verify Company Details action buttons (Save, Clear with Confirmation, Reset)', async ({ page }) => {
  // 1. Authenticate as Super Admin
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

  // 2. Navigate to Settings
  const sidebar = page.locator('aside.hrms-sidebar');
  await expect(sidebar).toBeVisible({ timeout: 15000 });
  await sidebar.hover();

  const settingsLink = sidebar.locator('a, button').filter({ hasText: /Settings/i }).first();
  await expect(settingsLink).toBeVisible();
  await settingsLink.click();

  // 3. Open Company Details
  const companyDetailsCard = page.locator('h3:has-text("Company Details")');
  await expect(companyDetailsCard).toBeVisible({ timeout: 10000 });
  await companyDetailsCard.click();

  // 4. Locate buttons
  const saveBtn = page.locator('#save-company-details-btn');
  const clearBtn = page.locator('#clear-company-details-btn');
  const resetBtn = page.locator('#reset-company-details-btn');

  await expect(saveBtn).toBeVisible({ timeout: 10000 });
  await expect(clearBtn).toBeVisible();
  await expect(resetBtn).toBeVisible();

  await saveBtn.scrollIntoViewIfNeeded();

  // TEST 1: Click Save Company Details
  await saveBtn.click();
  
  // Verify success banner appears right above the buttons
  const successAlert = page.locator('#company-info-success-alert');
  await expect(successAlert).toBeVisible({ timeout: 5000 });
  await expect(saveBtn).toContainText(/Saved Successfully/i);

  // Take screenshot of saved state
  await page.screenshot({ path: 'company_details_save_success.png' });

  // TEST 2: Click Clear Saved Details -> Confirmation Modal opens
  await clearBtn.click();
  const clearModal = page.locator('text=Clear Saved Company Details?');
  await expect(clearModal).toBeVisible();

  // Screenshot of clear confirmation modal
  await page.screenshot({ path: 'company_details_clear_modal.png' });

  // Confirm clear
  const confirmClearBtn = page.locator('#confirm-clear-company-btn');
  await confirmClearBtn.click();

  // Verify modal closes and clear notice alert appears
  await expect(clearModal).toBeHidden();
  const resetAlert = page.locator('#company-info-reset-alert');
  await expect(resetAlert).toBeVisible();
  await expect(resetAlert).toContainText(/All saved company details have been cleared/i);

  // Verify inputs are now actually empty
  const nameInput = page.locator('#company-name-input');
  await expect(nameInput).toHaveValue('');

  // Screenshot after clearing
  await page.screenshot({ path: 'company_details_cleared_empty.png' });

  // TEST 3: Click Reset Changes
  await resetBtn.click();
  await expect(resetAlert).toBeVisible();
  await expect(resetAlert).toContainText(/Changes reset/i);

  // Screenshot after reset
  await page.screenshot({ path: 'company_details_reset_notice.png' });
});
