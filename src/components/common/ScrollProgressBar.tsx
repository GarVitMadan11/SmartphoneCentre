import React from 'react';
import { motion, useScroll, useSpring } from 'framer-motion';

interface ScrollProgressProps {
  color?: string;
  height?: number;
}

export const ScrollProgressBar: React.FC<ScrollProgressProps> = ({
  color = 'from-cobalt via-emerald-500 to-emerald-400',
  height = 3,
}) => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 280,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      style={{ scaleX }}
      className={`fixed top-0 left-0 right-0 z-50 origin-left bg-gradient-to-r ${color} pointer-events-none`}
      style-height={`${height}px`}
    >
      <div style={{ height: `${height}px` }} className="w-full relative">
        {/* Subtle glowing tip on the right edge */}
        <div className="absolute right-0 top-0 bottom-0 w-8 bg-white/70 blur-[2px]" />
      </div>
    </motion.div>
  );
};

export const FadeInOnScroll: React.FC<{
  children: React.ReactNode;
  delay?: number;
  yOffset?: number;
  className?: string;
}> = ({ children, delay = 0, yOffset = 24, className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: yOffset }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{
        type: 'spring',
        stiffness: 240,
        damping: 26,
        delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

