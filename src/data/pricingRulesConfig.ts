export type DeviceSegment = 
  | 'apple_pro_max'
  | 'apple_pro'
  | 'apple_standard'
  | 'apple_older_se'
  | 'android_ultra_premium'
  | 'android_premium_flagship'
  | 'android_upper_midrange'
  | 'android_midrange'
  | 'android_budget';

export interface ConditionBandConfig {
  excellentMin: number;
  excellentMax: number;
  goodMin: number;
  goodMax: number;
  fairMin: number;
  fairMax: number;
  heavyMin: number;
  heavyMax: number;
  majorMin: number;
  majorMax: number;
}

export interface SegmentConfig {
  segmentId: DeviceSegment;
  name: string;
  brand: 'apple' | 'android';
  conditionBand: ConditionBandConfig;
  normalConditionCap: number; // max deduction fraction for repairable phone (e.g., 0.35 = 35%)
}

export interface RepairCostConfig {
  displayRepairCost: number;
  displayRiskAdjustment: number;
  cameraRepairCost: number;
  motherboardRepairCost: number;
  chargingPortRepairCost: number;
  speakerRepairCost: number;
}

export type AgeFactorKey = 
  | 'under_3m'
  | '3_to_6m'
  | '6_to_12m'
  | '1_to_2y'
  | '2_to_3y'
  | '3_to_4y'
  | 'above_4y';

export type MarketDemandKey = 
  | 'high'
  | 'normal'
  | 'weak';

export type VariantFactorKey = 
  | 'indian'
  | 'imported_unlocked'
  | 'imported_esim_only'
  | 'carrier_locked';

export interface PricingRulesConfig {
  vendorThreshold: number; // ₹50,000
  vendorLowMultiplier: number; // 1.02 (+2%)
  vendorHighMultiplier: number; // 1.03 (+3%)
  ruleVersion: string;
  segments: Record<DeviceSegment, SegmentConfig>;
  repairCosts: Record<DeviceSegment, RepairCostConfig>;
  ageFactors: Record<AgeFactorKey, number>;
  marketDemandFactors: Record<MarketDemandKey, number>;
  variantFactors: Record<VariantFactorKey, number>;
  accessoryMaxCapPercent: number; // e.g. 0.10 (10% of base benchmark)
  simRegionAdjustments: {
    preferredIndianConfig: number; // ₹0
    importedConfig: number; // -₹1,500
    singleSimConfig: number; // -₹500
  };
  warrantyBonus: {
    under3mPercent: number; // +3.0%
    months3to6Percent: number; // +2.0%
    months6to12Percent: number; // +1.0%
    maxBonusPercent: number; // +4.0%
  };
  partAuthenticityDeductions: {
    original: number; // 0%
    genuineReplacement: number; // 0.02 (2%)
    nonGenuineComponent: number; // 0.08 (8%)
    majorNonGenuineComponent: number; // 0.15 (15%)
  };
  roundingStrategy: 'clean_50' | 'clean_99' | 'nearest_100';
}

export const DEFAULT_PRICING_RULES_CONFIG: PricingRulesConfig = {
  vendorThreshold: 50000,
  vendorLowMultiplier: 1.02,  // +2% for <= ₹50,000
  vendorHighMultiplier: 1.03, // +3% for > ₹50,000
  ruleVersion: '2.0.0-stage1-multiplicative',
  roundingStrategy: 'clean_50',
  accessoryMaxCapPercent: 0.10, // Cap total accessory deductions to 10% of B_market

  ageFactors: {
    under_3m: 1.00,  // 0% reduction (price remains same)
    '3_to_6m': 0.85, // 15% reduction
    '6_to_12m': 0.80, // 20% reduction (6 to 11 months)
    '1_to_2y': 0.75, // 25% reduction (above 11 months / out of warranty)
    '2_to_3y': 0.75, // 25% reduction
    '3_to_4y': 0.75, // 25% reduction
    above_4y: 0.75,  // 25% reduction
  },

  marketDemandFactors: {
    high: 1.00,
    normal: 0.97,
    weak: 0.92,
  },

  variantFactors: {
    indian: 1.00,
    imported_unlocked: 0.95,
    imported_esim_only: 0.88,
    carrier_locked: 0.75,
  },
  
  simRegionAdjustments: {
    preferredIndianConfig: 0,
    importedConfig: -1500,
    singleSimConfig: -500,
  },

  warrantyBonus: {
    under3mPercent: 0.03,     // +3%
    months3to6Percent: 0.02,  // +2%
    months6to12Percent: 0.01, // +1%
    maxBonusPercent: 0.04,    // Cap at 4%
  },

  partAuthenticityDeductions: {
    original: 0,
    genuineReplacement: 0.02,
    nonGenuineComponent: 0.08,
    majorNonGenuineComponent: 0.15,
  },

  segments: {
    apple_pro_max: {
      segmentId: 'apple_pro_max',
      name: 'Apple Pro Max',
      brand: 'apple',
      normalConditionCap: 0.35,
      conditionBand: {
        excellentMin: 0.0,  excellentMax: 0.02,
        goodMin: 0.02,     goodMax: 0.05,
        fairMin: 0.05,     fairMax: 0.10,
        heavyMin: 0.10,    heavyMax: 0.18,
        majorMin: 0.18,    majorMax: 0.30,
      }
    },
    apple_pro: {
      segmentId: 'apple_pro',
      name: 'Apple Pro',
      brand: 'apple',
      normalConditionCap: 0.35,
      conditionBand: {
        excellentMin: 0.0,  excellentMax: 0.02,
        goodMin: 0.03,     goodMax: 0.06,
        fairMin: 0.06,     fairMax: 0.11,
        heavyMin: 0.11,    heavyMax: 0.20,
        majorMin: 0.20,    majorMax: 0.32,
      }
    },
    apple_standard: {
      segmentId: 'apple_standard',
      name: 'Apple Standard',
      brand: 'apple',
      normalConditionCap: 0.35,
      conditionBand: {
        excellentMin: 0.0,  excellentMax: 0.03,
        goodMin: 0.03,     goodMax: 0.07,
        fairMin: 0.07,     fairMax: 0.13,
        heavyMin: 0.13,    heavyMax: 0.22,
        majorMin: 0.22,    majorMax: 0.35,
      }
    },
    apple_older_se: {
      segmentId: 'apple_older_se',
      name: 'Apple Older / SE',
      brand: 'apple',
      normalConditionCap: 0.35,
      conditionBand: {
        excellentMin: 0.0,  excellentMax: 0.03,
        goodMin: 0.03,     goodMax: 0.08,
        fairMin: 0.08,     fairMax: 0.15,
        heavyMin: 0.15,    heavyMax: 0.25,
        majorMin: 0.25,    majorMax: 0.35,
      }
    },
    android_ultra_premium: {
      segmentId: 'android_ultra_premium',
      name: 'Android Ultra Premium',
      brand: 'android',
      normalConditionCap: 0.40,
      conditionBand: {
        excellentMin: 0.0,  excellentMax: 0.03,
        goodMin: 0.03,     goodMax: 0.07,
        fairMin: 0.07,     fairMax: 0.13,
        heavyMin: 0.13,    heavyMax: 0.23,
        majorMin: 0.23,    majorMax: 0.35,
      }
    },
    android_premium_flagship: {
      segmentId: 'android_premium_flagship',
      name: 'Android Premium Flagship',
      brand: 'android',
      normalConditionCap: 0.40,
      conditionBand: {
        excellentMin: 0.0,  excellentMax: 0.03,
        goodMin: 0.04,     goodMax: 0.08,
        fairMin: 0.08,     fairMax: 0.15,
        heavyMin: 0.15,    heavyMax: 0.25,
        majorMin: 0.25,    majorMax: 0.40,
      }
    },
    android_upper_midrange: {
      segmentId: 'android_upper_midrange',
      name: 'Android Upper Midrange',
      brand: 'android',
      normalConditionCap: 0.45,
      conditionBand: {
        excellentMin: 0.0,  excellentMax: 0.04,
        goodMin: 0.04,     goodMax: 0.09,
        fairMin: 0.09,     fairMax: 0.17,
        heavyMin: 0.17,    heavyMax: 0.28,
        majorMin: 0.28,    majorMax: 0.42,
      }
    },
    android_midrange: {
      segmentId: 'android_midrange',
      name: 'Android Midrange',
      brand: 'android',
      normalConditionCap: 0.45,
      conditionBand: {
        excellentMin: 0.0,  excellentMax: 0.04,
        goodMin: 0.05,     goodMax: 0.10,
        fairMin: 0.10,     fairMax: 0.19,
        heavyMin: 0.19,    heavyMax: 0.32,
        majorMin: 0.32,    majorMax: 0.45,
      }
    },
    android_budget: {
      segmentId: 'android_budget',
      name: 'Android Budget',
      brand: 'android',
      normalConditionCap: 0.50,
      conditionBand: {
        excellentMin: 0.0,  excellentMax: 0.05,
        goodMin: 0.05,     goodMax: 0.11,
        fairMin: 0.11,     fairMax: 0.21,
        heavyMin: 0.21,    heavyMax: 0.35,
        majorMin: 0.35,    majorMax: 0.50,
      }
    }
  },

  repairCosts: {
    apple_pro_max: {
      displayRepairCost: 12000,
      displayRiskAdjustment: 2500,
      cameraRepairCost: 6500,
      motherboardRepairCost: 15000,
      chargingPortRepairCost: 2800,
      speakerRepairCost: 2800,
    },
    apple_pro: {
      displayRepairCost: 10000,
      displayRiskAdjustment: 2000,
      cameraRepairCost: 5500,
      motherboardRepairCost: 13000,
      chargingPortRepairCost: 2500,
      speakerRepairCost: 2500,
    },
    apple_standard: {
      displayRepairCost: 7500,
      displayRiskAdjustment: 1500,
      cameraRepairCost: 4000,
      motherboardRepairCost: 10000,
      chargingPortRepairCost: 2200,
      speakerRepairCost: 2200,
    },
    apple_older_se: {
      displayRepairCost: 4500,
      displayRiskAdjustment: 1000,
      cameraRepairCost: 2500,
      motherboardRepairCost: 6000,
      chargingPortRepairCost: 1500,
      speakerRepairCost: 1500,
    },
    android_ultra_premium: {
      displayRepairCost: 11000,
      displayRiskAdjustment: 2200,
      cameraRepairCost: 6000,
      motherboardRepairCost: 14000,
      chargingPortRepairCost: 2500,
      speakerRepairCost: 2500,
    },
    android_premium_flagship: {
      displayRepairCost: 8500,
      displayRiskAdjustment: 1800,
      cameraRepairCost: 4500,
      motherboardRepairCost: 11000,
      chargingPortRepairCost: 2000,
      speakerRepairCost: 2000,
    },
    android_upper_midrange: {
      displayRepairCost: 5500,
      displayRiskAdjustment: 1200,
      cameraRepairCost: 3000,
      motherboardRepairCost: 7500,
      chargingPortRepairCost: 1500,
      speakerRepairCost: 1500,
    },
    android_midrange: {
      displayRepairCost: 3800,
      displayRiskAdjustment: 800,
      cameraRepairCost: 2200,
      motherboardRepairCost: 5000,
      chargingPortRepairCost: 1200,
      speakerRepairCost: 1200,
    },
    android_budget: {
      displayRepairCost: 2400,
      displayRiskAdjustment: 500,
      cameraRepairCost: 1500,
      motherboardRepairCost: 3500,
      chargingPortRepairCost: 800,
      speakerRepairCost: 800,
    }
  }
};
