import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
    test('should load the home page and show specific elements', async ({ page }) => {
        // Start from the index page
        await page.goto('/');

        // Check if the logo or main title exists
        // Note: Adjust the selector based on your actual home page content (e.g. splash screen or login)
        // Since we have a redirect flow (Splash -> Onboarding -> Login), we might land on Splash first.

        // Expect to see the app title or logo text
        await expect(page).toHaveTitle(/Medivera/);

        // Check for "Get Started" or similar button if on onboarding
        // Or check for "ZyraHealth" text
        const heading = page.getByText('Medivera').first();
        await expect(heading).toBeVisible();
    });

    test('should navigate to login page', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByRole('heading', { name: 'Welcome', exact: true })).toBeVisible();
        await expect(page.getByPlaceholder('Email')).toBeVisible();
    });
});
