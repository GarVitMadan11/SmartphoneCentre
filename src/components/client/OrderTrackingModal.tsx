import { trackBookingOrder, fetchMyBookings, downloadBookingPdf, ApiTrackBooking, ApiBooking, ApiUser } from '../../utils/api';
import { getDeviceImage, Model } from '../../data/mockDatabase';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: ApiUser | null;
  models?: Model[];
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  models = []
}) => {
  const [activeTab, setActiveTab] = useState<'my_bookings' | 'track_search'>('my_bookings');
  
  // My Bookings list state
  const [myBookings, setMyBookings] = useState<ApiBooking[]>([]);
  const [fetchingMyBookings, setFetchingMyBookings] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual lookup state
  const [bookingId, setBookingId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingResult, setTrackingResult] = useState<ApiTrackBooking | null>(null);

  // Load user's bookings whenever modal opens
  useEffect(() => {
    if (isOpen) {
      if (currentUser) {
        setActiveTab('my_bookings');
        loadCustomerBookings();
      } else {
        setActiveTab('track_search');
      }
    }
  }, [isOpen, currentUser]);

  const loadCustomerBookings = async () => {
    setFetchingMyBookings(true);
    try {
      const list = await fetchMyBookings();
      setMyBookings(list);
    } catch {
      setMyBookings([]);
    } finally {
      setFetchingMyBookings(false);
    }
  };

  if (!isOpen) return null;

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingId.trim() || !phone.trim()) {
      setError('Please enter both your Booking ID and 10-digit phone number.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await trackBookingOrder(bookingId.trim(), phone.trim());
      setTrackingResult(result);
    } catch (err: any) {
      setError(err.message || 'Unable to locate booking with provided details.');
      setTrackingResult(null);
    } finally {
      setLoading(false);
    }
  };

  const copyBookingId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusStep = (status: { inspectionStatus: string; payoutStatus: string; verificationStatus?: string }) => {
    if (status.payoutStatus === 'completed') return 4;
    if (status.inspectionStatus === 'approved') return 3;
    if (status.verificationStatus === 'verified') return 2;
    return 1;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-canvas-white text-ink-navy w-full max-w-2xl rounded-xl border border-ice-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-ice-border bg-zinc-50/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cobalt/10 rounded-lg text-cobalt flex-shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-ink-navy">Your Trade-In Bookings</h3>
                <p className="text-xs text-ink-muted">View selected device model, agreed price, booking date &amp; scheduled doorstep pickup</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-zinc-200/60 text-ink-muted hover:text-ink-navy transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-ice-border/60 -mb-4 pt-1 gap-4 text-xs font-semibold">
            {currentUser && (
              <button
                type="button"
                onClick={() => setActiveTab('my_bookings')}
                className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
                  activeTab === 'my_bookings'
                    ? 'border-cobalt text-cobalt font-bold'
                    : 'border-transparent text-ink-muted hover:text-ink-navy'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>My Bookings ({myBookings.length})</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setActiveTab('track_search')}
              className={`pb-3 border-b-2 flex items-center gap-2 transition-all ${
                activeTab === 'track_search'
                  ? 'border-cobalt text-cobalt font-bold'
                  : 'border-transparent text-ink-muted hover:text-ink-navy'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>Lookup by Reference ID</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
          
          {/* TAB 1: My Bookings List */}
          {activeTab === 'my_bookings' && (
            <div className="space-y-4 animate-fadeIn">
              {fetchingMyBookings ? (
                <div className="py-12 text-center text-ink-muted space-y-3">
                  <div className="w-7 h-7 border-2 border-cobalt border-t-transparent rounded-full animate-spin mx-auto" />
                  <p className="text-xs">Loading your trade-in bookings...</p>
                </div>
              ) : myBookings.length === 0 ? (
                <div className="py-12 text-center text-ink-muted space-y-3 bg-slate-50/50 rounded-xl border border-dashed border-ice-border p-6">
                  <div className="w-12 h-12 rounded-full bg-cobalt/10 text-cobalt flex items-center justify-center mx-auto">
                    <Package className="w-6 h-6" />
                  </div>
                  <h4 className="font-bold text-base text-ink-navy">No Active Bookings Found</h4>
                  <p className="text-xs max-w-sm mx-auto text-ink-muted">
                    You haven't scheduled any doorstep device trade-in bookings yet. Start an instant quote to sell your smartphone in 60 seconds!
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {myBookings.map((b) => {
                    const matchedModel = models.find(m => m.id === b.modelId || m.name.toLowerCase() === b.modelName.toLowerCase());
                    const deviceImg = getDeviceImage(
                      b.modelId, 
                      matchedModel?.brandId || 'apple', 
                      b.color, 
                      matchedModel?.imageUrl
                    );
                    const stepNum = getStatusStep(b);

                    return (
                      <div 
                        key={b.id} 
                        className="bg-canvas-pure border border-ice-border rounded-xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-all space-y-4 text-left"
                      >
                        {/* Top Header Row: ID, Creation Date & Status Badge */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-ice-border/60">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono font-bold text-cobalt bg-cobalt/10 px-2.5 py-1 rounded-md border border-cobalt/20">
                              #{b.id}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyBookingId(b.id)}
                              className="text-zinc-400 hover:text-cobalt p-1 rounded transition-colors"
                              title="Copy Booking ID"
                            >
                              {copiedId === b.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-[10px] font-mono text-zinc-400">
                              Booked on {formatDate(b.dateCreated)}
                            </span>
                            <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full uppercase ${
                              b.payoutStatus === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                : b.inspectionStatus === 'approved'
                                ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                            }`}>
                              {b.payoutStatus === 'completed'
                                ? 'Paid Out'
                                : b.inspectionStatus === 'approved'
                                ? 'Inspection Approved'
                                : 'Pending Pickup'}
                            </span>
                          </div>
                        </div>

                        {/* Middle Section: Device Details & Price */}
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 bg-white border border-ice-border rounded-lg p-1.5 flex items-center justify-center flex-shrink-0 shadow-xs">
                            <img 
                              src={deviceImg} 
                              alt={b.modelName} 
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-base text-ink-navy truncate">
                              {b.modelName}
                            </h4>
                            <p className="text-xs text-ink-muted mt-0.5 truncate font-mono">
                              Storage: {b.storageGb >= 1024 ? `${b.storageGb / 1024}TB` : `${b.storageGb}GB`}
                              {b.color && b.color !== 'Standard' ? ` • ${b.color}` : ''}
                            </p>
                          </div>

                          <div className="text-right flex-shrink-0">
                            <span className="text-[10px] font-mono text-zinc-400 uppercase block font-semibold">Agreed Quote</span>
                            <span className="text-lg sm:text-xl font-extrabold text-emerald-600 font-mono">
                              {formatPrice(b.finalPayoutAmount || b.finalPrice)}
                            </span>
                          </div>
                        </div>

                        {/* Info Grid: Scheduled Pickup & Address */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs bg-slate-50/60 dark:bg-zinc-900/40 p-3 rounded-lg border border-ice-border/40">
                          <div>
                            <span className="text-[10px] font-mono text-zinc-400 uppercase font-semibold block flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-cobalt" /> Scheduled Doorstep Pickup
                            </span>
                            <p className="font-medium text-ink-navy mt-0.5">
                              {b.pickupDate} ({b.pickupTimeSlot})
                            </p>
                          </div>
                          
                          <div>
                            <span className="text-[10px] font-mono text-zinc-400 uppercase font-semibold block flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-cobalt" /> Pickup Address
                            </span>
                            <p className="font-light text-ink-navy truncate mt-0.5" title={b.address}>
                              {b.address}
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end pt-1">
                          <a
                            href={`/api/bookings/${b.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-cobalt hover:text-cobalt-hover hover:underline bg-cobalt/10 px-3 py-1.5 rounded-md border border-cobalt/20 transition-all"
                          >
                            📄 Download PDF Quotation
                          </a>
                        </div>

                        {/* Status Progression Stepper */}
                        <div className="pt-2">
                          <div className="relative flex items-center justify-between text-center">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-200 -z-0" />
                            {[
                              { title: 'Booked', desc: 'Order confirmed' },
                              { title: 'Verified', desc: 'Identity check' },
                              { title: 'Inspected', desc: 'Doorside audit' },
                              { title: 'Paid Out', desc: 'Funds transferred' },
                            ].map((s, idx) => {
                              const sNum = idx + 1;
                              const isPassed = stepNum >= sNum;
                              return (
                                <div key={idx} className="relative z-10 flex flex-col items-center">
                                  <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                    isPassed
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-zinc-200 text-zinc-500'
                                  }`}>
                                    {isPassed ? <CheckCircle2 className="w-4 h-4" /> : sNum}
                                  </div>
                                  <span className="text-[10px] font-semibold text-ink-navy mt-1">{s.title}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Track Search Form */}
          {activeTab === 'track_search' && (
            <div className="space-y-6 animate-fadeIn">
              <form onSubmit={handleTrack} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-ink-navy mb-1">
                      Booking Reference ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. STC-A8B9C0D1"
                      value={bookingId}
                      onChange={(e) => setBookingId(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-ice-border bg-white text-sm font-mono focus:ring-2 focus:ring-cobalt focus:border-cobalt outline-none uppercase"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ink-navy mb-1">
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      maxLength={10}
                      placeholder="10-digit number"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-ice-border bg-white text-sm font-mono focus:ring-2 focus:ring-cobalt focus:border-cobalt outline-none"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-cobalt hover:bg-cobalt-hover text-white font-semibold py-3 px-4 rounded-lg text-sm transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Locating Order...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4" />
                      Track Order Status
                    </>
                  )}
                </button>
              </form>

              {/* Tracking Result View */}
              {trackingResult && (
                <div className="mt-6 space-y-6 pt-6 border-t border-ice-border animate-fadeIn text-left">
                  {/* Summary Card */}
                  <div className="p-4 bg-zinc-50 rounded-xl border border-ice-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block font-semibold">
                        Device for Trade-In
                      </span>
                      <h4 className="font-bold text-base text-ink-navy mt-0.5">
                        {trackingResult.modelName} ({trackingResult.storageGb >= 1024 ? `${trackingResult.storageGb / 1024}TB` : `${trackingResult.storageGb}GB`}{trackingResult.color && trackingResult.color !== 'Standard' && (trackingResult.color.includes('Wi-Fi') || trackingResult.color.includes('Cellular')) ? ` - ${trackingResult.color}` : ''})
                      </h4>
                      <p className="text-xs text-ink-muted mt-1">
                        Scheduled Pickup: <span className="font-medium text-ink-navy">{trackingResult.pickupDate}</span> ({trackingResult.pickupTimeSlot})
                      </p>
                    </div>
                    <div className="sm:text-right">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block font-semibold">
                        Payout Amount
                      </span>
                      <span className="text-xl font-black text-emerald-600">
                        {formatPrice(trackingResult.finalPayoutAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Status Stepper */}
                  <div className="py-2">
                    <h5 className="text-xs font-bold text-ink-navy uppercase tracking-wider mb-4">
                      Order Progression
                    </h5>
                    <div className="relative flex items-center justify-between">
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-zinc-200 -z-0" />
                      
                      {[
                        { title: 'Booked', desc: 'Order confirmed' },
                        { title: 'Verified', desc: 'Identity check' },
                        { title: 'Inspected', desc: 'Quality verified' },
                        { title: 'Paid Out', desc: 'Funds disbursed' },
                      ].map((step, idx) => {
                        const stepNum = idx + 1;
                        const currentStep = getStatusStep(trackingResult);
                        const isPassed = currentStep >= stepNum;
                        return (
                          <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                            <div
                              className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                isPassed
                                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                                  : 'bg-zinc-200 text-zinc-500'
                              }`}
                            >
                              {isPassed ? <CheckCircle2 className="w-5 h-5" /> : stepNum}
                            </div>
                            <span className="text-xs font-semibold text-ink-navy mt-2 block">{step.title}</span>
                            <span className="text-[10px] text-ink-muted hidden sm:block">{step.desc}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Audit Timeline */}
                  {trackingResult.events.length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-xs font-bold text-ink-navy uppercase tracking-wider">
                        Activity Timeline
                      </h5>
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {trackingResult.events.map((evt, index) => (
                          <div key={index} className="p-3 bg-white rounded-lg border border-ice-border text-xs flex items-start justify-between gap-3">
                            <div className="flex items-center gap-2">
                              <Clock className="w-3.5 h-3.5 text-cobalt shrink-0" />
                              <span className="text-ink-navy font-medium">{evt.note}</span>
                            </div>
                            <span className="text-[10px] font-mono text-ink-muted whitespace-nowrap">
                              {new Date(evt.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
