import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
    test('should load the home page and show specific elements', async ({ page }) => {
        // Start from the index page
        await page.goto('/');

        // Expect to see the app title in metadata
        await expect(page).toHaveTitle(/Medivera/);

        // On a fresh load, it redirects to Onboarding
        // Check for Onboarding content
        const heading = page.getByRole('heading', { name: 'Global Care' });
        await expect(heading).toBeVisible();

        // Check for Get Started button
        await expect(page.getByRole('button', { name: 'Get Started' })).toBeVisible();
    });

    test('should navigate to login page', async ({ page }) => {
        await page.goto('/login');
        // Heading is "Welcome to Medivera"
        await expect(page.getByRole('heading', { name: 'Welcome to Medivera' })).toBeVisible();
        await expect(page.getByPlaceholder('Email')).toBeVisible();
    });
});
