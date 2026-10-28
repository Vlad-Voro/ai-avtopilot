/**
 * Tier 1 - SOTA In-Memory Unit Suite: ROI Calculator Engine
 * 
 * Execution budget: <= 20ms (zero DOM, zero network, zero browser subprocess)
 * Conforms to tdd_test_generator 3-Tier Pyramid invariants.
 */

const assert = require('assert');

/**
 * Pure ROI mathematical engine matching client-side business logic
 */
function calculateROI(employees, hours, salary) {
  const e = Math.max(1, Math.min(100, Math.round(Number(employees) || 1)));
  const h = Math.max(1, Math.min(40, Math.round(Number(hours) || 1)));
  const s = Math.max(30000, Math.min(300000, Math.round(Number(salary) || 30000)));

  const fraction = h / 160;
  const annualCost = Math.round(e * s * fraction * 12);
  const annualSavings = Math.round(annualCost * 0.8);
  const freedHours = Math.round(e * h * 52);

  return {
    employees: e,
    hours: h,
    salary: s,
    fraction,
    annualCost,
    annualSavings,
    freedHours
  };
}

function formatRub(num) {
  return Math.round(num).toLocaleString('ru-RU') + ' ₽';
}

function formatHours(num) {
  return Math.round(num).toLocaleString('ru-RU') + ' часов';
}

function calculateSliderFillPct(val, min = 0, max = 100) {
  const v = Math.max(min, Math.min(max, Number(val) || 0));
  return ((v - min) / (max - min)) * 100;
}

function runRoiUnitSuite() {
  const startTime = Date.now();
  let totalChecks = 0;
  let passedChecks = 0;
  let failedChecks = 0;

  function runCheck(id, desc, fn) {
    totalChecks++;
    try {
      fn();
      console.log(`   ✔ PASS ${id}: ${desc}`);
      passedChecks++;
    } catch (err) {
      console.error(`   ❌ FAIL ${id}: ${desc} - ${err.message}`);
      failedChecks++;
    }
  }

  console.log('--- Tier 1 Unit Suite: ROI Business Logic & Mathematical Invariants ---');

  // UNIT-01: Baseline formula check
  runCheck('UNIT-01', 'Baseline calculation (15 emp, 10 hrs, 120k salary)', () => {
    const res = calculateROI(15, 10, 120000);
    assert.strictEqual(typeof res, 'object');
    assert.strictEqual(res.employees, 15);
    assert.strictEqual(res.hours, 10);
    assert.strictEqual(res.salary, 120000);
    assert.strictEqual(res.fraction, 10 / 160);
    assert.strictEqual(res.annualCost, 1350000, `Expected annual cost 1,350,000 ₽, got ${res.annualCost}`);
    assert.strictEqual(res.annualSavings, 1080000, `Expected annual savings 1,080,000 ₽, got ${res.annualSavings}`);
    assert.strictEqual(res.freedHours, 7800, `Expected freed hours 7,800 h, got ${res.freedHours}`);
    assert.strictEqual(typeof res.annualCost, 'number');
    assert.strictEqual(typeof res.annualSavings, 'number');
    assert.strictEqual(typeof res.freedHours, 'number');
    assert.ok(res.annualSavings < res.annualCost);
    assert.ok(res.freedHours > 0);
  });

  // UNIT-02: R6.6 Feature specification values
  runCheck('UNIT-02', 'R6.6 Spec calculation (10 emp, 20 hrs, 80k salary)', () => {
    const res = calculateROI(10, 20, 80000);
    assert.strictEqual(typeof res, 'object');
    assert.strictEqual(res.employees, 10);
    assert.strictEqual(res.hours, 20);
    assert.strictEqual(res.salary, 80000);
    assert.strictEqual(res.fraction, 20 / 160);
    assert.strictEqual(res.annualCost, 1200000, `Expected 1,200,000 ₽, got ${res.annualCost}`);
    assert.strictEqual(res.annualSavings, 960000, `Expected 960,000 ₽, got ${res.annualSavings}`);
    assert.strictEqual(res.freedHours, 10400, `Expected 10,400 h, got ${res.freedHours}`);
    assert.strictEqual(typeof res.annualCost, 'number');
    assert.strictEqual(typeof res.annualSavings, 'number');
    assert.ok(res.annualSavings <= res.annualCost);
    assert.ok(res.freedHours > 0);
  });

  // UNIT-03: Minimum slider boundaries
  runCheck('UNIT-03', 'Minimum boundary values (1 emp, 1 hr, 30k salary)', () => {
    const res = calculateROI(1, 1, 30000);
    assert.strictEqual(typeof res, 'object');
    assert.strictEqual(res.employees, 1);
    assert.strictEqual(res.hours, 1);
    assert.strictEqual(res.salary, 30000);
    assert.strictEqual(res.fraction, 1 / 160);
    assert.strictEqual(res.annualCost, 2250, `Expected 2,250 ₽, got ${res.annualCost}`);
    assert.strictEqual(res.annualSavings, 1800, `Expected 1,800 ₽, got ${res.annualSavings}`);
    assert.strictEqual(res.freedHours, 52, `Expected 52 h, got ${res.freedHours}`);
    assert.strictEqual(typeof res.annualCost, 'number');
    assert.strictEqual(typeof res.annualSavings, 'number');
    assert.ok(res.annualCost > 0);
    assert.ok(res.annualSavings > 0);
  });

  // UNIT-04: Maximum slider boundaries
  runCheck('UNIT-04', 'Maximum boundary values (100 emp, 40 hrs, 300k salary)', () => {
    const res = calculateROI(100, 40, 300000);
    assert.strictEqual(typeof res, 'object');
    assert.strictEqual(res.employees, 100);
    assert.strictEqual(res.hours, 40);
    assert.strictEqual(res.salary, 300000);
    assert.strictEqual(res.fraction, 40 / 160);
    assert.strictEqual(res.annualCost, 90000000, `Expected 90,000,000 ₽, got ${res.annualCost}`);
    assert.strictEqual(res.annualSavings, 72000000, `Expected 72,000,000 ₽, got ${res.annualSavings}`);
    assert.strictEqual(res.freedHours, 208000, `Expected 208,000 h, got ${res.freedHours}`);
    assert.strictEqual(typeof res.annualCost, 'number');
    assert.strictEqual(typeof res.annualSavings, 'number');
    assert.ok(res.annualCost > res.annualSavings);
    assert.ok(res.freedHours > 100000);
  });

  // UNIT-05: Midpoint slider values
  runCheck('UNIT-05', 'Midpoint values (50 emp, 20 hrs, 165k salary)', () => {
    const res = calculateROI(50, 20, 165000);
    assert.strictEqual(typeof res, 'object');
    assert.strictEqual(res.employees, 50);
    assert.strictEqual(res.hours, 20);
    assert.strictEqual(res.salary, 165000);
    assert.strictEqual(res.fraction, 20 / 160);
    assert.strictEqual(res.annualCost, 12375000, `Expected 12,375,000 ₽, got ${res.annualCost}`);
    assert.strictEqual(res.annualSavings, 9900000, `Expected 9,900,000 ₽, got ${res.annualSavings}`);
    assert.strictEqual(res.freedHours, 52000, `Expected 52,000 h, got ${res.freedHours}`);
    assert.strictEqual(typeof res.annualCost, 'number');
    assert.strictEqual(typeof res.annualSavings, 'number');
    assert.ok(res.annualCost > 0);
    assert.ok(res.annualSavings > 0);
  });

  // UNIT-06: Out-of-bounds clamping
  runCheck('UNIT-06', 'Clamps values below minimum and above maximum', () => {
    const below = calculateROI(-10, 0, 5000);
    assert.strictEqual(typeof below, 'object');
    assert.strictEqual(below.employees, 1);
    assert.strictEqual(below.hours, 1);
    assert.strictEqual(below.salary, 30000);
    assert.strictEqual(below.fraction, 1 / 160);
    assert.strictEqual(below.annualCost, 2250);
    assert.strictEqual(below.annualSavings, 1800);
    assert.strictEqual(below.freedHours, 52);

    const above = calculateROI(500, 100, 1000000);
    assert.strictEqual(typeof above, 'object');
    assert.strictEqual(above.employees, 100);
    assert.strictEqual(above.hours, 40);
    assert.strictEqual(above.salary, 300000);
    assert.strictEqual(above.fraction, 40 / 160);
    assert.strictEqual(above.annualCost, 90000000);
    assert.strictEqual(above.annualSavings, 72000000);
    assert.strictEqual(above.freedHours, 208000);
  });

  // UNIT-07: NaN / string input resiliency
  runCheck('UNIT-07', 'Gracefully sanitizes non-numeric strings and nulls', () => {
    const res = calculateROI('15', '10', '120000');
    assert.strictEqual(typeof res, 'object');
    assert.strictEqual(res.employees, 15);
    assert.strictEqual(res.hours, 10);
    assert.strictEqual(res.salary, 120000);
    assert.strictEqual(res.annualCost, 1350000);
    assert.strictEqual(res.annualSavings, 1080000);
    assert.strictEqual(res.freedHours, 7800);

    const fallback = calculateROI(null, undefined, 'abc');
    assert.strictEqual(typeof fallback, 'object');
    assert.strictEqual(fallback.employees, 1);
    assert.strictEqual(fallback.hours, 1);
    assert.strictEqual(fallback.salary, 30000);
    assert.strictEqual(fallback.annualCost, 2250);
    assert.strictEqual(fallback.annualSavings, 1800);
    assert.strictEqual(fallback.freedHours, 52);
  });

  // UNIT-08: Savings factor invariant
  runCheck('UNIT-08', 'Strict 80% savings invariant holds across arbitrary inputs', () => {
    for (let e = 5; e <= 50; e += 15) {
      for (let h = 5; h <= 35; h += 15) {
        const res = calculateROI(e, h, 100000);
        const expectedSavings = Math.round(res.annualCost * 0.8);
        assert.strictEqual(typeof res.annualSavings, 'number');
        assert.strictEqual(res.annualSavings, expectedSavings, `Savings mismatch at e=${e}, h=${h}`);
        assert.ok(res.annualSavings <= res.annualCost);
      }
    }
  });

  // UNIT-09: Currency and hours string formatting
  runCheck('UNIT-09', 'Formatting functions produce expected Russian locale strings', () => {
    const rub = formatRub(1200000);
    assert.strictEqual(typeof rub, 'string');
    assert.ok(rub.includes('1') && rub.includes('200') && rub.includes('000') && rub.includes('₽'), `Got '${rub}'`);
    assert.ok(rub.endsWith('₽'));

    const hrs = formatHours(7800);
    assert.strictEqual(typeof hrs, 'string');
    assert.ok(hrs.includes('7') && hrs.includes('800') && hrs.includes('часов'), `Got '${hrs}'`);
    assert.ok(hrs.endsWith('часов'));
  });

  // UNIT-10: Slider dynamic gradient percentage calculation
  runCheck('UNIT-10', 'Slider fill percentage accurately computes [0%, 100%]', () => {
    assert.strictEqual(typeof calculateSliderFillPct(1, 1, 100), 'number');
    assert.strictEqual(calculateSliderFillPct(1, 1, 100), 0);
    assert.strictEqual(calculateSliderFillPct(100, 1, 100), 100);
    assert.strictEqual(calculateSliderFillPct(50.5, 1, 100), 50);
    assert.strictEqual(calculateSliderFillPct(30000, 30000, 300000), 0);
    assert.strictEqual(calculateSliderFillPct(300000, 30000, 300000), 100);
    assert.strictEqual(calculateSliderFillPct(165000, 30000, 300000), 50);
    assert.strictEqual(calculateSliderFillPct(-100, 0, 100), 0);
    assert.strictEqual(calculateSliderFillPct(200, 0, 100), 100);
  });

  // UNIT-11: Speed benchmark: pure compute <= 20ms
  const t0 = process.hrtime.bigint();
  for (let i = 0; i < 500; i++) {
    calculateROI(15 + (i % 20), 10 + (i % 10), 120000);
  }
  const computeDurationMs = Number(process.hrtime.bigint() - t0) / 1e6;
  runCheck('UNIT-11', `Speed benchmark: 500 ROI computations complete in <= 20ms (took ${computeDurationMs.toFixed(2)}ms)`, () => {
    assert.ok(computeDurationMs <= 20, `Execution took ${computeDurationMs}ms, exceeding 20ms Tier 1 budget`);
  });

  const totalElapsed = Date.now() - startTime;
  return { totalChecks, passedChecks, failedChecks, durationMs: totalElapsed };
}

if (require.main === module) {
  const res = runRoiUnitSuite();
  process.exit(res.failedChecks === 0 ? 0 : 1);
}

module.exports = {
  calculateROI,
  formatRub,
  formatHours,
  calculateSliderFillPct,
  runRoiUnitSuite
};
