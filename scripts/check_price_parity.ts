import { 
  MODELS, 
  generateVariantsForModel, 
  getDefectRulesForCategory, 
  isFoldableDevice,
  DefectRule,
} from '../src/data/mockDatabase.ts';
import { calculateValuation } from '../src/utils/valuation.ts';
import { roundToCleanIndianPrice } from '../src/utils/pricingEngine.ts';

interface ParityCheckResult {
  modelId: string;
  modelName: string;
  brand: string;
  category: string;
  isFoldable: boolean;
  storageGb: number;
  defectsCount: number;
  cashifyPrice: number;
  rephonixPrice: number;
  marginAdvantagePct: number;
  passed: boolean;
  notes: string;
}

export function runParityCheck(): { total: number; passed: number; failed: number; avgMarginPct: string; allPassed: boolean } {
  console.log('🔍 Running Rephonix vs Cashify Price Parity Verification Suite...\n');
  
  const results: ParityCheckResult[] = [];
  const testScenarios = [
    { label: 'Flawless Condition', defectsFilter: () => [] as DefectRule[] },
    { label: 'Minor Scratches', defectsFilter: (rules: DefectRule[]) => rules.filter(r => r.id === 'defect-screen-scratches') },
    { label: 'Screen Cracked', defectsFilter: (rules: DefectRule[]) => rules.filter(r => r.id === 'defect-screen-cracked') },
    { label: 'Battery Low + Dented Body', defectsFilter: (rules: DefectRule[]) => rules.filter(r => r.id === 'defect-battery-low' || r.id === 'defect-body-dented') },
    { label: 'Hinge Fault (Foldables)', defectsFilter: (rules: DefectRule[]) => rules.filter(r => r.id === 'defect-body-hinge') },
    { label: 'Crease Damage (Foldables)', defectsFilter: (rules: DefectRule[]) => rules.filter(r => r.id === 'defect-screen-crease') },
    { label: 'Critical Power Gate', defectsFilter: (rules: DefectRule[]) => rules.filter(r => r.id === 'defect-critical-power') },
  ];

  for (const model of MODELS) {
    const isFoldable = isFoldableDevice(model.brandId, model.name, model.id);
    const rules = getDefectRulesForCategory(model.category, model.brandId, model.name, model.id);
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

    const testVariant = variants[0]; // primary variant

    for (const scenario of testScenarios) {
      // Skip foldable-only tests on non-foldables
      if ((scenario.label.includes('Foldable') || scenario.label.includes('Hinge') || scenario.label.includes('Crease')) && !isFoldable) {
        continue;
      }

      const selectedDefects = scenario.defectsFilter(rules);
      if (scenario.label.includes('Foldable') && selectedDefects.length === 0) {
        continue;
      }

      const valuation = calculateValuation(testVariant, selectedDefects, {
        modelId: model.id,
        brandId: model.brandId,
        modelName: model.name,
        category: model.category,
        releaseYear: model.releaseYear,
      });

      const rephonixPrice = valuation.finalPrice;
      const isCritical = valuation.isCritical || selectedDefects.some(d => d.isCriticalFailure);

      let cashifyPrice = 0;
      if (!isCritical) {
        const rawBenchmark = valuation.auditTrail?.adjustedBenchmark ?? Math.round(testVariant.basePrice / 1.03);
        cashifyPrice = roundToCleanIndianPrice(rawBenchmark, 'clean_50');
      }

      let passed = false;
      let marginAdvantagePct = 0;

      if (isCritical) {
        passed = (rephonixPrice === 0 && cashifyPrice === 0);
      } else {
        marginAdvantagePct = cashifyPrice > 0 ? ((rephonixPrice - cashifyPrice) / cashifyPrice) * 100 : 0;
        // Invariant: Rephonix must beat Cashify (>= 1.8% accounting for minimum ₹50 roundings on sub-₹3000 legacy models)
        passed = (rephonixPrice > cashifyPrice) && (marginAdvantagePct >= 1.8);
      }

      results.push({
        modelId: model.id,
        modelName: model.name,
        brand: model.brandId.replace('brand-', ''),
        category: model.category,
        isFoldable,
        storageGb: testVariant.storageGb,
        defectsCount: selectedDefects.length,
        cashifyPrice,
        rephonixPrice,
        marginAdvantagePct: parseFloat(marginAdvantagePct.toFixed(2)),
        passed,
        notes: scenario.label,
      });
    }
  }

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const nonZero = results.filter(r => r.cashifyPrice > 0);
  const avgMargin = nonZero.length > 0 ? nonZero.reduce((s, r) => s + r.marginAdvantagePct, 0) / nonZero.length : 0;

  console.log(`======================================================`);
  console.log(`Total Parity Test Scenarios: ${total}`);
  console.log(`Passed: ${passed} | Failed: ${failed}`);
  console.log(`Pass Rate: ${((passed / total) * 100).toFixed(2)}%`);
  console.log(`Average Rephonix Margin Over Cashify: +${avgMargin.toFixed(2)}%`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    console.warn(`⚠️ Failed test sample (first 5):`);
    console.table(results.filter(r => !r.passed).slice(0, 5));
  } else {
    console.log(`✅ All ${total} price parity invariants passed cleanly!`);
  }

  return {
    total,
    passed,
    failed,
    avgMarginPct: `+${avgMargin.toFixed(2)}%`,
    allPassed: failed === 0
  };
}

// Direct CLI execution
if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}`) {
  const { allPassed } = runParityCheck();
  process.exit(allPassed ? 0 : 1);
}
