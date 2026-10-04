import { expect, test } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Company Details - 2MB File Upload Verification', () => {

  test('Company Logo, Signature, and Stamp support file upload with 2MB limit and no URL inputs', async ({ page }) => {
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

    // Wait for settings page and click the Company Details card
    const companyDetailsCard = page.locator('h3:has-text("Company Details")');
    await expect(companyDetailsCard).toBeVisible({ timeout: 10000 });
    await companyDetailsCard.click();

    // 3. Verify URL inputs are GONE and file upload fields exist
    await expect(page.locator('input[placeholder*="https://example.com/logo.png"]')).toHaveCount(0);
    await expect(page.locator('input[placeholder*="https://example.com/signature.png"]')).toHaveCount(0);
    await expect(page.locator('input[placeholder*="https://example.com/stamp.png"]')).toHaveCount(0);

    // Verify File Upload components are present
    const logoSection = page.locator('text=Company Logo').first();
    await expect(logoSection).toBeVisible();

    const signatureSection = page.locator('text=Authorized Signature Image').first();
    await expect(signatureSection).toBeVisible();

    const stampSection = page.locator('text=Company Stamp Image').first();
    await expect(stampSection).toBeVisible();

    // 4. Create a dummy test image under 2MB
    const tempDir = path.join(process.cwd(), 'e2e', 'test-assets');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    const validImagePath = path.join(tempDir, 'valid_logo.png');
    // 1x1 transparent PNG buffer
    const pngBuffer = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
    fs.writeFileSync(validImagePath, pngBuffer);

    // Create an oversized file > 2MB (2.5MB)
    const oversizedImagePath = path.join(tempDir, 'oversized.png');
    const largeBuffer = Buffer.alloc(2.5 * 1024 * 1024, 0);
    fs.writeFileSync(oversizedImagePath, largeBuffer);

    // Find hidden file inputs (there are 3: logo, signature, stamp)
    const fileInputs = page.locator('input[type="file"][accept*="image"]');
    const count = await fileInputs.count();
    expect(count).toBeGreaterThanOrEqual(3);

    // 5. Test 2MB limit rejection on Logo upload
    await fileInputs.first().setInputFiles(oversizedImagePath);
    await expect(page.locator('text=File size exceeds 2MB limit')).toBeVisible({ timeout: 5000 });

    // 6. Test valid upload under 2MB
    await fileInputs.first().setInputFiles(validImagePath);
    await expect(page.locator('text=Image Selected').first()).toBeVisible({ timeout: 5000 });

    // Clean up temporary files
    try {
      fs.unlinkSync(validImagePath);
      fs.unlinkSync(oversizedImagePath);
      fs.rmdirSync(tempDir);
    } catch {}
  });

});
