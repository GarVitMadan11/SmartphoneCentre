import { Brand, Model } from '../data/mockDatabase';

export function getSavedBrandOrder(): string[] {
  try {
    const raw = localStorage.getItem('stc_brand_order');
    return raw ? JSON.parse(raw) : [];
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

export function resetBrandOrder(): void {
  try {
    localStorage.removeItem('stc_brand_order');
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

export function resetSeriesOrder(brandId: string): void {
  try {
    localStorage.removeItem(`stc_series_order_${brandId}`);
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

export function resetModelOrder(brandId: string): void {
  try {
    localStorage.removeItem(`stc_model_order_${brandId}`);
    window.dispatchEvent(new Event('stc_catalog_order_changed'));
  } catch (e) {
    console.error('Failed to reset model order:', e);
  }
}

// Utility to apply brand order to an array of Brand objects
export function applyBrandOrder(brandsList: Brand[]): Brand[] {
  const customOrder = getSavedBrandOrder();
  if (!customOrder || customOrder.length === 0) return brandsList;
  return [...brandsList].sort((a, b) => {
    const idxA = customOrder.indexOf(a.id);
    const idxB = customOrder.indexOf(b.id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });
}

// Utility to apply series order to an array of series strings
export function applySeriesOrder(brandId: string, seriesList: string[]): string[] {
  const customOrder = getSavedSeriesOrder(brandId);
  if (!customOrder || customOrder.length === 0) return seriesList;
  return [...seriesList].sort((a, b) => {
    const idxA = customOrder.indexOf(a);
    const idxB = customOrder.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0;
  });
}

// Utility to apply model order to an array of Model objects
export function applyModelOrder(brandId: string, modelsList: Model[]): Model[] {
  const customOrder = getSavedModelOrder(brandId);
  if (!customOrder || customOrder.length === 0) return modelsList;
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
