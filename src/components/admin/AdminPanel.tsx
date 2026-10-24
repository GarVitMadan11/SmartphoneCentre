import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Booking, Brand, Model } from '../../data/mockDatabase';
import { 
  ArrowLeft, RefreshCw, ShieldAlert, Cpu, Smartphone, Tablet, Watch, 
  Zap, Truck, MessageSquare, CreditCard, ChevronLeft, ChevronRight, 
  Menu, X, ShieldCheck, Eye, Layers, Users
} from 'lucide-react';
import { fetchBookings, triggerAdminLockdown, fetchCurrentUser, getCurrentAdminUser, AdminUserSession, ApiUser } from '../../utils/api';
import { AdminContextProvider } from '../../context/AdminContext';
import CatalogTab from './tabs/CatalogTab';
import CashifyMonitorTab from './tabs/CashifyMonitorTab';
import LedgerTab from './tabs/LedgerTab';
import SupportTab from './tabs/SupportTab';
import AuditLogTab from './tabs/AuditLogTab';
import StaffTab from './tabs/StaffTab';

export type AdminNavKey = 
  | 'smartphones' 
  | 'tablets' 
  | 'smartwatches' 
  | 'cashify' 
  | 'inspections' 
  | 'support' 
  | 'finance' 
  | 'audit'
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
  const [isApiOffline, setIsApiOffline] = useState(false);

  // Modern Navigation & Layout State
  const [activeNav, setActiveNav] = useState<AdminNavKey>('smartphones');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [adminUser, setAdminUser] = useState<AdminUserSession | null>(null);

  // Super Admin Role Preview Mode
  const [previewRole, setPreviewRole] = useState<'SUPER_ADMIN' | 'CATALOG_EDITOR' | 'OPERATIONS_AGENT' | 'FINANCE_APPROVER'>('SUPER_ADMIN');

  useEffect(() => {
    getCurrentAdminUser().then(u => {
      setAdminUser(u);
    }).catch(() => setAdminUser(null));
    fetchCurrentUser().then(res => {
      setCurrentUser(res.user);
    }).catch(() => setCurrentUser(null));
  }, []);

  const realRole = adminUser?.role ?? (currentUser?.role as any) ?? 'SUPER_ADMIN';
  const effectiveRole = realRole === 'SUPER_ADMIN' ? previewRole : realRole;

  // Granular Service-based Access Check
  const hasAccessTo = useCallback((serviceKey: string) => {
    if (effectiveRole === 'SUPER_ADMIN') return true;
    if (effectiveRole === 'CATALOG_EDITOR') {
      return ['smartphones', 'tablets', 'smartwatches', 'cashify'].includes(serviceKey);
    }
    if (effectiveRole === 'OPERATIONS_AGENT') {
      return ['inspections', 'support'].includes(serviceKey);
    }
    if (effectiveRole === 'FINANCE_APPROVER') {
      return ['finance'].includes(serviceKey);
    }
    const perms = adminUser?.permissions || [];
    return perms.includes(serviceKey);
  }, [effectiveRole, adminUser]);

  // Auto-switch navigation if current active item is prohibited by permissions
  useEffect(() => {
    if (effectiveRole === 'SUPER_ADMIN') return;
    if (!hasAccessTo(activeNav)) {
      const allServices: AdminNavKey[] = ['smartphones', 'tablets', 'smartwatches', 'cashify', 'inspections', 'support', 'finance'];
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
        setIsApiOffline(false);
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

  const handleLockdown = async () => {
    const confirmLock = window.confirm(
      '🚨 EMERGENCY LOCKDOWN ACTIVATION\n\nAre you sure you want to trigger an immediate Admin Panel Lockdown?\n\n• All Admin Panel access will be SUSPENDED immediately.\n• Active admin sessions will be terminated.\n• An alert email with the Master Emergency Unlock Key will be dispatched.'
    );
    if (!confirmLock) return;

    try {
      const res = await triggerAdminLockdown('Manual emergency kill switch triggered by admin user.');
      alert(`🚨 EMERGENCY LOCKDOWN ACTIVATED!\n\nMaster Emergency Unlock Key:\n${res.masterUnlockKey}\n\n(Save this key to unblock access on the lockdown shield page).`);
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
      case 'smartphones':
        return { section: 'Inventory & Pricing', title: 'Smartphones Catalog', icon: Smartphone };
      case 'tablets':
        return { section: 'Inventory & Pricing', title: 'Tablets Catalog', icon: Tablet };
      case 'smartwatches':
        return { section: 'Inventory & Pricing', title: 'Smartwatches Catalog', icon: Watch };
      case 'cashify':
        return { section: 'Market Intelligence', title: 'Cashify Parity Monitor', icon: Zap };
      case 'inspections':
        return { section: 'Operations & Logistics', title: 'Doorstep Inspections', icon: Truck };
      case 'support':
        return { section: 'Operations & Logistics', title: 'Customer Support Desk', icon: MessageSquare };
      case 'finance':
        return { section: 'Finance & Ledger', title: 'Payouts & Ledger', icon: CreditCard };
      case 'audit':
        return { section: 'Security & Governance', title: 'System Audit Logs', icon: ShieldCheck };
      case 'staff':
        return { section: 'Security & Governance', title: 'Staff & Access Control', icon: Users };
      default:
        return { section: 'Control Studio', title: 'Admin Overview', icon: Layers };
    }
  }, [activeNav]);

  const ActiveIcon = breadcrumbInfo.icon;

  // Sidebar link component
  const NavItem = ({ 
    navKey, 
    label, 
    icon: Icon, 
    badge, 
    badgeColor = 'bg-cobalt/20 text-cobalt' 
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
        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all group cursor-pointer ${
          isActive 
            ? 'bg-cobalt text-white shadow-sm font-bold' 
            : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
        }`}
        title={label}
      >
        <div className="flex items-center gap-3 min-w-0">
          <Icon className={`w-4 h-4 flex-shrink-0 transition-transform ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
          {!sidebarCollapsed && <span className="truncate">{label}</span>}
        </div>
        {!sidebarCollapsed && badge !== undefined && (
          <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded-full ${isActive ? 'bg-white/20 text-white' : badgeColor}`}>
            {badge}
          </span>
        )}
      </button>
    );
  };

  return (
    <div className="w-full h-full min-h-0 flex flex-col md:flex-row bg-canvas-white text-left font-outfit overflow-hidden">
      
      {/* ── 1. MODERN COLLAPSIBLE SIDEBAR ─────────────────────────────────── */}
      <aside 
        className={`bg-slate-900 border-r border-slate-800/90 text-slate-200 flex flex-col justify-between transition-all duration-300 z-30 ${
          sidebarCollapsed ? 'w-full md:w-20' : 'w-full md:w-64'
        } ${mobileMenuOpen ? 'block' : 'hidden md:flex'}`}
      >
        {/* Top Brand Banner */}
        <div>
          <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cobalt to-indigo-500 flex items-center justify-center text-white font-extrabold shadow-md flex-shrink-0">
                R
              </div>
              {!sidebarCollapsed && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold tracking-tight text-sm text-white">REPHONIX</span>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 bg-cobalt/20 text-cobalt rounded font-bold">OS</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">Control Studio v2.4</div>
                </div>
              )}
            </div>

            {/* Collapse toggle (desktop only) */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Navigation Links Grouped by Domain */}
          <div className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-250px)]">
            
            {/* Group A: Inventory & Valuation */}
            {(hasAccessTo('smartphones') || hasAccessTo('tablets') || hasAccessTo('smartwatches') || hasAccessTo('cashify')) && (
              <div>
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                    Inventory & Valuation
                  </div>
                )}
                <div className="space-y-1">
                  {hasAccessTo('smartphones') && <NavItem navKey="smartphones" label="Smartphones" icon={Smartphone} />}
                  {hasAccessTo('tablets') && <NavItem navKey="tablets" label="Tablets" icon={Tablet} />}
                  {hasAccessTo('smartwatches') && <NavItem navKey="smartwatches" label="Smartwatches" icon={Watch} />}
                  {hasAccessTo('cashify') && (
                    <NavItem 
                      navKey="cashify" 
                      label="Cashify Monitor" 
                      icon={Zap} 
                      badge="Live" 
                      badgeColor="bg-amber-400/20 text-amber-300" 
                    />
                  )}
                </div>
              </div>
            )}

            {/* Group B: Operations & Logistics */}
            {(hasAccessTo('inspections') || hasAccessTo('support')) && (
              <div>
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                    Operations
                  </div>
                )}
                <div className="space-y-1">
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

            {/* Group C: Finance & Ledger */}
            {hasAccessTo('finance') && (
              <div>
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                    Financial Ledger
                  </div>
                )}
                <div className="space-y-1">
                  <NavItem 
                    navKey="finance" 
                    label="Payouts & Ledger" 
                    icon={CreditCard} 
                    badge={pendingPayouts > 0 ? pendingPayouts : undefined}
                    badgeColor="bg-emerald-500/20 text-emerald-300"
                  />
                </div>
              </div>
            )}

            {/* Group D: System & Governance */}
            {(effectiveRole === 'SUPER_ADMIN' || effectiveRole === 'CATALOG_EDITOR' || effectiveRole === 'FINANCE_APPROVER') && (
              <div>
                {!sidebarCollapsed && (
                  <div className="px-3 pb-1.5 text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                    Governance & Team
                  </div>
                )}
                <div className="space-y-1">
                  {effectiveRole === 'SUPER_ADMIN' && (
                    <NavItem navKey="staff" label="Staff & Roles" icon={Users} />
                  )}
                  <NavItem navKey="audit" label="Audit Trail" icon={ShieldCheck} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Sidebar: User Badge, Role Previewer & Quick Exit */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/60 space-y-2">
          {/* Role Preview Switcher for Super Admins */}
          {realRole === 'SUPER_ADMIN' && !sidebarCollapsed && (
            <div className="p-2 bg-slate-900/90 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1.5">
                <span className="flex items-center gap-1 font-bold text-emerald-400">
                  <Eye className="w-3 h-3 text-emerald-400" /> View As:
                </span>
                <span className="text-slate-400">{previewRole}</span>
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] font-mono">
                <button
                  onClick={() => setPreviewRole('SUPER_ADMIN')}
                  className={`py-1 px-1.5 rounded text-center transition-all cursor-pointer ${
                    previewRole === 'SUPER_ADMIN' ? 'bg-cobalt text-white font-bold' : 'text-slate-400 hover:text-white bg-slate-800/60'
                  }`}
                >
                  All Privs
                </button>
                <button
                  onClick={() => setPreviewRole('CATALOG_EDITOR')}
                  className={`py-1 px-1.5 rounded text-center transition-all cursor-pointer ${
                    previewRole === 'CATALOG_EDITOR' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-white bg-slate-800/60'
                  }`}
                >
                  Catalog
                </button>
                <button
                  onClick={() => setPreviewRole('OPERATIONS_AGENT')}
                  className={`py-1 px-1.5 rounded text-center transition-all cursor-pointer ${
                    previewRole === 'OPERATIONS_AGENT' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white bg-slate-800/60'
                  }`}
                >
                  Operations
                </button>
                <button
                  onClick={() => setPreviewRole('FINANCE_APPROVER')}
                  className={`py-1 px-1.5 rounded text-center transition-all cursor-pointer ${
                    previewRole === 'FINANCE_APPROVER' ? 'bg-emerald-600 text-white font-bold' : 'text-slate-400 hover:text-white bg-slate-800/60'
                  }`}
                >
                  Finance
                </button>
              </div>
            </div>
          )}

          {/* User info card */}
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-slate-900/50">
            <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-mono text-xs font-bold border border-slate-700 flex-shrink-0">
              <Cpu className="w-3.5 h-3.5 text-cobalt" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">
                  {currentUser?.name || currentUser?.email?.split('@')[0] || 'Admin Operator'}
                </div>
                <div className="text-[10px] font-mono text-emerald-400 truncate">
                  {effectiveRole}
                </div>
              </div>
            )}
          </div>

          {/* Return to Storefront button */}
          <button
            onClick={onBack}
            className="w-full flex items-center justify-center gap-2 p-2 rounded-lg bg-slate-800 hover:bg-slate-700/80 text-slate-300 hover:text-white text-xs font-semibold transition-all cursor-pointer"
            title="Return to Main Storefront"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {!sidebarCollapsed && <span>Back to Storefront</span>}
          </button>
        </div>
      </aside>

      {/* ── 2. MAIN APPLICATION WORKSPACE ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-canvas-white min-w-0 overflow-hidden">
        
        {/* Top App Header Bar */}
        <header className="bg-canvas-white/95 backdrop-blur-md border-b border-ice-border px-4 md:px-6 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
          
          {/* Breadcrumb Path & Active View Title */}
          <div className="flex items-center gap-3">
            {/* Mobile Hamburger Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg border border-ice-border text-ink-slate hover:text-ink-navy cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>

            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-cobalt/10 text-cobalt border border-cobalt/20">
                <ActiveIcon className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-ink-muted">
                  <span>Admin</span>
                  <span>/</span>
                  <span>{breadcrumbInfo.section}</span>
                </div>
                <h1 className="text-lg md:text-xl font-extrabold text-ink-navy tracking-tight leading-none mt-0.5">
                  {breadcrumbInfo.title}
                </h1>
              </div>
            </div>
          </div>

          {/* Quick Action Tools & System Health */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Real-time DB Status */}
            {isApiOffline ? (
              <span className="px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                <span>Demo Mode</span>
              </span>
            ) : (
              <span className="px-2.5 py-1 text-[10px] font-mono font-bold tracking-wider rounded-md bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 uppercase flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>Postgres Online</span>
              </span>
            )}

            {/* Refresh Data */}
            <button
              onClick={handleGlobalRefresh}
              disabled={loadingBookings}
              className="px-3 py-1.5 border border-ice-border hover:border-cobalt/40 text-ink-navy hover:text-cobalt bg-canvas-pure text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="Refresh Catalog and Bookings"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingBookings ? 'animate-spin text-cobalt' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Reset Demo Data */}
            <button
              onClick={handleResetDemoData}
              className="px-3 py-1.5 border border-ice-border text-ink-slate hover:text-ink-navy bg-canvas-pure hover:bg-zinc-100 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              title="Reset Demo Ledger Data"
            >
              <span className="hidden sm:inline">Reset Ledger</span>
            </button>

            {/* Emergency Lockdown */}
            <button
              onClick={handleLockdown}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Emergency Lockdown: Instantly revoke admin sessions"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Lockdown</span>
            </button>
          </div>
        </header>

        {/* ── 3. DIRECT TAB CONTENT CONTAINER (ZERO NESTED HEADERS, 100% SPACE) ─ */}
        <main className="flex-1 p-4 md:p-6 overflow-y-auto w-full min-w-0">
          {/* Smartphones Catalog */}
          {activeNav === 'smartphones' && (
            <CatalogTab
              category="smartphones"
              brands={brands}
              onRefresh={onRefreshCatalog}
            />
          )}

          {/* Tablets Catalog */}
          {activeNav === 'tablets' && (
            <CatalogTab
              category="tablets"
              brands={brands}
              onRefresh={onRefreshCatalog}
            />
          )}

          {/* Smartwatches Catalog */}
          {activeNav === 'smartwatches' && (
            <CatalogTab
              category="smartwatches"
              brands={brands}
              onRefresh={onRefreshCatalog}
            />
          )}

          {/* Cashify Live Market Monitor */}
          {activeNav === 'cashify' && (
            <CashifyMonitorTab />
          )}

          {/* Operations: Doorstep Inspections */}
          {activeNav === 'inspections' && (
            <LedgerTab
              bookings={bookings}
              onRefresh={loadBookings}
              currentUser={currentUser}
            />
          )}

          {/* Operations: Support Inbox */}
          {activeNav === 'support' && (
            <SupportTab />
          )}

          {/* Finance: Payouts & Disbursements */}
          {activeNav === 'finance' && (
            <LedgerTab
              bookings={bookings}
              onRefresh={loadBookings}
              currentUser={currentUser}
            />
          )}

          {/* Governance: Audit Trail */}
          {activeNav === 'audit' && (
            <AuditLogTab />
          )}

          {/* Team & Role Access Control */}
          {activeNav === 'staff' && (
            <StaffTab />
          )}
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

