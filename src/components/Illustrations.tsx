import React from 'react';

// 1. Powers On
export const PowersOnIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stc_ill_powerOnGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    {/* Phone chassis */}
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    {/* Screen */}
    <rect x="22" y="9" width="20" height="46" rx="2" fill="url(#stc_ill_powerOnGrad)" />
    {/* Power bolt */}
    <path d="M34 16L25 29H32L30 46L39 33H32L34 16Z" fill="#34D399" stroke="#10B981" strokeWidth="1.5" strokeLinejoin="round" />
    {/* Speaker at top */}
    <line x1="29" y1="8" x2="35" y2="8" stroke="#71717A" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

// 2. Dead / Fails to Boot
export const DeadPowerIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Phone chassis */}
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#71717A" strokeWidth="2" />
    {/* Screen dark */}
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#18181B" />
    {/* Battery outline */}
    <rect x="26" y="24" width="12" height="6" rx="1" stroke="#EF4444" strokeWidth="1.5" />
    <line x1="39" y1="26" x2="39" y2="28" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    {/* Red caution symbol overlay */}
    <path d="M32 36V41" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="45" r="1.5" fill="#EF4444" />
    {/* Red slash across the phone */}
    <line x1="14" y1="50" x2="50" y2="14" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.8" />
  </svg>
);

// 3. Flawless Display
export const FlawlessDisplayIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stc_ill_flawlessGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.1" />
      </linearGradient>
    </defs>
    {/* Phone chassis */}
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#F4F4F5" strokeWidth="2" />
    {/* Screen */}
    <rect x="22" y="9" width="20" height="46" rx="2" fill="url(#stc_ill_flawlessGrad)" />
    {/* Sparkle */}
    <path d="M36 14L38 16L40 14L38 12L36 14Z" fill="#FBBF24" />
    <path d="M25 38L26 39L27 38L26 37L25 38Z" fill="#FBBF24" />
  </svg>
);

// 4. Cracked Screen
export const CrackedScreenIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Phone chassis */}
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    {/* Crack lines */}
    <path d="M22 22L29 28L31 22L38 30L42 27" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M29 28L26 38L33 42L30 55" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M31 22L35 12" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 5. Scratched Screen
export const ScratchedScreenIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Phone chassis */}
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    {/* Scratches */}
    <path d="M24 16C28 18 30 15 34 18" stroke="#F4F4F5" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M23 34C28 32 30 38 37 35" stroke="#F4F4F5" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M27 44C31 46 35 43 39 46" stroke="#F4F4F5" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
  </svg>
);

// 6. Screen Burn / Lines
export const ScreenBurnLinesIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Phone chassis */}
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    {/* Burn-in vertical lines */}
    <line x1="25" y1="9" x2="25" y2="55" stroke="#10B981" strokeWidth="1.5" opacity="0.8" />
    <line x1="32" y1="9" x2="32" y2="55" stroke="#EC4899" strokeWidth="1.5" opacity="0.8" />
    <line x1="39" y1="9" x2="39" y2="55" stroke="#06B6D4" strokeWidth="1" opacity="0.6" />
    {/* Discolored region */}
    <circle cx="32" cy="30" r="5" fill="#F59E0B" fillOpacity="0.25" />
  </svg>
);

// 7. Flawless Frame
export const FlawlessFrameIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stc_ill_metalGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E4E4E7" />
        <stop offset="50%" stopColor="#A1A1AA" />
        <stop offset="100%" stopColor="#E4E4E7" />
      </linearGradient>
    </defs>
    {/* Phone frame with shiny metal outline */}
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="url(#stc_ill_metalGrad)" strokeWidth="3" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    {/* Frame sparkles */}
    <path d="M14 16L16 18L18 16L16 14L14 16Z" fill="#FBBF24" />
    <path d="M46 44L48 46L50 44L48 42L46 44Z" fill="#FBBF24" />
  </svg>
);

// 8. Dented Frame
export const DentedFrameIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Bent/dented frame path */}
    <path d="M19 10C19 7.79086 20.7909 6 23 6H41C43.2091 6 45 7.79086 45 10V28C42 29.5 42 31.5 45 33V54C45 56.2091 43.2091 58 41 58H23C20.7909 58 19 56.2091 19 54V10Z" stroke="#EF4444" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    {/* Dent indicator */}
    <circle cx="19" cy="30.5" r="3.5" fill="#EF4444" />
    <path d="M13 30.5H17" stroke="#EF4444" strokeWidth="1.5" />
  </svg>
);

// 9. Scuffed Frame
export const ScuffedFrameIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    {/* Scuff marks on corner frame */}
    <circle cx="17" cy="9" r="1.2" fill="#FBBF24" />
    <circle cx="20" cy="7" r="1" fill="#FBBF24" />
    <circle cx="19" cy="11" r="1.5" fill="#FBBF24" />
    <circle cx="45" cy="48" r="1.2" fill="#FBBF24" />
    <circle cx="47" cy="51" r="1.5" fill="#FBBF24" />
    <circle cx="43" cy="53" r="1" fill="#FBBF24" />
  </svg>
);

// 10. Faulty Camera Lens
export const FaultyLensIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Camera module */}
    <rect x="16" y="16" width="32" height="32" rx="6" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    {/* Outer Lens */}
    <circle cx="32" cy="32" r="10" stroke="#71717A" strokeWidth="2" fill="#1C1C1F" />
    {/* Inner glass reflection */}
    <circle cx="32" cy="32" r="5" stroke="#3B82F6" strokeWidth="1.5" />
    {/* Crack line through the lens */}
    <path d="M23 23L31 31L34 33L41 40" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    {/* Blur indicators */}
    <circle cx="28" cy="35" r="1" fill="#F59E0B" />
    <circle cx="35" cy="27" r="1" fill="#F59E0B" />
  </svg>
);

// 11. Low Battery
export const LowBatteryIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Battery body */}
    <rect x="16" y="24" width="28" height="16" rx="3" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    {/* Battery terminal */}
    <path d="M45 29V35" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" />
    {/* Critical red bar */}
    <rect x="20" y="28" width="6" height="8" rx="1" fill="#EF4444" />
    {/* Downward trend line */}
    <path d="M22 18L28 21L34 19L42 25" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M39 25H42V22" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 12. Faulty Biometrics
export const FaultyBiometricsIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Fingerprint scan outline */}
    <path d="M22 40C24 33 28 30 32 30C36 30 40 33 42 40" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <path d="M26 44C28 39 30 36 32 36C34 36 36 39 38 44" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    {/* Face ID corners */}
    <path d="M18 22V16H24" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <path d="M40 16H46V22" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    {/* Warning caution symbol */}
    <path d="M32 18V24" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="27" r="1.5" fill="#EF4444" />
  </svg>
);

// 13. Missing Box
export const MissingBoxIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Box isometric lines - dashed */}
    <path d="M32 12L50 20L32 28L14 20L32 12Z" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M14 20V42L32 50V28" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M50 20V42L32 50" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
    {/* Question mark inside */}
    <path d="M32 22V27" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="31" r="1.5" fill="#EF4444" />
  </svg>
);

// 14. Missing Charger
export const MissingChargerIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Charger brick - dashed */}
    <rect x="18" y="24" width="20" height="20" rx="3" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" fill="#18181B" fillOpacity="0.5" />
    {/* Prongs */}
    <path d="M24 24V18" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
    <path d="M32 24V18" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
    {/* Cable loop */}
    <path d="M38 34C44 34 46 38 42 42C38 46 48 48 46 52" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
    {/* Diagonal warning strike */}
    <line x1="12" y1="52" x2="52" y2="12" stroke="#EF4444" strokeWidth="1.5" />
  </svg>
);

export const getIllustration = (id: string): React.ReactNode => {
  switch (id) {
    // Power status
    case 'power-on':
      return <PowersOnIllustration />;
    case 'defect-critical-power':
      return <DeadPowerIllustration />;

    // Screen
    case 'screen-flawless':
      return <FlawlessDisplayIllustration />;
    case 'defect-screen-cracked':
      return <CrackedScreenIllustration />;
    case 'defect-screen-scratches':
      return <ScratchedScreenIllustration />;
    case 'defect-screen-burn':
      return <ScreenBurnLinesIllustration />;

    // Body
    case 'body-flawless':
      return <FlawlessFrameIllustration />;
    case 'defect-body-dented':
      return <DentedFrameIllustration />;
    case 'defect-body-scuffs':
      return <ScuffedFrameIllustration />;

    // Hardware
    case 'defect-camera-faulty':
      return <FaultyLensIllustration />;
    case 'defect-battery-low':
      return <LowBatteryIllustration />;
    case 'defect-critical-security':
      return <FaultyBiometricsIllustration />;

    // Accessories
    case 'defect-box-missing':
      return <MissingBoxIllustration />;
    case 'defect-charger-missing':
      return <MissingChargerIllustration />;

    default:
      return null;
  }
};
