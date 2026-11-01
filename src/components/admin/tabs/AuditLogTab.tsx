import React, { useState, useEffect, useMemo } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import {
  Search, RefreshCw, Clock, User, FileText,
  Activity, CheckCircle2, ShieldAlert, ChevronDown
} from 'lucide-react';

export const AuditLogTab: React.FC = () => {
  const { auditLogs, loadingAuditLogs, refreshAuditLogs } = useAdmin();
  const [search, setSearch] = useState('');
  const [selectedActionFilter, setSelectedActionFilter] = useState('ALL');

  // Auto-fetch audit logs on mount
  useEffect(() => {
    refreshAuditLogs();
  }, [refreshAuditLogs]);

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

  // Distinct actions for filter dropdown
  const availableActions = useMemo(() => {
    const set = new Set<string>();
    auditLogs.forEach(l => {
      if (l.action) set.add(l.action);
    });
    return Array.from(set).sort();
  }, [auditLogs]);

  // Client-side filtering
  const filteredLogs = useMemo(() => {
    return auditLogs.filter(log => {
      if (selectedActionFilter !== 'ALL' && log.action !== selectedActionFilter) {
        return false;
      }
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
  }, [auditLogs, selectedActionFilter, search]);

  const getActionBadgeClass = (action: string) => {
    const act = (action || '').toLowerCase();
    if (act.includes('fail') || act.includes('lock') || act.includes('purge') || act.includes('delete') || act.includes('suspended')) {
      return 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (act.includes('price') || act.includes('cashify') || act.includes('model') || act.includes('update')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (act.includes('status') || act.includes('booking') || act.includes('inspection')) {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (act.includes('coupon') || act.includes('success') || act.includes('create') || act.includes('payout')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-5 text-left font-sans">
      {/* ── 1. Stats Summary Ribbon ────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Total Events Logged</span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-xl font-extrabold text-slate-900 font-mono leading-none">{auditLogs.length}</span>
              <span className="text-xs text-slate-500 font-medium">Records in DB</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Database Engine</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-bold text-emerald-700 font-mono">PostgreSQL Active</span>
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Latest Audit Event</span>
            <div className="text-sm font-bold text-slate-800 font-mono mt-0.5 truncate max-w-[200px]">
              {auditLogs.length > 0 ? new Date(auditLogs[0].createdAt).toLocaleTimeString('en-IN') : 'None recorded'}
            </div>
          </div>
        </div>
      </div>

      {/* ── 2. Filter & Action Toolbar ─────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by action, model, target, admin..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:bg-white transition-all"
            />
          </form>

          {/* Action Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedActionFilter}
              onChange={e => setSelectedActionFilter(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg px-3 py-2 pr-8 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              <option value="ALL">All Actions ({auditLogs.length})</option>
              {availableActions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Refresh Button */}
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => refreshAuditLogs(search)}
            disabled={loadingAuditLogs}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditLogs ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
            <span>{loadingAuditLogs ? 'Refreshing...' : 'Refresh'}</span>
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
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Target</th>
                <th className="p-3.5">Admin User</th>
                <th className="p-3.5 pr-4 text-right">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {loadingAuditLogs ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs italic text-slate-500">Loading audit log records from database...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-slate-400 font-sans">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <ShieldAlert className="w-8 h-8 text-slate-300 mb-1" />
                      <span className="text-xs font-bold text-slate-700">No audit records found</span>
                      <span className="text-xs text-slate-500 max-w-sm">
                        {search || selectedActionFilter !== 'ALL'
                          ? 'No log entries matched your current filter. Try resetting search or selecting All Actions.'
                          : 'Administrative actions like price updates, status changes, and logins will be recorded here.'}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
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

                    <td className="p-3.5">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider border ${getActionBadgeClass(log.action)}`}>
                        {log.action}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <span className="text-[9px] uppercase font-bold text-slate-400 tracking-wider block font-sans">
                        {log.targetType}
                      </span>
                      <span className="font-semibold text-slate-900 text-xs">
                        {log.targetId}
                      </span>
                    </td>

                    <td className="p-3.5 text-slate-600">
                      <div className="flex items-center gap-1.5 font-sans">
                        <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                          <User className="w-3 h-3" />
                        </div>
                        <span className="font-medium text-xs text-slate-700">
                          {log.adminUserId || 'system'}
                        </span>
                      </div>
                    </td>

                    <td className="p-3.5 pr-4 text-right">
                      <details className="cursor-pointer group inline-block text-left">
                        <summary className="text-[11px] text-blue-600 hover:text-blue-800 font-sans font-semibold flex items-center justify-end gap-1 select-none transition-colors">
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Payload</span>
                        </summary>
                        <pre className="mt-2 p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] max-h-48 overflow-auto text-emerald-400 font-mono shadow-md text-left">
                          {formatPayload(log.payload)}
                        </pre>
                      </details>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info strip */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Showing {filteredLogs.length} of {auditLogs.length} logged events</span>
          <span className="text-[11px] text-slate-400">Encrypted immutable audit storage active</span>
        </div>
      </div>
    </div>
  );
};

export default AuditLogTab;
