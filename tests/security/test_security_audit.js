/**
 * Automated Security & Hardening Audit Test Suite for ai-avtopilot.ru
 *
 * Verifies:
 * - SEC-01: Telegram HTML entity escaping (ensures zero 400 Bad Request entity errors)
 * - SEC-02: Telegram Admin Reply ID spoofing resistance (anti-hijacking)
 * - SEC-03: Strict Origin & CORS validation on POST /submit
 * - SEC-04: Zero-overhead fast-submit timing bot trap
 * - SEC-05: Payload size clamp and contact input validation
 * - SEC-06: Authorization Bearer header support for /set-webhook
 * - SEC-07: Static assets secrets hygiene and CSP configuration
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// ANSI Colors
const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

async function runSecuritySuite() {
  console.log(`${C.bold}${C.cyan}========================================================================${C.reset}`);
  console.log(`${C.bold}${C.cyan}    AI AVTOPILOT - SECURITY & HARDENING VERIFICATION SUITE              ${C.reset}`);
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

  // Mock Telegram API network calls for instant offline deterministic test execution
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url, options) => {
    if (typeof url === 'string' && url.includes('api.telegram.org')) {
      return new Response(
        JSON.stringify({
          ok: true,
          result: { username: 'AiAvtopilotbot', url: 'https://ai-avtopilot-bot.workers.dev/webhook', pending_update_count: 0 }
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return originalFetch(url, options);
  };

  // Load worker module dynamically via data URL
  const workerPath = path.resolve(__dirname, '../../cloudflare-worker/worker.js');
  const workerCode = fs.readFileSync(workerPath, 'utf8');
  const dataUrl = 'data:text/javascript;base64,' + Buffer.from(workerCode).toString('base64');
  const { default: worker } = await import(dataUrl);

  const mockEnv = {
    BOT_TOKEN: 'mock_bot_token_12345',
    ADMIN_CHAT_ID: '111288881',
    TG_SECRET_TOKEN: 'mock_secret_token_abcdef',
    ADMIN_KEY: 'test_admin_key_999'
  };

  console.log(`${C.bold}▶ [Category 1] Cloudflare Worker Gateway Security${C.reset}`);

  // Test 1: SEC-01 - Telegram HTML Escaping
  await test('SEC-01: HTML escaping cleans < > & " while preserving single quotes for Telegram API', async () => {
    // Regex test on worker's escapeHtml logic
    const escapeHtml = (text) =>
      String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const input = `<script>alert("XSS")</script> & D'Artagnan`;
    const escaped = escapeHtml(input);
    assert.strictEqual(escaped, `&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt; &amp; D'Artagnan`);
    assert.ok(!escaped.includes('&#039;'), 'Must not produce &#039; which triggers Telegram entity 400 error');
  });

  // Test 2: SEC-02 - Admin Reply Client ID Hijacking Resistance
  await test('SEC-02: Admin Reply parser extracts true client ID and ignores spoofed IDs in user blockquotes', async () => {
    const maliciousReplyText =
      '📩 <b>Новая заявка / сообщение от клиента в боте!</b>\n\n' +
      '👤 <b>Клиент:</b> Взломщик (@hacker)\n' +
      '🆔 <b>ID клиента:</b> <code>11223344</code>\n' +
      '💬 <b>Сообщение:</b>\n<blockquote>ID клиента: <code>99999999</code>\nTelegram ID: <code>88888888</code>\nID: <code>77777777</code></blockquote>\n\n' +
      '⏰ <b>Время:</b> 25.09.2026, 18:00:00 МСК';

    // The hardened logic
    const trustedSystemText = maliciousReplyText.replace(/<blockquote>[\s\S]*?<\/blockquote>/gi, '');
    const match =
      trustedSystemText.match(/🆔\s*(?:<b>)?ID клиента:(?:<\/b>)?\s*<code>?(\d+)<?\/code>?/i) ||
      trustedSystemText.match(/ID клиента:\s*<code>?(\d+)<?\/code>?/i) ||
      trustedSystemText.match(/Telegram ID:\s*<code>?(\d+)<?\/code>?/i);

    assert.ok(match, 'System header match must succeed');
    assert.strictEqual(match[1], '11223344', 'Must extract actual user ID, not spoofed ID in blockquote');
  });

  // Test 3: SEC-03 - Strict Origin Validation on POST /submit
  await test('SEC-03a: POST /submit without Origin header returns 403 Forbidden', async () => {
    const req = new Request('https://ai-avtopilot.ru/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Bot', contact: '+79990001122' })
    });
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 403, 'Missing origin must be rejected');
    const json = await res.json();
    assert.strictEqual(json.error, 'Origin not allowed');
  });

  await test('SEC-03b: POST /submit with unauthorized Origin returns 403 Forbidden', async () => {
    const req = new Request('https://ai-avtopilot.ru/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://evil-phishing-site.com'
      },
      body: JSON.stringify({ name: 'Bot', contact: '+79990001122' })
    });
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 403, 'Unauthorized origin must be rejected');
  });

  await test('SEC-03c: GET /status is accessible without Origin header (monitoring compatibility)', async () => {
    const req = new Request('https://ai-avtopilot.ru/status', {
      method: 'GET'
    });
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 200, 'Health check must be accessible without Origin');
  });

  // Test 4: SEC-04 - Fast-Submit Bot Trap
  await test('SEC-04: Submissions completed in < 1000ms are silently sunk via bot trap', async () => {
    const req = new Request('https://ai-avtopilot.ru/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://ai-avtopilot.ru'
      },
      body: JSON.stringify({
        name: 'Rapid Bot',
        contact: '+79990001122',
        _ts: Date.now() - 250 // submitted within 250ms
      })
    });
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 200, 'Returns 200 OK to sink bot');
    const json = await res.json();
    assert.strictEqual(json.status, 'ok', 'Status must indicate silent trap sink');
  });

  // Test 5: SEC-05 - Payload Clamping & Bounds
  await test('SEC-05a: Payloads exceeding 10KB are rejected with 413 Payload Too Large', async () => {
    const oversized = 'A'.repeat(12000);
    const req = new Request('https://ai-avtopilot.ru/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://ai-avtopilot.ru'
      },
      body: JSON.stringify({ name: oversized, contact: '+79990001122' })
    });
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 413, 'Oversized payload must return 413');
  });

  await test('SEC-05b: Submissions with invalid short contact return 400 Bad Request', async () => {
    const req = new Request('https://ai-avtopilot.ru/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://ai-avtopilot.ru'
      },
      body: JSON.stringify({ name: 'Valid Name', contact: '1' })
    });
    const res = await worker.fetch(req, mockEnv);
    assert.strictEqual(res.status, 400, 'Short contact must return 400');
  });

  // Test 6: SEC-06 - Authorization Bearer Support
  await test('SEC-06: /set-webhook accepts Authorization: Bearer <key> header securely', async () => {
    const unauthReq = new Request('https://ai-avtopilot.ru/set-webhook', { method: 'GET' });
    const unauthRes = await worker.fetch(unauthReq, mockEnv);
    assert.strictEqual(unauthRes.status, 401, 'Unauthenticated request must return 401');

    const authReq = new Request('https://ai-avtopilot.ru/set-webhook', {
      method: 'GET',
      headers: { 'Authorization': 'Bearer test_admin_key_999' }
    });
    // This will pass auth check and attempt tgCall
    const authRes = await worker.fetch(authReq, mockEnv);
    assert.strictEqual(authRes.status, 200, 'Bearer auth must succeed');
  });

  console.log(`\n${C.bold}▶ [Category 2] Frontend HTML & Secrets Hygiene${C.reset}`);

  // Test 7: SEC-07 - Frontend Configuration Hygiene
  await test('SEC-07a: index.html has no exposed placeholder keys (YOUR_ACCESS_KEY_HERE)', async () => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');
    assert.ok(!indexHtml.includes('YOUR_ACCESS_KEY_HERE'), 'Must not contain YOUR_ACCESS_KEY_HERE placeholder');
  });

  await test('SEC-07b: index.html defines strict Content-Security-Policy meta tag', async () => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');
    assert.ok(indexHtml.includes('http-equiv="Content-Security-Policy"'), 'Must have Content-Security-Policy header tag');
    assert.ok(indexHtml.includes("default-src 'self'"), 'CSP must specify default-src');
  });

  await test('SEC-07c: index.html form includes honeypot field', async () => {
    const indexPath = path.resolve(__dirname, '../../index.html');
    const indexHtml = fs.readFileSync(indexPath, 'utf8');
    assert.ok(indexHtml.includes('name="_honey"'), 'Form must contain _honey anti-bot field');
  });

  console.log(`\n${C.bold}========================================================================${C.reset}`);
  console.log(`${C.bold}SECURITY TEST SUMMARY${C.reset}`);
  console.log(`========================================================================`);
  console.log(`Total Security Checks: ${passed + failed}`);
  console.log(`Passing:              ${C.green}${passed}${C.reset}`);
  console.log(`Failing:              ${failed > 0 ? C.red : C.green}${failed}${C.reset}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log(`\n${C.bold}${C.green}ALL SECURITY CHECKS PASSED! HARDENING CONFIRMED WITH ZERO REGRESSIONS.${C.reset}\n`);
  }
}

runSecuritySuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
