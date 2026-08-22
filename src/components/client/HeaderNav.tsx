import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Smartphone, Tablet, ChevronDown, Zap, Truck, Menu, X, User, Package, Search, ArrowRight, Sparkles } from 'lucide-react';
import { ApiUser } from '../../utils/api';
import { BRANDS as STATIC_BRANDS, Model, getDeviceImage, getMaxVariantPrice } from '../../data/mockDatabase';
import { applyBrandOrder } from '../../utils/ordering';

interface HeaderNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
  onSelectBrand?: (brandId: string) => void;
  onSelectTabletBrand?: (brand: 'apple' | 'samsung') => void;
  onSelectModel?: (modelId: string) => void;
  onOpenTrackOrder?: () => void;
  currentUser?: ApiUser | null;
  onLogout?: () => void;
  models?: Model[];
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentPath,
  onNavigate,
  onSelectBrand,
  onSelectTabletBrand,
  onSelectModel,
  onOpenTrackOrder,
  currentUser,
  onLogout,
  models = [],
}) => {
  const [activeDropdown, setActiveDropdown] = useState<'phones' | 'tablets' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubMenu, setMobileSubMenu] = useState<'phones' | 'tablets' | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // Spotlight Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const navRef = useRef<HTMLDivElement>(null);
  const modalInputRef = useRef<HTMLInputElement>(null);

  // Close dropdowns on click outside
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

  // Global keyboard shortcut: Cmd+K / Ctrl+K or "/" to open Spotlight Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-focus input when search modal opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => modalInputRef.current?.focus(), 50);
    } else {
      setSearchQuery('');
      setSelectedIndex(0);
    }
  }, [isSearchOpen]);

  // Filter models based on search query or show popular models when empty
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      return models
        .filter(m => !m.hidden && (m.category === 'flagship' || m.name.includes('iPhone 1') || m.name.includes('S24') || m.name.includes('OnePlus 12')))
        .slice(0, 6);
    }
    const q = searchQuery.toLowerCase().trim();
    return models
      .filter(m => !m.hidden && (m.name.toLowerCase().includes(q) || m.brandId.toLowerCase().includes(q)))
      .slice(0, 8);
  }, [models, searchQuery]);

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

  const handleSelectSearchedModel = (model: Model) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    setMobileMenuOpen(false);
    if (onSelectModel) {
      onSelectModel(model.id);
    } else {
      onNavigate(`/smartphones?q=${encodeURIComponent(model.name)}`);
    }
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchResults.length > 0 && selectedIndex >= 0 && searchResults[selectedIndex]) {
      handleSelectSearchedModel(searchResults[selectedIndex]);
      return;
    }
    if (searchQuery.trim()) {
      setIsSearchOpen(false);
      setMobileMenuOpen(false);
      onNavigate(`/smartphones?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleModalKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  const firstName = currentUser?.name ? currentUser.name.trim().split(' ')[0] : 'Account';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-ice-border shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4" ref={navRef}>
          
          {/* Left Brand Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 group select-none" 
            onClick={() => { setMobileMenuOpen(false); onNavigate('/'); }}
          >
            <div className="w-8 h-8 rounded-lg bg-[#001736] flex items-center justify-center shadow-xs p-1">
              <img src="/logo.svg" className="w-full h-full object-contain" alt="Rephonix Logo" />
            </div>
            <span className="text-xl sm:text-2xl font-extrabold font-outfit text-ink-navy tracking-tight group-hover:text-cobalt transition-colors">
              Re<span className="text-secondary">phonix</span>
            </span>
          </div>

          {/* Center-Left Desktop Nav Links */}
          <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-xs sm:text-sm font-semibold text-slate-700 shrink-0">
            
            {/* Home */}
            <button
              type="button"
              onClick={() => { setActiveDropdown(null); onNavigate('/'); }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                currentPath === '/' 
                  ? 'text-cobalt font-bold bg-cobalt/10 shadow-xs' 
                  : 'hover:text-cobalt hover:bg-slate-100 text-slate-700'
              }`}
            >
              Home
            </button>

            {/* Smartphones Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(prev => prev === 'phones' ? null : 'phones')}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                  currentPath === '/smartphones' || activeDropdown === 'phones'
                    ? 'text-cobalt font-bold bg-cobalt/10 shadow-xs'
                    : 'hover:text-cobalt hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-cobalt" />
                <span>Smartphones</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'phones' ? 'rotate-180 text-cobalt' : 'text-slate-400'}`} />
              </button>

              {activeDropdown === 'phones' && (
                <div 
                  className="absolute top-full left-0 mt-2 w-64 bg-white border border-ice-border rounded-2xl shadow-premium p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">
                    <span>Top Brands</span>
                    <button onClick={() => { setActiveDropdown(null); onNavigate('/smartphones'); }} className="text-cobalt hover:underline text-[10px] lowercase font-semibold">view all</button>
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-1.5">
                    {applyBrandOrder(STATIC_BRANDS).slice(0, 8).map(b => {
                      const colorMap: Record<string, string> = {
                        'brand-apple': 'bg-zinc-800',
                        'brand-samsung': 'bg-blue-600',
                        'brand-oneplus': 'bg-red-600',
                        'brand-google': 'bg-emerald-500',
                        'brand-xiaomi': 'bg-amber-500',
                        'brand-vivo': 'bg-violet-600',
                        'brand-oppo': 'bg-emerald-600',
                        'brand-nothing': 'bg-zinc-900',
                        'brand-motorola': 'bg-blue-800',
                      };
                      return (
                        <button
                          key={b.id}
                          onClick={() => handleBrandClick(b.id)}
                          className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-cobalt text-xs font-medium transition-colors text-left"
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
                className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${
                  currentPath === '/tablets' || activeDropdown === 'tablets'
                    ? 'text-violet-700 font-bold bg-violet-50 shadow-xs'
                    : 'hover:text-violet-700 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <Tablet className="w-3.5 h-3.5 text-violet-600" />
                <span>Tablets/iPads</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'tablets' ? 'rotate-180 text-violet-600' : 'text-slate-400'}`} />
              </button>

              {activeDropdown === 'tablets' && (
                <div 
                  className="absolute top-full left-0 mt-2 w-60 bg-white border border-ice-border rounded-2xl shadow-premium p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit">
                    <span>Top Tablet Brands</span>
                    <button onClick={() => { setActiveDropdown(null); onNavigate('/tablets'); }} className="text-violet-600 hover:underline text-[10px] lowercase font-semibold">view all</button>
                  </div>
                  <div className="grid grid-cols-2 gap-1 mt-1.5">
                    <button onClick={() => handleTabletBrandClick('apple')} className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-violet-600 text-xs font-medium transition-colors text-left">
                      <span className="w-2 h-2 rounded-full bg-zinc-800" />
                      <span>Apple iPad</span>
                    </button>
                    <button onClick={() => handleTabletBrandClick('samsung')} className="flex items-center gap-2 p-2 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-violet-600 text-xs font-medium transition-colors text-left">
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
              className={`px-3 py-1.5 rounded-xl transition-all ${
                currentPath === '/about' 
                  ? 'text-cobalt font-bold bg-cobalt/10 shadow-xs' 
                  : 'hover:text-cobalt hover:bg-slate-100 text-slate-700'
              }`}
            >
              About
            </button>

            {/* Contact */}
            <button
              type="button"
              onClick={() => { setActiveDropdown(null); onNavigate('/contact'); }}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                currentPath === '/contact' 
                  ? 'text-cobalt font-bold bg-cobalt/10 shadow-xs' 
                  : 'hover:text-cobalt hover:bg-slate-100 text-slate-700'
              }`}
            >
              Contact
            </button>
          </nav>

          {/* ── In-Between Spotlight Search Trigger Icon Button ──────────────── */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="p-2 sm:p-2.5 rounded-xl border border-ice-border hover:border-cobalt hover:text-cobalt text-slate-600 bg-slate-50 hover:bg-slate-100 transition-all shadow-2xs cursor-pointer flex items-center justify-center shrink-0 group"
              aria-label="Search models"
              title="Search models (⌘K)"
            >
              <Search className="w-4 h-4 text-slate-500 group-hover:text-cobalt transition-colors shrink-0" />
            </button>
          </div>

          {/* Right CTA Actions */}
          <div className="hidden sm:flex items-center gap-2 shrink-0">
            
            {/* Instant Quote Button */}
            <button
              type="button"
              onClick={() => { setActiveDropdown(null); setUserDropdownOpen(false); onNavigate('/smartphones'); }}
              className="px-3 py-1.5 rounded-xl bg-cobalt hover:bg-cobalt-hover text-white font-bold text-xs transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
            >
              <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
              <span className="whitespace-nowrap">Instant Quote</span>
            </button>

            {/* Track Order Button */}
            {onOpenTrackOrder && (
              <button
                type="button"
                onClick={() => { setActiveDropdown(null); setUserDropdownOpen(false); onOpenTrackOrder(); }}
                className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-cobalt font-bold text-xs transition-all flex items-center gap-1.5 border border-ice-border hover:border-cobalt/40 cursor-pointer shrink-0"
              >
                <Truck className="w-3.5 h-3.5 text-cobalt shrink-0" />
                <span className="whitespace-nowrap">Track Order</span>
              </button>
            )}

            {/* Customer Auth Profile Badge */}
            {currentUser ? (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => { setActiveDropdown(null); setUserDropdownOpen(prev => !prev); }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center gap-1.5 sm:gap-2 border border-ice-border hover:border-cobalt/50 font-bold text-xs transition-all bg-canvas-white hover:bg-slate-50 cursor-pointer shrink-0 ${
                    userDropdownOpen ? 'border-cobalt text-cobalt ring-2 ring-cobalt/10' : 'text-slate-800'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cobalt to-indigo-600 text-white flex items-center justify-center text-[11px] font-black shadow-xs shrink-0">
                    {initial}
                  </div>
                  <span className="truncate max-w-[80px] sm:max-w-[120px] whitespace-nowrap">Hi, {firstName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180 text-cobalt' : 'text-slate-400'}`} />
                </button>

                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-ice-border rounded-2xl shadow-premium p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="px-3 py-2 border-b border-ice-border/60 mb-1">
                      <p className="text-xs font-bold text-ink-navy truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400 truncate">{currentUser.email}</p>
                    </div>
                    <button
                      onClick={() => { 
                        setUserDropdownOpen(false); 
                        if (onOpenTrackOrder) {
                          onOpenTrackOrder();
                        } else {
                          onNavigate('/profile');
                        }
                      }}
                      className="w-full text-left text-xs font-semibold p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-cobalt transition-colors flex items-center gap-2.5"
                    >
                      <Package className="w-4 h-4 text-cobalt" />
                      <span>Your Bookings</span>
                    </button>
                    <button
                      onClick={() => { setUserDropdownOpen(false); onNavigate('/profile'); }}
                      className="w-full text-left text-xs font-semibold p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-cobalt transition-colors flex items-center gap-2.5"
                    >
                      <User className="w-4 h-4 text-slate-400" />
                      <span>Profile Settings</span>
                    </button>
                    <div className="my-1 border-t border-ice-border/60" />
                    <button
                      onClick={() => { setUserDropdownOpen(false); onLogout?.(); }}
                      className="w-full text-left text-xs font-semibold p-2.5 rounded-xl hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2.5"
                    >
                      <X className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => { setActiveDropdown(null); setUserDropdownOpen(false); onNavigate('/login'); }}
                className="px-4 py-1.5 rounded-xl border border-ice-border hover:border-cobalt hover:text-cobalt text-slate-700 font-bold text-xs transition-all active:scale-95 cursor-pointer bg-white"
              >
                Login
              </button>
            )}
          </div>

          {/* Mobile Hamburger Navigation Button */}
          <div className="flex items-center gap-2 lg:hidden">
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

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-ice-border bg-white px-4 py-3 space-y-2 animate-in fade-in duration-150">
            
            {/* Mobile Search Button */}
            <button 
              type="button" 
              onClick={() => {
                setMobileMenuOpen(false);
                setIsSearchOpen(true);
              }}
              className="w-full flex items-center justify-between bg-slate-50 border border-ice-border rounded-xl px-3 py-2 text-slate-400 text-xs"
            >
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-slate-400" />
                <span>Search phone or tablet model...</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>

            <button
              onClick={() => { setMobileMenuOpen(false); onNavigate('/'); }}
              className={`w-full text-left text-sm font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-100 transition-colors ${currentPath === '/' ? 'text-cobalt bg-cobalt/10 font-bold' : 'text-slate-700'}`}
            >
              Home
            </button>

            {/* Mobile Smartphones */}
            <div>
              <div 
                onClick={() => setMobileSubMenu(prev => prev === 'phones' ? null : 'phones')}
                className={`w-full flex items-center justify-between text-sm font-semibold py-2.5 px-3 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors ${currentPath === '/smartphones' ? 'text-cobalt bg-cobalt/10 font-bold' : 'text-slate-700'}`}
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cobalt" />
                  <span>Smartphones</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileSubMenu === 'phones' ? 'rotate-180 text-cobalt' : 'text-slate-400'}`} />
              </div>

              {mobileSubMenu === 'phones' && (
                <div className="pl-6 py-1 space-y-1 bg-slate-50 rounded-xl my-1">
                  {applyBrandOrder(STATIC_BRANDS).slice(0, 8).map(b => (
                    <button
                      key={b.id}
                      onClick={() => handleBrandClick(b.id)}
                      className="w-full text-left text-xs py-2 px-3 text-slate-600 hover:text-cobalt font-medium flex items-center gap-2"
                    >
                      <span>•</span>
                      <span>{b.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile Tablets */}
            <div>
              <div 
                onClick={() => setMobileSubMenu(prev => prev === 'tablets' ? null : 'tablets')}
                className={`w-full flex items-center justify-between text-sm font-semibold py-2.5 px-3 rounded-xl cursor-pointer hover:bg-slate-100 transition-colors ${currentPath === '/tablets' ? 'text-violet-700 bg-violet-50 font-bold' : 'text-slate-700'}`}
              >
                <div className="flex items-center gap-2">
                  <Tablet className="w-4 h-4 text-violet-600" />
                  <span>Tablets / iPads</span>
                </div>
                <ChevronDown className={`w-4 h-4 transition-transform ${mobileSubMenu === 'tablets' ? 'rotate-180 text-violet-600' : 'text-slate-400'}`} />
              </div>

              {mobileSubMenu === 'tablets' && (
                <div className="pl-6 py-1 space-y-1 bg-slate-50 rounded-xl my-1">
                  <button onClick={() => handleTabletBrandClick('apple')} className="w-full text-left text-xs py-2 px-3 text-slate-600 hover:text-violet-600 font-medium flex items-center gap-2">
                    <span>•</span>
                    <span>Apple iPad</span>
                  </button>
                  <button onClick={() => handleTabletBrandClick('samsung')} className="w-full text-left text-xs py-2 px-3 text-slate-600 hover:text-violet-600 font-medium flex items-center gap-2">
                    <span>•</span>
                    <span>Samsung Tab</span>
                  </button>
                </div>
              )}
            </div>

            <button
              onClick={() => { setMobileMenuOpen(false); onNavigate('/about'); }}
              className={`w-full text-left text-sm font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-100 transition-colors ${currentPath === '/about' ? 'text-cobalt bg-cobalt/10 font-bold' : 'text-slate-700'}`}
            >
              About
            </button>

            <button
              onClick={() => { setMobileMenuOpen(false); onNavigate('/contact'); }}
              className={`w-full text-left text-sm font-semibold py-2.5 px-3 rounded-xl hover:bg-slate-100 transition-colors ${currentPath === '/contact' ? 'text-cobalt bg-cobalt/10 font-bold' : 'text-slate-700'}`}
            >
              Contact
            </button>

            {/* Mobile Auth Options */}
            <div className="pt-2 border-t border-ice-border/60">
              {currentUser ? (
                <div className="space-y-1">
                  <div className="px-3 py-1 text-xs font-bold text-ink-navy">
                    Signed in as {currentUser.name}
                  </div>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigate('/profile'); }}
                    className="w-full text-left text-xs py-2 px-3 text-slate-700 font-medium hover:bg-slate-100 rounded-lg flex items-center gap-2"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Profile Settings</span>
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onLogout?.(); }}
                    className="w-full text-left text-xs py-2 px-3 text-red-600 font-medium hover:bg-red-50 rounded-lg flex items-center gap-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); onNavigate('/login'); }}
                  className="w-full text-center py-2.5 bg-cobalt text-white font-bold text-xs rounded-xl shadow-xs"
                >
                  Login / Create Account
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* ── Spotlight Command Palette Search Modal ──────────────────── */}
      {isSearchOpen && (
        <div 
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-start justify-center pt-16 sm:pt-24 px-4 p-6 animate-in fade-in duration-200"
          onClick={() => setIsSearchOpen(false)}
        >
          <div 
            className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-ice-border overflow-hidden animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar */}
            <div className="flex items-center px-5 py-4 border-b border-ice-border gap-3 bg-slate-50/50">
              <Search className="w-5 h-5 text-cobalt shrink-0" />
              <input
                ref={modalInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleModalKeyDown}
                placeholder="Type device name e.g. iPhone 15 Pro, Samsung S24, OnePlus..."
                className="w-full bg-transparent text-sm sm:text-base font-medium text-ink-navy placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    modalInputRef.current?.focus();
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              <span className="hidden sm:inline-flex text-[11px] font-mono text-slate-400 bg-white border border-slate-200 px-2 py-0.5 rounded-md select-none">
                ESC
              </span>
            </div>

            {/* Quick Filter Pills */}
            <div className="flex items-center gap-2 px-5 py-2.5 bg-slate-50 border-b border-ice-border/60 overflow-x-auto text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit shrink-0">
                Popular:
              </span>
              {['iPhone 16', 'iPhone 15', 'Galaxy S24', 'OnePlus 12', 'Pixel 9', 'iPad Pro'].map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setSearchQuery(tag);
                    modalInputRef.current?.focus();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-white border border-ice-border hover:border-cobalt hover:text-cobalt text-slate-600 text-xs font-semibold shrink-0 transition-colors cursor-pointer shadow-2xs"
                >
                  {tag}
                </button>
              ))}
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-3 divide-y divide-slate-100">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit flex items-center justify-between">
                <span>{searchQuery ? `Matching Devices (${searchResults.length})` : 'Recommended Flagships'}</span>
                {!searchQuery && (
                  <span className="text-[10px] text-cobalt flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3 h-3" /> Top Valuations
                  </span>
                )}
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-1 pt-1">
                  {searchResults.map((model, idx) => {
                    const imgUrl = getDeviceImage(model.id);
                    const maxPrice = getMaxVariantPrice(model);
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={model.id}
                        onClick={() => handleSelectSearchedModel(model)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                          isSelected ? 'bg-cobalt/10 text-cobalt ring-1 ring-cobalt/20' : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <img
                            src={imgUrl}
                            alt={model.name}
                            className="w-11 h-11 object-contain shrink-0 p-1 bg-white rounded-xl border border-slate-100 shadow-2xs"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <p className="text-sm font-bold text-ink-navy truncate">{model.name}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md uppercase tracking-wider">
                                {model.brandId.replace('brand-', '')}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {model.releaseYear || 'Latest'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-3">
                          <span className="text-[10px] text-slate-400 block font-mono">Max Payout</span>
                          <span className="text-sm sm:text-base font-black text-emerald-600 font-mono">
                            ₹{maxPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className="w-full text-left p-3 text-xs font-bold text-cobalt hover:bg-cobalt/5 rounded-xl transition-colors flex items-center justify-between mt-2"
                    >
                      <span>Explore all matching catalogue devices for "{searchQuery}"</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-slate-400 space-y-2">
                  <p>No devices matching "{searchQuery}"</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchOpen(false);
                      onNavigate('/smartphones');
                    }}
                    className="text-cobalt font-bold hover:underline text-xs"
                  >
                    View All Smartphones &rarr;
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer Key Guide */}
            <div className="px-5 py-3 bg-slate-50 border-t border-ice-border/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <div className="flex items-center gap-3">
                <span><kbd className="bg-white border border-slate-200 px-1 py-0.5 rounded shadow-2xs font-semibold">↑</kbd> <kbd className="bg-white border border-slate-200 px-1 py-0.5 rounded shadow-2xs font-semibold">↓</kbd> to navigate</span>
                <span><kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs font-semibold">↵</kbd> to select</span>
              </div>
              <span>Rephonix Smart Valuation</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HeaderNav;
