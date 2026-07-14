import React, { useState, useMemo } from 'react';
import { 
  Clock, User, MapPin, CreditCard, 
  CheckCircle, ArrowLeft, ShieldAlert, Award, Star, Smartphone, Info, ShieldCheck, ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import emailjs from '@emailjs/browser';
import { Model, Variant, DefectRule } from '../data/mockDatabase';

interface PickupSchedulerProps {
  finalPrice: number;
  onBack: () => void;
  onSuccess: () => void;
  selectedDefects: DefectRule[];
  selectedModel: Model;
  selectedVariant: Variant;
  onEditDevice: () => void;
}

const AGENTS = [
  { name: 'Amit Sharma', rating: 4.9, reviews: 312, avatar: '👤', phone: '+91 98765 43210' },
  { name: 'Rahul Verma', rating: 4.8, reviews: 245, avatar: '👤', phone: '+91 98765 11223' },
  { name: 'Priya Patel', rating: 5.0, reviews: 189, avatar: '👤', phone: '+91 98765 55678' }
];

const getEngineeringLabel = (description: string) => {
  const mapping: { [key: string]: string } = {
    'Cracked Screen / Back Glass': 'Screen Restoration Fee',
    'Light Screen Scratches': 'Glass Micro-Polishing Fee',
    'Screen Burn-in / Lines': 'Display Panel Replacement Fee',
    'Dented or Bent Frame': 'Chassis Structure Re-alignment',
    'Scuffed Frame / Normal Wear': 'Frame Bead-Blasting & Refinishing',
    'Faulty Lens / Blur': 'Optical Sensor Recalibration',
    'Battery Health < 80%': 'Battery Module Replacement',
    'Missing Original Box': 'OEM Retail Box De-allocation',
    'Missing Original Charger / Cable': 'OEM Power Adapter De-allocation',
    'Device Does Not Turn On': 'Board-Level Hardware Failure',
    'Biometrics Faulty (FaceID/TouchID)': 'Biometric Sensor Security Fee'
  };
  return mapping[description] || description;
};

// Luhn Checksum Algorithm for 15-digit IMEI verification
const validateLuhn = (imei: string): boolean => {
  if (!imei) return true; // Optional field is valid when empty
  if (imei.length !== 15) return false;
  let sum = 0;
  for (let i = 0; i < 15; i++) {
    let digit = parseInt(imei[i], 10);
    if (isNaN(digit)) return false;
    if (i % 2 === 1) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
};

export const PickupScheduler: React.FC<PickupSchedulerProps> = ({
  finalPrice,
  onBack,
  onSuccess,
  selectedDefects,
  selectedModel,
  selectedVariant,
  onEditDevice
}) => {
  const [schedulerStep, setSchedulerStep] = useState<number>(1);

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
  const [showTooltip, setShowTooltip] = useState(false);
  // DPDP consent — must be checked before form can proceed
  const [hasConsented, setHasConsented] = useState(false);

  // ── Rate limiter ───────────────────────────────────────────────
  // Track submission attempts in sessionStorage (persists across re-renders, cleared on tab close)
  const RATE_LIMIT_KEY = 'stc_submit_attempts';
  const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  const RATE_LIMIT_MAX = 3;

  const getRateLimitData = () => {
    try {
      const raw = sessionStorage.getItem(RATE_LIMIT_KEY);
      if (!raw) return { count: 0, windowStart: Date.now() };
      return JSON.parse(raw) as { count: number; windowStart: number };
    } catch {
      return { count: 0, windowStart: Date.now() };
    }
  };

  const isRateLimited = (): boolean => {
    const data = getRateLimitData();
    if (Date.now() - data.windowStart > RATE_LIMIT_WINDOW_MS) return false;
    return data.count >= RATE_LIMIT_MAX;
  };

  const recordSubmitAttempt = () => {
    const data = getRateLimitData();
    const now = Date.now();
    if (now - data.windowStart > RATE_LIMIT_WINDOW_MS) {
      sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ count: 1, windowStart: now }));
    } else {
      sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ count: data.count + 1, windowStart: data.windowStart }));
    }
  };
  // ────────────────────────────────────────────────────────

  /** Generate a cryptographically random confirmation ID (not Math.random) */
  const generateConfirmationId = (): string => {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return `STC-${arr[0].toString(16).toUpperCase().padStart(8, '0').slice(0, 8)}`;
  };

  // Stable confirmation ID for the success screen
  const [confirmationId] = useState(() => generateConfirmationId());

  // --- Timezone-safe local date helpers ---
  const getLocalDateString = (d: Date): string => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  // Generate next 5 dates using LOCAL date components (not UTC)
  const dates = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return {
      raw: getLocalDateString(d),
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

  // Step 1 Validation
  const isPhoneValid = useMemo(() => /^[6-9]\d{9}$/.test(phone), [phone]);
  const isEmailValid = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email), [email]);
  const isImeiValid = useMemo(() => !imei || (imei.length === 15 && validateLuhn(imei)), [imei]);
  const isNameValid = useMemo(() => name.trim().length >= 2 && name.trim().length <= 80, [name]);
  const isStep1Valid = useMemo(() => {
    return isNameValid && isEmailValid && isPhoneValid && isImeiValid && hasConsented;
  }, [isNameValid, isEmailValid, isPhoneValid, isImeiValid, hasConsented]);

  // Step 2 Validation — compare dates as local strings (not UTC-parsed Date objects)
  const isDateInRange = useMemo(() => {
    if (!selectedDate) return false;
    const today = new Date();
    const todayStr = getLocalDateString(today);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    const maxStr = getLocalDateString(maxDate);
    return selectedDate >= todayStr && selectedDate <= maxStr;
  }, [selectedDate]);
  const isAddressValid = useMemo(() => address.trim().length >= 10 && address.trim().length <= 500, [address]);
  const isStep2Valid = useMemo(() => {
    return isAddressValid && isDateInRange && selectedTimeSlot !== '';
  }, [isAddressValid, isDateInRange, selectedTimeSlot]);

  // Step 3 Validation
  const isStep3Valid = useMemo(() => {
    if (paymentMethod === 'cash') return true;
    const details = paymentDetails.trim();
    return details.length > 0 && details.length <= 200;
  }, [paymentMethod, paymentDetails]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      alert('Please fill out all required details correctly.');
      return;
    }
    // Rate-limit check
    if (isRateLimited()) {
      alert('Too many submission attempts. Please wait 10 minutes before trying again.');
      return;
    }

    setIsSubmitting(true);
    recordSubmitAttempt();

    // Build template parameters for EmailJS
    const templateParams = {
      to_name: name.trim().slice(0, 80),
      to_email: email.trim(),
      phone: `+91 ${phone}`,
      imei: imei || 'Not provided',
      address: address.trim().slice(0, 500),
      pickup_date: selectedDate,
      time_slot: selectedTimeSlot,
      payment_method: paymentMethod.toUpperCase(),
      // Note: paymentDetails sent over EmailJS — migrate to serverless relay for production
      payment_details: paymentDetails.trim().slice(0, 200) || 'N/A',
      payout_amount: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(finalPrice),
      agent_name: assignedAgent.name,
      confirmation_id: confirmationId,
    };

    try {
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (serviceId && templateId && publicKey &&
          !serviceId.includes('xxxxxxx') && !publicKey.includes('your_public')) {
        await emailjs.send(serviceId, templateId, templateParams, publicKey);
      }
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

  const handleNextStep = () => {
    if (schedulerStep === 1 && isStep1Valid) {
      setSchedulerStep(2);
    } else if (schedulerStep === 2 && isStep2Valid) {
      setSchedulerStep(3);
    }
  };

  const handlePrevStep = () => {
    if (schedulerStep === 3) {
      setSchedulerStep(2);
    } else if (schedulerStep === 2) {
      setSchedulerStep(1);
    } else {
      onBack();
    }
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
            {/* Left Column: Form Details & Progressive Steps */}
            <div className="lg:col-span-7 bg-canvas-pure rounded-sm border border-ice-border p-4 sm:p-6 flex flex-col justify-between shadow-premium min-h-[500px]">
              
              {/* Header block */}
              <div>
                <div className="flex items-center gap-3 border-b border-white/[0.04] pb-4 mb-5">
                  <button
                    type="button"
                    onClick={handlePrevStep}
                    className="p-2 rounded-sm border border-ice-border hover:border-cobalt hover:bg-cobalt-light/10 text-ink-slate hover:text-cobalt transition-all"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div>
                    <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-0.5">Scheduling agent</span>
                    <h2 className="text-3xl font-light text-ink-navy tracking-tight">Doorstep Pickup</h2>
                    <p className="text-xs text-ink-muted mt-1 font-light">Complete the steps below to secure your dynamic doorside valuation.</p>
                  </div>
                </div>

                {/* Progress bar info */}
                <div className="flex items-center justify-between mb-6 bg-canvas-white/40 p-2.5 rounded-sm border border-white/[0.04] text-[10px] font-mono tracking-wider text-zinc-400">
                  <span className="uppercase">Step {schedulerStep} of 3: {
                    schedulerStep === 1 ? 'Contact & Device Info' : 
                    schedulerStep === 2 ? 'Pickup Details' : 
                    'Payout Confirmation'
                  }</span>
                  <div className="flex gap-1">
                    {[1, 2, 3].map(s => (
                      <span key={s} className={`w-2 h-2 rounded-full ${s <= schedulerStep ? 'bg-cobalt' : 'bg-ice-border'}`} />
                    ))}
                  </div>
                </div>

                {/* Step contents */}
                <div>
                  {/* STEP 1: Customer Contact & IMEI */}
                  {schedulerStep === 1 && (
                    <div className="space-y-5 animate-fadeIn">
                      <h3 className="text-[11px] font-mono tracking-[0.25em] text-cobalt uppercase flex items-center gap-1.5 font-bold mb-3">
                        <User className="w-3.5 h-3.5" /> 1. Contact details & IMEI Identification
                      </h3>

                      {/* DPDP / Privacy Consent */}
                      <div
                        onClick={() => setHasConsented(v => !v)}
                        className={`flex items-start gap-3 p-3 rounded-sm border cursor-pointer transition-all ${
                          hasConsented
                            ? 'bg-cobalt-light border-cobalt'
                            : 'bg-canvas-white border-ice-border hover:border-cobalt/40'
                        }`}
                      >
                        <div className={`mt-0.5 w-4 h-4 rounded-sm border flex-shrink-0 flex items-center justify-center transition-all ${
                          hasConsented ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border'
                        }`}>
                          {hasConsented && <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                        </div>
                        <p className="text-[10px] text-ink-slate font-light leading-relaxed">
                          <strong className="text-ink-navy">Data Collection Consent (Required)</strong> — I consent to SmartphoneCentre collecting and processing my contact details and device information solely to facilitate this trade-in booking. Data will not be shared with third parties except for pickup coordination.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-semibold text-ink-slate block mb-1">Full Name *</label>
                          <div className="relative">
                            <input
                              type="text"
                              required
                              maxLength={80}
                              autoComplete="name"
                              value={name}
                              onChange={e => setName(e.target.value)}
                              placeholder="e.g. Vikramaditya Singh"
                              className={`w-full p-3 pr-9 rounded-sm border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all font-light ${
                                name && isNameValid ? 'border-emerald-400' : name && !isNameValid ? 'border-red-400' : 'border-ice-border'
                              }`}
                              style={{ minHeight: '48px' }}
                            />
                            {name && (
                              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
                                isNameValid ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {isNameValid ? '✓' : '✗'}
                              </span>
                            )}
                          </div>
                          {name && !isNameValid && (
                            <span className="text-[10px] text-red-400 mt-1 block">Name must be 2–80 characters.</span>
                          )}
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-ink-slate block mb-1">Email Address *</label>
                          <div className="relative">
                            <input
                              type="email"
                              required
                              maxLength={254}
                              autoComplete="email"
                              value={email}
                              onChange={e => setEmail(e.target.value)}
                              placeholder="e.g. you@example.com"
                              className={`w-full p-3 pr-9 rounded-sm border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all font-light ${
                                email && isEmailValid ? 'border-emerald-400' : email && !isEmailValid ? 'border-red-400' : 'border-ice-border'
                              }`}
                              style={{ minHeight: '48px' }}
                            />
                            {email && (
                              <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
                                isEmailValid ? 'text-emerald-400' : 'text-red-400'
                              }`}>
                                {isEmailValid ? '✓' : '✗'}
                              </span>
                            )}
                          </div>
                          {email && !isEmailValid && (
                            <span className="text-[10px] text-red-400 mt-1 block">Please enter a valid email address.</span>
                          )}
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-ink-slate block mb-1">WhatsApp / Contact Number *</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-zinc-400 font-semibold">+91</span>
                          <input
                            type="tel"
                            required
                            autoComplete="tel"
                            pattern="[6-9][0-9]{9}"
                            maxLength={10}
                            value={phone}
                            onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                            placeholder="9876543210"
                            className={`w-full pl-11 pr-9 py-3 rounded-sm border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all font-light ${
                              phone && isPhoneValid ? 'border-emerald-400' : phone && !isPhoneValid ? 'border-red-400' : 'border-ice-border'
                            }`}
                            style={{ minHeight: '48px' }}
                          />
                          {phone && (
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm ${
                              isPhoneValid ? 'text-emerald-400' : 'text-red-400'
                            }`}>
                              {isPhoneValid ? '✓' : '✗'}
                            </span>
                          )}
                        </div>
                        {phone && !isPhoneValid && (
                          <span className="text-[10px] text-red-400 mt-1 block">Must start with 6-9 and contain exactly 10 digits.</span>
                        )}
                        {phone && isPhoneValid && (
                          <span className="text-[10px] text-emerald-400 mt-1 block">✓ Valid Indian mobile number.</span>
                        )}
                      </div>

                      {/* IMEI Input with Luhn Checksum validation and dial instructions */}
                      <div>
                        <div className="flex items-center justify-between mb-1 relative">
                          <label className="text-xs font-semibold text-ink-slate flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-cobalt" />
                            Device IMEI
                            <span className="text-zinc-500 font-mono text-[9px] font-normal">(optional)</span>
                          </label>
                          
                          {/* Info Tooltip */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setShowTooltip(!showTooltip)}
                              onMouseEnter={() => setShowTooltip(true)}
                              onMouseLeave={() => setShowTooltip(false)}
                              className="p-1 rounded-full text-zinc-500 hover:text-cobalt transition-colors"
                              title="How to retrieve IMEI"
                            >
                              <Info className="w-3.5 h-3.5" />
                            </button>
                            <AnimatePresence>
                              {showTooltip && (
                                <motion.div 
                                  initial={{ opacity: 0, y: 5 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 5 }}
                                  className="absolute right-0 bottom-6 z-20 w-52 p-3 bg-zinc-950 border border-white/[0.08] text-white text-[10px] rounded-sm shadow-premium leading-normal font-light"
                                >
                                  Dial <strong className="text-cobalt font-mono">*#06#</strong> on your phone's dial pad to display your 15-digit IMEI number instantly.
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </div>

                        <input
                          type="text"
                          autoComplete="off"
                          inputMode="numeric"
                          value={imei}
                          onChange={e => setImei(e.target.value.replace(/\D/g, '').slice(0, 15))}
                          placeholder="e.g. 352999061234567"
                          maxLength={15}
                          className="w-full p-3 rounded-sm border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all font-light font-mono tracking-wide"
                          style={{ minHeight: '48px' }}
                        />
                        {imei && imei.length > 0 && !isImeiValid && (
                          <span className="text-[10px] text-red-400 mt-1 block">Invalid 15-digit IMEI (Luhn verification failed).</span>
                        )}
                        {imei && isImeiValid && imei.length === 15 && (
                          <span className="text-[10px] text-emerald-400 mt-1 block">✓ Valid 15-digit IMEI checked via Luhn checksum.</span>
                        )}
                        <p className="text-[10px] text-ink-muted mt-1 font-light">Dialing *#06# helps verify hardware specifications instantly doorside.</p>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Address & Schedule Slot */}
                  {schedulerStep === 2 && (
                    <div className="space-y-5 animate-fadeIn">
                      <h3 className="text-[11px] font-mono tracking-[0.25em] text-cobalt uppercase flex items-center gap-1.5 font-bold mb-3">
                        <MapPin className="w-3.5 h-3.5" /> 2. Address & Time slots
                      </h3>

                      <div>
                        <label className="text-xs font-semibold text-ink-slate block mb-1">Complete Address Details *</label>
                        <div className="relative">
                          <textarea
                            required
                            rows={3}
                            maxLength={500}
                            autoComplete="street-address"
                            value={address}
                            onChange={e => setAddress(e.target.value)}
                            placeholder="Flat No, Building Name, Street Address, City, Pincode"
                            className={`w-full p-3 rounded-sm border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all resize-none font-light ${
                              address && isAddressValid ? 'border-emerald-400' : address && !isAddressValid ? 'border-red-400' : 'border-ice-border'
                            }`}
                          />
                        </div>
                        {address && !isAddressValid && (
                          <span className="text-[10px] text-red-400 mt-1 block">Please enter a complete address (at least 10 characters).</span>
                        )}
                        {address && isAddressValid && (
                          <span className="text-[10px] text-emerald-400 mt-1 block">✓ Address looks good.</span>
                        )}
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-ink-slate block mb-2">Available Pickup Dates *</label>
                        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                          {dates.map(d => {
                            const isSelected = selectedDate === d.raw;
                            const isAnyDateSelected = selectedDate !== '';
                            return (
                              <button
                                key={d.raw}
                                type="button"
                                onClick={() => setSelectedDate(d.raw)}
                                className={`py-2 rounded-sm border text-center transition-all duration-300 flex flex-col justify-center items-center focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt ${
                                  isSelected
                                    ? 'bg-cobalt-light border-cobalt text-ink-navy scale-[1.02] opacity-100 z-10 shadow-sm'
                                    : isAnyDateSelected
                                    ? 'bg-canvas-white text-ink-slate border-ice-border opacity-40 hover:opacity-75 hover:scale-[1.005]'
                                    : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/30 hover:scale-[1.005]'
                                }`}
                                style={{ minHeight: '52px' }}
                              >
                                <span className="text-[8px] font-mono uppercase tracking-wider block">{d.dayName}</span>
                                <span className="text-base font-semibold leading-none my-0.5">{d.dayNumber}</span>
                                <span className="text-[8px] font-mono uppercase tracking-wider block">{d.month}</span>
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
                            const isAnySlotSelected = selectedTimeSlot !== '';
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setSelectedTimeSlot(slot)}
                                className={`p-3.5 rounded-sm border text-xs text-left transition-all duration-300 flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt ${
                                  isSelected
                                    ? 'bg-cobalt-light border-cobalt scale-[1.01] opacity-100 z-10 shadow-sm'
                                    : isAnySlotSelected
                                    ? 'bg-canvas-white text-ink-slate border-ice-border opacity-40 hover:opacity-75 hover:scale-[1.005]'
                                    : 'bg-canvas-white text-ink-navy border-ice-border hover:border-cobalt/30 hover:scale-[1.005]'
                                }`}
                                style={{ minHeight: '48px' }}
                              >
                                <Clock className={`w-4 h-4 ${isSelected ? 'text-cobalt' : 'text-zinc-500'}`} />
                                <span className="font-semibold text-ink-navy">{slot}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Payment & Assigned Inspector & Trust badges */}
                  {schedulerStep === 3 && (
                    <div className="space-y-5 animate-fadeIn">
                      <h3 className="text-[11px] font-mono tracking-[0.25em] text-cobalt uppercase flex items-center gap-1.5 font-bold mb-3">
                        <CreditCard className="w-3.5 h-3.5" /> 3. Payout Method (Instant Dispatch)
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
                              className={`py-3.5 rounded-sm border text-[10px] font-mono tracking-wider uppercase transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt ${
                                isSelected
                                  ? 'bg-cobalt-light border-cobalt text-ink-navy scale-[1.01] opacity-100 z-10 shadow-sm'
                                  : 'bg-canvas-white text-ink-slate border-ice-border opacity-40 hover:opacity-75 hover:scale-[1.005]'
                              }`}
                              style={{ minHeight: '48px' }}
                            >
                              {mode === 'upi' ? 'UPI ID' : mode === 'bank' ? 'Bank Transfer' : 'Cash Payout'}
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
                              maxLength={100}
                              autoComplete="off"
                              value={paymentDetails}
                              onChange={e => setPaymentDetails(e.target.value)}
                              placeholder="e.g. mobile@upi"
                              className="w-full p-3 rounded-sm border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all font-light"
                              style={{ minHeight: '48px' }}
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
                              className="w-full p-3 rounded-sm border border-ice-border bg-canvas-white text-ink-navy text-sm focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all font-light"
                              style={{ minHeight: '48px' }}
                            />
                          </div>
                        )}

                        {paymentMethod === 'cash' && (
                          <div className="bg-red-500/10 text-red-400 p-3.5 rounded-sm border border-red-500/20 text-xs flex items-start gap-2.5">
                            <ShieldAlert className="w-4 h-4 mt-0.5 text-red-400 flex-shrink-0" />
                            <span className="font-light leading-normal">
                              <strong>Security Notice:</strong> Cash handovers require verifying physical matching government ID proofs with the doorstep agent before handset handover.
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Trust Badges */}
                      <div className="pt-4 border-t border-white/[0.04] grid grid-cols-3 gap-2 text-center">
                        <div className="bg-canvas-white p-2 border border-ice-border rounded-sm flex flex-col items-center">
                          <ShieldCheck className="w-5 h-5 text-cobalt mb-1" />
                          <span className="text-[8px] font-mono text-zinc-400 uppercase leading-tight font-bold">100% Encrypted Transactions</span>
                        </div>
                        <div className="bg-canvas-white p-2 border border-ice-border rounded-sm flex flex-col items-center">
                          <User className="w-5 h-5 text-cobalt mb-1" />
                          <span className="text-[8px] font-mono text-zinc-400 uppercase leading-tight font-bold">Verified Agent Delivery</span>
                        </div>
                        <div className="bg-canvas-white p-2 border border-ice-border rounded-sm flex flex-col items-center">
                          <Award className="w-5 h-5 text-cobalt mb-1" />
                          <span className="text-[8px] font-mono text-zinc-400 uppercase leading-tight font-bold">Zero Value Deductions Guarantee</span>
                        </div>
                      </div>

                      {/* Assigned Inspector Card */}
                      <div className="bg-canvas-white border border-ice-border rounded-sm p-4 mt-4 shadow-sm">
                        <span className="text-[9px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-2">Assigned Agent</span>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-sm bg-cobalt-light border border-white/[0.06] flex items-center justify-center text-lg">
                            {assignedAgent.avatar}
                          </div>
                          <div>
                            <h4 className="font-semibold text-ink-navy text-xs">{assignedAgent.name}</h4>
                            <div className="flex items-center gap-1 mt-0.5">
                              <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                              <span className="text-[10px] font-bold text-ink-navy">{assignedAgent.rating}</span>
                              <span className="text-[9px] text-ink-muted">({assignedAgent.reviews} reviews)</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation CTAs */}
              <div className="flex gap-3 border-t border-white/[0.04] pt-4 mt-8">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-5 py-3 rounded-sm border border-ice-border hover:bg-ice-gray text-ink-slate font-semibold text-sm transition-all"
                  style={{ minHeight: '48px' }}
                >
                  {schedulerStep === 1 ? 'Back' : 'Previous'}
                </button>

                {schedulerStep < 3 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    disabled={schedulerStep === 1 ? !isStep1Valid : !isStep2Valid}
                    className={`flex-1 bg-cobalt hover:bg-cobalt-hover text-white py-3 rounded-sm font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      (schedulerStep === 1 ? !isStep1Valid : !isStep2Valid)
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:scale-[1.01]'
                    }`}
                    style={{ minHeight: '48px' }}
                  >
                    Continue to Next Step
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting || !isStep3Valid}
                    className={`flex-1 bg-cobalt hover:bg-cobalt-hover text-white py-3 rounded-sm font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      (isSubmitting || !isStep3Valid)
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:scale-[1.01]'
                    }`}
                    style={{ minHeight: '48px' }}
                  >
                    {isSubmitting ? 'Securing Payout...' : 'Lock Quote & Book Pickup'}
                  </button>
                )}
              </div>
            </div>

            {/* Right Column: Ticket Summary with Specific Deductions and Editing */}
            <div className="lg:col-span-5 space-y-4 sm:space-y-6">
              {/* Receipt Style Lock Summary */}
              <div className="bg-canvas-pure rounded-sm border border-ice-border p-5 relative overflow-hidden shadow-premium">
                <div className="pb-3 border-b border-white/[0.04] mb-4 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Audit Ledger</span>
                    <h3 className="text-lg font-light text-ink-navy">Specification Ledger</h3>
                  </div>
                  <button
                    type="button"
                    onClick={onEditDevice}
                    className="text-[10px] font-mono text-cobalt hover:underline uppercase"
                  >
                    [Edit Spec]
                  </button>
                </div>

                <div className="space-y-3 text-xs font-mono text-left">
                  {/* Detailed breakdown list */}
                  <div className="flex justify-between items-center py-1 text-zinc-400">
                    <span>Base Value ({selectedVariant.storageGb}GB)</span>
                    <span className="text-cobalt">+{formatPrice(selectedVariant.basePrice)}</span>
                  </div>

                  {/* Deductions breakdown */}
                  {selectedDefects.length > 0 ? (
                    <div className="py-2 border-y border-white/[0.04] space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">
                        <span>Deductions Applied</span>
                        <button
                          type="button"
                          onClick={onBack}
                          className="text-cobalt hover:underline font-normal normal-case"
                        >
                          Edit Defects
                        </button>
                      </div>
                      {selectedDefects.map((defect, idx) => {
                        // Calculate specific deduction amount for this defect
                        const base = selectedVariant.basePrice;
                        const deduction = defect.deductionPercentage > 0 
                          ? base * defect.deductionPercentage 
                          : defect.deductionFixed;
                        return (
                          <div key={defect.id} className="flex justify-between items-start text-zinc-400">
                            <span className="leading-tight">{(idx + 1).toString().padStart(2, '0')}. {getEngineeringLabel(defect.description)}</span>
                            <span className="text-red-500 flex-shrink-0">-[{formatPrice(deduction)}]</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-3 border-y border-white/[0.04] border-dashed text-center text-[10px] text-emerald-400 italic">
                      [No defects declared. Maximum value applies.]
                    </div>
                  )}

                  <div className="flex justify-between items-center bg-zinc-950/40 p-3 rounded-sm border border-white/[0.06] mt-4">
                    <div>
                      <span className="text-[8px] text-zinc-500 uppercase block font-mono">Total Estimated Payout</span>
                      <span className="text-xl font-bold text-cobalt tracking-tight font-outfit">{formatPrice(finalPrice)}</span>
                    </div>
                    <span className="text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-sm border border-emerald-500/20 font-bold uppercase tracking-wider">Locked</span>
                  </div>
                </div>
              </div>

              {/* Side contact info summary */}
              <div className="bg-canvas-pure rounded-sm border border-ice-border p-5 text-xs text-left shadow-premium space-y-2">
                <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Contact Summary</span>
                {name && <div className="text-zinc-300 font-mono"><strong>Client:</strong> {name}</div>}
                {phone && <div className="text-zinc-300 font-mono"><strong>WhatsApp:</strong> +91 {phone}</div>}
                {selectedDate && (
                  <div className="text-zinc-300 font-mono">
                    <strong>Pickup:</strong> {selectedDate} @ {selectedTimeSlot ? selectedTimeSlot.split(' ')[0] + ' ' + selectedTimeSlot.split(' ')[1] : ''}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          /* Booking Success Screen with specific overview and defects summary */
          <motion.div
            key="success-card"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl mx-auto bg-canvas-pure border border-ice-border rounded-sm p-5 sm:p-8 text-center flex flex-col items-center justify-center relative overflow-hidden shadow-premium"
          >
            <div className="absolute -right-12 -top-12 w-32 h-32 bg-emerald-500/10 rounded-sm opacity-40 -z-10" />

            <div className="w-16 h-16 bg-emerald-500/10 rounded-sm flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/20 animate-bounce">
              <CheckCircle className="w-10 h-10 fill-emerald-500/10" />
            </div>

            <h2 className="text-2xl font-light tracking-tight text-ink-navy">Trade-In Confirmed</h2>
            <p className="text-xs text-ink-muted mt-2 max-w-sm font-light text-center">
              Your doorside pickup has been locked successfully. A confirmation message was sent to <strong className="text-ink-navy font-semibold">+91 {phone}</strong>.
            </p>

            {/* Receipt Details with declared defects summary */}
            <div className="w-full bg-zinc-950/40 border border-dashed border-white/[0.12] rounded-sm p-5 my-6 text-xs space-y-2.5 font-mono text-left">
              <div className="flex justify-between font-bold border-b border-white/[0.06] pb-2 mb-2 text-ink-navy">
                <span>Confirmation ID</span>
                <span className="text-cobalt">#{confirmationId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Device Model</span>
                <span className="text-ink-navy font-semibold">{selectedModel.name} ({selectedVariant.storageGb}GB)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Client Inspector</span>
                <span className="text-ink-navy">{name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Pickup Address</span>
                <span className="text-ink-navy truncate max-w-[240px]">{address}</span>
              </div>
              
              {/* Date time booking overview */}
              <div className="flex justify-between border-t border-white/[0.04] pt-2">
                <span className="text-zinc-500">Scheduled Date</span>
                <span className="text-ink-navy font-semibold">{selectedDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Time Slot Window</span>
                <span className="text-ink-navy font-semibold">{selectedTimeSlot}</span>
              </div>

              {/* Declared defects summary on ticket receipt */}
              <div className="border-t border-white/[0.04] pt-2 space-y-1">
                <span className="text-zinc-500 block">Declared Defects Summary:</span>
                {selectedDefects.length > 0 ? (
                  <div className="space-y-1 pl-2 text-[10px] text-zinc-400">
                    {selectedDefects.map(d => (
                      <div key={d.id} className="flex justify-between">
                        <span>• {getEngineeringLabel(d.description)}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="pl-2 text-[10px] text-emerald-400 italic">• No defects declared (Flawless Device)</span>
                )}
              </div>

              <div className="flex justify-between">
                <span className="text-zinc-500">Payout Method</span>
                <span className="text-ink-navy uppercase">{paymentMethod}</span>
              </div>
              
              <div className="flex justify-between font-bold border-t border-white/[0.06] pt-2.5 mt-2 text-sm text-ink-navy">
                <span>Final Locked Payout</span>
                <span className="text-cobalt font-light tracking-tight text-base font-outfit">{formatPrice(finalPrice)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 p-3 bg-cobalt-light border border-white/[0.06] rounded-sm mb-6 text-xs text-zinc-300 text-left">
              <Award className="w-4 h-4 text-cobalt flex-shrink-0" />
              <span className="font-light">Our agent {assignedAgent.name} will call you before arrival. Please keep your device unlocked and clean.</span>
            </div>

            <button
              onClick={onSuccess}
              className="w-full bg-cobalt hover:bg-cobalt-hover text-white py-3.5 rounded-sm font-bold transition-all text-sm"
              style={{ minHeight: '48px' }}
            >
              Return to Catalog Homepage
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
