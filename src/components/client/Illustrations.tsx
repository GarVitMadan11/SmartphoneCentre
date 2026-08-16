import React from 'react';

// ==================== PHONE ILLUSTRATIONS ====================

// 1. Powers On
export const PowersOnIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stc_ill_powerOnGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#10B981" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="url(#stc_ill_powerOnGrad)" />
    <path d="M34 16L25 29H32L30 46L39 33H32L34 16Z" fill="#34D399" stroke="#10B981" strokeWidth="1.5" strokeLinejoin="round" />
    <line x1="29" y1="8" x2="35" y2="8" stroke="#71717A" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

// 2. Dead / Fails to Boot
export const DeadPowerIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#71717A" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#18181B" />
    <rect x="26" y="24" width="12" height="6" rx="1" stroke="#EF4444" strokeWidth="1.5" />
    <line x1="39" y1="26" x2="39" y2="28" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M32 36V41" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="45" r="1.5" fill="#EF4444" />
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
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#F4F4F5" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="url(#stc_ill_flawlessGrad)" />
    <path d="M36 14L38 16L40 14L38 12L36 14Z" fill="#FBBF24" />
    <path d="M25 38L26 39L27 38L26 37L25 38Z" fill="#FBBF24" />
  </svg>
);

// 4. Cracked Screen
export const CrackedScreenIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    <path d="M22 22L29 28L31 22L38 30L42 27" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M29 28L26 38L33 42L30 55" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M31 22L35 12" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 5. Scratched Screen
export const ScratchedScreenIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    <path d="M24 16C28 18 30 15 34 18" stroke="#F4F4F5" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M23 34C28 32 30 38 37 35" stroke="#F4F4F5" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
    <path d="M27 44C31 46 35 43 39 46" stroke="#F4F4F5" strokeWidth="1" strokeLinecap="round" opacity="0.5" />
  </svg>
);

// 6. Screen Burn / Lines
export const ScreenBurnLinesIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    <line x1="25" y1="9" x2="25" y2="55" stroke="#10B981" strokeWidth="1.5" opacity="0.8" />
    <line x1="32" y1="9" x2="32" y2="55" stroke="#EC4899" strokeWidth="1.5" opacity="0.8" />
    <line x1="39" y1="9" x2="39" y2="55" stroke="#06B6D4" strokeWidth="1" opacity="0.6" />
    <circle cx="32" cy="30" r="5" fill="#F59E0B" fillOpacity="0.25" />
  </svg>
);

// 7. Touch Unresponsive
export const TouchUnresponsiveIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    <circle cx="32" cy="32" r="8" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="2 2" fill="none" />
    <path d="M32 28V33" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="32" cy="36" r="1" fill="#EF4444" />
  </svg>
);

// 8. True Tone Faulty
export const TrueToneIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#3F3F46" />
    <circle cx="32" cy="32" r="7" fill="#F59E0B" opacity="0.6" />
    <path d="M32 25V39" stroke="#EF4444" strokeWidth="1.5" />
  </svg>
);

// 9. Flawless Frame
export const FlawlessFrameIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="stc_ill_metalGrad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#E4E4E7" />
        <stop offset="50%" stopColor="#A1A1AA" />
        <stop offset="100%" stopColor="#E4E4E7" />
      </linearGradient>
    </defs>
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="url(#stc_ill_metalGrad)" strokeWidth="3" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    <path d="M14 16L16 18L18 16L16 14L14 16Z" fill="#FBBF24" />
    <path d="M46 44L48 46L50 44L48 42L46 44Z" fill="#FBBF24" />
  </svg>
);

// 10. Dented Frame
export const DentedFrameIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M19 10C19 7.79086 20.7909 6 23 6H41C43.2091 6 45 7.79086 45 10V28C42 29.5 42 31.5 45 33V54C45 56.2091 43.2091 58 41 58H23C20.7909 58 19 56.2091 19 54V10Z" stroke="#EF4444" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    <circle cx="19" cy="30.5" r="3.5" fill="#EF4444" />
    <path d="M13 30.5H17" stroke="#EF4444" strokeWidth="1.5" />
  </svg>
);

// 11. Scuffed Frame
export const ScuffedFrameIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    <circle cx="17" cy="9" r="1.2" fill="#FBBF24" />
    <circle cx="20" cy="7" r="1" fill="#FBBF24" />
    <circle cx="19" cy="11" r="1.5" fill="#FBBF24" />
    <circle cx="45" cy="48" r="1.2" fill="#FBBF24" />
    <circle cx="47" cy="51" r="1.5" fill="#FBBF24" />
    <circle cx="43" cy="53" r="1" fill="#FBBF24" />
  </svg>
);

// 12. Air Pass / Waterproof Seal
export const AirPassIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
    <path d="M32 20C32 20 26 27 26 31C26 34.3 28.7 37 32 37C35.3 37 38 34.3 38 31C38 27 32 20 32 20Z" fill="#3B82F6" opacity="0.8" />
    <path d="M32 38V42" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="32" cy="45" r="1.2" fill="#EF4444" />
  </svg>
);

// 13. Side Buttons
export const SideButtonsIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <rect x="45" y="16" width="3" height="8" rx="1" fill="#EF4444" />
    <rect x="45" y="28" width="3" height="8" rx="1" fill="#EF4444" />
    <rect x="22" y="9" width="20" height="46" rx="2" fill="#1C1C1F" />
  </svg>
);

// 14. Screws Missing
export const ScrewsIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="19" y="6" width="26" height="52" rx="4" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <circle cx="26" cy="54" r="1.5" stroke="#EF4444" strokeWidth="1" fill="none" />
    <circle cx="38" cy="54" r="1.5" stroke="#EF4444" strokeWidth="1" fill="none" />
    <path d="M32 40L28 48H36L32 40Z" fill="#EF4444" opacity="0.8" />
  </svg>
);

// 15. Faulty Camera Lens
export const FaultyLensIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="16" width="32" height="32" rx="6" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <circle cx="32" cy="32" r="10" stroke="#71717A" strokeWidth="2" fill="#1C1C1F" />
    <circle cx="32" cy="32" r="5" stroke="#3B82F6" strokeWidth="1.5" />
    <path d="M23 23L31 31L34 33L41 40" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 16. Low Battery
export const LowBatteryIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="24" width="28" height="16" rx="3" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <path d="M45 29V35" stroke="#A1A1AA" strokeWidth="2" strokeLinecap="round" />
    <rect x="20" y="28" width="6" height="8" rx="1" fill="#EF4444" />
  </svg>
);

// 17. Battery Warning
export const BatteryWarningIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="16" y="24" width="28" height="16" rx="3" stroke="#F59E0B" strokeWidth="2" fill="#18181B" />
    <path d="M45 29V35" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <path d="M30 27V33" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <circle cx="30" cy="36" r="1" fill="#EF4444" />
  </svg>
);

// 18. Faulty Biometrics
export const FaultyBiometricsIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 40C24 33 28 30 32 30C36 30 40 33 42 40" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <path d="M26 44C28 39 30 36 32 36C34 36 36 39 38 44" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <path d="M18 22V16H24" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <path d="M40 16H46V22" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 18V24" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="27" r="1.5" fill="#EF4444" />
  </svg>
);

// 19. Network Issue
export const NetworkIssueIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="42" width="4" height="8" rx="1" fill="#71717A" />
    <rect x="26" y="36" width="4" height="14" rx="1" fill="#71717A" />
    <rect x="34" y="30" width="4" height="20" rx="1" fill="#71717A" opacity="0.4" />
    <rect x="42" y="22" width="4" height="28" rx="1" fill="#71717A" opacity="0.2" />
    <line x1="16" y1="46" x2="48" y2="18" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 20. Wireless Issue
export const WirelessIssueIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 24C26 18 38 18 46 24" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
    <path d="M23 30C28 26 36 26 41 30" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    <path d="M28 36C30 34 34 34 36 36" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="42" r="2" fill="#EF4444" />
  </svg>
);

// 21. Part Mismatch
export const PartMismatchIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="18" width="28" height="28" rx="4" stroke="#F59E0B" strokeWidth="2" fill="#18181B" />
    <path d="M24 24H40V40H24V24Z" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="2 2" />
    <path d="M32 28V34" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <circle cx="32" cy="37" r="1" fill="#F59E0B" />
  </svg>
);

// 22. Audio Faulty
export const AudioFaultyIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M18 26H24L32 18V46L24 38H18V26Z" stroke="#A1A1AA" strokeWidth="2" fill="#18181B" />
    <path d="M38 24L46 32L38 40" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M46 24L38 32L46 40" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 23. Auto Restart
export const AutoRestartIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 16C40.8366 16 48 23.1634 48 32C48 40.8366 40.8366 48 32 48C23.1634 48 16 40.8366 16 32C16 27.5 17.8 23.4 20.7 20.4" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 20H22V26" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 24. Missing Box
export const MissingBoxIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M32 12L50 20L32 28L14 20L32 12Z" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M14 20V42L32 50V28" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M50 20V42L32 50" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
    <path d="M32 26C32 24.5 33.2 23 35 23C36.8 23 38 24.5 38 26C38 27.5 37 28.5 35.5 29.5V31.5" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="35.5" cy="34" r="1" fill="#EF4444" />
  </svg>
);

// 25. Missing Charger
export const MissingChargerIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="24" width="20" height="26" rx="3" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 3" />
    <line x1="24" y1="16" x2="24" y2="24" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="2 2" />
    <line x1="32" y1="16" x2="32" y2="24" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="2 2" />
    <path d="M44 32C44 29.8 45.8 28 48 28C50.2 28 52 29.8 52 32C52 33.5 51.2 34.8 50 35.5V38" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="50" cy="40.5" r="1.2" fill="#EF4444" />
  </svg>
);

// 26. Missing Docs
export const MissingDocsIllustration: React.FC = () => (
  <svg viewBox="0 0 64 64" className="w-12 h-12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="10" width="28" height="38" rx="2" stroke="#EF4444" strokeWidth="1.5" strokeDasharray="3 2" fill="#18181B" fillOpacity="0.5" />
    <line x1="19" y1="20" x2="37" y2="20" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="19" y1="26" x2="33" y2="26" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round" />
    <line x1="19" y1="32" x2="35" y2="32" stroke="#71717A" strokeWidth="1.2" strokeLinecap="round" />
    <rect x="20" y="38" width="16" height="6" rx="1" stroke="#71717A" strokeWidth="1.2" />
    <path d="M44 38C44 35.8 45.8 34 48 34C50.2 34 52 35.8 52 38C52 39.5 51.2 40.8 50 41.5V44" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="50" cy="46.5" r="1.2" fill="#EF4444" />
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
  deviceType: 'phone' | 'watch' | 'tablet' = 'phone'
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
      case 'defect-camera-faulty':
        return <TabletFaultyLensIllustration />;
      case 'defect-battery-low':
        return <TabletLowBatteryIllustration />;
      case 'defect-battery-warning':
        return <TabletBatteryWarningIllustration />;
      case 'defect-critical-security':
        return <TabletFaultyBiometricsIllustration />;
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
