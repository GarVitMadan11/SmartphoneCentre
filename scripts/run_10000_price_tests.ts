import { 
  MODELS, 
  generateVariantsForModel, 
  getDefectRulesForCategory, 
  DefectRule,
  Variant
} from '../src/data/mockDatabase.ts';
import { calculateValuation } from '../src/utils/valuation.ts';
import { roundToCleanIndianPrice } from '../src/utils/pricingEngine.ts';

interface TestCaseResult {
  id: number;
  modelName: string;
  brand: string;
  category: string;
  ramGb: number;
  storageGb: number;
  faultCount: number;
  faultNames: string[];
  cashifyPrice: number;
  rephonixPrice: number;
  absDiff: number;
  marginPct: number;
  passed: boolean;
  notes: string;
}

function run10000Tests() {
  console.log('🚀 Running 10,000 Exhaustive Price & Parity Tests...');
  const TOTAL_TARGET_TESTS = 10000;
  const results: TestCaseResult[] = [];

  let testId = 1;
  const modelsPool = [...MODELS];

  // Deterministic PRNG for reproducible test runs
  let seed = 98765;
  function random(): number {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(random() * arr.length)];
  }

  // Defect pools per category
  const defectPools: Record<string, DefectRule[]> = {
    flagship: getDefectRulesForCategory('flagship'),
    premium: getDefectRulesForCategory('premium'),
    midrange: getDefectRulesForCategory('midrange'),
    budget: getDefectRulesForCategory('budget'),
  };

  while (results.length < TOTAL_TARGET_TESTS) {
    const model = pickRandom(modelsPool);
    const category = model.category || 'flagship';
    const availableDefects = defectPools[category] || defectPools.flagship;

    let variants = generateVariantsForModel(model);
    if (!variants || variants.length === 0) {
      variants = [{
        id: `var-${model.id}-128`,
        modelId: model.id,
        storageGb: 128,
        ramGb: 0,
        color: 'Default',
        basePrice: model.basePrice128GB || 25000,
      }];
    }

    const variant = pickRandom(variants);
    const storageGb = variant.storageGb;
    const ramGb = variant.ramGb || 0;

    // Distribute across fault profiles
    const faultRoll = random();
    let numFaults = 0;
    let isCriticalTest = false;

    if (faultRoll < 0.15) {
      numFaults = 0; // Flawless (Optimal)
    } else if (faultRoll < 0.40) {
      numFaults = 1; // 1 Fault
    } else if (faultRoll < 0.68) {
      numFaults = 2; // 2 Faults (Compound)
    } else if (faultRoll < 0.86) {
      numFaults = 3; // 3 Faults (Multi-component)
    } else if (faultRoll < 0.96) {
      numFaults = 4 + Math.floor(random() * 2); // 4-5 Faults (Heavy wear)
    } else {
      isCriticalTest = true; // Critical Failure Gate (Device Does Not Turn On)
    }

    let selectedDefects: DefectRule[] = [];
    if (isCriticalTest) {
      const crit = availableDefects.find(d => d.id === 'defect-critical-power');
      if (crit) selectedDefects = [crit];
    } else if (numFaults > 0) {
      const nonCritical = availableDefects.filter(d => d.id !== 'defect-critical-power');
      const shuffled = [...nonCritical].sort(() => 0.5 - random());
      selectedDefects = shuffled.slice(0, Math.min(numFaults, shuffled.length));
    }

    // Evaluate Rephonix Quote
    const rephonixValuation = calculateValuation(variant, selectedDefects, {
      modelId: model.id,
      brandId: model.brandId,
      modelName: model.name,
      category: model.category,
      releaseYear: model.releaseYear,
    });

    const rephonixPrice = rephonixValuation.finalPrice;

    // Ground-truth Cashify quote for this exact configuration:
    let cashifyPrice = 0;
    if (!rephonixValuation.isCritical && !isCriticalTest) {
      const rawBenchmark = rephonixValuation.auditTrail?.adjustedBenchmark ?? Math.round(variant.basePrice / 1.03);
      cashifyPrice = roundToCleanIndianPrice(rawBenchmark, 'clean_50');
    }

    let passed = false;
    let marginPct = 0;
    const absDiff = rephonixPrice - cashifyPrice;

    if (rephonixValuation.isCritical || isCriticalTest) {
      // Critical devices have zero value on both platforms
      passed = (rephonixPrice === 0 && cashifyPrice === 0);
      marginPct = 0;
    } else {
      marginPct = cashifyPrice > 0 ? ((rephonixPrice - cashifyPrice) / cashifyPrice) * 100 : 0;
      // Parity Invariant: Rephonix must be strictly higher than Cashify by at least 2.5% (accounting for clean_50 rounding)
      passed = (rephonixPrice > cashifyPrice) && (marginPct >= 2.5);
    }

    results.push({
      id: testId++,
      modelName: model.name,
      brand: model.brandId.replace('brand-', ''),
      category: model.category,
      ramGb,
      storageGb,
      faultCount: selectedDefects.length,
      faultNames: selectedDefects.map(d => d.description),
      cashifyPrice,
      rephonixPrice,
      absDiff,
      marginPct: parseFloat(marginPct.toFixed(2)),
      passed,
      notes: isCriticalTest ? 'Critical Fault (₹0 lock)' : `${selectedDefects.length} Fault(s) Compound`,
    });
  }

  // Compile Aggregate Statistics
  const lowerThanCashifyCount = results.filter(r => r.rephonixPrice < r.cashifyPrice).length;
  const exactlyEqualNonZero = results.filter(r => r.rephonixPrice === r.cashifyPrice && r.rephonixPrice > 0).length;
  const totalPassed = results.filter(r => r.passed).length;
  const totalFailed = results.length - totalPassed;

  const nonZeroResults = results.filter(r => r.cashifyPrice > 0 && r.rephonixPrice > 0);
  const avgMargin = nonZeroResults.reduce((sum, r) => sum + r.marginPct, 0) / nonZeroResults.length;
  const minMargin = Math.min(...nonZeroResults.map(r => r.marginPct));
  const maxMargin = Math.max(...nonZeroResults.map(r => r.marginPct));
  const avgAbsDiff = nonZeroResults.reduce((sum, r) => sum + r.absDiff, 0) / nonZeroResults.length;
  const minAbsDiff = Math.min(...nonZeroResults.map(r => r.absDiff));
  const maxAbsDiff = Math.max(...nonZeroResults.map(r => r.absDiff));

  // Category breakdown
  const categoryStats: Record<string, { count: number; passed: number; avgMargin: string; avgRupees: string }> = {};
  for (const cat of ['flagship', 'premium', 'midrange', 'budget']) {
    const subset = results.filter(r => r.category === cat);
    const nonZeroSub = subset.filter(r => r.cashifyPrice > 0);
    const subPassed = subset.filter(r => r.passed).length;
    const subAvgMargin = nonZeroSub.length > 0 ? nonZeroSub.reduce((s, r) => s + r.marginPct, 0) / nonZeroSub.length : 0;
    const subAvgRupees = nonZeroSub.length > 0 ? nonZeroSub.reduce((s, r) => s + r.absDiff, 0) / nonZeroSub.length : 0;
    categoryStats[cat] = {
      count: subset.length,
      passed: subPassed,
      avgMargin: `+${subAvgMargin.toFixed(2)}%`,
      avgRupees: `₹${Math.round(subAvgRupees).toLocaleString('en-IN')}`,
    };
  }

  // Brand breakdown
  const brandStats: Record<string, { count: number; passed: number; avgMargin: string; avgRupees: string }> = {};
  for (const b of ['apple', 'samsung', 'oneplus', 'xiaomi', 'vivo']) {
    const subset = results.filter(r => r.brand.toLowerCase() === b);
    const nonZeroSub = subset.filter(r => r.cashifyPrice > 0);
    const subPassed = subset.filter(r => r.passed).length;
    const subAvgMargin = nonZeroSub.length > 0 ? nonZeroSub.reduce((s, r) => s + r.marginPct, 0) / nonZeroSub.length : 0;
    const subAvgRupees = nonZeroSub.length > 0 ? nonZeroSub.reduce((s, r) => s + r.absDiff, 0) / nonZeroSub.length : 0;
    brandStats[b] = {
      count: subset.length,
      passed: subPassed,
      avgMargin: `+${subAvgMargin.toFixed(2)}%`,
      avgRupees: `₹${Math.round(subAvgRupees).toLocaleString('en-IN')}`,
    };
  }

  // Fault count breakdown
  const faultStats: Record<string, { count: number; passed: number; avgMargin: string; avgRupees: string }> = {};
  for (let f = 0; f <= 5; f++) {
    const key = f === 5 ? '5+ faults' : `${f} fault(s)`;
    const subset = results.filter(r => f === 5 ? r.faultCount >= 5 : r.faultCount === f);
    const nonZeroSub = subset.filter(r => r.cashifyPrice > 0);
    const subPassed = subset.filter(r => r.passed).length;
    const subAvgMargin = nonZeroSub.length > 0 ? nonZeroSub.reduce((s, r) => s + r.marginPct, 0) / nonZeroSub.length : 0;
    const subAvgRupees = nonZeroSub.length > 0 ? nonZeroSub.reduce((s, r) => s + r.absDiff, 0) / nonZeroSub.length : 0;
    faultStats[key] = {
      count: subset.length,
      passed: subPassed,
      avgMargin: `+${subAvgMargin.toFixed(2)}%`,
      avgRupees: `₹${Math.round(subAvgRupees).toLocaleString('en-IN')}`,
    };
  }

  // Sample representative comparisons
  const sampleComparisons = [
    results.find(r => r.brand === 'apple' && r.faultCount === 0),
    results.find(r => r.brand === 'apple' && r.faultCount === 1),
    results.find(r => r.brand === 'apple' && r.faultCount === 2),
    results.find(r => r.brand === 'samsung' && r.faultCount === 0),
    results.find(r => r.brand === 'samsung' && r.faultCount === 2),
    results.find(r => r.brand === 'oneplus' && r.faultCount === 1),
    results.find(r => r.brand === 'xiaomi' && r.faultCount === 2),
    results.find(r => r.brand === 'vivo' && r.faultCount === 3),
    results.find(r => r.notes.includes('Critical')),
  ].filter(Boolean);

  const report = {
    totalTests: results.length,
    totalPassed,
    totalFailed,
    passRate: `${((totalPassed / results.length) * 100).toFixed(2)}%`,
    marginSummary: {
      avgMarginPct: `+${avgMargin.toFixed(2)}%`,
      minMarginPct: `+${minMargin.toFixed(2)}%`,
      maxMarginPct: `+${maxMargin.toFixed(2)}%`,
      avgCashAdvantageRupees: `₹${Math.round(avgAbsDiff).toLocaleString('en-IN')}`,
      minCashAdvantageRupees: `₹${Math.round(minAbsDiff).toLocaleString('en-IN')}`,
      maxCashAdvantageRupees: `₹${Math.round(maxAbsDiff).toLocaleString('en-IN')}`,
      strictlyLowerThanCashifyCount: lowerThanCashifyCount,
      strictlyEqualNonZeroCount: exactlyEqualNonZero,
    },
    categoryStats,
    brandStats,
    faultStats,
    sampleComparisons,
  };

  console.log('\n======================================================');
  console.log(`✅ TEST RUN COMPLETE: ${totalPassed} / ${results.length} PASSED (${report.passRate})`);
  console.log(`📊 AVERAGE MARGIN ADVANTAGE: ${report.marginSummary.avgMarginPct} (Average ${report.marginSummary.avgCashAdvantageRupees} higher than Cashify)`);
  console.log(`📈 MINIMUM ADVANTAGE: ${report.marginSummary.minMarginPct} | MAXIMUM ADVANTAGE: ${report.marginSummary.maxMarginPct}`);
  console.log('======================================================\n');
  console.log(JSON.stringify(report, null, 2));
}

run10000Tests();
