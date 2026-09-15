import { test, expect } from '@playwright/test';
import { fresh, onboard, activeProfile, state } from './helpers.mjs';

test.describe('onboarding → day closed → streak 1', () => {
  test('a new user can onboard and close the day', async ({ page }) => {
    await fresh(page);

    // 1. onboarding is the first thing a fresh install sees
    await expect(page.locator('[data-act="ob-band"]').first()).toBeVisible();
    await onboard(page, '8-9', 'Testas');

    const p0 = await activeProfile(page);
    expect(p0, 'profile created').toBeTruthy();
    expect(p0.band).toBe('8-9');
    expect(p0.streak).toBe(0);

    // 2. three steps close the day (the reading minute is step 4 and must NOT gate it)
    await page.locator('[data-act="open-pod"]').click();
    await page.locator('[data-act="did-pod"]').click();

    await page.locator('[data-act="open-prac"]').click();
    await page.locator('[data-act="did-prac"]').click();

    await page.locator('[data-act="tick"]').click();

    // 3. streak is 1 in state AND in the header
    await expect.poll(async () => (await activeProfile(page)).streak).toBe(1);
    await expect(page.locator('#streakN')).toHaveText('1');

    const s = await state(page);
    expect(s.onboarded).toBe(true);

    // 4. it survives a reload (localStorage, no backend)
    await page.reload();
    await expect(page.locator('#streakN')).toHaveText('1');
  });
});
