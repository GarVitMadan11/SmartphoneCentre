import React, { useState, useMemo, useEffect } from 'react';
import { Booking, Brand, Model, MODELS as STATIC_MODELS, getDeviceImage } from '../../data/mockDatabase';
import { 
  ArrowLeft, Search, Filter, 
  CheckCircle, XCircle, Clock, CreditCard, 
  ChevronRight, Calendar, MapPin, User,
  RefreshCw, Plus, Trash2, List, Image as ImageIcon,
  Upload, Link as LinkIcon, Layers, Edit2, Check, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateBooking, fetchModels, createModel, updateModel, deleteModel } from '../../utils/api';

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
  const [activeTab, setActiveTab] = useState<'ledger' | 'catalog'>('ledger');
  
  // Sync bookings from props
  useEffect(() => {
    setBookings(initialBookings);
  }, [initialBookings]);

  // Catalog management states
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedCatalogBrandId, setSelectedCatalogBrandId] = useState<string>('brand-apple');
  const [isApiOffline, setIsApiOffline] = useState(false);
  
  // Add model form states
  const [newModelName, setNewModelName] = useState('');
  const [newModelNumber, setNewModelNumber] = useState('');
  const [newModelCategory, setNewModelCategory] = useState<'flagship' | 'premium' | 'midrange' | 'budget'>('premium');
  const [newModelYear, setNewModelYear] = useState<number>(new Date().getFullYear());
  const [newModelBasePrice, setNewModelBasePrice] = useState<number>(30000);
  
  // Hierarchical Series & Image states
  const [selectedSeriesOption, setSelectedSeriesOption] = useState<string>('__CREATE_NEW__');
  const [customSeriesInput, setCustomSeriesInput] = useState<string>('');
  const [newModelImageUrl, setNewModelImageUrl] = useState<string>('');

  // Edit model form states
  const [editingModelId, setEditingModelId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editModelNumber, setEditModelNumber] = useState('');
  const [editCategory, setEditCategory] = useState<'flagship' | 'premium' | 'midrange' | 'budget'>('premium');
  const [editYear, setEditYear] = useState<number>(new Date().getFullYear());
  const [editBasePrice, setEditBasePrice] = useState<number>(30000);
  const [editSeriesOption, setEditSeriesOption] = useState<string>('');
  const [editCustomSeries, setEditCustomSeries] = useState<string>('');
  const [editImageUrl, setEditImageUrl] = useState<string>('');

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

  useEffect(() => {
    if (activeTab === 'catalog') {
      loadModels();
    }
  }, [activeTab]);

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
        b.modelName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (b.modelNumber && b.modelNumber.toLowerCase().includes(searchTerm.toLowerCase()));

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

  // Handle local image file upload converting to Data URL
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setFormError('Image size must be less than 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setNewModelImageUrl(evt.target.result as string);
        setFormError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) {
      setFormError('Image size must be less than 3MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (evt) => {
      if (evt.target?.result) {
        setEditImageUrl(evt.target.result as string);
        setFormError('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleStartEditModel = (model: Model) => {
    setEditingModelId(model.id);
    setEditName(model.name);
    setEditModelNumber(model.modelNumber);
    setEditCategory(model.category as any);
    setEditYear(model.releaseYear);
    setEditBasePrice(model.basePrice128GB);
    setEditImageUrl(model.imageUrl || '');
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

  const handleSaveModelEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingModelId) return;
    setFormError('');
    setFormSuccess('');

    if (!editName.trim() || !editModelNumber.trim()) {
      setFormError('Name and Model Number are required.');
      return;
    }

    let finalSeries = '';
    if (editSeriesOption === '__CREATE_NEW__') {
      finalSeries = editCustomSeries.trim();
    } else {
      finalSeries = editSeriesOption.trim();
    }

    const imageUrlValue = editImageUrl.trim() || undefined;

    if (isApiOffline) {
      const nextModels = models.map(m => {
        if (m.id === editingModelId) {
          return {
            ...m,
            name: editName.trim(),
            modelNumber: editModelNumber.trim(),
            category: editCategory,
            releaseYear: Number(editYear),
            basePrice128GB: Number(editBasePrice),
            series: finalSeries || undefined,
            imageUrl: imageUrlValue,
          };
        }
        return m;
      });
      setModels(nextModels);
      setFormSuccess(`[Offline Demo Mode] Saved changes to "${editName}"!`);
      setEditingModelId(null);
      if (onRefreshCatalog) {
        onRefreshCatalog(nextModels);
      }
      return;
    }

    try {
      await updateModel(editingModelId, {
        name: editName.trim(),
        modelNumber: editModelNumber.trim(),
        category: editCategory,
        releaseYear: Number(editYear),
        basePrice128GB: Number(editBasePrice),
        series: finalSeries || undefined,
        imageUrl: imageUrlValue,
      });

      setFormSuccess(`Successfully updated "${editName}"!`);
      setEditingModelId(null);
      await loadModels();
      if (onRefreshCatalog) {
        await onRefreshCatalog();
      }
    } catch (err) {
      setFormError('Failed to update model: ' + (err as Error).message);
    }
  };

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    
    if (!newModelName.trim() || !newModelNumber.trim()) {
      setFormError('Name and Model Number are required.');
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

    if (isApiOffline) {
      const newModel: Model = {
        id: legacyId,
        brandId: selectedCatalogBrandId,
        name: newModelName.trim(),
        modelNumber: newModelNumber.trim(),
        category: newModelCategory,
        releaseYear: Number(newModelYear),
        basePrice128GB: Number(newModelBasePrice),
        series: finalSeries || undefined,
        imageUrl: imageUrlValue,
      };
      const nextModels = [newModel, ...models];
      setModels(nextModels);
      setFormSuccess(`[Offline Demo Mode] Successfully added model "${newModelName}"!`);
      setNewModelName('');
      setNewModelNumber('');
      setCustomSeriesInput('');
      setNewModelImageUrl('');
      if (onRefreshCatalog) {
        onRefreshCatalog(nextModels);
      }
      return;
    }

    try {
      await createModel({
        legacyId,
        brandId: selectedCatalogBrandId,
        name: newModelName.trim(),
        modelNumber: newModelNumber.trim(),
        category: newModelCategory,
        releaseYear: Number(newModelYear),
        basePrice128GB: Number(newModelBasePrice),
        series: finalSeries || undefined,
        imageUrl: imageUrlValue
      });
      
      setFormSuccess(`Successfully added model "${newModelName}" to ${finalSeries || 'catalog'}!`);
      setNewModelName('');
      setNewModelNumber('');
      setCustomSeriesInput('');
      setNewModelImageUrl('');
      
      // Refresh catalog lists
      await loadModels();
      if (onRefreshCatalog) {
        await onRefreshCatalog();
      }
    } catch (err) {
      setFormError('Failed to create model: ' + (err as Error).message);
    }
  };

  const handleDeleteModel = async (legacyId: string) => {
    if (!window.confirm(`Are you sure you want to delete model: ${legacyId}?`)) {
      return;
    }
    if (isApiOffline) {
      const nextModels = models.filter(m => m.id !== legacyId);
      setModels(nextModels);
      setFormSuccess(`[Offline Demo Mode] Deleted model: ${legacyId}`);
      if (onRefreshCatalog) {
        onRefreshCatalog(nextModels);
      }
      return;
    }
    try {
      await deleteModel(legacyId);
      await loadModels();
      if (onRefreshCatalog) {
        await onRefreshCatalog();
      }
    } catch (err) {
      alert('Failed to delete model: ' + (err as Error).message);
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
                  ⚠️ Offline Demo Mode (Simulated)
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold tracking-wider rounded-sm bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase">
                  ⚡ SQLite Database Online
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2 self-stretch sm:self-auto">
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
      <div className="flex border-b border-ice-border/60">
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
          onClick={() => setActiveTab('catalog')}
          className={`px-4 py-2.5 border-b-2 text-xs font-bold transition-all flex items-center gap-2 ${
            activeTab === 'catalog'
              ? 'border-cobalt text-cobalt'
              : 'border-transparent text-ink-slate hover:text-ink-navy'
          }`}
        >
          <List className="w-3.5 h-3.5" />
          Catalog Management ({loadingModels ? '...' : models.length})
        </button>
      </div>

      {activeTab === 'ledger' ? (
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
                
                {/* Search */}
                <div className="relative max-w-sm w-full sm:w-64">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search Client, IMEI, ID..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 rounded-sm border border-ice-border bg-canvas-white text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt font-mono"
                  />
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

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono border-collapse text-left">
                  <thead>
                    <tr className="border-b border-ice-border/40 text-ink-navy text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2.5 px-3">Transaction ID</th>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3">Client Info</th>
                      <th className="py-2.5 px-3">Device & Quote</th>
                      <th className="py-2.5 px-3">KYC (Aadhaar)</th>
                      <th className="py-2.5 px-3">Inspection</th>
                      <th className="py-2.5 px-3">Payout</th>
                      <th className="py-2.5 px-3 text-right">Ledger</th>
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
                              <span className="block text-ink-navy">{b.modelName} {b.modelNumber && <span className="text-[10px] font-mono text-zinc-500 font-medium">({b.modelNumber})</span>}</span>
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
                        <span>{selectedBooking.modelName} {selectedBooking.modelNumber && <span className="font-mono font-medium text-[11px] text-zinc-500">({selectedBooking.modelNumber})</span>}</span>
                        <span className="text-zinc-500 font-normal">{selectedBooking.storageGb}GB • {selectedBooking.color}</span>
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
                        {selectedBooking.payoutStatus === 'completed' ? 'Payout Marked Completed ✓' : 'Disburse Instant Payout'}
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
      ) : (
        /* Catalog Management Tab Workspace */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Side: Brand Selector & Model Table */}
          <div className="lg:col-span-7 bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-6 shadow-premium">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-outfit font-light text-xl text-ink-navy">Device Catalog</h3>
              <span className="text-[11px] font-mono text-zinc-500">
                {models.filter(m => m.brandId === selectedCatalogBrandId).length} models in catalog
              </span>
            </div>
            
            {/* Brand filter buttons */}
            <div className="flex flex-wrap gap-2 mb-4 pb-4 border-b border-ice-border/40">
              {brands.map(b => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedCatalogBrandId(b.id);
                    setSelectedSeriesOption('__CREATE_NEW__');
                  }}
                  className={`px-3 py-1.5 rounded-sm border text-xs font-bold font-mono transition-all ${
                    selectedCatalogBrandId === b.id
                      ? 'bg-cobalt border-cobalt text-white'
                      : 'bg-canvas-white border-ice-border text-ink-slate hover:border-cobalt/50 hover:text-cobalt'
                  }`}
                >
                  {b.name}
                </button>
              ))}
            </div>

            {/* Model List Table */}
            {loadingModels ? (
              <div className="py-8 text-center text-zinc-500 font-mono">Loading models from database...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono border-collapse text-left">
                  <thead>
                    <tr className="border-b border-ice-border/40 text-ink-navy text-[10px] uppercase font-bold tracking-wider">
                      <th className="py-2.5 px-2 text-center">Image</th>
                      <th className="py-2.5 px-3">Model Name</th>
                      <th className="py-2.5 px-3">Series</th>
                      <th className="py-2.5 px-3">Model Code</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3">Release</th>
                      <th className="py-2.5 px-3">Base Price</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04]">
                    {models.filter(m => m.brandId === selectedCatalogBrandId).length > 0 ? (
                      models
                        .filter(m => m.brandId === selectedCatalogBrandId)
                        .map(m => {
                          const imgUrl = getDeviceImage(m.id, m.brandId, undefined, m.imageUrl);
                          return (
                            <tr key={m.id} className="hover:bg-cobalt-light/5 transition-all">
                              <td className="py-2 px-2 text-center">
                                {imgUrl ? (
                                  <img 
                                    src={imgUrl} 
                                    alt={m.name} 
                                    className="w-9 h-9 object-contain mx-auto rounded bg-slate-100 dark:bg-zinc-800 p-0.5 border border-ice-border"
                                  />
                                ) : (
                                  <div className="w-9 h-9 mx-auto rounded bg-slate-100 dark:bg-zinc-800 flex items-center justify-center border border-ice-border text-zinc-400">
                                    <ImageIcon className="w-4 h-4" />
                                  </div>
                                )}
                              </td>
                              <td className="py-3 px-3 text-ink-navy font-bold">{m.name}</td>
                              <td className="py-3 px-3">
                                {m.series ? (
                                  <span className="px-2 py-0.5 rounded-sm bg-cobalt/10 text-cobalt border border-cobalt/20 font-semibold text-[10px]">
                                    {m.series}
                                  </span>
                                ) : (
                                  <span className="text-zinc-400 text-[10px]">—</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-zinc-600">{m.modelNumber}</td>
                              <td className="py-3 px-3 uppercase text-[10px]">
                                <span className={`px-1.5 py-0.5 rounded-sm font-semibold border ${
                                  m.category === 'flagship'
                                    ? 'bg-red-500/10 text-red-500 border-red-500/20'
                                    : m.category === 'premium'
                                    ? 'bg-cobalt/10 text-cobalt border-cobalt/20'
                                    : m.category === 'midrange'
                                    ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                    : 'bg-zinc-500/10 text-zinc-600 border-zinc-500/20'
                                }`}>
                                  {m.category}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-zinc-500">{m.releaseYear}</td>
                              <td className="py-3 px-3 text-cobalt font-bold">{formatPrice(m.basePrice128GB)}</td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleStartEditModel(m)}
                                    className={`p-1 rounded-sm border transition-all ${
                                      editingModelId === m.id
                                        ? 'bg-cobalt border-cobalt text-white'
                                        : 'border-cobalt/30 text-cobalt hover:bg-cobalt hover:text-white'
                                    }`}
                                    title="Edit Model"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteModel(m.id)}
                                    className="p-1 rounded-sm border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all"
                                    title="Delete Model"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-zinc-500 italic">
                          No models seeded for this brand in database yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Right Side: Add or Edit Model Form */}
          <div className="lg:col-span-5 bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 shadow-premium text-xs text-left">
            {editingModelId ? (
              /* Edit Existing Model Form */
              <div>
                <div className="border-b border-ice-border/40 pb-3 mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/20 text-amber-500">
                      <Edit2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-outfit font-light text-lg text-ink-navy">Edit Product</h3>
                      <p className="text-[10px] text-zinc-400 font-mono">ID: {editingModelId}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="p-1 rounded text-zinc-400 hover:text-ink-navy hover:bg-slate-100 dark:hover:bg-zinc-800 transition-all text-[11px] flex items-center gap-1 font-mono font-bold"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                </div>

                <form onSubmit={handleSaveModelEdit} className="space-y-4 font-mono">
                  {formError && (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-sm font-semibold text-[10px]">
                      Error: {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-sm font-semibold text-[10px]">
                      {formSuccess}
                    </div>
                  )}

                  {/* Series Selection */}
                  <div className="p-3 bg-canvas-white border border-ice-border rounded-sm space-y-2">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3 text-cobalt" />
                      <span>Product Series</span>
                    </label>
                    
                    <select
                      value={editSeriesOption}
                      onChange={e => setEditSeriesOption(e.target.value)}
                      className="w-full bg-canvas-pure border border-ice-border rounded-sm p-2 text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt"
                    >
                      <option value="">No Specific Series</option>
                      <option value="__CREATE_NEW__">✨ + Create New Series</option>
                      {existingSeriesForSelectedBrand.map(s => (
                        <option key={s} value={s}>Existing: {s}</option>
                      ))}
                    </select>

                    {editSeriesOption === '__CREATE_NEW__' && (
                      <div className="pt-1">
                        <label className="block text-[9px] text-zinc-400 uppercase font-semibold mb-1">Series Name</label>
                        <input
                          type="text"
                          placeholder="e.g. iPhone 18 Series"
                          value={editCustomSeries}
                          onChange={e => setEditCustomSeries(e.target.value)}
                          className="w-full bg-canvas-pure border border-cobalt/50 rounded-sm p-2 text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt font-bold"
                          required={editSeriesOption === '__CREATE_NEW__'}
                        />
                      </div>
                    )}
                  </div>

                  {/* Model Specs */}
                  <div className="space-y-3 pt-1">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Model Specifications</div>
                    
                    <div>
                      <label className="block text-[10px] text-zinc-400 font-semibold mb-1">Model Name</label>
                      <input
                        type="text"
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        className="w-full bg-canvas-white border border-ice-border rounded-sm p-2 text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 font-semibold mb-1">Model Code / Number</label>
                      <input
                        type="text"
                        value={editModelNumber}
                        onChange={e => setEditModelNumber(e.target.value)}
                        className="w-full bg-canvas-white border border-ice-border rounded-sm p-2 text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-zinc-400 font-semibold mb-1">Category</label>
                        <select
                          value={editCategory}
                          onChange={e => setEditCategory(e.target.value as any)}
                          className="w-full bg-canvas-white border border-ice-border rounded-sm p-2 text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt"
                        >
                          <option value="flagship">Flagship</option>
                          <option value="premium">Premium</option>
                          <option value="midrange">Midrange</option>
                          <option value="budget">Budget</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 font-semibold mb-1">Release Year</label>
                        <input
                          type="number"
                          min="2010"
                          max="2030"
                          value={editYear}
                          onChange={e => setEditYear(Number(e.target.value))}
                          className="w-full bg-canvas-white border border-ice-border rounded-sm p-2 text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 font-semibold mb-1">Base Price 128GB (INR ₹)</label>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        value={editBasePrice}
                        onChange={e => setEditBasePrice(Number(e.target.value))}
                        className="w-full bg-canvas-white border border-ice-border rounded-sm p-2 text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt"
                        required
                      />
                    </div>
                  </div>

                  {/* Image Input */}
                  <div className="p-3 bg-canvas-white border border-ice-border rounded-sm space-y-2">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-cobalt" />
                        Product Image
                      </span>
                      <span className="text-[9px] text-zinc-400 font-normal">URL link or file upload</span>
                    </label>

                    {/* Option A: URL Link */}
                    <div className="relative">
                      <LinkIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://example.com/phone-image.png"
                        value={editImageUrl.startsWith('data:') ? '' : editImageUrl}
                        onChange={e => setEditImageUrl(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 bg-canvas-pure border border-ice-border rounded-sm text-ink-navy text-[11px] focus:outline-none focus:ring-1 focus:ring-cobalt"
                      />
                    </div>

                    <div className="flex items-center gap-2 my-1">
                      <div className="h-[1px] bg-ice-border flex-1" />
                      <span className="text-[9px] text-zinc-400 uppercase font-semibold">OR</span>
                      <div className="h-[1px] bg-ice-border flex-1" />
                    </div>

                    {/* Option B: Local File Upload */}
                    <div>
                      <label className="w-full py-1.5 px-3 bg-canvas-pure border border-dashed border-ice-border hover:border-cobalt rounded-sm text-[11px] text-ink-slate font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                        <Upload className="w-3.5 h-3.5 text-cobalt" />
                        <span>Upload New Image File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleEditImageFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Preview */}
                    {editImageUrl && (
                      <div className="pt-2 flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/40 p-2 rounded border border-ice-border">
                        <img 
                          src={editImageUrl} 
                          alt="Preview" 
                          className="w-12 h-12 object-contain rounded bg-white p-0.5 border"
                        />
                        <div className="flex-1 overflow-hidden text-[10px]">
                          <span className="text-emerald-600 font-bold block">✓ Image Loaded</span>
                          <span className="text-zinc-400 truncate block">
                            {editImageUrl.startsWith('data:') ? 'Local file uploaded (Data URL)' : editImageUrl}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditImageUrl('')}
                          className="text-red-500 text-[10px] hover:underline font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-sm transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-4 h-4" />
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      className="px-4 py-2.5 border border-ice-border text-zinc-400 hover:text-ink-navy text-xs font-bold rounded-sm transition-all"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              /* Add New Model Form */
              <div>
                <div className="border-b border-ice-border/40 pb-3 mb-4 flex items-center gap-2">
                  <div className="p-1.5 rounded bg-cobalt/10 border border-cobalt/20 text-cobalt">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-outfit font-light text-lg text-ink-navy">Add Product to Catalog</h3>
                    <p className="text-[10px] text-zinc-400 font-mono">Brand → Series → Model Hierarchy</p>
                  </div>
                </div>

                <form onSubmit={handleAddModel} className="space-y-4 font-mono">
                  {formError && (
                    <div className="p-2.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-sm font-semibold text-[10px]">
                      Error: {formError}
                    </div>
                  )}
                  {formSuccess && (
                    <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-sm font-semibold text-[10px]">
                      {formSuccess}
                    </div>
                  )}

                  {/* Step 1: Brand Selection */}
                  <div className="p-3 bg-canvas-white border border-ice-border rounded-sm space-y-1.5">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
                      <span>1. Brand</span>
                    </label>
                    <select
                      value={selectedCatalogBrandId}
                      onChange={e => {
                        setSelectedCatalogBrandId(e.target.value);
                        setSelectedSeriesOption('__CREATE_NEW__');
                      }}
                      className="w-full bg-canvas-pure border border-ice-border rounded-sm p-2 text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt font-semibold"
                    >
                      {brands.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Series Selection or Creation */}
                  <div className="p-3 bg-canvas-white border border-ice-border rounded-sm space-y-2">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center gap-1">
                      <Layers className="w-3 h-3 text-cobalt" />
                      <span>2. Product Series</span>
                    </label>
                    
                    <select
                      value={selectedSeriesOption}
                      onChange={e => setSelectedSeriesOption(e.target.value)}
                      className="w-full bg-canvas-pure border border-ice-border rounded-sm p-2 text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt"
                    >
                      <option value="__CREATE_NEW__">✨ + Create New Series (e.g. iPhone 18 Series)</option>
                      {existingSeriesForSelectedBrand.map(s => (
                        <option key={s} value={s}>Existing: {s}</option>
                      ))}
                    </select>

                    {selectedSeriesOption === '__CREATE_NEW__' && (
                      <div className="pt-1">
                        <label className="block text-[9px] text-zinc-400 uppercase font-semibold mb-1">New Series Name</label>
                        <input
                          type="text"
                          placeholder="e.g. iPhone 18 Series"
                          value={customSeriesInput}
                          onChange={e => setCustomSeriesInput(e.target.value)}
                          className="w-full bg-canvas-pure border border-cobalt/50 rounded-sm p-2 text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt font-bold"
                          required={selectedSeriesOption === '__CREATE_NEW__'}
                        />
                      </div>
                    )}
                  </div>

                  {/* Step 3: Model Details */}
                  <div className="space-y-3 pt-1">
                    <div className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">3. Model Information</div>
                    
                    <div>
                      <label className="block text-[10px] text-zinc-400 font-semibold mb-1">Model Name</label>
                      <input
                        type="text"
                        placeholder="e.g. iPhone 18 Pro Max"
                        value={newModelName}
                        onChange={e => setNewModelName(e.target.value)}
                        className="w-full bg-canvas-white border border-ice-border rounded-sm p-2 text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 font-semibold mb-1">Model Code / Number</label>
                      <input
                        type="text"
                        placeholder="e.g. A3399 or SM-S958B"
                        value={newModelNumber}
                        onChange={e => setNewModelNumber(e.target.value)}
                        className="w-full bg-canvas-white border border-ice-border rounded-sm p-2 text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[10px] text-zinc-400 font-semibold mb-1">Category</label>
                        <select
                          value={newModelCategory}
                          onChange={e => setNewModelCategory(e.target.value as any)}
                          className="w-full bg-canvas-white border border-ice-border rounded-sm p-2 text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt"
                        >
                          <option value="flagship">Flagship</option>
                          <option value="premium">Premium</option>
                          <option value="midrange">Midrange</option>
                          <option value="budget">Budget</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] text-zinc-400 font-semibold mb-1">Release Year</label>
                        <input
                          type="number"
                          min="2010"
                          max="2030"
                          value={newModelYear}
                          onChange={e => setNewModelYear(Number(e.target.value))}
                          className="w-full bg-canvas-white border border-ice-border rounded-sm p-2 text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] text-zinc-400 font-semibold mb-1">Base Price 128GB (INR ₹)</label>
                      <input
                        type="number"
                        min="1000"
                        step="500"
                        value={newModelBasePrice}
                        onChange={e => setNewModelBasePrice(Number(e.target.value))}
                        className="w-full bg-canvas-white border border-ice-border rounded-sm p-2 text-ink-navy text-xs focus:outline-none focus:ring-1 focus:ring-cobalt focus:border-cobalt"
                        required
                      />
                    </div>
                  </div>

                  {/* Step 4: Image Input (URL Link OR Uploaded File) */}
                  <div className="p-3 bg-canvas-white border border-ice-border rounded-sm space-y-2">
                    <label className="block text-[10px] text-zinc-500 uppercase font-bold tracking-wider flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-cobalt" />
                        4. Product Image
                      </span>
                      <span className="text-[9px] text-zinc-400 font-normal">URL link or file upload</span>
                    </label>

                    {/* Option A: Image URL link */}
                    <div className="relative">
                      <LinkIcon className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="url"
                        placeholder="https://example.com/phone-image.png"
                        value={newModelImageUrl.startsWith('data:') ? '' : newModelImageUrl}
                        onChange={e => setNewModelImageUrl(e.target.value)}
                        className="w-full pl-8 pr-2 py-1.5 bg-canvas-pure border border-ice-border rounded-sm text-ink-navy text-[11px] focus:outline-none focus:ring-1 focus:ring-cobalt"
                      />
                    </div>

                    <div className="flex items-center gap-2 my-1">
                      <div className="h-[1px] bg-ice-border flex-1" />
                      <span className="text-[9px] text-zinc-400 uppercase font-semibold">OR</span>
                      <div className="h-[1px] bg-ice-border flex-1" />
                    </div>

                    {/* Option B: Local File Upload */}
                    <div>
                      <label className="w-full py-1.5 px-3 bg-canvas-pure border border-dashed border-ice-border hover:border-cobalt rounded-sm text-[11px] text-ink-slate font-semibold cursor-pointer flex items-center justify-center gap-1.5 transition-all">
                        <Upload className="w-3.5 h-3.5 text-cobalt" />
                        <span>Upload Image File</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {/* Image Live Preview */}
                    {newModelImageUrl && (
                      <div className="pt-2 flex items-center gap-3 bg-slate-50 dark:bg-zinc-800/40 p-2 rounded border border-ice-border">
                        <img 
                          src={newModelImageUrl} 
                          alt="Preview" 
                          className="w-12 h-12 object-contain rounded bg-white p-0.5 border"
                        />
                        <div className="flex-1 overflow-hidden text-[10px]">
                          <span className="text-emerald-600 font-bold block">✓ Image Loaded</span>
                          <span className="text-zinc-400 truncate block">
                            {newModelImageUrl.startsWith('data:') ? 'Local file uploaded (Data URL)' : newModelImageUrl}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setNewModelImageUrl('')}
                          className="text-red-500 text-[10px] hover:underline font-bold"
                        >
                          Remove
                        </button>
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-sm transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Product to Catalog
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

