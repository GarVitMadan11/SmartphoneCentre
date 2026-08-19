import { calculateStage1Valuation, determineDeviceSegment } from './pricingEngine';
import type { Variant, DefectRule } from '../data/mockDatabase';

const makeVariant = (basePrice: number, storageGb = 256): Variant => ({
  id: 'var-test',
  modelId: 'mod-test',
  color: 'Standard',
  storageGb,
  basePrice
});

const makeDefect = (id: string, description: string, category: string, fixed = 0, pct = 0, critical = false): DefectRule => ({
  id,
  description,
  subText: 'Test subtext',
  category: category as any,
  deductionFixed: fixed,
  deductionPercentage: pct,
  isCriticalFailure: critical
});

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[TEST FAILED] ${message}`);
  }
}

export function runPricingEngineTests(): { passed: number; total: number } {
  let passed = 0;
  let total = 0;

  function runTest(name: string, fn: () => void) {
    total++;
    try {
      fn();
      passed++;
      console.log(`✓ PASS: ${name}`);
    } catch (err: any) {
      console.error(`✗ FAIL: ${name} -> ${err.message}`);
    }
  }

  console.log('=== Running Rephonix Stage 1 Pricing Engine Test Suite (20 Scenarios) ===');

  runTest('Test 1: Segment Determination for Apple and Android', () => {
    assert(determineDeviceSegment('brand-apple', 'iPhone 15 Pro Max') === 'apple_pro_max', 'iPhone 15 Pro Max segment');
    assert(determineDeviceSegment('brand-apple', 'iPhone 14 Pro') === 'apple_pro', 'iPhone 14 Pro segment');
    assert(determineDeviceSegment('brand-apple', 'iPhone 15') === 'apple_standard', 'iPhone 15 segment');
    assert(determineDeviceSegment('brand-apple', 'iPhone SE 2022') === 'apple_older_se', 'iPhone SE segment');
    assert(determineDeviceSegment('brand-samsung', 'Galaxy S24 Ultra') === 'android_ultra_premium', 'S24 Ultra segment');
    assert(determineDeviceSegment('brand-samsung', 'Galaxy S24+') === 'android_premium_flagship', 'S24+ segment');
    assert(determineDeviceSegment('brand-oneplus', 'OnePlus 12R') === 'android_upper_midrange', 'OnePlus 12R segment');
    assert(determineDeviceSegment('brand-xiaomi', 'Redmi Note 13 Pro') === 'android_midrange', 'Redmi Note segment');
    assert(determineDeviceSegment('brand-poco', 'Poco C65') === 'android_budget', 'Poco C65 segment');
  });

  runTest('Test 2: Apple Pro Max Excellent Condition (+3% vendor rule)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro Max',
      variant: makeVariant(100000),
      selectedDefects: [],
      simType: 'dual_sim'
    });
    assert(!res.isCritical, 'Not critical');
    assert(res.adjustedBenchmark === 100000, 'Adjusted benchmark equals 100,000');
    assert(res.auditTrail.vendorMultiplier === 1.03, 'Vendor multiplier is +3%');
    assert(res.finalPrice === 103000, 'Final price equals 103,000');
  });

  runTest('Test 3: Apple Pro Max Good Condition with minor scratch', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro Max',
      variant: makeVariant(90000),
      selectedDefects: [makeDefect('defect-screen-scratches', 'Front Glass Scratches', 'screen', 0, 0.04)]
    });
    assert(res.adjustedBenchmark === 86400, 'Benchmark 86,400');
    assert(res.auditTrail.vendorMultiplier === 1.03, '+3% multiplier');
    assert(res.finalPrice === 89000, 'Rounded final price 89,000');
  });

  runTest('Test 4: Low Battery Degradation', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro Max',
      variant: makeVariant(80000),
      selectedDefects: [makeDefect('defect-battery-low', 'Battery Health < 80%', 'connectivity', 2500, 0.05)]
    });
    assert(res.finalPrice > 0, 'Final offer > 0');
  });

  runTest('Test 5: Cracked Display Uses Model Repair Economics', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro Max',
      variant: makeVariant(100000),
      selectedDefects: [makeDefect('defect-screen-cracked', 'Cracked Screen', 'screen', 0, 0.28)]
    });
    assert(res.auditTrail.totalRepairCostDeductions === 14500, 'Display repair cost + risk = 14,500');
    assert(res.adjustedBenchmark === 85500, 'Adjusted benchmark 85,500');
  });

  runTest('Test 6: Single SIM and Imported Config Fixed Deductions', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-14pro',
      brandId: 'brand-apple',
      modelName: 'iPhone 14 Pro',
      variant: makeVariant(70000),
      selectedDefects: [],
      simType: 'single_sim',
      regionConfig: 'imported'
    });
    assert(res.auditTrail.totalFixedAdjustments === -2000, 'Fixed deductions sum -2,000');
    assert(res.adjustedBenchmark === 68000, 'Adjusted benchmark 68,000');
  });

  runTest('Test 7: Android Ultra Premium Excellent (+3% vendor rule)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-s24u',
      brandId: 'brand-samsung',
      modelName: 'Galaxy S24 Ultra',
      variant: makeVariant(85000),
      selectedDefects: []
    });
    assert(res.auditTrail.segment === 'android_ultra_premium', 'Segment ultra premium');
    assert(res.auditTrail.vendorMultiplier === 1.03, 'Multiplier 1.03');
  });

  runTest('Test 8: Android Flagship Fair Condition', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-s24',
      brandId: 'brand-samsung',
      modelName: 'Galaxy S24+',
      variant: makeVariant(60000),
      selectedDefects: [makeDefect('defect-body-scratched', 'Scuffed Frame', 'body', 0, 0.08)]
    });
    assert(res.finalPrice > 0, 'Final price > 0');
  });

  runTest('Test 9: Android Midrange Damaged (+2% vendor rule for <= 50k)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-redmi',
      brandId: 'brand-xiaomi',
      modelName: 'Redmi Note 13 Pro',
      variant: makeVariant(20000),
      selectedDefects: [makeDefect('defect-body-cracked', 'Dented Frame', 'body', 0, 0.15)]
    });
    assert(res.auditTrail.vendorMultiplier === 1.02, 'Multiplier +2%');
    assert(res.finalPrice > 0, 'Final price > 0');
  });

  runTest('Test 10: Android Budget Damaged Above Recycle Floor', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-poco',
      brandId: 'brand-poco',
      modelName: 'Poco C65',
      variant: makeVariant(8000),
      selectedDefects: [makeDefect('defect-body-cracked', 'Dented Frame', 'body', 0, 0.18)]
    });
    assert(res.auditTrail.vendorMultiplier === 1.02, 'Multiplier +2%');
    assert(res.finalPrice >= 500, 'Above recycle floor 500');
  });

  runTest('Test 11: Non-genuine Display Deduction', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-13',
      brandId: 'brand-apple',
      modelName: 'iPhone 13',
      variant: makeVariant(40000),
      selectedDefects: [makeDefect('defect-display-nongenuine', 'Non-Genuine Display Warning', 'screen', 0, 0.08)]
    });
    assert(res.finalPrice < 40000 * 1.02, 'Price reduced by non-genuine display');
  });

  runTest('Test 12: Face ID / Biometrics Failure', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-14pro',
      brandId: 'brand-apple',
      modelName: 'iPhone 14 Pro',
      variant: makeVariant(70000),
      selectedDefects: [makeDefect('defect-critical-security', 'Biometrics Faulty (Face ID)', 'functionality', 0, 0.20)]
    });
    assert(res.auditTrail.totalConditionDeductions === 14000, '20% deduction applied');
  });

  runTest('Test 13: Charging Port Failure', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-14',
      brandId: 'brand-apple',
      modelName: 'iPhone 14',
      variant: makeVariant(50000),
      selectedDefects: [makeDefect('defect-port-faulty', 'Charging Port Faulty', 'functionality', 1500, 0)]
    });
    assert(res.finalPrice > 0, 'Final offer > 0');
  });

  runTest('Test 14: Camera Assembly Failure', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15p',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro',
      variant: makeVariant(90000),
      selectedDefects: [makeDefect('defect-camera-faulty', 'Camera Faulty', 'camera', 1000, 0.06)]
    });
    assert(res.auditTrail.totalRepairCostDeductions === 5500, 'Apple Pro camera repair cost 5,500');
  });

  runTest('Test 15: Critical Boot Failure Blocks Offer', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15p',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro',
      variant: makeVariant(90000),
      selectedDefects: [makeDefect('defect-critical-power', 'Device Does Not Turn On', 'accessories', 0, 1.0, true)]
    });
    assert(res.isCritical === true, 'Is critical failure');
    assert(res.finalPrice === 0, 'Final price 0');
  });

  runTest('Test 16: Missing Accessories Fixed Deductions', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15',
      brandId: 'brand-apple',
      modelName: 'iPhone 15',
      variant: makeVariant(60000),
      selectedDefects: [
        makeDefect('defect-box-missing', 'Missing Box', 'accessories', 1200, 0),
        makeDefect('defect-charger-missing', 'Missing Charger', 'accessories', 1500, 0)
      ]
    });
    assert(res.auditTrail.totalFixedAdjustments === -2700, 'Fixed accessories deductions sum -2,700');
  });

  runTest('Test 17: Official Brand Warranty Bonus', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro Max',
      variant: makeVariant(100000),
      selectedDefects: [],
      warrantyAge: 'under_3m'
    });
    assert(res.auditTrail.totalWarrantyBonus === 3000, '3% bonus of 100,000 = 3,000');
    assert(res.adjustedBenchmark === 103000, 'Adjusted benchmark 103,000');
  });

  runTest('Test 18: Vendor Threshold EXACTLY ₹50,000 (+2% rule)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-test-50k',
      brandId: 'brand-samsung',
      modelName: 'Galaxy S23',
      variant: makeVariant(50000),
      selectedDefects: []
    });
    assert(res.adjustedBenchmark === 50000, 'Benchmark 50,000');
    assert(res.auditTrail.vendorMultiplier === 1.02, 'Multiplier +2%');
    assert(res.auditTrail.vendorMultiplierPercentage === '+2%', 'Percentage tag +2%');
    assert(res.finalPrice === 51000, '50,000 * 1.02 = 51,000');
  });

  runTest('Test 19: Vendor Threshold ₹50,001 (+3% rule)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-test-50k1',
      brandId: 'brand-samsung',
      modelName: 'Galaxy S23',
      variant: makeVariant(50001),
      selectedDefects: []
    });
    assert(res.adjustedBenchmark === 50001, 'Benchmark 50,001');
    assert(res.auditTrail.vendorMultiplier === 1.03, 'Multiplier +3%');
    assert(res.auditTrail.vendorMultiplierPercentage === '+3%', 'Percentage tag +3%');
    assert(res.finalPrice === 51500, '50,001 * 1.03 rounded = 51,500');
  });

  runTest('Test 20: Controlled Combined Rules for Multiple Defects', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro Max',
      variant: makeVariant(100000),
      selectedDefects: [
        makeDefect('defect-screen-cracked', 'Cracked Screen', 'screen', 0, 0.28),
        makeDefect('defect-screen-scratches', 'Glass Scratches', 'screen', 0, 0.04),
        makeDefect('defect-body-scratched', 'Scuffed Frame', 'body', 0, 0.06),
        makeDefect('defect-box-missing', 'Missing Box', 'accessories', 2500, 0)
      ],
      simType: 'single_sim'
    });
    assert(!res.isCritical, 'Not critical');
    assert(res.auditTrail.totalRepairCostDeductions === 14500, 'Repair cost applied');
    assert(res.finalPrice > 0, 'Final offer > 0');
  });

  console.log(`\n=== RESULTS: ${passed}/${total} TESTS PASSED ===`);
  return { passed, total };
}

// Auto-execute if run directly
const gProc = (globalThis as any).process;
if (typeof gProc !== 'undefined' && gProc.argv && gProc.argv[1]?.includes('pricingEngineTestRunner')) {
  runPricingEngineTests();
}
