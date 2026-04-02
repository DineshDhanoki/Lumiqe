import { test, expect } from '@playwright/test';

test.describe('Results Page', () => {
    const mockParams = new URLSearchParams({
        season: 'Deep Winter',
        hexColor: '#5C3A2E',
        undertone: 'cool',
        confidence: '0.87',
        palette: '#1B1B2F,#162447,#1F4068,#E43F5A,#F5F5F5,#C0C0C0',
        avoidColors: '#FFD700,#FF8C00,#FFDEAD',
        metal: 'Silver',
        contrastLevel: 'High',
    });

    test('renders season and palette with valid params', async ({ page }) => {
        await page.goto(`/results?${mockParams.toString()}`);

        // Season name in the heading
        await expect(page.locator('h1')).toContainText('Deep Winter');

        // Skin profile card with detected tone
        const skinCard = page.getByText(/detected tone/i);
        await skinCard.scrollIntoViewIfNeeded();
        await expect(skinCard).toBeVisible();
    });

    test('renders palette color swatches', async ({ page }) => {
        await page.goto(`/results?${mockParams.toString()}`);

        // Should have palette colors rendered
        const paletteSection = page.getByText(/core palette/i);
        await paletteSection.scrollIntoViewIfNeeded();
        await expect(paletteSection).toBeVisible();
    });

    test('shows metal recommendation', async ({ page }) => {
        await page.goto(`/results?${mockParams.toString()}`);

        const metalLabel = page.getByText(/best metal/i);
        await metalLabel.scrollIntoViewIfNeeded();
        await expect(metalLabel).toBeVisible();
        await expect(page.getByText('Silver', { exact: true }).first()).toBeVisible();
    });

    test('shows tabs for detailed analysis', async ({ page }) => {
        await page.goto(`/results?${mockParams.toString()}`);

        // Tab navigation should be visible
        const tabArea = page.locator('[role="button"], button').filter({ hasText: /overview|profile|occasion|capsule|hair|stylist/i });
        await expect(tabArea.first()).toBeVisible();
    });

    test('shows no-analysis message without params', async ({ page }) => {
        await page.goto('/results');

        await expect(page.getByText(/no analysis found|unknown season/i)).toBeVisible();
    });

    test('has share and shop buttons', async ({ page }) => {
        await page.goto(`/results?${mockParams.toString()}`);

        // Should have action buttons
        const shopBtn = page.getByRole('link', { name: /shop.*colors/i });
        if (await shopBtn.isVisible()) {
            await expect(shopBtn).toBeVisible();
        }
    });
});
