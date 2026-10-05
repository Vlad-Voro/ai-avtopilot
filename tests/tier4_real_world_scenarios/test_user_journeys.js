/**
 * Tier 4 - Real-World Workload Scenarios (Full E2E User Journeys)
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('Tier 4 - Real-World Workload User Journeys', {
  tier: 4,
  milestone: 'Cross-Milestone',
  feature: 'User Journeys'
});

suite.before(async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);
});

suite.test('Journey 1: First-time visitor lands, observes hero typewriter and examines live dashboard', async ({ page }) => {
  // 1. Hero offer inspection
  const heroTitle = await page.locator('.hero__title').textContent();
  assert.ok(heroTitle.includes('Ваши процессы'), 'Hero title must be present');

  // 2. Wait for typewriter to produce text
  await page.waitForFunction(() => (document.getElementById('typed-text')?.textContent || '').length > 0, { timeout: 3000 }).catch(() => {});
  const typedText = await page.locator('#typed-text').textContent();
  assert.ok(typedText.length > 0, 'Typewriter must emit text');

  // 3. Scroll to Live Dashboard
  const dashboard = page.locator('#dashboard, .dashboard').first();
  await dashboard.scrollIntoViewIfNeeded();
  await page.waitForSelector('#dashboard, .dashboard', { state: 'visible' });

  // 4. Verify dashboard metrics / chart exist
  const hasDashboardElements = await page.evaluate(() => {
    const d = document.getElementById('dashboard') || document.querySelector('.dashboard');
    if (!d) return false;
    const cards = d.querySelectorAll('.dash-card, .chart__bar, .dash-metric');
    return cards.length > 0;
  });

  assert.ok(hasDashboardElements, 'Dashboard elements should be populated and visible');
});

suite.test('Journey 2: Service exploration - user navigates to services bento grid and inspects offerings', async ({ page }) => {
  // Click Services nav link
  const servicesLink = page.locator('.nav__links a, .nav__link', { hasText: 'Услуги' }).first();
  await servicesLink.click();
  await page.waitForFunction(() => {
    const el = document.getElementById('services');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top >= -50 && r.top <= window.innerHeight;
  });

  // Verify services in view
  const isServicesInView = await page.locator('#services').evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.top >= -50 && r.top <= window.innerHeight;
  });
  assert.ok(isServicesInView, 'Page should have scrolled to #services section');

  // Hover first bento card
  const firstCard = page.locator('.scard').first();
  await firstCard.hover();

  const cardVisible = await firstCard.isVisible();
  assert.ok(cardVisible, 'Bento service card should be clearly visible');
});

suite.test('Journey 3: Executive ROI calculation with custom parameters and lead capture transition', async ({ page }) => {
  // Navigate to calculator
  const calcLink = page.locator('.nav__links a, .nav__link', { hasText: 'Калькулятор' }).first();
  await calcLink.click();
  await page.waitForFunction(() => {
    const el = document.getElementById('calculator');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top >= -50 && r.top <= window.innerHeight;
  });

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
  await page.waitForFunction(() => {
    const el = document.getElementById('contact');
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.top >= -50 && r.top <= window.innerHeight;
  });

  const contactInView = await page.locator('#contact').evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.top >= -50 && r.top <= window.innerHeight;
  });
  assert.ok(contactInView, 'Calculator CTA should scroll down to #contact lead capture form');
});

module.exports = suite;
