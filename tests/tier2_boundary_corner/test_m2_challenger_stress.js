/**
 * Milestone 2 Adversarial Challenger Stress Suite
 *
 * Verifies:
 * 1. Exact computed contrast ratios across all 14 dependent selectors (Target >= 4.5:1)
 * 2. Card hover physics (.scard, .case-card, .dash-card) -> translateY(-4px) & box-shadow glow
 * 3. Primary CTA button hover elevation & active tactile scale (0.97)
 * 4. Pulse indicators keyframes smoothness
 * 5. prefers-reduced-motion: reduce emulation -> strict suppression of animations & transitions (<= 0.01ms)
 *
 * Usage:
 *   node tests/tier2_boundary_corner/test_m2_challenger_stress.js
 */

const path = require('path');
const { chromium } = require('playwright');
const { createStaticServer } = require('../helpers/server');
const { getContrastRatio, parseColor } = require('../helpers/contrast');

function blendRgba(fg, bg) {
  const a = fg.a !== undefined ? fg.a : 1.0;
  return {
    r: Math.round(fg.r * a + bg.r * (1 - a)),
    g: Math.round(fg.g * a + bg.g * (1 - a)),
    b: Math.round(fg.b * a + bg.b * (1 - a)),
    a: 1.0
  };
}

function parseMatrix(transformStr) {
  if (!transformStr || transformStr === 'none') return null;
  const m = transformStr.match(/matrix\(([^)]+)\)/);
  if (!m) return null;
  const vals = m[1].split(',').map(v => parseFloat(v.trim()));
  return {
    a: vals[0],
    b: vals[1],
    c: vals[2],
    d: vals[3],
    tx: vals[4],
    ty: vals[5],
    scaleX: Math.sqrt(vals[0] * vals[0] + vals[1] * vals[1]),
    scaleY: Math.sqrt(vals[2] * vals[2] + vals[3] * vals[3])
  };
}

async function runChallengerM2Stress() {
  const projectDir = path.resolve(__dirname, '../..');
  const server = createStaticServer(projectDir);
  const { baseUrl, port } = await server.start();

  console.log('========================================================================');
  console.log('       MILESTONE 2 ADVERSARIAL CHALLENGER STRESS SUITE');
  console.log('========================================================================');
  console.log(`Server running on ${baseUrl} (port ${port})\n`);

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow'
  });

  const failures = [];
  const passes = [];

  function record(testName, passed, details = '') {
    if (passed) {
      passes.push(testName);
      console.log(`  ✔ PASS: ${testName} ${details ? '(' + details + ')' : ''}`);
    } else {
      failures.push({ testName, details });
      console.log(`  ✖ FAIL: ${testName} -> ${details}`);
    }
  }

  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'domcontentloaded' });

    // Allow terminal simulation to produce .terminal__line--dim
    try {
      await page.waitForSelector('.terminal__line--dim', { timeout: 3500 });
    } catch (e) {}

    // ------------------------------------------------------------------------
    // TIER 1: WCAG AA CONTRAST RATIOS (14 SELECTORS)
    // ------------------------------------------------------------------------
    console.log('▶ [Challenger M2.1] 14 Dependent Selectors Computed Contrast Ratios (WCAG AA >= 4.5:1)');

    const targetSelectors = [
      { id: 1, name: 'Case Result Labels', selector: '.case-result__label' },
      { id: 2, name: 'Case Card Tags', selector: '.case-card__tags span' },
      { id: 3, name: 'Dashboard Hourly Chart Labels', selector: '.chart__label' },
      { id: 4, name: 'Dashboard Metric Sub-labels', selector: '.dash-metric__label' },
      { id: 5, name: 'Hero Terminal Title', selector: '.terminal__title' },
      { id: 6, name: 'Hero Terminal Dimmed Output', selector: '.terminal__line--dim' },
      { id: 7, name: 'Live Dashboard Log Item Time', selector: '.log-item__time' },
      { id: 8, name: 'Hero KPI Card Labels', selector: '.kpi-card__label' },
      { id: 9, name: 'Footer Links', selector: '.footer__links a' },
      { id: 10, name: 'Footer Brand Description', selector: '.footer__brand p' },
      { id: 11, name: 'Footer Copyright Notice', selector: '.footer__copy' },
      { id: 12, name: 'Contact Form Privacy Text', selector: '.form-privacy' },
      { id: 13, name: 'ROI Slider Limits', selector: '.roi-slider-limits' },
      { id: 14, name: 'ROI Result Sub-labels', selector: '.roi-result-label' }
    ];

    for (const item of targetSelectors) {
      const result = await page.evaluate(sel => {
        const el = document.querySelector(sel);
        if (!el) return { found: false };

        const style = window.getComputedStyle(el);
        let current = el;
        const bgColors = [];
        while (current && current !== document.documentElement) {
          const s = window.getComputedStyle(current);
          const bg = s.backgroundColor;
          if (bg && bg !== 'transparent' && bg !== 'rgba(0, 0, 0, 0)') {
            bgColors.push(bg);
          }
          current = current.parentElement;
        }

        const rootBg = window.getComputedStyle(document.body).backgroundColor || '#050507';
        bgColors.push(rootBg);

        return {
          found: true,
          color: style.color,
          bgColors
        };
      }, item.selector);

      if (!result.found) {
        record(`Contrast for #${item.id} ${item.name}`, false, `Selector ${item.selector} not found in DOM`);
        continue;
      }

      let compositeBg = parseColor('#050507');
      for (let i = result.bgColors.length - 1; i >= 0; i--) {
        const parsed = parseColor(result.bgColors[i]);
        if (parsed) compositeBg = blendRgba(parsed, compositeBg);
      }

      const ratio = getContrastRatio(result.color, compositeBg);
      const passed = ratio >= 4.5;
      record(
        `Contrast for #${item.id} ${item.name} (${item.selector})`,
        passed,
        `ratio=${ratio.toFixed(2)}:1, color=${result.color}, bg=rgb(${compositeBg.r},${compositeBg.g},${compositeBg.b})`
      );
    }

    // ------------------------------------------------------------------------
    // TIER 2: CARD HOVER MICRO-INTERACTIONS
    // ------------------------------------------------------------------------
    console.log('\n▶ [Challenger M2.2] Card Hover Micro-Interactions (translateY(-4px), glow, border)');

    const cardTargets = [
      { name: 'Bento Card (.scard)', selector: '.scard' },
      { name: 'Case Card (.case-card)', selector: '.case-card' },
      { name: 'Dashboard Card (.dash-card)', selector: '.dash-card' }
    ];

    for (const card of cardTargets) {
      const loc = page.locator(card.selector).first();
      await loc.scrollIntoViewIfNeeded();
      await loc.hover();
      await page.waitForTimeout(350);

      const hData = await loc.evaluate(el => {
        const s = window.getComputedStyle(el);
        return {
          transform: s.transform,
          boxShadow: s.boxShadow,
          borderColor: s.borderColor
        };
      });

      await page.mouse.move(0, 0);
      await page.waitForTimeout(150);

      const m = parseMatrix(hData.transform);
      const hasTy4 = m ? Math.abs(m.ty - (-4)) <= 0.5 : false;
      const hasGlow = hData.boxShadow.includes('rgba(99, 102, 241, 0.18)') || hData.boxShadow.includes('99, 102, 241');
      const hasBorder = hData.borderColor.includes('rgba(99, 102, 241, 0.4)') || hData.borderColor.includes('99, 102, 241');

      record(
        `${card.name} hover translateY(-4px)`,
        hasTy4,
        `computed transform=${hData.transform} (ty=${m?.ty})`
      );
      record(
        `${card.name} hover box-shadow glow`,
        hasGlow,
        `computed boxShadow=${hData.boxShadow}`
      );
      record(
        `${card.name} hover border-color glow`,
        hasBorder,
        `computed borderColor=${hData.borderColor}`
      );
    }

    // ------------------------------------------------------------------------
    // TIER 3: CTA BUTTON HOVER & ACTIVE INTERACTIONS
    // ------------------------------------------------------------------------
    console.log('\n▶ [Challenger M2.3] Primary CTA Button Micro-Interactions');
    const btnLoc = page.locator('.btn--primary').first();
    await btnLoc.scrollIntoViewIfNeeded();

    await btnLoc.hover();
    await page.waitForTimeout(250);
    const btnHover = await btnLoc.evaluate(el => {
      const s = window.getComputedStyle(el);
      const b = window.getComputedStyle(el, '::before');
      return {
        transform: s.transform,
        beforePos: b.position
      };
    });

    const hoverM = parseMatrix(btnHover.transform);
    const btnHoverPass = hoverM ? Math.abs(hoverM.ty - (-2)) <= 0.5 : false;
    record('.btn--primary hover elevation translateY(-2px)', btnHoverPass, `ty=${hoverM?.ty}`);
    record('.btn--primary shimmer beam ::before exists', btnHover.beforePos === 'absolute', `position=${btnHover.beforePos}`);

    const btnBox = await btnLoc.boundingBox();
    await page.mouse.move(btnBox.x + btnBox.width / 2, btnBox.y + btnBox.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(100);
    const btnActive = await btnLoc.evaluate(el => window.getComputedStyle(el).transform);
    await page.mouse.up();
    await page.mouse.move(0, 0);

    const activeM = parseMatrix(btnActive);
    const btnActivePass = activeM ? Math.abs(activeM.scaleX - 0.97) <= 0.02 && Math.abs(activeM.ty - 0) <= 0.5 : false;
    record('.btn--primary active tactile press scale(0.97)', btnActivePass, `scale=${activeM?.scaleX?.toFixed(3)}, ty=${activeM?.ty?.toFixed(3)}`);

    // ------------------------------------------------------------------------
    // TIER 4: PULSE INDICATORS KEYFRAMES
    // ------------------------------------------------------------------------
    console.log('\n▶ [Challenger M2.4] Status Indicator Pulse Keyframes Smoothness');
    const pulseInfo = await page.evaluate(() => {
      const dot = document.querySelector('.pulse-green, .pulse-dot, .hero__badge-dot');
      if (!dot) return null;
      const s = window.getComputedStyle(dot);
      let kfCount = 0;
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules || []) {
            if (rule.type === CSSRule.KEYFRAMES_RULE && rule.name === 'pulse-green') {
              kfCount = rule.cssRules.length;
            }
          }
        } catch (e) {}
      }
      return {
        animationName: s.animationName,
        animationDuration: s.animationDuration,
        kfCount
      };
    });

    record('pulse-green animation assigned to dot', pulseInfo?.animationName === 'pulse-green', `name=${pulseInfo?.animationName}`);
    record('pulse-green duration is 2.4s', pulseInfo?.animationDuration === '2.4s', `duration=${pulseInfo?.animationDuration}`);
    record('pulse-green keyframes define smooth multi-step curve', (pulseInfo?.kfCount || 0) >= 3, `steps=${pulseInfo?.kfCount}`);

    // ------------------------------------------------------------------------
    // TIER 5: PREFERS-REDUCED-MOTION: REDUCE EMULATION (ADVERSARIAL CASCADE CHECK)
    // ------------------------------------------------------------------------
    console.log('\n▶ [Challenger M2.5] prefers-reduced-motion: reduce Cascading & Suppression');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.reload({ waitUntil: 'domcontentloaded' });

    const parseDurationMs = dur => {
      if (!dur) return 0;
      const parts = dur.split(',').map(p => p.trim());
      let maxMs = 0;
      for (const part of parts) {
        let ms = 0;
        if (part.endsWith('ms')) ms = parseFloat(part);
        else if (part.endsWith('s')) ms = parseFloat(part) * 1000;
        else ms = parseFloat(part);
        if (ms > maxMs) maxMs = ms;
      }
      return maxMs;
    };

    const reducedTargets = [
      { name: 'Universal transition-duration (*)', selector: 'body', type: 'transition' },
      { name: 'Hero Particles Canvas', selector: '.hero__particles', type: 'display' },
      { name: 'Hero Cursor', selector: '.hero__cursor', type: 'animation' },
      { name: 'Pulse Indicator', selector: '.pulse-green, .hero__badge-dot', type: 'animation' },
      { name: 'Bento Card (.scard)', selector: '.scard', type: 'transition' },
      { name: 'Case Card (.case-card)', selector: '.case-card', type: 'transition' },
      { name: 'Dashboard Card (.dash-card)', selector: '.dash-card', type: 'transition' },
      { name: 'Primary CTA Button (.btn--primary)', selector: '.btn--primary', type: 'transition' }
    ];

    for (const elem of reducedTargets) {
      const metrics = await page.evaluate(sel => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return {
          display: s.display,
          animationName: s.animationName,
          animationDuration: s.animationDuration,
          transitionDuration: s.transitionDuration
        };
      }, elem.selector);

      if (!metrics) {
        record(`Reduced motion on ${elem.name}`, false, `Selector ${elem.selector} not found`);
        continue;
      }

      if (elem.type === 'display') {
        const pass = metrics.display === 'none';
        record(`Hero particles display:none under reduced motion`, pass, `display=${metrics.display}`);
      } else if (elem.type === 'animation') {
        const animMs = parseDurationMs(metrics.animationDuration);
        const pass = metrics.animationName === 'none' || animMs <= 0.01;
        record(`Animation suppressed on ${elem.name}`, pass, `name=${metrics.animationName}, duration=${metrics.animationDuration}`);
      } else {
        const transMs = parseDurationMs(metrics.transitionDuration);
        const pass = transMs <= 0.01;
        record(
          `Transition suppressed on ${elem.name} (<= 0.01ms)`,
          pass,
          `computed transitionDuration='${metrics.transitionDuration}' (${transMs}ms)`
        );
      }
    }

    // Hover transform suppression under reduced motion
    const scardLoc = page.locator('.scard').first();
    await scardLoc.hover();
    await page.waitForTimeout(200);
    const reducedHoverM = await scardLoc.evaluate(el => window.getComputedStyle(el).transform);
    const noHoverTransform = reducedHoverM === 'none' || reducedHoverM === 'matrix(1, 0, 0, 1, 0, 0)';
    record('Card hover translateY suppressed under reduced motion', noHoverTransform, `transform=${reducedHoverM}`);

    // Summary
    console.log('\n========================================================================');
    console.log(`TOTAL CHECKS: ${passes.length + failures.length}`);
    console.log(`PASSING:      ${passes.length}`);
    console.log(`FAILING:      ${failures.length}`);
    console.log(`VERDICT:      ${failures.length === 0 ? 'APPROVE' : 'REJECT'}`);
    console.log('========================================================================\n');

    await browser.close();
    await server.stop();

    if (failures.length > 0) {
      process.exit(1);
    } else {
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error during stress test:', err);
    try { await browser.close(); } catch (e) {}
    try { await server.stop(); } catch (e) {}
    process.exit(1);
  }
}

if (require.main === module) {
  runChallengerM2Stress();
}

module.exports = { runChallengerM2Stress };
