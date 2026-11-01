import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Tag, Plus, RefreshCw, CheckCircle2, AlertCircle, Trash2,
  Copy, Check, Users, IndianRupee, Flame
} from 'lucide-react';
import {
  fetchAdminCoupons,
  createAdminCoupon,
  toggleAdminCouponStatus,
  deleteAdminCoupon,
  fetchAdminCouponUsages,
  AdminReferralCoupon,
  AdminCouponUsage,
} from '../../../utils/api';

export const CouponsTab: React.FC = () => {
  const [coupons, setCoupons] = useState<AdminReferralCoupon[]>([]);
  const [usages, setUsages] = useState<AdminCouponUsage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createCode, setCreateCode] = useState('');
  const [createType, setCreateType] = useState<'FLAT' | 'PERCENT'>('FLAT');
  const [createValue, setCreateValue] = useState<number | ''>(500);
  const [createMinDeviceValue, setCreateMinDeviceValue] = useState<number | ''>(0);
  const [createMaxBonusCap, setCreateMaxBonusCap] = useState<number | ''>('');
  const [createMaxTotalUses, setCreateMaxTotalUses] = useState<number | ''>(100);
  const [createMaxUsesPerUser, setCreateMaxUsesPerUser] = useState<number | ''>(1);
  const [createExpiresAt, setCreateExpiresAt] = useState('');
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cRes, uRes] = await Promise.all([
        fetchAdminCoupons(),
        fetchAdminCouponUsages(200),
      ]);
      if (cRes.success) setCoupons(cRes.coupons);
      if (uRes.success) setUsages(uRes.usages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch coupon records.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(''), 4000);
  };

  const handleCopy = (code: string) => {
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleActive = async (coupon: AdminReferralCoupon) => {
    try {
      const res = await toggleAdminCouponStatus(coupon.id, !coupon.active);
      if (res.success) {
        setCoupons(prev => prev.map(c => c.id === coupon.id ? res.coupon : c));
        showToast(`Referral code ${coupon.code} ${res.coupon.active ? 'activated' : 'paused'}.`);
      }
    } catch (err: any) {
      alert(`Error toggling coupon: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`Are you sure you want to delete referral code "${code}"? This will also remove its usage logs.`)) {
      return;
    }
    try {
      const res = await deleteAdminCoupon(id);
      if (res.success) {
        setCoupons(prev => prev.filter(c => c.id !== id));
        setUsages(prev => prev.filter(u => u.couponId !== id));
        showToast(`Referral code ${code} deleted.`);
      }
    } catch (err: any) {
      alert(`Error deleting coupon: ${err.message}`);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = createCode.trim().toUpperCase();
    if (!cleanCode) {
      setCreateError('Please enter a valid code name.');
      return;
    }
    if (typeof createValue !== 'number' || createValue <= 0) {
      setCreateError('Please enter a valid bonus amount greater than 0.');
      return;
    }

    setCreateLoading(true);
    setCreateError('');

    try {
      const res = await createAdminCoupon({
        code: cleanCode,
        type: createType,
        value: createValue,
        minDeviceValue: typeof createMinDeviceValue === 'number' ? createMinDeviceValue : 0,
        maxBonusCap: typeof createMaxBonusCap === 'number' && createMaxBonusCap > 0 ? createMaxBonusCap : null,
        maxTotalUses: typeof createMaxTotalUses === 'number' ? createMaxTotalUses : 100,
        maxUsesPerUser: typeof createMaxUsesPerUser === 'number' ? createMaxUsesPerUser : 1,
        expiresAt: createExpiresAt ? new Date(createExpiresAt).toISOString() : null,
      });

      if (res.success) {
        setCoupons(prev => [res.coupon, ...prev]);
        setIsCreateOpen(false);
        setCreateCode('');
        setCreateValue(500);
        setCreateMinDeviceValue(0);
        setCreateMaxBonusCap('');
        setCreateMaxTotalUses(100);
        setCreateMaxUsesPerUser(1);
        setCreateExpiresAt('');
        showToast(`Referral code ${cleanCode} created successfully!`);
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create coupon.');
    } finally {
      setCreateLoading(false);
    }
  };

  // KPI Calculations
  const totalRedemptions = useMemo(() => {
    return coupons.reduce((sum, c) => sum + (c.currentUses || 0), 0);
  }, [coupons]);

  const totalBonusDisbursed = useMemo(() => {
    return usages.reduce((sum, u) => sum + (u.bonusCredited || 0), 0);
  }, [usages]);

  const activeCodesCount = useMemo(() => {
    return coupons.filter(c => c.active).length;
  }, [coupons]);

  return (
    <div className="space-y-6 text-left">
      {/* Toast Notification */}
      {successToast && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successToast}</span>
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-300 text-rose-900 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-canvas-pure border border-ice-border rounded-xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-cobalt" />
            <h3 className="font-sans text-xl font-bold text-ink-navy">Referral &amp; Bonus Coupons</h3>
          </div>
          <p className="text-xs text-zinc-500 font-sans mt-1">
            Create promotional bonus codes, set redemption caps per customer, and monitor payout incentive ROI.
          </p>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2.5 bg-white hover:bg-slate-50 border border-ice-border rounded-xl text-slate-700 transition-colors shadow-xs"
            title="Refresh Coupon Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cobalt' : ''}`} />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Code</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white border border-ice-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Codes</span>
            <Tag className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-sans">{activeCodesCount} <span className="text-xs font-normal text-slate-400">/ {coupons.length}</span></p>
        </div>

        <div className="bg-white border border-ice-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Redemptions</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-sans">{totalRedemptions}</p>
        </div>

        <div className="bg-white border border-ice-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Bonus Disbursed</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2 font-sans">₹{totalBonusDisbursed.toLocaleString('en-IN')}</p>
        </div>

        <div className="bg-white border border-ice-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Top Incentive</span>
            <Flame className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-lg font-extrabold text-slate-900 mt-2 font-sans truncate">
            {coupons.length > 0 ? coupons[0].code : 'None'}
          </p>
        </div>
      </div>

      {/* Coupons List Table */}
      <div className="bg-canvas-pure border border-ice-border rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-ice-border flex justify-between items-center bg-slate-50/50">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Configured Referral Codes</h4>
          <span className="text-xs text-slate-500">{coupons.length} total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-ice-border text-slate-500 font-semibold tracking-wider text-[11px] uppercase">
              <tr>
                <th className="p-3.5">Code</th>
                <th className="p-3.5">Bonus Value</th>
                <th className="p-3.5">Min Device Value</th>
                <th className="p-3.5">Redemptions / Limit</th>
                <th className="p-3.5">Per-Customer Cap</th>
                <th className="p-3.5">Expiry</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coupons.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                    No referral codes created yet. Click "Create New Code" to launch your first promotion.
                  </td>
                </tr>
              ) : (
                coupons.map((c) => {
                  const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                  const isMaxReached = c.maxTotalUses > 0 && c.currentUses >= c.maxTotalUses;
                  const usagePercent = c.maxTotalUses > 0 ? Math.min(100, Math.round((c.currentUses / c.maxTotalUses) * 100)) : 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 font-bold text-slate-900 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-xs">
                            {c.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(c.code)}
                            className="text-slate-400 hover:text-slate-700 transition-colors p-1"
                            title="Copy Code"
                          >
                            {copiedCode === c.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                      <td className="p-3.5 font-bold text-emerald-700">
                        {c.type === 'PERCENT' ? (
                          <span>+{c.value}% {c.maxBonusCap ? `(Max ₹${c.maxBonusCap.toLocaleString('en-IN')})` : ''}</span>
                        ) : (
                          <span>+₹{c.value.toLocaleString('en-IN')}</span>
                        )}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {c.minDeviceValue > 0 ? `₹${c.minDeviceValue.toLocaleString('en-IN')}` : 'None (All)'}
                      </td>
                      <td className="p-3.5">
                        <div>
                          <span className="font-semibold text-slate-900">
                            {c.currentUses} {c.maxTotalUses > 0 ? `/ ${c.maxTotalUses}` : '(Unlimited)'}
                          </span>
                          {c.maxTotalUses > 0 && (
                            <div className="w-24 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
                              <div
                                className={`h-full rounded-full ${usagePercent >= 100 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {c.maxUsesPerUser} use{c.maxUsesPerUser > 1 ? 's' : ''}
                      </td>
                      <td className="p-3.5 text-slate-600">
                        {c.expiresAt ? (
                          <span className={isExpired ? 'text-rose-600 font-semibold' : ''}>
                            {new Date(c.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                            {isExpired && ' (Expired)'}
                          </span>
                        ) : (
                          <span className="text-slate-400">Never</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        {isExpired ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            Expired
                          </span>
                        ) : isMaxReached ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Limit Reached
                          </span>
                        ) : c.active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-300">
                            Paused
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className="px-2 py-1 text-[11px] font-semibold border rounded hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          {c.active ? 'Pause' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id, c.code)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                          title="Delete Code"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Redemption Audit Log Table */}
      <div className="bg-canvas-pure border border-ice-border rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-ice-border flex justify-between items-center bg-slate-50/50">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Redemption Audit Trail</h4>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">Who used which code, device details, and extra bonus payout disbursed.</p>
          </div>
          <span className="text-xs text-slate-500">{usages.length} redemptions recorded</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-50 border-b border-ice-border text-slate-500 font-semibold tracking-wider text-[11px] uppercase">
              <tr>
                <th className="p-3.5">Timestamp</th>
                <th className="p-3.5">Coupon</th>
                <th className="p-3.5">Customer</th>
                <th className="p-3.5">Contact (Phone/Email)</th>
                <th className="p-3.5">Base Payout</th>
                <th className="p-3.5">Bonus Credited</th>
                <th className="p-3.5">Final Payout</th>
                <th className="p-3.5">Booking Ref</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {usages.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-sans text-xs">
                    No referral redemptions recorded yet. Once customers apply codes during quotation or booking, they will appear here in real-time.
                  </td>
                </tr>
              ) : (
                usages.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5 text-slate-500 whitespace-nowrap">
                      {new Date(u.usedAt).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="p-3.5 font-bold text-blue-700">
                      {u.couponCode}
                    </td>
                    <td className="p-3.5 font-sans font-medium text-slate-900">
                      {u.customerName || 'Guest User'}
                    </td>
                    <td className="p-3.5 text-slate-600">
                      <div>{u.customerPhone || '—'}</div>
                      <div className="text-[10px] text-slate-400">{u.customerEmail}</div>
                    </td>
                    <td className="p-3.5 text-slate-700 font-sans">
                      ₹{u.basePrice.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 font-bold text-emerald-700 font-sans">
                      +₹{u.bonusCredited.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 font-extrabold text-slate-900 font-sans">
                      ₹{u.finalPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3.5 font-mono text-slate-600">
                      {u.bookingId || 'Quote Only'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-left relative">
            <h3 className="text-lg font-bold text-slate-950 mb-1">Create Referral / Promo Code</h3>
            <p className="text-xs text-slate-500 mb-5">
              Set customer cash incentives, redemption limits, and validity rules.
            </p>

            {createError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Referral Code String *
                </label>
                <input
                  type="text"
                  required
                  value={createCode}
                  onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                  placeholder="e.g. WELCOME500, TECHFRIEND, DIWALI5"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold uppercase tracking-wider text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Incentive Type
                  </label>
                  <select
                    value={createType}
                    onChange={(e) => setCreateType(e.target.value as 'FLAT' | 'PERCENT')}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  >
                    <option value="FLAT">Flat Amount (₹)</option>
                    <option value="PERCENT">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Bonus Value ({createType === 'PERCENT' ? '%' : '₹'}) *
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={createValue}
                    onChange={(e) => setCreateValue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder={createType === 'PERCENT' ? '5' : '500'}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>
              </div>

              {createType === 'PERCENT' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Maximum Bonus Cap (₹) (Optional)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={createMaxBonusCap}
                    onChange={(e) => setCreateMaxBonusCap(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 1500 (Max bonus cap for % codes)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Total Max Uses
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={createMaxTotalUses}
                    onChange={(e) => setCreateMaxTotalUses(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0 = Unlimited"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                  <span className="text-[10px] text-slate-400">0 means no overall limit</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Uses Per Customer
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={createMaxUsesPerUser}
                    onChange={(e) => setCreateMaxUsesPerUser(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                  <span className="text-[10px] text-slate-400">Default 1 use per phone/email</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Min Device Payout (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={createMinDeviceValue}
                    onChange={(e) => setCreateMinDeviceValue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0 = No minimum"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Expiry Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={createExpiresAt}
                    onChange={(e) => setCreateExpiresAt(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-cobalt hover:bg-cobalt-hover text-white font-bold text-xs rounded-xl transition-all shadow-sm disabled:opacity-50 cursor-pointer"
                >
                  {createLoading ? 'Creating...' : 'Create Code'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
