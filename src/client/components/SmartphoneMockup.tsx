import React, { useState, useEffect } from 'react';

type PreviewModel = 'apple' | 'samsung' | 'google';

export const SmartphoneMockup: React.FC = () => {
  const [activePreviewModel, setActivePreviewModel] = useState<PreviewModel>('apple');
  const [time, setTime] = useState<string>('09:41 AM');
  const [islandExpanded, setIslandExpanded] = useState<boolean>(false);

  // Dynamic system clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const hoursStr = hours.toString().padStart(2, '0');
      setTime(`${hoursStr}:${minutes} ${ampm}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Preview data based on active model
  const previewData = {
    apple: {
      gradient: 'from-[#fdfdfd] via-[#f5f5f7] to-[#e8e8ed]',
      title: 'iPhone 17 Pro Max',
      maxPrice: '₹85,000',
      accentClass: 'text-gradient-green',
      barGradient: 'from-emerald-600 to-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.3)]',
      progressWidth: 'w-[94%]',
      progressGradient: 'from-emerald-600 to-emerald-400',
      chartHeights: ['h-6', 'h-8', 'h-10', 'h-14'],
    },
    samsung: {
      gradient: 'from-[#fafaff] via-[#f0f4ff] to-[#e6eeff]',
      title: 'Galaxy S26 Ultra',
      maxPrice: '₹50,000',
      accentClass: 'text-gradient-cobalt',
      barGradient: 'from-blue-600 to-blue-400 shadow-[0_4px_12px_rgba(59,130,246,0.3)]',
      progressWidth: 'w-[88%]',
      progressGradient: 'from-blue-600 to-blue-400',
      chartHeights: ['h-4', 'h-6', 'h-8', 'h-12'],
    },
    google: {
      gradient: 'from-[#fbfbfb] via-[#f7f7f8] to-[#edf0f5]',
      title: 'Pixel 8 Pro',
      maxPrice: '₹27,000',
      accentClass: 'text-gradient-green',
      barGradient: 'from-emerald-600 to-emerald-400 shadow-[0_4px_12px_rgba(16,185,129,0.3)]',
      progressWidth: 'w-[78%]',
      progressGradient: 'from-emerald-600 to-emerald-400',
      chartHeights: ['h-3', 'h-5', 'h-7', 'h-10'],
    },
  }[activePreviewModel];

  // Smooth scroll handler
  const handleScrollToSearch = () => {
    document.getElementById('device-selector-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative flex justify-center py-2 select-none">
      {/* Physical Hardware Buttons on Left Side (Mute switch + Volume buttons) */}
      <div className="absolute left-[-4px] top-[106px] w-[5px] h-[18px] bg-gradient-to-b from-[#47484c] via-[#2d2e31] to-[#121315] border-y border-l border-neutral-700/60 rounded-l-[3px] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.15),-1px_2px_4px_rgba(0,0,0,0.3)] z-0" />
      <div className="absolute left-[-4px] top-[142px] w-[5px] h-[42px] bg-gradient-to-b from-[#47484c] via-[#2d2e31] to-[#121315] border-y border-l border-neutral-700/60 rounded-l-[3px] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.15),-1px_2px_4px_rgba(0,0,0,0.3)] z-0" />
      <div className="absolute left-[-4px] top-[196px] w-[5px] h-[42px] bg-gradient-to-b from-[#47484c] via-[#2d2e31] to-[#121315] border-y border-l border-neutral-700/60 rounded-l-[3px] shadow-[inset_1px_1px_1px_rgba(255,255,255,0.15),-1px_2px_4px_rgba(0,0,0,0.3)] z-0" />

      {/* Physical Hardware Buttons on Right Side (Power Button) */}
      <div className="absolute right-[-4px] top-[168px] w-[5px] h-[64px] bg-gradient-to-b from-[#47484c] via-[#2d2e31] to-[#121315] border-y border-r border-neutral-700/60 rounded-r-[3px] shadow-[inset_-1px_1px_1px_rgba(255,255,255,0.15),1px_2px_4px_rgba(0,0,0,0.3)] z-0" />

      {/* Outer Metallic Frame (Chassis) */}
      <div className="relative w-[260px] sm:w-[288px] h-[460px] sm:h-[496px] bg-gradient-to-b from-[#2e2f33] via-[#48494f] to-[#131416] p-[6px] shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_40px_rgba(0,32,69,0.1),inset_0_1px_2px_rgba(255,255,255,0.2)] rounded-[42px] border border-white/10 z-10">
        
        {/* Inner Black Bezel Rim */}
        <div className="w-full h-full bg-black rounded-[36px] p-[5.5px] shadow-inner relative flex flex-col justify-between overflow-hidden">
          
          {/* Glass Screen Reflection Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.14] z-20 mix-blend-overlay rotate-[15deg] scale-[1.6]" />

          {/* Notch / Camera Cutout Area */}
          {activePreviewModel === 'apple' ? (
            /* Apple Dynamic Island Notch */
            <div 
              onMouseEnter={() => setIslandExpanded(true)}
              onMouseLeave={() => setIslandExpanded(false)}
              onClick={() => setIslandExpanded(!islandExpanded)}
              className={`absolute top-2 left-1/2 -translate-x-1/2 bg-black rounded-full z-30 flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden border border-white/10 shadow-md ${
                islandExpanded 
                  ? 'w-[180px] sm:w-[200px] h-[28px] px-2.5' 
                  : 'w-[80px] sm:w-[90px] h-[20px] px-2'
              }`}
            >
              {islandExpanded ? (
                <div className="w-full flex items-center justify-between text-[8px] sm:text-[9px] text-emerald-400 font-sans tracking-wide animate-fade-in whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full live-pulse" />
                    <span className="font-semibold text-white/90">Data Wipe: SECURE</span>
                  </div>
                  <span className="text-[7.5px] sm:text-[8.5px] bg-emerald-500/20 px-1.5 py-0.2 rounded-full border border-emerald-500/20 text-emerald-300 font-bold">100% Wiped</span>
                </div>
              ) : (
                <div className="flex justify-between items-center w-full px-1.5">
                  {/* TrueDepth Camera Lens with realistic reflections */}
                  <div className="w-2 h-2 rounded-full bg-[#0c0d12] border border-[#1a1c24] flex items-center justify-center relative shadow-inner overflow-hidden flex-shrink-0">
                    <div className="absolute w-[3px] h-[3px] rounded-full bg-cyan-500/40 blur-[0.5px] top-[1px] left-[1px]" />
                    <div className="absolute w-[1px] h-[1px] rounded-full bg-white/70 top-[1.5px] left-[1.5px]" />
                  </div>
                  {/* Infrared sensor dot */}
                  <div className="w-1.5 h-1.5 rounded-full bg-[#0a050f] border border-[#160d21] flex items-center justify-center relative shadow-inner overflow-hidden flex-shrink-0">
                    <div className="absolute w-[2px] h-[2px] rounded-full bg-purple-500/30 blur-[0.5px] top-[1.5px] left-[1.5px]" />
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Samsung / Google Center Pinhole Camera with realistic lens */
            <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-black rounded-full z-30 border border-white/5 shadow-inner flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#080d1a] border border-[#121c33] relative flex items-center justify-center overflow-hidden">
                <div className="absolute w-1 h-1 rounded-full bg-cyan-400/50 blur-[0.2px] top-0 left-0" />
                <div className="absolute w-0.5 h-0.5 rounded-full bg-white/80 top-[1px] left-[1px]" />
              </div>
            </div>
          )}

          {/* Screen Content Wrapper */}
          <div className={`w-full h-full bg-gradient-to-tr ${previewData.gradient} rounded-[30px] overflow-hidden relative flex flex-col justify-between pt-1.5 px-3.5 pb-3.5 sm:pt-2 sm:px-4 sm:pb-4 text-ink-navy text-left`}>
            
            {/* Status Bar */}
            <div className="w-full h-5 flex justify-between items-center px-0.5 text-[8.5px] sm:text-[9.5px] font-bold font-sans tracking-tight z-25 text-ink-navy/80 leading-none">
              <span className="flex items-center h-full ml-0.5">{time.replace(/\s*[AP]M\s*/gi, '')}</span>
              <div className="flex items-center gap-1.5 h-full mr-0.5">
                {/* Network Signal Bars */}
                <div className="flex items-end gap-[1.2px] h-2.5 mb-[0.5px]">
                  <div className="w-[1.2px] h-[3px] bg-ink-navy rounded-[0.5px]"></div>
                  <div className="w-[1.2px] h-[5px] bg-ink-navy rounded-[0.5px]"></div>
                  <div className="w-[1.2px] h-[7px] bg-ink-navy rounded-[0.5px]"></div>
                  <div className="w-[1.2px] h-[9px] bg-ink-navy rounded-[0.5px]"></div>
                </div>
                {/* 5G Label (Android models only to prevent notch overlap on iPhone) */}
                {activePreviewModel !== 'apple' && (
                  <span className="text-[7px] font-extrabold tracking-tighter px-0.5 py-[0.5px] bg-ink-navy/10 rounded-sm leading-none border border-ink-navy/10 scale-95 flex items-center">5G</span>
                )}
                {/* Wi-Fi Icon */}
                <svg className="w-2.5 h-2.5 fill-current opacity-90" viewBox="0 0 24 24">
                  <path d="M12 21l-12-12c6.627-6.627 17.373-6.627 24 0l-12 12z" />
                </svg>
                {/* Battery percentage (Android models only to prevent notch overlap on iPhone) */}
                {activePreviewModel !== 'apple' && (
                  <span className="text-[7.5px] font-bold opacity-80 mr-0.5">98%</span>
                )}
                {/* Battery capsule */}
                <div className="w-4 h-2.5 border border-ink-navy/70 rounded-[3px] p-[0.5px] flex items-center relative">
                  <div className="h-full bg-emerald-600 rounded-[1.5px]" style={{ width: '92%' }}></div>
                  <div className="w-[1.2px] h-1 bg-ink-navy/70 absolute -right-[2px] top-1/2 -translate-y-1/2 rounded-r-[0.5px]"></div>
                </div>
              </div>
            </div>

            {/* Interactive Model Switcher Tabs */}
            <div className="mt-5 flex p-1 rounded-full glass-pill z-10 mx-0.5">
              {(['apple', 'samsung', 'google'] as const).map(brand => (
                <button
                  key={brand}
                  onClick={() => {
                    setActivePreviewModel(brand);
                    setIslandExpanded(false);
                  }}
                  className={`flex-1 py-1 rounded-full text-[8.5px] sm:text-[9.5px] font-extrabold uppercase tracking-wider transition-all duration-300 ${
                    activePreviewModel === brand
                      ? 'bg-white text-ink-navy shadow-[0_3px_10px_rgba(0,32,69,0.12)] scale-[1.03]'
                      : 'text-ink-slate hover:text-ink-navy hover:bg-white/20'
                  }`}
                >
                  {brand === 'apple' ? 'iPhone' : brand === 'samsung' ? 'Galaxy' : 'Pixel'}
                </button>
              ))}
            </div>

            {/* Price Offer Callout */}
            <div className="mt-2.5 flex justify-between items-start px-0.5 z-10">
              <div>
                <p className="text-[8px] text-ink-muted font-mono tracking-widest uppercase">Reliable Exchange</p>
                <h3 className="text-xs sm:text-sm font-bold mt-0.5 leading-tight text-ink-navy">
                  Get up to<br />
                  <span className={`text-xl sm:text-2xl font-black ${previewData.accentClass} transition-colors duration-300 block mt-0.5`}>
                    {previewData.maxPrice}
                  </span>
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-700 rounded-full text-[7.5px] font-bold border border-emerald-500/20 whitespace-nowrap flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 live-pulse"></span>
                Live Offer
              </span>
            </div>

            {/* Bar Chart Graphic */}
            <div className="my-2 h-14 flex items-end gap-1.5 px-2 z-10">
              <div className={`w-full bg-gradient-to-t from-slate-200/50 to-slate-100/60 border-t border-x border-slate-300/25 ${previewData.chartHeights[0]} rounded-t-sm transition-all duration-500`} />
              <div className={`w-full bg-gradient-to-t from-slate-200/50 to-slate-100/60 border-t border-x border-slate-300/25 ${previewData.chartHeights[1]} rounded-t-sm transition-all duration-500`} />
              <div className={`w-full bg-gradient-to-t from-slate-200/50 to-slate-100/60 border-t border-x border-slate-300/25 ${previewData.chartHeights[2]} rounded-t-sm transition-all duration-500`} />
              <div className={`w-full bg-gradient-to-t ${previewData.barGradient} ${previewData.chartHeights[3]} rounded-t-sm transition-all duration-500`} />
            </div>

            {/* Selected Device Grading Spec */}
            <div className="mb-2 z-10">
              <div className="p-2.5 rounded-lg card-glass">
                <div className="flex justify-between text-[10px] mb-1.5 text-ink-slate items-center">
                  <span className="font-extrabold text-ink-navy truncate pr-2 tracking-tight">{previewData.title}</span>
                  <span className="font-extrabold text-[8.5px] uppercase tracking-wider px-1.5 py-[2px] rounded-[3px] bg-emerald-500/10 text-emerald-600 border border-emerald-500/10">Flawless</span>
                </div>
                <div className="w-full bg-slate-200/50 h-1.5 rounded-full overflow-hidden p-[0.5px]">
                  <div className={`h-full bg-gradient-to-r ${previewData.progressGradient} ${previewData.progressWidth} rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_rgba(16,185,129,0.4)]`} />
                </div>
              </div>
            </div>

            {/* Main Interactive Button inside mockup */}
            <button 
              onClick={handleScrollToSearch}
              className="w-full py-2 bg-gradient-to-r from-[#002045] to-[#003c7a] hover:from-[#001733] hover:to-[#002e5c] text-white font-extrabold rounded-lg text-[10.5px] sm:text-[11.5px] uppercase tracking-wider transition-all duration-300 shadow-[0_4px_12px_rgba(0,32,69,0.2)] hover:shadow-[0_6px_16px_rgba(0,32,69,0.3)] hover:-translate-y-[1px] active:translate-y-0 active:scale-[0.98] z-10 mb-1 flex items-center justify-center gap-1.5"
            >
              <span>Check Value Now</span>
              <svg className="w-3.5 h-3.5 fill-none stroke-current stroke-[2.5]" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>

            {/* Home Indicator Bar */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-20 h-0.5 bg-[#002045]/20 rounded-full z-20 pointer-events-none" />

          </div>
        </div>
      </div>
    </div>
  );
};
