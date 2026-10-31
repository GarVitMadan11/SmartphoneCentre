import crypto from 'node:crypto';

export type DeviceCategory = 'flagship' | 'premium' | 'midrange' | 'budget';

export const PRICING_ENGINE_VERSION = 'v1.1.0';
export const QUOTE_TTL_MINUTES = 30;

type Defect = { category: string; fixed?: number; percentage?: number; critical?: boolean };

const CAPS: Record<string, number> = { screen: .40, body: .20, camera: .18, functionality: .25, connectivity: .28, accessories: .12 };

const STORAGE_PRICE_MULTIPLIERS: Record<number, number> = { 64: 0.88, 128: 1.0, 256: 1.15, 512: 1.32, 1024: 1.55 };

export function maximumQuoteFor(
  basePrice128GB: number,
  storageGb: number,
  variantPrices?: string | Record<string, number> | null,
  ramGb?: number
): number {
  if (variantPrices) {
    let pricesObj: Record<string, number> | null = null;
    if (typeof variantPrices === 'string') {
      try {
        pricesObj = JSON.parse(variantPrices);
      } catch {}
    } else if (typeof variantPrices === 'object' && variantPrices !== null) {
      pricesObj = variantPrices as Record<string, number>;
    }

    if (pricesObj && Object.keys(pricesObj).length > 0) {
      if (ramGb) {
        const exactKey = `${ramGb}_${storageGb}`;
        if (pricesObj[exactKey] !== undefined && Number(pricesObj[exactKey]) > 0) {
          return Number(pricesObj[exactKey]);
        }
      }
      for (const [key, price] of Object.entries(pricesObj)) {
        const parts = key.split('_');
        const keyStorage = parts.length > 1 ? Number(parts[1]) : Number(parts[0]);
        if (keyStorage === storageGb && Number(price) > 0) {
          return Number(price);
        }
      }
    }
  }

  const multiplier = STORAGE_PRICE_MULTIPLIERS[storageGb] ?? 1.0;
  return Math.round(basePrice128GB * multiplier);
}

function rulesFor(category: DeviceCategory): Record<string, Defect> {
  const screen = category === 'flagship' ? .28 : category === 'premium' ? .22 : .18;
  const dent = category === 'flagship' ? .08 : category === 'premium' ? .07 : .06;
  const camera = category === 'flagship' ? .08 : category === 'premium' ? .07 : .06;
  const box = category === 'flagship' ? 1800 : category === 'premium' ? 1000 : category === 'midrange' ? 600 : 400;
  const tone = category === 'flagship' ? 2500 : 1500;
  return {
    'defect-screen-cracked': { category: 'screen', percentage: screen }, 'defect-screen-scratches': { category: 'screen', fixed: 1000, percentage: .03 },
    'defect-screen-burn': { category: 'screen', percentage: screen }, 'defect-screen-touch': { category: 'screen', percentage: .15 }, 'defect-screen-truetone': { category: 'screen', fixed: tone }, 'defect-screen-crease': { category: 'screen', fixed: 1500, percentage: .35 },
    'defect-body-dented': { category: 'body', fixed: 1000, percentage: dent }, 'defect-body-backglass': { category: 'body', fixed: category === 'flagship' ? 2500 : category === 'premium' ? 1800 : 1200 }, 'defect-body-scuffs': { category: 'body', fixed: 800, percentage: .02 },
    'defect-body-airpass': { category: 'body', fixed: category === 'flagship' ? 1500 : 800 }, 'defect-body-buttons': { category: 'body', fixed: 1200 }, 'defect-body-screws': { category: 'body', fixed: 700 }, 'defect-body-hinge': { category: 'body', fixed: category === 'flagship' ? 2000 : 1500, percentage: category === 'flagship' ? .20 : .18 },
    'defect-camera-faulty': { category: 'camera', fixed: 1000, percentage: camera }, 'defect-camera-glass': { category: 'camera', fixed: category === 'flagship' ? 1500 : 1000 }, 'defect-critical-security': { category: 'functionality', percentage: .20 },
    'defect-func-audio': { category: 'functionality', fixed: 2800 }, 'defect-func-restart': { category: 'functionality', percentage: .15 },
    'defect-battery-80-85': { category: 'connectivity', fixed: 1000, percentage: .025 }, 'defect-battery-low': { category: 'connectivity', fixed: category === 'flagship' ? 3500 : 2500, percentage: category === 'flagship' ? .08 : .06 },
    'defect-func-network': { category: 'connectivity', percentage: .10 }, 'defect-func-wireless': { category: 'connectivity', percentage: .07 },
    'defect-box-missing': { category: 'accessories', fixed: box }, 'defect-charger-missing': { category: 'accessories', fixed: 1000 }, 'defect-acc-nodocs': { category: 'accessories', fixed: 1500 }, 'defect-spen-missing': { category: 'accessories', fixed: 2000 },
    'defect-critical-power': { category: 'accessories', critical: true }, 'defect-critical-icloud': { category: 'accessories', critical: true },
    
    // Smartwatch specific defect rules
    'defect-watch-screen-cracked': { category: 'screen', percentage: category === 'flagship' ? .30 : category === 'premium' ? .24 : .18 },
    'defect-watch-screen-scratches': { category: 'screen', fixed: category === 'flagship' ? 1500 : 800, percentage: .03 },
    'defect-watch-screen-burn': { category: 'screen', percentage: .22 },
    'defect-watch-screen-touch': { category: 'screen', percentage: .15 },
    'defect-watch-body-dented': { category: 'body', fixed: category === 'flagship' ? 2500 : category === 'premium' ? 1500 : 1000, percentage: category === 'flagship' ? .08 : .06 },
    'defect-watch-crown-faulty': { category: 'body', fixed: 2200 },
    'defect-watch-water-seal': { category: 'body', fixed: category === 'flagship' ? 2000 : 1200 },
    'defect-watch-strap-damaged': { category: 'body', fixed: 1800 },
    'defect-watch-sensor-heart': { category: 'functionality', fixed: 2500, percentage: .08 },
    'defect-watch-sensor-ecg': { category: 'functionality', fixed: 2000, percentage: .05 },
    'defect-watch-sensor-motion': { category: 'functionality', fixed: 1800 },
    'defect-watch-speaker-mic': { category: 'functionality', fixed: 2200 },
    'defect-watch-battery-health': { category: 'connectivity', fixed: 2000 },
    'defect-watch-charging-puck': { category: 'connectivity', fixed: 2000 },
    'defect-watch-cellular-esim': { category: 'connectivity', fixed: 2500 },
    'defect-watch-wireless-gps': { category: 'connectivity', fixed: 1800 },
    'defect-watch-charger-missing': { category: 'accessories', fixed: 1500 },
    'defect-watch-box-missing': { category: 'accessories', fixed: category === 'flagship' ? 1000 : 600 },
    'defect-watch-bill-missing': { category: 'accessories', fixed: 1200 },

    // Tablet specific defect rules (iPads & Galaxy Tabs)
    'defect-tablet-network-fail': { category: 'connectivity', percentage: .12 },
    'defect-tablet-missing-sim-tray': { category: 'accessories', fixed: 500 },
    'defect-screen-scratches-minor': { category: 'screen', fixed: 800, percentage: .02 },
    'defect-screen-scratches-major': { category: 'screen', fixed: 1500, percentage: .04 },
    'defect-screen-chipped': { category: 'screen', percentage: .12 },
    'defect-screen-discolor-minor': { category: 'screen', percentage: .08 },
    'defect-screen-discolor-major': { category: 'screen', percentage: .18 },
    'defect-screen-shading': { category: 'screen', percentage: .14 },
    'defect-screen-spots-white-minor': { category: 'screen', percentage: .06 },
    'defect-screen-spots-multi': { category: 'screen', percentage: .16 },
    'defect-screen-lines': { category: 'screen', percentage: .28 },
    'defect-screen-light-leaks': { category: 'screen', percentage: .10 },
    'defect-func-front-camera': { category: 'camera', fixed: 1200, percentage: .08 },
    'defect-func-back-camera': { category: 'camera', fixed: 1800, percentage: .10 },
    'defect-func-camera-glass': { category: 'camera', fixed: 1200 },
    'defect-func-touch-id': { category: 'functionality', percentage: .10 },
    'defect-func-face-id': { category: 'functionality', percentage: .16 },
    'defect-func-wifi': { category: 'connectivity', percentage: .16 },
    'defect-func-gps': { category: 'connectivity', fixed: 1000, percentage: .05 },
    'defect-func-bluetooth': { category: 'connectivity', fixed: 1000, percentage: .05 },
    'defect-func-audio-jack': { category: 'functionality', fixed: 800 },
    'defect-func-volume-buttons': { category: 'functionality', fixed: 1000 },
    'defect-func-power-button': { category: 'functionality', fixed: 1500 },
    'defect-func-charging': { category: 'connectivity', percentage: .14 },
    'defect-func-mic': { category: 'functionality', fixed: 1200, percentage: .05 },
    'defect-func-speaker': { category: 'functionality', fixed: 1500, percentage: .06 },
    'defect-body-scratches-minor': { category: 'body', fixed: 600, percentage: .015 },
    'defect-body-scratches-major': { category: 'body', fixed: 1200, percentage: .03 },
    'defect-body-dents-minor': { category: 'body', fixed: 1200, percentage: .04 },
    'defect-body-dents-major': { category: 'body', fixed: 2500, percentage: .08 },
    'defect-body-bent': { category: 'body', percentage: .18 },
    'defect-body-screen-loose': { category: 'body', percentage: .12 },
    'defect-body-bent-and-loose': { category: 'body', percentage: .25 },
    'defect-body-panel-gap': { category: 'body', percentage: .10 },
    'defect-body-panel-chipped': { category: 'body', fixed: 1000, percentage: .06 },
    'defect-body-panel-broken': { category: 'body', percentage: .18 },
    'defect-body-panel-missing': { category: 'body', percentage: .25 },
    'defect-acc-missing-charger': { category: 'accessories', fixed: 1500 },
    'defect-acc-missing-box': { category: 'accessories', fixed: 800 },
    'defect-acc-missing-bill': { category: 'accessories', fixed: 1000 },
  };
}

export interface QuoteBreakdown {
  version: string;
  maxPrice: number;
  finalPrice: number;
  deductionsByCategory: Record<string, number>;
  expiresAt: string; // ISO string
  signature: string;
}

export function calculateServerValuation(basePrice: number, category: DeviceCategory, defectIds: string[]): number | null {
  const rules = rulesFor(category);
  const selected = [...new Set(defectIds)].map(id => rules[id]);
  if (selected.some(rule => !rule)) return null;
  if (selected.some(rule => rule.critical)) return 0;

  // Catastrophic touch failure clamped to scrap salvage floor
  if (defectIds.includes('defect-screen-touch')) {
    const salvageFloor = 1200;
    return Math.round(salvageFloor / 50) * 50;
  }

  const totals: Record<string, number> = {};
  for (const rule of selected) totals[rule.category] = (totals[rule.category] ?? 0) + (rule.fixed ?? 0) + Math.round(basePrice * (rule.percentage ?? 0));
  const deduction = Object.entries(totals).reduce((sum, [categoryName, amount]) => sum + Math.min(amount, Math.round(basePrice * (CAPS[categoryName] ?? 1))), 0);

  // Multi-fault compounding labor risk for 4+ hardware defects
  const hardwareDefectCount = selected.filter(r => r.category !== 'accessories').length;
  let multiFaultDeduction = 0;
  if (hardwareDefectCount >= 4) {
    const multiFaultRisk = Math.min(0.12, (hardwareDefectCount - 3) * 0.03);
    multiFaultDeduction = Math.round(basePrice * multiFaultRisk);
  }

  const salvageFloor = Math.max(1200, Math.round(basePrice * 0.08));
  const finalPrice = Math.max(salvageFloor, basePrice - deduction - multiFaultDeduction);
  return Math.round(finalPrice / 50) * 50;
}

export function generateQuoteSignature(modelLegacyId: string, storageGb: number, defectIds: string[], finalPrice: number, expiresAtIso: string): string {
  const secret = process.env.QUOTE_SIGNING_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('QUOTE_SIGNING_SECRET environment variable is required');
  const payload = `${modelLegacyId}:${storageGb}:${defectIds.sort().join(',')}:${finalPrice}:${expiresAtIso}:${PRICING_ENGINE_VERSION}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyQuoteSignature(modelLegacyId: string, storageGb: number, defectIds: string[], finalPrice: number, expiresAtIso: string, signature: string): boolean {
  if (!signature || typeof signature !== 'string') {
    return false;
  }
  if (new Date(expiresAtIso).getTime() < Date.now()) {
    return false; // Quote expired
  }
  const expectedSignature = generateQuoteSignature(modelLegacyId, storageGb, defectIds, finalPrice, expiresAtIso);
  const sigBuf = Buffer.from(signature, 'hex');
  const expectedBuf = Buffer.from(expectedSignature, 'hex');

  if (sigBuf.length === 0 || sigBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(sigBuf, expectedBuf);
}
