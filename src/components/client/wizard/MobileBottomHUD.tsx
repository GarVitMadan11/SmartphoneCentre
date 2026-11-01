import React from 'react';
import { ChevronRight, ArrowLeft } from 'lucide-react';
import { AnimatedPrice } from './AnimatedPrice';

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
  retentionPercentage: _retentionPercentage,
  isCritical,
  isLoggedIn: _isLoggedIn,
  canProceed,
  onNext,
  onBack,
  reviewStepIndex,
  nextLabel = 'Next'
}) => {
  // Only display on mobile on steps before the final review/receipt
  if (step >= reviewStepIndex) return null;

  return (
    <div 
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-4px_24px_rgba(0,0,0,0.06)] px-4 py-2.5 sm:hidden select-none safe-area-bottom" 
      style={{ paddingBottom: 'max(0.65rem, env(safe-area-inset-bottom))' }}
    >
      <div className="flex items-center justify-between gap-2 max-w-md mx-auto">
        {/* Left: Back Button */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Previous step"
          className="w-9 h-9 rounded-lg bg-slate-50/90 hover:bg-slate-100 text-slate-700 flex items-center justify-center flex-shrink-0 active:scale-95 transition-all border border-slate-200/90 shadow-2xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2]" />
        </button>

        {/* Middle: Financial Value HUD */}
        <div className="flex-1 min-w-0 px-2 text-left">
          <div className="flex items-center gap-1.5 leading-none mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 flex-shrink-0" />
            <span className="text-[11px] font-semibold text-slate-500 tracking-tight">
              Estimated Payout
            </span>
          </div>

          <div className="flex items-baseline leading-none">
            <AnimatedPrice
              value={finalPrice}
              isMasked={false}
              isCritical={isCritical}
              className="text-xl font-bold text-emerald-700 tracking-tight leading-none"
            />
          </div>
        </div>

        {/* Right: Primary Step Action */}
        <button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-semibold text-xs transition-all flex-shrink-0 cursor-pointer ${
            canProceed
              ? 'bg-cobalt hover:bg-cobalt-hover text-white shadow-sm active:scale-95'
              : 'bg-[#E5ECF6] text-[#7E8B9B] cursor-not-allowed shadow-none'
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
