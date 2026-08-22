import React, { useState } from 'react';
import { ShieldCheck, Eye, Sparkles } from 'lucide-react';
import FinanceWorkspace from './FinanceWorkspace';
import OperationsWorkspace from './OperationsWorkspace';
import CatalogWorkspace from './CatalogWorkspace';
import { Booking, Brand } from '../../../data/mockDatabase';
import { ApiUser } from '../../../utils/api';

interface MasterAdminWorkspaceProps {
  bookings: Booking[];
  brands: Brand[];
  currentUser: ApiUser | null;
  onRefreshBookings: () => void;
  onRefreshCatalog: () => void;
}

export const MasterAdminWorkspace: React.FC<MasterAdminWorkspaceProps> = ({
  bookings,
  brands,
  currentUser,
  onRefreshBookings,
  onRefreshCatalog,
}) => {
  const [previewRole, setPreviewRole] = useState<'SUPER_ADMIN' | 'FINANCE_APPROVER' | 'OPERATIONS_AGENT' | 'CATALOG_EDITOR'>('SUPER_ADMIN');

  return (
    <div className="space-y-6 font-outfit">
      {/* Super Admin Control Bar & Workspace Mode Switcher */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xl border border-slate-700/80">
        <div className="flex items-center gap-3.5">
          <div className="p-3 bg-cobalt/20 border border-cobalt/40 rounded-lg text-cobalt shadow-sm">
            <ShieldCheck className="w-6 h-6 text-cobalt" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-400" />
                Root Super Admin
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono border border-slate-700">
                Full Privilege Access
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white">Master Admin Control Hub</h2>
          </div>
        </div>

        {/* Role Switcher Preview Bar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-lg border border-slate-700/80 shadow-inner">
          <span className="text-[10px] font-mono text-slate-400 uppercase px-2 flex items-center gap-1">
            <Eye className="w-3.5 h-3.5 text-cobalt" /> View Mode:
          </span>
          <button
            onClick={() => setPreviewRole('SUPER_ADMIN')}
            className={`px-3 py-1.5 text-xs font-mono rounded-md font-bold transition-all cursor-pointer ${
              previewRole === 'SUPER_ADMIN' ? 'bg-cobalt text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            All Workspaces
          </button>
          <button
            onClick={() => setPreviewRole('FINANCE_APPROVER')}
            className={`px-3 py-1.5 text-xs font-mono rounded-md font-bold transition-all cursor-pointer ${
              previewRole === 'FINANCE_APPROVER' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Finance
          </button>
          <button
            onClick={() => setPreviewRole('OPERATIONS_AGENT')}
            className={`px-3 py-1.5 text-xs font-mono rounded-md font-bold transition-all cursor-pointer ${
              previewRole === 'OPERATIONS_AGENT' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Operations
          </button>
          <button
            onClick={() => setPreviewRole('CATALOG_EDITOR')}
            className={`px-3 py-1.5 text-xs font-mono rounded-md font-bold transition-all cursor-pointer ${
              previewRole === 'CATALOG_EDITOR' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            Catalog
          </button>
        </div>
      </div>

      {/* Render Workspace Based on Preview Role */}
      {previewRole === 'FINANCE_APPROVER' && (
        <FinanceWorkspace
          bookings={bookings}
          currentUser={currentUser ? { ...currentUser, role: 'FINANCE_APPROVER' } : null}
          onRefreshBookings={onRefreshBookings}
        />
      )}

      {previewRole === 'OPERATIONS_AGENT' && (
        <OperationsWorkspace
          bookings={bookings}
          currentUser={currentUser ? { ...currentUser, role: 'OPERATIONS_AGENT' } : null}
          onRefreshBookings={onRefreshBookings}
        />
      )}

      {previewRole === 'CATALOG_EDITOR' && (
        <CatalogWorkspace
          brands={brands}
          currentUser={currentUser ? { ...currentUser, role: 'CATALOG_EDITOR' } : null}
          onRefreshCatalog={onRefreshCatalog}
        />
      )}

      {previewRole === 'SUPER_ADMIN' && (
        <div className="space-y-6">
          <FinanceWorkspace
            bookings={bookings}
            currentUser={currentUser}
            onRefreshBookings={onRefreshBookings}
          />
          <CatalogWorkspace
            brands={brands}
            currentUser={currentUser}
            onRefreshCatalog={onRefreshCatalog}
          />
        </div>
      )}
    </div>
  );
};

export default MasterAdminWorkspace;
