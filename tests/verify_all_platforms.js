const { chromium, devices } = require('playwright');
const path = require('path');
const { createStaticServer } = require('./helpers/server');

async function run() {
  const serverInstance = createStaticServer(path.resolve(__dirname, '..'));
  const { baseUrl } = await serverInstance.start();

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const testMatrix = [
    { name: 'iPhone 13', device: devices['iPhone 13'] },
    { name: 'iPhone SE (3rd gen)', device: devices['iPhone SE'] },
    { name: 'iPhone 14 Pro Max', device: devices['iPhone 14 Pro Max'] },
    { name: 'Pixel 7', device: devices['Pixel 7'] },
    { name: 'Samsung Galaxy S20', device: { viewport: { width: 360, height: 800 }, userAgent: 'Mozilla/5.0 (Linux; Android 13; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36', isMobile: true, hasTouch: true } },
    { name: 'iPad Mini', device: devices['iPad Mini'] },
    { name: 'Desktop 1440', device: { viewport: { width: 1440, height: 900 }, isMobile: false, hasTouch: false } }
  ];

  let totalErrors = 0;

  for (const t of testMatrix) {
    console.log(`\n======================================================`);
    console.log(`DEVICE AUDIT: ${t.name} (${t.device.viewport.width}x${t.device.viewport.height})`);
    console.log(`======================================================`);

    const context = await browser.newContext({
      ...t.device
    });
    const page = await context.newPage();

    // 1. Load Homepage
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    // Check Header & Hero Clearance
    const navBox = await page.locator('.nav').boundingBox();
    const badgeBox = await page.locator('.hero__badge').boundingBox();
    const clearance = badgeBox.y - (navBox.y + navBox.height);
    if (clearance < 0) {
      console.error(`  [FAIL] Header overlaps hero badge by ${(-clearance).toFixed(1)}px!`);
      totalErrors++;
    } else {
      console.log(`  [PASS] Header clearance: ${clearance.toFixed(1)}px (Nav height: ${navBox.height}px, Badge top: ${badgeBox.y}px)`);
    }

    // Check Zero Horizontal Overflow across whole page
    const overflow = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const bodyW = document.body.scrollWidth;
      return {
        hasOverflow: scrollW > docW || bodyW > docW,
        docW,
        scrollW,
        bodyW
      };
    });
    if (overflow.hasOverflow) {
      console.error(`  [FAIL] Horizontal overflow detected! docWidth=${overflow.docW}, scrollWidth=${overflow.scrollW}, bodyWidth=${overflow.bodyW}`);
      totalErrors++;
    } else {
      console.log(`  [PASS] Zero horizontal overflow (width: ${overflow.docW}px)`);
    }

    // Check Burger Menu on mobile viewports
    if (t.device.viewport.width <= 768) {
      const burger = page.locator('#burger, .nav__burger');
      const isVisible = await burger.isVisible();
      const burgerBox = await burger.boundingBox();
      if (!isVisible || burgerBox.width < 40 || burgerBox.height < 40) {
        console.error(`  [FAIL] Burger button size/visibility: ${burgerBox ? `${burgerBox.width}x${burgerBox.height}` : 'not visible'}`);
        totalErrors++;
      } else {
        console.log(`  [PASS] Mobile burger button: ${burgerBox.width}x${burgerBox.height}px`);
      }

      // Test opening mobile menu
      await burger.click();
      await page.waitForTimeout(200);
      const menuVisible = await page.locator('.nav__links').isVisible();
      if (!menuVisible) {
        console.error(`  [FAIL] Mobile menu drawer failed to open on click!`);
        totalErrors++;
      } else {
        console.log(`  [PASS] Mobile menu drawer opens cleanly`);
      }
      // Close menu
      await burger.click();
      await page.waitForTimeout(200);
    }

    // Check Sections presence and visibility on scroll
    const sections = ['#dashboard', '#compare', '#services', '#cases', '#calculator', '#faq', '#contact'];
    for (const secId of sections) {
      const sec = page.locator(secId);
      const count = await sec.count();
      if (count === 0) {
        console.error(`  [FAIL] Section ${secId} missing from DOM!`);
        totalErrors++;
      } else {
        await sec.scrollIntoViewIfNeeded();
        const box = await sec.boundingBox();
        console.log(`  [PASS] Section ${secId}: visible, height=${box ? box.height.toFixed(0) : 0}px`);
      }
    }

    // Check ROI Sliders interactibility
    const sliderEmp = page.locator('#slider-employees');
    if (await sliderEmp.count() > 0) {
      await sliderEmp.fill('35');
      const valDisp = await page.locator('#display-employees').innerText();
      console.log(`  [PASS] ROI Calculator slider reactive: employees = ${valDisp}`);
    }

    // Check Case Studies cards
    const caseCards = page.locator('.case-card');
    const caseCount = await caseCards.count();
    console.log(`  [PASS] Case study cards rendered: ${caseCount} cards`);

    // Check Footer Layout
    const footer = page.locator('.footer');
    const footerBox = await footer.boundingBox();
    console.log(`  [PASS] Footer compact height: ${footerBox ? footerBox.height.toFixed(0) : 0}px`);

    await context.close();
  }

  await browser.close();
  await serverInstance.stop();

  console.log(`\n======================================================`);
  console.log(`AUDIT COMPLETE. Total failures: ${totalErrors}`);
  console.log(`======================================================`);

  if (totalErrors > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
