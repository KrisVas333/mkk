import { test, expect } from '@playwright/test';
import { fresh, onboard } from './helpers.mjs';

async function passGate(page) {
  const q = await page.locator('#sheet .lbl').last().textContent();
  const [a, b] = (q.match(/\d+/g) || []).map(Number);
  await page.locator('#gateIn').fill(String(a * b));
  await page.locator('#gateGo').click();
}

test('screen 1 shows the AI disclaimer + feedback link above the fold, no tap', async ({ page }) => {
  await fresh(page);
  const strip = page.locator('.strip');
  await expect(strip).toBeVisible();
  await expect(strip).toContainText('AI');
  const box = await strip.boundingBox();
  const vh = page.viewportSize().height;
  expect(box.y + box.height, 'strip fully inside first viewport').toBeLessThan(vh);
  await expect(strip.locator('[data-act="feedback"]')).toBeVisible();
});

test('feedback goes through the parental gate and opens a prefilled mailto', async ({ page }) => {
  await fresh(page);
  await onboard(page);
  await page.goto('/index.html#/as');
  await page.evaluate(() => {
    window.__mailto = null;
    document.addEventListener('click', (e) => {
      const a = e.target.closest && e.target.closest('a[href^="mailto:"]');
      if (a) { window.__mailto = a.href; e.preventDefault(); }
    });
  });
  await page.locator('#view [data-act="feedback"]').click();
  await expect(page.locator('#gateIn')).toBeVisible();          // gate first: kids' app
  expect(await page.evaluate(() => window.__mailto)).toBeNull();
  await passGate(page);
  const href = await page.evaluate(() => window.__mailto);
  expect(href).toMatch(/^mailto:[^?]+@[^?]+\?subject=/);
  expect(decodeURIComponent(href)).toContain('v0.4');
  await expect(page.locator('#sheet')).toBeHidden();
});

test('share works (Web Share or clipboard fallback) behind the gate', async ({ page, context }) => {
  const cfg = await (await page.request.get('/content/config.json')).json();
  test.skip(!cfg.shareButton, 'share button switched off in config (awaiting Kris GO)');
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await fresh(page);
  await onboard(page);
  await page.evaluate(() => { window.__shared = null; navigator.share = (d) => { window.__shared = d; return Promise.resolve(); }; });
  await page.locator('#view [data-act="share"]').click();
  await passGate(page);
  const d = await page.evaluate(() => window.__shared);
  expect(d.url).toBe('https://krisvas333.github.io/mkk/');
  expect(d.text).not.toContain('—');
});

test('gift card offers a code path to ANY club, with the COI line in the same card', async ({ page }) => {
  await fresh(page);
  await onboard(page);
  await page.goto('/index.html#/as');
  const card = page.locator('.card', { has: page.locator('[data-act="provider-codes"]') });
  await expect(card).toBeVisible();
  await expect(card.locator('.coi')).toContainText('ExoClass');
});

test('self-hosted fonts resolve (no 404) and OG image exists', async ({ page, request }) => {
  const bad = [];
  page.on('response', (r) => { if (r.status() >= 400) bad.push(r.url()); });
  await fresh(page);
  await page.evaluate(() => document.fonts.ready);
  expect(bad).toEqual([]);
  expect(await page.evaluate(() => document.fonts.check('16px "JetBrains Mono"'))).toBe(true);
  expect((await request.get('/img/og-1200x630.png')).status()).toBe(200);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute('content', /og-1200x630\.png$/);
});
