import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { TABLET_MODELS, Model, Variant, getModelSupportedRam, getModelSupportedStorage, getVariantPrice, sortModelsByLaunchDesc } from '../../data/mockDatabase';
import { applyModelOrder } from '../../utils/ordering';
import { Tablet, Sparkles, ArrowRight, Search, X, Cpu, HardDrive, CheckCircle2, Wifi, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TabletsShowcaseProps {
  onSelectVariant: (model: Model, variant: Variant) => void;
  onBackToHome: () => void;
  defaultBrand?: 'all' | 'apple' | 'samsung';
}

export const TabletsShowcase: React.FC<TabletsShowcaseProps> = ({
  onSelectVariant,
  onBackToHome,
  defaultBrand,
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

  const filteredModels = useMemo(() => {
    const list = TABLET_MODELS.filter(m => {
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
    return applyModelOrder(targetBrand, sorted);
  }, [selectedBrand, searchQuery]);

  const ramOptions = useMemo(() => {
    if (!selectedModelForSpec) return [];
    return getModelSupportedRam(selectedModelForSpec).filter(r => r > 0);
  }, [selectedModelForSpec]);

  const storageOptions = useMemo(() => {
    if (!selectedModelForSpec) return [128, 256, 512];
    return getModelSupportedStorage(selectedModelForSpec);
  }, [selectedModelForSpec]);

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
    const baseVal = getVariantPrice(selectedModelForSpec, effectiveRam, selectedStorage);
    // Wi-Fi only models have ~8% lower base trade-in value than Cellular (SIM) models
    return connectivity === 'wifi' ? Math.max(1000, Math.round(baseVal * 0.92)) : baseVal;
  }, [selectedModelForSpec, selectedRam, selectedStorage, ramOptions, connectivity]);

  const handleOpenSpecModal = (model: Model) => {
    const defaultRams = getModelSupportedRam(model).filter(r => r > 0);
    const defaultStorages = model.supportedStorageGb && model.supportedStorageGb.length > 0 ? model.supportedStorageGb : [128, 256, 512];
    setSelectedRam(defaultRams.length > 0 ? defaultRams[0] : 0);
    setSelectedStorage(defaultStorages[0]);
    setConnectivity('cellular');
    setSelectedModelForSpec(model);
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
              All Tablets ({TABLET_MODELS.length})
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
              <span>Apple iPads</span>
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
              <span>Samsung Galaxy Tabs</span>
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
                  {formatPrice(model.basePrice128GB)}
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
                    onClick={() => setSelectedModelForSpec(null)}
                    className="p-2 rounded-lg border border-ice-border text-zinc-400 hover:text-ink-navy hover:bg-zinc-100 transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 text-left overflow-y-auto flex-1">
                  
                  {/* 1. Network & SIM Connectivity Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-ink-navy uppercase tracking-wider flex items-center gap-1.5">
                        <Wifi className="w-4 h-4 text-cobalt" /> Select Network &amp; Connectivity
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">SIM / Cellular Specs</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() => setConnectivity('cellular')}
                        className={`py-3.5 px-3.5 rounded-xl border text-xs font-bold font-mono transition-all flex items-center justify-between ${
                          connectivity === 'cellular'
                            ? 'bg-cobalt text-white border-cobalt shadow-md shadow-cobalt/20'
                            : 'bg-canvas-white text-ink-slate border-ice-border hover:border-cobalt/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Radio className="w-4 h-4" />
                          <div className="text-left">
                            <span className="block font-bold text-xs">Wi-Fi + Cellular</span>
                            <span className={`text-[9px] ${connectivity === 'cellular' ? 'text-white/80' : 'text-zinc-400'}`}>Has SIM Slot / 5G / 4G</span>
                          </div>
                        </div>
                        {connectivity === 'cellular' && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>

                      <button
                        type="button"
                        onClick={() => setConnectivity('wifi')}
                        className={`py-3.5 px-3.5 rounded-xl border text-xs font-bold font-mono transition-all flex items-center justify-between ${
                          connectivity === 'wifi'
                            ? 'bg-cobalt text-white border-cobalt shadow-md shadow-cobalt/20'
                            : 'bg-canvas-white text-ink-slate border-ice-border hover:border-cobalt/40'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Wifi className="w-4 h-4" />
                          <div className="text-left">
                            <span className="block font-bold text-xs">Wi-Fi Only</span>
                            <span className={`text-[9px] ${connectivity === 'wifi' ? 'text-white/80' : 'text-zinc-400'}`}>No SIM Card Slot</span>
                          </div>
                        </div>
                        {connectivity === 'wifi' && <CheckCircle2 className="w-4 h-4 text-white" />}
                      </button>
                    </div>
                  </div>

                  {/* 2. RAM Variant Selector (for Android Tablets e.g., Galaxy Tab) */}
                  {ramOptions.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-mono font-bold text-ink-navy uppercase tracking-wider flex items-center gap-1.5">
                          <Cpu className="w-4 h-4 text-cobalt" /> Select RAM Variant
                        </span>
                        <span className="text-[10px] text-zinc-400 font-mono">Memory Specs</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2.5">
                        {ramOptions.map(ram => (
                          <button
                            key={ram}
                            type="button"
                            onClick={() => setSelectedRam(ram)}
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

                  {/* 3. Storage Capacity Selector */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-ink-navy uppercase tracking-wider flex items-center gap-1.5">
                        <HardDrive className="w-4 h-4 text-violet-500" /> Select Storage Capacity
                      </span>
                      <span className="text-[10px] text-zinc-400 font-mono">Internal Storage</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {storageOptions.map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => setSelectedStorage(st)}
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

                  {/* Live Calculated Trade-In Price Banner */}
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 rounded-xl p-4 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-emerald-800 uppercase block tracking-wider">
                        Live Estimated Payout
                      </span>
                      <span className="text-xs font-mono text-emerald-700">
                        Spec: {connectivity === 'cellular' ? 'Wi-Fi + Cellular · ' : 'Wi-Fi Only · '}{ramOptions.length > 0 ? `${selectedRam}GB RAM / ` : ''}{selectedStorage >= 1024 ? `${selectedStorage / 1024}TB` : `${selectedStorage}GB`}
                      </span>
                    </div>
                    <span className="text-2xl font-black text-emerald-700 font-mono">
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
