const { test, expect } = require('@playwright/test');
const { gotoFresh, waitForOpen } = require('./helpers/volunteer-modal');
async function prepare(page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('bs-vol-popup-v1', '1');
    } catch (_) {}
  });
  await page.route('https://**', (route) => route.abort());
}
test('mobile navigation reverses promptly and returns keyboard focus', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/');
  const toggle = page.getByRole('button', { name: 'Toggle Navigation' });
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.main-nav a').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  await expect(toggle).toBeFocused();
  await toggle.click();
  await toggle.click();
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
});
test('FAQ answers can be opened and closed without a pointer', async ({ page }) => {
  await prepare(page);
  await page.goto('/service-details/birth-certificate.html');
  const question = page.locator('button.faq-question').first();
  await question.focus();
  await page.keyboard.press('Enter');
  await expect(question).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('#' + (await question.getAttribute('aria-controls')))).toBeVisible();
  await page.keyboard.press('Space');
  await expect(question).toHaveAttribute('aria-expanded', 'false');
});
test('indicator and legislative tabs expose selection and respond to arrow keys', async ({
  page,
}) => {
  await prepare(page);
  await page.goto('/statistics/');
  const first = page.locator('.cmci-tab').first();
  await first.focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#panel-economic-dynamism')).toBeVisible();
  await expect(page.locator('#panel-overview')).toBeHidden();
  await expect(page.locator('.cmci-tab').nth(1)).toHaveAttribute('aria-selected', 'true');
  await page.goto('/legislative/');
  await page.locator('.leg-tab-btn').first().focus();
  await page.keyboard.press('End');
  await expect(page.locator('#resolutions')).toBeVisible();
  await expect(page.locator('#ordinances')).toBeHidden();
});
test('unpublished news and unavailable weather explain what to do next', async ({ page }) => {
  await prepare(page);
  await page.goto('/news/');
  await expect(page.locator('#news-grid')).toContainText('No updates published yet');
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Retry weather' })).toBeVisible();
  await page.getByRole('button', { name: 'Retry weather' }).click();
  await expect(page.getByRole('button', { name: 'Retry weather' })).toBeVisible();
  const toggle = page.getByRole('button', { name: 'Pause updates' });
  await toggle.click();
  await expect(page.getByRole('button', { name: 'Resume updates' })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});
test('focus is visible and modal background is inert until dismissal', async ({ page }) => {
  await gotoFresh(page);
  const popup = await waitForOpen(page);
  expect(await page.locator('main').evaluate((el) => el.inert)).toBe(true);
  await popup.locator('.vol-popup-close').focus();
  const outline = await popup
    .locator('.vol-popup-close')
    .evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
  await page.keyboard.press('Escape');
  expect(await page.locator('main').evaluate((el) => el.inert)).toBe(false);
});
test('reduced motion removes movement and narrow RTL/FIL views keep content available', async ({
  page,
}) => {
  await prepare(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/');
  await page.locator('[data-lang="fil"]').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
  await page.evaluate(() => (document.documentElement.dir = 'rtl'));
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  ).toBeLessThanOrEqual(1);
  await page.goto('/services/');
  await page.evaluate(() => (document.documentElement.style.fontSize = '200%'));
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  ).toBeLessThanOrEqual(1);
  await expect(page.locator('main')).toBeVisible();
});
test('table scrolling is local and labeled on a narrow screen', async ({ page }) => {
  await prepare(page);
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto('/service-details/marriage-certificate.html');
  const region = page.locator('.scrollable-table[tabindex="0"]').first();
  await expect(region).toBeVisible();
  await expect(region).toHaveAttribute('aria-describedby', /table-hint-/);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)
  ).toBeLessThanOrEqual(1);
});
test('news editor errors identify and focus the first invalid input', async ({ page }) => {
  test.skip(!!process.env.STATIC_TEST_DIR, 'The editor is intentionally excluded from production.');
  await prepare(page);
  await page.goto('/admin/news-editor.html');
  await page.locator('#btn-new').click();
  await page.locator('#btn-save').click();
  await expect(page.locator('#f-title')).toBeFocused();
  await expect(page.locator('#f-title')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#f-title-error')).toContainText('Enter a news title');
});

test('search input boundaries retain three-to-one contrast and mobile text stays readable', async ({
  page,
}) => {
  await prepare(page);
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ['/', '/services/']) {
    await page.goto(route);
    const style = await page
      .getByRole('searchbox', { name: 'Search services' })
      .evaluate((input) => {
        const s = getComputedStyle(input);
        return {
          border: s.borderColor,
          background: s.backgroundColor,
          font: parseFloat(s.fontSize),
        };
      });
    const luminance = (color) => {
      const rgb = color
        .match(/[\d.]+/g)
        .slice(0, 3)
        .map(Number)
        .map((v) => {
          v /= 255;
          return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
        });
      return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
    };
    const a = luminance(style.border),
      b = luminance(style.background);
    expect((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toBeGreaterThanOrEqual(3);
    expect(style.font).toBeGreaterThanOrEqual(16);
  }
});

test('press feedback uses the specified scale and unavailable actions stay static', async ({
  page,
}) => {
  await prepare(page);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/');
  const button = page.locator('.lang-btn[data-lang="fil"]');
  await button.hover();
  await page.mouse.down();
  await page.waitForTimeout(180);
  expect(await button.evaluate((el) => Number(getComputedStyle(el).scale))).toBeCloseTo(0.96, 2);
  await page.mouse.up();
  const unavailable = page.locator('.appointment-cta-btn[aria-disabled="true"]').first();
  await unavailable.hover();
  await page.mouse.down();
  expect(await unavailable.evaluate((el) => getComputedStyle(el).transform)).toBe('none');
  expect(await unavailable.evaluate((el) => getComputedStyle(el).scale)).toBe('1');
  await page.mouse.up();
});
