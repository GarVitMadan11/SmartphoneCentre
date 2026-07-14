import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BRANDS, MODELS, Model, Variant, generateVariantsForModel } from '../data/mockDatabase';
import { Search, ChevronRight, Smartphone, Calendar, Layers, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  siApple, siSamsung, siXiaomi, siVivo, siOneplus, siGoogle,
} from 'simple-icons';

// ── Brand Logo using official Simple Icons SVG paths ─────────────────────────
const BRAND_ICON_MAP: Record<string, { icon: { path: string; viewBox?: string; hex?: string }; size: number; brandColor?: string }> = {
  apple:   { icon: siApple,   size: 20 },
  samsung: { icon: siSamsung, size: 52 }, // Larger size to make horizontal wordmark readable
  xiaomi:  { icon: siXiaomi,  size: 20 },
  vivo:    { icon: siVivo,    size: 40 }, // Larger size to make horizontal wordmark readable
  oneplus: { icon: siOneplus, size: 20 },
  google:  { icon: siGoogle,  size: 20, brandColor: '#4285F4' },
};

function BrandLogo({ logo, isActive }: { logo: string; isActive: boolean }) {
  const entry = BRAND_ICON_MAP[logo];
  if (!entry) return <span className="text-sm font-bold">{logo}</span>;

  const { icon, size, brandColor } = entry;
  // When inactive, use the brand's own colour for recognition; active → white
  const fillColor = isActive ? '#ffffff' : (brandColor ?? `#${icon.hex ?? '6b7280'}`);

  return (
    <div className="h-6 flex items-center justify-center overflow-visible" style={{ flexShrink: 0 }}>
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={fillColor}
        aria-label={logo}
        style={{ flexShrink: 0 }}
      >
        <path d={icon.path} />
      </svg>
    </div>
  );
}

interface DeviceSelectorProps {
  onVariantSelected: (model: Model, variant: Variant) => void;
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({ onVariantSelected }) => {
  const [selectedBrandId, setSelectedBrandId] = useState<string>('brand-apple');
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [tempVariant, setTempVariant] = useState<Variant | null>(null);
  const variantSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // Get available series for the selected brand
  const availableSeries = useMemo(() => {
    const brandModels = MODELS.filter(m => m.brandId === selectedBrandId);
    const seriesSet = new Set<string>();
    brandModels.forEach(m => {
      if (m.series) {
        seriesSet.add(m.series);
      }
    });
    const seriesList = Array.from(seriesSet);
    
    // Sort series list in a smart way (newest/flagship first)
    return seriesList.sort((a, b) => {
      const priority = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('17')) return 100;
        if (lower.includes('16')) return 99;
        if (lower.includes('15')) return 98;
        if (lower.includes('14')) return 97;
        if (lower.includes('13')) return 96;
        if (lower.includes('12')) return 95;
        if (lower.includes('s series')) return 100;
        if (lower.includes('fold')) return 95;
        if (lower.includes('numbered')) return 100; // OnePlus Numbered
        if (lower.includes('pixel 8')) return 100;
        if (lower.includes('pixel 7')) return 99;
        if (lower.includes('pixel 6')) return 98;
        if (lower.includes('xiaomi series')) return 100;
        if (lower.includes('note')) return 90;
        if (lower.includes('poco')) return 80;
        if (lower.includes('v series')) return 90;
        if (lower.includes('legacy') || lower.includes('se')) return 10;
        return 50;
      };
      return priority(b) - priority(a);
    });
  }, [selectedBrandId]);

  // Compute stats (model count, max payout, release year range) for each series
  const seriesStats = useMemo(() => {
    const stats: Record<string, { modelCount: number; maxPayout: number; yearRange: string }> = {};
    availableSeries.forEach(seriesName => {
      const modelsInSeries = MODELS.filter(m => m.brandId === selectedBrandId && m.series === seriesName);
      const modelCount = modelsInSeries.length;
      const maxPayout = Math.max(...modelsInSeries.map(m => m.basePrice128GB), 0);
      const years = modelsInSeries.map(m => m.releaseYear);
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      const yearRange = minYear === maxYear ? `${minYear}` : `${minYear} - ${maxYear}`;
      stats[seriesName] = { modelCount, maxPayout, yearRange };
    });
    return stats;
  }, [availableSeries, selectedBrandId]);

  // Filter models based on brand, series, and debounced search query
  const filteredModels = useMemo(() => {
    return MODELS.filter(model => {
      const matchesBrand = model.brandId === selectedBrandId;
      // If search query is active, bypass series filter
      const matchesSeries = debouncedSearchQuery.trim() !== '' 
        ? true 
        : (selectedSeries === null ? true : model.series === selectedSeries);
      const matchesSearch = model.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase());
      return matchesBrand && matchesSeries && matchesSearch;
    });
  }, [selectedBrandId, selectedSeries, debouncedSearchQuery]);

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
      <div className="flex gap-2.5 mb-6 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none" style={{scrollbarWidth: 'none'}}>
        {BRANDS.map(brand => {
          const isActive = selectedBrandId === brand.id;
          return (
            <button
              key={brand.id}
              onClick={() => {
                setSelectedBrandId(brand.id);
                setSelectedSeries(null);
                setSelectedModel(null);
                setSelectedStorage(null);
                setTempVariant(null);
              }}
              className={`flex-shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 rounded-sm font-semibold text-xs sm:text-sm transition-all duration-300 flex flex-col items-center justify-center gap-1.5 border ${
                isActive
                  ? 'bg-cobalt text-white border-cobalt scale-[1.02] opacity-100 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-canvas-pure text-ink-slate border-ice-border hover:border-cobalt/40 hover:bg-cobalt-light/10 opacity-80 hover:opacity-100'
              }`}
              style={{ minHeight: '64px', minWidth: '72px' }}
            >
              <BrandLogo logo={brand.logo} isActive={isActive} />
              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-white' : 'text-ink-slate'}`}>{brand.name}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
        {/* Left Side: Search and Models list / Series Cards */}
        <div className={`${selectedModel ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all duration-500`}>
          {/* Search bar */}
          <div className="relative mb-4 sm:mb-6">
            <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search model (e.g. iPhone 15 Pro, S24)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-sm border border-ice-border bg-canvas-pure text-ink-navy text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all duration-300"
              style          {/* If search query is empty and no series is selected, show Series Cards */}
          {debouncedSearchQuery.trim() === '' && selectedSeries === null && (
            <div className="mb-8 animate-fadeIn">
              <div className="text-left mb-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-slate font-mono flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cobalt" /> Select Device Series
                </h4>
                <p className="text-xs text-ink-muted font-light mt-1">Select a series below to see the available models for trade-in.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {availableSeries.map(seriesName => {
                  const stats = seriesStats[seriesName] || { modelCount: 0, maxPayout: 0, yearRange: '' };
                  return (
                    <motion.div
                      key={seriesName}
                      whileHover={{ scale: 1.015, y: -2 }}
                      onClick={() => setSelectedSeries(seriesName)}
                      className="p-5 rounded-sm border border-ice-border bg-canvas-pure cursor-pointer hover:border-cobalt/40 transition-all duration-300 shadow-sm hover:shadow-premium group flex flex-col justify-between"
                      style={{ minHeight: '140px' }}
                    >
                      <div className="text-left">
                        <div className="flex justify-between items-start mb-3">
                          <div className="p-2 rounded-sm bg-cobalt-light/10 text-cobalt border border-cobalt/10 group-hover:bg-cobalt group-hover:text-white transition-colors duration-300">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-mono font-semibold tracking-wider text-zinc-500 bg-white/[0.03] px-2 py-0.5 rounded-sm">
                            {stats.yearRange}
                          </span>
                        </div>
                        <h4 className="font-semibold text-base text-ink-navy leading-tight group-hover:text-cobalt transition-colors duration-300">
                          {seriesName}
                        </h4>
                        <p className="text-[11px] text-ink-muted mt-1.5 font-light">
                          {stats.modelCount} {stats.modelCount === 1 ? 'model' : 'models'} available
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-left">
                        <div>
                          <span className="text-[8px] text-zinc-500 block uppercase font-mono tracking-wider">Payout Up To</span>
                          <span className="text-sm font-bold text-cobalt font-outfit">{formatPrice(stats.maxPayout)}</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-canvas-white border border-ice-border flex items-center justify-center group-hover:bg-cobalt group-hover:border-cobalt transition-all duration-300">
                          <ChevronRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* If search query is NOT empty OR a series is selected, show Models Grid */}
          {(debouncedSearchQuery.trim() !== '' || selectedSeries !== null) && (
            <div className="animate-fadeIn">
              {/* Breadcrumb / Back Navigation if not searching */}
              {debouncedSearchQuery.trim() === '' && (
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.04]">
                  <button
                    onClick={() => {
                      setSelectedSeries(null);
                      setSelectedModel(null);
                      setSelectedStorage(null);
                      setTempVariant(null);
                    }}
                    className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-cobalt transition-colors font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Series
                  </button>
                  <span className="text-xs text-zinc-500 font-mono font-semibold uppercase">{selectedSeries}</span>
                </div>
              )}

              {/* Models Grid: 1 col xs, 2 col sm, 3 col md */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {filteredModels.length === 0 && (
                  <div className="col-span-full py-12 px-4 text-center border border-dashed border-ice-border rounded-sm bg-canvas-pure">
                    <Smartphone className="w-10 h-10 text-ink-muted mx-auto mb-3" />
                    <h4 className="text-base font-semibold text-ink-navy">No models found</h4>
                    <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">We couldn't find any results matching "{searchQuery}". Try searching for Apple or Samsung devices.</p>
                    <button 
                      onClick={() => setSearchQuery('')}
                      className="mt-4 px-4 py-2 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-sm transition-all"
                      style={{ minHeight: '36px' }}
                    >
                      Clear Search
                    </button>
                  </div>
                )}
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
                            ? 'border-cobalt ring-1 ring-cobalt/20 scale-[1.01] opacity-100 z-10 shadow-premium'
                            : hasSelection
                            ? 'border-ice-border opacity-40 hover:opacity-75 hover:scale-[1.005]'
                            : 'border-ice-border hover:border-cobalt/40 hover:-translate-y-0.5 shadow-sm hover:shadow-premium'
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
                              <span className="text-sm font-bold text-cobalt font-outfit">{formatPrice(model.basePrice128GB)}</span>
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
          )}
        </div>sence>
          </div>
        </div>
      )}
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
                        className={`py-3.5 rounded-sm border text-sm font-semibold transition-all duration-300 ${
                          isSelected
                            ? 'bg-cobalt text-white border-cobalt scale-[1.01] opacity-100 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                            : hasSelection
                            ? 'bg-canvas-white text-ink-navy border-ice-border opacity-40 hover:opacity-75'
                            : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/30 hover:scale-[1.005]'
                        }`}
                        style={{ minHeight: '48px' }}
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
                          className={`p-4 rounded-sm border text-left text-xs transition-all duration-300 flex flex-col justify-between ${
                            isSelected
                              ? 'bg-cobalt-light border-cobalt ring-1 ring-cobalt/20 scale-[1.01] opacity-100 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                              : hasSelection
                              ? 'bg-canvas-white text-ink-navy border-ice-border opacity-40 hover:opacity-75'
                              : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/20 hover:scale-[1.005]'
                          }`}
                          style={{ minHeight: '48px' }}
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
