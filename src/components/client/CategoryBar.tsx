import React, { useState, useRef, useEffect } from 'react';
import { Smartphone, Tablet, Watch, ChevronDown, Zap, Truck, Sparkles } from 'lucide-react';

interface CategoryBarProps {
  onSelectBrand?: (brandId: string) => void;
  onNavigateTablets?: () => void;
  onNavigateSmartwatches?: () => void;
  onOpenTrackOrder?: () => void;
  onNavigateHome?: () => void;
  activeStage?: string;
}

export const CategoryBar: React.FC<CategoryBarProps> = ({
  onSelectBrand,
  onNavigateTablets,
  onNavigateSmartwatches,
  onOpenTrackOrder,
  onNavigateHome,
  activeStage,
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
    if (onNavigateHome) onNavigateHome();
    if (onSelectBrand) {
      onSelectBrand(brandId);
    }
    const el = document.getElementById('device-selector-section');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-canvas-pure border-b border-ice-border/80 sticky top-[61px] sm:top-[69px] z-30 shadow-xs backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-11 text-xs font-mono font-medium overflow-x-auto no-scrollbar" ref={dropdownRef}>
          
          {/* Main Focused Categories */}
          <div className="flex items-center gap-1 sm:gap-2 min-w-max">

            {/* 1. All Focused Categories Button */}
            <button
              type="button"
              onClick={onNavigateHome}
              className={`px-3 py-1.5 font-bold rounded-sm flex items-center gap-1.5 transition-all ${
                activeStage === 'select'
                  ? 'bg-cobalt text-white shadow-sm'
                  : 'text-ink-navy hover:text-cobalt hover:bg-canvas-white'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${activeStage === 'select' ? 'text-white' : 'text-cobalt'}`} />
              <span>All Gadgets</span>
            </button>

            <span className="h-4 w-[1px] bg-ice-border/60 mx-1" />

            {/* 2. Smartphones Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(prev => prev === 'phones' ? null : 'phones')}
                className={`px-3 py-1.5 rounded-sm flex items-center gap-1.5 font-bold transition-all ${
                  activeDropdown === 'phones'
                    ? 'bg-cobalt text-white shadow-sm'
                    : 'text-ink-navy hover:text-cobalt hover:bg-canvas-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-cobalt group-hover:text-cobalt" />
                <span>Sell Phone</span>
                <ChevronDown className={`w-3 h-3 transition-transform ${activeDropdown === 'phones' ? 'rotate-180 text-white' : 'text-zinc-400'}`} />
              </button>

              {activeDropdown === 'phones' && (
                <div className="absolute top-full left-0 mt-1 w-64 bg-canvas-pure border border-ice-border rounded-md shadow-premium p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-2.5 py-1 font-mono">
                    Top Smartphone Brands
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-1">
                    <button
                      onClick={() => handleBrandClick('brand-apple')}
                      className="flex items-center gap-2 p-2 rounded hover:bg-canvas-white text-ink-navy hover:text-cobalt text-left text-xs font-semibold"
                    >
                      <span className="w-2 h-2 rounded-full bg-zinc-800" />
                      <span>Apple iPhone</span>
                    </button>
                    <button
                      onClick={() => handleBrandClick('brand-samsung')}
                      className="flex items-center gap-2 p-2 rounded hover:bg-canvas-white text-ink-navy hover:text-cobalt text-left text-xs font-semibold"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-600" />
                      <span>Samsung Galaxy</span>
                    </button>
                    <button
                      onClick={() => handleBrandClick('brand-oneplus')}
                      className="flex items-center gap-2 p-2 rounded hover:bg-canvas-white text-ink-navy hover:text-cobalt text-left text-xs font-semibold"
                    >
                      <span className="w-2 h-2 rounded-full bg-red-600" />
                      <span>OnePlus</span>
                    </button>
                    <button
                      onClick={() => handleBrandClick('brand-google')}
                      className="flex items-center gap-2 p-2 rounded hover:bg-canvas-white text-ink-navy hover:text-cobalt text-left text-xs font-semibold"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      <span>Google Pixel</span>
                    </button>
                    <button
                      onClick={() => handleBrandClick('brand-xiaomi')}
                      className="flex items-center gap-2 p-2 rounded hover:bg-canvas-white text-ink-navy hover:text-cobalt text-left text-xs font-semibold"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-500" />
                      <span>Xiaomi / Redmi</span>
                    </button>
                    <button
                      onClick={() => handleBrandClick('brand-vivo')}
                      className="flex items-center gap-2 p-2 rounded hover:bg-canvas-white text-ink-navy hover:text-cobalt text-left text-xs font-semibold"
                    >
                      <span className="w-2 h-2 rounded-full bg-violet-600" />
                      <span>Vivo / iQOO</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Dedicated Tablets Button */}
            <button
              type="button"
              onClick={onNavigateTablets}
              className={`px-3 py-1.5 font-bold rounded-sm flex items-center gap-1.5 transition-all ${
                activeStage === 'tablets'
                  ? 'bg-violet-600 text-white shadow-sm'
                  : 'text-ink-navy hover:text-cobalt hover:bg-canvas-white'
              }`}
            >
              <Tablet className={`w-3.5 h-3.5 ${activeStage === 'tablets' ? 'text-white' : 'text-violet-600'}`} />
              <span>Sell Tablets</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-600 font-mono">Apple &amp; Samsung</span>
            </button>

            {/* 4. Dedicated Smartwatches Button */}
            <button
              type="button"
              onClick={onNavigateSmartwatches}
              className={`px-3 py-1.5 font-bold rounded-sm flex items-center gap-1.5 transition-all ${
                activeStage === 'smartwatches'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-ink-navy hover:text-cobalt hover:bg-canvas-white'
              }`}
            >
              <Watch className={`w-3.5 h-3.5 ${activeStage === 'smartwatches' ? 'text-white' : 'text-emerald-600'}`} />
              <span>Sell Smartwatches</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 font-mono">Apple &amp; Samsung</span>
            </button>

          </div>

          {/* Right Action Utilities */}
          <div className="flex items-center gap-2 min-w-max">
            <button
              type="button"
              onClick={() => {
                if (onNavigateHome) onNavigateHome();
                setTimeout(() => {
                  document.getElementById('device-selector-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 50);
              }}
              className="px-3 py-1 rounded bg-cobalt/10 text-cobalt hover:bg-cobalt/20 font-bold text-[11px] transition-all flex items-center gap-1"
            >
              <Zap className="w-3 h-3" />
              <span>Instant Quote</span>
            </button>
            {onOpenTrackOrder && (
              <button
                type="button"
                onClick={onOpenTrackOrder}
                className="px-3 py-1 rounded bg-canvas-white border border-ice-border hover:border-cobalt text-ink-navy hover:text-cobalt font-bold text-[11px] transition-all flex items-center gap-1 hidden sm:flex"
              >
                <Truck className="w-3 h-3 text-cobalt" />
                <span>Track Pickup</span>
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
