/**
 * Tier 2 - Boundary & Corner Cases: ROI Calculator Slider Extremes
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('Tier 2 - Boundary: Slider Extremes & Math Limits', {
  tier: 2,
  milestone: 'M3',
  feature: 'Boundaries: Sliders'
});

suite.test('Slider Boundary: Minimum allowed values (E=1, H=1, S=30,000)', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  // E = 1, H = 1, S = 30000
  // D = 1 / 160 = 0.00625
  // M = 1 * 30000 * (1/160) * 12 = 2,250 ₽
  // W = 2,250 * 0.8 = 1,800 ₽
  // X = 1 * 1 * 52 = 52 ч
  await page.evaluate(() => {
    const e = document.getElementById('slider-employees');
    const h = document.getElementById('slider-hours');
    const s = document.getElementById('slider-salary');
    e.value = 1;
    h.value = 1;
    s.value = 30000;
    e.dispatchEvent(new Event('input', { bubbles: true }));
    h.dispatchEvent(new Event('input', { bubbles: true }));
    s.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const vals = await page.evaluate(() => {
    const parse = id => parseInt(document.getElementById(id).textContent.replace(/[^0-9]/g, ''), 10);
    return {
      cost: parse('roi-cost'),
      save: parse('roi-save'),
      hours: parse('roi-hours')
    };
  });

  assert.strictEqual(vals.cost, 2250, `Expected min cost 2,250 ₽, got ${vals.cost}`);
  assert.strictEqual(vals.save, 1800, `Expected min save 1,800 ₽, got ${vals.save}`);
  assert.strictEqual(vals.hours, 52, `Expected min hours 52 ч, got ${vals.hours}`);
});

suite.test('Slider Boundary: Maximum allowed values (E=100, H=40, S=300,000)', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  // E = 100, H = 40, S = 300000
  // D = 40 / 160 = 0.25
  // M = 100 * 300000 * 0.25 * 12 = 90,000,000 ₽
  // W = 90,000,000 * 0.8 = 72,000,000 ₽
  // X = 100 * 40 * 52 = 208,000 ч
  await page.evaluate(() => {
    const e = document.getElementById('slider-employees');
    const h = document.getElementById('slider-hours');
    const s = document.getElementById('slider-salary');
    e.value = 100;
    h.value = 40;
    s.value = 300000;
    e.dispatchEvent(new Event('input', { bubbles: true }));
    h.dispatchEvent(new Event('input', { bubbles: true }));
    s.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const vals = await page.evaluate(() => {
    const parse = id => parseInt(document.getElementById(id).textContent.replace(/[^0-9]/g, ''), 10);
    return {
      cost: parse('roi-cost'),
      save: parse('roi-save'),
      hours: parse('roi-hours')
    };
  });

  assert.strictEqual(vals.cost, 90000000, `Expected max cost 90,000,000 ₽, got ${vals.cost}`);
  assert.strictEqual(vals.save, 72000000, `Expected max save 72,000,000 ₽, got ${vals.save}`);
  assert.strictEqual(vals.hours, 208000, `Expected max hours 208,000 ч, got ${vals.hours}`);
});

suite.test('Slider Boundary: Midpoint values calculation (E=50, H=20, S=165,000)', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  // E = 50, H = 20, S = 165000
  // D = 20 / 160 = 0.125
  // M = 50 * 165000 * 0.125 * 12 = 12,375,000 ₽
  // W = 12,375,000 * 0.8 = 9,900,000 ₽
  // X = 50 * 20 * 52 = 52,000 ч
  await page.evaluate(() => {
    const e = document.getElementById('slider-employees');
    const h = document.getElementById('slider-hours');
    const s = document.getElementById('slider-salary');
    e.value = 50;
    h.value = 20;
    s.value = 165000;
    e.dispatchEvent(new Event('input', { bubbles: true }));
    h.dispatchEvent(new Event('input', { bubbles: true }));
    s.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const vals = await page.evaluate(() => {
    const parse = id => parseInt(document.getElementById(id).textContent.replace(/[^0-9]/g, ''), 10);
    return {
      cost: parse('roi-cost'),
      save: parse('roi-save'),
      hours: parse('roi-hours')
    };
  });

  assert.strictEqual(vals.cost, 12375000);
  assert.strictEqual(vals.save, 9900000);
  assert.strictEqual(vals.hours, 52000);
});

suite.test('Slider Boundary: Rapid drag updates stress test (50 sequential inputs without crash/NaN)', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const hasNaNOrError = await page.evaluate(() => {
    const e = document.getElementById('slider-employees');
    for (let val = 1; val <= 50; val++) {
      e.value = val;
      e.dispatchEvent(new Event('input', { bubbles: true }));
    }
    const costText = document.getElementById('roi-cost').textContent;
    return costText.includes('NaN') || costText.includes('undefined');
  });

  assert.strictEqual(hasNaNOrError, false, 'Rapid slider inputs resulted in NaN or undefined display value');
});

suite.test('Slider Boundary: Salary slider step increment constraint (step = 5000)', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const stepVal = await page.locator('#slider-salary').getAttribute('step');
  assert.strictEqual(stepVal, '5000', `Salary slider step should be 5000, got '${stepVal}'`);
});

module.exports = suite;
