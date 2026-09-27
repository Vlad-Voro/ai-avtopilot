/**
 * Automated Resiliency & JTBD Verification Test Suite for ai-avtopilot.ru
 *
 * Verifies:
 * - RES-01: Global 6000ms AbortController cascade budget & fetch signal attachment
 * - RES-02: Network failure / timeout fallback card with @AiAvtopilotbot direct link
 * - RES-03: Resilient 1-click structured clipboard copy of lead details
 * - RES-04: Yandex Metrica 'lead_form_success' strictly guarded on confirmed success
 * - RES-05: JTBD Persona Terminology across CEO, CFO, and CTO (P&L, ФОТ, УПД, OData, 152-ФЗ)
 * - RES-06: Strict Anti-Slop Audit across index.html and all 6 subpages
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

async function runResiliencySuite() {
  console.log(`${C.bold}${C.cyan}========================================================================${C.reset}`);
  console.log(`${C.bold}${C.cyan}    AI AVTOPILOT - RESILIENCY & JTBD VERIFICATION SUITE                 ${C.reset}`);
  console.log(`${C.bold}${C.cyan}========================================================================${C.reset}\n`);

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    return (async () => {
      try {
        await fn();
        console.log(`   ${C.green}✔ PASS${C.reset} ${name}`);
        passed++;
      } catch (err) {
        console.log(`   ${C.red}✖ FAIL${C.reset} ${name}`);
        console.log(`     ${C.yellow}Error: ${err.message}${C.reset}`);
        failed++;
      }
    })();
  }

  const rootDir = path.resolve(__dirname, '../..');
  const bundlePath = path.join(rootDir, 'assets/index-Bx30wa4i.js');
  const indexPath = path.join(rootDir, 'index.html');
  const subpages = ['services', 'cases', 'calculator', 'dashboard', 'faq', 'contact'];

  const bundle = fs.readFileSync(bundlePath, 'utf8');
  const indexHtml = fs.readFileSync(indexPath, 'utf8');

  // RES-01: Global 6000ms AbortController cascade budget & signal attachment
  await test('RES-01: Global 6000ms AbortController timeout & signal attachment', () => {
    assert(bundle.includes('new AbortController()'), 'Bundle must instantiate AbortController');
    assert(bundle.includes('6000'), 'Timeout budget must be exactly 6000ms');
    assert(bundle.includes('signal:abortCtrl.signal'), 'Fetch requests must attach signal:abortCtrl.signal');
    assert(bundle.includes('clearTimeout(abortTimer)'), 'Timer must be cleaned up after network requests');
  });

  // RES-02: Network failure / timeout fallback card with @AiAvtopilotbot direct link
  await test('RES-02: Network failure fallback card with @AiAvtopilotbot action', () => {
    assert(bundle.includes('form-fallback-card'), 'Bundle must render form-fallback-card on network failure');
    assert(bundle.includes('https://t.me/AiAvtopilotbot'), 'Card must provide direct link to @AiAvtopilotbot');
    assert(bundle.includes('contact@ai-avtopilot.ru'), 'Card must offer direct email fallback');
  });

  // RES-03: Resilient 1-click clipboard copy of lead details
  await test('RES-03: Resilient 1-click clipboard copy of lead details', () => {
    assert(bundle.includes('copy-lead-btn'), 'Bundle must provide copy-lead-btn');
    assert(bundle.includes('navigator.clipboard.writeText'), 'Must use navigator.clipboard.writeText');
    assert(bundle.includes('Заявка с сайта ai-avtopilot.ru'), 'Must prepare structured lead text');
    assert(bundle.includes('prompt('), 'Must provide prompt() fallback for restricted browser contexts');
  });

  // RES-04: Yandex Metrica 'lead_form_success' strictly guarded on confirmed success
  await test('RES-04: Yandex Metrica lead_form_success guarded on confirmed success', () => {
    assert(bundle.includes('lead_form_success'), 'Must report lead_form_success to Yandex Metrica');
    assert(bundle.includes('isSuccess){try{if(typeof window.ym==="function"){window.ym(112978516,"reachGoal","lead_form_success")'),
      'YM goal must be strictly inside confirmed isSuccess block');
  });

  // RES-05: JTBD Persona Terminology across CEO, CFO, and CTO
  await test('RES-05: JTBD Persona Terminology across CEO, CFO, and CTO in index.html', () => {
    // CEO / Owner pains & outcomes
    assert(indexHtml.includes('ФОТ'), 'Must address ФОТ (headcount costs)');
    assert(indexHtml.includes('масштабирование') || indexHtml.includes('Масштабирование'), 'Must address business scaling');

    // CFO / Chief Accountant pains & outcomes
    assert(indexHtml.includes('УПД') || indexHtml.includes('первичк'), 'Must address UPD / primary documents');
    assert(indexHtml.includes('Диадок') && indexHtml.includes('СБИС'), 'Must support Diadoc and SBIS EDO');
    assert(indexHtml.includes('P&L'), 'Must address automated P&L / management reporting');

    // CTO / 1C Architect pains & outcomes
    assert(indexHtml.includes('OData') || indexHtml.includes('REST API'), 'Must specify OData / REST API');
    assert(indexHtml.includes('без снятия 1С с поддержки') || indexHtml.includes('без вмешательства в типовой код'),
      'Must assure 1C standard configuration support without breaking updates');
    assert(indexHtml.includes('152-ФЗ') && indexHtml.includes('NDA'), 'Must address 152-FZ compliance and NDA');
  });

  // RES-06: Strict Anti-Slop Audit across index.html and all 6 subpages
  await test('RES-06: Strict Anti-Slop Audit across index.html and all 6 subpages', () => {
    const slopPatterns = [
      'волшебный ИИ',
      'ИИ без кода',
      'ИИ-бухгалтер',
      'заменит всех сотрудников',
      'нейросеть сделает всё сама',
      'магическим образом',
      'квантовый скачок'
    ];

    const allPages = [indexPath, ...subpages.map(s => path.join(rootDir, s, 'index.html'))];
    for (const pagePath of allPages) {
      const pageContent = fs.readFileSync(pagePath, 'utf8');
      const relPath = path.relative(rootDir, pagePath);
      for (const pattern of slopPatterns) {
        assert(!pageContent.includes(pattern), `Forbidden slop pattern "${pattern}" detected in ${relPath}`);
      }
    }
  });

  console.log(`\n${C.bold}------------------------------------------------------------------------${C.reset}`);
  console.log(`Resiliency & JTBD Results: ${C.green}${passed} Passed${C.reset}, ${failed > 0 ? C.red : C.green}${failed} Failed${C.reset}`);
  console.log(`${C.bold}------------------------------------------------------------------------${C.reset}\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runResiliencySuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
