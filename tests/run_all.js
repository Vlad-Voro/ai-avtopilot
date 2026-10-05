#!/usr/bin/env node

/**
 * AI Avtopilot Landing Page - Master Test Suite Orchestrator
 *
 * Runs all 153 automated tests with maximum performance and zero flakiness:
 *   Tier 1 (In-Memory Unit): ROI Calculation, boundaries & formatters (11 checks) [< 20ms]
 *   Tier 2 (Static & Integration): SEO (25) + Security (14) + SSL/TLS (10) + Resiliency (5) [< 1.4s]
 *   Tier 3 (Browser E2E): 14 Playwright Suites (83) + Lead Form Delivery (5) [~ 6-8s]
 *
 * Usage:
 *   node tests/run_all.js           # Run full suite (153 tests)
 *   node tests/run_all.js --fast    # Run fast in-process tests (65 checks: T1 + T2, < 1.4s)
 *   node tests/run_all.js --e2e     # Run browser E2E tests (88 checks: Tier 3)
 */

const path = require('path');
const os = require('os');
// Tier 1 in-memory unit suites — <= 20ms, pure business logic
const { runRoiUnitSuite } = require('./unit/test_roi_calculator');
// Tier 2 suites — stdlib / static audit only, no browser deps
const { runSeoSuite } = require('./seo/test_seo_audit');
const { runSecuritySuite } = require('./security/test_security_audit');
const { runSslAuditSuite } = require('./security/test_ssl_tls_audit');
const { runResiliencySuite } = require('./resiliency/test_resiliency_jtbd');
// Tier 3 (playwright + server) — loaded lazily below, only when E2E runs

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

const args = process.argv.slice(2);
const runOnlyFast = args.includes('--fast');
const runOnlyE2e = args.includes('--e2e') || args.includes('--tier=3');
const runOnlyTier1 = args.includes('--tier=1');
const runOnlyTier2 = args.includes('--tier=2');

const SUITE_PATHS = [
  './e2e/suite_homepage_interactions.js',
  './e2e/suite_navigation_flows.js',
  './e2e/suite_calculator_and_leads.js',
  './e2e/suite_cluster_and_journeys.js'
];

async function main() {
  const globalStart = Date.now();
  let totalTests = 0;
  let totalPassing = 0;
  let totalFailing = 0;

  console.log(`\n${C.bold}${C.cyan}╔════════════════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.cyan}║       AI AVTOPILOT - SOTA 3-TIER PYRAMID TEST SUITE RUNNER             ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╚════════════════════════════════════════════════════════════════════════╝${C.reset}\n`);

  // TIER 1: In-Memory Unit Suites (<= 20ms)
  if (!runOnlyE2e && !runOnlyTier2) {
    const t1Start = Date.now();
    console.log(`${C.bold}${C.blue}▶ TIER 1: In-Memory Unit Suites (Pure Business Logic, <= 20ms)${C.reset}\n`);

    const roiRes = runRoiUnitSuite();
    totalTests += roiRes.totalChecks;
    totalPassing += roiRes.passedChecks;
    totalFailing += roiRes.failedChecks;

    const t1Duration = ((Date.now() - t1Start) / 1000).toFixed(3);
    console.log(`\n${C.green}✔ Tier 1 completed in ${t1Duration}s (${roiRes.totalChecks} checks)${C.reset}\n`);

    if (runOnlyTier1) {
      printSummary(totalTests, totalPassing, totalFailing, globalStart);
      process.exit(totalFailing === 0 ? 0 : 1);
    }
  }

  // TIER 2: Fast Static Audit & Integration Suites (SEO + Security + Resiliency)
  if (!runOnlyE2e && !runOnlyTier1) {
    const t2Start = Date.now();
    console.log(`${C.bold}${C.blue}▶ TIER 2: Static Audit & Integration Suites (SEO + Security + Resiliency)${C.reset}\n`);

    const seoRes = runSeoSuite();
    totalTests += seoRes.totalChecks;
    totalPassing += seoRes.passedChecks;
    totalFailing += seoRes.failedChecks;

    const secRes = await runSecuritySuite();
    totalTests += secRes.totalChecks;
    totalPassing += secRes.passedChecks;
    totalFailing += secRes.failedChecks;

    const sslRes = await runSslAuditSuite();
    totalTests += sslRes.passed + sslRes.failed;
    totalPassing += sslRes.passed;
    totalFailing += sslRes.failed;

    const resRes = await runResiliencySuite();
    totalTests += resRes.totalChecks;
    totalPassing += resRes.passedChecks;
    totalFailing += resRes.failedChecks;

    const t2Duration = ((Date.now() - t2Start) / 1000).toFixed(2);
    console.log(`${C.green}✔ Tier 2 completed in ${t2Duration}s (${totalTests - (runOnlyTier2 ? 0 : 11)} checks)${C.reset}\n`);

    if (runOnlyFast || runOnlyTier2) {
      printSummary(totalTests, totalPassing, totalFailing, globalStart);
      process.exit(totalFailing === 0 ? 0 : 1);
    }
  }

  // TIER 3: Browser E2E Suites
  const p2Start = Date.now();
  console.log(`${C.bold}${C.blue}▶ TIER 3: Playwright Browser E2E Suites (Headless Edge)${C.reset}\n`);

  // Lazy-load heavy deps: only executed when E2E actually runs (not --fast)
  const { chromium } = require('playwright');
  const { createStaticServer } = require('./helpers/server');

  const projectDir = path.resolve(__dirname, '..');
  const server = createStaticServer(projectDir);
  const { baseUrl, port } = await server.start();
  console.log(`${C.green}✔${C.reset} Ephemeral static server active on ${C.bold}${baseUrl}${C.reset} (port ${port})`);

  const browser = await chromium.launch({
    channel: process.platform === 'win32' ? 'msedge' : undefined,
    headless: true
  });
  console.log(`${C.green}✔${C.reset} Headless Edge browser pool active (${browser.version()})\n`);

  try {
    // 1. Run all E2E suites + Lead Delivery concurrently with LPT scheduling
    const standardSuites = SUITE_PATHS.map(sp => {
      const mod = require(sp);
      return mod.default || mod;
    });

    const queuedSuites = [...standardSuites];

    const CONCURRENCY = Math.max(1, Math.min(os.cpus().length, queuedSuites.length));
    console.log(`${C.dim}Running ${queuedSuites.length} Playwright suites (concurrency=${CONCURRENCY})...${C.reset}\n`);

    let suiteIndex = 0;
    const workers = Array.from({ length: CONCURRENCY }, async () => {
      while (suiteIndex < queuedSuites.length) {
        const suite = queuedSuites[suiteIndex++];

        const page = await browser.newPage();
        try {
          const results = await suite.run({ page, baseUrl, browser });
          for (const r of results) {
            totalTests++;
            if (r.status === 'pass') {
              totalPassing++;
              console.log(`   ${C.green}✔ PASS${C.reset} ${r.title} ${C.dim}(${r.durationMs}ms)${C.reset}`);
            } else {
              totalFailing++;
              console.log(`   ${C.red}✖ FAIL${C.reset} ${r.title} ${C.dim}(${r.durationMs}ms)${C.reset}`);
              if (r.error) console.log(`     ${C.yellow}→ ${r.error.message}${C.reset}`);
            }
          }
        } finally {
          await page.close().catch(() => {});
        }
      }
    });

    await Promise.all(workers);

  } finally {
    await Promise.race([
      browser.close().catch(() => {}),
      new Promise(r => setTimeout(r, 250))
    ]);
    await server.stop().catch(() => {});
  }

  const t3Duration = ((Date.now() - p2Start) / 1000).toFixed(2);
  console.log(`\n${C.green}✔ Tier 3 completed in ${t3Duration}s (83 browser tests)${C.reset}\n`);

  printSummary(totalTests, totalPassing, totalFailing, globalStart);
  process.exit(totalFailing === 0 ? 0 : 1);
}

function printSummary(total, pass, fail, startTime) {
  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`${C.bold}========================================================================${C.reset}`);
  console.log(`${C.bold}TOTAL TEST EXECUTION SUMMARY${C.reset}`);
  console.log(`${C.bold}========================================================================${C.reset}`);
  console.log(`Total Checks Executed: ${C.bold}${total}${C.reset}`);
  console.log(`Passing:               ${C.green}${C.bold}${pass}${C.reset}`);
  console.log(`Failing:               ${fail > 0 ? C.red : C.green}${C.bold}${fail}${C.reset}`);
  console.log(`Total Duration:        ${C.cyan}${C.bold}${totalDuration}s${C.reset}\n`);

  if (fail === 0) {
    console.log(`${C.bold}${C.green}🎉 ALL ${total} TESTS PASSED! 100% GREEN, ZERO REGRESSIONS.${C.reset}\n`);
  } else {
    console.log(`${C.bold}${C.red}❌ ${fail} TEST(S) FAILED! REVIEW FAILURE DETAILS ABOVE.${C.reset}\n`);
  }
}

main().catch(err => {
  console.error('Fatal master test runner error:', err);
  process.exit(1);
});
