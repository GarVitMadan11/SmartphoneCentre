import type { Variant, DefectRule } from '../data/mockDatabase.ts';
import { getModelScreenDeduction, getModelWarrantyDeductionPercentage } from '../data/mockDatabase.ts';
import { 
  DeviceSegment, 
  DEFAULT_PRICING_RULES_CONFIG, 
  PricingRulesConfig,
  AgeFactorKey,
  MarketDemandKey,
  VariantFactorKey,
  resolveDeviceCycleTier
} from '../data/pricingRulesConfig.ts';

export function isAppleBrand(brandId?: string, modelName?: string): boolean {
  if (brandId && (brandId === 'brand-apple' || brandId.toLowerCase().includes('apple'))) return true;
  if (modelName && (modelName.toLowerCase().includes('iphone') || modelName.toLowerCase().includes('apple'))) return true;
  return false;
}

export interface PricingInput {
  modelId: string;
  brandId: string;
  modelName: string;
  category?: string;
  releaseYear?: number;
  hasSpen?: boolean;
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
  /** Explicit screen deduction amount configured in Admin Panel (or empirical CSV fallback) */
  screenDeduction?: number;
  /** Explicit warranty deduction percentage configured in Admin Panel (or empirical CSV fallback) */
  warrantyDeductionPercentage?: number;
  /** Whether the model asks brand warranty question in diagnostics (when false, skips warranty deduction) */
  supportsWarrantyQuestion?: boolean;
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
  if (/s2[3-7]/i.test(nameLower) || nameLower.includes('x100 pro') || (category === 'flagship' && !nameLower.includes('fe'))) {
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

  // 1. Age Factor F_age & Cycle Tier Resolution
  const cycleTier = resolveDeviceCycleTier(input.releaseYear);
  const nameLower = input.modelName.toLowerCase();
  const isIphone17or18 = nameLower.includes('iphone 17') || nameLower.includes('iphone 18');
  const isIphone15or16 = nameLower.includes('iphone 15') || nameLower.includes('iphone 16');

  // If purchase bill/invoice is missing OR screen is non-original, manufacturer warranty is legally void -> automatically out of warranty
  const hasMissingBill = input.selectedDefects.some(d => d.id === 'defect-acc-nodocs');
  const hasNonOriginalScreen = input.selectedDefects.some(d => d.id === 'defect-screen-non-original');
  const isWarrantyVoided = hasMissingBill || hasNonOriginalScreen;
  const effectiveWarrantyAge = isWarrantyVoided ? 'out_of_warranty' : input.warrantyAge;
  const effectiveDeviceAge = isWarrantyVoided ? 'out_of_warranty' : input.deviceAge;

  // 1. Age Factor F_age & Warranty Assessment
  const modelWarrantyDeductionPct = input.warrantyDeductionPercentage !== undefined
    ? input.warrantyDeductionPercentage
    : getModelWarrantyDeductionPercentage({
        name: input.modelName,
        releaseYear: input.releaseYear,
        warrantyDeductionPercentage: input.warrantyDeductionPercentage
      });

  let fAge = 1.00;
  if (input.supportsWarrantyQuestion === false) {
    // Model does not support / ask brand warranty question -> skip warranty deduction
    fAge = 1.00;
  } else if (modelWarrantyDeductionPct > 0 || isIphone17or18 || isIphone15or16 || /s2[4-6]/i.test(nameLower) || cycleTier === 'TIER_1_WARRANTY_ACTIVE') {
    // Model has active warranty deduction configured (or active Tier 1 series)
    const outOfWarrantyPenalty = modelWarrantyDeductionPct > 0
      ? modelWarrantyDeductionPct / 100
      : (config.universalDeductions.outOfWarrantyPercentTier1 ?? 0.20);

    if (effectiveWarrantyAge === 'out_of_warranty' || effectiveDeviceAge === 'out_of_warranty') {
      fAge = Math.max(0, 1.0 - outOfWarrantyPenalty);
    } else if (effectiveDeviceAge === '6_to_12m' || effectiveWarrantyAge === '6_to_11m') {
      fAge = Math.max(0, 1.0 - (outOfWarrantyPenalty * 0.30)); // Staged reduction for 6-12 months
    } else if (effectiveDeviceAge === '3_to_6m' || effectiveWarrantyAge === '3_to_6m') {
      fAge = Math.max(0, 1.0 - (outOfWarrantyPenalty * 0.15)); // Staged reduction for 3-6 months
    } else {
      fAge = 1.00; // 0% under 3 months
    }
  } else if ((input.releaseYear !== undefined && input.releaseYear < 2024) || modelWarrantyDeductionPct === 0) {
    // For older / matured models (> 1-2 years old, e.g. iPhone 14/13/12, Galaxy S23) or models with 0% warranty deduction,
    // secondary market baseline already reflects an out-of-warranty device.
    // Matches Cashify empirical evidence (0% deduction on out_of_warranty for matured models).
    fAge = 1.00;
  } else if (cycleTier === 'TIER_2_MATURED_BASELINE') {
    fAge = 1.00;
  } else {
    // Other models apply age factors from config
    let ageKey: AgeFactorKey = effectiveDeviceAge || 'under_3m';
    if (!effectiveDeviceAge && effectiveWarrantyAge) {
      if (effectiveWarrantyAge === 'under_3m') ageKey = 'under_3m';
      else if (effectiveWarrantyAge === '3_to_6m') ageKey = '3_to_6m';
      else if (effectiveWarrantyAge === '6_to_11m') ageKey = '6_to_12m';
      else ageKey = 'out_of_warranty';
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
    // Phone logic: Evaluate frame condition (scratches/dents/bent) and back glass panel condition independently (matching Cashify's 2-question model)
    const frameDefects = cosmeticDefects.filter(d => d.id !== 'defect-body-backglass');
    let fFrame = 1.00;
    frameDefects.forEach(defect => {
      const penalty = defect.deductionPercentage || (defect.deductionFixed > 0 ? defect.deductionFixed / basePrice : 0);
      const factor = Math.max(0, 1.0 - penalty);
      if (factor < fFrame) {
        fFrame = factor;
      }
    });

    const backGlassDefect = cosmeticDefects.find(d => d.id === 'defect-body-backglass');
    let fBackGlass = 1.00;
    if (backGlassDefect) {
      const penalty = backGlassDefect.deductionPercentage || (backGlassDefect.deductionFixed > 0 ? backGlassDefect.deductionFixed / basePrice : 0.05);
      fBackGlass = Math.max(0.80, 1.0 - penalty);
    }

    fCosmetic = fFrame * fBackGlass;
  }

  // Group B — Display (Scratches, cracks, touch, OLED/LCD, non-original display)
  const displayDefects = input.selectedDefects.filter(d => d.category === 'screen');
  let fDisplay = 1.00;

  if (isTablet) {
    // Tablet logic
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
    const touchSalvageFloor = config.universalDeductions.touchOrNonOriginalScreenSalvageFloor ?? 1200;
    const fTouch = hasTouchFail ? Math.min(0.25, touchSalvageFloor / basePrice) : 1.00;

    fDisplay = fPhysical * fTouch;
  } else {
    // Phone logic: Deduplicate screen defects — full panel replacement (cracked glass, burn-in) automatically absorbs surface scratches
    const hasScreenPanelReplacement = displayDefects.some(d => 
      d.id === 'defect-screen-cracked' || d.id === 'defect-screen-burn'
    );

    displayDefects.forEach(defect => {
      if (defect.id === 'defect-screen-non-original') {
        return; // Handled separately as model-specific screenDeductionAmount fixed adjustment
      }
      if (hasScreenPanelReplacement && defect.id === 'defect-screen-scratches') {
        return; // Waived: replacing entire display panel includes new scratch-free glass
      }
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

    // Unresponsive touch digitizer prevents on-site diagnostic testing (matches Cashify national scrap policy)
    const hasTouchFail = displayDefects.some(d => d.id === 'defect-screen-touch');
    if (hasTouchFail) {
      const touchSalvageFloor = config.universalDeductions.touchOrNonOriginalScreenSalvageFloor ?? 1200;
      fDisplay = Math.min(fDisplay, touchSalvageFloor / basePrice);
    }
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
    const penalty = defect.deductionPercentage ?? 0.05;
    fBattery *= Math.max(0, 1.0 - penalty);
  });

  // Total Multiplicative Condition Score
  let fCondition = fCosmetic * fDisplay * fFunctional * fBattery;

  // Condition score is naturally compounded via multiplicative severity groups:
  // F_condition = F_cosmetic * F_display * F_functional * F_battery.
  // Each distinct defect category naturally compounds without artificial overhead penalties (matches Cashify repair economics).

  // Calculate Pre-Accessory Valuation
  const preAccessoryValue = Math.round(basePrice * fAge * fMarket * fCondition * fVariant);

  // Dual eSIM Deduction — Apple iPhone models (eSIM only / no physical SIM tray)
  // iPhone 14/15/16 series: -5% | iPhone 17 & 18 Pro/Pro Max (and 17/18 series): -8%
  // Only applies if not already factored into fVariant (imported_esim_only)
  let dualEsimDeduction = 0;
  if (input.dualEsim === true && isApple && variantKey !== 'imported_esim_only') {
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
    // Missing bill/invoice voids brand warranty in F_age; it does not double-penalize under fixed accessory deductions (matches Cashify doorstep verification)
    if (defect.id === 'defect-acc-nodocs') {
      return;
    }
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
  // Only applies if not already factored into fVariant (imported_esim_only) and not dualEsim
  let singleSimDeduction = 0;
  if (input.simType === 'single_sim' && variantKey !== 'imported_esim_only' && !input.dualEsim) {
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

  // Screen Deduction for Non-Original / Replaced Display
  let screenDeductionAmount = 0;
  if (hasNonOriginalScreen) {
    screenDeductionAmount = input.screenDeduction ?? getModelScreenDeduction({
      name: input.modelName,
      basePrice128GB: basePrice,
      screenDeduction: input.screenDeduction
    });
    adjustments.push({
      id: 'defect-screen-non-original',
      name: 'Non-Original / Replaced Display Deduction',
      category: 'screen',
      type: 'TYPE_B_FIXED',
      rateOrValue: -screenDeductionAmount,
      impactAmount: -screenDeductionAmount
    });
  }

  // Calculate Pre-Vendor Adjusted Benchmark (includes screen deduction, dual eSIM & single SIM deduction)
  let adjustedBenchmark = preAccessoryValue - screenDeductionAmount - dualEsimDeduction - singleSimDeduction - dAccessoriesCapped;

  // Minimum Valuation / Salvage Floor Check (Empirically beats competitor scrap floor of ₹1,180)
  const hasTouchDefect = input.selectedDefects.some(d => d.id === 'defect-screen-touch');
  const minimumRecycleFloor = hasTouchDefect
    ? (config.universalDeductions.touchOrNonOriginalScreenSalvageFloor ?? 1200)
    : Math.max(1200, Math.round(basePrice * 0.08));
  if (adjustedBenchmark < minimumRecycleFloor) {
    adjustedBenchmark = minimumRecycleFloor;
  }

  let vendorMultiplier = 1.03;
  let vendorMultiplierPercentage = '+3%';
  if (config.vendorConditionTiers) {
    if (fCondition >= 0.98) {
      vendorMultiplier = config.vendorConditionTiers.flawlessMultiplier; // 1.03 (+3.0%)
      vendorMultiplierPercentage = '+3%';
    } else if (fCondition >= 0.80) {
      vendorMultiplier = config.vendorConditionTiers.minorDefectMultiplier; // 1.025 (+2.5%)
      vendorMultiplierPercentage = '+2.5%';
    } else {
      vendorMultiplier = config.vendorConditionTiers.heavyDefectMultiplier; // 1.02 (+2.0%)
      vendorMultiplierPercentage = '+2%';
    }
  } else {
    const isHighThreshold = adjustedBenchmark > config.vendorThreshold;
    vendorMultiplier = isHighThreshold ? config.vendorHighMultiplier : config.vendorLowMultiplier;
    vendorMultiplierPercentage = vendorMultiplier >= 1.03 ? '+3%' : '+2%';
  }

  // Rephonix Buyback Offer strictly applies the tiered vendor multiplier
  const rawCalculatedPrice = Math.round(adjustedBenchmark * vendorMultiplier);
  const finalRephonixPrice = roundToCleanIndianPrice(rawCalculatedPrice, config.roundingStrategy);

  const isSpecialPartsCategory = fCondition < 0.55;

  const totalConditionDeductions = Math.round(basePrice * (1.0 - fCondition));
  const totalFixedAdjustments = -(dAccessoriesCapped + screenDeductionAmount + dualEsimDeduction + singleSimDeduction);
  const configurationAdjustments = Math.round(adjustedBenchmark - (basePrice - totalConditionDeductions));

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
    totalFixedAdjustments,
    totalWarrantyBonus: 0,
    totalConditionDeductions,
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
      conditionAdjustments: -totalConditionDeductions,
      configurationAdjustments,
      finalOffer: finalRephonixPrice
    }
  };
}

