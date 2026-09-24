#!/usr/bin/env node

/**
 * AI Avtopilot Landing Page - Master E2E Test Suite Runner
 *
 * Runs comprehensive 4-tier Playwright tests using headless Microsoft Edge.
 * Serves static site on an ephemeral local port with zero external dependencies.
 *
 * Usage:
 *   node tests/run_e2e_tests.js
 *   node tests/run_e2e_tests.js --tier=1
 *   node tests/run_e2e_tests.js --milestone=M1
 *   node tests/run_e2e_tests.js --grep="Hero"
 */

const path = require('path');
const { chromium } = require('playwright');
const { createStaticServer } = require('./helpers/server');

// ANSI Color Helpers
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Parse command-line arguments
const args = process.argv.slice(2);
let filterTier = null;
let filterMilestone = null;
let filterGrep = null;

for (const arg of args) {
  if (arg.startsWith('--tier=')) {
    filterTier = parseInt(arg.split('=')[1], 10);
  } else if (arg.startsWith('--milestone=')) {
    filterMilestone = arg.split('=')[1].toUpperCase();
  } else if (arg.startsWith('--grep=')) {
    filterGrep = new RegExp(arg.split('=')[1], 'i');
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Usage: node tests/run_e2e_tests.js [options]

Options:
  --tier=N         Run only tests for Tier N (1, 2, 3, or 4)
  --milestone=MX   Run only tests for Milestone MX (M1, M2, M3, M4)
  --grep=pattern   Run only tests matching regular expression pattern
  --help, -h       Show this help message
`);
    process.exit(0);
  }
}

// Suite registry
const SUITE_PATHS = [
  // Tier 1: Feature Coverage (R1 to R7)
  './tier1_feature_coverage/test_r1_layout.js',
  './tier1_feature_coverage/test_r2_section_order.js',
  './tier1_feature_coverage/test_r3_contrast.js',
  './tier1_feature_coverage/test_r4_micro_interactions.js',
  './tier1_feature_coverage/test_r5_routing.js',
  './tier1_feature_coverage/test_r6_roi_sliders.js',
  './tier1_feature_coverage/test_r7_performance.js',

  // Tier 2: Boundary & Corner Cases
  './tier2_boundary_corner/test_responsive_viewports.js',
  './tier2_boundary_corner/test_slider_boundaries.js',
  './tier2_boundary_corner/test_rapid_clicks_navigation.js',
  './tier2_boundary_corner/test_invalid_routes_fallback.js',
  './tier2_boundary_corner/test_burger_rapid_toggle.js',

  // Tier 3: Cross-Feature Interactions
  './tier3_cross_feature/test_cross_interactions.js',

  // Tier 4: Real-World Workload Scenarios
  './tier4_real_world_scenarios/test_user_journeys.js'
];

async function main() {
  const projectDir = path.resolve(__dirname, '..');
  const server = createStaticServer(projectDir);

  console.log(`\n${C.bold}${C.cyan}========================================================================${C.reset}`);
  console.log(`${C.bold}${C.cyan}    AI AVTOPILOT - E2E COMPREHENSIVE TEST SUITE RUNNER${C.reset}`);
  console.log(`${C.bold}${C.cyan}========================================================================${C.reset}`);

  console.log(`${C.dim}Starting ephemeral static test server...${C.reset}`);
  const { baseUrl, port } = await server.start();
  console.log(`${C.green}✔${C.reset} Server active on ${C.bold}${baseUrl}${C.reset} (port ${port})`);

  console.log(`${C.dim}Launching Playwright Chromium (msedge channel)...${C.reset}`);
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });
  console.log(`${C.green}✔${C.reset} Headless Edge browser launched (${browser.version()})\n`);

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: 'ru-RU',
    timezoneId: 'Europe/Moscow'
  });

  const page = await context.newPage();

  // Test execution state
  const testResults = [];
  const startTime = Date.now();

  try {
    for (const suiteRelPath of SUITE_PATHS) {
      const suiteModule = require(suiteRelPath);
      const suite = suiteModule.default || suiteModule;

      if (filterTier && suite.metadata.tier !== filterTier) continue;
      if (filterMilestone && suite.metadata.milestone !== filterMilestone) continue;

      console.log(`${C.bold}${C.blue}▶ [Tier ${suite.metadata.tier || 1}] ${suite.name}${C.reset} ${C.dim}(${suite.metadata.milestone || 'General'})${C.reset}`);

      const results = await suite.run({
        browser,
        context,
        page,
        baseUrl
      });

      for (const res of results) {
        if (filterGrep && !filterGrep.test(res.title)) continue;

        testResults.push(res);

        if (res.status === 'pass') {
          console.log(`   ${C.green}✔ PASS${C.reset} ${res.title} ${C.dim}(${res.durationMs}ms)${C.reset}`);
        } else {
          console.log(`   ${C.red}✖ FAIL${C.reset} ${res.title} ${C.dim}(${res.durationMs}ms)${C.reset}`);
          const msg = res.error ? (res.error.message || String(res.error)).split('\n')[0] : 'Unknown error';
          console.log(`     ${C.dim}→ ${msg}${C.reset}`);
        }
      }
      console.log('');
    }
  } finally {
    await browser.close();
    await server.stop();
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  const passed = testResults.filter(r => r.status === 'pass').length;
  const failed = testResults.filter(r => r.status === 'fail').length;
  const total = testResults.length;

  console.log(`${C.bold}${C.cyan}========================================================================${C.reset}`);
  console.log(`${C.bold}TEST RUN SUMMARY${C.reset}`);
  console.log(`${C.bold}${C.cyan}========================================================================${C.reset}`);
  console.log(`Total Tests Executed: ${C.bold}${total}${C.reset}`);
  console.log(`Passing:              ${C.green}${C.bold}${passed}${C.reset}`);
  console.log(`Failing:              ${failed > 0 ? C.red : C.green}${C.bold}${failed}${C.reset}`);
  console.log(`Total Duration:       ${totalTime}s\n`);

  // Failure categorization by Milestone
  if (failed > 0) {
    console.log(`${C.bold}${C.yellow}BASELINE DEFECTS BY TARGET MILESTONE (RED STATE CATALOG):${C.reset}`);
    const byMilestone = {};
    for (const r of testResults.filter(r => r.status === 'fail')) {
      const ms = r.milestone || 'General';
      if (!byMilestone[ms]) byMilestone[ms] = [];
      byMilestone[ms].push(r);
    }

    for (const [ms, fails] of Object.entries(byMilestone)) {
      console.log(`\n  ${C.bold}${C.magenta}[Milestone ${ms}]${C.reset} (${fails.length} failing tests):`);
      for (const f of fails) {
        const errShort = f.error ? (f.error.message || String(f.error)).split('\n')[0] : 'Error';
        console.log(`   ${C.red}•${C.reset} [${f.suite}] ${f.title}`);
        console.log(`     ${C.dim}Reason: ${errShort}${C.reset}`);
      }
    }
    console.log(`\n${C.yellow}Note: Baseline failures confirm high test sensitivity (Red state established).${C.reset}\n`);
  } else {
    console.log(`${C.green}${C.bold}ALL TESTS PASSED! GREEN STATE CONFIRMED.${C.reset}\n`);
  }

  // Exit with non-zero on test failures
  process.exit(failed > 0 ? 1 : 0);
}

main().catch(err => {
  console.error(`${C.red}Fatal test runner error:${C.reset}`, err);
  process.exit(2);
});
