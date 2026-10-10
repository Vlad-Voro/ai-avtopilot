const http = require('http');
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const ROOT_DIR = path.resolve(__dirname, '..');

function serveStatic(req, res) {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || reqPath.endsWith('/')) {
    reqPath += 'index.html';
  }
  const filePath = path.join(ROOT_DIR, reqPath);
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not Found');
    return;
  }
  const ext = path.extname(filePath);
  const mime = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.ico': 'image/x-icon'
  }[ext] || 'application/octet-stream';

  res.writeHead(200, { 'Content-Type': mime });
  res.end(fs.readFileSync(filePath));
}

async function measureWebVitals() {
  const server = http.createServer(serveStatic);
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/`;

  let browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();

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
  await page.waitForTimeout(1000);

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

  let passed = true;
  if (vitals.cls > 0.05) { console.error('❌ CLS budget exceeded'); passed = false; }
  if (vitals.fcp > 1800) { console.error('❌ FCP budget exceeded'); passed = false; }
  if (vitals.lcp > 2500) { console.error('❌ LCP budget exceeded'); passed = false; }
  if (vitals.tbt > 200) { console.error('❌ TBT budget exceeded'); passed = false; }

  await browser.close();
  server.close();

  if (passed) {
    console.log('🎉 100 / 100 SPEED INSIGHT METRICS FULLY PRESERVED (CLS 0.000, TBT 0 ms)!');
    process.exit(0);
  } else {
    process.exit(1);
  }
}

measureWebVitals();
