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
} from 'lucide-react';
import { Model, Brand, isSmartwatchDevice, isTabletDevice } from '../../../data/mockDatabase';
import { fetchModels, createModel, updateModel, deleteModel } from '../../../utils/api';
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
} from '../../../utils/ordering';

interface CatalogTabProps {
  category: 'smartphones' | 'tablets' | 'smartwatches';
  brands: Brand[];
  onRefresh?: () => void;
}

const STANDARD_STORAGE_OPTIONS = [64, 128, 256, 512, 1024, 2048];
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

  // Modals
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  // Form State for Create / Edit
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
  }>({
    id: '',
    legacyId: '',
    brandId: initialBrands[0]?.id || 'brand-apple',
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
  });

  const [saving, setSaving] = useState(false);

  // Load models from API (Database)
  const loadModels = async () => {
    try {
      setLoading(true);
      setError(null);
      const apiModels = await fetchModels();
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
  }, []);

  // Initialize ordered brands
  useEffect(() => {
    setOrderedBrands(applyBrandOrder(initialBrands));
    if (initialBrands.length > 0) {
      setReorderSeriesBrandId(initialBrands[0].id);
      setReorderModelBrandId(initialBrands[0].id);
    }
  }, [initialBrands]);

  // Derived Series List for active brand filter or active reorder brand
  const activeBrandForSeries = selectedBrandFilter !== 'all' ? selectedBrandFilter : (initialBrands[0]?.id || 'brand-apple');

  const availableSeriesList = useMemo(() => {
    const brandModels = models.filter((m) => {
      let matchesCat = false;
      if (category === 'smartphones') {
        matchesCat = !isTabletDevice(m.brandId, m.name, m.id) && !isSmartwatchDevice(m.brandId, m.name, m.id);
      } else if (category === 'tablets') {
        matchesCat = isTabletDevice(m.brandId, m.name, m.id);
      } else if (category === 'smartwatches') {
        matchesCat = isSmartwatchDevice(m.brandId, m.name, m.id);
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
    return applySeriesOrder(activeBrandForSeries, rawList);
  }, [models, category, selectedBrandFilter, activeBrandForSeries]);

  // Initialize series list for Reorder Series Tab
  useEffect(() => {
    const brandModels = models.filter((m) => m.brandId === reorderSeriesBrandId);
    const seriesSet = new Set<string>();
    brandModels.forEach((m) => {
      if (m.series) seriesSet.add(m.series);
    });
    setOrderedSeries(applySeriesOrder(reorderSeriesBrandId, Array.from(seriesSet)));
  }, [reorderSeriesBrandId, models]);

  // Initialize models list for Reorder Models Tab
  useEffect(() => {
    const brandModels = models.filter((m) => {
      if (m.brandId !== reorderModelBrandId) return false;
      if (reorderModelSeries !== 'all' && m.series !== reorderModelSeries) return false;
      return true;
    });
    setOrderedModels(applyModelOrder(reorderModelBrandId, brandModels));
  }, [reorderModelBrandId, reorderModelSeries, models]);

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

    // Apply custom model order if brand is filtered
    if (selectedBrandFilter !== 'all') {
      list = applyModelOrder(selectedBrandFilter, list);
    }

    return list;
  }, [models, category, selectedBrandFilter, selectedSeriesFilter, showHiddenOnly, searchQuery]);

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
    const seriesOrder = applySeriesOrder(activeBrand, Array.from(map.keys()));

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
    setFormData({
      id: model.id,
      legacyId: model.id,
      brandId: model.brandId,
      name: model.name,
      category: model.category,
      releaseYear: model.releaseYear || new Date().getFullYear(),
      basePrice128GB: model.basePrice128GB || 0,
      series: model.series || '',
      imageUrl: model.imageUrl || '',
      supportedStorageGb: model.supportedStorageGb && model.supportedStorageGb.length > 0 ? [...model.supportedStorageGb] : [128, 256, 512],
      supportedRamGb: model.supportedRamGb && model.supportedRamGb.length > 0 ? [...model.supportedRamGb] : [0],
      variantPrices: model.variantPrices ? { ...model.variantPrices } : {},
      hidden: Boolean(model.hidden),
    });
  };

  // Open Add New Model Modal
  const handleStartAdd = () => {
    const defaultBrand = initialBrands[0]?.id || 'brand-apple';
    setEditingModel(null);
    setIsAddingNew(true);
    setFormData({
      id: '',
      legacyId: '',
      brandId: defaultBrand,
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
    });
  };

  // Save Model
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
        : formData.legacyId;

      const payload = {
        legacyId,
        brandId: formData.brandId,
        name: formData.name.trim(),
        category: formData.category,
        releaseYear: Number(formData.releaseYear),
        basePrice128GB: Number(formData.basePrice128GB),
        series: formData.series.trim(),
        imageUrl: formData.imageUrl.trim(),
        supportedStorageGb: formData.supportedStorageGb,
        supportedRamGb: formData.supportedRamGb,
        variantPrices: formData.variantPrices,
        hidden: formData.hidden,
      };

      if (isAddingNew) {
        await createModel(payload);
        setSuccessMsg(`Model "${formData.name}" added successfully to database!`);
      } else {
        await updateModel(legacyId, payload);
        setSuccessMsg(`Model "${formData.name}" updated successfully in database!`);
      }

      setEditingModel(null);
      setIsAddingNew(false);
      await loadModels();
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Failed to save model:', err);
      setError(err.message || 'Failed to save model to database');
    } finally {
      setSaving(false);
    }
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
    saveSeriesOrder(reorderSeriesBrandId, orderedSeries);
    setSuccessMsg('Custom series display order saved successfully!');
  };

  const handleResetSeriesOrder = () => {
    resetSeriesOrder(reorderSeriesBrandId);
    const brandModels = models.filter((m) => m.brandId === reorderSeriesBrandId);
    const seriesSet = new Set<string>();
    brandModels.forEach((m) => {
      if (m.series) seriesSet.add(m.series);
    });
    setOrderedSeries(applySeriesOrder(reorderSeriesBrandId, Array.from(seriesSet)));
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
    saveModelOrder(reorderModelBrandId, orderedModels.map((m) => m.id));
    setSuccessMsg('Custom model display order saved successfully!');
  };

  const handleResetModelOrder = () => {
    resetModelOrder(reorderModelBrandId);
    const brandModels = models.filter((m) => m.brandId === reorderModelBrandId);
    setOrderedModels(applyModelOrder(reorderModelBrandId, brandModels));
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

  // Form Controls logic
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

  const handleVariantPriceChange = (ram: number, storage: number, valStr: string) => {
    const key = `${ram}_${storage}`;
    const price = parseInt(valStr, 10);
    setFormData((prev) => {
      const nextMap = { ...prev.variantPrices };
      if (isNaN(price) || price <= 0) {
        delete nextMap[key];
      } else {
        nextMap[key] = price;
      }
      return { ...prev, variantPrices: nextMap };
    });
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
          >
            <Download className="w-3.5 h-3.5 text-cobalt" />
            <span>Export CSV</span>
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
                  <span className="font-mono text-sky-100 font-semibold">Select Brand to Reorder Series:</span>
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
      {(editingModel || isAddingNew) && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-canvas-white border border-ice-border rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
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
                onClick={() => {
                  setEditingModel(null);
                  setIsAddingNew(false);
                }}
                className="text-zinc-400 hover:text-white p-1 rounded-full hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSaveModel} className="p-6 space-y-6 overflow-y-auto flex-1 text-xs">
              {/* Basic Info Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-canvas-pure border border-ice-border rounded-lg">
                <div>
                  <label className="block text-[11px] font-bold text-ink-navy mb-1 uppercase font-mono">Model Name *</label>
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
                  <label className="block text-[11px] font-bold text-ink-navy mb-1 uppercase font-mono">Brand *</label>
                  <select
                    value={formData.brandId}
                    onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
                    className="w-full px-3 py-2 bg-white border border-ice-border rounded font-semibold text-ink-navy focus:border-cobalt focus:outline-none cursor-pointer"
                  >
                    {orderedBrands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink-navy mb-1 uppercase font-mono">Series / Sub-Name</label>
                  <input
                    type="text"
                    value={formData.series}
                    onChange={(e) => setFormData({ ...formData, series: e.target.value })}
                    placeholder="e.g. iPhone 16 Series"
                    className="w-full px-3 py-2 bg-white border border-ice-border rounded text-ink-navy focus:border-cobalt focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink-navy mb-1 uppercase font-mono">Category Tier</label>
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
                  <label className="block text-[11px] font-bold text-ink-navy mb-1 uppercase font-mono">Launch Year *</label>
                  <input
                    type="number"
                    required
                    min="2010"
                    max="2030"
                    value={formData.releaseYear}
                    onChange={(e) => setFormData({ ...formData, releaseYear: parseInt(e.target.value, 10) || new Date().getFullYear() })}
                    className="w-full px-3 py-2 bg-white border border-ice-border rounded font-mono text-ink-navy focus:border-cobalt focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-ink-navy mb-1 uppercase font-mono">Base Price Anchor (₹) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={formData.basePrice128GB}
                    onChange={(e) => setFormData({ ...formData, basePrice128GB: parseInt(e.target.value, 10) || 0 })}
                    className="w-full px-3 py-2 bg-white border border-ice-border rounded font-mono font-bold text-emerald-700 focus:border-cobalt focus:outline-none"
                  />
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
                    <img src={formData.imageUrl} alt="Preview" className="w-12 h-12 object-contain bg-zinc-50 rounded border p-1" />
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
                  <span className="text-[10px] font-mono text-zinc-500">Selected: {formData.supportedStorageGb.join(', ')} GB</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STANDARD_STORAGE_OPTIONS.map((gb) => {
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
                    {formData.supportedRamGb.length === 1 && formData.supportedRamGb[0] === 0
                      ? 'No RAM Variants (Apple-style / Fixed)'
                      : `Selected: ${formData.supportedRamGb.join(', ')} GB`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {STANDARD_RAM_OPTIONS.map((gb) => {
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
              </div>

              {/* RAM x Storage Price Matrix */}
              <div className="p-4 bg-canvas-pure border border-ice-border rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-[11px] font-bold text-ink-navy uppercase font-mono flex items-center gap-1.5">
                    <Grid className="w-4 h-4 text-emerald-600" />
                    <span>Variant Price Matrix (INR ₹)</span>
                  </label>
                  <span className="text-[10px] font-mono text-zinc-500">Set price for each RAM x Storage combination stored in DB</span>
                </div>

                <div className="overflow-x-auto border border-ice-border rounded-lg bg-white">
                  <table className="w-full text-xs font-mono border-collapse">
                    <thead>
                      <tr className="bg-zinc-100/70 border-b border-ice-border text-zinc-600 text-[10px] uppercase font-bold">
                        {!(formData.supportedRamGb.length === 1 && formData.supportedRamGb[0] === 0) && (
                          <th className="p-2 text-left border-r border-ice-border">RAM \ Storage</th>
                        )}
                        {formData.supportedStorageGb.map((s) => (
                          <th key={s} className="p-2 text-center border-r border-ice-border min-w-[110px]">
                            {s >= 1024 ? `${s / 1024} TB` : `${s} GB`}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ice-border">
                      {(formData.supportedRamGb.length === 1 && formData.supportedRamGb[0] === 0 ? [0] : formData.supportedRamGb).map((ram) => (
                        <tr key={ram} className="hover:bg-zinc-50/50">
                          {!(formData.supportedRamGb.length === 1 && formData.supportedRamGb[0] === 0) && (
                            <td className="p-2.5 font-bold text-purple-700 bg-purple-50/50 border-r border-ice-border whitespace-nowrap">
                              {ram} GB RAM
                            </td>
                          )}
                          {formData.supportedStorageGb.map((storage) => {
                            const key = `${ram}_${storage}`;
                            const val = formData.variantPrices[key] !== undefined ? formData.variantPrices[key] : '';
                            return (
                              <td key={storage} className="p-2 text-center border-r border-ice-border">
                                <div className="relative">
                                  <span className="absolute left-2.5 top-2.5 text-zinc-400 text-[10px] font-bold">₹</span>
                                  <input
                                    type="number"
                                    value={val}
                                    placeholder="Price"
                                    onChange={(e) => handleVariantPriceChange(ram, storage, e.target.value)}
                                    className="w-full pl-6 pr-2 py-1.5 bg-canvas-pure border border-ice-border focus:border-cobalt rounded font-mono font-bold text-ink-navy text-right focus:outline-none"
                                  />
                                </div>
                                {val && (
                                  <span className="text-[9px] font-bold text-emerald-600 block mt-1">
                                    {formatPrice(Number(val))}
                                  </span>
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

              {/* Visibility Switch */}
              <div className="p-4 bg-canvas-pure border border-ice-border rounded-lg flex items-center justify-between">
                <div>
                  <span className="font-bold text-ink-navy block">Hide Model from Store</span>
                  <span className="text-[11px] text-zinc-500">When enabled, this model will be hidden from public customers.</span>
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
                  onClick={() => {
                    setEditingModel(null);
                    setIsAddingNew(false);
                  }}
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
      )}
    </div>
  );
};

export default CatalogTab;
