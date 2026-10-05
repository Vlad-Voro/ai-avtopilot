/**
 * E2E Verification Suite: Service Cluster Navigation & FAQ
 * Covers Homepage & Hub Bento card navigation, canonical URLs, and FAQ Accordion.
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('E2E: Service Cluster Navigation', {
  tier: 3,
  milestone: 'M4',
  feature: 'ServicesClusterNav'
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

module.exports = suite;
