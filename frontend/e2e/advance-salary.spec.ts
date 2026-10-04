import { expect, test } from '@playwright/test';

test('advance salary modal validates repayment period properly without false "please fill" error', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  // 1. Initialize authenticated session as Super Admin
  const user = {
    id: 'USR-001',
    name: 'Admin User',
    email: 'admin@businz.com',
    role: 'Super Admin',
    employeeId: 'EMP-000',
    department: 'Management',
    designation: 'CEO'
  };
  const token = 'vrm_session_' + Buffer.from(JSON.stringify(user)).toString('base64');
  await page.addInitScript(({ token, user }) => {
    localStorage.setItem('vrm_auth_token', token);
    localStorage.setItem('vrm_hrms_current_user', JSON.stringify(user));
  }, { token, user });

  await page.goto('/');

  // 2. Wait for main layout & hover sidebar to expand
  const sidebar = page.locator('aside.hrms-sidebar');
  await expect(sidebar).toBeVisible({ timeout: 15000 });
  await sidebar.hover();

  // 3. Navigate to Advance Salary Management
  const navItem = sidebar.locator('a').filter({ hasText: /Advance Salary/i }).first();
  await expect(navItem).toBeVisible({ timeout: 10000 });
  await navItem.click();

  // 4. Click 'Request Advance Salary' button
  const requestBtn = page.getByRole('button', { name: /request advance salary/i }).first();
  await expect(requestBtn).toBeVisible();
  await requestBtn.click();

  // 5. Verify Modal opens
  const modal = page.locator('.modal-content');
  await expect(modal).toBeVisible();
  await expect(modal.getByRole('heading', { name: /request advance salary/i })).toBeVisible();

  // 6. Check Allowed range text (Must NOT be "-3 mos" or "–3 mos" without min)
  const allowedText = modal.locator('text=/Allowed:\\s*\\d+–\\d+\\s*mos/i');
  await expect(allowedText).toBeVisible();

  // 7. Verify Repayment Period input is pre-filled and valid
  const repaymentInput = page.locator('#repayment-period-months');
  await expect(repaymentInput).toBeVisible();
  
  const initialVal = await repaymentInput.inputValue();
  expect(Number(initialVal)).toBeGreaterThan(0);

  // 8. Test clearing the field and typing '2'
  await repaymentInput.click();
  await repaymentInput.fill('');
  await repaymentInput.fill('2');
  expect(await repaymentInput.inputValue()).toBe('2');

  // 9. Blur and verify it does NOT become NaN or empty
  await repaymentInput.blur();
  expect(await repaymentInput.inputValue()).toBe('2');

  // Verify HTML5 validity
  const isValid = await repaymentInput.evaluate((el: HTMLInputElement) => el.checkValidity());
  expect(isValid).toBe(true);

  // 10. Click Submit button
  const submitBtn = modal.getByRole('button', { name: /submit advance salary request/i });
  await expect(submitBtn).toBeVisible();
  await submitBtn.click();

  // 11. Verify modal closes or success message appears
  await expect(modal).not.toBeVisible({ timeout: 5000 });

  expect(pageErrors, `Browser runtime errors:\n${pageErrors.join('\n')}`).toEqual([]);
});
