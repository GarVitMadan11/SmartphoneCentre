import React, { useState } from 'react';
import { Truck, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import LedgerTab from '../tabs/LedgerTab';
import SupportTab from '../tabs/SupportTab';
import { Booking } from '../../../data/mockDatabase';
import { ApiUser } from '../../../utils/api';

interface OperationsWorkspaceProps {
  bookings: Booking[];
  currentUser: ApiUser | null;
  onRefreshBookings: () => void;
}

export const OperationsWorkspace: React.FC<OperationsWorkspaceProps> = ({
  bookings,
  currentUser,
  onRefreshBookings,
}) => {
  const [activeTab, setActiveTab] = useState<'inspections' | 'support'>('inspections');

  const pendingInspections = bookings.filter(b => b.inspectionStatus === 'pending').length;
  const approvedInspections = bookings.filter(b => b.inspectionStatus === 'approved').length;

  return (
    <div className="space-y-6">
      {/* Workspace Header */}
      <div className="bg-canvas-white border border-ice-border rounded-lg p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded bg-blue-500/10 text-blue-600 border border-blue-500/20 uppercase">
              🚚 Operations & Support Workspace
            </span>
            <span className="text-xs text-ink-muted font-mono">Logged in as {currentUser?.name || currentUser?.email || 'Operations Agent'}</span>
          </div>
          <h2 className="text-2xl font-light text-ink-navy mt-1">Logistics Inspection & Customer Support Desk</h2>
          <p className="text-xs text-ink-muted mt-0.5">Verifying doorstep pickup device condition & resolving customer support inquiries.</p>
        </div>

        {/* Operational Stat Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 bg-blue-500/10 border border-blue-500/20 rounded-md flex items-center gap-2">
            <Truck className="w-4 h-4 text-blue-600" />
            <div>
              <div className="text-[10px] uppercase font-mono text-blue-700 font-bold">Pending Inspections</div>
              <div className="text-sm font-extrabold text-blue-900">{pendingInspections} pickups</div>
            </div>
          </div>

          <div className="px-3.5 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <div>
              <div className="text-[10px] uppercase font-mono text-emerald-700 font-bold">Inspections Approved</div>
              <div className="text-sm font-extrabold text-emerald-900">{approvedInspections} verified</div>
            </div>
          </div>
        </div>
      </div>

      {/* Notice Banner */}
      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-center gap-2 text-xs text-amber-800 font-mono">
        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
        <span>Operations Role: Authorized to update doorstep inspection status. Instant payout disbursement is restricted to Finance Approvers.</span>
      </div>

      {/* Sub-Tabs */}
      <div className="flex border-b border-ice-border/80 gap-2">
        <button
          onClick={() => setActiveTab('inspections')}
          className={`px-4 py-2.5 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'inspections'
              ? 'border-cobalt text-cobalt'
              : 'border-transparent text-ink-slate hover:text-ink-navy'
          }`}
        >
          <Truck className="w-3.5 h-3.5" />
          Doorstep Inspection Dockets ({bookings.length})
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`px-4 py-2.5 border-b-2 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'support'
              ? 'border-cobalt text-cobalt'
              : 'border-transparent text-ink-slate hover:text-ink-navy'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Customer Support Inbox
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'inspections' && (
        <LedgerTab
          bookings={bookings}
          onRefresh={onRefreshBookings}
          currentUser={currentUser}
        />
      )}

      {activeTab === 'support' && (
        <SupportTab />
      )}
    </div>
  );
};

export default OperationsWorkspace;
