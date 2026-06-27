import React, { useState, useMemo } from 'react';
import { 
  Calendar, Clock, User, MapPin, CreditCard, 
  CheckCircle, ArrowLeft, ShieldAlert, Award, Star, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import emailjs from '@emailjs/browser';

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
  const [imei, setImei] = useState('');
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

  // Assign a random agent for the pickup
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !address || !selectedDate || !selectedTimeSlot) {
      alert('Please fill out all required fields.');
      return;
    }

    setIsSubmitting(true);

    // Build template parameters for EmailJS
    const templateParams = {
      to_name: name,
      to_email: email,
      phone: `+91 ${phone}`,
      imei: imei || 'Not provided',
      address,
      pickup_date: selectedDate,
      time_slot: selectedTimeSlot,
      payment_method: paymentMethod.toUpperCase(),
      payment_details: paymentDetails || 'N/A',
      payout_amount: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(finalPrice),
      agent_name: assignedAgent.name,
      agent_phone: assignedAgent.phone,
    };

    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey &&
          !serviceId.includes('xxxxxxx') && !publicKey.includes('your_public')) {
        await emailjs.send(serviceId, templateId, templateParams, publicKey);
      }
      // If credentials not configured, skip silently (demo mode)
    } catch (err) {
      console.warn('EmailJS not configured — booking confirmed locally only.', err);
    }

    setIsSubmitting(false);
    setIsConfirmed(true);

    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#3B82F6', '#60A5FA', '#93C5FD', '#1E3A8A', '#FAFAFA']
    });
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
            className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 text-left"
          >
            {/* Left Column: Form Details */}
            <form onSubmit={handleSubmit} className="lg:col-span-7 bg-canvas-pure rounded-sm border border-ice-border p-4 sm:p-6 space-y-5 sm:space-y-6">
              <div className="flex items-center gap-3 border-b border-white/[0.04] pb-4">
                <button
                  type="button"
                  onClick={onBack}
                  className="p-2 rounded-sm border border-ice-border hover:border-cobalt hover:bg-cobalt-light/10 text-ink-slate hover:text-cobalt transition-all"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-0.5">Scheduling agent</span>
                  <h2 className="text-3xl font-light text-ink-navy tracking-tight">Doorstep Pickup</h2>
                  <p className="text-xs text-ink-muted mt-1 font-light">Our certified agent will verify your device specs at your doorstep and transfer your money instantly.</p>
                </div>
              </div>

              {/* Step 1: Customer Contact */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-mono tracking-[0.2em] text-cobalt uppercase flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> 1. Customer Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-light text-ink-slate block mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="e.g. Vikramaditya Singh"
                      className="w-full p-3 rounded-sm border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:border-cobalt/40 focus:ring-1 focus:ring-cobalt/20 transition-all font-light"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-light text-ink-slate block mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. vikram@example.com"
                      className="w-full p-3 rounded-sm border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:border-cobalt/40 focus:ring-1 focus:ring-cobalt/20 transition-all font-light"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-light text-ink-slate block mb-1">WhatsApp / Contact Number *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-ink-slate">+91</span>
                    <input
                      type="tel"
                      required
                      pattern="[6-9][0-9]{9}"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="9876543210"
                      className="w-full pl-10 pr-3 py-3 rounded-sm border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:border-cobalt/40 focus:ring-1 focus:ring-cobalt/20 transition-all font-light"
                    />
                  </div>
                </div>

                {/* IMEI Field */}
                <div>
                  <label className="text-xs font-light text-ink-slate mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-3 h-3" />
                    Device IMEI
                    <span className="text-zinc-500 font-mono text-[9px]">(optional — dial *#06# to find)</span>
                  </label>
                  <input
                    type="text"
                    value={imei}
                    onChange={e => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
                    placeholder="e.g. 352999061234567"
                    maxLength={15}
                    className="w-full p-3 rounded-sm border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:border-cobalt/40 focus:ring-1 focus:ring-cobalt/20 transition-all font-light font-mono tracking-wide"
                  />
                  <p className="text-[10px] text-ink-muted mt-1 font-light">Helps our agent verify your device faster on arrival.</p>
                </div>
              </div>

              {/* Step 2: Pickup Location */}
              <div className="space-y-3">
                <h3 className="text-[10px] font-mono tracking-[0.2em] text-cobalt uppercase flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> 2. Pickup Address
                </h3>
                <div>
                  <label className="text-xs font-light text-ink-slate block mb-1">Complete Address Details *</label>
                  <textarea
                    required
                    rows={3}
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="Flat No, Building Name, Street Address, City, Pincode"
                    className="w-full p-3 rounded-sm border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:border-cobalt/40 focus:ring-1 focus:ring-cobalt/20 transition-all resize-none font-light"
                  />
                </div>
              </div>

              {/* Step 3: Date & Time Picker */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-mono tracking-[0.2em] text-cobalt uppercase flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> 3. Schedule Time Slot
                </h3>
                <div>
                  <label className="text-xs font-light text-ink-slate block mb-2">Available Pickup Dates *</label>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {dates.map(d => {
                      const isSelected = selectedDate === d.raw;
                      const isAnyDateSelected = selectedDate !== '';
                      return (
                        <button
                          key={d.raw}
                          type="button"
                          onClick={() => setSelectedDate(d.raw)}
                          className={`py-2 rounded-sm border text-center transition-all duration-300 flex flex-col justify-center items-center ${
                            isSelected
                              ? 'bg-cobalt-light border-cobalt text-ink-navy scale-[1.01] opacity-100 z-10'
                              : isAnyDateSelected
                              ? 'bg-canvas-white text-ink-slate border-ice-border opacity-40 hover:opacity-75 hover:scale-[1.005]'
                              : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/30 hover:scale-[1.005]'
                          }`}
                        >
                          <span className="text-[8px] font-mono uppercase tracking-wider block">{d.dayName}</span>
                          <span className="text-lg font-light leading-none my-0.5">{d.dayNumber}</span>
                          <span className="text-[8px] font-mono uppercase tracking-wider block">{d.month}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-light text-ink-slate block mb-2">Available Time Windows *</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {timeSlots.map(slot => {
                      const isSelected = selectedTimeSlot === slot;
                      const isAnySlotSelected = selectedTimeSlot !== '';
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedTimeSlot(slot)}
                          className={`p-3 rounded-sm border text-xs text-left transition-all duration-300 flex items-center gap-2 ${
                            isSelected
                              ? 'bg-cobalt-light border-cobalt scale-[1.01] opacity-100 z-10'
                              : isAnySlotSelected
                              ? 'bg-canvas-white text-ink-slate border-ice-border opacity-40 hover:opacity-75 hover:scale-[1.005]'
                              : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/30 hover:scale-[1.005]'
                          }`}
                        >
                          <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-cobalt' : 'text-zinc-500'}`} />
                          <span className="font-light">{slot}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Step 4: Payment Details */}
              <div className="space-y-4">
                <h3 className="text-[10px] font-mono tracking-[0.2em] text-cobalt uppercase flex items-center gap-1.5">
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
                        className={`py-3 rounded-sm border text-[10px] font-mono tracking-wider uppercase transition-all duration-300 ${
                          isSelected
                            ? 'bg-cobalt-light border-cobalt text-ink-navy scale-[1.01] opacity-100 z-10'
                            : 'bg-canvas-white text-ink-slate border-ice-border opacity-40 hover:opacity-75 hover:scale-[1.005]'
                        }`}
                      >
                        {mode === 'upi' ? 'UPI' : mode === 'bank' ? 'Bank Transfer' : 'Cash'}
                      </button>
                    );
                  })}
                </div>

                <div>
                  {paymentMethod === 'upi' && (
                    <div>
                      <label className="text-xs font-light text-ink-slate block mb-1">Enter UPI ID *</label>
                      <input
                        type="text"
                        required
                        value={paymentDetails}
                        onChange={e => setPaymentDetails(e.target.value)}
                        placeholder="e.g. mobile@upi"
                        className="w-full p-3 rounded-sm border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:border-cobalt/40 focus:ring-1 focus:ring-cobalt/20 transition-all font-light"
                      />
                    </div>
                  )}

                  {paymentMethod === 'bank' && (
                    <div className="space-y-3">
                      <label className="text-xs font-light text-ink-slate block mb-1">Account Number & IFSC Code *</label>
                      <input
                        type="text"
                        required
                        value={paymentDetails}
                        onChange={e => setPaymentDetails(e.target.value)}
                        placeholder="A/C: 987654321012, IFSC: HDFC0001234"
                        className="w-full p-3 rounded-sm border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:border-cobalt/40 focus:ring-1 focus:ring-cobalt/20 transition-all font-light"
                      />
                    </div>
                  )}

                  {paymentMethod === 'cash' && (
                    <div className="bg-red-500/10 text-red-400 p-3 rounded-sm border border-red-500/20 text-xs flex items-start gap-2">
                      <ShieldAlert className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" />
                      <span className="font-light"><strong>Security Notice:</strong> Cash handovers require verifying physical matching government ID proofs with the doorstep agent before handset handover.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-cobalt hover:bg-cobalt-hover disabled:bg-zinc-800 text-white py-4 rounded-sm font-bold text-sm transition-all flex items-center justify-center gap-2 hover:scale-[1.01]"
              >
                {isSubmitting ? 'Securing Booking...' : 'Book Pickup & Payout Ticket'}
              </button>
            </form>

            {/* Right Column: Ticket Summary */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-6">
              {/* Receipt Style Lock Summary */}
              <div className="bg-canvas-pure rounded-sm border border-ice-border p-6 relative overflow-hidden">
                <div className="absolute -left-12 -top-12 w-28 h-28 bg-cobalt-light rounded-sm -z-10 opacity-30" />
                <div className="pb-3 border-b border-white/[0.04] mb-4 text-left">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Telemetry</span>
                  <h3 className="text-xl font-light text-ink-navy">Quote Lock Summary</h3>
                </div>

                <div className="space-y-4 text-xs font-mono">
                  <div className="flex justify-between items-center bg-zinc-950/40 p-3 rounded-sm border border-white/[0.06]">
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase block font-mono">Locked Value Payout</span>
                      <span className="text-xl font-light text-cobalt tracking-tight">{formatPrice(finalPrice)}</span>
                    </div>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-sm border border-emerald-500/20 font-bold uppercase tracking-wider">Locked</span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Valuation Type</span>
                      <span className="text-zinc-300">User Self-Assessment</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Quote Validity</span>
                      <span className="text-zinc-300">7 Days (Rates Lock)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Verification</span>
                      <span className="text-zinc-300">Safe physical verification</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Assigned Agent Card */}
              <div className="bg-canvas-pure rounded-sm border border-ice-border p-5">
                <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-3">Assigned Inspector</span>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-sm bg-cobalt-light border border-white/[0.06] flex items-center justify-center text-xl">
                    {assignedAgent.avatar}
                  </div>
                  <div>
                    <h4 className="font-semibold text-ink-navy text-sm">{assignedAgent.name}</h4>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="text-xs font-bold text-ink-navy">{assignedAgent.rating}</span>
                      <span className="text-[10px] text-ink-muted">({assignedAgent.reviews} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="bg-zinc-950/40 rounded-sm p-3.5 mt-4 border border-white/[0.06] text-xs flex items-center justify-between text-zinc-400 font-mono">
                  <span>Inspection Contact</span>
                  <span className="text-ink-navy">{assignedAgent.phone}</span>
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
            className="max-w-xl mx-auto bg-canvas-pure border border-ice-border rounded-sm p-5 sm:p-8 text-center flex flex-col items-center justify-center relative overflow-hidden text-left"
          >
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-emerald-500/10 rounded-sm opacity-40 -z-10" />

            <div className="w-16 h-16 bg-emerald-500/10 rounded-sm flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20 animate-bounce">
              <CheckCircle className="w-10 h-10 fill-emerald-500/10" />
            </div>

            <h2 className="text-2xl font-light tracking-tight text-ink-navy">Trade-In Confirmed</h2>
            <p className="text-xs text-ink-muted mt-2 max-w-sm font-light">
              Your pickup is scheduled successfully. A WhatsApp confirmation has been dispatched to <strong className="text-ink-navy font-semibold">+91 {phone}</strong>.
            </p>

            {/* Receipt Details */}
            <div className="w-full bg-zinc-950/40 border border-dashed border-white/[0.12] rounded-sm p-5 my-6 text-xs space-y-2 font-mono">
              <div className="flex justify-between font-bold border-b border-white/[0.06] pb-2 mb-2 text-ink-navy">
                <span>Confirmation ID</span>
                <span className="text-cobalt">#STC-{Math.floor(Math.random() * 90000) + 10000}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Pickup Client</span>
                <span className="text-ink-navy">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Address</span>
                <span className="text-ink-navy truncate max-w-[240px]">{address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Scheduled Date</span>
                <span className="text-ink-navy">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Time Window</span>
                <span className="text-ink-navy">{selectedTimeSlot.split(' ')[0]} {selectedTimeSlot.split(' ')[1]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Payment Method</span>
                <span className="text-ink-navy uppercase">{paymentMethod}</span>
              </div>
              <div className="flex justify-between font-bold border-t border-white/[0.06] pt-2 mt-2 text-sm text-ink-navy">
                <span>Payout Value</span>
                <span className="text-cobalt font-light tracking-tight text-base">{formatPrice(finalPrice)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-cobalt-light border border-white/[0.06] rounded-sm mb-6 text-xs text-zinc-300">
              <Award className="w-4 h-4 text-cobalt flex-shrink-0" />
              <span className="font-light">Please keep your device unlocked and charged to at least 50% for inspection.</span>
            </div>

            <button
              onClick={onSuccess}
              className="w-full bg-cobalt hover:bg-cobalt-hover text-white py-3 rounded-sm font-bold transition-all"
            >
              Return to Homepage
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
