import React from 'react';

// =========================================================================================
// PROFESSIONAL LINE ART DESIGN SYSTEM: REPHONIX HARDWARE DEFECT SPECIFICATIONS
// Built in strict accordance with the professional-line-art skill:
// - 3-tier stroke hierarchy (2.75px outer chassis, 1.5px internal contours, 1.2-1.5px details)
// - Concentric corner radii math (Outer rx="14" -> Inner rx="11")
// - 45-degree frosted glass glare & subtle ambient depth shadows
// - Defect-accurate geometry distinguishing minor, major, lines, bleed & structural warp
// =========================================================================================

// ==========================================
// 1. STAGE 2A: SCREEN GLASS PHYSICAL WEAR
// ==========================================

// 1.1 Screen Cracked / Spiderweb Glass Fracture
export const ScreenCrackedArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cracked_glass_glare" x1="20" y1="10" x2="80" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
        <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.0" />
      </linearGradient>
    </defs>
    {/* Chassis Frame */}
    <rect x="22" y="8" width="56" height="102" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    <rect x="25" y="11" width="50" height="96" rx="11" stroke="#E2E8F0" strokeWidth="1" fill="#FAFAFA" />
    <path d="M26 12C36 12 73 50 73 80L73 12Z" fill="url(#cracked_glass_glare)" />
    
    {/* Dynamic Island & Indicator */}
    <rect x="42" y="14" width="16" height="4.5" rx="2.25" fill="#0F172A" />
    <rect x="42" y="101" width="16" height="2.5" rx="1.25" fill="#CBD5E1" />

    {/* Spiderweb Impact Point */}
    <circle cx="56" cy="48" r="3" fill="#EF4444" />
    <circle cx="56" cy="48" r="7" stroke="#EF4444" strokeWidth="1.2" strokeDasharray="2 2" />
    
    {/* Severe Fracture Radiating Lines */}
    <path d="M56 48L32 30L26 34" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M56 48L72 26L74 16" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M56 48L44 70L38 88L42 102" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M56 48L74 64L73 80" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M38 40L48 35" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M64 42L70 48" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round" />
    <path d="M46 60L54 66" stroke="#EF4444" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

// 1.2 Screen Chipped Corner or Edge Nick
export const ScreenChippedArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="8" width="56" height="102" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    <rect x="25" y="11" width="50" height="96" rx="11" stroke="#E2E8F0" strokeWidth="1" fill="#FAFAFA" />
    
    {/* Dynamic Island */}
    <rect x="42" y="14" width="16" height="4.5" rx="2.25" fill="#0F172A" />
    <rect x="42" y="101" width="16" height="2.5" rx="1.25" fill="#CBD5E1" />

    {/* Top-Left Corner Glass Chip Detail */}
    <path d="M22 28L36 8" stroke="#EF4444" strokeWidth="3.2" strokeLinecap="round" />
    <path d="M27 26L36 17" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <path d="M22 36L30 28" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" />
    <circle cx="32" cy="22" r="2" fill="#EF4444" />
    
    {/* Micro-chip Callout Indicator */}
    <circle cx="30" cy="20" r="10" stroke="#EF4444" strokeWidth="1.4" strokeDasharray="2 2" />
  </svg>
);

// 1.3 Screen Scratches Major (>2 deep scratches)
export const ScreenScratchesMajorArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="8" width="56" height="102" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    <rect x="25" y="11" width="50" height="96" rx="11" stroke="#E2E8F0" strokeWidth="1" fill="#FAFAFA" />
    
    <rect x="42" y="14" width="16" height="4.5" rx="2.25" fill="#0F172A" />
    <rect x="42" y="101" width="16" height="2.5" rx="1.25" fill="#CBD5E1" />

    {/* Multiple prominent scratches across display */}
    <path d="M32 44L66 26" stroke="#4F46E5" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M36 58L70 40" stroke="#4F46E5" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M28 76L52 62" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <path d="M46 86L68 74" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    
    {/* Scratch intensity markers */}
    <circle cx="48" cy="35" r="1.5" fill="#4F46E5" />
    <circle cx="54" cy="48" r="1.5" fill="#4F46E5" />
  </svg>
);

// 1.4 Screen Scratches Minor (1-2 hairline scratches)
export const ScreenScratchesMinorArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="8" width="56" height="102" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    <rect x="25" y="11" width="50" height="96" rx="11" stroke="#E2E8F0" strokeWidth="1" fill="#FAFAFA" />
    
    <rect x="42" y="14" width="16" height="4.5" rx="2.25" fill="#0F172A" />
    <rect x="42" y="101" width="16" height="2.5" rx="1.25" fill="#CBD5E1" />

    {/* Isolated light hairline scratch */}
    <path d="M38 52L62 40" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M44 64L58 56" stroke="#4F46E5" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="4 2" />
  </svg>
);

// Alias for generic ScreenScratchesArt backwards-compatibility
export const ScreenScratchesArt = ScreenScratchesMajorArt;

// ==========================================
// 2. STAGE 2B: DISPLAY PANEL DIAGNOSTICS
// ==========================================

// 2.1 Heavy / Large Dead Spots (Severe Ink Bleed)
export const ScreenSpotsHeavyArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="8" width="56" height="102" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    <rect x="25" y="11" width="50" height="96" rx="11" stroke="#E2E8F0" strokeWidth="1" fill="#FAFAFA" />
    <rect x="42" y="14" width="16" height="4.5" rx="2.25" fill="#0F172A" />
    
    {/* Large organic ink bleed blotches with halo rings */}
    <circle cx="48" cy="48" r="8" fill="#0F172A" />
    <circle cx="56" cy="52" r="5" fill="#0F172A" />
    <circle cx="46" cy="56" r="4.5" fill="#0F172A" />
    <circle cx="48" cy="48" r="11" stroke="#4F46E5" strokeWidth="1.2" strokeDasharray="2 2" opacity="0.6" />
    
    {/* Secondary Bleed Cluster */}
    <circle cx="62" cy="78" r="6" fill="#0F172A" />
    <circle cx="67" cy="80" r="3.5" fill="#0F172A" />
  </svg>
);

// 2.2 Multiple Minor Spots (3 or more spots)
export const ScreenSpotsMultiArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="8" width="56" height="102" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    <rect x="25" y="11" width="50" height="96" rx="11" stroke="#E2E8F0" strokeWidth="1" fill="#FAFAFA" />
    <rect x="42" y="14" width="16" height="4.5" rx="2.25" fill="#0F172A" />
    
    {/* 4 scattered small dead pixel spots */}
    <circle cx="36" cy="38" r="3.2" fill="#0F172A" />
    <circle cx="64" cy="46" r="3.2" fill="#0F172A" />
    <circle cx="44" cy="74" r="3.5" fill="#0F172A" />
    <circle cx="60" cy="84" r="2.8" fill="#0F172A" />
    <circle cx="34" cy="88" r="2.2" fill="#EF4444" />
  </svg>
);

// 2.3 1-2 Minor Spots on Screen
export const ScreenSpotsMinorArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="8" width="56" height="102" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    <rect x="25" y="11" width="50" height="96" rx="11" stroke="#E2E8F0" strokeWidth="1" fill="#FAFAFA" />
    <rect x="42" y="14" width="16" height="4.5" rx="2.25" fill="#0F172A" />
    
    {/* Only 2 pinpoint dead pixels */}
    <circle cx="48" cy="52" r="3" fill="#0F172A" />
    <circle cx="58" cy="68" r="2.4" fill="#0F172A" />
  </svg>
);

// Generic dead spot line art export
export const ScreenDeadSpotsArt = ScreenSpotsMultiArt;

// 2.4 Visible Lines on Screen (OLED Laser Defect)
export const ScreenLinesArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="8" width="56" height="102" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    <rect x="25" y="11" width="50" height="96" rx="11" stroke="#E2E8F0" strokeWidth="1" fill="#FAFAFA" />
    <rect x="42" y="14" width="16" height="4.5" rx="2.25" fill="#0F172A" />
    
    {/* Vertical OLED Lines */}
    <line x1="40" y1="12" x2="40" y2="106" stroke="#EF4444" strokeWidth="2.8" strokeLinecap="round" />
    <line x1="44" y1="12" x2="44" y2="106" stroke="#10B981" strokeWidth="1.8" strokeLinecap="round" />
    <line x1="60" y1="12" x2="60" y2="106" stroke="#4F46E5" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />
  </svg>
);

// 2.5 Screen Shading / Display Faded Along Edges
export const ScreenShadingArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="edge_shading_vignette" x1="25" y1="11" x2="75" y2="107" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#4338CA" stopOpacity="0.25" />
        <stop offset="35%" stopColor="#FFFFFF" stopOpacity="0.0" />
        <stop offset="65%" stopColor="#FFFFFF" stopOpacity="0.0" />
        <stop offset="100%" stopColor="#4338CA" stopOpacity="0.25" />
      </linearGradient>
    </defs>
    <rect x="22" y="8" width="56" height="102" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    <rect x="25" y="11" width="50" height="96" rx="11" stroke="#E2E8F0" strokeWidth="1" fill="url(#edge_shading_vignette)" />
    <rect x="42" y="14" width="16" height="4.5" rx="2.25" fill="#0F172A" />
    
    {/* Vignette edge indicator strokes */}
    <path d="M26 24V14H36" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
    <path d="M64 14H74V24" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
    <path d="M26 94V104H36" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
    <path d="M64 104H74V94" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 2.6 Major Discoloration / Burn-In
export const ScreenDiscolorMajorArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="8" width="56" height="102" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    <rect x="25" y="11" width="50" height="96" rx="11" stroke="#E2E8F0" strokeWidth="1" fill="#FAFAFA" />
    <rect x="42" y="14" width="16" height="4.5" rx="2.25" fill="#0F172A" />

    {/* Severe OLED Ghosting / Keyboard Burn-in Pattern */}
    <rect x="30" y="34" width="40" height="52" rx="6" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1.2" opacity="0.85" />
    <path d="M34 46H66M34 56H66M34 66H66M34 76H56" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" opacity="0.75" />
  </svg>
);

// 2.7 Minor Discoloration / Yellow Tint
export const ScreenDiscolorMinorArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="22" y="8" width="56" height="102" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    <rect x="25" y="11" width="50" height="96" rx="11" stroke="#E2E8F0" strokeWidth="1" fill="#FAFAFA" />
    <rect x="42" y="14" width="16" height="4.5" rx="2.25" fill="#0F172A" />

    {/* Subtle yellowish warm tone patch */}
    <rect x="34" y="44" width="32" height="34" rx="4" fill="#FEF3C7" opacity="0.6" />
    <path d="M38 56H62M38 66H54" stroke="#D97706" strokeWidth="1.4" strokeLinecap="round" opacity="0.45" />
  </svg>
);

export const ScreenDiscolorArt = ScreenDiscolorMajorArt;

// ==========================================
// 3. STAGE 3A: BODY SCRATCHES & DENTS
// ==========================================

// 3.1 Body Scratches Major (>2 deep scratches)
export const BodyScratchesMajorArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Smartphone Rear View with Camera Island */}
    <rect x="24" y="10" width="52" height="98" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    
    {/* Camera Island Bump */}
    <rect x="29" y="16" width="16" height="26" rx="6" stroke="#0F172A" strokeWidth="1.8" fill="#F1F5F9" />
    <circle cx="37" cy="23" r="3.8" stroke="#0F172A" strokeWidth="1.6" fill="#1E293B" />
    <circle cx="37" cy="35" r="3.8" stroke="#0F172A" strokeWidth="1.6" fill="#1E293B" />

    {/* Multiple heavy body scratch lines */}
    <path d="M42 56L70 42" stroke="#4F46E5" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M36 70L66 54" stroke="#4F46E5" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M46 84L68 72" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
    <path d="M32 94L54 82" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 3.2 Body Scratches Minor (1-2 hairline scratches)
export const BodyScratchesMinorArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="24" y="10" width="52" height="98" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    <rect x="29" y="16" width="16" height="26" rx="6" stroke="#0F172A" strokeWidth="1.8" fill="#F1F5F9" />
    <circle cx="37" cy="23" r="3.8" stroke="#0F172A" strokeWidth="1.6" fill="#1E293B" />
    <circle cx="37" cy="35" r="3.8" stroke="#0F172A" strokeWidth="1.6" fill="#1E293B" />

    {/* Subtle 1-2 minor hairline scuffs */}
    <path d="M44 62L64 52" stroke="#4F46E5" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M48 74L62 66" stroke="#4F46E5" strokeWidth="1.4" strokeLinecap="round" strokeDasharray="3 2" />
  </svg>
);

export const BodyScratchesArt = BodyScratchesMajorArt;

// 3.3 Body Dents Major (>2 dents or deep drop indent)
export const BodyDentsMajorArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Frame with heavy indent deformed rim on left */}
    <path d="M28 12C28 12 28 42 22 54C28 66 28 96 28 96C28 102 33 106 39 106H65C71 106 76 101 76 95V23C76 17 71 12 65 12H39C33 12 28 12 28 12Z" stroke="#EF4444" strokeWidth="2.75" fill="#FFFFFF" />
    
    <rect x="33" y="18" width="16" height="26" rx="6" stroke="#0F172A" strokeWidth="1.8" fill="#F1F5F9" />
    <circle cx="41" cy="25" r="3.8" fill="#1E293B" />
    <circle cx="41" cy="37" r="3.8" fill="#1E293B" />

    {/* Multiple sharp inward impact arrows */}
    <path d="M12 54H20" stroke="#EF4444" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M17 50L20.5 54L17 58" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

    <path d="M84 76H76" stroke="#EF4444" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M79 72L75.5 76L79 80" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 3.4 Body Dents Minor (1-2 minor rim drop marks)
export const BodyDentsMinorArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="24" y="10" width="52" height="98" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    <rect x="29" y="16" width="16" height="26" rx="6" stroke="#0F172A" strokeWidth="1.8" fill="#F1F5F9" />
    <circle cx="37" cy="23" r="3.8" fill="#1E293B" />
    <circle cx="37" cy="35" r="3.8" fill="#1E293B" />

    {/* Single subtle corner impact arrow */}
    <path d="M14 86L22 86" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" />
    <path d="M19 82L22.5 86L19 90" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="25" cy="86" r="3" fill="#EF4444" />
  </svg>
);

export const BodyDentsArt = BodyDentsMajorArt;

// ==========================================
// 4. STAGE 3B: BACK PANEL & CHASSIS STRUCTURE
// ==========================================

// 4.1 Cracked / Broken Side or Back Panel
export const BackPanelCrackedArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="24" y="10" width="52" height="98" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    <rect x="29" y="16" width="16" height="26" rx="6" stroke="#0F172A" strokeWidth="1.8" fill="#F1F5F9" />
    <circle cx="37" cy="23" r="3.8" fill="#1E293B" />
    <circle cx="37" cy="35" r="3.8" fill="#1E293B" />

    {/* Rear shattered glass web lines */}
    <circle cx="50" cy="62" r="3" fill="#EF4444" />
    <path d="M50 62L30 46L24 50" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M50 62L70 46L76 52" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M50 62L54 86L46 102" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" />
    <path d="M50 62L72 74L76 86" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 4.2 Missing Back Panel
export const BackPanelMissingArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Frame with dashed back panel area representing missing component */}
    <rect x="24" y="10" width="52" height="98" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#F8FAFC" />
    <rect x="28" y="14" width="44" height="90" rx="10" stroke="#EF4444" strokeWidth="2" strokeDasharray="4 3" fill="#FEF2F2" />
    
    {/* Exposed internal battery/motherboard outline */}
    <rect x="34" y="46" width="32" height="42" rx="4" stroke="#94A3B8" strokeWidth="1.6" fill="#FFFFFF" />
    <text x="50" y="70" textAnchor="middle" fill="#EF4444" fontSize="12" fontWeight="bold">MISSING</text>
  </svg>
);

// 4.3 Bent / Curved Phone Body
export const DeviceBentArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Curved side profile */}
    <path d="M38 16C50 44 50 76 38 104" stroke="#EF4444" strokeWidth="4" strokeLinecap="round" />
    <path d="M46 16C58 44 58 76 46 104" stroke="#0F172A" strokeWidth="2.8" strokeLinecap="round" />
    
    {/* Deflection / Warp curvature force arrows */}
    <path d="M72 60H56" stroke="#EF4444" strokeWidth="2.6" strokeLinecap="round" />
    <path d="M62 54L55 60L62 66" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 4.4 Loose Screen (Seam gap between display and body)
export const ScreenLooseArt: React.FC<{ className?: string }> = ({ className = "w-14 h-18 sm:w-16 sm:h-20" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="24" y="10" width="52" height="98" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
    
    {/* Lifting screen edge on top right */}
    <path d="M66 24L78 16L74 42" stroke="#EF4444" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="60" y1="28" x2="74" y2="28" stroke="#EF4444" strokeWidth="2" strokeDasharray="2 2" />
    <circle cx="76" cy="18" r="2" fill="#EF4444" />
    
    {/* Separation arrows */}
    <path d="M74 34L82 30" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M80 27L83 30L78 33" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
