import React, { useState, useEffect, useCallback } from 'react';
import { Booking, Brand, Model } from '../../data/mockDatabase';
import { ArrowLeft, RefreshCw, ShieldAlert, Cpu } from 'lucide-react';
import { fetchBookings, triggerAdminLockdown, fetchCurrentUser, ApiUser } from '../../utils/api';
import { AdminContextProvider } from '../../context/AdminContext';
import FinanceWorkspace from './workspaces/FinanceWorkspace';
import OperationsWorkspace from './workspaces/OperationsWorkspace';
import CatalogWorkspace from './workspaces/CatalogWorkspace';
import MasterAdminWorkspace from './workspaces/MasterAdminWorkspace';

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
  
  useEffect(() => {
    fetchCurrentUser().then(res => {
      setCurrentUser(res.user);
    }).catch(() => setCurrentUser(null));
  }, []);

  const role = currentUser?.role ?? 'SUPER_ADMIN';

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

  const handleResetDemoData = async () => {
    if (!window.confirm('Reset all bookings ledger state to defaults?')) return;
    setBookings(initialBookings);
    if (onRefreshBookings) onRefreshBookings(initialBookings);
  };

  return (
    <div className="w-full text-left space-y-6 font-outfit">
      {/* Header Top Navbar Bar */}
      <div className="bg-canvas-white/90 backdrop-blur-md border border-ice-border rounded-xl p-4 md:p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm hover:shadow-md transition-all">
        <div className="flex items-center gap-3.5">
          <button
            onClick={onBack}
            className="p-2.5 rounded-lg border border-ice-border hover:border-cobalt hover:bg-cobalt/5 text-ink-slate hover:text-cobalt transition-all cursor-pointer shadow-xs"
            title="Return to Main Storefront"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[10px] font-mono tracking-[0.2em] font-bold text-cobalt uppercase">Control Center</span>
              <span className="w-1 h-1 rounded-full bg-cobalt/40"></span>
              <span className="text-[10px] font-mono text-ink-muted">v2.4 Admin Suite</span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-2xl md:text-3xl font-extrabold text-ink-navy tracking-tight">
                Admin Operations Studio
              </h2>
              {currentUser && (
                <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded-md bg-cobalt/10 text-cobalt border border-cobalt/20 uppercase flex items-center gap-1">
                  <Cpu className="w-3 h-3 text-cobalt" />
                  <span>Role: {currentUser.role}</span>
                </span>
              )}
              {isApiOffline ? (
                <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-wider rounded-md bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                  <span>Offline Demo Mode</span>
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-wider rounded-md bg-emerald-500/10 text-emerald-700 border border-emerald-500/20 uppercase flex items-center gap-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Database Online</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={loadBookings}
            disabled={loadingBookings}
            className="flex-1 md:flex-initial px-3.5 py-2 border border-cobalt/30 text-cobalt hover:bg-cobalt/10 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            style={{ minHeight: '38px' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingBookings ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleResetDemoData}
            className="flex-1 md:flex-initial px-3.5 py-2 border border-ice-border text-ink-navy hover:bg-zinc-100 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            style={{ minHeight: '38px' }}
          >
            <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
            <span>Reset Ledger</span>
          </button>
          <button
            onClick={async () => {
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
            }}
            className="flex-1 md:flex-initial px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
            title="Emergency Kill Switch: Suspends all admin access immediately"
            style={{ minHeight: '38px' }}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>Lock Admin Panel 🚨</span>
          </button>
        </div>
      </div>

      {/* Render Workspaces based on Role */}
      {role === 'FINANCE_APPROVER' && (
        <FinanceWorkspace
          bookings={bookings}
          currentUser={currentUser}
          onRefreshBookings={loadBookings}
        />
      )}

      {role === 'OPERATIONS_AGENT' && (
        <OperationsWorkspace
          bookings={bookings}
          currentUser={currentUser}
          onRefreshBookings={loadBookings}
        />
      )}

      {role === 'CATALOG_EDITOR' && (
        <CatalogWorkspace
          brands={brands}
          currentUser={currentUser}
          onRefreshCatalog={() => { if (onRefreshCatalog) onRefreshCatalog(); }}
        />
      )}

      {(role === 'SUPER_ADMIN' || role === 'admin') && (
        <MasterAdminWorkspace
          bookings={bookings}
          brands={brands}
          currentUser={currentUser}
          onRefreshBookings={loadBookings}
          onRefreshCatalog={() => { if (onRefreshCatalog) onRefreshCatalog(); }}
        />
      )}
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
