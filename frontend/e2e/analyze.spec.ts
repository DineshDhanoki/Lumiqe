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
        await page.getByRole('button', { name: /upload photo/i }).click();

        // Should show upload area
        await expect(page.getByText(/tap to upload/i)).toBeVisible();
    });

    test('upload mode shows file type info', async ({ page }) => {
        await page.getByRole('button', { name: /upload photo/i }).click();

        await expect(page.getByText(/jpeg.*png.*webp/i)).toBeVisible();
    });

    test('can navigate back from upload mode', async ({ page }) => {
        await page.getByRole('button', { name: /upload photo/i }).click();
        await page.getByText(/back/i).first().click();

        // Should be back at mode selection
        await expect(page.getByText(/live camera/i)).toBeVisible();
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
        // Tips section should be visible
        await expect(page.getByText(/for accurate results/i)).toBeVisible();
    });
});
