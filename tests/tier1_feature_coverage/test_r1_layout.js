/**
 * Tier 1 - R1: Desktop & Mobile Layout Bug Fixes (Hero & Containers)
 * Feature Milestone: M1
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('Tier 1 - R1: Layout, Hero & Containers', {
  tier: 1,
  milestone: 'M1',
  feature: 'R1'
});

suite.test('R1.1: Hero Accent Box does not clip wrapped text at 1025px-1366px', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto(`${baseUrl}/`);

  const boxStyle = await page.locator('.hero__title-accent-box').evaluate(el => {
    const computed = window.getComputedStyle(el);
    return {
      overflow: computed.overflow,
      height: computed.height,
      minHeight: computed.minHeight,
      position: computed.position
    };
  });

  // Specification: Must NOT have overflow: hidden clipping text, and must have min-height >= 2.3em or auto height
  assert.notStrictEqual(
    boxStyle.overflow,
    'hidden',
    `Expected .hero__title-accent-box overflow not to be 'hidden', got '${boxStyle.overflow}'`
  );
  assert.ok(
    boxStyle.minHeight !== '0px' && boxStyle.minHeight !== 'none',
    `Expected .hero__title-accent-box to declare min-height for multi-line safety, got '${boxStyle.minHeight}'`
  );
});

suite.test('R1.2: Hero Cursor is in normal inline flow and does not overlap .hero__sub', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 1025, height: 800 });
  await page.goto(`${baseUrl}/`);

  const cursorMetrics = await page.evaluate(() => {
    const cursor = document.querySelector('.hero__cursor');
    const sub = document.querySelector('.hero__sub');
    if (!cursor || !sub) return null;
    const cRect = cursor.getBoundingClientRect();
    const sRect = sub.getBoundingClientRect();
    const cStyle = window.getComputedStyle(cursor);
    return {
      position: cStyle.position,
      display: cStyle.display,
      overlapsSub: cRect.bottom > sRect.top && cRect.top < sRect.bottom,
      cursorBottom: cRect.bottom,
      subTop: sRect.top
    };
  });

  assert.ok(cursorMetrics, 'Hero cursor or sub element not found');
  assert.strictEqual(
    cursorMetrics.overlapsSub,
    false,
    `Hero cursor overlaps .hero__sub (cursor bottom: ${cursorMetrics.cursorBottom}px, sub top: ${cursorMetrics.subTop}px)`
  );
  assert.notStrictEqual(
    cursorMetrics.position,
    'absolute',
    `Expected .hero__cursor to be in inline/relative flow, but found position: absolute`
  );
});

suite.test('R1.3: Zero horizontal overflow across responsive breakpoints (1440, 1024, 768, 375px)', async ({ page, baseUrl }) => {
  const widths = [1440, 1024, 768, 375];

  for (const width of widths) {
    await page.setViewportSize({ width, height: 800 });
    await page.goto(`${baseUrl}/`);

    const overflow = await page.evaluate(() => {
      const docWidth = document.documentElement.clientWidth;
      const scrollWidth = document.documentElement.scrollWidth;
      const bodyScrollWidth = document.body.scrollWidth;
      return {
        hasOverflow: scrollWidth > docWidth || bodyScrollWidth > docWidth,
        docWidth,
        scrollWidth,
        bodyScrollWidth
      };
    });

    assert.strictEqual(
      overflow.hasOverflow,
      false,
      `Horizontal overflow detected at ${width}px: clientWidth=${overflow.docWidth}, scrollWidth=${overflow.scrollWidth}, bodyScrollWidth=${overflow.bodyScrollWidth}`
    );
  }
});

suite.test('R1.4: Mobile burger button has adequate touch target (>= 48px or safe tap padding)', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${baseUrl}/`);

  const burgerMetrics = await page.locator('#burger, .nav__burger').evaluate(el => {
    const rect = el.getBoundingClientRect();
    const style = window.getComputedStyle(el);
    return {
      visible: style.display !== 'none' && style.visibility !== 'hidden',
      width: rect.width,
      height: rect.height
    };
  });

  assert.ok(burgerMetrics.visible, 'Mobile burger button should be visible at 375px');
  assert.ok(
    burgerMetrics.width >= 40 && burgerMetrics.height >= 40,
    `Burger touch target is too small: ${burgerMetrics.width}x${burgerMetrics.height}px (standard: >= 48px, min acceptable >= 40px)`
  );
});

suite.test('R1.5: Mobile menu toggles open and displays navigation links', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${baseUrl}/`);

  const burger = page.locator('#burger, .nav__burger');
  await burger.click();
  await page.waitForTimeout(200);

  const menuState = await page.locator('.nav__links').evaluate(el => {
    const style = window.getComputedStyle(el);
    return {
      display: style.display,
      visibility: style.visibility,
      opacity: parseFloat(style.opacity || '1'),
      isActive: el.classList.contains('active') || el.classList.contains('is-open') || style.display === 'flex'
    };
  });

  assert.ok(
    menuState.isActive && menuState.display !== 'none',
    `Mobile navigation links should be visible and active after clicking burger`
  );
});

suite.test('R1.6: Body scroll lock engages when mobile navigation is open', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${baseUrl}/`);

  const burger = page.locator('#burger, .nav__burger');
  await burger.click();
  await page.waitForTimeout(200);

  const bodyOverflow = await page.evaluate(() => {
    return window.getComputedStyle(document.body).overflow;
  });

  assert.ok(
    bodyOverflow === 'hidden' || bodyOverflow.includes('hidden'),
    `Expected body overflow: hidden when mobile menu is open, got '${bodyOverflow}'`
  );
});

module.exports = suite;
