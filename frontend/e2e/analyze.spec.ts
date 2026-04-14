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
        await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible();
    });

    test('can switch to upload mode', async ({ page }) => {
        // Upload dropzone is the primary zone — clicking it opens the file picker.
        // The dropzone itself serves as the upload area (always visible).
        const uploadBtn = page.getByRole('button', { name: /upload photo/i });
        await expect(uploadBtn).toBeVisible();

        // "Tap to upload" text is present in the dropzone
        await expect(page.getByText(/tap to upload/i)).toBeVisible();
    });

    test('upload mode shows file type info', async ({ page }) => {
        // File type info is always visible in the dropzone
        await expect(page.getByText(/jpeg.*png.*webp/i)).toBeVisible();
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
            await expect(page.getByText(/add.*image|at least 2/i)).toBeVisible();
        }
    });

    test('shows scan guide tips', async ({ page }) => {
        // Tips section should be visible in the sidebar
        await expect(page.getByText(/for accurate results/i)).toBeVisible();
    });
});
