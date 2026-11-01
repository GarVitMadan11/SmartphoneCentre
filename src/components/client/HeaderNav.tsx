import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Smartphone, Tablet, ChevronDown, ChevronRight, Zap, Truck, Menu, X, User, Package, Search, ArrowRight, FileText, Bookmark } from 'lucide-react';
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
  onOpenInvoices?: () => void;
  currentUser?: ApiUser | null;
  onLogout?: () => void;
  models?: Model[];
}

const SHOW_TABLETS = false;

export const HeaderNav: React.FC<HeaderNavProps> = ({
  currentPath,
  onNavigate,
  onSelectBrand,
  onSelectTabletBrand,
  onSelectModel,
  onOpenTrackOrder,
  onOpenInvoices,
  currentUser,
  onLogout,
  models = [],
}) => {
  void onOpenInvoices;
  const [activeDropdown, setActiveDropdown] = useState<'phones' | 'tablets' | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubMenu, setMobileSubMenu] = useState<'phones' | 'tablets' | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  
  // Spotlight Search Modal State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');

  const BRAND_FILTERS = [
    { id: 'all', label: 'All' },
    { id: 'brand-apple', label: 'Apple' },
    { id: 'brand-samsung', label: 'Samsung' },
    { id: 'brand-google', label: 'Google' },
    { id: 'brand-oneplus', label: 'OnePlus' },
    { id: 'brand-xiaomi', label: 'Xiaomi' },
    { id: 'other', label: 'Others' },
  ];

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
      setSelectedIndex(-1);
    } else {
      setSearchQuery('');
      setSelectedIndex(-1);
    }
  }, [isSearchOpen]);

  // Filter models based on query and brand filter
  const { searchResults, totalMatchingCount } = useMemo(() => {
    let list = models.filter(m => !m.hidden);

    // 1. Filter by Brand
    if (selectedBrandFilter !== 'all') {
      if (selectedBrandFilter === 'other') {
        const topBrands = ['brand-apple', 'brand-samsung', 'brand-google', 'brand-oneplus', 'brand-xiaomi'];
        list = list.filter(m => !topBrands.includes(m.brandId));
      } else {
        list = list.filter(m => m.brandId === selectedBrandFilter || m.brandId.toLowerCase().includes(selectedBrandFilter));
      }
    }

    // 2. Filter by Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(m => m.name.toLowerCase().includes(q) || m.brandId.toLowerCase().includes(q));
    } else if (selectedBrandFilter === 'all') {
      // Default recommended flagships when empty
      list = list.filter(m => m.category === 'flagship' || m.name.includes('iPhone 1') || m.name.includes('S24') || m.name.includes('OnePlus 12') || m.name.includes('Fold') || m.name.includes('Ultra'));
    }

    const totalMatchingCount = list.length;

    // 3. Always sort by highest payout for best discovery
    list = [...list].sort((a, b) => getMaxVariantPrice(b) - getMaxVariantPrice(a));

    return { searchResults: list.slice(0, 8), totalMatchingCount };
  }, [models, searchQuery, selectedBrandFilter]);

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
    if (selectedIndex >= 0 && searchResults.length > 0 && searchResults[selectedIndex]) {
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
      setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : searchResults.length - 1));
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
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4" ref={navRef}>
          
          {/* Left Brand Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer flex-shrink-0 group select-none" 
            onClick={() => { setMobileMenuOpen(false); onNavigate('/'); }}
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-950 to-slate-900 border border-slate-800 p-1.5 flex items-center justify-center shadow-xs group-hover:scale-105 group-hover:shadow-sm transition-all">
              <img src="/logo.svg" className="w-full h-full object-contain" alt="Rephonix Logo" />
            </div>
            <span className="text-xl sm:text-2xl font-black font-sans text-slate-950 tracking-tight group-hover:text-slate-800 transition-colors">
              Re<span className="text-emerald-600">phonix</span>
            </span>
          </div>

          {/* Center-Left Desktop Nav Links */}
          <nav aria-label="Main Navigation" className="hidden lg:flex items-center gap-1 xl:gap-2 text-xs sm:text-sm font-semibold text-slate-700 shrink-0">
            
            {/* Home */}
            <button
              type="button"
              onClick={() => { setActiveDropdown(null); onNavigate('/'); }}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                currentPath === '/' 
                  ? 'text-slate-950 font-bold bg-slate-100 shadow-2xs' 
                  : 'hover:text-slate-950 hover:bg-slate-50 text-slate-600'
              }`}
            >
              Home
            </button>

            {/* Smartphones Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setActiveDropdown(prev => prev === 'phones' ? null : 'phones')}
                className={`px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition-all ${
                  currentPath === '/smartphones' || activeDropdown === 'phones'
                    ? 'text-slate-950 font-bold bg-slate-100 shadow-2xs'
                    : 'hover:text-slate-950 hover:bg-slate-50 text-slate-600'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5 text-slate-500" />
                <span>Smartphones</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${activeDropdown === 'phones' ? 'rotate-180 text-slate-950' : 'text-slate-400'}`} />
              </button>

              {activeDropdown === 'phones' && (
                <div 
                  className="absolute top-full left-0 mt-2 w-64 bg-white border border-ice-border rounded-2xl shadow-premium p-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150"
                >
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-normal font-sans">
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

            {/* Tablets/iPads Dropdown (Hidden while tablet catalogue is being refined) */}
            {SHOW_TABLETS && (
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
                  <div className="flex items-center justify-between px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-normal font-sans">
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
            )}

            {/* About */}
            <button
              type="button"
              onClick={() => { setActiveDropdown(null); onNavigate('/about'); }}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                currentPath === '/about' 
                  ? 'text-slate-950 font-bold bg-slate-100 shadow-2xs' 
                  : 'hover:text-slate-950 hover:bg-slate-50 text-slate-600'
              }`}
            >
              About
            </button>

            {/* Contact */}
            <button
              type="button"
              onClick={() => { setActiveDropdown(null); onNavigate('/contact'); }}
              className={`px-3.5 py-1.5 rounded-full transition-all ${
                currentPath === '/contact' 
                  ? 'text-slate-950 font-bold bg-slate-100 shadow-2xs' 
                  : 'hover:text-slate-950 hover:bg-slate-50 text-slate-600'
              }`}
            >
              Contact
            </button>
          </nav>



          {/* Right CTA Actions */}
          <div className="hidden sm:flex items-center gap-2.5 shrink-0">
            
            {/* Search shortcut pill */}
            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100/70 hover:bg-slate-100 border border-slate-200/80 text-slate-400 hover:text-slate-600 text-xs transition-all shadow-2xs group cursor-pointer"
              aria-label="Search phone models"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600 transition-colors" />
              <span className="text-slate-500 font-medium">Search models...</span>
              <kbd className="text-[10px] bg-white border border-slate-200 text-slate-400 px-1.5 py-0.2 rounded font-mono shadow-2xs">⌘K</kbd>
            </button>

            {/* Instant Quote Button */}
            <button
              type="button"
              onClick={() => { setActiveDropdown(null); setUserDropdownOpen(false); onNavigate('/smartphones'); }}
              className="px-4 py-2 rounded-full bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs transition-all shadow-sm hover:shadow flex items-center gap-1.5 active:scale-95 cursor-pointer shrink-0"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400 shrink-0" />
              <span className="whitespace-nowrap">Instant Quote</span>
            </button>

            {/* Track Order Button */}
            {onOpenTrackOrder && (
              <button
                type="button"
                onClick={() => { setActiveDropdown(null); setUserDropdownOpen(false); onOpenTrackOrder(); }}
                className="px-3.5 py-2 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-950 font-bold text-xs transition-all flex items-center gap-1.5 border border-slate-200/90 hover:border-slate-300 shadow-2xs cursor-pointer shrink-0 active:scale-95"
              >
                <Truck className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span className="whitespace-nowrap">Track Order</span>
              </button>
            )}

            {/* Customer Auth Profile Badge */}
            {currentUser ? (
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => { setActiveDropdown(null); setUserDropdownOpen(prev => !prev); }}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 sm:gap-2 border border-slate-200 hover:border-slate-300 font-bold text-xs transition-all bg-white hover:bg-slate-50 cursor-pointer shrink-0 shadow-2xs ${
                    userDropdownOpen ? 'border-slate-950 text-slate-950 ring-2 ring-slate-950/10' : 'text-slate-800'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-slate-950 text-white flex items-center justify-center text-[11px] font-black shadow-xs shrink-0">
                    {initial}
                  </div>
                  <span className="truncate max-w-[80px] sm:max-w-[120px] whitespace-nowrap">Hi, {firstName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${userDropdownOpen ? 'rotate-180 text-slate-950' : 'text-slate-400'}`} />
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
                        onNavigate('/profile?tab=bookings');
                      }}
                      className="w-full text-left text-xs font-semibold p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-cobalt transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <Package className="w-4 h-4 text-cobalt" />
                      <span>Your Bookings</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('/profile?tab=invoices');
                      }}
                      className="w-full text-left text-xs font-semibold p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-cobalt transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-emerald-600" />
                      <span>Invoices &amp; Receipts</span>
                    </button>
                    <button
                      onClick={() => {
                        setUserDropdownOpen(false);
                        onNavigate('/profile?tab=saved');
                      }}
                      className="w-full text-left text-xs font-semibold p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-amber-600 transition-colors flex items-center gap-2.5 cursor-pointer"
                    >
                      <Bookmark className="w-4 h-4 text-amber-500" />
                      <span>Saved Quotes</span>
                    </button>
                    <button
                      onClick={() => { setUserDropdownOpen(false); onNavigate('/profile?tab=profile'); }}
                      className="w-full text-left text-xs font-semibold p-2.5 rounded-xl hover:bg-slate-100 text-slate-700 hover:text-cobalt transition-colors flex items-center gap-2.5 cursor-pointer"
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
                className="px-4 py-2 rounded-full border border-slate-200/90 hover:border-slate-950 hover:text-slate-950 text-slate-700 font-bold text-xs transition-all active:scale-95 cursor-pointer bg-white shadow-2xs"
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
                <span>Search phone model...</span>
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

            {/* Mobile Tablets (Hidden while tablet catalogue is being refined) */}
            {SHOW_TABLETS && (
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
            )}

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
                    onClick={() => { setMobileMenuOpen(false); onNavigate('/profile?tab=bookings'); }}
                    className="w-full text-left text-xs py-2.5 px-3 text-slate-700 font-semibold hover:bg-slate-100 rounded-xl flex items-center gap-2.5 cursor-pointer"
                  >
                    <Package className="w-4 h-4 text-cobalt" />
                    <span>Your Bookings</span>
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigate('/profile?tab=invoices'); }}
                    className="w-full text-left text-xs py-2.5 px-3 text-slate-700 font-semibold hover:bg-slate-100 rounded-xl flex items-center gap-2.5 cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span>Invoices &amp; Receipts</span>
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigate('/profile?tab=saved'); }}
                    className="w-full text-left text-xs py-2.5 px-3 text-slate-700 font-semibold hover:bg-slate-100 rounded-xl flex items-center gap-2.5 cursor-pointer"
                  >
                    <Bookmark className="w-4 h-4 text-amber-500" />
                    <span>Saved Quotes</span>
                  </button>
                  <button
                    onClick={() => { setMobileMenuOpen(false); onNavigate('/profile?tab=profile'); }}
                    className="w-full text-left text-xs py-2.5 px-3 text-slate-700 font-semibold hover:bg-slate-100 rounded-xl flex items-center gap-2.5 cursor-pointer"
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
                  className="w-full text-center py-2.5 bg-slate-950 hover:bg-slate-900 active:scale-98 text-white font-bold text-xs rounded-xl shadow-sm touch-manipulation"
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
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4 p-4 animate-in fade-in duration-200"
          onClick={() => setIsSearchOpen(false)}
        >
          <div 
            className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/90 overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Input Bar (Curvy Pill Container with X Close Button) */}
            <div className="flex items-center px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-100 gap-3 bg-white">
              <div className="flex-1 flex items-center bg-slate-50 hover:bg-slate-100/80 focus-within:bg-white focus-within:ring-2 focus-within:ring-cobalt/25 focus-within:border-cobalt/40 border border-slate-200/90 rounded-full px-4 py-2.5 transition-all shadow-2xs">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-slate-400 shrink-0 mr-3 stroke-[2.2]" />
                <input
                  ref={modalInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(-1);
                  }}
                  onKeyDown={handleModalKeyDown}
                  placeholder="Search smartphone e.g. iPhone 15, S24 Ultra..."
                  className="w-full bg-transparent text-sm sm:text-base font-medium text-slate-900 placeholder:text-slate-400 border-0 outline-none p-0 focus:outline-none focus:ring-0"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      modalInputRef.current?.focus();
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0 ml-1"
                    title="Clear query"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Close Button X replacing ESC */}
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-600 hover:text-slate-950 flex items-center justify-center shrink-0 transition-all cursor-pointer"
                title="Close"
                aria-label="Close search modal"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.2]" />
              </button>
            </div>

            {/* Brand Filter Tabs (Single clean segmented row) */}
            <div className="px-4 sm:px-6 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center justify-between gap-2 overflow-x-auto select-none no-scrollbar">
              <div className="flex items-center gap-1.5 shrink-0">
                {BRAND_FILTERS.map((brand) => {
                  const isActive = selectedBrandFilter === brand.id;
                  return (
                    <button
                      key={brand.id}
                      type="button"
                      onClick={() => {
                        setSelectedBrandFilter(brand.id);
                        setSelectedIndex(-1);
                      }}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isActive
                          ? 'bg-slate-950 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/60'
                      }`}
                    >
                      {brand.label}
                    </button>
                  );
                })}
              </div>
              <span className="text-[11px] font-medium text-slate-400 shrink-0 hidden sm:inline-block">
                {totalMatchingCount} {totalMatchingCount === 1 ? 'model' : 'models'}
              </span>
            </div>

            {/* Results List */}
            <div className="max-h-[58vh] overflow-y-auto p-2 sm:p-3">
              <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans flex items-center justify-between">
                <span>
                  {searchQuery 
                    ? `Results (${totalMatchingCount})` 
                    : selectedBrandFilter !== 'all' 
                      ? `${BRAND_FILTERS.find(b => b.id === selectedBrandFilter)?.label} Devices` 
                      : 'Popular Valuations'}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  Instant Doorstep Quote
                </span>
              </div>

              {searchResults.length > 0 ? (
                <div className="space-y-1">
                  {searchResults.map((model, idx) => {
                    const imgUrl = getDeviceImage(model, model.brandId, undefined, model.imageUrl);
                    const maxPrice = getMaxVariantPrice(model);
                    const isSelected = idx === selectedIndex;
                    return (
                      <div
                        key={model.id}
                        onClick={() => handleSelectSearchedModel(model)}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`group flex items-center justify-between px-3.5 py-3 rounded-xl cursor-pointer transition-all duration-150 ${
                          isSelected 
                            ? 'bg-slate-100 text-slate-900 shadow-2xs' 
                            : 'hover:bg-slate-50 text-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-11 h-11 rounded-lg bg-white border border-slate-200/80 p-1 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
                            <img
                              src={imgUrl}
                              alt={model.name}
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const target = e.currentTarget;
                                const fallback = getDeviceImage('', model.brandId);
                                if (target.src !== fallback) {
                                  target.src = fallback;
                                }
                              }}
                              className="w-full h-full object-contain"
                              loading="lazy"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm sm:text-[15px] font-bold text-slate-900 group-hover:text-cobalt transition-colors truncate">
                              {model.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                                {model.brandId.replace('brand-', '')}
                              </span>
                              <span className="text-[10px] text-slate-300">•</span>
                              <span className="text-[11px] text-slate-400">
                                {model.releaseYear || 'Latest'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 pl-3 flex items-center gap-3">
                          <div>
                            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block font-sans">
                              Up To
                            </span>
                            <span className="text-sm sm:text-base font-extrabold text-emerald-600 font-sans tracking-tight tabular-nums">
                              ₹{maxPrice.toLocaleString('en-IN')}
                            </span>
                          </div>
                          <ChevronRight className={`w-4 h-4 text-slate-400 group-hover:text-cobalt transition-transform duration-200 ${
                            isSelected ? 'translate-x-1 opacity-100' : 'opacity-40 group-hover:opacity-100'
                          }`} />
                        </div>
                      </div>
                    );
                  })}

                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => handleSearchSubmit()}
                      className="w-full text-left p-3 text-xs font-bold text-cobalt hover:bg-cobalt/5 rounded-xl transition-colors flex items-center justify-between mt-1"
                    >
                      <span>View all matching models for "{searchQuery}"</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="py-12 text-center text-sm text-slate-400 space-y-2">
                  <p className="font-medium text-slate-600">No smartphones found for "{searchQuery}"</p>
                  <p className="text-xs text-slate-400">Check spelling or try browsing by brand above.</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedBrandFilter('all');
                    }}
                    className="text-cobalt font-bold hover:underline text-xs mt-2"
                  >
                    Clear Filter
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer Key Guide */}
            <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-sans">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 shadow-2xs">↑</kbd>
                  <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 shadow-2xs">↓</kbd>
                  <span>navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="bg-white border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-600 shadow-2xs">↵</kbd>
                  <span>select</span>
                </span>
              </div>
              <span className="font-medium text-slate-400">Rephonix Valuation</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
