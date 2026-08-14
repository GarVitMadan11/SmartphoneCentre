import React, { useState } from 'react';
import { Smartphone, Tablet, Watch, ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';

interface DeviceCategoryShowcaseProps {
  onSelectCategory?: (category: 'smartphones' | 'tablets' | 'smartwatches') => void;
}

export const DeviceCategoryShowcase: React.FC<DeviceCategoryShowcaseProps> = ({
  onSelectCategory,
}) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [rotations, setRotations] = useState<Record<string, { x: number; y: number }>>({
    smartphones: { x: 0, y: 0 },
    tablets: { x: 0, y: 0 },
    smartwatches: { x: 0, y: 0 },
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, cardId: string) => {
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

  const handleCardClick = (cat: 'smartphones' | 'tablets' | 'smartwatches') => {
    if (onSelectCategory) {
      onSelectCategory(cat);
    }
    document.getElementById('device-selector-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="py-16 text-left relative overflow-hidden" id="explore-devices-section">
      {/* Background ambient depth glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-cobalt/5 blur-[120px] rounded-full pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-cobalt/10 text-cobalt border border-cobalt/15 tracking-widest uppercase font-outfit">
            <Sparkles className="w-3.5 h-3.5 text-cobalt" /> VALUATION CENTER
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-ink-navy tracking-tight font-outfit mt-2 uppercase">
            SELL YOUR <span className="text-secondary font-black">DEVICES</span>
          </h2>
          <p className="text-ink-slate text-sm font-light mt-1.5 max-w-lg">
            Select a hardware category to calculate your instant trade-in value, diagnostic report, and cash payout options.
          </p>
        </div>
      </div>

      {/* Editorial Asymmetric Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">

        {/* 1. SMARTPHONES — Featured Large Card (7 cols) */}
        <div
          onMouseEnter={() => setHoveredCard('smartphones')}
          onMouseLeave={() => handleMouseLeave('smartphones')}
          onMouseMove={(e) => handleMouseMove(e, 'smartphones')}
          onClick={() => handleCardClick('smartphones')}
          className="lg:col-span-7 cursor-pointer perspective-1000 group"
        >
          <div
            style={{
              transform: `rotateX(${rotations.smartphones.x}deg) rotateY(${rotations.smartphones.y}deg) translateZ(${hoveredCard === 'smartphones' ? '12px' : '0px'})`,
              transition: 'transform 0.15s ease-out, box-shadow 0.3s ease, border-color 0.3s ease',
            }}
            className="transform-style-3d h-full min-h-[380px] sm:min-h-[420px] rounded-2xl bg-gradient-to-br from-[#001c3d] via-[#002652] to-[#001026] border border-blue-500/20 p-7 sm:p-9 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group-hover:border-cobalt/60 group-hover:shadow-[0_20px_50px_rgba(0,32,69,0.35)]"
          >
            {/* Background 3D grid line pattern */}
            <div className="absolute inset-0 opacity-[0.06] grid-3d-bg pointer-events-none" />
            <div className="absolute -top-16 -right-16 w-56 h-56 bg-cobalt/25 rounded-full blur-3xl pointer-events-none group-hover:bg-cobalt/40 transition-all duration-500" />

            {/* Card Header Content */}
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <span className="px-3 py-1 bg-white/10 text-white/90 text-[10px] font-bold font-mono tracking-widest uppercase rounded-full border border-white/15">
                  FEATURED CATEGORY
                </span>
                <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-400">
                  <Smartphone className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white font-outfit uppercase tracking-tight">
                SMARTPHONES
              </h3>
              <p className="text-slate-300 text-sm font-light mt-1.5 max-w-sm">
                Get the best cash value for your phone.
              </p>
            </div>

            {/* Phone Visual Render inside card */}
            <div className="relative my-6 flex justify-center items-center pointer-events-none">
              <div className="relative w-44 h-56 sm:w-48 sm:h-60 border-2 border-white/20 rounded-[28px] bg-gradient-to-b from-[#1C1C1E] via-[#2C2C2E] to-[#111] p-2.5 shadow-2xl group-hover:scale-105 group-hover:-rotate-3 transition-transform duration-500">
                <div className="w-full h-full rounded-[22px] bg-gradient-to-tr from-[#002045] via-[#003670] to-[#001733] p-3 flex flex-col justify-between overflow-hidden relative border border-white/10">
                  <div className="w-12 h-3 bg-black rounded-full mx-auto" />
                  <div className="space-y-1.5 my-auto">
                    <div className="text-[10px] font-bold text-white font-outfit uppercase tracking-wider">iPhone 17 Pro</div>
                    <div className="text-[8px] font-mono text-emerald-400">Valuation: Up to ₹85,000</div>
                    <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                      <div className="w-4/5 h-full bg-emerald-400 rounded-full" />
                    </div>
                  </div>
                  <div className="text-[7.5px] text-white/50 text-center font-mono">100% NIST DATA WIPED</div>
                </div>
              </div>
            </div>

            {/* Footer CTA */}
            <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" /> Instant Valuation &amp; Payout
              </span>
              <span className="inline-flex items-center gap-2 text-xs font-bold text-white bg-cobalt/80 px-4 py-2 rounded-xl group-hover:bg-cobalt transition-all shadow-md group-hover:translate-x-1">
                <span>Check Phone Value</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            </div>
          </div>
        </div>

        {/* Stacked Right Column for Tablets & Smartwatches (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">

          {/* 2. TABLETS & iPADS Card */}
          <div
            onMouseEnter={() => setHoveredCard('tablets')}
            onMouseLeave={() => handleMouseLeave('tablets')}
            onMouseMove={(e) => handleMouseMove(e, 'tablets')}
            onClick={() => handleCardClick('tablets')}
            className="cursor-pointer perspective-1000 group flex-1"
          >
            <div
              style={{
                transform: `rotateX(${rotations.tablets.x}deg) rotateY(${rotations.tablets.y}deg) translateZ(${hoveredCard === 'tablets' ? '10px' : '0px'})`,
                transition: 'transform 0.15s ease-out, box-shadow 0.3s ease, border-color 0.3s ease',
              }}
              className="transform-style-3d h-full min-h-[200px] rounded-2xl bg-canvas-pure border border-ice-border/80 p-6 text-ink-navy flex flex-col justify-between shadow-3d-card relative overflow-hidden group-hover:border-cobalt/40 group-hover:shadow-3d-card-hover"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-cobalt/10 text-cobalt flex items-center justify-center mb-3">
                    <Tablet className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-ink-navy uppercase tracking-tight">
                    TABLETS &amp; iPADS
                  </h3>
                  <p className="text-ink-slate text-xs font-light mt-1">
                    Value estimation for iPads &amp; tablets.
                  </p>
                </div>

                {/* Mini Tablet Graphic */}
                <div className="w-24 h-16 border border-ink-navy/20 rounded-lg bg-gradient-to-r from-slate-100 to-slate-200 p-1 shadow-md group-hover:rotate-2 transition-transform duration-300 flex-shrink-0">
                  <div className="w-full h-full bg-slate-900 rounded-sm p-1 flex items-center justify-center">
                    <div className="text-[7px] text-white/80 font-mono">iPad Pro 13"</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-ice-border/50 flex items-center justify-between text-xs">
                <span className="text-ink-slate font-medium text-[11px]">Secure Data Wipe</span>
                <span className="inline-flex items-center gap-1 font-bold text-cobalt group-hover:translate-x-1 transition-transform">
                  <span>Check Tablet Value</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* 3. SMARTWATCHES Card */}
          <div
            onMouseEnter={() => setHoveredCard('smartwatches')}
            onMouseLeave={() => handleMouseLeave('smartwatches')}
            onMouseMove={(e) => handleMouseMove(e, 'smartwatches')}
            onClick={() => handleCardClick('smartwatches')}
            className="cursor-pointer perspective-1000 group flex-1"
          >
            <div
              style={{
                transform: `rotateX(${rotations.smartwatches.x}deg) rotateY(${rotations.smartwatches.y}deg) translateZ(${hoveredCard === 'smartwatches' ? '10px' : '0px'})`,
                transition: 'transform 0.15s ease-out, box-shadow 0.3s ease, border-color 0.3s ease',
              }}
              className="transform-style-3d h-full min-h-[200px] rounded-2xl bg-canvas-pure border border-ice-border/80 p-6 text-ink-navy flex flex-col justify-between shadow-3d-card relative overflow-hidden group-hover:border-cobalt/40 group-hover:shadow-3d-card-hover"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mb-3">
                    <Watch className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-ink-navy uppercase tracking-tight">
                    SMARTWATCHES
                  </h3>
                  <p className="text-ink-slate text-xs font-light mt-1">
                    Instant cash values for wearables.
                  </p>
                </div>

                {/* Mini Smartwatch Graphic */}
                <div className="w-14 h-18 border border-ink-navy/20 rounded-2xl bg-gradient-to-b from-stone-300 to-stone-400 p-1 shadow-md group-hover:-rotate-3 transition-transform duration-300 flex-shrink-0">
                  <div className="w-full h-full bg-slate-900 rounded-xl p-1 flex items-center justify-center">
                    <div className="w-2.5 h-2.5 rounded-full border border-emerald-400 flex items-center justify-center">
                      <div className="w-1 h-1 bg-emerald-400 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-ice-border/50 flex items-center justify-between text-xs">
                <span className="text-ink-slate font-medium text-[11px]">Wearable Diagnostics</span>
                <span className="inline-flex items-center gap-1 font-bold text-cobalt group-hover:translate-x-1 transition-transform">
                  <span>Check Watch Value</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};
