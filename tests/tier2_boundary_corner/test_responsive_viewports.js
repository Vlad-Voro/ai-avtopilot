/**
 * Tier 2 - Responsive Viewport Boundaries (320px, 375px, 414px, 768px, 1024px, 1200px, 1440px, 2560px)
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('Tier 2 - Responsive Viewport Boundaries', {
  tier: 2,
  milestone: 'M1',
  feature: 'Boundaries: Viewports'
});

const VIEWPORTS = [
  { name: '320px (Ultra-compact mobile)', width: 320, height: 568 },
  { name: '375px (Standard mobile iPhone)', width: 375, height: 667 },
  { name: '414px (Large mobile iPhone Plus)', width: 414, height: 896 },
  { name: '768px (Tablet portrait)', width: 768, height: 1024 },
  { name: '1024px (Tablet landscape / breakpoint)', width: 1024, height: 768 },
  { name: '1200px (Desktop medium)', width: 1200, height: 800 },
  { name: '1440px (Desktop wide)', width: 1440, height: 900 },
  { name: '2560px (Ultrawide 4K monitor)', width: 2560, height: 1440 }
];

for (const vp of VIEWPORTS) {
  suite.test(`Boundary Viewport: ${vp.name} - Zero horizontal overflow & layout integrity`, async ({ page, baseUrl }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${baseUrl}/`);

    const result = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      const bodyScrollW = document.body.scrollWidth;

      const titleBox = document.querySelector('.hero__title-accent-box');
      let titleClipped = false;
      if (titleBox) {
        titleClipped = titleBox.scrollHeight > titleBox.clientHeight &&
                       window.getComputedStyle(titleBox).overflow === 'hidden';
      }

      return {
        hasOverflow: scrollW > docW || bodyScrollW > docW,
        scrollW,
        docW,
        titleClipped
      };
    });

    assert.strictEqual(
      result.hasOverflow,
      false,
      `Horizontal overflow detected at ${vp.width}px: scrollWidth (${result.scrollW}) > clientWidth (${result.docW})`
    );
    assert.strictEqual(
      result.titleClipped,
      false,
      `Hero title text clipped due to overflow:hidden at ${vp.width}px`
    );
  });
}

module.exports = suite;
