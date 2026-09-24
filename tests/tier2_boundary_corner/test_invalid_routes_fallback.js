/**
 * Tier 2 - Boundary: Invalid Direct Paths, Nested Routes & SPA Fallback
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('Tier 2 - Boundary: Invalid Routes & SPA Fallback', {
  tier: 2,
  milestone: 'M3',
  feature: 'Boundaries: Fallback Routing'
});

suite.test('Fallback Routing: Non-existent direct route loads 404 fallback without infinite redirection', async ({ page, baseUrl }) => {
  let redirectCount = 0;
  page.on('framenavigated', () => { redirectCount++; });

  const res = await page.goto(`${baseUrl}/completely-invalid-subpath-xyz`);
  await page.waitForTimeout(500);

  // Even if redirected, redirectCount should be bounded (not infinite loop)
  assert.ok(redirectCount < 6, `Excessive redirects detected: ${redirectCount}`);
});

suite.test('Fallback Routing: Direct landing on valid clean path /services hydrates properly', async ({ page, baseUrl }) => {
  // Directly navigate to /services (which via static server serves 404.html -> hydrates or serves index)
  await page.goto(`${baseUrl}/services`);
  await page.waitForTimeout(600);

  // The application router should resolve and scroll to #services
  const isServicesTargeted = await page.evaluate(() => {
    const s = document.getElementById('services');
    if (!s) return false;
    const rect = s.getBoundingClientRect();
    // Element should be within reasonable proximity of top of viewport (below fixed nav)
    return rect.top >= -50 && rect.top <= window.innerHeight;
  });

  assert.strictEqual(
    isServicesTargeted,
    true,
    'Landing on /services must scroll to services section'
  );
});

suite.test('Fallback Routing: Path with query parameters preserves parameter or ignores gracefully', async ({ page, baseUrl }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(`${baseUrl}/?utm_source=google&utm_campaign=test`);
  await page.waitForTimeout(400);

  assert.strictEqual(errors.length, 0);
  const heroVisible = await page.locator('#home, .hero').isVisible();
  assert.ok(heroVisible, 'Hero section must remain visible with query parameters');
});

suite.test('Fallback Routing: Mixed query parameter and hash /?ref=tg#calculator', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/?ref=tg#calculator`);
  await page.waitForTimeout(600);

  const calcVisible = await page.locator('#calculator').evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.top >= -50 && r.top <= window.innerHeight;
  });

  assert.strictEqual(calcVisible, true, 'Page must scroll to calculator when URL has both query and hash');
});

suite.test('Fallback Routing: Double slashes or trailing slashes /services/ normalized gracefully', async ({ page, baseUrl }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));

  await page.goto(`${baseUrl}/services/`);
  await page.waitForTimeout(500);

  assert.strictEqual(errors.length, 0);
});

module.exports = suite;
