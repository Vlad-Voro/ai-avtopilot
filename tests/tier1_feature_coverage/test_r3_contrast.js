/**
 * Tier 1 - R3: Visual Readability & WCAG AA Contrast in Brand Palette
 * Feature Milestone: M2
 */

const { createSuite, assert } = require('../helpers/test_framework');
const { getContrastRatio } = require('../helpers/contrast');

const suite = createSuite('Tier 1 - R3: WCAG AA Contrast & Typography', {
  tier: 1,
  milestone: 'M2',
  feature: 'R3'
});

suite.test('R3.1: CSS Variable --text-3 satisfies WCAG AA contrast (>= 4.5:1) against dark backgrounds', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const colors = await page.evaluate(() => {
    const root = document.documentElement;
    const computed = window.getComputedStyle(root);
    return {
      text3: computed.getPropertyValue('--text-3').trim(),
      bg: computed.getPropertyValue('--bg').trim() || '#050507',
      surface: computed.getPropertyValue('--surface').trim() || '#111118'
    };
  });

  const contrastBg = getContrastRatio(colors.text3, colors.bg);
  const contrastSurface = getContrastRatio(colors.text3, colors.surface);

  assert.ok(
    contrastBg >= 4.5,
    `--text-3 (${colors.text3}) contrast against --bg (${colors.bg}) is ${contrastBg.toFixed(2)}:1 (minimum required: 4.5:1)`
  );
  assert.ok(
    contrastSurface >= 4.5,
    `--text-3 (${colors.text3}) contrast against --surface (${colors.surface}) is ${contrastSurface.toFixed(2)}:1 (minimum required: 4.5:1)`
  );
});

suite.test('R3.2: CSS Variable --text-2 satisfies WCAG AA contrast (>= 4.5:1) against dark backgrounds', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const colors = await page.evaluate(() => {
    const root = document.documentElement;
    const computed = window.getComputedStyle(root);
    return {
      text2: computed.getPropertyValue('--text-2').trim(),
      bg: computed.getPropertyValue('--bg').trim() || '#050507'
    };
  });

  const contrast = getContrastRatio(colors.text2, colors.bg);
  assert.ok(
    contrast >= 4.5,
    `--text-2 (${colors.text2}) contrast against --bg (${colors.bg}) is ${contrast.toFixed(2)}:1 (minimum required: 4.5:1)`
  );
});

suite.test('R3.3: Case Study result labels have readable font size (>= 0.8rem / 12.8px) and contrast', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const metrics = await page.evaluate(() => {
    const label = document.querySelector('.case-result__label');
    if (!label) return null;
    const style = window.getComputedStyle(label);
    const parentBg = window.getComputedStyle(label.closest('.case-card') || document.body).backgroundColor;
    return {
      fontSizePx: parseFloat(style.fontSize),
      color: style.color,
      parentBg
    };
  });

  assert.ok(metrics, 'Case result label element .case-result__label not found');
  // 0.8rem on standard 16px root is 12.8px (baseline is 0.72rem = 11.5px)
  assert.ok(
    metrics.fontSizePx >= 12.8,
    `Expected .case-result__label font size >= 12.8px (0.8rem), but got ${metrics.fontSizePx.toFixed(1)}px`
  );

  const contrast = getContrastRatio(metrics.color, metrics.parentBg);
  assert.ok(
    contrast >= 4.5,
    `Expected .case-result__label contrast >= 4.5:1, but got ${contrast.toFixed(2)}:1`
  );
});

suite.test('R3.4: Case card tags have sufficient contrast against dark background', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const tagData = await page.evaluate(() => {
    const tag = document.querySelector('.case-card__tags span');
    if (!tag) return null;
    const style = window.getComputedStyle(tag);
    const cardBg = window.getComputedStyle(tag.closest('.case-card') || document.body).backgroundColor;
    return {
      color: style.color,
      backgroundColor: style.backgroundColor,
      cardBg
    };
  });

  assert.ok(tagData, 'Case card tag span not found');
  const contrast = getContrastRatio(tagData.color, tagData.cardBg);
  assert.ok(
    contrast >= 4.5,
    `Expected .case-card__tags span contrast >= 4.5:1 against card background, but got ${contrast.toFixed(2)}:1`
  );
});

suite.test('R3.5: Dashboard chart and metric labels maintain WCAG AA readability', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const labelsData = await page.evaluate(() => {
    const chartLabel = document.querySelector('.chart__label');
    const metricLabel = document.querySelector('.dash-metric__label');
    const clStyle = chartLabel ? window.getComputedStyle(chartLabel) : null;
    const mlStyle = metricLabel ? window.getComputedStyle(metricLabel) : null;

    return {
      chartLabelColor: clStyle ? clStyle.color : null,
      metricLabelColor: mlStyle ? mlStyle.color : null
    };
  });

  assert.ok(labelsData.chartLabelColor || labelsData.metricLabelColor, 'Dashboard labels not found');

  const bgDark = '#111118';
  if (labelsData.chartLabelColor) {
    const contrast = getContrastRatio(labelsData.chartLabelColor, bgDark);
    assert.ok(
      contrast >= 4.5,
      `Expected .chart__label contrast >= 4.5:1 against dashboard surface, got ${contrast.toFixed(2)}:1`
    );
  }

  if (labelsData.metricLabelColor) {
    const contrast = getContrastRatio(labelsData.metricLabelColor, bgDark);
    assert.ok(
      contrast >= 4.5,
      `Expected .dash-metric__label contrast >= 4.5:1 against dashboard surface, got ${contrast.toFixed(2)}:1`
    );
  }
});

module.exports = suite;
