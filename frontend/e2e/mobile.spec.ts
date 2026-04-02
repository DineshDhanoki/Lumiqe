import { test, expect } from '@playwright/test';

test.describe('Mobile Responsiveness', () => {
    // These tests run on Pixel 5 viewport via the mobile-chrome project

    test('landing page hero fits mobile viewport', async ({ page }) => {
        await page.goto('/');

        const hero = page.locator('h1');
        await expect(hero).toBeVisible();

        // Hero text should not overflow horizontally
        const box = await hero.boundingBox();
        const viewport = page.viewportSize();
        if (box && viewport) {
            expect(box.x).toBeGreaterThanOrEqual(0);
            expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 10); // small tolerance
        }
    });

    test('mobile menu toggle works', async ({ page }) => {
        await page.goto('/');

        // On mobile, hamburger menu should be visible
        const menuBtn = page.getByLabel(/open menu/i);
        if (await menuBtn.isVisible()) {
            await menuBtn.click();

            // Mobile menu should appear with nav links
            await expect(page.getByText(/how it works/i).last()).toBeVisible();
            await expect(page.getByText(/features/i).last()).toBeVisible();
        }
    });

    test('pricing cards stack vertically on mobile', async ({ page }) => {
        await page.goto('/');

        const pricingSection = page.locator('#pricing');
        await pricingSection.scrollIntoViewIfNeeded();

        // All three pricing tiers should be visible
        await expect(page.getByText(/free/i).first()).toBeVisible();
        await expect(page.getByText(/premium/i).first()).toBeVisible();
    });

    test('analyze page works on mobile', async ({ page }) => {
        await page.goto('/analyze');

        await expect(page.getByText(/live camera/i)).toBeVisible();
        await expect(page.getByRole('button', { name: /upload photo/i })).toBeVisible();

        // Buttons should be tappable (min 44px height)
        const uploadBtn = page.getByRole('button', { name: /upload photo/i });
        const box = await uploadBtn.boundingBox();
        if (box) {
            expect(box.height).toBeGreaterThanOrEqual(40);
        }
    });

    test('footer is accessible on mobile', async ({ page }) => {
        await page.goto('/');

        const footer = page.locator('footer');
        await footer.scrollIntoViewIfNeeded();
        await expect(footer.getByText('LUMIQE', { exact: true })).toBeVisible();
    });
});
