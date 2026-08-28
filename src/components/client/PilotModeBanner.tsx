import React from 'react';
import { MessageSquareHeart, Sparkles, ArrowRight, Zap, ShieldCheck, Flame, PhoneCall } from 'lucide-react';

interface PilotModeBannerProps {
  onOpenFeedback: () => void;
}

export const PilotModeBanner: React.FC<PilotModeBannerProps> = ({ onOpenFeedback }) => {
  const renderTickerSegment = (keyPrefix: string) => (
    <div key={keyPrefix} className="flex items-center space-x-6 sm:space-x-10 shrink-0 px-8">
      {/* 1. Primary Highlight Badge & Announcement */}
      <div className="inline-flex items-center gap-3">
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-80"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 shadow-lg shadow-emerald-400/80"></span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-mono font-black tracking-widest uppercase bg-gradient-to-r from-emerald-500/30 via-teal-500/20 to-emerald-500/30 border border-emerald-400/40 text-emerald-300 shadow-inner">
          <Sparkles className="w-3 h-3 text-emerald-300 animate-pulse" />
          <span>WE ARE LIVE NOW</span>
        </span>
        <span className="text-xs sm:text-sm font-extrabold font-outfit text-white tracking-wide flex items-center gap-2 drop-shadow-sm">
          <span className="text-base animate-bounce">⚡</span>
          <span className="bg-gradient-to-r from-white via-slate-100 to-emerald-200 bg-clip-text text-transparent">
            Sell Your Old Smartphones &amp; Gadgets Instantly!
          </span>
        </span>
      </div>

      {/* Radiant Diamond Separator */}
      <span className="text-amber-400/60 text-xs font-black select-none drop-shadow-sm">◆</span>

      {/* 2. Unlisted Models Notice */}
      <div className="inline-flex items-center gap-2 bg-slate-900/60 backdrop-blur-md px-3 py-1 rounded-full border border-slate-700/50 shadow-inner">
        <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <p className="text-xs sm:text-[13px] text-slate-200 font-medium whitespace-nowrap">
          Can’t find your model? <span className="text-amber-300 font-bold">New models added daily!</span> Reach out below.
        </p>
      </div>

      {/* Radiant Diamond Separator */}
      <span className="text-cyan-400/60 text-xs font-black select-none drop-shadow-sm">◆</span>

      {/* 3. Doorstep Payout Feature Pill */}
      <div className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] text-cyan-200 font-semibold whitespace-nowrap bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-400/30 shadow-sm">
        <Zap className="w-3.5 h-3.5 text-cyan-300" />
        <span>Instant Doorstep Payouts &amp; Free Pickup</span>
      </div>

      {/* Radiant Diamond Separator */}
      <span className="text-emerald-400/60 text-xs font-black select-none drop-shadow-sm">◆</span>

      {/* 4. High-converting Interactive CTA Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenFeedback();
        }}
        className="inline-flex items-center gap-2 px-4 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-extrabold rounded-full border border-blue-400/50 shadow-md shadow-blue-900/60 hover:shadow-blue-500/30 hover:scale-105 transition-all duration-200 active:scale-95 group shrink-0 cursor-pointer"
        aria-label="Contact Us & Request Model"
      >
        <PhoneCall className="w-3.5 h-3.5 text-blue-200 group-hover:scale-110 transition-transform" />
        <span className="tracking-wide">Contact Us / Request Model</span>
        <ArrowRight className="w-3.5 h-3.5 text-blue-200 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Section End Separator */}
      <span className="text-slate-600 text-xs font-black select-none mr-2">•</span>
    </div>
  );

  return (
    <aside
      aria-label="Rephonix Live Announcement Ticker"
      className="ticker-container relative w-full bg-gradient-to-r from-[#030919] via-[#091838] to-[#030919] text-white border-b border-indigo-500/30 shadow-md overflow-hidden select-none py-2.5 z-40"
    >
      {/* Dynamic Animated Gradient Glow Bar */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-400 to-transparent opacity-80" />

      {/* Subtle Mesh Background Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_50%_0%,_var(--tw-gradient-stops))] from-blue-500 via-indigo-600 to-transparent" />

      {/* Left and Right Edge Gradient Vignette Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-10 sm:w-20 bg-gradient-to-r from-[#030919] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-10 sm:w-20 bg-gradient-to-l from-[#030919] to-transparent z-10 pointer-events-none" />

      {/* Infinite Seamless Scrolling Marquee Track */}
      <div className="flex w-full overflow-hidden">
        <div className="animate-pilot-ticker flex items-center">
          {renderTickerSegment('track-1')}
          {renderTickerSegment('track-2')}
        </div>
      </div>
    </aside>
  );
};

export default PilotModeBanner;

