import { test, expect } from '@playwright/test';

test.describe('Route Access', () => {

    test('booking page should redirect to login if not authenticated', async ({ page }) => {
        // Navigate to booking with a dummy doctorId
        await page.goto('/booking?doctorId=123');

        // Should wait for navigation or check URL
        // It might take a moment for the useEffect to fire and redirect
        await page.waitForURL('**/login');

        // Verify we are on login page
        await expect(page.getByRole('heading', { name: 'Welcome to Medivera' })).toBeVisible();
    });

    test('call page should redirect to login if not authenticated', async ({ page }) => {
        await page.goto('/call?appointmentId=123');
        await page.waitForURL('**/login');
        await expect(page.getByRole('heading', { name: 'Welcome to Medivera' })).toBeVisible();
    });

    test('doctor view should handle missing id', async ({ page }) => {
        // If we go to view without ID, it returns null (blank) currently
        // But we can check it doesn't crash
        const response = await page.goto('/doctor/view');
        expect(response?.status()).toBe(200);
    });
});
