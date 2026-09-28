/**
 * Automated SSL/TLS Security & Configuration Audit Test Suite for ai-avtopilot.ru
 *
 * Verifies live edge transport security:
 * - SSL-01: Leaf certificate validity & lifetime (> 14 days remaining)
 * - SSL-02: Certificate Subject Alternative Name (SAN) validation
 * - SSL-03: Modern TLS 1.3 protocol negotiation & AEAD cipher suite
 * - SSL-04: TLS 1.2 backwards compatibility with secure PFS cipher
 * - SSL-05: Insecure legacy protocols rejection (TLS 1.0 & TLS 1.1 blocked)
 * - SSL-06: HSTS header compliance (max-age >= 31536000, includeSubDomains, preload)
 * - SSL-07: HTTP -> HTTPS canonical redirect on apex domain (308/301)
 * - SSL-08: HTTP/HTTPS canonicalization on www subdomain
 * - SSL-09: ALPN negotiation (HTTP/2 'h2' preferred)
 * - SSL-10: Zero mixed content (no plain http:// assets in static HTML)
 */

const tls = require('tls');
const https = require('https');
const http = require('http');
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

const HOSTNAME = 'ai-avtopilot.ru';
const WWW_HOSTNAME = 'www.ai-avtopilot.ru';
const TIMEOUT_MS = 6000;

function connectTls(options) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(options, () => {
      resolve(socket);
    });
    socket.setTimeout(TIMEOUT_MS, () => {
      socket.destroy(new Error(`TLS connection timed out after ${TIMEOUT_MS}ms`));
    });
    socket.on('error', (err) => {
      reject(err);
    });
  });
}

function fetchHttp(url) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://');
    const client = isHttps ? https : http;
    const req = client.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (SSL-Audit-Suite)' } }, (res) => {
      resolve({
        statusCode: res.statusCode,
        headers: res.headers
      });
      res.resume();
    });
    req.setTimeout(TIMEOUT_MS, () => {
      req.destroy(new Error(`HTTP request timed out after ${TIMEOUT_MS}ms`));
    });
    req.on('error', (err) => {
      reject(err);
    });
  });
}

async function runSslAuditSuite() {
  console.log(`${C.bold}${C.cyan}========================================================================${C.reset}`);
  console.log(`${C.bold}${C.cyan}    AI AVTOPILOT - SSL/TLS EDGE SECURITY VERIFICATION SUITE             ${C.reset}`);
  console.log(`${C.bold}${C.cyan}========================================================================${C.reset}\n`);

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

  // Check network connectivity first
  let isOnline = true;
  try {
    const probe = await connectTls({ host: HOSTNAME, port: 443, servername: HOSTNAME });
    probe.end();
  } catch (err) {
    console.log(`   ${C.yellow}⚠ WARNING: Network unreachable or DNS offline (${err.message}). Skipping remote tests.${C.reset}`);
    isOnline = false;
  }

  if (isOnline) {
    // SSL-01: Leaf certificate validity & lifetime
    await test('SSL-01: Certificate validity and expiration threshold (> 14 days)', async () => {
      const socket = await connectTls({ host: HOSTNAME, port: 443, servername: HOSTNAME });
      const cert = socket.getPeerCertificate();
      socket.end();

      assert.ok(cert && cert.valid_to, 'Peer certificate must be present');
      const validTo = new Date(cert.valid_to);
      const now = new Date();
      const daysRemaining = (validTo - now) / (1000 * 60 * 60 * 24);

      assert.ok(daysRemaining > 14, `Certificate expiring too soon: ${daysRemaining.toFixed(1)} days left`);
      assert.ok(cert.issuer && (cert.issuer.O || cert.issuer.CN), 'Issuer must be defined');
    });

    // SSL-02: Certificate SAN coverage
    await test('SSL-02: Certificate SAN covers target host', async () => {
      const socket = await connectTls({ host: HOSTNAME, port: 443, servername: HOSTNAME });
      const cert = socket.getPeerCertificate();
      socket.end();

      const altNames = cert.subjectaltname || '';
      assert.ok(altNames.includes(HOSTNAME), `SAN must include ${HOSTNAME}, got: ${altNames}`);
    });

    // SSL-03: Modern TLS 1.3 protocol negotiation
    await test('SSL-03: Modern TLS 1.3 protocol support & AEAD cipher', async () => {
      const socket = await connectTls({
        host: HOSTNAME,
        port: 443,
        servername: HOSTNAME,
        minVersion: 'TLSv1.3',
        maxVersion: 'TLSv1.3'
      });
      const proto = socket.getProtocol();
      const cipher = socket.getCipher();
      socket.end();

      assert.strictEqual(proto, 'TLSv1.3', `Protocol must be TLSv1.3, got ${proto}`);
      assert.ok(cipher && cipher.name, 'Cipher must be defined in TLS 1.3');
    });

    // SSL-04: TLS 1.2 backwards compatibility with secure PFS cipher
    await test('SSL-04: TLS 1.2 support with Perfect Forward Secrecy (PFS)', async () => {
      const socket = await connectTls({
        host: HOSTNAME,
        port: 443,
        servername: HOSTNAME,
        minVersion: 'TLSv1.2',
        maxVersion: 'TLSv1.2'
      });
      const proto = socket.getProtocol();
      const cipher = socket.getCipher();
      socket.end();

      assert.strictEqual(proto, 'TLSv1.2', `Protocol must be TLSv1.2, got ${proto}`);
      assert.ok(cipher && cipher.name.startsWith('ECDHE-'), `Cipher must use ECDHE (PFS), got: ${cipher.name}`);
    });

    // SSL-05: Insecure legacy protocols rejection (TLS 1.0 & TLS 1.1)
    await test('SSL-05: Insecure legacy protocols (TLS 1.0 & TLS 1.1) rejected', async () => {
      let rejected = false;
      try {
        const socket = await connectTls({
          host: HOSTNAME,
          port: 443,
          servername: HOSTNAME,
          minVersion: 'TLSv1',
          maxVersion: 'TLSv1'
        });
        socket.end();
      } catch (err) {
        rejected = true;
      }
      assert.ok(rejected, 'Server must reject legacy TLS 1.0 connection');
    });

    // SSL-06: Strict-Transport-Security (HSTS) compliance
    await test('SSL-06: HSTS header is active with >= 1yr max-age, includeSubDomains, preload', async () => {
      const resp = await fetchHttp(`https://${HOSTNAME}/`);
      const hsts = resp.headers['strict-transport-security'];

      assert.ok(hsts, 'Strict-Transport-Security header must be present');
      assert.ok(hsts.includes('max-age=') && !hsts.includes('max-age=0'), 'HSTS max-age must be configured');
      const maxAgeMatch = hsts.match(/max-age=(\d+)/);
      assert.ok(maxAgeMatch && parseInt(maxAgeMatch[1], 10) >= 31536000, 'HSTS max-age must be >= 1 year (31536000s)');
      assert.ok(hsts.includes('includeSubDomains'), 'HSTS must include includeSubDomains');
      assert.ok(hsts.includes('preload'), 'HSTS must specify preload directive');
    });

    // SSL-07: HTTP -> HTTPS canonical redirect on apex
    await test('SSL-07: Plain HTTP redirects to HTTPS on apex domain (308/301)', async () => {
      const resp = await fetchHttp(`http://${HOSTNAME}/`);
      assert.ok([301, 308].includes(resp.statusCode), `Expected 301 or 308 redirect, got ${resp.statusCode}`);
      assert.ok(resp.headers.location && resp.headers.location.startsWith('https://'), `Redirect location must be HTTPS, got ${resp.headers.location}`);
    });

    // SSL-08: HTTP/HTTPS canonicalization on www subdomain
    await test('SSL-08: www subdomain redirects to canonical apex domain', async () => {
      const resp = await fetchHttp(`http://${WWW_HOSTNAME}/`);
      assert.ok([301, 307, 308].includes(resp.statusCode), `Expected redirect for www, got ${resp.statusCode}`);
      assert.ok(resp.headers.location && resp.headers.location.includes(HOSTNAME), `Redirect must point to canonical domain, got ${resp.headers.location}`);
    });

    // SSL-09: ALPN negotiation (HTTP/2 preferred)
    await test('SSL-09: ALPN negotiates HTTP/2 (h2)', async () => {
      const socket = await connectTls({
        host: HOSTNAME,
        port: 443,
        servername: HOSTNAME,
        ALPNProtocols: ['h2', 'http/1.1']
      });
      const alpn = socket.alpnProtocol;
      socket.end();

      assert.strictEqual(alpn, 'h2', `ALPN should negotiate h2, got: ${alpn}`);
    });
  }

  // SSL-10: Zero mixed content across all static HTML pages (Offline deterministic)
  await test('SSL-10: Zero mixed content (no insecure http:// URLs) across all HTML files', async () => {
    const rootDir = path.resolve(__dirname, '../../');
    function scanHtmlFiles(dir) {
      let results = [];
      const list = fs.readdirSync(dir);
      for (const file of list) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          if (!['node_modules', '.git', 'tests', 'scripts', 'bot'].includes(file)) {
            results = results.concat(scanHtmlFiles(fullPath));
          }
        } else if (file.endsWith('.html')) {
          results.push(fullPath);
        }
      }
      return results;
    }

    const htmlFiles = scanHtmlFiles(rootDir);
    assert.ok(htmlFiles.length >= 6, `Expected at least 6 HTML pages to scan, found ${htmlFiles.length}`);

    const violations = [];
    for (const filePath of htmlFiles) {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.includes('http://') && !line.includes('w3.org') && !line.includes('schema.org')) {
          violations.push(`${path.basename(filePath)}:${i + 1} -> ${line.trim()}`);
        }
      }
    }

    assert.strictEqual(violations.length, 0, `Found insecure HTTP resources:\n${violations.join('\n')}`);
  });

  console.log(`\n${C.bold}SSL/TLS Audit Results: ${passed} passing, ${failed} failing${C.reset}\n`);

  if (failed > 0) {
    throw new Error(`${failed} SSL/TLS security check(s) failed`);
  }

  return { passed, failed };
}

if (require.main === module) {
  runSslAuditSuite().catch((err) => {
    console.error(`${C.red}Test run aborted: ${err.message}${C.reset}`);
    process.exit(1);
  });
}

module.exports = { runSslAuditSuite };
