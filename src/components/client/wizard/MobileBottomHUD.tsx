import React from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { AnimatedPrice } from './AnimatedPrice';
import { PriceDeltaBadge } from './PriceDeltaBadge';

interface MobileBottomHUDProps {
  step: number;
  finalPrice: number;
  retentionPercentage: number;
  isCritical: boolean;
  isLoggedIn: boolean;
  canProceed: boolean;
  onNext: () => void;
  onBack: () => void;
  reviewStepIndex: number;
  nextLabel?: string;
}

export const MobileBottomHUD: React.FC<MobileBottomHUDProps> = ({
  step,
  finalPrice,
  retentionPercentage,
  isCritical,
  isLoggedIn,
  canProceed,
  onNext,
  onBack,
  reviewStepIndex,
  nextLabel = 'Next'
}) => {
  // Only display on mobile on steps before the final review/receipt
  if (step >= reviewStepIndex) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.10)] px-3.5 py-2.5 sm:hidden safe-area-bottom">
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {/* Left: Financial Value HUD */}
        <div className="flex items-center gap-2 min-w-0">
          {step > 0 && (
            <button
              type="button"
              onClick={onBack}
              aria-label="Previous step"
              className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center flex-shrink-0 active:scale-95 transition-transform border border-slate-300/60"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          <div className="min-w-0 text-left">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse flex-shrink-0" />
              <span className="text-[9px] font-mono font-bold tracking-wider text-slate-500 uppercase truncate">
                LIVE PAYOUT
              </span>
              <PriceDeltaBadge currentPrice={finalPrice} disabled={!isLoggedIn || isCritical} />
            </div>

            <div className="flex items-center gap-1.5 mt-0.5">
              <AnimatedPrice
                value={finalPrice}
                isMasked={!isLoggedIn}
                isCritical={isCritical}
                className="text-lg font-black text-emerald-700 font-outfit tracking-tight leading-none"
              />
              <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.5 rounded-full flex-shrink-0">
                {retentionPercentage}%
              </span>
            </div>
          </div>
        </div>

        {/* Right: Primary Step Action */}
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className={`flex items-center gap-1 px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm transition-all flex-shrink-0 ${
            canProceed
              ? 'bg-blue-600 hover:bg-blue-700 active:scale-95 text-white ring-2 ring-blue-500/30'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          <span>{nextLabel}</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

export default MobileBottomHUD;
