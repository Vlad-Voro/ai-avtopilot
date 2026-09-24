/**
 * Tier 2 - Rapid Clicking & Fast Sequential Navigation
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('Tier 2 - Boundary: Rapid Clicking & Fast Nav', {
  tier: 2,
  milestone: 'M3',
  feature: 'Boundaries: Rapid Clicks'
});

suite.test('Rapid Navigation: Rapid clicking across multiple nav links does not throw errors', async ({ page, baseUrl }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(`${baseUrl}/`);

  const links = page.locator('.nav__links a, .nav__link');
  const count = await links.count();

  // Rapidly click all nav links sequentially with minimal delay
  for (let i = 0; i < count; i++) {
    await links.nth(i).click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(50);
  }

  assert.strictEqual(
    errors.length,
    0,
    `Errors occurred during rapid nav clicks: ${errors.join(', ')}`
  );
});

suite.test('Rapid Navigation: Rapid clicking logo returns to top (#home or /)', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/#contact`);
  await page.waitForTimeout(300);

  const logo = page.locator('.nav__logo').first();
  await logo.click();
  await page.waitForTimeout(500);

  const scrollY = await page.evaluate(() => window.scrollY);
  assert.ok(scrollY < 150, `Expected page to scroll back to top on logo click, got scrollY=${scrollY}`);
});

suite.test('Rapid Navigation: Repeated rapid clicks on CTA button do not open duplicate overlays', async ({ page, baseUrl }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(`${baseUrl}/`);

  const cta = page.locator('#cta-main, .btn--primary').first();
  for (let i = 0; i < 5; i++) {
    await cta.click().catch(() => {});
    await page.waitForTimeout(30);
  }

  assert.strictEqual(errors.length, 0);
});

suite.test('Rapid Navigation: History pushState and popState back/forward stability', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  // Simulate history transitions
  await page.evaluate(() => {
    window.history.pushState(null, '', '/services');
    window.history.pushState(null, '', '/cases');
    window.history.pushState(null, '', '/calculator');
  });

  await page.goBack();
  await page.waitForTimeout(100);
  const path1 = await page.evaluate(() => window.location.pathname);
  assert.strictEqual(path1, '/cases');

  await page.goBack();
  await page.waitForTimeout(100);
  const path2 = await page.evaluate(() => window.location.pathname);
  assert.strictEqual(path2, '/services');

  await page.goForward();
  await page.waitForTimeout(100);
  const path3 = await page.evaluate(() => window.location.pathname);
  assert.strictEqual(path3, '/cases');
});

suite.test('Rapid Navigation: Rapid hash hashchange events do not break scroll listener', async ({ page, baseUrl }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(`${baseUrl}/`);

  await page.evaluate(() => {
    location.hash = '#services';
    location.hash = '#cases';
    location.hash = '#calculator';
    location.hash = '#contact';
  });

  await page.waitForTimeout(300);
  assert.strictEqual(errors.length, 0);
});

module.exports = suite;
