import React, { useState, useEffect } from 'react';
import { ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { getPriceLockCountdown, PriceLockCountdown } from '../../utils/savedQuotes';

export interface PriceLockCountdownBadgeProps {
  savedAt: string;
  isPriceLocked?: boolean;
  compact?: boolean;
  className?: string;
}

export const PriceLockCountdownBadge: React.FC<PriceLockCountdownBadgeProps> = ({
  savedAt,
  compact = false,
  className = '',
}) => {
  const [countdown, setCountdown] = useState<PriceLockCountdown>(() =>
    getPriceLockCountdown(savedAt)
  );

  useEffect(() => {
    // Initial sync
    setCountdown(getPriceLockCountdown(savedAt));

    const interval = setInterval(() => {
      setCountdown(getPriceLockCountdown(savedAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [savedAt]);

  if (!countdown.isLocked) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-medium font-sans ${className}`}
      >
        <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
        <span>Price Lock Expired</span>
      </span>
    );
  }

  // Under 24 hours: subtle urgency styling
  if (countdown.isExpiringSoon) {
    if (compact) {
      return (
        <span
          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 border border-amber-300 text-amber-900 text-[10px] font-semibold font-sans ${className}`}
          title={`Price lock expires at ${new Date(countdown.expiresAt).toLocaleTimeString()}`}
        >
          <Clock className="w-3 h-3 text-amber-600 shrink-0" />
          <span className="font-mono">{countdown.formattedString} left</span>
        </span>
      );
    }

    return (
      <div
        className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-50/90 border border-amber-300/80 text-amber-950 text-xs font-medium font-sans ${className}`}
      >
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
          <span className="font-semibold text-amber-900">Lock Expiring Soon</span>
        </div>
        <span className="text-amber-300">|</span>
        <span className="font-mono font-bold text-amber-950 tracking-tight">
          {countdown.formattedString} remaining
        </span>
      </div>
    );
  }

  // Active 7-Day Guarantee (> 24 hours)
  if (compact) {
    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-900 text-[10px] font-bold font-sans ${className}`}
        title={`Guaranteed rate until ${new Date(countdown.expiresAt).toLocaleDateString()}`}
      >
        <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
        <span className="font-mono">{countdown.formattedString}</span>
      </span>
    );
  }

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-emerald-50/90 border border-emerald-300 text-emerald-950 text-xs font-medium font-sans ${className}`}
    >
      <div className="flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
        <span className="font-semibold text-emerald-900">7-Day Rate Guaranteed</span>
      </div>
      <span className="text-emerald-300">|</span>
      <span className="font-mono font-bold text-emerald-900 tracking-tight">
        {countdown.formattedString} remaining
      </span>
    </div>
  );
};
