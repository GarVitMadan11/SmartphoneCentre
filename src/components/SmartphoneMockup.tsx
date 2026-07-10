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
      gradient: 'from-slate-950 via-slate-900 to-zinc-900',
      title: 'iPhone 17 Pro Max',
      maxPrice: '₹85,000',
      accentColor: 'text-emerald-400',
      barColor: 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]',
      progressWidth: 'w-[94%]',
      chartHeights: ['h-10', 'h-14', 'h-20', 'h-24'],
    },
    samsung: {
      gradient: 'from-slate-950 via-indigo-950/70 to-neutral-900',
      title: 'Galaxy S26 Ultra',
      maxPrice: '₹50,000',
      accentColor: 'text-indigo-400',
      barColor: 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]',
      progressWidth: 'w-[88%]',
      chartHeights: ['h-8', 'h-12', 'h-16', 'h-22'],
    },
    google: {
      gradient: 'from-slate-950 via-teal-950/70 to-stone-900',
      title: 'Pixel 8 Pro',
      maxPrice: '₹27,000',
      accentColor: 'text-teal-400',
      barColor: 'bg-teal-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]',
      progressWidth: 'w-[78%]',
      chartHeights: ['h-6', 'h-10', 'h-14', 'h-18'],
    },
  }[activePreviewModel];

  // Smooth scroll handler
  const handleScrollToSearch = () => {
    document.getElementById('device-selector-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative flex justify-center py-4 select-none">
      {/* Physical Hardware Buttons on Left Side (Mute switch + Volume buttons) */}
      <div className="absolute left-[-4px] top-[120px] w-[5px] h-[20px] bg-gradient-to-r from-slate-600 to-slate-400 rounded-l-[2px] shadow-md z-0 border border-slate-700" />
      <div className="absolute left-[-4px] top-[160px] w-[5px] h-[48px] bg-gradient-to-r from-slate-600 to-slate-400 rounded-l-[2px] shadow-md z-0 border border-slate-700" />
      <div className="absolute left-[-4px] top-[220px] w-[5px] h-[48px] bg-gradient-to-r from-slate-600 to-slate-400 rounded-l-[2px] shadow-md z-0 border border-slate-700" />

      {/* Physical Hardware Buttons on Right Side (Power Button) */}
      <div className="absolute right-[-4px] top-[190px] w-[5px] h-[72px] bg-gradient-to-l from-slate-600 to-slate-400 rounded-r-[2px] shadow-md z-0 border border-slate-700" />

      {/* Outer Metallic Frame (Chassis) */}
      <div className="relative w-[292px] sm:w-[324px] h-[524px] sm:h-[564px] bg-gradient-to-b from-slate-600 via-slate-800 to-slate-950 rounded-[50px] p-[6px] shadow-2xl border border-slate-500/20 z-10">
        
        {/* Inner Black Bezel Rim */}
        <div className="w-full h-full bg-black rounded-[44px] p-[6px] shadow-inner relative flex flex-col justify-between overflow-hidden">
          
          {/* Glass Screen Reflection Overlay */}
          <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.04] to-white/[0.12] z-20 mix-blend-overlay rotate-[15deg] scale-[1.6]" />

          {/* Notch / Camera Cutout Area */}
          {activePreviewModel === 'apple' ? (
            /* Apple Dynamic Island Notch */
            <div 
              onMouseEnter={() => setIslandExpanded(true)}
              onMouseLeave={() => setIslandExpanded(false)}
              onClick={() => setIslandExpanded(!islandExpanded)}
              className={`absolute top-2.5 left-1/2 -translate-x-1/2 bg-black rounded-full z-30 flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden border border-white/5 shadow-md ${
                islandExpanded 
                  ? 'w-[210px] sm:w-[230px] h-[32px] px-3' 
                  : 'w-[90px] sm:w-[100px] h-[22px] px-2'
              }`}
            >
              {islandExpanded ? (
                <div className="w-full flex items-center justify-between text-[9px] text-emerald-400 font-sans tracking-wide animate-fade-in whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    <span className="font-semibold text-white/90">Data Wipe: SECURE</span>
                  </div>
                  <span className="text-[8px] bg-emerald-500/20 px-1.5 py-0.5 rounded-full border border-emerald-500/20 text-emerald-300 font-bold">100% Wiped</span>
                </div>
              ) : (
                <div className="flex justify-between items-center w-full px-1">
                  <div className="w-2.5 h-2.5 bg-neutral-900 rounded-full border border-neutral-800 shadow-inner flex-shrink-0"></div>
                  <div className="w-1.5 h-1 bg-neutral-900 rounded-full flex-shrink-0"></div>
                </div>
              )}
            </div>
          ) : (
            /* Samsung / Google Center Pinhole Camera */
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-neutral-950 rounded-full z-30 border border-neutral-900 shadow-inner flex items-center justify-center">
              <div className="w-1 h-1 bg-blue-900/60 rounded-full"></div>
            </div>
          )}

          {/* Screen Content Wrapper */}
          <div className={`w-full h-full bg-gradient-to-tr ${previewData.gradient} rounded-[38px] overflow-hidden relative flex flex-col justify-between p-4 sm:p-5 text-white text-left`}>
            
            {/* Status Bar */}
            <div className="w-full flex justify-between items-center px-2 pt-1.5 text-[10px] font-bold font-sans tracking-tight z-25 text-white/90">
              <span className="ml-1">{time}</span>
              <div className="flex items-center gap-1.5 mr-1">
                {/* Network Signal Bars */}
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M2 22h20V2z" className="opacity-30" />
                  <path d="M2 22h14V8z" />
                </svg>
                {/* 5G Label */}
                <span className="text-[9px] font-extrabold tracking-tighter">5G</span>
                {/* Wi-Fi Icon */}
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                  <path d="M12 21l-12-12c6.627-6.627 17.373-6.627 24 0l-12 12z" />
                </svg>
                {/* Battery percentage & icon */}
                <div className="flex items-center gap-0.5 bg-white/10 rounded-full px-1.5 py-0.5 border border-white/5 scale-[0.95]">
                  <span className="text-[8px] font-normal opacity-90">98%</span>
                  <svg className="w-3 h-3 fill-current text-emerald-400" viewBox="0 0 24 24">
                    <path d="M17 5H3a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2zm3 3h1.5a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H20V8z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Interactive Model Switcher Tabs */}
            <div className="mt-8 flex bg-white/5 p-1 rounded-full border border-white/5 backdrop-blur-md z-10 mx-1">
              {(['apple', 'samsung', 'google'] as const).map(brand => (
                <button
                  key={brand}
                  onClick={() => {
                    setActivePreviewModel(brand);
                    setIslandExpanded(false);
                  }}
                  className={`flex-1 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider transition-all duration-300 ${
                    activePreviewModel === brand
                      ? 'bg-white text-slate-950 shadow-md scale-[1.03]'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {brand === 'apple' ? 'iPhone' : brand === 'samsung' ? 'Galaxy' : 'Pixel'}
                </button>
              ))}
            </div>

            {/* Price Offer Callout */}
            <div className="mt-4 flex justify-between items-start px-1 z-10">
              <div>
                <p className="text-[9px] text-slate-400 font-mono tracking-widest uppercase">Reliable Exchange</p>
                <h3 className="text-lg font-bold mt-0.5 leading-tight">
                  Get up to<br />
                  <span className={`text-2xl font-black ${previewData.accentColor} transition-colors duration-300`}>
                    {previewData.maxPrice}
                  </span>
                </h3>
              </div>
              <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-[8px] font-bold border border-emerald-500/30 whitespace-nowrap">
                Live Offer
              </span>
            </div>

            {/* Bar Chart Graphic */}
            <div className="my-3 h-20 flex items-end gap-1.5 px-3 z-10">
              <div className={`w-full bg-white/10 ${previewData.chartHeights[0]} rounded-t-sm transition-all duration-500`} />
              <div className={`w-full bg-white/10 ${previewData.chartHeights[1]} rounded-t-sm transition-all duration-500`} />
              <div className={`w-full bg-white/10 ${previewData.chartHeights[2]} rounded-t-sm transition-all duration-500`} />
              <div className={`w-full ${previewData.barColor} ${previewData.chartHeights[3]} rounded-t-sm transition-all duration-500`} />
            </div>

            {/* Selected Device Grading Spec */}
            <div className="mb-3 z-10">
              <div className="p-2.5 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm">
                <div className="flex justify-between text-[11px] mb-1.5 text-slate-300">
                  <span className="font-semibold text-white/95 truncate pr-2">{previewData.title}</span>
                  <span className="text-white font-bold">Flawless</span>
                </div>
                <div className="w-full bg-white/10 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full ${previewData.barColor} ${previewData.progressWidth} transition-all duration-500`} />
                </div>
              </div>
            </div>

            {/* Main Interactive Button inside mockup */}
            <button 
              onClick={handleScrollToSearch}
              className={`w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98] z-10 mb-2`}
            >
              Check Value Now
            </button>

            {/* Home Indicator Bar */}
            <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-24 h-1 bg-white/30 rounded-full z-20 pointer-events-none" />

          </div>
        </div>
      </div>
    </div>
  );
};
