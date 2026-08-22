import { Brand, Model, sortModelsByLaunchDesc } from '../data/mockDatabase';

export const DEFAULT_SERIES_ORDER: Record<string, string[]> = {
  'brand-apple': [
    'iPhone 17 Series',
    'iPhone 16 Series',
    'iPhone 15 Series',
    'iPhone 14 Series',
    'iPhone 13 Series',
    'iPhone 12 Series',
    'iPhone 11 Series',
    'iPhone X / XS Series',
    'iPhone SE Series'
  ],
  'brand-samsung': [
    'S Series',
    'Z Fold & Z Flip',
    'A Series',
    'M Series',
    'F Series'
  ],
  'brand-oneplus': [
    'Numbered Series',
    'Nord Series'
  ],
  'brand-xiaomi': [
    'Xiaomi Series',
    'Redmi Note Series',
    'Redmi Series',
    'POCO F Series',
    'POCO X Series',
    'POCO M Series'
  ],
  'brand-vivo': [
    'X Series & Folds',
    'V Series',
    'T Series',
    'Y Series',
    'S Series'
  ],
  'brand-oppo': [
    'Find X Series',
    'Reno Series',
    'F Series',
    'A Series'
  ],
  'brand-motorola': [
    'Razr Series',
    'Edge Series',
    'G Series'
  ],
  'brand-google': [
    'Pixel 9 Series',
    'Pixel 8 Series',
    'Pixel 7 Series',
    'Pixel 6 Series'
  ],
  'brand-nothing': [
    'Phone Series'
  ]
};

export function getSavedBrandOrder(): string[] {
  try {
    const raw = localStorage.getItem('stc_brand_order');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    // Purge outdated cached brand order if Motorola comes before vivo so new DEFAULT_BRAND_ORDER applies immediately
    const motoIdx = parsed.indexOf('brand-motorola');
    const vivoIdx = parsed.indexOf('brand-vivo');
    if (motoIdx !== -1 && vivoIdx !== -1 && motoIdx < vivoIdx) {
      localStorage.removeItem('stc_brand_order');
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
}

export function saveBrandOrder(order: string[]): void {
  try {
    localStorage.setItem('stc_brand_order', JSON.stringify(order));
    window.dispatchEvent(new Event('stc_catalog_order_changed'));
  } catch (e) {
    console.error('Failed to save brand order:', e);
  }
}

export function saveBrandDefaultOrder(order: string[]): void {
  try {
    localStorage.setItem('stc_default_brand_order', JSON.stringify(order));
    localStorage.setItem('stc_brand_order', JSON.stringify(order));
    window.dispatchEvent(new Event('stc_catalog_order_changed'));
  } catch (e) {
    console.error('Failed to save default brand order:', e);
  }
}

export function resetBrandOrder(): void {
  try {
    const customDefault = localStorage.getItem('stc_default_brand_order');
    if (customDefault) {
      localStorage.setItem('stc_brand_order', customDefault);
    } else {
      localStorage.removeItem('stc_brand_order');
    }
    window.dispatchEvent(new Event('stc_catalog_order_changed'));
  } catch (e) {
    console.error('Failed to reset brand order:', e);
  }
}

export function getSavedSeriesOrder(brandId: string): string[] {
  try {
    const raw = localStorage.getItem(`stc_series_order_${brandId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSeriesOrder(brandId: string, order: string[]): void {
  try {
    localStorage.setItem(`stc_series_order_${brandId}`, JSON.stringify(order));
    window.dispatchEvent(new Event('stc_catalog_order_changed'));
  } catch (e) {
    console.error('Failed to save series order:', e);
  }
}

export function saveSeriesDefaultOrder(brandId: string, order: string[]): void {
  try {
    localStorage.setItem(`stc_default_series_order_${brandId}`, JSON.stringify(order));
    localStorage.setItem(`stc_series_order_${brandId}`, JSON.stringify(order));
    window.dispatchEvent(new Event('stc_catalog_order_changed'));
  } catch (e) {
    console.error('Failed to save default series order:', e);
  }
}

export function resetSeriesOrder(brandId: string): void {
  try {
    const customDefault = localStorage.getItem(`stc_default_series_order_${brandId}`);
    if (customDefault) {
      localStorage.setItem(`stc_series_order_${brandId}`, customDefault);
    } else {
      localStorage.removeItem(`stc_series_order_${brandId}`);
    }
    window.dispatchEvent(new Event('stc_catalog_order_changed'));
  } catch (e) {
    console.error('Failed to reset series order:', e);
  }
}

export function getSavedModelOrder(brandId: string): string[] {
  try {
    const raw = localStorage.getItem(`stc_model_order_${brandId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveModelOrder(brandId: string, order: string[]): void {
  try {
    localStorage.setItem(`stc_model_order_${brandId}`, JSON.stringify(order));
    window.dispatchEvent(new Event('stc_catalog_order_changed'));
  } catch (e) {
    console.error('Failed to save model order:', e);
  }
}

export function saveModelDefaultOrder(brandId: string, order: string[]): void {
  try {
    localStorage.setItem(`stc_default_model_order_${brandId}`, JSON.stringify(order));
    localStorage.setItem(`stc_model_order_${brandId}`, JSON.stringify(order));
    window.dispatchEvent(new Event('stc_catalog_order_changed'));
  } catch (e) {
    console.error('Failed to save default model order:', e);
  }
}

export function resetModelOrder(brandId: string): void {
  try {
    const customDefault = localStorage.getItem(`stc_default_model_order_${brandId}`);
    if (customDefault) {
      localStorage.setItem(`stc_model_order_${brandId}`, customDefault);
    } else {
      localStorage.removeItem(`stc_model_order_${brandId}`);
    }
    window.dispatchEvent(new Event('stc_catalog_order_changed'));
  } catch (e) {
    console.error('Failed to reset model order:', e);
  }
}

export function clearCustomDefaults(brandId?: string): void {
  try {
    if (brandId) {
      localStorage.removeItem(`stc_default_series_order_${brandId}`);
      localStorage.removeItem(`stc_default_model_order_${brandId}`);
      localStorage.removeItem(`stc_series_order_${brandId}`);
      localStorage.removeItem(`stc_model_order_${brandId}`);
    } else {
      localStorage.removeItem('stc_default_brand_order');
      localStorage.removeItem('stc_brand_order');
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('stc_default_') || key.startsWith('stc_series_order_') || key.startsWith('stc_model_order_')) {
          localStorage.removeItem(key);
        }
      });
    }
    window.dispatchEvent(new Event('stc_catalog_order_changed'));
  } catch (e) {
    console.error('Failed to clear custom defaults:', e);
  }
}

export const DEFAULT_BRAND_ORDER: string[] = [
  'brand-apple',
  'brand-samsung',
  'brand-google',
  'brand-oneplus',
  'brand-xiaomi',
  'brand-vivo',
  'brand-oppo',
  'brand-nothing',
  'brand-motorola',
];

// Utility to apply brand order to an array of Brand objects
export function applyBrandOrder(brandsList: Brand[]): Brand[] {
  const customOrder = getSavedBrandOrder();
  const orderToUse = (customOrder && customOrder.length > 0) ? customOrder : DEFAULT_BRAND_ORDER;
  return [...brandsList].sort((a, b) => {
    const idxA = orderToUse.indexOf(a.id);
    const idxB = orderToUse.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });
}

export function getSeriesHierarchyWeight(seriesName: string): number {
  const name = seriesName.toLowerCase();
  
  // Extract generation / series number if present (e.g. "iPhone 17 Series" -> 17, "Pixel 9 Series" -> 9)
  const matchNum = name.match(/(\d+)/);
  const numBonus = matchNum ? parseInt(matchNum[1], 10) * 10 : 0;

  let baseWeight = 70;

  if (name.includes('ultra') || name.includes('fold') || name.includes('flip') || name.includes('find x') || name.includes('xiaomi series') || name.includes('razr')) {
    baseWeight = 100;
  } else if (name.includes('pro') || name.includes('s series') || name.includes('x series') || name.includes('numbered series')) {
    baseWeight = 95;
  } else if (name.includes('reno') || name.includes('v series') || name.includes('nord') || name.includes('redmi note') || name.includes('poco f') || name.includes('edge')) {
    baseWeight = 85;
  } else if (name.includes('a series') || name.includes('poco x') || name.includes('g series') || name.includes('t series')) {
    baseWeight = 75;
  } else if (name.includes('y series') || name.includes('f series') || name.includes('m series') || name.includes('poco m') || name.includes('redmi series') || name.includes('se series')) {
    baseWeight = 60;
  } else if (name.includes('poco c')) {
    baseWeight = 40;
  }

  return baseWeight * 100 + numBonus;
}

export function sortSeriesByHierarchy(brandId: string, seriesList: string[]): string[] {
  const defaultList = DEFAULT_SERIES_ORDER[brandId];
  return [...seriesList].sort((a, b) => {
    if (defaultList) {
      const idxA = defaultList.indexOf(a);
      const idxB = defaultList.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
    }
    const weightA = getSeriesHierarchyWeight(a);
    const weightB = getSeriesHierarchyWeight(b);
    if (weightB !== weightA) return weightB - weightA;
    return a.localeCompare(b);
  });
}

// Utility to apply series order to an array of series strings
export function applySeriesOrder(brandId: string, seriesList: string[]): string[] {
  const customOrder = getSavedSeriesOrder(brandId);
  if (customOrder && customOrder.length > 0) {
    return [...seriesList].sort((a, b) => {
      const idxA = customOrder.indexOf(a);
      const idxB = customOrder.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }

  return sortSeriesByHierarchy(brandId, seriesList);
}

// Utility to apply model order to an array of Model objects
export function applyModelOrder(brandId: string, modelsList: Model[]): Model[] {
  const customOrder = getSavedModelOrder(brandId);
  if (!customOrder || customOrder.length === 0) {
    return sortModelsByLaunchDesc(modelsList);
  }
  return [...modelsList].sort((a, b) => {
    const idxA = customOrder.indexOf(a.id);
    const idxB = customOrder.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });
}

// Fisher-Yates shuffle array helper
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
