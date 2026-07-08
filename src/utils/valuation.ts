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

// Max deduction allowed per category, as a fraction of base price
const CATEGORY_CAPS: Record<string, number> = {
  screen:        0.40, // Max 40% for all screen issues combined
  body:          0.20, // Max 20% for frame/chassis issues
  camera:        0.18, // Max 18% for camera/lens defects
  battery:       0.10, // Max 10% for battery defects
  functionality: 0.30, // Max 30% for network/wireless/hardware issues
  accessories:   0.12, // Max 12% for missing box/charger/docs
};

/**
 * Calculates trade-in value applying per-category deduction caps to prevent
 * unrealistic compounding deductions during multi-defect selections.
 */
export function calculateValuation(
  variant: Variant,
  selectedDefects: DefectRule[]
): ValuationBreakdown {
  const basePrice = variant.basePrice;

  // Critical failure → zero offer immediately
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

  // Compute raw deductions and track category totals
  const categoryTotals: Record<string, number> = {};
  const rawDeductions = selectedDefects.map(defect => {
    const raw = Math.round(
      defect.deductionFixed + (basePrice * defect.deductionPercentage)
    );
    categoryTotals[defect.category] = (categoryTotals[defect.category] || 0) + raw;
    return {
      description: defect.description,
      fixedDeduction: defect.deductionFixed,
      percentDeduction: defect.deductionPercentage,
      totalDeducted: raw,
      category: defect.category
    };
  });

  // Apply per-category caps — scale proportionally if a category exceeds its ceiling
  const deductions = rawDeductions.map(d => {
    const cap = CATEGORY_CAPS[d.category];
    const categoryTotal = categoryTotals[d.category];
    const maxForCategory = cap ? Math.round(basePrice * cap) : Infinity;

    let cappedDeducted = d.totalDeducted;
    if (categoryTotal > maxForCategory && categoryTotal > 0) {
      cappedDeducted = Math.round((d.totalDeducted / categoryTotal) * maxForCategory);
    }

    return {
      description: d.description,
      fixedDeduction: d.fixedDeduction,
      percentDeduction: d.percentDeduction,
      totalDeducted: cappedDeducted
    };
  });

  const totalDeductedSum = deductions.reduce((sum, d) => sum + d.totalDeducted, 0);

  // Clamp to a minimum recycling floor (8% of base, minimum ₹500)
  let finalPrice = basePrice - totalDeductedSum;
  const baselineRecycleOffer = Math.max(500, Math.round(basePrice * 0.08));
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
