const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.route('https://**', (route) => route.abort());
  await page.goto('/services/');
});

test('quick links provide keyboard access to existing service guidance', async ({ page }) => {
  const shortcuts = page.getByRole('navigation', { name: 'Quick links' });
  const birth = shortcuts.getByRole('link', { name: 'Birth Certificate' });
  await birth.focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/\/service-details\/birth-certificate\.html$/);
  await expect(page.locator('h1')).toBeVisible();
  await page.goBack();
  for (const link of await page.locator('.service-shortcut-links a').all()) {
    // Resolve links relative to the directory, just as the browser does.
    const url = await link.evaluate((el) => el.href);
    expect((await page.request.get(url)).ok()).toBe(true);
  }
});

test('labeled search still offers matching services and keyboard selection', async ({ page }) => {
  const input = page.getByRole('searchbox', { name: 'What service do you need?' });
  await input.fill('birth certificate');
  const results = page.locator('.search-result-item');
  await expect(results.first()).toBeVisible();
  await expect(results.first()).toContainText(/birth/i);
  await page.keyboard.press('ArrowDown');
  await expect(results.first()).toHaveClass(/selected/);
  await page.keyboard.press('Escape');
  await expect(page.locator('.search-autocomplete')).toBeHidden();
  await expect(input).toHaveValue('birth certificate');
});

test('new directory content and search hint translate to Filipino', async ({ page }) => {
  await page.locator('[data-lang=fil]').click();
  await expect(page.locator('h1')).toHaveText('Direktoryo ng mga Serbisyo ng Lungsod');
  const input = page.getByLabel('Anong serbisyo ang kailangan mo?');
  await expect(input).toHaveAttribute('placeholder', 'Hal., birth certificate');
  await expect(page.locator('#service-categories-title')).toHaveText('Maghanap ayon sa kategorya');
  await expect(page.locator('.service-category-count')).toHaveText('10 kategorya');
  await expect(page.locator('.service-shortcut-links')).toContainText('Tulong pinansyal');
});

test('directory fits narrow screens and enlarged text in both languages', async ({ page }) => {
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const language of ['EN', 'FIL']) {
      await page.locator('[data-lang=' + language.toLowerCase() + ']').click();
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      );
      for (const link of await page.locator('.service-shortcut-links a').all()) {
        const box = await link.boundingBox();
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.x + box.width).toBeLessThanOrEqual(width);
      }
      await expect(page.locator('.service-category-card')).toHaveCount(10);
    }
  }
});
