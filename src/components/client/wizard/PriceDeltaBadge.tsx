import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PriceDeltaBadgeProps {
  currentPrice: number;
  className?: string;
  disabled?: boolean;
}

export const PriceDeltaBadge: React.FC<PriceDeltaBadgeProps> = ({
  currentPrice,
  className = '',
  disabled = false
}) => {
  const [deltaInfo, setDeltaInfo] = useState<{ amount: number; id: number } | null>(null);
  const prevPriceRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Skip delta on the very first mount
    if (prevPriceRef.current === null) {
      prevPriceRef.current = currentPrice;
      return;
    }

    const previous = prevPriceRef.current;
    prevPriceRef.current = currentPrice;

    if (disabled || previous === currentPrice || currentPrice <= 0 || previous <= 0) {
      return;
    }

    const diff = currentPrice - previous;
    // Don't show microscopic differences (< ₹50)
    if (Math.abs(diff) < 50) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    setDeltaInfo({
      amount: diff,
      id: Date.now()
    });

    timerRef.current = setTimeout(() => {
      setDeltaInfo(null);
    }, 2400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [currentPrice, disabled]);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <AnimatePresence mode="wait">
        {deltaInfo && (
          <motion.div
            key={deltaInfo.id}
            initial={{ opacity: 0, y: 5, scale: 0.85 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.85 }}
            transition={{ type: 'spring', stiffness: 450, damping: 25 }}
            className={`flex items-center gap-0.5 text-[10px] font-mono font-black px-2 py-0.5 rounded-full shadow-xs tracking-tight select-none border ${
              deltaInfo.amount > 0
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-2 ring-emerald-500/20'
                : 'bg-rose-50 text-rose-800 border-rose-300 ring-2 ring-rose-500/20'
            }`}
          >
            <span>{deltaInfo.amount > 0 ? '↑ +' : '↓ -'}₹{Math.abs(deltaInfo.amount).toLocaleString('en-IN')}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PriceDeltaBadge;
