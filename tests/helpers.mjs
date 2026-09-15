/* Shared helpers. Selectors use data-act / stable ids only — builder A owns the
   copy, so nothing here asserts on Lithuanian wording that may change. */
export const STORE_KEY = 'mkk.v2';

export async function fresh(page) {
  await page.goto('/index.html');
  await page.evaluate(() => { try { localStorage.clear(); } catch (e) {} });
  await page.goto('/index.html#/siandien');
  await page.waitForFunction(() => !!document.querySelector('[data-act]'), null, { timeout: 15000 });
}

/** Walk the 3 onboarding screens. Returns when the Šiandien screen is up. */
export async function onboard(page, band = '8-9', name = 'Testas') {
  await page.locator(`[data-act="ob-band"][data-band="${band}"]`).click();
  await page.locator('#obName').fill(name);
  await page.locator('[data-act="ob-next"]').click();          // 1 -> 2
  await page.locator('[data-act="ob-next"], [data-act="ob-skip"]').first().click();  // 2 -> 3
  await page.locator('[data-act="ob-done"]').click();          // 3 -> app
  await page.locator('[data-act="open-pod"]').waitFor();
}

export async function state(page) {
  return page.evaluate((k) => JSON.parse(localStorage.getItem(k) || 'null'), STORE_KEY);
}

export async function activeProfile(page) {
  const s = await state(page);
  if (!s) return null;
  return (s.profiles || []).find((p) => p.id === s.active) || (s.profiles || [])[0] || null;
}
