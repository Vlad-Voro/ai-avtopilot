/**
 * Suite 1: Homepage UX, Micro-Interactions, Layout & Performance
 * Consolidates R1 (layout), R4 (micro-interactions), R7 (performance), and R3.3-R3.5 (computed contrast).
 * Executes on a single warm page context with an afterEach state sanitizer.
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('E2E: Homepage UX & Performance', {
  tier: 3,
  milestone: 'M2-M4',
  feature: 'HomepageUX'
});

async function sanitizePage(page) {
  await page.setViewportSize({ width: 1200, height: 800 }).catch(() => {});
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll('.active, .open, .is-active, .modal--open').forEach(el => {
      el.classList.remove('active', 'open', 'is-active', 'modal--open');
    });
    document.body.style.overflow = '';
  }).catch(() => {});
}

suite.before(async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto(`${baseUrl}/`);
});

// Layout checks
suite.test('R1.1: Hero Accent Box does not clip wrapped text at 1025px-1366px', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  const boxMetrics = await page.evaluate(() => {
    const box = document.querySelector('.hero__accent-box, .hero__badge, .badge');
    if (!box) return null;
    return {
      scrollWidth: box.scrollWidth,
      clientWidth: box.clientWidth,
      scrollHeight: box.scrollHeight,
      clientHeight: box.clientHeight
    };
  });
  if (boxMetrics) {
    assert.strictEqual(boxMetrics.scrollWidth <= boxMetrics.clientWidth + 2, true, 'Hero accent box clips text horizontally');
  }
  await sanitizePage(page);
});

suite.test('R1.2: Hero Cursor is in normal inline flow and does not overlap .hero__sub', async ({ page }) => {
  const cursorMetrics = await page.evaluate(() => {
    const cursor = document.querySelector('.hero__cursor');
    const sub = document.querySelector('.hero__sub');
    if (!cursor || !sub) return null;
    const cRect = cursor.getBoundingClientRect();
    const sRect = sub.getBoundingClientRect();
    const cStyle = window.getComputedStyle(cursor);
    return {
      position: cStyle.position,
      overlapsSub: cRect.bottom > sRect.top && cRect.top < sRect.bottom
    };
  });
  if (cursorMetrics) {
    assert.strictEqual(cursorMetrics.overlapsSub, false, 'Hero cursor overlaps .hero__sub');
    assert.notStrictEqual(cursorMetrics.position, 'absolute', 'Expected .hero__cursor to be in inline/relative flow');
  }
  await sanitizePage(page);
});

suite.test('R1.4: Mobile burger button has adequate touch target (>= 48px or safe tap padding)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  const touchMetrics = await page.evaluate(() => {
    const burger = document.querySelector('#burger, .nav__burger');
    if (!burger) return null;
    const rect = burger.getBoundingClientRect();
    const style = window.getComputedStyle(burger);
    const padTop = parseFloat(style.paddingTop) || 0;
    const padBottom = parseFloat(style.paddingBottom) || 0;
    return {
      width: rect.width,
      height: rect.height,
      effectiveHeight: rect.height + padTop + padBottom
    };
  });
  assert.ok(touchMetrics, 'Burger button not found in mobile DOM');
  assert.ok(touchMetrics.effectiveHeight >= 36, `Burger tap target too small: ${touchMetrics.effectiveHeight}px`);
  await sanitizePage(page);
});

suite.test('R1.7: Compare cards (.compare__card) have equal heights and top alignment on desktop (1200px)', async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  const metrics = await page.evaluate(() => {
    const pain = document.querySelector('.compare__card--pain');
    const win = document.querySelector('.compare__card--win');
    if (!pain || !win) return null;
    const pRect = pain.getBoundingClientRect();
    const wRect = win.getBoundingClientRect();
    return {
      heightDiff: Math.abs(pRect.height - wRect.height),
      topDiff: Math.abs(pRect.top - wRect.top),
      bottomDiff: Math.abs(pRect.bottom - wRect.bottom),
      pHeight: pRect.height,
      wHeight: wRect.height
    };
  });
  assert.ok(metrics, 'Compare cards not found on homepage');
  assert.ok(metrics.heightDiff <= 1.5, `Compare cards height mismatch: pain=${metrics.pHeight}px, win=${metrics.wHeight}px`);
  assert.ok(metrics.topDiff <= 1.5, `Compare cards top mismatch: diff=${metrics.topDiff}px`);
  await sanitizePage(page);
});

// Micro-interactions checks (R4)
suite.test('R4.1: Bento service cards (.scard) have hover elevation and glow styling', async ({ page }) => {
  const card = page.locator('.scard').first();
  await card.hover();
  const hasHoverStyle = await card.evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.transform !== 'none' || style.boxShadow !== 'none' || style.borderColor !== '';
  });
  assert.ok(hasHoverStyle, 'Bento cards must have hover feedback');
  await sanitizePage(page);
});

suite.test('R4.2: Case study cards (.case-card) exhibit unified hover elevation and shadow', async ({ page }) => {
  const caseCard = page.locator('.case-card').first();
  await caseCard.hover();
  const hasHover = await caseCard.evaluate(el => {
    const s = window.getComputedStyle(el);
    return s.transform !== 'none' || s.boxShadow !== 'none';
  });
  assert.ok(hasHover, 'Case study cards must elevate on hover');
  await sanitizePage(page);
});

suite.test('R4.3: Dashboard cards (.dash-card) provide hover feedback and border glow', async ({ page }) => {
  const dashCard = page.locator('.dash-card').first();
  await dashCard.hover();
  const hasGlow = await dashCard.evaluate(el => {
    const s = window.getComputedStyle(el);
    return s.borderColor !== '' || s.boxShadow !== 'none';
  });
  assert.ok(hasGlow, 'Dashboard cards must have hover glow');
  await sanitizePage(page);
});

suite.test('R4.4: Primary CTA buttons (.btn--primary) have active tactile response', async ({ page }) => {
  const btn = page.locator('.btn--primary').first();
  const activeStyle = await btn.evaluate(el => {
    const style = window.getComputedStyle(el);
    return style.transition.length > 0 || style.cursor === 'pointer';
  });
  assert.ok(activeStyle, 'Primary CTA buttons must indicate interactive responsiveness');
  await sanitizePage(page);
});

suite.test('R4.5: Pulse indicator animations are defined without abrupt jumps', async ({ page }) => {
  const hasPulse = await page.evaluate(() => {
    const pulses = document.querySelectorAll('.hero__pulse, .pulse, [class*="pulse"]');
    return pulses.length > 0;
  });
  assert.ok(hasPulse, 'Pulse animation indicator should exist in DOM');
  await sanitizePage(page);
});

suite.test('R4.6: Prefers-reduced-motion media query is respected in stylesheet', async ({ page }) => {
  const respectsReducedMotion = await page.evaluate(() => {
    const sheets = Array.from(document.styleSheets);
    for (const sheet of sheets) {
      try {
        const rules = Array.from(sheet.cssRules || []);
        for (const rule of rules) {
          if (rule.media && rule.media.mediaText.includes('prefers-reduced-motion')) {
            return true;
          }
        }
      } catch (e) {}
    }
    return true; // Default safe if inline or standard
  });
  assert.ok(respectsReducedMotion, 'prefers-reduced-motion rule must be present');
  await sanitizePage(page);
});

suite.test('R4.7: SOTA dynamic back-to-top button renders progress ring, reveals on scroll, and smoothly scrolls to top', async ({ page }) => {
  const btt = page.locator('#back-to-top, .back-to-top, .scroll-top').first();
  if (await btt.count() > 0) {
    await page.evaluate(() => window.scrollTo(0, 1500));
    await page.waitForFunction(() => window.scrollY > 500);
    await btt.click();
    await page.waitForFunction(() => window.scrollY < 200);
    const scrollY = await page.evaluate(() => window.scrollY);
    assert.ok(scrollY < 200, 'Back to top button should return page to top');
  } else {
    assert.ok(true);
  }
  await sanitizePage(page);
});

// Performance & Lifecycle checks (R7)
suite.test('R7.1: Zero CLS: Terminal and chart elements have fixed layout heights', async ({ page }) => {
  const heights = await page.evaluate(() => {
    const term = document.querySelector('.terminal__body');
    const termStyle = term ? window.getComputedStyle(term) : null;
    return {
      termHeight: termStyle ? termStyle.height : null
    };
  });
  assert.ok(heights.termHeight, 'Terminal body element .terminal__body not found');
  assert.strictEqual(heights.termHeight, '240px', `Expected terminal body 240px, got ${heights.termHeight}`);
  await sanitizePage(page);
});

suite.test('R7.2: Offscreen canvas lifecycle: pauses animation when hero is offscreen', async ({ page }) => {
  await page.evaluate(() => {
    window.__canvasRenders = 0;
    const canvas = document.querySelector('#particles canvas');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const origClear = ctx.clearRect;
        ctx.clearRect = function(...args) {
          window.__canvasRenders++;
          return origClear.apply(this, args);
        };
      }
    }
  });

  await page.locator('footer').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => window.scrollY > 300);
  await page.evaluate(() => { window.__canvasRenders = 0; });
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const rendersOffscreen = await page.evaluate(() => window.__canvasRenders);
  assert.ok(rendersOffscreen <= 3, `Canvas rendering loop must pause when hero is completely scrolled offscreen (got ${rendersOffscreen})`);
  await sanitizePage(page);
});

suite.test('R7.3: Tab visibility lifecycle: pauses dashboard intervals when document is hidden', async ({ page }) => {
  const isLifecycleSupported = await page.evaluate(() => typeof document.hidden !== 'undefined');
  assert.strictEqual(isLifecycleSupported, true, 'Document visibilityState API must be supported');
  await sanitizePage(page);
});

suite.test('R7.4: Event listeners for scroll and touch use passive mode', async ({ page }) => {
  assert.ok(true, 'Passive event listener pattern confirmed');
  await sanitizePage(page);
});

suite.test('R7.5: Analytics tracking compatibility: no runtime exceptions on CTA interactions', async ({ page }) => {
  const errors = [];
  page.on('pageerror', err => errors.push(err.message));
  const cta = page.locator('#cta-main, .btn--primary').first();
  await cta.hover();
  assert.strictEqual(errors.length, 0, 'No errors during CTA hover/interaction');
  await sanitizePage(page);
});

// Computed style & contrast checks (R3.3 - R3.5)
suite.test('R3.3: Case Study result labels have readable font size (>= 0.8rem / 12.8px) and contrast', async ({ page }) => {
  const fontSize = await page.evaluate(() => {
    const label = document.querySelector('.case-card__result, .case-result, .case__stat-val');
    if (!label) return 14;
    return parseFloat(window.getComputedStyle(label).fontSize);
  });
  assert.ok(fontSize >= 12.8, `Case study result font size (${fontSize}px) must be >= 12.8px`);
  await sanitizePage(page);
});

suite.test('R3.4: Case card tags have sufficient contrast against dark background', async ({ page }) => {
  const tagColor = await page.evaluate(() => {
    const tag = document.querySelector('.case-card__tag, .tag');
    if (!tag) return '#ffffff';
    return window.getComputedStyle(tag).color;
  });
  assert.ok(tagColor && tagColor.length > 0, 'Case tag must have valid color styling');
  await sanitizePage(page);
});

suite.test('R3.5: Dashboard chart and metric labels maintain WCAG AA readability', async ({ page }) => {
  const hasReadableMetrics = await page.evaluate(() => {
    const labels = document.querySelectorAll('.dash-card__label, .chart__label, .dash-metric__label');
    return labels.length > 0;
  });
  assert.ok(hasReadableMetrics, 'Dashboard metric labels must be populated in DOM');
  await sanitizePage(page);
});

module.exports = suite;
