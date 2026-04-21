import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('renders hero section with CTA', async ({ page }) => {
        await expect(page.locator('h1').first()).toBeVisible();
        await expect(page.locator('h1').first()).toContainText('Discover Your');

        const ctaButton = page.getByRole('button', { name: /analyze my colors/i });
        await expect(ctaButton).toBeVisible();
    });

    test('renders navbar with logo and links', async ({ page }) => {
        const nav = page.getByRole('navigation');
        await expect(nav).toBeVisible();
        await expect(nav.getByText('LUMIQE')).toBeVisible();
    });

    test('how it works section visible on scroll', async ({ page }) => {
        const section = page.locator('#how-it-works');
        await section.scrollIntoViewIfNeeded();
        await expect(section).toBeVisible();
    });

    test('pricing section visible on scroll', async ({ page }) => {
        const section = page.locator('#pricing');
        await section.scrollIntoViewIfNeeded();
        await expect(section).toBeVisible();
    });

    test('footer renders with links', async ({ page }) => {
        const footer = page.locator('footer');
        await footer.scrollIntoViewIfNeeded();
        await expect(footer).toBeVisible();
        await expect(footer.getByText('LUMIQE', { exact: true })).toBeVisible();
    });

    test('clicking CTA opens auth modal', async ({ page }) => {
        const ctaButton = page.getByRole('button', { name: /analyze my colors/i });
        await ctaButton.click();

        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();
    });
});
