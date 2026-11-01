import React from 'react';
import { ArrowRight } from 'lucide-react';

interface PilotModeBannerProps {
  onOpenFeedback: () => void;
}

export const PilotModeBanner: React.FC<PilotModeBannerProps> = ({ onOpenFeedback }) => {
  const renderTickerSegment = (keyPrefix: string) => (
    <div key={keyPrefix} className="flex items-center space-x-6 sm:space-x-10 shrink-0 px-4 sm:px-6">
      {/* 1. Live Platform Announcement */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
        <span className="text-xs font-semibold text-white tracking-tight">Live Platform:</span>
        <span className="text-xs text-slate-300 font-normal">Sell Smartphones &amp; Gadgets at Peak Valuation</span>
      </div>

      <span className="text-slate-700 text-xs select-none">•</span>

      {/* 2. Doorstep Pickup & Instant Transfer */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="text-xs font-semibold text-white tracking-tight">Doorstep Pickup:</span>
        <span className="text-xs text-slate-300 font-normal">Instant Transfer</span>
      </div>

      <span className="text-slate-700 text-xs select-none">•</span>

      {/* 3. Transparent Valuation Guarantee */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="text-xs font-semibold text-white tracking-tight">100% Transparent:</span>
        <span className="text-xs text-slate-300 font-normal">Honest Evaluation with Zero Surprise Deductions</span>
      </div>

      <span className="text-slate-700 text-xs select-none">•</span>

      {/* 4. Unlisted Device / Action Link */}
      <div className="flex items-center gap-2 whitespace-nowrap">
        <span className="text-xs text-slate-300 font-normal">Device unlisted or need custom pricing?</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenFeedback();
          }}
          className="inline-flex items-center gap-1 text-xs font-bold text-sky-400 hover:text-white transition-colors cursor-pointer underline underline-offset-2"
          aria-label="Request Custom Quote"
        >
          <span>Request Custom Quote</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <span className="text-slate-700 text-xs select-none mr-2">•</span>
    </div>
  );

  return (
    <aside
      aria-label="Rephonix Live Announcement Ticker"
      className="ticker-container relative w-full bg-[#001026] text-white border-b border-blue-950/60 shadow-2xs overflow-hidden select-none py-1.5 z-40 group"
    >
      {/* Edge Vignette Gradient Masks */}
      <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-[#001026] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-[#001026] to-transparent z-10 pointer-events-none" />

      {/* Infinite Seamless Scrolling Marquee Track with Pause on Hover */}
      <div className="flex w-full overflow-hidden">
        <div className="animate-pilot-ticker flex items-center">
          {renderTickerSegment('track-1')}
          {renderTickerSegment('track-2')}
          {renderTickerSegment('track-3')}
          {renderTickerSegment('track-4')}
        </div>
      </div>
    </aside>
  );
};

export default PilotModeBanner;
