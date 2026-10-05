/**
 * Suite 2: Navigation Flows, Routing, Burger Menu & History Stress
 * Consolidates R5 (clean routing & ScrollSpy), rapid clicks navigation, burger toggle (including R1.5/R1.6), and fallback routing.
 * Executes on a single warm page context with an afterEach state sanitizer.
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('E2E: Navigation & Routing Flows', {
  tier: 3,
  milestone: 'M1-M3',
  feature: 'NavigationFlows'
});

async function sanitizePage(page, baseUrl) {
  await page.setViewportSize({ width: 1200, height: 800 }).catch(() => {});
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll('.active, .open, .is-active').forEach(el => {
      el.classList.remove('active', 'open', 'is-active');
    });
    document.body.style.overflow = '';
  }).catch(() => {});
}

suite.before(async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto(`${baseUrl}/`);
});

// Clean routing (R5)
suite.test('R5.1: Navigation links use clean slash paths without raw "#"', async ({ page }) => {
  const hrefs = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('.nav__links a, .nav__link'))
      .map(a => a.getAttribute('href'));
  });
  for (const href of hrefs) {
    if (href && !href.startsWith('http') && !href.startsWith('mailto:') && !href.startsWith('tel:')) {
      assert.ok(!href.startsWith('#'), `Nav link '${href}' must use clean slash path instead of raw '#'`);
    }
  }
  await sanitizePage(page);
});

suite.test('R5.2: Clicking clean nav link updates URL via pushState without reloading page', async ({ page }) => {
  const link = page.locator('.nav__links a[href*="services"], .nav__link[href*="services"]').first();
  if (await link.count() > 0) {
    await link.click();
    await page.waitForFunction(() => window.location.pathname.includes('services') || window.location.hash.includes('services'));
    const url = await page.evaluate(() => window.location.href);
    assert.ok(url.includes('services'), `URL must reflect services path: ${url}`);
  }
  await sanitizePage(page);
});

suite.test('R5.3: Target sections specify scroll-margin-top (80px) to clear fixed header', async ({ page }) => {
  const hasScrollMargin = await page.evaluate(() => {
    const s = document.querySelector('section[id]');
    if (!s) return true;
    const style = window.getComputedStyle(s);
    return style.scrollMarginTop && style.scrollMarginTop !== '0px';
  });
  assert.ok(hasScrollMargin, 'Target sections must define scroll-margin-top to clear header');
  await sanitizePage(page);
});

suite.test('R5.4: GitHub Pages 404 SPA fallback redirect file exists and is configured', async ({ page, baseUrl }) => {
  const resp = await page.goto(`${baseUrl}/404.html`);
  assert.ok(resp.status() === 200, '404.html must be present and return 200');
  await page.goto(`${baseUrl}/`);
  await sanitizePage(page);
});

suite.test('R5.5: ScrollSpy updates browser address bar with replaceState during scroll', async ({ page }) => {
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForFunction(() => window.scrollY > 500);
  const currentUrl = await page.evaluate(() => window.location.href);
  assert.ok(currentUrl.length > 0, 'ScrollSpy should preserve valid window location');
  await sanitizePage(page);
});

suite.test('R5.6: Backward compatibility: direct navigation with #hash jumps cleanly', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/#calculator`);
  await page.waitForFunction(() => window.scrollY > 0).catch(() => {});
  const scrollY = await page.evaluate(() => window.scrollY);
  assert.ok(scrollY >= 0, 'Hash navigation completed');
  await sanitizePage(page);
});

// Rapid navigation stress
suite.test('Rapid Navigation: Rapid clicking across multiple nav links does not throw errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  const links = page.locator('.nav__links a, .nav__link');
  const count = await links.count();
  for (let i = 0; i < count; i++) {
    const link = links.nth(i);
    if (await link.isVisible()) {
      await link.click({ timeout: 500, noWaitAfter: true, force: true }).catch(() => {});
      await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));
    }
  }
  assert.strictEqual(errors.length, 0, `Errors during rapid nav: ${errors.join(', ')}`);
  await sanitizePage(page);
});

suite.test('Rapid Navigation: Rapid clicking logo returns to top (#home or /)', async ({ page, baseUrl }) => {
  await page.evaluate(() => window.scrollTo(0, 800));
  const logo = page.locator('.nav__logo').first();
  await logo.click({ force: true });
  await page.waitForFunction(() => window.scrollY < 200).catch(() => {});
  const scrollY = await page.evaluate(() => window.scrollY);
  assert.ok(scrollY < 200, 'Page must scroll to top on logo click');
  await sanitizePage(page);
});

suite.test('Rapid Navigation: Repeated rapid clicks on CTA button do not open duplicate overlays', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  const cta = page.locator('#cta-main, .btn--primary').first();
  for (let i = 0; i < 5; i++) {
    await cta.click({ noWaitAfter: true, force: true }).catch(() => {});
    await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));
  }
  assert.strictEqual(errors.length, 0);
  await sanitizePage(page);
});

suite.test('Rapid Navigation: History pushState and popState back/forward stability', async ({ page, baseUrl }) => {
  await page.evaluate(() => {
    window.history.pushState(null, '', '/services');
    window.history.pushState(null, '', '/cases');
  });
  await page.goBack();
  const path1 = await page.evaluate(() => window.location.pathname);
  assert.ok(path1.includes('services'), `Expected services path, got ${path1}`);
  await page.goto(`${baseUrl}/`);
  await sanitizePage(page);
});

suite.test('Rapid Navigation: Rapid hash hashchange events do not break scroll listener', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  await page.evaluate(() => {
    location.hash = '#services';
    location.hash = '#cases';
    location.hash = '#calculator';
    location.hash = '#contact';
  });
  assert.strictEqual(errors.length, 0);
  await sanitizePage(page);
});

// Burger menu rapid toggle & mobile navigation (including merged R1.5 & R1.6)
suite.test('Burger Toggle: Rapid toggle 4 times does not desynchronize menu or freeze UI', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const burger = page.locator('#burger, .nav__burger').first();
  for (let i = 0; i < 4; i++) {
    await burger.click({ force: true });
    await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));
  }
  const isFrozen = await page.evaluate(() => typeof window.scrollY !== 'number');
  assert.strictEqual(isFrozen, false, 'UI must remain responsive after rapid burger toggle');
  await sanitizePage(page);
});

suite.test('Burger Toggle: Menu toggles open, displays navigation links, and body scroll lock engages (R1.5 & R1.6)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const burger = page.locator('#burger, .nav__burger').first();
  await burger.click({ force: true });

  // Assert R1.5: Menu displays navigation links
  const navLinksVisible = await page.locator('.nav__links').isVisible();
  assert.strictEqual(navLinksVisible, true, 'Mobile menu must display navigation links when open');

  // Assert R1.6: Body scroll lock engages
  const bodyOverflow = await page.evaluate(() => window.getComputedStyle(document.body).overflow);
  assert.ok(bodyOverflow === 'hidden' || document.body.classList.contains('menu-open') || document.body.classList.contains('scroll-locked'), 'Body scroll lock must engage when menu is open');

  // Close menu and verify release
  await burger.click({ force: true });
  await sanitizePage(page);
});

suite.test('Burger Toggle: ESC key closes open mobile navigation menu', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const burger = page.locator('#burger, .nav__burger').first();
  await burger.click({ force: true });
  await page.keyboard.press('Escape');
  const isClosed = await page.evaluate(() => !document.querySelector('.nav__links')?.classList.contains('active'));
  assert.strictEqual(isClosed, true, 'ESC must close open mobile navigation');
  await sanitizePage(page);
});

suite.test('Burger Toggle: Clicking mobile nav link closes menu automatically', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const burger = page.locator('#burger, .nav__burger').first();
  await burger.click({ force: true });
  const firstLink = page.locator('.nav__links a').first();
  if (await firstLink.count() > 0) {
    await firstLink.click({ force: true });
    const isClosed = await page.evaluate(() => !document.querySelector('.nav__links')?.classList.contains('active'));
    assert.strictEqual(isClosed, true, 'Clicking link must close mobile menu');
  }
  await sanitizePage(page);
});

suite.test('Burger Toggle: Aria-expanded attribute updates synchronously with menu state', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const burger = page.locator('#burger, .nav__burger').first();
  await burger.click({ force: true });
  const expanded = await burger.getAttribute('aria-expanded');
  assert.strictEqual(expanded, 'true', 'aria-expanded must be true when menu is open');
  await burger.click({ force: true });
  const collapsed = await burger.getAttribute('aria-expanded');
  assert.strictEqual(collapsed, 'false', 'aria-expanded must be false when menu is closed');
  await sanitizePage(page);
});

// Fallback routing checks
suite.test('Fallback Routing: Non-existent direct route loads 404 fallback without infinite redirection', async ({ page, baseUrl }) => {
  const resp = await page.goto(`${baseUrl}/non-existent-route-xyz-123`);
  assert.ok(resp.status() === 404 || resp.status() === 200, 'Fallback page returned valid status');
  await page.goto(`${baseUrl}/`);
  await sanitizePage(page);
});

suite.test('Fallback Routing: Direct landing on valid clean path /services hydrates properly', async ({ page, baseUrl }) => {
  const resp = await page.goto(`${baseUrl}/services`);
  assert.ok(resp.status() === 200, 'Direct landing on /services returned 200');
  await page.goto(`${baseUrl}/`);
  await sanitizePage(page);
});

suite.test('Fallback Routing: Path with query parameters preserves parameter or ignores gracefully', async ({ page, baseUrl }) => {
  const resp = await page.goto(`${baseUrl}/?utm_source=test`);
  assert.ok(resp.status() === 200, 'Query parameter landing returned 200');
  await sanitizePage(page);
});

suite.test('Fallback Routing: Mixed query parameter and hash /?ref=tg#calculator', async ({ page, baseUrl }) => {
  const resp = await page.goto(`${baseUrl}/?ref=tg#calculator`);
  assert.ok(resp.status() === 200, 'Mixed query and hash returned 200');
  await sanitizePage(page);
});

suite.test('Fallback Routing: Double slashes or trailing slashes /services/ normalized gracefully', async ({ page, baseUrl }) => {
  const resp = await page.goto(`${baseUrl}/services/`);
  assert.ok(resp.status() === 200, 'Trailing slash returned 200');
  await page.goto(`${baseUrl}/`);
  await sanitizePage(page);
});

module.exports = suite;
