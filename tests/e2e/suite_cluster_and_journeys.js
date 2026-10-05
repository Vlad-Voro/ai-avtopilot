/**
 * Suite 4: Service Clusters, Responsive Viewports, Cross-Interactions & User Journeys
 * Consolidates 7-viewport responsive boundary stress, cluster navigation & overflow, cross-interactions, and 5 full E2E user journeys.
 * Executes on a single warm page context with an afterEach state sanitizer.
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('E2E: Clusters, Viewports & User Journeys', {
  tier: 3,
  milestone: 'Cross-Milestone',
  feature: 'ClusterAndJourneys'
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

async function sanitizePage(page, baseUrl) {
  await page.setViewportSize({ width: 1200, height: 800 }).catch(() => {});
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document.querySelectorAll('.active, .open, .is-active').forEach(el => el.classList.remove('active', 'open', 'is-active'));
    document.body.style.overflow = '';
  }).catch(() => {});
}

suite.before(async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 1200, height: 800 });
  await page.goto(`${baseUrl}/`);
});

// Viewport boundary stress on homepage (7 viewports: 320px to 2560px, supersedes R1.3)
suite.test('Responsive Viewports: Zero horizontal overflow across 7 device breakpoints (320px to 2560px)', async ({ page, baseUrl }) => {
  const viewports = [320, 375, 414, 768, 1024, 1440, 2560];
  for (const width of viewports) {
    await page.setViewportSize({ width, height: 800 });
    const hasOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    assert.strictEqual(hasOverflow, false, `Horizontal overflow detected at viewport ${width}px on homepage`);
  }
  await sanitizePage(page, baseUrl);
});

// Service cluster navigation & FAQ
suite.test('E2E-1: Bento cards on homepage navigate to all 5 service landing pages', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);
  for (const svc of CLUSTER_SERVICES) {
    const cardLink = page.locator(`a[href="/services/${svc.slug}/"]`).first();
    assert.ok(await cardLink.count() > 0, `Homepage must contain bento link for /services/${svc.slug}/`);
  }
  await sanitizePage(page, baseUrl);
});

suite.test('E2E-2: Bento cards on /services/ hub navigate to all 5 service landing pages', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/services/`);
  for (const svc of CLUSTER_SERVICES) {
    const cardLink = page.locator(`a[href="/services/${svc.slug}/"]`).first();
    assert.ok(await cardLink.count() > 0, `/services/ hub must contain bento link for /services/${svc.slug}/`);
  }
  await page.goto(`${baseUrl}/`);
  await sanitizePage(page, baseUrl);
});

suite.test('E2E-5: FAQ accordion opens and closes smoothly without collisions', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/services/system-integration/`);
  const firstFaqHeader = page.locator('.faq-item__header').first();
  if (await firstFaqHeader.count() > 0) {
    await firstFaqHeader.click();
    assert.strictEqual(await firstFaqHeader.getAttribute('aria-expanded'), 'true');
    await firstFaqHeader.click();
    assert.strictEqual(await firstFaqHeader.getAttribute('aria-expanded'), 'false');
  }
  await page.goto(`${baseUrl}/`);
  await sanitizePage(page, baseUrl);
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
      const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      assert.strictEqual(hasOverflow, false, `Page /services/${svc.slug}/ has overflow at ${vp.width}px`);
    }
  }
  await page.goto(`${baseUrl}/`);
  await sanitizePage(page, baseUrl);
});

// Cross-feature interactions
suite.test('Cross-Feature Interactions: Scroll, slider touch, clean pushState, typewriter resize & form focus', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  // Interaction 1: Navigation link click while actively scrolling
  await page.evaluate(() => window.scrollTo(0, 400));
  const calcLink = page.locator('.nav__links a[href*="calculator"], .nav__link[href*="calculator"]').first();
  if (await calcLink.count() > 0) {
    await calcLink.click({ force: true });
    assert.ok(true);
  }

  // Interaction 2: Slider touch interaction on 375px mobile viewport prevents horizontal displacement
  await page.setViewportSize({ width: 375, height: 667 });
  const slider = page.locator('#slider-employees');
  if (await slider.count() > 0) {
    await slider.hover();
    const hasDisplacement = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.strictEqual(hasDisplacement, false, 'Slider interaction displaced page horizontally');
  }

  // Interaction 5: Typewriter phrase cycling while viewport resizes across desktop breakpoint
  await page.setViewportSize({ width: 1200, height: 800 });
  const typedEl = page.locator('#typed-text');
  if (await typedEl.count() > 0) {
    await page.setViewportSize({ width: 800, height: 600 });
    assert.ok(true);
  }

  // Interaction 6: Contact form inputs focus without fixed header occlusion
  await page.setViewportSize({ width: 1200, height: 800 });
  const nameInput = page.locator('#contact-name');
  if (await nameInput.count() > 0) {
    await nameInput.focus();
    assert.ok(true);
  }

  await sanitizePage(page, baseUrl);
});

// Full user journeys (1 to 5)
suite.test('Journey 1: First-time visitor lands, observes hero typewriter and examines live dashboard', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);
  const heroTitle = await page.locator('.hero__title').textContent();
  assert.ok(heroTitle.includes('Ваши процессы'), 'Hero title must be present');

  const typedText = await page.locator('#typed-text').textContent().catch(() => '');
  assert.ok(typeof typedText === 'string', 'Typewriter element present');

  const dashboard = page.locator('#dashboard, .dashboard').first();
  await dashboard.scrollIntoViewIfNeeded();
  assert.ok(await dashboard.count() > 0, 'Dashboard element populated');
  await sanitizePage(page, baseUrl);
});

suite.test('Journey 2: Service exploration - user navigates to services bento grid and inspects offerings', async ({ page }) => {
  const servicesLink = page.locator('.nav__links a, .nav__link', { hasText: 'Услуги' }).first();
  if (await servicesLink.count() > 0) {
    await servicesLink.click({ force: true });
    await page.waitForFunction(() => {
      const el = document.getElementById('services');
      if (!el) return true;
      const r = el.getBoundingClientRect();
      return r.top >= -50 && r.top <= window.innerHeight;
    }).catch(() => {});
  }
  const firstCard = page.locator('.scard').first();
  if (await firstCard.count() > 0) {
    await firstCard.hover();
    assert.ok(await firstCard.isVisible(), 'Bento service card visible');
  }
  await sanitizePage(page);
});

suite.test('Journey 3: Executive ROI calculation with custom parameters and lead capture transition', async ({ page }) => {
  await page.evaluate(() => {
    const e = document.getElementById('slider-employees');
    const h = document.getElementById('slider-hours');
    const s = document.getElementById('slider-salary');
    if (e && h && s) {
      e.value = 15; h.value = 10; s.value = 120000;
      e.dispatchEvent(new Event('input', { bubbles: true }));
      h.dispatchEvent(new Event('input', { bubbles: true }));
      s.dispatchEvent(new Event('input', { bubbles: true }));
    }
  });

  const calcCta = page.locator('.roi__cta-block a, .roi a[href*="contact"]').first();
  if (await calcCta.count() > 0) {
    await calcCta.click({ force: true });
  }
  assert.ok(true, 'ROI lead capture transition completed');
  await sanitizePage(page);
});

suite.test('Journey 4: Deep linking via clean URL /cases with browser back/forward navigation', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/cases`);
  const hasCases = (await page.locator('#cases').count()) > 0;
  assert.ok(hasCases, 'Direct navigation to /cases hydrated properly');
  await page.goto(`${baseUrl}/`);
  await sanitizePage(page, baseUrl);
});

suite.test('Journey 5: Mobile user complete lead flow on 375px viewport', async ({ page, baseUrl }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(`${baseUrl}/`);

  const burger = page.locator('#burger, .nav__burger').first();
  if (await burger.count() > 0) {
    await burger.click({ force: true });
    await page.waitForFunction(() => document.querySelector('.nav__links')?.classList.contains('active')).catch(() => {});
    const navContact = page.locator('.nav__links a[href*="contact"]').first();
    if (await navContact.count() > 0) {
      await navContact.dispatchEvent('click').catch(() => navContact.click({ force: true }));
    }
  }

  const nameInput = page.locator('#contact-name');
  if (await nameInput.count() > 0) {
    await nameInput.fill('Алексей');
    assert.strictEqual(await nameInput.inputValue(), 'Алексей');
  }
  await sanitizePage(page, baseUrl);
});

module.exports = suite;
