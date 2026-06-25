import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BRANDS, MODELS, Model, Variant, generateVariantsForModel } from '../data/mockDatabase';
import { Search, ChevronRight, Smartphone, Calendar, Layers, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DeviceSelectorProps {
  onVariantSelected: (model: Model, variant: Variant) => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({ onVariantSelected }) => {
  const [selectedBrandId, setSelectedBrandId] = useState<string>('brand-apple');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [tempVariant, setTempVariant] = useState<Variant | null>(null);
  const variantSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedModel && variantSelectorRef.current) {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        setTimeout(() => {
          variantSelectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [selectedModel]);

  // Filter models based on brand and search query
  const filteredModels = useMemo(() => {
    return MODELS.filter(model => {
      const matchesBrand = model.brandId === selectedBrandId;
      const matchesSearch = model.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesBrand && matchesSearch;
    });
  }, [selectedBrandId, searchQuery]);

  // Generate variants for the selected model
  const modelVariants = useMemo(() => {
    if (!selectedModel) return [];
    return generateVariantsForModel(selectedModel);
  }, [selectedModel]);

  // Group variants by storage
  const storageOptions = useMemo(() => {
    const storages = new Set<number>();
    modelVariants.forEach(v => storages.add(v.storageGb));
    return Array.from(storages).sort((a, b) => a - b);
  }, [modelVariants]);

  // Filter colors based on selected storage
  const [selectedStorage, setSelectedStorage] = useState<number | null>(null);

  const colorOptions = useMemo(() => {
    if (!selectedStorage) return [];
    return modelVariants.filter(v => v.storageGb === selectedStorage);
  }, [selectedStorage, modelVariants]);

  const handleModelClick = (model: Model) => {
    setSelectedModel(model);
    setSelectedStorage(null);
    setTempVariant(null);
  };

  const handleStorageSelect = (storage: number) => {
    setSelectedStorage(storage);
    setTempVariant(null);
  };

  const handleColorSelect = (variant: Variant) => {
    setTempVariant(variant);
  };

  const handleConfirm = () => {
    if (selectedModel && tempVariant) {
      onVariantSelected(selectedModel, tempVariant);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="w-full">
      {/* Brand Tabs — horizontally scrollable on mobile */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none" style={{scrollbarWidth: 'none'}}>
        {BRANDS.map(brand => {
          const isActive = selectedBrandId === brand.id;
          return (
            <button
              key={brand.id}
              onClick={() => {
                setSelectedBrandId(brand.id);
                setSelectedModel(null);
                setSelectedStorage(null);
                setTempVariant(null);
              }}
              className={`flex-shrink-0 px-4 sm:px-6 py-2.5 sm:py-3 rounded-sm font-medium text-xs sm:text-sm transition-all duration-300 flex items-center gap-1.5 sm:gap-2 border ${
                isActive
                  ? 'bg-cobalt text-white border-cobalt scale-[1.01] opacity-100'
                  : 'bg-canvas-pure text-ink-slate border-ice-border hover:border-cobalt/40 hover:bg-cobalt-light/10 opacity-60 hover:opacity-100'
              }`}
            >
              <span className="text-base sm:text-lg font-bold">{brand.logo}</span>
              {brand.name}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
        {/* Left Side: Search and Models list */}
        <div className={`${selectedModel ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all duration-500`}>
          {/* Search bar */}
          <div className="relative mb-4 sm:mb-6">
            <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search model (e.g. iPhone 15 Pro, S24)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 sm:pl-12 pr-4 py-3 sm:py-4 rounded-sm border border-ice-border bg-canvas-pure text-ink-navy text-sm placeholder:text-ink-muted focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt/20 transition-all duration-300"
            />
          </div>

          {/* Models Grid: 1 col xs, 2 col sm, 3 col md */}
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <AnimatePresence mode="popLayout">
              {filteredModels.map(model => {
                const isSelected = selectedModel?.id === model.id;
                const hasSelection = selectedModel !== null;
                return (
                    <motion.div
                    layoutId={`model-card-${model.id}`}
                    key={model.id}
                    onClick={() => handleModelClick(model)}
                    className={`p-4 sm:p-5 rounded-sm border cursor-pointer transition-all duration-300 bg-canvas-pure relative card-shimmer ${
                      isSelected
                        ? 'border-cobalt ring-1 ring-cobalt/20 scale-[1.01] opacity-100 z-10'
                        : hasSelection
                        ? 'border-ice-border opacity-40 hover:opacity-75 hover:scale-[1.005]'
                        : 'border-ice-border hover:border-cobalt/40 hover:-translate-y-0.5'
                    }`}
                  >
                    {/* Canva style premium layout */}
                    <div className="flex flex-col h-full justify-between">
                      <div className="text-left">
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm ${
                            model.category === 'flagship'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : model.category === 'premium'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                              : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                          }`}>
                            {model.category}
                          </span>
                          <span className="text-[11px] text-ink-muted flex items-center gap-1 font-mono">
                            <Calendar className="w-3 h-3" /> {model.releaseYear}
                          </span>
                        </div>
                        <h3 className="font-light text-lg text-ink-navy leading-tight mb-2">
                          {model.name}
                        </h3>
                      </div>
                      
                      <div className="pt-4 border-t border-white/[0.04] flex items-center justify-between">
                        <div className="text-left">
                          <span className="text-[9px] text-zinc-500 block uppercase font-mono tracking-wider">Payout Up To</span>
                          <span className="text-sm font-semibold text-cobalt">{formatPrice(model.basePrice128GB)}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isSelected ? 'translate-x-1 text-cobalt' : 'text-ink-muted'}`} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Side: Variant selector — slides in on desktop, stacks on mobile */}
        <AnimatePresence>
          {selectedModel && (
            <motion.div
              ref={variantSelectorRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="lg:col-span-5 bg-canvas-pure rounded-sm border border-ice-border p-4 sm:p-6"
            >
              <div className="mb-6 pb-6 border-b border-white/[0.04] text-left">
                <div className="flex items-center gap-3 mb-2">
                  <Smartphone className="w-6 h-6 text-cobalt" />
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block">Selected Model Spec</span>
                </div>
                <h3 className="text-3xl font-light text-ink-navy tracking-tight">{selectedModel.name}</h3>
                <p className="text-xs text-ink-muted mt-2 font-light">Select your device's storage capacity and color to load the live trade-in value.</p>
              </div>

              {/* Step 1: Storage */}
              <div className="mb-6">
                <label className="text-xs uppercase tracking-wider font-bold text-ink-slate block mb-3 flex items-center gap-1.5 font-mono">
                  <Layers className="w-3.5 h-3.5 text-cobalt" /> Select Storage Capacity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {storageOptions.map(storage => {
                    const isSelected = selectedStorage === storage;
                    const hasSelection = selectedStorage !== null;
                    return (
                      <button
                        key={storage}
                        onClick={() => handleStorageSelect(storage)}
                        className={`py-3 rounded-sm border text-sm font-semibold transition-all duration-300 ${
                          isSelected
                            ? 'bg-cobalt text-white border-cobalt scale-[1.01] opacity-100'
                            : hasSelection
                            ? 'bg-canvas-white text-ink-navy border-ice-border opacity-40 hover:opacity-75'
                            : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/30 hover:scale-[1.005]'
                        }`}
                      >
                        {storage >= 1024 ? '1 TB' : `${storage} GB`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Color */}
              {selectedStorage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <label className="text-xs uppercase tracking-wider font-bold text-ink-slate block mb-3 flex items-center gap-1.5 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-cobalt" /> Select Color & Carrier
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {colorOptions.map(variant => {
                      const isSelected = tempVariant?.id === variant.id;
                      const hasSelection = tempVariant !== null;
                      return (
                        <button
                          key={variant.id}
                          onClick={() => handleColorSelect(variant)}
                          className={`p-3 rounded-sm border text-left text-xs transition-all duration-300 flex flex-col justify-between ${
                            isSelected
                              ? 'bg-cobalt-light border-cobalt ring-1 ring-cobalt/20 scale-[1.01] opacity-100'
                              : hasSelection
                              ? 'bg-canvas-white text-ink-navy border-ice-border opacity-40 hover:opacity-75'
                              : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/20 hover:scale-[1.005]'
                          }`}
                        >
                          <span className="font-semibold text-ink-navy">{variant.color}</span>
                          <span className="text-[10px] text-ink-muted mt-1 font-mono uppercase">Unlocked</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Confirm Selection CTA */}
              <AnimatePresence>
                {tempVariant && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <div className="bg-canvas-white rounded-sm p-4 mb-6 border border-white/[0.06] flex items-center justify-between text-left">
                      <div>
                        <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Base Price / Mint</span>
                        <span className="text-xl font-bold text-cobalt">{formatPrice(tempVariant.basePrice)}</span>
                      </div>
                      <span className="text-xs text-ink-slate font-light">Reference Spec</span>
                    </div>

                    <button
                      onClick={handleConfirm}
                      className="w-full bg-cobalt hover:bg-cobalt-hover text-white py-4 rounded-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.01]"
                    >
                      Diagnose Condition
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
