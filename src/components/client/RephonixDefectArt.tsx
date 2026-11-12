import React from 'react';

// =========================================================================================
// REPHONIX SIGNATURE HARDWARE DEFECT ARTWORK
// Bespoke Vector Device Art engineered with:
// - Modern curved edge-to-edge flagship chassis (subtle inner gradient, laser-cut speaker grill)
// - Rephonix Cobalt (#4F46E5), Emerald (#10B981) and Crimson accents (distinguishing from Cashify's flat 2D teal)
// - 3D depth lighting, frosted gradient glass reflection, realistic defect geometry
// =========================================================================================

// 1. Broken / Scratched Screen Glass
export const RephonixScreenScratchArt: React.FC<{ className?: string }> = ({ className = "w-28 h-32" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      {/* Chassis Shadow */}
      <filter id="rpx_chassis_shadow" x="14" y="6" width="72" height="110" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.08" />
      </filter>
      {/* Front Glass Gradient */}
      <linearGradient id="rpx_screen_glass_grad" x1="20" y1="10" x2="80" y2="110" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#F8FAFC" />
        <stop offset="100%" stopColor="#F1F5F9" />
      </linearGradient>
      {/* Glass Glare Sheen */}
      <linearGradient id="rpx_screen_glare" x1="20" y1="10" x2="70" y2="90" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
        <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.0" />
      </linearGradient>
    </defs>

    <g filter="url(#rpx_chassis_shadow)">
      {/* Smartphone Outer Titanium Frame */}
      <rect x="22" y="8" width="56" height="102" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="url(#rpx_screen_glass_grad)" />
      
      {/* Inner Screen Display Active Bezel */}
      <rect x="25" y="11" width="50" height="96" rx="11" stroke="#E2E8F0" strokeWidth="1" fill="#FFFFFF" />
      
      {/* Premium Glass Sheen Reflection */}
      <path d="M26 12C36 12 73 50 73 80L73 12Z" fill="url(#rpx_screen_glare)" />

      {/* Modern Dynamic Island Pill */}
      <rect x="42" y="14" width="16" height="4.5" rx="2.25" fill="#0F172A" />
      <circle cx="53" cy="16.25" r="1.2" fill="#1E293B" />
      
      {/* Clean Bottom Home Indicator Bar */}
      <rect x="42" y="101" width="16" height="2.5" rx="1.25" fill="#CBD5E1" />

      {/* Rephonix Precision Scratch Lines (Indigo/Amber Shimmer) */}
      <path d="M34 46L62 30" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M38 60L66 44" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M30 76L48 64" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M50 82L68 72" stroke="#6366F1" strokeWidth="1.8" strokeLinecap="round" />

      {/* Tiny Hairline Light Reflection Glint */}
      <circle cx="48" cy="38" r="1.5" fill="#F59E0B" opacity="0.8" />
      <circle cx="56" cy="50" r="1.2" fill="#6366F1" opacity="0.8" />
    </g>
  </svg>
);

// 2. Dead Spot / Visible line and Discoloration on screen
export const RephonixScreenLinesSpotsArt: React.FC<{ className?: string }> = ({ className = "w-28 h-32" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="rpx_lines_shadow" x="14" y="6" width="72" height="110" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.08" />
      </filter>
      {/* Vertical OLED Laser Glow Filters */}
      <linearGradient id="rpx_laser_emerald" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#10B981" />
        <stop offset="50%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="rpx_laser_crimson" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#F43F5E" />
        <stop offset="50%" stopColor="#FB7185" />
        <stop offset="100%" stopColor="#E11D48" />
      </linearGradient>
    </defs>

    <g filter="url(#rpx_lines_shadow)">
      {/* Smartphone Outer Titanium Frame */}
      <rect x="22" y="8" width="56" height="102" rx="14" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
      <rect x="25" y="11" width="50" height="96" rx="11" stroke="#E2E8F0" strokeWidth="1" fill="#FAFAFA" />

      {/* Modern Dynamic Island */}
      <rect x="42" y="14" width="16" height="4.5" rx="2.25" fill="#0F172A" />
      
      {/* Home Indicator */}
      <rect x="42" y="101" width="16" height="2.5" rx="1.25" fill="#CBD5E1" />

      {/* Vertical OLED Display Laser Lines */}
      {/* Vibrant Crimson Line */}
      <line x1="38" y1="12" x2="38" y2="106" stroke="url(#rpx_laser_crimson)" strokeWidth="2.8" strokeLinecap="round" />
      {/* Vibrant Electric Emerald Line */}
      <line x1="42" y1="12" x2="42" y2="106" stroke="url(#rpx_laser_emerald)" strokeWidth="1.8" strokeLinecap="round" />
      {/* Subtle Indigo Line */}
      <line x1="60" y1="12" x2="60" y2="106" stroke="#6366F1" strokeWidth="1.6" strokeLinecap="round" opacity="0.8" />

      {/* Subpixel Ink Bleed & Dead Pixel Blotches */}
      <circle cx="64" cy="40" r="4.5" fill="#0F172A" />
      <circle cx="69" cy="44" r="3" fill="#0F172A" />
      <circle cx="62" cy="74" r="5" fill="#0F172A" />
      <circle cx="58" cy="78" r="3.2" fill="#0F172A" />
      <circle cx="31" cy="78" r="3.5" fill="#4338CA" />

      {/* Screen Discoloration Warning Pill Marker */}
      <rect x="52" y="54" width="18" height="12" rx="3" fill="#FEF3C7" stroke="#F59E0B" strokeWidth="1" opacity="0.85" />
      <path d="M55 60H67" stroke="#D97706" strokeWidth="1.4" strokeLinecap="round" />
    </g>
  </svg>
);

// 3. Scratch / Dent on device body (3D Isometric Beveled Chassis View)
export const RephonixBodyDentArt: React.FC<{ className?: string }> = ({ className = "w-28 h-32" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="rpx_body_shadow" x="12" y="8" width="76" height="108" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.09" />
      </filter>
      {/* Rear Matte Frosted Glass Gradient */}
      <linearGradient id="rpx_rear_glass" x1="28" y1="14" x2="80" y2="108" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="50%" stopColor="#F8FAFC" />
        <stop offset="100%" stopColor="#E2E8F0" />
      </linearGradient>
      {/* Side Rail Titanium Gradient */}
      <linearGradient id="rpx_side_titanium" x1="20" y1="20" x2="28" y2="100" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#CBD5E1" />
        <stop offset="50%" stopColor="#94A3B8" />
        <stop offset="100%" stopColor="#64748B" />
      </linearGradient>
    </defs>

    <g filter="url(#rpx_body_shadow)">
      {/* 3D Side Rail Depth (Showing Chamfered Metal Edge on Left) */}
      <path d="M28 15C22 15 19 18 19 24V96C19 102 22 105 28 105V15Z" fill="url(#rpx_side_titanium)" stroke="#0F172A" strokeWidth="2.5" />
      
      {/* Main Back Panel (Smooth Curved Rectangle) */}
      <rect x="26" y="12" width="50" height="94" rx="13" stroke="#0F172A" strokeWidth="2.75" fill="url(#rpx_rear_glass)" />

      {/* Flagship Camera Island Bump */}
      <rect x="31" y="18" width="16" height="28" rx="6" stroke="#0F172A" strokeWidth="2" fill="#FFFFFF" />
      {/* Dual Camera Lenses with Blue Optical Anti-Reflective Coating */}
      <circle cx="39" cy="25" r="4.2" stroke="#0F172A" strokeWidth="1.8" fill="#1E293B" />
      <circle cx="39" cy="25" r="1.8" fill="#38BDF8" />
      <circle cx="39" cy="37" r="4.2" stroke="#0F172A" strokeWidth="1.8" fill="#1E293B" />
      <circle cx="39" cy="37" r="1.8" fill="#38BDF8" />
      {/* Flash LED */}
      <circle cx="43" cy="31" r="1.2" fill="#F59E0B" />

      {/* Body Scratches on Rear Glass (Modern Indigo & Amber Hairlines) */}
      <path d="M42 62L68 48" stroke="#6366F1" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M46 72L72 58" stroke="#6366F1" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M38 84L60 72" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" />

      {/* Rephonix Signature Dynamic Impact Arrow Pins */}
      {/* Left Rim Impact Pin */}
      <g>
        <path d="M10 50L17 50" stroke="#EF4444" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M14 46L17.5 50L14 54" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
      {/* Right Rim Impact Pin */}
      <g>
        <path d="M86 78L79 78" stroke="#EF4444" strokeWidth="2.6" strokeLinecap="round" />
        <path d="M82 74L78.5 78L82 82" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </g>
  </svg>
);

// 4. Device panel missing / broken (Side Profile with Loupe Inspection Callout)
export const RephonixPanelBrokenArt: React.FC<{ className?: string }> = ({ className = "w-28 h-32" }) => (
  <svg viewBox="0 0 100 120" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <filter id="rpx_panel_shadow" x="14" y="8" width="76" height="106" filterUnits="userSpaceOnUse">
        <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.08" />
      </filter>
      {/* Loupe Circle Gradient Glass */}
      <linearGradient id="rpx_loupe_glass" x1="44" y1="32" x2="74" y2="68" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="100%" stopColor="#F1F5F9" />
      </linearGradient>
    </defs>

    <g filter="url(#rpx_panel_shadow)">
      {/* Side Profile Chassis Frame */}
      <rect x="25" y="14" width="8" height="92" rx="4" stroke="#0F172A" strokeWidth="2.75" fill="#FFFFFF" />
      
      {/* Volume Buttons & Action Button on Side Rail */}
      <rect x="27.5" y="24" width="3" height="8" rx="1.5" fill="#4F46E5" />
      <rect x="27.5" y="36" width="3" height="14" rx="1.5" fill="#4F46E5" />
      <rect x="27.5" y="54" width="3" height="14" rx="1.5" fill="#4F46E5" />

      {/* Target Inspection Lines connecting chassis seam to the Loupe */}
      <line x1="33" y1="50" x2="44" y2="44" stroke="#94A3B8" strokeWidth="1.6" strokeDasharray="2.5 2" />
      <line x1="33" y1="58" x2="44" y2="62" stroke="#94A3B8" strokeWidth="1.6" strokeDasharray="2.5 2" />

      {/* Inspection Loupe / Precision Diagnostic Reticle */}
      <circle cx="58" cy="52" r="20" stroke="#0F172A" strokeWidth="2.8" fill="url(#rpx_loupe_glass)" />
      
      {/* Inner Diagnostic Crosshair & Cracked Seam */}
      {/* Loupe Rim Accent Ring */}
      <circle cx="58" cy="52" r="16.5" stroke="#E2E8F0" strokeWidth="1.2" strokeDasharray="2 2" />
      
      {/* Seam Separation / Fractured Glass Fracture Inside Loupe */}
      <path d="M48 40L58 52L68 64" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M58 52L52 62" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" />
      <path d="M58 52L64 42" stroke="#EF4444" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="58" cy="52" r="2.5" fill="#EF4444" />
      
      {/* Warning Defect Indicator Tag */}
      <rect x="68" y="34" width="7" height="7" rx="3.5" fill="#EF4444" />
    </g>
  </svg>
);

