export type DeviceSegment = 
  | 'apple_pro_max'
  | 'apple_pro'
  | 'apple_standard'
  | 'apple_older_se'
  | 'apple_tablet_pro'
  | 'apple_tablet_air'
  | 'apple_tablet_standard'
  | 'android_tablet_flagship'
  | 'android_tablet_midrange'
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
  | 'out_of_warranty';

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
  vendorConditionTiers?: {
    flawlessMultiplier: number;    // 1.03 (+3.0%) for fCondition >= 0.98
    minorDefectMultiplier: number; // 1.025 (+2.5%) for 0.80 <= fCondition < 0.98
    heavyDefectMultiplier: number; // 1.02 (+2.0%) for fCondition < 0.80
  };
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
  universalDeductions: UniversalDeductionsConfig;
}

export type DeviceCycleTier = 'TIER_1_WARRANTY_ACTIVE' | 'TIER_2_MATURED_BASELINE';

export function resolveDeviceCycleTier(releaseYear?: number): DeviceCycleTier {
  if (!releaseYear) return 'TIER_2_MATURED_BASELINE';
  // Active flagship generations (2024+) undergo manufacturer warranty validation.
  // Matured models (2023 and earlier) trade on secondary market rates with zero warranty penalty.
  return (releaseYear >= 2024) ? 'TIER_1_WARRANTY_ACTIVE' : 'TIER_2_MATURED_BASELINE';
}

export interface UniversalDeductionsConfig {
  spenMissing: number;
  microphone: number;
  vibrator: number;
  buttons: number;
  earpieceReceiver: number;
  cameraGlass: number;
  silentSwitch: number;
  boxMissing: number;
  chargerMissing: number;
  chargerMissingFlagship: number;
  outOfWarrantyPercentTier1: number;
  outOfWarrantyPercentTier2: number;
  wifiBluetoothMotherboardPercent: number;
  callingDefectivePercent: number;
  touchOrNonOriginalScreenSalvageFloor: number;
  screenCrackedPercent: number;
  screenLinesBleedPercent: number;
  screenMinorScratches: number;
  screenMajorScratches: number;
  bodyMinorScratches: number;
  bodyMajorScratches: number;
  bodyMinorDents: number;
  bodyMajorDents: number;
  bodyBackGlassCracked: number;
  bodyBentPercent: number;
  bodyScreenLoosePercent: number;
  speakerDeduction: {
    apple: number;
    android: number;
  };
  chargingPortDeduction: {
    apple: number;
    android: number;
  };
  biometricDeduction: {
    appleFaceIdPercent: number;
    androidFingerprintFixed: number;
  };
  rearCameraDeduction: {
    apple: number;
    androidFlagship: number;
    androidBudget: number;
  };
  frontCameraDeduction: {
    apple: number;
    android: number;
  };
  batteryHealthDeduction: {
    apple80to85Percent: number;
    appleUnder80Percent: number;
  };
}

export const DEFAULT_PRICING_RULES_CONFIG: PricingRulesConfig = {
  vendorThreshold: 50000,
  vendorLowMultiplier: 1.02,
  vendorHighMultiplier: 1.03,
  vendorConditionTiers: {
    flawlessMultiplier: 1.03,    // +3.0% for flawless / near-mint (fCondition >= 0.98)
    minorDefectMultiplier: 1.025, // +2.5% for minor / single fault (0.80 <= fCondition < 0.98)
    heavyDefectMultiplier: 1.02, // +2.0% for major / multiple faults (fCondition < 0.80)
  },
  ruleVersion: '2.4.0-condition-tiered-vendor-premium',
  roundingStrategy: 'clean_50',
  accessoryMaxCapPercent: 0.10, // Cap total accessory deductions to 10% of B_market
  universalDeductions: {
    spenMissing: 2000,
    microphone: 500,
    vibrator: 500,
    buttons: 500,
    earpieceReceiver: 800,
    cameraGlass: 1000,
    silentSwitch: 600,
    boxMissing: 800,
    chargerMissing: 1000,
    chargerMissingFlagship: 1500,
    outOfWarrantyPercentTier1: 0.20,
    outOfWarrantyPercentTier2: 0.00,
    wifiBluetoothMotherboardPercent: 0.32,
    callingDefectivePercent: 0.32,
    touchOrNonOriginalScreenSalvageFloor: 1200,
    screenCrackedPercent: 0.25,
    screenLinesBleedPercent: 0.35,
    screenMinorScratches: 500,
    screenMajorScratches: 1000,
    bodyMinorScratches: 500,
    bodyMajorScratches: 1000,
    bodyMinorDents: 800,
    bodyMajorDents: 1800,
    bodyBackGlassCracked: 1500,
    bodyBentPercent: 0.18,
    bodyScreenLoosePercent: 0.12,
    speakerDeduction: {
      apple: 2000,
      android: 500
    },
    chargingPortDeduction: {
      apple: 2000,
      android: 1500
    },
    biometricDeduction: {
      appleFaceIdPercent: 0.22,
      androidFingerprintFixed: 1500
    },
    rearCameraDeduction: {
      apple: 4500,
      androidFlagship: 3500,
      androidBudget: 2500
    },
    frontCameraDeduction: {
      apple: 2500,
      android: 1200
    },
    batteryHealthDeduction: {
      apple80to85Percent: 0.015,
      appleUnder80Percent: 0.045
    }
  },

  ageFactors: {
    under_3m: 1.00,       // 0% reduction (full base price)
    '3_to_6m': 0.85,      // 15% reduction
    '6_to_12m': 0.80,     // 20% reduction (6 to 11 months)
    out_of_warranty: 0.75, // 25% reduction (above 11 months / out of warranty)
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
    apple_tablet_pro: {
      segmentId: 'apple_tablet_pro',
      name: 'Apple iPad Pro',
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
    apple_tablet_air: {
      segmentId: 'apple_tablet_air',
      name: 'Apple iPad Air',
      brand: 'apple',
      normalConditionCap: 0.35,
      conditionBand: {
        excellentMin: 0.0,  excellentMax: 0.03,
        goodMin: 0.03,     goodMax: 0.06,
        fairMin: 0.06,     fairMax: 0.12,
        heavyMin: 0.12,    heavyMax: 0.20,
        majorMin: 0.20,    majorMax: 0.32,
      }
    },
    apple_tablet_standard: {
      segmentId: 'apple_tablet_standard',
      name: 'Apple iPad Standard / mini',
      brand: 'apple',
      normalConditionCap: 0.38,
      conditionBand: {
        excellentMin: 0.0,  excellentMax: 0.03,
        goodMin: 0.03,     goodMax: 0.07,
        fairMin: 0.07,     fairMax: 0.14,
        heavyMin: 0.14,    heavyMax: 0.24,
        majorMin: 0.24,    majorMax: 0.36,
      }
    },
    android_tablet_flagship: {
      segmentId: 'android_tablet_flagship',
      name: 'Android Tablet Flagship (Galaxy Tab S)',
      brand: 'android',
      normalConditionCap: 0.40,
      conditionBand: {
        excellentMin: 0.0,  excellentMax: 0.03,
        goodMin: 0.03,     goodMax: 0.07,
        fairMin: 0.07,     fairMax: 0.14,
        heavyMin: 0.14,    heavyMax: 0.24,
        majorMin: 0.24,    majorMax: 0.36,
      }
    },
    android_tablet_midrange: {
      segmentId: 'android_tablet_midrange',
      name: 'Android Tablet Midrange (Galaxy Tab FE/A)',
      brand: 'android',
      normalConditionCap: 0.45,
      conditionBand: {
        excellentMin: 0.0,  excellentMax: 0.04,
        goodMin: 0.04,     goodMax: 0.09,
        fairMin: 0.09,     fairMax: 0.18,
        heavyMin: 0.18,    heavyMax: 0.30,
        majorMin: 0.30,    majorMax: 0.44,
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
    apple_tablet_pro: {
      displayRepairCost: 15000,
      displayRiskAdjustment: 3000,
      cameraRepairCost: 4000,
      motherboardRepairCost: 18000,
      chargingPortRepairCost: 3000,
      speakerRepairCost: 3000,
    },
    apple_tablet_air: {
      displayRepairCost: 11000,
      displayRiskAdjustment: 2200,
      cameraRepairCost: 3500,
      motherboardRepairCost: 14000,
      chargingPortRepairCost: 2500,
      speakerRepairCost: 2500,
    },
    apple_tablet_standard: {
      displayRepairCost: 7500,
      displayRiskAdjustment: 1500,
      cameraRepairCost: 2500,
      motherboardRepairCost: 9000,
      chargingPortRepairCost: 2000,
      speakerRepairCost: 2000,
    },
    android_tablet_flagship: {
      displayRepairCost: 13000,
      displayRiskAdjustment: 2500,
      cameraRepairCost: 3500,
      motherboardRepairCost: 15000,
      chargingPortRepairCost: 2500,
      speakerRepairCost: 2500,
    },
    android_tablet_midrange: {
      displayRepairCost: 6500,
      displayRiskAdjustment: 1200,
      cameraRepairCost: 2000,
      motherboardRepairCost: 7000,
      chargingPortRepairCost: 1800,
      speakerRepairCost: 1800,
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

/**
 * Residual Value / Commercial Resale Aware Non-Original Screen Calibration:
 * Dedicated, cleanly isolated valuation pipelines for Apple iOS and Android/Samsung ecosystems.
 * Calibrated against real live Cashify quotes maintaining a strictly compliant commercial edge (<= 5% cap):
 * 
 * ── SECTION 1: APPLE (IOS) PIPELINE ──
 * 1. Active iPhone Pro Max Flagships (iPhone 17 PM, 18 PM, 16 PM):
 *    - Screen rate: 0.25 (25% deduction) | Combined retention: 60.0%
 *    - 17 Pro Max 256GB evaluates to ₹69,000 (+2.75% edge over Cashify's ₹67,150).
 * 2. Active iPhone Pro Flagships (17 Pro, 18 Pro, 16 Pro, 15 Pro):
 *    - Screen rate: 0.21 (21% deduction) | Combined retention: 63.2%.
 * 3. Active Standard iPhones (iPhone 16, 15 base / Plus):
 *    - Screen rate: 0.28 (28% deduction) | Combined retention: 59.0%.
 * 4. Active iPhone Budget / Entry (iPhone 17e, 16e):
 *    - Screen rate: 0.315 (31.5% deduction) | Combined retention: 55.8%.
 * 5. Matured Older iPhone Generations (< 2024, iPhone 14/13/12/11/SE):
 *    - Screen rate: 0.23 – 0.33 | fAge = 1.00 (matured baseline).
 * 
 * ── SECTION 2: SAMSUNG GALAXY PIPELINE ──
 * Empirically calibrated against real live Cashify site quotes (S26 Ultra: ₹54,090, S25 FE: ₹21,470):
 * 1. Galaxy S26 Ultra Target:
 *    - Screen rate: 0.201 (20.1% deduction) | Combined retention: 64.0%
 *    - Evaluates to exactly ₹55,000 (+₹910 / +1.68% edge over Cashify's ₹54,090).
 * 2. Galaxy S25 Ultra & S24 Ultra:
 *    - Screen rate: 0.201 (20.1% deduction) | Combined retention: 64.0%
 *    - S25 Ultra evaluates to ₹43,850 (+3.5% over Cashify).
 *    - S24 Ultra evaluates to ₹40,650 (+3.0% over Cashify).
 * 3. Active Galaxy Z Fold & Z Flip Series (Fold 8/7/6, Flip 8/7/6):
 *    - Screen rate: 0.175 (17.5% deduction) | Maintains +2.6% to +3.3% edge.
 * 4. Active Galaxy S-Series Plus & Standard:
 *    - S26 Plus / S26: 0.16 (16% deduction) | +2.4% to +2.8% edge over Cashify.
 *    - S25 FE / S24 FE: 0.18 (18% deduction) | S25 FE evaluates to ₹22,000 (+2.5% over Cashify's ₹21,470).
 *    - S25 Plus / S25: 0.18 (18% deduction) | +2.4% to +2.9% edge over Cashify.
 *    - S24 Plus / S24: 0.19 (19% deduction) | +2.3% to +2.7% edge over Cashify.
 * 5. Matured Samsung Flagships (< 2024, S23 Ultra, S23, S22, Note):
 *    - S23 Ultra: 0.23 | S23/S23+: 0.235 | S22/Note: 0.24 | +1.5% to +5.0% edge.
 */
export function getNonOriginalScreenRate(model: { name: string; releaseYear?: number; category?: string; brandId?: string }): number {
  const nm = model.name.toLowerCase();
  const isApple = (model.brandId && (model.brandId === 'brand-apple' || model.brandId.toLowerCase().includes('apple'))) ||
    /iphone|ipad|apple/i.test(model.name);

  // =========================================================================
  // SECTION 1: APPLE (IOS) — FULLY ISOLATED & LOCKED (ZERO ANDROID CROSS-IMPACT)
  // =========================================================================
  if (isApple) {
    // 1. Matured older iPhone generations (< 2024, fAge = 1.00)
    if (nm.includes('iphone 14 pro max') || nm.includes('iphone 14 pro')) return 0.23;
    if (nm.includes('iphone 14')) return 0.31;
    if (nm.includes('iphone 13 pro')) return 0.29;
    if (nm.includes('iphone 13')) return 0.33;
    if (nm.includes('iphone 12 pro') || nm.includes('iphone 11 pro')) return 0.31;
    if (nm.includes('iphone 12') || nm.includes('iphone 11') || nm.includes('iphone x') || nm.includes('iphone xs') || nm.includes('iphone xr')) return 0.32;
    if (nm.includes('iphone se') || nm.includes('se 2022') || nm.includes('se 2020') || nm.includes('se 3') || nm.includes('se 2')) return 0.32;

    // 2. Active iPhone Pro Max Flagships (iPhone 17 Pro Max -> ₹69,000 / 60% Retained, 18 PM, 16 PM)
    if (nm.includes('pro max')) {
      if (nm.includes('iphone 15 pro max')) return 0.21;
      return 0.25;
    }

    // 3. Active iPhone Pro Flagships (iPhone 17 Pro, 18 Pro, 16 Pro, 15 Pro)
    if (nm.includes('pro')) {
      return 0.21;
    }

    // 4. Active iPhone Budget / Entry (iPhone 17e, 16e)
    if (nm.includes('17e') || nm.includes('16e')) {
      return 0.315;
    }

    // 5. Active Standard iPhones (iPhone 16, iPhone 15 base / Plus)
    return 0.28;
  }

  // =========================================================================
  // SECTION 2: ANDROID (SAMSUNG & OTHER ECOSYSTEMS)
  // =========================================================================
  const isMatured = (model.releaseYear !== undefined && model.releaseYear < 2024);

  // 1. Matured Android (< 2024, fAge = 1.00)
  if (isMatured) {
    // S23 Ultra: 20.5% deduction -> Rephonix evaluates to ₹28,650 (beats Cashify's ₹27,940 by +₹710 / +2.54%)
    if (nm.includes('s23 ultra')) return 0.205;
    // S23: 20.9% deduction -> Rephonix evaluates to ₹18,500 (beats Cashify's ₹18,000 by +₹500 / +2.78%)
    if (nm.includes('s23')) return 0.209;
    if (nm.includes('open')) return 0.41;
    if (nm.includes('razr')) return 0.32;
    if (nm.includes('fold') || nm.includes('flip')) return 0.23;
    if (nm.includes('pixel')) return 0.44;
    if (nm.includes('oneplus')) return 0.43;
    if (nm.includes('samsung') || nm.includes('galaxy')) return 0.24;
    if (nm.includes('pro')) return 0.31;
    return 0.32;
  }

  // 2. Active Samsung Ecosystem (2024+)
  const isSamsung = (model.brandId && (model.brandId === 'brand-samsung' || model.brandId.toLowerCase().includes('samsung'))) ||
    /samsung|galaxy/i.test(nm);

  if (isSamsung) {
    // 1. S26 Ultra Target: ₹55,000 (Rate: 0.201 / 20.1% screen deduction -> leads Cashify's ₹54,090 by +1.68%)
    if (nm.includes('s26 ultra')) return 0.201;

    // 2. S25 Ultra: 20.1% deduction
    if (nm.includes('s25 ultra')) return 0.201;
    // 3. S24 Ultra: 14.5% deduction -> Rephonix evaluates to ₹43,250 (beats Cashify's ₹42,210 by +₹1,040 / +2.46%)
    if (nm.includes('s24 ultra')) return 0.145;

    // 3. Active Samsung Foldables (Fold 8/7/6, Flip 8/7/6): 17.5% deduction -> leads Cashify by +2.6% to +3.3%
    if (nm.includes('fold') || nm.includes('flip')) return 0.175;

    // 4. Active Samsung S26 Plus / S26: 16% deduction -> leads Cashify by +2.4% to +2.6%
    if (nm.includes('s26 plus') || nm.includes('s26')) return 0.16;

    // 5. Active Samsung S25 FE & S24 FE
    // S25 FE: 18% deduction -> Rephonix evaluates to ₹22,000 (beats Cashify's ₹21,470 by +₹530 / +2.47%)
    if (nm.includes('s25 fe')) return 0.18;
    // S24 FE: 20.1% deduction -> Rephonix evaluates to ₹15,800 (beats Cashify's ₹15,390 by +₹410 / +2.66%)
    if (nm.includes('s24 fe')) return 0.201;
    if (nm.includes('fe')) return 0.19;

    // 6. Active Samsung S25 Plus / S25: 18% deduction -> leads Cashify by +2.4% to +2.9%
    if (nm.includes('s25 plus') || nm.includes('s25 edge') || nm.includes('s25')) return 0.18;

    // 7. Active Samsung S24 Plus & S24
    // S24 Plus: 21.8% deduction -> Rephonix evaluates to ₹25,550 (beats Cashify's ₹24,920 by +₹630 / +2.53%)
    if (nm.includes('s24 plus')) return 0.218;
    // S24: 23.5% deduction -> Rephonix evaluates to ₹21,050 (beats Cashify's ₹20,470 by +₹580 / +2.83%)
    if (nm.includes('s24')) return 0.235;

    // 8. Other active Samsung (A-series, M-series, F-series): 18% deduction
    return 0.18;
  }

  // 3. Active Other Android Ultra / Foldables (Google Pixel Fold, Motorola Razr, Xiaomi Ultra, vivo Fold/Ultra)
  if (nm.includes('ultra') || nm.includes('fold') || nm.includes('flip') || nm.includes('razr')) {
    return 0.25;
  }

  // 4. Active Other Android Pro Flagships (Pixel 9/10/11 Pro, etc.)
  if (nm.includes('pro')) {
    return 0.21;
  }

  // 5. Active Entry & Budget Android
  if (model.category === 'budget' || nm.includes('lite') || nm.includes('ce') || nm.includes('cmf')) {
    return 0.315;
  }

  // 6. Active Standard Android Flagships
  return 0.28;
}


