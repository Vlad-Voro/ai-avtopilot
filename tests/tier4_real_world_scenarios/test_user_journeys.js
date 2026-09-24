/**
 * Tier 4 - Real-World Workload Scenarios (Full E2E User Journeys)
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('Tier 4 - Real-World Workload User Journeys', {
  tier: 4,
  milestone: 'Cross-Milestone',
  feature: 'User Journeys'
});

suite.test('Journey 1: First-time visitor lands, observes hero typewriter and examines live dashboard', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  // 1. Hero offer inspection
  const heroTitle = await page.locator('.hero__title').textContent();
  assert.ok(heroTitle.includes('Ваши процессы'), 'Hero title must be present');

  // 2. Wait for typewriter to produce text
  await page.waitForTimeout(600);
  const typedText = await page.locator('#typed-text').textContent();
  assert.ok(typedText.length > 0, 'Typewriter must emit text');

  // 3. Scroll to Live Dashboard
  const dashboard = page.locator('#dashboard, .dashboard').first();
  await dashboard.scrollIntoViewIfNeeded();
  await page.waitForTimeout(400);

  // 4. Verify dashboard metrics / chart exist
  const hasDashboardElements = await page.evaluate(() => {
    const d = document.getElementById('dashboard') || document.querySelector('.dashboard');
    if (!d) return false;
    const cards = d.querySelectorAll('.dash-card, .chart__bar, .dash-metric');
    return cards.length > 0;
  });

  assert.ok(hasDashboardElements, 'Dashboard elements should be populated and visible');
});

suite.test('Journey 2: Service exploration - user navigates to services bento grid and inspects offerings', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  // Click Services nav link
  const servicesLink = page.locator('.nav__links a, .nav__link', { hasText: 'Услуги' }).first();
  await servicesLink.click();
  await page.waitForTimeout(600);

  // Verify services in view
  const isServicesInView = await page.locator('#services').evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.top >= -50 && r.top <= window.innerHeight;
  });
  assert.ok(isServicesInView, 'Page should have scrolled to #services section');

  // Hover first bento card
  const firstCard = page.locator('.scard').first();
  await firstCard.hover();
  await page.waitForTimeout(300);

  const cardVisible = await firstCard.isVisible();
  assert.ok(cardVisible, 'Bento service card should be clearly visible');
});

suite.test('Journey 3: Executive ROI calculation with custom parameters and lead capture transition', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  // Navigate to calculator
  const calcLink = page.locator('.nav__links a, .nav__link', { hasText: 'Калькулятор' }).first();
  await calcLink.click();
  await page.waitForTimeout(600);

  // Adjust parameters: 15 employees, 10 hrs/week, 120,000 rub/month
  // D = 10 / 160 = 0.0625
  // M = 15 * 120000 * 0.0625 * 12 = 1,350,000 ₽
  // W = 1,350,000 * 0.8 = 1,080,000 ₽
  // X = 15 * 10 * 52 = 7,800 ч
  await page.evaluate(() => {
    const e = document.getElementById('slider-employees');
    const h = document.getElementById('slider-hours');
    const s = document.getElementById('slider-salary');
    e.value = 15;
    h.value = 10;
    s.value = 120000;
    e.dispatchEvent(new Event('input', { bubbles: true }));
    h.dispatchEvent(new Event('input', { bubbles: true }));
    s.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const results = await page.evaluate(() => {
    const parse = id => parseInt(document.getElementById(id).textContent.replace(/[^0-9]/g, ''), 10);
    return {
      cost: parse('roi-cost'),
      save: parse('roi-save'),
      hours: parse('roi-hours')
    };
  });

  assert.strictEqual(results.cost, 1350000, `Expected annual cost 1,350,000 ₽, got ${results.cost}`);
  assert.strictEqual(results.save, 1080000, `Expected savings 1,080,000 ₽, got ${results.save}`);
  assert.strictEqual(results.hours, 7800, `Expected freed hours 7,800 ч, got ${results.hours}`);

  // Click CTA in calculator to capture lead
  const calcCta = page.locator('.roi__cta-block a, .roi a[href*="contact"]').first();
  await calcCta.click();
  await page.waitForTimeout(600);

  const contactInView = await page.locator('#contact').evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.top >= -50 && r.top <= window.innerHeight;
  });
  assert.ok(contactInView, 'Calculator CTA should scroll down to #contact lead capture form');
});

suite.test('Journey 4: Deep linking via clean URL /cases with browser back/forward navigation', async ({ page, baseUrl }) => {
  // Directly navigate to /cases
  await page.goto(`${baseUrl}/cases`);
  await page.waitForTimeout(600);

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
  await page.waitForTimeout(400);

  // Hit browser back
  await page.goBack();
  await page.waitForTimeout(400);

  const currentPath = await page.evaluate(() => window.location.pathname);
  assert.strictEqual(currentPath, '/cases', `Expected browser back to return to '/cases', got '${currentPath}'`);
});

suite.test('Journey 5: Mobile user complete lead flow on 375px viewport', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${baseUrl}/`);

  // Open mobile burger menu
  const burger = page.locator('#burger, .nav__burger');
  await burger.click();
  await page.waitForTimeout(200);

  // Navigate to Contact from burger menu (should be present inside mobile navigation)
  const navContact = page.locator('.nav__links a[href*="contact"]');
  const hasContactInNav = (await navContact.count()) > 0;
  assert.ok(hasContactInNav, 'Mobile navigation menu must expose a Contact link for mobile users');

  await navContact.first().click();
  await page.waitForTimeout(600);

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
