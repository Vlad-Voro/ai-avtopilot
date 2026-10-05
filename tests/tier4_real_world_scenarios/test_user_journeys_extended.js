/**
 * Tier 4 - Real-World Workload Scenarios: Extended User Journeys
 * Covers Deep Linking (/cases SPA fallback) and Mobile Lead Flow (375px).
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('Tier 4 - Real-World Workload: Extended Journeys', {
  tier: 4,
  milestone: 'Cross-Milestone',
  feature: 'User Journeys Extended'
});

suite.test('Journey 4: Deep linking via clean URL /cases with browser back/forward navigation', async ({ page, baseUrl }) => {
  // Directly navigate to /cases
  await page.goto(`${baseUrl}/cases`);
  await page.waitForFunction(() => {
    const el = document.getElementById('cases');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top >= -50 && r.top <= window.innerHeight;
  });

  const hasCases = (await page.locator('#cases').count()) > 0;
  assert.ok(hasCases, 'Direct navigation to /cases failed: page did not hydrate to #cases (missing 404 SPA fallback or clean routing)');

  // Cases section should be visible
  const casesInView = await page.locator('#cases').evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.top >= -50 && r.top <= window.innerHeight;
  });
  assert.ok(casesInView, 'Direct navigation to /cases must land on cases section');

  // Navigate to calculator via menu
  const calcLink = page.locator('.nav__links a, .nav__link', { hasText: 'Калькулятор' }).first();
  await calcLink.click();
  await page.waitForFunction(() => {
    const el = document.getElementById('calculator');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top >= -50 && r.top <= window.innerHeight;
  });

  // Hit browser back
  await page.goBack();
  await page.waitForFunction(() => window.location.pathname.startsWith('/cases'));

  const currentPath = await page.evaluate(() => window.location.pathname);
  assert.ok(currentPath === '/cases' || currentPath === '/cases/', `Expected browser back to return to '/cases/', got '${currentPath}'`);
});

suite.test('Journey 5: Mobile user complete lead flow on 375px viewport', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${baseUrl}/`);

  // Open mobile burger menu
  const burger = page.locator('#burger, .nav__burger');
  await burger.click();
  await page.waitForFunction(() => document.querySelector('.nav__links')?.classList.contains('active'));

  // Navigate to Contact from burger menu (should be present inside mobile navigation)
  const navContact = page.locator('.nav__links a[href*="contact"]');
  const hasContactInNav = (await navContact.count()) > 0;
  assert.ok(hasContactInNav, 'Mobile navigation menu must expose a Contact link for mobile users');

  await navContact.first().click();
  await page.waitForFunction(() => {
    const el = document.getElementById('contact');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top >= -100 && r.top <= window.innerHeight;
  }, { timeout: 3000 }).catch(() => {});

  // Contact form should be in view
  const contactVisible = await page.locator('#contact').evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.top >= -100 && r.top <= window.innerHeight;
  });
  assert.ok(contactVisible, 'Mobile user should arrive at contact form');

  // Fill in form inputs if present
  const nameInput = page.locator('#contact input[type="text"], #contact input[name="name"], #contact input[placeholder*="имя" i]').first();
  if (await nameInput.count() > 0) {
    await nameInput.fill('Алексей');
    const val = await nameInput.inputValue();
    assert.strictEqual(val, 'Алексей');
  }
});

module.exports = suite;
