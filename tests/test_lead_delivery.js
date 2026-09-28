/**
 * Automated Lead Form Delivery & Branded Validation Verification Suite
 *
 * Verifies:
 * - FORM-01: Branded validation tooltip & shake animation on empty required fields
 * - FORM-02: Required field highlighting (required-star & required-badge)
 * - FORM-03: Auto-clearing error tooltip on input typing
 * - FORM-04: End-to-end lead delivery via Cloudflare Worker with success card render
 * - FORM-05: Network resiliency fallback card on delivery failure
 */

const assert = require('assert');
const path = require('path');
const { chromium } = require('playwright');
const { createStaticServer } = require('./helpers/server');

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  yellow: '\x1b[33m'
};

async function runDeliveryTests() {
  console.log(`${C.bold}${C.cyan}========================================================================${C.reset}`);
  console.log(`${C.bold}${C.cyan}    AI AVTOPILOT - FORM DELIVERY & BRANDED VALIDATION SUITE             ${C.reset}`);
  console.log(`${C.bold}${C.cyan}========================================================================${C.reset}\n`);

  let server;
  let browser;
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
    const rootDir = path.resolve(__dirname, '..');
    server = createStaticServer(rootDir);
    const { baseUrl } = await server.start();

    browser = await chromium.launch({
      channel: 'msedge',
      headless: true
    });

    // TEST 1: Branded validation tooltip on empty required fields
    await test('FORM-01: Empty submit triggers branded tooltip and prevents native bubble', async () => {
      const page = await browser.newPage();
      await page.goto(`${baseUrl}/`);

      const form = page.locator('#contact-form');
      await form.scrollIntoViewIfNeeded();

      // Ensure novalidate is active
      const novalidate = await form.getAttribute('novalidate');
      assert.strictEqual(novalidate !== null, true, 'Form must have novalidate attribute to suppress browser popup');

      // Click submit with empty form
      const submitBtn = page.locator('#form-submit');
      await submitBtn.click();
      await page.waitForTimeout(100);

      // Name input should receive .is-invalid
      const nameInput = page.locator('#contact-name');
      const nameHasError = await nameInput.evaluate(el => el.classList.contains('is-invalid'));
      assert.strictEqual(nameHasError, true, 'Empty name input must have is-invalid class');

      // Form tooltip must exist and have branded warning icon and text
      const tooltip = page.locator('.form-tooltip');
      const tooltipCount = await tooltip.count();
      assert.strictEqual(tooltipCount, 1, 'Exactly one branded tooltip should be rendered');

      const tooltipText = await tooltip.textContent();
      assert.ok(tooltipText.includes('!'), 'Tooltip must show warning badge');
      assert.ok(tooltipText.includes('Заполните это поле'), 'Tooltip must show friendly fill prompt');

      await page.close();
    });

    // TEST 2: Required field highlighting
    await test('FORM-02: Phone & Name fields display required-star and required-badge', async () => {
      const page = await browser.newPage();
      await page.goto(`${baseUrl}/`);

      // Check required stars
      const requiredStars = page.locator('.required-star');
      const starCount = await requiredStars.count();
      assert.ok(starCount >= 2, 'Both Name and Contact fields must have .required-star');

      // Check required badge on phone field
      const requiredBadge = page.locator('.required-badge');
      const badgeCount = await requiredBadge.count();
      assert.strictEqual(badgeCount, 1, 'Contact/phone field must display .required-badge');
      const badgeText = await requiredBadge.textContent();
      assert.strictEqual(badgeText.trim(), 'обязательно');

      // Check optional hint on Company
      const optionalHint = page.locator('.optional-hint');
      const hintCount = await optionalHint.count();
      assert.strictEqual(hintCount, 1, 'Company field must display .optional-hint');

      await page.close();
    });

    // TEST 3: Auto-clearing error tooltip on input typing
    await test('FORM-03: Typing into invalid field immediately removes error state and tooltip', async () => {
      const page = await browser.newPage();
      await page.goto(`${baseUrl}/`);

      const submitBtn = page.locator('#form-submit');
      await submitBtn.click();
      await page.waitForTimeout(100);

      const nameInput = page.locator('#contact-name');
      await nameInput.fill('Алексей');

      const nameHasError = await nameInput.evaluate(el => el.classList.contains('is-invalid'));
      assert.strictEqual(nameHasError, false, 'Typing must clear is-invalid class');

      const tooltip = page.locator('.form-tooltip');
      const tooltipCount = await tooltip.count();
      assert.strictEqual(tooltipCount, 0, 'Typing must remove .form-tooltip');

      // Now click submit again -> should highlight contact field
      await submitBtn.click();
      await page.waitForTimeout(100);

      const contactInput = page.locator('#contact-email');
      const contactHasError = await contactInput.evaluate(el => el.classList.contains('is-invalid'));
      assert.strictEqual(contactHasError, true, 'Contact input must receive is-invalid when name is filled');

      const contactTooltip = page.locator('.form-tooltip');
      assert.strictEqual(await contactTooltip.count(), 1, 'Tooltip must appear on contact field');

      await page.close();
    });

    // TEST 4: End-to-end lead delivery via Cloudflare Worker with success card render
    await test('FORM-04: End-to-end lead delivery sends payload and displays success card', async () => {
      const page = await browser.newPage();

      let deliveryPayload = null;
      let interceptedWorker = false;

      // Intercept Worker POST request
      await page.route('**/submit', async (route, request) => {
        if (request.method() === 'POST') {
          interceptedWorker = true;
          try {
            deliveryPayload = JSON.parse(request.postData() || '{}');
          } catch (_e) {}
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ success: true, message: 'Lead delivered' })
          });
        } else {
          await route.continue();
        }
      });

      await page.goto(`${baseUrl}/`);

      // Fill in all valid fields
      await page.locator('#contact-name').fill('Владимир Проверен');
      await page.locator('#contact-company').fill('ООО «Технологии»');
      await page.locator('#contact-email').fill('+7 (999) 777-66-55');
      await page.locator('#contact-consent').check();

      // Submit form
      await page.locator('#form-submit').click();

      // Wait for success screen
      await page.waitForSelector('.form-success', { timeout: 3000 });

      assert.strictEqual(interceptedWorker, true, 'POST /submit must be triggered');
      assert.ok(deliveryPayload, 'Payload must be sent');
      assert.strictEqual(deliveryPayload.name, 'Владимир Проверен');
      assert.strictEqual(deliveryPayload.company, 'ООО «Технологии»');
      assert.strictEqual(deliveryPayload.contact, '+7 (999) 777-66-55');

      const successTitle = await page.locator('.form-success__title').textContent();
      assert.strictEqual(successTitle.trim(), 'Заявка отправлена!');

      const successText = await page.locator('.form-success__text').textContent();
      assert.ok(successText.includes('Владимир Проверен'), 'Success text must greet user by name');

      await page.close();
    });

    // TEST 5: Network failure fallback card with @AiAvtopilotbot action
    await test('FORM-05: Network failure / timeout cascades to fallback card', async () => {
      const page = await browser.newPage();

      // Block all submit requests to force fallback
      await page.route('**/submit', route => route.abort('failed'));
      await page.route('https://api.web3forms.com/**', route => route.abort('failed'));
      await page.route('https://formsubmit.co/**', route => route.abort('failed'));

      await page.goto(`${baseUrl}/`);

      await page.locator('#contact-name').fill('Фоллбэк Тест');
      await page.locator('#contact-company').fill('Тест Инк');
      await page.locator('#contact-email').fill('@telegram_user');
      await page.locator('#contact-consent').check();

      await page.locator('#form-submit').click();

      // Wait for fallback card
      await page.waitForSelector('.form-fallback-card', { timeout: 4000 });

      const fallbackCard = page.locator('.form-fallback-card');
      const cardCount = await fallbackCard.count();
      assert.strictEqual(cardCount, 1, 'Fallback card must be rendered on network error');

      const tgBtn = page.locator('.form-fallback-card a[href*="AiAvtopilotbot"]');
      assert.strictEqual(await tgBtn.count(), 1, 'Direct Telegram link must be present in fallback card');

      const copyBtn = page.locator('#copy-lead-btn');
      assert.strictEqual(await copyBtn.count(), 1, '1-click copy lead button must be present in fallback card');

      await page.close();
    });

  } finally {
    if (browser) await browser.close();
    if (server) await server.stop();
  }

  console.log(`\n${C.bold}========================================================================${C.reset}`);
  console.log(`${C.bold}FORM DELIVERY & VALIDATION SUMMARY${C.reset}`);
  console.log(`${C.bold}========================================================================${C.reset}`);
  console.log(`Total Checks: ${passed + failed}`);
  console.log(`Passing:      ${C.green}${passed}${C.reset}`);
  console.log(`Failing:      ${failed > 0 ? C.red : C.green}${failed}${C.reset}`);

  if (failed > 0) {
    process.exit(1);
  } else {
    console.log(`\n${C.bold}${C.green}ALL FORM DELIVERY AND BRANDED VALIDATION TESTS PASSED!${C.reset}\n`);
  }
}

runDeliveryTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
