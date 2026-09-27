import { test, expect } from '@playwright/test';
import { fresh, onboard, activeProfile } from './helpers.mjs';

test('busy day: 1-minute path (podcast + recall) closes the day and keeps the streak', async ({ page }) => {
  await fresh(page); await onboard(page);
  await page.locator('[data-act="quick"]').click();
  await page.locator('[data-act="recall"][data-n="2"]').click();
  const p = await activeProfile(page);
  expect(p.streak).toBe(1);
  await expect(page.locator('[data-act="quick"]')).toHaveCount(0);
});
