import React from 'react';
import { Booking } from '../../../data/mockDatabase';
import { ApiUser } from '../../../utils/api';
import {
  Search, Filter,
  CheckCircle, XCircle, Clock, CreditCard,
  ChevronRight, Calendar, MapPin, User,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Metrics {
  totalPaidAmt: number;
  pendingInspections: number;
  verificationRate: number;
  completedPayouts: number;
}

export interface LedgerTabProps {
  bookings: Booking[];
  currentUser?: ApiUser | null;
  metrics: Metrics;
  filteredBookings: Booking[];
  selectedBookingId: string | null;
  setSelectedBookingId: (id: string | null) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterVerification: string;
  setFilterVerification: (v: string) => void;
  filterInspection: string;
  setFilterInspection: (v: string) => void;
  filterPayout: string;
  setFilterPayout: (v: string) => void;
  handleInspectionChange: (id: string, status: 'approved' | 'rejected') => Promise<void>;
  handlePayoutComplete: (id: string) => Promise<void>;
  formatPrice: (price: number) => string;
}

export const LedgerTab: React.FC<LedgerTabProps> = ({
  bookings,
  currentUser,
  metrics,
  filteredBookings,
  selectedBookingId,
  setSelectedBookingId,
  searchTerm,
  setSearchTerm,
  filterVerification,
  setFilterVerification,
  filterInspection,
  setFilterInspection,
  filterPayout,
  setFilterPayout,
  handleInspectionChange,
  handlePayoutComplete,
  formatPrice,
}) => {
  const selectedBooking = bookings.find(b => b.id === selectedBookingId) || null;

  return (
    <>
      {/* KPI Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 shadow-sm">
          <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Total Payouts Completed</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-500 tracking-tight">{formatPrice(metrics.totalPaidAmt)}</span>
          </div>
          <span className="text-[9px] text-zinc-400 block mt-1 font-mono">{metrics.completedPayouts} successful disbursements</span>
        </div>

        <div className="bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 shadow-sm">
          <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Pending Inspections</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-amber-500 tracking-tight">{metrics.pendingInspections}</span>
          </div>
          <span className="text-[9px] text-zinc-400 block mt-1 font-mono">Requires doorstep agent check</span>
        </div>

        <div className="bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 shadow-sm">
          <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Seller Verification Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-cobalt tracking-tight">{metrics.verificationRate}%</span>
          </div>
          <span className="text-[9px] text-zinc-400 block mt-1 font-mono">DigiLocker KYC success index</span>
        </div>

        <div className="bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 shadow-sm">
          <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Disbursed Bookings</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl sm:text-3xl font-bold text-ink-navy tracking-tight">{metrics.completedPayouts} / {bookings.length}</span>
          </div>
          <span className="text-[9px] text-zinc-400 block mt-1 font-mono">Sourced inventory liquidations</span>
        </div>
      </div>

      {/* Main Ledger workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Side: Table Ledger */}
        <div className={`bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-6 shadow-premium transition-all ${selectedBookingId ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center pb-4 mb-4 border-b border-white/[0.04]">
            <h3 className="font-outfit font-light text-xl text-ink-navy">Transactions Ledger ({filteredBookings.length})</h3>
            <div className="flex items-center gap-2 max-w-md w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search Client, IMEI, ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-sm border border-ice-border bg-canvas-white text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt font-mono"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  const csvHeader = "ID,Client,Phone,Model,Valuation,KYC,Inspection,Payout\n";
                  const csvRows = filteredBookings.map(b =>
                    `"${b.id}","${b.customerName}","${b.customerPhone}","${b.modelName}",${b.finalPrice},"${b.verificationStatus}","${b.inspectionStatus}","${b.payoutStatus}"`
                  ).join("\n");
                  const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
                  const url = window.URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `smartphone_centre_ledger_${new Date().toISOString().slice(0,10)}.csv`;
                  a.click();
                }}
                className="px-3 py-2 bg-canvas-white hover:bg-slate-100 dark:hover:bg-zinc-800 border border-ice-border rounded-sm text-xs font-bold text-ink-navy font-mono transition-all flex items-center gap-1.5 focus-ring"
                title="Export current table view to CSV"
              >
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {/* Ledger filters */}
          <div className="flex flex-wrap items-center gap-4 text-xs bg-canvas-white p-3 rounded-sm border border-ice-border/60 mb-4">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-zinc-500" />
              <span className="font-semibold text-ink-slate font-mono">Filters:</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500 font-mono">KYC:</span>
              <select value={filterVerification} onChange={e => setFilterVerification(e.target.value)} className="bg-canvas-pure border border-ice-border rounded-sm py-1 px-1.5 font-mono text-[10px] focus:outline-none">
                <option value="all">All</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500 font-mono">Inspection:</span>
              <select value={filterInspection} onChange={e => setFilterInspection(e.target.value)} className="bg-canvas-pure border border-ice-border rounded-sm py-1 px-1.5 font-mono text-[10px] focus:outline-none">
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-zinc-500 font-mono">Payout:</span>
              <select value={filterPayout} onChange={e => setFilterPayout(e.target.value)} className="bg-canvas-pure border border-ice-border rounded-sm py-1 px-1.5 font-mono text-[10px] focus:outline-none">
                <option value="all">All</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-ice-border/60 rounded-sm max-h-[600px] overflow-y-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="sticky top-0 z-20 bg-canvas-white/95 backdrop-blur-md border-b border-ice-border text-zinc-500 font-semibold tracking-wider text-[10px] uppercase shadow-xs">
                <tr>
                  <th className="p-3">Order ID</th>
                  <th className="p-3">Client</th>
                  <th className="p-3">Device</th>
                  <th className="p-3">Est. Value</th>
                  <th className="p-3">KYC Status</th>
                  <th className="p-3">Inspection</th>
                  <th className="p-3">Payout</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {filteredBookings.length > 0 ? (
                  filteredBookings.map(b => {
                    const isSelected = selectedBookingId === b.id;
                    return (
                      <tr
                        key={b.id}
                        onClick={() => setSelectedBookingId(b.id)}
                        className={`hover:bg-cobalt-light/5 cursor-pointer transition-all ${isSelected ? 'bg-cobalt-light/10 font-semibold' : ''}`}
                      >
                        <td className="py-3 px-3 text-cobalt font-bold">{b.id}</td>
                        <td className="py-3 px-3 text-zinc-400">
                          {b.dateCreated ? new Date(b.dateCreated).toLocaleDateString('en-IN') : b.pickupDate}
                        </td>
                        <td className="py-3 px-3">
                          <span className="block text-ink-navy font-bold">{b.customerName}</span>
                          <span className="block text-[10px] text-zinc-500">{b.customerPhone}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="block text-ink-navy">{b.modelName}</span>
                          <span className="block text-zinc-400 text-[10px]">Base: {formatPrice(b.finalPrice)}</span>
                          <span className="block text-cobalt font-bold text-[11px]">{formatPrice(b.finalPayoutAmount !== undefined ? b.finalPayoutAmount : b.finalPrice)}</span>
                          {b.bonusPercentage > 0 && (
                            <span className="block text-emerald-500 text-[9px] font-bold">+{b.bonusPercentage * 100}% Bonus</span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {b.verificationStatus === 'verified' && (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-sm border border-emerald-500/20 font-bold uppercase">
                              <CheckCircle className="w-2.5 h-2.5" /> Verified
                            </span>
                          )}
                          {b.verificationStatus === 'failed' && (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-sm border border-red-500/20 font-bold uppercase">
                              <XCircle className="w-2.5 h-2.5" /> Failed
                            </span>
                          )}
                          {b.verificationStatus === 'pending' && (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-sm border border-amber-500/20 font-bold uppercase">
                              <Clock className="w-2.5 h-2.5" /> Pending
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3">
                          {b.inspectionStatus === 'approved' && <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-sm border border-emerald-500/20 font-bold uppercase">Approved</span>}
                          {b.inspectionStatus === 'rejected' && <span className="inline-flex items-center gap-1 text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-sm border border-red-500/20 font-bold uppercase">Rejected</span>}
                          {b.inspectionStatus === 'pending' && <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-sm border border-amber-500/20 font-bold uppercase">Pending</span>}
                        </td>
                        <td className="py-3 px-3">
                          {b.payoutStatus === 'completed' ? (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-sm border border-emerald-500/20 font-bold uppercase">Paid</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-sm border border-amber-500/20 font-bold uppercase">Unpaid</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button type="button" className="p-1 rounded-sm border border-ice-border hover:bg-cobalt hover:text-white transition-colors">
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-zinc-500 italic">
                      [No bookings matching search/filter bounds found]
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Detail Drawer */}
        <AnimatePresence>
          {selectedBookingId && selectedBooking && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="lg:col-span-4 bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 shadow-premium space-y-5 text-xs text-left"
            >
              {/* Drawer header */}
              <div className="flex justify-between items-start border-b border-white/[0.04] pb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase">Docket View</span>
                    <span className="text-[9px] font-mono bg-zinc-950 text-cobalt px-1.5 py-0.5 rounded-sm font-bold border border-white/[0.06]">#{selectedBooking.id}</span>
                  </div>
                  <h4 className="font-light text-lg text-ink-navy mt-1">Transaction Dossier</h4>
                </div>
                <button
                  onClick={() => setSelectedBookingId(null)}
                  className="p-1.5 rounded-sm border border-ice-border text-ink-slate hover:border-red-500 hover:text-red-500 transition-colors"
                >
                  Close Dossier
                </button>
              </div>

              {/* Client specs */}
              <div className="space-y-2 bg-canvas-white/40 p-3.5 rounded-sm border border-white/[0.04]">
                <span className="text-[9px] font-mono tracking-[0.15em] text-zinc-500 uppercase block font-bold">1. Client specifications</span>
                <div className="space-y-1.5 font-mono text-zinc-300 font-light">
                  <div className="flex items-start gap-1.5">
                    <User className="w-3.5 h-3.5 text-cobalt mt-0.5 flex-shrink-0" />
                    <span className="text-zinc-600"><strong>Client Name:</strong> {selectedBooking.customerName}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-cobalt mt-0.5 flex-shrink-0" />
                    <span className="text-zinc-600"><strong>WhatsApp:</strong> +91 {selectedBooking.customerPhone}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-cobalt font-semibold select-none mt-0.5">@</span>
                    <span className="text-zinc-600"><strong>Email:</strong> {selectedBooking.customerEmail}</span>
                  </div>
                  <div className="flex items-start gap-1.5 border-t border-white/[0.04] pt-1.5 mt-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cobalt mt-0.5 flex-shrink-0" />
                    <span className="text-zinc-600"><strong>Pickup:</strong> {selectedBooking.pickupDate} @ {selectedBooking.pickupTimeSlot.split(' ')[0]}</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cobalt mt-0.5 flex-shrink-0" />
                    <span className="leading-tight text-zinc-600"><strong>Address:</strong> {selectedBooking.address}</span>
                  </div>
                </div>
              </div>

              {/* KYC section */}
              <div className="space-y-2 bg-canvas-white/40 p-3.5 rounded-sm border border-white/[0.04]">
                <span className="text-[9px] font-mono tracking-[0.15em] text-zinc-500 uppercase block font-bold">2. Seller KYC (DigiLocker)</span>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Aadhaar Status</span>
                  {selectedBooking.verificationStatus === 'verified' ? (
                    <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-sm border border-emerald-500/20 font-bold uppercase">Verified</span>
                  ) : selectedBooking.verificationStatus === 'failed' ? (
                    <span className="inline-flex items-center gap-1 text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-sm border border-red-500/20 font-bold uppercase">Failed</span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-sm border border-amber-500/20 font-bold uppercase">Pending</span>
                  )}
                </div>
                {selectedBooking.verificationStatus === 'verified' && (
                  <div className="font-mono text-[10px] text-zinc-600 space-y-1 bg-canvas-white p-2 border border-ice-border rounded-sm">
                    <div><strong>Verified Name:</strong> {selectedBooking.verifiedName}</div>
                    <div><strong>Masked Aadhaar:</strong> {selectedBooking.maskedAadhaar}</div>
                    <div><strong>KYC Timestamp:</strong> {selectedBooking.verificationDate ? new Date(selectedBooking.verificationDate).toLocaleString('en-IN') : 'N/A'}</div>
                  </div>
                )}
                {selectedBooking.verificationStatus === 'failed' && (
                  <div className="text-[10px] text-red-500 italic font-mono pl-1">
                    * Identity verification failed during SMS OTP authentication or user declined.
                  </div>
                )}
              </div>

              {/* Payout Details */}
              <div className="space-y-2 bg-canvas-white/40 p-3.5 rounded-sm border border-white/[0.04]">
                <span className="text-[9px] font-mono tracking-[0.15em] text-zinc-500 uppercase block font-bold">3. Payout Details</span>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Method</span>
                  <span className="text-cobalt font-bold uppercase">{selectedBooking.payoutMethodName || selectedBooking.payoutMethod}</span>
                </div>
                <div className="font-mono text-[10px] text-zinc-600 space-y-1 bg-canvas-white p-2 border border-ice-border rounded-sm">
                  {selectedBooking.payoutMethod === 'upi' && selectedBooking.payoutDetails?.upiId ? (
                    <div><strong>UPI ID:</strong> {selectedBooking.payoutDetails.upiId}</div>
                  ) : selectedBooking.payoutMethod === 'bank' && selectedBooking.payoutDetails?.accountNumber ? (
                    <>
                      <div><strong>Holder Name:</strong> {selectedBooking.payoutDetails.accountHolderName}</div>
                      <div><strong>A/C Number:</strong> {selectedBooking.payoutDetails.accountNumber}</div>
                      <div><strong>IFSC Code:</strong> {selectedBooking.payoutDetails.ifscCode}</div>
                    </>
                  ) : (
                    <div className="text-emerald-600 italic">Store voucher details sent directly to registered email and SMS targets.</div>
                  )}
                </div>
                <div className="font-mono text-[10px] text-zinc-700 space-y-1 pt-1.5 border-t border-ice-border mt-1">
                  <div className="flex justify-between">
                    <span>Base Value:</span>
                    <span>{formatPrice(selectedBooking.finalPrice)}</span>
                  </div>
                  {selectedBooking.bonusPercentage > 0 && (
                    <div className="flex justify-between text-emerald-600 font-bold">
                      <span>Bonus Applied (+{(selectedBooking.bonusPercentage * 100).toFixed(1)}%):</span>
                      <span>+{formatPrice(selectedBooking.bonusAmount || 0)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-ink-navy font-bold border-t border-ice-border pt-1 mt-1 text-[11px]">
                    <span>Final Payout Amount:</span>
                    <span className="text-cobalt">{formatPrice(selectedBooking.finalPayoutAmount !== undefined ? selectedBooking.finalPayoutAmount : selectedBooking.finalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Device valuation */}
              <div className="space-y-2">
                <span className="text-[9px] font-mono tracking-[0.15em] text-zinc-500 uppercase block font-bold">4. Device Valuation spec</span>
                <div className="border border-ice-border/60 bg-canvas-white rounded-sm p-3 font-mono">
                  <div className="flex justify-between items-center text-ink-navy font-bold border-b border-ice-border/40 pb-1.5 mb-1.5">
                    <span>{selectedBooking.modelName}</span>
                    <span className="text-zinc-500 font-normal">{selectedBooking.storageGb}GB • {selectedBooking.color}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-2">
                    <span>Final Calculated Price:</span>
                    <span className="text-emerald-500 font-bold text-sm">{formatPrice(selectedBooking.finalPrice)}</span>
                  </div>
                </div>
              </div>

              {/* Admin Actions */}
              <div className="border-t border-ice-border pt-4 space-y-3">
                <span className="text-[9px] font-mono tracking-[0.15em] text-zinc-500 uppercase block font-bold">5. Administrative Controls</span>
                <div className="space-y-2">
                  <span className="text-[10px] text-zinc-500 font-mono block">Physical Doorstep Inspection:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleInspectionChange(selectedBooking.id, 'approved')}
                      disabled={selectedBooking.inspectionStatus === 'approved'}
                      className={`py-2 px-3 text-xs font-bold rounded-sm border transition-all flex items-center justify-center gap-1.5 ${
                        selectedBooking.inspectionStatus === 'approved'
                          ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 cursor-not-allowed opacity-90'
                          : 'bg-canvas-white text-ink-navy border-ice-border hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/5'
                      }`}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve Match
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInspectionChange(selectedBooking.id, 'rejected')}
                      disabled={selectedBooking.inspectionStatus === 'rejected'}
                      className={`py-2 px-3 text-xs font-bold rounded-sm border transition-all flex items-center justify-center gap-1.5 ${
                        selectedBooking.inspectionStatus === 'rejected'
                          ? 'bg-red-500/10 text-red-500 border-red-500/30 cursor-not-allowed opacity-90'
                          : 'bg-canvas-white text-ink-navy border-ice-border hover:border-red-400 hover:text-red-500 hover:bg-red-500/5'
                      }`}
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject Match
                    </button>
                  </div>
                </div>
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] text-zinc-500 font-mono block">Financial Disbursement:</span>
                  {currentUser && currentUser.role !== 'SUPER_ADMIN' && currentUser.role !== 'FINANCE_APPROVER' ? (
                    <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] font-mono text-amber-600">
                      🔒 Payout disbursement is restricted to Finance Approvers & Super Admins.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handlePayoutComplete(selectedBooking.id)}
                      disabled={selectedBooking.inspectionStatus !== 'approved' || selectedBooking.payoutStatus === 'completed'}
                      className={`w-full py-2.5 px-3 text-xs font-bold rounded-sm border transition-all flex items-center justify-center gap-2 ${
                        selectedBooking.payoutStatus === 'completed'
                          ? 'bg-emerald-600 border-emerald-600 text-white cursor-not-allowed'
                          : selectedBooking.inspectionStatus !== 'approved'
                          ? 'bg-canvas-white text-zinc-400 border-ice-border cursor-not-allowed opacity-50'
                          : 'bg-cobalt hover:bg-cobalt-hover text-white border-cobalt hover:scale-[1.01]'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      {selectedBooking.payoutStatus === 'completed' ? 'Payout Marked Completed ✓' : 'Disburse Instant Payout'}
                    </button>
                  )}
                  {selectedBooking.inspectionStatus !== 'approved' && selectedBooking.payoutStatus !== 'completed' && (
                    <span className="text-[9px] text-amber-500 block italic leading-tight mt-1 text-center font-mono">
                      * Must approve doorstep inspect match before payout release.
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default LedgerTab;
