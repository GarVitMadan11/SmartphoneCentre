import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Package, Search, Plus, Printer, CheckCircle,
  TrendingUp, DollarSign, Calendar, Phone,
  RefreshCw, Trash2, Edit3, X,
  ShoppingBag, Globe, Store, Check,
  ArrowRight, FileText
} from 'lucide-react';
import {
  InventoryItem,
  InventoryStats,
  fetchInventory,
  createInventoryItem,
  updateInventoryItem,
  markInventorySold,
  revertInventorySold,
  deleteInventoryItem,
  fetchConvertibleBookings
} from '../../../utils/api';

// ── SVG Barcode Component (Code 128-style Crisp Vector Barcode) ───────────────
export const BarcodeSvg: React.FC<{ value: string; width?: number; height?: number; showText?: boolean }> = ({
  value,
  width = 240,
  height = 55,
  showText = true,
}) => {
  // Deterministic bar width sequence generator based on string chars
  const bars = useMemo(() => {
    const chars = value.split('');
    const pattern: number[] = [2, 1, 1, 2]; // Start guard
    let checksum = 104;

    chars.forEach((char, idx) => {
      const code = char.charCodeAt(0);
      checksum += code * (idx + 1);
      // Generate standard bar-space widths based on char code
      const w1 = (code % 3) + 1;
      const s1 = ((code >> 2) % 3) + 1;
      const w2 = ((code >> 4) % 2) + 1;
      const s2 = ((code + idx) % 2) + 1;
      pattern.push(w1, s1, w2, s2);
    });

    pattern.push(2, 3, 1, 1, 2); // Stop guard
    return pattern;
  }, [value]);

  const totalUnits = useMemo(() => bars.reduce((acc, w) => acc + w, 0), [bars]);
  const barUnitWidth = width / (totalUnits + 10);

  return (
    <div className="flex flex-col items-center">
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="overflow-visible"
      >
        <rect x="0" y="0" width={width} height={height} fill="white" />
        {bars.map((barWidth, index) => {
          if (index % 2 !== 0) return null; // Spaces are skipped (white)
          // Compute X offset
          let currentOffset = 5 * barUnitWidth;
          for (let i = 0; i < index; i++) {
            currentOffset += bars[i] * barUnitWidth;
          }
          return (
            <rect
              key={index}
              x={currentOffset}
              y={2}
              width={barWidth * barUnitWidth}
              height={height - (showText ? 16 : 4)}
              fill="#0A1E3B"
            />
          );
        })}
        {showText && (
          <text
            x={width / 2}
            y={height - 2}
            textAnchor="middle"
            fontFamily="monospace"
            fontSize="10"
            fontWeight="bold"
            fill="#0F172A"
            letterSpacing="2"
          >
            {value}
          </text>
        )}
      </svg>
    </div>
  );
};

export const InventoryTab: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [stats, setStats] = useState<InventoryStats>({
    totalCount: 0,
    inStockCount: 0,
    inStockValue: 0,
    soldCount: 0,
    totalRevenue: 0,
    costOfSold: 0,
    totalProfit: 0,
    onlineCount: 0,
    offlineCount: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'SOLD'>('ALL');
  const [channelFilter, setChannelFilter] = useState<'ALL' | 'ONLINE' | 'OFFLINE'>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [sellingItem, setSellingItem] = useState<InventoryItem | null>(null);
  const [printItem, setPrintItem] = useState<InventoryItem | null>(null);
  const [invoiceItem, setInvoiceItem] = useState<InventoryItem | null>(null);
  const [isBookingImportOpen, setIsBookingImportOpen] = useState(false);
  const [convertibleBookings, setConvertibleBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Form State for Add / Edit
  const [formBrand, setFormBrand] = useState('Apple');
  const [formModel, setFormModel] = useState('');
  const [formVariant, setFormVariant] = useState('128GB');
  const [formStorageGb, setFormStorageGb] = useState('128');
  const [formRamGb, setFormRamGb] = useState('');
  const [formColor, setFormColor] = useState('');
  const [formImei, setFormImei] = useState('');
  const [formCondition, setFormCondition] = useState('Good');
  const [formBuyingPrice, setFormBuyingPrice] = useState('');
  const [formBuyingDate, setFormBuyingDate] = useState(new Date().toISOString().split('T')[0]);
  const [formBoughtFrom, setFormBoughtFrom] = useState('');
  const [formSellerPhone, setFormSellerPhone] = useState('');
  const [formSellerEmail, setFormSellerEmail] = useState('');
  const [formChannel, setFormChannel] = useState<'ONLINE' | 'OFFLINE'>('OFFLINE');
  const [formBarcode, setFormBarcode] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formBookingId, setFormBookingId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Mark Sold Form State
  const [sellPrice, setSellPrice] = useState('');
  const [soldDate, setSoldDate] = useState(new Date().toISOString().split('T')[0]);
  const [soldTo, setSoldTo] = useState('');
  const [buyerContact, setBuyerContact] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [sellNotes, setSellNotes] = useState('');
  const [sellingSubmitting, setSellingSubmitting] = useState(false);

  // Load Inventory Data
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchInventory({
        status: statusFilter,
        channel: channelFilter,
        search: search.trim() || undefined,
      });
      setItems(res.items || []);
      if (res.stats) setStats(res.stats);
    } catch (err: any) {
      console.error('Failed to load inventory:', err);
      setError(err.message || 'Failed to connect to inventory backend');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, channelFilter, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load convertible bookings for online orders
  const loadBookings = async () => {
    setLoadingBookings(true);
    try {
      const list = await fetchConvertibleBookings();
      setConvertibleBookings(list || []);
    } catch (err) {
      console.error('Failed to load bookings:', err);
    } finally {
      setLoadingBookings(false);
    }
  };

  // Reset Add Form
  const resetForm = () => {
    setEditingItem(null);
    setFormBrand('Apple');
    setFormModel('');
    setFormVariant('128GB');
    setFormStorageGb('128');
    setFormRamGb('');
    setFormColor('');
    setFormImei('');
    setFormCondition('Good');
    setFormBuyingPrice('');
    setFormBuyingDate(new Date().toISOString().split('T')[0]);
    setFormBoughtFrom('');
    setFormSellerPhone('');
    setFormSellerEmail('');
    setFormChannel('OFFLINE');
    setFormBarcode('');
    setFormNotes('');
    setFormBookingId('');
  };

  // Open Edit Form
  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormBrand(item.brand);
    setFormModel(item.model);
    setFormVariant(item.variant || '');
    setFormStorageGb(item.storageGb ? String(item.storageGb) : '');
    setFormRamGb(item.ramGb ? String(item.ramGb) : '');
    setFormColor(item.color || '');
    setFormImei(item.imei || '');
    setFormCondition(item.condition || 'Good');
    setFormBuyingPrice(String(item.buyingPrice || ''));
    setFormBuyingDate(item.buyingDate ? item.buyingDate.split('T')[0] : new Date().toISOString().split('T')[0]);
    setFormBoughtFrom(item.boughtFrom || '');
    setFormSellerPhone(item.sellerPhone || '');
    setFormSellerEmail(item.sellerEmail || '');
    setFormChannel(item.acquisitionChannel);
    setFormBarcode(item.barcode);
    setFormNotes(item.notes || '');
    setFormBookingId(item.associatedBookingId || '');
    setIsAddModalOpen(true);
  };

  // Pre-fill from an online booking
  const handleImportBooking = (booking: any) => {
    resetForm();
    setFormChannel('ONLINE');
    setFormModel(booking.modelName || '');
    setFormStorageGb(booking.storageGb ? String(booking.storageGb) : '128');
    setFormVariant(`${booking.storageGb || 128}GB`);
    setFormColor(booking.color || '');
    setFormBuyingPrice(String(booking.finalPayoutAmount || booking.finalPrice || ''));
    setFormBoughtFrom(booking.customerName || 'Online Customer');
    setFormSellerPhone(booking.customerPhone || '');
    setFormSellerEmail(booking.customerEmail || '');
    setFormImei(booking.imei || '');
    setFormBookingId(booking.id || '');
    if (booking.pickupDate) {
      setFormBuyingDate(booking.pickupDate);
    }
    setFormNotes(`Imported from Online Doorstep Booking #${booking.id}`);
    setIsBookingImportOpen(false);
    setIsAddModalOpen(true);
  };

  // Submit Add / Edit Form
  const handleSubmitDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formBrand.trim() || !formModel.trim() || !formBuyingPrice || !formBoughtFrom.trim()) {
      alert('Please fill all required fields: Brand, Model, Buying Price, Bought From.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: Partial<InventoryItem> = {
        brand: formBrand.trim(),
        model: formModel.trim(),
        variant: formVariant.trim() || `${formStorageGb}GB`,
        storageGb: formStorageGb ? parseInt(formStorageGb, 10) : null,
        ramGb: formRamGb ? parseInt(formRamGb, 10) : null,
        color: formColor.trim(),
        imei: formImei.trim(),
        condition: formCondition,
        buyingPrice: Math.round(Number(formBuyingPrice)),
        buyingDate: new Date(formBuyingDate).toISOString(),
        boughtFrom: formBoughtFrom.trim(),
        sellerPhone: formSellerPhone.trim(),
        sellerEmail: formSellerEmail.trim(),
        acquisitionChannel: formChannel,
        associatedBookingId: formBookingId.trim() || null,
        notes: formNotes.trim(),
      };

      if (formBarcode.trim()) {
        payload.barcode = formBarcode.trim();
      }

      if (editingItem) {
        await updateInventoryItem(editingItem.id, payload);
      } else {
        await createInventoryItem(payload);
      }

      setIsAddModalOpen(false);
      resetForm();
      await loadData();
    } catch (err: any) {
      alert(`Error saving device: ${err.message || 'Operation failed'}`);
    } finally {
      setSubmitting(false);
    }
  };

  // Open Mark Sold Modal
  const handleOpenSellModal = (item: InventoryItem) => {
    setSellingItem(item);
    setSellPrice('');
    setSoldDate(new Date().toISOString().split('T')[0]);
    setSoldTo('');
    setBuyerContact('');
    setPaymentMethod('UPI');
    setSellNotes('');
  };

  // Submit Mark as Sold
  const handleConfirmSold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sellingItem) return;
    const price = Number(sellPrice);
    if (isNaN(price) || price <= 0) {
      alert('Please enter a valid selling price.');
      return;
    }

    setSellingSubmitting(true);
    try {
      await markInventorySold(sellingItem.id, {
        sellingPrice: price,
        soldDate: new Date(soldDate).toISOString(),
        soldTo: soldTo.trim() || 'Retail Customer',
        buyerContact: buyerContact.trim(),
        paymentMethod,
        notes: sellNotes.trim(),
      });

      // Prepare updated item for the bill invoice view
      const updatedItemForBill: InventoryItem = {
        ...sellingItem,
        status: 'SOLD',
        sellingPrice: price,
        soldDate: new Date(soldDate).toISOString(),
        soldTo: soldTo.trim() || 'Retail Customer',
        buyerContact: buyerContact.trim(),
        paymentMethod,
        notes: sellNotes.trim(),
      };

      setSellingItem(null);
      await loadData();

      // Instantly open the invoice receipt dialog with print option
      setInvoiceItem(updatedItemForBill);
    } catch (err: any) {
      alert(`Failed to mark sold: ${err.message}`);
    } finally {
      setSellingSubmitting(false);
    }
  };

  // Revert Sold item to In Stock
  const handleRevertSold = async (item: InventoryItem) => {
    if (!confirm(`Revert ${item.brand} ${item.model} (${item.barcode}) back to IN STOCK?`)) return;
    try {
      await revertInventorySold(item.id);
      await loadData();
    } catch (err: any) {
      alert(`Failed to revert: ${err.message}`);
    }
  };

  // Delete Item
  const handleDelete = async (item: InventoryItem) => {
    if (!confirm(`Are you sure you want to delete inventory item ${item.barcode} (${item.brand} ${item.model})?`)) return;
    try {
      await deleteInventoryItem(item.id);
      await loadData();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  // Trigger Print Label
  const handlePrintLabel = (item: InventoryItem) => {
    setPrintItem(item);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-1 hover:bg-rose-100 rounded cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── 1. TOP STATS BAR ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Active Stock */}
        <div className="bg-canvas-pure border border-ice-border rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-ink-slate text-xs font-medium">
            <span>In Stock Devices</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
              <Package className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-ink-navy">{stats.inStockCount}</span>
            <span className="text-xs text-slate-500 font-mono">active units</span>
          </div>
          <div className="mt-1 text-xs text-emerald-600 font-semibold font-mono">
            Value: ₹{stats.inStockValue.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Sold Units */}
        <div className="bg-canvas-pure border border-ice-border rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-ink-slate text-xs font-medium">
            <span>Devices Sold</span>
            <span className="p-1.5 rounded-lg bg-cobalt/10 text-cobalt">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-ink-navy">{stats.soldCount}</span>
            <span className="text-xs text-slate-500 font-mono">total sold</span>
          </div>
          <div className="mt-1 text-xs text-cobalt font-semibold font-mono">
            Revenue: ₹{stats.totalRevenue.toLocaleString('en-IN')}
          </div>
        </div>

        {/* Realized Profit */}
        <div className="bg-canvas-pure border border-ice-border rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-ink-slate text-xs font-medium">
            <span>Realized Profit</span>
            <span className="p-1.5 rounded-lg bg-green-500/10 text-green-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600">
              ₹{stats.totalProfit.toLocaleString('en-IN')}
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500 font-mono">
            Net margin from sales
          </div>
        </div>

        {/* Source Channels */}
        <div className="bg-canvas-pure border border-ice-border rounded-xl p-4 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between text-ink-slate text-xs font-medium">
            <span>Acquisition Channel</span>
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
              <Store className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-3 text-xs font-bold">
            <div className="flex items-center gap-1.5 text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
              <Globe className="w-3.5 h-3.5" />
              <span>Online: {stats.onlineCount}</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
              <Store className="w-3.5 h-3.5" />
              <span>Offline: {stats.offlineCount}</span>
            </div>
          </div>
          <div className="mt-1.5 text-[11px] text-slate-400 font-mono">
            Total items cataloged: {stats.totalCount}
          </div>
        </div>
      </div>

      {/* ── 2. CONTROLS BAR: SEARCH, FILTERS & ACTION BUTTONS ──────────────── */}
      <div className="bg-canvas-pure border border-ice-border rounded-xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search box (searches Barcode, Brand, Model, IMEI, Seller) */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Scan barcode or search model, IMEI, seller..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-medium text-ink-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-cobalt/20 focus:border-cobalt transition-all"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Convert Online Booking Button */}
            <button
              onClick={() => {
                loadBookings();
                setIsBookingImportOpen(true);
              }}
              className="px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
              title="Import completed doorstep pickup from website"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Import Online Booking</span>
            </button>

            {/* Add Device Button */}
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="px-3.5 py-2 bg-cobalt hover:bg-cobalt/90 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Device to Inventory</span>
            </button>

            {/* Refresh */}
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2 border border-ice-border text-slate-600 hover:text-ink-navy hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
              title="Refresh Inventory"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cobalt' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-mono text-[11px] font-semibold mr-1">STATUS:</span>
          {(['ALL', 'IN_STOCK', 'SOLD'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st === 'ALL' ? 'All Status' : st === 'IN_STOCK' ? 'In Stock' : 'Sold Out'}
            </button>
          ))}

          <span className="text-slate-300 mx-1">|</span>

          <span className="text-slate-400 font-mono text-[11px] font-semibold mr-1">CHANNEL:</span>
          {(['ALL', 'ONLINE', 'OFFLINE'] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                channelFilter === ch
                  ? 'bg-cobalt text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {ch === 'ALL' ? 'All Channels' : ch === 'ONLINE' ? '🌐 Online Orders' : '🏪 Offline Walk-in'}
            </button>
          ))}
        </div>
      </div>

      {/* ── 3. INVENTORY TABLE ────────────────────────────────────────────── */}
      <div className="bg-canvas-pure border border-ice-border rounded-xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin text-cobalt mb-3" />
            <p className="text-sm font-medium">Loading inventory records...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center px-4">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3 border border-slate-200">
              <Package className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-ink-navy">No inventory items found</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
              {search || statusFilter !== 'ALL' || channelFilter !== 'ALL'
                ? 'Try adjusting your search terms or filters.'
                : 'Start tracking stock by adding your first bought phone or importing from online orders.'}
            </p>
            <button
              onClick={() => {
                resetForm();
                setIsAddModalOpen(true);
              }}
              className="px-4 py-2 bg-cobalt hover:bg-cobalt/90 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Device</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-ice-border text-slate-500 font-mono text-[11px] uppercase tracking-wider">
                  <th className="py-3 px-4">Barcode / Tag</th>
                  <th className="py-3 px-4">Device Details</th>
                  <th className="py-3 px-4">Channel</th>
                  <th className="py-3 px-4">Buying Info</th>
                  <th className="py-3 px-4">Status & Sale</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ice-border">
                {items.map((item) => {
                  const isSold = item.status === 'SOLD';
                  const profit = isSold && item.sellingPrice ? item.sellingPrice - item.buyingPrice : 0;

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      {/* Barcode & Printable Preview */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="flex flex-col gap-1">
                          <span className="font-mono font-bold text-ink-navy text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block w-fit">
                            {item.barcode}
                          </span>
                          <button
                            onClick={() => handlePrintLabel(item)}
                            className="text-[11px] text-cobalt hover:text-indigo-700 font-semibold flex items-center gap-1 mt-0.5 cursor-pointer"
                            title="Print Barcode Sticker"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print Tag</span>
                          </button>
                        </div>
                      </td>

                      {/* Device Details */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-bold text-ink-navy text-sm">
                          {item.brand} {item.model}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                          {item.variant && <span>{item.variant}</span>}
                          {item.color && <span>• {item.color}</span>}
                          <span className="px-1.5 py-0.2 bg-slate-100 rounded text-[10px] font-mono text-slate-600 border border-slate-200">
                            {item.condition}
                          </span>
                        </div>
                        {item.imei && (
                          <div className="text-[11px] font-mono text-slate-400 mt-1">
                            IMEI: {item.imei}
                          </div>
                        )}
                        {item.notes && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5 max-w-xs truncate">
                            Note: {item.notes}
                          </div>
                        )}
                      </td>

                      {/* Channel Badge */}
                      <td className="py-3.5 px-4 align-top">
                        {item.acquisitionChannel === 'ONLINE' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-md text-[11px] font-bold">
                            <Globe className="w-3 h-3" />
                            <span>Online Order</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[11px] font-bold">
                            <Store className="w-3 h-3" />
                            <span>Store Walk-in</span>
                          </span>
                        )}
                        {item.associatedBookingId && (
                          <div className="text-[10px] font-mono text-slate-400 mt-1">
                            Ref: #{item.associatedBookingId.slice(-6)}
                          </div>
                        )}
                      </td>

                      {/* Buying Info */}
                      <td className="py-3.5 px-4 align-top">
                        <div className="font-mono font-bold text-sm text-ink-navy">
                          ₹{item.buyingPrice.toLocaleString('en-IN')}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          From: <span className="font-medium">{item.boughtFrom}</span>
                        </div>
                        {item.sellerPhone && (
                          <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1 mt-0.5">
                            <Phone className="w-2.5 h-2.5" />
                            <span>{item.sellerPhone}</span>
                          </div>
                        )}
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                          <Calendar className="w-2.5 h-2.5" />
                          <span>{item.buyingDate ? item.buyingDate.split('T')[0] : 'N/A'}</span>
                        </div>
                      </td>

                      {/* Status & Sale Info */}
                      <td className="py-3.5 px-4 align-top">
                        {isSold ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-bold text-[11px]">
                              <CheckCircle className="w-3 h-3 text-blue-600" />
                              <span>SOLD</span>
                            </span>
                            <div className="font-mono text-xs font-bold text-ink-navy">
                              Sale: ₹{item.sellingPrice?.toLocaleString('en-IN')}
                            </div>
                            <div className={`font-mono text-[11px] font-bold ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {profit >= 0 ? `+₹${profit.toLocaleString('en-IN')} profit` : `-₹${Math.abs(profit).toLocaleString('en-IN')} loss`}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              To: {item.soldTo} ({item.soldDate ? item.soldDate.split('T')[0] : ''})
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md font-bold text-[11px]">
                              <Package className="w-3 h-3 text-emerald-600" />
                              <span>IN STOCK</span>
                            </span>
                            <div className="text-[11px] text-slate-400 mt-1">Available to sell</div>
                          </div>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 align-top text-right">
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          {!isSold ? (
                            <button
                              onClick={() => handleOpenSellModal(item)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                            >
                              <DollarSign className="w-3 h-3" />
                              <span>Mark Sold</span>
                            </button>
                          ) : (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => setInvoiceItem(item)}
                                className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-all cursor-pointer"
                                title="Print Sale Bill / Invoice"
                              >
                                <FileText className="w-3 h-3" />
                                <span>Bill</span>
                              </button>
                              <button
                                onClick={() => handleRevertSold(item)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-all cursor-pointer"
                                title="Revert back to In Stock"
                              >
                                Revert
                              </button>
                            </div>
                          )}

                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-slate-400 hover:text-ink-navy hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="Edit Device Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleDelete(item)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Delete Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── 4. ADD / EDIT DEVICE MODAL ────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
          <div className="bg-canvas-pure border border-ice-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden my-0 sm:my-8 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-ice-border flex items-center justify-between bg-slate-50/80 shrink-0">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-xl bg-cobalt/10 text-cobalt font-bold shrink-0">
                  <Package className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm sm:text-base text-ink-navy truncate">
                    {editingItem ? 'Edit Inventory Device' : 'Add Device to Inventory'}
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono truncate">
                    Auto-assigns unique barcode and tracks buying cost & channel
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-ink-navy hover:bg-slate-200/60 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSubmitDevice} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Acquisition Channel (Online vs Offline) */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Acquisition Channel (How did you get this phone?) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => setFormChannel('OFFLINE')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      formChannel === 'OFFLINE'
                        ? 'border-amber-500 bg-amber-50/70 text-amber-900 ring-2 ring-amber-500/20'
                        : 'border-ice-border bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Store className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Store Walk-in / Offline</div>
                      <div className="text-[10px] text-slate-500">Bought directly at retail store / offline partner</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormChannel('ONLINE')}
                    className={`p-3 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                      formChannel === 'ONLINE'
                        ? 'border-blue-500 bg-blue-50/70 text-blue-900 ring-2 ring-blue-500/20'
                        : 'border-ice-border bg-slate-50/50 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <Globe className="w-5 h-5 text-blue-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Online Order / Pickup</div>
                      <div className="text-[10px] text-slate-500">Acquired via Rephonix website doorstep order</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Brand & Model */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brand *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apple, Samsung, OnePlus"
                    value={formBrand}
                    onChange={(e) => setFormBrand(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cobalt/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Model Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. iPhone 13 Pro, Galaxy S23"
                    value={formModel}
                    onChange={(e) => setFormModel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cobalt/20"
                  />
                </div>
              </div>

              {/* Variant, Storage & RAM */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Storage (GB)</label>
                  <input
                    type="number"
                    placeholder="128"
                    value={formStorageGb}
                    onChange={(e) => {
                      setFormStorageGb(e.target.value);
                      setFormVariant(`${e.target.value}GB`);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cobalt/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Color</label>
                  <input
                    type="text"
                    placeholder="e.g. Midnight, Blue"
                    value={formColor}
                    onChange={(e) => setFormColor(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cobalt/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Condition</label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cobalt/20"
                  >
                    <option value="Flawless">Flawless (Like New)</option>
                    <option value="Good">Good (Minor signs)</option>
                    <option value="Fair">Fair (Scratches/Dents)</option>
                    <option value="Needs Repair">Needs Repair (Defective)</option>
                  </select>
                </div>
              </div>

              {/* Buying Price & Buying Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-50/50 border border-emerald-200/70 rounded-xl">
                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1">
                    Buying Price (₹) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-emerald-700">₹</span>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="28000"
                      value={formBuyingPrice}
                      onChange={(e) => setFormBuyingPrice(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-white border border-emerald-300 rounded-lg text-sm font-bold text-emerald-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-emerald-900 mb-1">
                    Buying Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={formBuyingDate}
                    onChange={(e) => setFormBuyingDate(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-emerald-300 rounded-lg text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              {/* Bought From (Seller info) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Bought From (Customer / Vendor Name) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rahul Sharma"
                    value={formBoughtFrom}
                    onChange={(e) => setFormBoughtFrom(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cobalt/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Seller Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={formSellerPhone}
                    onChange={(e) => setFormSellerPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cobalt/20"
                  />
                </div>
              </div>

              {/* IMEI & Custom Barcode (optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">IMEI / Serial Number</label>
                  <input
                    type="text"
                    placeholder="15-digit IMEI (recommended)"
                    value={formImei}
                    onChange={(e) => setFormImei(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cobalt/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Barcode Tag (Leave blank to auto-generate)
                  </label>
                  <input
                    type="text"
                    placeholder="Auto: RPX-YYMMDD-XXXX"
                    value={formBarcode}
                    onChange={(e) => setFormBarcode(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-mono font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cobalt/20"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Accessories / Condition Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Original Box, 20W Fast Charger, Bill included"
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-cobalt/20"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-ice-border flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-ice-border text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 sm:px-5 py-2 bg-cobalt hover:bg-cobalt/90 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {submitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>{editingItem ? 'Update Device' : 'Save Device'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 5. MARK AS SOLD MODAL ─────────────────────────────────────────── */}
      {sellingItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
          <div className="bg-canvas-pure border border-ice-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-md max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
            <div className="px-4 sm:px-5 py-3.5 sm:py-4 border-b border-ice-border flex items-center justify-between bg-emerald-50/80 shrink-0">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-600 text-white font-bold shrink-0">
                  <CheckCircle className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm sm:text-base text-ink-navy truncate">Mark Device as Sold</h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono truncate">
                    Record buyer details and calculate realized profit
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSellingItem(null)}
                className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-ink-navy hover:bg-slate-200/60 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSold} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {/* Device Quick Recap Card */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-bold text-ink-navy text-xs">
                    {sellingItem.brand} {sellingItem.model}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    Tag: {sellingItem.barcode} • Bought: ₹{sellingItem.buyingPrice.toLocaleString('en-IN')}
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-slate-200 text-slate-700 text-[10px] font-mono rounded font-bold">
                  {sellingItem.condition}
                </span>
              </div>

              {/* Selling Price & Profit Preview */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Selling Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-ink-navy">₹</span>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 34000"
                    value={sellPrice}
                    onChange={(e) => setSellPrice(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-base font-black text-ink-navy focus:bg-white focus:outline-none focus:ring-2 focus:ring-cobalt/20"
                  />
                </div>

                {/* Instant Profit / Loss Badge */}
                {sellPrice && !isNaN(Number(sellPrice)) && (
                  <div className={`mt-2 p-2.5 rounded-lg border flex items-center justify-between text-xs font-bold ${
                    Number(sellPrice) >= sellingItem.buyingPrice
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    <span>Realized Net Profit:</span>
                    <span className="font-mono text-sm">
                      {Number(sellPrice) >= sellingItem.buyingPrice ? '+' : ''}
                      ₹{(Number(sellPrice) - sellingItem.buyingPrice).toLocaleString('en-IN')}
                    </span>
                  </div>
                )}
              </div>

              {/* Sold Date & Buyer Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Sale Date *</label>
                  <input
                    type="date"
                    required
                    value={soldDate}
                    onChange={(e) => setSoldDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-medium focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Payment Mode</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-medium focus:bg-white"
                  >
                    <option value="UPI">UPI (GPay / PhonePe)</option>
                    <option value="CASH">Cash in Hand</option>
                    <option value="CARD">Credit / Debit Card</option>
                    <option value="BANK_TRANSFER">Direct Bank Transfer</option>
                  </select>
                </div>
              </div>

              {/* Buyer Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Buyer Name</label>
                  <input
                    type="text"
                    placeholder="Customer / Store Name"
                    value={soldTo}
                    onChange={(e) => setSoldTo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-medium focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Buyer Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={buyerContact}
                    onChange={(e) => setBuyerContact(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-medium focus:bg-white"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sale Remarks</label>
                <input
                  type="text"
                  placeholder="Warranty given, invoice number, etc."
                  value={sellNotes}
                  onChange={(e) => setSellNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-ice-border rounded-lg text-xs font-medium focus:bg-white"
                />
              </div>

              {/* Modal Footer Buttons */}
              <div className="pt-3 border-t border-ice-border flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setSellingItem(null)}
                  className="px-4 py-2 border border-ice-border text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sellingSubmitting}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {sellingSubmitting ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5" />
                  )}
                  <span>Confirm Sale & Record Profit</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 6. PRINT BARCODE LABEL MODAL ──────────────────────────────────── */}
      {printItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
          <div className="bg-canvas-pure border border-ice-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-sm max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
            <div className="px-4 sm:px-5 py-3 border-b border-ice-border flex items-center justify-between bg-slate-50 shrink-0">
              <span className="text-xs font-bold text-ink-navy flex items-center gap-1.5">
                <Printer className="w-4 h-4 text-cobalt" />
                <span>Print Barcode Label Tag</span>
              </span>
              <button
                type="button"
                onClick={() => setPrintItem(null)}
                className="p-1.5 text-slate-400 hover:text-ink-navy hover:bg-slate-200/60 rounded-md cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Printable Label View */}
            <div className="p-6 flex flex-col items-center justify-center bg-white">
              <div
                id="printable-barcode-sticker"
                className="w-full border-2 border-dashed border-slate-300 rounded-xl p-4 flex flex-col items-center text-center bg-white shadow-xs"
              >
                {/* Brand Header */}
                <div className="text-[10px] font-black tracking-widest text-cobalt uppercase">
                  REPHONIX CERTIFIED
                </div>

                <div className="text-sm font-extrabold text-slate-900 mt-1">
                  {printItem.brand} {printItem.model}
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  {printItem.variant} {printItem.color ? `• ${printItem.color}` : ''}
                </div>

                {/* Vector Barcode */}
                <div className="my-3 py-1 bg-white">
                  <BarcodeSvg value={printItem.barcode} width={220} height={50} />
                </div>

                {printItem.imei && (
                  <div className="text-[9px] font-mono text-slate-500">
                    IMEI: {printItem.imei}
                  </div>
                )}

                <div className="mt-2 pt-2 border-t border-slate-100 w-full flex items-center justify-between text-[10px] text-slate-500 font-mono">
                  <span>{printItem.acquisitionChannel === 'ONLINE' ? 'ONLINE ORD' : 'STORE BUY'}</span>
                  <span>{printItem.buyingDate ? printItem.buyingDate.split('T')[0] : ''}</span>
                  <span className="font-bold text-slate-900">{printItem.condition}</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-ice-border flex items-center justify-between">
              <button
                onClick={() => setPrintItem(null)}
                className="px-3 py-1.5 border border-ice-border text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print to Sticker / Thermal</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. PRINT SALE BILL / INVOICE MODAL ──────────────────────────── */}
      {invoiceItem && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
          <div className="bg-canvas-pure border border-ice-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-lg max-h-[94vh] sm:max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
            {/* Header */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-ice-border flex items-center justify-between bg-slate-50 shrink-0">
              <span className="text-xs sm:text-sm font-extrabold text-ink-navy flex items-center gap-2">
                <FileText className="w-4 h-4 text-cobalt" />
                <span>Customer Sale Invoice & Bill</span>
              </span>
              <button
                type="button"
                onClick={() => setInvoiceItem(null)}
                className="p-1.5 text-slate-400 hover:text-ink-navy hover:bg-slate-200/60 rounded-md cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Printable Invoice Container */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-slate-100/60">
              <div
                id="rephonix-sale-invoice"
                className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-sm text-slate-800 space-y-4"
              >
                {/* Store Header */}
                <div className="flex items-start justify-between pb-4 border-b border-slate-200 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#001736] p-1.5 flex items-center justify-center border border-slate-200 shrink-0">
                      <img src="/logo.svg" className="w-full h-full object-contain" alt="Rephonix Logo" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-xl text-slate-900 tracking-tight font-sans">
                          Re<span className="text-blue-600">phonix</span>
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded font-bold">
                          TAX INVOICE
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Certified Pre-Owned & Refurbished Devices
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        support@rephonix.in
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">
                      INVOICE NO.
                    </div>
                    <div className="font-mono font-bold text-xs text-slate-900">
                      INV-{invoiceItem.barcode.replace('RPX-', '')}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      {invoiceItem.soldDate ? invoiceItem.soldDate.split('T')[0] : new Date().toISOString().split('T')[0]}
                    </div>
                  </div>
                </div>

                {/* Buyer & Payment Meta */}
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-lg text-xs border border-slate-100">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Billed To (Buyer)</span>
                    <span className="font-bold text-slate-800 block text-xs mt-0.5">
                      {invoiceItem.soldTo || 'Retail Customer'}
                    </span>
                    {invoiceItem.buyerContact && (
                      <span className="text-[11px] font-mono text-slate-500 block">
                        Ph: {invoiceItem.buyerContact}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold block">Payment Mode</span>
                    <span className="font-bold text-emerald-700 block text-xs mt-0.5">
                      {invoiceItem.paymentMethod || 'UPI / CASH'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-500 block">
                      Status: PAID IN FULL
                    </span>
                  </div>
                </div>

                {/* Line Item Table */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-mono text-[10px] uppercase">
                        <th className="py-2 px-3">Item Description</th>
                        <th className="py-2 px-3">Condition</th>
                        <th className="py-2 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="py-3 px-3 align-top">
                          <div className="font-bold text-slate-900 text-xs">
                            {invoiceItem.brand} {invoiceItem.model}
                          </div>
                          <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {invoiceItem.variant} {invoiceItem.color ? `• ${invoiceItem.color}` : ''}
                          </div>
                          {invoiceItem.imei && (
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                              IMEI / S/N: {invoiceItem.imei}
                            </div>
                          )}
                          <div className="text-[10px] font-mono text-blue-600 mt-0.5">
                            Tag Barcode: {invoiceItem.barcode}
                          </div>
                        </td>
                        <td className="py-3 px-3 align-top font-mono text-[11px] font-semibold text-slate-700">
                          {invoiceItem.condition}
                        </td>
                        <td className="py-3 px-3 align-top text-right font-mono font-black text-sm text-slate-900">
                          ₹{invoiceItem.sellingPrice?.toLocaleString('en-IN') || 0}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Total Summary */}
                <div className="pt-2 border-t border-slate-200 flex justify-between items-baseline">
                  <div className="text-[10px] text-slate-400 font-mono">
                    Includes test verification & testing warranty
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono text-slate-500 uppercase mr-2 font-bold">TOTAL PAID:</span>
                    <span className="font-mono font-black text-lg text-emerald-700">
                      ₹{invoiceItem.sellingPrice?.toLocaleString('en-IN') || 0}
                    </span>
                  </div>
                </div>

                {/* Barcode & Footer Note */}
                <div className="pt-3 border-t border-dashed border-slate-200 flex flex-col items-center text-center">
                  <BarcodeSvg value={invoiceItem.barcode} width={200} height={45} />
                  <p className="text-[9px] text-slate-400 mt-2">
                    Thank you for buying from Rephonix! Keep this bill for testing warranty & support.
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-ice-border flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setInvoiceItem(null)}
                className="px-3.5 py-2 border border-ice-border text-slate-600 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 bg-cobalt hover:bg-cobalt/90 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Bill (PDF / Paper)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 8. IMPORT ONLINE BOOKING MODAL ────────────────────────────────── */}
      {isBookingImportOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-xs p-0 sm:p-4 overflow-y-auto">
          <div className="bg-canvas-pure border border-ice-border rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden my-0 sm:my-8 animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-150">
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-ice-border flex items-center justify-between bg-blue-50/80 shrink-0">
              <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-xl bg-blue-600 text-white font-bold shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-extrabold text-sm sm:text-base text-ink-navy truncate">
                    Import from Online Doorstep Pickups
                  </h3>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 font-mono truncate">
                    Select a completed customer order to prefill device details into inventory
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBookingImportOpen(false)}
                className="p-1.5 sm:p-2 rounded-lg text-slate-400 hover:text-ink-navy hover:bg-slate-200/60 cursor-pointer shrink-0"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto flex-1">
              {loadingBookings ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
                  <p className="text-xs">Loading verified website orders...</p>
                </div>
              ) : convertibleBookings.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No pending completed bookings found.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {convertibleBookings.map((b) => (
                    <div
                      key={b.id}
                      className={`p-3.5 rounded-xl border flex items-center justify-between gap-4 transition-all ${
                        b.alreadyInInventory
                          ? 'bg-slate-50/70 border-slate-200 opacity-60'
                          : 'bg-white border-ice-border hover:border-blue-400 hover:shadow-xs'
                      }`}
                    >
                      <div>
                        <div className="font-bold text-ink-navy text-xs flex items-center gap-2">
                          <span>{b.modelName}</span>
                          <span className="font-mono text-[10px] text-slate-400">
                            #{b.id.slice(-6)}
                          </span>
                          {b.alreadyInInventory && (
                            <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded">
                              Already in Inventory
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Customer: <span className="font-semibold text-slate-700">{b.customerName}</span> ({b.customerPhone})
                          {b.color && <span> • {b.color}</span>}
                          {b.storageGb && <span> • {b.storageGb}GB</span>}
                        </div>
                        {b.imei && (
                          <div className="text-[10px] font-mono text-slate-400">
                            IMEI: {b.imei}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-mono font-bold text-sm text-ink-navy">
                            ₹{(b.finalPayoutAmount || b.finalPrice || 0).toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400">
                            {b.pickupDate || 'Completed'}
                          </div>
                        </div>

                        <button
                          disabled={b.alreadyInInventory}
                          onClick={() => handleImportBooking(b)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer disabled:cursor-not-allowed"
                        >
                          <span>Import</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-ice-border flex justify-end">
              <button
                onClick={() => setIsBookingImportOpen(false)}
                className="px-4 py-2 border border-ice-border text-slate-600 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryTab;
