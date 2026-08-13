import React, { useState } from 'react';
import { X, Search, CheckCircle2, Clock, ShieldCheck, AlertCircle, Package, ArrowRight, Truck } from 'lucide-react';
import { trackBookingOrder, ApiTrackBooking } from '../../utils/api';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({ isOpen, onClose }) => {
  const [bookingId, setBookingId] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackingResult, setTrackingResult] = useState<ApiTrackBooking | null>(null);

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

  const getStatusStep = (b: ApiTrackBooking) => {
    if (b.payoutStatus === 'completed') return 4;
    if (b.inspectionStatus === 'approved') return 3;
    if (b.verificationStatus === 'verified') return 2;
    return 1;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-canvas-white text-ink-navy w-full max-w-xl rounded-xl border border-ice-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-ice-border bg-zinc-50/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cobalt/10 rounded-lg text-cobalt">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-ink-navy">Track Trade-In Order</h3>
              <p className="text-xs text-ink-muted">Enter your Booking ID & registered mobile number</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-200/60 text-ink-muted hover:text-ink-navy transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
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
            <div className="mt-6 space-y-6 pt-6 border-t border-ice-border">
              {/* Summary Card */}
              <div className="p-4 bg-zinc-50 rounded-xl border border-ice-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block font-semibold">
                    Device for Trade-In
                  </span>
                  <h4 className="font-bold text-base text-ink-navy mt-0.5">
                    {trackingResult.modelName} ({trackingResult.storageGb}GB - {trackingResult.color})
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
                    ₹{trackingResult.finalPayoutAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Status Stepper */}
              <div className="py-2">
                <h5 className="text-xs font-bold text-ink-navy uppercase tracking-wider mb-4">
                  Order Progression
                </h5>
                <div className="relative flex items-center justify-between">
                  {/* Connecting Line */}
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
      </div>
    </div>
  );
};
