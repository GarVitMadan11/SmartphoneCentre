import React, { useEffect } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedPriceProps {
  value: number;
  className?: string;
  isMasked?: boolean;
  isCritical?: boolean;
}

export const AnimatedPrice: React.FC<AnimatedPriceProps> = ({
  value,
  className = '',
  isMasked = false,
  isCritical = false,
}) => {
  const safeVal = Math.max(0, Math.round(value || 0));

  // High performance spring for smooth physics-based counting transition
  const spring = useSpring(safeVal, {
    stiffness: 75,
    damping: 18,
    mass: 0.6,
  });

  useEffect(() => {
    spring.set(safeVal);
  }, [safeVal, spring]);

  const display = useTransform(spring, (current) => {
    return Math.max(0, Math.round(current)).toLocaleString('en-IN');
  });

  if (isMasked) {
    return (
      <span className={`tabular-nums font-bold inline-flex items-baseline ${className}`}>
        <span className="text-[0.9em] mr-0.5 select-none font-sans">₹</span>XX,XXX
      </span>
    );
  }

  if (isCritical) {
    return (
      <span className={`tabular-nums font-bold inline-flex items-baseline text-rose-600 ${className}`}>
        <span className="text-[0.9em] mr-0.5 select-none font-sans">₹</span>0 (Locked)
      </span>
    );
  }

  return (
    <span className={`tabular-nums font-bold inline-flex items-baseline leading-none ${className}`}>
      <span className="text-[0.88em] mr-0.5 select-none font-sans opacity-95">₹</span>
      <motion.span className="inline-block tracking-tight">
        {display}
      </motion.span>
    </span>
  );
};
