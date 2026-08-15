import crypto from 'node:crypto';

export type DeviceCategory = 'flagship' | 'premium' | 'midrange' | 'budget';

export const PRICING_ENGINE_VERSION = 'v1.1.0';
export const QUOTE_TTL_MINUTES = 30;

type Defect = { category: string; fixed?: number; percentage?: number; critical?: boolean };

const CAPS: Record<string, number> = { screen: .40, body: .20, camera: .18, functionality: .25, connectivity: .28, accessories: .12 };

const STORAGE_PRICE_MULTIPLIERS: Record<number, number> = { 64: 0.88, 128: 1.0, 256: 1.15, 512: 1.32, 1024: 1.55 };

export function maximumQuoteFor(basePrice128GB: number, storageGb: number): number {
  const multiplier = STORAGE_PRICE_MULTIPLIERS[storageGb] ?? 1.0;
  return Math.round(basePrice128GB * multiplier);
}

function rulesFor(category: DeviceCategory): Record<string, Defect> {
  const screen = category === 'flagship' ? .28 : category === 'premium' ? .22 : .18;
  const dent = category === 'flagship' ? .08 : category === 'premium' ? .07 : .06;
  const camera = category === 'flagship' ? .15 : category === 'premium' ? .12 : .08;
  const box = category === 'flagship' ? 2500 : 1200;
  const tone = category === 'flagship' ? 2500 : 1500;
  return {
    'defect-screen-cracked': { category: 'screen', percentage: screen }, 'defect-screen-scratches': { category: 'screen', fixed: 1000, percentage: .03 },
    'defect-screen-burn': { category: 'screen', percentage: screen }, 'defect-screen-touch': { category: 'screen', percentage: .15 }, 'defect-screen-truetone': { category: 'screen', fixed: tone },
    'defect-body-dented': { category: 'body', fixed: 1000, percentage: dent }, 'defect-body-scuffs': { category: 'body', fixed: 800, percentage: .02 },
    'defect-body-airpass': { category: 'body', fixed: category === 'flagship' ? 1500 : 800 }, 'defect-body-buttons': { category: 'body', fixed: 1200 }, 'defect-body-screws': { category: 'body', fixed: 700 },
    'defect-camera-faulty': { category: 'camera', fixed: 1000, percentage: camera }, 'defect-critical-security': { category: 'functionality', percentage: .20 },
    'defect-func-audio': { category: 'functionality', fixed: 2800 }, 'defect-func-restart': { category: 'functionality', percentage: .15 },
    'defect-battery-low': { category: 'connectivity', fixed: 2500, percentage: .05 }, 'defect-battery-warning': { category: 'connectivity', fixed: 2000, percentage: .015 },
    'defect-func-network': { category: 'connectivity', percentage: .10 }, 'defect-func-wireless': { category: 'connectivity', percentage: .07 }, 'defect-func-partmatch': { category: 'connectivity', percentage: .12 },
    'defect-box-missing': { category: 'accessories', fixed: box }, 'defect-charger-missing': { category: 'accessories', fixed: 1500 }, 'defect-acc-nodocs': { category: 'accessories', fixed: 1500 },
    'defect-critical-power': { category: 'accessories', critical: true }, 'defect-critical-icloud': { category: 'accessories', critical: true },
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
  const totals: Record<string, number> = {};
  for (const rule of selected) totals[rule.category] = (totals[rule.category] ?? 0) + (rule.fixed ?? 0) + Math.round(basePrice * (rule.percentage ?? 0));
  const deduction = Object.entries(totals).reduce((sum, [categoryName, amount]) => sum + Math.min(amount, Math.round(basePrice * (CAPS[categoryName] ?? 1))), 0);
  return Math.max(Math.max(500, Math.round(basePrice * .08)), basePrice - deduction);
}

export function generateQuoteSignature(modelLegacyId: string, storageGb: number, defectIds: string[], finalPrice: number, expiresAtIso: string): string {
  const secret = process.env.QUOTE_SIGNING_SECRET || process.env.JWT_SECRET;
  if (!secret) throw new Error('QUOTE_SIGNING_SECRET environment variable is required');
  const payload = `${modelLegacyId}:${storageGb}:${defectIds.sort().join(',')}:${finalPrice}:${expiresAtIso}:${PRICING_ENGINE_VERSION}`;
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

export function verifyQuoteSignature(modelLegacyId: string, storageGb: number, defectIds: string[], finalPrice: number, expiresAtIso: string, signature: string): boolean {
  if (new Date(expiresAtIso).getTime() < Date.now()) {
    return false; // Quote expired
  }
  const expectedSignature = generateQuoteSignature(modelLegacyId, storageGb, defectIds, finalPrice, expiresAtIso);
  return crypto.timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(expectedSignature, 'hex'));
}
