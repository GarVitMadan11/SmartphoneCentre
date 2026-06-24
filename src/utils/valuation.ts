import { Variant, DefectRule } from '../data/mockDatabase';

export interface ValuationBreakdown {
  basePrice: number;
  deductions: {
    description: string;
    fixedDeduction: number;
    percentDeduction: number;
    totalDeducted: number;
  }[];
  isCritical: boolean;
  finalPrice: number;
}

/**
 * Calculates the trade-in value of a device based on its base variant price
 * and selected defect rules, using the formula:
 * FinalPrice = BasePrice - Sum(FixedDeduction + (BasePrice * PercentageDeduction))
 */
export function calculateValuation(
  variant: Variant,
  selectedDefects: DefectRule[]
): ValuationBreakdown {
  const basePrice = variant.basePrice;
  
  // Check for critical failures
  const hasCritical = selectedDefects.some(d => d.isCriticalFailure);
  if (hasCritical) {
    return {
      basePrice,
      deductions: selectedDefects.map(d => ({
        description: d.description,
        fixedDeduction: 0,
        percentDeduction: 1.0,
        totalDeducted: basePrice
      })),
      isCritical: true,
      finalPrice: 0
    };
  }

  const deductions = selectedDefects.map(defect => {
    const totalDeducted = Math.round(
      defect.deductionFixed + (basePrice * defect.deductionPercentage)
    );
    return {
      description: defect.description,
      fixedDeduction: defect.deductionFixed,
      percentDeduction: defect.deductionPercentage,
      totalDeducted
    };
  });

  const totalDeductedSum = deductions.reduce((sum, d) => sum + d.totalDeducted, 0);
  
  // Calculate final price using the formula, clamping to a minimum baseline recycle offer
  // (at least 5% of base price, minimum ₹500) for a device that still turns on.
  let finalPrice = basePrice - totalDeductedSum;
  const baselineRecycleOffer = Math.max(500, Math.round(basePrice * 0.05));
  
  if (finalPrice < baselineRecycleOffer) {
    finalPrice = baselineRecycleOffer;
  }

  return {
    basePrice,
    deductions,
    isCritical: false,
    finalPrice: Math.round(finalPrice)
  };
}
