import { test, expect } from '@playwright/test';

test.describe('404 Page', () => {
    test('shows 404 for unknown routes', async ({ page }) => {
        await page.goto('/this-page-does-not-exist');

        await expect(page.getByRole('heading', { name: '404' })).toBeVisible();
        await expect(page.getByText(/the atelier is lost/i)).toBeVisible();
    });

    test('has go home link', async ({ page }) => {
        await page.goto('/this-page-does-not-exist');

        const homeLink = page.getByRole('link', { name: /return to atelier/i });
        await expect(homeLink).toBeVisible();
        await expect(homeLink).toHaveAttribute('href', '/');
    });

    test('has contact link', async ({ page }) => {
        await page.goto('/this-page-does-not-exist');

        await expect(page.getByText(/contact style concierge/i)).toBeVisible();
    });
});
