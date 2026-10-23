import React, { useState, useEffect, useMemo } from 'react';
import {
  Smartphone,
  Search,
  Plus,
  Edit2,
  Trash2,
  Eye,
  EyeOff,
  RefreshCw,
  Grid,
  Download,
  Calendar,
  HardDrive,
  Cpu,
  Sparkles,
  Check,
  AlertCircle,
  X,
  Image as ImageIcon,
  Shuffle,
  GripVertical,
  ArrowUp,
  ArrowDown,
  Folder,
  Tag,
  RotateCcw,
  ShieldCheck,
  ExternalLink,
  Globe,
  CheckCircle2,
  Zap,
  Wifi,
  Radio,
} from 'lucide-react';
import { Model, Brand, BRANDS, isSmartwatchDevice, isTabletDevice, buildVariantPricesForModel, isVariantAvailable, predictCashifyPrice, hasSpenSupport, getBiometricType } from '../../../data/mockDatabase';
import { fetchModels, createModel, updateModel, deleteModel, testCashifyUrlApi, registerApprovedCashifyVariants } from '../../../utils/api';
import {
  saveBrandOrder,
  resetBrandOrder,
  applyBrandOrder,
  saveSeriesOrder,
  resetSeriesOrder,
  applySeriesOrder,
  saveModelOrder,
  resetModelOrder,
  applyModelOrder,
  shuffleArray,
  setBrandSkipSeries,
  isBrandSeriesSkipped,
  DEFAULT_SERIES_ORDER,
} from '../../../utils/ordering';

interface CatalogTabProps {
  category: 'smartphones' | 'tablets' | 'smartwatches';
  brands: Brand[];
  onRefresh?: () => void;
}

const STANDARD_STORAGE_OPTIONS = [16, 32, 64, 128, 256, 512, 1024, 2048];
const STANDARD_RAM_OPTIONS = [0, 2, 3, 4, 6, 8, 12, 16, 24];

export const CatalogTab: React.FC<CatalogTabProps> = ({ category, brands: initialBrands, onRefresh }) => {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('all');
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState<string>('all');
  const [showHiddenOnly, setShowHiddenOnly] = useState(false);

  // Shuffle & Reorder Studio Mode State
  const [isReorderMode, setIsReorderMode] = useState(false);
  const [reorderTab, setReorderTab] = useState<'brands' | 'series' | 'models'>('brands');
  const [orderedBrands, setOrderedBrands] = useState<Brand[]>([]);
  const [reorderSeriesBrandId, setReorderSeriesBrandId] = useState<string>('brand-apple');
  const [orderedSeries, setOrderedSeries] = useState<string[]>([]);
  const [reorderModelBrandId, setReorderModelBrandId] = useState<string>('brand-apple');
  const [reorderModelSeries, setReorderModelSeries] = useState<string>('all');
  const [orderedModels, setOrderedModels] = useState<Model[]>([]);

  // Drag & drop state
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [orderVersion, setOrderVersion] = useState(0);

  useEffect(() => {
    const handleOrderChange = () => setOrderVersion((v) => v + 1);
    window.addEventListener('stc_catalog_order_changed', handleOrderChange);
    return () => window.removeEventListener('stc_catalog_order_changed', handleOrderChange);
  }, []);

  // Modals
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Load models from API (Database) scoped to category
  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiModels = await fetchModels(undefined, category, true);
      setModels(apiModels as Model[]);
    } catch (err: any) {
      console.error('Failed to fetch models from DB:', err);
      setError(err.message || 'Failed to load models from database');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModels();
  }, [category]);

  // Brands applicable to this category
  const categoryBrands = useMemo(() => {
    if (category === 'smartphones') return initialBrands;
    const supportedBrandIds = new Set(['brand-apple', 'brand-samsung']);
    models.forEach((m) => supportedBrandIds.add(m.brandId));
    return initialBrands.filter((b) => supportedBrandIds.has(b.id));
  }, [initialBrands, models, category]);

  // Initialize ordered brands
  useEffect(() => {
    setOrderedBrands(applyBrandOrder(categoryBrands));
    if (categoryBrands.length > 0) {
      setReorderSeriesBrandId((prev) => (categoryBrands.some((b) => b.id === prev) ? prev : categoryBrands[0].id));
      setReorderModelBrandId((prev) => (categoryBrands.some((b) => b.id === prev) ? prev : categoryBrands[0].id));
    }
  }, [categoryBrands]);

  // Derived Series List for active brand filter or active reorder brand
  const activeBrandForSeries = selectedBrandFilter !== 'all' ? selectedBrandFilter : (categoryBrands[0]?.id || 'brand-apple');

  const availableSeriesList = useMemo(() => {
    const brandModels = models.filter((m) => {
      let matchesCat = false;
      if (category === 'smartphones') {
        matchesCat = (m as any).deviceType === 'smartphones' || (!isTabletDevice(m.brandId, m.name, m.id) && !isSmartwatchDevice(m.brandId, m.name, m.id));
      } else if (category === 'tablets') {
        matchesCat = (m as any).deviceType === 'tablets' || isTabletDevice(m.brandId, m.name, m.id);
      } else if (category === 'smartwatches') {
        matchesCat = (m as any).deviceType === 'smartwatches' || isSmartwatchDevice(m.brandId, m.name, m.id);
      }
      if (!matchesCat) return false;
      if (selectedBrandFilter !== 'all' && m.brandId !== selectedBrandFilter) return false;
      return true;
    });

    const seriesSet = new Set<string>();
    brandModels.forEach((m) => {
      if (m.series) seriesSet.add(m.series);
    });

    const rawList = Array.from(seriesSet);
    return applySeriesOrder(activeBrandForSeries, rawList, category);
  }, [models, category, selectedBrandFilter, activeBrandForSeries]);

  // Initialize series list for Reorder Series Tab
  useEffect(() => {
    const brandModels = models.filter((m) => {
      if (m.brandId !== reorderSeriesBrandId) return false;
      if (category === 'smartphones') {
        return (m as any).deviceType === 'smartphones' || (!isTabletDevice(m.brandId, m.name, m.id) && !isSmartwatchDevice(m.brandId, m.name, m.id));
      } else if (category === 'tablets') {
        return (m as any).deviceType === 'tablets' || isTabletDevice(m.brandId, m.name, m.id);
      } else if (category === 'smartwatches') {
        return (m as any).deviceType === 'smartwatches' || isSmartwatchDevice(m.brandId, m.name, m.id);
      }
      return true;
    });
    const seriesSet = new Set<string>();
    brandModels.forEach((m) => {
      if (m.series) seriesSet.add(m.series);
    });
    setOrderedSeries(applySeriesOrder(reorderSeriesBrandId, Array.from(seriesSet), category));
  }, [reorderSeriesBrandId, models, category]);

  // Initialize models list for Reorder Models Tab
  useEffect(() => {
    const brandModels = models.filter((m) => {
      if (m.brandId !== reorderModelBrandId) return false;
      if (reorderModelSeries !== 'all' && m.series !== reorderModelSeries) return false;
      if (category === 'smartphones') {
        return (m as any).deviceType === 'smartphones' || (!isTabletDevice(m.brandId, m.name, m.id) && !isSmartwatchDevice(m.brandId, m.name, m.id));
      } else if (category === 'tablets') {
        return (m as any).deviceType === 'tablets' || isTabletDevice(m.brandId, m.name, m.id);
      } else if (category === 'smartwatches') {
        return (m as any).deviceType === 'smartwatches' || isSmartwatchDevice(m.brandId, m.name, m.id);
      }
      return true;
    });
    setOrderedModels(applyModelOrder(reorderModelBrandId, brandModels, category));
  }, [reorderModelBrandId, reorderModelSeries, models, category, orderVersion]);

  // Filter and order models by category, search, series, and brand ordering
  const filteredModels = useMemo(() => {
    let list = models.filter((m) => {
      // Category filter
      let matchesCat = false;
      if (category === 'smartphones') {
        matchesCat = !isTabletDevice(m.brandId, m.name, m.id) && !isSmartwatchDevice(m.brandId, m.name, m.id);
      } else if (category === 'tablets') {
        matchesCat = isTabletDevice(m.brandId, m.name, m.id);
      } else if (category === 'smartwatches') {
        matchesCat = isSmartwatchDevice(m.brandId, m.name, m.id);
      }
      if (!matchesCat) return false;

      // Brand filter
      if (selectedBrandFilter !== 'all' && m.brandId !== selectedBrandFilter) return false;

      // Series filter
      if (selectedSeriesFilter !== 'all' && m.series !== selectedSeriesFilter) return false;

      // Hidden filter
      if (showHiddenOnly && !m.hidden) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = m.name.toLowerCase().includes(q);
        const matchesSeries = (m.series || '').toLowerCase().includes(q);
        const matchesId = m.id.toLowerCase().includes(q);
        if (!matchesName && !matchesSeries && !matchesId) return false;
      }

      return true;
    });

    // Apply custom model order per brand
    if (selectedBrandFilter !== 'all') {
      list = applyModelOrder(selectedBrandFilter, list, category);
    } else {
      const brandGroups = new Map<string, Model[]>();
      list.forEach((m) => {
        if (!brandGroups.has(m.brandId)) brandGroups.set(m.brandId, []);
        brandGroups.get(m.brandId)!.push(m);
      });
      const reorderedList: Model[] = [];
      const brandOrder = applyBrandOrder(orderedBrands.length > 0 ? orderedBrands : initialBrands);
      brandOrder.forEach((b) => {
        const bModels = brandGroups.get(b.id);
        if (bModels && bModels.length > 0) {
          reorderedList.push(...applyModelOrder(b.id, bModels, category));
        }
      });
      brandGroups.forEach((bModels, bId) => {
        if (!brandOrder.some((b) => b.id === bId)) {
          reorderedList.push(...applyModelOrder(bId, bModels, category));
        }
      });
      list = reorderedList;
    }

    return list;
  }, [models, category, selectedBrandFilter, selectedSeriesFilter, showHiddenOnly, searchQuery, orderVersion, orderedBrands, initialBrands]);

  // Group models by Series for display
  const modelsGroupedBySeries = useMemo(() => {
    const groups: { seriesName: string; models: Model[] }[] = [];
    const map = new Map<string, Model[]>();

    filteredModels.forEach((m) => {
      const s = m.series || 'Other Models';
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(m);
    });

    const activeBrand = selectedBrandFilter !== 'all' ? selectedBrandFilter : 'brand-apple';
    const seriesOrder = applySeriesOrder(activeBrand, Array.from(map.keys()), category);

    seriesOrder.forEach((sName) => {
      if (map.has(sName)) {
        groups.push({ seriesName: sName, models: map.get(sName)! });
      }
    });

    // Add any remaining
    map.forEach((mList, sName) => {
      if (!seriesOrder.includes(sName)) {
        groups.push({ seriesName: sName, models: mList });
      }
    });

    return groups;
  }, [filteredModels, selectedBrandFilter]);

  // Open Edit Modal
  const handleStartEdit = (model: Model) => {
    setEditingModel(model);
    setIsAddingNew(false);
  };

  // Open Add New Model Modal
  const handleStartAdd = () => {
    setEditingModel(null);
    setIsAddingNew(true);
  };

  // Toggle Hidden
  const handleToggleHidden = async (model: Model) => {
    try {
      const updatedHidden = !model.hidden;
      await updateModel(model.id, { hidden: updatedHidden });
      setModels((prev) =>
        prev.map((m) => (m.id === model.id ? { ...m, hidden: updatedHidden } : m))
      );
      setSuccessMsg(`Model "${model.name}" is now ${updatedHidden ? 'hidden from public store' : 'visible in public store'}.`);
      if (onRefresh) onRefresh();
      window.dispatchEvent(new CustomEvent('stc_catalog_order_changed'));
    } catch (err: any) {
      console.error('Failed to toggle model visibility:', err);
      setError(err.message || 'Failed to update visibility');
    }
  };

  // Delete Model
  const handleDeleteModel = async (model: Model) => {
    if (!window.confirm(`Are you sure you want to delete "${model.name}" from the database? This action cannot be undone.`)) {
      return;
    }
    try {
      await deleteModel(model.id);
      setModels((prev) => prev.filter((m) => m.id !== model.id));
      setSuccessMsg(`Model "${model.name}" deleted from database.`);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to delete model:', err);
      setError(err.message || 'Failed to delete model');
    }
  };

  // Reordering Logic: Brand Reorder
  const handleMoveBrand = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= orderedBrands.length) return;
    const next = [...orderedBrands];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setOrderedBrands(next);
  };

  const handleSaveBrandOrder = () => {
    saveBrandOrder(orderedBrands.map((b) => b.id));
    setSuccessMsg('Custom brand display order saved successfully!');
  };

  const handleResetBrandOrder = () => {
    resetBrandOrder();
    setOrderedBrands(applyBrandOrder(initialBrands));
    setSuccessMsg('Brand order reset to default.');
  };

  const handleShuffleBrands = () => {
    setOrderedBrands(shuffleArray(orderedBrands));
  };

  // Reordering Logic: Series Reorder
  const handleMoveSeries = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= orderedSeries.length) return;
    const next = [...orderedSeries];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setOrderedSeries(next);
  };

  const handleSaveSeriesOrder = () => {
    saveSeriesOrder(reorderSeriesBrandId, orderedSeries, category);
    setSuccessMsg('Custom series display order saved successfully!');
  };

  const handleResetSeriesOrder = () => {
    resetSeriesOrder(reorderSeriesBrandId, category);
    const brandModels = models.filter((m) => m.brandId === reorderSeriesBrandId);
    const seriesSet = new Set<string>();
    brandModels.forEach((m) => {
      if (m.series) seriesSet.add(m.series);
    });
    setOrderedSeries(applySeriesOrder(reorderSeriesBrandId, Array.from(seriesSet), category));
    setSuccessMsg('Series order reset to default.');
  };

  const handleShuffleSeries = () => {
    setOrderedSeries(shuffleArray(orderedSeries));
  };

  // Reordering Logic: Model Reorder
  const handleMoveModel = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= orderedModels.length) return;
    const next = [...orderedModels];
    const [moved] = next.splice(index, 1);
    next.splice(targetIdx, 0, moved);
    setOrderedModels(next);
  };

  const handleSaveModelOrder = () => {
    let finalOrder: string[] = [];
    if (reorderModelSeries === 'all') {
      finalOrder = orderedModels.map((m) => m.id);
    } else {
      const allBrandModels = models.filter((m) => m.brandId === reorderModelBrandId);
      const currentFullList = applyModelOrder(reorderModelBrandId, allBrandModels, category);
      const reorderedIds = orderedModels.map((m) => m.id);
      const reorderedSet = new Set(reorderedIds);

      let reorderedIdx = 0;
      finalOrder = currentFullList.map((m) => {
        if (reorderedSet.has(m.id)) {
          const newId = reorderedIds[reorderedIdx];
          reorderedIdx++;
          return newId;
        }
        return m.id;
      });
    }

    saveModelOrder(reorderModelBrandId, finalOrder, category);
    setSuccessMsg('Custom model display order saved successfully!');
  };

  const handleResetModelOrder = () => {
    resetModelOrder(reorderModelBrandId, category);
    const brandModels = models.filter((m) => m.brandId === reorderModelBrandId);
    setOrderedModels(applyModelOrder(reorderModelBrandId, brandModels, category));
    setSuccessMsg('Model order reset to default.');
  };

  const handleShuffleModels = () => {
    setOrderedModels(shuffleArray(orderedModels));
  };

  // Drag & Drop Generic Handlers for Reorder Lists
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    if (reorderTab === 'brands') {
      const next = [...orderedBrands];
      const [dragged] = next.splice(draggedIndex, 1);
      next.splice(index, 0, dragged);
      setOrderedBrands(next);
    } else if (reorderTab === 'series') {
      const next = [...orderedSeries];
      const [dragged] = next.splice(draggedIndex, 1);
      next.splice(index, 0, dragged);
      setOrderedSeries(next);
    } else if (reorderTab === 'models') {
      const next = [...orderedModels];
      const [dragged] = next.splice(draggedIndex, 1);
      next.splice(index, 0, dragged);
      setOrderedModels(next);
    }
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };
  // Export CSV

  const handleExportCsv = () => {
    const headers = ['id', 'brandId', 'name', 'category', 'series', 'releaseYear', 'basePrice128GB', 'supportedStorageGb', 'supportedRamGb', 'imageUrl', 'hidden'];
    const rows = filteredModels.map((m) => [
      m.id,
      m.brandId,
      `"${m.name.replace(/"/g, '""')}"`,
      m.category,
      `"${(m.series || '').replace(/"/g, '""')}"`,
      m.releaseYear,
      m.basePrice128GB,
      `"${(m.supportedStorageGb || []).join(',')}"`,
      `"${(m.supportedRamGb || []).join(',')}"`,
      `"${(m.imageUrl || '').replace(/"/g, '""')}"`,
      m.hidden ? 'true' : 'false',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `catalog_${category}_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportActiveVariantsCsv = () => {
    // Export ONLY active (non-hidden) devices
    const activeModels = models.filter((m) => {
      if (m.hidden) return false;
      let matchesCat = false;
      if (category === 'smartphones') {
        matchesCat = !isTabletDevice(m.brandId, m.name, m.id) && !isSmartwatchDevice(m.brandId, m.name, m.id);
      } else if (category === 'tablets') {
        matchesCat = isTabletDevice(m.brandId, m.name, m.id);
      } else if (category === 'smartwatches') {
        matchesCat = isSmartwatchDevice(m.brandId, m.name, m.id);
      }
      return matchesCat;
    });

    const headers = [
      'Model ID',
      'Brand ID',
      'Brand Name',
      'Model Name',
      'Category',
      'Series',
      'Release Year',
      'RAM (GB)',
      'Storage (GB)',
      'Formatted Storage',
      'Variant Price (INR)',
      'Base Anchor Price 128GB (INR)',
      'Warranty Question Supported',
      'Image URL',
      'Status'
    ];

    const brandMap = new Map<string, string>();
    initialBrands.forEach((b) => brandMap.set(b.id, b.name));

    const rows: string[][] = [];

    activeModels.forEach((m) => {
      const brandName = brandMap.get(m.brandId) || m.brandId;
      const variantPricesMap = buildVariantPricesForModel(m);
      const entries = Object.entries(variantPricesMap);

      if (entries.length > 0) {
        entries.forEach(([key, price]) => {
          const parts = key.split('_');
          const ramGb = Number(parts[0]) || 0;
          const storageGb = Number(parts[1]) || 0;

          if (price > 0 && isVariantAvailable(m, ramGb, storageGb)) {
            const formattedStorage = storageGb >= 1024 ? `${storageGb / 1024} TB` : `${storageGb} GB`;
            const ramLabel = ramGb === 0 ? 'N/A' : `${ramGb} GB`;

            rows.push([
              m.id,
              m.brandId,
              `"${brandName.replace(/"/g, '""')}"`,
              `"${m.name.replace(/"/g, '""')}"`,
              m.category,
              `"${(m.series || '').replace(/"/g, '""')}"`,
              String(m.releaseYear || ''),
              ramLabel,
              String(storageGb),
              formattedStorage,
              String(price),
              String(m.basePrice128GB || ''),
              m.supportsWarrantyQuestion ? 'Yes' : 'No',
              `"${(m.imageUrl || '').replace(/"/g, '""')}"`,
              'Active'
            ]);
          }
        });
      } else {
        rows.push([
          m.id,
          m.brandId,
          `"${brandName.replace(/"/g, '""')}"`,
          `"${m.name.replace(/"/g, '""')}"`,
          m.category,
          `"${(m.series || '').replace(/"/g, '""')}"`,
          String(m.releaseYear || ''),
          'N/A',
          '128',
          '128 GB',
          String(m.basePrice128GB || 0),
          String(m.basePrice128GB || 0),
          m.supportsWarrantyQuestion ? 'Yes' : 'No',
          `"${(m.imageUrl || '').replace(/"/g, '""')}"`,
          'Active'
        ]);
      }
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `active_${category}_ram_storage_prices_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatPrice = (val: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 font-outfit">
      {/* Alert Messages */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-rose-500 hover:text-rose-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 flex-shrink-0 text-emerald-600" />
            <span className="text-sm font-medium">{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-500 hover:text-emerald-800 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Controls Bar */}
      <div className="bg-canvas-white border border-ice-border rounded-lg p-4 flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 shadow-sm">
        {/* Search & Filter */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-ink-muted" />
            <input
              type="text"
              placeholder={`Search ${category} by name, series, or ID...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-canvas-pure border border-ice-border rounded-lg text-xs font-mono text-ink-navy placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-cobalt/30 focus:border-cobalt"
            />
          </div>

          <select
            value={selectedBrandFilter}
            onChange={(e) => {
              setSelectedBrandFilter(e.target.value);
              setSelectedSeriesFilter('all');
            }}
            className="px-3 py-2 bg-canvas-pure border border-ice-border rounded-lg text-xs font-semibold text-ink-navy focus:outline-none focus:border-cobalt cursor-pointer"
          >
            <option value="all">All Brands</option>
            {orderedBrands.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>

          <label className="flex items-center gap-2 text-xs text-ink-slate font-medium cursor-pointer px-2 py-1 bg-zinc-50 border border-ice-border rounded">
            <input
              type="checkbox"
              checked={showHiddenOnly}
              onChange={(e) => setShowHiddenOnly(e.target.checked)}
              className="rounded text-cobalt focus:ring-cobalt cursor-pointer"
            />
            <span>Show Hidden Only</span>
          </label>
        </div>

        {/* Action Buttons & Reorder Mode Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsReorderMode(!isReorderMode)}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
              isReorderMode
                ? 'bg-sky-500 text-white shadow-sky-200 font-bold'
                : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200'
            }`}
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>{isReorderMode ? 'Close Shuffle Mode' : 'Shuffle & Reorder Mode'}</span>
          </button>

          <button
            onClick={loadModels}
            disabled={loading}
            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-ink-navy text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            title="Reload from Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync DB</span>
          </button>

          <button
            onClick={handleExportCsv}
            className="px-3 py-2 bg-zinc-100 hover:bg-zinc-200 text-ink-navy text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
            title="Export model overview CSV"
          >
            <Download className="w-3.5 h-3.5 text-cobalt" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExportActiveVariantsCsv}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="Download CSV of all active models with RAM, Storage & Variant Prices"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Active Prices CSV</span>
          </button>

          <button
            onClick={handleStartAdd}
            className="px-4 py-2 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Model</span>
          </button>
        </div>
      </div>

      {/* SERIES TOP BAR NAVIGATION */}
      {availableSeriesList.length > 0 && (
        <div className="bg-canvas-pure border border-ice-border rounded-lg p-2.5 flex items-center gap-2 overflow-x-auto shadow-sm">
          <span className="text-[10px] font-mono uppercase font-bold text-ink-muted flex items-center gap-1 px-2 border-r border-ice-border">
            <Folder className="w-3.5 h-3.5 text-purple-600" />
            <span>Series Top Bar:</span>
          </span>

          <button
            onClick={() => setSelectedSeriesFilter('all')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              selectedSeriesFilter === 'all'
                ? 'bg-cobalt text-white shadow-sm'
                : 'bg-canvas-white text-ink-slate hover:text-ink-navy border border-ice-border hover:border-cobalt/40'
            }`}
          >
            <span>All Series</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              selectedSeriesFilter === 'all' ? 'bg-white/20 text-white' : 'bg-cobalt/10 text-cobalt'
            }`}>
              {filteredModels.length}
            </span>
          </button>

          {availableSeriesList.map((sName) => {
            const count = filteredModels.filter((m) => (m.series || 'Other Models') === sName).length;
            const isSelected = selectedSeriesFilter === sName;
            return (
              <button
                key={sName}
                onClick={() => setSelectedSeriesFilter(sName)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-purple-600 text-white font-bold shadow-sm'
                    : 'bg-canvas-white text-ink-navy border border-ice-border hover:border-purple-300'
                }`}
              >
                <span>{sName}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isSelected ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* SHUFFLE / REORDER STUDIO DRAWER (Interactive Drag & Drop Reordering) */}
      {isReorderMode && (
        <div className="bg-sky-600 text-white border border-sky-400 rounded-xl p-5 shadow-xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 pb-3 border-b border-sky-400/40">
            <div>
              <h3 className="text-base font-bold flex items-center gap-2 text-white">
                <Shuffle className="w-5 h-5 text-sky-200" />
                <span>Catalog Shuffle & Drag-and-Drop Reorder Studio</span>
              </h3>
              <p className="text-xs text-sky-100 mt-0.5 font-mono">
                Drag & drop or use arrow buttons to customize display sequences for Brands, Series, and Individual Models in the public store.
              </p>
            </div>

            {/* Reorder Sub-Tabs */}
            <div className="flex items-center gap-2 bg-sky-900/50 p-1 rounded-lg border border-sky-400/40">
              <button
                onClick={() => setReorderTab('brands')}
                className={`px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  reorderTab === 'brands' ? 'bg-white text-sky-900 font-bold shadow-md' : 'text-sky-100 hover:text-white font-semibold'
                }`}
              >
                <Tag className="w-3.5 h-3.5" />
                <span>1. Brands Order</span>
              </button>
              <button
                onClick={() => setReorderTab('series')}
                className={`px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  reorderTab === 'series' ? 'bg-white text-sky-900 font-bold shadow-md' : 'text-sky-100 hover:text-white font-semibold'
                }`}
              >
                <Folder className="w-3.5 h-3.5" />
                <span>2. Series Order</span>
              </button>
              <button
                onClick={() => setReorderTab('models')}
                className={`px-3 py-1.5 rounded-md text-xs transition-all flex items-center gap-1.5 cursor-pointer ${
                  reorderTab === 'models' ? 'bg-white text-sky-900 font-bold shadow-md' : 'text-sky-100 hover:text-white font-semibold'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>3. Models Order</span>
              </button>
            </div>
          </div>

          {/* TAB 1: BRANDS REORDER */}
          {reorderTab === 'brands' && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-mono text-sky-100">
                <span>Drag brand rows or use up/down arrows to shuffle sequence</span>
                <button
                  onClick={handleShuffleBrands}
                  className="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all border border-sky-400/50"
                >
                  <Shuffle className="w-3 h-3 text-sky-200" />
                  <span>Random Shuffle</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {orderedBrands.map((brand, idx) => (
                  <div
                    key={brand.id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`p-2.5 bg-sky-700/80 border border-sky-400/50 rounded-lg flex items-center justify-between cursor-move hover:border-white transition-all shadow-xs ${
                      draggedIndex === idx ? 'opacity-50 ring-2 ring-white bg-white/20' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="w-4 h-4 text-sky-200 flex-shrink-0" />
                      <span className="w-5 text-center font-mono text-[10px] text-sky-200 font-bold">#{idx + 1}</span>
                      <span className="font-bold text-xs text-white">{brand.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveBrand(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1 hover:bg-sky-500 text-sky-100 hover:text-white rounded disabled:opacity-30 cursor-pointer"
                        title="Move Up"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveBrand(idx, 'down')}
                        disabled={idx === orderedBrands.length - 1}
                        className="p-1 hover:bg-sky-500 text-sky-100 hover:text-white rounded disabled:opacity-30 cursor-pointer"
                        title="Move Down"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-sky-400/40">
                <button
                  onClick={handleResetBrandOrder}
                  className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded text-xs font-bold cursor-pointer flex items-center gap-1 transition-all border border-sky-400/50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
                <button
                  onClick={handleSaveBrandOrder}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-bold shadow-md cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Brand Order</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SERIES REORDER */}
          {reorderTab === 'series' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sky-100 font-semibold">Select Brand to Manage Series:</span>
                  <select
                    value={reorderSeriesBrandId}
                    onChange={(e) => setReorderSeriesBrandId(e.target.value)}
                    className="px-3 py-1.5 bg-sky-800 border border-sky-400 rounded text-xs text-white font-bold cursor-pointer focus:border-white focus:outline-none"
                  >
                    {orderedBrands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleShuffleSeries}
                  className="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto transition-all border border-sky-400/50"
                >
                  <Shuffle className="w-3 h-3 text-sky-200" />
                  <span>Random Shuffle</span>
                </button>
              </div>

              {/* Skip / Hide Series Step Toggle Banner for Brand */}
              <div className="p-3 bg-sky-900/70 border border-sky-400/50 rounded-lg flex items-center justify-between gap-3 text-xs shadow-inner">
                <div>
                  <span className="font-bold text-white block font-outfit text-sm">
                    ⚡ Bypass / Hide Series Step for {orderedBrands.find((b) => b.id === reorderSeriesBrandId)?.name || 'Selected Brand'}
                  </span>
                  <span className="text-[11px] text-sky-100 font-mono leading-relaxed block mt-0.5">
                    When enabled, clicking this brand in the public store skips the series sub-category step and displays all models directly (e.g. Nothing).
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={isBrandSeriesSkipped(reorderSeriesBrandId)}
                    onChange={(e) => {
                      setBrandSkipSeries(reorderSeriesBrandId, e.target.checked);
                      setOrderVersion((v) => v + 1);
                      setSuccessMsg(
                        e.target.checked
                          ? `Series step bypassed for ${orderedBrands.find((b) => b.id === reorderSeriesBrandId)?.name || 'brand'}. Storefront will display all models directly!`
                          : `Series step enabled for ${orderedBrands.find((b) => b.id === reorderSeriesBrandId)?.name || 'brand'}.`
                      );
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-sky-950 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              {orderedSeries.length === 0 ? (
                <p className="text-xs text-sky-200 font-mono italic">No series found for this brand.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {orderedSeries.map((sName, idx) => (
                    <div
                      key={sName}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`p-2.5 bg-sky-700/80 border border-sky-400/50 rounded-lg flex items-center justify-between cursor-move hover:border-white transition-all shadow-xs ${
                        draggedIndex === idx ? 'opacity-50 ring-2 ring-white bg-white/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-sky-200 flex-shrink-0" />
                        <span className="w-5 text-center font-mono text-[10px] text-sky-200 font-bold">#{idx + 1}</span>
                        <span className="font-bold text-xs text-white truncate max-w-[150px]">{sName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleMoveSeries(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:bg-sky-500 text-sky-100 hover:text-white rounded disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveSeries(idx, 'down')}
                          disabled={idx === orderedSeries.length - 1}
                          className="p-1 hover:bg-sky-500 text-sky-100 hover:text-white rounded disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-sky-400/40">
                <button
                  onClick={handleResetSeriesOrder}
                  className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded text-xs font-bold cursor-pointer flex items-center gap-1 transition-all border border-sky-400/50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
                <button
                  onClick={handleSaveSeriesOrder}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-bold shadow-md cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Series Order</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: MODELS REORDER */}
          {reorderTab === 'models' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sky-100 font-semibold">Brand:</span>
                  <select
                    value={reorderModelBrandId}
                    onChange={(e) => {
                      setReorderModelBrandId(e.target.value);
                      setReorderModelSeries('all');
                    }}
                    className="px-3 py-1.5 bg-sky-800 border border-sky-400 rounded text-xs text-white font-bold cursor-pointer focus:border-white focus:outline-none"
                  >
                    {orderedBrands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>

                  <span className="font-mono text-sky-100 font-semibold ml-2">Series:</span>
                  <select
                    value={reorderModelSeries}
                    onChange={(e) => setReorderModelSeries(e.target.value)}
                    className="px-3 py-1.5 bg-sky-800 border border-sky-400 rounded text-xs text-white font-bold cursor-pointer focus:border-white focus:outline-none"
                  >
                    <option value="all">All Series</option>
                    {availableSeriesList.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleShuffleModels}
                  className="px-2.5 py-1 bg-sky-700 hover:bg-sky-800 text-white rounded text-[11px] font-bold flex items-center gap-1 cursor-pointer self-start sm:self-auto transition-all border border-sky-400/50"
                >
                  <Shuffle className="w-3 h-3 text-sky-200" />
                  <span>Random Shuffle</span>
                </button>
              </div>

              {orderedModels.length === 0 ? (
                <p className="text-xs text-sky-200 font-mono italic">No models found for this brand & series filter.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[350px] overflow-y-auto pr-1">
                  {orderedModels.map((model, idx) => (
                    <div
                      key={model.id}
                      draggable
                      onDragStart={() => handleDragStart(idx)}
                      onDragOver={(e) => handleDragOver(e, idx)}
                      onDragEnd={handleDragEnd}
                      className={`p-2 bg-sky-700/80 border border-sky-400/50 rounded-lg flex items-center justify-between cursor-move hover:border-white transition-all shadow-xs ${
                        draggedIndex === idx ? 'opacity-50 ring-2 ring-white bg-white/20' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <GripVertical className="w-4 h-4 text-sky-200 flex-shrink-0" />
                        <span className="w-6 text-center font-mono text-[10px] text-sky-200 font-bold flex-shrink-0">#{idx + 1}</span>
                        <div className="w-8 h-8 bg-sky-900 rounded p-0.5 flex-shrink-0">
                          {model.imageUrl ? (
                            <img src={model.imageUrl} alt={model.name} className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-sky-300 m-auto" />
                          )}
                        </div>
                        <div className="min-w-0 truncate">
                          <span className="font-bold text-xs text-white truncate block">{model.name}</span>
                          <span className="text-[10px] text-sky-200 font-mono block truncate">{model.series || model.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleMoveModel(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 hover:bg-sky-500 text-sky-100 hover:text-white rounded disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveModel(idx, 'down')}
                          disabled={idx === orderedModels.length - 1}
                          className="p-1 hover:bg-sky-500 text-sky-100 hover:text-white rounded disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-sky-400/40">
                <button
                  onClick={handleResetModelOrder}
                  className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded text-xs font-bold cursor-pointer flex items-center gap-1 transition-all border border-sky-400/50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>
                <button
                  onClick={handleSaveModelOrder}
                  className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-bold shadow-md cursor-pointer flex items-center gap-1 transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Model Order</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Model Catalog Grid Grouped by Series */}
      {loading ? (
        <div className="p-12 text-center bg-canvas-white border border-ice-border rounded-lg">
          <RefreshCw className="w-8 h-8 text-cobalt animate-spin mx-auto mb-3" />
          <p className="text-sm font-semibold text-ink-navy">Loading models from database...</p>
        </div>
      ) : filteredModels.length === 0 ? (
        <div className="p-12 text-center bg-canvas-white border border-ice-border rounded-lg">
          <Smartphone className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-ink-navy">No models found</h3>
          <p className="text-xs text-ink-muted mt-1">Try adjusting your search filters or add a new model.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {modelsGroupedBySeries.map((group) => (
            <div key={group.seriesName} className="space-y-3">
              {/* Series Top Bar / Section Banner */}
              <div className="flex items-center justify-between bg-canvas-white border-l-4 border-cobalt border-y border-r border-ice-border px-4 py-2.5 rounded-lg shadow-sm">
                <div className="flex items-center gap-2.5">
                  <Folder className="w-4 h-4 text-cobalt" />
                  <h3 className="font-bold text-sm text-ink-navy tracking-tight">{group.seriesName}</h3>
                  <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-cobalt/10 text-cobalt rounded-full">
                    {group.models.length} {group.models.length === 1 ? 'model' : 'models'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">Series Category</span>
              </div>

              {/* Models Grid in Series */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {group.models.map((model) => {
                  const brand = initialBrands.find((b) => b.id === model.brandId);
                  const storages = model.supportedStorageGb && model.supportedStorageGb.length > 0 ? model.supportedStorageGb : [128, 256, 512];
                  const rams = model.supportedRamGb && model.supportedRamGb.length > 0 ? model.supportedRamGb : [0];
                  const hasRamVariants = !(rams.length === 1 && rams[0] === 0);

                  return (
                    <div
                      key={model.id}
                      className={`bg-canvas-white border rounded-lg p-4 shadow-sm hover:shadow-md transition-all flex flex-col justify-between relative ${
                        model.hidden ? 'border-amber-300 bg-amber-50/20' : 'border-ice-border'
                      }`}
                    >
                      {/* Status & Series Badges */}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 text-[10px] font-bold font-mono uppercase bg-cobalt/10 text-cobalt rounded border border-cobalt/20">
                            {brand?.name || model.brandId}
                          </span>
                          {model.series && (
                            <span className="px-2 py-0.5 text-[10px] font-mono text-purple-700 bg-purple-50 rounded border border-purple-200">
                              {model.series}
                            </span>
                          )}
                          <span className="px-2 py-0.5 text-[10px] font-mono text-zinc-600 bg-zinc-100 rounded">
                            {model.category}
                          </span>
                          <span className={`px-2 py-0.5 text-[10px] font-bold font-mono rounded border ${
                            (model.supportsWarrantyQuestion ?? (model.releaseYear >= 2024))
                              ? 'text-blue-700 bg-blue-50 border-blue-200'
                              : 'text-zinc-600 bg-zinc-100 border-zinc-200'
                          }`}>
                            {(model.supportsWarrantyQuestion ?? (model.releaseYear >= 2024)) ? 'Tier 1 (Warranty Active)' : 'Tier 2 (Matured Baseline)'}
                          </span>

                          {hasSpenSupport(model.brandId, model.name, model.id) && (
                            <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded border text-purple-700 bg-purple-50 border-purple-200 flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-purple-500" />
                              S-Pen
                            </span>
                          )}

                          {getBiometricType(model.brandId, model.name, model.id) !== 'none' && (
                            <span className="px-2 py-0.5 text-[10px] font-bold font-mono rounded border text-indigo-700 bg-indigo-50 border-indigo-200">
                              {getBiometricType(model.brandId, model.name, model.id) === 'face_id' ? 'Face ID' :
                               getBiometricType(model.brandId, model.name, model.id) === 'touch_id' ? 'Touch ID' :
                               'Fingerprint'}
                            </span>
                          )}
                        </div>

                        {model.hidden ? (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded border border-amber-300 flex items-center gap-1">
                            <EyeOff className="w-3 h-3" />
                            Hidden
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 rounded border border-emerald-300 flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            Active
                          </span>
                        )}
                      </div>

                      {/* Model Info Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-14 h-14 bg-zinc-50 border border-ice-border rounded-lg p-1 flex items-center justify-center flex-shrink-0 overflow-hidden">
                          {model.imageUrl ? (
                            <img src={model.imageUrl} alt={model.name} className="w-full h-full object-contain" />
                          ) : (
                            <ImageIcon className="w-6 h-6 text-zinc-300" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-ink-navy leading-tight">{model.name}</h3>
                          <div className="flex items-center gap-2 mt-1 text-xs text-ink-muted font-mono">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-zinc-400" />
                              Year: {model.releaseYear || 'N/A'}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-400 block mt-0.5">ID: {model.id}</span>
                        </div>
                      </div>

                      {/* Storage & RAM Badges */}
                      <div className="space-y-2 bg-canvas-pure p-3 rounded-lg border border-ice-border/80 mb-4 text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-ink-slate">
                          <HardDrive className="w-3.5 h-3.5 text-cobalt flex-shrink-0" />
                          <span className="font-bold">Storage Tiers:</span>
                          <div className="flex flex-wrap gap-1 ml-1">
                            {storages.map((s) => (
                              <span key={s} className="px-1.5 py-0.5 bg-white border border-ice-border rounded font-bold text-[10px] text-ink-navy">
                                {s >= 1024 ? `${s / 1024}TB` : `${s}GB`}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-ink-slate">
                          <Cpu className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />
                          <span className="font-bold">RAM Tiers:</span>
                          <div className="flex flex-wrap gap-1 ml-1">
                            {hasRamVariants ? (
                              rams.map((r) => (
                                <span key={r} className="px-1.5 py-0.5 bg-purple-50 border border-purple-200 rounded font-bold text-[10px] text-purple-700">
                                  {r}GB
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-zinc-400 font-normal">None (Apple / Fixed)</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-ice-border/60">
                          <span className="text-[11px] font-bold text-ink-muted">Base Price (₹):</span>
                          <span className="text-sm font-extrabold text-emerald-700">{formatPrice(model.basePrice128GB)}</span>
                        </div>
                        {isTabletDevice(model.brandId, model.name, model.id) && (
                          <div className="flex items-center justify-between pt-1 border-t border-ice-border/40 text-[10px] font-mono">
                            <span className="text-zinc-500 font-semibold flex items-center gap-1">
                              <Radio className="w-3 h-3 text-blue-600" />
                              <span>Dual Connectivity:</span>
                            </span>
                            <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              Wi-Fi &amp; Cellular
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Card Action Toolbar */}
                      <div className="flex items-center gap-2 pt-2 border-t border-ice-border">
                        <button
                          onClick={() => handleStartEdit(model)}
                          className="flex-1 py-1.5 px-2 bg-cobalt/10 hover:bg-cobalt/20 text-cobalt text-xs font-bold rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          <span>Edit Specs & Prices</span>
                        </button>

                        <button
                          onClick={() => handleToggleHidden(model)}
                          className="p-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded transition-all cursor-pointer"
                          title={model.hidden ? 'Show Model in Public Store' : 'Hide Model from Store'}
                        >
                          {model.hidden ? <Eye className="w-4 h-4 text-emerald-600" /> : <EyeOff className="w-4 h-4 text-amber-600" />}
                        </button>

                        <button
                          onClick={() => handleDeleteModel(model)}
                          className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded transition-all cursor-pointer"
                          title="Delete Model"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit / Create Model Modal */}
      <EditSpecsAndPricesModal
        isOpen={Boolean(editingModel || isAddingNew)}
        model={editingModel}
        catalogCategory={category}
        isAddingNew={isAddingNew}
        brands={orderedBrands.length > 0 ? orderedBrands : initialBrands}
        models={models}
        existingSeries={availableSeriesList}
        onClose={() => {
          setEditingModel(null);
          setIsAddingNew(false);
        }}
        onSaveSuccess={async () => {
          setSuccessMsg(
            isAddingNew
              ? 'Model added successfully to database!'
              : `Model "${editingModel?.name || ''}" updated successfully in database!`
          );
          setEditingModel(null);
          setIsAddingNew(false);
          await loadModels();
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};

export function generateCashifyVariantUrl(
  brandName: string,
  modelName: string,
  ramGb: number,
  storageGb: number,
  connectivity?: 'wifi' | 'cellular'
): string {
  const brandLower = (brandName || '').toLowerCase().trim();
  let modelLower = (modelName || '').toLowerCase().trim();

  // Strip brand prefix if already part of modelName
  if (brandLower && modelLower.startsWith(brandLower)) {
    modelLower = modelLower.slice(brandLower.length).trim();
  }

  const slugify = (text: string) => {
    return text
      .toLowerCase()
      .replace(/\+/g, '-plus')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const isApple = brandLower === 'apple' || modelLower.includes('iphone') || modelLower.includes('ipad');
  const isTablet = modelLower.includes('ipad') || modelLower.includes('tab');
  const brandSlug = isApple ? 'apple' : slugify(brandName || 'phone');
  let cleanModelSlug = slugify(modelLower);

  if (isTablet && connectivity) {
    if (connectivity === 'wifi' && !cleanModelSlug.includes('wi-fi') && !cleanModelSlug.includes('wifi')) {
      cleanModelSlug += '-wi-fi';
    } else if (connectivity === 'cellular' && !cleanModelSlug.includes('cellular')) {
      cleanModelSlug += '-wi-fi-cellular';
    }
  }

  const storageSuffix = storageGb >= 1024 ? `${storageGb / 1024}-tb` : `${storageGb}-gb`;

  let baseSlug = '';
  if (isApple) {
    baseSlug = `used-apple-${cleanModelSlug}`;
  } else {
    baseSlug = `used-${brandSlug}-${cleanModelSlug}`;
  }

  if (isApple || ramGb === 0) {
    return `https://www.cashify.in/sell-old-mobile-phone/${baseSlug}-${storageSuffix}`;
  } else {
    return `https://www.cashify.in/sell-old-mobile-phone/${baseSlug}-${ramGb}-gb-${storageSuffix}`;
  }
}

export function predictCashifyVariantPrice(
  brandId: string,
  name: string,
  category: 'flagship' | 'premium' | 'midrange' | 'budget',
  releaseYear: number,
  ramGb: number,
  storageGb: number,
  basePriceAnchor?: number
): number {
  try {
    const baseStoragePrice = predictCashifyPrice(brandId, name, category, releaseYear, storageGb);
    if (baseStoragePrice && baseStoragePrice > 0) {
      const isApple = brandId.toLowerCase().includes('apple') || name.toLowerCase().includes('iphone');
      const ramAdd = isApple ? 0 : ramGb >= 16 ? 1500 : ramGb >= 12 ? 1000 : ramGb >= 8 ? 500 : 0;
      return Math.round(baseStoragePrice + ramAdd);
    }
  } catch {
    // Fallback if prediction fails or unknown model
  }
  const anchor = basePriceAnchor && basePriceAnchor > 0 ? basePriceAnchor : 25000;
  const storageMult = storageGb >= 1024 ? 1.35 : storageGb === 512 ? 1.25 : storageGb === 256 ? 1.12 : 1.0;
  const ramAdd = ramGb >= 16 ? 1500 : ramGb >= 12 ? 1000 : ramGb >= 8 ? 500 : 0;
  return Math.round((anchor * storageMult + ramAdd) / 1.03);
}

export interface EditSpecsAndPricesModalProps {
  isOpen: boolean;
  model: Model | null;
  catalogCategory?: 'smartphones' | 'tablets' | 'smartwatches';
  isAddingNew?: boolean;
  brands?: Brand[];
  models?: Model[];
  existingSeries?: string[];
  highlightVariant?: { ram: number; storage: number } | null;
  cashifyPrices?: Record<string, number>;
  onClose: () => void;
  onSaveSuccess: (savedModel?: any) => void;
}

export const EditSpecsAndPricesModal: React.FC<EditSpecsAndPricesModalProps> = ({
  isOpen,
  model,
  catalogCategory,
  isAddingNew = false,
  brands = [],
  models = [],
  existingSeries,
  highlightVariant,
  cashifyPrices,
  onClose,
  onSaveSuccess,
}) => {
  const availableBrands = brands.length > 0 ? brands : BRANDS;
  const [allModels, setAllModels] = useState<Model[]>(models || []);

  useEffect(() => {
    if (models && models.length > 0) {
      setAllModels(models);
    } else if (isOpen) {
      fetchModels(undefined, undefined, true)
        .then((m) => setAllModels(m as Model[]))
        .catch(() => {});
    }
  }, [models, isOpen]);

  const [formData, setFormData] = useState<{
    id: string;
    legacyId: string;
    brandId: string;
    name: string;
    category: 'flagship' | 'premium' | 'midrange' | 'budget';
    releaseYear: number;
    basePrice128GB: number;
    series: string;
    imageUrl: string;
    supportedStorageGb: number[];
    supportedRamGb: number[];
    variantPrices: Record<string, number>;
    hidden: boolean;
    supportsWarrantyQuestion: boolean;
  }>({
    id: '',
    legacyId: '',
    brandId: availableBrands[0]?.id || 'brand-apple',
    name: '',
    category: 'premium',
    releaseYear: new Date().getFullYear(),
    basePrice128GB: 30000,
    series: '',
    imageUrl: '',
    supportedStorageGb: [128, 256, 512],
    supportedRamGb: [0],
    variantPrices: {},
    hidden: false,
    supportsWarrantyQuestion: true,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Series selection mode: false = dropdown from existing, true = manual text input
  const [isCustomSeriesInput, setIsCustomSeriesInput] = useState(false);

  const resolvedCategory =
    catalogCategory ||
    (model
      ? isSmartwatchDevice(model.brandId, model.name, model.id)
        ? 'smartwatches'
        : isTabletDevice(model.brandId, model.name, model.id)
        ? 'tablets'
        : 'smartphones'
      : 'smartphones');

  const isTablet =
    resolvedCategory === 'tablets' ||
    isTabletDevice(formData.brandId, formData.name, formData.id);
  const isAppleTablet =
    isTablet &&
    (formData.brandId === 'brand-apple' || formData.name.toLowerCase().includes('ipad'));

  const matchesCatalogCategory = (
    brandId?: string,
    modelName?: string,
    modelId?: string,
    seriesName?: string
  ): boolean => {
    const sLower = (seriesName || '').toLowerCase();
    const mLower = (modelName || '').toLowerCase();

    if (resolvedCategory === 'smartphones') {
      if (sLower.includes('watch') || mLower.includes('watch')) return false;
      if (sLower.includes('ipad') || mLower.includes('ipad')) return false;
      if (sLower.includes('tab') && !sLower.includes('ultra')) return false;
      return !isTabletDevice(brandId, modelName, modelId) && !isSmartwatchDevice(brandId, modelName, modelId);
    }

    if (resolvedCategory === 'tablets') {
      if (sLower.includes('watch') || mLower.includes('watch')) return false;
      if (sLower.includes('iphone') || mLower.includes('iphone')) return false;
      return isTabletDevice(brandId, modelName, modelId) || sLower.includes('ipad') || sLower.includes('tab');
    }

    if (resolvedCategory === 'smartwatches') {
      if (sLower.includes('ipad') || sLower.includes('tab')) return false;
      if (sLower.includes('iphone') || mLower.includes('iphone')) return false;
      return isSmartwatchDevice(brandId, modelName, modelId) || sLower.includes('watch');
    }

    return true;
  };

  // Calculate existing series for the currently selected brand and catalogue category
  const brandExistingSeries = useMemo(() => {
    const seriesSet = new Set<string>();

    // 1. From database models matching category
    (allModels || []).forEach((m) => {
      if (m.brandId === formData.brandId && m.series && m.series.trim()) {
        if (matchesCatalogCategory(m.brandId, m.name, m.id, m.series)) {
          seriesSet.add(m.series.trim());
        }
      }
    });

    // 2. From default series order for this brand (smartphones only)
    if (resolvedCategory === 'smartphones') {
      const defaults = DEFAULT_SERIES_ORDER[formData.brandId] || [];
      defaults.forEach((s) => {
        if (s && s.trim() && matchesCatalogCategory(formData.brandId, undefined, undefined, s)) {
          seriesSet.add(s.trim());
        }
      });
    }

    // 3. From explicit existingSeries prop if passed
    if (existingSeries) {
      existingSeries.forEach((s) => {
        if (s && s.trim() && matchesCatalogCategory(formData.brandId, undefined, undefined, s)) {
          seriesSet.add(s.trim());
        }
      });
    }

    const rawList = Array.from(seriesSet);
    return applySeriesOrder(formData.brandId, rawList);
  }, [allModels, existingSeries, formData.brandId, resolvedCategory]);

  // Cashify variant links, live benchmark prices & approval states
  const [variantCashifyUrls, setVariantCashifyUrls] = useState<Record<string, string>>({});
  const [manuallyEditedUrls, setManuallyEditedUrls] = useState<Record<string, boolean>>({});
  const [variantCashifyPrices, setVariantCashifyPrices] = useState<Record<string, number>>({});
  const [variantApproved, setVariantApproved] = useState<Record<string, boolean>>({});
  const [editingUrlKey, setEditingUrlKey] = useState<string | null>(null);
  const [tempUrlInput, setTempUrlInput] = useState<string>('');
  const [testingUrlKey, setTestingUrlKey] = useState<string | null>(null);
  const [urlTestResults, setUrlTestResults] = useState<
    Record<string, { ok: boolean; status: number; extractedPrice?: number | null; error?: string; is404?: boolean; isUnserviceable?: boolean }>
  >({});
  const [extractedCashifyPrices, setExtractedCashifyPrices] = useState<Record<string, number>>({});
  const [isVerifyingAll, setIsVerifyingAll] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) return;

    if (model) {
      const sVal = model.series || '';
      setFormData({
        id: model.id,
        legacyId: (model as any).legacyId || model.id,
        brandId: model.brandId || availableBrands[0]?.id || 'brand-apple',
        name: model.name,
        category: model.category || 'premium',
        releaseYear: model.releaseYear || new Date().getFullYear(),
        basePrice128GB: model.basePrice128GB || 0,
        series: sVal,
        imageUrl: model.imageUrl || '',
        supportedStorageGb:
          model.supportedStorageGb && model.supportedStorageGb.length > 0
            ? [...model.supportedStorageGb]
            : [128, 256, 512],
        supportedRamGb:
          model.supportedRamGb && model.supportedRamGb.length > 0
            ? [...model.supportedRamGb]
            : [0],
        variantPrices: model.variantPrices ? { ...model.variantPrices } : {},
        hidden: Boolean(model.hidden),
        supportsWarrantyQuestion:
          model.supportsWarrantyQuestion ?? ((model.releaseYear || 2024) >= 2023),
      });
      setIsCustomSeriesInput(Boolean(sVal && !brandExistingSeries.includes(sVal)));
      setUrlTestResults({});
      setExtractedCashifyPrices({});
      setError(null);
    } else if (isAddingNew) {
      setFormData({
        id: '',
        legacyId: '',
        brandId: availableBrands[0]?.id || 'brand-apple',
        name: '',
        category: 'premium',
        releaseYear: new Date().getFullYear(),
        basePrice128GB: 30000,
        series: '',
        imageUrl: '',
        supportedStorageGb: [128, 256, 512],
        supportedRamGb: [0],
        variantPrices: {},
        hidden: false,
        supportsWarrantyQuestion: true,
      });
      setIsCustomSeriesInput(false);
      setVariantApproved({});
      setVariantCashifyUrls({});
      setVariantCashifyPrices({});
      setManuallyEditedUrls({});
      setUrlTestResults({});
      setExtractedCashifyPrices({});
      setError(null);
    }
  }, [isOpen, model, isAddingNew, availableBrands]);

  // Auto-generate Cashify URLs and benchmark prices for variants
  useEffect(() => {
    if (!isOpen) return;

    const brandObj = availableBrands.find((b) => b.id === formData.brandId);
    const brandName = brandObj ? brandObj.name : 'Apple';

    const validRams =
      formData.supportedRamGb.length === 1 && formData.supportedRamGb[0] === 0
        ? [0]
        : formData.supportedRamGb;

    setVariantCashifyUrls((prevUrls) => {
      const nextUrls = { ...prevUrls };
      validRams.forEach((ram) => {
        formData.supportedStorageGb.forEach((storage) => {
          const key = `${ram}_${storage}`;
          if (isTablet) {
            const cellKey = `${key}_cellular`;
            const wifiKey = `${key}_wifi`;
            if (!nextUrls[cellKey] || !manuallyEditedUrls[cellKey]) {
              nextUrls[cellKey] = generateCashifyVariantUrl(brandName, formData.name, ram, storage, 'cellular');
            }
            if (!nextUrls[wifiKey] || !manuallyEditedUrls[wifiKey]) {
              nextUrls[wifiKey] = generateCashifyVariantUrl(brandName, formData.name, ram, storage, 'wifi');
            }
          }
          if (!nextUrls[key] || !manuallyEditedUrls[key]) {
            nextUrls[key] = generateCashifyVariantUrl(brandName, formData.name, ram, storage);
          }
        });
      });
      return nextUrls;
    });

    setVariantCashifyPrices((prevPrices) => {
      const nextPrices = { ...prevPrices };
      validRams.forEach((ram) => {
        formData.supportedStorageGb.forEach((storage) => {
          const key = `${ram}_${storage}`;
          const defaultPredicted = predictCashifyVariantPrice(
            formData.brandId,
            formData.name,
            formData.category,
            formData.releaseYear,
            ram,
            storage,
            formData.basePrice128GB
          );
          if (isTablet) {
            const cellKey = `${key}_cellular`;
            const wifiKey = `${key}_wifi`;
            if (!nextPrices[cellKey]) {
              nextPrices[cellKey] = (cashifyPrices && cashifyPrices[cellKey]) || defaultPredicted;
            }
            if (!nextPrices[wifiKey]) {
              nextPrices[wifiKey] = (cashifyPrices && cashifyPrices[wifiKey]) || defaultPredicted;
            }
          }
          if (!nextPrices[key]) {
            if (cashifyPrices && cashifyPrices[key] && cashifyPrices[key] > 0) {
              nextPrices[key] = cashifyPrices[key];
            } else {
              nextPrices[key] = defaultPredicted;
            }
          }
        });
      });
      return nextPrices;
    });
  }, [
    isOpen,
    formData.name,
    formData.brandId,
    formData.supportedStorageGb,
    formData.supportedRamGb,
    formData.category,
    formData.releaseYear,
    formData.basePrice128GB,
    availableBrands,
    cashifyPrices,
    manuallyEditedUrls,
  ]);

  if (!isOpen) return null;

  const handleToggleStorageGb = (gb: number) => {
    setFormData((prev) => {
      const exists = prev.supportedStorageGb.includes(gb);
      const nextStorage = exists
        ? prev.supportedStorageGb.filter((s) => s !== gb)
        : [...prev.supportedStorageGb, gb].sort((a, b) => a - b);
      if (nextStorage.length === 0) return prev;
      return { ...prev, supportedStorageGb: nextStorage };
    });
  };

  const handleToggleRamGb = (gb: number) => {
    setFormData((prev) => {
      const exists = prev.supportedRamGb.includes(gb);
      let nextRam: number[];
      if (gb === 0) {
        nextRam = [0];
      } else {
        nextRam = exists
          ? prev.supportedRamGb.filter((r) => r !== gb && r !== 0)
          : [...prev.supportedRamGb.filter((r) => r !== 0), gb].sort((a, b) => a - b);
        if (nextRam.length === 0) nextRam = [0];
      }
      return { ...prev, supportedRamGb: nextRam };
    });
  };

  const handleToggleVariant = (ram: number, storage: number, enable: boolean) => {
    const key = `${ram}_${storage}`;
    setFormData((prev) => {
      const nextMap = { ...prev.variantPrices };
      if (!enable) {
        delete nextMap[key];
        delete nextMap[`${key}_cellular`];
        delete nextMap[`${key}_wifi`];
      } else {
        const baseAnchor = prev.basePrice128GB || 10000;
        const storageMult = storage >= 1024 ? 1.35 : storage === 512 ? 1.25 : storage === 256 ? 1.12 : 1.0;
        const ramAdd = ram >= 16 ? 1500 : ram >= 12 ? 1000 : ram >= 8 ? 500 : 0;
        const calcPrice = Math.round(baseAnchor * storageMult + ramAdd);
        nextMap[key] = calcPrice;
        if (isTablet) {
          nextMap[`${key}_cellular`] = calcPrice;
          const wifiCPrice = variantCashifyPrices[`${key}_wifi`];
          nextMap[`${key}_wifi`] = wifiCPrice ? Math.round(wifiCPrice * 1.03) : calcPrice;
        }
      }
      return { ...prev, variantPrices: nextMap };
    });
  };

  const handleVariantPriceChange = (ram: number, storage: number, valStr: string) => {
    const key = `${ram}_${storage}`;
    const price = parseInt(valStr, 10);
    setFormData((prev) => {
      const nextMap = { ...prev.variantPrices };
      nextMap[key] = isNaN(price) ? 0 : price;
      const activePrices = Object.values(nextMap).filter(
        (v): v is number => typeof v === 'number' && v > 0
      );
      const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : prev.basePrice128GB;
      return { ...prev, variantPrices: nextMap, basePrice128GB: minPrice };
    });
  };

  const handleTabletConnectivityPriceChange = (
    ram: number,
    storage: number,
    conn: 'cellular' | 'wifi',
    valStr: string
  ) => {
    const connKey = `${ram}_${storage}_${conn}`;
    const baseKey = `${ram}_${storage}`;
    const price = parseInt(valStr, 10);
    const cleanPrice = isNaN(price) ? 0 : price;

    setFormData((prev) => {
      const nextMap = { ...prev.variantPrices };
      nextMap[connKey] = cleanPrice;
      if (conn === 'cellular') {
        nextMap[baseKey] = cleanPrice;
      }
      const activePrices = Object.values(nextMap).filter(
        (v): v is number => typeof v === 'number' && v > 0
      );
      const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : prev.basePrice128GB;
      return { ...prev, variantPrices: nextMap, basePrice128GB: minPrice };
    });
  };

  const handleApproveConnectivityVariant = (
    ram: number,
    storage: number,
    conn: 'cellular' | 'wifi'
  ) => {
    const connKey = `${ram}_${storage}_${conn}`;
    const baseKey = `${ram}_${storage}`;
    const cPrice =
      variantCashifyPrices[connKey] ||
      variantCashifyPrices[baseKey] ||
      predictCashifyVariantPrice(
        formData.brandId,
        formData.name,
        formData.category,
        formData.releaseYear,
        ram,
        storage,
        formData.basePrice128GB
      );
    const targetPlus3Price = Math.round(cPrice * 1.03);

    setVariantApproved((prev) => ({ ...prev, [connKey]: true }));

    setFormData((prev) => {
      const nextMap = { ...prev.variantPrices, [connKey]: targetPlus3Price };
      if (conn === 'cellular') {
        nextMap[baseKey] = targetPlus3Price;
      }
      const activePrices = Object.values(nextMap).filter(
        (v): v is number => typeof v === 'number' && v > 0
      );
      const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : prev.basePrice128GB;
      return { ...prev, variantPrices: nextMap, basePrice128GB: minPrice };
    });
  };

  const handleRevokeConnectivityApproval = (
    ram: number,
    storage: number,
    conn: 'cellular' | 'wifi'
  ) => {
    const connKey = `${ram}_${storage}_${conn}`;
    setVariantApproved((prev) => ({ ...prev, [connKey]: false }));
  };

  const handleConnectivityCashifyPriceChange = (
    ram: number,
    storage: number,
    conn: 'cellular' | 'wifi',
    valStr: string
  ) => {
    const connKey = `${ram}_${storage}_${conn}`;
    const baseKey = `${ram}_${storage}`;
    const price = parseInt(valStr, 10);
    const cleanPrice = isNaN(price) ? 0 : price;
    setVariantCashifyPrices((prev) => ({ ...prev, [connKey]: cleanPrice }));

    // If already approved, auto-recalculate Rephonix price with +3%
    if (variantApproved[connKey] && cleanPrice > 0) {
      const targetPlus3Price = Math.round(cleanPrice * 1.03);
      setFormData((prev) => {
        const nextMap = { ...prev.variantPrices, [connKey]: targetPlus3Price };
        if (conn === 'cellular') {
          nextMap[baseKey] = targetPlus3Price;
        }
        const activePrices = Object.values(nextMap).filter(
          (v): v is number => typeof v === 'number' && v > 0
        );
        const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : prev.basePrice128GB;
        return { ...prev, variantPrices: nextMap, basePrice128GB: minPrice };
      });
    }
  };

  const handleApproveVariant = (ram: number, storage: number) => {
    const key = `${ram}_${storage}`;
    const cPrice =
      variantCashifyPrices[key] ||
      predictCashifyVariantPrice(
        formData.brandId,
        formData.name,
        formData.category,
        formData.releaseYear,
        ram,
        storage,
        formData.basePrice128GB
      );
    const targetPlus3Price = Math.round(cPrice * 1.03);

    setVariantApproved((prev) => ({ ...prev, [key]: true }));

    // Automatically apply +3% to Rephonix price for this specific variant
    setFormData((prev) => {
      const nextMap = { ...prev.variantPrices, [key]: targetPlus3Price };
      if (isTablet) {
        nextMap[`${key}_cellular`] = targetPlus3Price;
        const wifiCPrice = variantCashifyPrices[`${key}_wifi`] || cPrice;
        nextMap[`${key}_wifi`] = Math.round(wifiCPrice * 1.03);
      }
      const activePrices = Object.values(nextMap).filter(
        (v): v is number => typeof v === 'number' && v > 0
      );
      const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : prev.basePrice128GB;
      return { ...prev, variantPrices: nextMap, basePrice128GB: minPrice };
    });
  };

  const handleRevokeApproval = (ram: number, storage: number) => {
    const key = `${ram}_${storage}`;
    setVariantApproved((prev) => ({ ...prev, [key]: false }));
  };

  const handleApproveAllVariants = () => {
    const nextApproved: Record<string, boolean> = { ...variantApproved };
    const nextPrices: Record<string, number> = { ...formData.variantPrices };

    const validRams =
      formData.supportedRamGb.length === 1 && formData.supportedRamGb[0] === 0
        ? [0]
        : formData.supportedRamGb;

    validRams.forEach((ram) => {
      formData.supportedStorageGb.forEach((storage) => {
        const key = `${ram}_${storage}`;
        const defaultPrice = predictCashifyVariantPrice(
          formData.brandId,
          formData.name,
          formData.category,
          formData.releaseYear,
          ram,
          storage,
          formData.basePrice128GB
        );

        if (isTablet) {
          const cellKey = `${key}_cellular`;
          const wifiKey = `${key}_wifi`;
          nextApproved[cellKey] = true;
          nextApproved[wifiKey] = true;
          nextApproved[key] = true;

          const cellPrice = variantCashifyPrices[cellKey] || defaultPrice;
          const wifiPrice = variantCashifyPrices[wifiKey] || defaultPrice;

          const cellApprovedPrice = Math.round(cellPrice * 1.03);
          const wifiApprovedPrice = Math.round(wifiPrice * 1.03);

          nextPrices[cellKey] = cellApprovedPrice;
          nextPrices[wifiKey] = wifiApprovedPrice;
          nextPrices[key] = cellApprovedPrice;
        } else {
          nextApproved[key] = true;
          const cPrice = variantCashifyPrices[key] || defaultPrice;
          const approvedPrice = Math.round(cPrice * 1.03);
          nextPrices[key] = approvedPrice;
        }
      });
    });

    setVariantApproved(nextApproved);
    setFormData((prev) => {
      const activePrices = Object.values(nextPrices).filter(
        (v): v is number => typeof v === 'number' && v > 0
      );
      const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : prev.basePrice128GB;
      return { ...prev, variantPrices: nextPrices, basePrice128GB: minPrice };
    });
  };

  const handleCashifyPriceChange = (ram: number, storage: number, valStr: string) => {
    const key = `${ram}_${storage}`;
    const price = parseInt(valStr, 10);
    const cleanPrice = isNaN(price) ? 0 : price;
    setVariantCashifyPrices((prev) => ({ ...prev, [key]: cleanPrice }));

    // If already approved, auto-recalculate Rephonix price with +3%
    if (variantApproved[key] && cleanPrice > 0) {
      const targetPlus3Price = Math.round(cleanPrice * 1.03);
      setFormData((prev) => {
        const nextMap = { ...prev.variantPrices, [key]: targetPlus3Price };
        const activePrices = Object.values(nextMap).filter(
          (v): v is number => typeof v === 'number' && v > 0
        );
        const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : prev.basePrice128GB;
        return { ...prev, variantPrices: nextMap, basePrice128GB: minPrice };
      });
    }
  };

  const handleSaveEditedUrl = (key: string) => {
    if (tempUrlInput.trim()) {
      setVariantCashifyUrls((prev) => ({ ...prev, [key]: tempUrlInput.trim() }));
      setManuallyEditedUrls((prev) => ({ ...prev, [key]: true }));
    }
    setEditingUrlKey(null);
  };

  const handleTestUrl = async (key: string, url: string) => {
    if (!url) return;
    setTestingUrlKey(key);
    try {
      const res = await testCashifyUrlApi(url);
      setUrlTestResults((prev) => ({
        ...prev,
        [key]: {
          ok: res.ok,
          status: res.status,
          extractedPrice: res.extractedPrice,
          error: res.error,
          is404: res.is404,
          isUnserviceable: res.isUnserviceable,
        },
      }));

      // If price was successfully extracted from Cashify, auto-update Cashify Listed price and Target (+3%)
      if (res.ok && res.extractedPrice && res.extractedPrice > 0) {
        const livePrice = res.extractedPrice;
        setExtractedCashifyPrices((prev) => ({ ...prev, [key]: livePrice }));
        setVariantCashifyPrices((prev) => ({ ...prev, [key]: livePrice }));

        // If this variant is already approved, immediately update Rephonix payout price with +3%
        if (variantApproved[key]) {
          const targetPlus3Price = Math.round(livePrice * 1.03);
          setFormData((prev) => {
            const nextMap = { ...prev.variantPrices, [key]: targetPlus3Price };
            if (key.endsWith('_cellular')) {
              const baseKey = key.replace('_cellular', '');
              nextMap[baseKey] = targetPlus3Price;
            }
            const activePrices = Object.values(nextMap).filter(
              (v): v is number => typeof v === 'number' && v > 0
            );
            const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : prev.basePrice128GB;
            return { ...prev, variantPrices: nextMap, basePrice128GB: minPrice };
          });
        }
      }
    } catch {
      setUrlTestResults((prev) => ({ ...prev, [key]: { ok: false, status: 0 } }));
    } finally {
      setTestingUrlKey(null);
    }
  };

  const handleVerifyAllUrls = async () => {
    setIsVerifyingAll(true);
    const validRams =
      formData.supportedRamGb.length === 1 && formData.supportedRamGb[0] === 0
        ? [0]
        : formData.supportedRamGb;

    const tasks: { key: string; url: string }[] = [];
    validRams.forEach((ram) => {
      formData.supportedStorageGb.forEach((storage) => {
        const key = `${ram}_${storage}`;
        if (isTablet) {
          const cellKey = `${key}_cellular`;
          const wifiKey = `${key}_wifi`;
          if (variantCashifyUrls[cellKey]) tasks.push({ key: cellKey, url: variantCashifyUrls[cellKey] });
          if (variantCashifyUrls[wifiKey]) tasks.push({ key: wifiKey, url: variantCashifyUrls[wifiKey] });
        } else {
          const url = variantCashifyUrls[key];
          if (url) tasks.push({ key, url });
        }
      });
    });

    await Promise.allSettled(
      tasks.map(async ({ key, url }) => {
        try {
          const res = await testCashifyUrlApi(url);
          setUrlTestResults((prev) => ({
            ...prev,
            [key]: {
              ok: res.ok,
              status: res.status,
              extractedPrice: res.extractedPrice,
              error: res.error,
              is404: res.is404,
              isUnserviceable: res.isUnserviceable,
            },
          }));
          if (res.ok && res.extractedPrice && res.extractedPrice > 0) {
            const livePrice = res.extractedPrice;
            setExtractedCashifyPrices((prev) => ({ ...prev, [key]: livePrice }));
            setVariantCashifyPrices((prev) => ({ ...prev, [key]: livePrice }));

            if (variantApproved[key]) {
              const targetPlus3Price = Math.round(livePrice * 1.03);
              setFormData((prev) => {
                const nextMap = { ...prev.variantPrices, [key]: targetPlus3Price };
                if (key.endsWith('_cellular')) {
                  const baseKey = key.replace('_cellular', '');
                  nextMap[baseKey] = targetPlus3Price;
                }
                const activePrices = Object.values(nextMap).filter(
                  (v): v is number => typeof v === 'number' && v > 0
                );
                const minPrice = activePrices.length > 0 ? Math.min(...activePrices) : prev.basePrice128GB;
                return { ...prev, variantPrices: nextMap, basePrice128GB: minPrice };
              });
            }
          }
        } catch {
          setUrlTestResults((prev) => ({ ...prev, [key]: { ok: false, status: 0 } }));
        }
      })
    );
    setIsVerifyingAll(false);
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setError('Image file must be under 2MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData((prev) => ({ ...prev, imageUrl: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Model name is required');
      return;
    }
    if (!formData.brandId) {
      setError('Brand is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const legacyId = isAddingNew
        ? formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
        : formData.legacyId || formData.id;

      const cleanedVariantPrices: Record<string, number> = {};
      const validRams =
        formData.supportedRamGb && formData.supportedRamGb.length > 0
          ? formData.supportedRamGb
          : [0];
      const validStorages =
        formData.supportedStorageGb && formData.supportedStorageGb.length > 0
          ? formData.supportedStorageGb
          : [128];

      Object.entries(formData.variantPrices || {}).forEach(([k, v]) => {
        const parts = k.split('_');
        const r = Number(parts[0]);
        const s = Number(parts[1]);
        if (typeof v === 'number' && v > 0 && validRams.includes(r) && validStorages.includes(s)) {
          cleanedVariantPrices[k] = v;
        }
      });

      const payload = {
        legacyId,
        brandId: formData.brandId,
        name: formData.name.trim(),
        category: formData.category,
        deviceType: catalogCategory || 'smartphones',
        releaseYear: Number(formData.releaseYear),
        basePrice128GB: Number(formData.basePrice128GB),
        series: formData.series.trim(),
        imageUrl: formData.imageUrl.trim(),
        supportedStorageGb: formData.supportedStorageGb,
        supportedRamGb: formData.supportedRamGb,
        variantPrices: cleanedVariantPrices,
        hidden: formData.hidden,
        supportsWarrantyQuestion: formData.supportsWarrantyQuestion,
      };

      let result;
      if (isAddingNew) {
        result = await createModel(payload);
      } else {
        result = await updateModel(legacyId, payload);
      }

      // Register all approved or customized Cashify variant URLs for immediate monitoring & extraction
      const approvedVariantsPayload: Array<{
        ramGb: number;
        storageGb: number;
        url: string;
        extractedPrice?: number | null;
        rephonixPrice?: number | null;
      }> = [];

      validRams.forEach((ram) => {
        validStorages.forEach((storage) => {
          const key = `${ram}_${storage}`;
          if (isTablet) {
            (['cellular', 'wifi'] as const).forEach((conn) => {
              const connKey = `${key}_${conn}`;
              const url = variantCashifyUrls[connKey];
              if (url && (variantApproved[connKey] || manuallyEditedUrls[connKey] || urlTestResults[connKey]?.ok)) {
                const extPrice =
                  extractedCashifyPrices[connKey] ||
                  urlTestResults[connKey]?.extractedPrice ||
                  variantCashifyPrices[connKey] ||
                  null;
                const repPrice =
                  cleanedVariantPrices[connKey] ||
                  cleanedVariantPrices[key] ||
                  Number(formData.basePrice128GB) ||
                  null;

                approvedVariantsPayload.push({
                  ramGb: ram,
                  storageGb: storage,
                  url,
                  extractedPrice: extPrice,
                  rephonixPrice: repPrice,
                });
              }
            });
          } else {
            const url = variantCashifyUrls[key];
            if (url && (variantApproved[key] || manuallyEditedUrls[key] || urlTestResults[key]?.ok)) {
              const extPrice =
                extractedCashifyPrices[key] ||
                urlTestResults[key]?.extractedPrice ||
                variantCashifyPrices[key] ||
                null;
              const repPrice =
                cleanedVariantPrices[key] ||
                Number(formData.basePrice128GB) ||
                null;

              approvedVariantsPayload.push({
                ramGb: ram,
                storageGb: storage,
                url,
                extractedPrice: extPrice,
                rephonixPrice: repPrice,
              });
            }
          }
        });
      });

      if (approvedVariantsPayload.length > 0) {
        const brandObj = availableBrands.find((b: Brand) => b.id === formData.brandId);
        try {
          await registerApprovedCashifyVariants({
            modelId: (result as any)?.dbId || (result as any)?.id,
            legacyId: (result as any)?.legacyId || legacyId,
            modelName: (result as any)?.name || formData.name.trim(),
            brandName: brandObj?.name || 'Unknown',
            variants: approvedVariantsPayload,
          });
        } catch (regErr) {
          console.warn('Failed to register approved Cashify variants for monitoring:', regErr);
        }
      }

      window.dispatchEvent(new CustomEvent('stc_catalog_order_changed'));
      onSaveSuccess(result);
      onClose();
    } catch (err: any) {
      console.error('Failed to save model:', err);
      setError(err.message || 'Failed to save model to database');
    } finally {
      setSaving(false);
    }
  };

  const modalFormatPrice = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-canvas-white border border-ice-border rounded-xl shadow-2xl w-full max-w-6xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-zinc-900 text-white flex justify-between items-center">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              {isAddingNew ? 'Add New Model to Catalog Database' : `Edit Model: ${formData.name}`}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5 font-mono">
              Configure storage variants, RAM variants, launch year, prices, image URL & visibility directly in DB.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSaveModel} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Basic Info Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-canvas-pure border border-ice-border rounded-lg">
            <div>
              <label className="block text-[11px] font-bold text-ink-navy mb-1 uppercase font-mono">
                Model Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. iPhone 16 Pro Max"
                className="w-full px-3 py-2 bg-white border border-ice-border rounded font-semibold text-ink-navy focus:border-cobalt focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink-navy mb-1 uppercase font-mono">
                Brand *
              </label>
              <select
                value={formData.brandId}
                onChange={(e) => {
                  const newBrandId = e.target.value;
                  const isApple = newBrandId.toLowerCase().includes('apple');
                  setFormData((prev) => ({
                    ...prev,
                    brandId: newBrandId,
                    series: '',
                    supportedRamGb: isApple
                      ? [0]
                      : prev.supportedRamGb.length === 1 && prev.supportedRamGb[0] === 0
                      ? [8, 12]
                      : prev.supportedRamGb,
                  }));
                  setIsCustomSeriesInput(false);
                }}
                className="w-full px-3 py-2 bg-white border border-ice-border rounded font-semibold text-ink-navy focus:border-cobalt focus:outline-none cursor-pointer"
              >
                {availableBrands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-bold text-ink-navy uppercase font-mono flex items-center gap-1.5">
                  <Folder className="w-3.5 h-3.5 text-cobalt" />
                  <span>Series / Sub-Name</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomSeriesInput(!isCustomSeriesInput)}
                  className="text-[10px] text-cobalt hover:text-blue-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  title={isCustomSeriesInput ? 'Switch to dropdown of existing series' : 'Type a custom series name'}
                >
                  {isCustomSeriesInput ? (
                    <span>↩ Select from existing</span>
                  ) : (
                    <span>+ Type new</span>
                  )}
                </button>
              </div>

              {isCustomSeriesInput ? (
                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      list="existing-series-datalist"
                      value={formData.series}
                      onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                      placeholder="e.g. iPhone 17 Series"
                      autoFocus
                      className="flex-1 px-3 py-2 bg-white border border-cobalt ring-1 ring-cobalt/20 rounded font-semibold text-ink-navy focus:border-cobalt focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setIsCustomSeriesInput(false)}
                      className="px-2.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded text-[11px] font-semibold cursor-pointer border border-zinc-200 transition-colors whitespace-nowrap"
                      title="Back to dropdown"
                    >
                      Cancel
                    </button>
                  </div>
                  <datalist id="existing-series-datalist">
                    {brandExistingSeries.map((s) => (
                      <option key={s} value={s} />
                    ))}
                  </datalist>
                  <span className="text-[10px] text-zinc-400 font-mono block">
                    Type a new series name or pick from datalist suggestions.
                  </span>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <select
                    value={
                      brandExistingSeries.includes(formData.series)
                        ? formData.series
                        : formData.series
                        ? '__custom_val__'
                        : ''
                    }
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '__custom__') {
                        setIsCustomSeriesInput(true);
                      } else if (val === '__custom_val__') {
                        // Keep current custom value
                      } else {
                        setFormData({ ...formData, series: val });
                      }
                    }}
                    className="w-full px-3 py-2 bg-white border border-ice-border rounded font-semibold text-ink-navy focus:border-cobalt focus:outline-none cursor-pointer"
                  >
                    <option value="">-- Select Existing Series (or None) --</option>
                    {brandExistingSeries.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                    {formData.series && !brandExistingSeries.includes(formData.series) && (
                      <option value="__custom_val__">{formData.series} (Custom)</option>
                    )}
                    <option value="__custom__">+ Type New Series Name...</option>
                  </select>

                  {/* Quick Select Chips for top series of selected brand */}
                  {brandExistingSeries.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1 pt-0.5">
                      <span className="text-[9px] text-zinc-400 font-mono">Quick pick:</span>
                      {brandExistingSeries.slice(0, 4).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setFormData({ ...formData, series: s })}
                          className={`px-1.5 py-0.5 rounded text-[9.5px] font-mono font-semibold transition-all cursor-pointer ${
                            formData.series === s
                              ? 'bg-cobalt text-white shadow-xs'
                              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink-navy mb-1 uppercase font-mono">
                Category Tier
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                className="w-full px-3 py-2 bg-white border border-ice-border rounded font-semibold text-ink-navy focus:border-cobalt focus:outline-none cursor-pointer"
              >
                <option value="flagship">Flagship</option>
                <option value="premium">Premium</option>
                <option value="midrange">Midrange</option>
                <option value="budget">Budget</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink-navy mb-1 uppercase font-mono">
                Launch Year *
              </label>
              <input
                type="number"
                required
                min="2010"
                max="2030"
                value={formData.releaseYear}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    releaseYear: parseInt(e.target.value, 10) || new Date().getFullYear(),
                  })
                }
                className="w-full px-3 py-2 bg-white border border-ice-border rounded font-mono text-ink-navy focus:border-cobalt focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-ink-navy mb-1 uppercase font-mono flex items-center justify-between">
                <span>Base Price Anchor (₹) *</span>
                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Auto-synced with lowest variant
                </span>
              </label>
              <input
                type="number"
                required
                min="0"
                step="1"
                value={formData.basePrice128GB}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    basePrice128GB: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-full px-3 py-2 bg-white border border-ice-border rounded font-mono font-bold text-emerald-700 focus:border-cobalt focus:outline-none"
              />
              <span className="text-[10px] text-zinc-400 font-mono block mt-1">
                Used as fallback baseline. Overridden by explicit Variant Matrix below.
              </span>
            </div>
          </div>

          {/* Image URL Section */}
          <div className="p-4 bg-canvas-pure border border-ice-border rounded-lg space-y-3">
            <label className="block text-[11px] font-bold text-ink-navy uppercase font-mono flex items-center justify-between">
              <span>Product Image URL</span>
              <span className="text-[10px] text-zinc-400 font-normal">GSMArena or CDN link</span>
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={formData.imageUrl.startsWith('data:') ? '' : formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                placeholder="https://fdn2.gsmarena.com/vv/bigpic/phone-name.jpg"
                className="flex-1 px-3 py-2 bg-white border border-ice-border rounded font-mono text-xs text-ink-navy focus:border-cobalt focus:outline-none"
              />
              <label className="px-3 py-2 bg-zinc-200 hover:bg-zinc-300 text-ink-navy rounded font-semibold cursor-pointer flex items-center gap-1.5 transition-all">
                <span>Upload</span>
                <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
              </label>
            </div>

            {formData.imageUrl && (
              <div className="flex items-center gap-3 bg-white p-2.5 rounded border border-ice-border">
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="w-12 h-12 object-contain bg-zinc-50 rounded border p-1"
                />
                <div className="flex-1 overflow-hidden font-mono text-[11px]">
                  <span className="text-emerald-600 font-bold block">✓ Image Attached</span>
                  <span className="text-zinc-500 truncate block">{formData.imageUrl}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, imageUrl: '' })}
                  className="text-rose-600 hover:underline font-bold text-[11px] cursor-pointer"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Storage Variants Selector */}
          <div className="p-4 bg-canvas-pure border border-ice-border rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold text-ink-navy uppercase font-mono flex items-center gap-1.5">
                <HardDrive className="w-4 h-4 text-cobalt" />
                <span>Supported Storage Variants (GB)</span>
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                Selected: {formData.supportedStorageGb.join(', ')} GB
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {Array.from(new Set([...STANDARD_STORAGE_OPTIONS, ...formData.supportedStorageGb]))
                .sort((a, b) => a - b)
                .map((gb) => {
                  const isSelected = formData.supportedStorageGb.includes(gb);
                  return (
                    <button
                      type="button"
                      key={gb}
                      onClick={() => handleToggleStorageGb(gb)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                        isSelected
                          ? 'bg-cobalt text-white border-cobalt shadow-sm'
                          : 'bg-white text-ink-navy border-ice-border hover:border-cobalt'
                      }`}
                    >
                      <span>{gb >= 1024 ? `${gb / 1024} TB` : `${gb} GB`}</span>
                      {isSelected && <Check className="w-3 h-3" />}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* RAM Variants Selector */}
          <div className="p-4 bg-canvas-pure border border-ice-border rounded-lg space-y-3">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-bold text-ink-navy uppercase font-mono flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-purple-600" />
                <span>Supported RAM Variants (GB)</span>
              </label>
              <span className="text-[10px] font-mono text-zinc-500">
                {isAppleTablet
                  ? 'Unified Memory (Apple iPad)'
                  : formData.supportedRamGb.length === 1 && formData.supportedRamGb[0] === 0
                  ? 'No RAM Variants (Apple-style / Fixed)'
                  : `Selected: ${formData.supportedRamGb.join(', ')} GB`}
              </span>
            </div>
            {isAppleTablet ? (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg text-xs font-mono text-blue-900 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>Apple iPad uses unified memory architecture. RAM is unified and omitted from trade-in specifications.</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-blue-200/70 text-blue-800 font-bold text-[10px]">Unified RAM</span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Array.from(new Set([...STANDARD_RAM_OPTIONS, ...formData.supportedRamGb]))
                  .sort((a, b) => a - b)
                  .map((gb) => {
                    const isSelected = formData.supportedRamGb.includes(gb);
                    return (
                      <button
                        type="button"
                        key={gb}
                        onClick={() => handleToggleRamGb(gb)}
                        className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                          isSelected
                            ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                            : 'bg-white text-ink-navy border-ice-border hover:border-purple-300'
                        }`}
                      >
                        <span>{gb === 0 ? 'No RAM (Apple)' : `${gb} GB`}</span>
                        {isSelected && <Check className="w-3 h-3" />}
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* RAM x Storage Price Matrix with Cashify Link Generation & Approval Engine */}
          {(() => {
            const validRamsForStats =
              formData.supportedRamGb.length === 1 && formData.supportedRamGb[0] === 0
                ? [0]
                : formData.supportedRamGb;

            let totalActive = 0;
            let totalApproved = 0;

            validRamsForStats.forEach((ram) => {
              formData.supportedStorageGb.forEach((storage) => {
                const key = `${ram}_${storage}`;
                if (formData.variantPrices[key] !== undefined) {
                  if (isTablet) {
                    totalActive += 2;
                    if (variantApproved[`${key}_cellular`]) totalApproved++;
                    if (variantApproved[`${key}_wifi`]) totalApproved++;
                  } else {
                    totalActive++;
                    if (variantApproved[key]) {
                      totalApproved++;
                    }
                  }
                }
              });
            });

            return (
              <div className="p-4 bg-canvas-pure border border-ice-border rounded-lg space-y-3">
                {/* Cashify Variant Auto-Pricing & Approval Control Banner */}
                <div className="p-3 bg-gradient-to-r from-emerald-50 via-teal-50 to-indigo-50 border border-emerald-200/80 rounded-lg flex flex-wrap items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Sparkles className="w-4 h-4 text-emerald-100" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-ink-navy font-mono">
                          Cashify Variant Intelligence Engine
                        </span>
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                          +3% Target Payout
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-600 mt-0.5">
                        Specific Cashify variant link & benchmark price generated automatically. Rephonix +3% payout is only applied when approved by you.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-[10px] font-mono font-semibold text-zinc-600 bg-white/80 px-2.5 py-1 rounded-md border border-ice-border shadow-xs">
                      Approved: <span className="font-bold text-emerald-700">{totalApproved}</span> / {totalActive} active variants
                    </div>
                    <button
                      type="button"
                      onClick={handleVerifyAllUrls}
                      disabled={isVerifyingAll}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:shadow disabled:opacity-50"
                      title="Verify all active variant links and automatically extract live buyback prices from Cashify"
                    >
                      {isVerifyingAll ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Extracting Live Prices...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-300" />
                          <span>Verify & Extract All Prices</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleApproveAllVariants}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer hover:shadow"
                      title="Approve all active variant links and apply +3% to all Rephonix prices"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Approve All Variants (+3%)</span>
                    </button>
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-bold text-ink-navy uppercase font-mono flex items-center gap-1.5">
                    <Grid className="w-4 h-4 text-emerald-600" />
                    <span>Variant Price & Cashify Matrix (INR ₹)</span>
                  </label>
                  <span className="text-[10px] font-mono text-zinc-500">
                    Verify Cashify link & listed price per variant • Approve link to activate +3% payout
                  </span>
                </div>

                <div className="overflow-x-auto border border-ice-border rounded-lg bg-white shadow-xs">
                  <table className="w-full text-xs font-mono border-collapse">
                    <thead>
                      <tr className="bg-zinc-100/80 border-b border-ice-border text-zinc-600 text-[10px] uppercase font-bold">
                        {!(formData.supportedRamGb.length === 1 && formData.supportedRamGb[0] === 0) && (
                          <th className="p-3 text-left border-r border-ice-border w-28 bg-zinc-200/50">
                            RAM
                          </th>
                        )}
                        {formData.supportedStorageGb.map((s) => (
                          <th key={s} className={`p-3 text-center border-r border-ice-border ${isTablet ? 'min-w-[340px]' : 'min-w-[280px]'}`}>
                            <div className="font-bold text-ink-navy text-xs">
                              {s >= 1024 ? `${s / 1024} TB` : `${s} GB`} Storage
                            </div>
                            <div className="text-[9px] text-zinc-500 font-normal font-mono mt-0.5">
                              {isTablet ? 'Dual Wi-Fi & Cellular Benchmark & +3%' : 'Cashify Variant Benchmark & +3%'}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ice-border">
                      {(formData.supportedRamGb.length === 1 && formData.supportedRamGb[0] === 0
                        ? [0]
                        : formData.supportedRamGb
                      ).map((ram) => (
                        <tr key={ram} className="hover:bg-zinc-50/30">
                          {!(formData.supportedRamGb.length === 1 && formData.supportedRamGb[0] === 0) && (
                            <td className="p-3 font-bold text-purple-700 bg-purple-50/40 border-r border-ice-border whitespace-nowrap align-top">
                              <div className="flex items-center gap-1.5 sticky top-2">
                                <Cpu className="w-3.5 h-3.5 text-purple-600" />
                                <span>{ram} GB RAM</span>
                              </div>
                            </td>
                          )}
                          {formData.supportedStorageGb.map((storage) => {
                            const key = `${ram}_${storage}`;
                            const priceVal = formData.variantPrices[key];
                            const isEnabled = priceVal !== undefined;
                            const isHighlighted =
                              highlightVariant &&
                              (highlightVariant.ram === ram || (ram === 0 && !highlightVariant.ram)) &&
                              highlightVariant.storage === storage;

                            const cUrl = variantCashifyUrls[key] || '';
                            const cPrice = variantCashifyPrices[key] || 0;
                            const targetPlus3 = Math.round((cPrice || 10000) * 1.03);
                            const testResult = urlTestResults[key];

                            const cellularPrice =
                              formData.variantPrices[`${ram}_${storage}_cellular`] !== undefined
                                ? formData.variantPrices[`${ram}_${storage}_cellular`]
                                : priceVal || 0;
                            const wifiPrice =
                              formData.variantPrices[`${ram}_${storage}_wifi`] !== undefined
                                ? formData.variantPrices[`${ram}_${storage}_wifi`]
                                : cellularPrice || 0;

                            const isCellularApproved = Boolean(variantApproved[`${key}_cellular`]);
                            const isWifiApproved = Boolean(variantApproved[`${key}_wifi`]);
                            const isApproved = isTablet
                              ? isCellularApproved && isWifiApproved
                              : Boolean(variantApproved[key]);

                            return (
                              <td
                                key={storage}
                                className={`p-3 align-top border-r border-ice-border transition-all ${
                                  isTablet ? 'min-w-[340px]' : 'min-w-[280px]'
                                } ${
                                  isHighlighted
                                    ? 'bg-amber-50/70 ring-2 ring-inset ring-amber-400'
                                    : !isEnabled
                                    ? 'bg-zinc-50/80 opacity-75'
                                    : isApproved
                                    ? 'bg-emerald-50/25'
                                    : 'bg-white'
                                }`}
                              >
                                {isEnabled ? (
                                  <div className="space-y-2.5">
                                    {/* Active Switch & Approval Status */}
                                    <div className="flex items-center justify-between gap-1 pb-1.5 border-b border-zinc-100">
                                      <div className="flex items-center gap-1.5">
                                        <button
                                          type="button"
                                          onClick={() => handleToggleVariant(ram, storage, false)}
                                          className="relative inline-flex h-4 w-7 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out bg-emerald-500"
                                          title="Click to disable variant (Turn OFF)"
                                        >
                                          <span className="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out translate-x-3" />
                                        </button>
                                        <span className="text-[9px] font-bold font-mono text-emerald-700 uppercase">
                                          ● Active
                                        </span>
                                      </div>

                                      {isTablet ? (
                                        <div className="flex items-center gap-1">
                                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border flex items-center gap-0.5 ${
                                            isCellularApproved
                                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                                              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                          }`}>
                                            <Radio className="w-2.5 h-2.5 text-blue-600" />
                                            <span>Cellular {isCellularApproved ? '✓' : '—'}</span>
                                          </span>
                                          <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold border flex items-center gap-0.5 ${
                                            isWifiApproved
                                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                              : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                          }`}>
                                            <Wifi className="w-2.5 h-2.5 text-emerald-600" />
                                            <span>Wi-Fi {isWifiApproved ? '✓' : '—'}</span>
                                          </span>
                                        </div>
                                      ) : isApproved ? (
                                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shadow-xs">
                                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                          <span>Approved (+3%)</span>
                                        </span>
                                      ) : (
                                        <span className="px-1.5 py-0.5 rounded text-[8.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                                          <AlertCircle className="w-2.5 h-2.5 text-amber-600" />
                                          <span>Awaiting Approval</span>
                                        </span>
                                      )}
                                    </div>

                                    {isTablet ? (
                                      <div className="space-y-2.5">
                                        {(['cellular', 'wifi'] as const).map((conn) => {
                                          const connKey = `${key}_${conn}`;
                                          const isCell = conn === 'cellular';
                                          const connUrl = variantCashifyUrls[connKey] || '';
                                          const connCPrice = variantCashifyPrices[connKey] || 0;
                                          const connTargetPlus3 = Math.round((connCPrice || 10000) * 1.03);
                                          const connApproved = Boolean(variantApproved[connKey]);
                                          const connTestResult = urlTestResults[connKey];
                                          const connPayout = isCell ? cellularPrice : wifiPrice;

                                          return (
                                            <div
                                              key={conn}
                                              className={`p-2 rounded-lg border text-left text-[10px] space-y-1.5 transition-all ${
                                                isCell
                                                  ? 'bg-blue-50/60 border-blue-200'
                                                  : 'bg-emerald-50/60 border-emerald-200'
                                              }`}
                                            >
                                              {/* Connectivity Header */}
                                              <div className="flex items-center justify-between pb-1 border-b border-black/5">
                                                <div className="flex items-center gap-1 font-bold font-mono">
                                                  {isCell ? (
                                                    <>
                                                      <Radio className="w-3 h-3 text-blue-600" />
                                                      <span className="text-blue-950 text-[10px]">Wi-Fi + Cellular</span>
                                                      <span className="text-[7.5px] font-semibold text-blue-700 bg-blue-100 px-1 py-0.2 rounded">SIM</span>
                                                    </>
                                                  ) : (
                                                    <>
                                                      <Wifi className="w-3 h-3 text-emerald-600" />
                                                      <span className="text-emerald-950 text-[10px]">Wi-Fi Only</span>
                                                      <span className="text-[7.5px] font-semibold text-emerald-700 bg-emerald-100 px-1 py-0.2 rounded">No SIM</span>
                                                    </>
                                                  )}
                                                </div>
                                                {connApproved ? (
                                                  <div className="flex items-center gap-1">
                                                    <span className="px-1.5 py-0.2 rounded text-[7.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-0.5">
                                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                                      <span>Approved (+3%)</span>
                                                    </span>
                                                    <button
                                                      type="button"
                                                      onClick={() => handleRevokeConnectivityApproval(ram, storage, conn)}
                                                      className="text-[7.5px] text-zinc-400 hover:text-rose-600 underline cursor-pointer"
                                                      title="Revoke approval"
                                                    >
                                                      Revoke
                                                    </button>
                                                  </div>
                                                ) : (
                                                  <span className="px-1.5 py-0.2 rounded text-[7.5px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                    Awaiting Approval
                                                  </span>
                                                )}
                                              </div>

                                              {/* Cashify Link */}
                                              <div className="bg-white/90 border border-black/10 rounded p-1.5 space-y-1">
                                                <div className="flex items-center justify-between text-[8.5px] text-zinc-500 font-semibold">
                                                  <span className="flex items-center gap-1">
                                                    <Globe className={`w-2.5 h-2.5 ${isCell ? 'text-blue-600' : 'text-emerald-600'}`} />
                                                    <span>Cashify Link:</span>
                                                  </span>
                                                  {editingUrlKey === connKey ? (
                                                    <button
                                                      type="button"
                                                      onClick={() => handleSaveEditedUrl(connKey)}
                                                      className="text-[8px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                                                    >
                                                      Done
                                                    </button>
                                                  ) : (
                                                    <button
                                                      type="button"
                                                      onClick={() => {
                                                        setEditingUrlKey(connKey);
                                                        setTempUrlInput(connUrl);
                                                      }}
                                                      className="text-[8px] text-zinc-500 hover:text-zinc-800 flex items-center gap-0.5 cursor-pointer"
                                                      title="Edit custom URL for this connectivity variant"
                                                    >
                                                      <Edit2 className="w-2 h-2" />
                                                      <span>Edit</span>
                                                    </button>
                                                  )}
                                                </div>

                                                {editingUrlKey === connKey ? (
                                                  <div className="space-y-1">
                                                    <input
                                                      type="url"
                                                      value={tempUrlInput}
                                                      onChange={(e) => setTempUrlInput(e.target.value)}
                                                      className="w-full px-1.5 py-0.5 text-[8.5px] bg-white border border-cobalt rounded font-mono text-zinc-800 focus:outline-none"
                                                      placeholder="https://www.cashify.in/sell-old-mobile-phone/..."
                                                    />
                                                    <div className="flex justify-end gap-1">
                                                      <button
                                                        type="button"
                                                        onClick={() => setEditingUrlKey(null)}
                                                        className="px-1.5 py-0.5 text-[8px] bg-zinc-200 rounded text-zinc-700 cursor-pointer"
                                                      >
                                                        Cancel
                                                      </button>
                                                      <button
                                                        type="button"
                                                        onClick={() => handleSaveEditedUrl(connKey)}
                                                        className="px-1.5 py-0.5 text-[8px] bg-emerald-600 text-white rounded font-bold cursor-pointer"
                                                      >
                                                        Save
                                                      </button>
                                                    </div>
                                                  </div>
                                                ) : (
                                                  <div>
                                                    <a
                                                      href={connUrl}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="truncate font-mono text-[8.5px] text-blue-600 hover:underline hover:text-blue-800 flex items-center gap-1"
                                                      title={connUrl || 'Auto-generating link...'}
                                                    >
                                                      <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 text-blue-500" />
                                                      <span className="truncate">
                                                        {connUrl
                                                          ? connUrl.replace('https://www.cashify.in/sell-old-mobile-phone/', '')
                                                          : 'Auto-generating...'}
                                                      </span>
                                                    </a>

                                                    <div className="flex items-center justify-between mt-1 pt-1 border-t border-zinc-100">
                                                      <button
                                                        type="button"
                                                        onClick={() => handleTestUrl(connKey, connUrl)}
                                                        disabled={testingUrlKey === connKey || !connUrl}
                                                        className="text-[8px] font-semibold text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-100 px-1 py-0.5 rounded border border-zinc-200 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                      >
                                                        {testingUrlKey === connKey ? (
                                                          <>
                                                            <RefreshCw className="w-2 h-2 animate-spin text-cobalt" />
                                                            <span>Extracting...</span>
                                                          </>
                                                        ) : (
                                                          <span>Verify Link</span>
                                                        )}
                                                      </button>

                                                      {connTestResult && (
                                                        <div className="flex flex-col items-end gap-0.5">
                                                          <div className="flex items-center gap-1">
                                                            <span
                                                              className={`text-[8px] font-bold px-1 py-0.2 rounded ${
                                                                connTestResult.ok
                                                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                                  : connTestResult.is404
                                                                  ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                                  : connTestResult.isUnserviceable
                                                                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                                                              }`}
                                                              title={connTestResult.error || undefined}
                                                            >
                                                              {connTestResult.ok
                                                                ? '✓ 200 OK'
                                                                : connTestResult.is404
                                                                ? '✗ 404 Not Found'
                                                                : connTestResult.isUnserviceable
                                                                ? '⚠ Not Buying (Gurgaon/Delhi)'
                                                                : `⚠ ${connTestResult.status || 'Failed'}`}
                                                            </span>
                                                            {connTestResult.ok && connTestResult.extractedPrice ? (
                                                              <span className="text-[7.5px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.2 rounded">
                                                                ⚡ ₹{connTestResult.extractedPrice.toLocaleString('en-IN')}
                                                              </span>
                                                            ) : null}
                                                          </div>
                                                          {!connTestResult.ok && connTestResult.error && !connTestResult.is404 && !connTestResult.isUnserviceable && (
                                                            <span className="text-[7px] text-rose-600 truncate max-w-[150px]" title={connTestResult.error}>
                                                              {connTestResult.error}
                                                            </span>
                                                          )}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                              </div>

                                              {/* Cashify Listed Price & Target (+3%) */}
                                              <div className="bg-white/80 border border-black/10 rounded p-1.5 space-y-1">
                                                <div className="flex items-center justify-between text-zinc-600">
                                                  <span className="font-semibold text-[8.5px]">Cashify Listed:</span>
                                                  <div className="flex items-center gap-1">
                                                    <span className="text-[8.5px] text-zinc-400 font-bold">₹</span>
                                                    <input
                                                      type="number"
                                                      value={connCPrice === 0 ? '' : connCPrice}
                                                      onChange={(e) => handleConnectivityCashifyPriceChange(ram, storage, conn, e.target.value)}
                                                      className="w-18 px-1 py-0.5 bg-white border border-zinc-300 rounded font-mono font-bold text-right text-[9.5px] focus:outline-none focus:border-cobalt"
                                                      placeholder="0"
                                                    />
                                                  </div>
                                                </div>

                                                <div className={`flex items-center justify-between px-1.5 py-0.5 rounded border font-mono text-[8.5px] ${
                                                  isCell ? 'bg-blue-100/60 border-blue-200 text-blue-900' : 'bg-emerald-100/60 border-emerald-200 text-emerald-900'
                                                }`}>
                                                  <span className="font-bold flex items-center gap-0.5">
                                                    <Sparkles className="w-2 h-2" />
                                                    <span>Target (+3%):</span>
                                                  </span>
                                                  <span className="font-extrabold text-[9.5px]">
                                                    ₹{connTargetPlus3.toLocaleString('en-IN')}
                                                  </span>
                                                </div>
                                              </div>

                                              {/* Rephonix Payout Price */}
                                              <div className="space-y-0.5">
                                                <label className="text-[8.5px] font-bold text-ink-navy font-mono block">
                                                  Rephonix Payout Price:
                                                </label>
                                                <div className="relative">
                                                  <span className="absolute left-2 top-1 text-zinc-400 text-[9px] font-bold">₹</span>
                                                  <input
                                                    type="number"
                                                    value={connPayout === 0 ? '' : connPayout}
                                                    placeholder="0"
                                                    onChange={(e) =>
                                                      handleTabletConnectivityPriceChange(ram, storage, conn, e.target.value)
                                                    }
                                                    className={`w-full pl-5 pr-1.5 py-0.5 bg-white border rounded font-mono font-bold text-ink-navy text-right text-[11px] focus:outline-none shadow-xs ${
                                                      connApproved
                                                        ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-300'
                                                        : isCell
                                                        ? 'border-blue-300 focus:border-cobalt'
                                                        : 'border-emerald-300 focus:border-emerald-600'
                                                    }`}
                                                  />
                                                </div>
                                                {connPayout > 0 && (
                                                  <span className="text-[8.5px] font-bold text-emerald-700 block text-right font-mono">
                                                    {modalFormatPrice(connPayout)}
                                                  </span>
                                                )}
                                              </div>

                                              {/* Approval Action */}
                                              {!connApproved ? (
                                                <button
                                                  type="button"
                                                  onClick={() => handleApproveConnectivityVariant(ram, storage, conn)}
                                                  className="w-full py-1 px-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[8.5px] font-mono flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer hover:shadow"
                                                  title={`Approve link and apply +3% (₹${connTargetPlus3.toLocaleString('en-IN')})`}
                                                >
                                                  <Sparkles className="w-2.5 h-2.5 text-amber-200" />
                                                  <span>Approve Link & Apply +3%</span>
                                                </button>
                                              ) : (
                                                <div className="text-[8px] font-mono font-semibold text-emerald-700 flex items-center justify-center gap-1 bg-emerald-100/70 py-0.5 rounded border border-emerald-200">
                                                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                                  <span>+3% Payout Approved & Active</span>
                                                </div>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <>
                                        {/* Cashify Exact Variant Link Card */}
                                        <div className="bg-zinc-50 border border-zinc-200 rounded p-1.5 text-left text-[10px]">
                                          <div className="flex items-center justify-between text-[9px] text-zinc-500 font-semibold mb-1">
                                            <span className="flex items-center gap-1">
                                              <Globe className="w-3 h-3 text-orange-600" />
                                              <span>Cashify Link:</span>
                                            </span>
                                            <div className="flex items-center gap-1">
                                              {editingUrlKey === key ? (
                                                <button
                                                  type="button"
                                                  onClick={() => handleSaveEditedUrl(key)}
                                                  className="text-[8.5px] text-emerald-700 hover:text-emerald-900 font-bold underline cursor-pointer"
                                                >
                                                  Done
                                                </button>
                                              ) : (
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setEditingUrlKey(key);
                                                    setTempUrlInput(cUrl);
                                                  }}
                                                  className="text-[8.5px] text-zinc-500 hover:text-zinc-800 flex items-center gap-0.5 cursor-pointer"
                                                  title="Edit custom URL for this variant"
                                                >
                                                  <Edit2 className="w-2.5 h-2.5" />
                                                  <span>Edit</span>
                                                </button>
                                              )}
                                            </div>
                                          </div>

                                          {editingUrlKey === key ? (
                                            <div className="space-y-1">
                                              <input
                                                type="url"
                                                value={tempUrlInput}
                                                onChange={(e) => setTempUrlInput(e.target.value)}
                                                className="w-full px-1.5 py-1 text-[9.5px] bg-white border border-cobalt rounded font-mono text-zinc-800 focus:outline-none"
                                                placeholder="https://www.cashify.in/sell-old-mobile-phone/..."
                                              />
                                              <div className="flex justify-end gap-1">
                                                <button
                                                  type="button"
                                                  onClick={() => setEditingUrlKey(null)}
                                                  className="px-1.5 py-0.5 text-[8.5px] bg-zinc-200 rounded text-zinc-700 cursor-pointer"
                                                >
                                                  Cancel
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={() => handleSaveEditedUrl(key)}
                                                  className="px-1.5 py-0.5 text-[8.5px] bg-emerald-600 text-white rounded font-bold cursor-pointer"
                                                >
                                                  Save
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div>
                                              <div className="flex items-center gap-1">
                                                <a
                                                  href={cUrl}
                                                  target="_blank"
                                                  rel="noopener noreferrer"
                                                  className="flex-1 truncate font-mono text-[9px] text-blue-600 hover:underline hover:text-blue-800 flex items-center gap-1"
                                                  title={cUrl || 'Auto-generating link...'}
                                                >
                                                  <ExternalLink className="w-2.5 h-2.5 flex-shrink-0 text-blue-500" />
                                                  <span className="truncate">
                                                    {cUrl
                                                      ? cUrl.replace('https://www.cashify.in/sell-old-mobile-phone/', '')
                                                      : 'Auto-generating...'}
                                                  </span>
                                                </a>
                                              </div>

                                              <div className="flex items-center justify-between mt-1 pt-1 border-t border-zinc-200/60">
                                                <button
                                                  type="button"
                                                  onClick={() => handleTestUrl(key, cUrl)}
                                                  disabled={testingUrlKey === key || !cUrl}
                                                  className="text-[8.5px] font-semibold text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-100 px-1.5 py-0.5 rounded border border-zinc-200 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                                  title="Test if URL exists on Cashify and extract live buyback price"
                                                >
                                                  {testingUrlKey === key ? (
                                                    <>
                                                      <RefreshCw className="w-2.5 h-2.5 animate-spin text-cobalt" />
                                                      <span>Extracting...</span>
                                                    </>
                                                  ) : (
                                                    <span>Verify Link</span>
                                                  )}
                                                </button>

                                                {testResult && (
                                                  <div className="flex flex-col items-end gap-0.5">
                                                    <div className="flex items-center gap-1">
                                                      <span
                                                        className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded ${
                                                          testResult.ok
                                                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                                            : testResult.is404
                                                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                            : testResult.isUnserviceable
                                                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                                                        }`}
                                                        title={testResult.error || undefined}
                                                      >
                                                        {testResult.ok
                                                          ? '✓ 200 OK'
                                                          : testResult.is404
                                                          ? '✗ 404 Not Found'
                                                          : testResult.isUnserviceable
                                                          ? '⚠ Not Buying (Gurgaon/Delhi)'
                                                          : `⚠ ${testResult.status || 'Failed'}`}
                                                      </span>
                                                      {testResult.ok && testResult.extractedPrice ? (
                                                        <span
                                                          className="text-[8.5px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 px-1 py-0.5 rounded flex items-center gap-0.5 shadow-2xs"
                                                          title="Live Buyback Price extracted from Cashify"
                                                        >
                                                          ⚡ ₹{testResult.extractedPrice.toLocaleString('en-IN')}
                                                        </span>
                                                      ) : null}
                                                    </div>
                                                    {!testResult.ok && testResult.error && !testResult.is404 && !testResult.isUnserviceable && (
                                                      <span className="text-[7.5px] text-rose-600 truncate max-w-[180px]" title={testResult.error}>
                                                        {testResult.error}
                                                      </span>
                                                    )}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}
                                        </div>

                                        {/* Cashify Benchmark Price & Target (+3%) Calculation */}
                                        <div className="bg-slate-50 border border-slate-200 rounded p-1.5 text-left text-[10px] space-y-1">
                                          <div className="flex items-center justify-between text-zinc-600">
                                            <div className="flex items-center gap-1">
                                              <span className="font-semibold text-[9px]">Cashify Listed:</span>
                                              {extractedCashifyPrices[key] ? (
                                                <span className="text-[7.5px] font-bold text-emerald-700 bg-emerald-100/90 border border-emerald-300 px-1 py-0.2 rounded uppercase">
                                                  Live Extracted
                                                </span>
                                              ) : null}
                                            </div>
                                            <div className="flex items-center gap-1">
                                              <span className="text-[9px] text-zinc-400 font-bold">₹</span>
                                              <input
                                                type="number"
                                                value={cPrice === 0 ? '' : cPrice}
                                                onChange={(e) => handleCashifyPriceChange(ram, storage, e.target.value)}
                                                className={`w-20 px-1 py-0.5 bg-white border rounded font-mono font-bold text-right text-[10px] focus:outline-none focus:border-cobalt ${
                                                  extractedCashifyPrices[key]
                                                    ? 'border-emerald-400 text-emerald-800 ring-1 ring-emerald-200'
                                                    : 'border-zinc-300 text-zinc-800'
                                                }`}
                                                placeholder="0"
                                              />
                                            </div>
                                          </div>

                                          <div className="flex items-center justify-between text-indigo-900 bg-indigo-50/80 px-1.5 py-1 rounded border border-indigo-100 font-mono text-[9px]">
                                            <span className="font-bold flex items-center gap-0.5">
                                              <Sparkles className="w-2.5 h-2.5 text-indigo-600" />
                                              <span>Target (+3%):</span>
                                            </span>
                                            <span className="font-extrabold text-[10px] text-indigo-700">
                                              ₹{targetPlus3.toLocaleString('en-IN')}
                                            </span>
                                          </div>
                                        </div>

                                        {/* Rephonix Payout Price & Approval Action */}
                                        <div className="pt-0.5">
                                          <div className="text-left mb-1 flex items-center justify-between">
                                            <label className="text-[9px] font-bold text-ink-navy font-mono">
                                              Rephonix Payout Price:
                                            </label>
                                            {isApproved && (
                                              <button
                                                type="button"
                                                onClick={() => handleRevokeApproval(ram, storage)}
                                                className="text-[8px] text-zinc-500 hover:text-rose-600 underline cursor-pointer"
                                                title="Unapprove and allow manual override"
                                              >
                                                Revoke Approval
                                              </button>
                                            )}
                                          </div>

                                          <div className="relative">
                                            <span className="absolute left-2.5 top-1.5 text-zinc-400 text-[10px] font-bold">
                                              ₹
                                            </span>
                                            <input
                                              type="number"
                                              value={priceVal === 0 ? '' : priceVal}
                                              placeholder="0"
                                              autoFocus={Boolean(isHighlighted)}
                                              onChange={(e) =>
                                                handleVariantPriceChange(ram, storage, e.target.value)
                                              }
                                              className={`w-full pl-6 pr-2 py-1 bg-white border rounded font-mono font-bold text-ink-navy text-right text-xs focus:outline-none shadow-xs ${
                                                isApproved
                                                  ? 'border-emerald-500 bg-emerald-50/20 ring-1 ring-emerald-300'
                                                  : isHighlighted
                                                  ? 'border-amber-400 ring-2 ring-amber-200'
                                                  : 'border-ice-border focus:border-cobalt'
                                              }`}
                                            />
                                          </div>

                                          {priceVal > 0 && (
                                            <span className="text-[9px] font-bold text-emerald-600 block mt-0.5 text-right font-mono">
                                              {modalFormatPrice(Number(priceVal))}
                                            </span>
                                          )}

                                          {!isApproved ? (
                                            <button
                                              type="button"
                                              onClick={() => handleApproveVariant(ram, storage)}
                                              className="w-full mt-2 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md font-bold text-[9.5px] font-mono flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer hover:shadow"
                                              title={`Approve Cashify link and apply +3% price (₹${targetPlus3.toLocaleString('en-IN')})`}
                                            >
                                              <Sparkles className="w-3 h-3 text-amber-200" />
                                              <span>Approve Link & Apply +3%</span>
                                            </button>
                                          ) : (
                                            <div className="mt-1.5 text-[8.5px] font-mono font-semibold text-emerald-700 flex items-center justify-center gap-1 bg-emerald-100/60 py-1 rounded border border-emerald-200">
                                              <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                                              <span>+3% Payout Approved & Active</span>
                                            </div>
                                          )}
                                        </div>
                                      </>
                                    )}
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleVariant(ram, storage, true)}
                                    className="w-full py-2 px-1.5 bg-zinc-100 hover:bg-emerald-50 text-zinc-400 hover:text-emerald-600 border border-dashed border-zinc-300 hover:border-emerald-400 rounded text-[10px] font-mono font-bold transition-all cursor-pointer"
                                  >
                                    + Enable Variant
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })()}

          {/* Brand Warranty Question Switch */}
          <div className="p-4 bg-canvas-pure border border-ice-border rounded-lg flex items-center justify-between">
            <div>
              <span className="font-bold text-ink-navy flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Enable Brand Warranty Question</span>
              </span>
              <span className="text-[11px] text-zinc-500 block mt-0.5">
                When ON, the "Is your device under brand warranty?" question appears in customer diagnostics. When OFF, the question is skipped to avoid double penalties on out-of-warranty devices.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.supportsWarrantyQuestion}
              onChange={(e) =>
                setFormData({ ...formData, supportsWarrantyQuestion: e.target.checked })
              }
              className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
          </div>

          {/* Visibility Switch */}
          <div className="p-4 bg-canvas-pure border border-ice-border rounded-lg flex items-center justify-between">
            <div>
              <span className="font-bold text-ink-navy flex items-center gap-1.5">
                {formData.hidden ? (
                  <EyeOff className="w-4 h-4 text-amber-600" />
                ) : (
                  <Eye className="w-4 h-4 text-emerald-600" />
                )}
                <span>Hide Model from Store</span>
              </span>
              <span className="text-[11px] text-zinc-500 block mt-0.5">
                When enabled, this model will be hidden from public customers on the storefront.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.hidden}
              onChange={(e) => setFormData({ ...formData, hidden: e.target.checked })}
              className="w-5 h-5 rounded text-cobalt focus:ring-cobalt cursor-pointer"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-ice-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-ink-navy text-xs font-bold rounded-lg transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {saving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{isAddingNew ? 'Create Model in DB' : 'Save Changes to DB'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CatalogTab;
