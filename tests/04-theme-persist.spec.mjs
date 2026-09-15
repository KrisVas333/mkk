import { test, expect } from '@playwright/test';
import { fresh, onboard, state } from './helpers.mjs';

test('theme choice persists across reloads', async ({ page }) => {
  await fresh(page);
  await onboard(page, '6-7', 'Testas');
  await page.goto('/index.html#/as');

  await page.locator('[data-act="theme"][data-theme="dark"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect((await state(page)).theme).toBe('dark');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await page.goto('/index.html#/as');
  await page.locator('[data-act="theme"][data-theme="light"]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});
