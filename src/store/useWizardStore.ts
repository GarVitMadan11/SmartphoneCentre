import { create } from 'zustand';
import type { Model, Variant, DefectRule } from '../data/mockDatabase';

// ── localStorage persistence helpers (non-sensitive nav state only) ──────────
const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_KEY = 'stc_nav';

export type ActiveStage = 'select' | 'tablets' | 'diagnose' | 'schedule' | 'admin';

interface StoredNavState {
  activeStage: ActiveStage;
  wizardStep: number;
  selectedModelId?: string;
  selectedVariant?: Variant;
  selectedDefectIds?: string[];
  finalPrice?: number;
  timestamp: number;
}

function loadNavState(): StoredNavState | null {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredNavState;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !['select', 'tablets', 'diagnose', 'schedule', 'admin'].includes(parsed.activeStage) ||
      typeof parsed.wizardStep !== 'number' ||
      typeof parsed.timestamp !== 'number' ||
      Date.now() - parsed.timestamp > SESSION_TTL_MS
    ) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    return null;
  }
}

function saveNavState(state: Omit<StoredNavState, 'timestamp'>) {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, timestamp: Date.now() }));
  } catch {
    // Silently fail if storage is full
  }
}

function clearNavState() {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────

interface WizardState {
  // Workflow stage
  activeStage: ActiveStage;
  wizardStep: number;

  // Device selection
  selectedModel: Model | null;
  selectedVariant: Variant | null;
  selectedDefects: DefectRule[];
  finalPrice: number;

  // Tablet brand filter
  selectedTabletBrand: 'all' | 'apple' | 'samsung';

  // Computed
  isWorkflow: boolean;

  // Setters
  setActiveStage: (stage: ActiveStage) => void;
  setWizardStep: (step: number | ((prev: number) => number)) => void;
  setSelectedModel: (model: Model | null) => void;
  setSelectedVariant: (variant: Variant | null) => void;
  setSelectedDefects: (defects: DefectRule[] | ((prev: DefectRule[]) => DefectRule[])) => void;
  setFinalPrice: (price: number) => void;
  setSelectedTabletBrand: (brand: 'all' | 'apple' | 'samsung') => void;

  // Actions
  handleVariantSelected: (model: Model, variant: Variant) => void;
  handleDiagnosticsComplete: (price: number, defects: DefectRule[]) => void;
  reset: () => void;
  persistNavState: () => void;
}

const saved = loadNavState();

export const useWizardStore = create<WizardState>((set, get) => ({
  activeStage: saved?.activeStage === 'admin' ? 'select' : (saved?.activeStage ?? 'select'),
  wizardStep: saved?.wizardStep ?? 0,
  selectedModel: null,
  selectedVariant: saved?.selectedVariant ?? null,
  selectedDefects: [],
  finalPrice: typeof saved?.finalPrice === 'number' && saved.finalPrice > 0 ? saved.finalPrice : 0,
  selectedTabletBrand: 'all',

  get isWorkflow() {
    const { activeStage, selectedModel, selectedVariant } = get();
    return (activeStage === 'diagnose' || activeStage === 'schedule') &&
      selectedModel !== null && selectedVariant !== null;
  },

  setActiveStage: (stage) => {
    set({ activeStage: stage });
    get().persistNavState();
  },

  setWizardStep: (stepOrFn) => {
    set((state) => ({
      wizardStep: typeof stepOrFn === 'function' ? stepOrFn(state.wizardStep) : stepOrFn,
    }));
    get().persistNavState();
  },

  setSelectedModel: (model) => set({ selectedModel: model }),
  setSelectedVariant: (variant) => set({ selectedVariant: variant }),
  setSelectedDefects: (defectsOrFn) => {
    set((state) => {
      const current = Array.isArray(state.selectedDefects) ? state.selectedDefects : [];
      const next = typeof defectsOrFn === 'function' ? defectsOrFn(current) : defectsOrFn;
      return {
        selectedDefects: Array.isArray(next) ? next : [],
      };
    });
    get().persistNavState();
  },
  setFinalPrice: (price) => set({ finalPrice: price }),
  setSelectedTabletBrand: (brand) => set({ selectedTabletBrand: brand }),

  handleVariantSelected: (model, variant) => {
    set({
      selectedModel: model,
      selectedVariant: variant,
      selectedDefects: [],
      wizardStep: 0,
      finalPrice: variant.basePrice,
      activeStage: 'diagnose',
    });
    get().persistNavState();
  },

  handleDiagnosticsComplete: (price, defects) => {
    set({ finalPrice: price, selectedDefects: defects, activeStage: 'schedule' });
    get().persistNavState();
  },

  reset: () => {
    set({
      selectedModel: null,
      selectedVariant: null,
      selectedDefects: [],
      finalPrice: 0,
      wizardStep: 0,
      activeStage: 'select',
      selectedTabletBrand: 'all',
    });
    clearNavState();
  },

  persistNavState: () => {
    const { activeStage, wizardStep, selectedModel, selectedVariant, selectedDefects, finalPrice } = get();
    const safeDefects = Array.isArray(selectedDefects) ? selectedDefects : [];
    const safeStep = typeof wizardStep === 'number' ? wizardStep : 0;
    if (activeStage === 'diagnose' || activeStage === 'schedule') {
      if (selectedModel) {
        saveNavState({
          activeStage,
          wizardStep: safeStep,
          selectedModelId: selectedModel.id,
          selectedVariant: selectedVariant || undefined,
          selectedDefectIds: safeDefects.map((d) => d.id),
          finalPrice,
        });
      }
    } else if (activeStage === 'admin') {
      saveNavState({ activeStage: 'admin', wizardStep: 0 });
    } else {
      clearNavState();
    }
  },
}));

// Export storage helpers for App.tsx bootstrap
export { loadNavState, saveNavState, clearNavState };
export type { StoredNavState };
