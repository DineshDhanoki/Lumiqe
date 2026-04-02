import { test, expect } from '@playwright/test';

test.describe('404 Page', () => {
    test('shows 404 for unknown routes', async ({ page }) => {
        await page.goto('/this-page-does-not-exist');

        await expect(page.getByText('404')).toBeVisible();
        await expect(page.getByText(/page not found/i)).toBeVisible();
    });

    test('has go home link', async ({ page }) => {
        await page.goto('/this-page-does-not-exist');

        const homeLink = page.getByRole('link', { name: /go home/i });
        await expect(homeLink).toBeVisible();
        await expect(homeLink).toHaveAttribute('href', '/');
    });

    test('has try analysis link', async ({ page }) => {
        await page.goto('/this-page-does-not-exist');

        const analyzeLink = page.getByRole('link', { name: /try analysis/i });
        await expect(analyzeLink).toBeVisible();
        await expect(analyzeLink).toHaveAttribute('href', '/analyze');
    });
});
