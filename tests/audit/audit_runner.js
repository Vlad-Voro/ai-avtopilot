#!/usr/bin/env node

/**
 * Master Playwright Layout & Typography Audit Runner.
 * Executes full site audit across 24 pages and 18 canonical device profiles.
 *
 * Usage:
 *   node tests/audit/audit_runner.js          # Full scan (24 pages x 18 devices = 432 checks)
 *   node tests/audit/audit_runner.js --quick  # Smoke scan (4 pages x 5 devices = 20 checks)
 */

const path = require('path');
const { chromium } = require('playwright');
const { createStaticServer } = require('../helpers/server');
const { DEVICES, ALL_PAGES } = require('./config_devices');
const { runInBrowserAudit } = require('./audit_probe');
const { generateReports } = require('./audit_reporter');

// ANSI Colors
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const isQuick = process.argv.includes('--quick');

async function runWorker(browser, baseUrl, pagesQueue, devicesToTest) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  page.setDefaultTimeout(8000);

  // Disable smooth scroll for instant measurements
  await page.addInitScript(() => {
    try {
      const style = document.createElement('style');
      style.textContent = '* { scroll-behavior: auto !important; }';
      if (document.head) document.head.appendChild(style);
      else document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
    } catch (e) {}
  });

  const workerResults = [];

  while (pagesQueue.length > 0) {
    const pageSpec = pagesQueue.shift();
    if (!pageSpec) break;

    const pageUrl = `${baseUrl}${pageSpec.path}`;
    const pageResult = {
      path: pageSpec.path,
      name: pageSpec.name,
      category: pageSpec.category,
      devices: []
    };

    try {
      await page.goto(pageUrl, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(60); // brief settling time

      for (const dev of devicesToTest) {
        await page.setViewportSize({ width: dev.width, height: dev.height });
        // Evaluate probe directly
        const probeResult = await page.evaluate(runInBrowserAudit, dev);
        pageResult.devices.push(probeResult);
      }
    } catch (err) {
      console.error(`${C.red}Failed scanning ${pageSpec.path}: ${err.message}${C.reset}`);
      pageResult.error = err.message;
    }

    workerResults.push(pageResult);
  }

  await context.close();
  return workerResults;
}

async function main() {
  const startTime = Date.now();
  const rootDir = path.resolve(__dirname, '../..');
  const server = createStaticServer(rootDir);

  console.log(`\n${C.bold}${C.cyan}========================================================================${C.reset}`);
  console.log(`${C.bold}${C.cyan}   AI AVTOPILOT - PLAYWRIGHT LAYOUT & TYPOGRAPHY AUDIT${C.reset}`);
  console.log(`${C.bold}${C.cyan}========================================================================${C.reset}`);

  const { baseUrl, port } = await server.start();
  console.log(`${C.green}✔${C.reset} Ephemeral HTTP Server on ${C.bold}${baseUrl}${C.reset} (port ${port})`);

  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
  } catch (e) {
    browser = await chromium.launch({ headless: true });
  }
  console.log(`${C.green}✔${C.reset} Chromium engine launched (${browser.version()})`);

  // Target pages and devices
  let pagesToTest = [...ALL_PAGES];
  let devicesToTest = [...DEVICES];

  if (isQuick) {
    console.log(`${C.yellow}⚡ Quick Mode active: 4 pages × 5 edge devices${C.reset}`);
    pagesToTest = [
      ALL_PAGES.find(p => p.path === '/') || ALL_PAGES[0],
      ALL_PAGES.find(p => p.path === '/services/') || ALL_PAGES[1],
      ALL_PAGES.find(p => p.path === '/services/speech-analytics/') || ALL_PAGES[7],
      ALL_PAGES.find(p => p.path === '/cases/retail-inventory-automation/') || ALL_PAGES[15]
    ];
    devicesToTest = DEVICES.filter(d => ['D01-fold-cover', 'D02-mobile-320', 'D06-bp-480', 'D08-bp-768', 'D13-bp-1025'].includes(d.id));
  }

  const totalChecks = pagesToTest.length * devicesToTest.length;
  console.log(`${C.dim}Auditing ${pagesToTest.length} pages across ${devicesToTest.length} devices (${totalChecks} total checks)...${C.reset}\n`);

  const NUM_WORKERS = Math.min(4, pagesToTest.length);
  const queue = [...pagesToTest];
  const workerPromises = [];

  for (let i = 0; i < NUM_WORKERS; i++) {
    workerPromises.push(runWorker(browser, baseUrl, queue, devicesToTest));
  }

  const resultsNested = await Promise.all(workerPromises);
  const allResults = resultsNested.flat();

  await browser.close();
  await server.stop();

  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);

  // Generate Reports
  const outputDir = path.join(rootDir, 'tmp');
  const report = generateReports(allResults, outputDir);

  console.log(`${C.bold}${C.cyan}------------------------------------------------------------------------${C.reset}`);
  console.log(`${C.bold}AUDIT COMPLETED in ${durationSec}s${C.reset}`);
  console.log(`Total Checks: ${report.stats.totalChecks} | Pass Rate: ${C.bold}${report.stats.passRate}${C.reset}`);
  console.log(`P0 Blocker: ${report.stats.p0Count > 0 ? C.red : C.green}${report.stats.p0Count}${C.reset} | P1 Critical: ${report.stats.p1Count > 0 ? C.yellow : C.green}${report.stats.p1Count}${C.reset} | P2 Major: ${report.stats.p2Count > 0 ? C.yellow : C.green}${report.stats.p2Count}${C.reset}`);
  console.log(`\nHTML Report:     ${C.cyan}${report.htmlPath}${C.reset}`);
  console.log(`Markdown Report: ${C.cyan}${report.mdPath}${C.reset}`);
  console.log(`JSON Report:     ${C.cyan}${report.jsonPath}${C.reset}\n`);

  if (report.stats.p0Count > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error(`Fatal audit error:`, err);
  process.exit(1);
});
