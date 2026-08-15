import React, { useState, useRef, useEffect } from 'react';
import { Smartphone, Tablet, Watch, ChevronDown, Zap, Truck, Sparkles } from 'lucide-react';

interface CategoryBarProps {
  onSelectBrand?: (brandId: string) => void;
  onSelectTabletBrand?: (brand: 'apple' | 'samsung') => void;
  onSelectWatchBrand?: (brand: 'apple' | 'samsung') => void;
  onOpenTrackOrder?: () => void;
  onNavigate: (path: string) => void;
  currentPath: string;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  onSelectBrand,
  onSelectTabletBrand,
  onSelectWatchBrand,
  onOpenTrackOrder,
  onNavigate,
  currentPath,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<'phones' | 'tablets' | 'watches' | 'more' | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBrandClick = (brandId: string) => {
    setActiveDropdown(null);
    onNavigate('/smartphones');
    if (onSelectBrand) {
      onSelectBrand(brandId);
    }
  };

  const handleTabletBrandClick = (brand: 'apple' | 'samsung') => {
    setActiveDropdown(null);
    onNavigate('/tablets');
    if (onSelectTabletBrand) {
      onSelectTabletBrand(brand);
    }
  };

  const handleWatchBrandClick = (brand: 'apple' | 'samsung') => {
    setActiveDropdown(null);
    onNavigate('/smartwatches');
    if (onSelectWatchBrand) {
      onSelectWatchBrand(brand);
    }
  };

  return (
    <div className="bg-canvas-pure/90 border-b border-ice-border/80 sticky top-[61px] sm:top-[69px] z-30 shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div 
          role="tablist"
          aria-label="Device Categories and Quick Actions"
          className="flex items-center justify-between h-12 text-xs font-sans font-medium md:overflow-visible overflow-x-auto no-scrollbar" 
          ref={dropdownRef}
        >
          
          {/* Main Focused Categories */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-max md:overflow-visible">

            {/* 1. All Focused Categories Button */}
            <button
              type="button"
              role="tab"
              aria-selected={currentPath === '/'}
              onClick={() => onNavigate('/')}
              className={`px-3.5 py-1.5 font-semibold text-xs rounded-full flex items-center gap-1.5 transition-all duration-200 focus-ring ${
                currentPath === '/'
                  ? 'bg-cobalt text-white shadow-sm font-bold'
                  : 'text-slate-600 hover:text-cobalt hover:bg-slate-100/70 dark:hover:bg-zinc-800/60'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${currentPath === '/' ? 'text-white' : 'text-cobalt'}`} />
              <span>All Gadgets</span>
            </button>

            <span className="h-4 w-[1px] bg-ice-border/80 mx-1" />

            {/* 2. Smartphones Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(prev => prev === 'phones' ? null : 'phones')}
                className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 font-semibold text-xs transition-all duration-200 ${
                  currentPath === '/smartphones' || activeDropdown === 'phones'
                    ? 'bg-cobalt text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-cobalt hover:bg-slate-100/70 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Smartphone className={`w-3.5 h-3.5 ${currentPath === '/smartphones' || activeDropdown === 'phones' ? 'text-white' : 'text-cobalt'}`} />
                <span>Sell Phone</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${currentPath === '/smartphones' || activeDropdown === 'phones' ? 'rotate-180 text-white' : 'text-slate-400'}`} />
              </button>

              {activeDropdown === 'phones' && (
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-canvas-pure border border-ice-border rounded-xl shadow-premium p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2.5 py-1 font-outfit">
                    Top Smartphone Brands
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    <button
                      onClick={() => handleBrandClick('brand-apple')}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-cobalt text-left text-xs font-medium transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-zinc-800 dark:bg-zinc-200" />
                      <span>Apple iPhone</span>
                    </button>
                    <button
                      onClick={() => handleBrandClick('brand-samsung')}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-cobalt text-left text-xs font-medium transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>Samsung Galaxy</span>
                    </button>
                    <button
                      onClick={() => handleBrandClick('brand-oneplus')}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-cobalt text-left text-xs font-medium transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      <span>OnePlus</span>
                    </button>
                    <button
                      onClick={() => handleBrandClick('brand-google')}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-cobalt text-left text-xs font-medium transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Google Pixel</span>
                    </button>
                    <button
                      onClick={() => handleBrandClick('brand-xiaomi')}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-cobalt text-left text-xs font-medium transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Xiaomi / Redmi</span>
                    </button>
                    <button
                      onClick={() => handleBrandClick('brand-vivo')}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-cobalt text-left text-xs font-medium transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-violet-600" />
                      <span>Vivo / iQOO</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Dedicated Tablets Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(prev => prev === 'tablets' ? null : 'tablets')}
                className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 font-semibold text-xs transition-all duration-200 ${
                  currentPath === '/tablets' || activeDropdown === 'tablets'
                    ? 'bg-violet-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-violet-600 hover:bg-slate-100/70 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Tablet className={`w-3.5 h-3.5 ${currentPath === '/tablets' || activeDropdown === 'tablets' ? 'text-white' : 'text-violet-600'}`} />
                <span>Sell Tablets</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${currentPath === '/tablets' || activeDropdown === 'tablets' ? 'rotate-180 text-white' : 'text-slate-400'}`} />
              </button>

              {activeDropdown === 'tablets' && (
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-canvas-pure border border-ice-border rounded-xl shadow-premium p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2.5 py-1 font-outfit">
                    Top Tablet Brands
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    <button
                      onClick={() => handleTabletBrandClick('apple')}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-violet-600 text-left text-xs font-medium transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-zinc-800 dark:bg-zinc-200" />
                      <span>Apple iPad</span>
                    </button>
                    <button
                      onClick={() => handleTabletBrandClick('samsung')}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-violet-600 text-left text-xs font-medium transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>Samsung Tab</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 4. Dedicated Smartwatches Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(prev => prev === 'watches' ? null : 'watches')}
                className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 font-semibold text-xs transition-all duration-200 ${
                  currentPath === '/smartwatches' || activeDropdown === 'watches'
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'text-slate-600 hover:text-emerald-600 hover:bg-slate-100/70 dark:hover:bg-zinc-800/60'
                }`}
              >
                <Watch className={`w-3.5 h-3.5 ${currentPath === '/smartwatches' || activeDropdown === 'watches' ? 'text-white' : 'text-emerald-600'}`} />
                <span>Sell Smartwatches</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${currentPath === '/smartwatches' || activeDropdown === 'watches' ? 'rotate-180 text-white' : 'text-slate-400'}`} />
              </button>

              {activeDropdown === 'watches' && (
                <div className="absolute top-full left-0 mt-1.5 w-64 bg-canvas-pure border border-ice-border rounded-xl shadow-premium p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-2.5 py-1 font-outfit">
                    Top Watch Brands
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    <button
                      onClick={() => handleWatchBrandClick('apple')}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-emerald-600 text-left text-xs font-medium transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-zinc-800 dark:bg-zinc-200" />
                      <span>Apple Watch</span>
                    </button>
                    <button
                      onClick={() => handleWatchBrandClick('samsung')}
                      className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100/80 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-emerald-600 text-left text-xs font-medium transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>Galaxy Watch</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-2 min-w-max">
            <button
              type="button"
              onClick={() => onNavigate('/smartphones')}
              className="px-3.5 py-1.5 rounded-full bg-cobalt/10 hover:bg-cobalt/20 text-cobalt font-semibold text-xs transition-all duration-200 flex items-center gap-1.5 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-cobalt" />
              <span>Instant Quote</span>
            </button>
            {onOpenTrackOrder && (
              <button
                type="button"
                onClick={onOpenTrackOrder}
                className="px-3.5 py-1.5 rounded-full bg-canvas-pure border border-ice-border hover:border-cobalt text-slate-700 hover:text-cobalt font-semibold text-xs transition-all duration-200 flex items-center gap-1.5 hidden sm:flex shadow-xs"
              >
                <Truck className="w-3.5 h-3.5 text-cobalt" />
                <span>Track Pickup</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
