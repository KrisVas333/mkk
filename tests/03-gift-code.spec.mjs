import { test, expect } from '@playwright/test';
import { fresh, onboard, state, STORE_KEY } from './helpers.mjs';

/* unlock-for-test (critic 2026-09-27): no payments and no code server yet, so
   MKK+ is open to everyone, the code input is hidden, MKK+ is labelled "planned",
   and the "request codes for your club" contact path stays. Replaces the old
   EXO/BUR gift-code unlock test. */
test.describe('everything unlocked while MKK+ is not for sale', () => {
  test('new user is unlocked, no code input, request-codes path stays', async ({ page }) => {
    await fresh(page);
    await onboard(page, '10-11', 'Testas');
    expect((await state(page)).plus).toBe(true);

    await page.goto('/index.html#/as');
    await expect(page.locator('#code')).toHaveCount(0);
    await expect(page.locator('[data-act="code"]')).toHaveCount(0);
    await expect(page.locator('[data-act="pay"]')).toHaveCount(0);
    await expect(page.locator('[data-act="unplus"]')).toHaveCount(0);
    await expect(page.locator('[data-act="provider-codes"]')).toBeVisible();
    await expect(page.locator('#view')).toContainText('Planuojama, dar neparduodama');
    await expect(page.locator('#view')).not.toContainText('Aktyvus');
  });

  test('an old save with plus:false is unlocked too', async ({ page }) => {
    await fresh(page);
    await onboard(page, '8-9', 'Testas');
    await page.evaluate((k) => {
      const s = JSON.parse(localStorage.getItem(k)); s.plus = false; localStorage.setItem(k, JSON.stringify(s));
    }, STORE_KEY);
    await page.reload();
    await page.goto('/index.html#/zaidimai');
    await expect(page.locator('#view')).not.toContainText('🔒');
    await page.goto('/index.html#/treniruotes');
    await expect(page.locator('#view')).not.toContainText('🔒');
  });
});
