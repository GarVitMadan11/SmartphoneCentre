import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Smartphone, 
  ArrowRight, 
  Sparkles, 
} from 'lucide-react';
import type { Model } from '../../data/mockDatabase';
import { getMaxVariantPrice, getDeviceImage } from '../../data/mockDatabase';
import smartphonesShowcaseImg from '../../assets/smartphones_showcase.png';

interface DeviceCategoryShowcaseProps {
  onSelectCategory?: (category: 'smartphones' | 'tablets') => void;
  models?: Model[];
  onSelectModel?: (modelId: string) => void;
}

interface SlidingPhoneSeed {
  id: string;
  name: string;
  brand: string;
  series: string;
  specTag: string;
  defaultPrice: number;
  imageUrl?: string;
}

const FEATURED_SLIDING_PHONES: SlidingPhoneSeed[] = [
  {
    id: 'apple-16pm',
    name: 'iPhone 16 Pro Max',
    brand: 'Apple',
    series: 'iPhone 16 Series',
    specTag: 'A18 Pro • Up to 1TB Storage',
    defaultPrice: 108500,
    imageUrl: 'https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone-16-pro-max.png',
  },
  {
    id: 'sam-s24u',
    name: 'Galaxy S24 Ultra',
    brand: 'Samsung',
    series: 'Galaxy S Series',
    specTag: 'Snapdragon 8 Gen 3 • 12GB RAM',
    defaultPrice: 84000,
    imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/2401/gallery/in-galaxy-s24-ultra-s928-sm-s928bztqins-thumb-539573033',
  },
  {
    id: 'apple-15pm',
    name: 'iPhone 15 Pro Max',
    brand: 'Apple',
    series: 'iPhone 15 Series',
    specTag: 'A17 Pro • Titanium Finish',
    defaultPrice: 86000,
    imageUrl: 'https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone-15-pro-max.png',
  },
  {
    id: 'apple-17pm',
    name: 'iPhone 17 Pro Max',
    brand: 'Apple',
    series: 'iPhone 17 Series',
    specTag: 'Flagship Grade • Camera Control',
    defaultPrice: 125000,
    imageUrl: 'https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone-17-pro-17-pro-max-hero.png',
  },
  {
    id: 'op-12',
    name: 'OnePlus 12',
    brand: 'OnePlus',
    series: 'OnePlus Flagship',
    specTag: 'Hasselblad Camera • 16GB RAM',
    defaultPrice: 46000,
    imageUrl: 'https://oasis.opstatics.com/content/dam/oasis/page/2024/in/product/12/12-green.png',
  },
  {
    id: 'sam-fold6',
    name: 'Galaxy Z Fold 6',
    brand: 'Samsung',
    series: 'Galaxy Z Series',
    specTag: 'Foldable Dynamic AMOLED 2X',
    defaultPrice: 95000,
    imageUrl: 'https://images.samsung.com/is/image/samsung/p6pim/in/sm-f956bzkains/gallery/in-galaxy-z-fold6-f956-sm-f956bzkains-thumb-542385153',
  },
  {
    id: 'apple-16p',
    name: 'iPhone 16 Pro',
    brand: 'Apple',
    series: 'iPhone 16 Series',
    specTag: 'A18 Pro • 48MP Fusion Camera',
    defaultPrice: 94000,
    imageUrl: 'https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone-16-pro-max.png',
  },
  {
    id: 'goog-8p',
    name: 'Pixel 8 Pro',
    brand: 'Google',
    series: 'Pixel 8 Series',
    specTag: 'Google Tensor G3 • Pro Camera',
    defaultPrice: 58000,
    imageUrl: 'https://lh3.googleusercontent.com/u/0/d/1_pixel_9_pro_hero',
  },
];

export const DeviceCategoryShowcase: React.FC<DeviceCategoryShowcaseProps> = ({
  onSelectCategory,
  models,
  onSelectModel,
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [rotations, setRotations] = useState<Record<string, { x: number; y: number }>>({
    smartphones: { x: 0, y: 0 },
  });

  // Automated sliding phone state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Merge seed data with real catalog pricing and fallback images
  const phoneItems = useMemo(() => {
    return FEATURED_SLIDING_PHONES.map(item => {
      const catalogMatch = models?.find(
        m => m.id === item.id || m.legacyId === item.id || m.name.toLowerCase().includes(item.name.toLowerCase())
      );
      const maxVal = catalogMatch ? getMaxVariantPrice(catalogMatch) : item.defaultPrice;
      const finalImg = catalogMatch?.imageUrl || getDeviceImage(catalogMatch?.id || item.id, catalogMatch?.brandId || (item.brand === 'Apple' ? 'brand-apple' : 'brand-samsung')) || item.imageUrl;
      const resolvedId = catalogMatch?.id || item.id;
      return {
        ...item,
        id: resolvedId,
        maxPrice: maxVal,
        formattedPrice: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(maxVal),
        imageUrl: finalImg
      };
    });
  }, [models]);

  const currentPhone = phoneItems[currentIndex] || phoneItems[0];

  // Auto-advance timer (every 2.2 seconds) - continuously loops 1 to 8 to 1 without stalling
  useEffect(() => {
    if (phoneItems.length <= 1) return;
    const timer = setInterval(() => {
      setDirection(1);
      setCurrentIndex((prev) => {
        const next = prev + 1;
        return next >= phoneItems.length ? 0 : next;
      });
    }, 2200);
    return () => clearInterval(timer);
  }, [phoneItems.length]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, cardId: string) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotations(prev => ({
      ...prev,
      [cardId]: { x: -y / 18, y: x / 18 },
    }));
  };

  const handleMouseLeave = (cardId: string) => {
    setHoveredCard(null);
    setRotations(prev => ({
      ...prev,
      [cardId]: { x: 0, y: 0 },
    }));
  };

  const handleCardClick = (cat: 'smartphones' | 'tablets') => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    } else {
      document.getElementById('device-selector-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSellPhone = (phoneId: string, phoneName?: string) => {
    if (onSelectModel) {
      onSelectModel(phoneId || phoneName || '');
    } else if (onSelectCategory) {
      onSelectCategory('smartphones');
    } else {
      document.getElementById('device-selector-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="py-12 sm:py-16 text-left relative overflow-hidden" id="explore-devices-section">
      {/* Background ambient depth glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[380px] bg-cobalt/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 sm:mb-10 gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-cobalt/10 text-cobalt border border-cobalt/15 tracking-widest uppercase font-outfit">
            <Sparkles className="w-3.5 h-3.5 text-cobalt" /> CURATED SHOWROOM
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink-navy tracking-tight font-outfit mt-2 uppercase">
            SELL YOUR <span className="text-secondary font-black">SMARTPHONE</span>
          </h2>
          <p className="text-ink-slate text-sm font-light mt-1.5 max-w-lg">
            Check real-time market values, run instant diagnostics, and lock in your price.
          </p>
        </div>
      </div>

      {/* Symmetrical 2-Column Responsive Grid Utilizing Full Space */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 items-stretch w-full">

        {/* ── CARD 1: SMARTPHONES CATEGORY HERO ── */}
        <div
          onMouseEnter={() => setHoveredCard('smartphones')}
          onMouseLeave={() => handleMouseLeave('smartphones')}
          onMouseMove={(e) => handleMouseMove(e, 'smartphones')}
          onClick={() => handleCardClick('smartphones')}
          className="cursor-pointer perspective-1000 group flex flex-col"
        >
          <div
            style={{
              transform: `rotateX(${rotations.smartphones.x}deg) rotateY(${rotations.smartphones.y}deg) translateZ(${hoveredCard === 'smartphones' ? '10px' : '0px'})`,
              transition: 'transform 0.15s ease-out, box-shadow 0.3s ease, border-color 0.3s ease',
            }}
            className="transform-style-3d h-full min-h-[440px] sm:min-h-[460px] rounded-2xl bg-canvas-pure border border-ice-border/80 p-6 sm:p-8 text-ink-navy flex flex-col justify-between relative overflow-hidden group-hover:border-cobalt/40 group-hover:shadow-3d-card-hover shadow-3d-card"
          >
            {/* Ambient Corner Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-cobalt/5 blur-3xl rounded-full pointer-events-none group-hover:bg-cobalt/10 transition-colors" />

            {/* Card Header Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-cobalt/8 text-cobalt text-[10px] font-bold font-mono tracking-widest uppercase rounded-full border border-cobalt/15">
                  FEATURED CATEGORY
                </span>
                <div className="w-10 h-10 rounded-xl bg-cobalt/10 border border-cobalt/15 flex items-center justify-center text-cobalt">
                  <Smartphone className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink-navy font-outfit uppercase tracking-tight">
                SMARTPHONES
              </h3>
              <p className="text-ink-slate text-sm font-light mt-1.5 max-w-sm">
                Get an instant value estimate for your smartphone.
              </p>
            </div>

            {/* Phone Visual — Smartphones Showcase */}
            <div className="relative mt-auto flex justify-center items-end pointer-events-none">
              <img
                src={smartphonesShowcaseImg}
                alt="Smartphones Showcase"
                style={{ mixBlendMode: 'multiply' }}
                className="h-52 sm:h-60 w-auto object-contain object-bottom block -mb-px origin-bottom group-hover:scale-105 transition-transform duration-500"
                draggable={false}
              />
            </div>

            {/* Footer CTA */}
            <div className="relative z-10 pt-4 border-t border-ice-border/50 flex items-center justify-end">
              <span className="inline-flex items-center gap-1 font-bold text-cobalt group-hover:translate-x-1 transition-transform text-xs">
                <span>Calculate Value</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* ── CARD 2: AUTOMATED SLIDING PHONE SHOWCASE & SELL NOW ── */}
        <div
          className="h-full min-h-[440px] sm:min-h-[460px] rounded-2xl bg-canvas-pure border border-ice-border/80 p-6 sm:p-8 text-ink-navy flex flex-col justify-between shadow-3d-card relative overflow-hidden group hover:border-cobalt/40 transition-all duration-300"
        >
          {/* Card Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[90px] rounded-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />

          {/* Card Header Content */}
          <div className="relative z-10">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-ink-navy font-outfit uppercase tracking-tight">
                POPULAR CASH OFFERS
              </h3>
              <p className="text-ink-slate text-xs font-light mt-0.5">
                Real-time maximum cash payouts for trending smartphones.
              </p>
            </div>
          </div>

          {/* Sliding Device Body */}
          <div className="relative my-4 flex-1 flex flex-col justify-center min-h-[200px] overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentPhone.id}
                custom={direction}
                initial={{ opacity: 0, x: direction > 0 ? 40 : -40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: direction > 0 ? -40 : 40 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="w-full flex flex-col sm:flex-row items-center justify-between gap-6 py-2"
              >
                {/* Phone Image Visual */}
                <div className="w-36 h-36 sm:w-44 sm:h-44 flex items-center justify-center shrink-0 relative">
                  <div className="absolute inset-0 bg-cobalt/5 blur-xl rounded-full" />
                  <img
                    src={currentPhone.imageUrl}
                    alt={currentPhone.name}
                    className="max-h-full max-w-full object-contain filter drop-shadow-lg transition-transform duration-500 group-hover:scale-105"
                    draggable={false}
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>

                {/* Device Details & Price */}
                <div className="flex-1 text-center sm:text-left space-y-1">
                  <h4 className="text-2xl sm:text-3xl font-black text-ink-navy font-outfit tracking-tight">
                    {currentPhone.name}
                  </h4>
                  <div className="text-3xl sm:text-4xl font-black text-emerald-600 font-outfit tracking-tight pt-1">
                    {currentPhone.formattedPrice}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer: Sell Now Button & Indicator Dots */}
          <div className="relative z-10 pt-4 border-t border-ice-border/50 space-y-3">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSellPhone(currentPhone.id, currentPhone.name);
              }}
              className="w-full py-3.5 px-6 rounded-xl bg-cobalt hover:bg-cobalt-hover text-white font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all hover:shadow-lg active:scale-[0.99] cursor-pointer group/btn"
            >
              <span>Sell Now</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
            </button>

            {/* Dots Indicator */}
            <div className="flex items-center justify-center gap-1.5 pt-1">
              {phoneItems.map((_, dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() => {
                    setDirection(dotIdx > currentIndex ? 1 : -1);
                    setCurrentIndex(dotIdx);
                  }}
                  className={`h-1.5 rounded-full transition-all cursor-pointer ${
                    dotIdx === currentIndex
                      ? 'w-6 bg-cobalt'
                      : 'w-1.5 bg-slate-200 hover:bg-slate-300'
                  }`}
                  aria-label={`Go to device ${dotIdx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};
