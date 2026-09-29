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

suite.before(async ({ page, baseUrl }) => {
  await page.goto(`${baseUrl}/`);
});

suite.test('R2.1: DOM sections follow canonical conversion sequence', async ({ page }) => {
  const sectionIds = await page.evaluate(() => {
    const sections = Array.from(document.querySelectorAll('main > section, #main-content > section, section[id]'));
    return sections.map(s => s.id).filter(id => id);
  });

  const expectedSequence = ['home', 'calculator', 'compare', 'services', 'cases', 'faq', 'dashboard', 'contact'];

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

suite.test('R2.2: Calculator is positioned immediately after Hero section and Dashboard precedes Contact', async ({ page }) => {
  const positions = await page.evaluate(() => {
    const hero = document.getElementById('home') || document.querySelector('.hero');
    const calculator = document.getElementById('calculator') || document.querySelector('.roi');
    const compare = document.getElementById('compare') || document.querySelector('.compare');
    const dashboard = document.getElementById('dashboard') || document.querySelector('.dashboard');
    const contact = document.getElementById('contact') || document.querySelector('.contact');

    if (!hero || !calculator || !dashboard || !contact) return null;

    const sections = Array.from(document.querySelectorAll('section'));
    const heroIndex = sections.indexOf(hero);
    const calcIndex = sections.indexOf(calculator);
    const compIndex = compare ? sections.indexOf(compare) : -1;
    const dashIndex = sections.indexOf(dashboard);
    const contIndex = sections.indexOf(contact);

    return {
      heroIndex,
      calcIndex,
      compIndex,
      dashIndex,
      contIndex,
      isCalcImmediatelyAfterHero: calcIndex === heroIndex + 1,
      isCalcBeforeCompare: compIndex !== -1 && calcIndex < compIndex,
      isDashImmediatelyBeforeContact: dashIndex === contIndex - 1
    };
  });

  assert.ok(positions, 'Required sections missing in DOM');
  assert.strictEqual(
    positions.isCalcImmediatelyAfterHero,
    true,
    `Calculator (index ${positions.calcIndex}) must immediately follow Hero (index ${positions.heroIndex})`
  );
  assert.strictEqual(
    positions.isCalcBeforeCompare,
    true,
    `Calculator must appear before Compare section in conversion chain`
  );
  assert.strictEqual(
    positions.isDashImmediatelyBeforeContact,
    true,
    `Dashboard (index ${positions.dashIndex}) must immediately precede Contact (index ${positions.contIndex})`
  );
});

suite.test('R2.3: Header navigation includes links for key conversion stages', async ({ page }) => {
  const navHrefs = await page.evaluate(() => {
    const links = Array.from(document.querySelectorAll('.nav__links a, .nav__link, .btn--nav'));
    return links.map(a => a.getAttribute('href'));
  });

  const normalize = href => (href || '').replace(/^[#/]+|[#/]+$/g, '');
  const normalizedTargets = navHrefs.map(normalize);

  assert.ok(normalizedTargets.includes('services'), 'Navigation must include Services target');
  assert.ok(normalizedTargets.includes('cases'), 'Navigation must include Cases target');
  assert.ok(normalizedTargets.includes('calculator'), 'Navigation must include Calculator target');
  assert.ok(normalizedTargets.includes('contact'), 'Navigation must include Contact target');
});

suite.test('R2.4: Semantic structure uses main, sections, and unique section IDs', async ({ page }) => {
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

suite.test('R2.5: Footer navigation contains valid links matching site sections', async ({ page }) => {
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
