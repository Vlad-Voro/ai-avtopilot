/**
 * Tier 1 - R2: Information Architecture & Block Sequence Optimization
 * Feature Milestone: M1
 */

const { createSuite, assert } = require('../helpers/test_framework');

const suite = createSuite('Tier 1 - R2: Section Ordering & Information Architecture', {
  tier: 1,
  milestone: 'M1',
  feature: 'R2'
});

suite.test('R2.1: DOM sections follow canonical conversion sequence', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const sectionIds = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('main > section, #main-content > section, section[id]'));
    return sections.map(s => s.id).filter(id => id);
  });

  const expectedSequence = ['home', 'dashboard', 'compare', 'services', 'cases', 'calculator', 'contact'];

  // Check that all expected sections exist
  for (const expected of expectedSequence) {
    assert.ok(
      sectionIds.includes(expected),
      `Section with id='${expected}' was not found in the DOM`
    );
  }

  // Filter sectionIds to only those in the expected list to test sequence order
  const filteredIds = sectionIds.filter(id => expectedSequence.includes(id));

  assert.deepStrictEqual(
    filteredIds,
    expectedSequence,
    `Section order mismatch. Expected: [${expectedSequence.join(' -> ')}], but found: [${filteredIds.join(' -> ')}]`
  );
});

suite.test('R2.2: Live Dashboard is positioned immediately after Hero section', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const dashboardPosition = await page.evaluate(() => {
    const hero = document.getElementById('home') || document.querySelector('.hero');
    const dashboard = document.getElementById('dashboard') || document.querySelector('.dashboard');
    const compare = document.getElementById('compare') || document.querySelector('.compare');

    if (!hero || !dashboard) return null;

    const heroIndex = Array.from(document.querySelectorAll('section')).indexOf(hero);
    const dashIndex = Array.from(document.querySelectorAll('section')).indexOf(dashboard);
    const compIndex = compare ? Array.from(document.querySelectorAll('section')).indexOf(compare) : -1;

    return {
      heroIndex,
      dashIndex,
      compIndex,
      isImmediatelyAfterHero: dashIndex === heroIndex + 1,
      isBeforeCompare: compIndex !== -1 && dashIndex < compIndex
    };
  });

  assert.ok(dashboardPosition, 'Hero or Dashboard section missing in DOM');
  assert.strictEqual(
    dashboardPosition.isImmediatelyAfterHero,
    true,
    `Dashboard (index ${dashboardPosition.dashIndex}) must immediately follow Hero (index ${dashboardPosition.heroIndex})`
  );
  assert.strictEqual(
    dashboardPosition.isBeforeCompare,
    true,
    `Dashboard must appear before Compare section in conversion chain`
  );
});

suite.test('R2.3: Header navigation includes links for key conversion stages', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const navHrefs = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('.nav__links a, .nav__link, .btn--nav'));
    return links.map(a => a.getAttribute('href'));
  });

  const normalize = href => (href || '').replace(/^[#/]+/, '');
  const normalizedTargets = navHrefs.map(normalize);

  assert.ok(normalizedTargets.includes('services'), 'Navigation must include Services target');
  assert.ok(normalizedTargets.includes('cases'), 'Navigation must include Cases target');
  assert.ok(normalizedTargets.includes('calculator'), 'Navigation must include Calculator target');
  assert.ok(normalizedTargets.includes('contact'), 'Navigation must include Contact target');
});

suite.test('R2.4: Semantic structure uses main, sections, and unique section IDs', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const structure = await page.evaluate(() => {
    const main = document.querySelector('main, #main-content');
    const sections = Array.from(document.querySelectorAll('section'));
    const ids = sections.map(s => s.id).filter(Boolean);
    const uniqueIds = new Set(ids);

    return {
      hasMain: !!main,
      sectionCount: sections.length,
      hasUniqueIds: uniqueIds.size === ids.length
    };
  });

  assert.ok(structure.hasMain, 'Page must contain semantic <main> landmark container');
  assert.ok(structure.sectionCount >= 7, `Expected at least 7 sections, found ${structure.sectionCount}`);
  assert.ok(structure.hasUniqueIds, 'All section IDs must be unique');
});

suite.test('R2.5: Footer navigation contains valid links matching site sections', async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);

  const footerLinks = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('footer a, .footer a'));
    return links.map(a => a.getAttribute('href')).filter(Boolean);
  });

  assert.ok(footerLinks.length >= 4, `Footer should contain at least 4 navigation links, found ${footerLinks.length}`);
  const hasContact = footerLinks.some(h => h.includes('contact'));
  const hasCalculator = footerLinks.some(h => h.includes('calculator'));
  assert.ok(hasContact, 'Footer must contain link to contact');
  assert.ok(hasCalculator, 'Footer must contain link to calculator');
});

module.exports = suite;
