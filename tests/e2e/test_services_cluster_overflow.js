/**
 * E2E Verification Suite: Service Cluster Viewport Responsiveness
 * Covers Zero Horizontal Overflow across 4 viewport breakpoints (320px, 375px, 768px, 1440px).
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('E2E: Service Cluster Overflow', {
  tier: 3,
  milestone: 'M4',
  feature: 'ServicesClusterOverflow'
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

module.exports = suite;
