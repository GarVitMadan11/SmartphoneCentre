import React, { useState, useMemo, useRef, useEffect } from 'react';
import { BRANDS as STATIC_BRANDS, MODELS as STATIC_MODELS, Model, Brand, Variant, generateVariantsForModel, getDeviceImage } from '../../data/mockDatabase';
import { Search, ChevronRight, Smartphone, Calendar, Layers, ShieldCheck, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  siApple, siSamsung, siXiaomi, siVivo, siOneplus, siGoogle,
} from 'simple-icons';

export interface ColorSpec {
  gradient: string;
  accentColor: string;
  textColorClass: string;
  logoColor: string;
  borderColor: string;
  filter: string;
}

export function getColorTheme(colorName: string): ColorSpec {
  const name = colorName.toLowerCase();
  
  if (name.includes('natural titanium')) {
    return {
      gradient: 'linear-gradient(180deg, #A69F96 0%, #B8B1A7 50%, #8C867E 100%)',
      accentColor: '#7C756E',
      textColorClass: 'text-stone-955/20',
      logoColor: 'rgba(28,25,23,0.15)',
      borderColor: '#8C867E',
      filter: 'sepia(0.2) saturate(0.55) brightness(0.92) contrast(1.05)',
    };
  }
  if (name.includes('black titanium')) {
    return {
      gradient: 'linear-gradient(180deg, #2C2C2E 0%, #3A3A3C 50%, #1C1C1E 100%)',
      accentColor: '#111111',
      textColorClass: 'text-white/10',
      logoColor: 'rgba(255,255,255,0.08)',
      borderColor: '#1C1C1E',
      filter: 'brightness(0.38) contrast(1.15) grayscale(1)',
    };
  }
  if (name.includes('white titanium') || name.includes('awesome white')) {
    return {
      gradient: 'linear-gradient(180deg, #F2F1ED 0%, #FBFBFA 50%, #E5E4DF 100%)',
      accentColor: '#D1CFCA',
      textColorClass: 'text-stone-900/20',
      logoColor: 'rgba(0,0,0,0.1)',
      borderColor: '#D1CFCA',
      filter: 'brightness(1.12) contrast(0.95) grayscale(1)',
    };
  }
  if (name.includes('desert titanium')) {
    return {
      gradient: 'linear-gradient(180deg, #D4C4B7 0%, #DFD1C4 50%, #C0AEA0 100%)',
      accentColor: '#9C897C',
      textColorClass: 'text-stone-900/25',
      logoColor: 'rgba(67,56,48,0.15)',
      borderColor: '#C0AEA0',
      filter: 'sepia(0.35) saturate(0.68) brightness(1.02) contrast(1.02)',
    };
  }
  if (name.includes('space gray')) {
    return {
      gradient: 'linear-gradient(180deg, #4B4E52 0%, #5D6065 50%, #3B3D40 100%)',
      accentColor: '#2D2E30',
      textColorClass: 'text-white/10',
      logoColor: 'rgba(255,255,255,0.1)',
      borderColor: '#3B3D40',
      filter: 'brightness(0.55) contrast(1.08) grayscale(1)',
    };
  }
  if (name.includes('silver') || name.includes('marble gray') || name.includes('phantom silver')) {
    return {
      gradient: 'linear-gradient(180deg, #E3E4E6 0%, #F1F2F4 50%, #CACBCE 100%)',
      accentColor: '#9FA2A6',
      textColorClass: 'text-stone-900/20',
      logoColor: 'rgba(0,0,0,0.12)',
      borderColor: '#CACBCE',
      filter: 'brightness(1.05) contrast(1) grayscale(1)',
    };
  }
  if (name.includes('gold')) {
    return {
      gradient: 'linear-gradient(180deg, #F7D8B5 0%, #FAEAD4 50%, #E3BE92 100%)',
      accentColor: '#B09571',
      textColorClass: 'text-amber-900/20',
      logoColor: 'rgba(120,80,30,0.15)',
      borderColor: '#E3BE92',
      filter: 'sepia(0.5) saturate(1.25) brightness(1.02) contrast(1)',
    };
  }
  if (name.includes('midnight green')) {
    return {
      gradient: 'linear-gradient(180deg, #4E5851 0%, #5C675F 50%, #3D4540 100%)',
      accentColor: '#2C322E',
      textColorClass: 'text-white/10',
      logoColor: 'rgba(255,255,255,0.08)',
      borderColor: '#3D4540',
      filter: 'hue-rotate(85deg) saturate(0.52) brightness(0.6) contrast(1.1)',
    };
  }
  if (name.includes('midnight') || name.includes('obsidian black') || name.includes('phantom black') || name.includes('awesome black') || name.includes('obsidian')) {
    return {
      gradient: 'linear-gradient(180deg, #1B2228 0%, #242D35 50%, #0F1418 100%)',
      accentColor: '#090C0E',
      textColorClass: 'text-white/10',
      logoColor: 'rgba(255,255,255,0.08)',
      borderColor: '#0F1418',
      filter: 'hue-rotate(185deg) saturate(0.38) brightness(0.36) contrast(1.15)',
    };
  }
  if (name.includes('starlight') || name.includes('porcelain') || name.includes('cream')) {
    return {
      gradient: 'linear-gradient(180deg, #FAF6F0 0%, #FCFAF5 50%, #F0E9DF 100%)',
      accentColor: '#DCD4C9',
      textColorClass: 'text-stone-900/20',
      logoColor: 'rgba(0,0,0,0.1)',
      borderColor: '#F0E9DF',
      filter: 'sepia(0.12) saturate(0.48) brightness(1.1) contrast(0.98)',
    };
  }
  if (name.includes('red') || name.includes('coral')) {
    return {
      gradient: 'linear-gradient(180deg, #BA0C13 0%, #DC1C24 50%, #99060B 100%)',
      accentColor: '#780307',
      textColorClass: 'text-white/20',
      logoColor: 'rgba(255,255,255,0.18)',
      borderColor: '#99060B',
      filter: 'hue-rotate(342deg) saturate(2.4) brightness(0.85) contrast(1.18)',
    };
  }
  if (name.includes('purple') || name.includes('violet') || name.includes('lavender') || name.includes('cobalt violet') || name.includes('phantom violet') || name.includes('awesome violet')) {
    return {
      gradient: 'linear-gradient(180deg, #5A556B 0%, #6D6881 50%, #474355 100%)',
      accentColor: '#363340',
      textColorClass: 'text-white/15',
      logoColor: 'rgba(255,255,255,0.1)',
      borderColor: '#474355',
      filter: 'hue-rotate(245deg) saturate(0.78) brightness(0.78) contrast(1.05)',
    };
  }
  if (name.includes('pink')) {
    return {
      gradient: 'linear-gradient(180deg, #F5C7D1 0%, #FAD3DC 50%, #EAA8B6 100%)',
      accentColor: '#C48190',
      textColorClass: 'text-pink-900/20',
      logoColor: 'rgba(120,40,60,0.15)',
      borderColor: '#EAA8B6',
      filter: 'hue-rotate(315deg) saturate(0.85) brightness(1.08) contrast(0.95)',
    };
  }
  if (name.includes('yellow') || name.includes('titanium yellow')) {
    return {
      gradient: 'linear-gradient(180deg, #FCEEAC 0%, #FFF5C7 50%, #F1DE85 100%)',
      accentColor: '#C7B458',
      textColorClass: 'text-yellow-950/20',
      logoColor: 'rgba(100,80,20,0.15)',
      borderColor: '#F1DE85',
      filter: 'hue-rotate(15deg) saturate(1.25) brightness(1.08) contrast(1)',
    };
  }
  if (name.includes('green') || name.includes('hazel') || name.includes('sage')) {
    return {
      gradient: 'linear-gradient(180deg, #CBE8D7 0%, #D5F0E1 50%, #B0D5BE 100%)',
      accentColor: '#8BB098',
      textColorClass: 'text-emerald-950/20',
      logoColor: 'rgba(20,80,40,0.12)',
      borderColor: '#B0D5BE',
      filter: 'hue-rotate(95deg) saturate(0.78) brightness(1.02) contrast(0.98)',
    };
  }
  if (name.includes('blue') || name.includes('awesome blue')) {
    return {
      gradient: 'linear-gradient(180deg, #C4DEF2 0%, #D3E9F8 50%, #A9C8E3 100%)',
      accentColor: '#80A2BE',
      textColorClass: 'text-blue-950/20',
      logoColor: 'rgba(20,50,90,0.12)',
      borderColor: '#A9C8E3',
      filter: 'hue-rotate(185deg) saturate(0.88) brightness(1.05) contrast(0.95)',
    };
  }
  if (name.includes('bespoke') || name.includes('copper') || name.includes('bronze')) {
    return {
      gradient: 'linear-gradient(180deg, #E2A684 0%, #EDB696 50%, #CB8B6A 100%)',
      accentColor: '#A26544',
      textColorClass: 'text-stone-900/20',
      logoColor: 'rgba(0,0,0,0.1)',
      borderColor: '#CB8B6A',
      filter: 'sepia(0.35) saturate(0.75) brightness(0.95) contrast(1.05)',
    };
  }
  
  return {
    gradient: 'linear-gradient(180deg, #D5D8DC 0%, #E5E8EB 50%, #AEB6BF 100%)',
    accentColor: '#8F969E',
    textColorClass: 'text-stone-900/20',
    logoColor: 'rgba(0,0,0,0.1)',
    borderColor: '#AEB6BF',
    filter: 'brightness(1.02) contrast(1) grayscale(1)',
  };
}

export const PhoneBackPreview: React.FC<{
  brandId: string;
  modelName: string;
  colorName: string;
  modelId?: string;
  customImageUrl?: string;
}> = ({ brandId, modelName, colorName, modelId, customImageUrl }) => {
  const theme = useMemo(() => getColorTheme(colorName), [colorName]);

  const id = (modelId || '').toLowerCase();
  const name = modelName.toLowerCase();

  const officialImgUrl = useMemo(() => {
    if (customImageUrl && customImageUrl.trim().length > 0) {
      return customImageUrl.trim();
    }
    if (modelId) {
      return getDeviceImage(modelId, brandId);
    }
    return '';
  }, [modelId, brandId, customImageUrl]);

  // Check if we have a crawled or custom image URL (starts with http or data:)
  const hasOfficialImg = officialImgUrl && (officialImgUrl.startsWith('http') || officialImgUrl.startsWith('data:'));

  // 1. Determine Phone shape, aspect ratio and roundedness
  let chassisClass = "w-32 h-56 rounded-[22px]"; 
  
  const isFold = id.includes('fold');
  const isFlip = id.includes('flip');
  const isUltra = name.includes('ultra') || id.includes('u');
  const isAir = name.includes('air') || name.includes('slim');

  if (isFold) {
    chassisClass = "w-24 h-56 rounded-[14px]";
  } else if (isFlip) {
    chassisClass = "w-32 h-36 rounded-[18px]";
  } else if (isUltra) {
    chassisClass = "w-32 h-56 rounded-[6px]";
  } else if (isAir) {
    chassisClass = "w-28 h-56 rounded-[24px]";
  }

  // 2. Determine camera style
  const isApple = brandId === 'brand-apple';
  const isSamsung = brandId === 'brand-samsung';
  const isGoogle = brandId === 'brand-google';
  const isOnePlus = brandId === 'brand-oneplus';
  const isXiaomi = brandId === 'brand-xiaomi';
  const isVivo = brandId === 'brand-vivo';

  const isProApple = isApple && (name.includes('pro') || name.includes('max') || name.includes('air'));
  const isSingleCameraApple = isApple && (name.includes('se') || name.includes('xr') || id === 'apple-x' || id === 'apple-8' || id === 'apple-7' || id === 'apple-6');

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-zinc-900/30 rounded-lg border border-ice-border/40 mt-2 mb-4 animate-fadeIn w-full">
      {/* 3D phone presentation pedestal */}
      <div className="relative w-44 h-64 flex items-center justify-center p-2 overflow-visible transition-all duration-300">
        
        {/* Soft drop shadow beneath phone */}
        <div 
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[85%] h-4 bg-black/20 rounded-full blur-md filter pointer-events-none"
          style={{
            transform: 'translateX(-50%) scaleY(0.4)',
          }}
        />

        {hasOfficialImg ? (
          /* Render crawled high-quality official product image */
          <img 
            src={officialImgUrl} 
            alt={`${modelName} in ${colorName}`} 
            className="max-h-full max-w-full object-contain transition-all duration-500 hover:scale-[1.04] pointer-events-none drop-shadow-[0_12px_24px_rgba(0,0,0,0.15)]"
          />
        ) : (
          /* Fallback: Dynamic CSS Phone Back */
          <div 
            className={`relative ${chassisClass} border-[3px] flex flex-col justify-between p-3 overflow-hidden transition-all duration-300 shadow-[0_12px_24px_rgba(0,0,0,0.18)]`}
            style={{
              backgroundImage: theme.gradient,
              borderColor: theme.borderColor,
              boxShadow: 'inset 0 1px 1.5px rgba(255,255,255,0.25), 0 8px 16px rgba(0,0,0,0.15)'
            }}
          >
            {/* Antennas / Band lines for premium look */}
            {!isFold && !isFlip && (
              <>
                <div className="absolute top-4 left-0 right-0 h-[1px] bg-white/10" />
                <div className="absolute bottom-4 left-0 right-0 h-[1px] bg-white/10" />
              </>
            )}

            {/* Diagonal glare overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.08] to-white/[0.18] pointer-events-none skew-x-12 origin-top-left scale-150" />

            {/* Camera Modules based on specific model design */}
            {isApple && (
              <div className="absolute top-2 left-2">
                {isSingleCameraApple ? (
                  // Single Camera (SE / XR style)
                  <div 
                    className="w-5 h-5 rounded-full flex items-center justify-center border border-black/40 shadow-inner"
                    style={{ backgroundColor: theme.accentColor }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-neutral-950 flex items-center justify-center relative border border-white/5">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-900/50 blur-[0.2px]" />
                      <div className="absolute w-[1.5px] h-[1.5px] bg-white/70 rounded-full top-[1px] left-[1px]" />
                    </div>
                  </div>
                ) : isAir ? (
                  // iPhone Air: Central pill single camera at top center
                  <div className="absolute left-[36px] top-1 w-10 h-5 rounded-full flex items-center justify-center border border-white/10 bg-black/10 backdrop-blur-md">
                    <div className="w-3 h-3 rounded-full bg-black flex items-center justify-center border border-neutral-700 relative">
                      <div className="w-1.5 h-1.5 bg-indigo-900/80 rounded-full" />
                      <div className="absolute w-[1px] h-[1px] bg-white/80 rounded-full top-[0.5px] left-[0.5px]" />
                    </div>
                  </div>
                ) : isProApple ? (
                  // Apple Pro 3-Camera Module
                  <div 
                    className="w-11 h-11 sm:w-12 sm:h-12 rounded-[11px] p-1 grid grid-cols-2 gap-1 items-center justify-items-center border border-white/10 shadow-sm relative overflow-hidden"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.06)', 
                      backdropFilter: 'blur(10px)',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
                    }}
                  >
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-black/85 flex items-center justify-center border border-neutral-700/60 relative">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-955/70 border border-indigo-400/20" />
                      <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[1px] left-[1px]" />
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-100 border border-neutral-600/50 flex items-center justify-center relative">
                      <div className="w-[3px] h-[3px] bg-amber-400 rounded-full" />
                    </div>
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-black/85 flex items-center justify-center border border-neutral-700/60 relative">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-955/70 border border-indigo-400/20" />
                      <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[1px] left-[1px]" />
                    </div>
                    <div className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-black/85 flex items-center justify-center border border-neutral-700/60 relative -translate-x-[50%]">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-955/70 border border-indigo-400/20" />
                      <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[1px] left-[1px]" />
                    </div>
                    <div className="absolute bottom-2 right-2 w-1.5 h-1.5 rounded-full bg-zinc-800 border border-neutral-800" />
                  </div>
                ) : (
                  // Apple Dual Camera (iPhone 13, 14, 15, 16, 17 style - vertical pill)
                  <div 
                    className="w-6 h-11 sm:w-7 sm:h-12 rounded-[10px] p-1 flex flex-col items-center justify-between border border-white/10 shadow-sm"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.06)', 
                      backdropFilter: 'blur(10px)'
                    }}
                  >
                    <div className="w-3.5 h-3.5 rounded-full bg-black/80 flex items-center justify-center border border-neutral-700/60 relative">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-950/70" />
                      <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[1px] left-[1px]" />
                    </div>
                    <div className="w-3.5 h-3.5 rounded-full bg-black/80 flex items-center justify-center border border-neutral-700/60 relative">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-950/70" />
                      <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[1px] left-[1px]" />
                    </div>
                  </div>
                )}
              </div>
            )}

            {isSamsung && (
              <>
                {isFlip ? (
                  // Z Flip clamshell cover screen + dual camera
                  <div className="absolute top-1.5 left-1.5 right-1.5 h-16 rounded-[10px] bg-black border border-white/5 p-1 flex items-center justify-between">
                    <div className="flex-1 h-full rounded-[6px] bg-zinc-900 border border-white/5 flex items-center justify-center">
                      <span className="text-[6px] font-mono text-zinc-550 tracking-tighter">09:41 AM</span>
                    </div>
                    <div className="flex flex-col justify-around h-full pl-2 pr-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-black border border-neutral-600 relative flex items-center justify-center">
                        <div className="w-1 h-1 bg-indigo-900 rounded-full" />
                        <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-0.5 left-0.5" />
                      </div>
                      <div className="w-2.5 h-2.5 rounded-full bg-black border border-neutral-600 relative flex items-center justify-center">
                        <div className="w-1 h-1 bg-indigo-900 rounded-full" />
                        <div className="absolute w-0.5 h-0.5 bg-white rounded-full top-0.5 left-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  // S Series, A Series vertical line camera style
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {isUltra ? (
                      // Samsung S Ultra (S23U, S24U, S25U, S26U) 5-lens arrangement
                      <div className="flex gap-1">
                        <div className="flex flex-col gap-1">
                          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-black/85 border-[1px] border-neutral-600 shadow-sm relative flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-indigo-950/80" />
                            <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[0.5px] left-[0.5px]" />
                          </div>
                          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-black/85 border-[1px] border-neutral-600 shadow-sm relative flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-indigo-955/80" />
                            <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[0.5px] left-[0.5px]" />
                          </div>
                          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-black/85 border-[1px] border-neutral-600 shadow-sm relative flex items-center justify-center">
                            <div className="w-1 h-1 rounded-full bg-indigo-955/80" />
                            <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[0.5px] left-[0.5px]" />
                          </div>
                        </div>
                        <div className="flex flex-col gap-1 pt-1.5">
                          <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 border border-neutral-700" />
                          <div className="w-1.5 h-1.5 rounded-full bg-neutral-900 border border-neutral-700/60 relative flex items-center justify-center">
                            <div className="w-0.5 h-0.5 bg-red-600 rounded-full" />
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Regular vertical 3 cameras
                      <>
                        <div className="w-3 h-3 rounded-full bg-black/85 border-[1px] border-neutral-600 shadow-sm relative flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-indigo-955/80" />
                          <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[0.5px] left-[0.5px]" />
                        </div>
                        <div className="w-3 h-3 rounded-full bg-black/85 border-[1px] border-neutral-600 shadow-sm relative flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-indigo-955/80" />
                          <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[0.5px] left-[0.5px]" />
                        </div>
                        <div className="w-3 h-3 rounded-full bg-black/85 border-[1px] border-neutral-600 shadow-sm relative flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-indigo-955/80" />
                          <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[0.5px] left-[0.5px]" />
                        </div>
                      </>
                    )}
                  </div>
                )}
              </>
            )}

            {isGoogle && (
              // Google Pixel Visor Bar (Pixel 6, 7, 8, 9)
              <div 
                className="absolute top-4 left-0 right-0 h-4 border-y border-black/30 shadow-md flex items-center justify-between px-3 relative"
                style={{ 
                  backgroundColor: theme.accentColor === '#0E0E0F' ? '#222' : '#333',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1)'
                }}
              >
                <div className="w-10 h-2.5 bg-black rounded-full px-1 flex items-center justify-around border border-white/5">
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-950 relative flex items-center justify-center">
                    <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[0.2px] left-[0.2px]" />
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-950 relative flex items-center justify-center">
                    <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[0.2px] left-[0.2px]" />
                  </div>
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-amber-100 flex items-center justify-center border border-white/10">
                  <div className="w-[3px] h-[3px] bg-amber-400 rounded-full" />
                </div>
              </div>
            )}

            {!isApple && !isSamsung && !isGoogle && (
              // OnePlus / Xiaomi circular or rounded square center camera module
              <div className="absolute top-2 left-1/2 -translate-x-1/2">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/80 border border-neutral-700 shadow-md p-1 grid grid-cols-2 gap-1 items-center justify-items-center relative">
                  <div className="absolute inset-0.5 rounded-full border border-neutral-600/30 pointer-events-none" />
                  <div className="w-2 h-2 rounded-full bg-indigo-950 relative flex items-center justify-center">
                    <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[0.2px] left-[0.2px]" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-indigo-950 relative flex items-center justify-center">
                    <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[0.2px] left-[0.2px]" />
                  </div>
                  <div className="w-2 h-2 rounded-full bg-indigo-950 relative flex items-center justify-center">
                    <div className="absolute w-0.5 h-0.5 bg-white/80 rounded-full top-[0.2px] left-[0.2px]" />
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-amber-100 flex items-center justify-center">
                    <div className="w-[3px] h-[3px] bg-amber-400 rounded-full" />
                  </div>
                </div>
              </div>
            )}

            {/* Brand Logos center/bottom */}
            <div className="flex-1 flex items-center justify-center">
              {isApple && (
                <div style={{ color: theme.logoColor }} className="transition-all duration-300 mt-6">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 sm:w-6 sm:h-6" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.12.09 2.27-.58 2.94-1.39z"/>
                  </svg>
                </div>
              )}
              {isGoogle && (
                <div style={{ color: theme.logoColor }} className="transition-all duration-300">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 sm:w-5 sm:h-5" fill="currentColor">
                    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.114-5.136 4.114-3.513 0-6.36-2.847-6.36-6.36s2.847-6.36 6.36-6.36c1.63 0 3.117.618 4.252 1.628l3.05-3.05C19.342 2.76 16.035 1.5 12.24 1.5 6.42 1.5 1.7 6.22 1.7 12s4.72 10.5 10.54 10.5c5.96 0 10.37-4.19 10.37-10.5 0-.685-.082-1.354-.22-1.715H12.24z"/>
                  </svg>
                </div>
              )}
            </div>

            {/* Lower Logo for Samsung / OnePlus / Xiaomi / Vivo */}
            <div className="w-full flex items-center justify-center pb-1">
              {isSamsung && (
                <span className="text-[6px] tracking-[0.25em] font-extrabold uppercase" style={{ color: theme.logoColor }}>
                  SAMSUNG
                </span>
              )}
              {isOnePlus && (
                <span className="text-[7px] tracking-[0.2em] font-black uppercase" style={{ color: theme.logoColor }}>
                  1+
                </span>
              )}
              {isXiaomi && (
                <span className="text-[7.5px] tracking-[0.1em] font-medium uppercase" style={{ color: theme.logoColor }}>
                  mi
                </span>
              )}
              {isVivo && (
                <span className="text-[7px] tracking-[0.2em] font-light uppercase" style={{ color: theme.logoColor }}>
                  vivo
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Styled color name under phone */}
      <div className="mt-4 text-center">
        <span className="text-[10px] uppercase tracking-widest font-mono text-zinc-550 dark:text-zinc-400 block mb-1">Color Option</span>
        <span className="text-base font-bold text-ink-navy dark:text-zinc-200 font-outfit tracking-tight">{colorName}</span>
      </div>
    </div>
  );
};

// ── Brand Logo using official Simple Icons SVG paths ─────────────────────────

const BRAND_ICON_MAP: Record<string, { icon: { path: string; viewBox?: string; hex?: string }; size: number; brandColor?: string }> = {
  apple:   { icon: siApple,   size: 20 },
  samsung: { icon: siSamsung, size: 52 }, // Larger size to make horizontal wordmark readable
  xiaomi:  { icon: siXiaomi,  size: 20 },
  vivo:    { icon: siVivo,    size: 40 }, // Larger size to make horizontal wordmark readable
  oneplus: { icon: siOneplus, size: 20 },
  google:  { icon: siGoogle,  size: 20, brandColor: '#4285F4' },
};

function BrandLogo({ logo, isActive }: { logo: string; isActive: boolean }) {
  const entry = BRAND_ICON_MAP[logo];
  if (!entry) return <span className="text-sm font-bold">{logo}</span>;

  const { icon, size, brandColor } = entry;
  // When inactive, use the brand's own colour for recognition; active → white
  const fillColor = isActive ? '#ffffff' : (brandColor ?? `#${icon.hex ?? '6b7280'}`);

  return (
    <div className="h-6 flex items-center justify-center overflow-visible" style={{ flexShrink: 0 }}>
      <svg
        role="img"
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill={fillColor}
        aria-label={logo}
        style={{ flexShrink: 0 }}
      >
        <path d={icon.path} />
      </svg>
    </div>
  );
}

interface DeviceSelectorProps {
  onVariantSelected: (model: Model, variant: Variant) => void;
  /** When set, the selector will auto-open this model's variant panel */
  defaultModelId?: string | null;
  /** Called after defaultModelId has been consumed so the parent can clear it */
  onDefaultModelConsumed?: () => void;
  /** Dynamic brands from API (falls back to static) */
  brands?: Brand[];
  /** Dynamic models from API (falls back to static) */
  models?: Model[];
}

export const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  onVariantSelected,
  defaultModelId,
  onDefaultModelConsumed,
  brands: propBrands,
  models: propModels,
}) => {
  const BRANDS = propBrands && propBrands.length > 0 ? propBrands : STATIC_BRANDS;
  const MODELS = propModels && propModels.length > 0 ? propModels : STATIC_MODELS;
  const [selectedBrandId, setSelectedBrandId] = useState<string>('brand-apple');
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState<string>('');
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [tempVariant, setTempVariant] = useState<Variant | null>(null);
  const variantSelectorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle external model pre-selection (from hero search)
  useEffect(() => {
    if (!defaultModelId) return;
    const model = MODELS.find(m => m.id === defaultModelId);
    if (model) {
      setSelectedBrandId(model.brandId);
      setSelectedSeries(model.series || null);
      setSelectedModel(model);
      setSelectedStorage(null);
      setTempVariant(null);
      // Scroll to variant panel after brief paint delay
      setTimeout(() => {
        variantSelectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 200);
    }
    onDefaultModelConsumed?.();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultModelId]);

  useEffect(() => {
    if (selectedModel && variantSelectorRef.current) {
      const isMobile = window.innerWidth < 1024;
      if (isMobile) {
        setTimeout(() => {
          variantSelectorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  }, [selectedModel]);

  // Get available series for the selected brand
  const availableSeries = useMemo(() => {
    const brandModels = MODELS.filter(m => m.brandId === selectedBrandId);
    const seriesSet = new Set<string>();
    brandModels.forEach(m => {
      if (m.series) {
        seriesSet.add(m.series);
      }
    });
    const seriesList = Array.from(seriesSet);
    
    // Sort series list in a smart way (newest/flagship first)
    return seriesList.sort((a, b) => {
      const priority = (name: string) => {
        const lower = name.toLowerCase();
        if (lower.includes('17')) return 100;
        if (lower.includes('16')) return 99;
        if (lower.includes('15')) return 98;
        if (lower.includes('14')) return 97;
        if (lower.includes('13')) return 96;
        if (lower.includes('12')) return 95;
        if (lower.includes('s series')) return 100;
        if (lower.includes('fold')) return 95;
        if (lower.includes('numbered')) return 100; // OnePlus Numbered
        if (lower.includes('pixel 8')) return 100;
        if (lower.includes('pixel 7')) return 99;
        if (lower.includes('pixel 6')) return 98;
        if (lower.includes('xiaomi series')) return 100;
        if (lower.includes('note')) return 90;
        if (lower.includes('poco')) return 80;
        if (lower.includes('v series')) return 90;
        if (lower.includes('legacy') || lower.includes('se')) return 10;
        return 50;
      };
      return priority(b) - priority(a);
    });
  }, [selectedBrandId]);

  // Compute stats (model count, max payout, release year range) for each series
  const seriesStats = useMemo(() => {
    const stats: Record<string, { modelCount: number; maxPayout: number; yearRange: string }> = {};
    availableSeries.forEach(seriesName => {
      const modelsInSeries = MODELS.filter(m => m.brandId === selectedBrandId && m.series === seriesName);
      const modelCount = modelsInSeries.length;
      const maxPayout = Math.max(...modelsInSeries.map(m => m.basePrice128GB), 0);
      const years = modelsInSeries.map(m => m.releaseYear);
      const minYear = Math.min(...years);
      const maxYear = Math.max(...years);
      const yearRange = minYear === maxYear ? `${minYear}` : `${minYear} - ${maxYear}`;
      stats[seriesName] = { modelCount, maxPayout, yearRange };
    });
    return stats;
  }, [availableSeries, selectedBrandId]);

  // Filter models based on brand, series, and debounced search query
  // When a search query is active, bypass brand AND series filter (cross-brand search)
  const filteredModels = useMemo(() => {
    const isSearching = debouncedSearchQuery.trim() !== '';
    return MODELS.filter(model => {
      const matchesBrand = isSearching ? true : model.brandId === selectedBrandId;
      const matchesSeries = isSearching
        ? true
        : (selectedSeries === null ? true : model.series === selectedSeries);
      const matchesSearch = isSearching
        ? (model.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase()) ||
           model.modelNumber.toLowerCase().includes(debouncedSearchQuery.toLowerCase()))
        : true;
      return matchesBrand && matchesSeries && matchesSearch;
    });
  }, [selectedBrandId, selectedSeries, debouncedSearchQuery]);

  // Generate variants for the selected model
  const modelVariants = useMemo(() => {
    if (!selectedModel) return [];
    return generateVariantsForModel(selectedModel);
  }, [selectedModel]);

  // Group variants by storage
  const storageOptions = useMemo(() => {
    const storages = new Set<number>();
    modelVariants.forEach(v => storages.add(v.storageGb));
    return Array.from(storages).sort((a, b) => a - b);
  }, [modelVariants]);

  // Filter colors based on selected storage
  const [selectedStorage, setSelectedStorage] = useState<number | null>(null);

  const colorOptions = useMemo(() => {
    if (!selectedStorage) return [];
    return modelVariants.filter(v => v.storageGb === selectedStorage);
  }, [selectedStorage, modelVariants]);

  const handleModelClick = (model: Model) => {
    setSelectedModel(model);
    setSelectedStorage(null);
    setTempVariant(null);
  };

  const handleStorageSelect = (storage: number) => {
    setSelectedStorage(storage);
    setTempVariant(null);
  };

  const handleColorSelect = (variant: Variant) => {
    setTempVariant(variant);
  };

  const handleConfirm = () => {
    if (selectedModel && tempVariant) {
      onVariantSelected(selectedModel, tempVariant);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="w-full">
      {/* Brand Tabs — horizontally scrollable on mobile */}
      <div className="flex gap-2.5 mb-6 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-none" style={{scrollbarWidth: 'none'}}>
        {BRANDS.map(brand => {
          const isActive = selectedBrandId === brand.id;
          return (
            <button
              key={brand.id}
              onClick={() => {
                setSelectedBrandId(brand.id);
                setSelectedSeries(null);
                setSelectedModel(null);
                setSelectedStorage(null);
                setTempVariant(null);
              }}
              className={`flex-shrink-0 px-4 sm:px-5 py-2.5 sm:py-3 rounded-sm font-semibold text-xs sm:text-sm transition-all duration-300 flex flex-col items-center justify-center gap-1.5 border ${
                isActive
                  ? 'bg-cobalt text-white border-cobalt scale-[1.02] opacity-100 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                  : 'bg-canvas-pure text-ink-slate border-ice-border hover:border-cobalt/40 hover:bg-cobalt-light/10 opacity-80 hover:opacity-100'
              }`}
              style={{ minHeight: '64px', minWidth: '72px' }}
            >
              <BrandLogo logo={brand.logo} isActive={isActive} />
              <span className={`text-[10px] font-semibold tracking-wide ${isActive ? 'text-white' : 'text-ink-slate'}`}>{brand.name}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
        {/* Left Side: Search and Models list / Series Cards */}
        <div className={`${selectedModel ? 'lg:col-span-7' : 'lg:col-span-12'} transition-all duration-500`}>
          {/* Search bar */}
          <div className="relative mb-4 sm:mb-6">
            <Search className="absolute left-3.5 sm:left-4 top-1/2 -translate-y-1/2 text-ink-muted w-4 h-4 sm:w-5 sm:h-5" />
            <input
              id="device-search-input"
              type="text"
              placeholder="Search all brands (e.g. iPhone 15 Pro, Galaxy S24)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-10 py-3 sm:py-3.5 rounded-sm border border-ice-border bg-canvas-pure text-ink-navy text-sm placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all duration-300"
              style={{ minHeight: '48px' }}
              aria-label="Search all device models"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-cobalt transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {/* Cross-brand hint when searching */}
          {debouncedSearchQuery.trim() !== '' && (
            <div className="flex items-center gap-1.5 mb-4 text-[11px] text-cobalt font-mono animate-fadeIn">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Searching across all {filteredModels.length > 0 ? `${filteredModels.length} ` : ''}models from all brands
            </div>
          )}

          {/* If search query is empty and no series is selected, show Series Cards */}
          {debouncedSearchQuery.trim() === '' && selectedSeries === null && (
            <div className="mb-8 animate-fadeIn">
              <div className="text-left mb-5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-ink-slate font-mono flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-cobalt" /> Select Device Series
                </h4>
                <p className="text-xs text-ink-muted font-light mt-1">Select a series below to see the available models for trade-in.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {availableSeries.map(seriesName => {
                  const stats = seriesStats[seriesName] || { modelCount: 0, maxPayout: 0, yearRange: '' };
                  return (
                    <motion.div
                      key={seriesName}
                      whileHover={{ scale: 1.015, y: -2 }}
                      onClick={() => setSelectedSeries(seriesName)}
                      className="p-5 rounded-sm border border-ice-border bg-canvas-pure cursor-pointer hover:border-cobalt/40 transition-all duration-300 shadow-sm hover:shadow-premium group flex flex-col justify-between"
                      style={{ minHeight: '140px' }}
                    >
                      <div className="text-left">
                        <div className="flex justify-between items-start mb-3">
                          <div className="p-2 rounded-sm bg-cobalt-light/10 text-cobalt border border-cobalt/10 group-hover:bg-cobalt group-hover:text-white transition-colors duration-300">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] font-mono font-semibold tracking-wider text-zinc-500 bg-white/[0.03] px-2 py-0.5 rounded-sm">
                            {stats.yearRange}
                          </span>
                        </div>
                        <h4 className="font-semibold text-base text-ink-navy leading-tight group-hover:text-cobalt transition-colors duration-300">
                          {seriesName}
                        </h4>
                        <p className="text-[11px] text-ink-muted mt-1.5 font-light">
                          {stats.modelCount} {stats.modelCount === 1 ? 'model' : 'models'} available
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between text-left">
                        <div>
                          <span className="text-[8px] text-zinc-500 block uppercase font-mono tracking-wider">Payout Up To</span>
                          <span className="text-sm font-bold text-cobalt font-outfit">{formatPrice(stats.maxPayout)}</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-canvas-white border border-ice-border flex items-center justify-center group-hover:bg-cobalt group-hover:border-cobalt transition-all duration-300">
                          <ChevronRight className="w-3.5 h-3.5 text-ink-muted group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}

          {/* If search query is NOT empty OR a series is selected, show Models Grid */}
          {(debouncedSearchQuery.trim() !== '' || selectedSeries !== null) && (
            <div className="animate-fadeIn">
              {/* Breadcrumb / Back Navigation if not searching */}
              {debouncedSearchQuery.trim() === '' && (
                <div className="flex items-center justify-between mb-5 pb-3 border-b border-white/[0.04]">
                  <button
                    onClick={() => {
                      setSelectedSeries(null);
                      setSelectedModel(null);
                      setSelectedStorage(null);
                      setTempVariant(null);
                    }}
                    className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-cobalt transition-colors font-semibold"
                  >
                    <ArrowLeft className="w-4 h-4" /> Back to Series
                  </button>
                  <span className="text-xs text-zinc-500 font-mono font-semibold uppercase">{selectedSeries}</span>
                </div>
              )}

              {/* Models Grid: 1 col xs, 2 col sm, 3 col md */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                {filteredModels.length === 0 && (
                  <div className="col-span-full py-12 px-4 text-center border border-dashed border-ice-border rounded-sm bg-canvas-pure animate-fadeIn">
                    <Smartphone className="w-10 h-10 text-ink-muted mx-auto mb-3" />
                    <h4 className="text-base font-semibold text-ink-navy">No models found</h4>
                    <p className="text-xs text-ink-muted mt-1 max-w-xs mx-auto">
                      No results for <span className="font-mono text-cobalt">"{searchQuery}"</span>.<br />
                      Try a brand name (e.g. "Apple", "Samsung") or a model number.
                    </p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 px-4 py-2 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-sm transition-all"
                      style={{ minHeight: '36px' }}
                    >
                      Clear Search
                    </button>
                  </div>
                )}
                <AnimatePresence mode="popLayout">
                  {filteredModels.map(model => {
                    const isSelected = selectedModel?.id === model.id;
                    const hasSelection = selectedModel !== null;
                    return (
                      <motion.div
                        layoutId={`model-card-${model.id}`}
                        key={model.id}
                        onClick={() => handleModelClick(model)}
                        className={`p-4 sm:p-5 rounded-sm border cursor-pointer transition-all duration-300 bg-canvas-pure relative card-shimmer group ${
                          isSelected
                            ? 'border-cobalt ring-1 ring-cobalt/20 scale-[1.01] opacity-100 z-10 shadow-premium'
                            : hasSelection
                            ? 'border-ice-border opacity-40 hover:opacity-75 hover:scale-[1.005]'
                            : 'border-ice-border hover:border-cobalt/40 hover:-translate-y-0.5 shadow-sm hover:shadow-premium'
                        }`}
                      >
                        {/* Canva style premium layout */}
                        <div className="flex flex-col h-full justify-between min-h-[140px]">
                          <div className="flex justify-between items-start gap-3">
                            <div className="text-left flex-1">
                              <div className="flex items-center justify-between mb-3">
                                <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-sm ${
                                  model.category === 'flagship'
                                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    : model.category === 'premium'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                    : 'bg-zinc-500/10 text-zinc-400 border border-zinc-500/20'
                                }`}>
                                  {model.category}
                                </span>
                                <span className="text-[11px] text-ink-muted flex items-center gap-1 font-mono">
                                  <Calendar className="w-3 h-3" /> {model.releaseYear}
                                </span>
                              </div>
                              <h3 className="font-light text-base text-ink-navy leading-tight mb-1">
                                {model.name}
                              </h3>
                              <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-zinc-700/60 inline-block mb-2">
                                Model: {model.modelNumber}
                              </span>
                            </div>
                            
                            {/* Brand specific phone image */}
                            <div className="w-16 h-16 flex-shrink-0 flex items-center justify-center overflow-hidden bg-slate-100 rounded-lg p-1.5 border border-ice-border/40">
                              <img 
                                src={getDeviceImage(model.id, model.brandId, undefined, model.imageUrl)} 
                                alt={model.name} 
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = getDeviceImage('', model.brandId);
                                }}
                                className="max-h-full max-w-full object-contain pointer-events-none group-hover:scale-105 transition-transform duration-300" 
                              />
                            </div>
                          </div>
                          
                          <div className="pt-3 mt-3 border-t border-white/[0.04] flex items-center justify-between">
                            <div className="text-left">
                              <span className="text-[9px] text-zinc-500 block uppercase font-mono tracking-wider">Payout Up To</span>
                              <span className="text-sm font-bold text-cobalt font-outfit">{formatPrice(model.basePrice128GB)}</span>
                            </div>
                            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isSelected ? 'translate-x-1 text-cobalt' : 'text-ink-muted'}`} />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>

        {/* Right Side: Variant selector — slides in on desktop, stacks on mobile */}
        <AnimatePresence>
          {selectedModel && (
            <motion.div
              ref={variantSelectorRef}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="lg:col-span-5 bg-canvas-pure rounded-sm border border-ice-border p-4 sm:p-6"
            >
              <div className="mb-6 pb-6 border-b border-white/[0.04] text-left">
                <div className="flex items-center gap-3 mb-2">
                  <Smartphone className="w-6 h-6 text-cobalt" />
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block">Selected Model Spec</span>
                </div>
                <h3 className="text-3xl font-light text-ink-navy tracking-tight">{selectedModel.name}</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700/60">
                    Model No: {selectedModel.modelNumber}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-slate-500 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-400 px-2 py-0.5 rounded border border-slate-200 dark:border-zinc-700/60">
                    Release: {selectedModel.releaseYear}
                  </span>
                </div>
                <p className="text-xs text-ink-muted mt-2 font-light">Select your device's storage capacity and color to load the live trade-in value.</p>
              </div>

              {/* Step 1: Storage */}
              <div className="mb-6">
                <label className="text-xs uppercase tracking-wider font-bold text-ink-slate block mb-3 flex items-center gap-1.5 font-mono">
                  <Layers className="w-3.5 h-3.5 text-cobalt" /> Select Storage Capacity
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {storageOptions.map(storage => {
                    const isSelected = selectedStorage === storage;
                    const hasSelection = selectedStorage !== null;
                    return (
                      <button
                        key={storage}
                        onClick={() => handleStorageSelect(storage)}
                        className={`py-3.5 rounded-sm border text-sm font-semibold transition-all duration-300 ${
                          isSelected
                            ? 'bg-cobalt text-white border-cobalt scale-[1.01] opacity-100 shadow-[0_0_10px_rgba(59,130,246,0.2)]'
                            : hasSelection
                            ? 'bg-canvas-white text-ink-navy border-ice-border opacity-40 hover:opacity-75'
                            : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/30 hover:scale-[1.005]'
                        }`}
                        style={{ minHeight: '48px' }}
                      >
                        {storage >= 1024 ? '1 TB' : `${storage} GB`}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Step 2: Color */}
              {selectedStorage && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8"
                >
                  <label className="text-xs uppercase tracking-wider font-bold text-ink-slate block mb-3 flex items-center gap-1.5 font-mono">
                    <ShieldCheck className="w-3.5 h-3.5 text-cobalt" /> Select Color & Carrier
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {colorOptions.map(variant => {
                      const isSelected = tempVariant?.id === variant.id;
                      const hasSelection = tempVariant !== null;
                      return (
                        <button
                          key={variant.id}
                          onClick={() => handleColorSelect(variant)}
                          className={`p-4 rounded-sm border text-left text-xs transition-all duration-300 flex flex-col justify-between ${
                            isSelected
                              ? 'bg-cobalt-light border-cobalt ring-1 ring-cobalt/20 scale-[1.01] opacity-100 shadow-[0_0_10px_rgba(59,130,246,0.15)]'
                              : hasSelection
                              ? 'bg-canvas-white text-ink-navy border-ice-border opacity-40 hover:opacity-75'
                              : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/20 hover:scale-[1.005]'
                          }`}
                          style={{ minHeight: '48px' }}
                        >
                          <span className="font-semibold text-ink-navy">{variant.color}</span>
                          <span className="text-[10px] text-ink-muted mt-1 font-mono uppercase">Unlocked</span>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* Confirm Selection CTA */}
              <AnimatePresence>
                {tempVariant && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <PhoneBackPreview 
                      brandId={selectedModel.brandId} 
                      modelName={selectedModel.name} 
                      colorName={tempVariant.color} 
                      modelId={selectedModel.id}
                      customImageUrl={selectedModel.imageUrl}
                    />

                    <div className="bg-canvas-white rounded-sm p-4 mb-6 border border-white/[0.06] flex items-center justify-between text-left">
                      <div>
                        <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Base Price / Mint</span>
                        <span className="text-xl font-bold text-cobalt">{formatPrice(tempVariant.basePrice)}</span>
                      </div>
                      <span className="text-xs text-ink-slate font-light">Reference Spec</span>
                    </div>

                    <button
                      onClick={handleConfirm}
                      className="w-full bg-cobalt hover:bg-cobalt-hover text-white py-4 rounded-sm font-bold transition-all duration-300 flex items-center justify-center gap-2 hover:scale-[1.01]"
                    >
                      Diagnose Condition
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
