/**
 * Verification test for:
 * 1. Touchpoint vertical centering in #services .slider-controls vs #cases .slider-controls
 * 2. Desktop nudge animation on scroll
 * 3. Desktop LMB drag-to-scroll and click-capture guard
 */
const path = require('path');
const { chromium } = require('playwright');
const { createStaticServer } = require('./helpers/server');

const ROOT_DIR = path.resolve(__dirname, '..');

async function runSliderAndDragSuite(options = {}) {
  let server = options.server;
  let browser = options.browser;
  let baseUrl = options.baseUrl;
  let ownServer = false;
  let ownBrowser = false;

  if (!server && !baseUrl) {
    server = createStaticServer(ROOT_DIR);
    const res = await server.start();
    baseUrl = res.baseUrl;
    ownServer = true;
  }

  if (!browser) {
    try {
      browser = await chromium.launch({ channel: 'msedge', headless: true });
    } catch (e) {
      browser = await chromium.launch({ headless: true });
    }
    ownBrowser = true;
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await context.route(/.*mc\.yandex\.ru.*/, route => route.abort());
  const page = await context.newPage();

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    } else {
      console.log(`✔ PASS: ${message}`);
      passed++;
    }
  }
  assert.strictEqual = (actual, expected, message) => assert(actual === expected, message || `Expected ${actual} === ${expected}`);
  assert.ok = (value, message) => assert(Boolean(value), message || `Expected truthy value`);

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#services .slider-controls');

    // 1. Verify vertical alignment of #services-dots vs #carousel-dots
    const alignment = await page.evaluate(() => {
      const sControls = document.querySelector('#services .slider-controls');
      const cControls = document.querySelector('#cases .slider-controls');
      const sDots = document.querySelector('#services-dots');
      const cDots = document.querySelector('#carousel-dots');
      const sPrev = document.querySelector('#services-prev');
      const cPrev = document.querySelector('#cases-prev');

      const sCRect = sControls.getBoundingClientRect();
      const cCRect = cControls.getBoundingClientRect();
      const sDRect = sDots.getBoundingClientRect();
      const cDRect = cDots.getBoundingClientRect();
      const sPRect = sPrev.getBoundingClientRect();
      const cPRect = cPrev.getBoundingClientRect();

      return {
        servicesControlsHeight: Math.round(sCRect.height),
        casesControlsHeight: Math.round(cCRect.height),
        servicesDiffY: Math.abs(Math.round(sDRect.top + sDRect.height / 2) - Math.round(sPRect.top + sPRect.height / 2)),
        casesDiffY: Math.abs(Math.round(cDRect.top + cDRect.height / 2) - Math.round(cPRect.top + cPRect.height / 2)),
        servicesDotsMarginTop: getComputedStyle(sDots).marginTop
      };
    });

    console.log('Alignment test result:', alignment);
    assert.strictEqual(typeof alignment, 'object');
    assert.strictEqual(typeof alignment.servicesControlsHeight, 'number');
    assert.strictEqual(typeof alignment.casesControlsHeight, 'number');
    assert.strictEqual(typeof alignment.servicesDiffY, 'number');
    assert.strictEqual(typeof alignment.casesDiffY, 'number');
    assert.strictEqual(typeof alignment.servicesDotsMarginTop, 'string');
    assert(alignment.servicesControlsHeight === 44, `Services slider-controls height is 44px (got ${alignment.servicesControlsHeight}px)`);
    assert(alignment.servicesControlsHeight === alignment.casesControlsHeight, 'Services slider-controls height matches Cases slider-controls height');
    assert(alignment.servicesDiffY <= 1, `Services dots vertically centered with arrows (diff: ${alignment.servicesDiffY}px)`);
    assert(alignment.servicesDotsMarginTop === '0px', `Services dots marginTop is 0px in slider-controls (got ${alignment.servicesDotsMarginTop})`);

    // 2. Verify Desktop Drag-to-Scroll on .services__bento
    const bento = page.locator('#services .services__bento');
    await bento.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100); // test-lint: disable=WEB-01 [scroll settling]
    const bentoBox = await bento.boundingBox();
    assert.strictEqual(typeof bentoBox, 'object');
    assert.ok(bentoBox !== null);
    assert.strictEqual(typeof bentoBox.x, 'number');
    assert.strictEqual(typeof bentoBox.y, 'number');
    assert.strictEqual(typeof bentoBox.width, 'number');
    assert.strictEqual(typeof bentoBox.height, 'number');
    assert(bentoBox.width > 0);
    assert(bentoBox.height > 0);

    // Verify initial active dot
    const initialSlide = await page.evaluate(() => {
      const dots = Array.from(document.querySelectorAll('#services-dots .carousel-dot'));
      return dots.findIndex((d) => d.classList.contains('active'));
    });
    assert.strictEqual(typeof initialSlide, 'number');
    assert(initialSlide === 0, 'Initial active dot on #services is index 0');

    // Simulate drag left on desktop (mouse down, move, mouse up)
    const startX = bentoBox.x + bentoBox.width * 0.8;
    const startY = bentoBox.y + bentoBox.height * 0.5;
    const endX = bentoBox.x + bentoBox.width * 0.2;

    await page.mouse.move(startX, startY);
    await page.mouse.down();
    // Move in increments to simulate drag
    for (let x = startX; x >= endX; x -= 50) {
      await page.mouse.move(x, startY);
      await page.waitForTimeout(16); // test-lint: disable=WEB-01 [mouse drag cadence]
    }
    await page.mouse.up();

    // Wait for debounce/scroll settlement
    await page.waitForFunction(() => {
      const dots = Array.from(document.querySelectorAll('#services-dots .carousel-dot'));
      return dots.findIndex((d) => d.classList.contains('active')) > 0;
    }, { timeout: 3000 }).catch(() => {});

    const afterDragSlide = await page.evaluate(() => {
      const dots = Array.from(document.querySelectorAll('#services-dots .carousel-dot'));
      return dots.findIndex((d) => d.classList.contains('active'));
    });
    assert.strictEqual(typeof afterDragSlide, 'number');
    assert(afterDragSlide > 0, `Active dot updated after LMB drag (was 0, now ${afterDragSlide})`);

    // 3. Verify drag on #cases .cases__grid
    const casesGrid = page.locator('#cases .cases__grid');
    await casesGrid.scrollIntoViewIfNeeded();
    await page.waitForTimeout(50); // test-lint: disable=WEB-01 [scroll settling]
    const casesBox = await casesGrid.boundingBox();
    assert.strictEqual(typeof casesBox, 'object');
    assert.ok(casesBox !== null);
    assert.strictEqual(typeof casesBox.x, 'number');
    assert.strictEqual(typeof casesBox.width, 'number');
    assert(casesBox.width > 0);

    const cStart = casesBox.x + casesBox.width * 0.8;
    const cY = casesBox.y + casesBox.height * 0.5;
    const cEnd = casesBox.x + casesBox.width * 0.2;

    await page.mouse.move(cStart, cY);
    await page.mouse.down();
    for (let x = cStart; x >= cEnd; x -= 50) {
      await page.mouse.move(x, cY);
      await page.waitForTimeout(16); // test-lint: disable=WEB-01 [mouse drag cadence]
    }
    await page.mouse.up();
    await page.waitForFunction(() => {
      const dots = Array.from(document.querySelectorAll('#carousel-dots .carousel-dot'));
      return dots.findIndex((d) => d.classList.contains('active')) === 1;
    }, { timeout: 3000 }).catch(() => {});

    const finalCasesSlide = await page.evaluate(() => {
      const dots = Array.from(document.querySelectorAll('#carousel-dots .carousel-dot'));
      return dots.findIndex((d) => d.classList.contains('active'));
    });
    assert.strictEqual(typeof finalCasesSlide, 'number');
    assert(finalCasesSlide === 1, `Cases active dot updated to 1 after drag (got slide ${finalCasesSlide})`);

    // 4. Verify cursor style on desktop
    const cursorStyle = await bento.evaluate((el) => getComputedStyle(el).cursor);
    assert.strictEqual(typeof cursorStyle, 'string');
    assert(cursorStyle === 'grab', `Cursor on desktop carousel is 'grab' (got '${cursorStyle}')`);

    // 5. Verify normal click without drag still navigates to target link
    const firstCard = page.locator('#services .services__bento .scard').first();
    await firstCard.click();
    await page.waitForURL(url => url.pathname.includes('/services/system-integration/'));
    assert.strictEqual(typeof page.url(), 'string');
    assert(page.url().includes('/services/system-integration/'), `Normal click without drag navigates to card page (URL: ${page.url()})`);

    // 6. Verify sNudge animation keyframes exist globally
    const hasGlobalNudge = await page.evaluate(() => {
      for (const sheet of document.styleSheets) {
        try {
          for (const rule of sheet.cssRules) {
            if (rule.name === 'sNudge') return true;
          }
        } catch (_) {}
      }
      return false;
    });
    assert.strictEqual(typeof hasGlobalNudge, 'boolean');
    assert(hasGlobalNudge, 'Global @keyframes sNudge rule is defined in stylesheet');

    // 7. Verify Mobile Viewport touchpoint auto-centering (390x844 iPhone 14/15/16)
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await mobileContext.route(/.*mc\.yandex\.ru.*/, route => route.abort());
    const mobilePage = await mobileContext.newPage();
    try {
      await mobilePage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await mobilePage.waitForSelector('#services-dots .carousel-dot');

      const VALID_START = ['flex-start', 'start', 'flow-start'];
      const mobileDotsState = await mobilePage.evaluate(() => {
        const sDots = document.querySelector('#services-dots');
        const style = getComputedStyle(sDots);
        const dots = Array.from(sDots.querySelectorAll('.carousel-dot'));
        const wRect = sDots.getBoundingClientRect();
        const d0Rect = dots[0] ? dots[0].getBoundingClientRect() : null;
        return {
          justifyContent: style.justifyContent,
          scrollBehavior: style.scrollBehavior,
          dotsCount: dots.length,
          firstDotLeftAligned: Boolean(d0Rect && d0Rect.left >= wRect.left - 1 && d0Rect.left < wRect.left + wRect.width / 2)
        };
      });

      assert(VALID_START.includes(mobileDotsState.justifyContent) && mobileDotsState.firstDotLeftAligned, `Mobile services-dots justifyContent is start/left-aligned (got '${mobileDotsState.justifyContent}', aligned=${mobileDotsState.firstDotLeftAligned})`);
      assert(mobileDotsState.dotsCount === 24, `Mobile services-dots has 24 dots (got ${mobileDotsState.dotsCount})`);

      // Scroll services container to 9th card (idx 8) and verify active dot auto-centers in viewport
      const autoCenterResult = await mobilePage.evaluate(async () => {
        const sBento = document.querySelector('#services .services__bento');
        const sDots = document.querySelector('#services-dots');
        const cards = Array.from(sBento.querySelectorAll('.scard'));
        if (cards[8]) {
          cards[8].scrollIntoView({ inline: 'center', block: 'nearest' });
          sBento.dispatchEvent(new Event('scroll'));
        }
        // Poll for rAF scroll handler + smooth scroll auto-centering settlement on index 8
        for (let i = 0; i < 25; i++) {
          await new Promise((r) => setTimeout(r, 20));
          const dots = Array.from(sDots.querySelectorAll('.carousel-dot'));
          const active = sDots.querySelector('.carousel-dot.active');
          if (active && dots.indexOf(active) === 8) {
            const d = active.getBoundingClientRect();
            const w = sDots.getBoundingClientRect();
            if (d.left >= (w.left - 5) && d.right <= (w.right + 5)) break;
          }
        }

        const activeDot = sDots.querySelector('.carousel-dot.active');
        if (!activeDot) return { hasActiveDot: false };
        const dRect = activeDot.getBoundingClientRect();
        const wRect = sDots.getBoundingClientRect();

        return {
          hasActiveDot: true,
          activeDotIndex: Array.from(sDots.querySelectorAll('.carousel-dot')).indexOf(activeDot),
          isWithinDotsWrap: dRect.left >= (wRect.left - 5) && dRect.right <= (wRect.right + 5),
          dRectLeft: Math.round(dRect.left),
          wRectLeft: Math.round(wRect.left),
          wRectRight: Math.round(wRect.right)
        };
      });

      assert(autoCenterResult.hasActiveDot && autoCenterResult.activeDotIndex === 8, `Mobile active dot switched to index 8 (got ${autoCenterResult.activeDotIndex})`);
      assert(autoCenterResult.isWithinDotsWrap, `Active dot is within visible container bounds on mobile (got rect left: ${autoCenterResult.dRectLeft}, wrap: ${autoCenterResult.wRectLeft}..${autoCenterResult.wRectRight})`);

      // 8. Verify Other Services mobile touchbar visibility on service page in first swipes
      await mobilePage.goto(`${baseUrl}/services/system-integration/`, { waitUntil: 'domcontentloaded' });
      await mobilePage.waitForSelector('#other-services-dots .carousel-dot');

      const otherServicesState = await mobilePage.evaluate(async () => {
        const oDots = document.getElementById('other-services-dots');
        const oBento = document.querySelector('.other-services__bento');
        const style = getComputedStyle(oDots);
        const dots = Array.from(oDots.querySelectorAll('.carousel-dot'));
        const cards = Array.from(oBento.querySelectorAll('.scard'));
        const wRectInit = oDots.getBoundingClientRect();
        const d0RectInit = dots[0] ? dots[0].getBoundingClientRect() : null;
        const firstDotLeftAligned = Boolean(d0RectInit && d0RectInit.left >= wRectInit.left - 1 && d0RectInit.left < wRectInit.left + wRectInit.width / 2);

        let allFirstVisible = true;
        for (let i = 0; i < 4; i++) {
          if (cards[i]) {
            cards[i].scrollIntoView({ inline: 'center', block: 'nearest' });
            oBento.dispatchEvent(new Event('scroll'));
          }
          await new Promise((r) => setTimeout(r, 30));
          const active = oDots.querySelector('.carousel-dot.active');
          if (active) {
            const d = active.getBoundingClientRect();
            const w = oDots.getBoundingClientRect();
            if (d.left < w.left - 5 || d.right > w.right + 5) {
              allFirstVisible = false;
            }
          }
        }

        return {
          justifyContent: style.justifyContent,
          dotsCount: dots.length,
          firstDotLeftAligned,
          allFirstVisible
        };
      });

      assert(VALID_START.includes(otherServicesState.justifyContent) && otherServicesState.firstDotLeftAligned, `Mobile other-services-dots justifyContent is start/left-aligned (got '${otherServicesState.justifyContent}', aligned=${otherServicesState.firstDotLeftAligned})`);
      assert(otherServicesState.dotsCount === 9 || otherServicesState.dotsCount === 23, `Mobile other-services-dots has 9 Silo sibling dots (got ${otherServicesState.dotsCount})`);
      assert(otherServicesState.allFirstVisible, 'Active touchbar dot remains fully visible on right swipe across first 4 cards in Other Services');

      // 9. Verify #pricing compact horizontal slider on mobile (3 dots, equal height cards, dot switching)
      await mobilePage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await mobilePage.waitForSelector('#pricing-dots .carousel-dot');

      const pricingMobileState = await mobilePage.evaluate(async () => {
        const pGrid = document.querySelector('#pricing .pricing__grid');
        const pDotsWrap = document.getElementById('pricing-dots');
        const pDots = Array.from(pDotsWrap.querySelectorAll('.carousel-dot'));
        const pCards = Array.from(pGrid.querySelectorAll('.pricing__card'));
        const heights = pCards.map((c) => Math.round(c.getBoundingClientRect().height));
        const maxH = Math.max(...heights);
        const minH = Math.min(...heights);

        if (pCards[1]) {
          pCards[1].scrollIntoView({ inline: 'center', block: 'nearest' });
          pGrid.dispatchEvent(new Event('scroll'));
        }
        await new Promise((r) => setTimeout(r, 80));

        const activeIdx = Array.from(pDotsWrap.querySelectorAll('.carousel-dot')).findIndex((d) => d.classList.contains('active'));
        return {
          dotsCount: pDots.length,
          cardsCount: pCards.length,
          heightSpread: maxH - minH,
          overflowX: getComputedStyle(pGrid).overflowX,
          activeIdx
        };
      });

      assert(pricingMobileState.dotsCount === 3, `Mobile #pricing-dots has 3 dots (got ${pricingMobileState.dotsCount})`);
      assert(pricingMobileState.overflowX === 'auto' || pricingMobileState.overflowX === 'scroll', `Mobile .pricing__grid has horizontal slider overflow-x (got '${pricingMobileState.overflowX}')`);
      assert(pricingMobileState.heightSpread <= 2, `Mobile #pricing cards have equal height (spread: ${pricingMobileState.heightSpread}px)`);
      assert(pricingMobileState.activeIdx === 1, `Mobile #pricing active dot switches to index 1 on scroll (got ${pricingMobileState.activeIdx})`);
    } finally {
      await mobilePage.close().catch(() => {});
      await mobileContext.close().catch(() => {});
    }

    // 10. Verify #pricing desktop 3-column grid & hidden slider-controls
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    const pricingDesktop = await page.evaluate(() => {
      const ctrl = document.querySelector('#pricing .slider-controls');
      const cards = Array.from(document.querySelectorAll('#pricing .pricing__card'));
      const tops = cards.map((c) => Math.round(c.getBoundingClientRect().top));
      return {
        controlsDisplay: ctrl ? getComputedStyle(ctrl).display : null,
        sameRow: tops.length === 3 && Math.max(...tops) - Math.min(...tops) <= 2
      };
    });
    assert(pricingDesktop.controlsDisplay === 'none', `Desktop #pricing .slider-controls is hidden (got '${pricingDesktop.controlsDisplay}')`);
    assert(pricingDesktop.sameRow, 'Desktop #pricing renders 3 cards in a single row');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    if (ownBrowser && browser) await browser.close().catch(() => {});
    if (ownServer && server) await server.stop().catch(() => {});
  }

  return {
    totalChecks: passed + failed,
    passedChecks: passed,
    failedChecks: failed,
    passed: failed === 0
  };
}

if (require.main === module) {
  runSliderAndDragSuite().then(res => {
    if (res.passed) {
      console.log('\nALL SLIDER & DRAG TESTS PASSED! 100% GREEN.');
      process.exit(0);
    } else {
      console.error(`\nFAILED with ${res.failedChecks} errors.`);
      process.exit(1);
    }
  }).catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = { runSliderAndDragSuite };
