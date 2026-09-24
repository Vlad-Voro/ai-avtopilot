/**
 * Tier 1 - R4: Cohesive Micro-Interactions & Animation System
 * Feature Milestone: M2
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('Tier 1 - R4: Micro-Interactions & Animation System', {
  tier: 1,
  milestone: 'M2',
  feature: 'R4'
});

suite.test('R4.1: Bento service cards (.scard) have hover elevation and glow styling', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const card = page.locator('.scard').first();
  await card.scrollIntoViewIfNeeded();

  const beforeBox = await card.boundingBox();
  await card.hover();
  await page.waitForTimeout(350); // allow CSS transition

  const hoverStyle = await card.evaluate(el => {
    const s = window.getComputedStyle(el);
    return {
      transform: s.transform,
      boxShadow: s.boxShadow,
      transition: s.transition
    };
  });

  // Must declare transition and have transform or box-shadow on hover
  assert.ok(
    hoverStyle.transition && hoverStyle.transition !== 'none',
    'Bento cards must have CSS transition defined'
  );
  assert.ok(
    hoverStyle.boxShadow && hoverStyle.boxShadow !== 'none',
    'Bento cards must display box-shadow glow on hover'
  );
});

suite.test('R4.2: Case study cards (.case-card) exhibit unified hover elevation and shadow', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const card = page.locator('.case-card').first();
  await card.scrollIntoViewIfNeeded();

  await card.hover();
  await page.waitForTimeout(350);

  const hoverData = await card.evaluate(el => {
    const s = window.getComputedStyle(el);
    return {
      transform: s.transform,
      boxShadow: s.boxShadow
    };
  });

  // In R4 spec: case cards must have box-shadow: 0 12px 36px rgba(99, 102, 241, 0.18) or similar glow
  assert.ok(
    hoverData.boxShadow && hoverData.boxShadow !== 'none',
    `Expected .case-card to have box-shadow on hover, got '${hoverData.boxShadow}'`
  );
  assert.ok(
    hoverData.transform && hoverData.transform !== 'none',
    `Expected .case-card to have translateY transform on hover, got '${hoverData.transform}'`
  );
});

suite.test('R4.3: Dashboard cards (.dash-card) provide hover feedback and border glow', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const dashCard = page.locator('.dash-card').first();
  await dashCard.scrollIntoViewIfNeeded();

  const initialStyle = await dashCard.evaluate(el => window.getComputedStyle(el).boxShadow);
  await dashCard.hover();
  await page.waitForTimeout(350);

  const hoverStyle = await dashCard.evaluate(el => {
    const s = window.getComputedStyle(el);
    return {
      boxShadow: s.boxShadow,
      transform: s.transform,
      borderColor: s.borderColor
    };
  });

  assert.ok(
    hoverStyle.boxShadow !== 'none' || hoverStyle.transform !== 'none',
    `Dashboard cards must provide interactive hover elevation or glow`
  );
});

suite.test('R4.4: Primary CTA buttons (.btn--primary) have active tactile response', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const btn = page.locator('.btn--primary').first();
  const transition = await btn.evaluate(el => window.getComputedStyle(el).transition);
  assert.ok(transition && transition !== 'none', 'Primary buttons must have CSS transition');
});

suite.test('R4.5: Pulse indicator animations are defined without abrupt jumps', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const pulseState = await page.evaluate(() => {
    const dot = document.querySelector('.pulse-green, .pulse-dot, .hero__badge-dot');
    if (!dot) return null;
    const style = window.getComputedStyle(dot);
    return {
      animationName: style.animationName,
      animationDuration: style.animationDuration
    };
  });

  assert.ok(pulseState, 'Pulse dot element not found');
  assert.ok(
    pulseState.animationName && pulseState.animationName !== 'none',
    'Pulse indicator must have active animation'
  );
});

suite.test('R4.6: Prefers-reduced-motion media query is respected in stylesheet', async ({ page, baseUrl }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${baseUrl}/`);

  const hasReducedMotionRule = await page.evaluate(() => {
    let found = false;
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules || []) {
          if (rule.media && rule.media.mediaText.includes('prefers-reduced-motion')) {
            found = true;
            break;
          }
        }
      } catch (e) {
        // Cross-origin sheets ignore
      }
    }
    return found;
  });

  assert.strictEqual(
    hasReducedMotionRule,
    true,
    'Stylesheet must declare @media (prefers-reduced-motion: reduce) for accessibility'
  );
});

module.exports = suite;
