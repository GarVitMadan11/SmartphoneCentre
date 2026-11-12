import React, { useState, useEffect } from 'react';
import { ShoppingBag, X } from 'lucide-react';

interface SaleNotification {
  city: string;
  model: string;
  payout: string;
  timeAgo: string;
}

const RECENT_SALES: SaleNotification[] = [
  { city: 'Delhi', model: 'iPhone 15 Pro (256 GB)', payout: '₹64,230', timeAgo: '2m ago' },
  { city: 'Gurgaon', model: 'Galaxy S24 Ultra (256 GB)', payout: '₹58,900', timeAgo: '6m ago' },
  { city: 'Noida', model: 'iPhone 14 (128 GB)', payout: '₹34,500', timeAgo: '11m ago' },
  { city: 'Bengaluru', model: 'OnePlus 12 (256 GB)', payout: '₹38,200', timeAgo: '15m ago' },
  { city: 'Delhi', model: 'iPhone 13 (128 GB)', payout: '₹28,600', timeAgo: '19m ago' },
  { city: 'Faridabad', model: 'Galaxy Z Fold 5', payout: '₹62,000', timeAgo: '24m ago' },
];

export const RecentSalesToast: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [currentSale, setCurrentSale] = useState<SaleNotification>(RECENT_SALES[0]);

  useEffect(() => {
    if (dismissed) return;

    // Initial delay before first toast
    const initialTimer = setTimeout(() => {
      setVisible(true);
    }, 4000);

    // Rotate toast every 18 seconds
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        const nextIndex = Math.floor(Math.random() * RECENT_SALES.length);
        setCurrentSale(RECENT_SALES[nextIndex]);
        setVisible(true);
      }, 1000);
    }, 18000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [dismissed]);

  if (dismissed || !visible) return null;

  return (
    <div className="fixed bottom-20 left-4 z-40 max-w-xs sm:max-w-sm animate-slideUp select-none pointer-events-auto">
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-3 shadow-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-600 flex-shrink-0">
          <ShoppingBag className="w-5 h-5 stroke-[2.2]" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 leading-none mb-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0"></span>
            <span className="text-[11px] font-bold text-slate-800 truncate">
              Sold in {currentSale.city}
            </span>
            <span className="text-[10px] text-slate-400 font-medium ml-auto flex-shrink-0">
              {currentSale.timeAgo}
            </span>
          </div>
          <p className="text-[11px] font-semibold text-slate-600 truncate leading-tight">
            {currentSale.model}
          </p>
          <p className="text-xs font-black text-emerald-700 leading-tight mt-0.5">
            Paid: {currentSale.payout} <span className="text-[10px] text-slate-400 font-normal">at doorstep</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-xs self-start"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

