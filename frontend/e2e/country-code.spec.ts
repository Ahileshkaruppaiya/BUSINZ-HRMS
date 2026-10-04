import { test, expect } from '@playwright/test';

test('Verify Country Code Dropdown with A to Z search and selection', async ({ page }) => {
  // 1. Authenticated session
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

  // 2. Open Employee Directory
  const sidebar = page.locator('aside.hrms-sidebar');
  await expect(sidebar).toBeVisible({ timeout: 15000 });
  await sidebar.hover();

  const navItem = sidebar.locator('a').filter({ hasText: /Employee Directory/i }).first();
  await expect(navItem).toBeVisible({ timeout: 10000 });
  await navItem.click();

  // 3. Click Add Employee button
  const addBtn = page.locator('#add-employee-btn');
  await expect(addBtn).toBeVisible({ timeout: 10000 });
  await addBtn.click();

  // 4. Wait for Add Employee wizard modal
  await expect(page.locator('text=1. Basic Personal Details')).toBeVisible({ timeout: 5000 });

  // 5. Locate the Country Code Dropdown Trigger button next to Mobile Number
  const countryTrigger = page.locator('.country-code-dropdown-wrapper button').first();
  await expect(countryTrigger).toBeVisible();
  await expect(countryTrigger).toContainText('+91');

  // 6. Click the trigger to open popover
  await countryTrigger.click();

  // 7. Verify the popover rendered with search input and A to Z header
  const searchInput = page.locator('input[placeholder*="Search country name or code"]');
  await expect(searchInput).toBeVisible();
  await expect(page.locator('text=All Countries (A to Z)')).toBeVisible();

  // 8. Screenshot of initial A to Z list
  await page.screenshot({ path: 'country_code_portal_open.png' });

  // 9. Search for "United"
  await searchInput.fill('United');
  await page.waitForTimeout(200);

  // 10. Screenshot of search results (United Arab Emirates, United Kingdom, United States)
  await page.screenshot({ path: 'country_code_search_united.png' });

  const usOption = page.locator('button[role="option"]:has-text("United States")');
  await expect(usOption).toBeVisible();

  // 11. Click United States
  await usOption.click();

  // 12. Popover should close and trigger should show +1
  await expect(searchInput).toBeHidden();
  await expect(countryTrigger).toContainText('+1');

  // 13. Mobile number placeholder should now say "Enter mobile number"
  const phoneInput = page.locator('input[placeholder="Enter mobile number"]');
  await expect(phoneInput).toBeVisible();

  // Screenshot after US selected
  await page.screenshot({ path: 'country_code_selected_us.png' });

  // 14. Re-open and search India
  await countryTrigger.click();
  await expect(searchInput).toBeVisible();
  await searchInput.fill('India');
  const indiaOption = page.locator('button[role="option"]:has-text("India")');
  await expect(indiaOption).toBeVisible();
  await indiaOption.click();

  // 15. Trigger should return to +91 and 10-digit placeholder
  await expect(countryTrigger).toContainText('+91');
  await expect(page.locator('input[placeholder="Enter 10-digit mobile number"]')).toBeVisible();

  // 16. Final screenshot
  await page.screenshot({ path: 'country_code_portal_verified.png' });
});
