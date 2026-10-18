import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  ExternalLink,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  Layers,
  Edit2,
  Check,
  X,
  ShieldCheck,
  Zap,
  Cpu,
  HardDrive,
} from 'lucide-react';
import {
  fetchCashifySummary,
  fetchCashifyVariants,
  fetchCashifyPriceAlerts,
  saveCashifyCustomUrl,
  testCashifyUrlApi,
  triggerCashifyScan,
  fetchModels,
  updateModel,
  bulkUpdateModels,
  CashifySummaryData,
  CashifyVariantItem,
  CashifyPriceAlertItem,
} from '../../../utils/api';
import { Model } from '../../../data/mockDatabase';
import { EditSpecsAndPricesModal } from './CatalogTab';

export const CashifyMonitorTab: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<'variants' | 'alerts'>('variants');
  const [summary, setSummary] = useState<CashifySummaryData | null>(null);
  const [variants, setVariants] = useState<CashifyVariantItem[]>([]);
  const [alerts, setAlerts] = useState<CashifyPriceAlertItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanMessage, setScanMessage] = useState<string>('');

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('ALL');
  const [selectedRam, setSelectedRam] = useState<string>('ALL');
  const [selectedStorage, setSelectedStorage] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Inline editing state for specific variant row
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editUrlValue, setEditUrlValue] = useState<string>('');
  const [testingUrl, setTestingUrl] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; status: number } | null>(null);
  const [savingUrl, setSavingUrl] = useState<boolean>(false);

  // Recommended price fixing states
  const [fixingVariantKey, setFixingVariantKey] = useState<string | null>(null);
  const [isBulkFixing, setIsBulkFixing] = useState<boolean>(false);

  // Specs & Prices Edit Modal state
  const [models, setModels] = useState<Model[]>([]);
  const [editingModelForSpecs, setEditingModelForSpecs] = useState<Model | null>(null);
  const [highlightSpecVariant, setHighlightSpecVariant] = useState<{ ram: number; storage: number } | null>(null);
  const [successNotification, setSuccessNotification] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [sumRes, variantsRes, alertsRes, modelsRes] = await Promise.all([
        fetchCashifySummary().catch(() => null),
        fetchCashifyVariants().catch(() => []),
        fetchCashifyPriceAlerts().catch(() => []),
        fetchModels().catch(() => []),
      ]);
      if (sumRes) {
        setSummary(sumRes);
        setIsScanning(!!sumRes.isScanRunning);
      }
      setVariants(variantsRes);
      setAlerts(alertsRes);
      if (modelsRes && Array.isArray(modelsRes)) {
        setModels(modelsRes as Model[]);
      }
    } catch (err) {
      console.error('Failed to load Cashify monitor data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleOpenEditSpecs = async (variant: CashifyVariantItem) => {
    let target = models.find(
      (m) =>
        m.id === variant.modelId ||
        (m as any).legacyId === variant.modelId ||
        m.name.toLowerCase() === variant.modelName.toLowerCase()
    );

    if (!target) {
      try {
        const freshModels = await fetchModels();
        if (freshModels && Array.isArray(freshModels)) {
          setModels(freshModels as Model[]);
          target = freshModels.find(
            (m) =>
              m.id === variant.modelId ||
              (m as any).legacyId === variant.modelId ||
              m.name.toLowerCase() === variant.modelName.toLowerCase()
          ) as Model | undefined;
        }
      } catch (err) {
        console.error('Failed to fetch models for specs edit:', err);
      }
    }

    if (!target) {
      target = {
        id: variant.modelId,
        legacyId: variant.modelId,
        brandId: variant.brandId || 'brand-apple',
        name: variant.modelName,
        category: 'premium',
        releaseYear: variant.releaseYear || new Date().getFullYear(),
        basePrice128GB: variant.rephonixPrice || 30000,
        supportedStorageGb: [variant.storageGb || 128],
        supportedRamGb: [variant.ramGb || 0],
        variantPrices: { [`${variant.ramGb}_${variant.storageGb}`]: variant.rephonixPrice },
      } as Model;
    }

    setHighlightSpecVariant({ ram: variant.ramGb, storage: variant.storageGb });
    setEditingModelForSpecs(target);
  };

  const handleSpecsSaveSuccess = async () => {
    setSuccessNotification('Model specs & prices updated successfully in database!');
    await loadData();
    window.dispatchEvent(new CustomEvent('stc_catalog_order_changed'));
  };

  // 1-Click Apply Recommended Price (+3% above Cashify) for a specific variant
  const handleApplyRecommendedPrice = async (variant: CashifyVariantItem, recommendedPrice: number) => {
    if (fixingVariantKey || isBulkFixing) return;
    setFixingVariantKey(variant.variantKey);
    try {
      let target = models.find(
        (m) =>
          m.id === variant.modelId ||
          (m as any).legacyId === variant.modelId ||
          m.name.toLowerCase() === variant.modelName.toLowerCase()
      );

      if (!target) {
        const freshModels = await fetchModels();
        if (freshModels && Array.isArray(freshModels)) {
          setModels(freshModels as Model[]);
          target = freshModels.find(
            (m) =>
              m.id === variant.modelId ||
              (m as any).legacyId === variant.modelId ||
              m.name.toLowerCase() === variant.modelName.toLowerCase()
          ) as Model | undefined;
        }
      }

      const legacyId = (target as any)?.legacyId || target?.id || variant.modelId;
      const key = `${variant.ramGb}_${variant.storageGb}`;
      const currentVariantPrices = target?.variantPrices ? { ...target.variantPrices } : {};
      currentVariantPrices[key] = recommendedPrice;

      const activePrices = Object.values(currentVariantPrices).filter(
        (v): v is number => typeof v === 'number' && v > 0
      );
      const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : recommendedPrice;

      await updateModel(legacyId, {
        variantPrices: currentVariantPrices,
        basePrice128GB: minPrice,
      });

      // Update local state immediately for instant responsive UI
      setVariants((prev) =>
        prev.map((v) => {
          if (v.variantKey === variant.variantKey) {
            const newDiff = recommendedPrice - (v.cashifyPrice || 0);
            return {
              ...v,
              rephonixPrice: recommendedPrice,
              difference: newDiff,
            };
          }
          return v;
        })
      );

      setModels((prev) =>
        prev.map((m) => {
          if (m.id === legacyId || (m as any).legacyId === legacyId) {
            return {
              ...m,
              variantPrices: currentVariantPrices,
              basePrice128GB: minPrice,
            };
          }
          return m;
        })
      );

      setSuccessNotification(
        `✓ Updated ${variant.modelName} (${variant.specLabel}) buyback payout to ₹${recommendedPrice.toLocaleString('en-IN')} (+3% above Cashify)!`
      );
      window.dispatchEvent(new CustomEvent('stc_catalog_order_changed'));
    } catch (err: any) {
      console.error('Failed to update recommended price:', err);
      alert('Failed to update price: ' + (err.message || err));
    } finally {
      setFixingVariantKey(null);
    }
  };

  // Bulk Apply Recommended Price (+3%) to all visible variants below target
  const handleBulkFixAllRecommended = async () => {
    if (isBulkFixing || fixingVariantKey) return;
    const variantsToFix = filteredVariants.filter(
      (v) => v.cashifyPrice !== null && v.cashifyPrice > 0 && v.rephonixPrice < Math.round(v.cashifyPrice * 1.03)
    );

    if (variantsToFix.length === 0) {
      alert('All currently visible variants already meet or exceed the +3% Cashify target!');
      return;
    }

    const confirm = window.confirm(
      `Apply recommended +3% prices to all ${variantsToFix.length} visible variants below target?\n\nThis will update buyback prices directly in the database.`
    );
    if (!confirm) return;

    setIsBulkFixing(true);
    try {
      const modelUpdatesMap = new Map<string, Record<string, number>>();

      variantsToFix.forEach((v) => {
        const legacyId = v.modelId;
        const key = `${v.ramGb}_${v.storageGb}`;
        const recPrice = Math.round(v.cashifyPrice! * 1.03);

        const existingTarget = models.find(
          (m) =>
            m.id === legacyId ||
            (m as any).legacyId === legacyId ||
            m.name.toLowerCase() === v.modelName.toLowerCase()
        );
        const resolvedLegacyId = (existingTarget as any)?.legacyId || existingTarget?.id || legacyId;

        const currentPrices =
          modelUpdatesMap.get(resolvedLegacyId) ||
          (existingTarget?.variantPrices ? { ...existingTarget.variantPrices } : {});

        currentPrices[key] = recPrice;
        modelUpdatesMap.set(resolvedLegacyId, currentPrices);
      });

      const updatesPayload = Array.from(modelUpdatesMap.entries()).map(([id, prices]) => {
        const activePrices = Object.values(prices).filter((p): p is number => typeof p === 'number' && p > 0);
        const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : 30000;
        return {
          id,
          changes: {
            variantPrices: prices,
            basePrice128GB: minPrice,
          },
        };
      });

      await bulkUpdateModels(updatesPayload);

      setSuccessNotification(
        `✓ Successfully updated ${variantsToFix.length} variants across ${modelUpdatesMap.size} models to +3% above Cashify!`
      );
      window.dispatchEvent(new CustomEvent('stc_catalog_order_changed'));
      await loadData();
    } catch (err: any) {
      console.error('Failed bulk price update:', err);
      alert('Failed bulk price update: ' + (err.message || err));
    } finally {
      setIsBulkFixing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Distinct lists for filter dropdowns
  const brandsList = useMemo(() => {
    const set = new Set<string>();
    variants.forEach(v => set.add(v.brandName));
    return Array.from(set).sort();
  }, [variants]);

  const ramList = useMemo(() => {
    const set = new Set<number>();
    variants.forEach(v => {
      if (v.ramGb > 0) set.add(v.ramGb);
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [variants]);

  const storageList = useMemo(() => {
    const set = new Set<number>();
    variants.forEach(v => set.add(v.storageGb));
    return Array.from(set).sort((a, b) => a - b);
  }, [variants]);

  // Count of all variants with a Cashify quote that are below +3% target
  const belowTargetTotalCount = useMemo(() => {
    return variants.filter(
      (v) => v.cashifyPrice !== null && v.cashifyPrice > 0 && v.rephonixPrice < Math.round(v.cashifyPrice * 1.03)
    ).length;
  }, [variants]);

  // Map of Cashify prices for the active model being edited in the modal
  const editingModelCashifyPrices = useMemo(() => {
    if (!editingModelForSpecs) return undefined;
    const map: Record<string, number> = {};
    variants.forEach((v) => {
      if (
        (v.modelId === editingModelForSpecs.id ||
          v.modelId === (editingModelForSpecs as any).legacyId ||
          v.modelName.toLowerCase() === editingModelForSpecs.name.toLowerCase()) &&
        v.cashifyPrice !== null &&
        v.cashifyPrice > 0
      ) {
        map[`${v.ramGb}_${v.storageGb}`] = v.cashifyPrice;
      }
    });
    return Object.keys(map).length > 0 ? map : undefined;
  }, [editingModelForSpecs, variants]);

  // Filtered variants (Each row is 1 RAM + 1 Storage variant)
  const filteredVariants = useMemo(() => {
    return variants.filter(v => {
      if (selectedBrand !== 'ALL' && v.brandName !== selectedBrand) return false;
      if (selectedRam !== 'ALL') {
        if (selectedRam === 'NONE' && v.ramGb !== 0) return false;
        if (selectedRam !== 'NONE' && v.ramGb !== parseInt(selectedRam, 10)) return false;
      }
      if (selectedStorage !== 'ALL' && v.storageGb !== parseInt(selectedStorage, 10)) return false;

      if (statusFilter === 'VERIFIED' && v.urlStatus !== 'FOUND') return false;
      if (statusFilter === 'MISSING' && v.urlStatus !== 'MISSING') return false;
      if (statusFilter === 'OVERRIDDEN' && !v.isCustomOverride) return false;
      if (statusFilter === 'HAS_PRICE' && v.cashifyPrice === null) return false;
      if (statusFilter === 'PENDING' && v.cashifyPrice !== null) return false;
      if (statusFilter === 'BELOW_TARGET') {
        if (v.cashifyPrice === null || v.cashifyPrice <= 0) return false;
        const rec = Math.round(v.cashifyPrice * 1.03);
        if (v.rephonixPrice >= rec) return false;
      }
      if (statusFilter === 'MEETS_TARGET') {
        if (v.cashifyPrice === null || v.cashifyPrice <= 0) return false;
        const rec = Math.round(v.cashifyPrice * 1.03);
        if (v.rephonixPrice < rec) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          v.modelName.toLowerCase().includes(q) ||
          v.brandName.toLowerCase().includes(q) ||
          v.ramLabel.toLowerCase().includes(q) ||
          v.storageLabel.toLowerCase().includes(q) ||
          (v.cashifyUrl && v.cashifyUrl.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [variants, selectedBrand, selectedRam, selectedStorage, statusFilter, searchQuery]);

  // Filtered alerts for historical alerts tab
  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (selectedBrand !== 'ALL' && a.brandName !== selectedBrand) return false;
      if (statusFilter !== 'ALL' && a.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return a.modelName.toLowerCase().includes(q) || a.brandName.toLowerCase().includes(q);
      }
      return true;
    });
  }, [alerts, selectedBrand, statusFilter, searchQuery]);

  const handleStartEdit = (variant: CashifyVariantItem) => {
    setEditingKey(variant.variantKey);
    setEditUrlValue(variant.cashifyUrl || '');
    setTestResult(null);
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditUrlValue('');
    setTestResult(null);
  };

  const handleTestUrl = async () => {
    if (!editUrlValue.trim()) return;
    setTestingUrl(true);
    setTestResult(null);
    try {
      const res = await testCashifyUrlApi(editUrlValue.trim());
      setTestResult({ ok: res.ok, status: res.status });
    } catch {
      setTestResult({ ok: false, status: 0 });
    } finally {
      setTestingUrl(false);
    }
  };

  const handleSaveUrl = async (key: string) => {
    let cleanUrl = editUrlValue.trim();
    if (!cleanUrl) return;
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://www.cashify.in/sell-old-mobile-phone/${cleanUrl.replace(/^\/+/, '')}`;
    }
    setSavingUrl(true);
    try {
      await saveCashifyCustomUrl(key, cleanUrl);
      setEditingKey(null);
      await loadData();
    } catch (err: any) {
      alert('Failed to save custom Cashify URL: ' + (err.message || err));
    } finally {
      setSavingUrl(false);
    }
  };

  const handleTriggerScan = async (limit: number = 0) => {
    if (isScanning) return;
    const confirm = window.confirm(
      `Start background Cashify price comparison for ${limit === 0 ? 'all active models & variants' : `${limit} models`}?\n\nThis will crawl Cashify with your authenticated Brave session.`
    );
    if (!confirm) return;

    try {
      setIsScanning(true);
      setScanMessage('Initiating background price crawler...');
      const res = await triggerCashifyScan(limit);
      setScanMessage(res.message);
      setTimeout(() => setScanMessage(''), 8000);
    } catch (err: any) {
      alert('Failed to trigger price scan: ' + (err.message || err));
      setIsScanning(false);
    }
  };

  if (loading && variants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-ink-muted">
        <RefreshCw className="w-8 h-8 animate-spin text-cobalt mb-3" />
        <p className="font-semibold text-sm">Loading Cashify Market Intelligence Catalog...</p>
        <p className="text-xs text-ink-muted mt-1">Resolving variant URLs & competitor buyback prices</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Top Header & Global Actions ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-900/50">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-400/30">
              <Zap className="w-5 h-5 text-indigo-400" />
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white">Cashify Market Intelligence Monitor</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-indigo-500/25 text-indigo-200 border border-indigo-400/30">
              Granular Variant Level
            </span>
          </div>
          <p className="text-slate-300 text-xs mt-1.5 max-w-2xl leading-relaxed">
            Live competitor price intelligence per individual RAM & Storage specification. Each row compares Rephonix buyback pricing against Cashify&apos;s real-time unmasked quotes.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 self-end md:self-auto">
          {/* Session Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-semibold border ${
              summary?.session.hasSession
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}
            title={
              summary?.session.hasSession
                ? `Authenticated session loaded (${summary.session.cookiesCount} cookies)`
                : 'No session file found at server/data/cashify_session.json'
            }
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>
              {summary?.session.hasSession
                ? `Brave Auth Active (${summary.session.cookiesCount} ck)`
                : 'No Session Found'}
            </span>
          </div>

          {/* Trigger Audit Buttons */}
          <button
            onClick={() => handleTriggerScan(10)}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition-all cursor-pointer disabled:opacity-50"
            title="Crawl top 10 models quickly to test"
          >
            <Play className="w-3.5 h-3.5 text-indigo-300" />
            <span>Audit Top 10</span>
          </button>

          <button
            onClick={() => handleTriggerScan(0)}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            title="Start full background audit of all models"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Live...' : 'Run Full Price Audit'}</span>
          </button>
        </div>
      </div>

      {/* Background scan notification banner */}
      {scanMessage && (
        <div className="flex items-center justify-between p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs font-medium">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            <span>{scanMessage}</span>
          </div>
          <span className="font-mono text-[11px] text-indigo-600">Background Worker Active</span>
        </div>
      )}

      {/* ── KPI Metric Stat Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <div className="bg-canvas-white border border-ice-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-ink-muted text-xs mb-1">
            <span>Total Variants</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-ink-navy">
            {variants.length}
          </div>
          <div className="text-[11px] text-ink-muted mt-1 font-mono">
            Across {summary?.totalModels ?? 186} Models
          </div>
        </div>

        <div className="bg-canvas-white border border-ice-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-emerald-700 text-xs mb-1">
            <span>Verified Variant URLs</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">
            {variants.filter(v => v.urlStatus === 'FOUND' || v.urlStatus === 'OVERRIDDEN').length}
            <span className="text-xs font-normal text-emerald-700 ml-1.5 font-mono">
              ({variants.length > 0 ? ((variants.filter(v => v.urlStatus === 'FOUND' || v.urlStatus === 'OVERRIDDEN').length / variants.length) * 100).toFixed(1) : 0}%)
            </span>
          </div>
          <div className="text-[11px] text-emerald-600/80 mt-1 font-mono">200 OK Direct Endpoints</div>
        </div>

        <div className="bg-canvas-white border border-ice-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-amber-700 text-xs mb-1">
            <span>Custom Overrides</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600">
            {summary?.customOverrides ?? 0}
          </div>
          <div className="text-[11px] text-amber-600/80 mt-1 font-mono">Manually Tailored URLs</div>
        </div>

        <div className="bg-canvas-white border border-ice-border rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-blue-700 text-xs mb-1">
            <span>Market Drops (▼)</span>
            <TrendingDown className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-extrabold text-blue-600">
            {summary?.priceAlertsStats?.decreased ?? 0}
          </div>
          <div className="text-[11px] text-blue-600/80 mt-1 font-mono">Cashify Reduced Price</div>
        </div>

        <div className="bg-canvas-white border border-ice-border rounded-xl p-4 shadow-xs col-span-2 md:col-span-1">
          <div className="flex items-center justify-between text-rose-700 text-xs mb-1">
            <span>Market Hikes (▲)</span>
            <TrendingUp className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-extrabold text-rose-600">
            {summary?.priceAlertsStats?.increased ?? 0}
          </div>
          <div className="text-[11px] text-rose-600/80 mt-1 font-mono">Cashify Raised Price</div>
        </div>
      </div>

      {/* ── Sub Navigation Tabs Bar ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-ice-border pb-3">
        <div className="flex items-center gap-2 bg-canvas-pure p-1 rounded-xl border border-ice-border shadow-xs">
          <button
            onClick={() => {
              setActiveSubTab('variants');
              setStatusFilter('ALL');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'variants'
                ? 'bg-slate-900 text-white shadow-sm font-extrabold'
                : 'text-ink-slate hover:text-ink-navy hover:bg-canvas-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Variant Price Matrix & URLs</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {variants.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('alerts');
              setStatusFilter('ALL');
            }}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeSubTab === 'alerts'
                ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                : 'text-ink-slate hover:text-ink-navy hover:bg-canvas-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Price Shifts & Alerts Log</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-white/20">
              {alerts.length}
            </span>
          </button>
        </div>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Brand Filter */}
          <select
            value={selectedBrand}
            onChange={e => setSelectedBrand(e.target.value)}
            className="px-2.5 py-1.5 border border-ice-border bg-canvas-white rounded-lg text-xs font-semibold text-ink-navy focus:outline-none focus:border-cobalt shadow-xs cursor-pointer"
          >
            <option value="ALL">All Brands ({brandsList.length})</option>
            {brandsList.map(b => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>

          {/* RAM Filter */}
          {activeSubTab === 'variants' && (
            <select
              value={selectedRam}
              onChange={e => setSelectedRam(e.target.value)}
              className="px-2.5 py-1.5 border border-ice-border bg-canvas-white rounded-lg text-xs font-semibold text-ink-navy focus:outline-none focus:border-cobalt shadow-xs cursor-pointer"
            >
              <option value="ALL">All RAMs</option>
              {ramList.map(r => (
                <option key={r} value={r}>
                  {r} GB RAM
                </option>
              ))}
              <option value="NONE">Fixed / Apple (—)</option>
            </select>
          )}

          {/* Storage Filter */}
          {activeSubTab === 'variants' && (
            <select
              value={selectedStorage}
              onChange={e => setSelectedStorage(e.target.value)}
              className="px-2.5 py-1.5 border border-ice-border bg-canvas-white rounded-lg text-xs font-semibold text-ink-navy focus:outline-none focus:border-cobalt shadow-xs cursor-pointer"
            >
              <option value="ALL">All Storages</option>
              {storageList.map(s => (
                <option key={s} value={s}>
                  {s >= 1024 ? `${s / 1024} TB` : `${s} GB`}
                </option>
              ))}
            </select>
          )}

          {/* Status Filter */}
          {activeSubTab === 'variants' ? (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-ice-border bg-canvas-white rounded-lg text-xs font-semibold text-ink-navy focus:outline-none focus:border-cobalt shadow-xs cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="BELOW_TARGET">🚨 Below +3% Target ({belowTargetTotalCount})</option>
              <option value="MEETS_TARGET">🎯 Meets +3% Target</option>
              <option value="VERIFIED">✅ Verified URL</option>
              <option value="MISSING">⚠️ Missing URL</option>
              <option value="OVERRIDDEN">⭐ Custom Overridden</option>
              <option value="HAS_PRICE">💰 Has Cashify Price</option>
              <option value="PENDING">⏳ Pending Scan</option>
            </select>
          ) : (
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-ice-border bg-canvas-white rounded-lg text-xs font-semibold text-ink-navy focus:outline-none focus:border-cobalt shadow-xs cursor-pointer"
            >
              <option value="ALL">All Price Trends</option>
              <option value="INCREASED">▲ Increased by Cashify</option>
              <option value="DECREASED">▼ Decreased by Cashify</option>
              <option value="STABLE">━ Stable Market Price</option>
            </select>
          )}

          {/* Quick Auto-Fix All to +3% Target Button */}
          {activeSubTab === 'variants' && belowTargetTotalCount > 0 && (
            <button
              type="button"
              onClick={handleBulkFixAllRecommended}
              disabled={isBulkFixing || !!fixingVariantKey}
              className="px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 active:scale-95 text-white rounded-lg text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 whitespace-nowrap"
              title={`Automatically update all ${belowTargetTotalCount} underpriced variants to +3% above Cashify`}
            >
              {isBulkFixing ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Zap className="w-3.5 h-3.5 fill-current text-white" />
              )}
              <span>Auto-Fix All to +3% ({belowTargetTotalCount})</span>
            </button>
          )}

          {/* Search Box */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search model, variant or URL..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-canvas-white border border-ice-border rounded-lg text-ink-navy placeholder:text-ink-muted focus:outline-none focus:border-cobalt shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Success Notification Banner */}
      {successNotification && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successNotification}</span>
          </div>
          <button
            onClick={() => setSuccessNotification(null)}
            className="text-emerald-600 hover:text-emerald-900 cursor-pointer p-0.5 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* ── View 1: Variant Price Matrix Table (1 Row = 1 RAM + 1 Storage Variant) ── */}
      {activeSubTab === 'variants' && (
        <div className="bg-canvas-white border border-ice-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas-pure border-b border-ice-border text-ink-muted uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Smartphone Model</th>
                  <th className="py-3 px-3">RAM</th>
                  <th className="py-3 px-3">Storage</th>
                  <th className="py-3 px-4">Rephonix Price</th>
                  <th className="py-3 px-4">Cashify Price</th>
                  <th className="py-3 px-4 min-w-[210px]">Margin Difference & Rec (+3%)</th>
                  <th className="py-3 px-4">Cashify Variant URL</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ice-border/60">
                {filteredVariants.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-ink-muted">
                      No variants matching current filters.
                    </td>
                  </tr>
                ) : (
                  filteredVariants.map(variant => {
                    const isEditing = editingKey === variant.variantKey;
                    const hasCashifyPrice = variant.cashifyPrice !== null;

                    return (
                      <tr key={variant.variantKey} className="hover:bg-slate-50/70 transition-colors">
                        {/* 1. Model & Brand */}
                        <td className="py-3 px-4">
                          <button
                            type="button"
                            onClick={() => handleOpenEditSpecs(variant)}
                            className="font-bold text-ink-navy hover:text-cobalt hover:underline text-sm leading-tight text-left cursor-pointer transition-colors block"
                            title="Click to edit specs & prices for this model"
                          >
                            {variant.modelName}
                          </button>
                          <div className="text-[11px] text-ink-muted font-mono mt-0.5">
                            {variant.brandName} • {variant.releaseYear}
                          </div>
                        </td>

                        {/* 2. RAM Variant */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          {variant.ramGb > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                              <Cpu className="w-3 h-3 text-indigo-500" />
                              <span>{variant.ramLabel}</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">—</span>
                          )}
                        </td>

                        {/* 3. Storage Variant */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md font-mono text-xs font-bold bg-slate-100 text-slate-800 border border-slate-200">
                            <HardDrive className="w-3 h-3 text-slate-500" />
                            <span>{variant.storageLabel}</span>
                          </span>
                        </td>

                        {/* 4. Rephonix Buyback Price */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5 group">
                            <span className="font-extrabold text-ink-navy text-sm">
                              ₹{variant.rephonixPrice.toLocaleString('en-IN')}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenEditSpecs(variant)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 text-cobalt hover:bg-cobalt/10 rounded transition-all cursor-pointer"
                              title="Edit Rephonix buyback prices for this model"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-[10px] text-emerald-700 font-mono">Our Buyback Payout</div>
                        </td>

                        {/* 5. Cashify Competitor Price */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {hasCashifyPrice ? (
                            <div>
                              <div className="font-extrabold text-indigo-700 text-sm font-mono">
                                ₹{variant.cashifyPrice!.toLocaleString('en-IN')}
                              </div>
                              <div className="text-[10px] text-indigo-500 font-mono">
                                {variant.lastAuditedDate
                                  ? new Date(variant.lastAuditedDate).toLocaleDateString('en-IN', {
                                      month: 'short',
                                      day: 'numeric',
                                    })
                                  : 'Cashify Quote'}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-mono italic">
                              <span>Pending scan</span>
                            </span>
                          )}
                        </td>

                        {/* 6. Margin Difference & Recommended Price (+3% rule) */}
                        <td className="py-3 px-4">
                          {hasCashifyPrice ? (() => {
                            const cashifyP = variant.cashifyPrice!;
                            const recPrice = Math.round(cashifyP * 1.03);
                            const currentDiff = variant.difference ?? (variant.rephonixPrice - cashifyP);
                            const diffPct = ((variant.rephonixPrice - cashifyP) / cashifyP) * 100;
                            const meetsTarget = variant.rephonixPrice >= recPrice;
                            const isFixing = fixingVariantKey === variant.variantKey;

                            return (
                              <div className="space-y-1.5 min-w-[200px]">
                                {/* Current Margin Diff Badge */}
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span
                                    className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold inline-flex items-center gap-1 ${
                                      currentDiff > 0
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : currentDiff < 0
                                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                        : 'bg-slate-100 text-slate-700 border border-slate-200'
                                    }`}
                                  >
                                    {currentDiff > 0
                                      ? `+₹${currentDiff.toLocaleString('en-IN')} (${diffPct >= 0 ? '+' : ''}${diffPct.toFixed(1)}%)`
                                      : currentDiff < 0
                                      ? `-₹${Math.abs(currentDiff).toLocaleString('en-IN')} (${diffPct.toFixed(1)}%)`
                                      : `₹0 (0.0%)`}
                                  </span>

                                  {meetsTarget && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-emerald-100/90 text-emerald-800 border border-emerald-300 inline-flex items-center gap-0.5 shadow-2xs">
                                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                                      <span>+3% Met</span>
                                    </span>
                                  )}
                                </div>

                                {/* Recommended Price Box & 1-Click Fix Button */}
                                <div className={`p-1.5 rounded-lg border text-xs ${
                                  meetsTarget 
                                    ? 'bg-emerald-50/40 border-emerald-100' 
                                    : 'bg-amber-50/60 border-amber-200 shadow-2xs'
                                }`}>
                                  <div className="flex items-center justify-between gap-1 text-[11px]">
                                    <span className="text-slate-500 font-medium font-sans">Recommended (+3%):</span>
                                    <span className="font-extrabold font-mono text-indigo-950">
                                      ₹{recPrice.toLocaleString('en-IN')}
                                    </span>
                                  </div>

                                  {!meetsTarget ? (
                                    <button
                                      type="button"
                                      disabled={isFixing || isBulkFixing}
                                      onClick={() => handleApplyRecommendedPrice(variant, recPrice)}
                                      className="mt-1.5 w-full flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-md bg-gradient-to-r from-indigo-600 to-cobalt hover:from-indigo-700 hover:to-cobalt-hover active:scale-95 text-white text-[11px] font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                                      title={`Fix Rephonix payout to recommended ₹${recPrice.toLocaleString('en-IN')} (3% above Cashify)`}
                                    >
                                      {isFixing ? (
                                        <>
                                          <RefreshCw className="w-3 h-3 animate-spin text-white" />
                                          <span>Applying...</span>
                                        </>
                                      ) : (
                                        <>
                                          <Zap className="w-3 h-3 fill-amber-300 text-amber-300" />
                                          <span>Fix to ₹{recPrice.toLocaleString('en-IN')}</span>
                                        </>
                                      )}
                                    </button>
                                  ) : (
                                    <div className="mt-1 flex items-center justify-between text-[10px] text-emerald-700 font-mono">
                                      <span className="flex items-center gap-0.5">
                                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                        <span>Optimal Payout</span>
                                      </span>
                                      <button
                                        type="button"
                                        disabled={isFixing || isBulkFixing}
                                        onClick={() => handleApplyRecommendedPrice(variant, recPrice)}
                                        className="text-slate-400 hover:text-indigo-600 underline cursor-pointer text-[10px]"
                                        title={`Reset price to exact +3% (₹${recPrice.toLocaleString('en-IN')})`}
                                      >
                                        set exact
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })() : (
                            <span className="text-slate-400 font-mono text-xs italic">— (Pending scan)</span>
                          )}
                        </td>

                        {/* 7. Cashify Variant URL */}
                        <td className="py-3 px-4 max-w-xs">
                          {isEditing ? (
                            <div className="space-y-2 bg-slate-50 p-2 rounded-lg border border-cobalt/40 shadow-xs">
                              <input
                                type="url"
                                value={editUrlValue}
                                onChange={e => setEditUrlValue(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleSaveUrl(variant.variantKey);
                                  } else if (e.key === 'Escape') {
                                    handleCancelEdit();
                                  }
                                }}
                                placeholder="https://www.cashify.in/sell-old-mobile-phone/used-..."
                                className="w-full px-2.5 py-1.5 text-xs border border-cobalt bg-white rounded focus:outline-none font-mono"
                                autoFocus
                              />
                              <div className="flex flex-wrap items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveUrl(variant.variantKey)}
                                  disabled={savingUrl}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold font-mono cursor-pointer transition-colors flex items-center gap-1 shadow-xs"
                                  title="Press Enter or Click to Save"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>{savingUrl ? 'Saving...' : 'Save URL'}</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleTestUrl}
                                  disabled={testingUrl}
                                  className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded text-[11px] font-mono font-semibold cursor-pointer transition-colors"
                                >
                                  {testingUrl ? 'Testing...' : 'Test URL'}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEdit}
                                  className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-600 border border-slate-300 rounded text-[11px] font-mono cursor-pointer transition-colors"
                                >
                                  Cancel
                                </button>
                                {testResult && (
                                  <span
                                    className={`text-[11px] font-mono font-bold px-1.5 py-0.5 rounded ${
                                      testResult.ok ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                    }`}
                                  >
                                    {testResult.ok ? `✓ HTTP ${testResult.status} (Valid)` : `✗ Error (${testResult.status})`}
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono block">Tip: Press <b>Enter</b> to save or <b>Esc</b> to cancel</span>
                            </div>
                          ) : variant.cashifyUrl ? (
                            <div className="flex items-center gap-1.5 group">
                              <a
                                href={variant.cashifyUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="font-mono text-[11px] text-cobalt hover:underline truncate max-w-[200px] inline-block"
                                title={variant.cashifyUrl}
                              >
                                {variant.cashifyUrl.replace('https://www.cashify.in/sell-old-mobile-phone/', '')}
                              </a>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-cobalt shrink-0" />
                            </div>
                          ) : (
                            <span className="text-amber-600 font-mono text-[11px]">No URL mapped</span>
                          )}
                        </td>

                        {/* 8. URL Status Badge */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {variant.isCustomOverride ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                              ⭐ Custom Override
                            </span>
                          ) : variant.urlStatus === 'FOUND' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1 w-max">
                              <CheckCircle2 className="w-3 h-3" /> 200 OK
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1 w-max">
                              <AlertTriangle className="w-3 h-3" /> Missing (404)
                            </span>
                          )}
                        </td>

                        {/* 9. Actions */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleSaveUrl(variant.variantKey)}
                                disabled={savingUrl}
                                className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold cursor-pointer transition-all flex items-center gap-1 shadow-xs"
                                title="Save Custom URL for this Variant"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded text-xs font-bold cursor-pointer transition-all"
                                title="Cancel Edit"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditSpecs(variant)}
                                className="px-2.5 py-1 text-xs bg-cobalt/10 hover:bg-cobalt/20 text-cobalt border border-cobalt/20 hover:border-cobalt/40 rounded font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs"
                                title="Edit specs, RAM/Storage matrix and Rephonix buyback prices"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                                <span>Edit Specs & Prices</span>
                              </button>

                              <button
                                onClick={() => handleStartEdit(variant)}
                                className="px-2.5 py-1 text-xs border border-ice-border hover:border-slate-400 hover:bg-slate-50 text-ink-slate rounded font-medium transition-all cursor-pointer flex items-center gap-1.5"
                                title="Edit specific Cashify URL for this RAM/Storage variant"
                              >
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                                <span>{variant.cashifyUrl ? 'Edit URL' : 'Set URL'}</span>
                              </button>
                            </div>
                          )}
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

      {/* ── View 2: Price Shifts & Alerts Log Tab ── */}
      {activeSubTab === 'alerts' && (
        <div className="bg-canvas-white border border-ice-border rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-canvas-pure border-b border-ice-border text-ink-muted uppercase font-mono text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Smartphone Model</th>
                  <th className="py-3 px-4">Variant Spec</th>
                  <th className="py-3 px-4">Rephonix Payout</th>
                  <th className="py-3 px-4">Cashify Competitor Price</th>
                  <th className="py-3 px-4">Margin Difference</th>
                  <th className="py-3 px-4">Competitor Shift</th>
                  <th className="py-3 px-4">Audited Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ice-border/60">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-ink-muted">
                      No price comparison alerts recorded yet. Click &quot;Audit Top 10&quot; or &quot;Run Full Price Audit&quot; to crawl live Cashify quotes!
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map(alert => {
                    const isPayingMore = alert.difference > 0;

                    return (
                      <tr key={alert.id} className="hover:bg-slate-50/60 transition-colors">
                        {/* Model */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-ink-navy text-sm">{alert.modelName}</div>
                          <div className="text-[11px] text-ink-muted font-mono">{alert.brandName}</div>
                        </td>

                        {/* Variant */}
                        <td className="py-3.5 px-4">
                          <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-xs font-semibold text-slate-700 border border-slate-200">
                            {alert.ramGb > 0 ? `${alert.ramGb}GB / ` : ''}
                            {alert.storageGb >= 1024 ? `${alert.storageGb / 1024}TB` : `${alert.storageGb}GB`}
                          </span>
                        </td>

                        {/* Rephonix Price */}
                        <td className="py-3.5 px-4 font-bold text-ink-navy text-sm">
                          ₹{alert.rephonixPrice.toLocaleString('en-IN')}
                        </td>

                        {/* Cashify Price */}
                        <td className="py-3.5 px-4 font-mono font-semibold text-indigo-700 text-sm">
                          ₹{alert.cashifyPrice.toLocaleString('en-IN')}
                        </td>

                        {/* Difference / Edge */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md font-mono text-xs font-bold ${
                              isPayingMore
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {isPayingMore
                              ? `+₹${alert.difference.toLocaleString('en-IN')} (We pay more)`
                              : `-₹${Math.abs(alert.difference).toLocaleString('en-IN')} (We pay less)`}
                          </span>
                        </td>

                        {/* Status / Shift */}
                        <td className="py-3.5 px-4">
                          {alert.status === 'INCREASED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1 w-max">
                              <TrendingUp className="w-3 h-3" /> ▲ +₹{alert.changeAmount.toLocaleString('en-IN')}
                            </span>
                          ) : alert.status === 'DECREASED' ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1 w-max">
                              <TrendingDown className="w-3 h-3" /> ▼ -₹{Math.abs(alert.changeAmount).toLocaleString('en-IN')}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200 flex items-center gap-1 w-max">
                              <Minus className="w-3 h-3" /> Stable
                            </span>
                          )}
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-ink-muted font-mono text-[11px] whitespace-nowrap">
                          {new Date(alert.alertDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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

      {/* Edit Specs & Prices Modal (Reused directly from CatalogTab) */}
      {editingModelForSpecs && (
        <EditSpecsAndPricesModal
          isOpen={Boolean(editingModelForSpecs)}
          model={editingModelForSpecs}
          highlightVariant={highlightSpecVariant}
          cashifyPrices={editingModelCashifyPrices}
          onClose={() => {
            setEditingModelForSpecs(null);
            setHighlightSpecVariant(null);
          }}
          onSaveSuccess={handleSpecsSaveSuccess}
        />
      )}
    </div>
  );
};

export default CashifyMonitorTab;
