import React, { useState } from 'react';
import { CreditCard, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import LedgerTab from '../tabs/LedgerTab';
import AuditLogTab from '../tabs/AuditLogTab';
import { Booking } from '../../../data/mockDatabase';
import { ApiUser } from '../../../utils/api';

interface FinanceWorkspaceProps {
  bookings: Booking[];
  currentUser: ApiUser | null;
  onRefreshBookings: () => void;
}

export const FinanceWorkspace: React.FC<FinanceWorkspaceProps> = ({
  bookings,
  currentUser,
  onRefreshBookings,
}) => {
  const [activeTab, setActiveTab] = useState<'ledger' | 'audit'>('ledger');

  const pendingCount = bookings.filter(b => b.payoutStatus !== 'completed').length;
  const totalDisbursed = bookings
    .filter(b => b.payoutStatus === 'completed')
    .reduce((sum, b) => sum + (b.finalPrice || 0), 0);

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-canvas-white border border-ice-border rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 uppercase">
              💳 Finance Workspace
            </span>
            <span className="text-xs text-ink-muted font-mono">Logged in as {currentUser?.name || currentUser?.email || 'Finance Approver'}</span>
          </div>
          <h2 className="text-2xl font-light text-ink-navy mt-1">Financial Reconciliation & Payout Center</h2>
          <p className="text-xs text-ink-muted mt-0.5">Authorizing instant bank/UPI disbursements & auditing transaction ledgers.</p>
        </div>

        {/* Financial Stat Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-600" />
            <div>
              <div className="text-[10px] uppercase font-mono text-amber-700 font-bold">Pending Payouts</div>
              <div className="text-sm font-extrabold text-amber-900">{pendingCount} dockets</div>
            </div>
          </div>

          <div className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[10px] uppercase font-mono text-emerald-700 font-bold">Total Disbursed</div>
              <div className="text-sm font-extrabold text-emerald-900">₹{totalDisbursed.toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-ice-border/80 gap-2">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2.5 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ledger'
              ? 'border-cobalt text-cobalt'
              : 'border-transparent text-ink-slate hover:text-ink-navy'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Financial Ledger ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'border-cobalt text-cobalt'
              : 'border-transparent text-ink-slate hover:text-ink-navy'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5 text-cobalt" />
          Payout Audit Logs
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'ledger' && (
        <LedgerTab
          bookings={bookings}
          onRefresh={onRefreshBookings}
          currentUser={currentUser}
        />
      )}

      {activeTab === 'audit' && (
        <AuditLogTab />
      )}
    </div>
  );
};

export default FinanceWorkspace;
