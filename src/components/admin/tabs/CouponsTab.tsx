import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Tag, Plus, RefreshCw, CheckCircle2, AlertCircle, Trash2,
  Copy, Check, Users, IndianRupee, Sparkles, Clock
} from 'lucide-react';
import {
  fetchAdminCoupons,
  createAdminCoupon,
  toggleAdminCouponStatus,
  deleteAdminCoupon,
  fetchAdminCouponUsages,
  fetchAdminReferralRewards,
  updateAdminReferralReward,
  AdminReferralCoupon,
  AdminCouponUsage,
  AdminReferralReward,
} from '../../../utils/api';
export const CouponsTab: React.FC = () => {
  const [coupons, setCoupons] = useState<AdminReferralCoupon[]>([]);
  const [usages, setUsages] = useState<AdminCouponUsage[]>([]);
  const [rewards, setRewards] = useState<AdminReferralReward[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successToast, setSuccessToast] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  // Sub-tabs: 'coupons' | 'usages' | 'rewards'
  const [activeSubTab, setActiveSubTab] = useState<'coupons' | 'usages' | 'rewards'>('coupons');
  const [rewardFilter, setRewardFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'PAID'>('ALL');
  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createCode, setCreateCode] = useState('');
  const [createType, setCreateType] = useState<'FLAT' | 'PERCENT' | 'TIERED'>('FLAT');
  const [createValue, setCreateValue] = useState<number | ''>(500);
  const [createMinDeviceValue, setCreateMinDeviceValue] = useState<number | ''>(0);
  const [createMaxBonusCap, setCreateMaxBonusCap] = useState<number | ''>('');
  const [createMaxTotalUses, setCreateMaxTotalUses] = useState<number | ''>(100);
  const [createMaxUsesPerUser, setCreateMaxUsesPerUser] = useState<number | ''>(1);
  const [createExpiresAt, setCreateExpiresAt] = useState('');
  const [createFirstTimeOnly, setCreateFirstTimeOnly] = useState(false);
  const [createReferrerReward, setCreateReferrerReward] = useState<number | ''>('');
  const [createTargetBrands, setCreateTargetBrands] = useState<string[]>([]);
  const [createTiers, setCreateTiers] = useState<Array<{ min: number; bonus: number }>>([
    { min: 5000, bonus: 300 },
    { min: 20000, bonus: 700 },
    { min: 40000, bonus: 1500 },
  ]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState('');
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [cRes, uRes, rRes] = await Promise.all([
        fetchAdminCoupons(),
        fetchAdminCouponUsages(200),
        fetchAdminReferralRewards().catch(() => ({ success: true, rewards: [] })),
      ]);
      if (cRes.success) setCoupons(cRes.coupons);
      if (uRes.success) setUsages(uRes.usages);
      if (rRes.success) setRewards(rRes.rewards);
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
        setCoupons((prev) => prev.map((c) => (c.id === coupon.id ? res.coupon : c)));
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
        setCoupons((prev) => prev.filter((c) => c.id !== id));
        setUsages((prev) => prev.filter((u) => u.couponId !== id));
        showToast(`Referral code ${code} deleted.`);
      }
    } catch (err: any) {
      alert(`Error deleting coupon: ${err.message}`);
    }
  };
  const handleRewardStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await updateAdminReferralReward(id, newStatus);
      if (res.success) {
        setRewards((prev) => prev.map((r) => (r.id === id ? res.reward : r)));
        showToast(`Referral reward status updated to ${newStatus}.`);
      }
    } catch (err: any) {
      alert(`Error updating reward: ${err.message}`);
    }
  };
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = createCode.trim().toUpperCase();
    if (!cleanCode) {
      setCreateError('Please enter a valid code name.');
      return;
    }
    if (createType !== 'TIERED' && (typeof createValue !== 'number' || createValue <= 0)) {
      setCreateError('Please enter a valid bonus amount greater than 0.');
      return;
    }
    setCreateLoading(true);
    setCreateError('');
    try {
      const res = await createAdminCoupon({
        code: cleanCode,
        type: createType,
        value: createType === 'TIERED' ? (createTiers[0]?.bonus || 300) : Number(createValue),
        tierRules: createType === 'TIERED' ? JSON.stringify(createTiers) : undefined,
        targetBrands: createTargetBrands.length > 0 ? JSON.stringify(createTargetBrands) : undefined,
        firstTimeOnly: createFirstTimeOnly,
        referrerReward: typeof createReferrerReward === 'number' && createReferrerReward > 0 ? createReferrerReward : undefined,
        minDeviceValue: typeof createMinDeviceValue === 'number' ? createMinDeviceValue : 0,
        maxBonusCap: typeof createMaxBonusCap === 'number' && createMaxBonusCap > 0 ? createMaxBonusCap : null,
        maxTotalUses: typeof createMaxTotalUses === 'number' ? createMaxTotalUses : 100,
        maxUsesPerUser: typeof createMaxUsesPerUser === 'number' ? createMaxUsesPerUser : 1,
        expiresAt: createExpiresAt ? new Date(createExpiresAt).toISOString() : null,
      });
      if (res.success) {
        setCoupons((prev) => [res.coupon, ...prev]);
        setIsCreateOpen(false);
        setCreateCode('');
        setCreateValue(500);
        setCreateType('FLAT');
        setCreateFirstTimeOnly(false);
        setCreateTargetBrands([]);
        showToast(`Referral code ${cleanCode} created successfully!`);
      }
    } catch (err: any) {
      setCreateError(err.message || 'Failed to create referral coupon.');
    } finally {
      setCreateLoading(false);
    }
  };
  const totalBonusDisbursed = useMemo(() => {
    return usages.reduce((acc, curr) => acc + (curr.bonusCredited || 0), 0);
  }, [usages]);
  const pendingRewardsCount = useMemo(() => {
    return rewards.filter((r) => r.status === 'PENDING').length;
  }, [rewards]);
  const filteredRewards = useMemo(() => {
    if (rewardFilter === 'ALL') return rewards;
    return rewards.filter((r) => r.status === rewardFilter);
  }, [rewards, rewardFilter]);
  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg font-medium text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{successToast}</span>
        </div>
      )}
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-canvas-pure border border-ice-border rounded-xl p-5 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Dynamic Coupons &amp; Referral Engine</h3>
            <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold uppercase">
              Growth Studio
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure tiered trade-in bonuses, brand-specific promotions, and manage customer referral reward payouts.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
            title="Refresh Ledger"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Promo Code</span>
          </button>
        </div>
      </div>
      {/* Error Alert */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}
      {/* Performance Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-ice-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Campaigns</span>
            <Tag className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2 font-sans">{coupons.filter((c) => c.active).length}</p>
        </div>
        <div className="bg-white border border-ice-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Redemptions</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <p className="text-2xl font-extrabold text-indigo-700 mt-2 font-sans">{usages.length}</p>
        </div>
        <div className="bg-white border border-ice-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Bonus Paid</span>
            <IndianRupee className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-2 font-sans">₹{totalBonusDisbursed.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-white border border-ice-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending Referrer Rewards</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2 font-sans">{pendingRewardsCount} Pending</p>
        </div>
      </div>
      {/* Sub-Tabs Switcher */}
      <div className="flex border-b border-ice-border gap-2 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveSubTab('coupons')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'coupons'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tag className="w-3.5 h-3.5" />
          <span>Configured Promo Codes ({coupons.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('usages')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'usages'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Redemption Logs ({usages.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSubTab('rewards')}
          className={`px-4 py-2.5 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer ${
            activeSubTab === 'rewards'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <IndianRupee className="w-3.5 h-3.5" />
          <span>Customer Referral Payouts</span>
          {pendingRewardsCount > 0 && (
            <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[9px] font-bold">
              {pendingRewardsCount}
            </span>
          )}
        </button>
      </div>
      {/* SUBTAB 1: COUPONS LIST */}
      {activeSubTab === 'coupons' && (
        <div className="bg-canvas-pure border border-ice-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 border-b border-ice-border text-slate-500 font-semibold tracking-wider text-[11px] uppercase">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Type &amp; Bonus</th>
                  <th className="p-3.5">Targeting &amp; Rules</th>
                  <th className="p-3.5">Min Device Value</th>
                  <th className="p-3.5">Redemptions / Limit</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {coupons.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">
                      No referral codes created yet. Click "Create Promo Code" to launch your first campaign.
                    </td>
                  </tr>
                ) : (
                  coupons.map((c) => {
                    const isExpired = c.expiresAt && new Date(c.expiresAt) < new Date();
                    let targetBrandsList: string[] = [];
                    try {
                      targetBrandsList = JSON.parse(c.targetBrands || '[]');
                    } catch {}
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded text-xs font-bold">
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
                          {c.isCustomerRef && (
                            <span className="text-[10px] text-emerald-600 block mt-0.5">👤 Customer Referral</span>
                          )}
                        </td>
                        <td className="p-3.5 font-bold text-emerald-700">
                          {c.type === 'TIERED' ? (
                            <div>
                              <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded text-[10px] font-extrabold uppercase">
                                Multi-Tier Stepped
                              </span>
                              <div className="text-[11px] text-slate-600 font-normal mt-0.5">
                                Up to ₹{c.value.toLocaleString('en-IN')}+ bonus
                              </div>
                            </div>
                          ) : c.type === 'PERCENT' ? (
                            <span>+{c.value}% {c.maxBonusCap ? `(Max ₹${c.maxBonusCap.toLocaleString('en-IN')})` : ''}</span>
                          ) : (
                            <span>+₹{c.value.toLocaleString('en-IN')}</span>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-600">
                          <div className="space-y-1">
                            {targetBrandsList.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {targetBrandsList.map((b) => (
                                  <span key={b} className="bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded text-[10px] font-medium">
                                    {b}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-slate-400">All Brands</span>
                            )}
                            {c.firstTimeOnly && (
                              <span className="inline-block px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded text-[10px] font-bold">
                                First-Time Only
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3.5 text-slate-600">
                          {c.minDeviceValue > 0 ? `₹${c.minDeviceValue.toLocaleString('en-IN')}` : 'None (All)'}
                        </td>
                        <td className="p-3.5">
                          <span className="font-semibold text-slate-900">
                            {c.currentUses} {c.maxTotalUses > 0 ? `/ ${c.maxTotalUses}` : '(Unlimited)'}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {isExpired ? (
                            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full text-[10px] font-bold">
                              Expired
                            </span>
                          ) : c.active ? (
                            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                              Active
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[10px] font-bold">
                              Paused
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleToggleActive(c)}
                            className={`px-2 py-1 rounded text-xs font-semibold cursor-pointer ${
                              c.active ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
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
      )}
      {/* SUBTAB 2: USAGE LOGS */}
      {activeSubTab === 'usages' && (
        <div className="bg-canvas-pure border border-ice-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 border-b border-ice-border text-slate-500 font-semibold tracking-wider text-[11px] uppercase">
                <tr>
                  <th className="p-3.5">Timestamp</th>
                  <th className="p-3.5">Promo Code</th>
                  <th className="p-3.5">Customer Name</th>
                  <th className="p-3.5">Phone / Email</th>
                  <th className="p-3.5">Base Value</th>
                  <th className="p-3.5">Bonus Credited</th>
                  <th className="p-3.5">Final Payout</th>
                  <th className="p-3.5">Booking Ref</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {usages.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-sans text-xs">
                      No referral redemptions recorded yet.
                    </td>
                  </tr>
                ) : (
                  usages.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(u.usedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="p-3.5 font-bold text-blue-700">{u.couponCode}</td>
                      <td className="p-3.5 font-sans font-medium text-slate-900">{u.customerName || 'Guest User'}</td>
                      <td className="p-3.5 text-slate-600">
                        <div>{u.customerPhone || '—'}</div>
                        <div className="text-[10px] text-slate-400">{u.customerEmail}</div>
                      </td>
                      <td className="p-3.5 text-slate-700 font-sans">₹{u.basePrice.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 font-bold text-emerald-700 font-sans">+₹{u.bonusCredited.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 font-extrabold text-slate-900 font-sans">₹{u.finalPrice.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 font-mono text-slate-600">{u.bookingId || 'Quote Only'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* SUBTAB 3: CUSTOMER REFERRAL REWARDS */}
      {activeSubTab === 'rewards' && (
        <div className="bg-canvas-pure border border-ice-border rounded-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-ice-border flex justify-between items-center bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">Filter By Status:</span>
              <div className="flex gap-1">
                {(['ALL', 'PENDING', 'APPROVED', 'PAID'] as const).map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setRewardFilter(st)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer ${
                      rewardFilter === st ? 'bg-slate-900 text-white' : 'bg-white border text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-xs text-slate-500">{filteredRewards.length} reward payouts</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-sans">
              <thead className="bg-slate-50 border-b border-ice-border text-slate-500 font-semibold tracking-wider text-[11px] uppercase">
                <tr>
                  <th className="p-3.5">Date</th>
                  <th className="p-3.5">Referral Code</th>
                  <th className="p-3.5">Referred Customer</th>
                  <th className="p-3.5">Booking Ref</th>
                  <th className="p-3.5">Reward Amount</th>
                  <th className="p-3.5">Payout UPI ID</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRewards.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">
                      No referral rewards matching filter. When customers invite friends and trade-ins complete, rewards queue here.
                    </td>
                  </tr>
                ) : (
                  filteredRewards.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3.5 text-slate-500 font-mono text-[11px]">
                        {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                      </td>
                      <td className="p-3.5 font-bold font-mono text-blue-700">{r.couponCode}</td>
                      <td className="p-3.5 text-slate-700">
                        <div>{r.referredPhone || '—'}</div>
                        <div className="text-[10px] text-slate-400">{r.referredEmail}</div>
                      </td>
                      <td className="p-3.5 font-mono text-cobalt font-semibold">{r.bookingId}</td>
                      <td className="p-3.5 font-bold text-emerald-700 font-mono text-sm">+₹{r.rewardAmount.toLocaleString('en-IN')}</td>
                      <td className="p-3.5 font-mono text-slate-600">{r.payoutUpiId || '—'}</td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' : r.status === 'APPROVED' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3.5 text-right space-x-1">
                        {r.status === 'PENDING' && (
                          <button
                            type="button"
                            onClick={() => handleRewardStatusChange(r.id, 'APPROVED')}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold cursor-pointer"
                          >
                            Approve
                          </button>
                        )}
                        {r.status === 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => handleRewardStatusChange(r.id, 'PAID')}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer"
                          >
                            Mark Paid (UPI)
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* CREATE MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 text-left relative my-8">
            <h3 className="text-lg font-bold text-slate-950 mb-1">Create Dynamic Promo Code</h3>
            <p className="text-xs text-slate-500 mb-4">
              Set stepped multi-tier bonuses, target brands, and custom referral rules.
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
                  Promo Code String *
                </label>
                <input
                  type="text"
                  required
                  value={createCode}
                  onChange={(e) => setCreateCode(e.target.value.toUpperCase())}
                  placeholder="e.g. SUPERTIER, APPLEBOOST, WELCOME300"
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
                    onChange={(e) => setCreateType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 cursor-pointer"
                  >
                    <option value="FLAT">Flat Cash Bonus (₹)</option>
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="TIERED">Dynamic Stepped Tiers</option>
                  </select>
                </div>
                {createType !== 'TIERED' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      {createType === 'PERCENT' ? 'Percentage Value (%)' : 'Bonus Payout (₹)'} *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={createValue}
                      onChange={(e) => setCreateValue(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder={createType === 'PERCENT' ? '3' : '500'}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Rule Mode
                    </label>
                    <div className="px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                      3-Tier Stepped
                    </div>
                  </div>
                )}
              </div>
                {createType === 'PERCENT' && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                      Max Bonus Cap (₹) (Optional)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={createMaxBonusCap}
                      onChange={(e) => setCreateMaxBonusCap(e.target.value === '' ? '' : Number(e.target.value))}
                      placeholder="e.g. 1500"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                    />
                  </div>
                )}
              {/* TIERED RULES BUILDER */}
              {createType === 'TIERED' && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Stepped Valuation Tiers</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setCreateTiers((prev) => [...prev, { min: (prev[prev.length - 1]?.min || 30000) + 15000, bonus: (prev[prev.length - 1]?.bonus || 1000) + 500 }])}
                      className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                    >
                      + Add Step
                    </button>
                  </div>
                  {createTiers.map((tier, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-slate-500 w-12">T{idx + 1}:</span>
                      <input
                        type="number"
                        placeholder="Min Device ₹"
                        value={tier.min}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCreateTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, min: val } : t)));
                        }}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono"
                      />
                      <span className="text-xs text-slate-400">➔ +₹</span>
                      <input
                        type="number"
                        placeholder="Bonus ₹"
                        value={tier.bonus}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          setCreateTiers((prev) => prev.map((t, i) => (i === idx ? { ...t, bonus: val } : t)));
                        }}
                        className="w-24 px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-emerald-700"
                      />
                      {createTiers.length > 1 && (
                        <button
                          type="button"
                          onClick={() => setCreateTiers((prev) => prev.filter((_, i) => i !== idx))}
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {/* TARGET BRANDS SELECTOR */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wider">
                  Target Device Brands (Optional)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Google', 'Realme'].map((b) => {
                    const isSelected = createTargetBrands.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => {
                          setCreateTargetBrands((prev) =>
                            isSelected ? prev.filter((item) => item !== b) : [...prev, b]
                          );
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {b}
                      </button>
                    );
                  })}
                  {createTargetBrands.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCreateTargetBrands([])}
                      className="text-[11px] text-slate-400 hover:text-slate-700 underline px-1"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
              {/* FIRST-TIME SELLER TOGGLE */}
              <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
                <input
                  type="checkbox"
                  checked={createFirstTimeOnly}
                  onChange={(e) => setCreateFirstTimeOnly(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-800">
                  First-Time Seller Exclusive (Only customers with 0 completed bookings)
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Min Device Value (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={createMinDeviceValue}
                    onChange={(e) => setCreateMinDeviceValue(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Total Allowed Uses
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={createMaxTotalUses}
                    onChange={(e) => setCreateMaxTotalUses(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="100 (0 = unlimited)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Per-Customer Limit
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={createMaxUsesPerUser}
                    onChange={(e) => setCreateMaxUsesPerUser(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="1"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Referrer Payout Reward (₹)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={createReferrerReward}
                    onChange={(e) => setCreateReferrerReward(e.target.value === '' ? '' : Number(e.target.value))}
                    placeholder="e.g. 200 (0 = none)"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Expiry Date &amp; Time (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={createExpiresAt}
                  onChange={(e) => setCreateExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                />
              </div>
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                >
                  {createLoading ? 'Publishing...' : 'Publish Promo Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
