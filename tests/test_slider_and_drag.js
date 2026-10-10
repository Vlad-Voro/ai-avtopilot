/**
 * Verification test for:
 * 1. Touchpoint vertical centering in #services .slider-controls vs #cases .slider-controls
 * 2. Desktop nudge animation on scroll
 * 3. Desktop LMB drag-to-scroll and click-capture guard
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT_DIR = path.resolve(__dirname, '..');

function serveStatic(req, res) {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath.endsWith('/')) {
    reqPath += 'index.html';
  }
  const filePath = path.join(ROOT_DIR, reqPath);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath);
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon'
  }[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': mime });
  res.end(fs.readFileSync(filePath));
}

async function runTests() {
  const server = http.createServer(serveStatic);
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/`;

  console.log(`Ephemeral test server running at ${baseUrl}`);
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (e) {
    browser = await chromium.launch({ headless: true });
  }
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  let failed = 0;
  function assert(condition, message) {
    if (!condition) {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    } else {
      console.log(`✔ PASS: ${message}`);
    }
  }

  try {
    await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(300);

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
    await page.waitForTimeout(200);
    const bentoRect = await bento.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });

    // Drag from right to left using mouse
    const startX = bentoRect.x + bentoRect.width * 0.75;
    const startY = bentoRect.y + bentoRect.height * 0.5;
    const endX = bentoRect.x + bentoRect.width * 0.25;

    const initialScroll = await bento.evaluate((el) => el.scrollLeft);
    const initialSlide = await page.evaluate(() => {
      const dots = Array.from(document.querySelectorAll('#services-dots .carousel-dot'));
      return dots.findIndex((d) => d.classList.contains('active'));
    });
    assert(initialSlide === 0, 'Initial active slide is 0');

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    await page.evaluate(() => {
      window.addEventListener('click', (e) => {
        console.log('WINDOW CLICK:', e.target.tagName, e.target.className, e.target.closest('a')?.getAttribute('href'), 'defaultPrevented:', e.defaultPrevented);
      }, true);
    });

    await page.mouse.move(startX, startY);
    await page.mouse.down({ button: 'left' });
    // Move gradually
    for (let x = startX; x >= endX; x -= 30) {
      await page.mouse.move(x, startY);
    }
    await page.waitForTimeout(100);
    const draggedScroll = await bento.evaluate((el) => el.scrollLeft);
    assert(draggedScroll > initialScroll, `Dragging with LMB scrolled container (from ${initialScroll} to ${draggedScroll})`);

    await page.mouse.up({ button: 'left' });
    await page.waitForTimeout(400);

    const finalSlide = await page.evaluate(() => {
      const dots = Array.from(document.querySelectorAll('#services-dots .carousel-dot'));
      return dots.findIndex((d) => d.classList.contains('active'));
    });
    assert(finalSlide === 1, `Active dot updated to 1 after drag (got slide ${finalSlide})`);
    assert(!page.url().includes('/services/system-integration') && !page.url().includes('/services/rapid-pilot'), `Drag gesture did not trigger card link navigation (URL: ${page.url()})`);

    // 3. Verify drag on Cases block as well
    const casesGrid = page.locator('#cases .cases__grid');
    await casesGrid.scrollIntoViewIfNeeded();
    await page.waitForTimeout(200);
    const casesRect = await casesGrid.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    });
    const cStartX = casesRect.x + casesRect.width * 0.75;
    const cStartY = casesRect.y + casesRect.height * 0.5;
    const cEndX = casesRect.x + casesRect.width * 0.25;

    await page.mouse.move(cStartX, cStartY);
    await page.mouse.down({ button: 'left' });
    for (let x = cStartX; x >= cEndX; x -= 30) {
      await page.mouse.move(x, cStartY);
    }
    await page.mouse.up({ button: 'left' });
    await page.waitForTimeout(400);

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
    await page.waitForTimeout(300);
    assert(page.url().includes('/services/system-integration/'), `Normal click without drag navigates to card page (URL: ${page.url()})`);

    // 5. Verify sNudge animation keyframes exist globally
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

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    await browser.close();
    server.close();
  }

  if (failed > 0) {
    console.error(`\nFAILED with ${failed} errors.`);
    process.exit(1);
  } else {
    console.log('\nALL SLIDER & DRAG TESTS PASSED! 100% GREEN.');
    process.exit(0);
  }
}

runTests();
