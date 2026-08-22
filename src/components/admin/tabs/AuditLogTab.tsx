import React, { useState } from 'react';
import { useAdmin } from '../../../context/AdminContext';
import { Search, RefreshCw, Clock, User, ShieldAlert, FileText } from 'lucide-react';

export const AuditLogTab: React.FC = () => {
  const { auditLogs, loadingAuditLogs, refreshAuditLogs } = useAdmin();
  const [search, setSearch] = useState('');

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

  return (
    <div className="space-y-6 text-left">
      {/* Header Bar */}
      <div className="bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cobalt" />
            <h3 className="font-outfit text-xl font-bold text-ink-navy">System Audit Trail</h3>
          </div>
          <p className="text-xs text-zinc-500 font-mono mt-1">
            Real-time immutable log of administrative actions, pricing edits, and order processing events.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter by action, user..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-canvas-white border border-ice-border rounded-sm text-xs font-mono text-ink-navy focus:outline-none focus:ring-1 focus:ring-cobalt"
            />
          </form>
          <button
            type="button"
            onClick={() => refreshAuditLogs(search)}
            disabled={loadingAuditLogs}
            className="p-2 bg-canvas-white hover:bg-slate-100 dark:hover:bg-zinc-800 border border-ice-border rounded-sm text-ink-navy transition-all"
            title="Refresh Audit Logs"
          >
            <RefreshCw className={`w-4 h-4 ${loadingAuditLogs ? 'animate-spin text-cobalt' : ''}`} />
          </button>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-canvas-pure border border-ice-border rounded-sm shadow-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-canvas-white border-b border-ice-border text-zinc-500 font-semibold tracking-wider text-[10px] uppercase">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Action</th>
                <th className="p-3">Target</th>
                <th className="p-3">Admin User</th>
                <th className="p-3">Payload Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {loadingAuditLogs ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400 font-mono italic">
                    Loading system audit log entries...
                  </td>
                </tr>
              ) : auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-zinc-400 font-mono italic">
                    No audit records found matching query.
                  </td>
                </tr>
              ) : (
                auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-cobalt-light/5 transition-all">
                    <td className="p-3 text-zinc-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cobalt shrink-0" />
                        <span>{new Date(log.createdAt).toLocaleString('en-IN')}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-cobalt/10 text-cobalt border border-cobalt/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3 text-ink-navy font-bold">
                      <span className="text-zinc-500 text-[10px] uppercase block">{log.targetType}</span>
                      <span>{log.targetId}</span>
                    </td>
                    <td className="p-3 text-zinc-300">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-zinc-400" />
                        <span>{log.adminUserId || 'system'}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <details className="cursor-pointer group">
                        <summary className="text-[11px] text-cobalt hover:underline flex items-center gap-1 font-semibold select-none">
                          <FileText className="w-3 h-3" />
                          <span>View Payload Data</span>
                        </summary>
                        <pre className="mt-2 p-2 bg-canvas-white border border-ice-border rounded text-[10px] max-h-40 overflow-auto text-zinc-600 font-mono">
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
      </div>
    </div>
  );
};

export default AuditLogTab;
