import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, User, MapPin, CreditCard, 
  CheckCircle, ArrowLeft, ShieldAlert, Award, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface PickupSchedulerProps {
  finalPrice: number;
  onBack: () => void;
  onSuccess: () => void;
}

const AGENTS = [
  { name: 'Amit Sharma', rating: 4.9, reviews: 312, avatar: '👤', phone: '+91 98765 43210' },
  { name: 'Rahul Verma', rating: 4.8, reviews: 245, avatar: '👤', phone: '+91 98765 11223' },
  { name: 'Priya Patel', rating: 5.0, reviews: 189, avatar: '👤', phone: '+91 98765 55678' }
];

export const PickupScheduler: React.FC<PickupSchedulerProps> = ({
  finalPrice,
  onBack,
  onSuccess
}) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank' | 'cash'>('upi');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Generate next 5 dates in formatted string
  const dates = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      raw: d.toISOString().split('T')[0],
      dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('en-IN', { month: 'short' })
    };
  });

  const timeSlots = [
    '09:00 AM - 12:00 PM (Morning)',
    '12:00 PM - 03:00 PM (Afternoon)',
    '03:00 PM - 06:00 PM (Evening)',
    '06:00 PM - 09:00 PM (Night)'
  ];

  // Assign a random agent for the pickup (memoized to prevent flickering on input changes)
  const assignedAgent = useMemo(() => {
    return AGENTS[Math.floor(Math.random() * AGENTS.length)];
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !address || !selectedDate || !selectedTimeSlot) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsConfirmed(true);
      
      // Trigger canvas-confetti for premium feel
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#1D4ED8', '#60A5FA', '#3B82F6', '#1E3A8A', '#FAFAFA']
      });
    }, 1500);
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {!isConfirmed ? (
          <motion.div
            key="scheduler-form"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8"
          >
            {/* Left Column: Form Details */}
            <form onSubmit={handleSubmit} className="lg:col-span-7 bg-canvas-pure rounded-2xl border border-ice-border p-4 sm:p-6 canva-shadow space-y-5 sm:space-y-6">
              <div className="flex items-center gap-3 border-b border-ice-gray pb-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="p-2 rounded-xl border border-ice-border hover:border-cobalt hover:bg-cobalt-light/10 text-ink-slate hover:text-cobalt transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-2xl font-bold text-ink-navy">Schedule Doorstep Pickup</h2>
                  <p className="text-xs text-ink-muted mt-0.5">An agent will verify your device & pay you instantly on the spot.</p>
                </div>
              </div>

              {/* Step 1: Customer Contact */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-cobalt flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> 1. Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-ink-slate block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Vikramaditya Singh"
                      className="w-full p-3 rounded-lg border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt/20 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-ink-slate block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. vikram@example.com"
                      className="w-full p-3 rounded-lg border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt/20 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-slate block mb-1">WhatsApp / Contact Number *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-ink-slate">+91</span>
                    <input
                      type="tel"
                      required
                      pattern="[0-9]{10}"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-3 py-3 rounded-lg border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt/20 transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Step 2: Pickup Location */}
              <div className="space-y-3">
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-cobalt flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> 2. Pickup Address
                </h3>
                <div>
                  <label className="text-xs font-semibold text-ink-slate block mb-1">Complete Address Details *</label>
                  <textarea
                    required
                    rows={3}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Flat No, Building Name, Street Address, City, Pincode"
                    className="w-full p-3 rounded-lg border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt/20 transition-all resize-none"
                  />
                </div>
              </div>

              {/* Step 3: Date & Time Picker */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-cobalt flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> 3. Schedule Time Slot
                </h3>
                <div>
                  <label className="text-xs font-semibold text-ink-slate block mb-2">Available Pickup Dates *</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {dates.map(d => {
                      const isSelected = selectedDate === d.raw;
                      return (
                        <button
                          key={d.raw}
                          type="button"
                          onClick={() => setSelectedDate(d.raw)}
                          className={`py-2 rounded-lg border text-center transition-all flex flex-col justify-center items-center ${
                              isSelected
                                ? 'bg-cobalt text-white border-cobalt shadow-tactile scale-[1.03]'
                                : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/20'
                            }`}
                        >
                          <span className="text-[9px] uppercase font-bold opacity-80">{d.dayName}</span>
                          <span className="text-lg font-black leading-none my-0.5">{d.dayNumber}</span>
                          <span className="text-[9px] uppercase font-bold opacity-80">{d.month}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-ink-slate block mb-2">Available Time Windows *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {timeSlots.map(slot => {
                      const isSelected = selectedTimeSlot === slot;
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`p-3 rounded-lg border text-xs text-left transition-all flex items-center gap-2 ${
                            isSelected
                              ? 'bg-cobalt-light border-cobalt ring-1 ring-cobalt/20'
                              : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/10'
                          }`}
                        >
                          <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-cobalt' : 'text-ink-muted'}`} />
                          <span className="font-semibold">{slot}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step 4: Payment Details */}
              <div className="space-y-4">
                <h3 className="text-xs uppercase tracking-wider font-extrabold text-cobalt flex items-center gap-1.5">
                  <CreditCard className="w-3.5 h-3.5" /> 4. Payout Mode (Instant Dispatch)
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {(['upi', 'bank', 'cash'] as const).map(mode => {
                    const isSelected = paymentMethod === mode;
                    return (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(mode);
                          setPaymentDetails('');
                        }}
                        className={`py-3 rounded-lg border text-xs font-bold uppercase transition-all ${
                          isSelected
                            ? 'bg-cobalt text-white border-cobalt shadow-tactile'
                            : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/20'
                        }`}
                      >
                        {mode === 'upi' ? 'UPI Payout' : mode === 'bank' ? 'Bank Transfer' : 'Cash Payout'}
                      </button>
                    );
                  })}
                </div>

                <div>
                  {paymentMethod === 'upi' && (
                    <div>
                      <label className="text-xs font-semibold text-ink-slate block mb-1">Enter UPI ID *</label>
                      <input
                        type="text"
                        required
                        value={paymentDetails}
                        onChange={e => setPaymentDetails(e.target.value)}
                        placeholder="e.g. mobile@upi"
                        className="w-full p-3 rounded-lg border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt/20 transition-all"
                      />
                    </div>
                  )}

                  {paymentMethod === 'bank' && (
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-ink-slate block mb-1">Account Number & IFSC Code *</label>
                      <input
                        type="text"
                        required
                        value={paymentDetails}
                        onChange={e => setPaymentDetails(e.target.value)}
                        placeholder="A/C: 987654321012, IFSC: HDFC0001234"
                        className="w-full p-3 rounded-lg border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt/20 transition-all"
                      />
                    </div>
                  )}

                  {paymentMethod === 'cash' && (
                    <div className="bg-amber-50 text-amber-800 p-3 rounded-lg border border-amber-200 text-xs flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                      <span><strong>Notice:</strong> For cash transactions, please verify matching government ID proofs with the doorstep agent before stock dispatch.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-cobalt hover:bg-cobalt-hover disabled:bg-slate-300 text-white py-4 rounded-xl font-extrabold text-sm transition-all shadow-tactile flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {isSubmitting ? 'Securing Booking...' : 'Book Pickup & Payout Ticket'}
              </button>
            </form>

            {/* Right Column: Ticket Summary */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-6">
              {/* Canva Style Pickup summary card */}
              <div className="bg-canvas-pure rounded-2xl border border-ice-border p-6 canva-shadow relative overflow-hidden">
                <div className="absolute -left-12 -top-12 w-28 h-28 bg-cobalt-light rounded-full -z-10 opacity-30" />
                <h3 className="font-extrabold text-lg text-ink-navy mb-4 border-b border-ice-gray pb-3">Quote Lock Summary</h3>

                <div className="space-y-4 text-xs">
                  <div className="flex justify-between items-center bg-ice-gray p-3 rounded-xl border border-ice-border">
                    <div>
                      <span className="text-[10px] text-ink-muted uppercase block font-semibold">Locked Value Payout</span>
                      <span className="text-xl font-black text-cobalt">{formatPrice(finalPrice)}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-bold uppercase">Locked</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-medium">
                      <span className="text-ink-muted">Valuation Type</span>
                      <span className="text-ink-navy">Self-Diagnostic (C2B)</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-ink-muted">Quote Validity</span>
                      <span className="text-ink-navy">7 Days (Expires soon)</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-ink-muted">Quality Inspector</span>
                      <span className="text-ink-navy">Doorstep Verification Agent</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Agent Card */}
              <div className="bg-canvas-pure rounded-2xl border border-ice-border p-5 canva-shadow">
                <span className="text-[10px] font-extrabold text-cobalt uppercase tracking-wider block mb-3">Assigned Pickup Agent</span>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-cobalt-light border border-cobalt-border flex items-center justify-center text-xl">
                    {assignedAgent.avatar}
                  </div>
                  <div>
                    <h4 className="font-extrabold text-ink-navy text-sm">{assignedAgent.name}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-ink-navy">{assignedAgent.rating}</span>
                      <span className="text-[10px] text-ink-muted">({assignedAgent.reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 mt-4 border border-ice-border text-xs flex items-center justify-between text-ink-slate font-medium">
                  <span>Inspection Contact</span>
                  <span className="font-mono text-ink-navy">{assignedAgent.phone}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          /* Booking Success Screen */
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto bg-canvas-pure border border-ice-border rounded-2xl p-5 sm:p-8 text-center canva-shadow flex flex-col items-center justify-center relative overflow-hidden"
          >
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-emerald-50 rounded-full opacity-40 -z-10" />

            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-6 border border-emerald-100 animate-bounce">
              <CheckCircle className="w-10 h-10 fill-emerald-50" />
            </div>

            <h2 className="text-2xl font-black text-ink-navy">Trade-In Booking Confirmed!</h2>
            <p className="text-sm text-ink-muted mt-2 max-w-sm">
              Your pickup is scheduled successfully. A WhatsApp confirmation has been dispatched to <strong className="text-ink-navy">+91 {phone}</strong>.
            </p>

            {/* Canva Style Receipt Details */}
            <div className="w-full bg-slate-50 border border-dashed border-slate-300 rounded-xl p-5 my-6 text-left text-xs space-y-2">
              <div className="flex justify-between font-bold border-b border-slate-200 pb-2 mb-2 text-ink-navy">
                <span>Confirmation ID</span>
                <span className="font-mono text-cobalt">#STC-{Math.floor(Math.random() * 90000) + 10000}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-ink-muted">Pickup Client</span>
                <span className="text-ink-navy">{name}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-ink-muted">Address</span>
                <span className="text-ink-navy truncate max-w-[240px]">{address}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-ink-muted">Scheduled Date</span>
                <span className="text-ink-navy">{selectedDate}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-ink-muted">Time Window</span>
                <span className="text-ink-navy">{selectedTimeSlot.split(' ')[0]} {selectedTimeSlot.split(' ')[1]}</span>
              </div>
              <div className="flex justify-between font-medium">
                <span className="text-ink-muted">Payment Method</span>
                <span className="text-ink-navy uppercase">{paymentMethod}</span>
              </div>
              <div className="flex justify-between font-extrabold border-t border-slate-200 pt-2 mt-2 text-sm text-ink-navy">
                <span>Immediate Payout Value</span>
                <span className="text-cobalt">{formatPrice(finalPrice)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl mb-6 text-xs text-blue-800 text-left">
              <Award className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span>Please keep your device unlocked and charged to at least 50% for inspection.</span>
            </div>

            <button
              onClick={onSuccess}
              className="w-full bg-cobalt hover:bg-cobalt-hover text-white py-3 rounded-xl font-bold transition-all shadow-tactile"
            >
              Return to Homepage
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
