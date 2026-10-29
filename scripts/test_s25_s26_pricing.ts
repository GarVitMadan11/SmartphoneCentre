import { calculateStage1Valuation, PricingInput } from '../src/utils/pricingEngine.ts';
import { getDefectRulesForCategory, hasSpenSupport, isNoChargerDevice, Variant, DefectRule } from '../src/data/mockDatabase.ts';
import { DEFAULT_PRICING_RULES_CONFIG } from '../src/data/pricingRulesConfig.ts';

interface ModelTestCase {
  id: string;
  name: string;
  category: 'flagship' | 'premium';
  releaseYear: number;
  cashifyBase: number;
  storage: number;
  ram: number;
  hasSpen: boolean;
}

const S25_S26_MODELS: ModelTestCase[] = [
  { id: 'sam-s25', name: 'Galaxy S25', category: 'flagship', releaseYear: 2025, cashifyBase: 42000, storage: 256, ram: 12, hasSpen: false },
  { id: 'sam-s25plus', name: 'Galaxy S25 Plus', category: 'flagship', releaseYear: 2025, cashifyBase: 52000, storage: 256, ram: 12, hasSpen: false },
  { id: 'sam-s25u', name: 'Galaxy S25 Ultra', category: 'flagship', releaseYear: 2025, cashifyBase: 74500, storage: 256, ram: 12, hasSpen: true },
  { id: 'sam-s26', name: 'Galaxy S26', category: 'flagship', releaseYear: 2026, cashifyBase: 58000, storage: 256, ram: 12, hasSpen: false },
  { id: 'sam-s26plus', name: 'Galaxy S26 Plus', category: 'flagship', releaseYear: 2026, cashifyBase: 68000, storage: 256, ram: 12, hasSpen: false },
  { id: 'sam-s26u', name: 'Galaxy S26 Ultra', category: 'flagship', releaseYear: 2026, cashifyBase: 92000, storage: 256, ram: 12, hasSpen: true }
];

console.log('========================================================================');
console.log('   SAMSUNG GALAXY S25 & S26 SERIES COMPREHENSIVE PRICING ENGINE AUDIT   ');
console.log('========================================================================\n');

let totalTests = 0;
let passedTests = 0;
const failureLog: string[] = [];

function assert(condition: boolean, msg: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${msg}`);
  } else {
    failureLog.push(msg);
    console.error(`  [FAIL] ${msg}`);
  }
}

// ── 1. HARDWARE CAPABILITY AUDIT ─────────────────────────────────────────────
console.log('--> STEP 1: Hardware & Feature Capability Verification');
for (const model of S25_S26_MODELS) {
  const spenExpected = model.hasSpen;
  const spenActual = hasSpenSupport('brand-samsung', model.name, model.id);
  assert(spenActual === spenExpected, `${model.name}: hasSpenSupport expected ${spenExpected}, got ${spenActual}`);

  const noChargerActual = isNoChargerDevice('brand-samsung', model.name, model.id);
  assert(noChargerActual === true, `${model.name}: isNoChargerDevice correctly identifies modern flagship packaging`);
}

// ── 2. SCENARIO TESTING MATRIX ───────────────────────────────────────────────
console.log('\n--> STEP 2: Comprehensive Pricing Engine Valuation Scenarios');

for (const model of S25_S26_MODELS) {
  console.log(`\n── Testing Model: ${model.name} (${model.releaseYear}) | Benchmark: Rs. ${model.cashifyBase.toLocaleString('en-IN')} ──`);
  const mockVariant: Variant = {
    id: `var-${model.id}-256`,
    modelId: model.id,
    color: 'Titanium Gray',
    storageGb: model.storage,
    ramGb: model.ram,
    basePrice: model.cashifyBase
  };

  // Test 1: Flawless Mint Baseline (< 3m warranty)
  {
    const input: PricingInput = {
      modelId: model.id,
      brandId: 'brand-samsung',
      modelName: model.name,
      category: model.category,
      releaseYear: model.releaseYear,
      hasSpen: model.hasSpen,
      variant: mockVariant,
      warrantyAge: 'under_3m',
      deviceAge: 'under_3m',
      selectedDefects: []
    };
    const res = calculateStage1Valuation(input);
    const expectedCashify = model.cashifyBase;
    const rephonixPrice = res.finalPrice;
    assert(rephonixPrice >= expectedCashify, `[Mint Baseline] Rephonix Rs. ${rephonixPrice} >= Cashify Rs. ${expectedCashify} (+${rephonixPrice - expectedCashify})`);
    assert(res.auditTrail.fAge === 1.00, `[Mint Baseline] fAge is 1.00 for < 3m active flagship`);
    assert(res.auditTrail.segment === (model.hasSpen ? 'android_ultra_premium' : 'android_premium_flagship'), `[Mint Baseline] Segment classified as ${res.auditTrail.segment}`);
  }

  // Test 2: Out of Warranty (Active Flagship Tier 1 -> 20% OOW Deduction)
  {
    const input: PricingInput = {
      modelId: model.id,
      brandId: 'brand-samsung',
      modelName: model.name,
      category: model.category,
      releaseYear: model.releaseYear,
      hasSpen: model.hasSpen,
      variant: mockVariant,
      warrantyAge: 'out_of_warranty',
      deviceAge: 'out_of_warranty',
      selectedDefects: []
    };
    const res = calculateStage1Valuation(input);
    const cashifyOOW = Math.round(model.cashifyBase * 0.80);
    const rephonixPrice = res.finalPrice;
    assert(rephonixPrice >= cashifyOOW, `[Out of Warranty] Rephonix Rs. ${rephonixPrice} >= Cashify Rs. ${cashifyOOW} (+${rephonixPrice - cashifyOOW})`);
    assert(res.auditTrail.fAge === 0.80, `[Out of Warranty] fAge is exactly 0.80 (-20% active Tier 1 warranty decay)`);
  }

  // Test 3: Missing Bill / Invoice (Voids Warranty to 20% OOW, No Double Penalty)
  {
    const missingBillDefect: DefectRule = {
      id: 'defect-acc-nodocs',
      category: 'accessories',
      description: 'Missing Bill / Customer Photo ID',
      subText: 'Invoice missing',
      deductionFixed: 1500,
      deductionPercentage: 0
    };
    const input: PricingInput = {
      modelId: model.id,
      brandId: 'brand-samsung',
      modelName: model.name,
      category: model.category,
      releaseYear: model.releaseYear,
      hasSpen: model.hasSpen,
      variant: mockVariant,
      warrantyAge: 'under_3m', // Customer claims under 3m, but bill is missing
      deviceAge: 'under_3m',
      selectedDefects: [missingBillDefect]
    };
    const res = calculateStage1Valuation(input);
    const cashifyVoided = Math.round(model.cashifyBase * 0.80);
    const rephonixPrice = res.finalPrice;
    assert(res.auditTrail.fAge === 0.80, `[Missing Bill] Voids warranty to fAge = 0.80`);
    assert(res.auditTrail.dAccessories === 0, `[Missing Bill] dAccessories is Rs. 0 (no duplicate Rs. 1500 deduction)`);
    assert(rephonixPrice >= cashifyVoided, `[Missing Bill] Rephonix Rs. ${rephonixPrice} >= Cashify Rs. ${cashifyVoided}`);
  }

  // Test 4: Android Battery Degradation (Should have Rs. 0 deduction)
  {
    const rules = getDefectRulesForCategory(model.category, 'brand-samsung', model.name, model.id);
    const batteryDefects = rules.filter(r => r.id.includes('battery'));
    assert(batteryDefects.length === 0, `[Battery Rules] Samsung Galaxy models receive zero battery health deductions in diagnostic rules (rules count: ${batteryDefects.length})`);

    // Even if an external battery defect is submitted:
    const mockBatteryDefect: DefectRule = {
      id: 'defect-battery-low',
      category: 'functionality',
      description: 'Battery Health Below 80%',
      subText: 'Service recommended',
      deductionFixed: 0,
      deductionPercentage: 0 // Android 0%
    };
    const input: PricingInput = {
      modelId: model.id,
      brandId: 'brand-samsung',
      modelName: model.name,
      category: model.category,
      releaseYear: model.releaseYear,
      hasSpen: model.hasSpen,
      variant: mockVariant,
      warrantyAge: 'under_3m',
      deviceAge: 'under_3m',
      selectedDefects: [mockBatteryDefect]
    };
    const res = calculateStage1Valuation(input);
    assert(res.auditTrail.fBattery === 1.00, `[Battery Valuation] fBattery is 1.00 (Rs. 0 deducted for Android battery)`);
  }

  // Test 5: S-Pen Stylus Missing (Only for Ultra models)
  if (model.hasSpen) {
    const spenDefect: DefectRule = {
      id: 'defect-spen-missing',
      category: 'accessories',
      description: 'Missing Original S-Pen',
      subText: 'Stylus missing',
      deductionFixed: 2000,
      deductionPercentage: 0
    };
    const input: PricingInput = {
      modelId: model.id,
      brandId: 'brand-samsung',
      modelName: model.name,
      category: model.category,
      releaseYear: model.releaseYear,
      hasSpen: model.hasSpen,
      variant: mockVariant,
      warrantyAge: 'under_3m',
      deviceAge: 'under_3m',
      selectedDefects: [spenDefect]
    };
    const res = calculateStage1Valuation(input);
    const cashifyWithSpenMissing = model.cashifyBase - 2000;
    assert(res.auditTrail.dAccessories === 2000, `[S-Pen Missing] S-Pen deduction is Rs. 2,000`);
    assert(res.finalPrice >= cashifyWithSpenMissing, `[S-Pen Missing] Rephonix Rs. ${res.finalPrice} >= Cashify Rs. ${cashifyWithSpenMissing}`);
  }

  // Test 6: Screen Glass Cracked (-28% factor)
  {
    const screenCrackDefect: DefectRule = {
      id: 'defect-screen-cracked',
      category: 'screen',
      description: 'Screen Glass Cracked',
      subText: 'Front glass broken',
      deductionFixed: 0,
      deductionPercentage: 0.28
    };
    const input: PricingInput = {
      modelId: model.id,
      brandId: 'brand-samsung',
      modelName: model.name,
      category: model.category,
      releaseYear: model.releaseYear,
      hasSpen: model.hasSpen,
      variant: mockVariant,
      warrantyAge: 'under_3m',
      deviceAge: 'under_3m',
      selectedDefects: [screenCrackDefect]
    };
    const res = calculateStage1Valuation(input);
    const cashifyScreenCrack = Math.round(model.cashifyBase * 0.72);
    assert(res.finalPrice >= cashifyScreenCrack, `[Screen Cracked] Rephonix Rs. ${res.finalPrice} >= Cashify Rs. ${cashifyScreenCrack} (+${res.finalPrice - cashifyScreenCrack})`);
  }

  // Test 7: Multi-Fault Combination (Minor Dents + Out of Warranty + Missing Box)
  {
    const dentDefect: DefectRule = {
      id: 'defect-body-dent',
      category: 'body',
      description: 'Minor Body Dents',
      subText: '1-2 minor dents',
      deductionFixed: 0,
      deductionPercentage: 0.08
    };
    const missingBoxDefect: DefectRule = {
      id: 'defect-acc-box',
      category: 'accessories',
      description: 'Missing Original Box',
      subText: 'Packaging not included',
      deductionFixed: 800,
      deductionPercentage: 0
    };
    const input: PricingInput = {
      modelId: model.id,
      brandId: 'brand-samsung',
      modelName: model.name,
      category: model.category,
      releaseYear: model.releaseYear,
      hasSpen: model.hasSpen,
      variant: mockVariant,
      warrantyAge: 'out_of_warranty',
      deviceAge: 'out_of_warranty',
      selectedDefects: [dentDefect, missingBoxDefect]
    };
    const res = calculateStage1Valuation(input);
    // Cashify benchmark calculation: Base * 0.80 (OOW) * 0.92 (Dent) - 800 (Box)
    const cashifyMultiFault = Math.round(model.cashifyBase * 0.80 * 0.92) - 800;
    assert(res.finalPrice >= cashifyMultiFault, `[Multi-Fault Combo] Rephonix Rs. ${res.finalPrice} >= Cashify Rs. ${cashifyMultiFault} (+${res.finalPrice - cashifyMultiFault})`);
  }
}

console.log('\n========================================================================');
console.log(`AUDIT RESULTS: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests/totalTests)*100).toFixed(2)}%)`);
if (failureLog.length > 0) {
  console.log('FAILURES:');
  failureLog.forEach(f => console.log('  - ' + f));
} else {
  console.log('SUCCESS: All Samsung Galaxy S25 & S26 series phones pass 100% of pricing engine checks!');
}
console.log('========================================================================\n');
