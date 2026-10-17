import { Brand, Model } from '../data/mockDatabase';

/**
 * Normalizes any string to a clean alphanumeric slug:
 * e.g. "iPhone 15 Pro" -> "iphone-15-pro"
 * or "iphone15pro" -> "iphone15pro" (for flexible matching)
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Strips all non-alphanumeric characters for fuzzy matching:
 * e.g. "iPhone 15 Pro" -> "iphone15pro"
 */
export function compactSlug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/**
 * Generates formatted variant slug suffix:
 * e.g.:
 *  - Apple 256GB -> "256gb"
 *  - Apple 1024GB -> "1tb"
 *  - Apple 2048GB -> "2tb"
 *  - Android 12GB RAM, 256GB -> "12gb-256gb"
 *  - Android 16GB RAM, 1024GB -> "16gb-1tb"
 */
export function formatVariantSlug(storageGb: number, ramGb?: number): string {
  const storageStr = storageGb === 1024 ? '1tb' : storageGb === 2048 ? '2tb' : `${storageGb}gb`;
  if (ramGb && ramGb > 0) {
    return `${ramGb}gb-${storageStr}`;
  }
  return storageStr;
}

/**
 * Parses a variant slug like "256gb", "1tb", "2tb", "12gb-256gb", "16gb-1tb":
 * Returns { ramGb: number | undefined, storageGb: number } or null.
 */
export function parseVariantSlug(slug: string): { ramGb?: number; storageGb?: number } | null {
  if (!slug) return null;
  const clean = slug.toLowerCase().trim();

  // Pattern 1: {ram}gb-{storage}(gb|tb) e.g. "12gb-256gb" or "16gb-1tb"
  const ramStorageMatch = clean.match(/^(\d+)gb-(\d+)(gb|tb)$/);
  if (ramStorageMatch) {
    const ramGb = parseInt(ramStorageMatch[1], 10);
    const num = parseInt(ramStorageMatch[2], 10);
    const unit = ramStorageMatch[3];
    const storageGb = unit === 'tb' ? num * 1024 : num;
    return { ramGb, storageGb };
  }

  // Pattern 2: storage only e.g. "256gb", "512gb", "1tb", "2tb"
  const storageMatch = clean.match(/^(\d+)(gb|tb)$/);
  if (storageMatch) {
    const num = parseInt(storageMatch[1], 10);
    const unit = storageMatch[2];
    const storageGb = unit === 'tb' ? num * 1024 : num;
    return { storageGb };
  }

  return null;
}

/**
 * Generates an SEO & user-friendly model/variant URL path:
 * e.g.
 *   - Apple: "/apple/iphone-17-pro-max/2tb"
 *   - Android: "/samsung/galaxy-z-fold-8/16gb-512gb"
 *   - Model without variant: "/apple/iphone-17-pro-max"
 */
export function getModelUrlPath(
  brandNameOrId: string,
  modelName: string,
  storageGb?: number,
  ramGb?: number
): string {
  const brandSlug = slugify(brandNameOrId.replace(/^brand-/, ''));
  const modelSlug = slugify(modelName);
  if (storageGb) {
    const variantSlug = formatVariantSlug(storageGb, ramGb);
    return `/${brandSlug}/${modelSlug}/${variantSlug}`;
  }
  return `/${brandSlug}/${modelSlug}`;
}

export interface MatchedPathResult {
  model: Model;
  brandSlug: string;
  modelSlug: string;
  variant?: {
    ramGb?: number;
    storageGb?: number;
  };
}

/**
 * Resolves a model & optional variant from pathnames like:
 *   - "/apple/iphone-17-pro-max"
 *   - "/apple/iphone-17-pro-max/2tb"
 *   - "/samsung/galaxy-z-fold-8/16gb-512gb"
 * Returns null if not a model URL.
 */
export function matchModelFromPath(
  pathname: string,
  models: Model[],
  brands: Brand[]
): MatchedPathResult | null {
  const clean = pathname.split('?')[0].replace(/^\/|\/$/g, '');
  const segments = clean.split('/');

  if (segments.length !== 2 && segments.length !== 3) return null;

  const [rawBrandSlug, rawModelSlug, rawVariantSlug] = segments;
  const brandCompact = compactSlug(rawBrandSlug);
  const modelCompact = compactSlug(rawModelSlug);

  if (!brandCompact || !modelCompact) return null;

  // Reserved root routes that have subpaths
  const reservedPrefixes = ['api', 'assets', 'admin', 'profile', 'login', 'signup', 'forgot-password', 'reset-password', 'verify-email'];
  if (reservedPrefixes.includes(rawBrandSlug.toLowerCase())) return null;

  // Optional variant parsing if 3 segments present
  let variantParsed: { ramGb?: number; storageGb?: number } | undefined;
  if (rawVariantSlug) {
    const parsed = parseVariantSlug(rawVariantSlug);
    if (!parsed) return null; // If 3 segments but 3rd segment is not a valid variant, don't false-match
    variantParsed = parsed;
  }

  // 1. Find brand matching slug or name or id
  const matchedBrand = brands.find(b => {
    const bIdCompact = compactSlug(b.id.replace(/^brand-/, ''));
    const bNameCompact = compactSlug(b.name);
    return bIdCompact === brandCompact || bNameCompact === brandCompact;
  });

  // 2. Find model by comparing compact name or legacy/model id
  for (const model of models) {
    if (model.hidden) continue;

    // Check brand correlation if brand matched
    if (matchedBrand && model.brandId !== matchedBrand.id) {
      continue;
    }

    const modelNameCompact = compactSlug(model.name);
    const modelIdCompact = compactSlug(model.id);

    if (modelNameCompact === modelCompact || modelIdCompact === modelCompact) {
      return {
        model,
        brandSlug: rawBrandSlug,
        modelSlug: rawModelSlug,
        variant: variantParsed,
      };
    }
  }

  // Fallback: If brand didn't match directly, try finding model across all brands
  if (!matchedBrand) {
    for (const model of models) {
      if (model.hidden) continue;
      const modelNameCompact = compactSlug(model.name);
      if (modelNameCompact === modelCompact) {
        return {
          model,
          brandSlug: rawBrandSlug,
          modelSlug: rawModelSlug,
          variant: variantParsed,
        };
      }
    }
  }

  return null;
}
