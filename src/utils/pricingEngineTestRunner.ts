import { calculateStage1Valuation, determineDeviceSegment } from './pricingEngine.ts';
import type { Variant, DefectRule } from '../data/mockDatabase.ts';

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

  runTest('Test 2: Apple Pro Max Excellent Condition under 3m age (+3% vendor rule)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro Max',
      variant: makeVariant(100000),
      selectedDefects: [],
      deviceAge: 'under_3m',
      marketDemand: 'high',
      variantType: 'indian'
    });
    assert(!res.isCritical, 'Not critical');
    assert(res.auditTrail.fAge === 1.00, 'Age factor 1.00');
    assert(res.auditTrail.fMarket === 1.00, 'Market factor 1.00');
    assert(res.auditTrail.fVariant === 1.00, 'Variant factor 1.00');
    assert(res.adjustedBenchmark === 100000, 'Adjusted benchmark equals 100,000');
    assert(res.auditTrail.vendorMultiplier === 1.03, 'Vendor multiplier is +3%');
    assert(res.finalPrice === 103000, 'Final price equals 103,000');
  });

  runTest('Test 3: Apple Pro Max with 1-2 Year Age Factor (0.88)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro Max',
      variant: makeVariant(100000),
      selectedDefects: [],
      deviceAge: '1_to_2y'
    });
    assert(res.auditTrail.fAge === 0.88, 'Age factor 0.88 for 1-2 years');
    assert(res.adjustedBenchmark === 88000, 'Pre-vendor benchmark 88,000');
    assert(res.finalPrice === roundToCleanIndianPrice(88000 * 1.03), 'Final offer matches vendor calculation');
  });

  runTest('Test 4: Severity Group B Deduplication (Screen Scratches vs Cracked Glass)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro Max',
      variant: makeVariant(100000),
      selectedDefects: [
        makeDefect('defect-screen-scratches', 'Front Glass Scratches', 'screen', 0, 0.04),
        makeDefect('defect-screen-cracked', 'Cracked Screen', 'screen', 0, 0.28)
      ],
      deviceAge: 'under_3m'
    });
    // In Group B (Display), only the worst defect factor (1 - 0.28 = 0.72) is used (deduplicated)
    assert(res.auditTrail.fDisplay === 0.72, 'Display factor picks worst defect (0.72)');
    assert(res.auditTrail.preAccessoryValue === 72000, 'Pre-accessory value 72,000');
  });

  runTest('Test 5: Multiplicative Stacking Across Cosmetic, Display, and Battery Groups', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro Max',
      variant: makeVariant(100000),
      selectedDefects: [
        makeDefect('defect-body-scratched', 'Minor Body Scratches', 'body', 0, 0.04),
        makeDefect('defect-screen-cracked', 'Cracked Screen', 'screen', 0, 0.28),
        makeDefect('defect-battery-low', 'Battery Health < 80%', 'functionality', 0, 0.05)
      ],
      deviceAge: 'under_3m'
    });
    // fCosmetic = 0.96, fDisplay = 0.72, fBattery = 0.95
    // fCondition = 0.96 * 0.72 * 0.95 = 0.65664
    const expectedVal = Math.round(100000 * 0.96 * 0.72 * 0.95);
    assert(res.auditTrail.preAccessoryValue === expectedVal, `Pre-accessory value matches multiplicative score (${expectedVal})`);
  });

  runTest('Test 6: Accessory Deduction Capping (Max 10% of Base Benchmark)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15',
      brandId: 'brand-apple',
      modelName: 'iPhone 15',
      variant: makeVariant(60000),
      selectedDefects: [
        makeDefect('defect-box-missing', 'Missing Box', 'accessories', 3000, 0),
        makeDefect('defect-charger-missing', 'Missing Charger', 'accessories', 2500, 0),
        makeDefect('defect-invoice-missing', 'Missing Invoice', 'accessories', 2000, 0)
      ],
      deviceAge: 'under_3m'
    });
    // Total raw accessory deductions = 3000 + 2500 + 2000 = 7500
    // Capped at 10% of 60,000 = 6000
    assert(res.auditTrail.dAccessories === 7500, 'Raw accessories deduction is 7,500');
    assert(res.auditTrail.dAccessoriesCapped === 6000, 'Capped accessories deduction is 6,000');
    assert(res.adjustedBenchmark === 54000, 'Pre-vendor benchmark equals 60,000 - 6,000 = 54,000');
  });

  runTest('Test 7: Imported US eSIM-Only Variant Factor (0.88)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-14pro',
      brandId: 'brand-apple',
      modelName: 'iPhone 14 Pro',
      variant: makeVariant(70000),
      selectedDefects: [],
      variantType: 'imported_esim_only',
      deviceAge: 'under_3m'
    });
    assert(res.auditTrail.fVariant === 0.88, 'Variant factor 0.88 for imported eSIM-only');
    assert(res.auditTrail.preAccessoryValue === Math.round(70000 * 0.88), 'Pre-accessory value reflects 0.88 variant factor');
  });

  runTest('Test 8: Market Demand Factor Weak Demand (0.92)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-s22',
      brandId: 'brand-samsung',
      modelName: 'Galaxy S22',
      variant: makeVariant(30000),
      selectedDefects: [],
      marketDemand: 'weak',
      deviceAge: 'under_3m'
    });
    assert(res.auditTrail.fMarket === 0.92, 'Market factor 0.92 for weak demand');
    assert(res.auditTrail.preAccessoryValue === Math.round(30000 * 0.92), 'Value reflects weak demand factor');
  });

  runTest('Test 9: Android Midrange Damaged (+2% vendor rule for <= 50k)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-redmi',
      brandId: 'brand-xiaomi',
      modelName: 'Redmi Note 13 Pro',
      variant: makeVariant(20000),
      selectedDefects: [makeDefect('defect-body-cracked', 'Dented Frame', 'body', 0, 0.15)],
      deviceAge: 'under_3m'
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
      selectedDefects: [makeDefect('defect-body-cracked', 'Dented Frame', 'body', 0, 0.18)],
      deviceAge: 'under_3m'
    });
    assert(res.auditTrail.vendorMultiplier === 1.02, 'Multiplier +2%');
    assert(res.finalPrice >= 500, 'Above recycle floor 500');
  });

  runTest('Test 11: Non-genuine Display Deduction in Group B', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-13',
      brandId: 'brand-apple',
      modelName: 'iPhone 13',
      variant: makeVariant(40000),
      selectedDefects: [makeDefect('defect-display-nongenuine', 'Non-Genuine Display Warning', 'screen', 0, 0.25)],
      deviceAge: 'under_3m'
    });
    assert(res.auditTrail.fDisplay === 0.75, 'Display factor 0.75 for non-genuine display');
  });

  runTest('Test 12: Biometrics / Face ID Functional Deduction in Group C', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-14pro',
      brandId: 'brand-apple',
      modelName: 'iPhone 14 Pro',
      variant: makeVariant(70000),
      selectedDefects: [makeDefect('defect-critical-security', 'Biometrics Faulty (Face ID)', 'functionality', 0, 0.20)],
      deviceAge: 'under_3m'
    });
    assert(res.auditTrail.fFunctional === 0.80, 'Functional factor 0.80 for biometrics failure');
  });

  runTest('Test 13: Charging Port Failure in Group C', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-14',
      brandId: 'brand-apple',
      modelName: 'iPhone 14',
      variant: makeVariant(50000),
      selectedDefects: [makeDefect('defect-port-faulty', 'Charging Port Faulty', 'functionality', 1500, 0.10)],
      deviceAge: 'under_3m'
    });
    assert(res.auditTrail.fFunctional === 0.90, 'Functional factor 0.90 for charging port failure');
  });

  runTest('Test 14: Camera Assembly Failure in Group C', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15p',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro',
      variant: makeVariant(90000),
      selectedDefects: [makeDefect('defect-camera-faulty', 'Camera Faulty', 'camera', 0, 0.15)],
      deviceAge: 'under_3m'
    });
    assert(res.auditTrail.fFunctional === 0.85, 'Functional factor 0.85 for camera fault');
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

  runTest('Test 16: Missing Accessories Fixed Deductions (Uncapped under 10%)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15',
      brandId: 'brand-apple',
      modelName: 'iPhone 15',
      variant: makeVariant(60000),
      selectedDefects: [
        makeDefect('defect-box-missing', 'Missing Box', 'accessories', 1200, 0),
        makeDefect('defect-charger-missing', 'Missing Charger', 'accessories', 1500, 0)
      ],
      deviceAge: 'under_3m'
    });
    assert(res.auditTrail.dAccessoriesCapped === 2700, 'Accessories deduction sum 2,700');
  });

  runTest('Test 17: Carrier Locked Variant Factor (0.75)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro Max',
      variant: makeVariant(100000),
      selectedDefects: [],
      variantType: 'carrier_locked',
      deviceAge: 'under_3m'
    });
    assert(res.auditTrail.fVariant === 0.75, 'Variant factor 0.75 for carrier locked');
    assert(res.adjustedBenchmark === 75000, 'Benchmark 75,000');
  });

  runTest('Test 18: Vendor Threshold EXACTLY ₹50,000 (+2% rule)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-test-50k',
      brandId: 'brand-samsung',
      modelName: 'Galaxy S23',
      variant: makeVariant(50000),
      selectedDefects: [],
      deviceAge: 'under_3m'
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
      selectedDefects: [],
      deviceAge: 'under_3m'
    });
    assert(res.adjustedBenchmark === 50001, 'Benchmark 50,001');
    assert(res.auditTrail.vendorMultiplier === 1.03, 'Multiplier +3%');
    assert(res.auditTrail.vendorMultiplierPercentage === '+3%', 'Percentage tag +3%');
    assert(res.finalPrice === 51500, '50,001 * 1.03 rounded = 51,500');
  });

  runTest('Test 20: Full User Case Study Example (iPhone 15 Pro 256GB)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15p',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro',
      variant: makeVariant(65000),
      selectedDefects: [
        makeDefect('defect-body-scratched', 'Minor Body Scratches', 'body', 0, 0.04),
        makeDefect('defect-screen-cracked', 'Cracked Screen', 'screen', 0, 0.25),
        makeDefect('defect-battery-light', 'Battery Health 86%', 'functionality', 0, 0.03),
        makeDefect('defect-charger-missing', 'Missing Charger', 'accessories', 1500, 0)
      ],
      deviceAge: '6_to_12m',
      marketDemand: 'high',
      variantType: 'indian'
    });
    // B = 65000, fAge = 0.94, fMarket = 1.00, fVariant = 1.00
    // fCosmetic = 0.96, fDisplay = 0.75, fBattery = 0.97 -> fCondition = 0.96 * 0.75 * 0.97 = 0.6984
    // preAccessoryValue = Math.round(65000 * 0.94 * 1.00 * 0.6984 * 1.00) = 42672
    // dAccessories = 1500
    // pre-vendor adjustedBenchmark = 42672 - 1500 = 41172
    // vendorMultiplier = 1.02 (<= 50,000) -> 41172 * 1.02 = 41995.44 -> clean_50 rounded = 42000
    assert(!res.isCritical, 'Not critical');
    assert(res.auditTrail.fAge === 0.94, 'fAge 0.94');
    assert(res.auditTrail.preAccessoryValue === 42672, 'preAccessoryValue matches calculation');
    assert(res.finalPrice === 42000, 'Final price matches 42,000');
  });

  console.log(`\n=== RESULTS: ${passed}/${total} TESTS PASSED ===`);
  return { passed, total };
}

function roundToCleanIndianPrice(amount: number): number {
  if (amount <= 0) return 0;
  return Math.round(amount / 50) * 50;
}

// Auto-execute if run directly
const gProc = (globalThis as any).process;
if (typeof gProc !== 'undefined' && gProc.argv && gProc.argv[1]?.includes('pricingEngineTestRunner')) {
  runPricingEngineTests();
}

