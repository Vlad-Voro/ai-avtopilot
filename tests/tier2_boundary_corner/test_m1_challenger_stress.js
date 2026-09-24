/**
 * Milestone 1 Adversarial Challenger Stress Test Suite
 *
 * Verifies:
 * 1. 13 Extreme Viewports (320px to 3840px)
 * 2. Typewriter rendering across all 4 phrases: Zero Clipping, Zero Cursor Drift, Zero CLS
 * 3. Burger Menu Interactivity: Rapid Toggle, Escape Spam, Backdrop Tap, Resize Lifecycle
 * 4. Scroll-Margin-Top & Fixed Header Clearance
 *
 * Usage:
 *   node tests/tier2_boundary_corner/test_m1_challenger_stress.js
 */

const path = require('path');
const { chromium } = require('playwright');
const { createStaticServer } = require('../helpers/server');

async function runChallengerStress() {
  const projectDir = path.resolve(__dirname, '../..');
  const server = createStaticServer(projectDir);
  const { baseUrl, port } = await server.start();

  console.log('========================================================================');
  console.log('       MILESTONE 1 ADVERSARIAL CHALLENGER STRESS SUITE');
  console.log('========================================================================');
  console.log(`Server running on ${baseUrl} (port ${port})\n`);

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });

  const page = await browser.newPage({
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
    // ------------------------------------------------------------------------
    // SECTION 1: 13 EXTREME VIEWPORTS
    // ------------------------------------------------------------------------
    console.log('▶ [Challenger Tier 1] 13 Extreme Viewports Boundary Stress');
    const viewports = [
      { w: 320, h: 568, name: '320px (Ultra-compact mobile)' },
      { w: 360, h: 640, name: '360px (Standard Android)' },
      { w: 375, h: 667, name: '375px (iPhone SE/8)' },
      { w: 414, h: 896, name: '414px (iPhone XR/11)' },
      { w: 768, h: 1024, name: '768px (iPad portrait)' },
      { w: 1024, h: 768, name: '1024px (iPad landscape / breakpoint)' },
      { w: 1025, h: 800, name: '1025px (Desktop entry / bug threshold)' },
      { w: 1200, h: 800, name: '1200px (Desktop container width)' },
      { w: 1366, h: 768, name: '1366px (Laptop screen / bug threshold)' },
      { w: 1440, h: 900, name: '1440px (Desktop wide)' },
      { w: 1920, h: 1080, name: '1920px (Full HD 1080p)' },
      { w: 2560, h: 1440, name: '2560px (QHD 2K Ultrawide)' },
      { w: 3840, h: 2160, name: '3840px (4K UHD)' }
    ];

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.w, height: vp.h });
      await page.goto(`${baseUrl}/`);
      await page.waitForTimeout(50);

      const metrics = await page.evaluate(() => {
        const docW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        const bodyScrollW = document.body.scrollWidth;
        const hasHScroll = scrollW > docW || bodyScrollW > docW;

        const box = document.querySelector('.hero__title-accent-box');
        const boxStyle = box ? window.getComputedStyle(box) : null;
        const isClipped = boxStyle && boxStyle.overflow === 'hidden' && box.scrollHeight > box.clientHeight;

        return { docW, scrollW, bodyScrollW, hasHScroll, isClipped };
      });

      record(
        `Viewport ${vp.name} Zero Horizontal Overflow`,
        !metrics.hasHScroll,
        `scrollW=${metrics.scrollW}, docW=${metrics.docW}`
      );
      record(
        `Viewport ${vp.name} Accent Box Overflow Not Clipped`,
        !metrics.isClipped,
        `clipped=${metrics.isClipped}`
      );
    }

    // ------------------------------------------------------------------------
    // SECTION 2: TYPEWRITER RENDERING, CURSOR DRIFT & ZERO CLS
    // ------------------------------------------------------------------------
    console.log('\n▶ [Challenger Tier 2] Typewriter Text Rendering across All Phrases (Zero Clipping, Zero Drift, Zero CLS)');
    const phrases = [
      'работают на автопилоте',
      'экономят 9200+ часов',
      'внедряются за 1 день',
      'масштабируются без найма'
    ];

    const testVps = [1024, 1025, 1200, 1440];

    for (const w of testVps) {
      await page.setViewportSize({ width: w, height: 800 });
      await page.goto(`${baseUrl}/`);
      await page.waitForTimeout(100);

      const phraseMeasurements = [];

      for (const phrase of phrases) {
        const m = await page.evaluate((text) => {
          const el = document.getElementById('typed-text');
          const cursor = document.querySelector('.hero__cursor');
          const box = document.querySelector('.hero__title-accent-box');
          const sub = document.querySelector('.hero__sub');
          const title = document.querySelector('.hero__title');
          const content = document.querySelector('.hero__content');
          const inner = document.querySelector('.hero__inner');

          el.textContent = text;
          void el.offsetHeight;

          const cRect = cursor.getBoundingClientRect();
          const sRect = sub.getBoundingClientRect();
          const bRect = box.getBoundingClientRect();
          const tRect = title.getBoundingClientRect();
          const cntRect = content.getBoundingClientRect();

          const cursorOverlapsSub = cRect.bottom > sRect.top && cRect.top < sRect.bottom;
          const boxStyle = window.getComputedStyle(box);
          const isClipped = boxStyle.overflow === 'hidden' && box.scrollHeight > box.clientHeight;

          return {
            phrase: text,
            subTop: Math.round(sRect.top),
            titleHeight: Math.round(tRect.height),
            contentWidth: Math.round(cntRect.width),
            cursorOverlapsSub,
            isClipped
          };
        }, phrase);

        phraseMeasurements.push(m);
      }

      // Check for zero cursor overlap
      const cursorOverlaps = phraseMeasurements.filter(m => m.cursorOverlapsSub);
      record(
        `Typewriter at ${w}px: Zero Cursor Overlap across all phrases`,
        cursorOverlaps.length === 0,
        `overlaps: ${cursorOverlaps.map(m => m.phrase).join(', ') || 'none'}`
      );

      // Check for zero clipping
      const clipped = phraseMeasurements.filter(m => m.isClipped);
      record(
        `Typewriter at ${w}px: Zero Text Clipping across all phrases`,
        clipped.length === 0,
        `clipped: ${clipped.map(m => m.phrase).join(', ') || 'none'}`
      );

      // Check for Zero CLS (Subtitle position stability)
      const subTops = phraseMeasurements.map(m => m.subTop);
      const minSubTop = Math.min(...subTops);
      const maxSubTop = Math.max(...subTops);
      const subDelta = maxSubTop - minSubTop;

      // Check for Column Width stability
      const contentWidths = phraseMeasurements.map(m => m.contentWidth);
      const minColW = Math.min(...contentWidths);
      const maxColW = Math.max(...contentWidths);
      const colDelta = maxColW - minColW;

      record(
        `Typewriter at ${w}px: Zero Subtitle Vertical CLS (Tolerance <= 2px)`,
        subDelta <= 2,
        `subTop delta=${subDelta}px (range: [${minSubTop}, ${maxSubTop}])`
      );

      record(
        `Typewriter at ${w}px: Zero Grid Column Shift (Tolerance <= 2px)`,
        colDelta <= 2,
        `column width delta=${colDelta}px (range: [${minColW}, ${maxColW}])`
      );
    }

    // ------------------------------------------------------------------------
    // SECTION 3: BURGER MENU STRESS & RACE CONDITIONS
    // ------------------------------------------------------------------------
    console.log('\n▶ [Challenger Tier 3] Burger Menu Stress, Escape Spam, Backdrop Tap & Resize Lifecycle');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`${baseUrl}/`);
    await page.waitForTimeout(100);

    const burger = page.locator('#burger');

    // 3.1: 20 rapid toggles (even -> closed)
    for (let i = 0; i < 20; i++) {
      await burger.click();
      await page.waitForTimeout(25);
    }
    await page.waitForTimeout(100);

    const state20 = await page.evaluate(() => ({
      active: document.querySelector('.nav__links').classList.contains('active'),
      aria: document.getElementById('burger').getAttribute('aria-expanded'),
      bodyOverflow: document.body.style.overflow
    }));
    record(
      'Burger Menu 20 Rapid Clicks: Clean Closed State & Body Scroll Released',
      !state20.active && state20.aria === 'false' && state20.bodyOverflow === '',
      `active=${state20.active}, aria=${state20.aria}, overflow="${state20.bodyOverflow}"`
    );

    // 3.2: 1 toggle -> open
    await burger.click();
    await page.waitForTimeout(100);
    const state21 = await page.evaluate(() => ({
      active: document.querySelector('.nav__links').classList.contains('active'),
      aria: document.getElementById('burger').getAttribute('aria-expanded'),
      bodyOverflow: document.body.style.overflow
    }));
    record(
      'Burger Menu 21st Click: Clean Open State & Body Scroll Locked',
      state21.active && state21.aria === 'true' && state21.bodyOverflow === 'hidden',
      `active=${state21.active}, aria=${state21.aria}, overflow="${state21.bodyOverflow}"`
    );

    // 3.3: Escape spam when open (10 times)
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(20);
    }
    await page.waitForTimeout(100);
    const stateEscOpen = await page.evaluate(() => ({
      active: document.querySelector('.nav__links').classList.contains('active'),
      bodyOverflow: document.body.style.overflow
    }));
    record(
      'Burger Menu Escape Key Spam: Clean Dismissal',
      !stateEscOpen.active && stateEscOpen.bodyOverflow === '',
      `active=${stateEscOpen.active}, overflow="${stateEscOpen.bodyOverflow}"`
    );

    // 3.4: Escape spam when already closed
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(20);
    }
    const stateEscClosed = await page.evaluate(() => ({
      active: document.querySelector('.nav__links').classList.contains('active'),
      bodyOverflow: document.body.style.overflow
    }));
    record(
      'Burger Menu Escape Spam While Closed: No Corrupted State',
      !stateEscClosed.active && stateEscClosed.bodyOverflow === '',
      `active=${stateEscClosed.active}, overflow="${stateEscClosed.bodyOverflow}"`
    );

    // 3.5: Backdrop tapping dismisses menu
    await burger.click();
    await page.waitForTimeout(100);
    // Tap on backdrop at left of drawer (x: 50, y: 200)
    await page.mouse.click(50, 200);
    await page.waitForTimeout(100);
    const stateBackdrop = await page.evaluate(() => ({
      active: document.querySelector('.nav__links').classList.contains('active'),
      bdActive: document.getElementById('nav-backdrop').classList.contains('active'),
      bodyOverflow: document.body.style.overflow
    }));
    record(
      'Burger Menu Backdrop Tap: Closes Drawer & Unlocks Body Scroll',
      !stateBackdrop.active && !stateBackdrop.bdActive && stateBackdrop.bodyOverflow === '',
      `active=${stateBackdrop.active}, bdActive=${stateBackdrop.bdActive}, overflow="${stateBackdrop.bodyOverflow}"`
    );

    // 3.6: Resize during open menu
    await burger.click();
    await page.waitForTimeout(100);
    // Resize to desktop 1024px
    await page.setViewportSize({ width: 1024, height: 768 });
    await page.waitForTimeout(100);
    const stateResizeDesktop = await page.evaluate(() => ({
      active: document.querySelector('.nav__links').classList.contains('active'),
      bodyOverflow: document.body.style.overflow
    }));
    record(
      'Resize During Open Menu: Auto-Closes and Unlocks Body on Desktop (>768px)',
      !stateResizeDesktop.active && stateResizeDesktop.bodyOverflow === '',
      `active=${stateResizeDesktop.active}, overflow="${stateResizeDesktop.bodyOverflow}"`
    );

    // Resize back to 375px and verify menu can still be opened
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(100);
    await burger.click();
    await page.waitForTimeout(100);
    const stateReopen = await page.evaluate(() => document.querySelector('.nav__links').classList.contains('active'));
    await burger.click();
    record(
      'Resize Cycle Restoration: Menu Remains Fully Operational on Return to Mobile',
      stateReopen,
      `reopen=${stateReopen}`
    );

    // ------------------------------------------------------------------------
    // SECTION 4: SCROLL-MARGIN-TOP OFFSET & FIXED HEADER OCCLUSION
    // ------------------------------------------------------------------------
    console.log('\n▶ [Challenger Tier 4] Scroll-Margin-Top & Fixed Header Clearance');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`${baseUrl}/`);
    await page.waitForTimeout(200);

    const sections = ['dashboard', 'services', 'cases', 'calculator', 'contact'];

    for (const secId of sections) {
      const marginData = await page.evaluate((id) => {
        const sec = document.getElementById(id);
        const style = window.getComputedStyle(sec);
        const margin = parseFloat(style.scrollMarginTop || '0');
        return { margin, raw: style.scrollMarginTop };
      }, secId);

      record(
        `Section #${secId} declares scroll-margin-top >= 70px`,
        marginData.margin >= 70,
        `got "${marginData.raw}" (${marginData.margin}px)`
      );
    }

  } finally {
    await browser.close();
    await server.stop();
  }

  console.log('\n========================================================================');
  console.log('CHALLENGER STRESS SUITE RESULTS');
  console.log('========================================================================');
  console.log(`Total Checks: ${passes.length + failures.length}`);
  console.log(`Passed:       ${passes.length}`);
  console.log(`Failed:       ${failures.length}\n`);

  if (failures.length > 0) {
    console.log('CRITICAL DEFECTS IDENTIFIED:');
    for (const f of failures) {
      console.log(`  ✖ ${f.testName} (${f.details})`);
    }
    console.log('\nVERDICT: REJECT (Defects identified requiring worker remediation)');
    return false;
  } else {
    console.log('VERDICT: APPROVE (All stress tests passed cleanly)');
    return true;
  }
}

if (require.main === module) {
  runChallengerStress().then(success => {
    process.exit(success ? 0 : 1);
  }).catch(err => {
    console.error('Fatal challenger execution error:', err);
    process.exit(2);
  });
}

module.exports = { runChallengerStress };
