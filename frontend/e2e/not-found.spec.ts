import { test, expect } from '@playwright/test';

test.describe('404 Page', () => {
    test('shows 404 for unknown routes', async ({ page }) => {
        await page.goto('/this-page-does-not-exist');

        await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
        await expect(page.getByText(/the atelier is lost/i)).toBeVisible();
    });

    test('has go home link', async ({ page }) => {
        await page.goto('/this-page-does-not-exist');

        const homeLink = page.getByRole('link', { name: /return home/i });
        await expect(homeLink).toBeVisible();
        await expect(homeLink).toHaveAttribute('href', '/');
    });

    test('has try analysis link', async ({ page }) => {
        await page.goto('/this-page-does-not-exist');

        const analyzeLink = page.getByRole('link', { name: /start analysis/i });
        await expect(analyzeLink).toBeVisible();
        await expect(analyzeLink).toHaveAttribute('href', '/analyze');
    });
});
