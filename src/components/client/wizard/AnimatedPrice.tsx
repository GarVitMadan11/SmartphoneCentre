import React, { useEffect, useState, useRef } from 'react';

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
  isCritical = false
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (isMasked || isCritical) {
      setDisplayValue(value);
      prevValueRef.current = value;
      return;
    }

    const startValue = prevValueRef.current;
    const endValue = value;
    prevValueRef.current = value;

    if (startValue === endValue) return;

    const startTime = performance.now();
    const duration = 380; // ms

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutCubic curve for smooth decelerating rolling counter
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startValue + (endValue - startValue) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        setDisplayValue(endValue);
      }
    };

    animRef.current = requestAnimationFrame(step);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [value, isMasked, isCritical]);

  if (isMasked) {
    return <span className={className}>₹ XX,XXX</span>;
  }

  if (isCritical) {
    return <span className={className}>₹ 0 (Locked)</span>;
  }

  return (
    <span className={className}>
      ₹{displayValue.toLocaleString('en-IN')}
    </span>
  );
};

export default AnimatedPrice;
