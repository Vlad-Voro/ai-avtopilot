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
    assert(alignment.servicesControlsHeight === 44, `Services slider-controls height is 44px (got ${alignment.servicesControlsHeight}px)`);
    assert(alignment.servicesControlsHeight === alignment.casesControlsHeight, 'Services slider-controls height matches Cases slider-controls height');
    assert(alignment.servicesDiffY <= 1, `Services dots vertically centered with arrows (diff: ${alignment.servicesDiffY}px)`);
    assert(alignment.servicesDotsMarginTop === '0px', `Services dots marginTop is 0px in slider-controls (got ${alignment.servicesDotsMarginTop})`);

    // 2. Verify Desktop Drag-to-Scroll on .services__bento
    const bento = page.locator('#services .services__bento');
    await bento.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100); // test-lint: disable=WEB-01 [scroll settling]
    const bentoBox = await bento.boundingBox();

    // Verify initial active dot
    const initialSlide = await page.evaluate(() => {
      const dots = Array.from(document.querySelectorAll('#services-dots .carousel-dot'));
      return dots.findIndex((d) => d.classList.contains('active'));
    });
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
    await page.waitForTimeout(400); // test-lint: disable=WEB-01 [carousel debounce]

    const afterDragSlide = await page.evaluate(() => {
      const dots = Array.from(document.querySelectorAll('#services-dots .carousel-dot'));
      return dots.findIndex((d) => d.classList.contains('active'));
    });
    assert(afterDragSlide > 0, `Active dot updated after LMB drag (was 0, now ${afterDragSlide})`);

    // 3. Verify drag on #cases .cases__grid
    const casesGrid = page.locator('#cases .cases__grid');
    await casesGrid.scrollIntoViewIfNeeded();
    await page.waitForTimeout(100); // test-lint: disable=WEB-01 [scroll settling]
    const casesBox = await casesGrid.boundingBox();

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
    await page.waitForTimeout(400); // test-lint: disable=WEB-01 [carousel debounce]

    const finalCasesSlide = await page.evaluate(() => {
      const dots = Array.from(document.querySelectorAll('#carousel-dots .carousel-dot'));
      return dots.findIndex((d) => d.classList.contains('active'));
    });
    assert(finalCasesSlide === 1, `Cases active dot updated to 1 after drag (got slide ${finalCasesSlide})`);

    // 4. Verify cursor style on desktop
    const cursorStyle = await bento.evaluate((el) => getComputedStyle(el).cursor);
    assert(cursorStyle === 'grab', `Cursor on desktop carousel is 'grab' (got '${cursorStyle}')`);

    // 5. Verify normal click without drag still navigates to target link
    const firstCard = page.locator('#services .services__bento .scard').first();
    await firstCard.click();
    await page.waitForURL(url => url.pathname.includes('/services/system-integration/'));
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
    assert(hasGlobalNudge, 'Global @keyframes sNudge rule is defined in stylesheet');

    // 7. Verify Mobile Viewport touchpoint auto-centering (390x844 iPhone 14/15/16)
    const mobileContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
    const mobilePage = await mobileContext.newPage();
    try {
      await mobilePage.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      await mobilePage.waitForSelector('#services-dots .carousel-dot');

      const mobileDotsState = await mobilePage.evaluate(() => {
        const sDots = document.querySelector('#services-dots');
        const style = getComputedStyle(sDots);
        const dots = Array.from(sDots.querySelectorAll('.carousel-dot'));
        return {
          justifyContent: style.justifyContent,
          scrollBehavior: style.scrollBehavior,
          dotsCount: dots.length
        };
      });

      assert(mobileDotsState.justifyContent === 'flex-start', `Mobile services-dots justifyContent is 'flex-start' (got '${mobileDotsState.justifyContent}')`);
      assert(mobileDotsState.dotsCount === 13, `Mobile services-dots has 13 dots (got ${mobileDotsState.dotsCount})`);

      // Scroll services container to 9th card (idx 8) and verify active dot auto-centers in viewport
      const autoCenterResult = await mobilePage.evaluate(async () => {
        const sBento = document.querySelector('#services .services__bento');
        const sDots = document.querySelector('#services-dots');
        const cards = Array.from(sBento.querySelectorAll('.scard'));
        if (cards[8]) {
          cards[8].scrollIntoView({ inline: 'center', block: 'nearest' });
          sBento.dispatchEvent(new Event('scroll'));
        }
        // Wait for smooth scroll / rAF
        await new Promise((r) => setTimeout(r, 300));

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
    } finally {
      await mobilePage.close().catch(() => {});
      await mobileContext.close().catch(() => {});
    }

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
