import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { useCatalogStore } from '../../store/useCatalogStore';

export interface FeaturedPhoneItem {
  id: string;
  name: string;
  series: string;
  imageUrl: string;
}

// Default models using exact image URLs stored in database
const DEFAULT_APPLE_PHONES: FeaturedPhoneItem[] = [
  {
    id: 'iphone-18-pro-max',
    name: 'iPhone 18 Pro Max',
    series: 'iPhone 18 Series',
    imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/apple-iphone18-pro-max.jpg',
  },
  {
    id: 'apple-16pm',
    name: 'iPhone 16 Pro Max',
    series: 'iPhone 16 Series',
    imageUrl: 'https://wsrv.nl/?url=https%3A%2F%2Ffdn2.gsmarena.com%2Fvv%2Fbigpic%2Fapple-iphone-16-pro-max.jpg',
  },
  {
    id: 'apple-16p',
    name: 'iPhone 16 Pro',
    series: 'iPhone 16 Series',
    imageUrl: 'https://wsrv.nl/?url=https%3A%2F%2Ffdn2.gsmarena.com%2Fvv%2Fbigpic%2Fapple-iphone-16-pro.jpg',
  },
  {
    id: 'apple-15pm',
    name: 'iPhone 15 Pro Max',
    series: 'iPhone 15 Series',
    imageUrl: 'https://wsrv.nl/?url=https%3A%2F%2Ffdn2.gsmarena.com%2Fvv%2Fbigpic%2Fapple-iphone-15-pro-max.jpg',
  },
  {
    id: 'apple-14pm',
    name: 'iPhone 14 Pro Max',
    series: 'iPhone 14 Series',
    imageUrl: 'https://wsrv.nl/?url=https%3A%2F%2Ffdn2.gsmarena.com%2Fvv%2Fbigpic%2Fapple-iphone-14-pro-max-.jpg',
  },
];

const DEFAULT_SAMSUNG_PHONES: FeaturedPhoneItem[] = [
  {
    id: 'sam-s24u',
    name: 'Galaxy S24 Ultra',
    series: 'S Series',
    imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s24-ultra-5g-sm-s928-stylus.jpg',
  },
  {
    id: 'sam-fold6',
    name: 'Galaxy Z Fold 6',
    series: 'Z Fold & Z Flip',
    imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-z-fold6.jpg',
  },
  {
    id: 'sam-s23u',
    name: 'Galaxy S23 Ultra',
    series: 'S Series',
    imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s23-ultra-5g.jpg',
  },
  {
    id: 'sam-s25u',
    name: 'Galaxy S25 Ultra',
    series: 'S Series',
    imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/samsung-galaxy-s25-ultra-sm-s938.jpg',
  },
];

export interface FeaturedDevicesBentoProps {
  onSelectModel: (modelId: string) => void;
  onNavigate: (path: string) => void;
}

export const FeaturedDevicesBento: React.FC<FeaturedDevicesBentoProps> = ({
  onSelectModel,
  onNavigate,
}) => {
  const catalogModels = useCatalogStore((s) => s.models);

  // Map directly to database image URLs from catalog store with exact database fallback
  const applePhones: FeaturedPhoneItem[] = DEFAULT_APPLE_PHONES.map((def) => {
    const found = catalogModels.find((m) => m.id === def.id || m.legacyId === def.id);
    return {
      id: def.id,
      name: found?.name || def.name,
      series: found?.series || def.series,
      imageUrl: (found?.imageUrl && found.imageUrl.trim() !== '') ? found.imageUrl : def.imageUrl,
    };
  });

  const samsungPhones: FeaturedPhoneItem[] = DEFAULT_SAMSUNG_PHONES.map((def) => {
    const found = catalogModels.find((m) => m.id === def.id || m.legacyId === def.id);
    return {
      id: def.id,
      name: found?.name || def.name,
      series: found?.series || def.series,
      imageUrl: (found?.imageUrl && found.imageUrl.trim() !== '') ? found.imageUrl : def.imageUrl,
    };
  });

  // Apple Slider State
  const [appleIdx, setAppleIdx] = useState(0);
  const [appleDirection, setAppleDirection] = useState<1 | -1>(1);

  // Samsung Slider State
  const [samIdx, setSamIdx] = useState(0);

  // Apple Auto Sliding Animation (every 2.4s)
  useEffect(() => {
    const timer = setInterval(() => {
      setAppleDirection(1);
      setAppleIdx((prev) => (prev + 1) % applePhones.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [applePhones.length]);

  // Samsung Auto Sliding Animation (every 3.0s)
  useEffect(() => {
    const timer = setInterval(() => {
      setSamIdx((prev) => (prev + 1) % samsungPhones.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [samsungPhones.length]);

  const currentApple = applePhones[appleIdx] || applePhones[0];
  const currentSam = samsungPhones[samIdx] || samsungPhones[0];

  return (
    <div className="py-4">
      {/* Section Heading */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[11px] font-bold bg-secondary/10 text-secondary border border-secondary/15 shadow-sm tracking-widest uppercase font-outfit">
          <CheckCircle2 className="w-3.5 h-3.5" /> Popular Right Now
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-ink-navy tracking-tight mt-3 font-outfit">
          Most Valued Devices
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        {/* ── CARD 1: BIGGER ONE FOR APPLE (md:col-span-2) ── */}
        <div className="md:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group text-left min-h-[340px]">
          <div className="absolute inset-0 bg-gradient-to-br from-cobalt/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

          {/* Left Column: Title, Subtitle, Sell Now Button, Dots */}
          <div className="z-10 flex-1 max-w-sm">
            <h3 className="text-3xl sm:text-4xl font-black text-ink-navy tracking-tight font-outfit">
              Apple iPhones
            </h3>

            <p className="text-sm text-ink-slate font-light mt-2 leading-relaxed">
              Sell any model from iPhone 11 to iPhone 18 Pro Max with instant verification and direct digital transfer.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onSelectModel(currentApple.id)}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-7 py-3.5 rounded-xl font-extrabold text-sm shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2 cursor-pointer group/btn"
              >
                <span>Sell Now</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>

            </div>

            {/* Interactive Sliding Dots Indicator */}
            <div className="flex items-center gap-1.5 mt-5">
              {applePhones.map((p, dotIdx) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    setAppleDirection(dotIdx > appleIdx ? 1 : -1);
                    setAppleIdx(dotIdx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    dotIdx === appleIdx
                      ? 'w-7 bg-cobalt'
                      : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                  }`}
                  aria-label={`Select ${p.name}`}
                />
              ))}
            </div>
          </div>

          {/* Right Column: Sliding iPhone Image with AnimatePresence (Seamlessly Integrated) */}
          <div className="z-10 relative flex-shrink-0 w-full sm:w-72 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center relative overflow-hidden w-full h-64 group-hover:scale-105 transition-transform duration-500">
              
              <AnimatePresence mode="wait" custom={appleDirection}>
                <motion.div
                  key={currentApple.id}
                  custom={appleDirection}
                  initial={{ opacity: 0, x: appleDirection > 0 ? 45 : -45 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: appleDirection > 0 ? -45 : 45 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full h-full flex items-center justify-center relative"
                >
                  <img
                    src={currentApple.imageUrl}
                    alt={currentApple.name}
                    referrerPolicy="no-referrer"
                    style={{ mixBlendMode: 'multiply' }}
                    className="w-52 sm:w-56 h-52 object-contain"
                  />
                </motion.div>
              </AnimatePresence>

            </div>
          </div>

        </div>

        {/* ── RIGHT STACK: SAMSUNG (UPPER) & ALL OTHERS (LOWER) ── */}
        <div className="flex flex-col gap-6 justify-between">
          
          {/* CARD 2: SAMSUNG GALAXY (UPPER) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-md hover:shadow-xl hover:border-blue-400/50 transition-all duration-300 relative overflow-hidden group text-left min-h-[155px]">
            <div className="z-10 flex-1 pr-4">
              <h4 className="text-xl font-black text-ink-navy font-outfit tracking-tight">
                Samsung Galaxy
              </h4>
              <p className="text-xs text-ink-slate mt-1 font-light">
                {currentSam.name} · S &amp; Z Series
              </p>
              <button
                type="button"
                onClick={() => onSelectModel(currentSam.id)}
                className="text-xs font-bold text-cobalt hover:text-blue-700 flex items-center gap-1.5 mt-3.5 transition-colors cursor-pointer group/btn"
              >
                <span>Sell Now</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="w-24 h-24 bg-white rounded-xl p-2 flex items-center justify-center flex-shrink-0 border border-slate-100 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentSam.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  src={currentSam.imageUrl}
                  alt={currentSam.name}
                  referrerPolicy="no-referrer"
                  style={{ mixBlendMode: 'multiply' }}
                  className="w-full h-full object-contain"
                />
              </AnimatePresence>
            </div>
          </div>

          {/* CARD 3: ALL OTHER BRANDS (LOWER) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex flex-col justify-between shadow-md hover:shadow-xl hover:border-emerald-400/50 transition-all duration-300 relative overflow-hidden group text-left min-h-[155px]">
            <div className="z-10">
              <h4 className="text-xl font-black text-ink-navy font-outfit tracking-tight">
                All Other Brands
              </h4>
              <p className="text-xs text-ink-slate mt-1.5 font-light leading-relaxed">
                Google Pixel, OnePlus, Xiaomi, Vivo, Oppo, Realme, Motorola &amp; more.
              </p>
            </div>

            <div className="z-10 pt-3 flex items-center">
              <button
                type="button"
                onClick={() => onNavigate('/smartphones')}
                className="text-xs font-bold text-cobalt hover:text-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer group/btn"
              >
                <span>Sell Now</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>

        {/* ── BULK LIQUIDATION CORPORATE BANNER ── */}
        <div className="lg:col-span-3 bg-gradient-to-r from-[#001c3d] via-[#002856] to-[#00142e] border border-blue-900 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-2xl text-left mt-2">
          <div className="z-10 max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Enterprise Device Liquidation</h3>
            <p className="text-slate-300 mt-2 text-sm font-light leading-relaxed">
              Selling company laptops or smartphone fleets? Get customized bulk pricing, NIST-compliant hardware data wiping, and direct corporate logistics.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('/contact')}
            className="mt-4 md:mt-0 bg-white hover:bg-slate-100 text-cobalt px-6 py-3.5 rounded-xl font-bold text-sm shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap z-10 flex-shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <span>Contact B2B Team</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />
        </div>

      </div>
    </div>
  );
};

export default FeaturedDevicesBento;
