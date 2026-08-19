import { Variant, DefectRule } from '../data/mockDatabase';

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
}

// Category ceiling caps (max fraction of base price allowed per category)
const CATEGORY_CAPS: Record<string, number> = {
  screen:        0.42,
  body:          0.22,
  camera:        0.18,
  functionality: 0.25,
  connectivity:  0.28,
  accessories:   0.12,
};

/**
 * Calculates trade-in value applying model category multipliers,
 * percentage vs fixed deduction calculations, category caps, and floor clamps.
 */
export function calculateValuation(
  variant: Variant,
  selectedDefects: DefectRule[]
): ValuationBreakdown {
  const basePrice = variant.basePrice;

  // Critical failure (iCloud locked, critical power failure) → zero offer immediately
  const criticalDefect = selectedDefects.find(d => d.isCriticalFailure);
  if (criticalDefect) {
    return {
      basePrice,
      deductions: [{
        description: criticalDefect.description,
        category: criticalDefect.category,
        type: 'percentage',
        deductionValue: 1.0,
        totalDeducted: basePrice
      }],
      isCritical: true,
      blockedReason: criticalDefect.subText || 'Device cannot be valued due to critical diagnostic blockage.',
      finalPrice: 0,
      retentionPercentage: 0
    };
  }

  // Compute raw deductions
  const categoryTotals: Record<string, number> = {};
  const rawDeductions: ValuationDeduction[] = selectedDefects.map(defect => {
    let rawAmount = 0;
    let type: 'percentage' | 'fixed' = 'fixed';
    let deductionValue = 0;

    if (defect.deductionPercentage > 0) {
      type = 'percentage';
      deductionValue = defect.deductionPercentage;
      rawAmount = Math.round(basePrice * defect.deductionPercentage);
    } else {
      type = 'fixed';
      deductionValue = defect.deductionFixed;
      rawAmount = Math.round(defect.deductionFixed);
    }

    categoryTotals[defect.category] = (categoryTotals[defect.category] || 0) + rawAmount;

    return {
      ruleId: defect.id,
      description: defect.description,
      category: defect.category,
      type,
      deductionValue,
      totalDeducted: rawAmount
    };
  });

  // Apply per-category caps — scale proportionally if category exceeds ceiling
  const deductions: ValuationDeduction[] = rawDeductions.map(d => {
    const capFraction = CATEGORY_CAPS[d.category];
    const categoryTotal = categoryTotals[d.category];
    const maxForCategory = capFraction ? Math.round(basePrice * capFraction) : Infinity;

    let cappedDeduction = d.totalDeducted;
    if (categoryTotal > maxForCategory && categoryTotal > 0) {
      cappedDeduction = Math.round((d.totalDeducted / categoryTotal) * maxForCategory);
    }

    return {
      ...d,
      totalDeducted: cappedDeduction
    };
  });

  const totalDeductionsSum = deductions.reduce((sum, d) => sum + d.totalDeducted, 0);

  // Minimum floor clamp (8% of base price or ₹500)
  const floorRecyclePrice = Math.max(500, Math.round(basePrice * 0.08));
  let finalPrice = basePrice - totalDeductionsSum;

  if (finalPrice < floorRecyclePrice) {
    finalPrice = floorRecyclePrice;
  }

  const retentionPercentage = Math.max(0, Math.min(100, Math.round((finalPrice / basePrice) * 100)));

  return {
    basePrice,
    deductions,
    isCritical: false,
    finalPrice: Math.round(finalPrice),
    retentionPercentage
  };
}

