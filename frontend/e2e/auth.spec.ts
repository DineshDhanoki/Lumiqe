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
        // Must check the required terms checkbox first — otherwise browser native
        // validation blocks the form before React's validate() runs.
        await page.locator('#terms').check();
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

        // Check terms to bypass browser native validation
        await page.locator('#terms').check();
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
        // Click the inner "Sign In" toggle button (not the <p> wrapper which won't trigger it)
        await page.getByRole('dialog').getByRole('button', { name: 'Sign In' }).click();
        await expect(page.getByRole('dialog')).toContainText(/welcome back/i);

        // Switch back to sign up
        await page.getByRole('dialog').getByRole('button', { name: 'Sign Up' }).click();
        await expect(page.getByRole('dialog')).toContainText(/create account/i);
    });

    test('has continue with Google button', async ({ page }) => {
        // Google sign-in is shown on the sign-in form — switch to sign-in first
        await page.getByRole('dialog').getByRole('button', { name: 'Sign In' }).click();
        await expect(page.getByRole('dialog').getByText(/continue with google/i)).toBeVisible();
    });

    test('has continue as guest option', async ({ page }) => {
        await expect(page.getByText(/continue as guest/i)).toBeVisible();
    });

    test('closes modal on backdrop click', async ({ page }) => {
        // Click the backdrop (the semi-transparent overlay)
        await page.locator('.bg-background\\/80').click({ position: { x: 10, y: 10 } });
        await expect(page.getByRole('dialog')).not.toBeVisible();
    });

    test('forgot password link visible on sign in', async ({ page }) => {
        // Switch to sign in mode via the inner toggle button
        await page.getByRole('dialog').getByRole('button', { name: 'Sign In' }).click();
        await expect(page.getByText(/forgot password/i)).toBeVisible();
    });
});
