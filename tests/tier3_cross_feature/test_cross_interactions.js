/**
 * Tier 3 - Cross-Feature Interactions (Pairwise combinations)
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('Tier 3 - Cross-Feature Interactions', {
  tier: 3,
  milestone: 'Cross-Milestone',
  feature: 'Interactions'
});

suite.test('Interaction 1: Navigation link click while user is actively scrolling page', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  // Start continuous scroll
  await page.evaluate(() => {
    window.scrollBy({ top: 500, behavior: 'smooth' });
  });

  // Immediately click navigation link to Cases
  const casesLink = page.locator('.nav__links a, .nav__link', { hasText: 'Кейсы' }).first();
  await casesLink.click();
  await page.waitForTimeout(600);

  const isInCases = await page.locator('#cases').evaluate(el => {
    const r = el.getBoundingClientRect();
    return r.top >= -50 && r.top <= window.innerHeight;
  });

  assert.strictEqual(
    isInCases,
    true,
    'Navigation click must override ongoing smooth scroll and land on target section'
  );
});

suite.test('Interaction 2: Slider touch interaction on 375px mobile viewport prevents horizontal displacement', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${baseUrl}/`);

  const slider = page.locator('#slider-employees');
  await slider.scrollIntoViewIfNeeded();

  // Simulate dragging slider
  const box = await slider.boundingBox();
  if (box) {
    await page.mouse.move(box.x + 10, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width - 10, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
  }

  // Verify page scrollX remains 0 (no horizontal wobble)
  const scrollX = await page.evaluate(() => window.scrollX);
  assert.strictEqual(
    scrollX,
    0,
    `Dragging slider on mobile caused horizontal scroll displacement: scrollX=${scrollX}`
  );
});

suite.test('Interaction 3: Burger menu open locks body scroll and prevents background interaction', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${baseUrl}/`);

  const burger = page.locator('#burger, .nav__burger');
  await burger.click();
  await page.waitForTimeout(200);

  // Attempt to scroll body
  const canScroll = await page.evaluate(() => {
    const initialY = window.scrollY;
    window.scrollBy(0, 300);
    return window.scrollY !== initialY;
  });

  assert.strictEqual(
    canScroll,
    false,
    'Background page scrolling should be locked when mobile burger menu is open'
  );
});

suite.test('Interaction 4: Hash backward compatibility combined with clean slash pushState navigation', async ({ page, baseUrl }) => {
  // Arrive with legacy #contact hash
  await page.goto(`${baseUrl}/#contact`);
  await page.waitForTimeout(400);

  // Then click clean slash navigation link for Services
  const servicesLink = page.locator('.nav__links a, .nav__link', { hasText: 'Услуги' }).first();
  await servicesLink.click();
  await page.waitForTimeout(400);

  const pathname = await page.evaluate(() => window.location.pathname);
  assert.strictEqual(
    pathname,
    '/services',
    `Expected clean pathname '/services' after clicking link from legacy hash state, got '${pathname}'`
  );
});

suite.test('Interaction 5: Typewriter phrase cycling while viewport resizes across desktop breakpoint', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${baseUrl}/`);

  // Wait for typewriter to start typing
  await page.waitForTimeout(1000);

  // Resize to breakpoint threshold 1025px
  await page.setViewportSize({ width: 1025, height: 800 });
  await page.waitForTimeout(500);

  const cursorState = await page.evaluate(() => {
    const cursor = document.querySelector('.hero__cursor');
    const sub = document.querySelector('.hero__sub');
    if (!cursor || !sub) return null;
    const cRect = cursor.getBoundingClientRect();
    const sRect = sub.getBoundingClientRect();
    return {
      overlaps: cRect.bottom > sRect.top && cRect.top < sRect.bottom
    };
  });

  assert.ok(cursorState, 'Cursor elements found');
  assert.strictEqual(
    cursorState.overlaps,
    false,
    'Cursor overlapped .hero__sub during active typewriter animation when resizing to 1025px'
  );
});

suite.test('Interaction 6: Contact form inputs focus without fixed header occlusion', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const input = page.locator('input[type="text"], input[name="name"], input[placeholder*="имя" i]').first();
  if (await input.count() > 0) {
    await input.focus();
    await page.waitForTimeout(200);

    const isOccludedByHeader = await page.evaluate(() => {
      const activeEl = document.activeElement;
      const header = document.querySelector('header.nav, #site-header');
      if (!activeEl || !header) return false;
      const hRect = header.getBoundingClientRect();
      const elRect = activeEl.getBoundingClientRect();
      return elRect.top < hRect.bottom && elRect.bottom > hRect.top;
    });

    assert.strictEqual(
      isOccludedByHeader,
      false,
      'Focused form input is obscured by fixed header'
    );
  }
});

module.exports = suite;
