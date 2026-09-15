import { test, expect } from '@playwright/test';
import { fresh, onboard, state } from './helpers.mjs';

test.describe('provider gift code', () => {
  test('a valid code unlocks MKK+ and a bad one does not', async ({ page }) => {
    await fresh(page);
    await onboard(page, '10-11', 'Testas');
    await page.goto('/index.html#/as');

    // bad code — stays locked
    await page.locator('#code').fill('NELABAI');
    await page.locator('[data-act="code"]').click();
    await page.waitForTimeout(300);
    expect((await state(page)).plus).toBeFalsy();

    // good code — unlocks and persists
    await page.locator('#code').fill('exo2026');   // lower-case on purpose: input is normalised
    await page.locator('[data-act="code"]').click();
    await expect.poll(async () => (await state(page)).plus).toBe(true);
    expect((await state(page)).code).toBe('EXO2026');

    await page.reload();
    expect((await state(page)).plus).toBe(true);

    // and it can be turned off again
    await page.locator('[data-act="unplus"]').click();
    await expect.poll(async () => (await state(page)).plus).toBe(false);
  });
});
