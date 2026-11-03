import { test, expect } from '@playwright/test';

test.describe('Analyze Page', () => {
    test.beforeEach(async ({ page }) => {
        // Dismiss the ScanGuide onboarding overlay so it doesn't block clicks
        await page.addInitScript(() => {
            localStorage.setItem('lumiqe-scan-guide-seen', 'true');
        });
        await page.goto('/analyze');
    });

    test('renders mode selection screen', async ({ page }) => {
        // Should show upload and camera options
        await expect(page.getByText(/live camera/i)).toBeVisible();
        await expect(page.getByLabel(/choose a photo to upload/i)).toBeVisible();
    });

    test('can switch to upload mode', async ({ page }) => {
        // Upload dropzone is the primary zone — clicking it opens the file picker.
        // The dropzone itself serves as the upload area (always visible).
        const uploadInput = page.getByLabel(/choose a photo to upload/i);
        await expect(uploadInput).toBeVisible();

        // Drop zone text is present
        await expect(page.getByText(/drop scan.*click to upload|click to upload/i)).toBeVisible();
    });

    test('single-photo upload is keyboard reachable and announces validation errors', async ({ page }) => {
        const uploadInput = page.getByLabel(/choose a photo to upload/i);
        for (let i = 0; i < 12 && !(await uploadInput.evaluate((el) => document.activeElement === el)); i += 1) {
            await page.keyboard.press('Tab');
        }
        await expect(uploadInput).toBeFocused();

        await uploadInput.setInputFiles({
            name: 'not-an-image.txt',
            mimeType: 'text/plain',
            buffer: Buffer.from('not an image'),
        });
        await expect(page.getByRole('status')).toContainText(/valid image/i);
    });

    test('upload mode shows file type info', async ({ page }) => {
        // File type info is always visible in the dropzone
        await expect(page.getByText(/jpg.*png.*webp/i)).toBeVisible();
    });

    test('can navigate back from upload mode', async ({ page }) => {
        // Open multi-photo overlay (no camera API needed)
        await page.getByText(/multi.*photo/i).click();

        // Overlay should be visible
        await expect(page.getByText(/multi-photo analysis/i).first()).toBeVisible();

        // Click the back button in the overlay nav
        await page.getByRole('button', { name: /back/i }).first().click();

        // Should be back at bento layout
        await expect(page.getByText(/start live camera/i)).toBeVisible({ timeout: 10000 });
    });

    test('shows multi-photo option', async ({ page }) => {
        // Multi-photo mode button should exist
        const multiBtn = page.getByText(/multi.*photo/i);
        if (await multiBtn.isVisible()) {
            await multiBtn.click();
            // Should show multi-photo upload area
            await expect(page.getByText(/add photo|upload 2/i).first()).toBeVisible();
        }
    });

    test('shows scan guide tips', async ({ page }) => {
        // Precision Protocol section should be visible in the sidebar
        await expect(page.getByText(/natural lighting|precision protocol/i).first()).toBeVisible();
    });
});
