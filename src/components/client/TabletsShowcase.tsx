import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TABLET_MODELS, Model, Variant, getModelSupportedRam, getModelSupportedStorage, getVariantPrice, sortModelsByLaunchDesc, isTabletDevice, getMaxVariantPrice, isAppleDevice } from '../../data/mockDatabase';
import { applyModelOrder } from '../../utils/ordering';
import { Tablet, Sparkles, ArrowRight, Search, X, Cpu, HardDrive, CheckCircle2, Wifi, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabletsShowcaseProps {
  models?: Model[];
  onSelectVariant: (model: Model, variant: Variant) => void;
  onBackToHome: () => void;
  defaultBrand?: 'all' | 'apple' | 'samsung';
  defaultModelId?: string | null;
  onDefaultModelConsumed?: () => void;
  onModelClick?: (model: Model) => void;
  onModelDismiss?: () => void;
  onVariantChange?: (model: Model, storageGb: number, ramGb?: number) => void;
}

export const TabletsShowcase: React.FC<TabletsShowcaseProps> = ({
  models: propModels,
  onSelectVariant,
  onBackToHome,
  defaultBrand,
  defaultModelId,
  onDefaultModelConsumed,
  onModelClick,
  onModelDismiss,
  onVariantChange,
}) => {
  const [selectedBrand, setSelectedBrand] = useState<'all' | 'apple' | 'samsung'>(defaultBrand ?? 'all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state for RAM, Storage & Connectivity Spec Selection
  const [selectedModelForSpec, setSelectedModelForSpec] = useState<Model | null>(null);
  const [selectedRam, setSelectedRam] = useState<number>(8);
  const [selectedStorage, setSelectedStorage] = useState<number>(128);
  const [connectivity, setConnectivity] = useState<'wifi' | 'cellular'>('cellular');

  useEffect(() => {
    if (defaultBrand) {
      setSelectedBrand(defaultBrand);
    }
  }, [defaultBrand]);

  const tabletModelsList = useMemo(() => {
    if (propModels) {
      return propModels.filter(m => !m.hidden && isTabletDevice(m.brandId, m.name, m.id));
    }
    return TABLET_MODELS.filter(m => !m.hidden);
  }, [propModels]);

  const filteredModels = useMemo(() => {
    const list = tabletModelsList.filter(m => {
      const matchesBrand =
        selectedBrand === 'all' ||
        (selectedBrand === 'apple' && m.brandId === 'brand-apple') ||
        (selectedBrand === 'samsung' && m.brandId === 'brand-samsung');

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || m.name.toLowerCase().includes(q) || (m.series && m.series.toLowerCase().includes(q));

      return matchesBrand && matchesSearch;
    });

    const sorted = sortModelsByLaunchDesc(list);
    const targetBrand = selectedBrand === 'apple' ? 'brand-apple' : selectedBrand === 'samsung' ? 'brand-samsung' : 'brand-apple';
    return applyModelOrder(targetBrand, sorted, 'tablets');
  }, [selectedBrand, searchQuery, tabletModelsList]);

  // Check if current tablet is Apple (iPads feature unified memory, no RAM selection)
  const isApple = useMemo(() => {
    if (!selectedModelForSpec) return false;
    return selectedModelForSpec.brandId === 'brand-apple' || isAppleDevice(selectedModelForSpec.brandId, selectedModelForSpec.name);
  }, [selectedModelForSpec]);

  // RAM options only available for non-Apple tablets
  const ramOptions = useMemo(() => {
    if (!selectedModelForSpec || isApple) return [];
    return getModelSupportedRam(selectedModelForSpec).filter(r => r > 0);
  }, [selectedModelForSpec, isApple]);

  const storageOptions = useMemo(() => {
    if (!selectedModelForSpec) return [128, 256, 512];
    return getModelSupportedStorage(selectedModelForSpec);
  }, [selectedModelForSpec]);

  // Automatically open spec modal when defaultModelId is passed or URL ?model= is set
  useEffect(() => {
    if (defaultModelId && tabletModelsList.length > 0) {
      const found = tabletModelsList.find(m => m.id === defaultModelId);
      if (found) {
        handleOpenSpecModal(found);
        onDefaultModelConsumed?.();
      }
    } else if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlModel = params.get('model');
      if (urlModel && tabletModelsList.length > 0) {
        const found = tabletModelsList.find(m => m.id === urlModel);
        if (found && (!selectedModelForSpec || selectedModelForSpec.id !== found.id)) {
          handleOpenSpecModal(found);
        }
      }
    }
  }, [defaultModelId, tabletModelsList]);

  // Sync selected RAM and Storage when model changes
  useEffect(() => {
    if (selectedModelForSpec) {
      if (ramOptions.length > 0 && !ramOptions.includes(selectedRam)) {
        setSelectedRam(ramOptions[0]);
      }
      if (storageOptions.length > 0 && !storageOptions.includes(selectedStorage)) {
        setSelectedStorage(storageOptions[0]);
      }
    }
  }, [selectedModelForSpec, ramOptions, storageOptions]);

  const calculatedPrice = useMemo(() => {
    if (!selectedModelForSpec) return 0;
    const effectiveRam = ramOptions.length > 0 ? selectedRam : 0;
    return getVariantPrice(selectedModelForSpec, effectiveRam, selectedStorage, connectivity);
  }, [selectedModelForSpec, selectedRam, selectedStorage, ramOptions, connectivity]);

  const handleOpenSpecModal = (model: Model) => {
    onModelClick?.(model);
    const isApp = model.brandId === 'brand-apple' || isAppleDevice(model.brandId, model.name);
    const defaultRams = isApp ? [] : getModelSupportedRam(model).filter(r => r > 0);
    const defaultStorages = model.supportedStorageGb && model.supportedStorageGb.length > 0 ? model.supportedStorageGb : [128, 256, 512];
    const initialRam = defaultRams.length > 0 ? defaultRams[0] : 0;
    const initialStorage = defaultStorages[0];
    setSelectedRam(initialRam);
    setSelectedStorage(initialStorage);
    setConnectivity('cellular');
    setSelectedModelForSpec(model);
    onVariantChange?.(model, initialStorage, initialRam > 0 ? initialRam : undefined);
  };

  const handleProceedWithSpec = () => {
    if (!selectedModelForSpec) return;
    const effectiveRam = ramOptions.length > 0 ? selectedRam : 0;
    const variant: Variant = {
      id: `${selectedModelForSpec.id}-${effectiveRam ? effectiveRam + 'gb-' : ''}${selectedStorage}gb-${connectivity}`,
      modelId: selectedModelForSpec.id,
      ramGb: effectiveRam > 0 ? effectiveRam : undefined,
      storageGb: selectedStorage,
      color: connectivity === 'cellular' ? 'Wi-Fi + Cellular (SIM)' : 'Wi-Fi Only',
      basePrice: calculatedPrice,
      connectivity: connectivity,
    };
    const targetModel = selectedModelForSpec;
    setSelectedModelForSpec(null);
    onSelectVariant(targetModel, variant);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="py-8 text-left space-y-8 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-canvas-pure border border-ice-border rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cobalt/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-cobalt/10 text-cobalt border border-cobalt/15 tracking-widest uppercase font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5 text-cobalt" /> DEDICATED TABLET PORTAL
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-navy font-outfit uppercase tracking-tight">
              Sell Your <span className="text-cobalt">Apple iPad</span> or <span className="text-secondary">Samsung Galaxy Tab</span>
            </h1>
            <p className="text-ink-slate text-sm font-light mt-2 max-w-xl">
              Get an instant valuation, free doorstep pickup in Delhi, and instant payout for your Apple iPad or Samsung Galaxy Tab.
            </p>
          </div>

          <button
            onClick={onBackToHome}
            className="self-start md:self-auto px-4 py-2 text-xs font-bold text-ink-slate hover:text-cobalt bg-canvas-white border border-ice-border hover:border-cobalt rounded-md transition-all flex items-center gap-1.5"
          >
            <span>← Back to All Gadgets</span>
          </button>
        </div>

        {/* Brand Filter Tabs & Search Bar */}
        <div className="mt-8 pt-6 border-t border-ice-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          
          {/* Brand Filter Tabs */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedBrand('all')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                selectedBrand === 'all'
                  ? 'bg-cobalt text-white shadow-sm'
                  : 'bg-canvas-white text-ink-slate border border-ice-border hover:border-cobalt/30'
              }`}
            >
              All Tablets ({tabletModelsList.length})
            </button>
            <button
              onClick={() => setSelectedBrand('apple')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedBrand === 'apple'
                  ? 'bg-black text-white shadow-sm'
                  : 'bg-canvas-white text-ink-slate border border-ice-border hover:border-black/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              <span>Apple iPads ({tabletModelsList.filter(m => m.brandId === 'brand-apple').length})</span>
            </button>
            <button
              onClick={() => setSelectedBrand('samsung')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                selectedBrand === 'samsung'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-canvas-white text-ink-slate border border-ice-border hover:border-blue-600/30'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              <span>Samsung Galaxy Tabs ({tabletModelsList.filter(m => m.brandId === 'brand-samsung').length})</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search iPad Pro, Tab S10..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-ice-border bg-canvas-white text-ink-navy text-xs focus:outline-none focus:ring-2 focus:ring-cobalt transition-all"
            />
          </div>

        </div>
      </div>

      {/* Tablets Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map((model) => (
          <motion.div
            key={model.id}
            whileHover={{ y: -4 }}
            onClick={() => handleOpenSpecModal(model)}
            className="cursor-pointer bg-canvas-pure border border-ice-border hover:border-cobalt/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-full uppercase tracking-wider ${
                  model.brandId === 'brand-apple' ? 'bg-zinc-100 text-zinc-800' : 'bg-blue-50 text-blue-700'
                }`}>
                  {model.brandId === 'brand-apple' ? 'Apple iPad' : 'Samsung Galaxy Tab'}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">{model.releaseYear}</span>
              </div>

              <h3 className="text-xl font-bold font-outfit text-ink-navy uppercase group-hover:text-cobalt transition-colors">
                {model.name}
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-1">Series: {model.series}</p>

              {/* Tablet Image */}
              <div className="my-6 h-44 flex items-center justify-center pointer-events-none">
                <img
                  src={model.imageUrl}
                  alt={model.name}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                  draggable={false}
                />
              </div>
            </div>

            <div className="pt-4 border-t border-ice-border/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-zinc-400 uppercase font-mono block">Up to Get</span>
                <span className="text-lg font-extrabold text-emerald-600 font-mono">
                  {formatPrice(getMaxVariantPrice(model))}
                </span>
              </div>
              <button
                type="button"
                className="px-3.5 py-1.5 rounded-lg bg-cobalt text-white text-xs font-bold flex items-center gap-1 group-hover:bg-cobalt/90 transition-all shadow-xs"
              >
                <span>Select Specifications</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {filteredModels.length === 0 && (
        <div className="text-center py-16 bg-canvas-pure border border-ice-border rounded-2xl">
          <Tablet className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-ink-navy">No Tablets Found</h3>
          <p className="text-xs text-zinc-500 mt-1">Try adjusting your search or brand filter.</p>
        </div>
      )}

      {/* Tablet RAM, Storage & Connectivity Spec Selection Modal */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {selectedModelForSpec && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto min-h-screen">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-canvas-pure border border-ice-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl my-auto max-h-[90vh] flex flex-col"
              >
                {/* Modal Header */}
                <div className="p-6 border-b border-ice-border flex items-center justify-between bg-canvas-white">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-cobalt/10 border border-cobalt/20 flex items-center justify-center text-cobalt flex-shrink-0">
                      <Tablet className="w-6 h-6 stroke-[2.2]" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-ink-navy font-outfit uppercase">
                        {selectedModelForSpec.name}
                      </h3>
                      <p className="text-xs font-mono text-zinc-400">
                        {selectedModelForSpec.series} · Release: {selectedModelForSpec.releaseYear}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedModelForSpec(null);
                      onModelDismiss?.();
                    }}
                    className="p-2 rounded-lg border border-ice-border text-zinc-400 hover:text-ink-navy hover:bg-zinc-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 text-left overflow-y-auto flex-1">
                  
                  {/* Step Pills Navigation Summary */}
                  <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-ice-border/60">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-violet-50 text-violet-700 border border-violet-200">
                      <HardDrive className="w-3.5 h-3.5 text-violet-600" />
                      <span>1. Storage: {selectedStorage >= 1024 ? `${selectedStorage / 1024}TB` : `${selectedStorage}GB`}</span>
                    </div>

                    {!isApple && ramOptions.length > 0 && (
                      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        <Cpu className="w-3.5 h-3.5 text-blue-600" />
                        <span>2. RAM: {selectedRam}GB</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {connectivity === 'cellular' ? <Radio className="w-3.5 h-3.5 text-emerald-600" /> : <Wifi className="w-3.5 h-3.5 text-emerald-600" />}
                      <span>{!isApple && ramOptions.length > 0 ? '3' : '2'}. {connectivity === 'cellular' ? 'Wi-Fi + Cellular' : 'Wi-Fi Only'}</span>
                    </div>
                  </div>

                  {/* 1. Storage Capacity Selector (FIRST) */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-mono font-bold text-ink-navy uppercase tracking-wider flex items-center gap-1.5">
                        <HardDrive className="w-4 h-4 text-violet-600" />
                        <span>1. Select Storage Capacity</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">Internal Storage</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {storageOptions.map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            setSelectedStorage(st);
                            if (selectedModelForSpec) {
                              const effRam = ramOptions.length > 0 ? selectedRam : 0;
                              onVariantChange?.(selectedModelForSpec, st, effRam > 0 ? effRam : undefined);
                            }
                          }}
                          className={`py-3 px-3 rounded-xl border text-xs font-bold font-mono transition-all flex items-center justify-center gap-1 ${
                            selectedStorage === st
                              ? 'bg-violet-600 text-white border-violet-600 shadow-md shadow-violet-600/20'
                              : 'bg-canvas-white text-ink-slate border-ice-border hover:border-violet-400'
                          }`}
                        >
                          <span>{st >= 1024 ? `${st / 1024} TB` : `${st} GB`}</span>
                          {selectedStorage === st && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. RAM Variant Selector (SECOND — ONLY FOR NON-APPLE TABLETS e.g., Samsung Galaxy Tab) */}
                  {!isApple && ramOptions.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2.5">
                        <span className="text-xs font-mono font-bold text-ink-navy uppercase tracking-wider flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-cobalt" />
                          <span>2. Select RAM Variant</span>
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">Memory Specs</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {ramOptions.map(ram => (
                          <button
                            key={ram}
                            type="button"
                            onClick={() => {
                              setSelectedRam(ram);
                              if (selectedModelForSpec) {
                                onVariantChange?.(selectedModelForSpec, selectedStorage, ram > 0 ? ram : undefined);
                              }
                            }}
                            className={`py-3 px-3 rounded-xl border text-xs font-bold font-mono transition-all flex items-center justify-center gap-1.5 ${
                              selectedRam === ram
                                ? 'bg-cobalt text-white border-cobalt shadow-md shadow-cobalt/20'
                                : 'bg-canvas-white text-ink-slate border-ice-border hover:border-cobalt/40'
                            }`}
                          >
                            <span>{ram} GB RAM</span>
                            {selectedRam === ram && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Wi-Fi Variant vs Wi-Fi + Cellular (THIRD) */}
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-mono font-bold text-ink-navy uppercase tracking-wider flex items-center gap-1.5">
                        <Wifi className="w-4 h-4 text-emerald-600" />
                        <span>{!isApple && ramOptions.length > 0 ? '3' : '2'}. Select Wi-Fi or Wi-Fi + Cellular</span>
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">SIM / Cellular Specs</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Wi-Fi Only */}
                      <button
                        type="button"
                        onClick={() => {
                          setConnectivity('wifi');
                          if (selectedModelForSpec) {
                            onVariantChange?.(selectedModelForSpec, selectedStorage, selectedRam > 0 ? selectedRam : undefined);
                          }
                        }}
                        className={`py-4 px-4 rounded-xl border text-xs font-bold font-mono transition-all flex items-center justify-between ${
                          connectivity === 'wifi'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                            : 'bg-canvas-white text-ink-slate border-ice-border hover:border-emerald-500/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            connectivity === 'wifi' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'
                          }`}>
                            <Wifi className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <span className="block font-bold text-sm">Wi-Fi Only</span>
                            <span className={`text-[10px] block font-light mt-0.5 ${connectivity === 'wifi' ? 'text-white/85' : 'text-zinc-500'}`}>
                              No SIM card slot or eSIM
                            </span>
                          </div>
                        </div>
                        {connectivity === 'wifi' && <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-2" />}
                      </button>

                      {/* Wi-Fi + Cellular */}
                      <button
                        type="button"
                        onClick={() => {
                          setConnectivity('cellular');
                          if (selectedModelForSpec) {
                            onVariantChange?.(selectedModelForSpec, selectedStorage, selectedRam > 0 ? selectedRam : undefined);
                          }
                        }}
                        className={`py-4 px-4 rounded-xl border text-xs font-bold font-mono transition-all flex items-center justify-between ${
                          connectivity === 'cellular'
                            ? 'bg-cobalt text-white border-cobalt shadow-md shadow-cobalt/20'
                            : 'bg-canvas-white text-ink-slate border-ice-border hover:border-cobalt/50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                            connectivity === 'cellular' ? 'bg-white/20 text-white' : 'bg-cobalt/10 text-cobalt'
                          }`}>
                            <Radio className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <span className="block font-bold text-sm">Wi-Fi + Cellular</span>
                            <span className={`text-[10px] block font-light mt-0.5 ${connectivity === 'cellular' ? 'text-white/85' : 'text-zinc-500'}`}>
                              Has SIM tray / eSIM (5G/4G)
                            </span>
                          </div>
                        </div>
                        {connectivity === 'cellular' && <CheckCircle2 className="w-4 h-4 text-white shrink-0 ml-2" />}
                      </button>
                    </div>
                  </div>

                  {/* Estimated Payout Banner */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300/90 rounded-xl p-4 flex items-center justify-between shadow-xs">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-950 uppercase block tracking-wider mb-0.5">
                        Estimated Payout
                      </span>
                      <span className="text-xs font-mono font-semibold text-emerald-900">
                        {selectedStorage >= 1024 ? `${selectedStorage / 1024}TB` : `${selectedStorage}GB`}
                        {!isApple && ramOptions.length > 0 ? ` · ${selectedRam}GB RAM` : ''}
                        {` · ${connectivity === 'cellular' ? 'Wi-Fi + Cellular' : 'Wi-Fi Only'}`}
                      </span>
                    </div>
                    <span className="text-2xl font-black text-emerald-700 font-outfit">
                      {formatPrice(calculatedPrice)}
                    </span>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-6 border-t border-ice-border bg-canvas-white flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedModelForSpec(null)}
                    className="px-4 py-2.5 rounded-xl border border-ice-border text-xs font-bold text-ink-slate hover:bg-zinc-100 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProceedWithSpec}
                    className="px-5 py-2.5 rounded-xl bg-cobalt hover:bg-cobalt/90 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-cobalt/20 transition-all"
                  >
                    <span>Proceed to Diagnostics</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
};
