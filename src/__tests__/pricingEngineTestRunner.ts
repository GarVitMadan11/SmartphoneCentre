import { calculateStage1Valuation, determineDeviceSegment } from '../utils/pricingEngine.ts';
import { getBiometricType, getDefectRulesForCategory } from '../data/mockDatabase.ts';
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

  runTest('Test 3: Apple Pro Max with Out of Warranty Age Factor (0.80)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-15pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro Max',
      variant: makeVariant(100000),
      selectedDefects: [],
      deviceAge: 'out_of_warranty'
    });
    assert(res.auditTrail.fAge === 0.80, 'Age factor 0.80 for out of warranty');
    assert(res.adjustedBenchmark === 80000, 'Pre-vendor benchmark 80,000');
    assert(res.finalPrice === roundToCleanIndianPrice(80000 * 1.03), 'Final offer matches vendor calculation');
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

  runTest('Test 9: Android Midrange Damaged (Option A Tiered Vendor Rule: +2.5%)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-redmi',
      brandId: 'brand-xiaomi',
      modelName: 'Redmi Note 13 Pro',
      variant: makeVariant(20000),
      selectedDefects: [makeDefect('defect-body-cracked', 'Dented Frame', 'body', 0, 0.15)],
      deviceAge: 'under_3m'
    });
    assert(res.auditTrail.vendorMultiplier === 1.025, 'Multiplier +2.5% for minor defect band');
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
    assert(res.auditTrail.vendorMultiplier === 1.025, 'Multiplier +2.5%');
    assert(res.finalPrice >= 1200, 'Above recycle floor 1200');
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

  runTest('Test 18: Vendor Multiplier Uniform (+3% rule)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-test-50k',
      brandId: 'brand-samsung',
      modelName: 'Galaxy S23',
      variant: makeVariant(50000),
      selectedDefects: [],
      deviceAge: 'under_3m'
    });
    assert(res.adjustedBenchmark === 50000, 'Benchmark 50,000');
    assert(res.auditTrail.vendorMultiplier === 1.03, 'Multiplier +3%');
    assert(res.auditTrail.vendorMultiplierPercentage === '+3%', 'Percentage tag +3%');
    assert(res.finalPrice === 51500, '50,000 * 1.03 = 51,500');
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
    assert(!res.isCritical, 'Not critical');
    assert(res.auditTrail.fAge === 0.94, 'fAge 0.94');
    assert(res.auditTrail.preAccessoryValue === 42672, 'preAccessoryValue matches calculation');
    assert(res.auditTrail.vendorMultiplier === 1.02, 'Tiered multiplier +2% for heavy defect');
    assert(res.finalPrice === 42000, 'Final price matches 42,000 (+2% tiered vendor multiplier)');
  });

  runTest('Test 21: Samsung Galaxy Ultra with Missing S-Pen Stylus (-₹2,000)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-s24u',
      brandId: 'brand-samsung',
      modelName: 'Galaxy S24 Ultra',
      category: 'flagship',
      releaseYear: 2024,
      hasSpen: true,
      variant: makeVariant(60000),
      selectedDefects: [
        makeDefect('defect-spen-missing', 'Missing Original S-Pen Stylus', 'accessories', 2000, 0)
      ],
      warrantyAge: 'under_3m'
    });
    assert(!res.isCritical, 'Not critical');
    assert(res.auditTrail.dAccessoriesCapped === 2000, 'S-Pen deducted exactly 2,000');
    assert(res.adjustedBenchmark === 58000, 'Benchmark after S-Pen deduction is 58,000');
    // 58,000 * 1.03 vendor multiplier = 59,740 -> clean 50 = 59,750
    assert(res.finalPrice === 59750, 'Final price matches vendor premium above Cashify');
  });

  runTest('Test 22: Tier 2 Matured Cycle (iPhone 13 Pro) Zero Warranty Penalty', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-13p',
      brandId: 'brand-apple',
      modelName: 'iPhone 13 Pro',
      releaseYear: 2021,
      variant: makeVariant(31000),
      selectedDefects: [],
      warrantyAge: 'out_of_warranty'
    });
    assert(res.auditTrail.fAge === 1.00, 'Tier 2 matured model receives 1.00 (0% warranty penalty)');
    // 31,000 * 1.03 vendor multiplier = 31,930 -> clean 50 = 31,950
    assert(res.finalPrice === 31950, 'Tier 2 quote is higher than Cashify (+3% edge)');
  });

  runTest('Test 23: Biometrics Dynamic Hardware Rule Detection (Face ID vs Touch ID vs Android)', () => {
    // 1. iPhone 16 Pro Max has Face ID
    const appleBio = getBiometricType('brand-apple', 'iPhone 16 Pro Max');
    assert(appleBio === 'face_id', 'iPhone 16 Pro Max detects face_id');
    const appleRules = getDefectRulesForCategory('flagship', 'brand-apple', 'iPhone 16 Pro Max');
    const appleDefect = appleRules.find(r => r.id === 'defect-critical-security');
    assert(appleDefect?.description === 'Biometrics Faulty (Face ID)', 'Apple modern rule has Face ID label');

    // 2. iPhone SE 2022 has Touch ID
    const seBio = getBiometricType('brand-apple', 'iPhone SE 2022');
    assert(seBio === 'touch_id', 'iPhone SE detects touch_id');
    const seRules = getDefectRulesForCategory('midrange', 'brand-apple', 'iPhone SE 2022');
    const seDefect = seRules.find(r => r.id === 'defect-critical-security');
    assert(seDefect?.description === 'Biometrics Faulty (Touch ID)', 'iPhone SE rule has Touch ID label');

    // 3. Samsung Galaxy S24 Ultra has in-display fingerprint
    const samBio = getBiometricType('brand-samsung', 'Galaxy S24 Ultra');
    assert(samBio === 'fingerprint', 'Samsung Galaxy S24 Ultra detects fingerprint');
    const samRules = getDefectRulesForCategory('flagship', 'brand-samsung', 'Galaxy S24 Ultra');
    const samDefect = samRules.find(r => r.id === 'defect-critical-security');
    assert(samDefect?.description === 'Biometrics Faulty (Fingerprint / Face Unlock)', 'Android rule has Fingerprint label');
  });

  runTest('Test 24: Multiple Faults Stacking Parity (+2.5% Tiered Invariant Preserved)', () => {
    // iPhone 16 Pro Max with multiple faults: Speaker + Mic + Vibrator (Cashify Quote: 78,380)
    const res = calculateStage1Valuation({
      modelId: 'mod-16pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 16 Pro Max',
      category: 'flagship',
      releaseYear: 2024,
      variant: makeVariant(82080),
      selectedDefects: [
        makeDefect('defect-func-speaker', 'Speaker Faulty', 'functionality', 2500, 0),
        makeDefect('defect-func-mic', 'Microphone not working', 'functionality', 600, 0),
        makeDefect('defect-func-vibrator', 'Vibrator is not working', 'functionality', 600, 0)
      ],
      warrantyAge: 'under_3m'
    });
    assert(!res.isCritical, 'Not critical');
    assert(res.finalPrice > 78380, 'Rephonix multi-fault quote strictly higher than Cashify (78,380)');
    assert(res.auditTrail.vendorMultiplier === 1.025, 'Maintains +2.5% tiered multiplier on minor defect');
    assert(res.finalPrice >= 80300, 'Guarantees ~+Rs 1,970 difference above Cashify');
  });

  runTest('Test 25: Battery Health 80% – 85% Mild Degradation Rule', () => {
    // Apple iPhone 15 Pro with Battery Health 80-85% (Cashify: 58,060)
    const res = calculateStage1Valuation({
      modelId: 'mod-15p',
      brandId: 'brand-apple',
      modelName: 'iPhone 15 Pro',
      category: 'flagship',
      releaseYear: 2023,
      variant: makeVariant(59260),
      selectedDefects: [
        makeDefect('defect-battery-80-85', 'Battery Health 80% – 85%', 'connectivity', 1000, 0.02)
      ],
      warrantyAge: 'under_3m'
    });
    assert(!res.isCritical, 'Not critical');
    assert(res.auditTrail.fBattery === 0.98, 'Battery factor 0.98 for 80-85% health');
    assert(res.finalPrice > 58060, 'Rephonix quote strictly higher than Cashify (58,060)');
    assert(res.auditTrail.vendorMultiplier === 1.03, 'Vendor multiplier is +3% for near-mint / fCondition >= 0.98');
  });

  runTest('Test 26: iPhone 16 Pro Out of Warranty Receives 20% Penalty (fAge === 0.80)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-16p',
      brandId: 'brand-apple',
      modelName: 'iPhone 16 Pro',
      releaseYear: 2024,
      variant: makeVariant(75705),
      selectedDefects: [],
      warrantyAge: 'out_of_warranty',
      deviceAge: 'out_of_warranty'
    });
    assert(!res.isCritical, 'Not critical');
    assert(res.auditTrail.fAge === 0.80, 'Age factor is 0.80 (20% out-of-warranty penalty)');
    assert(res.adjustedBenchmark === Math.round(75705 * 0.80), 'Benchmark reflects 20% warranty deduction');
    assert(res.finalPrice === roundToCleanIndianPrice(Math.round(75705 * 0.80 * 1.03)), 'Offer preserves +3% vendor edge over Cashify');
  });

  runTest('Test 27: Screen Burn-in Panel Replacement Benchmark (+2% Tiered Edge)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-18pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 18 Pro Max',
      category: 'flagship',
      releaseYear: 2025,
      variant: makeVariant(100000),
      selectedDefects: [
        makeDefect('defect-screen-burn', 'Screen Burn-in / Lines', 'screen', 0, 0.28)
      ],
      warrantyAge: 'under_3m',
      deviceAge: 'under_3m'
    });
    assert(!res.isCritical, 'Not critical');
    assert(res.auditTrail.fDisplay === 0.72, 'fDisplay is 0.72 (28% panel replacement deduction)');
    assert(res.adjustedBenchmark === 72000, 'Benchmark is 72,000');
    assert(res.auditTrail.vendorMultiplier === 1.02, 'Tiered vendor multiplier is 1.02 for heavy defect');
    assert(res.finalPrice === 73450, 'Offer provides +2% vendor edge (73,450)');
  });

  runTest('Test 28: Battery Health < 80% / Service Alert on Flagship (8% Deduction, Retains ~92%)', () => {
    const res = calculateStage1Valuation({
      modelId: 'mod-18pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 18 Pro Max',
      variant: makeVariant(100000),
      selectedDefects: [
        makeDefect('defect-battery-low', 'Battery Health < 80% or Service Alert', 'connectivity', 3500, 0.08)
      ],
      warrantyAge: 'under_3m',
      deviceAge: 'under_3m'
    });
    assert(!res.isCritical, 'Not critical');
    assert(Math.round(res.auditTrail.fBattery * 100) === 92, 'Battery factor is 0.92 (8% deduction)');
    assert(res.adjustedBenchmark === 92000, 'Benchmark is 92,000 (92% retention)');
    assert(res.auditTrail.vendorMultiplier === 1.025, 'Tiered vendor multiplier is 1.025');
    assert(res.finalPrice === 94300, 'Final price preserves +2.5% vendor edge (94,300)');
  });

  runTest('Test 29: Screen Defect Deduplication (Cracked Panel Absorbs Scratches)', () => {
    // When both screen cracked (28%) and screen scratches (3%) are selected, scratches are absorbed
    const resWithBoth = calculateStage1Valuation({
      modelId: 'mod-16pm',
      brandId: 'brand-apple',
      modelName: 'iPhone 16 Pro Max',
      category: 'flagship',
      releaseYear: 2024,
      variant: makeVariant(100000),
      selectedDefects: [
        makeDefect('defect-screen-cracked', 'Cracked Front Screen Glass', 'screen', 0, 0.28),
        makeDefect('defect-screen-scratches', 'Front Glass Scratches', 'screen', 1000, 0.03)
      ],
      warrantyAge: 'under_3m'
    });
    // fDisplay must be exactly 0.72 (28% deduction for screen replacement), scratches waived
    assert(Math.round(resWithBoth.auditTrail.fDisplay * 100) === 72, 'Screen panel replacement absorbs scratches (fDisplay = 0.72)');
    assert(resWithBoth.adjustedBenchmark === 72000, 'Benchmark reflects exact 28% panel replacement deduction');
    assert(resWithBoth.auditTrail.vendorMultiplier === 1.02, 'Tiered vendor multiplier is 1.02 for heavy defect');
    assert(resWithBoth.finalPrice === 73450, 'Final price preserves +2% edge (73,450)');
  });

  runTest('Test 30: Missing Purchase Bill Automatically Drops Warranty to Out-of-Warranty', () => {
    // Customer selected "under_3m" but has missing bill -> drops to out_of_warranty (0.80 for Tier 1)
    const res = calculateStage1Valuation({
      modelId: 'mod-16p',
      brandId: 'brand-apple',
      modelName: 'iPhone 16 Pro',
      category: 'flagship',
      releaseYear: 2024,
      variant: makeVariant(100000),
      selectedDefects: [
        makeDefect('defect-acc-nodocs', 'Missing Bill / Customer Photo ID', 'accessories', 1500, 0)
      ],
      warrantyAge: 'under_3m',
      deviceAge: 'under_3m'
    });
    assert(res.auditTrail.fAge === 0.80, 'Missing bill drops age factor to out_of_warranty (0.80)');
    // Pre-accessory value: 100,000 * 0.80 = 80,000. Less accessory deduction 1,500 = 78,500
    assert(res.adjustedBenchmark === 78500, 'Benchmark reflects out_of_warranty + missing bill deduction');
    assert(res.finalPrice === roundToCleanIndianPrice(78500 * 1.03), 'Final offer provides strict +3% above Cashify');
  });

  runTest('Test 31: Smart Charger Exemption for iPhone 12+ (Cable-only Deduction)', () => {
    const rules16 = getDefectRulesForCategory('flagship', 'brand-apple', 'iPhone 16 Pro Max');
    const chargerRule16 = rules16.find(r => r.id === 'defect-charger-missing');
    assert(chargerRule16?.description === 'Missing Original Charging Cable', 'Modern iPhone detects in-box cable only');
    assert(chargerRule16?.deductionFixed === 500, 'Modern iPhone only deducts ₹500 for missing cable');

    const rulesOlder = getDefectRulesForCategory('midrange', 'brand-apple', 'iPhone 11');
    const chargerRuleOlder = rulesOlder.find(r => r.id === 'defect-charger-missing');
    assert(chargerRuleOlder?.description === 'Missing Original Charger / Cable', 'Older iPhone detects charger adapter');
    assert(chargerRuleOlder?.deductionFixed === 1000, 'Older phone deducts adapter fee');
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
