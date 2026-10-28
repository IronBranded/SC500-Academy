/* render-posters.js - SC-500 Academy
   Renders every posters/NN-*.html to posters/pdf/NN-*.pdf: one 17 x 11 in
   (tabloid, landscape) page per .sheet, backgrounds printed, fonts embedded.

   It also refuses to write a PDF that would cut content off: before printing,
   it measures every sheet, column and panel, and exits 1 if anything overflows
   its box. Fix the HTML (shorter text or a different column split) and run it
   again.

   Dev-time only, like tools/a11y-check.js:
     npm install --no-save playwright@1.56.0
     npx playwright install chromium
     node tools/render-posters.js              (all posters)
     node tools/render-posters.js 02           (one poster)          */

'use strict';

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const ROOT = path.resolve(__dirname, '..');
const DIR = path.join(ROOT, 'posters');
const OUT = path.join(DIR, 'pdf');

(async () => {
  const only = process.argv[2];
  const files = fs.readdirSync(DIR)
    .filter(f => /^\d\d-.+\.html$/.test(f))
    .filter(f => !only || f.startsWith(only))
    .sort();
  if (!files.length) { console.error('No posters/NN-*.html files found.'); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });

  const launch = process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {};
  const browser = await chromium.launch(launch);
  const page = await browser.newPage({ viewport: { width: 1632, height: 1056 } });
  let failed = 0;

  for (const f of files) {
    await page.goto(pathToFileURL(path.join(DIR, f)).href, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    await page.emulateMedia({ media: 'print' });

    const problems = await page.evaluate(() => {
      const out = [];
      const over = (el) => el.scrollHeight > el.clientHeight + 1 || el.scrollWidth > el.clientWidth + 1;
      document.querySelectorAll('.sheet').forEach((s, i) => {
        if (over(s)) out.push(`sheet ${i + 1} overflows`);
        s.querySelectorAll('.cols > .col').forEach((c, j) => {
          if (over(c)) out.push(`sheet ${i + 1}, column ${j + 1} overflows by ${c.scrollHeight - c.clientHeight}px`);
        });
        s.querySelectorAll('.panel, .tile, table, .pipe').forEach((p) => {
          if (p.scrollWidth > p.clientWidth + 1) {
            const h = p.querySelector('h2, h4, th');
            out.push(`sheet ${i + 1}: too wide - ${(h ? h.textContent : p.className).trim().slice(0, 60)}`);
          }
        });
      });
      const missing = [...document.fonts].filter(ff => ff.status === 'error').map(ff => ff.family);
      if (missing.length) out.push('fonts failed to load: ' + missing.join(', '));
      return out;
    });

    if (problems.length) {
      failed++;
      console.log(`FAIL  ${f}`);
      problems.forEach(p => console.log('      ' + p));
      continue;
    }
    const pdf = path.join(OUT, f.replace(/\.html$/, '.pdf'));
    await page.pdf({ path: pdf, printBackground: true, preferCSSPageSize: true });
    console.log(`ok    ${f} -> posters/pdf/${path.basename(pdf)}`);
  }

  await browser.close();
  process.exit(failed ? 1 : 0);
})();
