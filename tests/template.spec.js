const { test, expect } = require('@playwright/test');
const fs = require('node:fs');
const path = require('node:path');
const retired = new RegExp(
  [
    'so' + 'la(?:n|en)',
    'viz' + 'caya',
    'da' + 'cayo',
    'tiong' + 'son',
    '69' + ',?296',
    '09' + '274008033',
  ].join('|'),
  'i'
);

async function prepare(page, { failApis = false } = {}) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('bs-vol-popup-v1', '1');
    } catch (_) {}
  });
  await page.route('https://api.open-meteo.com/**', (route) =>
    failApis
      ? route.abort()
      : route.fulfill({
          json: {
            current: {
              temperature_2m: 31,
              relative_humidity_2m: 70,
              wind_speed_10m: 8,
              time: '2026-11-10T16:00',
            },
          },
        })
  );
  await page.route('https://open.er-api.com/**', (route) =>
    failApis ? route.abort() : route.fulfill({ json: { rates: { USD: 0.02 } } })
  );
  // Third-party maps/fonts are not required to validate local template content.
  await page.route('https://www.openstreetmap.org/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: '<p>Map provider</p>' })
  );
}

function htmlPages(dir = path.resolve(__dirname, '../dist')) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? htmlPages(file) : entry.name.endsWith('.html') ? [file] : [];
  });
}

test('every exported page is static and free of retired local content', async ({ page }) => {
  test.setTimeout(120000);
  await prepare(page);
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  for (const file of htmlPages()) {
    const route =
      '/' + path.relative(path.resolve(__dirname, '../dist'), file).split(path.sep).join('/');
    const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
    expect(response.status(), route).toBe(200);
    const html = await response.text();
    expect(html, route).not.toMatch(/<!--\s*include:|\{\{root\}\}|data-nav=/);
    if (!route.endsWith('/offline.html')) {
      await expect(page.locator('header.site-header')).toHaveCount(1);
      await expect(page.locator('footer.site-footer')).toHaveCount(1);
    }
    await page.waitForFunction(() => document.readyState === 'complete');
    expect(await page.locator('body').textContent(), route).not.toMatch(retired);
    expect(await page.locator('placeholder').count(), route).toBe(0);
    expect(await page.locator('[data-lang="ilo"], [hreflang="ilo"]').count(), route).toBe(0);
    if (await page.locator('.lang-selector').count()) {
      expect(
        await page
          .locator('.lang-selector [data-lang]')
          .evaluateAll((nodes) => nodes.map((node) => node.dataset.lang)),
        route
      ).toEqual(['en', 'fil']);
    }
    expect(
      await page.locator('a[href^="mailto:"],script[src*="googletagmanager"]').count(),
      route
    ).toBe(0);
    // Published city numbers are limited to the homepage card and contact directory.
    const phoneCount = route === '/index.html' ? 7 : route === '/contact/index.html' ? 21 : 0;
    await expect(page.locator('a[href^="tel:"]'), route).toHaveCount(phoneCount);
    await expect(page.locator('.city-phone a[href^="tel:"]'), route).toHaveCount(phoneCount);
  }
  expect(errors).toEqual([]);
});

test('weather requests and map target Batangas City', async ({ page }) => {
  await prepare(page);
  const request = page.waitForRequest((url) => url.url().includes('api.open-meteo.com'));
  await page.goto('/');
  const url = new URL((await request).url());
  expect(url.searchParams.get('latitude')).toBe('13.7565');
  expect(url.searchParams.get('longitude')).toBe('121.0587');
  expect(url.searchParams.get('timezone')).toBe('Asia/Manila');
  await expect(page.locator('.weather-temp')).toHaveText('31°C');
  await expect(page.locator('#weather-container')).toContainText('Batangas City');
  await expect(page.locator('#osm-embed')).toHaveAttribute('src', /marker=13\.7565%2C121\.0587/);
});

test('API failures preserve explicit placeholders', async ({ page }) => {
  await prepare(page, { failApis: true });
  await page.goto('/');
  await expect(page.locator('.weather-temp')).toHaveText('<placeholder>');
  await expect(page.locator('#weather-container')).toContainText('<placeholder>');
  await expect(page.getByRole('button', { name: 'Retry weather' })).toBeVisible();
  await expect(page.locator('.rate-display')).toHaveText('<placeholder>');
});

test('language switching and JSON rendering retain literal placeholders', async ({ page }) => {
  await prepare(page);
  await page.goto('/government/');
  for (const lang of ['en', 'fil']) {
    await page.evaluate((lang) => TranslationEngine.switchLanguage(lang), lang);
    expect(await page.locator('body').innerText()).not.toMatch(retired);
    await expect(page.locator('main')).toContainText('<placeholder>');
  }
  await page.goto('/legislative/ordinance-framework.html');
  await expect(page.locator('#ordinance-table-body')).toContainText('<placeholder>');
  expect(await page.locator('placeholder').count()).toBe(0);
});

test('static navigation and mobile layout work', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/services/certificates.html');
  await expect(page.locator('main')).toBeVisible();
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)
  ).toBe(true);
  await page.goto('/');
  const logo = page.locator('.logo-img');
  await expect(logo).toBeVisible();
  expect(await logo.evaluate((img) => img.complete && img.naturalWidth > 0)).toBe(true);
  await page.screenshot({
    path: path.resolve(__dirname, '../test-results/template-mobile.png'),
    fullPage: true,
  });
});

test('first-visit volunteer popup addresses Batangueños', async ({ page }) => {
  const { gotoFresh, waitForOpen } = require('./helpers/volunteer-modal');
  await gotoFresh(page);
  const popup = await waitForOpen(page);
  await expect(popup.locator('.vol-popup-lead strong')).toHaveText('Batangueños');
  expect(await popup.textContent()).not.toMatch(retired);
});

test('retired language preferences fall back to a supported language', async ({ page }) => {
  await prepare(page);
  await page.addInitScript(() => {
    try {
      localStorage.setItem('selectedLang', 'ilo');
    } catch (_) {}
  });
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  expect(
    await page.evaluate(() => TranslationEngine.getSupportedLanguages().map((lang) => lang.code))
  ).toEqual(['en', 'fil']);
  expect(await page.evaluate(() => TranslationEngine.switchLanguage('ilo'))).toBe(false);
  await page.locator('.lang-selector [data-lang="fil"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
  await page.locator('.lang-selector [data-lang="en"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('Batangas City identity and shared navigation survive language changes', async ({ page }) => {
  await prepare(page);
  await page.goto('/');
  for (const lang of ['en', 'fil']) {
    await page.locator(`.lang-selector [data-lang="${lang}"]`).click();
    await expect(page.locator('main h1')).toContainText('Batangas City');
    await expect(page.locator('.footer-tagline')).toContainText('unofficial');
    await expect(page.locator('.logo-img')).toHaveAttribute('alt', 'Batangas City portal');
  }
  await page.goto('/service-details/birth-certificate.html');
  const active = page.locator('.main-nav a.active');
  await expect(active).toHaveCount(1);
  await expect(active).toHaveAttribute('href', '../services/');
  await expect(active).toHaveAttribute('aria-current', 'location');
  await expect(page.locator('main')).toContainText('<placeholder>');
  await expect(page.locator('footer a[href="../privacy/"]')).toHaveCount(1);
});

test('service search still opens the existing service detail page', async ({ page }) => {
  await prepare(page);
  await page.goto('/');
  await page.locator('#hero-search').fill('birth');
  const result = page.locator(
    '.search-result-item[href="/service-details/birth-certificate.html"]'
  );
  await expect(result).toBeVisible();
  await result.click();
  await expect(page).toHaveURL(/\/service-details\/birth-certificate\.html$/);
  await expect(page.locator('header.site-header')).toHaveCount(1);
  await expect(page.locator('footer.site-footer')).toHaveCount(1);
});
