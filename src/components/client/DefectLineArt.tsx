import React from 'react';

// Line Art 1: Screen with Surface Scratches / Micro-hairline wear
export const ScreenScratchesArt: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Smartphone Outline */}
    <rect x="14" y="6" width="20" height="36" rx="3.5" stroke="#1E293B" strokeWidth="1.75" fill="#FFFFFF" />
    <path d="M21 9H27" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    {/* Scratch Lines */}
    <line x1="18" y1="18" x2="28" y2="23" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="20" y1="28" x2="29" y2="25" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="19" y1="35" x2="25" y2="38" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// Line Art 2: Screen with Cracked Glass (Spiderweb Fracture)
export const ScreenCrackedArt: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="6" width="20" height="36" rx="3.5" stroke="#1E293B" strokeWidth="1.75" fill="#FFFFFF" />
    <path d="M21 9H27" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    {/* Spiderweb Fracture from center-right */}
    <path d="M26 22L20 16L18 17" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M26 22L31 16L33 13" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M26 22L24 30L21 34L23 40" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M26 22L32 25L33 30" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="26" cy="22" r="1.5" fill="#EF4444" />
  </svg>
);

// Line Art 3: Screen Chipped / Corner Edge Nick
export const ScreenChippedArt: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="6" width="20" height="36" rx="3.5" stroke="#1E293B" strokeWidth="1.75" fill="#FFFFFF" />
    <path d="M21 9H27" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    {/* Corner bevel chip */}
    <path d="M14 12L18 6" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" />
    <path d="M16 11L19 14" stroke="#EF4444" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M14 15L17 18" stroke="#EF4444" strokeWidth="1" strokeLinecap="round" />
  </svg>
);

// Line Art 4: Screen with Dead Spots / Pixel Bleed
export const ScreenDeadSpotsArt: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="6" width="20" height="36" rx="3.5" stroke="#1E293B" strokeWidth="1.75" fill="#FFFFFF" />
    <path d="M21 9H27" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    {/* Ink Blotches / Spots */}
    <circle cx="22" cy="22" r="3" fill="#0F172A" />
    <circle cx="27" cy="18" r="1.8" fill="#0F172A" />
    <circle cx="25" cy="32" r="2.2" fill="#0F172A" />
    <circle cx="30" cy="26" r="1.5" fill="#EF4444" />
  </svg>
);

// Line Art 5: Screen with Vertical / Horizontal Laser Lines
export const ScreenLinesArt: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="6" width="20" height="36" rx="3.5" stroke="#1E293B" strokeWidth="1.75" fill="#FFFFFF" />
    <path d="M21 9H27" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    {/* Laser Lines on display */}
    <line x1="22" y1="7" x2="22" y2="41" stroke="#EF4444" strokeWidth="1.75" />
    <line x1="26" y1="7" x2="26" y2="41" stroke="#10B981" strokeWidth="1.2" />
  </svg>
);

// Line Art 6: Screen Discoloration / Yellow Tint / Burn-in
export const ScreenDiscolorArt: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="6" width="20" height="36" rx="3.5" stroke="#1E293B" strokeWidth="1.75" fill="#FFFFFF" />
    <path d="M21 9H27" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
    {/* Shaded burn-in gradient area */}
    <rect x="16" y="14" width="16" height="20" rx="2" fill="#FEF3C7" opacity="0.8" />
    <path d="M19 19H29M19 24H26M19 29H24" stroke="#D97706" strokeWidth="1.2" strokeLinecap="round" opacity="0.6" />
  </svg>
);

// Line Art 7: Body Scratches / Paint Wear
export const BodyScratchesArt: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Phone rear view with camera bump */}
    <rect x="14" y="6" width="20" height="36" rx="3.5" stroke="#1E293B" strokeWidth="1.75" fill="#FFFFFF" />
    <rect x="16" y="8" width="6" height="8" rx="1.5" stroke="#1E293B" strokeWidth="1.2" fill="#F1F5F9" />
    <circle cx="19" cy="11" r="1.2" fill="#1E293B" />
    <circle cx="19" cy="14" r="1.2" fill="#1E293B" />
    {/* Body scuffs & scratches */}
    <line x1="24" y1="20" x2="31" y2="24" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="22" y1="28" x2="30" y2="30" stroke="#F59E0B" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="17" y1="36" x2="23" y2="38" stroke="#F59E0B" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

// Line Art 8: Body Dents (Chassis Rim Inward Dents)
export const BodyDentsArt: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Frame with impact indent on left rim */}
    <path d="M14 10C14 7.8 15.8 6 18 6H30C32.2 6 34 7.8 34 10V38C34 40.2 32.2 42 30 42H18C15.8 42 14 40.2 14 38V27C16.5 25.5 16.5 22.5 14 21V10Z" stroke="#EF4444" strokeWidth="1.75" fill="#FFFFFF" />
    {/* Impact arrows */}
    <path d="M9 24H12.5" stroke="#EF4444" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M11 22L13 24L11 26" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Line Art 9: Cracked Back Panel / Glass
export const BackPanelCrackedArt: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="6" width="20" height="36" rx="3.5" stroke="#1E293B" strokeWidth="1.75" fill="#FFFFFF" />
    <rect x="16" y="8" width="6" height="8" rx="1.5" stroke="#1E293B" strokeWidth="1.2" fill="#F1F5F9" />
    {/* Shattered rear glass lines */}
    <path d="M24 24L16 18L14 20" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M24 24L32 18L34 22" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M24 24L26 34L22 41" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M24 24L32 29L34 35" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" />
    <circle cx="24" cy="24" r="1.5" fill="#EF4444" />
  </svg>
);

// Line Art 10: Device Bent / Curved Frame
export const DeviceBentArt: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Side profile of warped/bent phone */}
    <path d="M18 8C20 18 20 30 18 40" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
    <path d="M22 8C24 18 24 30 22 40" stroke="#1E293B" strokeWidth="1.5" strokeLinecap="round" />
    {/* Curvature indicator arrows */}
    <path d="M28 20L25 24L28 28" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M33 24H26" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

// Line Art 11: Loose Screen (Seam gap between display and body)
export const ScreenLooseArt: React.FC<{ className?: string }> = ({ className = "w-10 h-10" }) => (
  <svg viewBox="0 0 48 48" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="14" y="6" width="20" height="36" rx="3.5" stroke="#1E293B" strokeWidth="1.75" fill="#FFFFFF" />
    {/* Gap / lifting display on top right */}
    <path d="M34 12L38 10L36 22" stroke="#EF4444" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    <line x1="33" y1="16" x2="38" y2="16" stroke="#EF4444" strokeWidth="1.2" strokeDasharray="1.5 1.5" />
    <circle cx="36" cy="11" r="1" fill="#EF4444" />
  </svg>
);

