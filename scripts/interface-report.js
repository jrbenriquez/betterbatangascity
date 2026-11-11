#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const http = require('node:http');
const output = process.env.REVIEW_OUTPUT_DIR || path.resolve(__dirname, '../review-artifacts');
const before = JSON.parse(fs.readFileSync(path.join(output, 'before-audit.json'), 'utf8'));
const after = JSON.parse(fs.readFileSync(path.join(output, 'after-audit.json'), 'utf8'));
const esc = (value) =>
  String(value).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const pairs = before
  .filter((item) => item.screenshot)
  .map((item) => ({
    before: item,
    after: after.find((next) => next.file === item.file && next.width === item.width),
  }));
const pages = [...new Set(before.map((item) => item.file))];
const totalViolations = (rows) =>
  rows.reduce(
    (total, item) => total + item.violations.reduce((sum, v) => sum + v.nodes.length, 0),
    0
  );
const overflow = (rows, width) =>
  rows.filter((item) => item.width === width && item.overflow > 1).length;
const style = `*{box-sizing:border-box}body{margin:0;background:#f4f7fb;color:#1c2940;font:16px/1.6 system-ui,sans-serif}header,main{max-width:1500px;margin:auto;padding:24px}h1{font-size:32px;line-height:1.2;letter-spacing:-.02em}h2{font-size:20px;margin:0 0 12px}p{max-width:80ch}a{color:#0032a0}select,button{font:inherit;padding:10px;border:1px solid #778399;border-radius:6px;background:#fff}label{display:inline-flex;gap:8px;align-items:center;margin-right:16px}.metrics,.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}.metric,.frame{background:#fff;padding:16px;border:1px solid #dce3ed;border-radius:12px}.metric strong{display:block;font-size:24px}.comparison{margin:24px 0 40px}.scroll{height:850px;overflow:auto;border:1px solid #dce3ed;border-radius:8px;overscroll-behavior:contain}.scroll img{display:block;width:100%;height:auto}figcaption{font-size:14px;color:#526078}figure{margin:0}details{background:#fff;padding:16px;margin:16px 0;border-radius:8px}summary{cursor:pointer;font-weight:600}.selected{display:none}.toolbar{display:flex;flex-wrap:wrap;gap:12px;align-items:center}small{color:#526078}button:focus-visible,select:focus-visible,a:focus-visible,summary:focus-visible{outline:3px solid #0032a0;outline-offset:3px}@media(max-width:700px){.pair{grid-template-columns:1fr}header,main{padding:16px}.scroll{height:600px}}`;
const blocks = pairs
  .map(
    (pair, index) =>
      `<section class="comparison ${index ? 'selected' : ''}" data-file="${esc(pair.before.file)}" data-width="${pair.before.width}"><h2>${esc(pair.before.file)} · ${pair.before.width === 1440 ? 'Desktop · 1440px' : 'Mobile · 390px'}</h2><div class="pair">${['before', 'after'].map((phase) => `<figure class="frame"><h2>${phase === 'before' ? 'Before' : 'After'}</h2><div class="scroll" tabindex="0" aria-label="${phase} screenshot, scroll to inspect"><img src="${esc(pair[phase].screenshot)}" alt="${phase} ${esc(pair.before.file)} screenshot"></div><figcaption><a href="${esc(pair[phase].screenshot)}">Open full-size ${phase} screenshot</a></figcaption></figure>`).join('')}</div></section>`
  )
  .join('');
const html = `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BetterLGU interface — before and after</title><style>${style}</style><body><header><small>BetterLGU · Batangas City · Interface evidence</small><h1>A clearer, more usable community portal</h1><p>Before-and-after screenshots from the real site. The existing brand, HTML, CSS and JavaScript are retained. Unverified local records remain visible placeholders.</p><div class="metrics"><div class="metric">Pages overflowing at 320px<strong>${overflow(before, 320)} before → ${overflow(after, 320)} after</strong>All ${pages.length} screens checked, including the local editor.</div><div class="metric">Automated accessibility findings<strong>${totalViolations(before)} before → ${totalViolations(after)} after</strong>16 representative screens, axe WCAG A/AA checks.</div></div><details><summary>Capture conditions and coverage</summary><p>Matched viewport dimensions, fixed Philippine date/time, English locale, reduced-motion preference, identical Inter font and Bootstrap icons. External APIs and map providers are unavailable in both captures; no weather, officials or statistical data were invented. Full-page images include content revealed through normal scrolling.</p><p>Layout and runtime checks cover all ${pages.length} screens at 1440px, 390px and 320px. The gallery has ${pairs.length} pairs covering the homepage, services, a detail page, government, officials, statistics, budget, legislation, news, contact, FAQ, privacy, accessibility, error, offline and editor screens. Automated checks do not establish full WCAG conformance. Native screen-reader testing and live external provider behavior were not verified.</p></details><div class="toolbar"><label>Screen <select id="screen">${[...new Set(pairs.map((p) => p.before.file))].map((file) => `<option>${esc(file)}</option>`).join('')}</select></label><label>Viewport <select id="width"><option value="1440">Desktop · 1440px</option><option value="390">Mobile · 390px</option></select></label><label><input id="sync" type="checkbox" checked> Sync scrolling</label></div></header><main>${blocks}<p><a href="before-audit.json">Before audit data</a> · <a href="after-audit.json">After audit data</a></p></main><script>const update=()=>document.querySelectorAll('.comparison').forEach(el=>el.classList.toggle('selected',el.dataset.file!==document.getElementById('screen').value||el.dataset.width!==document.getElementById('width').value));document.querySelectorAll('select').forEach(el=>el.addEventListener('change',update));let scrolling=false;document.querySelectorAll('.scroll').forEach(el=>el.addEventListener('scroll',()=>{if(scrolling||!document.getElementById('sync').checked)return;const other=[...el.closest('.pair').querySelectorAll('.scroll')].find(node=>node!==el);scrolling=true;other.scrollTop=el.scrollTop;requestAnimationFrame(()=>scrolling=false)}));update();</script></body></html>`;
fs.writeFileSync(path.join(output, 'index.html'), html);
(async () => {
  const server = http.createServer((request, response) => {
    const file = path.resolve(
      output,
      '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
    );
    if (
      path.relative(output, file).startsWith('..') ||
      !fs.existsSync(file) ||
      fs.statSync(file).isDirectory()
    ) {
      response.writeHead(404);
      response.end();
      return;
    }
    response.setHeader(
      'Content-Type',
      file.endsWith('.png') ? 'image/png' : 'text/html; charset=utf-8'
    );
    fs.createReadStream(file).pipe(response);
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const reportBase = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : fs.existsSync('/usr/bin/chromium')
        ? { executablePath: '/usr/bin/chromium' }
        : { channel: 'chrome' }),
  });
  for (const [file, width, name] of [
    ['index.html', 1440, 'home-desktop'],
    ['services/index.html', 390, 'services-mobile'],
    ['contact/index.html', 1440, 'contact-desktop'],
  ]) {
    const pair = pairs.find((p) => p.before.file === file && p.before.width === width);
    const page = await browser.newPage({
      viewport: { width: width === 1440 ? 1600 : 860, height: width === 1440 ? 1080 : 1120 },
    });
    const snippet = `<!doctype html><html lang="en"><meta charset="utf-8"><style>${style}.pair{grid-template-columns:repeat(2,minmax(0,1fr))}.scroll{height:${width === 1440 ? 870 : 950}px;overflow:hidden}.frame{padding:12px}header,main{padding:16px 24px}header p{margin-bottom:0}h1{font-size:24px;margin:0}.comparison{margin:0}.scroll img{width:100%}</style><body><header><h1>${file === 'index.html' ? 'Homepage' : file === 'contact/index.html' ? 'Contact information' : 'Service directory'} · Before and after</h1><p>Matched ${width}px captures · Top of page shown; full-page screenshots are in the gallery.</p></header><main><div class="pair">${['before', 'after'].map((phase) => `<figure class="frame"><h2>${phase === 'before' ? 'Before' : 'After'}</h2><div class="scroll"><img src="${pair[phase].screenshot}"></div></figure>`).join('')}</div></main></body></html>`;
    const summary = path.join(output, 'comparison-' + name + '.html');
    fs.writeFileSync(summary, snippet);
    await page.goto(reportBase + '/comparison-' + name + '.html', { waitUntil: 'load' });
    await page.screenshot({
      path: path.join(output, 'comparison-' + name + '.png'),
      fullPage: true,
    });
    await page.close();
  }
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
  console.log('Gallery and comparison screenshots saved to ' + output);
})();
