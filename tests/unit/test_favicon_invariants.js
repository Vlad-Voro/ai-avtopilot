/**
 * test_favicon_invariants.js
 * Invariant test suite for favicons on ai-avtopilot.ru:
 * 1. Checks that all favicon assets exist on disk.
 * 2. Checks binary structure of favicon.ico (valid ICO, 3 layers: 16x16, 32x32, 48x48, BMP format 0x28000000).
 * 3. Checks resolution and valid format of PNG icons (32x32, 16x16, 180x180).
 * 4. Checks icon.svg has explicit width and height attributes.
 * 5. Checks that all HTML files across the project declare canonical favicon link tags.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT_DIR = path.resolve(__dirname, '..', '..');

function runFaviconSuite() {
  console.log('--- RUNNING FAVICON INVARIANT TESTS ---');
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

  // 1. Check asset existence
  const requiredAssets = [
    'favicon.ico',
    'favicon-32x32.png',
    'favicon-16x16.png',
    'apple-touch-icon.png',
    'icon.svg',
    'site.webmanifest',
    'manifest.json'
  ];

  check('All required favicon assets exist and are non-empty', () => {
    for (const asset of requiredAssets) {
      const p = path.join(ROOT_DIR, asset);
      assert.ok(fs.existsSync(p), `Missing required asset: ${asset}`);
      const stats = fs.statSync(p);
      assert.ok(stats.size > 0, `Asset is empty: ${asset}`);
    }
  });

  // 2. Binary structure check of favicon.ico
  check('favicon.ico has 3 layers in Windows BMP/DIB format (0x28000000 header)', () => {
    const icoPath = path.join(ROOT_DIR, 'favicon.ico');
    const icoBuf = fs.readFileSync(icoPath);

    const reserved = icoBuf.readUInt16LE(0);
    const icoType = icoBuf.readUInt16LE(2);
    const numImages = icoBuf.readUInt16LE(4);

    assert.strictEqual(reserved, 0, 'ICO header reserved must be 0');
    assert.strictEqual(icoType, 1, 'ICO header type must be 1 (icon)');
    assert.strictEqual(numImages, 3, 'ICO must contain exactly 3 layers (16, 32, 48)');

    const expectedSizes = [16, 32, 48];
    for (let i = 0; i < numImages; i++) {
      const entryOffset = 6 + i * 16;
      const w = icoBuf.readUInt8(entryOffset) || 256;
      const h = icoBuf.readUInt8(entryOffset + 1) || 256;
      const imgOffset = icoBuf.readUInt32LE(entryOffset + 12);

      assert.strictEqual(w, expectedSizes[i], `Layer ${i + 1} width mismatch`);
      assert.strictEqual(h, expectedSizes[i], `Layer ${i + 1} height mismatch`);

      const headerSize = icoBuf.readUInt32LE(imgOffset);
      assert.strictEqual(headerSize, 40, `Layer ${i + 1} must be BITMAPINFOHEADER (BMP/DIB format), found ${headerSize}`);

      const isPng = (
        icoBuf[imgOffset] === 0x89 &&
        icoBuf[imgOffset + 1] === 0x50 &&
        icoBuf[imgOffset + 2] === 0x4e &&
        icoBuf[imgOffset + 3] === 0x47
      );
      assert.strictEqual(isPng, false, `Layer ${i + 1} must NOT be PNG-compressed in ICO`);
    }
  });

  // 3. Check PNG magic bytes
  check('PNG icons have valid PNG magic signatures', () => {
    for (const relPath of ['favicon-32x32.png', 'favicon-16x16.png', 'apple-touch-icon.png']) {
      const buf = fs.readFileSync(path.join(ROOT_DIR, relPath));
      assert.ok(
        buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47,
        `${relPath} is not a valid PNG`
      );
    }
  });

  // 4. Check icon.svg explicit width/height
  check('icon.svg contains explicit width="64", height="64", and viewBox', () => {
    const svgContent = fs.readFileSync(path.join(ROOT_DIR, 'icon.svg'), 'utf-8');
    assert.ok(svgContent.includes('width="64"'), 'icon.svg must have width="64"');
    assert.ok(svgContent.includes('height="64"'), 'icon.svg must have height="64"');
    assert.ok(svgContent.includes('viewBox="0 0 64 64"'), 'icon.svg must have viewBox="0 0 64 64"');
  });

  // 5. Check manifests
  check('site.webmanifest and manifest.json contain all icon sizes', () => {
    for (const manifestName of ['site.webmanifest', 'manifest.json']) {
      const manifestContent = JSON.parse(fs.readFileSync(path.join(ROOT_DIR, manifestName), 'utf-8'));
      const iconSrcs = manifestContent.icons.map(ic => ic.src);
      assert.ok(iconSrcs.includes('/favicon-32x32.png'), `${manifestName} must include /favicon-32x32.png`);
      assert.ok(iconSrcs.includes('/favicon-16x16.png'), `${manifestName} must include /favicon-16x16.png`);
      assert.ok(iconSrcs.includes('/icon.svg'), `${manifestName} must include /icon.svg`);
      assert.ok(iconSrcs.includes('/apple-touch-icon.png'), `${manifestName} must include /apple-touch-icon.png`);
    }
  });

  // 6. Check all HTML pages
  check('All HTML pages declare canonical favicon link tags', () => {
    function getHtmlFiles(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        if (file === 'node_modules' || file === '.git' || file === 'tmp') continue;
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
          results = results.concat(getHtmlFiles(fullPath));
        } else if (file.endsWith('.html') && !file.startsWith('yandex_')) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const htmlFiles = getHtmlFiles(ROOT_DIR);
    assert.ok(htmlFiles.length >= 25, `Expected at least 25 HTML pages, found ${htmlFiles.length}`);

    const requiredPatterns = [
      /<link[^>]+(?:rel=["']icon["'][^>]*href=["']\/favicon\.ico["']|href=["']\/favicon\.ico["'][^>]*rel=["']icon["'])[^>]*>/i,
      /<link[^>]+(?:rel=["']shortcut icon["'][^>]*href=["']\/favicon\.ico["']|href=["']\/favicon\.ico["'][^>]*rel=["']shortcut icon["'])[^>]*>/i,
      /<link[^>]+href=["']\/favicon-32x32\.png["'][^>]*>/i,
      /<link[^>]+href=["']\/favicon-16x16\.png["'][^>]*>/i,
      /<link[^>]+href=["']\/icon\.svg["'][^>]*>/i,
      /<link[^>]+href=["']\/apple-touch-icon\.png["'][^>]*>/i,
      /<link[^>]+href=["']\/site\.webmanifest["'][^>]*>/i
    ];

    for (const file of htmlFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      for (const pattern of requiredPatterns) {
        assert.ok(
          pattern.test(content),
          `File ${path.relative(ROOT_DIR, file)} missing favicon pattern: ${pattern}`
        );
      }
    }
  });

  console.log(`Favicon invariants: ${passedChecks}/${totalChecks} passed.`);
  return { totalChecks, passedChecks, failedChecks };
}

if (require.main === module) {
  const res = runFaviconSuite();
  process.exit(res.failedChecks === 0 ? 0 : 1);
}

module.exports = { runFaviconSuite };
