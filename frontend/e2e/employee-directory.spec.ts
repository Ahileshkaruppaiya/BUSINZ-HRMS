import { expect, test } from '@playwright/test';

test('employee directory has employee ID search and add employee button in the filter card', async ({ page }) => {
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

  // 2. Wait for layout & hover sidebar to expand
  const sidebar = page.locator('aside.hrms-sidebar');
  await expect(sidebar).toBeVisible({ timeout: 15000 });
  await sidebar.hover();

  // 3. Navigate to Employee Directory
  const navItem = sidebar.locator('a').filter({ hasText: /Employee Directory/i }).first();
  await expect(navItem).toBeVisible({ timeout: 10000 });
  await navItem.click();

  // 4. Verify search input in filter bar is visible
  const searchInput = page.locator('#employee-search-input');
  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await expect(searchInput).toHaveAttribute('placeholder', /Search by Employee ID/i);

  // 5. Verify top Add Employee button is visible and bottom duplicate is removed
  const addBtn = page.locator('#add-employee-btn');
  await expect(addBtn).toBeVisible();
  await expect(addBtn).toHaveText(/Add Employee/i);
  await expect(page.locator('#add-employee-filter-btn')).toHaveCount(0);

  // 6. Test typing in Search by ID
  await page.screenshot({ path: 'C:/Users/ahile/.gemini/antigravity-ide/brain/5f776869-da22-4c1b-ae50-9c7267dd7d95/single_add_employee_btn.png' });
  await searchInput.fill('EMP-001');
  await page.waitForTimeout(300);

  // 7. Click Add Employee button and verify wizard opens
  await addBtn.click();
  await expect(page.getByRole('heading', { name: /add new employee/i })).toBeVisible({ timeout: 5000 });

  expect(pageErrors, `Browser runtime errors:\n${pageErrors.join('\n')}`).toEqual([]);
});
