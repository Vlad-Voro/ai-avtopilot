/**
 * Tier 2 - Boundary: Rapid Burger Menu Toggling & Body Scroll Lock
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('Tier 2 - Boundary: Mobile Burger Toggle & Scroll Lock', {
  tier: 2,
  milestone: 'M1',
  feature: 'Boundaries: Burger Toggle'
});

suite.before(async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);
});

suite.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
});

suite.test('Burger Toggle: Rapid toggle 4 times does not desynchronize menu or freeze UI', async ({ page }) => {
  const burger = page.locator('#burger, .nav__burger');
  for (let i = 0; i < 4; i++) {
    await burger.click({ force: true });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));
  }

  // After an even number (4) of clicks, menu should return to closed state
  const isMenuClosed = await page.locator('.nav__links').evaluate(el => {
    const s = window.getComputedStyle(el);
    return !el.classList.contains('active') && !el.classList.contains('is-open') &&
           (s.display === 'none' || parseFloat(s.opacity || '1') === 0 || s.visibility === 'hidden');
  });

  assert.strictEqual(
    isMenuClosed,
    true,
    'After 4 toggles, burger menu should be cleanly closed without desync'
  );
});

suite.test('Burger Toggle: Closing menu releases body scroll lock (overflow becomes visible/auto)', async ({ page }) => {
  const burger = page.locator('#burger, .nav__burger');

  // Open menu
  await burger.click();
  await page.waitForFunction(() => document.querySelector('.nav__links').classList.contains('active'));

  // Close menu
  await burger.click();
  await page.waitForFunction(() => !document.querySelector('.nav__links').classList.contains('active'));

  const bodyOverflow = await page.evaluate(() => window.getComputedStyle(document.body).overflow);
  assert.notStrictEqual(
    bodyOverflow,
    'hidden',
    `Expected body overflow to NOT be hidden after closing menu, got '${bodyOverflow}'`
  );
});

suite.test('Burger Toggle: ESC key closes open mobile navigation menu', async ({ page }) => {
  const burger = page.locator('#burger, .nav__burger');
  await burger.click();
  await page.waitForFunction(() => document.querySelector('.nav__links').classList.contains('active'));

  // Press ESC
  await page.keyboard.press('Escape');
  await page.waitForFunction(() => !document.querySelector('.nav__links').classList.contains('active'));

  const isClosed = await page.locator('.nav__links').evaluate(el => {
    return !el.classList.contains('active') && !el.classList.contains('is-open');
  });

  assert.strictEqual(isClosed, true, 'Escape key should close mobile navigation menu');
});

suite.test('Burger Toggle: Clicking mobile nav link closes menu automatically', async ({ page }) => {
  const burger = page.locator('#burger, .nav__burger');
  await burger.click();
  await page.waitForFunction(() => document.querySelector('.nav__links').classList.contains('active'));

  const link = page.locator('.nav__links a, .nav__link').first();
  await link.click();
  await page.waitForFunction(() => !document.querySelector('.nav__links').classList.contains('active'));

  const isClosed = await page.locator('.nav__links').evaluate(el => {
    return !el.classList.contains('active') && !el.classList.contains('is-open');
  });

  assert.strictEqual(isClosed, true, 'Clicking a navigation link inside mobile menu must close the menu');
});

suite.test('Burger Toggle: Aria-expanded attribute updates synchronously with menu state', async ({ page }) => {
  const burger = page.locator('#burger, .nav__burger');
  await burger.click();
  await page.waitForFunction(() => document.querySelector('#burger, .nav__burger').getAttribute('aria-expanded') === 'true');

  const expanded = await burger.getAttribute('aria-expanded');
  assert.strictEqual(expanded, 'true', "Expected aria-expanded='true' when burger menu is open");

  // Close back to restore clean state
  await burger.click();
  await page.waitForFunction(() => !document.querySelector('.nav__links').classList.contains('active'));
});

module.exports = suite;
