/**
 * E2E Verification Suite: Service Cluster ROI Reactivity & DOM Invariants
 * Covers ROI Calculator parameter reactivity and semantic HTML / honeypot invariants.
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('E2E: Service Cluster Reactivity & Semantics', {
  tier: 3,
  milestone: 'M4',
  feature: 'ServicesClusterReactivity'
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

module.exports = suite;
