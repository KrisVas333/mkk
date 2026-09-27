import { test, expect } from '@playwright/test';
import { fresh, onboard } from './helpers.mjs';

test('a club gets a co-branded link; the club name shows on screen 1, disclaimer stays', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await fresh(page); await onboard(page);
  await page.goto('/index.html#/as');
  await page.locator('#clubName').fill('Šokių studija <Ritmas>');
  await page.locator('[data-act="club-link"]').click();
  const url = await page.locator('[data-act="club-link"]').getAttribute('data-url');
  expect(url).toContain('?burelis=');
  await page.evaluate(() => localStorage.clear());
  await page.goto('/index.html?burelis=' + encodeURIComponent('Šokių studija Ritmas') + '#/siandien');
  await page.waitForFunction(() => !!document.querySelector('[data-act]'));
  await expect(page.getByText('Šokių studija Ritmas')).toBeVisible();
  await expect(page.locator('.strip')).toBeVisible();          // AI disclaimer strip still on screen 1
  const html = await page.content();
  expect(html).not.toContain('<Ritmas>');
});
