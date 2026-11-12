import React from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, ChevronRight } from 'lucide-react';
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
  nextLabel = 'Next',
}) => {
  // Only display on mobile on steps before the final review/receipt
  if (step >= reviewStepIndex) return null;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className="fixed bottom-3 left-3 right-3 z-40 sm:hidden select-none safe-area-bottom pointer-events-none"
    >
      {/* High-Contrast Floating Glass Pill */}
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl p-2.5 px-3.5 shadow-2xl flex items-center justify-between gap-3 max-w-md mx-auto pointer-events-auto ring-1 ring-black/60">
        
        {/* Left: Back Button */}
        <button
          type="button"
          onClick={onBack}
          aria-label="Previous step"
          className="w-10 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-white flex items-center justify-center flex-shrink-0 transition-all border border-slate-600/60 shadow-xs cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Middle: Live Financial Value HUD */}
        <div className="flex-1 min-w-0 px-1 text-left flex items-center">
          <AnimatedPrice
            value={finalPrice}
            isMasked={false}
            isCritical={isCritical}
            className="text-2xl font-black text-emerald-400 tracking-tight leading-none"
          />
        </div>

        {/* Right: Primary Step Action */}
        <motion.button
          type="button"
          onClick={onNext}
          disabled={!canProceed}
          whileTap={canProceed ? { scale: 0.95 } : undefined}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex-shrink-0 cursor-pointer shadow-md ${
            canProceed
              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20 font-black'
              : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed shadow-none'
          }`}
        >
          <span>{nextLabel}</span>
          <ChevronRight className="w-4 h-4 stroke-[3]" />
        </motion.button>

      </div>
    </motion.div>
  );
};
