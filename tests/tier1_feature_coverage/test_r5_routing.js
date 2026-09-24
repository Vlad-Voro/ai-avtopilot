/**
 * Tier 1 - R5: Clean Slash Navigation Without '#'
 * Feature Milestone: M3
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('Tier 1 - R5: Clean Slash Routing & SPA Fallback', {
  tier: 1,
  milestone: 'M3',
  feature: 'R5'
});

suite.test('R5.1: Navigation links use clean slash paths without raw "#"', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const links = await page.evaluate(() => {
    const navAnchors = Array.from(document.querySelectorAll('.nav__links a, .nav__link'));
    return navAnchors.map(a => ({
      text: a.textContent.trim(),
      href: a.getAttribute('href')
    }));
  });

  assert.ok(links.length > 0, 'Navigation links must exist in the header');

  const rawHashLinks = links.filter(l => l.href && l.href.startsWith('#'));
  assert.strictEqual(
    rawHashLinks.length,
    0,
    `Navigation links must use clean slash paths (e.g. /services), but found raw hash links: ${JSON.stringify(rawHashLinks)}`
  );

  const cleanPaths = links.map(l => l.href);
  assert.ok(cleanPaths.some(p => p === '/services'), 'Expected /services clean path link');
  assert.ok(cleanPaths.some(p => p === '/cases'), 'Expected /cases clean path link');
  assert.ok(cleanPaths.some(p => p === '/calculator'), 'Expected /calculator clean path link');
});

suite.test('R5.2: Clicking clean nav link updates URL via pushState without reloading page', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  // Set a marker in window to detect if full page reload happened
  await page.evaluate(() => {
    window.__PAGE_RELOAD_MARKER = 'persistent';
  });

  const casesLink = page.locator('.nav__links a, .nav__link', { hasText: 'Кейсы' }).first();
  await casesLink.click();
  await page.waitForTimeout(400);

  const state = await page.evaluate(() => {
    return {
      pathname: window.location.pathname,
      marker: window.__PAGE_RELOAD_MARKER
    };
  });

  assert.strictEqual(state.marker, 'persistent', 'Page must not reload when clicking clean nav link');
  assert.strictEqual(
    state.pathname,
    '/cases',
    `Expected URL pathname to update to '/cases' via history.pushState, but got '${state.pathname}'`
  );
});

suite.test('R5.3: Target sections specify scroll-margin-top (80px) to clear fixed header', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const margins = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('section[id]'));
    return sections.map(s => {
      const style = window.getComputedStyle(s);
      return {
        id: s.id,
        scrollMarginTop: style.scrollMarginTop,
        scrollMarginTopPx: parseFloat(style.scrollMarginTop || '0')
      };
    });
  });

  assert.ok(margins.length > 0, 'Sections with ID must exist');

  // Verify that sections have scroll-margin-top >= 70px to avoid 80px fixed header clipping
  const withoutMargin = margins.filter(m => m.scrollMarginTopPx < 70);
  assert.strictEqual(
    withoutMargin.length,
    0,
    `Sections must declare scroll-margin-top >= 70px for fixed header clearance. Missing on: ${withoutMargin.map(m => m.id).join(', ')}`
  );
});

suite.test('R5.4: GitHub Pages 404 SPA fallback redirect file exists and is configured', async ({ baseUrl }) => {
  // Test loading a clean route directly from server
  const response = await fetch(`${baseUrl}/404.html`);
  assert.strictEqual(
    response.status,
    200,
    `404.html SPA fallback must exist in the root directory (got HTTP status ${response.status})`
  );

  const html = await response.text();
  assert.ok(
    html.includes('sessionStorage') || html.includes('location.search') || html.includes('?p='),
    '404.html must contain SPA redirect script to preserve requested path'
  );
});

suite.test('R5.5: ScrollSpy updates browser address bar with replaceState during scroll', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  // Scroll to cases section
  const casesSection = page.locator('#cases');
  await casesSection.scrollIntoViewIfNeeded();
  await page.waitForTimeout(600); // Allow IntersectionObserver to fire

  const currentPath = await page.evaluate(() => window.location.pathname);
  assert.strictEqual(
    currentPath,
    '/cases',
    `Expected ScrollSpy to update window.location.pathname to '/cases' when scrolling into view, got '${currentPath}'`
  );
});

suite.test('R5.6: Backward compatibility: direct navigation with #hash jumps cleanly', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/#calculator`);
  await page.waitForTimeout(500);

  const isVisibleInViewport = await page.locator('#calculator').evaluate(el => {
    const rect = el.getBoundingClientRect();
    return rect.top >= -50 && rect.top <= window.innerHeight;
  });

  assert.strictEqual(
    isVisibleInViewport,
    true,
    'Legacy #calculator URL must scroll to calculator section'
  );
});

module.exports = suite;
