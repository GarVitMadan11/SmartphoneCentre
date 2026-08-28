import React from 'react';
import { MessageSquareHeart, Sparkles, ArrowRight } from 'lucide-react';

interface PilotModeBannerProps {
  onOpenFeedback: () => void;
}

export const PilotModeBanner: React.FC<PilotModeBannerProps> = ({ onOpenFeedback }) => {
  // Single sequence item for the continuous marquee loop
  const renderTickerSegment = (keyPrefix: string) => (
    <div key={keyPrefix} className="flex items-center space-x-6 sm:space-x-8 shrink-0 px-6">
      {/* 1. Primary Highlight Badge & Message */}
      <div className="inline-flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/20 border border-emerald-400/30 text-emerald-300">
          <Sparkles className="w-2.5 h-2.5 text-emerald-300" />
          <span>WE ARE LIVE</span>
        </span>
        <span className="text-xs sm:text-sm font-bold font-outfit text-white tracking-wide flex items-center gap-1.5">
          <span>🎉</span>
          <span>We are LIVE &amp; now you can sell your old gadgets!</span>
        </span>
      </div>

      {/* Subtle Bullet Separator */}
      <span className="text-blue-400/40 text-xs font-bold select-none">•</span>

      {/* 2. Supporting Message */}
      <p className="text-xs sm:text-[13px] text-slate-300 font-light leading-none whitespace-nowrap">
        Can’t find your specific phone? Some models are currently not listed and will be added very soon!
      </p>

      {/* Subtle Bullet Separator */}
      <span className="text-blue-400/40 text-xs font-bold select-none">•</span>

      {/* 3. Additional Message */}
      <div className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] text-blue-200/90 font-medium whitespace-nowrap bg-blue-500/10 px-2.5 py-0.5 rounded-md border border-blue-400/20">
        <span>More gadget categories &amp; models coming soon</span>
      </div>

      {/* Subtle Bullet Separator */}
      <span className="text-blue-400/40 text-xs font-bold select-none">•</span>

      {/* 4. Interactive Call to Action Button */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenFeedback();
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-full border border-blue-400/40 shadow-sm shadow-blue-900/50 hover:scale-105 transition-all duration-200 active:scale-95 group shrink-0 cursor-pointer"
        aria-label="Contact Us & Feedback"
      >
        <MessageSquareHeart className="w-3 h-3 text-blue-200 group-hover:scale-110 transition-transform" />
        <span>Contact Us / Support</span>
        <ArrowRight className="w-3 h-3 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Section End Bullet Separator */}
      <span className="text-blue-400/40 text-xs font-bold select-none mr-2">•</span>
    </div>
  );

  return (
    <aside
      aria-label="Rephonix Pilot Mode Announcement"
      className="ticker-container relative w-full bg-gradient-to-r from-[#001432] via-[#00224d] to-[#001432] text-white border-b border-blue-500/25 shadow-sm overflow-hidden select-none py-2.5 z-40"
    >
      {/* Subtle Glowing Radial Accent */}
      <div className="absolute inset-0 pointer-events-none opacity-25 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent" />

      {/* Left and Right Gradient Edge Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#001432] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#001432] to-transparent z-10 pointer-events-none" />

      {/* Infinite Seamless Scrolling Marquee Track (Continuous non-stop motion) */}
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
