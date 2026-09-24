/**
 * Tier 2 - Boundary: Rapid Burger Menu Toggling & Body Scroll Lock
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('Tier 2 - Boundary: Mobile Burger Toggle & Scroll Lock', {
  tier: 2,
  milestone: 'M1',
  feature: 'Boundaries: Burger Toggle'
});

suite.test('Burger Toggle: Rapid toggle 10 times does not desynchronize menu or freeze UI', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${baseUrl}/`);

  const burger = page.locator('#burger, .nav__burger');
  for (let i = 0; i < 10; i++) {
    await burger.click();
    await page.waitForTimeout(60);
  }

  // After an even number (10) of clicks, menu should return to closed state
  const isMenuClosed = await page.locator('.nav__links').evaluate(el => {
    const s = window.getComputedStyle(el);
    return !el.classList.contains('active') && !el.classList.contains('is-open') &&
           (s.display === 'none' || parseFloat(s.opacity || '1') === 0 || s.visibility === 'hidden');
  });

  assert.strictEqual(
    isMenuClosed,
    true,
    'After 10 toggles, burger menu should be cleanly closed without desync'
  );
});

suite.test('Burger Toggle: Closing menu releases body scroll lock (overflow becomes visible/auto)', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${baseUrl}/`);

  const burger = page.locator('#burger, .nav__burger');

  // Open menu
  await burger.click();
  await page.waitForTimeout(150);

  // Close menu
  await burger.click();
  await page.waitForTimeout(150);

  const bodyOverflow = await page.evaluate(() => window.getComputedStyle(document.body).overflow);
  assert.notStrictEqual(
    bodyOverflow,
    'hidden',
    `Expected body overflow to NOT be hidden after closing menu, got '${bodyOverflow}'`
  );
});

suite.test('Burger Toggle: ESC key closes open mobile navigation menu', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${baseUrl}/`);

  const burger = page.locator('#burger, .nav__burger');
  await burger.click();
  await page.waitForTimeout(200);

  // Press ESC
  await page.keyboard.press('Escape');
  await page.waitForTimeout(200);

  const isClosed = await page.locator('.nav__links').evaluate(el => {
    return !el.classList.contains('active') && !el.classList.contains('is-open');
  });

  assert.strictEqual(isClosed, true, 'Escape key should close mobile navigation menu');
});

suite.test('Burger Toggle: Clicking mobile nav link closes menu automatically', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${baseUrl}/`);

  const burger = page.locator('#burger, .nav__burger');
  await burger.click();
  await page.waitForTimeout(200);

  const link = page.locator('.nav__links a, .nav__link').first();
  await link.click();
  await page.waitForTimeout(300);

  const isClosed = await page.locator('.nav__links').evaluate(el => {
    return !el.classList.contains('active') && !el.classList.contains('is-open');
  });

  assert.strictEqual(isClosed, true, 'Clicking a navigation link inside mobile menu must close the menu');
});

suite.test('Burger Toggle: Aria-expanded attribute updates synchronously with menu state', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${baseUrl}/`);

  const burger = page.locator('#burger, .nav__burger');
  await burger.click();
  await page.waitForTimeout(150);

  const expanded = await burger.getAttribute('aria-expanded');
  assert.strictEqual(expanded, 'true', "Expected aria-expanded='true' when burger menu is open");
});

module.exports = suite;
