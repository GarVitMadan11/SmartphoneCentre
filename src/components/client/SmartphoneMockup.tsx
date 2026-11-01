import React, { useState, useEffect } from 'react';
import { ArrowRight } from 'lucide-react';

type PreviewModel = 'apple' | 'samsung' | 'google';

interface SmartphoneMockupProps {
  onSelect?: () => void;
}

export const SmartphoneMockup: React.FC<SmartphoneMockupProps> = ({ onSelect }) => {
  const [activePreviewModel, setActivePreviewModel] = useState<PreviewModel>('apple');
  const [time, setTime] = useState<string>('08:35');
  const [rotate, setRotate] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    setRotate({ x: -y / 18, y: x / 18 });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
  };

  // Dynamic system clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const hoursStr = hours.toString().padStart(2, '0');
      setTime(`${hoursStr}:${minutes}`);
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Preview data based on active model
  const previewData = {
    apple: {
      title: 'iPhone 17 Pro Max',
      maxPrice: 'Best Price in Market',
      progressWidth: 'w-[92%]',
      chartHeights: ['h-9', 'h-13', 'h-16', 'h-24'],
    },
    samsung: {
      title: 'Galaxy S26 Ultra',
      maxPrice: 'Best Price in Market',
      progressWidth: 'w-[88%]',
      chartHeights: ['h-8', 'h-12', 'h-15', 'h-24'],
    },
    google: {
      title: 'Pixel 9 Pro XL',
      maxPrice: 'Best Price in Market',
      progressWidth: 'w-[85%]',
      chartHeights: ['h-8', 'h-11', 'h-14', 'h-24'],
    },
  }[activePreviewModel];

  // Smooth scroll handler
  const handleScrollToSearch = () => {
    if (onSelect) {
      onSelect();
    } else {
      document.getElementById('device-selector-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative flex justify-center py-2 select-none perspective-1000"
    >
      <div
        style={{
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: 'transform 0.15s ease-out',
        }}
        className="transform-style-3d relative"
      >
        {/* Physical Hardware Buttons on Left Side */}
        <div className="absolute left-[-4px] top-[108px] w-[5px] h-[20px] bg-[#27272a] rounded-l-[3px] border-l border-neutral-700/60 z-0" />
        <div className="absolute left-[-4px] top-[148px] w-[5px] h-[46px] bg-[#27272a] rounded-l-[3px] border-l border-neutral-700/60 z-0" />
        <div className="absolute left-[-4px] top-[208px] w-[5px] h-[46px] bg-[#27272a] rounded-l-[3px] border-l border-neutral-700/60 z-0" />

        {/* Physical Hardware Button on Right Side */}
        <div className="absolute right-[-4px] top-[174px] w-[5px] h-[68px] bg-[#27272a] rounded-r-[3px] border-r border-neutral-700/60 z-0" />

        {/* Outer Metallic Frame (Chassis) */}
        <div className="relative w-[285px] sm:w-[315px] h-[530px] sm:h-[570px] bg-gradient-to-b from-[#222] via-[#18181b] to-[#111] p-[8px] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.4),0_0_35px_rgba(0,32,69,0.08)] rounded-[50px] border border-slate-700/60 z-10">
          
          {/* Inner Black Bezel Rim */}
          <div className="w-full h-full bg-[#F8F9FA] rounded-[42px] p-4 flex flex-col justify-between overflow-hidden relative shadow-inner">
            
            {/* Status Bar */}
            <div className="w-full flex items-center justify-between text-xs font-bold text-slate-800 tracking-tight z-30 pt-1 px-1">
              {/* Clock */}
              <span className="text-[11px] font-bold text-slate-900">{time}</span>

              {/* Dynamic Island Capsule */}
              <div className="w-[84px] h-[22px] bg-black rounded-full flex items-center justify-between px-2.5 shadow-md">
                <div className="w-2 h-2 rounded-full bg-[#111] border border-[#222] relative">
                  <div className="absolute w-[2px] h-[2px] rounded-full bg-cyan-400/60 top-[1px] left-[1px]" />
                </div>
                <div className="w-1.5 h-1.5 rounded-full bg-[#111] border border-[#222]" />
              </div>

              {/* Cellular, Wi-Fi & Battery Icons */}
              <div className="flex items-center gap-1.5 text-slate-800">
                {/* Network Signal Bars */}
                <div className="flex items-end gap-[1px] h-2.5">
                  <div className="w-[1.5px] h-[3px] bg-slate-800 rounded-[0.5px]"></div>
                  <div className="w-[1.5px] h-[5px] bg-slate-800 rounded-[0.5px]"></div>
                  <div className="w-[1.5px] h-[7px] bg-slate-800 rounded-[0.5px]"></div>
                  <div className="w-[1.5px] h-[9px] bg-slate-800 rounded-[0.5px]"></div>
                </div>

                {/* Wi-Fi Icon */}
                <svg className="w-3 h-3 fill-current opacity-90" viewBox="0 0 24 24">
                  <path d="M12 21l-12-12c6.627-6.627 17.373-6.627 24 0l-12 12z" />
                </svg>

                {/* Battery Pill */}
                <div className="w-4 h-2.5 border border-slate-700 rounded-[3px] p-[0.5px] flex items-center relative">
                  <div className="h-full bg-emerald-500 rounded-[1px] w-[85%]"></div>
                  <div className="w-[1px] h-1 bg-slate-700 absolute -right-[2px] top-1/2 -translate-y-1/2 rounded-r-[0.5px]"></div>
                </div>
              </div>
            </div>

            {/* Segmented Brand Tabs */}
            <div className="mt-5 bg-[#EEF1F6] p-1 rounded-full flex items-center justify-between z-20 shadow-2xs">
              {(['apple', 'samsung', 'google'] as const).map(brand => {
                const label = brand === 'apple' ? 'IPHONE' : brand === 'samsung' ? 'GALAXY' : 'PIXEL';
                const isActive = activePreviewModel === brand;
                return (
                  <button
                    key={brand}
                    type="button"
                    onClick={() => setActivePreviewModel(brand)}
                    className={`flex-1 py-1.5 rounded-full text-[10px] sm:text-[11px] font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer ${
                      isActive
                        ? 'bg-white text-[#0A2540] shadow-[0_2px_8px_rgba(0,0,0,0.06)]'
                        : 'text-[#627D98] hover:text-[#0A2540]'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>

            {/* Offer Header Strip */}
            <div className="mt-4 px-1 text-left z-20">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  REPHONIX
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E6F7F0] border border-[#B7EBD5] text-[#00A86B] font-bold text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00A86B]" />
                  Live Offer
                </span>
              </div>
              <h3 className="text-2xl sm:text-[28px] font-extrabold text-[#00A86B] leading-[1.15] tracking-tight">
                {previewData.maxPrice.includes('Market') ? (
                  <>
                    Best Price in<br />Market
                  </>
                ) : (
                  previewData.maxPrice
                )}
              </h3>
            </div>

            {/* Comparison Ascending Bar Chart */}
            <div className="my-3 h-24 flex items-end justify-between gap-2.5 px-2 z-20">
              <div className={`flex-1 bg-[#EEF2F6] rounded-t-xl transition-all duration-500 ${previewData.chartHeights[0]}`} />
              <div className={`flex-1 bg-[#EEF2F6] rounded-t-xl transition-all duration-500 ${previewData.chartHeights[1]}`} />
              <div className={`flex-1 bg-[#EEF2F6] rounded-t-xl transition-all duration-500 ${previewData.chartHeights[2]}`} />
              <div className={`flex-1 bg-gradient-to-t from-[#00A86B] to-[#10B981] rounded-t-xl transition-all duration-500 shadow-[0_6px_20px_rgba(0,168,107,0.3)] ${previewData.chartHeights[3]}`} />
            </div>

            {/* Evaluation Status Card */}
            <div className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-[0_4px_16px_rgba(0,0,0,0.04)] mb-3 text-left z-20">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs sm:text-sm font-bold text-[#0A2540] truncate tracking-tight">
                  {previewData.title}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#E6F7F0] text-[#00A86B] border border-[#B7EBD5]">
                  PERFECT
                </span>
              </div>
              <div className="w-full bg-[#EEF2F6] h-2 rounded-full overflow-hidden">
                <div className={`h-full bg-[#00A86B] rounded-full transition-all duration-700 ease-out ${previewData.progressWidth}`} />
              </div>
            </div>

            {/* Primary Action Button */}
            <button 
              type="button"
              onClick={handleScrollToSearch}
              className="w-full py-3.5 bg-[#002B5B] hover:bg-[#001F42] active:scale-[0.98] text-white font-extrabold rounded-2xl text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-[0_6px_20px_rgba(0,43,91,0.25)] flex items-center justify-center gap-2 cursor-pointer z-20 mb-2"
            >
              <span>Check Value Now</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Home Indicator */}
            <div className="w-28 h-1 bg-slate-300 rounded-full mx-auto z-20" />

          </div>
        </div>
      </div>
    </div>
  );
};

export default SmartphoneMockup;
