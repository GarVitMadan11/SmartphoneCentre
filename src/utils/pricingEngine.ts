import type { Variant, DefectRule } from '../data/mockDatabase';
import { 
  DeviceSegment, 
  DEFAULT_PRICING_RULES_CONFIG, 
  PricingRulesConfig 
} from '../data/pricingRulesConfig';

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
  configOverride?: Partial<PricingRulesConfig>;
}

export interface AdjustmentDetail {
  id: string;
  name: string;
  category: string;
  type: 'TYPE_A_PERCENT' | 'TYPE_B_FIXED' | 'TYPE_C_REPAIR_COST' | 'WARRANTY_BONUS';
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
    // Round to nearest 50 (e.g. ₹61,964 -> ₹61,950)
    return Math.round(amount / 50) * 50;
  } else if (strategy === 'clean_99') {
    // Round to xx99 (e.g. ₹61,964 -> ₹61,999)
    const baseHundred = Math.floor(amount / 100) * 100;
    return baseHundred + 99;
  } else {
    // Nearest 100 (e.g. ₹61,964 -> ₹62,000)
    return Math.round(amount / 100) * 100;
  }
}

/**
 * Evaluates a smartphone trade-in through Stage 1 of the Rephonix Dynamic Pricing Engine.
 */
export function calculateStage1Valuation(input: PricingInput): Stage1ValuationResult {
  const config: PricingRulesConfig = {
    ...DEFAULT_PRICING_RULES_CONFIG,
    ...input.configOverride
  };

  const isApple = isAppleBrand(input.brandId, input.modelName);
  const segment = determineDeviceSegment(input.brandId, input.modelName, input.category);
  const segmentConfig = config.segments[segment];
  const repairConfig = config.repairCosts[segment];

  const basePrice = input.variant.basePrice;
  const adjustments: AdjustmentDetail[] = [];

  // Critical Gate Check (iCloud Locked, Boot Failure)
  const criticalDefect = input.selectedDefects.find(d => d.isCriticalFailure);
  if (criticalDefect) {
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

  // 1. TYPE B: Fixed Configuration Adjustments (Region, SIM, Accessories)
  let totalFixedAdjustments = 0;

  // SIM Configuration
  if (input.simType === 'single_sim') {
    const simDeduction = config.simRegionAdjustments.singleSimConfig; // -₹500
    adjustments.push({
      id: 'config-single-sim',
      name: 'Single SIM Configuration Adjustment',
      category: 'configuration',
      type: 'TYPE_B_FIXED',
      rateOrValue: simDeduction,
      impactAmount: simDeduction
    });
    totalFixedAdjustments += simDeduction;
  }

  // Region Configuration
  if (input.regionConfig === 'imported') {
    const importedDeduction = config.simRegionAdjustments.importedConfig; // -₹1500
    adjustments.push({
      id: 'config-imported',
      name: 'Imported Regional Model Adjustment',
      category: 'configuration',
      type: 'TYPE_B_FIXED',
      rateOrValue: importedDeduction,
      impactAmount: importedDeduction
    });
    totalFixedAdjustments += importedDeduction;
  }

  // Accessories (Missing Box, Charger, Bill)
  let accessoryDeductionsSum = 0;
  input.selectedDefects.filter(d => d.category === 'accessories').forEach(defect => {
    const amount = -Math.abs(defect.deductionFixed || Math.round(basePrice * (defect.deductionPercentage || 0)));
    adjustments.push({
      id: defect.id,
      name: defect.description,
      category: 'accessories',
      type: 'TYPE_B_FIXED',
      rateOrValue: amount,
      impactAmount: amount
    });
    accessoryDeductionsSum += amount;
  });
  totalFixedAdjustments += accessoryDeductionsSum;

  // 2. Warranty Premium (+1% to +4%)
  let totalWarrantyBonus = 0;
  if (input.warrantyAge === 'under_3m') {
    totalWarrantyBonus = Math.round(basePrice * config.warrantyBonus.under3mPercent);
  } else if (input.warrantyAge === '3_to_6m') {
    totalWarrantyBonus = Math.round(basePrice * config.warrantyBonus.months3to6Percent);
  } else if (input.warrantyAge === '6_to_11m') {
    totalWarrantyBonus = Math.round(basePrice * config.warrantyBonus.months6to12Percent);
  }
  // Clamp warranty bonus to max configured percentage
  const maxAllowedBonus = Math.round(basePrice * config.warrantyBonus.maxBonusPercent);
  totalWarrantyBonus = Math.min(totalWarrantyBonus, maxAllowedBonus);

  if (totalWarrantyBonus > 0) {
    adjustments.push({
      id: 'bonus-warranty',
      name: 'Official Brand Warranty Premium',
      category: 'warranty',
      type: 'WARRANTY_BONUS',
      rateOrValue: totalWarrantyBonus,
      impactAmount: totalWarrantyBonus
    });
  }

  // 3. TYPE C: Repair-Cost Adjustments (Display, Camera, Major Hardware)
  let totalRepairCostDeductions = 0;
  const hasCrackedScreen = input.selectedDefects.some(d => d.id === 'defect-screen-cracked');
  const hasNonGenuineDisplay = input.selectedDefects.some(d => d.id === 'defect-display-nongenuine');

  if (hasCrackedScreen) {
    // Expected repair cost + risk/marketability adjustment
    const displayDeduction = repairConfig.displayRepairCost + repairConfig.displayRiskAdjustment;
    adjustments.push({
      id: 'repair-display-cracked',
      name: 'Display Panel Assembly Repair & Risk Adjustment',
      category: 'screen',
      type: 'TYPE_C_REPAIR_COST',
      rateOrValue: -displayDeduction,
      impactAmount: -displayDeduction
    });
    totalRepairCostDeductions += displayDeduction;
  }

  const hasFaultyCamera = input.selectedDefects.some(d => d.id === 'defect-camera-faulty');
  if (hasFaultyCamera) {
    const cameraDeduction = repairConfig.cameraRepairCost;
    adjustments.push({
      id: 'repair-camera-module',
      name: 'Camera Optical Assembly Replacement',
      category: 'camera',
      type: 'TYPE_C_REPAIR_COST',
      rateOrValue: -cameraDeduction,
      impactAmount: -cameraDeduction
    });
    totalRepairCostDeductions += cameraDeduction;
  }

  // 4. TYPE A: Percentage-Based Adjustments (Body wear, minor screen, battery, biometrics)
  let totalConditionDeductions = 0;
  
  // Controlled combined rule: If screen is cracked (repair cost applied), ignore generic screen scratch %
  const defectsForPercentTypeA = input.selectedDefects.filter(d => {
    if (d.category === 'accessories') return false;
    if (hasCrackedScreen && (d.id === 'defect-screen-scratches' || d.id === 'defect-screen-cracked')) return false;
    if (hasFaultyCamera && d.id === 'defect-camera-faulty') return false;
    if (hasNonGenuineDisplay && hasCrackedScreen && d.id === 'defect-display-nongenuine') return false; // Prevent double deduct
    return true;
  });

  defectsForPercentTypeA.forEach(defect => {
    let pct = defect.deductionPercentage || 0;
    if (pct === 0 && defect.deductionFixed > 0) {
      // Fixed defect outside accessories -> convert to equivalent rupee reduction
      const amount = Math.round(defect.deductionFixed);
      adjustments.push({
        id: defect.id,
        name: defect.description,
        category: defect.category,
        type: 'TYPE_B_FIXED',
        rateOrValue: -amount,
        impactAmount: -amount
      });
      totalConditionDeductions += amount;
      return;
    }

    const amount = Math.round(basePrice * pct);
    adjustments.push({
      id: defect.id,
      name: defect.description,
      category: defect.category,
      type: 'TYPE_A_PERCENT',
      rateOrValue: pct,
      impactAmount: -amount
    });
    totalConditionDeductions += amount;
  });

  // 5. Condition Caps & Special Repair Category Determination
  const totalDeductionRatio = (totalConditionDeductions + totalRepairCostDeductions) / basePrice;
  const isSpecialPartsCategory = totalDeductionRatio > segmentConfig.normalConditionCap || 
                                  input.selectedDefects.some(d => d.id === 'defect-func-restart' || d.id === 'defect-critical-power');

  let cappedConditionDeductions = totalConditionDeductions;
  if (!isSpecialPartsCategory && totalDeductionRatio > segmentConfig.normalConditionCap) {
    cappedConditionDeductions = Math.round(basePrice * segmentConfig.normalConditionCap) - totalRepairCostDeductions;
    cappedConditionDeductions = Math.max(0, cappedConditionDeductions);
  }

  // 6. Calculate Adjusted Benchmark
  let adjustedBenchmark = basePrice + totalFixedAdjustments + totalWarrantyBonus - (cappedConditionDeductions + totalRepairCostDeductions);
  
  // Floor clamp: minimum recycle floor (8% of base or ₹500)
  const minimumRecycleFloor = Math.max(500, Math.round(basePrice * 0.08));
  if (adjustedBenchmark < minimumRecycleFloor) {
    adjustedBenchmark = minimumRecycleFloor;
  }

  // 7. Apply Vendor Premium Rule (+2% / +3%)
  const isHighThreshold = adjustedBenchmark > config.vendorThreshold;
  const vendorMultiplier = isHighThreshold ? config.vendorHighMultiplier : config.vendorLowMultiplier; // 1.03 vs 1.02
  const vendorMultiplierPercentage = isHighThreshold ? '+3%' : '+2%';

  const rawCalculatedPrice = adjustedBenchmark * vendorMultiplier;
  
  // 8. Customer-Facing Rounding Strategy
  const finalRephonixPrice = roundToCleanIndianPrice(rawCalculatedPrice, config.roundingStrategy);

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
    adjustments,
    totalFixedAdjustments,
    totalWarrantyBonus,
    totalConditionDeductions: cappedConditionDeductions,
    totalRepairCostDeductions,
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
      configurationAdjustments: totalFixedAdjustments + totalWarrantyBonus,
      conditionAdjustments: -(cappedConditionDeductions + totalRepairCostDeductions),
      finalOffer: finalRephonixPrice
    }
  };
}
