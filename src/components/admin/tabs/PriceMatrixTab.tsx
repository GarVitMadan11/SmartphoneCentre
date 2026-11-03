import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, RefreshCw, Check, CheckCircle2, Bot,
  AlertCircle, ChevronDown, ChevronRight, SlidersHorizontal,
  Download, Smartphone, Tablet, Watch, Save, IndianRupee
} from 'lucide-react';
import {
  Model,
  Brand,
  BRANDS,
  buildVariantPricesForModel,
  getModelSupportedRam,
  getModelSupportedStorage,
  getDeviceImage,
  isAppleDevice,
} from '../../../data/mockDatabase';
import { fetchModels, updateModel } from '../../../utils/api';
import PriceAssistantChatbot from './PriceAssistantChatbot';

interface PriceMatrixTabProps {
  brands: Brand[];
  onRefresh?: (updatedModels?: Model[]) => Promise<void> | void;
}

interface VariantPriceEntry {
  modelId: string;
  modelLegacyId: string;
  modelName: string;
  brandId: string;
  brandName: string;
  series: string;
  deviceType: string;
  imageUrl?: string;
  ramGb: number;
  storageGb: number;
  variantKey: string;
  variantLabel: string;
  originalPrice: number;
  currentPrice: number;
  intlOriginalPrice?: number;
  intlCurrentPrice?: number;
  isApple: boolean;
  isEdited: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
}

export const PriceMatrixTab: React.FC<PriceMatrixTabProps> = ({ brands, onRefresh }) => {
  const [deviceType, setDeviceType] = useState<'smartphones' | 'tablets' | 'smartwatches'>('smartphones');
  const [selectedBrandId, setSelectedBrandId] = useState<string>('all');
  const [selectedSeries, setSelectedSeries] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Local price editing state: map of "modelId:variantKey" -> new edited price
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({});
  const [savingKeys, setSavingKeys] = useState<Record<string, boolean>>({});
  const [successKeys, setSuccessKeys] = useState<Record<string, boolean>>({});

  // Accordion expanded series state
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

  // Bulk adjustment modal state
  const [bulkModalSeries, setBulkModalSeries] = useState<{ brandName: string; seriesName: string; modelIds: string[] } | null>(null);
  const [bulkAdjustmentType, setBulkAdjustmentType] = useState<'FLAT' | 'PERCENT'>('FLAT');
  const [bulkAdjustmentValue, setBulkAdjustmentValue] = useState<number>(500);
  const [bulkAdjustmentDirection, setBulkAdjustmentDirection] = useState<'ADD' | 'SUBTRACT'>('ADD');
  const [bulkSaving, setBulkSaving] = useState(false);

  // Load models for active deviceType
  const loadModels = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchModels(undefined, deviceType, true);
      if (Array.isArray(data) && data.length > 0) {
        setModels(data as unknown as Model[]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch catalog models.');
    } finally {
      setLoading(false);
    }
  }, [deviceType]);

  useEffect(() => {
    loadModels();
  }, [loadModels]);

  // Optimistically update a single model without triggering full 1,400 variant reload
  const handleAssistantPriceUpdated = useCallback((updatedModel?: Model) => {
    if (updatedModel) {
      setModels((prev) =>
        prev.map((m) =>
          m.id === updatedModel.id || m.legacyId === updatedModel.legacyId ? { ...m, ...updatedModel } : m
        )
      );
    } else {
      loadModels();
    }
  }, [loadModels]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Brand lookup dictionary
  const brandMap = useMemo(() => {
    const map = new Map<string, string>();
    (brands.length > 0 ? brands : BRANDS).forEach(b => {
      map.set(b.id.toLowerCase(), b.name);
    });
    return map;
  }, [brands]);

  // Transform models into flat variant entries
  const allVariants = useMemo<VariantPriceEntry[]>(() => {
    const list: VariantPriceEntry[] = [];

    models.forEach((m) => {
      const brandName = brandMap.get((m.brandId || '').toLowerCase()) || m.brandId || 'Other';
      const series = m.series || 'Other Series';
      const rams = getModelSupportedRam(m);
      const storages = getModelSupportedStorage(m);
      const variantPrices = buildVariantPricesForModel(m);
      const isApple = isAppleDevice(m.brandId, m.name);

      rams.forEach((r) => {
        storages.forEach((s) => {
          const variantKey = `${r}_${s}`;
          const originalPrice = variantPrices[variantKey] || m.basePrice128GB || 0;
          const editKey = `${m.id}:${variantKey}`;
          const currentPrice = editedPrices[editKey] !== undefined ? editedPrices[editKey] : originalPrice;

          // International Variant Price (Apple only)
          const intlKey = `${variantKey}_intl`;
          const intlEditKey = `${m.id}:${intlKey}`;
          const is17or18 = (m.name || '').toLowerCase().includes('17') || (m.name || '').toLowerCase().includes('18');
          const defaultIntl = Math.round(originalPrice * (is17or18 ? 0.92 : 0.95));
          const intlOriginalPrice = isApple ? (variantPrices[intlKey] || defaultIntl) : undefined;
          const intlCurrentPrice = isApple
            ? (editedPrices[intlEditKey] !== undefined ? editedPrices[intlEditKey] : intlOriginalPrice)
            : undefined;

          const isEdited =
            (editedPrices[editKey] !== undefined && editedPrices[editKey] !== originalPrice) ||
            (isApple && editedPrices[intlEditKey] !== undefined && editedPrices[intlEditKey] !== intlOriginalPrice);

          let variantLabel = `${s >= 1024 ? `${s / 1024} TB` : `${s} GB`}`;
          if (r > 0) {
            variantLabel += ` • ${r} GB RAM`;
          }

          list.push({
            modelId: m.id,
            modelLegacyId: m.legacyId || m.id,
            modelName: m.name,
            brandId: m.brandId,
            brandName,
            series,
            deviceType: m.deviceType || 'smartphones',
            imageUrl: m.imageUrl,
            ramGb: r,
            storageGb: s,
            variantKey,
            variantLabel,
            originalPrice,
            currentPrice,
            intlOriginalPrice,
            intlCurrentPrice,
            isApple,
            isEdited,
            isSaving: Boolean(savingKeys[editKey] || savingKeys[intlEditKey]),
            saveSuccess: Boolean(successKeys[editKey] || successKeys[intlEditKey]),
          });
        });
      });
    });

    return list;
  }, [models, brandMap, editedPrices, savingKeys, successKeys]);

  // Distinct brand pills for current device type
  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    models.forEach((m) => set.add(m.brandId));
    const result: Array<{ id: string; name: string; count: number }> = [];

    set.forEach((bId) => {
      const bName = brandMap.get(bId.toLowerCase()) || bId;
      const count = models.filter((m) => m.brandId === bId).length;
      result.push({ id: bId, name: bName, count });
    });

    return result.sort((a, b) => b.count - a.count);
  }, [models, brandMap]);

  // Distinct series for selected brand
  const availableSeries = useMemo(() => {
    const set = new Set<string>();
    models
      .filter((m) => selectedBrandId === 'all' || m.brandId === selectedBrandId)
      .forEach((m) => {
        if (m.series) set.add(m.series);
      });
    return Array.from(set).sort();
  }, [models, selectedBrandId]);

  // Filtered variants based on Brand, Series, and Search Query
  const filteredVariants = useMemo(() => {
    return allVariants.filter((v) => {
      if (selectedBrandId !== 'all' && v.brandId !== selectedBrandId) return false;
      if (selectedSeries !== 'all' && v.series !== selectedSeries) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesBrand = v.brandName.toLowerCase().includes(q);
        const matchesSeries = v.series.toLowerCase().includes(q);
        const matchesModel = v.modelName.toLowerCase().includes(q);
        const matchesVariant = v.variantLabel.toLowerCase().includes(q);
        const matchesKey = v.variantKey.toLowerCase().includes(q);
        if (!matchesBrand && !matchesSeries && !matchesModel && !matchesVariant && !matchesKey) {
          return false;
        }
      }
      return true;
    });
  }, [allVariants, selectedBrandId, selectedSeries, searchQuery]);

  // Group filtered variants by Brand -> Series -> Model
  const hierarchicalTree = useMemo(() => {
    const tree: Record<string, Record<string, Record<string, VariantPriceEntry[]>>> = {};

    filteredVariants.forEach((v) => {
      if (!tree[v.brandName]) tree[v.brandName] = {};
      if (!tree[v.brandName][v.series]) tree[v.brandName][v.series] = {};
      if (!tree[v.brandName][v.series][v.modelName]) tree[v.brandName][v.series][v.modelName] = [];
      tree[v.brandName][v.series][v.modelName].push(v);
    });

    return tree;
  }, [filteredVariants]);

  // Handle price input change
  const handlePriceChange = (modelId: string, variantKey: string, newPrice: number) => {
    const editKey = `${modelId}:${variantKey}`;
    setEditedPrices((prev) => ({
      ...prev,
      [editKey]: Math.max(0, newPrice),
    }));
  };

  // Quick incremental adjust button (+500, -500, +5%, -5%)
  const handleQuickAdjust = (entry: VariantPriceEntry, deltaAmount: number, isPercent: boolean = false) => {
    const base = entry.currentPrice;
    let nextPrice = base;
    if (isPercent) {
      nextPrice = Math.round(base * (1 + deltaAmount / 100));
    } else {
      nextPrice = base + deltaAmount;
    }
    handlePriceChange(entry.modelId, entry.variantKey, Math.max(0, nextPrice));
  };

  // Save single variant price
  const handleSaveVariant = async (entry: VariantPriceEntry) => {
    const editKey = `${entry.modelId}:${entry.variantKey}`;
    const targetModel = models.find((m) => m.id === entry.modelId);
    if (!targetModel) return;

    setSavingKeys((prev) => ({ ...prev, [editKey]: true }));

    try {
      // Build full updated variantPrices dictionary for this model
      const currentMap = buildVariantPricesForModel(targetModel);
      const updatedMap: Record<string, number> = {
        ...currentMap,
        [entry.variantKey]: entry.currentPrice,
      };

      const intlKey = `${entry.variantKey}_intl`;
      const intlEditKey = `${entry.modelId}:${intlKey}`;
      if (entry.isApple && entry.intlCurrentPrice !== undefined) {
        updatedMap[intlKey] = entry.intlCurrentPrice;
      }

      // If updating 128GB or lowest tier, also update basePrice128GB
      let updatedBasePrice = targetModel.basePrice128GB;
      if (entry.storageGb === 128 || entry.variantKey === '0_128' || entry.variantKey === '8_128') {
        updatedBasePrice = entry.currentPrice;
      }

      await updateModel(targetModel.legacyId || targetModel.id, {
        variantPrices: updatedMap,
        basePrice128GB: updatedBasePrice,
      });

      // Update local models state
      setModels((prev) =>
        prev.map((m) =>
          m.id === targetModel.id
            ? { ...m, variantPrices: updatedMap, basePrice128GB: updatedBasePrice }
            : m
        )
      );

      // Clear edited state for this key
      setEditedPrices((prev) => {
        const next = { ...prev };
        delete next[editKey];
        delete next[intlEditKey];
        return next;
      });

      setSuccessKeys((prev) => ({ ...prev, [editKey]: true }));
      setTimeout(() => {
        setSuccessKeys((prev) => ({ ...prev, [editKey]: false }));
      }, 2500);

      showToast(`Updated ${entry.modelName} (${entry.variantLabel}) to ₹${entry.currentPrice.toLocaleString('en-IN')}`);

      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Error updating price: ${err.message || 'Server error'}`);
    } finally {
      setSavingKeys((prev) => ({ ...prev, [editKey]: false }));
    }
  };

  // Bulk series price adjustment executor
  const handleExecuteBulkAdjust = async () => {
    if (!bulkModalSeries) return;
    setBulkSaving(true);

    try {
      const affectedModels = models.filter((m) => bulkModalSeries.modelIds.includes(m.id));
      let updatedCount = 0;

      for (const m of affectedModels) {
        const currentMap = buildVariantPricesForModel(m);
        const updatedMap: Record<string, number> = {};

        Object.entries(currentMap).forEach(([k, oldPrice]) => {
          let adjusted = oldPrice;
          if (bulkAdjustmentType === 'PERCENT') {
            const factor = bulkAdjustmentDirection === 'ADD' ? 1 + bulkAdjustmentValue / 100 : 1 - bulkAdjustmentValue / 100;
            adjusted = Math.round(oldPrice * factor);
          } else {
            adjusted = bulkAdjustmentDirection === 'ADD' ? oldPrice + bulkAdjustmentValue : oldPrice - bulkAdjustmentValue;
          }
          updatedMap[k] = Math.max(100, adjusted);
        });

        const newBasePrice = updatedMap['0_128'] || updatedMap['8_128'] || Math.max(100, m.basePrice128GB + (bulkAdjustmentDirection === 'ADD' ? bulkAdjustmentValue : -bulkAdjustmentValue));

        await updateModel(m.legacyId || m.id, {
          variantPrices: updatedMap,
          basePrice128GB: newBasePrice,
        });

        updatedCount++;
      }

      await loadModels();
      setBulkModalSeries(null);
      showToast(`Bulk updated ${updatedCount} models across ${bulkModalSeries.seriesName}!`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(`Failed to execute bulk adjustment: ${err.message}`);
    } finally {
      setBulkSaving(false);
    }
  };

  // Toggle series collapse
  const toggleSeriesExpand = (seriesKey: string) => {
    setExpandedSeries((prev) => ({
      ...prev,
      [seriesKey]: prev[seriesKey] === undefined ? false : !prev[seriesKey],
    }));
  };

  // Export visible prices to CSV
  const handleExportCSV = () => {
    const headers = ['Brand', 'Series', 'Model Name', 'Storage', 'RAM', 'Variant Key', 'Rephonix Price (INR)'];
    const rows = filteredVariants.map((v) => [
      `"${v.brandName}"`,
      `"${v.series}"`,
      `"${v.modelName}"`,
      `"${v.storageGb} GB"`,
      `"${v.ramGb > 0 ? `${v.ramGb} GB` : 'Standard'}"`,
      `"${v.variantKey}"`,
      v.currentPrice,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `rephonix_price_matrix_${deviceType}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported Price Matrix CSV successfully!');
  };

  // Summary statistics
  const stats = useMemo(() => {
    const totalVariantsCount = filteredVariants.length;
    if (totalVariantsCount === 0) return { totalVariantsCount: 0, minPrice: 0, maxPrice: 0, avgPrice: 0 };
    const prices = filteredVariants.map((v) => v.currentPrice).filter((p) => p > 0);
    const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
    const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
    const avgPrice = prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    return { totalVariantsCount, minPrice, maxPrice, avgPrice };
  }, [filteredVariants]);

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xl font-medium text-xs flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Card */}
      <div className="bg-canvas-pure border border-ice-border rounded-xl p-5 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 font-sans tracking-tight">
                  Price Matrix &amp; Valuation Editor
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold uppercase">
                  Direct Valuation Control
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsChatbotOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer ring-2 ring-blue-500/20"
            title="Open conversational price assistant"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Price Assistant</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          </button>

          <button
            type="button"
            onClick={loadModels}
            disabled={loading}
            className="p-2 border border-slate-300 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Reload live prices"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 border border-slate-300 hover:border-slate-400 text-slate-700 hover:text-slate-900 bg-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
            title="Download full price sheet as CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Category Tabs: Smartphones | Tablets | Smartwatches */}
      <div className="flex border-b border-ice-border gap-2 text-xs font-semibold">
        {(
          [
            { id: 'smartphones', label: 'Smartphones', icon: Smartphone },
            { id: 'tablets', label: 'Tablets', icon: Tablet },
            { id: 'smartwatches', label: 'Smartwatches', icon: Watch },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const isActive = deviceType === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setDeviceType(tab.id);
                setSelectedBrandId('all');
                setSelectedSeries('all');
              }}
              className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Brand Selection Pills */}
      <div className="bg-canvas-pure border border-ice-border rounded-xl p-3 shadow-xs">
        <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between">
          <span>Select Brand:</span>
          <span className="text-[10px] text-slate-400 font-mono">{availableBrands.length} Brands Available</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              setSelectedBrandId('all');
              setSelectedSeries('all');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedBrandId === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            All Brands ({models.length})
          </button>
          {availableBrands.map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => {
                setSelectedBrandId(b.id);
                setSelectedSeries('all');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                selectedBrandId === b.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{b.name}</span>
              <span
                className={`text-[10px] font-mono px-1 rounded ${
                  selectedBrandId === b.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                {b.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-canvas-pure border border-ice-border rounded-xl p-3.5 shadow-xs flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full sm:w-auto">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Brand, Series, Model, or Variant (e.g. '15 Pro', 'S24', '512')..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Series Filter Dropdown */}
        {availableSeries.length > 0 && (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Series:</span>
            <select
              value={selectedSeries}
              onChange={(e) => setSelectedSeries(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 cursor-pointer min-w-[160px]"
            >
              <option value="all">All Series ({availableSeries.length})</option>
              {availableSeries.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-ice-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Priced Variants</span>
          <span className="text-xl font-bold font-mono text-slate-900">{stats.totalVariantsCount}</span>
        </div>
        <div className="bg-white border border-ice-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Lowest Valuation</span>
          <span className="text-xl font-bold font-mono text-emerald-700">₹{stats.minPrice.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-white border border-ice-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Average Valuation</span>
          <span className="text-xl font-bold font-mono text-blue-700">₹{stats.avgPrice.toLocaleString('en-IN')}</span>
        </div>
        <div className="bg-white border border-ice-border rounded-xl p-3.5 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Top Valuation</span>
          <span className="text-xl font-bold font-mono text-indigo-700">₹{stats.maxPrice.toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* ── HIERARCHICAL TREE VIEW: Brand -> Series -> Model -> Variant -> Price ── */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 space-y-3 bg-white border border-ice-border rounded-xl">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium">Loading price matrix...</p>
        </div>
      ) : Object.keys(hierarchicalTree).length === 0 ? (
        <div className="py-16 text-center text-slate-400 text-xs bg-white border border-ice-border rounded-xl">
          No models or variants match your selected brand/series/search criteria.
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(hierarchicalTree).map(([brandName, seriesGroup]) => (
            <div key={brandName} className="bg-canvas-pure border border-ice-border rounded-2xl shadow-xs overflow-hidden">
              {/* Brand Header Banner */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 bg-white/10 rounded-md text-xs font-mono font-bold tracking-wider uppercase border border-white/15">
                    Brand
                  </span>
                  <h3 className="text-base sm:text-lg font-bold tracking-tight text-white">{brandName}</h3>
                </div>
                <div className="text-xs text-slate-300 font-mono">
                  {Object.keys(seriesGroup).length} Series •{' '}
                  {Object.values(seriesGroup).reduce((acc, models) => acc + Object.keys(models).length, 0)} Models
                </div>
              </div>

              {/* Series List within Brand */}
              <div className="divide-y divide-ice-border/70">
                {Object.entries(seriesGroup).map(([seriesName, modelsMap]) => {
                  const seriesKey = `${brandName}:${seriesName}`;
                  const isCollapsed = expandedSeries[seriesKey] === false;
                  const allModelIdsInSeries = Object.values(modelsMap).flatMap((entries) => entries.map((e) => e.modelId));
                  const uniqueModelIdsInSeries = Array.from(new Set(allModelIdsInSeries));
                  const totalVariantsInSeries = Object.values(modelsMap).reduce((acc, arr) => acc + arr.length, 0);

                  return (
                    <div key={seriesName} className="p-4 sm:p-5">
                      {/* Series Bar with Bulk Adjustment Action */}
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100 gap-2">
                        <button
                          type="button"
                          onClick={() => toggleSeriesExpand(seriesKey)}
                          className="flex items-center gap-2 text-left cursor-pointer group"
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-blue-600" />
                          )}
                          <span className="text-sm font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
                            {seriesName}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full font-bold">
                            {uniqueModelIdsInSeries.length} models • {totalVariantsInSeries} variants
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setBulkModalSeries({
                              brandName,
                              seriesName,
                              modelIds: uniqueModelIdsInSeries,
                            })
                          }
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                          title="Apply uniform price shift across all variants in this series"
                        >
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Bulk Adjust Series</span>
                        </button>
                      </div>

                      {/* Models and Variant Price Matrix */}
                      {!isCollapsed && (
                        <div className="space-y-4 pt-1">
                          {Object.entries(modelsMap).map(([modelName, variantsList]) => {
                            const first = variantsList[0];
                            const deviceImg = first?.imageUrl || getDeviceImage(first?.modelLegacyId, first?.modelName);

                            return (
                              <div
                                key={modelName}
                                className="bg-slate-50/70 border border-slate-200/90 rounded-xl p-3.5 hover:border-slate-300 transition-all"
                              >
                                {/* Model Info Header */}
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-200/80">
                                  <div className="flex items-center gap-2.5">
                                    {deviceImg && (
                                      <img
                                        src={deviceImg}
                                        alt={modelName}
                                        className="w-8 h-8 object-contain bg-white rounded-md p-0.5 border border-slate-200 shrink-0"
                                      />
                                    )}
                                    <div>
                                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-tight">
                                        {modelName}
                                      </h4>
                                      <span className="text-[10px] font-mono text-slate-500">
                                        ID: {first?.modelLegacyId}
                                      </span>
                                    </div>
                                  </div>
                                  <span className="text-[11px] font-mono text-slate-500">
                                    {variantsList.length} Storage/RAM Tiers
                                  </span>
                                </div>

                                {/* Variants Pricing Table / Rows */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                  {variantsList.map((entry) => (
                                    <div
                                      key={entry.variantKey}
                                      className={`bg-white border rounded-xl p-2.5 transition-all flex flex-col justify-between ${
                                        entry.isEdited
                                          ? 'border-blue-400 ring-2 ring-blue-500/10 bg-blue-50/20'
                                          : 'border-slate-200 hover:border-slate-300'
                                      }`}
                                    >
                                      {/* Variant Tag */}
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-xs font-bold text-slate-800 font-mono">
                                            {entry.variantLabel}
                                          </span>
                                        </div>
                                        {entry.isEdited && (
                                          <span className="text-[9px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.2 rounded font-mono">
                                            MODIFIED
                                          </span>
                                        )}
                                      </div>

                                      {/* Price Input & Quick Adjust Steppers */}
                                      <div className="space-y-2">
                                        {/* Indian / Physical SIM Price */}
                                        <div>
                                          {entry.isApple && (
                                            <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                                              <span>🇮🇳 Indian (Physical SIM)</span>
                                            </span>
                                          )}
                                          <div className="flex items-center gap-1.5">
                                            <div className="relative flex-1">
                                              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                                ₹
                                              </span>
                                              <input
                                                type="number"
                                                value={entry.currentPrice || ''}
                                                onChange={(e) =>
                                                  handlePriceChange(
                                                    entry.modelId,
                                                    entry.variantKey,
                                                    parseInt(e.target.value, 10) || 0
                                                  )
                                                }
                                                onKeyDown={(e) => {
                                                  if (e.key === 'Enter') {
                                                    e.preventDefault();
                                                    handleSaveVariant(entry);
                                                  }
                                                }}
                                                className="w-full pl-6 pr-2 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                              />
                                            </div>

                                            {!entry.isApple && (
                                              <button
                                                type="button"
                                                onClick={() => handleSaveVariant(entry)}
                                                disabled={entry.isSaving || !entry.isEdited}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                                                  entry.saveSuccess
                                                    ? 'bg-emerald-600 text-white'
                                                    : entry.isEdited
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                                title="Save price to database"
                                              >
                                                {entry.isSaving ? (
                                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                ) : entry.saveSuccess ? (
                                                  <>
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span>Saved</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Save className="w-3.5 h-3.5" />
                                                    <span>Save</span>
                                                  </>
                                                )}
                                              </button>
                                            )}
                                          </div>
                                        </div>

                                        {/* International / eSIM Price (Apple models only) */}
                                        {entry.isApple && (
                                          <div>
                                            <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1 mb-1">
                                              <span>🌐 International (eSIM Only)</span>
                                            </span>
                                            <div className="flex items-center gap-1.5">
                                              <div className="relative flex-1">
                                                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                                                  ₹
                                                </span>
                                                <input
                                                  type="number"
                                                  value={entry.intlCurrentPrice || ''}
                                                  onChange={(e) =>
                                                    handlePriceChange(
                                                      entry.modelId,
                                                      `${entry.variantKey}_intl`,
                                                      parseInt(e.target.value, 10) || 0
                                                    )
                                                  }
                                                  onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                      e.preventDefault();
                                                      handleSaveVariant(entry);
                                                    }
                                                  }}
                                                  className="w-full pl-6 pr-2 py-1.5 bg-slate-50 focus:bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                                                  placeholder="e.g. 56000"
                                                />
                                              </div>

                                              <button
                                                type="button"
                                                onClick={() => handleSaveVariant(entry)}
                                                disabled={entry.isSaving || !entry.isEdited}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0 ${
                                                  entry.saveSuccess
                                                    ? 'bg-emerald-600 text-white'
                                                    : entry.isEdited
                                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                                                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                                }`}
                                                title="Save both Indian & International prices"
                                              >
                                                {entry.isSaving ? (
                                                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                ) : entry.saveSuccess ? (
                                                  <>
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span>Saved</span>
                                                  </>
                                                ) : (
                                                  <>
                                                    <Save className="w-3.5 h-3.5" />
                                                    <span>Save</span>
                                                  </>
                                                )}
                                              </button>
                                            </div>
                                          </div>
                                        )}

                                        {/* Quick Step Buttons: -500, +500, +5% */}
                                        <div className="flex items-center gap-1 pt-1">
                                          <button
                                            type="button"
                                            onClick={() => handleQuickAdjust(entry, -500)}
                                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                                            title="Decrease ₹500"
                                          >
                                            -500
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleQuickAdjust(entry, 500)}
                                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                                            title="Increase ₹500"
                                          >
                                            +500
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleQuickAdjust(entry, 2, true)}
                                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[10px] font-mono font-semibold transition-colors cursor-pointer"
                                            title="Increase +2%"
                                          >
                                            +2%
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => handleQuickAdjust(entry, 5, true)}
                                            className="px-1.5 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer"
                                            title="Increase +5%"
                                          >
                                            +5%
                                          </button>
                                          {entry.isEdited && (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const editKey = `${entry.modelId}:${entry.variantKey}`;
                                                const intlEditKey = `${entry.modelId}:${entry.variantKey}_intl`;
                                                setEditedPrices((prev) => {
                                                  const next = { ...prev };
                                                  delete next[editKey];
                                                  delete next[intlEditKey];
                                                  return next;
                                                });
                                              }}
                                              className="ml-auto text-[10px] text-slate-400 hover:text-rose-600 underline"
                                              title="Reset to database price"
                                            >
                                              Reset
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Price Assistant Chatbot Drawer */}
      <PriceAssistantChatbot
        isOpen={isChatbotOpen}
        onClose={() => setIsChatbotOpen(false)}
        models={models}
        brands={brands}
        onPriceUpdated={handleAssistantPriceUpdated}
      />

      {/* BULK SERIES ADJUSTMENT MODAL */}
      {bulkModalSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 text-left relative">
            <h3 className="text-lg font-bold text-slate-950 mb-1">Bulk Shift Series Valuation</h3>
            <p className="text-xs text-slate-500 mb-4">
              Apply a synchronized price shift across all models and storage tiers in{' '}
              <strong className="text-slate-800 font-semibold">{bulkModalSeries.seriesName}</strong>.
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                  Adjustment Direction
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setBulkAdjustmentDirection('ADD')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      bulkAdjustmentDirection === 'ADD'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    + Increase Prices
                  </button>
                  <button
                    type="button"
                    onClick={() => setBulkAdjustmentDirection('SUBTRACT')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      bulkAdjustmentDirection === 'SUBTRACT'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    - Decrease Prices
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    Adjustment Type
                  </label>
                  <select
                    value={bulkAdjustmentType}
                    onChange={(e) => setBulkAdjustmentType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600/30 cursor-pointer"
                  >
                    <option value="FLAT">Flat Amount (₹)</option>
                    <option value="PERCENT">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 uppercase tracking-wider">
                    {bulkAdjustmentType === 'FLAT' ? 'Amount (₹)' : 'Percentage (%)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={bulkAdjustmentValue}
                    onChange={(e) => setBulkAdjustmentValue(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                  />
                </div>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                Preview: All {bulkModalSeries.modelIds.length} models in this series will be adjusted by{' '}
                <strong>
                  {bulkAdjustmentDirection === 'ADD' ? '+' : '-'}
                  {bulkAdjustmentType === 'FLAT' ? `₹${bulkAdjustmentValue.toLocaleString('en-IN')}` : `${bulkAdjustmentValue}%`}
                </strong>
                .
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setBulkModalSeries(null)}
                  disabled={bulkSaving}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkAdjust}
                  disabled={bulkSaving}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {bulkSaving ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Applying Shift...</span>
                    </>
                  ) : (
                    <span>Confirm &amp; Update Series</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceMatrixTab;
