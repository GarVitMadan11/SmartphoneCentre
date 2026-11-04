import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Booking, Brand, Model } from '../../data/mockDatabase';
import {
  ArrowLeft, RefreshCw, ShieldAlert, Smartphone, Tablet, Watch, LogOut,
  Zap, Truck, MessageSquare, CreditCard, ChevronLeft, ChevronRight, ChevronDown,
  Menu, X, ShieldCheck, Eye, Layers, Users, Tag, User, DollarSign, Package
} from 'lucide-react';
import { fetchBookings, triggerAdminLockdown, fetchCurrentUser, getCurrentAdminUser, adminLogout, AdminUserSession, ApiUser } from '../../utils/api';
import { AdminContextProvider } from '../../context/AdminContext';
import CatalogTab from './tabs/CatalogTab';
import CashifyMonitorTab from './tabs/CashifyMonitorTab';
import LedgerTab from './tabs/LedgerTab';
import SupportTab from './tabs/SupportTab';
import AuditLogTab from './tabs/AuditLogTab';
import StaffTab from './tabs/StaffTab';
import { CouponsTab } from './tabs/CouponsTab';
import PriceMatrixTab from './tabs/PriceMatrixTab';
import InventoryTab from './tabs/InventoryTab';

export type AdminNavKey =
  | 'inventory'
  | 'smartphones'
  | 'tablets'
  | 'smartwatches'
  | 'pricing'
  | 'cashify'
  | 'inspections'
  | 'support'
  | 'finance'
  | 'audit'
  | 'coupons'
  | 'staff';

interface AdminPanelProps {
  onBack: () => void;
  initialBookings: Booking[];
  brands: Brand[];
  onRefreshBookings?: (updatedBookings?: Booking[]) => Promise<void> | void;
  onRefreshCatalog?: (updatedModels?: Model[]) => Promise<void> | void;
}

export const AdminPanelInner: React.FC<AdminPanelProps> = ({
  onBack,
  initialBookings,
  brands,
  onRefreshBookings,
  onRefreshCatalog
}) => {
  const [currentUser, setCurrentUser] = useState<ApiUser | null>(null);
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Modern Navigation & Layout State
  const [activeNav, setActiveNav] = useState<AdminNavKey>('smartphones');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isSidebarExpanded = !sidebarCollapsed;

  const [adminUser, setAdminUser] = useState<AdminUserSession | null>(null);
  const [loadingUserPrivileges, setLoadingUserPrivileges] = useState(true);

  // Super Admin Role Preview Mode
  const [previewRole, setPreviewRole] = useState<'SUPER_ADMIN' | 'CATALOG_EDITOR' | 'OPERATIONS_AGENT' | 'FINANCE_APPROVER'>('SUPER_ADMIN');
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const roleDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (roleDropdownRef.current && !roleDropdownRef.current.contains(e.target as Node)) {
        setRoleMenuOpen(false);
      }
    };
    if (roleMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [roleMenuOpen]);

  const roleOptions: { key: 'SUPER_ADMIN' | 'CATALOG_EDITOR' | 'OPERATIONS_AGENT' | 'FINANCE_APPROVER'; label: string; tag: string }[] = [
    { key: 'SUPER_ADMIN', label: 'Super Admin', tag: 'All Privs' },
    { key: 'CATALOG_EDITOR', label: 'Catalog Team', tag: 'Catalog' },
    { key: 'OPERATIONS_AGENT', label: 'Operations Agent', tag: 'Operations' },
    { key: 'FINANCE_APPROVER', label: 'Finance Approver', tag: 'Finance' },
  ];
  const activeRoleOption = roleOptions.find(o => o.key === previewRole) || roleOptions[0];

  useEffect(() => {
    Promise.all([
      getCurrentAdminUser().catch(() => null),
      fetchCurrentUser().catch(() => null)
    ]).then(([u, res]) => {
      if (u) {
        setAdminUser(u);
        const perms = u.permissions;
        if (u.role !== 'SUPER_ADMIN' && Array.isArray(perms) && perms.length > 0) {
          const allServices: AdminNavKey[] = ['smartphones', 'tablets', 'smartwatches', 'pricing', 'cashify', 'inspections', 'support', 'finance'];
          const firstAllowed = allServices.find(s => perms.includes(s));
          if (firstAllowed) {
            setActiveNav(firstAllowed);
          }
        }
      }
      if (res && res.user) {
        setCurrentUser(res.user);
      }
    }).finally(() => {
      setLoadingUserPrivileges(false);
    });
  }, []);

  const realRole = adminUser?.role ?? (currentUser?.role as any) ?? 'SUPER_ADMIN';
  const effectiveRole = realRole === 'SUPER_ADMIN' ? previewRole : realRole;

  // Granular Service-based Access Check
  const hasAccessTo = useCallback((serviceKey: string) => {
    // If Super Admin (or in Super Admin preview), grant full access
    if (effectiveRole === 'SUPER_ADMIN') return true;

    // Granular permissions assigned to this user always take highest priority
    const perms = adminUser?.permissions;
    if (Array.isArray(perms) && perms.length > 0) {
      return perms.includes(serviceKey);
    }

    // Role-based defaults when no granular permissions array is present
    if (effectiveRole === 'CATALOG_EDITOR') {
      return ['inventory', 'smartphones', 'tablets', 'smartwatches', 'pricing', 'cashify'].includes(serviceKey);
    }
    if (effectiveRole === 'OPERATIONS_AGENT') {
      return ['inventory', 'inspections', 'support'].includes(serviceKey);
    }
    if (effectiveRole === 'FINANCE_APPROVER') {
      return ['inventory', 'finance', 'coupons'].includes(serviceKey);
    }
    return false;
  }, [effectiveRole, adminUser]);

  // Auto-switch navigation if current active item is prohibited by permissions
  useEffect(() => {
    if (effectiveRole === 'SUPER_ADMIN') return;
    if (!hasAccessTo(activeNav)) {
      const allServices: AdminNavKey[] = ['inventory', 'smartphones', 'tablets', 'smartwatches', 'pricing', 'cashify', 'inspections', 'support', 'finance', 'coupons'];
      const firstAllowed = allServices.find(s => hasAccessTo(s));
      if (firstAllowed) {
        setActiveNav(firstAllowed);
      }
    }
  }, [effectiveRole, activeNav, hasAccessTo]);

  // Sync bookings from props
  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const data = await fetchBookings();
      if (data && Array.isArray(data)) {
        setBookings(data as unknown as Booking[]);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  const handleGlobalRefresh = async () => {
    await loadBookings();
    if (onRefreshCatalog) onRefreshCatalog();
  };

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset all bookings ledger state to defaults?')) return;
    setBookings(initialBookings);
    if (onRefreshBookings) onRefreshBookings(initialBookings);
  };

  const handleSignOut = async () => {
    try {
      await adminLogout();
    } catch {
      // ignore
    }
    onBack();
  };

  const handleLockdown = async () => {
    const confirmLock = window.confirm(
      'EMERGENCY PLATFORM LOCKDOWN\n\nAre you sure you want to trigger an immediate Admin Panel Lockdown?\n\n• All Admin Panel access will be SUSPENDED immediately.\n• Active admin sessions will be terminated.\n• An alert email with the Master Emergency Unlock Key will be dispatched.'
    );
    if (!confirmLock) return;

    try {
      const res = await triggerAdminLockdown('Manual emergency kill switch triggered by admin user.');
      alert(`EMERGENCY PLATFORM LOCKDOWN ACTIVATED!\n\nMaster Emergency Unlock Key:\n${res.masterUnlockKey}\n\n(Save this key to unblock access on the lockdown shield page).`);
      onBack();
    } catch (err: any) {
      alert('Failed to trigger lockdown: ' + (err.message || err));
    }
  };

  // Operational metrics for sidebar badges
  const pendingInspections = useMemo(
    () => bookings.filter(b => b.inspectionStatus === 'pending').length,
    [bookings]
  );
  const pendingPayouts = useMemo(
    () => bookings.filter(b => b.payoutStatus !== 'completed').length,
    [bookings]
  );

  // Breadcrumbs text helper
  const breadcrumbInfo = useMemo(() => {
    switch (activeNav) {
      case 'inventory':
        return { section: 'Device Stock', title: 'Device Inventory & Barcodes', icon: Package };
      case 'smartphones':
        return { section: 'Inventory & Pricing', title: 'Smartphones Catalog', icon: Smartphone };
      case 'tablets':
        return { section: 'Inventory & Pricing', title: 'Tablets Catalog', icon: Tablet };
      case 'smartwatches':
        return { section: 'Inventory & Pricing', title: 'Smartwatches Catalog', icon: Watch };
      case 'pricing':
        return { section: 'Inventory & Valuation', title: 'Price Matrix & Valuation Editor', icon: DollarSign };
      case 'cashify':
        return { section: 'Market Intelligence', title: 'Cashify Parity Monitor', icon: Zap };
      case 'inspections':
        return { section: 'Operations & Logistics', title: 'Doorstep Inspections', icon: Truck };
      case 'support':
        return { section: 'Operations & Logistics', title: 'Customer Support Desk', icon: MessageSquare };
      case 'finance':
        return { section: 'Finance & Ledger', title: 'Payouts & Ledger', icon: CreditCard };
      case 'coupons':
        return { section: 'Growth & Incentives', title: 'Referral & Promo Codes', icon: Tag };
      case 'audit':
        return { section: 'Security & Governance', title: 'System Audit Logs', icon: ShieldCheck };
      case 'staff':
        return { section: 'Security & Governance', title: 'Staff & Access Control', icon: Users };
      default:
        return { section: 'Control Studio', title: 'Admin Overview', icon: Layers };
    }
  }, [activeNav]);

  const ActiveIcon = breadcrumbInfo.icon;

  // Sidebar link component with smooth CSS slide/fade
  const NavItem = ({
    navKey,
    label,
    icon: Icon,
    badge,
    badgeColor = 'bg-blue-500/20 text-blue-300'
  }: {
    navKey: AdminNavKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | number;
    badgeColor?: string;
  }) => {
    const isActive = activeNav === navKey;
    return (
      <button
        onClick={() => {
          setActiveNav(navKey);
          setMobileMenuOpen(false);
        }}
        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-all group cursor-pointer ${isActive
          ? 'bg-blue-600 text-white shadow-xs font-semibold'
          : 'text-slate-200 hover:text-white hover:bg-slate-800/80 font-medium'
          }`}
        title={label}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <Icon className={`w-4 h-4 flex-shrink-0 transition-colors ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`} />
          <span
            className={`truncate transition-all duration-200 overflow-hidden whitespace-nowrap ${isSidebarExpanded ? 'opacity-100 max-w-[140px]' : 'hidden'
              }`}
          >
            {label}
          </span>
        </div>
        {badge !== undefined && (
          <span
            className={`px-1.5 py-0.5 text-[9px] font-mono font-bold rounded-full transition-all shrink-0 ${isSidebarExpanded ? 'opacity-100' : 'opacity-0 w-0 p-0 overflow-hidden pointer-events-none'
              } ${isActive ? 'bg-white/25 text-white' : badgeColor}`}
          >
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col md:flex-row bg-canvas-white text-left font-sans overflow-hidden">

      {/* ── 1. MODERN COLLAPSIBLE SIDEBAR ─────────────────────────────────── */}
      <aside
        className={`relative bg-slate-900 border-r border-slate-800 text-slate-200 flex flex-col transition-[width] duration-200 ease-out z-30 ${isSidebarExpanded ? 'w-full md:w-60' : 'w-full md:w-16'
          } ${mobileMenuOpen ? 'block' : 'hidden md:flex'}`}
      >
        {/* Top Brand Banner & Collapse/Expand Button */}
        <div className="h-14 px-2.5 border-b border-slate-800/80 flex items-center justify-between select-none shrink-0">
          <div
            onClick={() => {
              if (sidebarCollapsed) {
                setSidebarCollapsed(false);
              }
            }}
            className={`flex items-center gap-2.5 min-w-0 ${sidebarCollapsed ? 'cursor-pointer' : ''}`}
            title={sidebarCollapsed ? "Click to expand sidebar" : undefined}
          >
            <div className="w-8 h-8 rounded-lg bg-[#001736] border border-slate-700 p-1 flex items-center justify-center shrink-0">
              <img src="/logo.svg" className="w-full h-full object-contain" alt="Rephonix Logo" />
            </div>
            {isSidebarExpanded && (
              <div className="min-w-0 transition-opacity duration-200 overflow-hidden whitespace-nowrap">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-white font-sans tracking-tight">
                    Re<span className="text-secondary">phonix</span>
                  </span>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded font-bold uppercase tracking-wider">
                    Admin
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Explicit Collapse/Expand Toggle Button (Click only, zero hover interference) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSidebarCollapsed(prev => !prev);
            }}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
            title={isSidebarExpanded ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarExpanded ? (
              <ChevronLeft className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Navigation Links Grouped by Domain (Clean Flex-1 with zero clipping) */}
        <div className="flex-1 min-h-0 overflow-y-auto px-2.5 py-3 space-y-3.5 scrollbar-thin">
          {loadingUserPrivileges ? (
            <div className="py-8 flex flex-col items-center justify-center space-y-2.5 opacity-70">
              <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              {isSidebarExpanded && (
                <span className="text-[10px] font-mono text-slate-400">Verifying access…</span>
              )}
            </div>
          ) : (
            <>
              {/* Group A: Catalog & Stock */}
              {(hasAccessTo('inventory') || hasAccessTo('smartphones') || hasAccessTo('tablets') || hasAccessTo('smartwatches') || hasAccessTo('pricing') || hasAccessTo('cashify')) && (
                <div>
                  <div
                    className={`px-2.5 pb-1 text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 transition-all duration-200 overflow-hidden whitespace-nowrap ${isSidebarExpanded ? 'block' : 'hidden'
                      }`}
                  >
                    Catalog & Valuation
                  </div>
                  <div className="space-y-0.5">
                    {hasAccessTo('inventory') && (
                      <NavItem
                        navKey="inventory"
                        label="Device Inventory"
                        icon={Package}
                        badge="New"
                        badgeColor="bg-emerald-400/20 text-emerald-300"
                      />
                    )}
                    {hasAccessTo('smartphones') && <NavItem navKey="smartphones" label="Smartphones" icon={Smartphone} />}
                    {hasAccessTo('tablets') && <NavItem navKey="tablets" label="Tablets" icon={Tablet} />}
                    {hasAccessTo('smartwatches') && <NavItem navKey="smartwatches" label="Smartwatches" icon={Watch} />}
                    {hasAccessTo('pricing') && (
                      <NavItem
                        navKey="pricing"
                        label="Price Matrix"
                        icon={DollarSign}
                      />
                    )}
                    {hasAccessTo('cashify') && (
                      <NavItem
                        navKey="cashify"
                        label="Cashify Monitor"
                        icon={Zap}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Group B: Operations */}
              {(hasAccessTo('inspections') || hasAccessTo('support')) && (
                <div>
                  <div
                    className={`px-2.5 pb-1 text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 ${isSidebarExpanded ? 'block' : 'hidden'}`}
                  >
                    Operations
                  </div>
                  <div className="space-y-0.5">
                    {hasAccessTo('inspections') && (
                      <NavItem
                        navKey="inspections"
                        label="Doorstep Pickups"
                        icon={Truck}
                        badge={pendingInspections > 0 ? pendingInspections : undefined}
                        badgeColor="bg-blue-500/20 text-blue-300"
                      />
                    )}
                    {hasAccessTo('support') && <NavItem navKey="support" label="Support Desk" icon={MessageSquare} />}
                  </div>
                </div>
              )}

              {/* Group C: Finance */}
              {(hasAccessTo('finance') || hasAccessTo('coupons')) && (
                <div>
                  <div
                    className={`px-2.5 pb-1 text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 ${isSidebarExpanded ? 'block' : 'hidden'}`}
                  >
                    Finance & Growth
                  </div>
                  <div className="space-y-0.5">
                    {hasAccessTo('finance') && (
                      <NavItem
                        navKey="finance"
                        label="Payouts & Ledger"
                        icon={CreditCard}
                        badge={pendingPayouts > 0 ? pendingPayouts : undefined}
                        badgeColor="bg-emerald-500/20 text-emerald-300"
                      />
                    )}
                    {hasAccessTo('coupons') && (
                      <NavItem
                        navKey="coupons"
                        label="Referral & Coupons"
                        icon={Tag}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Group D: Governance */}
              {(effectiveRole === 'SUPER_ADMIN' || (Array.isArray(adminUser?.permissions) && adminUser.permissions.includes('audit')) || (!adminUser?.permissions && (effectiveRole === 'CATALOG_EDITOR' || effectiveRole === 'FINANCE_APPROVER'))) && (
                <div>
                  <div
                    className={`px-2.5 pb-1 text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400 ${isSidebarExpanded ? 'block' : 'hidden'}`}
                  >
                    Governance
                  </div>
                  <div className="space-y-0.5">
                    {effectiveRole === 'SUPER_ADMIN' && (
                      <NavItem navKey="staff" label="Staff & Roles" icon={Users} />
                    )}
                    {hasAccessTo('audit') && <NavItem navKey="audit" label="Audit Trail" icon={ShieldCheck} />}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Sidebar: User Badge, High-Contrast Custom Role Picker & Storefront Exit */}
        <div className="shrink-0 border-t border-slate-800 bg-slate-950 p-2.5 space-y-2">
          {/* Super Admin Role Preview Popover (Guaranteed High Contrast, Zero Select Glitches) */}
          {realRole === 'SUPER_ADMIN' && isSidebarExpanded && (
            <div className="relative" ref={roleDropdownRef}>
              <button
                type="button"
                onClick={() => setRoleMenuOpen(prev => !prev)}
                className="w-full flex items-center justify-between px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800/90 rounded-lg border border-slate-700/80 transition-colors cursor-pointer text-left shadow-xs"
                title="Simulate role access"
              >
                <span className="flex items-center gap-1.5 text-slate-200 text-[11px] font-semibold">
                  <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>View As:</span>
                </span>
                <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                  <span>{activeRoleOption.tag}</span>
                  <ChevronDown className={`w-3 h-3 text-emerald-400 transition-transform ${roleMenuOpen ? 'rotate-180' : ''}`} />
                </span>
              </button>

              {roleMenuOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1.5 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1 z-50 space-y-0.5 backdrop-blur-md">
                  <div className="px-2 py-1 text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800 mb-1">
                    Simulate Role Access
                  </div>
                  {roleOptions.map((opt) => (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => {
                        setPreviewRole(opt.key);
                        setRoleMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                        previewRole === opt.key
                          ? 'bg-blue-600 text-white font-semibold'
                          : 'text-slate-200 hover:text-white hover:bg-slate-800'
                      }`}
                    >
                      <span>{opt.label}</span>
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                        previewRole === opt.key ? 'bg-white/20 text-white' : 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/40'
                      }`}>
                        {opt.tag}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* User Profile Card + Exit in Single Clean Row */}
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              {isSidebarExpanded && (
                <div className="min-w-0 truncate">
                  <div className="text-xs font-semibold text-white truncate leading-tight">
                    {adminUser?.username || currentUser?.name || currentUser?.email?.split('@')[0] || 'Admin'}
                  </div>
                  <div className="text-[10px] font-mono font-bold text-emerald-400 leading-none mt-0.5">
                    {effectiveRole}
                  </div>
                </div>
              )}
            </div>

            {isSidebarExpanded && (
              <button
                type="button"
                onClick={onBack}
                className="p-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer shrink-0"
                title="Return to Main Storefront"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── 2. MAIN APPLICATION WORKSPACE ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-canvas-white min-w-0 overflow-hidden">

        {/* Top App Header Bar */}
        <header className="bg-canvas-white/95 backdrop-blur-md border-b border-ice-border px-3 sm:px-4 md:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 shadow-xs shrink-0">

          {/* Breadcrumb Path & Active View Title */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-1.5 sm:p-2 rounded-lg border border-ice-border text-ink-slate hover:text-ink-navy bg-white shadow-2xs cursor-pointer shrink-0"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
              <div className="p-1.5 sm:p-2 rounded-lg bg-cobalt/10 text-cobalt border border-cobalt/20 shrink-0">
                <ActiveIcon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="hidden xs:flex items-center gap-1.5 text-[10px] sm:text-[11px] font-mono text-ink-muted truncate">
                  <span>Admin</span>
                  <span>/</span>
                  <span className="truncate">{breadcrumbInfo.section}</span>
                </div>
                <h1 className="text-sm sm:text-base md:text-xl font-extrabold text-ink-navy tracking-tight leading-tight truncate">
                  {breadcrumbInfo.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Quick Action Tools & System Health */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Refresh Data */}
            <button
              onClick={handleGlobalRefresh}
              disabled={loadingBookings}
              className="px-2 sm:px-3 py-1.5 border border-ice-border hover:border-cobalt/40 text-ink-navy hover:text-cobalt bg-canvas-pure text-xs font-bold rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs"
              title="Refresh Catalog and Bookings"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingBookings ? 'animate-spin text-cobalt' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Reset Demo Data (Super Admin Only) */}
            {effectiveRole === 'SUPER_ADMIN' && (
              <button
                onClick={handleResetDemoData}
                className="hidden lg:flex px-3 py-1.5 border border-ice-border text-ink-slate hover:text-ink-navy bg-canvas-pure hover:bg-zinc-100 text-xs font-semibold rounded-lg transition-all items-center gap-1.5 cursor-pointer"
                title="Reset Demo Ledger Data (Super Admin Only)"
              >
                <span>Reset Ledger</span>
              </button>
            )}

            {/* Emergency Lockdown (Super Admin Only) */}
            {effectiveRole === 'SUPER_ADMIN' && (
              <button
                onClick={handleLockdown}
                className="hidden sm:flex px-2.5 sm:px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all items-center gap-1 sm:gap-1.5 shadow-sm cursor-pointer"
                title="Emergency Lockdown: Instantly revoke admin sessions (Super Admin Only)"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Lockdown</span>
              </button>
            )}

            {/* Clean Sign Out */}
            <button
              onClick={handleSignOut}
              className="px-2 sm:px-3 py-1.5 border border-slate-200 hover:border-rose-200 bg-white hover:bg-rose-50 text-slate-700 hover:text-rose-600 text-xs font-bold rounded-lg transition-all flex items-center gap-1 sm:gap-1.5 cursor-pointer shadow-xs"
              title="Sign Out of Admin Session"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* ── 3. DIRECT TAB CONTENT CONTAINER (ZERO NESTED HEADERS, 100% SPACE) ─ */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full min-w-0">
          {/* Device Stock & Physical Inventory */}
          {activeNav === 'inventory' && (
            <InventoryTab />
          )}

          {/* Smartphones Catalog */}
          <div className={activeNav === 'smartphones' ? 'block' : 'hidden'}>
            <CatalogTab
              category="smartphones"
              brands={brands}
              onRefresh={onRefreshCatalog}
            />
          </div>

          {/* Tablets Catalog */}
          <div className={activeNav === 'tablets' ? 'block' : 'hidden'}>
            <CatalogTab
              category="tablets"
              brands={brands}
              onRefresh={onRefreshCatalog}
            />
          </div>

          {/* Smartwatches Catalog */}
          <div className={activeNav === 'smartwatches' ? 'block' : 'hidden'}>
            <CatalogTab
              category="smartwatches"
              brands={brands}
              onRefresh={onRefreshCatalog}
            />
          </div>

          {/* Hierarchical Price Matrix: Brand -> Series -> Variant -> Price */}
          <div className={activeNav === 'pricing' ? 'block' : 'hidden'}>
            <PriceMatrixTab
              brands={brands}
              onRefresh={onRefreshCatalog}
            />
          </div>

          {/* Cashify Live Market Monitor */}
          <div className={activeNav === 'cashify' ? 'block' : 'hidden'}>
            <CashifyMonitorTab />
          </div>

          {/* Operations: Doorstep Inspections */}
          <div className={activeNav === 'inspections' ? 'block' : 'hidden'}>
            <LedgerTab
              bookings={bookings}
              onRefresh={loadBookings}
              currentUser={currentUser}
            />
          </div>

          {/* Operations: Support Inbox */}
          <div className={activeNav === 'support' ? 'block' : 'hidden'}>
            <SupportTab />
          </div>

          {/* Finance: Payouts & Disbursements */}
          <div className={activeNav === 'finance' ? 'block' : 'hidden'}>
            <LedgerTab
              bookings={bookings}
              onRefresh={loadBookings}
              currentUser={currentUser}
            />
          </div>

          {/* Growth & Incentives: Referral & Promo Codes */}
          <div className={activeNav === 'coupons' ? 'block' : 'hidden'}>
            <CouponsTab />
          </div>

          {/* Governance: Audit Trail */}
          <div className={activeNav === 'audit' ? 'block' : 'hidden'}>
            <AuditLogTab />
          </div>

          {/* Team & Role Access Control */}
          <div className={activeNav === 'staff' ? 'block' : 'hidden'}>
            <StaffTab />
          </div>
        </main>
      </div>
    </div>
  );
};

export const AdminPanel: React.FC<AdminPanelProps> = (props) => {
  return (
    <AdminContextProvider
      initialBookings={props.initialBookings}
      brands={props.brands}
      onRefreshBookings={props.onRefreshBookings}
      onRefreshCatalog={props.onRefreshCatalog}
    >
      <AdminPanelInner {...props} />
    </AdminContextProvider>
  );
};

export default AdminPanel;

