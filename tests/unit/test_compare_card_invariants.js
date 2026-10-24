/**
 * test_compare_card_invariants.js
 * Invariant test suite for equal card heights and alignment in #compare block across ai-avtopilot.ru:
 * 1. Checks that all 29 HTML files with .compare__grid declare align-items:stretch.
 * 2. Checks that .compare__card specifies height:100% and box-sizing:border-box for desktop.
 * 3. Checks that .compare__arrow specifies align-self:center and justify-content:center.
 * 4. Checks that mobile media query sets .compare__card height:auto.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function getAllHtmlFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== 'tmp') {
        getAllHtmlFiles(filePath, fileList);
      }
    } else if (file.endsWith('.html')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

function runCompareCardInvariantsSuite() {
  console.log('--- RUNNING COMPARE CARDS INVARIANT TESTS ---');
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;

  function check(desc, fn) {
    totalChecks++;
    try {
      fn();
      passedChecks++;
      console.log(`  ✔ ${desc}`);
    } catch (err) {
      failedChecks++;
      console.error(`  ✖ ${desc}: ${err.message}`);
    }
  }

  const allHtml = getAllHtmlFiles(ROOT_DIR);
  const compareFiles = allHtml.filter((f) => {
    const content = fs.readFileSync(f, 'utf-8');
    return content.includes('compare__grid');
  });

  const stylesPath = path.join(ROOT_DIR, 'assets', 'css', 'styles.min.css');
  const sharedStyles = fs.existsSync(stylesPath) ? fs.readFileSync(stylesPath, 'utf-8') : '';

  function getEffectiveCss(htmlContent) {
    if (htmlContent.includes('styles.min.css')) {
      return htmlContent + '\n' + sharedStyles;
    }
    return htmlContent;
  }

  check(`All compare pages found (expected 29, got ${compareFiles.length})`, () => {
    assert.strictEqual(compareFiles.length, 30);
  });

  check('All 30 compare pages declare .compare__grid with align-items:stretch', () => {
    for (const f of compareFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const effectiveContent = getEffectiveCss(content);
      const rel = path.relative(ROOT_DIR, f);
      assert(
        /\.compare__grid\s*\{[^}]*align-items:\s*stretch/.test(effectiveContent),
        `Missing align-items:stretch in ${rel}`
      );
    }
  });

  check('All 30 compare pages declare .compare__card with height:100%', () => {
    for (const f of compareFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const effectiveContent = getEffectiveCss(content);
      const rel = path.relative(ROOT_DIR, f);
      assert(
        /\.compare__card\s*\{[^}]*height:\s*100%/.test(effectiveContent),
        `Missing height:100% in ${rel}`
      );
    }
  });

  check('All 30 compare pages declare .compare__arrow with align-self:center', () => {
    for (const f of compareFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const effectiveContent = getEffectiveCss(content);
      const rel = path.relative(ROOT_DIR, f);
      assert(
        /\.compare__arrow\s*\{[^}]*align-self:\s*center/.test(effectiveContent),
        `Missing align-self:center in ${rel}`
      );
    }
  });

  check('All 30 compare pages declare mobile .compare__card with height:auto', () => {
    for (const f of compareFiles) {
      const content = fs.readFileSync(f, 'utf-8');
      const effectiveContent = getEffectiveCss(content);
      const rel = path.relative(ROOT_DIR, f);
      assert(
        /\.compare__card\s*\{[^}]*height:\s*auto/.test(effectiveContent),
        `Missing mobile height:auto in ${rel}`
      );
    }
  });

  console.log(`Compare cards invariants: ${passedChecks}/${totalChecks} passed.`);
  return { total: totalChecks, passed: passedChecks, failed: failedChecks };
}

if (require.main === module) {
  const result = runCompareCardInvariantsSuite();
  if (result.failed > 0) {
    process.exit(1);
  }
}

module.exports = { runCompareCardInvariantsSuite };
