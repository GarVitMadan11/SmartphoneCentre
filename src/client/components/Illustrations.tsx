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

// 15. Touch / Swipe Unresponsive
export const TouchUnresponsiveIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    {/* Finger / touch point */}
    <circle cx="32" cy="32" r="6" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 2" />
    <circle cx="32" cy="32" r="2" fill="#EF4444" />
    {/* X through it */}
    <line x1="28" y1="28" x2="36" y2="36" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="36" y1="28" x2="28" y2="36" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 16. True Tone Not Working
export const TrueToneIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    {/* Sun symbol */}
    <circle cx="32" cy="32" r="5" stroke="#F59E0B" strokeWidth="1.5" />
    <line x1="32" y1="22" x2="32" y2="19" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="32" y1="45" x2="32" y2="42" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="23" y1="32" x2="20" y2="32" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="44" y1="32" x2="41" y2="32" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    {/* Slash through it */}
    <line x1="25" y1="39" x2="39" y2="25" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 17. Air Pass / Seal Fail
export const AirPassIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    {/* Water/air drops leaking through */}
    <path d="M28 26C28 23 32 18 32 18C32 18 36 23 36 26C36 28.76 34.2 31 32 31C29.8 31 28 28.76 28 26Z" stroke="#3B82F6" strokeWidth="1.5" fill="none" />
    <path d="M23 38C23 36.5 25 34 25 34C25 34 27 36.5 27 38C27 39.1 26.1 40 25 40C23.9 40 23 39.1 23 38Z" stroke="#3B82F6" strokeWidth="1.2" fill="none" opacity="0.6" />
    {/* Alert */}
    <path d="M40 44L43 38L46 44H40Z" stroke="#EF4444" strokeWidth="1.2" strokeLinejoin="round" fill="none" />
    <line x1="43" y1="40" x2="43" y2="42" stroke="#EF4444" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

// 18. Side Buttons Faulty
export const SideButtonsIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="21" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="24" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    {/* Volume buttons on left */}
    <rect x="13" y="18" width="5" height="9" rx="2" stroke="#EF4444" strokeWidth="1.5" />
    <rect x="13" y="30" width="5" height="9" rx="2" stroke="#EF4444" strokeWidth="1.5" />
    {/* Power button on right */}
    <rect x="50" y="22" width="5" height="12" rx="2" stroke="#EF4444" strokeWidth="1.5" />
    {/* Alert dot */}
    <circle cx="52.5" cy="20" r="2.5" fill="#EF4444" />
    <line x1="52.5" y1="18.5" x2="52.5" y2="20.5" stroke="white" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

// 19. Screws Stripped
export const ScrewsIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    {/* Left screw */}
    <circle cx="24" cy="55" r="3" stroke="#A1A1AA" strokeWidth="1.5" />
    <line x1="22.12" y1="53.12" x2="25.88" y2="56.88" stroke="#A1A1AA" strokeWidth="1.2" />
    {/* Right screw - stripped (no clean slot) */}
    <circle cx="40" cy="55" r="3" stroke="#EF4444" strokeWidth="1.5" />
    <path d="M38 53.5L40.5 56.5" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M42 53.5L39.5 55.5" stroke="#EF4444" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
    {/* Alert */}
    <circle cx="40" cy="49" r="2" fill="#EF4444" />
    <line x1="40" y1="47.5" x2="40" y2="49" stroke="white" strokeWidth="0.8" />
  </svg>
);

// 20. Non-Genuine Battery Warning
export const BatteryWarningIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="22" width="30" height="18" rx="3" stroke="#F59E0B" strokeWidth="2" fill="#18181B" />
    <path d="M45 28V36" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    {/* Full bar but orange/warning */}
    <rect x="18" y="26" width="22" height="10" rx="1.5" fill="#F59E0B" fillOpacity="0.3" />
    {/* Warning triangle overlay */}
    <path d="M32 14L38 24H26L32 14Z" stroke="#EF4444" strokeWidth="1.5" strokeLinejoin="round" fill="#EF4444" fillOpacity="0.2" />
    <line x1="32" y1="17" x2="32" y2="21" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" />
    <circle cx="32" cy="23" r="0.8" fill="#EF4444" />
  </svg>
);

// 21. Network / Calling / SIM Issues
export const NetworkIssueIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Signal bars */}
    <rect x="14" y="40" width="6" height="10" rx="1" stroke="#A1A1AA" strokeWidth="1.5" fill="#3B82F6" fillOpacity="0.3" />
    <rect x="23" y="33" width="6" height="17" rx="1" stroke="#A1A1AA" strokeWidth="1.5" fill="#3B82F6" fillOpacity="0.2" />
    <rect x="32" y="26" width="6" height="24" rx="1" stroke="#71717A" strokeWidth="1.5" strokeDasharray="2 2" />
    <rect x="41" y="18" width="6" height="32" rx="1" stroke="#71717A" strokeWidth="1.5" strokeDasharray="2 2" />
    {/* Red X */}
    <line x1="34" y1="12" x2="42" y2="20" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <line x1="42" y1="12" x2="34" y2="20" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 22. Wi-Fi & Bluetooth Issues
export const WirelessIssueIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Wi-Fi arcs — faded */}
    <path d="M18 30C23 24 41 24 46 30" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
    <path d="M23 36C26 32 38 32 41 36" stroke="#71717A" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
    {/* Center dot */}
    <circle cx="32" cy="42" r="2.5" fill="#A1A1AA" />
    {/* Bluetooth symbol */}
    <path d="M38 16L44 21L39 26L44 31L38 36V16Z" stroke="#3B82F6" strokeWidth="1.5" strokeLinejoin="round" />
    <line x1="38" y1="16" x2="32" y2="21" stroke="#3B82F6" strokeWidth="1.5" />
    <line x1="38" y1="36" x2="32" y2="31" stroke="#3B82F6" strokeWidth="1.5" />
    {/* Red X through both */}
    <line x1="14" y1="14" x2="24" y2="24" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="24" y1="14" x2="14" y2="24" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 23. 3uTools Serial Mismatch
export const PartMismatchIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Computer screen */}
    <rect x="10" y="16" width="28" height="20" rx="2" stroke="#A1A1AA" strokeWidth="1.5" fill="#18181B" />
    <line x1="22" y1="36" x2="22" y2="42" stroke="#A1A1AA" strokeWidth="1.5" />
    <line x1="16" y1="42" x2="28" y2="42" stroke="#A1A1AA" strokeWidth="1.5" />
    {/* Two serial numbers - mismatch */}
    <line x1="14" y1="22" x2="24" y2="22" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="14" y1="26" x2="20" y2="26" stroke="#3B82F6" strokeWidth="1.2" strokeLinecap="round" />
    {/* Phone with different serial */}
    <rect x="40" y="22" width="16" height="28" rx="3" stroke="#A1A1AA" strokeWidth="1.5" fill="#1C1C1F" />
    <line x1="43" y1="28" x2="53" y2="28" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="43" y1="32" x2="50" y2="32" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" />
    {/* Mismatch arrow */}
    <path d="M38 30L41 32L38 34" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M30 30L38 30" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="2 2" />
  </svg>
);

// 24. Speakers / Microphone Faulty
export const AudioFaultyIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Speaker cone */}
    <path d="M16 24H22L32 16V48L22 40H16V24Z" stroke="#A1A1AA" strokeWidth="1.5" strokeLinejoin="round" fill="#1C1C1F" />
    {/* Sound waves - muted/broken */}
    <path d="M36 24C38 26.7 38 37.3 36 40" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" />
    <path d="M40 20C44 24.7 44 39.3 40 44" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="2 2" opacity="0.5" />
    {/* Microphone */}
    <rect x="45" y="30" width="7" height="12" rx="3.5" stroke="#EF4444" strokeWidth="1.5" />
    {/* Slash through mic */}
    <line x1="43" y1="28" x2="54" y2="46" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 25. Auto-Restart / Unstable
export const AutoRestartIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    {/* Circular restart arrow */}
    <path d="M26 28C26 22.48 30.48 18 36 18" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
    <path d="M38 28C38 33.52 33.52 38 28 38" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeDasharray="3 2" />
    <path d="M36 15L36 21L30 18L36 15Z" fill="#F59E0B" />
    <path d="M28 41L28 35L34 38L28 41Z" fill="#EF4444" />
    {/* Warning 3 min label */}
    <text x="27" y="47" fontSize="6" fill="#EF4444" fontFamily="monospace">3 MIN</text>
  </svg>
);

// 26. Missing Bill / Customer ID
export const MissingDocsIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Document */}
    <rect x="14" y="10" width="28" height="38" rx="2" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 2" fill="#18181B" fillOpacity="0.5" />
    <line x1="19" y1="20" x2="37" y2="20" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="19" y1="26" x2="33" y2="26" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="19" y1="32" x2="35" y2="32" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round" />
    {/* ID card bottom */}
    <rect x="20" y="38" width="16" height="6" rx="1" stroke="#71717A" strokeWidth="1.2" />
    {/* Question mark = missing */}
    <path d="M44 38C44 35.8 45.8 34 48 34C50.2 34 52 35.8 52 38C52 39.5 51.2 40.8 50 41.5V44" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="50" cy="46.5" r="1.2" fill="#EF4444" />
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
    case 'defect-screen-touch':
      return <TouchUnresponsiveIllustration />;
    case 'defect-screen-truetone':
      return <TrueToneIllustration />;

    // Body
    case 'body-flawless':
      return <FlawlessFrameIllustration />;
    case 'defect-body-dented':
      return <DentedFrameIllustration />;
    case 'defect-body-scuffs':
      return <ScuffedFrameIllustration />;
    case 'defect-body-airpass':
      return <AirPassIllustration />;
    case 'defect-body-buttons':
      return <SideButtonsIllustration />;
    case 'defect-body-screws':
      return <ScrewsIllustration />;

    // Hardware / Functionality
    case 'defect-camera-faulty':
      return <FaultyLensIllustration />;
    case 'defect-battery-low':
      return <LowBatteryIllustration />;
    case 'defect-battery-warning':
      return <BatteryWarningIllustration />;
    case 'defect-critical-security':
      return <FaultyBiometricsIllustration />;
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

    default:
      return null;
  }
};
