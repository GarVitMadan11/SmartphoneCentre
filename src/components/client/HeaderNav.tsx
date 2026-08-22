import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Smartphone, Tablet, ChevronDown, Zap, Truck, Menu, X, User, Package, Search, ArrowRight } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const navRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
        setUserDropdownOpen(false);
      }
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global keyboard shortcut: Cmd+K / Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setIsSearchFocused(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter models based on search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return models
      .filter(m => !m.hidden && m.name.toLowerCase().includes(q))
      .slice(0, 6);
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
    setSearchQuery('');
    setIsSearchFocused(false);
    setMobileMenuOpen(false);
    if (onSelectModel) {
      onSelectModel(model.id);
    } else {
      onNavigate(`/smartphones?q=${encodeURIComponent(model.name)}`);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && searchResults[selectedIndex]) {
      handleSelectSearchedModel(searchResults[selectedIndex]);
      return;
    }
    if (searchQuery.trim()) {
      setIsSearchFocused(false);
      setMobileMenuOpen(false);
      onNavigate(`/smartphones?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setIsSearchFocused(false);
    }
  };

  const firstName = currentUser?.name ? currentUser.name.trim().split(' ')[0] : 'Account';
  const initial = firstName.charAt(0).toUpperCase();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-ice-border shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4" ref={navRef}>
        
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
        <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1 xl:gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
          
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

        {/* ── In-Between Global Search Bar ────────────────────────────── */}
        <div ref={searchContainerRef} className="relative hidden md:flex flex-1 max-w-xs lg:max-w-sm xl:max-w-md mx-2">
          <form onSubmit={handleSearchSubmit} className="w-full relative">
            <div className={`flex items-center bg-slate-50 hover:bg-slate-100/90 border rounded-xl px-3 py-1.5 transition-all duration-200 ${
              isSearchFocused 
                ? 'bg-white border-cobalt ring-2 ring-cobalt/10 shadow-sm' 
                : 'border-ice-border hover:border-slate-300'
            }`}>
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(-1);
                  setIsSearchFocused(true);
                }}
                onFocus={() => setIsSearchFocused(true)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Search phone or tablet model..."
                className="w-full bg-transparent text-xs text-ink-navy placeholder-slate-400 focus:outline-none"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    searchInputRef.current?.focus();
                  }}
                  className="p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="hidden xl:inline-flex items-center text-[10px] font-mono text-slate-400 bg-white border border-slate-200 px-1.5 py-0.5 rounded shadow-2xs select-none">
                  ⌘K
                </span>
              )}
            </div>
          </form>

          {/* Autocomplete Search Results Dropdown */}
          {isSearchFocused && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-ice-border rounded-2xl shadow-premium p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-96 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-outfit border-b border-ice-border/60">
                Matching Models ({searchResults.length})
              </div>

              {searchResults.length > 0 ? (
                <div className="divide-y divide-slate-100 py-1">
                  {searchResults.map((model, idx) => {
                    const imgUrl = getDeviceImage(model.id);
                    const maxPrice = getMaxVariantPrice(model);
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={model.id}
                        onClick={() => handleSelectSearchedModel(model)}
                        className={`flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-colors ${
                          isSelected ? 'bg-cobalt/10 text-cobalt' : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={imgUrl}
                            alt={model.name}
                            className="w-9 h-9 object-contain shrink-0 p-0.5 bg-slate-50 rounded-lg border border-slate-100"
                            loading="lazy"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-ink-navy truncate">{model.name}</p>
                            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                              {model.brandId.replace('brand-', '')}
                            </span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 pl-2">
                          <span className="text-[10px] text-slate-400 block font-mono">Up to</span>
                          <span className="text-xs font-black text-emerald-600 font-mono">
                            ₹{maxPrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    type="button"
                    onClick={handleSearchSubmit}
                    className="w-full text-left p-2.5 text-xs font-bold text-cobalt hover:bg-cobalt/5 rounded-xl transition-colors flex items-center justify-between mt-1"
                  >
                    <span>View all results for "{searchQuery}"</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400 space-y-1">
                  <p>No models matching "{searchQuery}"</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSearchFocused(false);
                      onNavigate('/smartphones');
                    }}
                    className="text-cobalt font-semibold hover:underline text-xs"
                  >
                    Browse all smartphones
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right CTA Actions */}
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          
          {/* Instant Quote Button */}
          <button
            type="button"
            onClick={() => { setActiveDropdown(null); setUserDropdownOpen(false); onNavigate('/smartphones'); }}
            className="px-3.5 py-1.5 rounded-xl bg-cobalt hover:bg-cobalt-hover text-white font-bold text-xs transition-all shadow-sm hover:shadow-md flex items-center gap-1.5 active:scale-95 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 fill-current" />
            <span>Instant Quote</span>
          </button>

          {/* Track Order Button */}
          {onOpenTrackOrder && (
            <button
              type="button"
              onClick={() => { setActiveDropdown(null); setUserDropdownOpen(false); onOpenTrackOrder(); }}
              className="px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-cobalt font-bold text-xs transition-all flex items-center gap-1.5 border border-ice-border hover:border-cobalt/40 cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5 text-cobalt" />
              <span>Track Order</span>
            </button>
          )}

          {/* Customer Auth Profile Badge */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => { setActiveDropdown(null); setUserDropdownOpen(prev => !prev); }}
                className={`px-3 py-1.5 rounded-xl flex items-center gap-2 border border-ice-border hover:border-cobalt/50 font-bold text-xs transition-all bg-canvas-white hover:bg-slate-50 cursor-pointer ${
                  userDropdownOpen ? 'border-cobalt text-cobalt ring-2 ring-cobalt/10' : 'text-slate-800'
                }`}
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-cobalt to-indigo-600 text-white flex items-center justify-center text-[11px] font-black shadow-xs">
                  {initial}
                </div>
                <span>Hi, {firstName}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180 text-cobalt' : 'text-slate-400'}`} />
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
            onClick={() => { setActiveDropdown(null); setUserDropdownOpen(false); onNavigate('/smartphones'); }}
            className="px-3 py-1.5 rounded-lg bg-cobalt text-white font-bold text-xs flex items-center gap-1"
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

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-ice-border bg-white px-4 py-3 space-y-2 animate-in fade-in duration-150">
          
          {/* Mobile Search Bar */}
          <form onSubmit={handleSearchSubmit} className="w-full">
            <div className="flex items-center bg-slate-50 border border-ice-border rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-slate-400 mr-2 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search phone or tablet model..."
                className="w-full bg-transparent text-xs text-ink-navy placeholder-slate-400 focus:outline-none"
              />
              {searchQuery && (
                <button type="button" onClick={() => setSearchQuery('')} className="p-0.5 text-slate-400">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

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
  );
};

export default HeaderNav;
