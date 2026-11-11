#!/usr/bin/env node
// Audits opaque solid foreground/background text pairs. Gradients and translucent layers are excluded.
const fs = require('fs'),
  path = require('path'),
  { chromium } = require('playwright');
const root = path.resolve(__dirname, '..'),
  { folders, files } = require(root + '/scripts/static-files');
function all(d) {
  return fs
    .readdirSync(d, { withFileTypes: true })
    .flatMap((e) =>
      e.isDirectory()
        ? all(path.join(d, e.name))
        : e.name.endsWith('.html')
          ? [path.relative(root, path.join(d, e.name))]
          : []
    );
}
(async () => {
  const b = await chromium.launch({
      ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
        ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
        : fs.existsSync('/usr/bin/chromium')
          ? { executablePath: '/usr/bin/chromium' }
          : { channel: 'chrome' }),
    }),
    p = await b.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  await p.addInitScript(() => {
    try {
      localStorage.setItem('bs-vol-popup-v1', '1');
    } catch (_) {}
  });
  await p.route('https://**', (r) => r.abort());
  const results = [];
  for (const file of [
    ...files.filter((x) => x.endsWith('.html')),
    ...folders.flatMap((f) => all(root + '/' + f)),
  ]) {
    await p.goto((process.env.REVIEW_BASE_URL || 'http://localhost:8000') + '/' + file);
    const issues = await p.evaluate(() => {
      const rgb = (s) => s.match(/[\d.]+/g)?.map(Number);
      const lum = (c) => {
        const s = c.slice(0, 3).map((v) => {
          v /= 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        });
        return s[0] * 0.2126 + s[1] * 0.7152 + s[2] * 0.0722;
      };
      const list = [];
      for (const el of document.querySelectorAll('main *,footer *')) {
        if (
          ![...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) ||
          el.closest('[aria-disabled=true],button:disabled,[hidden],.main-nav:not(.active)')
        )
          continue;
        const s = getComputedStyle(el),
          r = el.getBoundingClientRect();
        if (!r.width || !r.height || s.visibility === 'hidden' || s.opacity === '0') continue;
        let bg = null,
          opaque = true;
        for (let a = el; a; a = a.parentElement) {
          const v = getComputedStyle(a);
          if (Number(v.opacity) < 0.99) {
            opaque = false;
            break;
          }
          if (v.backgroundImage !== 'none') {
            opaque = false;
            break;
          }
          const c = rgb(v.backgroundColor);
          if (c && c[3] !== 0) {
            if (c[3] === undefined || c[3] === 1) bg = c;
            else opaque = false;
            break;
          }
        }
        if (!opaque) continue;
        bg ||= [255, 255, 255];
        const fg = rgb(s.color);
        if (!fg || (fg[3] !== undefined && fg[3] < 0.99)) continue;
        const ratio = (Math.max(lum(bg), lum(fg)) + 0.05) / (Math.min(lum(bg), lum(fg)) + 0.05);
        const large =
          parseFloat(s.fontSize) >= 24 ||
          (parseFloat(s.fontSize) >= 18.67 && Number(s.fontWeight) >= 700);
        if (ratio + 0.05 < (large ? 3 : 4.5))
          list.push({
            tag: el.tagName,
            class: el.className,
            text: el.textContent.trim().slice(0, 65),
            fg: s.color,
            bg: bg.slice(0, 3),
            ratio: +ratio.toFixed(2),
          });
      }
      return list;
    });
    if (issues.length) results.push({ file, issues });
  }
  const output = process.env.REVIEW_OUTPUT_DIR || path.join(root, 'review-artifacts');
  fs.mkdirSync(output, { recursive: true });
  fs.writeFileSync(
    path.join(output, 'solid-color-contrast-audit.json'),
    JSON.stringify(results, null, 2)
  );
  console.log(JSON.stringify(results));
  await b.close();
  if (results.length) process.exitCode = 1;
})();
