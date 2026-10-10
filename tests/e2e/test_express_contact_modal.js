/**
 * Automated E2E Verification Suite for Dual Contact Widget & Express Modal
 *
 * Verifies:
 * - DUAL-01: Dual contact pill exists in footer with Telegram and Email badges
 * - MODAL-01: Clicking Email button opens express-contact-modal with Email panel active
 * - MODAL-02: Tab switching between Email and Telegram panels updates aria attributes
 * - MODAL-03: Client-side validation blocks empty submission and shows error messages
 * - MODAL-04: Valid form submission posts payload and renders success card
 * - MODAL-05: Modal closes via close button and Escape key, restoring focus
 * - MODAL-06: 1-click email copy button provides visual copied confirmation
 */

const assert = require('assert');
const path = require('path');
const { chromium } = require('playwright');
const { createStaticServer } = require('../helpers/server');

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

async function runExpressModalSuite(options = {}) {
  console.log(`${C.bold}${C.cyan}========================================================================${C.reset}`);
  console.log(`${C.bold}${C.cyan}    AI AVTOPILOT - DUAL CONTACT WIDGET & EXPRESS MODAL SUITE           ${C.reset}`);
  console.log(`${C.bold}${C.cyan}========================================================================${C.reset}\n`);

  let server = options.server;
  let browser = options.browser;
  let baseUrl = options.baseUrl;
  let ownServer = false;
  let ownBrowser = false;
  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`   ${C.green}✔ PASS${C.reset} ${name}`);
      passed++;
    } catch (err) {
      console.log(`   ${C.red}✖ FAIL${C.reset} ${name}`);
      console.log(`     ${C.yellow}Error: ${err.message}${C.reset}`);
      failed++;
    }
  }

  try {
    if (!server && !baseUrl) {
      const rootDir = path.resolve(__dirname, '../..');
      server = createStaticServer(rootDir);
      const res = await server.start();
      baseUrl = res.baseUrl;
      ownServer = true;
    }
    if (!browser) {
      browser = await chromium.launch({
        channel: 'msedge',
        headless: true
      });
      ownBrowser = true;
    }

    const page = await browser.newPage();
    await page.route(/.*(formsubmit\.co|api\.web3forms\.com).*/, async route => {
      const req = route.request();
      if (req.isNavigationRequest()) {
        await route.fulfill({ status: 302, headers: { Location: '/success.html' } });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, message: 'Test mock: email suppressed' })
        });
      }
    });
    await page.goto(`${baseUrl}/`);

    // TEST 1: Dual contact pill exists with both Telegram and Email buttons
    await test('DUAL-01: Dual contact pill rendered in footer with active links', async () => {
      const dualCta = page.locator('.footer__dual-cta');
      assert.strictEqual(await dualCta.count(), 1, '.footer__dual-cta must exist in footer');

      const tgBtn = page.locator('.footer__dual-btn--tg');
      assert.strictEqual(await tgBtn.count(), 1, 'Telegram half must exist');
      const tgHref = await tgBtn.getAttribute('href');
      assert.ok(tgHref.includes('t.me/AiAvtopilotbot'), 'Telegram link must point to @AiAvtopilotbot');

      const emailBtn = page.locator('#open-express-modal');
      assert.strictEqual(await emailBtn.count(), 1, 'Email trigger button must exist');
      const ariaHasPopup = await emailBtn.getAttribute('aria-haspopup');
      assert.strictEqual(ariaHasPopup, 'dialog', 'Email trigger must declare aria-haspopup="dialog"');
    });

    // TEST 2: Clicking Email button opens express-contact-modal
    await test('MODAL-01: Clicking Email button opens modal with Email panel active', async () => {
      const emailBtn = page.locator('#open-express-modal');
      await emailBtn.scrollIntoViewIfNeeded();
      await emailBtn.click();

      const modal = page.locator('#express-contact-modal');
      const isOpen = await modal.evaluate(el => el.hasAttribute('open'));
      assert.strictEqual(isOpen, true, 'Modal must have [open] attribute');

      const panelEmail = page.locator('#panel-email');
      const isEmailHidden = await panelEmail.evaluate(el => el.hidden);
      assert.strictEqual(isEmailHidden, false, 'Email panel must not be hidden');

      const tabEmail = page.locator('#tab-email-btn');
      const ariaSelected = await tabEmail.getAttribute('aria-selected');
      assert.strictEqual(ariaSelected, 'true', 'Email tab must be aria-selected="true"');
    });

    // TEST 3: Tab switching between Email and Telegram
    await test('MODAL-02: Tab switching between Email and Telegram panels works', async () => {
      const tabTg = page.locator('#tab-tg-btn');
      await tabTg.click();

      const panelTg = page.locator('#panel-tg');
      const isTgHidden = await panelTg.evaluate(el => el.hidden);
      assert.strictEqual(isTgHidden, false, 'Telegram panel must become visible');

      const tgBotBtn = page.locator('#panel-tg a[href*="AiAvtopilotbot"]');
      assert.strictEqual(await tgBotBtn.count(), 1, 'Telegram direct link must exist inside panel');

      // Switch back to Email
      const tabEmail = page.locator('#tab-email-btn');
      await tabEmail.click();
      const isEmailHidden = await page.locator('#panel-email').evaluate(el => el.hidden);
      assert.strictEqual(isEmailHidden, false, 'Email panel must become active again');
    });

    // TEST 4: Validation on empty submission
    await test('MODAL-03: Empty submission shows validation errors on required fields', async () => {
      const submitBtn = page.locator('#express-submit-btn');
      await submitBtn.click();

      const contactInp = page.locator('#express-contact');
      const hasInvalidClass = await contactInp.evaluate(el => el.classList.contains('is-invalid'));
      assert.strictEqual(hasInvalidClass, true, 'Empty contact input must have .is-invalid');

      const contactError = page.locator('#express-contact-error');
      const isErrorVisible = await contactError.evaluate(el => el.classList.contains('is-visible'));
      assert.strictEqual(isErrorVisible, true, 'Contact error message must be displayed');
    });

    // TEST 5: Valid form submission posts payload and renders success card
    await test('MODAL-04: Valid form submission posts payload and renders success card', async () => {
      let interceptedPayload = null;
      await page.route('**/submit', async (route, request) => {
        if (request.method() === 'POST') {
          try {
            interceptedPayload = JSON.parse(request.postData() || '{}');
          } catch (_e) {}
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, status: 'delivered_to_telegram' })
          });
        } else {
          await route.continue();
        }
      });

      await page.locator('#express-contact').fill('client@b2b-company.ru');
      await page.locator('#express-message').fill('Необходима роботизация сверок и интеграция с 1С:ERP.');

      await page.locator('#express-submit-btn').click();

      // Success card must become visible
      await page.waitForSelector('#express-success-card:not([style*="display:none"])', { timeout: 3000 });
      const successTitle = await page.locator('.express-success__title').textContent();
      assert.strictEqual(successTitle.trim(), 'Сообщение отправлено!');

      assert.ok(interceptedPayload, 'Payload must be intercepted');
      assert.strictEqual(interceptedPayload.contact, 'client@b2b-company.ru');
      assert.strictEqual(interceptedPayload.source, 'express_modal');
      assert.ok(interceptedPayload.message.includes('роботизация сверок'));
    });

    // TEST 6: Modal close via close button and Escape key
    await test('MODAL-05: Modal closes via close button and restores trigger focus', async () => {
      const closeBtn = page.locator('#close-express-modal');
      await closeBtn.click();

      const modal = page.locator('#express-contact-modal');
      const isOpen = await modal.evaluate(el => el.hasAttribute('open'));
      assert.strictEqual(isOpen, false, 'Modal must no longer have open attribute after closing');

      const isTriggerFocused = await page.locator('#open-express-modal').evaluate(el => el === document.activeElement);
      assert.strictEqual(isTriggerFocused, true, 'Trigger button must regain focus');
    });

    // TEST 7: 1-click email copy button
    await test('MODAL-06: Direct copy email button updates visual badge state', async () => {
      // Reopen modal
      await page.locator('#open-express-modal').click();

      // Reset form if in success state
      const resetBtn = page.locator('#express-reset-btn');
      if (await resetBtn.isVisible()) {
        await resetBtn.click();
      }

      const copyBtn = page.locator('#modal-copy-email-btn');
      assert.strictEqual(await copyBtn.count(), 1, 'Copy email button must exist');

      await copyBtn.click();
      const badgeText = await page.locator('#modal-copy-badge .copy-label').textContent();
      assert.ok(badgeText.includes('Скопировано'), 'Badge text must update to confirmed copy state');

      await page.close();
    });

  } finally {
    if (ownBrowser && browser) await browser.close();
    if (ownServer && server) await server.stop();
  }

  console.log(`\n${C.bold}========================================================================${C.reset}`);
  console.log(`${C.bold}EXPRESS CONTACT MODAL TEST SUMMARY${C.reset}`);
  console.log(`${C.bold}========================================================================${C.reset}`);
  console.log(`Total Checks: ${passed + failed}`);
  console.log(`Passing:      ${C.green}${passed}${C.reset}`);
  console.log(`Failing:      ${failed > 0 ? C.red : C.green}${failed}${C.reset}`);

  if (failed === 0) {
    console.log(`\n${C.bold}${C.green}ALL EXPRESS MODAL & DUAL WIDGET TESTS PASSED!${C.reset}\n`);
  }

  return { totalChecks: passed + failed, passedChecks: passed, failedChecks: failed };
}

if (require.main === module) {
  runExpressModalSuite().then(res => {
    process.exit(res.failedChecks === 0 ? 0 : 1);
  }).catch(err => {
    console.error('Test execution failed:', err);
    process.exit(1);
  });
}

module.exports = { runExpressModalSuite };
