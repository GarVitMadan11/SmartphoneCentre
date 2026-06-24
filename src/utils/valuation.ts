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
  
  // Calculate final price using the formula, clamping to a minimum buyback price (e.g., ₹1,000 for parts value)
  // or ₹0 if total deductions exceed the base price.
  let finalPrice = basePrice - totalDeductedSum;
  
  if (finalPrice < 0) {
    finalPrice = 0;
  } else if (finalPrice < Math.max(1000, basePrice * 0.05)) {
    // If it's still turning on but has many issues, give at least a 5% baseline recycle offer (min ₹500)
    finalPrice = Math.max(500, Math.round(basePrice * 0.05));
  }

  return {
    basePrice,
    deductions,
    isCritical: false,
    finalPrice: Math.round(finalPrice)
  };
}
