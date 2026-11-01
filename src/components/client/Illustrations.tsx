import React from 'react';

// ==================== PRECISION SMARTPHONE ILLUSTRATIONS (CASHIFY SPOTLIGHT ARCHITECTURE) ====================

// 1. Powers On (Pristine Boot with Emerald Glow)
export const PowersOnIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_powerOnGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <rect x="18" y="7" width="28" height="50" rx="5" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <rect x="21" y="10" width="22" height="44" rx="3" fill="url(#rpx_powerOnGrad)" />
    <rect x="28" y="10" width="8" height="2.2" rx="1.1" fill="#0F172A" />
    <path d="M34 19L26 31H33L31 45L39 33H33L35 19Z" fill="#10B981" stroke="#059669" strokeWidth="1.5" strokeLinejoin="round" />
    <rect x="27" y="50" width="10" height="1.2" rx="0.6" fill="#94A3B8" />
  </svg>
);

// 2. Dead / Fails to Boot
export const DeadPowerIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="7" width="28" height="50" rx="5" stroke="#64748B" strokeWidth="2" fill="#F8FAFC" />
    <rect x="28" y="10" width="8" height="2.2" rx="1.1" fill="#94A3B8" />
    <rect x="25" y="27" width="14" height="8" rx="2" stroke="#EF4444" strokeWidth="1.6" fill="#FFFFFF" />
    <rect x="39" y="29.5" width="2" height="3" rx="1" fill="#EF4444" />
    <line x1="14" y1="52" x2="50" y2="12" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" opacity="0.9" />
  </svg>
);

// 3. Flawless Display
export const FlawlessDisplayIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_flawlessGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
        <stop offset="50%" stopColor="#06B6D4" stopOpacity="0.1" />
        <stop offset="100%" stopColor="#F8FAFC" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <rect x="18" y="7" width="28" height="50" rx="5" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <rect x="21" y="10" width="22" height="44" rx="3" fill="url(#rpx_flawlessGrad)" />
    <rect x="28" y="10" width="8" height="2.2" rx="1.1" fill="#0F172A" />
    <path d="M37 18L38.5 21L41.5 22.5L38.5 24L37 27L35.5 24L32.5 22.5L35.5 21Z" fill="#10B981" />
    <circle cx="26" cy="38" r="1.5" fill="#34D399" />
    <rect x="27" y="50" width="10" height="1.2" rx="0.6" fill="#94A3B8" />
  </svg>
);

// 4b. Minor Scratched Screen (1-2 Hairlines)
export const MinorScratchedScreenIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="7" width="28" height="50" rx="5" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <rect x="21" y="10" width="22" height="44" rx="3" fill="#F8FAFC" />
    <rect x="28" y="10" width="8" height="2.2" rx="1.1" fill="#0F172A" />
    <line x1="25" y1="23" x2="36" y2="28" stroke="#0D9488" strokeWidth="1.3" strokeLinecap="round" />
    <line x1="27" y1="38" x2="37" y2="35" stroke="#0D9488" strokeWidth="1.1" strokeLinecap="round" />
    <circle cx="30" cy="25" r="1.2" fill="#14B8A6" />
    <rect x="27" y="50" width="10" height="1.2" rx="0.6" fill="#94A3B8" />
  </svg>
);

// 5. Scratched Screen (Multiple Deep Scratches)
export const ScratchedScreenIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="7" width="28" height="50" rx="5" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <rect x="21" y="10" width="22" height="44" rx="3" fill="#F8FAFC" />
    <rect x="28" y="10" width="8" height="2.2" rx="1.1" fill="#0F172A" />
    <line x1="24" y1="19" x2="38" y2="26" stroke="#D97706" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="25" y1="33" x2="39" y2="30" stroke="#D97706" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="23" y1="41" x2="36" y2="46" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="33" y1="17" x2="29" y2="30" stroke="#D97706" strokeWidth="1" strokeLinecap="round" />
    <rect x="27" y="50" width="10" height="1.2" rx="0.6" fill="#94A3B8" />
  </svg>
);

// 4. Cracked Screen (Spiderweb Shatter)
export const CrackedScreenIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="7" width="28" height="50" rx="5" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <rect x="21" y="10" width="22" height="44" rx="3" fill="#F8FAFC" />
    <rect x="28" y="10" width="8" height="2.2" rx="1.1" fill="#0F172A" />
    <path d="M30 26L23 18L21 20" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M30 26L38 17L42 14" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M30 26L36 36L30 44L33 54" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M30 26L41 31L43 38" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M30 26L21 34L22 42" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="30" cy="26" r="2.2" fill="#EF4444" />
    <rect x="27" y="50" width="10" height="1.2" rx="0.6" fill="#94A3B8" />
  </svg>
);

// 6. Screen Burn / Lines / Dead Pixels (OLED Laser Defect)
export const ScreenBurnLinesIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <clipPath id="rpx_screen_clip">
      <rect x="21" y="10" width="22" height="44" rx="3" />
    </clipPath>
    <rect x="18" y="7" width="28" height="50" rx="5" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <g clipPath="url(#rpx_screen_clip)">
      <rect x="21" y="10" width="22" height="44" fill="#F8FAFC" />
      <line x1="27" y1="8" x2="27" y2="56" stroke="#EF4444" strokeWidth="1.6" />
      <line x1="29.5" y1="8" x2="29.5" y2="56" stroke="#10B981" strokeWidth="1.3" />
      <circle cx="27" cy="34" r="3" fill="#0F172A" />
      <circle cx="37" cy="22" r="2.2" fill="#0F172A" />
      <circle cx="35" cy="44" r="2.4" fill="#0F172A" />
    </g>
    <rect x="28" y="10" width="8" height="2.2" rx="1.1" fill="#0F172A" />
    <rect x="27" y="50" width="10" height="1.2" rx="0.6" fill="#94A3B8" />
  </svg>
);

// 7. Touch Unresponsive (Fallback)
export const TouchUnresponsiveIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="7" width="28" height="50" rx="5" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <rect x="21" y="10" width="22" height="44" rx="3" fill="#F8FAFC" />
    <circle cx="32" cy="32" r="8" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 2" />
    <path d="M32 28V33" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="32" cy="36" r="1" fill="#EF4444" />
  </svg>
);

// 8. True Tone Faulty (Missing Toggle / Calibration Alert)
export const TrueToneIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="7" width="28" height="50" rx="5" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <rect x="21" y="10" width="22" height="44" rx="3" fill="#F8FAFC" />
    <rect x="28" y="10" width="8" height="2.2" rx="1.1" fill="#0F172A" />
    <path d="M32 24A8 8 0 0 0 32 40V24Z" fill="#F59E0B" />
    <path d="M32 24A8 8 0 0 1 32 40V24Z" fill="#94A3B8" />
    <circle cx="32" cy="32" r="8" stroke="#0F172A" strokeWidth="1.5" fill="none" />
    <line x1="24" y1="40" x2="40" y2="24" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 9. Flawless Frame (Titanium Chamfer & Starbursts)
export const FlawlessFrameIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="7" width="28" height="50" rx="5" stroke="#0F172A" strokeWidth="2.5" fill="#FFFFFF" />
    <rect x="20" y="9" width="24" height="46" rx="3.5" stroke="#94A3B8" strokeWidth="1" fill="#F8FAFC" />
    <path d="M14 16L15.5 19L18.5 20.5L15.5 22L14 25L12.5 22L9.5 20.5L12.5 19Z" fill="#10B981" />
    <path d="M50 44L51.5 47L54.5 48.5L51.5 50L50 53L48.5 50L45.5 48.5L48.5 47Z" fill="#10B981" />
  </svg>
);

// Healthy Connectivity & Battery (>85% Battery + Cellular & Wi-Fi)
export const HealthyConnectivityIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_connHealthyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <rect x="18" y="7" width="28" height="50" rx="5" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <rect x="21" y="10" width="22" height="44" rx="3" fill="url(#rpx_connHealthyGrad)" />
    <rect x="28" y="10" width="8" height="2.2" rx="1.1" fill="#0F172A" />
    <rect x="25" y="18" width="12" height="7" rx="1.8" stroke="#0F172A" strokeWidth="1.2" fill="#FFFFFF" />
    <rect x="37" y="20" width="1.2" height="3" rx="0.6" fill="#0F172A" />
    <rect x="26.2" y="19.2" width="7.6" height="4.6" rx="1" fill="#10B981" />
    <rect x="24" y="37" width="2.5" height="4" rx="0.6" fill="#10B981" />
    <rect x="28" y="34.5" width="2.5" height="6.5" rx="0.6" fill="#10B981" />
    <rect x="32" y="32" width="2.5" height="9" rx="0.6" fill="#10B981" />
    <rect x="36" y="29.5" width="2.5" height="11.5" rx="0.6" fill="#10B981" />
    <circle cx="40" cy="16" r="4.5" fill="#10B981" />
    <path d="M38.2 16L39.4 17.2L41.8 14.8" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="27" y="50" width="10" height="1.2" rx="0.6" fill="#94A3B8" />
  </svg>
);

// Healthy Hardware & Cameras
export const HealthyHardwareIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_hwHealthyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <rect x="18" y="7" width="28" height="50" rx="5" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <rect x="21" y="10" width="22" height="44" rx="3" fill="url(#rpx_hwHealthyGrad)" />
    <rect x="28" y="10" width="8" height="2.2" rx="1.1" fill="#0F172A" />
    <circle cx="32" cy="24" r="7" stroke="#0F172A" strokeWidth="1.5" fill="#FFFFFF" />
    <circle cx="32" cy="24" r="4.5" stroke="#0F172A" strokeWidth="1.2" fill="#F1F5F9" />
    <circle cx="32" cy="24" r="2.2" fill="#10B981" />
    <circle cx="33" cy="23" r="0.8" fill="#FFFFFF" />
    <circle cx="32" cy="38" r="5" stroke="#10B981" strokeWidth="1.2" strokeDasharray="2 1.5" fill="none" />
    <path d="M30 38L31.5 39.5L34 36.5" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="27" y="50" width="10" height="1.2" rx="0.6" fill="#94A3B8" />
  </svg>
);

// All Accessories Included (Original Box + Charger/Cable + Bill)
export const AllAccessoriesIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_accGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <path d="M30 11L46 18.5L30 26L14 18.5L30 11Z" stroke="#0F172A" strokeWidth="2" fill="url(#rpx_accGrad)" />
    <path d="M14 18.5V38L30 45.5V26" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <path d="M46 18.5V38L30 45.5" stroke="#0F172A" strokeWidth="2" fill="#F8FAFC" />
    <line x1="18" y1="26" x2="18" y2="33" stroke="#0F172A" strokeWidth="1.2" />
    <line x1="20.5" y1="27" x2="20.5" y2="34" stroke="#0F172A" strokeWidth="1.2" />
    <line x1="22.5" y1="28" x2="22.5" y2="35" stroke="#0F172A" strokeWidth="0.8" />
    <line x1="25" y1="29" x2="25" y2="36" stroke="#0F172A" strokeWidth="1.2" />
    <rect x="36" y="31" width="13" height="11" rx="2" stroke="#0F172A" strokeWidth="1.3" fill="#FFFFFF" />
    <line x1="39" y1="28" x2="39" y2="31" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="43" y1="28" x2="43" y2="31" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M42.5 42C42.5 45 46 47 49 45" stroke="#10B981" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="48" cy="15" r="4.5" fill="#10B981" />
    <path d="M46.2 15L47.4 16.2L49.8 13.8" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);



// 10. Dented Frame (Structural Dent with Stress Indicators)
export const DentedFrameIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 12C18 9.2 20.2 7 23 7H41C43.8 7 46 9.2 46 12V52C46 54.8 43.8 57 41 57H23C20.2 57 18 54.8 18 52V36C22 34 22 30 18 28V12Z" stroke="#EF4444" strokeWidth="2" fill="#FFFFFF" />
    <path d="M12 32H16" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <path d="M14 29L17 32L14 35" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 11. Scuffed Frame (Chipped Paint & Scuffs)
export const ScuffedFrameIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="7" width="28" height="50" rx="5" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <circle cx="16" cy="14" r="1.5" fill="#D97706" />
    <circle cx="19" cy="10" r="1.2" fill="#D97706" />
    <circle cx="16.5" cy="18" r="1.3" fill="#D97706" />
    <circle cx="47" cy="46" r="1.5" fill="#D97706" />
    <circle cx="45" cy="51" r="1.2" fill="#D97706" />
    <circle cx="48" cy="53" r="1.4" fill="#D97706" />
  </svg>
);

// 12. Air Pass / Waterproof Seal
export const AirPassIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="7" width="28" height="50" rx="5" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <path d="M32 20C32 20 25 28 25 33C25 36.8 28.1 40 32 40C35.9 40 39 36.8 39 33C39 28 32 20 32 20Z" fill="#0284C7" opacity="0.85" />
    <circle cx="46" cy="38" r="2" fill="#EF4444" />
    <circle cx="49" cy="34" r="1.5" fill="#EF4444" />
  </svg>
);

// 13. Side Buttons (PERFECTED UPRIGHT SIDE RAIL & SPOTLIGHT LOUPE)
export const SideButtonsIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_btn_spot" x1="28" y1="31" x2="48" y2="31" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
        <stop offset="40%" stopColor="#10B981" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <path d="M 28 28 L 48 20 L 48 42 L 28 34 Z" fill="url(#rpx_btn_spot)" />
    <line x1="12" y1="57" x2="34" y2="57" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
    <path d="M 18 57 V 14 C 18 10 20.7 7 24 7 C 27.3 7 30 10 30 14 V 57" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
    <line x1="18.5" y1="16" x2="29.5" y2="16" stroke="#94A3B8" strokeWidth="1.2" />
    <rect x="21.5" y="20" width="5" height="4" rx="1.5" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1" />
    <rect x="21" y="27" width="6" height="9" rx="2.5" fill="#10B981" stroke="#059669" strokeWidth="1.4" />
    <line x1="24" y1="29.5" x2="24" y2="33.5" stroke="#FFFFFF" strokeWidth="1" strokeLinecap="round" />
    <rect x="21.5" y="39" width="5" height="9" rx="2.5" fill="#F1F5F9" stroke="#0F172A" strokeWidth="1" />
    <circle cx="48" cy="31" r="10.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
    <path d="M 48 24.5 L 54.5 35.5 H 41.5 Z" fill="#10B981" stroke="#059669" strokeWidth="1" strokeLinejoin="round" />
    <line x1="48" y1="27.5" x2="48" y2="31.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="48" cy="33.8" r="0.8" fill="#FFFFFF" />
  </svg>
);

// 14. Screws Missing (Dedicated Horizontal Bottom Chassis & Pentalobe Screws)
export const ScrewsIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="26" width="48" height="16" rx="8" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
    <line x1="15" y1="26" x2="15" y2="42" stroke="#94A3B8" strokeWidth="1.2" />
    <line x1="49" y1="26" x2="49" y2="42" stroke="#94A3B8" strokeWidth="1.2" />
    <rect x="27" y="31" width="10" height="6" rx="2.5" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.2" />
    <circle cx="21" cy="34" r="2.4" stroke="#EF4444" strokeWidth="1.4" fill="#FEE2E2" />
    <line x1="19.5" y1="34" x2="22.5" y2="34" stroke="#EF4444" strokeWidth="1" />
    <circle cx="43" cy="34" r="2.4" stroke="#EF4444" strokeWidth="1.4" fill="#FEE2E2" />
    <line x1="41.5" y1="34" x2="44.5" y2="34" stroke="#EF4444" strokeWidth="1" />
  </svg>
);

// 14b. Hinge Faulty
export const HingeFaultyIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="10" width="16" height="44" rx="3" stroke="#0F172A" strokeWidth="1.8" fill="#FFFFFF" />
    <rect x="34" y="10" width="16" height="44" rx="3" stroke="#0F172A" strokeWidth="1.8" fill="#FFFFFF" />
    <rect x="29" y="8" width="6" height="48" rx="2" fill="#EF4444" fillOpacity="0.2" stroke="#EF4444" strokeWidth="1.5" />
    <circle cx="32" cy="18" r="1.5" fill="#EF4444" />
    <circle cx="32" cy="32" r="1.5" fill="#EF4444" />
    <circle cx="32" cy="46" r="1.5" fill="#EF4444" />
  </svg>
);

// 14c. Inner Screen Crease Damage
export const InnerScreenCreaseIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="10" width="40" height="44" rx="4" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <line x1="32" y1="11" x2="32" y2="53" stroke="#EF4444" strokeWidth="2" strokeDasharray="3 2" />
    <circle cx="32" cy="22" r="3" fill="#F59E0B" fillOpacity="0.4" stroke="#F59E0B" strokeWidth="1" />
    <circle cx="32" cy="36" r="2.5" fill="#F59E0B" fillOpacity="0.4" stroke="#F59E0B" strokeWidth="1" />
  </svg>
);

// 15. Faulty Camera Lens (Rear Camera & Conical Spotlight)
export const FaultyLensIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_cam_spot" x1="22" y1="18" x2="48" y2="38" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.9" />
        <stop offset="45%" stopColor="#10B981" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <path d="M 23 15 L 52 30 L 42 46 L 20 21 Z" fill="url(#rpx_cam_spot)" />
    <rect x="12" y="8" width="28" height="48" rx="6" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
    <rect x="15" y="11" width="14" height="20" rx="4.5" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.5" />
    <circle cx="22" cy="17" r="3.5" fill="#10B981" stroke="#059669" strokeWidth="1.4" />
    <circle cx="22" cy="17" r="1.5" fill="#FFFFFF" />
    <circle cx="22" cy="25" r="3" fill="#334155" stroke="#0F172A" strokeWidth="1" />
    <circle cx="18" cy="21" r="1.2" fill="#FDE047" />
    <circle cx="48" cy="38" r="9.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
    <path d="M 48 32 L 54 42 H 42 Z" fill="#10B981" stroke="#059669" strokeWidth="1" strokeLinejoin="round" />
    <line x1="48" y1="35" x2="48" y2="38.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="48" cy="40.5" r="0.7" fill="#FFFFFF" />
  </svg>
);

// 16. Low Battery (<80% or Service Alert)

// 15a. Front Camera Not Working (Phone front outline, top selfie lens with emerald spotlight down to loupe)
export const FrontCameraIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_frontcam_spot" x1="32" y1="15" x2="45" y2="32" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.85" />
        <stop offset="45%" stopColor="#10B981" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <path d="M 31 15 L 53 23 L 38 41 L 33 15 Z" fill="url(#rpx_frontcam_spot)" />
    <rect x="16" y="8" width="32" height="48" rx="6" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
    <line x1="28" y1="12" x2="36" y2="12" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="32" cy="16" r="2" fill="#10B981" stroke="#059669" strokeWidth="1" />
    <circle cx="32" cy="16" r="0.8" fill="#FFFFFF" />
    <line x1="26" y1="52" x2="38" y2="52" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="45" cy="32" r="9.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
    <path d="M 45 26 L 51 36 H 39 Z" fill="#10B981" stroke="#059669" strokeWidth="1" strokeLinejoin="round" />
    <line x1="45" y1="29" x2="45" y2="32.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="45" cy="34.5" r="0.7" fill="#FFFFFF" />
  </svg>
);

// 15b. Back Camera Not Working (Phone back outline, dual lens bump with spotlight to loupe)
export const BackCameraIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_backcam_spot" x1="24" y1="18" x2="48" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.85" />
        <stop offset="45%" stopColor="#10B981" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <path d="M 25 15 L 53 28 L 43 44 L 21 21 Z" fill="url(#rpx_backcam_spot)" />
    <rect x="14" y="8" width="30" height="48" rx="6" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
    <rect x="17" y="11" width="13" height="20" rx="4.5" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.5" />
    <circle cx="23.5" cy="16.5" r="3.2" fill="#10B981" stroke="#059669" strokeWidth="1.3" />
    <circle cx="23.5" cy="16.5" r="1.3" fill="#FFFFFF" />
    <circle cx="23.5" cy="24.5" r="3" fill="#334155" stroke="#0F172A" strokeWidth="1" />
    <circle cx="48" cy="36" r="9.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
    <path d="M 48 30 L 54 40 H 42 Z" fill="#10B981" stroke="#059669" strokeWidth="1" strokeLinejoin="round" />
    <line x1="48" y1="33" x2="48" y2="36.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="48" cy="38.5" r="0.7" fill="#FFFFFF" />
  </svg>
);

// 15c. Camera Glass Broken (Cracked rear lens glass with spotlight to loupe)
export const CameraGlassIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_camglass_spot" x1="24" y1="18" x2="48" y2="36" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.85" />
        <stop offset="45%" stopColor="#10B981" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <path d="M 25 15 L 53 28 L 43 44 L 21 21 Z" fill="url(#rpx_camglass_spot)" />
    <rect x="14" y="8" width="30" height="48" rx="6" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
    <rect x="17" y="11" width="13" height="20" rx="4.5" fill="#F8FAFC" stroke="#0F172A" strokeWidth="1.5" />
    <circle cx="23.5" cy="16.5" r="3.2" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1.2" />
    <path d="M 21 14 L 24 17 L 22.5 19.5" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M 24 17 L 26 15" stroke="#EF4444" strokeWidth="1" strokeLinecap="round" />
    <circle cx="23.5" cy="24.5" r="3" fill="#334155" stroke="#0F172A" strokeWidth="1" />
    <circle cx="48" cy="36" r="9.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
    <path d="M 48 30 L 54 40 H 42 Z" fill="#10B981" stroke="#059669" strokeWidth="1" strokeLinejoin="round" />
    <line x1="48" y1="33" x2="48" y2="36.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="48" cy="38.5" r="0.7" fill="#FFFFFF" />
  </svg>
);

// 22a. Loudspeaker Faulty (Bottom chassis speaker grille oooo with spotlight up to loupe)
export const LoudspeakerIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_speaker_spot" x1="22" y1="46" x2="32" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.85" />
        <stop offset="45%" stopColor="#10B981" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <path d="M 16 46 L 22 24 L 42 24 L 28 46 Z" fill="url(#rpx_speaker_spot)" />
    <rect x="8" y="44" width="48" height="12" rx="6" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
    <circle cx="16" cy="50" r="1.4" fill="#10B981" stroke="#059669" strokeWidth="0.8" />
    <circle cx="20" cy="50" r="1.4" fill="#10B981" stroke="#059669" strokeWidth="0.8" />
    <circle cx="24" cy="50" r="1.4" fill="#10B981" stroke="#059669" strokeWidth="0.8" />
    <circle cx="28" cy="50" r="1.4" fill="#10B981" stroke="#059669" strokeWidth="0.8" />
    <rect x="33" y="48" width="10" height="4" rx="2" fill="#E2E8F0" stroke="#0F172A" strokeWidth="1" />
    <circle cx="32" cy="22" r="9.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
    <path d="M 32 16 L 38 26 H 26 Z" fill="#10B981" stroke="#059669" strokeWidth="1" strokeLinejoin="round" />
    <line x1="32" y1="19" x2="32" y2="22.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="32" cy="24.5" r="0.7" fill="#FFFFFF" />
  </svg>
);

// 22b. Microphone Not Working (Phone outline with studio capsule & spotlight into loupe)
export const MicrophoneIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_mic_spot" x1="28" y1="28" x2="48" y2="28" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.85" />
        <stop offset="45%" stopColor="#10B981" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <path d="M 28 25 L 48 18 L 48 38 L 28 31 Z" fill="url(#rpx_mic_spot)" />
    <rect x="14" y="8" width="30" height="48" rx="6" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
    <rect x="22" y="21" width="8" height="13" rx="4" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.6" />
    <path d="M 18.5 27 C 18.5 32 21 36.5 26 36.5 C 31 36.5 33.5 32 33.5 27" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    <line x1="26" y1="36.5" x2="26" y2="41" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" />
    <line x1="22" y1="41" x2="30" y2="41" stroke="#0F172A" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="48" cy="28" r="9.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
    <path d="M 48 22 L 54 32 H 42 Z" fill="#10B981" stroke="#059669" strokeWidth="1" strokeLinejoin="round" />
    <line x1="48" y1="25" x2="48" y2="28.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="48" cy="30.5" r="0.7" fill="#FFFFFF" />
  </svg>
);

// 22c. Audio Receiver (Earpiece) Not Working (Phone front with top earpiece speaker slit and vertical beam down to loupe)
export const AudioReceiverIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_receiver_spot" x1="32" y1="12" x2="32" y2="34" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.85" />
        <stop offset="45%" stopColor="#10B981" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <path d="M 27 12 L 22 34 L 42 34 L 37 12 Z" fill="url(#rpx_receiver_spot)" />
    <rect x="16" y="8" width="32" height="48" rx="6" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
    <rect x="26" y="11" width="12" height="3" rx="1.5" fill="#10B981" stroke="#059669" strokeWidth="1" />
    <line x1="26" y1="52" x2="38" y2="52" stroke="#CBD5E1" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="32" cy="34" r="9.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
    <path d="M 32 28 L 38 38 H 26 Z" fill="#10B981" stroke="#059669" strokeWidth="1" strokeLinejoin="round" />
    <line x1="32" y1="31" x2="32" y2="34.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="32" cy="36.5" r="0.7" fill="#FFFFFF" />
  </svg>
);

// 22d. Charging Port Not Working (Bottom chassis profile with USB-C / Lightning port and vertical spotlight up to loupe)
export const ChargingPortIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_charge_spot" x1="32" y1="46" x2="32" y2="24" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.85" />
        <stop offset="45%" stopColor="#10B981" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <path d="M 28 46 L 22 24 L 42 24 L 36 46 Z" fill="url(#rpx_charge_spot)" />
    <rect x="8" y="44" width="48" height="12" rx="6" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
    <rect x="25" y="47.5" width="14" height="5" rx="2.5" fill="#10B981" stroke="#059669" strokeWidth="1.2" />
    <rect x="28" y="49" width="8" height="2" rx="1" fill="#FFFFFF" />
    <circle cx="32" cy="22" r="9.5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
    <path d="M 32 16 L 38 26 H 26 Z" fill="#10B981" stroke="#059669" strokeWidth="1" strokeLinejoin="round" />
    <line x1="32" y1="19" x2="32" y2="22.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="32" cy="24.5" r="0.7" fill="#FFFFFF" />
  </svg>
);

// 22e. Vibrator Not Working (Phone with lateral vibration waves on both sides and alert loupe)
export const VibratorIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M 11 20 L 7 24 L 11 28 L 7 32 L 11 36 L 7 40 L 11 44" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <path d="M 53 20 L 57 24 L 53 28 L 57 32 L 53 36 L 57 40 L 53 44" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <rect x="18" y="10" width="28" height="44" rx="5" fill="#FFFFFF" stroke="#0F172A" strokeWidth="2" />
    <circle cx="32" cy="32" r="10" fill="#FFFFFF" stroke="#0F172A" strokeWidth="1.8" />
    <path d="M 32 25 L 38.5 36.5 H 25.5 Z" fill="#10B981" stroke="#059669" strokeWidth="1" strokeLinejoin="round" />
    <line x1="32" y1="28.5" x2="32" y2="32.5" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round" />
    <circle cx="32" cy="34.5" r="0.7" fill="#FFFFFF" />
  </svg>
);

export const LowBatteryIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="22" width="32" height="20" rx="4" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <rect x="46" y="28" width="3" height="8" rx="1.5" fill="#0F172A" />
    <rect x="18" y="26" width="6" height="12" rx="2" fill="#EF4444" />
    <circle cx="42" cy="18" r="6.5" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
    <path d="M40 16L44 20M44 16L40 20" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// 16a. Battery Health 80-85% (Amber Level Gauge)
export const Battery80to85Illustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="22" width="32" height="20" rx="4" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <rect x="46" y="28" width="3" height="8" rx="1.5" fill="#0F172A" />
    <rect x="18" y="26" width="6" height="12" rx="1.5" fill="#F59E0B" />
    <rect x="25" y="26" width="6" height="12" rx="1.5" fill="#F59E0B" />
    <rect x="32" y="26" width="6" height="12" rx="1.5" fill="#F59E0B" />
    <circle cx="44" cy="18" r="6.5" fill="#FFFFFF" stroke="#F59E0B" strokeWidth="1.5" />
    <text x="44" y="20.5" textAnchor="middle" fill="#F59E0B" fontSize="6.5" fontWeight="bold" fontFamily="sans-serif">85</text>
  </svg>
);

// 17. Battery Warning (Non-OEM / Service Alert)
export const BatteryWarningIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="22" width="32" height="20" rx="4" stroke="#F59E0B" strokeWidth="2" fill="#FFFFFF" />
    <rect x="46" y="28" width="3" height="8" rx="1.5" fill="#F59E0B" />
    <path d="M30 25L37 37H23Z" fill="#F59E0B" stroke="#D97706" strokeWidth="1" strokeLinejoin="round" />
    <line x1="30" y1="29" x2="30" y2="33" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="30" cy="35" r="0.75" fill="#FFFFFF" />
  </svg>
);

// 18. Faulty Biometrics (General Fallback)
export const FaultyBiometricsIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="16" width="28" height="32" rx="6" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <circle cx="32" cy="30" r="7" stroke="#EF4444" strokeWidth="1.8" />
    <line x1="26" y1="36" x2="38" y2="24" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 18a. Faulty Face ID (3D Mesh + Reticle + Loupe Alert)
export const FaultyFaceIdIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 22V16H22" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M42 16H48V22" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 42V48H22" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M48 42V48H42" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="26" cy="28" r="1.5" fill="#EF4444" />
    <circle cx="38" cy="28" r="1.5" fill="#EF4444" />
    <path d="M32 26V33" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M28 38C30 40 34 40 36 38" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
    <circle cx="47" cy="17" r="6" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
    <path d="M47 14.5V17.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="47" cy="20" r="0.75" fill="#EF4444" />
  </svg>
);

// 18b. Faulty Fingerprint / Touch ID
export const FaultyFingerprintIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M24 38C24 30 28 26 32 26C36 26 40 30 40 38" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
    <path d="M20 39C20 27 25 21 32 21C39 21 44 27 44 39" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <path d="M28 40C28 34 30 31 32 31C34 31 36 34 36 40" stroke="#0F172A" strokeWidth="1.8" strokeLinecap="round" opacity="0.9" />
    <circle cx="47" cy="17" r="6" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
    <line x1="45" y1="15" x2="49" y2="19" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round" />
    <line x1="49" y1="15" x2="45" y2="19" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// 19. Network Issue (Cellular Signal Bars with Red Slash)
export const NetworkIssueIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="42" width="4" height="8" rx="1" fill="#0F172A" />
    <rect x="26" y="35" width="4" height="15" rx="1" fill="#0F172A" />
    <rect x="34" y="28" width="4" height="22" rx="1" fill="#94A3B8" />
    <rect x="42" y="20" width="4" height="30" rx="1" fill="#CBD5E1" />
    <line x1="16" y1="46" x2="48" y2="18" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
);

// 20. Wireless Issue (Wi-Fi Arcs & Bluetooth Alert)
export const WirelessIssueIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 24C26 18 38 18 46 24" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    <path d="M23 30C28 26 36 26 41 30" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <path d="M28 36C30 34 34 34 36 36" stroke="#0F172A" strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="42" r="2.5" fill="#0F172A" />
    <circle cx="46" cy="18" r="6" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
    <path d="M46 15.5V18.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="46" cy="21" r="0.75" fill="#EF4444" />
  </svg>
);

// 21. Part Mismatch
export const PartMismatchIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="18" width="28" height="28" rx="4" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <path d="M24 24H40V40H24V24Z" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 2" />
    <path d="M32 27V33" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="36" r="1" fill="#EF4444" />
  </svg>
);

// 22. Audio Faulty (Speaker Horn + Sound Waves Slashed)
export const AudioFaultyIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 26H24L32 18V46L24 38H18V26Z" stroke="#0F172A" strokeWidth="2" fill="#0F172A" />
    <path d="M38 24L48 34" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M48 24L38 34" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" />
  </svg>
);

// 23. Auto Restart (Loop Reboot Arrow)
export const AutoRestartIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 16C40.8 16 48 23.2 48 32C48 40.8 40.8 48 32 48C23.2 48 16 40.8 16 32C16 27.5 17.8 23.4 20.7 20.4" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M16 20H22V26" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 24. Missing Box
export const MissingBoxIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 12L50 20L32 28L14 20L32 12Z" stroke="#64748B" strokeWidth="1.6" strokeDasharray="3 2" />
    <path d="M14 20V42L32 50V28" stroke="#64748B" strokeWidth="1.6" strokeDasharray="3 2" />
    <path d="M50 20V42L32 50" stroke="#64748B" strokeWidth="1.6" strokeDasharray="3 2" />
    <circle cx="48" cy="18" r="6" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
    <path d="M46 16L50 20M50 16L46 20" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// 25. Missing Charger
export const MissingChargerIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="24" width="20" height="26" rx="3" stroke="#64748B" strokeWidth="1.6" strokeDasharray="3 2" />
    <line x1="24" y1="16" x2="24" y2="24" stroke="#64748B" strokeWidth="1.6" strokeDasharray="2 2" />
    <line x1="32" y1="16" x2="32" y2="24" stroke="#64748B" strokeWidth="1.6" strokeDasharray="2 2" />
    <circle cx="48" cy="20" r="6" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
    <path d="M46 18L50 22M50 18L46 22" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// 26. Missing Docs / Bill
export const MissingDocsIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="10" width="26" height="38" rx="2" stroke="#64748B" strokeWidth="1.6" strokeDasharray="3 2" fill="#FFFFFF" />
    <line x1="21" y1="18" x2="37" y2="18" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="21" y1="24" x2="33" y2="24" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="21" y1="30" x2="35" y2="30" stroke="#94A3B8" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="48" cy="20" r="6" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
    <path d="M46 18L50 22M50 18L46 22" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// 27. Missing S-Pen
export const MissingSpenIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g transform="rotate(45 32 32)">
      <rect x="29" y="14" width="6" height="30" rx="2" stroke="#64748B" strokeWidth="1.5" strokeDasharray="3 2" fill="#FFFFFF" />
      <path d="M29 44L32 50L35 44Z" stroke="#64748B" strokeWidth="1.5" fill="none" strokeDasharray="2 1" />
      <rect x="30" y="10" width="4" height="4" rx="1" stroke="#64748B" strokeWidth="1.2" />
    </g>
    <circle cx="48" cy="20" r="6" fill="#FFFFFF" stroke="#EF4444" strokeWidth="1.5" />
    <path d="M46 18L50 22M50 18L46 22" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// ==================== SMARTWATCH SPECIFIC ILLUSTRATIONS ====================

export const WatchPowersOnIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stc_watch_powerOnGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <rect x="25" y="2" width="14" height="11" rx="2" fill="#52525B" opacity="0.6" />
    <rect x="25" y="51" width="14" height="11" rx="2" fill="#52525B" opacity="0.6" />
    <rect x="17" y="11" width="30" height="42" rx="10" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="47" y="22" width="3.5" height="9" rx="1" fill="#E4E4E7" stroke="#A1A1AA" strokeWidth="0.8" />
    <rect x="47" y="35" width="2.5" height="7" rx="1" fill="#71717A" />
    <rect x="20" y="14" width="24" height="36" rx="7" fill="url(#stc_watch_powerOnGrad)" />
    <path d="M34 21L27 32H33L31 43L39 33H33L34 21Z" fill="#34D399" stroke="#10B981" strokeWidth="1.2" strokeLinejoin="round" />
  </svg>
);

export const WatchDeadPowerIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="2" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="25" y="51" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="17" y="11" width="30" height="42" rx="10" stroke="#71717A" strokeWidth="2" fill="#18181B" />
    <rect x="47" y="22" width="3.5" height="9" rx="1" fill="#71717A" />
    <rect x="20" y="14" width="24" height="36" rx="7" fill="#09090B" />
    <rect x="26" y="27" width="12" height="6" rx="1" stroke="#EF4444" strokeWidth="1.5" />
    <line x1="39" y1="29" x2="39" y2="31" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M32 36V40" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="32" cy="43" r="1.2" fill="#EF4444" />
    <line x1="14" y1="50" x2="50" y2="14" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
  </svg>
);

export const WatchFlawlessDisplayIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stc_watch_flawlessGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <rect x="25" y="2" width="14" height="11" rx="2" fill="#52525B" opacity="0.6" />
    <rect x="25" y="51" width="14" height="11" rx="2" fill="#52525B" opacity="0.6" />
    <rect x="17" y="11" width="30" height="42" rx="10" stroke="#F4F4F5" strokeWidth="2" fill="#18181B" />
    <rect x="47" y="22" width="3.5" height="9" rx="1" fill="#E4E4E7" stroke="#A1A1AA" strokeWidth="0.8" />
    <rect x="20" y="14" width="24" height="36" rx="7" fill="url(#stc_watch_flawlessGrad)" />
    <path d="M34 20L36 22L38 20L36 18L34 20Z" fill="#FBBF24" />
    <path d="M25 36L26 37L27 36L26 35L25 36Z" fill="#FBBF24" />
  </svg>
);

export const WatchCrackedScreenIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="2" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="25" y="51" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="17" y="11" width="30" height="42" rx="10" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="47" y="22" width="3.5" height="9" rx="1" fill="#71717A" />
    <rect x="20" y="14" width="24" height="36" rx="7" fill="#121215" />
    <path d="M22 22L29 28L31 22L38 30L41 27" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M29 28L26 38L33 42L30 46" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const WatchScratchedScreenIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="2" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="25" y="51" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="17" y="11" width="30" height="42" rx="10" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="47" y="22" width="3.5" height="9" rx="1" fill="#71717A" />
    <rect x="20" y="14" width="24" height="36" rx="7" fill="#121215" />
    <path d="M24 20C28 22 30 19 36 22" stroke="#F4F4F5" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M23 32C28 30 30 36 38 33" stroke="#F4F4F5" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

export const WatchScreenBurnIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="2" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="25" y="51" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="17" y="11" width="30" height="42" rx="10" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="47" y="22" width="3.5" height="9" rx="1" fill="#71717A" />
    <rect x="20" y="14" width="24" height="36" rx="7" fill="#121215" />
    <line x1="26" y1="14" x2="26" y2="50" stroke="#10B981" strokeWidth="1.5" opacity="0.8" />
    <line x1="32" y1="14" x2="32" y2="50" stroke="#EC4899" strokeWidth="1.5" opacity="0.8" />
    <line x1="38" y1="14" x2="38" y2="50" stroke="#06B6D4" strokeWidth="1" opacity="0.6" />
  </svg>
);

export const WatchTouchUnresponsiveIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="2" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="25" y="51" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="17" y="11" width="30" height="42" rx="10" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="47" y="22" width="3.5" height="9" rx="1" fill="#71717A" />
    <rect x="20" y="14" width="24" height="36" rx="7" fill="#121215" />
    <circle cx="32" cy="32" r="7" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
    <path d="M32 29V33" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="32" cy="35.5" r="1" fill="#EF4444" />
  </svg>
);

export const WatchFlawlessFrameIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="2" width="14" height="11" rx="2" fill="#10B981" fillOpacity="0.4" stroke="#10B981" strokeWidth="1" />
    <rect x="25" y="51" width="14" height="11" rx="2" fill="#10B981" fillOpacity="0.4" stroke="#10B981" strokeWidth="1" />
    <rect x="17" y="11" width="30" height="42" rx="10" stroke="#10B981" strokeWidth="2" fill="#18181B" />
    <rect x="47" y="22" width="3.5" height="9" rx="1" fill="#34D399" stroke="#10B981" strokeWidth="0.8" />
    <rect x="20" y="14" width="24" height="36" rx="7" fill="#09090B" />
    <circle cx="21" cy="15" r="1.5" fill="#34D399" />
    <circle cx="43" cy="49" r="1.5" fill="#34D399" />
  </svg>
);

export const WatchHealthyConnectivityIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="6" width="14" height="6" rx="2" fill="#94A3B8" />
    <rect x="25" y="52" width="14" height="6" rx="2" fill="#94A3B8" />
    <rect x="18" y="12" width="28" height="40" rx="8" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <rect x="21" y="15" width="22" height="34" rx="5" fill="#ECFDF5" />
    <rect x="46" y="24" width="2" height="8" rx="1" fill="#0F172A" />
    <rect x="25" y="22" width="12" height="7" rx="1.5" stroke="#0F172A" strokeWidth="1" fill="#FFFFFF" />
    <rect x="37" y="24" width="1" height="3" rx="0.5" fill="#0F172A" />
    <rect x="26" y="23" width="7" height="5" rx="0.75" fill="#10B981" />
    <rect x="26" y="37" width="2" height="3" rx="0.5" fill="#10B981" />
    <rect x="29.5" y="35" width="2" height="5" rx="0.5" fill="#10B981" />
    <rect x="33" y="33" width="2" height="7" rx="0.5" fill="#10B981" />
    <rect x="36.5" y="31" width="2" height="9" rx="0.5" fill="#10B981" />
  </svg>
);

export const WatchAllAccessoriesIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M28 12L46 18.5L28 25L10 18.5L28 12Z" stroke="#0F172A" strokeWidth="2" fill="#ECFDF5" />
    <path d="M10 18.5V37L28 43.5V25" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <path d="M46 18.5V37L28 43.5" stroke="#0F172A" strokeWidth="2" fill="#F8FAFC" />
    <circle cx="43" cy="36" r="6" stroke="#0F172A" strokeWidth="1.3" fill="#FFFFFF" />
    <path d="M43 42C43 45 46 47 49 46" stroke="#10B981" strokeWidth="1.3" strokeLinecap="round" />
    <circle cx="48" cy="15" r="4.5" fill="#10B981" />
    <path d="M46.2 15L47.4 16.2L49.8 13.8" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);



export const WatchDentedFrameIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="2" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="25" y="51" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="17" y="11" width="30" height="42" rx="10" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="47" y="22" width="3.5" height="9" rx="1" fill="#71717A" />
    <rect x="20" y="14" width="24" height="36" rx="7" fill="#121215" />
    <path d="M17 22C15.5 24 15.5 28 17 30" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="14" cy="26" r="2" fill="#EF4444" />
  </svg>
);

export const WatchDigitalCrownIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="2" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="25" y="51" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="17" y="11" width="30" height="42" rx="10" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="47" y="20" width="4.5" height="11" rx="1" fill="#EF4444" stroke="#DC2626" strokeWidth="1" />
    <rect x="47" y="35" width="3" height="8" rx="1" fill="#EF4444" />
    <rect x="20" y="14" width="24" height="36" rx="7" fill="#121215" />
    <circle cx="49" cy="25.5" r="5" stroke="#EF4444" strokeWidth="1" strokeDasharray="2 2" fill="none" />
  </svg>
);

export const WatchWaterSealIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="2" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="25" y="51" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="17" y="11" width="30" height="42" rx="10" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="47" y="22" width="3.5" height="9" rx="1" fill="#71717A" />
    <rect x="20" y="14" width="24" height="36" rx="7" fill="#0C1A2E" />
    <path d="M32 22C32 22 26 29 26 33C26 36.3 28.7 39 32 39C35.3 39 38 36.3 38 33C38 29 32 22 32 22Z" fill="#3B82F6" opacity="0.8" />
    <path d="M32 40V43" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="32" cy="45.5" r="1" fill="#EF4444" />
  </svg>
);

export const WatchScuffedStrapIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="2" width="14" height="11" rx="2" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 2" fill="#EF4444" fillOpacity="0.1" />
    <rect x="25" y="51" width="14" height="11" rx="2" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 2" fill="#EF4444" fillOpacity="0.1" />
    <rect x="17" y="11" width="30" height="42" rx="10" stroke="#71717A" strokeWidth="2" fill="#18181B" />
    <rect x="47" y="22" width="3.5" height="9" rx="1" fill="#71717A" />
    <rect x="20" y="14" width="24" height="36" rx="7" fill="#121215" />
    <path d="M32 27L28 35H36L32 27Z" fill="#EF4444" opacity="0.8" />
  </svg>
);

export const WatchHeartSensorIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="2" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="25" y="51" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="17" y="11" width="30" height="42" rx="10" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="47" y="22" width="3.5" height="9" rx="1" fill="#71717A" />
    <rect x="20" y="14" width="24" height="36" rx="7" fill="#1A0C16" />
    <path d="M22 32H26L28 25L31 39L34 28L36 34L38 32H42" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const WatchLowBatteryIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="25" y="2" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="25" y="51" width="14" height="11" rx="2" fill="#3F3F46" opacity="0.5" />
    <rect x="17" y="11" width="30" height="42" rx="10" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="47" y="22" width="3.5" height="9" rx="1" fill="#71717A" />
    <rect x="20" y="14" width="24" height="36" rx="7" fill="#121215" />
    <rect x="25" y="29" width="14" height="7" rx="1" stroke="#F59E0B" strokeWidth="1.2" />
    <line x1="40" y1="31.5" x2="40" y2="33.5" stroke="#F59E0B" strokeWidth="1.2" />
    <rect x="26.5" y="30.5" width="3" height="4" fill="#EF4444" />
  </svg>
);

export const WatchChargingPuckIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="32" cy="32" r="22" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 2" fill="#EF4444" fillOpacity="0.05" />
    <circle cx="32" cy="32" r="14" fill="#3F3F46" opacity="0.3" />
    <rect x="20" y="16" width="24" height="32" rx="8" stroke="#A1A1AA" strokeWidth="1.8" fill="#18181B" />
    <rect x="23" y="19" width="18" height="26" rx="5" fill="#09090B" />
    <path d="M44 32C44 29.8 45.8 28 48 28C50.2 28 52 29.8 52 32C52 33.5 51.2 34.8 50 35.5V38" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="50" cy="40.5" r="1.2" fill="#EF4444" />
  </svg>
);


// ==================== TABLET SPECIFIC ILLUSTRATIONS ====================

export const TabletPowersOnIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stc_tab_powerOnGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="url(#stc_tab_powerOnGrad)" />
    <path d="M34 18L25 31H32L30 48L39 35H32L34 18Z" fill="#34D399" stroke="#10B981" strokeWidth="1.5" strokeLinejoin="round" />
  </svg>
);

export const TabletDeadPowerIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#71717A" strokeWidth="2" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="#09090B" />
    <rect x="26" y="27" width="12" height="6" rx="1" stroke="#EF4444" strokeWidth="1.5" />
    <line x1="39" y1="29" x2="39" y2="31" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M32 36V40" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="32" cy="43" r="1.2" fill="#EF4444" />
    <line x1="14" y1="50" x2="50" y2="14" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
  </svg>
);

export const TabletFlawlessDisplayIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stc_tab_flawlessGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#F4F4F5" strokeWidth="2" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="url(#stc_tab_flawlessGrad)" />
    <path d="M40 16L42 18L44 16L42 14L40 16Z" fill="#FBBF24" />
    <path d="M22 42L23 43L24 42L23 41L22 42Z" fill="#FBBF24" />
  </svg>
);

export const TabletCrackedScreenIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="#121215" />
    <path d="M16 22L26 30L30 22L42 34L46 29" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M26 30L22 42L33 46L30 52" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TabletScratchedScreenIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="#121215" />
    <path d="M18 18C24 21 28 17 38 21" stroke="#F4F4F5" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M17 36C24 33 28 41 39 37" stroke="#F4F4F5" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M22 46C28 49 34 44 42 48" stroke="#F4F4F5" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
  </svg>
);

export const TabletFlawlessFrameIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stc_tab_metalGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E4E4E7" />
        <stop offset="50%" stopColor="#A1A1AA" />
        <stop offset="100%" stopColor="#E4E4E7" />
      </linearGradient>
    </defs>
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="url(#stc_tab_metalGrad)" strokeWidth="3" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="#1C1C1F" />
    <path d="M8 18L10 20L12 18L10 16L8 18Z" fill="#FBBF24" />
    <path d="M52 46L54 48L56 46L54 44L52 46Z" fill="#FBBF24" />
  </svg>
);

export const TabletHealthyConnectivityIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_tabConnHealthyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <rect x="13" y="10" width="38" height="44" rx="5" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <rect x="16" y="13" width="32" height="38" rx="3" fill="url(#rpx_tabConnHealthyGrad)" />
    <circle cx="32" cy="11.5" r="0.75" fill="#0F172A" />
    <rect x="24" y="20" width="14" height="8" rx="2" stroke="#0F172A" strokeWidth="1.2" fill="#FFFFFF" />
    <rect x="38" y="22.5" width="1.5" height="3" rx="0.75" fill="#0F172A" />
    <rect x="25.5" y="21.5" width="9" height="5" rx="1" fill="#10B981" />
    <rect x="25" y="37" width="3" height="4" rx="0.75" fill="#10B981" />
    <rect x="29.5" y="34" width="3" height="7" rx="0.75" fill="#10B981" />
    <rect x="34" y="31" width="3" height="10" rx="0.75" fill="#10B981" />
    <rect x="38.5" y="28" width="3" height="13" rx="0.75" fill="#10B981" />
    <circle cx="44" cy="18" r="4.5" fill="#10B981" />
    <path d="M42.2 18L43.4 19.2L45.8 16.8" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TabletHealthyHardwareIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_tabHwHealthyGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.04" />
      </linearGradient>
    </defs>
    <rect x="13" y="10" width="38" height="44" rx="5" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <rect x="16" y="13" width="32" height="38" rx="3" fill="url(#rpx_tabHwHealthyGrad)" />
    <circle cx="32" cy="11.5" r="0.75" fill="#0F172A" />
    <circle cx="32" cy="24" r="8" stroke="#0F172A" strokeWidth="1.5" fill="#FFFFFF" />
    <circle cx="32" cy="24" r="5" stroke="#0F172A" strokeWidth="1.2" fill="#F1F5F9" />
    <circle cx="32" cy="24" r="2.5" fill="#10B981" />
    <circle cx="32" cy="38" r="5.5" stroke="#10B981" strokeWidth="1.2" strokeDasharray="2 1.5" fill="none" />
    <path d="M30 38L31.5 39.5L34 36.5" stroke="#10B981" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const TabletAllAccessoriesIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rpx_tabAccGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.22" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <path d="M30 11L48 18.5L30 26L12 18.5L30 11Z" stroke="#0F172A" strokeWidth="2" fill="url(#rpx_tabAccGrad)" />
    <path d="M12 18.5V38L30 45.5V26" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
    <path d="M48 18.5V38L30 45.5" stroke="#0F172A" strokeWidth="2" fill="#F8FAFC" />
    <rect x="36" y="31" width="13" height="11" rx="2" stroke="#0F172A" strokeWidth="1.3" fill="#FFFFFF" />
    <line x1="39" y1="28" x2="39" y2="31" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="43" y1="28" x2="43" y2="31" stroke="#0F172A" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="49" cy="15" r="4.5" fill="#10B981" />
    <path d="M47.2 15L48.4 16.2L50.8 13.8" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);



export const TabletDentedFrameIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="#121215" />
    <path d="M12 18C10.5 20 10.5 24 12 26" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="9" cy="22" r="2" fill="#EF4444" />
  </svg>
);

export const TabletScuffedFrameIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="#121215" />
    <circle cx="10" cy="11" r="1.2" fill="#FBBF24" />
    <circle cx="13" cy="8" r="1" fill="#FBBF24" />
    <circle cx="53" cy="51" r="1.5" fill="#FBBF24" />
  </svg>
);

export const TabletScreenBurnIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="#121215" />
    <line x1="22" y1="11" x2="22" y2="53" stroke="#10B981" strokeWidth="1.5" opacity="0.8" />
    <line x1="32" y1="11" x2="32" y2="53" stroke="#EC4899" strokeWidth="1.5" opacity="0.8" />
    <line x1="42" y1="11" x2="42" y2="53" stroke="#06B6D4" strokeWidth="1" opacity="0.6" />
    <circle cx="32" cy="32" r="6" fill="#F59E0B" fillOpacity="0.25" />
  </svg>
);

export const TabletTouchUnresponsiveIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="#121215" />
    <circle cx="32" cy="32" r="9" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
    <path d="M32 27V33" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="32" cy="36.5" r="1" fill="#EF4444" />
  </svg>
);

export const TabletTrueToneIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="#3F3F46" />
    <circle cx="32" cy="32" r="8" fill="#F59E0B" opacity="0.6" />
    <path d="M32 24V40" stroke="#EF4444" strokeWidth="1.5" />
  </svg>
);

export const TabletAirPassIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="#121215" />
    <path d="M32 20C32 20 26 27 26 31C26 34.3 28.7 37 32 37C35.3 37 38 34.3 38 31C38 27 32 20 32 20Z" fill="#3B82F6" opacity="0.8" />
    <path d="M32 39V43" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="32" cy="45.5" r="1" fill="#EF4444" />
  </svg>
);

export const TabletSideButtonsIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="52" y="14" width="3" height="8" rx="1" fill="#EF4444" />
    <rect x="52" y="24" width="3" height="8" rx="1" fill="#EF4444" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="#121215" />
  </svg>
);

export const TabletScrewsIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="#121215" />
    <circle cx="20" cy="52" r="1.5" stroke="#EF4444" strokeWidth="1" fill="none" />
    <circle cx="44" cy="52" r="1.5" stroke="#EF4444" strokeWidth="1" fill="none" />
    <path d="M32 38L28 46H36L32 38Z" fill="#EF4444" opacity="0.8" />
  </svg>
);

export const TabletFaultyLensIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="18" y="14" width="14" height="14" rx="3" stroke="#71717A" strokeWidth="1.5" fill="#27272A" />
    <circle cx="25" cy="21" r="4" stroke="#EF4444" strokeWidth="1.5" fill="#121215" />
    <path d="M22 18L28 24" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const TabletLowBatteryIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="#121215" />
    <rect x="22" y="27" width="20" height="10" rx="2" stroke="#F59E0B" strokeWidth="1.5" />
    <line x1="42" y1="30" x2="42" y2="34" stroke="#F59E0B" strokeWidth="1.5" />
    <rect x="24" y="29" width="4" height="6" fill="#EF4444" />
  </svg>
);

export const TabletBatteryWarningIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="#121215" />
    <rect x="22" y="27" width="20" height="10" rx="2" stroke="#F59E0B" strokeWidth="1.5" />
    <path d="M32 29V33" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="32" cy="35" r="0.8" fill="#EF4444" />
  </svg>
);

export const TabletFaultyBiometricsIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="8" width="40" height="48" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="15" y="11" width="34" height="42" rx="2" fill="#121215" />
    <path d="M22 40C24 33 28 30 32 30C36 30 40 33 42 40" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <path d="M20 22V16H26" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <path d="M38 16H44V22" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const TabletMissingBoxIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 16L52 16L44 48L20 48Z" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" fill="none" />
    <rect x="16" y="20" width="32" height="24" rx="2" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M32 26C32 24.5 33.2 23 35 23C36.8 23 38 24.5 38 26C38 27.5 37 28.5 35.5 29.5V31.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="35.5" cy="34" r="1" fill="#EF4444" />
  </svg>
);

export const TabletMissingChargerIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="22" width="24" height="24" rx="4" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M44 32C44 29.8 45.8 28 48 28C50.2 28 52 29.8 52 32C52 33.5 51.2 34.8 50 35.5V38" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="50" cy="40.5" r="1.2" fill="#EF4444" />
  </svg>
);


// Dispatcher function supporting device type variants
export const getIllustration = (
  id: string,
  deviceType: 'phone' | 'watch' | 'tablet' = 'phone',
  biometricType?: 'face_id' | 'touch_id' | 'fingerprint' | 'none'
): React.ReactNode => {
  if (deviceType === 'watch') {
    switch (id) {
      case 'power-on':
        return <WatchPowersOnIllustration />;
      case 'defect-critical-power':
        return <WatchDeadPowerIllustration />;
      case 'screen-flawless':
        return <WatchFlawlessDisplayIllustration />;
      case 'defect-screen-cracked':
      case 'defect-watch-screen-cracked':
        return <WatchCrackedScreenIllustration />;
      case 'defect-screen-minor-scratches':
      case 'defect-screen-scratches':
      case 'defect-watch-screen-scratches':
        return <WatchScratchedScreenIllustration />;
      case 'defect-screen-burn':
      case 'defect-watch-screen-burn':
        return <WatchScreenBurnIllustration />;
      case 'defect-screen-touch':
      case 'defect-watch-screen-touch':
        return <WatchTouchUnresponsiveIllustration />;
      case 'defect-screen-truetone':
        return <WatchFlawlessDisplayIllustration />;
      case 'body-flawless':
        return <WatchFlawlessFrameIllustration />;
      case 'connectivity-healthy':
        return <WatchHealthyConnectivityIllustration />;
      case 'hardware-healthy':
        return <WatchHealthyConnectivityIllustration />;
      case 'accessories-all':
      case 'accessories-flawless':
        return <WatchAllAccessoriesIllustration />;
      case 'defect-body-dented':
      case 'defect-watch-body-dented':
        return <WatchDentedFrameIllustration />;
      case 'defect-body-buttons':
      case 'defect-watch-crown-faulty':
        return <WatchDigitalCrownIllustration />;
      case 'defect-body-airpass':
      case 'defect-watch-water-seal':
        return <WatchWaterSealIllustration />;
      case 'defect-body-scuffs':
      case 'defect-watch-strap-damaged':
        return <WatchScuffedStrapIllustration />;
      case 'defect-critical-security':
      case 'defect-watch-sensor-heart':
      case 'defect-watch-sensor-ecg':
      case 'defect-watch-sensor-motion':
        return <WatchHeartSensorIllustration />;
      case 'defect-battery-low':
      case 'defect-watch-battery-health':
        return <WatchLowBatteryIllustration />;
      case 'defect-charger-missing':
      case 'defect-watch-charging-puck':
      case 'defect-watch-charger-missing':
        return <WatchChargingPuckIllustration />;
      case 'defect-func-network':
      case 'defect-watch-cellular-esim':
        return <NetworkIssueIllustration />;
      case 'defect-func-wireless':
      case 'defect-watch-wireless-gps':
        return <WirelessIssueIllustration />;
      case 'defect-box-missing':
      case 'defect-watch-box-missing':
        return <MissingBoxIllustration />;
      case 'defect-acc-nodocs':
      case 'defect-watch-bill-missing':
        return <MissingDocsIllustration />;
      case 'defect-spen-missing':
        return <MissingSpenIllustration />;
      default:
        return <WatchFlawlessFrameIllustration />;
    }
  }

  if (deviceType === 'tablet') {
    switch (id) {
      case 'power-on':
        return <TabletPowersOnIllustration />;
      case 'defect-critical-power':
        return <TabletDeadPowerIllustration />;
      case 'screen-flawless':
        return <TabletFlawlessDisplayIllustration />;
      case 'defect-screen-cracked':
        return <TabletCrackedScreenIllustration />;
      case 'defect-screen-minor-scratches':
      case 'defect-screen-scratches':
        return <TabletScratchedScreenIllustration />;
      case 'defect-screen-burn':
        return <TabletScreenBurnIllustration />;
      case 'defect-screen-touch':
        return <TabletTouchUnresponsiveIllustration />;
      case 'defect-screen-truetone':
        return <TabletTrueToneIllustration />;
      case 'body-flawless':
        return <TabletFlawlessFrameIllustration />;
      case 'connectivity-healthy':
        return <TabletHealthyConnectivityIllustration />;
      case 'hardware-healthy':
        return <TabletHealthyHardwareIllustration />;
      case 'accessories-all':
      case 'accessories-flawless':
        return <TabletAllAccessoriesIllustration />;
      case 'defect-body-dented':
        return <TabletDentedFrameIllustration />;
      case 'defect-body-scuffs':
        return <TabletScuffedFrameIllustration />;
      case 'defect-body-airpass':
        return <TabletAirPassIllustration />;
      case 'defect-body-buttons':
        return <TabletSideButtonsIllustration />;
      case 'defect-body-screws':
        return <TabletScrewsIllustration />;
      case 'defect-camera-front':
      case 'defect-func-front-camera':
        return <FrontCameraIllustration />;
      case 'defect-camera-back':
      case 'defect-func-back-camera':
        return <BackCameraIllustration />;
      case 'defect-camera-glass':
      case 'defect-func-camera-glass':
        return <CameraGlassIllustration />;
      case 'defect-camera-faulty':
        return <TabletFaultyLensIllustration />;
      case 'defect-func-speaker':
        return <LoudspeakerIllustration />;
      case 'defect-func-mic':
        return <MicrophoneIllustration />;
      case 'defect-func-receiver':
        return <AudioReceiverIllustration />;
      case 'defect-func-charging':
        return <ChargingPortIllustration />;
      case 'defect-func-vibrator':
        return <VibratorIllustration />;
      case 'defect-battery-80-85':
        return <Battery80to85Illustration />;
      case 'defect-battery-low':
        return <TabletLowBatteryIllustration />;
      case 'defect-battery-warning':
        return <TabletBatteryWarningIllustration />;
      case 'defect-critical-security':
        if (biometricType === 'face_id') return <FaultyFaceIdIllustration />;
        if (biometricType === 'touch_id' || biometricType === 'fingerprint') return <FaultyFingerprintIllustration />;
        return <TabletFaultyBiometricsIllustration />;
      case 'defect-func-face-id':
        return <FaultyFaceIdIllustration />;
      case 'defect-func-touch-id':
        return <FaultyFingerprintIllustration />;
      case 'defect-func-network':
        return <NetworkIssueIllustration />;
      case 'defect-func-wireless':
        return <WirelessIssueIllustration />;
      case 'defect-func-partmatch':
        return <PartMismatchIllustration />;
      case 'defect-func-audio':
        return <AudioFaultyIllustration />;
      case 'defect-func-restart':
        return <AutoRestartIllustration />;
      case 'defect-box-missing':
        return <TabletMissingBoxIllustration />;
      case 'defect-charger-missing':
        return <TabletMissingChargerIllustration />;
      case 'defect-acc-nodocs':
        return <MissingDocsIllustration />;
      case 'defect-spen-missing':
        return <MissingSpenIllustration />;
      default:
        return <TabletFlawlessDisplayIllustration />;
    }
  }

  // Smartphone (default)
  switch (id) {
    // Power status
    case 'power-on':
      return <PowersOnIllustration />;
    case 'defect-critical-power':
      return <DeadPowerIllustration />;

    // Screen
    case 'screen-flawless':
      return <FlawlessDisplayIllustration />;
    case 'defect-screen-minor-scratches':
      return <MinorScratchedScreenIllustration />;
    case 'defect-screen-cracked':
      return <CrackedScreenIllustration />;
    case 'defect-screen-scratches':
      return <ScratchedScreenIllustration />;
    case 'defect-screen-burn':
      return <ScreenBurnLinesIllustration />;
    case 'defect-screen-touch':
      return <TouchUnresponsiveIllustration />;
    case 'defect-screen-truetone':
      return <TrueToneIllustration />;
    case 'defect-screen-crease':
      return <InnerScreenCreaseIllustration />;

    // Body
    case 'body-flawless':
      return <FlawlessFrameIllustration />;
    case 'connectivity-healthy':
      return <HealthyConnectivityIllustration />;
    case 'hardware-healthy':
      return <HealthyHardwareIllustration />;
    case 'accessories-all':
    case 'accessories-flawless':
      return <AllAccessoriesIllustration />;
    case 'defect-body-hinge':
      return <HingeFaultyIllustration />;
    case 'defect-body-dented':
      return <DentedFrameIllustration />;
    case 'defect-body-backglass':
      return <CrackedScreenIllustration />;
    case 'defect-body-scuffs':
      return <ScuffedFrameIllustration />;
    case 'defect-body-airpass':
      return <AirPassIllustration />;
    case 'defect-body-buttons':
      return <SideButtonsIllustration />;
    case 'defect-body-screws':
      return <ScrewsIllustration />;

    // Hardware / Functionality
    case 'defect-camera-front':
    case 'defect-func-front-camera':
      return <FrontCameraIllustration />;
    case 'defect-camera-back':
    case 'defect-func-back-camera':
      return <BackCameraIllustration />;
    case 'defect-camera-glass':
    case 'defect-func-camera-glass':
      return <CameraGlassIllustration />;
    case 'defect-camera-faulty':
      return <FaultyLensIllustration />;
    case 'defect-func-speaker':
      return <LoudspeakerIllustration />;
    case 'defect-func-mic':
      return <MicrophoneIllustration />;
    case 'defect-func-receiver':
      return <AudioReceiverIllustration />;
    case 'defect-func-charging':
      return <ChargingPortIllustration />;
    case 'defect-func-vibrator':
      return <VibratorIllustration />;
    case 'defect-battery-80-85':
      return <Battery80to85Illustration />;
    case 'defect-battery-low':
      return <LowBatteryIllustration />;
    case 'defect-battery-warning':
      return <BatteryWarningIllustration />;
    case 'defect-critical-security':
      if (biometricType === 'face_id') {
        return <FaultyFaceIdIllustration />;
      }
      if (biometricType === 'touch_id' || biometricType === 'fingerprint') {
        return <FaultyFingerprintIllustration />;
      }
      return <FaultyBiometricsIllustration />;
    case 'defect-func-face-id':
      return <FaultyFaceIdIllustration />;
    case 'defect-func-touch-id':
      return <FaultyFingerprintIllustration />;
    case 'defect-func-network':
      return <NetworkIssueIllustration />;
    case 'defect-func-wireless':
      return <WirelessIssueIllustration />;
    case 'defect-func-partmatch':
      return <PartMismatchIllustration />;
    case 'defect-func-audio':
      return <AudioFaultyIllustration />;
    case 'defect-func-restart':
      return <AutoRestartIllustration />;

    // Accessories
    case 'defect-box-missing':
      return <MissingBoxIllustration />;
    case 'defect-charger-missing':
      return <MissingChargerIllustration />;
    case 'defect-acc-nodocs':
      return <MissingDocsIllustration />;
    case 'defect-spen-missing':
      return <MissingSpenIllustration />;

    // Warranty & Age
    case 'warranty-under-3m':
      return <WarrantyUnder3mIllustration />;
    case 'warranty-3-to-6m':
      return <Warranty3to6mIllustration />;
    case 'warranty-6-to-11m':
      return <Warranty6to11mIllustration />;
    case 'warranty-above-11m':
      return <WarrantyOutIllustration />;

    // SIM Config
    case 'sim-dual':
      return <DualSimIllustration />;
    case 'sim-single':
      return <SingleSimIllustration />;

    default:
      return null;
  }
};

// ==================== WARRANTY & SIM ILLUSTRATIONS ====================

export const WarrantyUnder3mIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 10L48 16V30C48 41 41 49 32 54C23 49 16 41 16 30V16L32 10Z" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="2" />
    <path d="M26 28L30 32L38 22" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <text x="32" y="44" textAnchor="middle" fill="#34D399" fontSize="8" fontWeight="bold" fontFamily="sans-serif">&lt;3 Months</text>
  </svg>
);

export const Warranty3to6mIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 10L48 16V30C48 41 41 49 32 54C23 49 16 41 16 30V16L32 10Z" fill="#3B82F6" fillOpacity="0.2" stroke="#3B82F6" strokeWidth="2" />
    <path d="M26 28L30 32L38 22" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <text x="32" y="44" textAnchor="middle" fill="#60A5FA" fontSize="8" fontWeight="bold" fontFamily="sans-serif">3-6 Months</text>
  </svg>
);

export const Warranty6to11mIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 10L48 16V30C48 41 41 49 32 54C23 49 16 41 16 30V16L32 10Z" fill="#8B5CF6" fillOpacity="0.2" stroke="#8B5CF6" strokeWidth="2" />
    <path d="M26 28L30 32L38 22" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <text x="32" y="44" textAnchor="middle" fill="#A78BFA" fontSize="8" fontWeight="bold" fontFamily="sans-serif">6-11 Months</text>
  </svg>
);

export const WarrantyOutIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 10L48 16V30C48 41 41 49 32 54C23 49 16 41 16 30V16L32 10Z" stroke="#71717A" strokeWidth="2" fill="#18181B" />
    <circle cx="32" cy="28" r="7" stroke="#71717A" strokeWidth="1.5" />
    <path d="M32 25V28L35 30" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" />
    <text x="32" y="45" textAnchor="middle" fill="#71717A" fontSize="7.5" fontWeight="bold" fontFamily="sans-serif">Out of Warranty</text>
  </svg>
);

export const DualSimIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 16H30L36 22V48H16V16Z" fill="#3B82F6" fillOpacity="0.2" stroke="#3B82F6" strokeWidth="2" />
    <path d="M28 20H42L48 26V52H28V20Z" fill="#10B981" fillOpacity="0.2" stroke="#10B981" strokeWidth="2" />
    <rect x="20" y="36" width="8" height="6" rx="1" fill="#60A5FA" />
    <rect x="32" y="40" width="8" height="6" rx="1" fill="#34D399" />
  </svg>
);

export const SingleSimIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M20 16H38L44 22V48H20V16Z" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="24" y="34" width="10" height="8" rx="1.5" fill="#A1A1AA" />
  </svg>
);

