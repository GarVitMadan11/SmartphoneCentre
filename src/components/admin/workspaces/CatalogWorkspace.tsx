import React, { useState } from 'react';
import { Smartphone, Tablet, Watch, ShieldAlert, Sparkles, Layers } from 'lucide-react';
import CatalogTab from '../tabs/CatalogTab';
import AuditLogTab from '../tabs/AuditLogTab';
import { Brand } from '../../../data/mockDatabase';
import { ApiUser } from '../../../utils/api';

interface CatalogWorkspaceProps {
  brands: Brand[];
  currentUser: ApiUser | null;
  onRefreshCatalog: () => void;
}

export const CatalogWorkspace: React.FC<CatalogWorkspaceProps> = ({
  brands,
  currentUser,
  onRefreshCatalog,
}) => {
  const [activeTab, setActiveTab] = useState<'smartphones' | 'tablets' | 'smartwatches' | 'audit'>('smartphones');

  return (
    <div className="space-y-6 font-outfit">
      {/* Workspace Header */}
      <div className="bg-canvas-white border border-ice-border rounded-xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm hover:shadow-md transition-all">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 text-[10px] font-mono font-bold tracking-wider rounded bg-cobalt/10 text-cobalt border border-cobalt/20 uppercase flex items-center gap-1">
              <Layers className="w-3 h-3 text-cobalt" />
              Catalog & Pricing Studio
            </span>
            <span className="text-xs text-ink-muted font-mono">• Logged in as {currentUser?.name || currentUser?.email || 'Catalog Manager'}</span>
          </div>
          <h2 className="text-2xl font-bold text-ink-navy tracking-tight">Product Catalog & Device Valuation Studio</h2>
          <p className="text-xs text-ink-muted mt-0.5">Managing trade-in device models, base storage pricing, CSV bulk adjustments & series ordering.</p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs font-mono text-purple-700 shadow-xs">
          <Sparkles className="w-4 h-4 text-purple-600" />
          <span className="font-bold">Catalog Privileges Active</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs Bar */}
      <div className="bg-canvas-pure border border-ice-border rounded-xl p-1.5 flex flex-wrap gap-1.5 shadow-sm">
        <button
          onClick={() => setActiveTab('smartphones')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'smartphones'
              ? 'bg-cobalt text-white shadow-sm font-extrabold'
              : 'text-ink-slate hover:text-ink-navy hover:bg-canvas-white'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Smartphones Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('tablets')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'tablets'
              ? 'bg-purple-600 text-white shadow-sm font-extrabold'
              : 'text-ink-slate hover:text-ink-navy hover:bg-canvas-white'
          }`}
        >
          <Tablet className="w-4 h-4" />
          <span>Tablets Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('smartwatches')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'smartwatches'
              ? 'bg-amber-600 text-white shadow-sm font-extrabold'
              : 'text-ink-slate hover:text-ink-navy hover:bg-canvas-white'
          }`}
        >
          <Watch className="w-4 h-4" />
          <span>Smartwatches Catalog</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'audit'
              ? 'bg-slate-800 text-white shadow-sm font-extrabold'
              : 'text-ink-slate hover:text-ink-navy hover:bg-canvas-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span>Catalog Audit Trail</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab !== 'audit' && (
        <CatalogTab
          category={activeTab}
          brands={brands}
          onRefresh={onRefreshCatalog}
        />
      )}

      {activeTab === 'audit' && (
        <AuditLogTab />
      )}
    </div>
  );
};

export default CatalogWorkspace;
