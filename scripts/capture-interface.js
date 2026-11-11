#!/usr/bin/env node
// Reproducible evidence: same fonts, fixed clock, failed external APIs, no sample local data.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const { folders, files } = require('./static-files');
const root = path.resolve(__dirname, '..');
const phase = process.argv[2] || 'after';
const output = process.env.REVIEW_OUTPUT_DIR || path.join(root, 'review-artifacts');
const base = process.env.REVIEW_BASE_URL || 'http://localhost:8123';
const assets = path.join(output, 'capture-assets');
const representative = new Set([
  'index.html',
  'services/index.html',
  'service-details/birth-certificate.html',
  'government/index.html',
  'government/officials.html',
  'statistics/index.html',
  'budget/index.html',
  'legislative/index.html',
  'news/index.html',
  'contact/index.html',
  'faq/index.html',
  'privacy/index.html',
  'accessibility/index.html',
  '404.html',
  'offline.html',
  'admin/news-editor.html',
]);
function pages(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory()
      ? pages(file)
      : file.endsWith('.html')
        ? [path.relative(root, file).split(path.sep).join('/')]
        : [];
  });
}
const allRoutes = [
  ...files.filter((name) => name.endsWith('.html')),
  ...folders.flatMap((name) => pages(path.join(root, name))),
  'admin/news-editor.html',
];
const routes = process.env.REVIEW_PAGES
  ? allRoutes.filter((file) => process.env.REVIEW_PAGES.split(',').includes(file))
  : allRoutes;
(async () => {
  const browser = await chromium.launch({
    ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }
      : fs.existsSync('/usr/bin/chromium')
        ? { executablePath: '/usr/bin/chromium' }
        : { channel: 'chrome' }),
    headless: true,
  });
  const results = [];
  const fontCSS =
    '@font-face{font-family:Inter;font-style:normal;font-weight:100 900;font-display:swap;src:url(https://fonts.gstatic.com/interface-review-inter.woff2) format("woff2")}';
  for (const width of [1440, 390, 320]) {
    const context = await browser.newContext({
      viewport: { width, height: width === 1440 ? 1000 : 844 },
      reducedMotion: 'reduce',
      locale: 'en-PH',
      serviceWorkers: 'block',
    });
    await context.addInitScript(() => {
      try {
        localStorage.setItem('bs-vol-popup-v1', '1');
        localStorage.setItem('selectedLang', 'en');
      } catch (_) {}
    });
    await context.route('**/*', (route) => {
      const url = route.request().url();
      if (url.startsWith(base) || url.startsWith('data:')) return route.continue();
      if (url.includes('fonts.googleapis.com'))
        return route.fulfill({ contentType: 'text/css', body: fontCSS });
      if (url.includes('fonts.gstatic.com'))
        return route.fulfill({
          contentType: 'font/woff2',
          body: fs.readFileSync(path.join(assets, 'inter.woff2')),
        });
      if (url.includes('bootstrap-icons.css'))
        return route.fulfill({
          contentType: 'text/css',
          body: fs.readFileSync(path.join(assets, 'bootstrap-icons.css')),
        });
      if (url.includes('bootstrap-icons.woff2'))
        return route.fulfill({
          contentType: 'font/woff2',
          body: fs.readFileSync(path.join(assets, 'bootstrap-icons.woff2')),
        });
      return route.abort();
    });
    const page = await context.newPage();
    await page.clock.setFixedTime(new Date('2026-11-11T04:00:00Z'));
    for (const file of routes) {
      const url = file === 'index.html' ? '/' : '/' + file;
      const errors = [];
      const onError = (error) => errors.push(error.message);
      page.on('pageerror', onError);
      const response = await page.goto(base + url, { waitUntil: 'load' });
      if (response.status() !== 200) throw new Error(url + ': HTTP ' + response.status());
      await page.evaluate(() => document.fonts.ready);
      // Scroll each surface into view so real intersection observers reveal its content.
      for (
        let y = 0, total = await page.evaluate(() => document.body.scrollHeight);
        y < total;
        y += 700
      ) {
        await page.evaluate((y) => window.scrollTo(0, y), y);
        await page.waitForTimeout(12);
      }
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(100);
      const metrics = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth - innerWidth,
        title: document.title,
        offenders: [...document.querySelectorAll('main *,header *,footer *')]
          .filter((el) => {
            const b = el.getBoundingClientRect(),
              s = getComputedStyle(el);
            return (
              b.width > 0 &&
              s.visibility !== 'hidden' &&
              (b.right > innerWidth + 1 || b.left < -1) &&
              s.position !== 'fixed'
            );
          })
          .slice(0, 15)
          .map((el) => ({
            tag: el.tagName,
            class: el.className,
            width: Math.round(el.getBoundingClientRect().width),
          })),
      }));
      let screenshot = null,
        violations = [];
      if (representative.has(file) && width !== 320) {
        const name =
          file.replace(/\.html$/, '').replaceAll('/', '--') +
          '-' +
          (width === 1440 ? 'desktop' : 'mobile') +
          '.png';
        const location = path.join(output, phase, name);
        fs.mkdirSync(path.dirname(location), { recursive: true });
        await page.screenshot({ path: location, fullPage: true, animations: 'disabled' });
        screenshot = phase + '/' + name;
        if (width === 1440) {
          await page.addScriptTag({ path: require.resolve('axe-core') });
          const audit = await page.evaluate(async () => {
            const result = await axe.run(document, {
              runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'] },
            });
            return result.violations.map((v) => ({
              id: v.id,
              impact: v.impact,
              description: v.description,
              nodes: v.nodes.map((n) => ({ target: n.target, summary: n.failureSummary })),
            }));
          });
          violations = audit;
        }
      }
      results.push({ file, width, ...metrics, errors, screenshot, violations });
      page.removeListener('pageerror', onError);
    }
    await context.close();
    console.log(phase + ': inspected ' + routes.length + ' pages at ' + width + 'px');
  }
  fs.writeFileSync(
    path.join(output, phase + '-audit.json'),
    JSON.stringify(
      process.env.REVIEW_PAGES && fs.existsSync(path.join(output, phase + '-audit.json'))
        ? [
            ...JSON.parse(fs.readFileSync(path.join(output, phase + '-audit.json'), 'utf8')).filter(
              (item) => !routes.includes(item.file)
            ),
            ...results,
          ]
        : results,
      null,
      2
    )
  );
  await browser.close();
  console.log('Evidence saved to ' + output);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
