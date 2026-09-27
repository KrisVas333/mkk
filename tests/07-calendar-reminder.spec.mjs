import { test, expect } from '@playwright/test';
import { fresh, onboard } from './helpers.mjs';

test('reminder goes to the phone calendar as a daily .ics (no push server)', async ({ page }) => {
  await fresh(page); await onboard(page);
  await page.goto('/index.html#/as');
  await page.locator('[data-act="remind"][data-time="19:00"]').click();
  const cal = page.locator('[data-act="cal"]').first();
  await expect(cal).toBeVisible();
  const [dl] = await Promise.all([page.waitForEvent('download'), cal.click()]);
  expect(dl.suggestedFilename()).toBe('mkk-priminimas.ics');
  const fs = await import('node:fs');
  const body = fs.readFileSync(await dl.path(), 'utf8');
  expect(body).toContain('RRULE:FREQ=DAILY');
  expect(body).toMatch(/DTSTART:\d{8}T190000/);
  expect(body).toContain('BEGIN:VALARM');
});

test('provider trust line sits in the same card as the club-codes button', async ({ page }) => {
  await fresh(page); await onboard(page);
  await page.goto('/index.html#/as');
  const card = page.locator('.card', { has: page.locator('[data-act="provider-codes"]') });
  await expect(card.locator('.coi')).toHaveCount(2);
});
