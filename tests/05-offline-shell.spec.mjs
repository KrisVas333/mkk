import { test, expect } from '@playwright/test';
import { fresh, onboard } from './helpers.mjs';

/* The whole promise of MKK is "veikia be interneto". This proves the service
   worker really serves the shell + content when the network is cut. */
test('the app still works with the network offline', async ({ page, context }) => {
  await fresh(page);
  await onboard(page, '8-9', 'Testas');

  // let the service worker install and precache
  await page.waitForFunction(
    () => navigator.serviceWorker && navigator.serviceWorker.controller !== undefined,
    null, { timeout: 15000 }
  );
  const reg = await page.evaluate(async () => {
    const r = await navigator.serviceWorker.ready;
    return !!(r && (r.active || r.installing || r.waiting));
  });
  expect(reg, 'service worker registered').toBe(true);
  await page.waitForTimeout(1500);   // give the precache a moment

  await context.setOffline(true);
  await page.reload();

  // shell renders from cache, tabs work, content is there
  await expect(page.locator('#tabs')).toBeVisible();
  await expect(page.locator('[data-act="open-pod"]')).toBeVisible();
  await page.locator('a[href="#/zaidimai"]').click();
  await expect(page.locator('#view')).not.toBeEmpty();

  // and the app tells the user it is offline rather than breaking
  await expect(page.locator('#offline')).toBeVisible();

  await context.setOffline(false);
});
