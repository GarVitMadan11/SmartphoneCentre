import React, { useState, useEffect, useMemo } from 'react';
import { SMARTWATCH_MODELS, Model, Variant, getVariantPrice } from '../../data/mockDatabase';
import { Watch, Sparkles, ArrowRight, Search, X, HardDrive, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SmartwatchesShowcaseProps {
  onSelectVariant: (model: Model, variant: Variant) => void;
  onBackToHome: () => void;
  defaultBrand?: 'all' | 'apple' | 'samsung';
}

export const SmartwatchesShowcase: React.FC<SmartwatchesShowcaseProps> = ({
  onSelectVariant,
  onBackToHome,
  defaultBrand,
}) => {
  const [selectedBrand, setSelectedBrand] = useState<'all' | 'apple' | 'samsung'>(defaultBrand ?? 'all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal state for Spec Selection
  const [selectedModelForSpec, setSelectedModelForSpec] = useState<Model | null>(null);
  const [selectedStorage, setSelectedStorage] = useState<number>(32);

  useEffect(() => {
    if (defaultBrand) {
      setSelectedBrand(defaultBrand);
    }
  }, [defaultBrand]);

  const filteredModels = SMARTWATCH_MODELS.filter(m => {
    const matchesBrand =
      selectedBrand === 'all' ||
      (selectedBrand === 'apple' && m.brandId === 'brand-apple') ||
      (selectedBrand === 'samsung' && m.brandId === 'brand-samsung');

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch = !q || m.name.toLowerCase().includes(q) || (m.series && m.series.toLowerCase().includes(q));

    return matchesBrand && matchesSearch;
  });

  const storageOptions = useMemo(() => {
    if (!selectedModelForSpec) return [16, 32, 64];
    return selectedModelForSpec.supportedStorageGb && selectedModelForSpec.supportedStorageGb.length > 0
      ? selectedModelForSpec.supportedStorageGb
      : [16, 32, 64];
  }, [selectedModelForSpec]);

  useEffect(() => {
    if (selectedModelForSpec && storageOptions.length > 0 && !storageOptions.includes(selectedStorage)) {
      setSelectedStorage(storageOptions[0]);
    }
  }, [selectedModelForSpec, storageOptions]);

  const calculatedPrice = useMemo(() => {
    if (!selectedModelForSpec) return 0;
    return getVariantPrice(selectedModelForSpec, 2, selectedStorage);
  }, [selectedModelForSpec, selectedStorage]);

  const handleOpenSpecModal = (model: Model) => {
    const defaultStorages = model.supportedStorageGb && model.supportedStorageGb.length > 0 ? model.supportedStorageGb : [16, 32, 64];
    setSelectedStorage(defaultStorages[0]);
    setSelectedModelForSpec(model);
  };

  const handleProceedWithSpec = () => {
    if (!selectedModelForSpec) return;
    const variant: Variant = {
      id: `${selectedModelForSpec.id}-${selectedStorage}gb`,
      modelId: selectedModelForSpec.id,
      storageGb: selectedStorage,
      color: 'Standard',
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
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/15 tracking-widest uppercase font-mono mb-3">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> DEDICATED SMARTWATCH PORTAL
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-ink-navy font-outfit uppercase tracking-tight">
              Sell Your <span className="text-emerald-600">Apple Watch</span> or <span className="text-cobalt">Samsung Galaxy Watch</span>
            </h1>
            <p className="text-ink-slate text-sm font-light mt-2 max-w-xl">
              Get an instant valuation, free doorstep pickup in Delhi, and instant payout for your Apple Watch or Galaxy Watch.
            </p>
          </div>

          <button
            onClick={onBackToHome}
            className="self-start md:self-auto px-4 py-2 text-xs font-bold text-ink-slate hover:text-emerald-600 bg-canvas-white border border-ice-border hover:border-emerald-500 rounded-md transition-all flex items-center gap-1.5"
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
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-canvas-white text-ink-slate border border-ice-border hover:border-emerald-500/30'
              }`}
            >
              All Smartwatches ({SMARTWATCH_MODELS.length})
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
              <span>Apple Watches</span>
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
              <span>Samsung Galaxy Watches</span>
            </button>
          </div>

          {/* Search Input */}
          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Watch Series 9, Ultra..."
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-ice-border bg-canvas-white text-ink-navy text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
            />
          </div>

        </div>
      </div>

      {/* Smartwatches Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModels.map((model) => (
          <motion.div
            key={model.id}
            whileHover={{ y: -4 }}
            onClick={() => handleOpenSpecModal(model)}
            className="cursor-pointer bg-canvas-pure border border-ice-border hover:border-emerald-500/40 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2.5 py-1 text-[10px] font-mono font-bold rounded-full uppercase tracking-wider ${
                  model.brandId === 'brand-apple' ? 'bg-zinc-100 text-zinc-800' : 'bg-blue-50 text-blue-700'
                }`}>
                  {model.brandId === 'brand-apple' ? 'Apple Watch' : 'Samsung Watch'}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">{model.releaseYear}</span>
              </div>

              <h3 className="text-xl font-bold font-outfit text-ink-navy uppercase group-hover:text-emerald-600 transition-colors">
                {model.name}
              </h3>
              <p className="text-xs font-mono text-zinc-400 mt-1">Series: {model.series}</p>

              {/* Watch Image */}
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
                className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold flex items-center gap-1 group-hover:bg-emerald-700 transition-all shadow-xs"
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
          <Watch className="w-12 h-12 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-ink-navy">No Smartwatches Found</h3>
          <p className="text-xs text-zinc-500 mt-1">Try adjusting your search or brand filter.</p>
        </div>
      )}

      {/* Smartwatch Storage Spec Selection Modal */}
      <AnimatePresence>
        {selectedModelForSpec && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-canvas-pure border border-ice-border rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-ice-border flex items-center justify-between bg-canvas-white">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 flex-shrink-0">
                    <Watch className="w-6 h-6 stroke-[2.2]" />
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
              <div className="p-6 space-y-6 text-left">
                {/* Storage Capacity Selector */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold text-ink-navy uppercase tracking-wider flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-emerald-600" /> Select Storage / Case Spec
                    </span>
                    <span className="text-[10px] text-zinc-400 font-mono">Internal Capacity</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {storageOptions.map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSelectedStorage(st)}
                        className={`py-3 px-3 rounded-xl border text-xs font-bold font-mono transition-all flex items-center justify-center gap-1 ${
                          selectedStorage === st
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                            : 'bg-canvas-white text-ink-slate border-ice-border hover:border-emerald-400'
                        }`}
                      >
                        <span>{st} GB</span>
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
                      Spec: {selectedStorage}GB Internal Storage
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
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-600/20 transition-all"
                >
                  <span>Proceed to Diagnostics</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
