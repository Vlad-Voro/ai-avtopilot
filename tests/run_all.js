#!/usr/bin/env node

/**
 * AI Avtopilot Landing Page - Master Test Suite Orchestrator
 *
 * Runs all 122 automated tests with maximum performance and zero flakiness:
 *   Phase 1 (In-Process Fast): SEO (20) + Security (14) + Resiliency (5) [< 0.35s]
 *   Phase 2 (Browser E2E): 14 Suites (78) + Lead Form Delivery (5) [~ 6-8s]
 *
 * Usage:
 *   node tests/run_all.js           # Run full suite (122 tests)
 *   node tests/run_all.js --fast    # Run only in-process tests (39 checks, < 0.35s)
 *   node tests/run_all.js --e2e     # Run only browser E2E tests (83 checks)
 */

const path = require('path');
const { chromium } = require('playwright');
const { createStaticServer } = require('./helpers/server');
const { runSeoSuite } = require('./seo/test_seo_audit');
const { runSecuritySuite } = require('./security/test_security_audit');
const { runResiliencySuite } = require('./resiliency/test_resiliency_jtbd');
const { runDeliveryTests } = require('./test_lead_delivery');

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
const runOnlyE2e = args.includes('--e2e');

const SUITE_PATHS = [
  './tier1_feature_coverage/test_r1_layout.js',
  './tier1_feature_coverage/test_r2_section_order.js',
  './tier1_feature_coverage/test_r3_contrast.js',
  './tier1_feature_coverage/test_r4_micro_interactions.js',
  './tier1_feature_coverage/test_r5_routing.js',
  './tier1_feature_coverage/test_r6_roi_sliders.js',
  './tier1_feature_coverage/test_r7_performance.js',
  './tier2_boundary_corner/test_responsive_viewports.js',
  './tier2_boundary_corner/test_slider_boundaries.js',
  './tier2_boundary_corner/test_rapid_clicks_navigation.js',
  './tier2_boundary_corner/test_invalid_routes_fallback.js',
  './tier2_boundary_corner/test_burger_rapid_toggle.js',
  './tier3_cross_feature/test_cross_interactions.js',
  './tier4_real_world_scenarios/test_user_journeys.js'
];

async function main() {
  const globalStart = Date.now();
  let totalTests = 0;
  let totalPassing = 0;
  let totalFailing = 0;

  console.log(`\n${C.bold}${C.cyan}╔════════════════════════════════════════════════════════════════════════╗${C.reset}`);
  console.log(`${C.bold}${C.cyan}║       AI AVTOPILOT - UNIFIED HIGH-PERFORMANCE TEST SUITE RUNNER        ║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╚════════════════════════════════════════════════════════════════════════╝${C.reset}\n`);

  // PHASE 1: Fast In-Process Suites
  if (!runOnlyE2e) {
    const p1Start = Date.now();
    console.log(`${C.bold}${C.blue}▶ PHASE 1: Fast In-Process Audit Suites (SEO + Security + Resiliency)${C.reset}\n`);

    const seoRes = runSeoSuite();
    totalTests += seoRes.totalChecks;
    totalPassing += seoRes.passedChecks;
    totalFailing += seoRes.failedChecks;

    const secRes = await runSecuritySuite();
    totalTests += secRes.totalChecks;
    totalPassing += secRes.passedChecks;
    totalFailing += secRes.failedChecks;

    const resRes = await runResiliencySuite();
    totalTests += resRes.totalChecks;
    totalPassing += resRes.passedChecks;
    totalFailing += resRes.failedChecks;

    const p1Duration = ((Date.now() - p1Start) / 1000).toFixed(2);
    console.log(`${C.green}✔ Phase 1 completed in ${p1Duration}s (39 checks)${C.reset}\n`);

    if (runOnlyFast) {
      printSummary(totalTests, totalPassing, totalFailing, globalStart);
      process.exit(totalFailing === 0 ? 0 : 1);
    }
  }

  // PHASE 2: Browser E2E Suites
  const p2Start = Date.now();
  console.log(`${C.bold}${C.blue}▶ PHASE 2: Playwright Browser E2E Suites (Headless Edge)${C.reset}\n`);

  const projectDir = path.resolve(__dirname, '..');
  const server = createStaticServer(projectDir);
  const { baseUrl, port } = await server.start();
  console.log(`${C.green}✔${C.reset} Ephemeral static server active on ${C.bold}${baseUrl}${C.reset} (port ${port})`);

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });
  console.log(`${C.green}✔${C.reset} Headless Edge browser pool active (${browser.version()})\n`);

  try {
    // 1. Run 14 standard E2E suites with controlled concurrency
    const queuedSuites = SUITE_PATHS.map(sp => {
      const mod = require(sp);
      return mod.default || mod;
    });

    const CONCURRENCY = Math.min(3, queuedSuites.length);
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

    // 2. Run Lead Form Delivery Suite within same browser/server pool
    console.log(`\n${C.bold}Running Lead Form Delivery Suite...${C.reset}`);
    const deliveryRes = await runDeliveryTests({ server, browser, baseUrl });
    totalTests += deliveryRes.totalChecks;
    totalPassing += deliveryRes.passedChecks;
    totalFailing += deliveryRes.failedChecks;

  } finally {
    await browser.close().catch(() => {});
    await server.stop().catch(() => {});
  }

  const p2Duration = ((Date.now() - p2Start) / 1000).toFixed(2);
  console.log(`\n${C.green}✔ Phase 2 completed in ${p2Duration}s (83 browser tests)${C.reset}\n`);

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
