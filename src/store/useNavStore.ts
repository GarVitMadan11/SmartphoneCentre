import { create } from 'zustand';
import { startTransition } from 'react';

interface NavState {
  path: string;
  pendingModelId: string | null;
  pendingBrandId: string | null;
  pendingVariant: { storageGb?: number; ramGb?: number } | null;

  navigate: (newPath: string) => void;
  setPendingModelId: (id: string | null) => void;
  setPendingBrandId: (id: string | null) => void;
  setPendingVariant: (v: { storageGb?: number; ramGb?: number } | null) => void;
  clearPending: () => void;
}

export const useNavStore = create<NavState>((set) => ({
  path: window.location.pathname,
  pendingModelId: null,
  pendingBrandId: null,
  pendingVariant: null,

  navigate: (newPath) => {
    startTransition(() => {
      window.history.pushState({}, '', newPath);
      set({ path: newPath });
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
  },

  setPendingModelId: (id) => set({ pendingModelId: id }),
  setPendingBrandId: (id) => set({ pendingBrandId: id }),
  setPendingVariant: (v) => set({ pendingVariant: v }),
  clearPending: () => set({ pendingModelId: null, pendingBrandId: null, pendingVariant: null }),
}));
