import React, { useState } from 'react';
import { Smartphone, Tablet, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

interface DeviceCategoryShowcaseProps {
  onSelectCategory?: (category: 'smartphones' | 'tablets') => void;
}

export const DeviceCategoryShowcase: React.FC<DeviceCategoryShowcaseProps> = ({
  onSelectCategory,
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [rotations, setRotations] = useState<Record<string, { x: number; y: number }>>({
    smartphones: { x: 0, y: 0 },
    tablets: { x: 0, y: 0 },
  });

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

  return (
    <section className="py-16 text-left relative overflow-hidden" id="explore-devices-section">
      {/* Background ambient depth glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cobalt/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-cobalt/10 text-cobalt border border-cobalt/15 tracking-widest uppercase font-outfit">
            <Sparkles className="w-3.5 h-3.5 text-cobalt" /> CURATED SHOWROOM
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink-navy tracking-tight font-outfit mt-2 uppercase">
            SELL YOUR <span className="text-secondary font-black">DEVICE</span>
          </h2>
          <p className="text-ink-slate text-sm font-light mt-1.5 max-w-lg">
            Select your hardware category to check market trade-in values, run diagnostics, and start your sell order.
          </p>
        </div>
      </div>

      {/* Symmetrical 2-Column Responsive Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-stretch">

        {/* 1. SMARTPHONES Card */}
        <div
          onMouseEnter={() => setHoveredCard('smartphones')}
          onMouseLeave={() => handleMouseLeave('smartphones')}
          onMouseMove={(e) => handleMouseMove(e, 'smartphones')}
          onClick={() => handleCardClick('smartphones')}
          className="cursor-pointer perspective-1000 group flex flex-col"
        >
          <div
            style={{
              transform: `rotateX(${rotations.smartphones.x}deg) rotateY(${rotations.smartphones.y}deg) translateZ(${hoveredCard === 'smartphones' ? '12px' : '0px'})`,
              transition: 'transform 0.15s ease-out, box-shadow 0.3s ease, border-color 0.3s ease',
            }}
            className="transform-style-3d h-full min-h-[380px] sm:min-h-[420px] rounded-2xl bg-canvas-pure border border-ice-border/80 p-7 sm:p-9 text-ink-navy flex flex-col justify-between relative overflow-hidden group-hover:border-cobalt/40 group-hover:shadow-3d-card-hover shadow-3d-card"
          >

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

            {/* Phone Visual — Apple iPhone 17 Pro hero image */}
            <div className="relative my-4 flex justify-center items-center pointer-events-none">
              <img
                src="https://cdsassets.apple.com/live/7WUAS350/images/tech-specs/iphone-17-pro-17-pro-max-hero.png"
                alt="iPhone 17 Pro"
                className="h-56 sm:h-64 w-auto object-contain group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-500 drop-shadow-none"
                draggable={false}
              />
            </div>

            {/* Footer CTA */}
            <div className="relative z-10 pt-4 border-t border-ice-border/50 flex items-center justify-between">
              <span className="text-xs font-bold text-ink-slate group-hover:text-ink-navy transition-colors flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-secondary" /> Instant Doorstep Valuation
              </span>
              <span className="inline-flex items-center gap-1 font-bold text-cobalt group-hover:translate-x-1 transition-transform text-xs">
                <span>Calculate Value</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        </div>

        {/* 2. TABLETS & iPADS Card */}
        <div
          onMouseEnter={() => setHoveredCard('tablets')}
          onMouseLeave={() => handleMouseLeave('tablets')}
          onMouseMove={(e) => handleMouseMove(e, 'tablets')}
          onClick={() => handleCardClick('tablets')}
          className="cursor-pointer perspective-1000 group flex flex-col"
        >
            <div
              style={{
                transform: `rotateX(${rotations.tablets.x}deg) rotateY(${rotations.tablets.y}deg) translateZ(${hoveredCard === 'tablets' ? '10px' : '0px'})`,
                transition: 'transform 0.15s ease-out, box-shadow 0.3s ease, border-color 0.3s ease',
              }}
              className="transform-style-3d w-full h-full min-h-[380px] sm:min-h-[420px] rounded-2xl bg-canvas-pure border border-ice-border/80 p-7 sm:p-9 text-ink-navy flex flex-col justify-between shadow-3d-card relative overflow-hidden group-hover:border-cobalt/40 group-hover:shadow-3d-card-hover"
            >
              {/* Card Header Content */}
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-violet-500/10 text-violet-600 text-[10px] font-bold font-mono tracking-widest uppercase rounded-full border border-violet-500/20">
                    POPULAR CATEGORY
                  </span>
                  <div className="w-10 h-10 rounded-xl bg-cobalt/10 border border-cobalt/15 flex items-center justify-center text-cobalt">
                    <Tablet className="w-5 h-5" />
                  </div>
                </div>
                <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-ink-navy font-outfit uppercase tracking-tight">
                  TABLETS &amp; iPADS
                </h3>
                <p className="text-ink-slate text-sm font-light mt-1.5 max-w-sm">
                  Value your iPad or tablet.
                </p>
              </div>

              {/* iPad Image in Middle */}
              <div className="relative my-4 flex justify-center items-center pointer-events-none">
                <img
                  src="https://store.storeimages.cdn-apple.com/1/as-images.apple.com/is/ipad-card-50-compare-202410?wid=960&hei=1000&fmt=p-jpg&qlt=95&.v=M3lSVmFUMUZBN2ROWUZKMWNoYUJPMVArK1BMQkNMdGlyQzh1ZkEyWXJpY2YzUHRVc053YldlK2NuZForb0M1V0tRNjVHZTlIV04vVjZjbEh0Rm5SYzNNUXpLcVIzNFk3K3pyYXpQZ2taZjA"
                  alt="iPad Pro 13"
                  className="h-44 sm:h-52 w-auto object-contain group-hover:scale-105 group-hover:rotate-2 transition-transform duration-500 drop-shadow-none"
                  draggable={false}
                />
              </div>

              <div className="relative z-10 pt-4 border-t border-ice-border/50 flex items-center justify-between">
                <span className="text-xs font-bold text-ink-slate group-hover:text-ink-navy transition-colors flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-secondary" /> Trade-in &amp; Diagnostics
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-cobalt group-hover:translate-x-1 transition-transform text-xs">
                  <span>Calculate Value</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>
    );
  };
