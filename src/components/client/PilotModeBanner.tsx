import React from 'react';
import { MessageSquareHeart, Sparkles, ArrowRight } from 'lucide-react';

interface PilotModeBannerProps {
  onOpenFeedback: () => void;
}

export const PilotModeBanner: React.FC<PilotModeBannerProps> = ({ onOpenFeedback }) => {
  // Single sequence item for the marquee loop
  const renderTickerSegment = (keyPrefix: string) => (
    <div key={keyPrefix} className="flex items-center space-x-6 sm:space-x-8 shrink-0 px-4">
      {/* 1. Primary Highlight Badge & Message */}
      <div className="inline-flex items-center gap-2.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 shadow-sm shadow-emerald-400/50"></span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-cobalt/40 border border-sky-400/30 text-sky-200">
          <Sparkles className="w-2.5 h-2.5 text-sky-300" />
          <span>Pilot Mode</span>
        </span>
        <span className="text-xs sm:text-sm font-bold font-outfit text-white tracking-wide flex items-center gap-1.5">
          <span>🚀</span>
          <span>We’re Currently in Pilot Mode</span>
        </span>
      </div>

      {/* Bullet Separator */}
      <span className="text-sky-400/40 text-xs font-bold select-none">•</span>

      {/* 2. Supporting Message */}
      <p className="text-xs sm:text-[13px] text-slate-200 font-light leading-none whitespace-nowrap">
        We’re building and improving the experience, and your feedback can help us make it better. Tell us what you’d like to see, what we can improve, and what would make the website more useful for you.
      </p>

      {/* Bullet Separator */}
      <span className="text-sky-400/40 text-xs font-bold select-none">•</span>

      {/* 3. Additional Message */}
      <div className="inline-flex items-center gap-1.5 text-xs sm:text-[13px] text-sky-200/90 font-medium whitespace-nowrap bg-white/5 px-2.5 py-0.5 rounded-md border border-white/10">
        <span>More brands &amp; models will be available soon</span>
      </div>

      {/* Bullet Separator */}
      <span className="text-sky-400/40 text-xs font-bold select-none">•</span>

      {/* 4. Interactive Call to Action */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenFeedback();
        }}
        className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-cobalt to-indigo-600 hover:from-sky-500 hover:to-cobalt text-white text-[11px] sm:text-xs font-bold rounded-full border border-sky-300/40 shadow-sm hover:shadow-sky-500/25 transition-all duration-200 active:scale-95 group shrink-0 cursor-pointer"
        aria-label="Share Your Feedback"
      >
        <MessageSquareHeart className="w-3 h-3 text-sky-200 group-hover:scale-110 transition-transform" />
        <span>Share Your Feedback</span>
        <ArrowRight className="w-3 h-3 text-sky-200 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* Section End Bullet Separator */}
      <span className="text-sky-400/40 text-xs font-bold select-none mr-2">•</span>
    </div>
  );

  return (
    <aside
      aria-label="Rephonix Pilot Mode Announcement"
      className="ticker-container relative w-full bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-slate-100 border-b border-sky-500/20 shadow-inner overflow-hidden select-none py-2.5 z-40"
    >
      {/* Subtle Glowing Background Accents */}
      <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-sky-900/30 via-transparent to-transparent" />

      {/* Left and Right Gradient Edge Masks for Seamless Fade */}
      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-slate-950 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-slate-950 to-transparent z-10 pointer-events-none" />

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
