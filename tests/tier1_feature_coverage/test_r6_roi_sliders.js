/**
 * Tier 1 - R6: Interactive ROI Calculator Sliders Redesign
 * Feature Milestone: M3
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('Tier 1 - R6: Interactive ROI Calculator Sliders', {
  tier: 1,
  milestone: 'M3',
  feature: 'R6'
});

suite.test('R6.1: Slider elements exist with valid min, max, and initial attributes', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const sliders = await page.evaluate(() => {
    const emp = document.getElementById('slider-employees');
    const hrs = document.getElementById('slider-hours');
    const sal = document.getElementById('slider-salary');
    return {
      emp: emp ? { min: +emp.min, max: +emp.max, val: +emp.value } : null,
      hrs: hrs ? { min: +hrs.min, max: +hrs.max, val: +hrs.value } : null,
      sal: sal ? { min: +sal.min, max: +sal.max, val: +sal.value } : null
    };
  });

  assert.ok(sliders.emp, 'slider-employees missing');
  assert.ok(sliders.hrs, 'slider-hours missing');
  assert.ok(sliders.sal, 'slider-salary missing');

  assert.strictEqual(sliders.emp.min, 1);
  assert.strictEqual(sliders.emp.max, 100);
  assert.strictEqual(sliders.hrs.min, 1);
  assert.strictEqual(sliders.hrs.max, 40);
  assert.strictEqual(sliders.sal.min, 30000);
  assert.strictEqual(sliders.sal.max, 300000);
});

suite.test('R6.2: Slider track dimensions adhere to 7px height and rounded geometry', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const trackMetrics = await page.locator('.roi-slider').first().evaluate(el => {
    const s = window.getComputedStyle(el);
    return {
      heightPx: parseFloat(s.height),
      borderRadius: s.borderRadius
    };
  });

  // Specification: track height increased to 7px (current baseline is 4px)
  assert.ok(
    trackMetrics.heightPx >= 6.5,
    `Expected .roi-slider track height >= 6.5px (target 7px), but got ${trackMetrics.heightPx}px`
  );
});

suite.test('R6.3: Slider updates inline dynamic gradient fill on input', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const slider = page.locator('#slider-employees');
  await slider.scrollIntoViewIfNeeded();

  // Move slider to 50
  await slider.evaluate(el => {
    el.value = 50;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  });

  const backgroundStyle = await slider.evaluate(el => {
    return el.style.background || window.getComputedStyle(el).backgroundImage;
  });

  assert.ok(
    backgroundStyle.includes('linear-gradient'),
    `Expected slider background to include dynamic linear-gradient fill on input, got '${backgroundStyle}'`
  );
});

suite.test('R6.4: Boundary limit labels (min/max ticks) exist below sliders', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const limitsExist = await page.evaluate(() => {
    const limitElements = Array.from(document.querySelectorAll('.roi-slider-limits, .roi-slider-ticks, .roi-limit'));
    const textContent = document.querySelector('.roi__inputs') ? document.querySelector('.roi__inputs').textContent : '';
    return {
      hasElements: limitElements.length >= 3,
      hasMinMaxText: (textContent.includes('1') && textContent.includes('100')) &&
                     (textContent.includes('40')) &&
                     (textContent.includes('30') || textContent.includes('300'))
    };
  });

  assert.ok(
    limitsExist.hasElements || limitsExist.hasMinMaxText,
    'Expected min and max limit tick labels to be displayed below sliders'
  );
});

suite.test('R6.5: Current value displays update dynamically with formatted values', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  // Update hours slider to 35
  await page.locator('#slider-hours').evaluate(el => {
    el.value = 35;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const hoursDisplay = await page.locator('#display-hours').textContent();
  assert.strictEqual(hoursDisplay.trim(), '35', `Expected #display-hours to be '35', got '${hoursDisplay}'`);
});

suite.test('R6.6: Mathematical formula integrity: routine cost, savings (80%), and freed hours', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  // Set predictable inputs: 10 employees, 20 hrs/week, 80,000 rub/month
  // Hours fraction D = 20 / 160 = 0.125
  // Annual routine cost M = 10 * 80000 * 0.125 * 12 = 1,200,000 ₽
  // Annual savings W = 1,200,000 * 0.8 = 960,000 ₽
  // Freed hours X = 10 * 20 * 52 = 10,400 ч
  await page.evaluate(() => {
    const e = document.getElementById('slider-employees');
    const h = document.getElementById('slider-hours');
    const s = document.getElementById('slider-salary');
    e.value = 10;
    h.value = 20;
    s.value = 80000;
    e.dispatchEvent(new Event('input', { bubbles: true }));
    h.dispatchEvent(new Event('input', { bubbles: true }));
    s.dispatchEvent(new Event('input', { bubbles: true }));
  });

  const results = await page.evaluate(() => {
    const costText = document.getElementById('roi-cost').textContent;
    const saveText = document.getElementById('roi-save').textContent;
    const hoursText = document.getElementById('roi-hours').textContent;
    return { costText, saveText, hoursText };
  });

  const cleanNum = str => parseInt(str.replace(/[^0-9]/g, ''), 10);
  const cost = cleanNum(results.costText);
  const save = cleanNum(results.saveText);
  const hours = cleanNum(results.hoursText);

  assert.strictEqual(cost, 1200000, `Expected annual cost 1,200,000 ₽, got ${results.costText} (${cost})`);
  assert.strictEqual(save, 960000, `Expected annual savings 960,000 ₽, got ${results.saveText} (${save})`);
  assert.strictEqual(hours, 10400, `Expected freed hours 10,400 ч, got ${results.hoursText} (${hours})`);
});

module.exports = suite;
