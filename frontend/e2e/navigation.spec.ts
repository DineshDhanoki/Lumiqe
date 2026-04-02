import { test, expect } from '@playwright/test';

test.describe('Protected Routes', () => {
    test('dashboard redirects unauthenticated users to home', async ({ page }) => {
        await page.goto('/dashboard');

        // Middleware should redirect to / with callbackUrl
        await page.waitForURL(/\/\?callbackUrl/);
        expect(page.url()).toContain('callbackUrl');
    });

    test('account page redirects unauthenticated users', async ({ page }) => {
        await page.goto('/account');

        await page.waitForURL(/\/\?callbackUrl/);
        expect(page.url()).toContain('callbackUrl');
    });

    test('wardrobe page redirects unauthenticated users', async ({ page }) => {
        await page.goto('/wardrobe');

        await page.waitForURL(/\/\?callbackUrl/);
        expect(page.url()).toContain('callbackUrl');
    });
});

test.describe('Public Routes', () => {
    test('analyze page is accessible without auth', async ({ page }) => {
        const response = await page.goto('/analyze');
        expect(response?.status()).toBe(200);
    });

    test('results page is accessible without auth', async ({ page }) => {
        const response = await page.goto('/results');
        expect(response?.status()).toBe(200);
    });

    test('pricing page is accessible without auth', async ({ page }) => {
        const response = await page.goto('/pricing');
        expect(response?.status()).toBe(200);
    });
});
