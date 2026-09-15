import { test, expect } from '@playwright/test';
import { fresh, onboard } from './helpers.mjs';
import { readFileSync } from 'node:fs';

const GAMES = JSON.parse(readFileSync(new URL('../content/games.json', import.meta.url), 'utf8')).games;

test('every game opens and renders its board', async ({ page }) => {
  await fresh(page);
  await onboard(page, '8-9', 'Testas');

  // unlock MKK+ with a provider gift code so the locked games are reachable
  await page.goto('/index.html#/as');
  await page.locator('#code').fill('EXO2026');
  await page.locator('[data-act="code"]').click();
  await expect.poll(async () => (await page.evaluate(() => JSON.parse(localStorage.getItem('mkk.v2')).plus))).toBe(true);

  expect(GAMES.length, 'games.json is not empty').toBeGreaterThan(0);
  for (const g of GAMES) {
    await page.goto(`/index.html#/zaidimai/${g.id}`);
    const box = page.locator('#gameBox');
    await expect(box, `${g.id} renders a board`).toBeVisible();
    await expect(box, `${g.id} board is not empty`).not.toBeEmpty();
    // no paywall left on any game now that MKK+ is on
    await expect(page.locator('#view')).not.toContainText('🔒');
  }
});
