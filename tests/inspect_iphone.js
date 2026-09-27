const { chromium, devices } = require('playwright');
const path = require('path');
const { createStaticServer } = require('./helpers/server');

async function run() {
  const serverInstance = createStaticServer(path.resolve(__dirname, '..'));
  const { baseUrl } = await serverInstance.start();

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const testDevices = [
    { name: 'iPhone 13', device: devices['iPhone 13'] },
    { name: 'iPhone SE (3rd gen)', device: devices['iPhone SE'] },
    { name: 'iPhone 14 Pro Max', device: devices['iPhone 14 Pro Max'] },
    { name: 'Pixel 7', device: devices['Pixel 7'] },
    { name: 'iPad Mini', device: devices['iPad Mini'] }
  ];

  for (const t of testDevices) {
    const context = await browser.newContext({
      ...t.device
    });
    const page = await context.newPage();
    await page.goto(baseUrl, { waitUntil: 'networkidle' });

    const navBox = await page.locator('.nav').boundingBox();
    const badgeBox = await page.locator('.hero__badge').boundingBox();
    const titleBox = await page.locator('.hero__title').boundingBox();

    console.log(`\n=== Device: ${t.name} (${t.device.viewport.width}x${t.device.viewport.height}) ===`);
    console.log(`Nav: top=${navBox.y}, height=${navBox.height}, bottom=${navBox.y + navBox.height}`);
    console.log(`Badge: top=${badgeBox.y}, height=${badgeBox.height}, bottom=${badgeBox.y + badgeBox.height}`);
    const overlap = (navBox.y + navBox.height) - badgeBox.y;
    console.log(`Overlap status: ${overlap > 0 ? 'CRITICAL OVERLAP! (' + overlap.toFixed(1) + 'px under nav)' : 'OK (clearance: ' + (-overlap).toFixed(1) + 'px)'}`);
    console.log(`Title: top=${titleBox.y}, height=${titleBox.height}`);

    const screenshotPath = path.resolve(__dirname, `screenshot_${t.name.replace(/[^a-zA-Z0-9]/g, '_')}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: false });
    console.log(`Saved screenshot: ${screenshotPath}`);

    await context.close();
  }

  await browser.close();
  await serverInstance.stop();
}

run().catch(console.error);
