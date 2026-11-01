import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Building2 } from 'lucide-react';
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

const DEFAULT_OTHER_PHONES: FeaturedPhoneItem[] = [
  {
    id: 'pixel-9-pro-xl',
    name: 'Pixel 9 Pro XL',
    series: 'Google Pixel',
    imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/google-pixel-9-pro-xl.jpg',
  },
  {
    id: 'oneplus-12',
    name: 'OnePlus 12',
    series: 'OnePlus',
    imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/oneplus-12.jpg',
  },
  {
    id: 'xiaomi-14-ultra',
    name: 'Xiaomi 14 Ultra',
    series: 'Xiaomi',
    imageUrl: 'https://fdn2.gsmarena.com/vv/bigpic/xiaomi-14-ultra.jpg',
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

  const otherPhones: FeaturedPhoneItem[] = DEFAULT_OTHER_PHONES.map((def) => {
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

  // Other Brands Slider State
  const [otherIdx, setOtherIdx] = useState(0);

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

  // Other Brands Auto Sliding Animation (every 3.2s)
  useEffect(() => {
    const timer = setInterval(() => {
      setOtherIdx((prev) => (prev + 1) % otherPhones.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [otherPhones.length]);

  const currentApple = applePhones[appleIdx] || applePhones[0];
  const currentSam = samsungPhones[samIdx] || samsungPhones[0];
  const currentOther = otherPhones[otherIdx] || otherPhones[0];

  return (
    <div className="py-4">
      {/* Section Heading */}
      <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
        <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-cobalt/10 text-cobalt border border-cobalt/20">
          <Sparkles className="w-3.5 h-3.5 text-cobalt" />
          Popular Trade-Ins
        </span>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mt-3 font-sans">
          Most Valued Devices
        </h2>
        <p className="text-slate-600 text-xs sm:text-sm mt-2 font-normal max-w-md mx-auto">
          Get the highest guaranteed quotes on trending flagship smartphones and corporate device fleets.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        
        {/* ── CARD 1: BIGGER ONE FOR APPLE (md:col-span-2) ── */}
        <div className="md:col-span-2 bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-md hover:shadow-xl transition-all duration-300 relative overflow-hidden group text-left min-h-[340px]">
          <div className="absolute inset-0 bg-gradient-to-br from-cobalt/[0.02] to-transparent pointer-events-none" />

          {/* Left Column: Title, Subtitle, Sell Now Button, Dots */}
          <div className="z-10 flex-1 max-w-sm">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200/80 text-xs font-semibold text-slate-800 mb-3">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-slate-900">{currentApple.name}</span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-700 font-bold">Highest Resale Value</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-sans">
              Apple iPhones
            </h3>

            <p className="text-xs sm:text-sm text-slate-600 font-normal mt-2 leading-relaxed">
              Sell any model from iPhone 11 to iPhone 18 Pro Max with instant automated diagnostics and direct bank transfer.
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onSelectModel(currentApple.id)}
                className="bg-cobalt hover:bg-cobalt-hover text-white px-6 py-3 rounded-xl font-bold text-sm shadow-xs hover:shadow-md transition-all duration-200 flex items-center gap-2 cursor-pointer group/btn active:scale-98"
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

          {/* Right Column: Sliding iPhone Image with AnimatePresence */}
          <div className="z-10 relative flex-shrink-0 w-full sm:w-72 flex items-center justify-center">
            <div className="flex flex-col items-center justify-center relative overflow-hidden w-full h-48 sm:h-64 group-hover:scale-105 transition-transform duration-500">
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
                    className="w-44 sm:w-56 h-44 sm:h-56 object-contain filter drop-shadow-sm"
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── RIGHT STACK: SAMSUNG (UPPER) & ALL OTHERS (LOWER) ── */}
        <div className="flex flex-col gap-6 justify-between">
          
          {/* CARD 2: SAMSUNG GALAXY (UPPER) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-md hover:shadow-xl hover:border-cobalt/40 transition-all duration-300 relative overflow-hidden group text-left min-h-[160px]">
            <div className="z-10 flex-1 pr-3">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-blue-50 text-[10px] font-bold text-cobalt uppercase tracking-wider mb-2">
                Samsung Flagship
              </div>
              <h4 className="text-lg font-bold text-slate-900 tracking-tight font-sans">
                Samsung Galaxy
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-normal leading-snug">
                {currentSam.name} · S &amp; Z Series
              </p>
              <button
                type="button"
                onClick={() => onSelectModel(currentSam.id)}
                className="text-xs font-bold text-cobalt hover:text-cobalt-hover flex items-center gap-1.5 mt-3.5 transition-colors cursor-pointer group/btn"
              >
                <span>Sell Now</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="w-24 h-24 bg-slate-50/80 rounded-xl p-2 flex items-center justify-center flex-shrink-0 border border-slate-100 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
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
                  className="w-full h-full object-contain filter drop-shadow-2xs"
                />
              </AnimatePresence>
            </div>
          </div>

          {/* CARD 3: ALL OTHER BRANDS (LOWER) */}
          <div className="bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 flex items-center justify-between shadow-md hover:shadow-xl hover:border-cobalt/40 transition-all duration-300 relative overflow-hidden group text-left min-h-[160px]">
            <div className="z-10 flex-1 pr-3">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2">
                Multi-Brand Flagships
              </div>
              <h4 className="text-lg font-bold text-slate-900 tracking-tight font-sans">
                All Other Brands
              </h4>
              <p className="text-xs text-slate-500 mt-1 font-normal leading-snug">
                {currentOther.name} · Pixel, OnePlus &amp; more
              </p>
              <button
                type="button"
                onClick={() => onNavigate('/smartphones')}
                className="text-xs font-bold text-cobalt hover:text-cobalt-hover flex items-center gap-1.5 mt-3.5 transition-colors cursor-pointer group/btn"
              >
                <span>Browse All Models</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="w-24 h-24 bg-slate-50/80 rounded-xl p-2 flex items-center justify-center flex-shrink-0 border border-slate-100 group-hover:scale-105 transition-transform duration-300 relative overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.img
                  key={currentOther.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3 }}
                  src={currentOther.imageUrl}
                  alt={currentOther.name}
                  referrerPolicy="no-referrer"
                  style={{ mixBlendMode: 'multiply' }}
                  className="w-full h-full object-contain filter drop-shadow-2xs"
                />
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ── BULK LIQUIDATION CORPORATE BANNER ── */}
        <div className="lg:col-span-3 bg-gradient-to-r from-[#00132E] via-[#001D47] to-[#00132E] border border-blue-900/60 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between gap-6 shadow-xl text-left mt-2">
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="z-10 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-bold uppercase tracking-wider text-blue-200 mb-3">
              <Building2 className="w-3.5 h-3.5 text-blue-300" />
              <span>B2B &amp; Corporate Solutions</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-sans">
              Enterprise Device Liquidation
            </h3>
            <p className="text-slate-300 mt-2 text-xs sm:text-sm font-normal leading-relaxed">
              Selling company laptops or smartphone fleets? Get customized bulk valuation, NIST-compliant hardware data sanitization, and direct corporate pickup logistics.
            </p>
            {/* Trust Chips */}
            <div className="flex flex-wrap items-center gap-2.5 mt-4">
              <span className="text-[11px] font-semibold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                ✓ NIST 800-88 Data Sanitization
              </span>
              <span className="text-[11px] font-semibold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                ✓ GST Invoice &amp; RTGS Settlement
              </span>
              <span className="text-[11px] font-semibold text-slate-300 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg">
                ✓ Pan-India Fleet Inspection
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onNavigate('/contact')}
            className="mt-2 md:mt-0 bg-white hover:bg-slate-100 text-slate-900 px-6 py-3.5 rounded-xl font-bold text-sm shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap z-10 flex-shrink-0 flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>Contact B2B Team</span>
            <ArrowRight className="w-4 h-4 text-cobalt" />
          </button>
        </div>

      </div>
    </div>
  );
};
