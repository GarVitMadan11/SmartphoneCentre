import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Bot,
  X,
  Check,
  ChevronRight,
  RefreshCw,
  RotateCcw,
  ArrowLeft,
  Search,
  Smartphone
} from 'lucide-react';
import {
  Model,
  Brand,
  BRANDS,
  isAppleDevice,
  buildVariantPricesForModel,
  getModelSupportedRam,
  getModelSupportedStorage
} from '../../../data/mockDatabase';
import { updateModel } from '../../../utils/api';

interface PriceAssistantChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  models: Model[];
  brands: Brand[];
  onPriceUpdated?: (updatedModel?: Model) => void;
}

export const PriceAssistantChatbot: React.FC<PriceAssistantChatbotProps> = ({
  isOpen,
  onClose,
  models,
  brands,
  onPriceUpdated
}) => {
  // Navigation step state: 'brand' | 'series' | 'model'
  const [step, setStep] = useState<'brand' | 'series' | 'model'>('brand');
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  // Search filter inside series & model steps
  const [filterQuery, setFilterQuery] = useState('');

  // Editing forms
  const [editingVariant, setEditingVariant] = useState<{
    key: string;
    label: string;
    indianPrice: number;
  } | null>(null);

  const [editingEsim, setEditingEsim] = useState(false);
  const [inputEsimDeduction, setInputEsimDeduction] = useState('');
  const [inputIndian, setInputIndian] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setStep('brand');
      setSelectedBrand(null);
      setSelectedSeries(null);
      setSelectedModel(null);
      setEditingVariant(null);
      setEditingEsim(false);
      setToast(null);
      setFilterQuery('');
    }
  }, [isOpen]);

  const effectiveBrands = useMemo(() => {
    return brands && brands.length > 0 ? brands : BRANDS;
  }, [brands]);

  // Available series for selected brand
  const seriesList = useMemo(() => {
    if (!selectedBrand) return [];
    const brandModels = models.filter(
      (m) => (m.brandId || '').toLowerCase() === selectedBrand.id.toLowerCase()
    );
    const set = new Set<string>();
    brandModels.forEach((m) => {
      if (m.series) set.add(m.series);
    });
    return Array.from(set).sort();
  }, [models, selectedBrand]);

  // Available models for selected brand + series
  const seriesModels = useMemo(() => {
    if (!selectedBrand || !selectedSeries) return [];
    const raw = models.filter(
      (m) =>
        (m.brandId || '').toLowerCase() === selectedBrand.id.toLowerCase() &&
        (m.series || '') === selectedSeries
    );
    if (!filterQuery.trim()) return raw;
    const q = filterQuery.toLowerCase().trim();
    return raw.filter((m) => m.name.toLowerCase().includes(q));
  }, [models, selectedBrand, selectedSeries, filterQuery]);

  // Variants for selected model
  const activeVariants = useMemo(() => {
    if (!selectedModel) return [];
    const storages = getModelSupportedStorage(selectedModel);
    const rams = getModelSupportedRam(selectedModel);
    const pricesMap = buildVariantPricesForModel(selectedModel);

    const list: Array<{ key: string; label: string; indianPrice: number }> = [];
    rams.forEach((r) => {
      storages.forEach((s) => {
        const vKey = `${r}_${s}`;
        const indianPrice = pricesMap[vKey] || selectedModel.basePrice128GB || 0;
        let label = s >= 1024 ? `${s / 1024} TB` : `${s} GB`;
        if (r > 0) label += ` • ${r} GB RAM`;
        list.push({ key: vKey, label, indianPrice });
      });
    });
    return list;
  }, [selectedModel]);

  // Actions
  const handleSelectBrand = useCallback((brand: Brand) => {
    setSelectedBrand(brand);
    setSelectedSeries(null);
    setSelectedModel(null);
    setFilterQuery('');
    setStep('series');
  }, []);

  const handleSelectSeries = useCallback((seriesName: string) => {
    setSelectedSeries(seriesName);
    setSelectedModel(null);
    setFilterQuery('');
    setStep('model');
  }, []);

  const handleSelectModel = useCallback((model: Model) => {
    setSelectedModel(model);
    setEditingVariant(null);
    setEditingEsim(false);
  }, []);

  const handleBack = () => {
    setFilterQuery('');
    setEditingVariant(null);
    setEditingEsim(false);
    if (selectedModel) {
      setSelectedModel(null);
      setStep('model');
    } else if (step === 'model') {
      setSelectedSeries(null);
      setStep('series');
    } else if (step === 'series') {
      setSelectedBrand(null);
      setStep('brand');
    }
  };

  const handleSavePrice = async () => {
    if (!selectedModel || !editingVariant) return;

    const newIndian = parseInt(inputIndian, 10);
    if (isNaN(newIndian) || newIndian <= 0) {
      alert('Please enter a valid price in ₹');
      return;
    }

    setIsSaving(true);
    try {
      const currentMap = buildVariantPricesForModel(selectedModel);
      const updatedMap: Record<string, number> = {
        ...currentMap,
        [editingVariant.key]: newIndian
      };

      let updatedBasePrice = selectedModel.basePrice128GB;
      if (editingVariant.key.endsWith('_128') || editingVariant.key === '0_128') {
        updatedBasePrice = newIndian;
      }

      await updateModel(selectedModel.legacyId || selectedModel.id, {
        variantPrices: updatedMap,
        basePrice128GB: updatedBasePrice
      });

      selectedModel.variantPrices = updatedMap;
      selectedModel.basePrice128GB = updatedBasePrice;

      setToast(`Updated ${editingVariant.label} to ₹${newIndian.toLocaleString('en-IN')}`);
      setEditingVariant(null);
      if (onPriceUpdated) onPriceUpdated(selectedModel);
    } catch (err: any) {
      alert(`Failed to save price: ${err?.message || 'Server error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveEsimDeduction = async (resetToStandard: boolean = false) => {
    if (!selectedModel) return;

    let payloadDeduction: number | null = null;
    if (!resetToStandard) {
      const num = parseInt(inputEsimDeduction, 10);
      if (isNaN(num) || num < 0) {
        alert('Please enter a valid deduction in ₹ (or tap Reset to Standard)');
        return;
      }
      payloadDeduction = num > 0 ? num : null;
    }

    setIsSaving(true);
    try {
      await updateModel(selectedModel.legacyId || selectedModel.id, {
        esimDeduction: payloadDeduction
      });

      selectedModel.esimDeduction = payloadDeduction !== null ? payloadDeduction : undefined;

      setToast(
        resetToStandard
          ? `Reset eSIM deduction back to standard formula.`
          : `Set International (eSIM) deduction to ₹${payloadDeduction?.toLocaleString('en-IN')}.`
      );
      setEditingEsim(false);
      if (onPriceUpdated) onPriceUpdated(selectedModel);
    } catch (err: any) {
      alert(`Failed to update eSIM deduction: ${err?.message || 'Server error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  const isApple = selectedModel ? isAppleDevice(selectedModel.brandId, selectedModel.name) : false;
  const is17or18 = selectedModel
    ? (selectedModel.name || '').toLowerCase().includes('17') || (selectedModel.name || '').toLowerCase().includes('18')
    : false;
  const defaultPercent = is17or18 ? '8%' : '5%';

  const modalContent = (
    <div className="fixed inset-0 z-[99999] bg-slate-950/60 flex items-center justify-end sm:p-5">
      <div className="bg-white w-full sm:w-[480px] h-full sm:h-[680px] sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2.5">
            {step !== 'brand' && (
              <button
                type="button"
                onClick={handleBack}
                className="p-1 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer mr-0.5"
                title="Go back"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold tracking-tight text-white">
                  Price Assistant
                </h3>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[10px] text-blue-200">
                {selectedModel
                  ? selectedModel.name
                  : selectedSeries
                  ? `${selectedBrand?.name} • ${selectedSeries}`
                  : selectedBrand
                  ? selectedBrand.name
                  : 'Fast Live Pricing Concierge'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Toast */}
        {toast && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shrink-0 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-200 shrink-0" />
              <span className="truncate">{toast}</span>
            </div>
            <button
              type="button"
              onClick={() => setToast(null)}
              className="text-emerald-200 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Body - Single Smooth Scroll Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/70">
          
          {/* STEP 1: CHOOSE BRAND */}
          {step === 'brand' && (
            <div className="space-y-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-2xs">
                <p className="text-xs font-bold text-slate-800">
                  Select a brand to inspect or adjust valuations:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {effectiveBrands.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => handleSelectBrand(b)}
                    className="p-3 bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-400 rounded-xl text-left font-bold text-xs text-slate-700 hover:text-blue-700 transition-colors cursor-pointer flex items-center justify-between group shadow-2xs"
                  >
                    <span className="truncate">{b.name}</span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: CHOOSE SERIES */}
          {step === 'series' && selectedBrand && (
            <div className="space-y-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Brand
                  </span>
                  <span className="text-xs font-bold text-slate-900">{selectedBrand.name}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBrand(null);
                    setStep('brand');
                  }}
                  className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  Change
                </button>
              </div>

              <p className="text-xs font-bold text-slate-700 pt-1">Select Series:</p>

              <div className="grid grid-cols-2 gap-2">
                {seriesList.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleSelectSeries(s)}
                    className="p-2.5 bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-400 rounded-xl text-left font-bold text-xs text-slate-700 hover:text-blue-700 transition-colors cursor-pointer flex items-center justify-between group shadow-2xs"
                  >
                    <span className="truncate">{s}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: CHOOSE MODEL & ADJUST */}
          {step === 'model' && (
            <div className="space-y-3.5">
              
              {/* If no model is selected yet, show model picker with instant search */}
              {!selectedModel ? (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={filterQuery}
                      onChange={(e) => setFilterQuery(e.target.value)}
                      placeholder={`Search in ${selectedSeries}...`}
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1.5">
                    {seriesModels.length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-6">No models found</p>
                    ) : (
                      seriesModels.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSelectModel(m)}
                          className="w-full p-2.5 bg-white hover:bg-blue-50/80 border border-slate-200 hover:border-blue-400 rounded-xl text-left font-bold text-xs text-slate-800 hover:text-blue-700 transition-colors cursor-pointer flex items-center justify-between group shadow-2xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <Smartphone className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                            <span className="truncate">{m.name}</span>
                          </div>
                          <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : (
                /* Selected Model View */
                <div className="space-y-3">
                  
                  {/* Model Header with Switch Model button */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 shadow-2xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                        Selected Model
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        {selectedModel.name}
                      </h4>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedModel(null)}
                      className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      Change Model
                    </button>
                  </div>

                  {/* Apple eSIM deduction card */}
                  {isApple && (
                    <div className="p-3 bg-blue-50/80 border border-blue-200 rounded-xl flex items-center justify-between gap-2 shadow-2xs">
                      <div>
                        <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide block">
                          International (eSIM) Deduction
                        </span>
                        <span className="text-xs font-mono font-bold text-blue-700">
                          {selectedModel.esimDeduction
                            ? `-₹${selectedModel.esimDeduction.toLocaleString('en-IN')} (Custom Flat)`
                            : `Standard (${defaultPercent})`}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingVariant(null);
                          setEditingEsim(true);
                          setInputEsimDeduction(
                            selectedModel.esimDeduction ? selectedModel.esimDeduction.toString() : ''
                          );
                        }}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] cursor-pointer shadow-xs transition-colors"
                      >
                        {selectedModel.esimDeduction ? 'Change / Reset' : 'Set Custom'}
                      </button>
                    </div>
                  )}

                  {/* Active eSIM Edit Form */}
                  {editingEsim && (
                    <div className="p-4 bg-white border-2 border-indigo-600 rounded-2xl shadow-lg space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-indigo-900">
                          Configure eSIM Deduction
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingEsim(false)}
                          className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Custom Flat Deduction in ₹ (When "No physical SIM" is selected)
                        </label>
                        <input
                          type="number"
                          value={inputEsimDeduction}
                          onChange={(e) => setInputEsimDeduction(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                          placeholder="e.g. 5000"
                          autoFocus
                        />
                        <p className="text-[10px] text-slate-500 mt-1">
                          Applies dynamically to all variants of {selectedModel.name}.
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                        <button
                          type="button"
                          onClick={() => handleSaveEsimDeduction(true)}
                          disabled={isSaving}
                          className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-bold text-[11px] cursor-pointer flex items-center gap-1 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Reset to Standard</span>
                        </button>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingEsim(false)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEsimDeduction(false)}
                            disabled={isSaving}
                            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                          >
                            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                            <span>Save</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Active Variant Price Edit Form */}
                  {editingVariant && (
                    <div className="p-4 bg-white border-2 border-blue-600 rounded-2xl shadow-lg space-y-3 animate-in fade-in">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                        <span className="text-xs font-bold text-blue-900">
                          Edit {editingVariant.label} Base Price
                        </span>
                        <button
                          type="button"
                          onClick={() => setEditingVariant(null)}
                          className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Base Valuation (₹)
                        </label>
                        <input
                          type="number"
                          value={inputIndian}
                          onChange={(e) => setInputIndian(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                          placeholder="e.g. 62000"
                          autoFocus
                        />
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setEditingVariant(null)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={handleSavePrice}
                          disabled={isSaving}
                          className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                        >
                          {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>Save Live Price</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* List of storage tiers */}
                  <div className="space-y-2 pt-1">
                    <span className="text-xs font-bold text-slate-700 block">
                      Base Valuations (Physical SIM)
                    </span>

                    {activeVariants.map((v) => (
                      <div
                        key={v.key}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                      >
                        <div>
                          <span className="font-bold text-slate-900 text-xs block">{v.label}</span>
                          <span className="text-xs font-mono font-bold text-slate-800">
                            ₹{v.indianPrice.toLocaleString('en-IN')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setEditingEsim(false);
                            setEditingVariant(v);
                            setInputIndian(v.indianPrice.toString());
                          }}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-2xs shrink-0"
                        >
                          Edit Price
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-white border-t border-slate-200 text-center shrink-0">
          <p className="text-[11px] text-slate-500 font-medium">
            💡 Changes take effect immediately in the pricing engine and live customer valuation.
          </p>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default PriceAssistantChatbot;
