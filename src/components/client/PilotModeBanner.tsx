import React from 'react';
import { MessageSquareHeart, Sparkles, ArrowRight, Radio } from 'lucide-react';

interface PilotModeBannerProps {
  onOpenFeedback: () => void;
}

export const PilotModeBanner: React.FC<PilotModeBannerProps> = ({ onOpenFeedback }) => {
  // Single sequence item for the marquee loop
  const renderTickerSegment = (keyPrefix: string) => (
    <div key={keyPrefix} className="flex items-center space-x-6 sm:space-x-10 shrink-0 px-6">
      {/* 1. Primary Highlight Badge & Message */}
      <div className="inline-flex items-center gap-3">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-90"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400 shadow-md shadow-amber-400/80"></span>
        </span>
        <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-mono font-extrabold uppercase tracking-wider bg-sky-400/25 border border-sky-300/50 text-white shadow-sm">
          <Sparkles className="w-3 h-3 text-amber-300" />
          <span>PILOT MODE</span>
        </span>
        <span className="text-sm sm:text-[15px] font-extrabold font-outfit text-white tracking-wide flex items-center gap-1.5 drop-shadow-sm">
          <span className="text-base">🚀</span>
          <span>We’re Currently in Pilot Mode</span>
        </span>
      </div>

      {/* Glowing Divider */}
      <span className="text-sky-300/60 text-sm font-bold select-none">✦</span>

      {/* 2. Supporting Message */}
      <p className="text-xs sm:text-sm text-sky-50 font-normal leading-none whitespace-nowrap drop-shadow-sm">
        We’re building and improving the experience, and your feedback can help us make it better. Tell us what you’d like to see, what we can improve, and what would make the website more useful for you.
      </p>

      {/* Glowing Divider */}
      <span className="text-sky-300/60 text-sm font-bold select-none">✦</span>

      {/* 3. Additional Message */}
      <div className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-amber-200 font-bold whitespace-nowrap bg-amber-500/20 px-3.5 py-1 rounded-full border border-amber-400/40 shadow-sm">
        <span>✨ More brands &amp; models will be available soon</span>
      </div>

      {/* Glowing Divider */}
      <span className="text-sky-300/60 text-sm font-bold select-none">✦</span>

      {/* 4. High-Contrast Interactive Call to Action */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpenFeedback();
        }}
        className="inline-flex items-center gap-2 px-4 py-1.5 bg-white hover:bg-sky-50 text-blue-950 text-xs sm:text-sm font-black rounded-full border-2 border-white shadow-lg shadow-black/20 hover:shadow-xl hover:scale-105 transition-all duration-150 active:scale-95 group shrink-0 cursor-pointer"
        aria-label="Share Your Feedback"
      >
        <MessageSquareHeart className="w-3.5 h-3.5 text-blue-700 group-hover:scale-110 transition-transform" />
        <span>Share Your Feedback</span>
        <ArrowRight className="w-3.5 h-3.5 text-blue-700 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Section End Divider */}
      <span className="text-sky-300/60 text-sm font-bold select-none mr-4">✦</span>
    </div>
  );

  return (
    <aside
      aria-label="Rephonix Pilot Mode Announcement"
      className="ticker-container relative w-full bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 text-white border-b-2 border-sky-400/60 shadow-lg overflow-hidden select-none py-3 z-40"
    >
      {/* High-Tech Animated Ambient Backdrop Glow */}
      <div className="absolute inset-0 pointer-events-none opacity-30 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white/30 via-sky-300/10 to-transparent" />

      {/* Subtle Edge Fade Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-blue-700 to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-blue-800 to-transparent z-10 pointer-events-none" />

      {/* Fixed Left Ticker Headline (Desktop) */}
      <div className="hidden lg:flex absolute left-3 top-1/2 -translate-y-1/2 z-20 items-center gap-2 bg-slate-950/80 backdrop-blur-md text-amber-300 font-extrabold text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-amber-400/40 shadow-md">
        <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
        <span>Live Notice</span>
      </div>

      {/* Infinite Seamless Continuous Scrolling Marquee Track */}
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
