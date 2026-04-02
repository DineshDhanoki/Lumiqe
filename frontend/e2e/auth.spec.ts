import { test, expect } from '@playwright/test';

test.describe('Auth Modal', () => {
    test.beforeEach(async ({ page }) => {
        await page.goto('/');

        // On mobile viewports, open hamburger menu first
        const menuBtn = page.getByLabel(/open menu/i);
        if (await menuBtn.isVisible()) {
            await menuBtn.click();
        }

        // Open sign-up modal via navbar
        const signUpBtn = page.getByRole('button', { name: /sign up/i }).first();
        await signUpBtn.click();
        await expect(page.getByRole('dialog')).toBeVisible();
    });

    test('shows create account form by default when opened via sign up', async ({ page }) => {
        await expect(page.getByRole('dialog')).toContainText(/create account/i);
    });

    test('validates empty form submission', async ({ page }) => {
        // Submit without filling anything
        const submitBtn = page.getByRole('dialog').getByRole('button', { name: /create account/i });
        await submitBtn.click();

        // Should show validation errors
        await expect(page.getByText(/first name is required/i)).toBeVisible();
        await expect(page.getByText(/email is required/i)).toBeVisible();
        await expect(page.getByText(/password is required/i)).toBeVisible();
    });

    test('validates email format', async ({ page }) => {
        const emailInput = page.getByRole('dialog').getByLabel(/email/i);
        await emailInput.fill('not-an-email');
        await emailInput.blur();

        await expect(page.getByText(/valid email/i)).toBeVisible();
    });

    test('validates password length on signup', async ({ page }) => {
        const firstNameInput = page.getByRole('dialog').getByLabel(/first name/i);
        const lastNameInput = page.getByRole('dialog').getByLabel(/last name/i);
        const emailInput = page.getByRole('dialog').getByLabel(/email/i);
        const passwordInput = page.getByRole('dialog').getByLabel(/^password$/i);

        await firstNameInput.fill('Test');
        await lastNameInput.fill('User');
        await emailInput.fill('test@example.com');
        await passwordInput.fill('short');

        const submitBtn = page.getByRole('dialog').getByRole('button', { name: /create account/i });
        await submitBtn.click();

        await expect(page.getByText(/at least 8 characters/i)).toBeVisible();
    });

    test('shows password strength meter', async ({ page }) => {
        const passwordInput = page.getByRole('dialog').getByLabel(/^password$/i);
        await passwordInput.fill('StrongP@ss123');

        await expect(page.getByText(/strong|good/i)).toBeVisible();
    });

    test('toggles between sign in and sign up', async ({ page }) => {
        // Currently on sign up, click to switch to sign in
        await page.getByText(/already have an account/i).click();
        await expect(page.getByRole('dialog')).toContainText(/welcome back/i);

        // Switch back to sign up
        await page.getByText(/don.t have an account/i).click();
        await expect(page.getByRole('dialog')).toContainText(/create account/i);
    });

    test('has continue with Google button', async ({ page }) => {
        await expect(page.getByRole('dialog').getByText(/continue with google/i)).toBeVisible();
    });

    test('has continue as guest option', async ({ page }) => {
        await expect(page.getByText(/continue as guest/i)).toBeVisible();
    });

    test('closes modal on backdrop click', async ({ page }) => {
        // Click the backdrop (the semi-transparent overlay)
        await page.locator('.bg-black\\/60').click({ position: { x: 10, y: 10 } });
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('forgot password link visible on sign in', async ({ page }) => {
        // Switch to sign in mode
        await page.getByText(/already have an account/i).click();
        await expect(page.getByText(/forgot password/i)).toBeVisible();
    });
});
