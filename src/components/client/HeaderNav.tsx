import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Smartphone, Tablet, ChevronDown, Zap, Truck, Menu, X, User, Package, Instagram } from 'lucide-react';
import { ApiUser } from '../../utils/api';
import { BRANDS as STATIC_BRANDS } from '../../data/mockDatabase';
import { applyBrandOrder } from '../../utils/ordering';

interface HeaderNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onSelectBrand?: (brandId: string) => void;
  onSelectTabletBrand?: (brand: 'apple' | 'samsung') => void;
  onOpenTrackOrder?: () => void;
  currentUser?: ApiUser | null;
  onLogout?: () => void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentPath,
  onNavigate,
  onSelectBrand,
  onSelectTabletBrand,
  onOpenTrackOrder,
  currentUser,
  onLogout,
}) => {
  const [activeDropdown, setActiveDropdown] = useState<'phones' | 'tablets' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubMenu, setMobileSubMenu] = useState<'phones' | 'tablets' | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  // Live Launch Countdown Timer State (Target: August 22, 2026 12:00 AM IST)
  const TARGET_LAUNCH_TIME = useMemo(() => new Date('2026-08-22T00:00:00+05:30').getTime(), []);
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = Math.max(0, new Date('2026-08-22T00:00:00+05:30').getTime() - Date.now());
    return {
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / (1000 * 60)) % 60),
      seconds: Math.floor((diff / 1000) % 60),
      isLive: diff <= 0,
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const diff = Math.max(0, TARGET_LAUNCH_TIME - Date.now());
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
        isLive: diff <= 0,
      });
      if (diff <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [TARGET_LAUNCH_TIME]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBrandClick = (brandId: string) => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    onNavigate('/smartphones');
    if (onSelectBrand) onSelectBrand(brandId);
  };

  const handleTabletBrandClick = (brand: 'apple' | 'samsung') => {
    setActiveDropdown(null);
    setMobileMenuOpen(false);
    onNavigate('/tablets');
    if (onSelectTabletBrand) onSelectTabletBrand(brand);
  };



  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-canvas-pure/90 backdrop-blur-md border-b border-ice-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between" ref={navRef}>
        {/* Logo */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 group" 
          onClick={() => { setMobileMenuOpen(false); onNavigate('/'); }}
        >
          <img src="/logo.svg" className="w-8 h-8 object-contain rounded-md transition-transform group-hover:scale-105" alt="Rephonix Logo" />
          <span className="text-xl font-extrabold text-ink-navy tracking-tight">Re<span className="text-secondary">phonix</span></span>
        </div>

        {/* Desktop Nav Items */}
        <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1 xl:gap-2 text-sm font-medium text-slate-700">
          {/* Home */}
          <button
            type="button"
            onClick={() => { setActiveDropdown(null); onNavigate('/'); }}
            className={`px-3 py-2 rounded-lg transition-colors ${
              currentPath === '/' ? 'text-cobalt font-semibold bg-cobalt/5' : 'hover:text-cobalt hover:bg-slate-100/60'
            }`}
          >
            Home
          </button>

          {/* Smartphones Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(prev => prev === 'phones' ? null : 'phones')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
                currentPath === '/smartphones' || activeDropdown === 'phones'
                  ? 'text-cobalt font-semibold bg-cobalt/5'
                  : 'hover:text-cobalt hover:bg-slate-100/60'
              }`}
            >
              <Smartphone className="w-4 h-4 text-cobalt" />
              <span>Smartphones</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'phones' ? 'rotate-180 text-cobalt' : 'text-slate-400'}`} />
            </button>

            {activeDropdown === 'phones' && (
              <div 
                className="absolute top-full left-0 mt-1 w-64 bg-white dark:bg-canvas-pure border border-ice-border rounded-xl shadow-premium p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">
                  <span>Top Smartphone Brands</span>
                  <button onClick={() => { setActiveDropdown(null); onNavigate('/smartphones'); }} className="text-cobalt hover:underline text-[10px] lowercase font-normal">view all</button>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {applyBrandOrder(STATIC_BRANDS).slice(0, 8).map(b => {
                    const colorMap: Record<string, string> = {
                      'brand-apple': 'bg-zinc-800 dark:bg-zinc-200',
                      'brand-samsung': 'bg-blue-600',
                      'brand-oneplus': 'bg-red-600',
                      'brand-google': 'bg-emerald-500',
                      'brand-xiaomi': 'bg-amber-500',
                      'brand-vivo': 'bg-violet-600',
                      'brand-oppo': 'bg-emerald-600',
                      'brand-nothing': 'bg-zinc-900 dark:bg-white',
                      'brand-motorola': 'bg-blue-800',
                    };
                    return (
                      <button
                        key={b.id}
                        onClick={() => handleBrandClick(b.id)}
                        className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-cobalt text-xs font-medium transition-colors text-left"
                      >
                        <span className={`w-2 h-2 rounded-full ${colorMap[b.id] || 'bg-cobalt'}`} />
                        <span className="truncate">{b.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Tablets/iPads Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setActiveDropdown(prev => prev === 'tablets' ? null : 'tablets')}
              className={`px-3 py-2 rounded-lg flex items-center gap-1.5 transition-colors ${
                currentPath === '/tablets' || activeDropdown === 'tablets'
                  ? 'text-violet-600 font-semibold bg-violet-50'
                  : 'hover:text-violet-600 hover:bg-slate-100/60'
              }`}
            >
              <Tablet className="w-4 h-4 text-violet-600" />
              <span>Tablets/iPads</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'tablets' ? 'rotate-180 text-violet-600' : 'text-slate-400'}`} />
            </button>

            {activeDropdown === 'tablets' && (
              <div 
                className="absolute top-full left-0 mt-1 w-60 bg-white dark:bg-canvas-pure border border-ice-border rounded-xl shadow-premium p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
              >
                <div className="flex items-center justify-between px-2.5 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">
                  <span>Top Tablet Brands</span>
                  <button onClick={() => { setActiveDropdown(null); onNavigate('/tablets'); }} className="text-violet-600 hover:underline text-[10px] lowercase font-normal">view all</button>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <button onClick={() => handleTabletBrandClick('apple')} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-violet-600 text-xs font-medium transition-colors text-left">
                    <span className="w-2 h-2 rounded-full bg-zinc-800 dark:bg-zinc-200" />
                    <span>Apple iPad</span>
                  </button>
                  <button onClick={() => handleTabletBrandClick('samsung')} className="flex items-center gap-2 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-violet-600 text-xs font-medium transition-colors text-left">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>Samsung Tab</span>
                  </button>
                </div>
              </div>
            )}
          </div>



          {/* About */}
          <button
            type="button"
            onClick={() => { setActiveDropdown(null); onNavigate('/about'); }}
            className={`px-3 py-2 rounded-lg transition-colors ${
              currentPath === '/about' ? 'text-cobalt font-semibold bg-cobalt/5' : 'hover:text-cobalt hover:bg-slate-100/60'
            }`}
          >
            About
          </button>

          {/* Contact */}
          <button
            type="button"
            onClick={() => { setActiveDropdown(null); onNavigate('/contact'); }}
            className={`px-3 py-2 rounded-lg transition-colors ${
              currentPath === '/contact' ? 'text-cobalt font-semibold bg-cobalt/5' : 'hover:text-cobalt hover:bg-slate-100/60'
            }`}
          >
            Contact
          </button>
        </nav>

        {/* Right CTA Utilities */}
        <div className="hidden sm:flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => { setActiveDropdown(null); setUserDropdownOpen(false); onNavigate('/smartphones'); }}
            className="px-3.5 py-1.5 rounded-lg bg-cobalt hover:bg-cobalt-hover text-white font-semibold text-xs transition-all shadow-sm flex items-center gap-1.5 active:scale-95"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Instant Quote</span>
          </button>

          {onOpenTrackOrder && (
            <button
              type="button"
              onClick={() => { setActiveDropdown(null); setUserDropdownOpen(false); onOpenTrackOrder(); }}
              className="px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-semibold text-xs transition-all flex items-center gap-1.5 border border-ice-border hover:border-cobalt"
            >
              <Truck className="w-3.5 h-3.5 text-cobalt" />
              <span>Track Order</span>
            </button>
          )}


          {/* Customer Auth Session Controls */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => { setActiveDropdown(null); setUserDropdownOpen(prev => !prev); }}
                className={`px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 border border-ice-border hover:border-cobalt hover:text-cobalt font-semibold text-xs transition-all bg-canvas-white ${
                  userDropdownOpen ? 'border-cobalt text-cobalt' : 'text-slate-700 dark:text-zinc-200'
                }`}
              >
                <span>Hi, {currentUser.name.split(' ')[0]}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180 text-cobalt' : 'text-slate-400'}`} />
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-canvas-pure border border-ice-border rounded-lg shadow-premium p-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <button
                    onClick={() => { 
                      setUserDropdownOpen(false); 
                      if (onOpenTrackOrder) {
                        onOpenTrackOrder();
                      } else {
                        onNavigate('/profile');
                      }
                    }}
                    className="w-full text-left text-xs font-semibold p-2 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-cobalt transition-colors flex items-center gap-2"
                  >
                    <Package className="w-3.5 h-3.5 text-cobalt" />
                    <span>Your Bookings</span>
                  </button>
                  <button
                    onClick={() => { setUserDropdownOpen(false); onNavigate('/profile'); }}
                    className="w-full text-left text-xs font-semibold p-2 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-200 hover:text-cobalt transition-colors flex items-center gap-2"
                  >
                    <User className="w-3.5 h-3.5 text-zinc-400" />
                    <span>Profile Settings</span>
                  </button>
                  <div className="my-1 border-t border-ice-border/60" />
                  <button
                    onClick={() => { setUserDropdownOpen(false); onLogout?.(); }}
                    className="w-full text-left text-xs font-semibold p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 transition-colors flex items-center gap-2"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => { setActiveDropdown(null); setUserDropdownOpen(false); onNavigate('/login'); }}
              className="px-3.5 py-1.5 rounded-lg border border-ice-border hover:border-cobalt hover:text-cobalt text-slate-700 dark:text-zinc-200 font-semibold text-xs transition-all active:scale-95"
            >
              Login
            </button>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => { setActiveDropdown(null); setUserDropdownOpen(false); onNavigate('/smartphones'); }}
            className="px-2.5 py-1.5 rounded-lg bg-cobalt text-white font-semibold text-xs flex items-center gap-1"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Quote</span>
          </button>
          <button
            type="button"
            aria-label="Toggle Navigation Menu"
            className="p-2 rounded-lg border border-ice-border text-slate-700 hover:border-cobalt hover:text-cobalt transition-colors"
            onClick={() => { setActiveDropdown(null); setUserDropdownOpen(false); setMobileMenuOpen(o => !o); }}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-ice-border bg-white dark:bg-canvas-pure px-4 py-3 space-y-1 animate-in fade-in duration-150">
          <button
            onClick={() => { setMobileMenuOpen(false); onNavigate('/'); }}
            className={`w-full text-left text-sm font-semibold py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors ${currentPath === '/' ? 'text-cobalt bg-cobalt/5' : 'text-slate-700'}`}
          >
            Home
          </button>

          {/* Mobile Smartphones */}
          <div>
            <div 
              onClick={() => setMobileSubMenu(prev => prev === 'phones' ? null : 'phones')}
              className={`w-full flex items-center justify-between text-sm font-semibold py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors ${currentPath === '/smartphones' ? 'text-cobalt bg-cobalt/5' : 'text-slate-700'}`}
            >
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cobalt" />
                <span>Smartphones</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${mobileSubMenu === 'phones' ? 'rotate-180' : ''}`} />
            </div>

            {mobileSubMenu === 'phones' && (
              <div className="pl-6 pr-2 py-1 space-y-1 bg-slate-50 dark:bg-zinc-900/40 rounded-lg my-1">
                <button onClick={() => { setMobileMenuOpen(false); onNavigate('/smartphones'); }} className="w-full text-left text-xs font-semibold py-1.5 px-2 text-cobalt">All Smartphones →</button>
                <button onClick={() => handleBrandClick('brand-apple')} className="w-full text-left text-xs text-slate-600 py-1 px-2 hover:text-cobalt">Apple iPhone</button>
                <button onClick={() => handleBrandClick('brand-samsung')} className="w-full text-left text-xs text-slate-600 py-1 px-2 hover:text-cobalt">Samsung Galaxy</button>
                <button onClick={() => handleBrandClick('brand-oneplus')} className="w-full text-left text-xs text-slate-600 py-1 px-2 hover:text-cobalt">OnePlus</button>
                <button onClick={() => handleBrandClick('brand-google')} className="w-full text-left text-xs text-slate-600 py-1 px-2 hover:text-cobalt">Google Pixel</button>
                <button onClick={() => handleBrandClick('brand-xiaomi')} className="w-full text-left text-xs text-slate-600 py-1 px-2 hover:text-cobalt">Xiaomi / Redmi</button>
                <button onClick={() => handleBrandClick('brand-vivo')} className="w-full text-left text-xs text-slate-600 py-1 px-2 hover:text-cobalt">Vivo / iQOO</button>
              </div>
            )}
          </div>

          {/* Mobile Tablets */}
          <div>
            <div 
              onClick={() => setMobileSubMenu(prev => prev === 'tablets' ? null : 'tablets')}
              className={`w-full flex items-center justify-between text-sm font-semibold py-2 px-3 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors ${currentPath === '/tablets' ? 'text-violet-600 bg-violet-50' : 'text-slate-700'}`}
            >
              <div className="flex items-center gap-2">
                <Tablet className="w-4 h-4 text-violet-600" />
                <span>Tablets/iPads</span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${mobileSubMenu === 'tablets' ? 'rotate-180' : ''}`} />
            </div>

            {mobileSubMenu === 'tablets' && (
              <div className="pl-6 pr-2 py-1 space-y-1 bg-slate-50 dark:bg-zinc-900/40 rounded-lg my-1">
                <button onClick={() => { setMobileMenuOpen(false); onNavigate('/tablets'); }} className="w-full text-left text-xs font-semibold py-1.5 px-2 text-violet-600">All Tablets →</button>
                <button onClick={() => handleTabletBrandClick('apple')} className="w-full text-left text-xs text-slate-600 py-1 px-2 hover:text-violet-600">Apple iPad</button>
                <button onClick={() => handleTabletBrandClick('samsung')} className="w-full text-left text-xs text-slate-600 py-1 px-2 hover:text-violet-600">Samsung Tab</button>
              </div>
            )}
          </div>



          <button
            onClick={() => { setMobileMenuOpen(false); onNavigate('/about'); }}
            className={`w-full text-left text-sm font-semibold py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors ${currentPath === '/about' ? 'text-cobalt bg-cobalt/5' : 'text-slate-700'}`}
          >
            About
          </button>

          <button
            onClick={() => { setMobileMenuOpen(false); onNavigate('/contact'); }}
            className={`w-full text-left text-sm font-semibold py-2 px-3 rounded-lg hover:bg-slate-100 transition-colors ${currentPath === '/contact' ? 'text-cobalt bg-cobalt/5' : 'text-slate-700'}`}
          >
            Contact
          </button>

          {onOpenTrackOrder && (
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenTrackOrder(); }}
              className="w-full flex items-center gap-2 text-sm font-semibold text-cobalt py-2 px-3 rounded-lg bg-cobalt/10 hover:bg-cobalt/20 transition-colors"
            >
              <Truck className="w-4 h-4 text-cobalt" />
              <span>Track Order</span>
            </button>
          )}

          <a
            href="https://www.instagram.com/rephonix.in/"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-2 text-sm font-semibold text-pink-600 py-2 px-3 rounded-lg bg-pink-500/10 hover:bg-pink-500/20 transition-colors border border-pink-500/20"
          >
            <Instagram className="w-4 h-4 text-pink-600" />
            <span>Instagram (@rephonix.in)</span>
          </a>

          {/* Mobile User Session controls */}
          {currentUser ? (
            <div className="border-t border-ice-border/40 pt-2 mt-2 space-y-1">
              <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-ink-muted">
                Hi, {currentUser.name}
              </div>
              <button
                onClick={() => { 
                  setMobileMenuOpen(false); 
                  if (onOpenTrackOrder) {
                    onOpenTrackOrder();
                  } else {
                    onNavigate('/profile');
                  }
                }}
                className="w-full text-left text-sm font-semibold py-2 px-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-2"
              >
                <Package className="w-4 h-4 text-cobalt" />
                <span>Your Bookings</span>
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onNavigate('/profile'); }}
                className="w-full text-left text-sm font-semibold py-2 px-3 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-2"
              >
                <User className="w-4 h-4 text-zinc-400" />
                <span>Profile Settings</span>
              </button>
              <button
                onClick={() => { setMobileMenuOpen(false); onLogout?.(); }}
                className="w-full text-left text-sm font-semibold py-2 px-3 rounded-lg hover:bg-red-50 text-red-500 transition-colors flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setMobileMenuOpen(false); onNavigate('/login'); }}
              className="w-full text-left text-sm font-semibold py-2 px-3 rounded-lg hover:bg-slate-100 text-cobalt border border-cobalt/10 bg-cobalt/5 mt-2"
            >
              Login / Register
            </button>
          )}
        </div>
      )}

      {/* Launch Announcement Strip (Rephonix Design System) */}
      <div className="bg-slate-900 text-white border-t border-b border-white/10 py-3 px-4 sm:px-6 shadow-md font-outfit">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          {/* Left: Clean Tag & Launch Date Announcement */}
          <div className="flex items-center justify-center sm:justify-start gap-3 min-w-0 w-full lg:w-auto">
            <span className="flex-shrink-0 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-semibold tracking-wide shadow-xs">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
              Grand Opening
            </span>
            <span className="font-semibold text-slate-100 truncate text-xs sm:text-sm md:text-base tracking-wide">
              Rephonix Platform Launches <span className="text-white font-bold underline decoration-blue-400 decoration-2 underline-offset-4">August 22, 2026</span> at <span className="text-blue-300 font-bold">12:00 AM IST</span>
            </span>
          </div>

          {/* Right: Clean Live Countdown Clock */}
          <div className="flex items-center justify-center lg:justify-end gap-3 text-xs sm:text-sm w-full lg:w-auto">
            <span className="text-slate-300 text-xs font-medium hidden sm:inline tracking-wide">Launch Countdown:</span>
            
            {timeLeft.isLive ? (
              <span className="text-emerald-400 font-bold text-sm px-3.5 py-1.5 rounded-md bg-emerald-500/15 border border-emerald-400/40">
                🎉 WE ARE LIVE NOW!
              </span>
            ) : (
              <div className="flex items-center gap-1.5 font-mono text-sm sm:text-base">
                <div className="flex items-center gap-1 bg-white/10 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-white/15 text-white font-bold shadow-xs">
                  <span>{String(timeLeft.days).padStart(2, '0')}</span>
                  <span className="text-xs text-slate-400 font-sans font-medium uppercase">d</span>
                </div>
                <span className="text-slate-500 font-bold text-sm sm:text-base">:</span>
                
                <div className="flex items-center gap-1 bg-white/10 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-white/15 text-white font-bold shadow-xs">
                  <span>{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-xs text-slate-400 font-sans font-medium uppercase">h</span>
                </div>
                <span className="text-slate-500 font-bold text-sm sm:text-base">:</span>
                
                <div className="flex items-center gap-1 bg-white/10 dark:bg-slate-800 px-2.5 py-1 rounded-md border border-white/15 text-white font-bold shadow-xs">
                  <span>{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-xs text-slate-400 font-sans font-medium uppercase">m</span>
                </div>
                <span className="text-slate-500 font-bold text-sm sm:text-base">:</span>
                
                <div className="flex items-center gap-1 bg-blue-600/30 border border-blue-400/50 px-2.5 py-1 rounded-md text-blue-300 font-bold shadow-xs">
                  <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-xs text-blue-300/80 font-sans font-medium uppercase">s</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
