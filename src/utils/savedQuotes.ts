import { Model, DefectRule, getDefectRulesForCategory, generateVariantsForModel } from '../data/mockDatabase';
import { calculateValuation } from './valuation';

export interface SavedQuote {
  id: string;
  userId?: string;
  modelId: string;
  modelName: string;
  brandId: string;
  category?: string;
  imageUrl?: string;
  variantId?: string;
  storageGb: number;
  ramGb?: number;
  color?: string;
  selectedDefectIds: string[];
  selectedDefectDescriptions?: string[];
  savedBasePrice: number;
  savedPayout: number;
  savedRetentionPercentage: number;
  savedAt: string;
  refCode: string;
  appliedCoupon?: string;
  couponBonus?: number;
}

export const PRICE_LOCK_DAYS = 7;
export const PRICE_LOCK_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

export interface PriceLockStatus {
  isLocked: boolean;
  expiresAt: string;
  daysRemaining: number;
}

export function getPriceLockStatus(savedAt: string): PriceLockStatus {
  const savedTime = new Date(savedAt).getTime();
  const expiresAt = new Date(savedTime + PRICE_LOCK_DURATION_MS);
  const now = Date.now();
  const isLocked = now < expiresAt.getTime();
  const remainingMs = Math.max(0, expiresAt.getTime() - now);
  const daysRemaining = Math.max(1, Math.ceil(remainingMs / (24 * 60 * 60 * 1000)));

  return {
    isLocked,
    expiresAt: expiresAt.toISOString(),
    daysRemaining,
  };
}

export interface EvaluatedSavedQuote extends SavedQuote {
  currentBasePrice: number;
  currentPayout: number;
  currentRetentionPercentage: number;
  hasPriceChanged: boolean;
  priceDifference: number;
  // Aliases for clean UI consumption
  livePrice: number;
  originalPrice: number;
  retentionPercentage: number;
  createdAt: string;
  selectedDefects: DefectRule[];
  // 7-day price lock properties
  isPriceLocked: boolean;
  lockExpiresAt: string;
  daysRemaining: number;
  guaranteedPayout: number;
  isPriceProtected: boolean;
}

const STORAGE_KEY = 'rephonix_saved_quotes';

/** Get all saved quotes, optionally filtered by user ID */
export function getSavedQuotes(userId?: string): SavedQuote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list: SavedQuote[] = JSON.parse(raw);
    if (!Array.isArray(list)) return [];
    
    if (userId) {
      // Return quotes belonging to this user, plus any guest quotes created in this browser
      return list.filter(q => q.userId === userId || !q.userId);
    }
    return list;
  } catch (err) {
    console.error('Failed to load saved quotes from localStorage:', err);
    return [];
  }
}

/** Check if an exact quote configuration is already saved */
export function isQuoteAlreadySaved(
  modelId: string,
  storageGb: number,
  selectedDefectIds: string[],
  userId?: string
): boolean {
  const existing = getSavedQuotes(userId);
  const sortedDefects = [...selectedDefectIds].sort().join(',');
  return existing.some(q => 
    q.modelId === modelId &&
    q.storageGb === storageGb &&
    [...q.selectedDefectIds].sort().join(',') === sortedDefects
  );
}

/** Save or update a trade-in valuation quote */
export function saveQuote(data: Omit<SavedQuote, 'id' | 'savedAt'>): SavedQuote {
  const existing = getSavedQuotes(data.userId);
  const sortedDefects = [...data.selectedDefectIds].sort().join(',');

  // Check if identical device + defect config is already saved
  const existingIndex = existing.findIndex(q => 
    q.modelId === data.modelId && 
    q.storageGb === data.storageGb &&
    [...q.selectedDefectIds].sort().join(',') === sortedDefects
  );

  const newQuote: SavedQuote = {
    ...data,
    id: existingIndex >= 0 ? existing[existingIndex].id : `SQ${Date.now()}`,
    savedAt: new Date().toISOString(),
  };

  let updatedList: SavedQuote[];
  if (existingIndex >= 0) {
    updatedList = [...existing];
    updatedList[existingIndex] = newQuote;
  } else {
    updatedList = [newQuote, ...existing];
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent('rephonix_saved_quotes_updated', { detail: newQuote }));
  } catch (err) {
    console.error('Failed to persist saved quote:', err);
  }

  return newQuote;
}

/** Delete a saved quote by ID */
export function removeSavedQuote(id: string): void {
  const existing = getSavedQuotes();
  const updatedList = existing.filter(q => q.id !== id);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedList));
    window.dispatchEvent(new CustomEvent('rephonix_saved_quotes_updated', { detail: { id } }));
  } catch (err) {
    console.error('Failed to remove saved quote:', err);
  }
}

/** Associate any existing guest quotes created in this browser to the logged-in user */
export function associateGuestQuotes(userId: string): void {
  if (!userId) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const list: SavedQuote[] = JSON.parse(raw);
    if (!Array.isArray(list)) return;
    let modified = false;
    const updated = list.map(q => {
      if (!q.userId) {
        modified = true;
        return { ...q, userId };
      }
      return q;
    });
    if (modified) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('rephonix_saved_quotes_updated'));
    }
  } catch (err) {
    console.error('Failed to associate guest quotes:', err);
  }
}

/**
 * Dynamically re-evaluates a saved quote against the live catalog base prices!
 * Enforces the 7-Day Price Lock Guarantee:
 * - If the market drops within 7 days, the user's locked rate is guaranteed.
 * - If the market rises within 7 days, the user receives the higher live market rate.
 * - After 7 days, the quote follows the current market rate.
 */
export function evaluateSavedQuote(quote: SavedQuote, models: Model[]): EvaluatedSavedQuote {
  const lockStatus = getPriceLockStatus(quote.savedAt);

  // Find matching model from live catalog
  const model = models.find(m => m.id === quote.modelId || m.name.toLowerCase() === quote.modelName.toLowerCase());
  
  if (!model) {
    // If model no longer in catalog, return saved static figures with lock protection
    return {
      ...quote,
      currentBasePrice: quote.savedBasePrice,
      currentPayout: quote.savedPayout,
      currentRetentionPercentage: quote.savedRetentionPercentage,
      hasPriceChanged: false,
      priceDifference: 0,
      livePrice: quote.savedPayout,
      originalPrice: quote.savedPayout,
      retentionPercentage: quote.savedRetentionPercentage,
      createdAt: quote.savedAt,
      selectedDefects: [],
      isPriceLocked: lockStatus.isLocked,
      lockExpiresAt: lockStatus.expiresAt,
      daysRemaining: lockStatus.daysRemaining,
      guaranteedPayout: quote.savedPayout,
      isPriceProtected: false,
    };
  }

  // Find matching variant
  const variants = generateVariantsForModel(model);
  const variant = variants.find(v => v.id === quote.variantId || v.storageGb === quote.storageGb) || variants[0];
  const currentBasePrice = variant ? variant.basePrice : quote.savedBasePrice;

  // Reconstruct declared defects from category/model rules
  const rules = getDefectRulesForCategory(model.category, model.brandId, model.name, model.id);
  const selectedDefects = rules.filter(r => (quote.selectedDefectIds || []).includes(r.id));

  // Recalculate live valuation
  const liveValuation = variant ? calculateValuation(variant, selectedDefects, {
    modelId: model.id,
    brandId: model.brandId,
    modelName: model.name,
    category: model.category,
  }) : { finalPrice: quote.savedPayout, retentionPercentage: quote.savedRetentionPercentage };

  const currentPayout = liveValuation.finalPrice;
  const currentRetentionPercentage = liveValuation.retentionPercentage;

  // 7-DAY PRICE LOCK GUARANTEE:
  // While price lock is active:
  // - If market drops below locked rate (currentPayout < quote.savedPayout): protect and honor savedPayout.
  // - If market rises above locked rate (currentPayout > quote.savedPayout): give the customer the higher payout.
  // If price lock has expired (> 7 days): track current live payout.
  const isPriceProtected = lockStatus.isLocked && currentPayout < quote.savedPayout;
  const guaranteedPayout = lockStatus.isLocked ? Math.max(quote.savedPayout, currentPayout) : currentPayout;

  const hasPriceChanged = guaranteedPayout !== quote.savedPayout;
  const priceDifference = guaranteedPayout - quote.savedPayout;

  return {
    ...quote,
    currentBasePrice,
    currentPayout,
    currentRetentionPercentage,
    hasPriceChanged,
    priceDifference,
    livePrice: guaranteedPayout,
    originalPrice: quote.savedPayout,
    retentionPercentage: currentRetentionPercentage,
    createdAt: quote.savedAt,
    selectedDefects,
    imageUrl: quote.imageUrl || model.imageUrl,
    isPriceLocked: lockStatus.isLocked,
    lockExpiresAt: lockStatus.expiresAt,
    daysRemaining: lockStatus.daysRemaining,
    guaranteedPayout,
    isPriceProtected,
  };
}
