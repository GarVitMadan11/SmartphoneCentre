import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Booking, Brand, Model, MODELS as STATIC_MODELS, isSmartwatchDevice, isTabletDevice, getModelSupportedRam, sortModelsByLaunchDesc } from '../../data/mockDatabase';
import { 
  ArrowLeft, Search, Filter, 
  CheckCircle, XCircle, Clock, CreditCard, 
  ChevronRight, Calendar, MapPin, User,
  RefreshCw, Plus, Trash2,
  Layers, Check, X,
  MessageSquare, HardDrive, ChevronDown,
  AlertCircle, Cpu, Grid, Smartphone, Tablet, Watch,
  Shuffle, ArrowUp, ArrowDown, RotateCcw, GripVertical, BookmarkCheck
} from 'lucide-react';
import { 
  saveBrandOrder, resetBrandOrder, saveBrandDefaultOrder,
  saveSeriesOrder, resetSeriesOrder, saveSeriesDefaultOrder,
  saveModelOrder, getSavedModelOrder, resetModelOrder, saveModelDefaultOrder,
  applyBrandOrder, applySeriesOrder, applyModelOrder,
  shuffleArray
} from '../../utils/ordering';
import { motion, AnimatePresence } from 'framer-motion';
import { updateBooking, fetchBookings, fetchModels, createModel, updateModel, deleteModel } from '../../utils/api';
import { SupportInbox } from './SupportInbox';

const ALL_RAM_OPTIONS: { gb: number; label: string }[] = [
  { gb: 2, label: '2 GB' },
  { gb: 4, label: '4 GB' },
  { gb: 6, label: '6 GB' },
  { gb: 8, label: '8 GB' },
  { gb: 12, label: '12 GB' },
  { gb: 16, label: '16 GB' },
  { gb: 24, label: '24 GB' },
];

const ALL_STORAGE_OPTIONS: { gb: number; label: string }[] = [
  { gb: 32, label: '32 GB' },
  { gb: 64, label: '64 GB' },
  { gb: 128, label: '128 GB' },
  { gb: 256, label: '256 GB' },
  { gb: 512, label: '512 GB' },
  { gb: 1024, label: '1 TB' },
];

interface AdminPanelProps {
  onBack: () => void;
  initialBookings: Booking[];
  brands: Brand[];
  onRefreshBookings?: (updatedBookings?: Booking[]) => Promise<void> | void;
  onRefreshCatalog?: (updatedModels?: Model[]) => Promise<void> | void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ 
  onBack, 
  initialBookings, 
  brands, 
  onRefreshBookings, 
  onRefreshCatalog 
}) => {
  const [bookings, setBookings] = useState<Booking[]>(initialBookings);
  const [activeTab, setActiveTab] = useState<'ledger' | 'catalog' | 'support'>('ledger');
  
  // Sync bookings from props
  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  // Catalog management states
  const [catalogDeviceCategory, setCatalogDeviceCategory] = useState<'smartphones' | 'tablets' | 'smartwatches'>('smartphones');
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedCatalogBrandId, setSelectedCatalogBrandId] = useState<string>('brand-apple');
  const [isApiOffline, setIsApiOffline] = useState(false);

  const smartphonesCount = useMemo(() => {
    return models.filter(m => !isSmartwatchDevice(m.brandId, m.name, m.id) && !isTabletDevice(m.brandId, m.name, m.id)).length;
  }, [models]);

  const tabletsCount = useMemo(() => {
    return models.filter(m => isTabletDevice(m.brandId, m.name, m.id)).length;
  }, [models]);

  const smartwatchesCount = useMemo(() => {
    return models.filter(m => isSmartwatchDevice(m.brandId, m.name, m.id)).length;
  }, [models]);
  
  // Tree view navigation states
  const [selectedTreeModelId, setSelectedTreeModelId] = useState<string | null>(null);
  const [expandedSeries, setExpandedSeries] = useState<Record<string, boolean>>({});

  // Add model form states
  const [newModelName, setNewModelName] = useState('');
  const [newModelCategory, setNewModelCategory] = useState<'flagship' | 'premium' | 'midrange' | 'budget'>('premium');
  const [newModelYear, setNewModelYear] = useState<number>(new Date().getFullYear());
  const [newModelBasePrice, setNewModelBasePrice] = useState<number>(30000);
  const [newModelStorageGb, setNewModelStorageGb] = useState<number[]>([128, 256, 512]);
  const [newModelRamGb, setNewModelRamGb] = useState<number[]>([0]); // [0] = no RAM variants (Apple-style)
  const [newVariantPrices, setNewVariantPrices] = useState<Record<string, number>>({});
  
  // Hierarchical Series & Image states
  const [selectedSeriesOption, setSelectedSeriesOption] = useState<string>('__CREATE_NEW__');
  const [customSeriesInput, setCustomSeriesInput] = useState<string>('');
  const [newModelImageUrl, setNewModelImageUrl] = useState<string>('');

  // Edit model form states
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState<'flagship' | 'premium' | 'midrange' | 'budget'>('premium');
  const [editYear, setEditYear] = useState<number>(new Date().getFullYear());
  const [editBasePrice, setEditBasePrice] = useState<number>(30000);
  const [editSeriesOption, setEditSeriesOption] = useState<string>('');
  const [editCustomSeries, setEditCustomSeries] = useState<string>('');
  const [editImageUrl, setEditImageUrl] = useState<string>('');
  const [editStorageGb, setEditStorageGb] = useState<number[]>([128, 256, 512]);
  const [editRamGb, setEditRamGb] = useState<number[]>([0]);
  const [editVariantPrices, setEditVariantPrices] = useState<Record<string, number>>({});

  // Catalog search state
  const [catalogSearch, setCatalogSearch] = useState('');

  // Catalog display view mode & ordering state
  const [catalogViewMode, setCatalogViewMode] = useState<'manage' | 'ordering'>('manage');
  const [orderVersion, setOrderVersion] = useState(0);
  const [orderingSelectedBrandId, setOrderingSelectedBrandId] = useState<string>('brand-apple');
  const [orderingSelectedSeries, setOrderingSelectedSeries] = useState<string>('');
  const [orderingCategoryFilter, setOrderingCategoryFilter] = useState<'smartphones' | 'tablets' | 'smartwatches' | 'all'>('smartphones');

  // Drag and drop states for reordering
  const [draggedBrandIndex, setDraggedBrandIndex] = useState<number | null>(null);
  const [dragOverBrandIndex, setDragOverBrandIndex] = useState<number | null>(null);

  const [draggedSeriesIndex, setDraggedSeriesIndex] = useState<number | null>(null);
  const [dragOverSeriesIndex, setDragOverSeriesIndex] = useState<number | null>(null);

  const [draggedModelIndex, setDraggedModelIndex] = useState<number | null>(null);
  const [dragOverModelIndex, setDragOverModelIndex] = useState<number | null>(null);

  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const loadModels = async () => {
    setLoadingModels(true);
    try {
      const data = await fetchModels();
      if (data && data.length > 0) {
        setModels(data as Model[]);
        setIsApiOffline(false);
      } else {
        setModels(STATIC_MODELS);
        setIsApiOffline(true);
      }
    } catch (err) {
      console.error('Failed to load models:', err);
      setModels(STATIC_MODELS);
      setIsApiOffline(true);
    } finally {
      setLoadingModels(false);
    }
  };

  const [loadingBookings, setLoadingBookings] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoadingBookings(true);
    try {
      const data = await fetchBookings();
      if (data && Array.isArray(data)) {
        setBookings(data as unknown as Booking[]);
        setIsApiOffline(false);
      }
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  useEffect(() => {
    if (activeTab === 'catalog') {
      loadModels();
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'catalog' && models.length > 0 && !editingModelId) {
      const brandModels = models.filter(m => m.brandId === selectedCatalogBrandId);
      if (brandModels.length > 0) {
        handleStartEditModel(brandModels[0]);
      }
    }
  }, [selectedCatalogBrandId, models, activeTab]);

  // --- ORDERING & SHUFFLING HANDLERS ---
  const currentOrderedBrands = useMemo(() => {
    return applyBrandOrder(brands);
  }, [brands, orderVersion]);

  const handleMoveBrand = (index: number, direction: 'up' | 'down') => {
    const newBrands = [...currentOrderedBrands];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newBrands.length) return;
    [newBrands[index], newBrands[targetIdx]] = [newBrands[targetIdx], newBrands[index]];
    saveBrandOrder(newBrands.map(b => b.id));
    setOrderVersion(v => v + 1);
    setFormSuccess(`Updated brand order: ${newBrands[targetIdx].name} swapped with ${newBrands[index].name}`);
  };

  const handleShuffleBrands = () => {
    const shuffled = shuffleArray(currentOrderedBrands);
    saveBrandOrder(shuffled.map(b => b.id));
    setOrderVersion(v => v + 1);
    setFormSuccess('Shuffled brand display order successfully! 🎲');
  };

  const handleResetBrands = () => {
    resetBrandOrder();
    setOrderVersion(v => v + 1);
    setFormSuccess('Reset brand display order to default.');
  };

  const handleSetDefaultBrands = () => {
    saveBrandDefaultOrder(currentOrderedBrands.map(b => b.id));
    setOrderVersion(v => v + 1);
    setFormSuccess('Saved current Brand order as system default baseline! 📌');
  };

  const availableSeriesForOrdering = useMemo(() => {
    const brandModels = models.filter(m => {
      if (m.brandId !== orderingSelectedBrandId) return false;
      const isTab = isTabletDevice(m.brandId, m.name, m.id);
      const isWatch = isSmartwatchDevice(m.brandId, m.name, m.id);
      if (orderingCategoryFilter === 'smartphones') return !isTab && !isWatch;
      if (orderingCategoryFilter === 'tablets') return isTab;
      if (orderingCategoryFilter === 'smartwatches') return isWatch;
      return true;
    });
    const seriesSet = new Set<string>();
    brandModels.forEach(m => {
      if (m.series) seriesSet.add(m.series);
    });
    const defaultList = Array.from(seriesSet);
    return applySeriesOrder(orderingSelectedBrandId, defaultList);
  }, [models, orderingSelectedBrandId, orderingCategoryFilter, orderVersion]);

  useEffect(() => {
    if (availableSeriesForOrdering.length > 0 && !availableSeriesForOrdering.includes(orderingSelectedSeries)) {
      setOrderingSelectedSeries('');
    }
  }, [availableSeriesForOrdering]);

  const handleMoveSeries = (index: number, direction: 'up' | 'down') => {
    const newSeries = [...availableSeriesForOrdering];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newSeries.length) return;
    [newSeries[index], newSeries[targetIdx]] = [newSeries[targetIdx], newSeries[index]];
    saveSeriesOrder(orderingSelectedBrandId, newSeries);
    setOrderVersion(v => v + 1);
    setFormSuccess(`Updated series order for ${orderingSelectedBrandId}: ${newSeries[targetIdx]} swapped with ${newSeries[index]}`);
  };

  const handleShuffleSeries = () => {
    if (availableSeriesForOrdering.length <= 1) {
      setFormSuccess(`Not enough series to shuffle for ${orderingSelectedBrandId}!`);
      return;
    }
    const shuffled = shuffleArray(availableSeriesForOrdering);
    saveSeriesOrder(orderingSelectedBrandId, shuffled);
    setOrderVersion(v => v + 1);
    setFormSuccess(`Shuffled series order for ${orderingSelectedBrandId}! 🎲`);
  };

  const handleResetSeries = () => {
    resetSeriesOrder(orderingSelectedBrandId);
    setOrderVersion(v => v + 1);
    setFormSuccess(`Reset series order for ${orderingSelectedBrandId} to default.`);
  };

  const handleSetDefaultSeries = () => {
    saveSeriesDefaultOrder(orderingSelectedBrandId, availableSeriesForOrdering);
    setOrderVersion(v => v + 1);
    setFormSuccess(`Saved current Series display order for ${orderingSelectedBrandId} as system default baseline! 📌`);
  };

  const availableModelsForOrdering = useMemo(() => {
    const filtered = models.filter(m => {
      if (m.brandId !== orderingSelectedBrandId) return false;
      if (orderingSelectedSeries && m.series !== orderingSelectedSeries) return false;
      const isTab = isTabletDevice(m.brandId, m.name, m.id);
      const isWatch = isSmartwatchDevice(m.brandId, m.name, m.id);
      if (orderingCategoryFilter === 'smartphones') return !isTab && !isWatch;
      if (orderingCategoryFilter === 'tablets') return isTab;
      if (orderingCategoryFilter === 'smartwatches') return isWatch;
      return true;
    });

    return applyModelOrder(orderingSelectedBrandId, filtered);
  }, [models, orderingSelectedBrandId, orderingSelectedSeries, orderingCategoryFilter, orderVersion]);

  const updateModelOrderPreservingOtherCategories = (newCategoryModels: Model[]) => {
    const categoryIds = newCategoryModels.map(m => m.id);
    const allBrandModels = models.filter(m => m.brandId === orderingSelectedBrandId);
    const existingOrderIds = getSavedModelOrder(orderingSelectedBrandId);

    const baseOrderedIds = existingOrderIds.length > 0
      ? existingOrderIds.filter((id: string) => allBrandModels.some(m => m.id === id))
      : allBrandModels.map(m => m.id);

    allBrandModels.forEach(m => {
      if (!baseOrderedIds.includes(m.id)) baseOrderedIds.push(m.id);
    });

    let catIdx = 0;
    const finalOrderIds = baseOrderedIds.map((id: string) => {
      const isTarget = newCategoryModels.some(m => m.id === id);
      if (isTarget && catIdx < categoryIds.length) {
        const nextId = categoryIds[catIdx];
        catIdx++;
        return nextId;
      }
      return id;
    });

    saveModelOrder(orderingSelectedBrandId, finalOrderIds);
    setOrderVersion(v => v + 1);
  };

  const updateModelDefaultOrderPreservingOtherCategories = (newCategoryModels: Model[]) => {
    const categoryIds = newCategoryModels.map(m => m.id);
    const allBrandModels = models.filter(m => m.brandId === orderingSelectedBrandId);
    const existingOrderIds = getSavedModelOrder(orderingSelectedBrandId);

    const baseOrderedIds = existingOrderIds.length > 0
      ? existingOrderIds.filter((id: string) => allBrandModels.some(m => m.id === id))
      : allBrandModels.map(m => m.id);

    allBrandModels.forEach(m => {
      if (!baseOrderedIds.includes(m.id)) baseOrderedIds.push(m.id);
    });

    let catIdx = 0;
    const finalOrderIds = baseOrderedIds.map((id: string) => {
      const isTarget = newCategoryModels.some(m => m.id === id);
      if (isTarget && catIdx < categoryIds.length) {
        const nextId = categoryIds[catIdx];
        catIdx++;
        return nextId;
      }
      return id;
    });

    saveModelDefaultOrder(orderingSelectedBrandId, finalOrderIds);
    setOrderVersion(v => v + 1);
  };

  const handleMoveModel = (index: number, direction: 'up' | 'down') => {
    const newModels = [...availableModelsForOrdering];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newModels.length) return;
    [newModels[index], newModels[targetIdx]] = [newModels[targetIdx], newModels[index]];
    updateModelOrderPreservingOtherCategories(newModels);
    setFormSuccess(`Updated model order: ${newModels[targetIdx].name} swapped with ${newModels[index].name}`);
  };

  const handleShuffleModels = () => {
    if (availableModelsForOrdering.length <= 1) {
      setFormSuccess(`Not enough models to shuffle for ${orderingSelectedBrandId}!`);
      return;
    }
    const shuffled = shuffleArray(availableModelsForOrdering);
    updateModelOrderPreservingOtherCategories(shuffled);
    const catLabel = orderingCategoryFilter === 'smartphones' ? 'smartphones' : orderingCategoryFilter === 'tablets' ? 'tablets' : orderingCategoryFilter === 'smartwatches' ? 'smartwatches' : 'models';
    setFormSuccess(`Shuffled ${catLabel} order for ${orderingSelectedBrandId} / ${orderingSelectedSeries || 'All Series'}! 🎲`);
  };

  const handleResetModels = () => {
    resetModelOrder(orderingSelectedBrandId);
    setOrderVersion(v => v + 1);
    setFormSuccess(`Reset model order for ${orderingSelectedBrandId} to saved default baseline.`);
  };

  const handleSetDefaultModels = () => {
    updateModelDefaultOrderPreservingOtherCategories(availableModelsForOrdering);
    setFormSuccess(`Saved current Model display order for ${orderingSelectedBrandId} as system default baseline! 📌`);
  };

  const handleSetAllDefault = () => {
    saveBrandDefaultOrder(currentOrderedBrands.map(b => b.id));
    if (orderingSelectedBrandId && availableSeriesForOrdering.length > 0) {
      saveSeriesDefaultOrder(orderingSelectedBrandId, availableSeriesForOrdering);
    }
    if (availableModelsForOrdering.length > 0) {
      updateModelDefaultOrderPreservingOtherCategories(availableModelsForOrdering);
    } else {
      setOrderVersion(v => v + 1);
    }
    setFormSuccess('Set all current brand, series & model arrangements as System Default Baseline! 📌');
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleBrandDragStart = (e: React.DragEvent, index: number) => {
    setDraggedBrandIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleBrandDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverBrandIndex !== index) {
      setDragOverBrandIndex(index);
    }
  };

  const handleBrandDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedBrandIndex === null || draggedBrandIndex === dropIndex) {
      setDraggedBrandIndex(null);
      setDragOverBrandIndex(null);
      return;
    }
    const newBrands = [...currentOrderedBrands];
    const [draggedItem] = newBrands.splice(draggedBrandIndex, 1);
    newBrands.splice(dropIndex, 0, draggedItem);
    saveBrandOrder(newBrands.map(b => b.id));
    setOrderVersion(v => v + 1);
    setDraggedBrandIndex(null);
    setDragOverBrandIndex(null);
    setFormSuccess(`Reordered brand: "${draggedItem.name}" placed at position #${dropIndex + 1}`);
  };

  const handleSeriesDragStart = (e: React.DragEvent, index: number) => {
    setDraggedSeriesIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSeriesDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverSeriesIndex !== index) {
      setDragOverSeriesIndex(index);
    }
  };

  const handleSeriesDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedSeriesIndex === null || draggedSeriesIndex === dropIndex) {
      setDraggedSeriesIndex(null);
      setDragOverSeriesIndex(null);
      return;
    }
    const newSeries = [...availableSeriesForOrdering];
    const [draggedItem] = newSeries.splice(draggedSeriesIndex, 1);
    newSeries.splice(dropIndex, 0, draggedItem);
    saveSeriesOrder(orderingSelectedBrandId, newSeries);
    setOrderVersion(v => v + 1);
    setDraggedSeriesIndex(null);
    setDragOverSeriesIndex(null);
    setFormSuccess(`Reordered series: "${draggedItem}" placed at position #${dropIndex + 1}`);
  };

  const handleModelDragStart = (e: React.DragEvent, index: number) => {
    setDraggedModelIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleModelDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverModelIndex !== index) {
      setDragOverModelIndex(index);
    }
  };

  const handleModelDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedModelIndex === null || draggedModelIndex === dropIndex) {
      setDraggedModelIndex(null);
      setDragOverModelIndex(null);
      return;
    }
    const newModels = [...availableModelsForOrdering];
    const [draggedItem] = newModels.splice(draggedModelIndex, 1);
    newModels.splice(dropIndex, 0, draggedItem);
    updateModelOrderPreservingOtherCategories(newModels);
    setDraggedModelIndex(null);
    setDragOverModelIndex(null);
    setFormSuccess(`Reordered model: "${draggedItem.name}" placed at position #${dropIndex + 1}`);
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  
  // Filtering states
  const [filterVerification, setFilterVerification] = useState<string>('all'); // all, verified, failed, pending
  const [filterInspection, setFilterInspection] = useState<string>('all'); // all, approved, rejected, pending
  const [filterPayout, setFilterPayout] = useState<string>('all'); // all, completed, pending

  // Calculations for KPIs
  const metrics = useMemo(() => {
    let totalPaidAmt = 0;
    let pendingInspections = 0;
    let verifiedSellers = 0;
    let completedPayouts = 0;

    bookings.forEach(b => {
      if (b.payoutStatus === 'completed') {
        totalPaidAmt += b.finalPayoutAmount !== undefined ? b.finalPayoutAmount : b.finalPrice;
        completedPayouts += 1;
      }
      if (b.inspectionStatus === 'pending') {
        pendingInspections += 1;
      }
      if (b.verificationStatus === 'verified') {
        verifiedSellers += 1;
      }
    });

    const verificationRate = bookings.length > 0 
      ? Math.round((verifiedSellers / bookings.length) * 100) 
      : 0;

    return {
      totalPaidAmt,
      pendingInspections,
      verificationRate,
      completedPayouts
    };
  }, [bookings]);

  // Selected Booking helper
  const selectedBooking = useMemo(() => {
    return bookings.find(b => b.id === selectedBookingId) || null;
  }, [bookings, selectedBookingId]);

  // Handle Inspection Status change
  const handleInspectionChange = async (id: string, status: 'approved' | 'rejected') => {
    if (isApiOffline) {
    const nextBookings = bookings.map(b => b.id === id ? { ...b, inspectionStatus: status, payoutStatus: (status === 'rejected' ? 'pending' : b.payoutStatus) as 'pending' | 'completed' } : b);
      setBookings(nextBookings);
      if (onRefreshBookings) {
        onRefreshBookings(nextBookings);
      }
      return;
    }
    try {
      await updateBooking(id, {
        inspectionStatus: status,
        payoutStatus: status === 'rejected' ? 'pending' : undefined
      });
      await loadBookings();
      if (onRefreshBookings) {
        await onRefreshBookings();
      }
    } catch (err) {
      alert('Failed to update inspection status: ' + (err as Error).message);
    }
  };

  // Handle Payout completion
  const handlePayoutComplete = async (id: string) => {
    if (isApiOffline) {
      const nextBookings = bookings.map(b => b.id === id ? { ...b, payoutStatus: 'completed' as const } : b);
      setBookings(nextBookings);
      if (onRefreshBookings) {
        onRefreshBookings(nextBookings);
      }
      return;
    }
    try {
      await updateBooking(id, {
        payoutStatus: 'completed'
      });
      await loadBookings();
      if (onRefreshBookings) {
        await onRefreshBookings();
      }
    } catch (err) {
      alert('Failed to release payout: ' + (err as Error).message);
    }
  };

  // Reset demo bookings
  const handleResetDemoData = () => {
    if (isApiOffline) {
      setBookings(initialBookings);
      if (onRefreshBookings) {
        onRefreshBookings(initialBookings);
      }
      alert('[Offline Demo Mode] Reset in-memory transaction ledger back to default demo bookings.');
      return;
    }
    alert('Full-Stack Mode Active: Ledger data is stored in the SQLite dev.db. To reset or re-seed the transaction ledger, run "npm run db:setup" in your server terminal.');
  };

  // Filter Bookings
  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // Search matches
      const matchesSearch = 
        b.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.customerPhone.includes(searchTerm) ||
        b.modelName.toLowerCase().includes(searchTerm.toLowerCase());

      // Filter matches
      const matchesVerify = filterVerification === 'all' || b.verificationStatus === filterVerification;
      const matchesInspect = filterInspection === 'all' || b.inspectionStatus === filterInspection;
      const matchesPayout = filterPayout === 'all' || b.payoutStatus === filterPayout;

      return matchesSearch && matchesVerify && matchesInspect && matchesPayout;
    });
  }, [bookings, searchTerm, filterVerification, filterInspection, filterPayout]);

  // Helper format currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Get unique existing series list for the selected brand
  const existingSeriesForSelectedBrand = useMemo(() => {
    const brandModels = models.filter(m => m.brandId === selectedCatalogBrandId);
    const seriesSet = new Set<string>();
    brandModels.forEach(m => {
      if (m.series && m.series.trim()) {
        seriesSet.add(m.series.trim());
      }
    });
    return Array.from(seriesSet).sort();
  }, [models, selectedCatalogBrandId]);

  // Downscale image file using HTML5 Canvas (max 800px width/height)
  const compressImageFile = (file: File, maxDim = 800, quality = 0.82): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const rawUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(rawUrl);
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/webp', quality));
        };
        img.onerror = () => resolve(rawUrl);
        img.src = rawUrl;
      };
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });
  };

  // Handle local image file upload converting to compressed Data URL
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image size must be less than 5MB.');
      return;
    }
    try {
      const compressedDataUrl = await compressImageFile(file);
      if (compressedDataUrl) {
        setNewModelImageUrl(compressedDataUrl);
        setFormError('');
      }
    } catch {
      setFormError('Failed to process image file.');
    }
  };

  const handleEditImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setFormError('Image size must be less than 5MB.');
      return;
    }
    try {
      const compressedDataUrl = await compressImageFile(file);
      if (compressedDataUrl) {
        setEditImageUrl(compressedDataUrl);
        setFormError('');
      }
    } catch {
      setFormError('Failed to process image file.');
    }
  };

  const handleStartEditModel = (model: Model) => {
    setSelectedTreeModelId(model.id);
    setEditingModelId(model.id);
    setEditName(model.name);
    setEditCategory(model.category as any);
    setEditYear(model.releaseYear);
    setEditBasePrice(model.basePrice128GB);
    setEditImageUrl(model.imageUrl || '');
    setEditStorageGb(model.supportedStorageGb && model.supportedStorageGb.length > 0 ? model.supportedStorageGb : [128, 256, 512]);
    const defaultRams = getModelSupportedRam(model);
    setEditRamGb(model.supportedRamGb && model.supportedRamGb.length > 0 ? model.supportedRamGb : defaultRams);
    setEditVariantPrices(model.variantPrices || {});
    setFormError('');
    setFormSuccess('');

    if (model.series && existingSeriesForSelectedBrand.includes(model.series)) {
      setEditSeriesOption(model.series);
      setEditCustomSeries('');
    } else if (model.series) {
      setEditSeriesOption('__CREATE_NEW__');
      setEditCustomSeries(model.series);
    } else {
      setEditSeriesOption('');
      setEditCustomSeries('');
    }
  };

  const handleCancelEdit = () => {
    setEditingModelId(null);
    setFormError('');
  };

  // Toggle a storage option in an array
  const toggleStorage = useCallback((gb: number, arr: number[], setArr: (v: number[]) => void) => {
    if (arr.includes(gb)) {
      if (arr.length === 1) return; // must have at least one
      setArr(arr.filter(g => g !== gb));
    } else {
      setArr([...arr, gb].sort((a, b) => a - b));
    }
  }, []);

  // Toggle a RAM option in an array
  const toggleRam = useCallback((gb: number, arr: number[], setArr: (v: number[]) => void) => {
    if (arr.includes(gb)) {
      if (arr.length === 1 && gb !== 0) return; // must have at least one
      setArr(arr.filter(g => g !== gb));
    } else {
      setArr([...arr.filter(g => g !== 0), gb].sort((a, b) => a - b));
    }
  }, []);

  // Computed: filtered catalog models for selected brand and device category
  const displayedCatalogModels = useMemo(() => {
    let list = models.filter(m => {
      const isWatch = isSmartwatchDevice(m.brandId, m.name, m.id);
      const isTab = isTabletDevice(m.brandId, m.name, m.id);
      if (catalogDeviceCategory === 'smartwatches') return isWatch;
      if (catalogDeviceCategory === 'tablets') return isTab;
      return !isWatch && !isTab;
    });

    if (selectedCatalogBrandId) {
      list = list.filter(m => m.brandId === selectedCatalogBrandId);
    }

    if (catalogSearch.trim()) {
      const q = catalogSearch.trim().toLowerCase();
      list = list.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.series || '').toLowerCase().includes(q)
      );
    }
    const sorted = sortModelsByLaunchDesc(list);
    return applyModelOrder(selectedCatalogBrandId, sorted);
  }, [models, catalogDeviceCategory, selectedCatalogBrandId, catalogSearch]);

  // Group displayed models for the selected brand by series (Brand → Series → Model hierarchy)
  const brandSeriesMap = useMemo(() => {
    let filtered = models.filter(m => {
      const isWatch = isSmartwatchDevice(m.brandId, m.name, m.id);
      const isTab = isTabletDevice(m.brandId, m.name, m.id);
      if (catalogDeviceCategory === 'smartwatches') return isWatch;
      if (catalogDeviceCategory === 'tablets') return isTab;
      return !isWatch && !isTab;
    });

    if (selectedCatalogBrandId) {
      filtered = filtered.filter(m => m.brandId === selectedCatalogBrandId);
    }

    if (catalogSearch.trim()) {
      const q = catalogSearch.trim().toLowerCase();
      filtered = filtered.filter(m =>
        m.name.toLowerCase().includes(q) ||
        (m.series || '').toLowerCase().includes(q)
      );
    }

    const map = new Map<string, Model[]>();
    filtered.forEach(m => {
      const seriesName = (m.series && m.series.trim()) ? m.series.trim() : 'Other Models';
      if (!map.has(seriesName)) {
        map.set(seriesName, []);
      }
      map.get(seriesName)!.push(m);
    });

    map.forEach((modelList, seriesName) => {
      const sorted = sortModelsByLaunchDesc(modelList);
      map.set(seriesName, applyModelOrder(selectedCatalogBrandId, sorted));
    });

    return map;
  }, [models, catalogDeviceCategory, selectedCatalogBrandId, catalogSearch]);



  const handleSaveModelEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModelId) return;
    setFormError('');
    setFormSuccess('');

    if (!editName.trim()) {
      setFormError('Name is required.');
      return;
    }

    let finalSeries = '';
    if (editSeriesOption === '__CREATE_NEW__') {
      finalSeries = editCustomSeries.trim();
    } else {
      finalSeries = editSeriesOption.trim();
    }

    const imageUrlValue = editImageUrl.trim() || undefined;

    try {
      await updateModel(editingModelId, {
        name: editName.trim(),
        category: editCategory,
        releaseYear: Number(editYear),
        basePrice128GB: Number(editBasePrice),
        series: finalSeries || undefined,
        imageUrl: imageUrlValue,
        supportedStorageGb: editStorageGb,
        supportedRamGb: editRamGb,
        variantPrices: editVariantPrices,
      });

      setFormSuccess(`Successfully saved changes to "${editName}"!`);
      setEditingModelId(null);
      setIsApiOffline(false);
      await loadModels();
      if (onRefreshCatalog) {
        await onRefreshCatalog();
      }
    } catch (err) {
      console.error('Failed to update model in database:', err);
      setFormError('Failed to update model in database: ' + (err as Error).message);
    }
  };

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    if (!newModelName.trim()) {
      setFormError('Name is required.');
      return;
    }

    // Determine final Series designation
    let finalSeries = '';
    if (selectedSeriesOption === '__CREATE_NEW__') {
      finalSeries = customSeriesInput.trim();
    } else {
      finalSeries = selectedSeriesOption.trim();
    }
    
    // Auto-generate legacyId from name
    const cleanName = newModelName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const brandClean = selectedCatalogBrandId.replace('brand-', '');
    const legacyId = `${brandClean}-${cleanName}`;

    const imageUrlValue = newModelImageUrl.trim() || undefined;

    try {
      await createModel({
        legacyId,
        brandId: selectedCatalogBrandId,
        name: newModelName.trim(),
        category: newModelCategory,
        releaseYear: Number(newModelYear),
        basePrice128GB: Number(newModelBasePrice),
        series: finalSeries || undefined,
        imageUrl: imageUrlValue,
        supportedStorageGb: newModelStorageGb,
        supportedRamGb: newModelRamGb,
        variantPrices: newVariantPrices,
      });
      
      setFormSuccess(`Successfully added model "${newModelName}" to database!`);
      setNewModelName('');
      setCustomSeriesInput('');
      setNewModelImageUrl('');
      setNewModelStorageGb([128, 256, 512]);
      setNewModelRamGb([0]);
      setNewVariantPrices({});
      setIsApiOffline(false);
      
      // Refresh catalog lists
      await loadModels();
      if (onRefreshCatalog) {
        await onRefreshCatalog();
      }
    } catch (err) {
      console.error('Failed to create model in database:', err);
      setFormError('Failed to create model in database: ' + (err as Error).message);
    }
  };

  const handleDeleteModel = async (legacyId: string) => {
    if (!window.confirm(`Are you sure you want to delete model: ${legacyId}?`)) {
      return;
    }
    try {
      await deleteModel(legacyId);
      setIsApiOffline(false);
      await loadModels();
      if (onRefreshCatalog) {
        await onRefreshCatalog();
      }
    } catch (err) {
      console.error('Failed to delete model in database:', err);
      setFormError('Failed to delete model in database: ' + (err as Error).message);
    }
  };

  return (
    <div className="w-full text-left space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-ice-border pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-sm border border-ice-border hover:border-cobalt hover:bg-cobalt-light/10 text-ink-slate hover:text-cobalt transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-0.5">Control Center</span>
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-light text-ink-navy tracking-tight">Admin Operations Panel</h2>
              {isApiOffline ? (
                <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-wider rounded-sm bg-amber-500/10 text-amber-500 border border-amber-500/20 uppercase">
                  âš ï¸ Offline Demo Mode (Simulated)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-wider rounded-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                  âš¡ SQLite Database Online
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 self-stretch sm:self-auto">
          <button
            onClick={loadBookings}
            disabled={loadingBookings}
            className="flex-1 sm:flex-initial px-4 py-2 border border-cobalt/30 text-cobalt hover:bg-cobalt/10 text-xs font-bold rounded-sm transition-all flex items-center justify-center gap-1.5"
            style={{ minHeight: '38px' }}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingBookings ? 'animate-spin' : ''}`} />
            Refresh Bookings
          </button>
          <button
            onClick={handleResetDemoData}
            className="flex-1 sm:flex-initial px-4 py-2 border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-bold rounded-sm transition-all flex items-center justify-center gap-1.5"
            style={{ minHeight: '38px' }}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Ledger Data
          </button>
        </div>
      </div>

      {/* Premium Tab Buttons */}
      <div className="flex flex-wrap border-b border-ice-border/60 gap-1">
        <button
          onClick={() => setActiveTab('ledger')}
          className={`px-4 py-2.5 border-b-2 text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'ledger'
              ? 'border-cobalt text-cobalt'
              : 'border-transparent text-ink-slate hover:text-ink-navy'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          Transactions Ledger ({bookings.length})
        </button>
        <button
          onClick={() => {
            setActiveTab('catalog');
            setCatalogDeviceCategory('smartphones');
          }}
          className={`px-4 py-2.5 border-b-2 text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'catalog' && catalogDeviceCategory === 'smartphones'
              ? 'border-cobalt text-cobalt font-extrabold'
              : 'border-transparent text-ink-slate hover:text-ink-navy'
          }`}
        >
          <Smartphone className="w-3.5 h-3.5" />
          Smartphones ({smartphonesCount})
        </button>
        <button
          onClick={() => {
            setActiveTab('catalog');
            setCatalogDeviceCategory('tablets');
          }}
          className={`px-4 py-2.5 border-b-2 text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'catalog' && catalogDeviceCategory === 'tablets'
              ? 'border-cobalt text-cobalt font-extrabold'
              : 'border-transparent text-ink-slate hover:text-ink-navy'
          }`}
        >
          <Tablet className="w-3.5 h-3.5 text-purple-600" />
          Tablets ({tabletsCount})
        </button>
        <button
          onClick={() => {
            setActiveTab('catalog');
            setCatalogDeviceCategory('smartwatches');
          }}
          className={`px-4 py-2.5 border-b-2 text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'catalog' && catalogDeviceCategory === 'smartwatches'
              ? 'border-cobalt text-cobalt font-extrabold'
              : 'border-transparent text-ink-slate hover:text-ink-navy'
          }`}
        >
          <Watch className="w-3.5 h-3.5 text-amber-600" />
          Smartwatches ({smartwatchesCount})
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`px-4 py-2.5 border-b-2 text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'support'
              ? 'border-cobalt text-cobalt'
              : 'border-transparent text-ink-slate hover:text-ink-navy'
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Support Inbox
        </button>
      </div>

      {activeTab === 'ledger' && (
        <>
          {/* KPI Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1 */}
            <div className="bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 shadow-sm">
              <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Total Payouts Completed</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl sm:text-3xl font-bold text-emerald-500 tracking-tight">{formatPrice(metrics.totalPaidAmt)}</span>
              </div>
              <span className="text-[9px] text-zinc-400 block mt-1 font-mono">{metrics.completedPayouts} successful disbursements</span>
            </div>

            {/* KPI 2 */}
            <div className="bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 shadow-sm">
              <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Pending Inspections</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl sm:text-3xl font-bold text-amber-500 tracking-tight">{metrics.pendingInspections}</span>
              </div>
              <span className="text-[9px] text-zinc-400 block mt-1 font-mono">Requires doorstep agent check</span>
            </div>

            {/* KPI 3 */}
            <div className="bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 shadow-sm">
              <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Seller Verification Rate</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl sm:text-3xl font-bold text-cobalt tracking-tight">{metrics.verificationRate}%</span>
              </div>
              <span className="text-[9px] text-zinc-400 block mt-1 font-mono">DigiLocker KYC success index</span>
            </div>

            {/* KPI 4 */}
            <div className="bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 shadow-sm">
              <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase block">Disbursed Bookings</span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl sm:text-3xl font-bold text-ink-navy tracking-tight">{metrics.completedPayouts} / {bookings.length}</span>
              </div>
              <span className="text-[9px] text-zinc-400 block mt-1 font-mono">Sourced inventory liquidations</span>
            </div>
          </div>

          {/* Main Ledger workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* Left Side: Table Ledger */}
            <div className={`bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-6 shadow-premium transition-all ${selectedBookingId ? 'lg:col-span-8' : 'lg:col-span-12'}`}>
              <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center pb-4 mb-4 border-b border-white/[0.04]">
                <h3 className="font-outfit font-light text-xl text-ink-navy">Transactions Ledger ({filteredBookings.length})</h3>
                
                {/* Search & Export */}
                <div className="flex items-center gap-2 max-w-md w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search Client, IMEI, ID..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 rounded-sm border border-ice-border bg-canvas-white text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt font-mono"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const csvHeader = "ID,Client,Phone,Model,Valuation,KYC,Inspection,Payout\n";
                      const csvRows = filteredBookings.map(b => 
                        `"${b.id}","${b.customerName}","${b.customerPhone}","${b.modelName}",${b.finalPrice},"${b.verificationStatus}","${b.inspectionStatus}","${b.payoutStatus}"`
                      ).join("\n");
                      const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `smartphone_centre_ledger_${new Date().toISOString().slice(0,10)}.csv`;
                      a.click();
                    }}
                    className="px-3 py-2 bg-canvas-white hover:bg-slate-100 dark:hover:bg-zinc-800 border border-ice-border rounded-sm text-xs font-bold text-ink-navy font-mono transition-all flex items-center gap-1.5 focus-ring"
                    title="Export current table view to CSV"
                  >
                    <span>Export CSV</span>
                  </button>
                </div>
              </div>

              {/* Ledger filters */}
              <div className="flex flex-wrap items-center gap-4 text-xs bg-canvas-white p-3 rounded-sm border border-ice-border/60 mb-4">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-semibold text-ink-slate font-mono">Filters:</span>
                </div>
                
                {/* Verification status dropdown */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-500 font-mono">KYC:</span>
                  <select
                    value={filterVerification}
                    onChange={e => setFilterVerification(e.target.value)}
                    className="bg-canvas-pure border border-ice-border rounded-sm py-1 px-1.5 font-mono text-[10px] focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="verified">Verified</option>
                    <option value="pending">Pending</option>
                    <option value="failed">Failed</option>
                  </select>
                </div>

                {/* Inspection dropdown */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-500 font-mono">Inspection:</span>
                  <select
                    value={filterInspection}
                    onChange={e => setFilterInspection(e.target.value)}
                    className="bg-canvas-pure border border-ice-border rounded-sm py-1 px-1.5 font-mono text-[10px] focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                {/* Payout dropdown */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-500 font-mono">Payout:</span>
                  <select
                    value={filterPayout}
                    onChange={e => setFilterPayout(e.target.value)}
                    className="bg-canvas-pure border border-ice-border rounded-sm py-1 px-1.5 font-mono text-[10px] focus:outline-none"
                  >
                    <option value="all">All</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              </div>

              {/* Table Container */}
              <div className="overflow-x-auto border border-ice-border/60 rounded-sm max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="sticky top-0 z-20 bg-canvas-white/95 backdrop-blur-md border-b border-ice-border text-zinc-500 font-semibold tracking-wider text-[10px] uppercase shadow-xs">
                    <tr>
                      <th className="p-3">Order ID</th>
                      <th className="p-3">Client</th>
                      <th className="p-3">Device</th>
                      <th className="p-3">Est. Value</th>
                      <th className="p-3">KYC Status</th>
                      <th className="p-3">Inspection</th>
                      <th className="p-3">Payout</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map(b => {
                        const isSelected = selectedBookingId === b.id;
                        return (
                          <tr 
                            key={b.id} 
                            onClick={() => setSelectedBookingId(b.id)}
                            className={`hover:bg-cobalt-light/5 cursor-pointer transition-all ${
                              isSelected ? 'bg-cobalt-light/10 font-semibold' : ''
                            }`}
                          >
                            <td className="py-3 px-3 text-cobalt font-bold">{b.id}</td>
                            <td className="py-3 px-3 text-zinc-400">
                              {b.dateCreated ? new Date(b.dateCreated).toLocaleDateString('en-IN') : b.pickupDate}
                            </td>
                            <td className="py-3 px-3">
                              <span className="block text-ink-navy font-bold">{b.customerName}</span>
                              <span className="block text-[10px] text-zinc-500">{b.customerPhone}</span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="block text-ink-navy">{b.modelName}</span>
                              <span className="block text-zinc-400 text-[10px]">Base: {formatPrice(b.finalPrice)}</span>
                              <span className="block text-cobalt font-bold text-[11px]">{formatPrice(b.finalPayoutAmount !== undefined ? b.finalPayoutAmount : b.finalPrice)}</span>
                              {b.bonusPercentage > 0 && (
                                <span className="block text-emerald-500 text-[9px] font-bold">+{b.bonusPercentage * 100}% Bonus</span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {b.verificationStatus === 'verified' && (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-sm border border-emerald-500/20 font-bold uppercase">
                                  <CheckCircle className="w-2.5 h-2.5" /> Verified
                                </span>
                              )}
                              {b.verificationStatus === 'failed' && (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-sm border border-red-500/20 font-bold uppercase">
                                  <XCircle className="w-2.5 h-2.5" /> Failed
                                </span>
                              )}
                              {b.verificationStatus === 'pending' && (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-sm border border-amber-500/20 font-bold uppercase">
                                  <Clock className="w-2.5 h-2.5" /> Pending
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {b.inspectionStatus === 'approved' && (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-sm border border-emerald-500/20 font-bold uppercase">
                                  Approved
                                </span>
                              )}
                              {b.inspectionStatus === 'rejected' && (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-sm border border-red-500/20 font-bold uppercase">
                                  Rejected
                                </span>
                              )}
                              {b.inspectionStatus === 'pending' && (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-sm border border-amber-500/20 font-bold uppercase">
                                  Pending
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3">
                              {b.payoutStatus === 'completed' ? (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-sm border border-emerald-500/20 font-bold uppercase">
                                  Paid
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-sm border border-amber-500/20 font-bold uppercase">
                                  Unpaid
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                type="button"
                                className="p-1 rounded-sm border border-ice-border hover:bg-cobalt hover:text-white transition-colors"
                              >
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-zinc-500 italic">
                          [No bookings matching search/filter bounds found]
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Right Side: Detail Drawer Workspace */}
            <AnimatePresence>
              {selectedBookingId && selectedBooking && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="lg:col-span-4 bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 shadow-premium space-y-5 text-xs text-left"
                >
                  {/* Drawer header */}
                  <div className="flex justify-between items-start border-b border-white/[0.04] pb-3">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase">Docket View</span>
                        <span className="text-[9px] font-mono bg-zinc-950 text-cobalt px-1.5 py-0.5 rounded-sm font-bold border border-white/[0.06]">
                          #{selectedBooking.id}
                        </span>
                      </div>
                      <h4 className="font-light text-lg text-ink-navy mt-1">Transaction Dossier</h4>
                    </div>
                    <button
                      onClick={() => setSelectedBookingId(null)}
                      className="p-1.5 rounded-sm border border-ice-border text-ink-slate hover:border-red-500 hover:text-red-500 transition-colors"
                    >
                      Close Dossier
                    </button>
                  </div>

                  {/* Client Contact Dossier */}
                  <div className="space-y-2 bg-canvas-white/40 p-3.5 rounded-sm border border-white/[0.04]">
                    <span className="text-[9px] font-mono tracking-[0.15em] text-zinc-500 uppercase block font-bold">1. Client specifications</span>
                    <div className="space-y-1.5 font-mono text-zinc-300 font-light">
                      <div className="flex items-start gap-1.5">
                        <User className="w-3.5 h-3.5 text-cobalt mt-0.5 flex-shrink-0" />
                        <span className="text-zinc-600"><strong>Client Name:</strong> {selectedBooking.customerName}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <CreditCard className="w-3.5 h-3.5 text-cobalt mt-0.5 flex-shrink-0" />
                        <span className="text-zinc-600"><strong>WhatsApp:</strong> +91 {selectedBooking.customerPhone}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <span className="text-cobalt font-semibold select-none mt-0.5">@</span>
                        <span className="text-zinc-600"><strong>Email:</strong> {selectedBooking.customerEmail}</span>
                      </div>
                      <div className="flex items-start gap-1.5 border-t border-white/[0.04] pt-1.5 mt-1.5">
                        <Calendar className="w-3.5 h-3.5 text-cobalt mt-0.5 flex-shrink-0" />
                        <span className="text-zinc-600"><strong>Pickup:</strong> {selectedBooking.pickupDate} @ {selectedBooking.pickupTimeSlot.split(' ')[0]}</span>
                      </div>
                      <div className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cobalt mt-0.5 flex-shrink-0" />
                        <span className="leading-tight text-zinc-600"><strong>Address:</strong> {selectedBooking.address}</span>
                      </div>
                    </div>
                  </div>

                  {/* Aadhaar Verification Section */}
                  <div className="space-y-2 bg-canvas-white/40 p-3.5 rounded-sm border border-white/[0.04]">
                    <span className="text-[9px] font-mono tracking-[0.15em] text-zinc-500 uppercase block font-bold">2. Seller KYC (DigiLocker)</span>
                    
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Aadhaar Status</span>
                      {selectedBooking.verificationStatus === 'verified' ? (
                        <span className="inline-flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded-sm border border-emerald-500/20 font-bold uppercase">
                          Verified
                        </span>
                      ) : selectedBooking.verificationStatus === 'failed' ? (
                        <span className="inline-flex items-center gap-1 text-[9px] bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-sm border border-red-500/20 font-bold uppercase">
                          Failed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded-sm border border-amber-500/20 font-bold uppercase">
                          Pending
                        </span>
                      )}
                    </div>

                    {selectedBooking.verificationStatus === 'verified' && (
                      <div className="font-mono text-[10px] text-zinc-600 space-y-1 bg-canvas-white p-2 border border-ice-border rounded-sm">
                        <div><strong>Verified Name:</strong> {selectedBooking.verifiedName}</div>
                        <div><strong>Masked Aadhaar:</strong> {selectedBooking.maskedAadhaar}</div>
                        <div><strong>KYC Timestamp:</strong> {selectedBooking.verificationDate ? new Date(selectedBooking.verificationDate).toLocaleString('en-IN') : 'N/A'}</div>
                      </div>
                    )}
                    
                    {selectedBooking.verificationStatus === 'failed' && (
                      <div className="text-[10px] text-red-500 italic font-mono pl-1">
                        * Identity verification failed during SMS OTP authentication or user declined.
                      </div>
                    )}
                  </div>

                  {/* Payout Details Section */}
                  <div className="space-y-2 bg-canvas-white/40 p-3.5 rounded-sm border border-white/[0.04]">
                    <span className="text-[9px] font-mono tracking-[0.15em] text-zinc-500 uppercase block font-bold">3. Payout Details</span>
                    
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Method</span>
                      <span className="text-cobalt font-bold uppercase">{selectedBooking.payoutMethodName || selectedBooking.payoutMethod}</span>
                    </div>

                    <div className="font-mono text-[10px] text-zinc-600 space-y-1 bg-canvas-white p-2 border border-ice-border rounded-sm">
                      {selectedBooking.payoutMethod === 'upi' && selectedBooking.payoutDetails?.upiId ? (
                        <div><strong>UPI ID:</strong> {selectedBooking.payoutDetails.upiId}</div>
                      ) : selectedBooking.payoutMethod === 'bank' && selectedBooking.payoutDetails?.accountNumber ? (
                        <>
                          <div><strong>Holder Name:</strong> {selectedBooking.payoutDetails.accountHolderName}</div>
                          <div><strong>A/C Number:</strong> {selectedBooking.payoutDetails.accountNumber}</div>
                          <div><strong>IFSC Code:</strong> {selectedBooking.payoutDetails.ifscCode}</div>
                        </>
                      ) : (
                        <div className="text-emerald-600 italic">Store voucher details sent directly to registered email and SMS targets.</div>
                      )}
                    </div>

                    <div className="font-mono text-[10px] text-zinc-700 space-y-1 pt-1.5 border-t border-ice-border mt-1">
                      <div className="flex justify-between">
                        <span>Base Value:</span>
                        <span>{formatPrice(selectedBooking.finalPrice)}</span>
                      </div>
                      {selectedBooking.bonusPercentage > 0 && (
                        <div className="flex justify-between text-emerald-600 font-bold">
                          <span>Bonus Applied (+{(selectedBooking.bonusPercentage * 100).toFixed(1)}%):</span>
                          <span>+{formatPrice(selectedBooking.bonusAmount || 0)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-ink-navy font-bold border-t border-ice-border pt-1 mt-1 text-[11px]">
                        <span>Final Payout Amount:</span>
                        <span className="text-cobalt">{formatPrice(selectedBooking.finalPayoutAmount !== undefined ? selectedBooking.finalPayoutAmount : selectedBooking.finalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Device specifications list */}
                  <div className="space-y-2">
                    <span className="text-[9px] font-mono tracking-[0.15em] text-zinc-500 uppercase block font-bold">4. Device Valuation spec</span>
                    <div className="border border-ice-border/60 bg-canvas-white rounded-sm p-3 font-mono">
                      <div className="flex justify-between items-center text-ink-navy font-bold border-b border-ice-border/40 pb-1.5 mb-1.5">
                        <span>{selectedBooking.modelName}</span>
                        <span className="text-zinc-500 font-normal">{selectedBooking.storageGb}GB â€¢ {selectedBooking.color}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 mb-2">
                        <span>Final Calculated Price:</span>
                        <span className="text-emerald-500 font-bold text-sm">{formatPrice(selectedBooking.finalPrice)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Admin Actions Panel */}
                  <div className="border-t border-ice-border pt-4 space-y-3">
                    <span className="text-[9px] font-mono tracking-[0.15em] text-zinc-500 uppercase block font-bold">5. Administrative Controls</span>
                    
                    {/* Stage 1: Inspection Approval */}
                    <div className="space-y-2">
                      <span className="text-[10px] text-zinc-500 font-mono block">Physical Doorstep Inspection:</span>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => handleInspectionChange(selectedBooking.id, 'approved')}
                          disabled={selectedBooking.inspectionStatus === 'approved'}
                          className={`py-2 px-3 text-xs font-bold rounded-sm border transition-all flex items-center justify-center gap-1.5 ${
                            selectedBooking.inspectionStatus === 'approved'
                              ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30 cursor-not-allowed opacity-90'
                              : 'bg-canvas-white text-ink-navy border-ice-border hover:border-emerald-400 hover:text-emerald-500 hover:bg-emerald-500/5'
                          }`}
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve Match
                        </button>
                        
                        <button
                          type="button"
                          onClick={() => handleInspectionChange(selectedBooking.id, 'rejected')}
                          disabled={selectedBooking.inspectionStatus === 'rejected'}
                          className={`py-2 px-3 text-xs font-bold rounded-sm border transition-all flex items-center justify-center gap-1.5 ${
                            selectedBooking.inspectionStatus === 'rejected'
                              ? 'bg-red-500/10 text-red-500 border-red-500/30 cursor-not-allowed opacity-90'
                              : 'bg-canvas-white text-ink-navy border-ice-border hover:border-red-400 hover:text-red-500 hover:bg-red-500/5'
                          }`}
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject Match
                        </button>
                      </div>
                    </div>

                    {/* Stage 2: Mark Payout Completed */}
                    <div className="space-y-2 pt-1">
                      <span className="text-[10px] text-zinc-500 font-mono block">Financial Disbursement:</span>
                      <button
                        type="button"
                        onClick={() => handlePayoutComplete(selectedBooking.id)}
                        disabled={selectedBooking.inspectionStatus !== 'approved' || selectedBooking.payoutStatus === 'completed'}
                        className={`w-full py-2.5 px-3 text-xs font-bold rounded-sm border transition-all flex items-center justify-center gap-2 ${
                          selectedBooking.payoutStatus === 'completed'
                            ? 'bg-emerald-600 border-emerald-600 text-white cursor-not-allowed'
                            : selectedBooking.inspectionStatus !== 'approved'
                            ? 'bg-canvas-white text-zinc-400 border-ice-border cursor-not-allowed opacity-50'
                            : 'bg-cobalt hover:bg-cobalt-hover text-white border-cobalt hover:scale-[1.01]'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        {selectedBooking.payoutStatus === 'completed' ? 'Payout Marked Completed âœ“' : 'Disburse Instant Payout'}
                      </button>
                      {selectedBooking.inspectionStatus !== 'approved' && selectedBooking.payoutStatus !== 'completed' && (
                        <span className="text-[9px] text-amber-500 block italic leading-tight mt-1 text-center font-mono">
                          * Must approve doorstep inspect match before payout release.
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {activeTab === 'catalog' && (
        /* Catalog Management Tab Workspace */
        <div className="space-y-6">
          {/* Dedicated Category Panels Selector (Smartphones, Tablets, Smartwatches) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-canvas-pure border border-ice-border p-2.5 rounded-sm shadow-sm">
            <button
              type="button"
              onClick={() => {
                setCatalogDeviceCategory('smartphones');
                setSelectedTreeModelId(null);
                setEditingModelId(null);
                setFormError('');
                setFormSuccess('');
              }}
              className={`p-3 rounded-sm border flex items-center justify-between transition-all font-outfit text-sm font-semibold cursor-pointer ${
                catalogDeviceCategory === 'smartphones'
                  ? 'bg-cobalt text-white border-cobalt shadow-premium'
                  : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Smartphone className="w-4 h-4" />
                <span>Smartphones Panel</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                catalogDeviceCategory === 'smartphones' ? 'bg-white/20 text-white' : 'bg-cobalt/10 text-cobalt'
              }`}>
                {smartphonesCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCatalogDeviceCategory('tablets');
                setSelectedTreeModelId(null);
                setEditingModelId(null);
                setFormError('');
                setFormSuccess('');
              }}
              className={`p-3 rounded-sm border flex items-center justify-between transition-all font-outfit text-sm font-semibold cursor-pointer ${
                catalogDeviceCategory === 'tablets'
                  ? 'bg-cobalt text-white border-cobalt shadow-premium'
                  : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Tablet className="w-4 h-4" />
                <span>Tablets Panel</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                catalogDeviceCategory === 'tablets' ? 'bg-white/20 text-white' : 'bg-cobalt/10 text-cobalt'
              }`}>
                {tabletsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setCatalogDeviceCategory('smartwatches');
                setSelectedTreeModelId(null);
                setEditingModelId(null);
                setFormError('');
                setFormSuccess('');
              }}
              className={`p-3 rounded-sm border flex items-center justify-between transition-all font-outfit text-sm font-semibold cursor-pointer ${
                catalogDeviceCategory === 'smartwatches'
                  ? 'bg-cobalt text-white border-cobalt shadow-premium'
                  : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/40'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Watch className="w-4 h-4" />
                <span>Smartwatches Panel</span>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                catalogDeviceCategory === 'smartwatches' ? 'bg-white/20 text-white' : 'bg-cobalt/10 text-cobalt'
              }`}>
                {smartwatchesCount}
              </span>
            </button>
          </div>

          {/* Mode Switcher: Manage Models vs Shuffle & Display Order */}
          <div className="flex items-center justify-between bg-canvas-pure border border-ice-border p-3 rounded-sm shadow-sm">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCatalogViewMode('manage')}
                className={`px-4 py-2 rounded-sm border text-xs font-bold font-mono transition-all flex items-center gap-2 ${
                  catalogViewMode === 'manage'
                    ? 'bg-cobalt border-cobalt text-white shadow-sm'
                    : 'bg-canvas-white border-ice-border text-ink-slate hover:border-cobalt/50 hover:text-cobalt'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Catalog Hierarchy &amp; Specs Editor
              </button>
              <button
                type="button"
                onClick={() => setCatalogViewMode('ordering')}
                className={`px-4 py-2 rounded-sm border text-xs font-bold font-mono transition-all flex items-center gap-2 ${
                  catalogViewMode === 'ordering'
                    ? 'bg-cobalt border-cobalt text-white shadow-sm'
                    : 'bg-canvas-white border-ice-border text-ink-slate hover:border-cobalt/50 hover:text-cobalt'
                }`}
              >
                <Shuffle className="w-3.5 h-3.5" />
                Shuffle &amp; Display Order (Brands, Series &amp; Models) 🎲
              </button>
            </div>
            <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
              {catalogViewMode === 'manage' ? 'Manage & edit device specs' : 'Reorder or shuffle storefront display sequence'}
            </span>
          </div>

          {catalogViewMode === 'ordering' && (
            /* Shuffle & Display Order Workspace */
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-gradient-to-r from-cobalt/10 via-cobalt/5 to-transparent border border-cobalt/20 rounded-sm p-4 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-cobalt font-extrabold font-outfit text-base">
                    <Shuffle className="w-4 h-4" />
                    Catalog Display Sequence &amp; Shuffle Controls
                  </div>
                  <p className="text-xs text-ink-slate font-light mt-1">
                    Customize the display order or randomly shuffle Brands, Series, and Models. Save your custom layout as default or reset at any time.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleSetAllDefault}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-mono rounded-sm transition-all flex items-center justify-center gap-1.5 shadow-sm flex-shrink-0"
                  title="Save current brand, series, and model arrangement as system default"
                >
                  <BookmarkCheck className="w-4 h-4" />
                  Set All As Default 📌
                </button>
              </div>

              {/* Device Category Scope Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-canvas-pure border border-ice-border p-3.5 rounded-sm shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-500">Target Category Scope:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => { setOrderingCategoryFilter('smartphones'); setOrderingSelectedSeries(''); }}
                      className={`px-3 py-1.5 rounded-sm border text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                        orderingCategoryFilter === 'smartphones'
                          ? 'bg-cobalt border-cobalt text-white shadow-xs'
                          : 'bg-canvas-white border-ice-border text-ink-slate hover:border-cobalt/50 hover:text-cobalt'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      Smartphones 📱
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOrderingCategoryFilter('tablets'); setOrderingSelectedSeries(''); }}
                      className={`px-3 py-1.5 rounded-sm border text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                        orderingCategoryFilter === 'tablets'
                          ? 'bg-cobalt border-cobalt text-white shadow-xs'
                          : 'bg-canvas-white border-ice-border text-ink-slate hover:border-cobalt/50 hover:text-cobalt'
                      }`}
                    >
                      <Tablet className="w-3.5 h-3.5" />
                      Tablets 📱💻
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOrderingCategoryFilter('smartwatches'); setOrderingSelectedSeries(''); }}
                      className={`px-3 py-1.5 rounded-sm border text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                        orderingCategoryFilter === 'smartwatches'
                          ? 'bg-cobalt border-cobalt text-white shadow-xs'
                          : 'bg-canvas-white border-ice-border text-ink-slate hover:border-cobalt/50 hover:text-cobalt'
                      }`}
                    >
                      <Watch className="w-3.5 h-3.5" />
                      Smartwatches ⌚
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOrderingCategoryFilter('all'); setOrderingSelectedSeries(''); }}
                      className={`px-3 py-1.5 rounded-sm border text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                        orderingCategoryFilter === 'all'
                          ? 'bg-cobalt border-cobalt text-white shadow-xs'
                          : 'bg-canvas-white border-ice-border text-ink-slate hover:border-cobalt/50 hover:text-cobalt'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      All Devices 🌐
                    </button>
                  </div>
                </div>
                <span className="text-[11px] font-mono text-zinc-500">
                  Category Mode: <strong className="text-cobalt font-bold capitalize">{orderingCategoryFilter}</strong>
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                
                {/* 1. Brands Ordering Card */}
                <div className="bg-canvas-pure border border-ice-border rounded-sm p-5 shadow-premium space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-ice-border pb-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-cobalt" />
                      <h4 className="font-outfit text-sm font-bold text-ink-navy uppercase">1. Brand Display Order</h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-cobalt/10 text-cobalt px-2 py-0.5 rounded">
                      {currentOrderedBrands.length} Brands
                    </span>
                  </div>

                  {/* Global Brand Action Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={handleShuffleBrands}
                      className="flex-1 py-1.5 px-2.5 bg-cobalt hover:bg-cobalt-hover text-white text-[11px] font-bold font-mono rounded-sm transition-all flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      Shuffle 🎲
                    </button>
                    <button
                      type="button"
                      onClick={handleSetDefaultBrands}
                      className="py-1.5 px-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[11px] font-mono font-bold rounded-sm transition-all flex items-center gap-1"
                      title="Set current brand order as default"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      Set Default 📌
                    </button>
                    <button
                      type="button"
                      onClick={handleResetBrands}
                      className="py-1.5 px-2 bg-canvas-white hover:bg-ice-gray text-ink-slate border border-ice-border text-[11px] font-mono rounded-sm transition-all flex items-center gap-1"
                      title="Reset to default brand order"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  </div>

                  {/* Brands List with Dragger & Up/Down buttons */}
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {currentOrderedBrands.map((brand, idx) => (
                      <div
                        key={brand.id}
                        draggable={true}
                        onDragStart={(e) => handleBrandDragStart(e, idx)}
                        onDragOver={(e) => handleBrandDragOver(e, idx)}
                        onDrop={(e) => handleBrandDrop(e, idx)}
                        onDragEnd={() => { setDraggedBrandIndex(null); setDragOverBrandIndex(null); }}
                        className={`flex items-center justify-between p-2.5 bg-canvas-white border rounded-sm shadow-xs group transition-all ${
                          dragOverBrandIndex === idx ? 'border-cobalt bg-cobalt/5 scale-[1.01]' : 'border-ice-border/80 hover:border-cobalt/40'
                        } ${draggedBrandIndex === idx ? 'opacity-40' : ''}`}
                      >
                        <div className="flex items-center gap-2">
                          <div className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-cobalt transition-colors p-0.5" title="Drag to reorder brand">
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <span className="w-5 h-5 rounded bg-cobalt/10 text-cobalt font-mono text-[10px] font-bold flex items-center justify-center">
                            #{idx + 1}
                          </span>
                          <span className="font-outfit text-xs font-bold text-ink-navy">{brand.name}</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleMoveBrand(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-cobalt hover:text-white disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-current transition-colors"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveBrand(idx, 'down')}
                            disabled={idx === currentOrderedBrands.length - 1}
                            className="p-1 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-cobalt hover:text-white disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-current transition-colors"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Series Ordering Card */}
                <div className="bg-canvas-pure border border-ice-border rounded-sm p-5 shadow-premium space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-ice-border pb-3">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cobalt" />
                      <h4 className="font-outfit text-sm font-bold text-ink-navy uppercase">2. Series Order ({orderingCategoryFilter})</h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-cobalt/10 text-cobalt px-2 py-0.5 rounded">
                      {availableSeriesForOrdering.length} Series
                    </span>
                  </div>

                  {/* Brand Selector for Series */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-zinc-500 font-bold uppercase block">Select Target Brand:</label>
                    <select
                      value={orderingSelectedBrandId}
                      onChange={e => setOrderingSelectedBrandId(e.target.value)}
                      className="w-full p-2 bg-canvas-white border border-ice-border rounded-sm text-xs font-mono text-ink-navy focus:outline-none focus:ring-1 focus:ring-cobalt"
                    >
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Global Series Action Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={handleShuffleSeries}
                      className="flex-1 py-1.5 px-2.5 bg-cobalt hover:bg-cobalt-hover text-white text-[11px] font-bold font-mono rounded-sm transition-all flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      Shuffle 🎲
                    </button>
                    <button
                      type="button"
                      onClick={handleSetDefaultSeries}
                      className="py-1.5 px-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[11px] font-mono font-bold rounded-sm transition-all flex items-center gap-1"
                      title="Set current series order as default"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      Set Default 📌
                    </button>
                    <button
                      type="button"
                      onClick={handleResetSeries}
                      className="py-1.5 px-2 bg-canvas-white hover:bg-ice-gray text-ink-slate border border-ice-border text-[11px] font-mono rounded-sm transition-all flex items-center gap-1"
                      title="Reset series order for selected brand"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  </div>

                  {/* Series List with Dragger & Up/Down buttons */}
                  <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                    {availableSeriesForOrdering.length === 0 ? (
                      <div className="py-6 text-center text-xs font-mono text-zinc-400">No series found for this brand &amp; category.</div>
                    ) : (
                      availableSeriesForOrdering.map((seriesName, idx) => (
                        <div
                          key={seriesName}
                          draggable={true}
                          onDragStart={(e) => handleSeriesDragStart(e, idx)}
                          onDragOver={(e) => handleSeriesDragOver(e, idx)}
                          onDrop={(e) => handleSeriesDrop(e, idx)}
                          onDragEnd={() => { setDraggedSeriesIndex(null); setDragOverSeriesIndex(null); }}
                          className={`flex items-center justify-between p-2.5 bg-canvas-white border rounded-sm shadow-xs group transition-all ${
                            dragOverSeriesIndex === idx ? 'border-cobalt bg-cobalt/5 scale-[1.01]' : 'border-ice-border/80 hover:border-cobalt/40'
                          } ${draggedSeriesIndex === idx ? 'opacity-40' : ''}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-cobalt transition-colors p-0.5 flex-shrink-0" title="Drag to reorder series">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <span className="w-5 h-5 rounded bg-cobalt/10 text-cobalt font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              #{idx + 1}
                            </span>
                            <span className="font-outfit text-xs font-bold text-ink-navy truncate">{seriesName}</span>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveSeries(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-cobalt hover:text-white disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-current transition-colors"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveSeries(idx, 'down')}
                              disabled={idx === availableSeriesForOrdering.length - 1}
                              className="p-1 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-cobalt hover:text-white disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-current transition-colors"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* 3. Models Ordering Card */}
                <div className="bg-canvas-pure border border-ice-border rounded-sm p-5 shadow-premium space-y-4 text-left">
                  <div className="flex items-center justify-between border-b border-ice-border pb-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-cobalt" />
                      <h4 className="font-outfit text-sm font-bold text-ink-navy uppercase">3. Models Order ({orderingCategoryFilter})</h4>
                    </div>
                    <span className="text-[10px] font-mono font-bold bg-cobalt/10 text-cobalt px-2 py-0.5 rounded">
                      {availableModelsForOrdering.length} Models
                    </span>
                  </div>

                  {/* Brand & Series Selector for Models */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-500 font-bold uppercase block">Brand:</label>
                      <select
                        value={orderingSelectedBrandId}
                        onChange={e => setOrderingSelectedBrandId(e.target.value)}
                        className="w-full p-2 bg-canvas-white border border-ice-border rounded-sm text-xs font-mono text-ink-navy focus:outline-none focus:ring-1 focus:ring-cobalt"
                      >
                        {brands.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-mono text-zinc-500 font-bold uppercase block">Series:</label>
                      <select
                        value={orderingSelectedSeries}
                        onChange={e => setOrderingSelectedSeries(e.target.value)}
                        className="w-full p-2 bg-canvas-white border border-ice-border rounded-sm text-xs font-mono text-ink-navy focus:outline-none focus:ring-1 focus:ring-cobalt"
                      >
                        <option value="">-- All Series --</option>
                        {availableSeriesForOrdering.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Global Model Action Buttons */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={handleShuffleModels}
                      className="flex-1 py-1.5 px-2.5 bg-cobalt hover:bg-cobalt-hover text-white text-[11px] font-bold font-mono rounded-sm transition-all flex items-center justify-center gap-1 shadow-xs"
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      Shuffle 🎲
                    </button>
                    <button
                      type="button"
                      onClick={handleSetDefaultModels}
                      className="py-1.5 px-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700 text-[11px] font-mono font-bold rounded-sm transition-all flex items-center gap-1"
                      title="Set current model order as default"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      Set Default 📌
                    </button>
                    <button
                      type="button"
                      onClick={handleResetModels}
                      className="py-1.5 px-2 bg-canvas-white hover:bg-ice-gray text-ink-slate border border-ice-border text-[11px] font-mono rounded-sm transition-all flex items-center gap-1"
                      title="Reset model order for selected brand/series"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset
                    </button>
                  </div>

                  {/* Models List with Dragger & Up/Down buttons */}
                  <div className="space-y-2 max-h-[440px] overflow-y-auto pr-1">
                    {availableModelsForOrdering.length === 0 ? (
                      <div className="py-6 text-center text-xs font-mono text-zinc-400">No models found for this filter.</div>
                    ) : (
                      availableModelsForOrdering.map((model, idx) => (
                        <div
                          key={model.id}
                          draggable={true}
                          onDragStart={(e) => handleModelDragStart(e, idx)}
                          onDragOver={(e) => handleModelDragOver(e, idx)}
                          onDrop={(e) => handleModelDrop(e, idx)}
                          onDragEnd={() => { setDraggedModelIndex(null); setDragOverModelIndex(null); }}
                          className={`flex items-center justify-between p-2 bg-canvas-white border rounded-sm shadow-xs group transition-all ${
                            dragOverModelIndex === idx ? 'border-cobalt bg-cobalt/5 scale-[1.01]' : 'border-ice-border/80 hover:border-cobalt/40'
                          } ${draggedModelIndex === idx ? 'opacity-40' : ''}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="cursor-grab active:cursor-grabbing text-zinc-400 hover:text-cobalt transition-colors p-0.5 flex-shrink-0" title="Drag to reorder model">
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <span className="w-5 h-5 rounded bg-cobalt/10 text-cobalt font-mono text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                              #{idx + 1}
                            </span>
                            <div className="min-w-0">
                              <span className="font-outfit text-xs font-bold text-ink-navy truncate block">{model.name}</span>
                              <span className="text-[9px] font-mono text-zinc-500 block truncate">{model.series || 'No series'} · ₹{model.basePrice128GB.toLocaleString('en-IN')}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleMoveModel(idx, 'up')}
                              disabled={idx === 0}
                              className="p-1 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-cobalt hover:text-white disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-current transition-colors"
                              title="Move Up"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveModel(idx, 'down')}
                              disabled={idx === availableModelsForOrdering.length - 1}
                              className="p-1 rounded bg-slate-100 dark:bg-zinc-800 hover:bg-cobalt hover:text-white disabled:opacity-30 disabled:hover:bg-slate-100 disabled:hover:text-current transition-colors"
                              title="Move Down"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* Top Brand Filter Bar */}
          <div className="bg-canvas-pure border border-ice-border rounded-sm p-3 shadow-sm flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-500 font-bold">Select Brand:</span>
              <div className="flex flex-wrap gap-1.5">
                {brands.map(b => (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      setSelectedCatalogBrandId(b.id);
                      setSelectedTreeModelId(null);
                      setEditingModelId(null);
                      setFormError('');
                      setFormSuccess('');
                    }}
                    className={`px-3 py-1.5 rounded-sm border text-xs font-bold font-mono transition-all flex items-center gap-1.5 ${
                      selectedCatalogBrandId === b.id
                        ? 'bg-cobalt border-cobalt text-white shadow-sm'
                        : 'bg-canvas-white border-ice-border text-ink-slate hover:border-cobalt/50 hover:text-cobalt'
                    }`}
                  >
                    {catalogDeviceCategory === 'smartwatches' ? (
                      <Watch className="w-3.5 h-3.5" />
                    ) : catalogDeviceCategory === 'tablets' ? (
                      <Tablet className="w-3.5 h-3.5" />
                    ) : (
                      <Smartphone className="w-3.5 h-3.5" />
                    )}
                    {b.name}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-[11px] font-mono text-zinc-500">
              {displayedCatalogModels.length} models in {catalogDeviceCategory} ({brands.find(b => b.id === selectedCatalogBrandId)?.name || 'Brand'})
            </span>
          </div>

          {/* Main 2-Column Tree + Editor Workspace */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column: Brand → Series → Model Tree Hierarchy */}
            <div className="lg:col-span-5 bg-canvas-pure border border-ice-border rounded-sm p-4 shadow-premium space-y-4">
              <div className="flex items-center justify-between border-b border-ice-border/60 pb-3">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cobalt" />
                  <h3 className="font-outfit text-base font-semibold text-ink-navy">
                    {catalogDeviceCategory === 'smartwatches' ? 'Smartwatches Tree' : catalogDeviceCategory === 'tablets' ? 'Tablets Tree' : 'Smartphones Tree'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingModelId(null);
                    setSelectedTreeModelId(null);
                    setFormError('');
                    setFormSuccess('');
                  }}
                  className="px-2.5 py-1 bg-cobalt/10 hover:bg-cobalt/20 text-cobalt border border-cobalt/30 rounded-sm text-[10px] font-bold font-mono transition-all flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  New Model
                </button>
              </div>

              {/* Tree Search Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search series or models..."
                  value={catalogSearch}
                  onChange={e => setCatalogSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-canvas-white border border-ice-border rounded-sm text-xs font-mono text-ink-navy focus:outline-none focus:ring-1 focus:ring-cobalt"
                />
                {catalogSearch && (
                  <button onClick={() => setCatalogSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Tree Accordion / List */}
              {loadingModels ? (
                <div className="py-8 text-center text-zinc-400 font-mono text-xs">Loading device hierarchy...</div>
              ) : brandSeriesMap.size === 0 ? (
                <div className="py-8 text-center text-zinc-400 font-mono text-xs">No models found for this category and brand.</div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
                  {Array.from(brandSeriesMap.entries()).map(([seriesName, seriesModels]) => {
                    const isCollapsed = expandedSeries[seriesName] === false;
                    return (
                      <div key={seriesName} className="border border-ice-border/60 rounded-sm overflow-hidden bg-canvas-white">
                        {/* Series Node Header */}
                        <button
                          type="button"
                          onClick={() => setExpandedSeries(prev => ({ ...prev, [seriesName]: !isCollapsed }))}
                          className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800/40 hover:bg-slate-100 dark:hover:bg-zinc-800 border-b border-ice-border/40 flex items-center justify-between text-left transition-all"
                        >
                          <div className="flex items-center gap-2">
                            {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-cobalt" />}
                            <span className="font-outfit text-xs font-bold text-ink-navy">{seriesName}</span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-200/60 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                            {seriesModels.length}
                          </span>
                        </button>

                        {/* Series Models Children */}
                        {!isCollapsed && (
                          <div className="p-1 space-y-1">
                            {seriesModels.map(m => {
                              const isSelected = selectedTreeModelId === m.id || editingModelId === m.id;
                              const isWatch = isSmartwatchDevice(m.brandId, m.name, m.id);
                              const isTab = isTabletDevice(m.brandId, m.name, m.id);
                              return (
                                <button
                                  key={m.id}
                                  type="button"
                                  onClick={() => handleStartEditModel(m)}
                                  className={`w-full p-2 rounded-sm text-left font-mono transition-all flex items-center justify-between ${
                                    isSelected
                                      ? 'bg-cobalt text-white shadow-sm'
                                      : 'hover:bg-cobalt/5 text-ink-slate hover:text-cobalt'
                                  }`}
                                >
                                  <div>
                                    <div className="text-xs font-bold flex items-center gap-1.5">
                                      {isWatch ? (
                                        <Watch className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                                      ) : isTab ? (
                                        <Tablet className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                                      ) : (
                                        <Smartphone className="w-3.5 h-3.5 text-cobalt flex-shrink-0" />
                                      )}
                                      <span>{m.name}</span>
                                      <span className={`text-[9px] px-1 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                                        {m.releaseYear}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className={`text-[10px] ${isSelected ? 'text-white/80' : 'text-zinc-400'}`}>
                                        {m.id}
                                      </span>
                                      {(() => {
                                        const rams = getModelSupportedRam(m).filter(r => r > 0);
                                        if (rams.length > 0) {
                                          return (
                                            <span className={`text-[9px] font-bold px-1 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-cobalt/10 text-cobalt'}`}>
                                              {rams.join('/')}GB RAM
                                            </span>
                                          );
                                        }
                                        return (
                                          <span className={`text-[9px] font-bold px-1 rounded ${isSelected ? 'bg-white/20 text-white' : 'bg-amber-500/10 text-amber-600'}`}>
                                            No RAM (Apple)
                                          </span>
                                        );
                                      })()}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className={`text-[11px] font-bold block ${isSelected ? 'text-white' : 'text-emerald-600'}`}>
                                      {formatPrice(m.basePrice128GB)}
                                    </span>
                                    <span className={`text-[9px] uppercase font-bold ${isSelected ? 'text-white/70' : 'text-zinc-400'}`}>
                                      {m.category}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Right Column: Model Detail & Price Matrix Editor */}
            <div className="lg:col-span-7 bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-6 shadow-premium space-y-6">
              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 rounded-sm text-xs font-mono font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-sm text-xs font-mono font-bold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {editingModelId ? (
                /* Edit Existing Model Mode */
                <form onSubmit={handleSaveModelEdit} className="space-y-6">
                  <div className="flex justify-between items-center border-b border-ice-border/60 pb-3">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cobalt font-bold">Model Configurator</span>
                      <h3 className="font-outfit text-xl font-bold text-ink-navy">{editName || 'Edit Model'}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 border border-ice-border text-zinc-400 hover:text-ink-navy text-xs font-bold font-mono rounded-sm transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteModel(editingModelId)}
                        className="px-3 py-1.5 border border-red-500/30 text-red-500 hover:bg-red-500/10 text-xs font-bold font-mono rounded-sm transition-all flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </div>

                  {/* Basic Specifications */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold mb-1">Model Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full px-3 py-2 bg-canvas-white border border-ice-border rounded-sm text-xs font-mono font-bold text-ink-navy focus:border-cobalt focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold mb-1">Category</label>
                      <select
                        value={editCategory}
                        onChange={e => setEditCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-canvas-white border border-ice-border rounded-sm text-xs font-mono text-ink-navy focus:border-cobalt focus:outline-none"
                      >
                        <option value="flagship">Flagship</option>
                        <option value="premium">Premium</option>
                        <option value="midrange">Midrange</option>
                        <option value="budget">Budget</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold mb-1">Release Year</label>
                      <input
                        type="number"
                        value={editYear}
                        onChange={e => setEditYear(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-canvas-white border border-ice-border rounded-sm text-xs font-mono text-ink-navy focus:border-cobalt focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* RAM & Storage Variant Selection */}
                  <div className="space-y-4 bg-canvas-white p-4 border border-ice-border rounded-sm">
                    {/* RAM variants selector */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[11px] font-mono font-bold text-ink-navy flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-cobalt" />
                          RAM Variants (GB)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (editRamGb.length === 1 && editRamGb[0] === 0) {
                              setEditRamGb([8]);
                            } else {
                              setEditRamGb([0]);
                            }
                          }}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold transition-all ${
                            editRamGb.length === 1 && editRamGb[0] === 0
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                              : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:border-cobalt'
                          }`}
                        >
                          {editRamGb.length === 1 && editRamGb[0] === 0 ? '✓ No RAM variants (Apple-style)' : 'Switch to Storage Only (Apple)'}
                        </button>
                      </div>

                      {!(editRamGb.length === 1 && editRamGb[0] === 0) && (
                        <div className="flex flex-wrap gap-1.5">
                          {ALL_RAM_OPTIONS.map(opt => (
                            <button
                              key={opt.gb}
                              type="button"
                              onClick={() => toggleRam(opt.gb, editRamGb, setEditRamGb)}
                              className={`px-3 py-1.5 rounded-sm border text-xs font-bold font-mono transition-all ${
                                editRamGb.includes(opt.gb)
                                  ? 'bg-cobalt border-cobalt text-white'
                                  : 'bg-canvas-pure border-ice-border text-zinc-500 hover:border-cobalt/50'
                              }`}
                            >
                              {opt.label}
                              {editRamGb.includes(opt.gb) && <span className="ml-1 text-white">✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Storage variants selector */}
                    <div>
                      <label className="block text-[11px] font-mono font-bold text-ink-navy mb-2 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-violet-500" />
                        Storage Variants (GB)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_STORAGE_OPTIONS.map(opt => (
                          <button
                            key={opt.gb}
                            type="button"
                            onClick={() => toggleStorage(opt.gb, editStorageGb, setEditStorageGb)}
                            className={`px-3 py-1.5 rounded-sm border text-xs font-bold font-mono transition-all ${
                              editStorageGb.includes(opt.gb)
                                ? 'bg-violet-600 border-violet-600 text-white'
                                : 'bg-canvas-pure border-ice-border text-zinc-500 hover:border-violet-400'
                            }`}
                          >
                            {opt.label}
                            {editStorageGb.includes(opt.gb) && <span className="ml-1 text-white">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RAM × Storage Variant Price Matrix */}
                  <div className="space-y-3 bg-canvas-white p-4 border border-ice-border rounded-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Grid className="w-4 h-4 text-cobalt" />
                        <h4 className="font-outfit text-sm font-semibold text-ink-navy">Variant Price Matrix (₹)</h4>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">Edit price for each variant combination</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-ice-border text-zinc-500 text-[10px] uppercase">
                            {!(editRamGb.length === 1 && editRamGb[0] === 0) && (
                              <th className="p-2 text-left bg-zinc-100/50">RAM \ Storage</th>
                            )}
                            {editStorageGb.map(s => (
                              <th key={s} className="p-2 text-center bg-zinc-100/50 min-w-[100px]">
                                {s >= 1024 ? `${s / 1024} TB` : `${s} GB`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ice-border/40">
                          {(editRamGb.length === 1 && editRamGb[0] === 0 ? [0] : editRamGb).map(ram => (
                            <tr key={ram} className="hover:bg-zinc-50/50">
                              {!(editRamGb.length === 1 && editRamGb[0] === 0) && (
                                <td className="p-2 font-bold text-cobalt bg-zinc-50/50 whitespace-nowrap">
                                  {ram} GB RAM
                                </td>
                              )}
                              {editStorageGb.map(storage => {
                                const key = `${ram}_${storage}`;
                                const val = editVariantPrices[key] !== undefined ? editVariantPrices[key] : '';
                                return (
                                  <td key={storage} className="p-1.5 text-center">
                                    <div className="relative">
                                      <span className="absolute left-2 top-2 text-zinc-400 text-[10px]">₹</span>
                                      <input
                                        type="number"
                                        value={val}
                                        placeholder="Price"
                                        onChange={e => {
                                          const num = parseInt(e.target.value, 10);
                                          setEditVariantPrices(prev => {
                                            const next = { ...prev };
                                            if (isNaN(num) || num <= 0) {
                                              delete next[key];
                                            } else {
                                              next[key] = num;
                                            }
                                            return next;
                                          });
                                        }}
                                        className="w-full pl-5 pr-2 py-1.5 bg-canvas-pure border border-ice-border focus:border-cobalt rounded-sm text-xs font-mono font-bold text-ink-navy text-right"
                                      />
                                    </div>
                                    {val && (
                                      <span className="text-[9px] text-emerald-600 block mt-0.5 font-bold">
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

                  {/* Product Image Input */}
                  <div className="p-3 bg-canvas-white border border-ice-border rounded-sm space-y-2">
                    <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold tracking-wider flex items-center justify-between">
                      <span>Product Image</span>
                      <span className="text-[9px] text-zinc-400 font-normal">URL link or file upload</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/phone-image.png"
                      value={editImageUrl.startsWith('data:') ? '' : editImageUrl}
                      onChange={e => setEditImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-canvas-pure border border-ice-border rounded-sm text-ink-navy text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cobalt"
                    />
                    <div className="flex items-center gap-2 my-1">
                      <div className="h-[1px] bg-ice-border flex-1" />
                      <span className="text-[9px] text-zinc-400 font-mono uppercase font-semibold">OR</span>
                      <div className="h-[1px] bg-ice-border flex-1" />
                    </div>
                    <label className="w-full py-1.5 px-3 bg-canvas-pure border border-dashed border-ice-border hover:border-cobalt rounded-sm text-xs font-mono text-ink-slate font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                      <span>Upload Image File</span>
                      <input type="file" accept="image/*" onChange={handleEditImageFileUpload} className="hidden" />
                    </label>
                    {editImageUrl && (
                      <div className="pt-2 flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/40 p-2 rounded border border-ice-border font-mono">
                        <img src={editImageUrl} alt="Preview" className="w-10 h-10 object-contain rounded bg-white p-0.5 border" />
                        <div className="flex-1 overflow-hidden text-[10px]">
                          <span className="text-emerald-600 font-bold block">✓ Image Attached</span>
                          <span className="text-zinc-400 truncate block">
                            {editImageUrl.startsWith('data:') ? 'Local file uploaded' : editImageUrl}
                          </span>
                        </div>
                        <button type="button" onClick={() => setEditImageUrl('')} className="text-red-500 text-[10px] hover:underline font-bold">
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Form Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-3 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Save Model & Variant Prices
                  </button>
                </form>
              ) : (
                /* Add New Model Mode */
                <form onSubmit={handleAddModel} className="space-y-6">
                  <div className="border-b border-ice-border/60 pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-cobalt font-bold">Catalog Creator</span>
                    <h3 className="font-outfit text-xl font-bold text-ink-navy">Add New Model to Catalog</h3>
                  </div>

                  {/* Basic Specifications */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold mb-1">Model Name *</label>
                      <input
                        type="text"
                        placeholder="e.g. iPhone 16 Pro Max / Galaxy S24"
                        value={newModelName}
                        onChange={e => setNewModelName(e.target.value)}
                        className="w-full px-3 py-2 bg-canvas-white border border-ice-border rounded-sm text-xs font-mono font-bold text-ink-navy focus:border-cobalt focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold mb-1">Series</label>
                      <select
                        value={selectedSeriesOption}
                        onChange={e => setSelectedSeriesOption(e.target.value)}
                        className="w-full px-3 py-2 bg-canvas-white border border-ice-border rounded-sm text-xs font-mono font-bold text-ink-navy focus:border-cobalt focus:outline-none"
                      >
                        <option value="">No Series / Standalone</option>
                        <option value="__CREATE_NEW__">+ Create New Series...</option>
                        {existingSeriesForSelectedBrand.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      {selectedSeriesOption === '__CREATE_NEW__' && (
                        <input
                          type="text"
                          placeholder="e.g. Galaxy S24 Series"
                          value={customSeriesInput}
                          onChange={e => setCustomSeriesInput(e.target.value)}
                          className="w-full mt-1.5 px-3 py-2 bg-canvas-white border border-ice-border rounded-sm text-xs font-mono text-ink-navy focus:border-cobalt focus:outline-none"
                        />
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold mb-1">Base Price (INR ₹)</label>
                      <input
                        type="number"
                        value={newModelBasePrice}
                        onChange={e => setNewModelBasePrice(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-canvas-white border border-ice-border rounded-sm text-xs font-mono font-bold text-ink-navy focus:border-cobalt focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold mb-1">Category</label>
                      <select
                        value={newModelCategory}
                        onChange={e => setNewModelCategory(e.target.value as any)}
                        className="w-full px-3 py-2 bg-canvas-white border border-ice-border rounded-sm text-xs font-mono text-ink-navy focus:border-cobalt focus:outline-none"
                      >
                        <option value="flagship">Flagship</option>
                        <option value="premium">Premium</option>
                        <option value="midrange">Midrange</option>
                        <option value="budget">Budget</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold mb-1">Release Year</label>
                      <input
                        type="number"
                        value={newModelYear}
                        onChange={e => setNewModelYear(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-canvas-white border border-ice-border rounded-sm text-xs font-mono text-ink-navy focus:border-cobalt focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* RAM & Storage Selection */}
                  <div className="space-y-4 bg-canvas-white p-4 border border-ice-border rounded-sm">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[11px] font-mono font-bold text-ink-navy flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-cobalt" />
                          RAM Variants (GB)
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (newModelRamGb.length === 1 && newModelRamGb[0] === 0) {
                              setNewModelRamGb([8]);
                            } else {
                              setNewModelRamGb([0]);
                            }
                          }}
                          className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold transition-all ${
                            newModelRamGb.length === 1 && newModelRamGb[0] === 0
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-600'
                              : 'bg-zinc-100 border-zinc-300 text-zinc-600 hover:border-cobalt'
                          }`}
                        >
                          {newModelRamGb.length === 1 && newModelRamGb[0] === 0 ? '✓ No RAM variants (Apple-style)' : 'Switch to Storage Only (Apple)'}
                        </button>
                      </div>

                      {!(newModelRamGb.length === 1 && newModelRamGb[0] === 0) && (
                        <div className="flex flex-wrap gap-1.5">
                          {ALL_RAM_OPTIONS.map(opt => (
                            <button
                              key={opt.gb}
                              type="button"
                              onClick={() => toggleRam(opt.gb, newModelRamGb, setNewModelRamGb)}
                              className={`px-3 py-1.5 rounded-sm border text-xs font-bold font-mono transition-all ${
                                newModelRamGb.includes(opt.gb)
                                  ? 'bg-cobalt border-cobalt text-white'
                                  : 'bg-canvas-pure border-ice-border text-zinc-500 hover:border-cobalt/50'
                              }`}
                            >
                              {opt.label}
                              {newModelRamGb.includes(opt.gb) && <span className="ml-1 text-white">✓</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-mono font-bold text-ink-navy mb-2 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-violet-500" />
                        Storage Variants (GB)
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_STORAGE_OPTIONS.map(opt => (
                          <button
                            key={opt.gb}
                            type="button"
                            onClick={() => toggleStorage(opt.gb, newModelStorageGb, setNewModelStorageGb)}
                            className={`px-3 py-1.5 rounded-sm border text-xs font-bold font-mono transition-all ${
                              newModelStorageGb.includes(opt.gb)
                                ? 'bg-violet-600 border-violet-600 text-white'
                                : 'bg-canvas-pure border-ice-border text-zinc-500 hover:border-violet-400'
                            }`}
                          >
                            {opt.label}
                            {newModelStorageGb.includes(opt.gb) && <span className="ml-1 text-white">✓</span>}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* RAM × Storage Price Matrix */}
                  <div className="space-y-3 bg-canvas-white p-4 border border-ice-border rounded-sm">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Grid className="w-4 h-4 text-cobalt" />
                        <h4 className="font-outfit text-sm font-semibold text-ink-navy">Variant Price Matrix (₹)</h4>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500">Set price for each variant</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono border-collapse">
                        <thead>
                          <tr className="border-b border-ice-border text-zinc-500 text-[10px] uppercase">
                            {!(newModelRamGb.length === 1 && newModelRamGb[0] === 0) && (
                              <th className="p-2 text-left bg-zinc-100/50">RAM \ Storage</th>
                            )}
                            {newModelStorageGb.map(s => (
                              <th key={s} className="p-2 text-center bg-zinc-100/50 min-w-[100px]">
                                {s >= 1024 ? `${s / 1024} TB` : `${s} GB`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ice-border/40">
                          {(newModelRamGb.length === 1 && newModelRamGb[0] === 0 ? [0] : newModelRamGb).map(ram => (
                            <tr key={ram} className="hover:bg-zinc-50/50">
                              {!(newModelRamGb.length === 1 && newModelRamGb[0] === 0) && (
                                <td className="p-2 font-bold text-cobalt bg-zinc-50/50 whitespace-nowrap">
                                  {ram} GB RAM
                                </td>
                              )}
                              {newModelStorageGb.map(storage => {
                                const key = `${ram}_${storage}`;
                                const val = newVariantPrices[key] !== undefined ? newVariantPrices[key] : '';
                                return (
                                  <td key={storage} className="p-1.5 text-center">
                                    <div className="relative">
                                      <span className="absolute left-2 top-2 text-zinc-400 text-[10px]">₹</span>
                                      <input
                                        type="number"
                                        value={val}
                                        placeholder="Price"
                                        onChange={e => {
                                          const num = parseInt(e.target.value, 10);
                                          setNewVariantPrices(prev => {
                                            const next = { ...prev };
                                            if (isNaN(num) || num <= 0) {
                                              delete next[key];
                                            } else {
                                              next[key] = num;
                                            }
                                            return next;
                                          });
                                        }}
                                        className="w-full pl-5 pr-2 py-1.5 bg-canvas-pure border border-ice-border focus:border-cobalt rounded-sm text-xs font-mono font-bold text-ink-navy text-right"
                                      />
                                    </div>
                                    {val && (
                                      <span className="text-[9px] text-emerald-600 block mt-0.5 font-bold">
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

                  {/* Product Image Input */}
                  <div className="p-3 bg-canvas-white border border-ice-border rounded-sm space-y-2">
                    <label className="block text-[10px] font-mono text-zinc-500 uppercase font-bold tracking-wider flex items-center justify-between">
                      <span>Product Image</span>
                      <span className="text-[9px] text-zinc-400 font-normal">URL link or file upload</span>
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/phone-image.png"
                      value={newModelImageUrl.startsWith('data:') ? '' : newModelImageUrl}
                      onChange={e => setNewModelImageUrl(e.target.value)}
                      className="w-full px-3 py-1.5 bg-canvas-pure border border-ice-border rounded-sm text-ink-navy text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cobalt"
                    />
                    <div className="flex items-center gap-2 my-1">
                      <div className="h-[1px] bg-ice-border flex-1" />
                      <span className="text-[9px] text-zinc-400 font-mono uppercase font-semibold">OR</span>
                      <div className="h-[1px] bg-ice-border flex-1" />
                    </div>
                    <label className="w-full py-1.5 px-3 bg-canvas-pure border border-dashed border-ice-border hover:border-cobalt rounded-sm text-xs font-mono text-ink-slate font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                      <span>Upload Image File</span>
                      <input type="file" accept="image/*" onChange={handleImageFileUpload} className="hidden" />
                    </label>
                    {newModelImageUrl && (
                      <div className="pt-2 flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/40 p-2 rounded border border-ice-border font-mono">
                        <img src={newModelImageUrl} alt="Preview" className="w-10 h-10 object-contain rounded bg-white p-0.5 border" />
                        <div className="flex-1 overflow-hidden text-[10px]">
                          <span className="text-emerald-600 font-bold block">✓ Image Attached</span>
                          <span className="text-zinc-400 truncate block">
                            {newModelImageUrl.startsWith('data:') ? 'Local file uploaded' : newModelImageUrl}
                          </span>
                        </div>
                        <button type="button" onClick={() => setNewModelImageUrl('')} className="text-red-500 text-[10px] hover:underline font-bold">
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-sm shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product to Catalog
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
      {activeTab === 'support' && (
        <SupportInbox />
      )}
    </div>
  );
};
