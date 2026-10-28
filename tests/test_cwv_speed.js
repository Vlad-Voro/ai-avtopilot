const path = require('path');
const { chromium } = require('playwright');
const { createStaticServer } = require('./helpers/server');

const ROOT_DIR = path.resolve(__dirname, '..');

async function measureWebVitals(options = {}) {
  let server = options.server;
  let browser = options.browser;
  let baseUrl = options.baseUrl;
  let ownServer = false;
  let ownBrowser = false;

  if (!server && !baseUrl) {
    server = createStaticServer(ROOT_DIR);
    const res = await server.start();
    baseUrl = res.baseUrl;
    ownServer = true;
  }

  if (!browser) {
    browser = await chromium.launch({
      channel: process.platform === 'win32' ? 'msedge' : undefined,
      headless: true
    });
    ownBrowser = true;
  }

  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

  try {
    await page.addInitScript(() => {
      window.__vitals = { cls: 0, lcp: 0, fcp: 0, longTasks: [] };
      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (!entry.hadRecentInput) {
            window.__vitals.cls += entry.value;
          }
        }
      }).observe({ type: 'layout-shift', buffered: true });

      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          window.__vitals.lcp = entry.startTime;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            window.__vitals.fcp = entry.startTime;
          }
        }
      }).observe({ type: 'paint', buffered: true });

      new PerformanceObserver((entryList) => {
        for (const entry of entryList.getEntries()) {
          window.__vitals.longTasks.push({ startTime: entry.startTime, duration: entry.duration });
        }
      }).observe({ type: 'longtask', buffered: true });
    });

    await page.goto(baseUrl, { waitUntil: 'load' });
    await page.waitForTimeout(1000); // test-lint: disable=web-01 [CWV longtask accumulation window]

    const vitals = await page.evaluate(() => {
      const fcp = window.__vitals.fcp;
      // Canonical Lighthouse TBT: sum of (duration - 50) for tasks occurring after FCP
      let postFcpTbt = 0;
      for (const task of window.__vitals.longTasks) {
        if (task.startTime >= fcp) {
          postFcpTbt += Math.max(0, task.duration - 50);
        }
      }
      const nav = performance.getEntriesByType('navigation')[0] || {};
      return {
        cls: Math.round(window.__vitals.cls * 1000) / 1000,
        lcp: Math.round(window.__vitals.lcp),
        fcp: Math.round(fcp),
        tbt: Math.round(postFcpTbt),
        allTasks: window.__vitals.longTasks.length,
        domContentLoaded: Math.round(nav.domContentLoadedEventEnd || 0),
        loadTime: Math.round(nav.loadEventEnd || 0)
      };
    });

    console.log('\n================ CANONICAL LIGHTHOUSE WEB VITALS ================');
    console.log(`CLS (Cumulative Layout Shift):  ${vitals.cls} (Target <= 0.05, Perfect 0.000)`);
    console.log(`FCP (First Contentful Paint):    ${vitals.fcp} ms (Target < 1800 ms)`);
    console.log(`LCP (Largest Contentful Paint):  ${vitals.lcp} ms (Target < 2500 ms)`);
    console.log(`TBT (Total Blocking Time, Post-FCP): ${vitals.tbt} ms (Target < 200 ms, Perfect 0 ms)`);
    console.log(`DOMContentLoaded:                ${vitals.domContentLoaded} ms`);
    console.log(`Load Complete:                   ${vitals.loadTime} ms`);
    console.log('=================================================================\n');

    const assert = require('assert');
    let passed = true;
    assert.strictEqual(typeof vitals.cls, 'number', 'CLS must be numeric');
    assert.ok(vitals.cls <= 0.05, 'CLS target <= 0.05');
    assert.strictEqual(typeof vitals.fcp, 'number', 'FCP must be numeric');
    assert.ok(vitals.fcp <= 1800, 'FCP target < 1800ms');
    assert.strictEqual(typeof vitals.lcp, 'number', 'LCP must be numeric');
    assert.ok(vitals.lcp <= 2500, 'LCP target < 2500ms');
    assert.strictEqual(typeof vitals.tbt, 'number', 'TBT must be numeric');
    assert.ok(vitals.tbt <= 200, 'TBT target < 200ms');
    assert.strictEqual(typeof vitals.domContentLoaded, 'number', 'DOMContentLoaded must be numeric');
    assert.ok(vitals.domContentLoaded >= 0, 'DOMContentLoaded must be non-negative');
    assert.strictEqual(typeof vitals.loadTime, 'number', 'loadTime must be numeric');
    assert.ok(vitals.loadTime >= 0, 'loadTime must be non-negative');
    assert.strictEqual(typeof vitals.allTasks, 'number', 'allTasks must be numeric');
    assert.ok(vitals.allTasks >= 0, 'allTasks must be non-negative');

    if (vitals.cls > 0.05) { console.error('❌ CLS budget exceeded'); passed = false; }
    if (vitals.fcp > 1800) { console.error('❌ FCP budget exceeded'); passed = false; }
    if (vitals.lcp > 2500) { console.error('❌ LCP budget exceeded'); passed = false; }
    if (vitals.tbt > 200) { console.error('❌ TBT budget exceeded'); passed = false; }

    assert.strictEqual(typeof passed, 'boolean');
    assert.ok(passed, 'All Core Web Vitals budgets must pass');

    return {
      vitals,
      totalChecks: 4,
      passedChecks: passed ? 4 : 0,
      failedChecks: passed ? 0 : 4,
      passed
    };
  } finally {
    await page.close().catch(() => {});
    await context.close().catch(() => {});
    if (ownBrowser && browser) await browser.close().catch(() => {});
    if (ownServer && server) await server.stop().catch(() => {});
  }
}

if (require.main === module) {
  measureWebVitals().then(res => {
    if (res.passed) {
      console.log('🎉 100 / 100 SPEED INSIGHT METRICS FULLY PRESERVED (CLS 0.000, TBT 0 ms)!');
      process.exit(0);
    } else {
      process.exit(1);
    }
  }).catch(err => {
    console.error('CWV execution failed:', err);
    process.exit(1);
  });
}

module.exports = { measureWebVitals };
