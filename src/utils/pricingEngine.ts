import type { Variant, DefectRule } from '../data/mockDatabase.ts';
import { 
  DeviceSegment, 
  DEFAULT_PRICING_RULES_CONFIG, 
  PricingRulesConfig,
  AgeFactorKey,
  MarketDemandKey,
  VariantFactorKey
} from '../data/pricingRulesConfig.ts';

export function isAppleBrand(brandId: string, modelName: string): boolean {
  if (brandId === 'brand-apple' || brandId.toLowerCase().includes('apple')) return true;
  if (modelName.toLowerCase().includes('iphone') || modelName.toLowerCase().includes('apple')) return true;
  return false;
}

export interface PricingInput {
  modelId: string;
  brandId: string;
  modelName: string;
  category?: string;
  variant: Variant;
  selectedDefects: DefectRule[];
  simType?: 'dual_sim' | 'single_sim';
  regionConfig?: 'indian' | 'imported';
  warrantyAge?: 'under_3m' | '3_to_6m' | '6_to_11m' | 'out_of_warranty';
  deviceAge?: AgeFactorKey;
  marketDemand?: MarketDemandKey;
  variantType?: VariantFactorKey;
  configOverride?: Partial<PricingRulesConfig>;
  /** Dual eSIM question answer — only relevant for Apple Pro/Pro Max iPhone 14+ */
  dualEsim?: boolean;
}

export interface AdjustmentDetail {
  id: string;
  name: string;
  category: string;
  type: 'TYPE_A_PERCENT' | 'TYPE_B_FIXED' | 'TYPE_C_REPAIR_COST' | 'WARRANTY_BONUS' | 'FACTOR_MULTIPLICATIVE';
  rateOrValue: number;
  impactAmount: number; // Negative for deductions, positive for bonuses
}

export interface PricingAuditTrail {
  deviceId: string;
  modelName: string;
  brand: 'apple' | 'android';
  segment: DeviceSegment;
  storageGb: number;
  ramGb?: number;
  region: string;
  simConfig: string;
  baseCashifyBenchmark: number;
  fAge: number;
  fMarket: number;
  fCosmetic: number;
  fDisplay: number;
  fFunctional: number;
  fBattery: number;
  fCondition: number;
  fVariant: number;
  preAccessoryValue: number;
  dAccessories: number;
  dAccessoriesCapped: number;
  adjustments: AdjustmentDetail[];
  totalFixedAdjustments: number;
  totalWarrantyBonus: number;
  totalConditionDeductions: number;
  totalRepairCostDeductions: number;
  adjustedBenchmark: number;
  vendorMultiplier: number; // 1.02 or 1.03
  vendorMultiplierPercentage: string; // '+2%' or '+3%'
  rawCalculatedPrice: number;
  finalRephonixPrice: number;
  isSpecialPartsCategory: boolean;
  ruleVersion: string;
  timestamp: string;
}

export interface Stage1ValuationResult {
  finalPrice: number;
  basePrice: number;
  adjustedBenchmark: number;
  isCritical: boolean;
  isSpecialPartsCategory: boolean;
  blockedReason?: string;
  auditTrail: PricingAuditTrail;
  customerSummary: {
    baseDeviceValue: number;
    configurationAdjustments: number;
    conditionAdjustments: number;
    finalOffer: number;
  };
}

/**
 * Classifies a device into its market pricing segment.
 */
export function determineDeviceSegment(brandId: string, modelName: string, category?: string): DeviceSegment {
  const isApple = isAppleBrand(brandId, modelName);
  const nameLower = modelName.toLowerCase();

  // Tablet segment determination
  if (nameLower.includes('ipad') || nameLower.includes('tab')) {
    if (isApple) {
      if (nameLower.includes('pro')) return 'apple_tablet_pro';
      if (nameLower.includes('air')) return 'apple_tablet_air';
      return 'apple_tablet_standard';
    } else {
      if (nameLower.includes('ultra') || nameLower.includes('plus') || category === 'flagship') {
        return 'android_tablet_flagship';
      }
      return 'android_tablet_midrange';
    }
  }

  if (isApple) {
    if (nameLower.includes('pro max')) return 'apple_pro_max';
    if (nameLower.includes('pro')) return 'apple_pro';
    if (nameLower.includes('se') || nameLower.includes('iphone 11') || nameLower.includes('iphone x') || nameLower.includes('iphone 8')) {
      return 'apple_older_se';
    }
    return 'apple_standard';
  }

  // Android segment determination
  if (nameLower.includes('ultra') || nameLower.includes('fold') || nameLower.includes('flip')) {
    return 'android_ultra_premium';
  }
  if (nameLower.includes('s24') || nameLower.includes('s23') || nameLower.includes('x100 pro') || (category === 'flagship' && !nameLower.includes('fe'))) {
    return 'android_premium_flagship';
  }
  if (nameLower.includes('12r') || nameLower.includes('11r') || nameLower.includes('pro+') || nameLower.includes('v30') || category === 'premium') {
    return 'android_upper_midrange';
  }
  if (category === 'midrange' || nameLower.includes('note') || nameLower.includes('redmi') || nameLower.includes('realme')) {
    return 'android_midrange';
  }
  return 'android_budget';
}

/**
 * Applies clean Indian currency rounding strategy to final customer buying offer.
 */
export function roundToCleanIndianPrice(amount: number, strategy: 'clean_50' | 'clean_99' | 'nearest_100'): number {
  if (amount <= 0) return 0;

  if (strategy === 'clean_50') {
    return Math.round(amount / 50) * 50;
  } else if (strategy === 'clean_99') {
    const baseHundred = Math.floor(amount / 100) * 100;
    return baseHundred + 99;
  } else {
    return Math.round(amount / 100) * 100;
  }
}

/**
 * Evaluates a smartphone trade-in through Stage 1 of the Rephonix Dynamic Pricing Engine
 * using the Multiplicative Condition & Severity Group Valuation Model:
 *
 *   V_S1 = (B_market * F_age * F_market * F_condition * F_variant) - D_accessories
 *   where F_condition = F_cosmetic * F_display * F_functional * F_battery
 */
export function calculateStage1Valuation(input: PricingInput): Stage1ValuationResult {
  const config: PricingRulesConfig = {
    ...DEFAULT_PRICING_RULES_CONFIG,
    ...input.configOverride
  };

  const isApple = isAppleBrand(input.brandId, input.modelName);
  const segment = determineDeviceSegment(input.brandId, input.modelName, input.category);
  const basePrice = input.variant.basePrice; // Current Market Benchmark B_market
  const adjustments: AdjustmentDetail[] = [];

  // Critical Gate Check (iCloud Locked, Boot Failure) -> Immediate Reject / Salvage
  const criticalDefect = input.selectedDefects.find(d => d.isCriticalFailure || d.id === 'defect-critical-power' || d.id === 'defect-critical-security');
  if (criticalDefect && (criticalDefect.isCriticalFailure || criticalDefect.id === 'defect-critical-power')) {
    const auditTrail: PricingAuditTrail = {
      deviceId: input.modelId,
      modelName: input.modelName,
      brand: isApple ? 'apple' : 'android',
      segment,
      storageGb: input.variant.storageGb,
      ramGb: input.variant.ramGb,
      region: input.regionConfig || 'indian',
      simConfig: input.simType || 'dual_sim',
      baseCashifyBenchmark: basePrice,
      fAge: 1.0,
      fMarket: 1.0,
      fCosmetic: 1.0,
      fDisplay: 1.0,
      fFunctional: 0.0,
      fBattery: 1.0,
      fCondition: 0.0,
      fVariant: 1.0,
      preAccessoryValue: 0,
      dAccessories: 0,
      dAccessoriesCapped: 0,
      adjustments: [{
        id: criticalDefect.id,
        name: criticalDefect.description,
        category: criticalDefect.category,
        type: 'TYPE_A_PERCENT',
        rateOrValue: 1.0,
        impactAmount: -basePrice
      }],
      totalFixedAdjustments: 0,
      totalWarrantyBonus: 0,
      totalConditionDeductions: basePrice,
      totalRepairCostDeductions: 0,
      adjustedBenchmark: 0,
      vendorMultiplier: 1.02,
      vendorMultiplierPercentage: '+2%',
      rawCalculatedPrice: 0,
      finalRephonixPrice: 0,
      isSpecialPartsCategory: true,
      ruleVersion: config.ruleVersion,
      timestamp: new Date().toISOString()
    };

    return {
      finalPrice: 0,
      basePrice,
      adjustedBenchmark: 0,
      isCritical: true,
      isSpecialPartsCategory: true,
      blockedReason: criticalDefect.subText || 'Device cannot be valued due to critical diagnostic blockage.',
      auditTrail,
      customerSummary: {
        baseDeviceValue: basePrice,
        configurationAdjustments: 0,
        conditionAdjustments: -basePrice,
        finalOffer: 0
      }
    };
  }

  // 1. Age Factor F_age
  const nameLower = input.modelName.toLowerCase();
  const isIphone17or18 = nameLower.includes('iphone 17') || nameLower.includes('iphone 18');
  const isIphone15or16 = nameLower.includes('iphone 15') || nameLower.includes('iphone 16');

  let fAge = 1.00;
  if (isIphone17or18) {
    // iPhone 17 & 18 Series: 0% under 3m, 15% 3-6m, 20% 6-11m, 25% > 11m
    let ageKey: AgeFactorKey = input.deviceAge || 'under_3m';
    if (!input.deviceAge && input.warrantyAge) {
      if (input.warrantyAge === 'under_3m') ageKey = 'under_3m';
      else if (input.warrantyAge === '3_to_6m') ageKey = '3_to_6m';
      else if (input.warrantyAge === '6_to_11m') ageKey = '6_to_12m';
      else ageKey = '1_to_2y';
    }
    fAge = config.ageFactors[ageKey] ?? 1.00;
  } else if (isIphone15or16) {
    // iPhone 15 & 16 Series: 0% under 3m, 6.0% 3-6m, 10.0% 6-11m, 25.0% out of warranty (>11m)
    const wAge = input.warrantyAge || (
      input.deviceAge === '3_to_6m' ? '3_to_6m' :
      input.deviceAge === '6_to_12m' ? '6_to_11m' :
      input.deviceAge === '1_to_2y' || input.deviceAge === '2_to_3y' || input.deviceAge === 'above_4y' ? 'out_of_warranty' :
      'under_3m'
    );
    if (wAge === '3_to_6m') {
      fAge = 0.94; // -6.0% reduction
    } else if (wAge === '6_to_11m') {
      fAge = 0.90; // -10.0% reduction
    } else if (wAge === 'out_of_warranty' || input.deviceAge === '1_to_2y' || input.deviceAge === '2_to_3y' || input.deviceAge === 'above_4y') {
      fAge = 0.75; // -25.0% reduction (out of warranty / above 11 months)
    } else {
      fAge = 1.00; // 0% reduction (under 3 months)
    }
  } else {
    // Other models apply age factors from config (under 3m: 1.00, 3-6m: 0.85, 6-11m: 0.80, >11m: 0.75)
    let ageKey: AgeFactorKey = input.deviceAge || 'under_3m';
    if (!input.deviceAge && input.warrantyAge) {
      if (input.warrantyAge === 'under_3m') ageKey = 'under_3m';
      else if (input.warrantyAge === '3_to_6m') ageKey = '3_to_6m';
      else if (input.warrantyAge === '6_to_11m') ageKey = '6_to_12m';
      else ageKey = '1_to_2y';
    }
    fAge = config.ageFactors[ageKey] ?? 1.00;
  }

  // 2. Market Demand Factor F_market
  const marketKey: MarketDemandKey = input.marketDemand || 'high';
  const fMarket = config.marketDemandFactors[marketKey] ?? 1.00;

  // 3. Variant Factor F_variant
  let variantKey: VariantFactorKey = input.variantType || 'indian';
  if (!input.variantType) {
    if (input.regionConfig === 'imported' && input.simType === 'single_sim') {
      variantKey = 'imported_esim_only';
    } else if (input.regionConfig === 'imported') {
      variantKey = 'imported_unlocked';
    } else {
      variantKey = 'indian';
    }
  }
  const fVariant = config.variantFactors[variantKey] ?? 1.00;

  // 4. Severity Grouping for Condition Factor F_condition = F_cosmetic * F_display * F_functional * F_battery
  const isTablet = input.modelName.toLowerCase().includes('ipad') || input.modelName.toLowerCase().includes('tab');
  
  // Group A — Cosmetic (Body scratches, dents, bends, panels)
  const cosmeticDefects = input.selectedDefects.filter(d => d.category === 'body');
  let fCosmetic = 1.00;

  if (isTablet) {
    // For tablets: Structural (Bent/Loose), Back Panel Condition, and Surface Scratches/Dents
    const surfaceDefects = cosmeticDefects.filter(d => d.id.includes('scratches') || d.id.includes('dents'));
    let fSurface = 1.00;
    surfaceDefects.forEach(d => {
      const p = d.deductionPercentage || (d.deductionFixed > 0 ? d.deductionFixed / basePrice : 0);
      fSurface = Math.min(fSurface, Math.max(0, 1.0 - p));
    });

    const structuralDefects = cosmeticDefects.filter(d => d.id.includes('bent') || d.id.includes('loose'));
    let fStructural = 1.00;
    structuralDefects.forEach(d => {
      const p = d.deductionPercentage || 0;
      fStructural = Math.min(fStructural, Math.max(0, 1.0 - p));
    });

    const panelDefects = cosmeticDefects.filter(d => d.id.includes('panel'));
    let fPanel = 1.00;
    panelDefects.forEach(d => {
      const p = d.deductionPercentage || (d.deductionFixed > 0 ? d.deductionFixed / basePrice : 0);
      fPanel = Math.min(fPanel, Math.max(0, 1.0 - p));
    });

    fCosmetic = fSurface * fStructural * fPanel;
  } else {
    // Phone logic
    cosmeticDefects.forEach(defect => {
      const penalty = defect.deductionPercentage || (defect.deductionFixed > 0 ? defect.deductionFixed / basePrice : 0);
      const factor = Math.max(0, 1.0 - penalty);
      if (factor < fCosmetic) {
        fCosmetic = factor;
      }
    });
  }

  // Group B — Display (Scratches, cracks, touch, OLED/LCD, non-OEM display)
  const displayDefects = input.selectedDefects.filter(d => d.category === 'screen');
  let fDisplay = 1.00;

  if (isTablet) {
    // For tablets: separate into Physical Damage (scratches/cracks/spots/discoloration), Touch failure, and Non-original screen
    const physicalDefects = displayDefects.filter(d => d.id !== 'defect-screen-touch' && d.id !== 'defect-screen-non-original');
    let fPhysical = 1.00;
    physicalDefects.forEach(defect => {
      let penalty = defect.deductionPercentage || 0;
      if (defect.deductionFixed > 0) {
        penalty = Math.max(penalty, Math.min(0.35, defect.deductionFixed / basePrice));
      }
      fPhysical = Math.min(fPhysical, Math.max(0, 1.0 - penalty));
    });

    const hasTouchFail = displayDefects.some(d => d.id === 'defect-screen-touch');
    const fTouch = hasTouchFail ? 0.75 : 1.00; // -25% digitizer penalty

    const hasNonOriginal = displayDefects.some(d => d.id === 'defect-screen-non-original');
    const fNonOrig = hasNonOriginal ? (segment.includes('pro') ? 0.65 : 0.72) : 1.00;

    fDisplay = fPhysical * fTouch * fNonOrig;
  } else {
    // Phone logic
    displayDefects.forEach(defect => {
      let penalty = defect.deductionPercentage || 0;
      if (defect.id === 'defect-screen-cracked' && penalty === 0) {
        penalty = 0.28; // Standard ~28% display panel deduction
      }
      if (defect.deductionFixed > 0) {
        const fixedPenalty = Math.min(0.30, defect.deductionFixed / basePrice);
        penalty = Math.max(penalty, fixedPenalty);
      }
      const factor = Math.max(0, 1.0 - penalty);
      if (factor < fDisplay) {
        fDisplay = factor;
      }
    });
  }

  // Group C — Functional (Camera, speaker, mic, charging port, biometrics)
  // Multiplicative stacking across distinct functional components (excluding battery)
  const functionalDefects = input.selectedDefects.filter(d => 
    (d.category === 'camera' || d.category === 'functionality' || d.category === 'connectivity') &&
    !d.id.includes('battery')
  );
  let fFunctional = 1.00;

  functionalDefects.forEach(defect => {
    let penalty = defect.deductionPercentage || 0;
    if (penalty === 0 && defect.deductionFixed > 0) {
      penalty = Math.min(0.25, defect.deductionFixed / basePrice);
    }
    const factor = Math.max(0, 1.0 - penalty);
    fFunctional *= factor;
  });

  // Group D — Battery (Health degradation, service warning)
  const batteryDefects = input.selectedDefects.filter(d => d.id.includes('battery'));
  let fBattery = 1.00;
  batteryDefects.forEach(defect => {
    const penalty = defect.deductionPercentage || 0.05;
    fBattery *= Math.max(0, 1.0 - penalty);
  });

  // Total Multiplicative Condition Score
  const fCondition = fCosmetic * fDisplay * fFunctional * fBattery;

  // Calculate Pre-Accessory Valuation
  const preAccessoryValue = Math.round(basePrice * fAge * fMarket * fCondition * fVariant);

  // Dual eSIM Deduction — Apple iPhone models (eSIM only / no physical SIM tray)
  // iPhone 14/15/16 series: -5% | iPhone 17 & 18 Pro/Pro Max (and 17/18 series): -8%
  let dualEsimDeduction = 0;
  if (input.dualEsim === true && isApple) {
    if (isIphone17or18) {
      dualEsimDeduction = Math.round(preAccessoryValue * 0.08);
      adjustments.push({
        id: 'dual-esim-deduction-17-18',
        name: 'Dual eSIM Configuration Deduction (iPhone 17–18 Pro Series)',
        category: 'configuration',
        type: 'TYPE_A_PERCENT',
        rateOrValue: -0.08,
        impactAmount: -dualEsimDeduction
      });
    } else {
      dualEsimDeduction = Math.round(preAccessoryValue * 0.05);
      adjustments.push({
        id: 'dual-esim-deduction-14-16',
        name: 'Dual eSIM Configuration Deduction (Apple iPhone Series)',
        category: 'configuration',
        type: 'TYPE_A_PERCENT',
        rateOrValue: -0.05,
        impactAmount: -dualEsimDeduction
      });
    }
  }

  // Group E — Accessories (Box, Charger, Cable, Invoice) -> Fixed Economic Deductions
  let dAccessoriesRaw = 0;
  input.selectedDefects.filter(d => d.category === 'accessories').forEach(defect => {
    const fixedAmount = Math.abs(defect.deductionFixed || Math.round(basePrice * (defect.deductionPercentage || 0)));
    dAccessoriesRaw += fixedAmount;
    adjustments.push({
      id: defect.id,
      name: defect.description,
      category: 'accessories',
      type: 'TYPE_B_FIXED',
      rateOrValue: -fixedAmount,
      impactAmount: -fixedAmount
    });
  });

  // Cap total accessory deduction to config max percentage (default 10% of B_market)
  const maxAccessoryCap = Math.round(basePrice * config.accessoryMaxCapPercent);
  const dAccessoriesCapped = Math.min(dAccessoriesRaw, maxAccessoryCap);

  // Single SIM Adjustment — ₹500 regional variant deduction
  let singleSimDeduction = 0;
  if (input.simType === 'single_sim') {
    singleSimDeduction = 500;
    adjustments.push({
      id: 'single-sim-deduction',
      name: 'Single SIM Regional Variant Adjustment',
      category: 'configuration',
      type: 'TYPE_B_FIXED',
      rateOrValue: -500,
      impactAmount: -500
    });
  }

  // Calculate Pre-Vendor Adjusted Benchmark (includes dual eSIM & single SIM deduction)
  let adjustedBenchmark = preAccessoryValue - dualEsimDeduction - singleSimDeduction - dAccessoriesCapped;

  // Minimum Valuation / Salvage Floor Check
  const minimumRecycleFloor = Math.max(500, Math.round(basePrice * 0.08));
  if (adjustedBenchmark < minimumRecycleFloor) {
    adjustedBenchmark = minimumRecycleFloor;
  }

  const isHighThreshold = adjustedBenchmark > config.vendorThreshold;
  const vendorMultiplier = isHighThreshold ? config.vendorHighMultiplier : config.vendorLowMultiplier; // 1.03 vs 1.02
  const vendorMultiplierPercentage = isHighThreshold ? '+3%' : '+2%';

  const rawCalculatedPrice = adjustedBenchmark * vendorMultiplier;
  
  // 8. Customer-Facing Rounding Strategy
  // If deductions or condition factors exist (adjustedBenchmark < basePrice), the price must strictly
  // deduct from basePrice so that accessory, defect, and eSIM deductions are never swallowed by vendorMultiplier.
  const calculatedPrice = (adjustedBenchmark < basePrice)
    ? adjustedBenchmark
    : rawCalculatedPrice;
  const unroundedCalculatedPrice = Math.min(basePrice, calculatedPrice);
  const finalRephonixPrice = Math.min(basePrice, roundToCleanIndianPrice(unroundedCalculatedPrice, config.roundingStrategy));

  const isSpecialPartsCategory = fCondition < 0.55;

  // Construct Audit Trail
  const auditTrail: PricingAuditTrail = {
    deviceId: input.modelId,
    modelName: input.modelName,
    brand: isApple ? 'apple' : 'android',
    segment,
    storageGb: input.variant.storageGb,
    ramGb: input.variant.ramGb,
    region: input.regionConfig || 'indian',
    simConfig: input.simType || 'dual_sim',
    baseCashifyBenchmark: basePrice,
    fAge,
    fMarket,
    fCosmetic,
    fDisplay,
    fFunctional,
    fBattery,
    fCondition,
    fVariant,
    preAccessoryValue,
    dAccessories: dAccessoriesRaw,
    dAccessoriesCapped,
    adjustments,
    totalFixedAdjustments: -dAccessoriesCapped,
    totalWarrantyBonus: 0,
    totalConditionDeductions: basePrice - preAccessoryValue,
    totalRepairCostDeductions: 0,
    adjustedBenchmark,
    vendorMultiplier,
    vendorMultiplierPercentage,
    rawCalculatedPrice: Math.round(rawCalculatedPrice),
    finalRephonixPrice,
    isSpecialPartsCategory,
    ruleVersion: config.ruleVersion,
    timestamp: new Date().toISOString()
  };

  return {
    finalPrice: finalRephonixPrice,
    basePrice,
    adjustedBenchmark,
    isCritical: false,
    isSpecialPartsCategory,
    auditTrail,
    customerSummary: {
      baseDeviceValue: basePrice,
      configurationAdjustments: Math.round(preAccessoryValue - basePrice),
      conditionAdjustments: -dAccessoriesCapped,
      finalOffer: finalRephonixPrice
    }
  };
}

