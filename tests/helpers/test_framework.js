/**
 * Lightweight, zero-dependency async test framework tailored for Playwright E2E suites.
 */

const assert = require('assert');

class TestSuite {
  constructor(name, metadata = {}) {
    this.name = name;
    this.metadata = metadata; // e.g. { tier: 1, milestone: 'M1', feature: 'R1' }
    this.tests = [];
    this.beforeHooks = [];
    this.afterHooks = [];
    this.beforeEachHooks = [];
    this.afterEachHooks = [];
  }

  test(title, fn) {
    this.tests.push({ title, fn });
  }

  before(fn) {
    this.beforeHooks.push(fn);
  }

  after(fn) {
    this.afterHooks.push(fn);
  }

  beforeEach(fn) {
    this.beforeEachHooks.push(fn);
  }

  afterEach(fn) {
    this.afterEachHooks.push(fn);
  }

  async run(context = {}) {
    const results = [];
    
    try {
      for (const hook of this.beforeHooks) {
        await hook(context);
      }

      for (const t of this.tests) {
        const start = Date.now();
        const testResult = {
          suite: this.name,
          title: t.title,
          tier: this.metadata.tier || 1,
          milestone: this.metadata.milestone || 'M1',
          feature: this.metadata.feature || 'General',
          status: 'pass',
          durationMs: 0,
          error: null
        };

        try {
          if (context.page) {
            try {
              await context.page.setViewportSize({ width: 1440, height: 900 });
              context.page.setDefaultTimeout(4000);
            } catch (e) {}
          }

          for (const hook of this.beforeEachHooks) {
            await hook(context, t);
          }

          // Run test with a 15-second individual timeout
          await Promise.race([
            t.fn(context),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Test timed out after 15000ms`)), 15000)
            )
          ]);

          for (const hook of this.afterEachHooks) {
            await hook(context, t);
          }
        } catch (err) {
          testResult.status = 'fail';
          testResult.error = err;
        }

        testResult.durationMs = Date.now() - start;
        results.push(testResult);
      }

      for (const hook of this.afterHooks) {
        await hook(context);
      }
    } catch (suiteErr) {
      results.push({
        suite: this.name,
        title: 'Suite Hook Execution',
        tier: this.metadata.tier || 1,
        milestone: this.metadata.milestone || 'M1',
        feature: this.metadata.feature || 'General',
        status: 'fail',
        durationMs: 0,
        error: suiteErr
      });
    }

    return results;
  }
}

function createSuite(name, metadata) {
  return new TestSuite(name, metadata);
}

module.exports = {
  createSuite,
  assert
};
