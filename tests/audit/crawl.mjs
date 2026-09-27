// Full click-through audit: every route + every non-destructive data-act, 360px and 390px.
import { chromium, devices } from '@playwright/test';
const BASE = process.env.BASE || 'http://localhost:8765';
const OUT = process.env.OUT || '/tmp/mkk-audit';
import fs from 'fs'; fs.mkdirSync(OUT, { recursive: true });
const errs = [], bad = [], overflow = [];
const browser = await chromium.launch();
for (const width of [360, 390]) {
  const ctx = await browser.newContext({ ...devices['Pixel 7'], viewport: { width, height: 800 }, locale: 'lt-LT' });
  const page = await ctx.newPage();
  page.on('console', m => { if (m.type() === 'error') errs.push(`[${width}] console: ${m.text()}`); });
  page.on('pageerror', e => errs.push(`[${width}] pageerror: ${e.message}`));
  page.on('response', r => { if (r.status() >= 400) bad.push(`[${width}] ${r.status()} ${r.url()}`); });
  await page.goto(BASE + '/index.html'); await page.evaluate(() => localStorage.clear());
  await page.goto(BASE + '/index.html#/siandien'); await page.waitForSelector('[data-act]');
  if (width === 390) await page.screenshot({ path: `${OUT}/00-onboard1.png` });
  await page.locator('[data-act="ob-band"]').nth(2).click(); await page.locator('#obName').fill('Ieva');
  await page.locator('[data-act="ob-next"]').click(); await page.locator('[data-act="ob-skip"]').click();
  await page.locator('[data-act="ob-done"]').click(); await page.waitForSelector('[data-act="open-pod"]');
  const seen = new Set(); const queue = ['#/siandien', '#/treniruotes', '#/zaidimai', '#/tinklarastis', '#/as'];
  let n = 0;
  while (queue.length) {
    const h = queue.shift(); if (seen.has(h)) continue; seen.add(h);
    await page.goto(BASE + '/index.html' + h); await page.waitForTimeout(250);
    const ow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    if (ow > 1) overflow.push(`[${width}] ${h} overflow ${ow}px`);
    if (width === 390) await page.screenshot({ path: `${OUT}/${String(++n).padStart(2,'0')}-${h.replace(/[#/]/g,'_')}.png`, fullPage: true });
    const links = await page.$$eval('a[href^="#/"]', as => as.map(a => a.getAttribute('href')));
    links.forEach(l => { if (!seen.has(l)) queue.push(l); });
    // click every non-destructive action on this screen, reopen route after each
    const acts = await page.$$eval('#view [data-act]', els => els.map((e, i) => ({ a: e.getAttribute('data-act'), i })));
    for (const { a, i } of acts) {
      if (['reset', 'del-child', 'pay', 'unplus', 'lang', 'theme'].includes(a)) continue;
      try {
        const el = page.locator('#view [data-act]').nth(i);
        if (!(await el.isVisible())) continue;
        await el.click({ timeout: 2000 }); await page.waitForTimeout(150);
        const sheetOpen = await page.locator('#sheet:not([hidden])').count();
        if (sheetOpen) {
          const ow2 = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
          if (ow2 > 1) overflow.push(`[${width}] ${h} sheet(${a}) overflow ${ow2}px`);
          await page.locator('#sheetClose').click().catch(() => {});
        }
        await page.goto(BASE + '/index.html' + h); await page.waitForTimeout(120);
      } catch (e) { errs.push(`[${width}] click ${h} ${a}#${i}: ${e.message.split('\n')[0]}`); }
    }
  }
  console.log(`[${width}] routes visited: ${seen.size}`);
  await ctx.close();
}
await browser.close();
console.log('ERRORS', errs.length); errs.slice(0, 40).forEach(e => console.log(' ', e));
console.log('BAD RESPONSES', bad.length); [...new Set(bad)].slice(0, 20).forEach(e => console.log(' ', e));
console.log('OVERFLOW', overflow.length); overflow.forEach(e => console.log(' ', e));
