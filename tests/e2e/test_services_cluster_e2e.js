/**
 * E2E Verification Suite for 5 Service Scenario Landing Pages Cluster
 * Covers Navigation, Mobile Responsiveness (Zero Overflow), ROI Calculator reactivity,
 * FAQ Accordion toggles, and Semantic HTML Invariants.
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('E2E: Service Cluster Landing Pages Verification', {
  tier: 3,
  milestone: 'M4',
  feature: 'ServicesCluster'
});

const CLUSTER_SERVICES = [
  { slug: 'system-integration', titleKeyword: 'Интеграция' },
  { slug: 'retail-inventory', titleKeyword: 'склад' },
  { slug: 'document-automation', titleKeyword: 'первичк' },
  { slug: 'customer-support', titleKeyword: 'поддержк' },
  { slug: 'rapid-pilot', titleKeyword: 'Быстрый старт' },
  { slug: 'specifications-kp', titleKeyword: 'Спецификации' },
  { slug: 'price-monitoring', titleKeyword: 'Мониторинг' }
];

suite.test('E2E-1: Bento cards on homepage navigate to all 5 service landing pages', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);
  for (const svc of CLUSTER_SERVICES) {
    const cardLink = page.locator(`a[href="/services/${svc.slug}/"]`).first();
    await assert.ok(await cardLink.count() > 0, `Homepage must contain bento card link for /services/${svc.slug}/`);
  }
  for (const svc of CLUSTER_SERVICES) {
    await page.goto(`${baseUrl}/services/${svc.slug}/`);
    const h1Text = await page.locator('h1').textContent();
    assert.ok(h1Text.length > 0, `Page /services/${svc.slug}/ must have non-empty <h1>`);
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href');
    assert.strictEqual(canonical, `https://ai-avtopilot.ru/services/${svc.slug}/`);
  }
});

suite.test('E2E-2: Bento cards on /services/ hub navigate to all 5 service landing pages', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/services/`);
  for (const svc of CLUSTER_SERVICES) {
    const cardLink = page.locator(`a[href="/services/${svc.slug}/"]`).first();
    await assert.ok(await cardLink.count() > 0, `/services/ hub must contain bento card link for /services/${svc.slug}/`);
  }
  for (const svc of CLUSTER_SERVICES) {
    await page.goto(`${baseUrl}/services/${svc.slug}/`);
    const h1Count = await page.locator('h1').count();
    assert.strictEqual(h1Count, 1, `Expected exactly 1 <h1> on /services/${svc.slug}/`);
  }
});

suite.test('E2E-3: Service cluster pages have zero horizontal overflow on mobile viewports (320px, 375px)', async ({ page, baseUrl }) => {
  const viewports = [
    { width: 320, height: 600 },
    { width: 375, height: 667 },
    { width: 768, height: 1024 },
    { width: 1440, height: 900 }
  ];

  for (const svc of CLUSTER_SERVICES) {
    await page.goto(`${baseUrl}/services/${svc.slug}/`);
    for (const vp of viewports) {
      await page.setViewportSize(vp);
      
      const hasOverflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });
      
      assert.strictEqual(
        hasOverflow,
        false,
        `Page /services/${svc.slug}/ must NOT have horizontal scrollbar at viewport ${vp.width}px`
      );
    }
  }
});

suite.test('E2E-4: ROI Calculator updates values dynamically without NaN on service pages', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 1280, height: 800 });

  for (const svc of CLUSTER_SERVICES) {
    await page.goto(`${baseUrl}/services/${svc.slug}/`);

    const empSlider = page.locator('#slider-employees');
    const hoursSlider = page.locator('#slider-hours');
    const salarySlider = page.locator('#slider-salary');

    await assert.ok(await empSlider.count() > 0, `Missing #slider-employees on /services/${svc.slug}/`);

    // Verify initial values
    const initialCost = await page.locator('#roi-cost').textContent();
    const initialSave = await page.locator('#roi-save').textContent();
    const initialHours = await page.locator('#roi-hours').textContent();

    assert.ok(!initialCost.includes('NaN') && initialCost.includes('₽'), `Invalid initial cost on /services/${svc.slug}/`);
    assert.ok(!initialSave.includes('NaN') && initialSave.includes('₽'), `Invalid initial save on /services/${svc.slug}/`);
    assert.ok(!initialHours.includes('NaN') && initialHours.includes('часов'), `Invalid initial hours on /services/${svc.slug}/`);

    // Change sliders via evaluate & dispatch input event
    await page.evaluate(() => {
      const s1 = document.getElementById('slider-employees');
      const s2 = document.getElementById('slider-hours');
      const s3 = document.getElementById('slider-salary');
      if (s1 && s2 && s3) {
        s1.value = '5';
        s1.dispatchEvent(new Event('input', { bubbles: true }));
        s2.value = '30';
        s2.dispatchEvent(new Event('input', { bubbles: true }));
        s3.value = '150000';
        s3.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });

    const updatedCost = await page.locator('#roi-cost').textContent();
    const updatedSave = await page.locator('#roi-save').textContent();
    
    assert.ok(!updatedCost.includes('NaN') && updatedCost.includes('₽'), `Cost became NaN on /services/${svc.slug}/`);
    assert.ok(!updatedSave.includes('NaN') && updatedSave.includes('₽'), `Save became NaN on /services/${svc.slug}/`);
  }
});

suite.test('E2E-5: FAQ accordion opens and closes smoothly without collisions', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/services/system-integration/`);

  const firstFaqHeader = page.locator('.faq-item__header').first();
  await assert.ok(await firstFaqHeader.count() > 0, 'FAQ header must exist');

  // Initially aria-expanded="false"
  assert.strictEqual(await firstFaqHeader.getAttribute('aria-expanded'), 'false');

  // Click to open
  await firstFaqHeader.click();
  assert.strictEqual(await firstFaqHeader.getAttribute('aria-expanded'), 'true');

  // Click to close
  await firstFaqHeader.click();
  assert.strictEqual(await firstFaqHeader.getAttribute('aria-expanded'), 'false');
});

suite.test('E2E-6: Semantic DOM validation (0 nested links, 1 H1, honeypot field)', async ({ page, baseUrl }) => {
  for (const svc of CLUSTER_SERVICES) {
    await page.goto(`${baseUrl}/services/${svc.slug}/`);

    const nestedLinksCount = await page.evaluate(() => {
      return document.querySelectorAll('a a').length;
    });
    assert.strictEqual(nestedLinksCount, 0, `Found nested <a> tags on /services/${svc.slug}/`);

    const h1Count = await page.locator('h1').count();
    assert.strictEqual(h1Count, 1, `Expected exactly 1 <h1> on /services/${svc.slug}/`);

    const honeypot = page.locator('input[name="_honey"]');
    assert.ok(await honeypot.count() > 0, `Missing honeypot on /services/${svc.slug}/`);
  }
});

// Standalone execution support
if (require.main === module) {
  const path = require('path');
  const { chromium } = require('playwright');
  const { createStaticServer } = require('../helpers/server');

  (async () => {
    const projectDir = path.resolve(__dirname, '../..');
    const server = createStaticServer(projectDir);
    const { baseUrl } = await server.start();
    const browser = await chromium.launch({
      channel: process.platform === 'win32' ? 'msedge' : undefined,
      headless: true
    });
    const page = await browser.newPage();

    try {
      console.log('Running Service Cluster E2E Suite...');
      const results = await suite.run({ page, baseUrl, browser });
      let passed = 0;
      let failed = 0;
      for (const r of results) {
        if (r.status === 'pass') {
          passed++;
          console.log(` ✔ PASS: ${r.title} (${r.durationMs}ms)`);
        } else {
          failed++;
          console.error(` ❌ FAIL: ${r.title}`);
          if (r.error) console.error(`    ${r.error.message}`);
        }
      }
      console.log(`\nCluster E2E Results: ${passed} passed, ${failed} failed`);
      process.exit(failed === 0 ? 0 : 1);
    } finally {
      await page.close().catch(() => {});
      await browser.close().catch(() => {});
      await server.stop().catch(() => {});
    }
  })();
}

module.exports = suite;
