// Generates resources/icon.png (1024) + resources/splash.png (2732) + splash-dark.png
// with the Chromium already installed for Playwright. Brand: ☀️ LIGHT canon —
// ink #0A0A0A, paper #F7F7F5, red #D90429, JetBrains Mono wordmark, 4px corners.
import { chromium } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
mkdirSync(HERE, { recursive: true });

const INK = '#0A0A0A', PAPER = '#F7F7F5', RED = '#D90429';

// App icon: black tile, white MKK wordmark, one red dot. No transparency (stores reject alpha on iOS).
const icon = (s) => `<style>
 *{margin:0;padding:0;box-sizing:border-box}
 html,body{width:${s}px;height:${s}px;background:${INK};overflow:hidden}
 .w{width:${s}px;height:${s}px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${s*0.045}px;
    font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace;background:${INK}}
 .t{color:#fff;font-weight:800;font-size:${s*0.235}px;letter-spacing:${s*0.012}px;line-height:1}
 .d{width:${s*0.085}px;height:${s*0.085}px;border-radius:${s*0.012}px;background:${RED}}
</style><div class="w"><div class="t">MKK</div><div class="d"></div></div>`;

// Splash: paper ground, the icon tile centered at ~26% (Capacitor/Android 12 safe zone).
const splash = (s, dark) => `<style>
 *{margin:0;padding:0;box-sizing:border-box}
 html,body{width:${s}px;height:${s}px;background:${dark ? '#080808' : PAPER};overflow:hidden}
 .w{width:${s}px;height:${s}px;display:flex;align-items:center;justify-content:center;background:${dark ? '#080808' : PAPER}}
 .tile{width:${s*0.26}px;height:${s*0.26}px;border-radius:${s*0.026}px;background:${INK};
   display:flex;flex-direction:column;align-items:center;justify-content:center;gap:${s*0.012}px;
   font-family:"JetBrains Mono",ui-monospace,SFMono-Regular,Menlo,monospace}
 .t{color:#fff;font-weight:800;font-size:${s*0.061}px;line-height:1}
 .d{width:${s*0.022}px;height:${s*0.022}px;border-radius:${s*0.003}px;background:${RED}}
</style><div class="w"><div class="tile"><div class="t">MKK</div><div class="d"></div></div></div>`;

const jobs = [
  { file: 'icon.png',        size: 1024, html: icon(1024) },
  { file: 'icon-foreground.png', size: 1024, html: icon(1024) },
  { file: 'splash.png',      size: 2732, html: splash(2732, false) },
  { file: 'splash-dark.png', size: 2732, html: splash(2732, true) },
];

const browser = await chromium.launch();
for (const j of jobs) {
  const page = await browser.newPage({ viewport: { width: j.size, height: j.size }, deviceScaleFactor: 1 });
  await page.setContent(j.html, { waitUntil: 'load' });
  await page.screenshot({ path: resolve(HERE, j.file), type: 'png' });
  await page.close();
  console.log('wrote resources/' + j.file + '  ' + j.size + 'x' + j.size);
}
await browser.close();
