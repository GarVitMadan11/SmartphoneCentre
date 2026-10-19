import { create } from 'zustand';
import type { Brand, Booking } from '../data/mockDatabase';
import type { Model } from '../data/mockDatabase';
import { fetchBrands, fetchModels, fetchBookings as apiFetchBookings, getCachedModels, hasAdminToken } from '../utils/api';
import { applyBrandOrder } from '../utils/ordering';

interface CatalogState {
  brands: Brand[];
  models: Model[];
  orderedBrands: Brand[];
  apiBookings: Booking[];
  orderVersion: number;

  setBrands: (brands: Brand[]) => void;
  setModels: (models: Model[]) => void;
  setApiBookings: (bookings: Booking[]) => void;
  bumpOrderVersion: () => void;

  refreshCatalog: () => Promise<void>;
  refreshBookings: () => Promise<void>;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  brands: [],
  models: (() => {
    const cached = getCachedModels();
    return cached.length > 0 ? (cached as Model[]) : [];
  })(),
  orderedBrands: [],
  apiBookings: [],
  orderVersion: 0,

  setBrands: (brands) =>
    set({ brands, orderedBrands: applyBrandOrder(brands) }),

  setModels: (models) => set({ models }),

  setApiBookings: (bookings) => set({ apiBookings: bookings }),

  bumpOrderVersion: () => {
    const { brands } = get();
    set((s) => ({
      orderVersion: s.orderVersion + 1,
      orderedBrands: applyBrandOrder(brands),
    }));
  },

  refreshCatalog: async () => {
    try {
      const [brandsRes, modelsRes] = await Promise.allSettled([
        fetchBrands(),
        fetchModels(),
      ]);
      if (brandsRes.status === 'fulfilled' && brandsRes.value.length > 0) {
        set({
          brands: brandsRes.value,
          orderedBrands: applyBrandOrder(brandsRes.value),
        });
      }
      if (modelsRes.status === 'fulfilled' && modelsRes.value.length > 0) {
        set({ models: modelsRes.value as Model[] });
      }
    } catch {
      console.info('[CatalogStore] API unavailable, using static catalog data');
    }
  },

  refreshBookings: async () => {
    if (!hasAdminToken()) return;
    try {
      const bookings = await apiFetchBookings();
      if (bookings.length > 0) set({ apiBookings: bookings as unknown as Booking[] });
    } catch {
      console.info('[CatalogStore] API unavailable for bookings');
    }
  },
}));
