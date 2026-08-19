import { Variant, DefectRule } from '../data/mockDatabase';
import { calculateStage1Valuation, Stage1ValuationResult, PricingAuditTrail } from './pricingEngine';
import { AgeFactorKey, MarketDemandKey, VariantFactorKey } from '../data/pricingRulesConfig';

export interface ValuationDeduction {
  ruleId?: string;
  description: string;
  category: string;
  type: 'percentage' | 'fixed';
  deductionValue: number;
  totalDeducted: number;
}

export interface ValuationBreakdown {
  basePrice: number;
  deductions: ValuationDeduction[];
  isCritical: boolean;
  blockedReason?: string;
  finalPrice: number;
  retentionPercentage: number;
  adjustedBenchmark?: number;
  isSpecialPartsCategory?: boolean;
  auditTrail?: PricingAuditTrail;
  customerSummary?: {
    baseDeviceValue: number;
    configurationAdjustments: number;
    conditionAdjustments: number;
    finalOffer: number;
  };
}

/**
 * Wrapper for Stage 1 Rephonix Pricing Engine.
 * Calculates trade-in value applying multiplicative condition factors, severity groups,
 * age & market demand factors, variant adjustment, capped accessory deductions, and vendor premium rule.
 */
export function calculateValuation(
  variant: Variant,
  selectedDefects: DefectRule[],
  options?: {
    modelId?: string;
    brandId?: string;
    modelName?: string;
    category?: string;
    simType?: 'dual_sim' | 'single_sim';
    regionConfig?: 'indian' | 'imported';
    warrantyAge?: 'under_3m' | '3_to_6m' | '6_to_11m' | 'out_of_warranty';
    deviceAge?: AgeFactorKey;
    marketDemand?: MarketDemandKey;
    variantType?: VariantFactorKey;
  }
): ValuationBreakdown {
  const result: Stage1ValuationResult = calculateStage1Valuation({
    modelId: options?.modelId || 'device-unknown',
    brandId: options?.brandId || 'brand-apple',
    modelName: options?.modelName || 'Smartphone Device',
    category: options?.category || 'flagship',
    variant,
    selectedDefects,
    simType: options?.simType || 'dual_sim',
    regionConfig: options?.regionConfig || 'indian',
    warrantyAge: options?.warrantyAge || 'out_of_warranty',
    deviceAge: options?.deviceAge,
    marketDemand: options?.marketDemand,
    variantType: options?.variantType
  });

  const deductions: ValuationDeduction[] = result.auditTrail.adjustments.map(adj => ({
    ruleId: adj.id,
    description: adj.name,
    category: adj.category,
    type: adj.type === 'TYPE_A_PERCENT' ? 'percentage' : 'fixed',
    deductionValue: Math.abs(adj.rateOrValue),
    totalDeducted: Math.abs(adj.impactAmount)
  }));

  return {
    basePrice: result.basePrice,
    deductions,
    isCritical: result.isCritical,
    blockedReason: result.blockedReason,
    finalPrice: result.finalPrice,
    retentionPercentage: Math.max(0, Math.min(100, Math.round((result.finalPrice / result.basePrice) * 100))),
    adjustedBenchmark: result.adjustedBenchmark,
    isSpecialPartsCategory: result.isSpecialPartsCategory,
    auditTrail: result.auditTrail,
    customerSummary: result.customerSummary
  };
}
