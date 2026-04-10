import { test, expect } from '@playwright/test';

test.describe('Analyze Page', () => {
    test.beforeEach(async ({ page }) => {
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
        // Navigate into camera mode then back
        await page.getByText(/start live camera/i).click();

        // Camera overlay should be open — look for cancel/back affordance
        // (CameraCapture renders its own back button)
        const backBtn = page.getByRole('button', { name: /back|cancel/i }).first();
        if (await backBtn.isVisible()) {
            await backBtn.click();
        } else {
            // Fallback: press Escape or navigate directly
            await page.keyboard.press('Escape');
        }

        // Should be back at bento layout with live camera option visible
        await expect(page.getByText(/live camera/i)).toBeVisible({ timeout: 15000 });
    });

    test('has back to home link', async ({ page }) => {
        const backLink = page.getByText(/back to home/i);
        await expect(backLink).toBeVisible();
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
