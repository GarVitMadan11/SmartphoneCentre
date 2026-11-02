import React, { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import {
  Search, RefreshCw, Clock, User, FileText,
  ShieldAlert, ChevronDown, KeyRound,
  DollarSign, PackageCheck, Smartphone, Users,
  Layers, AlertTriangle, CheckCircle2, X
} from 'lucide-react';

type AuditCategory = 'ALL' | 'LOGINS' | 'PRICING' | 'BOOKINGS' | 'CATALOG' | 'STAFF';

interface CategoryConfig {
  id: AuditCategory;
  label: string;
  shortLabel: string;
  icon: React.ElementType;
  color: string;
  activeBg: string;
  borderColor: string;
  badgeBg: string;
}

const CATEGORIES: CategoryConfig[] = [
  {
    id: 'ALL',
    label: 'All Activity Feed',
    shortLabel: 'All Events',
    icon: Layers,
    color: 'text-slate-700',
    activeBg: 'bg-slate-900 text-white shadow-sm',
    borderColor: 'border-slate-300',
    badgeBg: 'bg-slate-100 text-slate-700',
  },
  {
    id: 'LOGINS',
    label: 'Logins & Security',
    shortLabel: 'Security & Logins',
    icon: KeyRound,
    color: 'text-rose-600',
    activeBg: 'bg-rose-600 text-white shadow-sm shadow-rose-200',
    borderColor: 'border-rose-200',
    badgeBg: 'bg-rose-50 text-rose-700',
  },
  {
    id: 'PRICING',
    label: 'Price & Valuation',
    shortLabel: 'Price Updates',
    icon: DollarSign,
    color: 'text-emerald-600',
    activeBg: 'bg-emerald-600 text-white shadow-sm shadow-emerald-200',
    borderColor: 'border-emerald-200',
    badgeBg: 'bg-emerald-50 text-emerald-700',
  },
  {
    id: 'BOOKINGS',
    label: 'Bookings & Orders',
    shortLabel: 'Bookings',
    icon: PackageCheck,
    color: 'text-amber-600',
    activeBg: 'bg-amber-600 text-white shadow-sm shadow-amber-200',
    borderColor: 'border-amber-200',
    badgeBg: 'bg-amber-50 text-amber-800',
  },
  {
    id: 'CATALOG',
    label: 'Catalog & Inventory',
    shortLabel: 'Catalog',
    icon: Smartphone,
    color: 'text-blue-600',
    activeBg: 'bg-blue-600 text-white shadow-sm shadow-blue-200',
    borderColor: 'border-blue-200',
    badgeBg: 'bg-blue-50 text-blue-700',
  },
  {
    id: 'STAFF',
    label: 'Staff & Permissions',
    shortLabel: 'Staff Management',
    icon: Users,
    color: 'text-purple-600',
    activeBg: 'bg-purple-600 text-white shadow-sm shadow-purple-200',
    borderColor: 'border-purple-200',
    badgeBg: 'bg-purple-50 text-purple-700',
  },
];

export const AuditLogTab: React.FC = () => {
  const { auditLogs, loadingAuditLogs, refreshAuditLogs } = useAdmin();
  const [activeCategory, setActiveCategory] = useState<AuditCategory>('ALL');
  const [search, setSearch] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('ALL');
  const [selectedLogPayload, setSelectedLogPayload] = useState<Record<string, unknown> | null>(null);

  // Auto-fetch audit logs on mount
  useEffect(() => {
    refreshAuditLogs();
  }, [refreshAuditLogs]);

  // Categorization helper
  const categorizeLog = (log: { action: string; targetType: string; payload?: unknown }): AuditCategory => {
    const act = (log.action || '').toLowerCase();
    const target = (log.targetType || '').toLowerCase();

    // 1. Staff changes
    if (act.startsWith('staff_') || act.includes('staff')) {
      return 'STAFF';
    }

    // 2. Logins & Auth / Security
    if (
      act.includes('login') ||
      act.includes('lock') ||
      act.includes('password') ||
      act.includes('auth') ||
      act.includes('purge') ||
      (target === 'adminuser' && !act.startsWith('staff_'))
    ) {
      return 'LOGINS';
    }

    // 3. Pricing & Cashify & Valuation
    if (
      act.includes('cashify') ||
      act.includes('price') ||
      act.includes('bulk_update') ||
      (act.includes('model') && JSON.stringify(log.payload || {}).toLowerCase().includes('price'))
    ) {
      return 'PRICING';
    }

    // 4. Bookings & Orders
    if (
      target === 'booking' ||
      act.includes('booking') ||
      act.includes('pickup') ||
      act.includes('inspection') ||
      target === 'inspection' ||
      act.includes('payout')
    ) {
      return 'BOOKINGS';
    }

    // 5. Catalog
    if (
      target === 'model' ||
      target === 'catalog' ||
      target === 'variant' ||
      target === 'brand' ||
      act.includes('model') ||
      act.includes('variant')
    ) {
      return 'CATALOG';
    }

    return 'ALL';
  };

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<AuditCategory, number> = {
      ALL: auditLogs.length,
      LOGINS: 0,
      PRICING: 0,
      BOOKINGS: 0,
      CATALOG: 0,
      STAFF: 0,
    };

    auditLogs.forEach(log => {
      const cat = categorizeLog(log);
      if (cat !== 'ALL') {
        counts[cat] = (counts[cat] || 0) + 1;
      }
    });

    return counts;
  }, [auditLogs]);

  // Distinct actions within currently active category
  const availableActions = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach(l => {
      if (activeCategory === 'ALL' || categorizeLog(l) === activeCategory) {
        if (l.action) set.add(l.action);
      }
    });
    return Array.from(set).sort();
  }, [auditLogs, activeCategory]);

  // Reset secondary filter when category changes
  const handleCategoryChange = (cat: AuditCategory) => {
    setActiveCategory(cat);
    setSelectedActionFilter('ALL');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    refreshAuditLogs(search);
  };

  const formatPayload = (payload: Record<string, unknown>) => {
    try {
      return JSON.stringify(payload, null, 2);
    } catch {
      return String(payload);
    }
  };

  // Client-side filtering
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      // 1. Category filter
      if (activeCategory !== 'ALL' && categorizeLog(log) !== activeCategory) {
        return false;
      }

      // 2. Specific action filter
      if (selectedActionFilter !== 'ALL' && log.action !== selectedActionFilter) {
        return false;
      }

      // 3. Search query
      if (!search.trim()) return true;
      const q = search.toLowerCase();
      return (
        log.action.toLowerCase().includes(q) ||
        log.targetType.toLowerCase().includes(q) ||
        log.targetId.toLowerCase().includes(q) ||
        log.adminUserId.toLowerCase().includes(q) ||
        JSON.stringify(log.payload).toLowerCase().includes(q)
      );
    });
  }, [auditLogs, activeCategory, selectedActionFilter, search]);

  const getActionBadgeClass = (action: string) => {
    const act = (action || '').toLowerCase();
    if (act.includes('fail') || act.includes('lock') || act.includes('purge') || act.includes('delete') || act.includes('suspended')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (act.includes('price') || act.includes('cashify') || act.includes('bulk_update')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (act.includes('status') || act.includes('booking') || act.includes('inspection')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (act.includes('coupon') || act.includes('success') || act.includes('create') || act.includes('payout')) {
      return 'bg-teal-50 text-teal-800 border-teal-200';
    }
    if (act.includes('staff')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (act.includes('model') || act.includes('update')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getEventIcon = (action: string, targetType: string) => {
    const act = action.toLowerCase();
    if (act.includes('fail') || act.includes('lock')) return <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />;
    if (act.includes('login_success')) return <KeyRound className="w-3.5 h-3.5 text-emerald-600" />;
    if (act.includes('price') || act.includes('cashify')) return <DollarSign className="w-3.5 h-3.5 text-emerald-600" />;
    if (targetType.toLowerCase() === 'booking' || act.includes('booking')) return <PackageCheck className="w-3.5 h-3.5 text-amber-600" />;
    if (act.includes('staff')) return <Users className="w-3.5 h-3.5 text-purple-600" />;
    return <Smartphone className="w-3.5 h-3.5 text-blue-600" />;
  };

  return (
    <div className="space-y-4 text-left font-sans">
      {/* ── 1. Category Switcher Tabs ──────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-2 shadow-xs">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const count = categoryCounts[cat.id];
            const isSelected = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`relative flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer text-left ${
                  isSelected
                    ? `${cat.activeBg} border-transparent`
                    : 'bg-slate-50/70 hover:bg-slate-100/80 border-slate-200/80 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : `${cat.badgeBg} ${cat.color}`
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className={`text-xs font-bold block truncate leading-tight ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                      {cat.shortLabel}
                    </span>
                    <span className={`text-[10px] font-medium block truncate leading-tight ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                      {cat.id === 'ALL' ? 'Everything' : 'Categorized'}
                    </span>
                  </div>
                </div>

                <span
                  className={`ml-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono font-bold shrink-0 ${
                    isSelected
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2. Filter & Action Toolbar ─────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder={`Search within ${CATEGORIES.find(c => c.id === activeCategory)?.shortLabel}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Action Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedActionFilter}
              onChange={e => setSelectedActionFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Actions in set ({filteredLogs.length})</option>
              {availableActions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Active category pill indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
            <span className="font-semibold text-slate-800">Set:</span>
            <span>{CATEGORIES.find(c => c.id === activeCategory)?.label}</span>
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          <button
            type="button"
            onClick={() => refreshAuditLogs(search)}
            disabled={loadingAuditLogs}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditLogs ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{loadingAuditLogs ? 'Refreshing...' : 'Refresh Feed'}</span>
          </button>
        </div>
      </div>

      {/* ── 3. Audit Logs Table ────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold tracking-wider text-[11px] uppercase">
              <tr>
                <th className="p-3.5 pl-4">Timestamp</th>
                <th className="p-3.5">Action & Scope</th>
                <th className="p-3.5">Target Asset</th>
                <th className="p-3.5">Initiator</th>
                <th className="p-3.5 pr-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loadingAuditLogs ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs italic text-slate-500">Loading audit records from encrypted database ledger...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert className="w-8 h-8 text-slate-300 mb-1" />
                      <span className="text-xs font-bold text-slate-700">No events found in this category</span>
                      <span className="text-xs text-slate-500 max-w-sm">
                        {search || selectedActionFilter !== 'ALL'
                          ? 'No events match your current search query or action filter.'
                          : `No activity recorded yet for ${CATEGORIES.find(c => c.id === activeCategory)?.label}.`}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Timestamp */}
                    <td className="p-3.5 pl-4 text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="font-sans font-medium text-slate-600 text-xs">
                          {new Date(log.createdAt).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </span>
                      </div>
                    </td>

                    {/* Action with Icon */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                          {getEventIcon(log.action, log.targetType)}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getActionBadgeClass(log.action)}`}>
                          {log.action}
                        </span>
                      </div>
                    </td>

                    {/* Target Asset */}
                    <td className="p-3.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block font-sans">
                        {log.targetType}
                      </span>
                      <span className="font-semibold text-slate-900 text-xs truncate max-w-[220px] block" title={log.targetId}>
                        {log.targetId}
                      </span>
                    </td>

                    {/* Initiator */}
                    <td className="p-3.5 text-slate-600">
                      <div className="flex items-center gap-1.5 font-sans">
                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 shrink-0">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="font-medium text-xs text-slate-700 truncate max-w-[160px]" title={log.adminUserId}>
                          {log.adminUserId || 'system'}
                        </span>
                      </div>
                    </td>

                    {/* Payload Details */}
                    <td className="p-3.5 pr-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedLogPayload(log.payload as Record<string, unknown>)}
                        className="text-[11px] text-blue-600 hover:text-blue-800 font-sans font-semibold inline-flex items-center gap-1 px-2.5 py-1 rounded hover:bg-blue-50 transition-colors cursor-pointer"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Inspect Data</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info strip */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            Showing <strong className="text-slate-800 font-semibold">{filteredLogs.length}</strong> events in{' '}
            <strong className="text-slate-800 font-semibold">{CATEGORIES.find(c => c.id === activeCategory)?.shortLabel}</strong> (Total logged: {auditLogs.length})
          </span>
          <span className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            Immutable PostgreSQL Ledger Active
          </span>
        </div>
      </div>

      {/* ── 4. Payload Modal ───────────────────────────────────────────── */}
      {selectedLogPayload && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-sm">Audit Payload Inspector</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLogPayload(null)}
                className="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex-1 bg-slate-950">
              <pre className="text-xs text-emerald-400 font-mono leading-relaxed whitespace-pre-wrap select-all">
                {formatPayload(selectedLogPayload)}
              </pre>
            </div>
            <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setSelectedLogPayload(null)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogTab;
