import { expect, test } from '@playwright/test';

test('login validation, authenticated navigation, and controls work', async ({ page }) => {
  const pageErrors: string[] = [];
  const failedRequests: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('requestfailed', request => failedRequests.push(`${request.method()} ${request.url()}: ${request.failure()?.errorText}`));

  await page.goto('/');
  const identifier = page.getByLabel('User ID / Email');
  const password = page.getByLabel('Password', { exact: true });
  const signIn = page.getByRole('button', { name: /^sign in$/i });

  await expect(identifier).toBeVisible();
  await signIn.click();
  expect(await identifier.evaluate(element => (element as HTMLInputElement).checkValidity())).toBe(false);

  await identifier.fill('hr@vrmstructures.com');
  await password.fill('WrongPassword999');
  await signIn.click();
  await expect(page.getByText(/invalid|incorrect/i)).toBeVisible();

  await password.fill('Password@123');
  await signIn.click();
  await expect(page.locator('aside.hrms-sidebar')).toBeVisible();
  await expect(page.getByText('Dashboard', { exact: true }).first()).toBeVisible();

  const modules = [
    'Employee Directory',
    'Live Face Attendance',
    'Attendance Management',
    'Leave Management',
    'Shift Management',
    'Tasks',
    'Tracking',
    'Performance',
    'Recruitment',
    'Finance & Expenses',
    'Payroll',
    'Advance Salary Management',
    'Asset Management',
    'Settings',
    'Dashboard',
  ];

  for (const moduleName of modules) {
    const item = page.locator('aside.hrms-sidebar').getByText(moduleName, { exact: true });
    if (await item.count()) {
      await item.first().click();
      await page.waitForTimeout(120);
      await expect(page.locator('main')).toBeVisible();
    }
  }

  const notificationButton = page.getByRole('button', { name: /notification/i }).first();
  if (await notificationButton.count()) {
    await notificationButton.click();
    await page.waitForTimeout(100);
  }

  expect(pageErrors, `Browser runtime errors:\n${pageErrors.join('\n')}`).toEqual([]);
  expect(
    failedRequests.filter(line => !line.includes('favicon')),
    `Failed network requests:\n${failedRequests.join('\n')}`,
  ).toEqual([]);
});
