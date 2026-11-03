import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Bot,
  User,
  X,
  Check,
  ChevronRight,
  RefreshCw,
  RotateCcw,
  ArrowLeft
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

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text?: string;
  type?: 'intro' | 'brands' | 'series' | 'models' | 'variant_list' | 'success';
  payload?: any;
}

export const PriceAssistantChatbot: React.FC<PriceAssistantChatbotProps> = ({
  isOpen,
  onClose,
  models,
  brands,
  onPriceUpdated
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);

  // Active in-place edit states
  const [editingVariant, setEditingVariant] = useState<{
    key: string;
    label: string;
    indianPrice: number;
  } | null>(null);

  const [editingEsimModel, setEditingEsimModel] = useState<Model | null>(null);
  const [inputEsimDeduction, setInputEsimDeduction] = useState<string>('');
  const [inputIndian, setInputIndian] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessNotification, setSaveSuccessNotification] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize bot greeting
  useEffect(() => {
    if (isOpen) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: '👋 Welcome to the Partner Price Assistant! Which brand would you like to inspect or adjust?',
          type: 'brands'
        }
      ]);
      setSelectedBrand(null);
      setSelectedModel(null);
      setEditingVariant(null);
      setEditingEsimModel(null);
      setSaveSuccessNotification(null);
    }
  }, [isOpen]);

  // Smooth auto-scroll only on message changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages.length, editingVariant, editingEsimModel]);

  const effectiveBrands = useMemo(() => {
    return brands && brands.length > 0 ? brands : BRANDS;
  }, [brands]);

  // Memoize model variants for selected model
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

  // 1. User picks Brand
  const handleSelectBrand = useCallback((brand: Brand) => {
    setSelectedBrand(brand);
    setSelectedModel(null);
    setEditingVariant(null);
    setEditingEsimModel(null);
    setSaveSuccessNotification(null);

    const brandModels = models.filter((m) => (m.brandId || '').toLowerCase() === brand.id.toLowerCase());
    const seriesSet = new Set<string>();
    brandModels.forEach((m) => {
      if (m.series) seriesSet.add(m.series);
    });
    const seriesList = Array.from(seriesSet).sort();

    setMessages([
      {
        id: 'welcome',
        sender: 'bot',
        text: '👋 Welcome to the Partner Price Assistant!',
        type: 'intro'
      },
      { id: `user-brand-${Date.now()}`, sender: 'user', text: brand.name },
      {
        id: `bot-series-${Date.now()}`,
        sender: 'bot',
        text: `Viewing ${brand.name}. Choose a series:`,
        type: 'series',
        payload: { seriesList, brandName: brand.name }
      }
    ]);
  }, [models]);

  // 2. User picks Series
  const handleSelectSeries = useCallback((series: string) => {
    setSelectedModel(null);
    setEditingVariant(null);
    setEditingEsimModel(null);
    setSaveSuccessNotification(null);

    const seriesModels = models.filter(
      (m) =>
        (m.brandId || '').toLowerCase() === (selectedBrand?.id || '').toLowerCase() &&
        (m.series || '') === series
    );

    setMessages((prev) => [
      ...prev.filter(m => m.type !== 'models' && m.type !== 'variant_list'),
      { id: `user-series-${Date.now()}`, sender: 'user', text: series },
      {
        id: `bot-models-${Date.now()}`,
        sender: 'bot',
        text: `Select a model in ${series}:`,
        type: 'models',
        payload: { modelsList: seriesModels }
      }
    ]);
  }, [models, selectedBrand]);

  // 3. User picks Model
  const handleSelectModel = useCallback((model: Model) => {
    setSelectedModel(model);
    setEditingVariant(null);
    setEditingEsimModel(null);
    setSaveSuccessNotification(null);

    const isApple = isAppleDevice(model.brandId, model.name);
    const is17or18 = (model.name || '').toLowerCase().includes('17') || (model.name || '').toLowerCase().includes('18');
    const defaultPercent = is17or18 ? '8%' : '5%';

    // Keep conversation clean: only show active model card
    setMessages((prev) => [
      ...prev.filter(m => m.type !== 'variant_list'),
      { id: `user-model-${Date.now()}`, sender: 'user', text: model.name },
      {
        id: `bot-varlist-${Date.now()}`,
        sender: 'bot',
        text: `Live base valuations for ${model.name}:`,
        type: 'variant_list',
        payload: {
          modelId: model.id,
          modelName: model.name,
          isApple,
          defaultPercent
        }
      }
    ]);
  }, []);

  // 4. Start edit variant price
  const handleStartEditVariant = (variant: {
    key: string;
    label: string;
    indianPrice: number;
  }) => {
    setEditingEsimModel(null);
    setEditingVariant(variant);
    setInputIndian(variant.indianPrice.toString());
  };

  // 5. Start edit eSIM deduction (Apple only)
  const handleStartEditEsim = (model: Model) => {
    setEditingVariant(null);
    setEditingEsimModel(model);
    setInputEsimDeduction(model.esimDeduction ? model.esimDeduction.toString() : '');
  };

  // 6. Save edited variant price
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

      // Update current model in-place smoothly
      selectedModel.variantPrices = updatedMap;
      selectedModel.basePrice128GB = updatedBasePrice;

      // Update state without appending giant message blocks
      setSaveSuccessNotification(`Updated ${selectedModel.name} (${editingVariant.label}) to ₹${newIndian.toLocaleString('en-IN')}`);
      setEditingVariant(null);
      if (onPriceUpdated) onPriceUpdated(selectedModel);
    } catch (err: any) {
      alert(`Failed to save price: ${err?.message || 'Server error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 7. Save custom eSIM deduction (or reset back to standard %)
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

      // Update in-place
      selectedModel.esimDeduction = payloadDeduction !== null ? payloadDeduction : undefined;

      const successNotice = resetToStandard
        ? `Reset ${selectedModel.name} eSIM deduction back to standard formula.`
        : `Set International (eSIM) deduction for ${selectedModel.name} to ₹${payloadDeduction?.toLocaleString('en-IN')}.`;

      setSaveSuccessNotification(successNotice);
      setEditingEsimModel(null);
      if (onPriceUpdated) onPriceUpdated(selectedModel);
    } catch (err: any) {
      alert(`Failed to update eSIM deduction: ${err?.message || 'Server error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const isApple = selectedModel ? isAppleDevice(selectedModel.brandId, selectedModel.name) : false;
  const is17or18 = selectedModel ? (selectedModel.name || '').toLowerCase().includes('17') || (selectedModel.name || '').toLowerCase().includes('18') : false;
  const defaultPercent = is17or18 ? '8%' : '5%';

  if (!isOpen) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[99999] bg-slate-950/60 flex items-end sm:items-center justify-end sm:p-5 transition-opacity">
      <div className="bg-white w-full sm:w-[500px] h-[94vh] sm:h-[700px] rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Chat Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm ring-1 ring-white/20">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white">Price Assistant</h3>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
              </div>
              <p className="text-[10px] text-blue-200 font-medium">Partner Valuation Concierge</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {selectedBrand && (
              <button
                type="button"
                onClick={() => {
                  setSelectedBrand(null);
                  setSelectedModel(null);
                  setEditingVariant(null);
                  setEditingEsimModel(null);
                  setSaveSuccessNotification(null);
                  setMessages([
                    {
                      id: 'welcome',
                      sender: 'bot',
                      text: '👋 Which brand would you like to inspect or adjust?',
                      type: 'brands'
                    }
                  ]);
                }}
                className="px-2 py-1 text-[11px] bg-white/10 hover:bg-white/20 rounded-md font-medium text-slate-200 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3 h-3" />
                <span>Brands</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Save Notification Toast */}
        {saveSuccessNotification && (
          <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-semibold flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-200 shrink-0" />
              <span className="truncate">{saveSuccessNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setSaveSuccessNotification(null)}
              className="text-emerald-200 hover:text-white ml-2 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Chat Body Messages */}
        <div ref={scrollRef} className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-3.5 bg-slate-50/70">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-2.5 items-start ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'bot' && (
                <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-xs ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white font-medium rounded-tr-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none space-y-2.5'
                }`}
              >
                {msg.text && <p className="font-medium text-slate-800">{msg.text}</p>}

                {/* Brands selection buttons */}
                {msg.type === 'brands' && (
                  <div className="grid grid-cols-2 gap-2 pt-1.5">
                    {effectiveBrands.map((b) => (
                      <button
                        key={b.id}
                        type="button"
                        onClick={() => handleSelectBrand(b)}
                        className="px-3 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-400 rounded-xl text-left font-bold text-xs text-slate-700 hover:text-blue-700 transition-colors cursor-pointer flex items-center justify-between group shadow-2xs"
                      >
                        <span>{b.name}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Series selection buttons */}
                {msg.type === 'series' && msg.payload?.seriesList && (
                  <div className="flex flex-wrap gap-1.5 pt-1.5">
                    {msg.payload.seriesList.map((s: string) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => handleSelectSeries(s)}
                        className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-400 rounded-lg font-bold text-xs text-slate-700 hover:text-blue-700 transition-colors cursor-pointer shadow-2xs"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}

                {/* Models selection buttons */}
                {msg.type === 'models' && msg.payload?.modelsList && (
                  <div className="space-y-1.5 pt-1.5 max-h-56 overflow-y-auto pr-1">
                    {msg.payload.modelsList.map((m: Model) => (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => handleSelectModel(m)}
                        className="w-full px-3 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-400 rounded-xl text-left font-bold text-xs text-slate-800 hover:text-blue-700 transition-colors cursor-pointer flex items-center justify-between group shadow-2xs"
                      >
                        <span className="truncate">{m.name}</span>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                      </button>
                    ))}
                  </div>
                )}

                {/* Variant prices list + eSIM deduction control */}
                {msg.type === 'variant_list' && selectedModel && (
                  <div className="space-y-2 pt-1.5">
                    {/* Apple eSIM deduction banner */}
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
                          onClick={() => handleStartEditEsim(selectedModel)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] cursor-pointer shadow-xs transition-colors"
                        >
                          {selectedModel.esimDeduction ? 'Change / Reset' : 'Set Custom'}
                        </button>
                      </div>
                    )}

                    {/* All Variant Rows */}
                    <div className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5">
                      {activeVariants.map((v) => (
                        <div
                          key={v.key}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900 text-xs block">{v.label}</span>
                            <span className="text-xs font-mono font-bold text-slate-800">
                              ₹{v.indianPrice.toLocaleString('en-IN')}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleStartEditVariant(v)}
                            className="px-3 py-1.5 bg-slate-200 hover:bg-blue-600 hover:text-white text-slate-700 rounded-lg font-bold text-xs transition-colors cursor-pointer shadow-2xs shrink-0"
                          >
                            Edit Price
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBrand(null);
                          setSelectedModel(null);
                          setEditingVariant(null);
                          setEditingEsimModel(null);
                          setSaveSuccessNotification(null);
                          setMessages([
                            {
                              id: 'welcome',
                              sender: 'bot',
                              text: '👋 Which brand would you like to inspect or adjust?',
                              type: 'brands'
                            }
                          ]);
                        }}
                        className="w-full px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer text-center"
                      >
                        Choose Another Brand
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-full bg-slate-700 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs shadow-xs">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}

          {/* Active Edit Form for Variant Base Price */}
          {editingVariant && (
            <div className="p-4 bg-white border-2 border-blue-600 rounded-2xl shadow-lg space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">
                    Edit Base Price
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">
                    {selectedModel?.name} • {editingVariant.label}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Base Valuation (₹)
                </label>
                <input
                  type="number"
                  value={inputIndian}
                  onChange={(e) => setInputIndian(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  placeholder="e.g. 62000"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVariant(null)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSavePrice}
                  disabled={isSaving}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Live Price</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Edit Form for Model eSIM Deduction (Apple only) */}
          {editingEsimModel && (
            <div className="p-4 bg-white border-2 border-indigo-600 rounded-2xl shadow-lg space-y-3.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">
                    International (eSIM) Deduction
                  </span>
                  <h4 className="text-xs font-bold text-slate-900">
                    {editingEsimModel.name}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingEsimModel(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Custom Flat Deduction in ₹ (Applies when customer selects "No physical SIM")
                </label>
                <input
                  type="number"
                  value={inputEsimDeduction}
                  onChange={(e) => setInputEsimDeduction(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/30"
                  placeholder="e.g. 5000"
                  autoFocus
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Leave empty or tap "Reset to Standard" to restore normal % deduction formula.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveEsimDeduction(true)}
                  disabled={isSaving}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-[11px] cursor-pointer flex items-center gap-1.5 transition-colors"
                  title="Revert back to standard % formula"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset to Standard</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingEsimModel(null)}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveEsimDeduction(false)}
                    disabled={isSaving}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer flex items-center gap-1.5"
                  >
                    {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save Deduction</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Chat Footer Quick Tip */}
        <div className="p-3 bg-white border-t border-slate-200 text-center">
          <p className="text-[11px] text-slate-500 font-medium">
            💡 Custom eSIM deductions apply across all storage tiers of that model without distorting Indian base prices.
          </p>
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

export default PriceAssistantChatbot;
