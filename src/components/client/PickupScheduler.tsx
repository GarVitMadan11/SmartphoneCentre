import React, { useState, useMemo, useRef } from 'react';
import { 
  Clock, User, MapPin, 
  CheckCircle, ArrowLeft, ChevronRight, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import emailjs from '@emailjs/browser';
import { Model, Variant, DefectRule, Booking } from '../../data/mockDatabase';
import { createBooking, downloadBookingPdf, ApiUser } from '../../utils/api';


interface PickupSchedulerProps {
  finalPrice: number;
  onBack: () => void;
  onSuccess: () => void;
  selectedDefects: DefectRule[];
  selectedModel: Model;
  selectedVariant: Variant;
  onEditDevice: () => void;
  currentUser?: ApiUser | null;
  onNavigate?: (path: string) => void;
}

// L-2: Agent phone numbers are placeholder / demo only.
// In production, these should be fetched server-side — never hardcoded in the bundle.
const AGENTS = [
  { name: 'Amit Sharma', rating: 4.9, reviews: 312, avatar: '👤', phone: '+91 XXXXX XXXXX' },
  { name: 'Rahul Verma', rating: 4.8, reviews: 245, avatar: '👤', phone: '+91 XXXXX XXXXX' },
  { name: 'Priya Patel', rating: 5.0, reviews: 189, avatar: '👤', phone: '+91 XXXXX XXXXX' }
];

const DELHI_PINCODES: Record<string, string> = {
  '110001': 'Connaught Place, Mandi House, Gole Market',
  '110002': 'Daryaganj, Delhi Gate, ITI',
  '110003': 'Golf Links, Nizamuddin West, Pragati Maidan',
  '110004': 'Rashtrapati Bhawan Estate',
  '110005': 'Karol Bagh, Anand Parbat, Dev Nagar',
  '110006': 'Chandni Chowk, Jama Masjid, Red Fort',
  '110007': 'Kamla Nagar, DU North Campus, Civil Lines',
  '110008': 'Patel Nagar, Shadipur, West Patel Nagar',
  '110009': 'GTB Nagar, Model Town, Mukherjee Nagar',
  '110010': 'Delhi Cantt, Dhaula Kuan, Subroto Park',
  '110011': 'South Avenue, Nirman Bhawan',
  '110012': 'Inderpuri, Pusa Institute',
  '110013': 'Nizamuddin East, Jangpura, CGO Complex',
  '110014': 'Sunlight Colony, Hari Nagar Ashram',
  '110015': 'Kirti Nagar, Ramesh Nagar, Bali Nagar',
  '110016': 'Hauz Khas, Green Park, IIT Delhi',
  '110017': 'Malviya Nagar, Saket, Sarvodya Enclave',
  '110018': 'Tilak Nagar, Vikas Puri, Khyala',
  '110019': 'Nehru Place, Kalkaji, Chittaranjan Park (CR Park)',
  '110020': 'Okhla Industrial Area, Govindpuri',
  '110021': 'Moti Bagh, Chanakyapuri, Anand Niketan',
  '110022': 'R.K. Puram, Vasant Vihar Sector 1',
  '110023': 'Sarojini Nagar, Kidwai Nagar',
  '110024': 'Defence Colony, Lajpat Nagar I',
  '110025': 'Jamia Nagar, Okhla, New Friends Colony',
  '110026': 'Punjabi Bagh, Madipur, Shivaji Park',
  '110027': 'Rajouri Garden, Tagore Garden, Subhash Nagar',
  '110028': 'Naraina, Naraina Vihar',
  '110029': 'Safdarjung Enclave, AIIMS, Green Park Extension',
  '110030': 'Mehrauli, Sultanpur, Chhatarpur',
  '110031': 'Geeta Colony, Nirman Vihar, Shastri Nagar',
  '110032': 'Shahdara, Vishwas Nagar',
  '110033': 'Azadpur, Jahangirpuri',
  '110034': 'Pitampura, Saraswati Vihar, Kohat Enclave',
  '110035': 'Tri Nagar, Inderlok',
  '110036': 'Alipur, Narela Sector',
  '110037': 'Mahipalpur, IGIA Airport',
  '110038': 'Rajokri, Aerocity, Kapashera',
  '110039': 'Bawana Industrial Area',
  '110041': 'Nangloi, Mundka',
  '110042': 'Samaypur Badli, Rohini Sector 18',
  '110043': 'Najafgarh',
  '110044': 'Badarpur, Mohan Cooperative',
  '110045': 'Palam, Palam Colony, Sadh Nagar',
  '110046': 'Sagarpur, Dashrathpuri',
  '110048': 'Greater Kailash I & II (GK 1 / GK 2), Kailash Colony',
  '110049': 'South Extension (South Ext I & II), Andrews Ganj',
  '110051': 'Krishna Nagar, East Delhi',
  '110052': 'Ashok Vihar, Wazirpur Industrial Area',
  '110053': 'Seelampur, Bhajanpura, Yamuna Vihar',
  '110054': 'Civil Lines, Timarpur',
  '110055': 'Pahar Ganj, New Delhi Station',
  '110056': 'Shakurbasti',
  '110057': 'Vasant Vihar, Paschimi Marg',
  '110058': 'Janakpuri, Posangipur',
  '110059': 'Uttam Nagar, Nawada',
  '110060': 'Rajendra Nagar, Old Rajinder Nagar',
  '110061': 'Dhool Siras, Dwarka Sector 24',
  '110062': 'Khanpur, Devli, Sangam Vihar',
  '110063': 'Paschim Vihar, Madipur',
  '110064': 'Mayapuri, Hari Nagar',
  '110065': 'Lajpat Nagar II, III & IV, East of Kailash',
  '110066': 'Bhikaji Cama Place',
  '110067': 'JNU Campus, Munirka, Vasant Kunj',
  '110068': 'Vasant Kunj Sectors A, B, C & D',
  '110070': 'Vasant Kunj Institutional Area',
  '110075': 'Dwarka Sector 1 to 12',
  '110077': 'Dwarka Sector 13 to 23, Matiala',
  '110078': 'Dwarka Mor, Kakrola',
  '110085': 'Rohini Sectors 1 to 15',
  '110086': 'Rohini Sectors 16 to 25',
  '110087': 'Paschim Vihar West',
  '110088': 'Shalimar Bagh',
  '110089': 'Rohini Sectors 9, 11 & 13',
  '110091': 'Mayur Vihar Phase 1, Trilokpuri',
  '110092': 'Laxmi Nagar, Anand Vihar, Nirman Vihar, Preet Vihar',
  '110093': 'Nand Nagri, Dilshad Garden',
  '110094': 'Karawal Nagar, Sonia Vihar',
  '110095': 'Vivek Vihar, Jwala Nagar',
  '110096': 'Mayur Vihar Phase 3, Vasundhara Enclave',
};



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
  onEditDevice,
  currentUser,
  onNavigate
}) => {
  const [schedulerStep, setSchedulerStep] = useState<number>(1);

  const [name, setName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [imei, setImei] = useState('');

  // Synchronize state if currentUser loads after component mount
  React.useEffect(() => {
    if (currentUser) {
      setName(prev => prev || currentUser.name);
      setEmail(prev => prev || currentUser.email);
      setPhone(prev => prev || currentUser.phone || '');
    }
  }, [currentUser]);

  // Restore fields if user was redirected to login and returned
  React.useEffect(() => {
    const savedFieldsStr = localStorage.getItem('pending_scheduler_fields');
    if (savedFieldsStr) {
      try {
        const fields = JSON.parse(savedFieldsStr);
        if (fields.name) setName(fields.name);
        if (fields.email) setEmail(fields.email);
        if (fields.phone) setPhone(fields.phone);
        if (fields.imei) setImei(fields.imei);
        if (fields.flatNo) setFlatNo(fields.flatNo);
        if (fields.buildingName) setBuildingName(fields.buildingName);
        if (fields.locality) setLocality(fields.locality);
        else if (fields.streetAddress) setLocality(fields.streetAddress);
        if (fields.landmark) setLandmark(fields.landmark);
        if (fields.address && (!fields.flatNo || !fields.buildingName || !fields.locality)) {
          const parts = fields.address.split(', ');
          if (parts.length >= 3) {
            setFlatNo(parts[0] || '');
            setBuildingName(parts[1] || '');
            setLocality(parts[2] || '');
          }
        }
        if (fields.pincode) setPincode(fields.pincode);
        if (fields.selectedDate) setSelectedDate(fields.selectedDate);
        if (fields.selectedTimeSlot) setSelectedTimeSlot(fields.selectedTimeSlot);
        if (fields.verificationStatus) setVerificationStatus(fields.verificationStatus);
        if (fields.verifiedName) setVerifiedName(fields.verifiedName);
        if (fields.maskedAadhaar) setMaskedAadhaar(fields.maskedAadhaar);
        if (fields.verificationDate) setVerificationDate(fields.verificationDate);
        
        localStorage.removeItem('pending_scheduler_fields');
      } catch (err) {
        console.error('Failed to parse pending scheduler fields:', err);
      }
    }
  }, []);
  const [flatNo, setFlatNo] = useState('');
  const [buildingName, setBuildingName] = useState('');
  const [locality, setLocality] = useState('');
  const [landmark, setLandmark] = useState('');
  const [pincode, setPincode] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  // Verification states (reserved for future identity verification)
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [verifiedName, setVerifiedName] = useState('');
  const [maskedAadhaar, setMaskedAadhaar] = useState('');
  const [verificationDate, setVerificationDate] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  // DPDP consent — must be checked before form can proceed
  const [hasConsented, setHasConsented] = useState(false);
  // Inline form error (replaces window.alert)
  const [formError, setFormError] = useState('');

  // ── Rate limiter ───────────────────────────────────────────────
  // Track submission attempts in sessionStorage (persists across re-renders, cleared on tab close)
  const RATE_LIMIT_KEY = 'stc_submit_attempts';
  const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
  const RATE_LIMIT_MAX = 10;

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

  // Generate next 5 dates starting 3 days afterwards (e.g. if today is 21st, start from 24th)
  const dates = Array.from({ length: 5 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 3);
    return {
      raw: getLocalDateString(d),
      dayName: d.toLocaleDateString('en-IN', { weekday: 'short' }),
      dayNumber: d.getDate(),
      month: d.toLocaleDateString('en-IN', { month: 'short' })
    };
  });

  const timeSlots = [
    'Morning (09:00 AM - 01:00 PM)',
    'Evening (03:00 PM - 07:00 PM)'
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

  const address = useMemo(() => {
    const parts = [
      flatNo.trim(),
      buildingName.trim(),
      locality.trim(),
      landmark.trim() ? `Landmark: ${landmark.trim()}` : ''
    ].filter(Boolean);
    return parts.join(', ');
  }, [flatNo, buildingName, locality, landmark]);

  const isAddressValid = useMemo(() => {
    return flatNo.trim().length >= 1 && buildingName.trim().length >= 2 && locality.trim().length >= 2;
  }, [flatNo, buildingName, locality]);

  const isDelhiPincodeValid = useMemo(() => /^110\d{3}$/.test(pincode.trim()), [pincode]);

  const pincodeLocality = useMemo(() => {
    const clean = pincode.trim();
    if (clean.length === 6 && clean.startsWith('110')) {
      return DELHI_PINCODES[clean] || 'Central / Greater Delhi NCT Region';
    }
    return null;
  }, [pincode]);

  const isStep2Valid = useMemo(() => {
    return isAddressValid && isDelhiPincodeValid && isDateInRange && selectedTimeSlot !== '';
  }, [isAddressValid, isDelhiPincodeValid, isDateInRange, selectedTimeSlot]);

  const totalPayoutVal = finalPrice;

  const isSubmittingRef = useRef(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current || isSubmitting) return;
    if (!isStep1Valid || !isStep2Valid) {
      setFormError('Please complete all required steps and fields before submitting.');
      return;
    }

    if (!currentUser) {
      // Save pending booking flow so we can restore the user's wizard state
      const pendingFlow = {
        selectedModel,
        selectedVariant,
        selectedDefects: selectedDefects,
        finalPrice,
        activeStage: 'schedule',
        wizardStep: 4, // final wizard step (PickupScheduler)
      };
      localStorage.setItem('pending_booking_flow', JSON.stringify(pendingFlow));

      // Save form fields so they are preserved
      const pendingFields = {
        name,
        email,
        phone,
        imei,
        flatNo,
        buildingName,
        locality,
        landmark,
        address,
        pincode,
        selectedDate,
        selectedTimeSlot,
        verificationStatus,
        verifiedName,
        maskedAadhaar,
        verificationDate,
      };
      localStorage.setItem('pending_scheduler_fields', JSON.stringify(pendingFields));

      // Redirect to login
      if (onNavigate) {
        onNavigate('/login?redirect=booking');
      } else {
        window.history.pushState({}, '', '/login?redirect=booking');
        window.dispatchEvent(new Event('popstate'));
      }
      return;
    }
    // Rate-limit check
    if (isRateLimited()) {
      alert('Too many submission attempts. Please wait 10 minutes before trying again.');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    recordSubmitAttempt();

    const finalPayoutAmt = finalPrice;
    const payoutInfoStr = 'Instant Doorside Transfer via UPI / Bank Transfer upon physical inspection';

    // Build template parameters for EmailJS
    const templateParams = {
      to_name: name.trim().slice(0, 80),
      to_email: email.trim(),
      phone: `+91 ${phone}`,
      imei: imei || 'Not provided',
      address: `${address.trim().slice(0, 500)} (Pincode: ${pincode.trim()})`,
      pickup_date: selectedDate,
      time_slot: selectedTimeSlot,
      payment_method: 'INSTANT DOORSIDE PAYOUT',
      payment_details: payoutInfoStr,
      payout_amount: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(finalPayoutAmt),
      agent_name: assignedAgent.name,
      confirmation_id: confirmationId,
    };

    // Save booking to SQLite DB via API
    const newBooking: Booking = {
      id: confirmationId,
      modelId: selectedModel.id,
      modelName: selectedModel.name,
      storageGb: selectedVariant.storageGb,
      color: selectedVariant.color,
      customerName: name.trim(),
      customerPhone: phone.trim(),
      customerEmail: email.trim(),
      address: `${address.trim()} (Pincode: ${pincode.trim()})`,
      pickupDate: selectedDate,
      pickupTimeSlot: selectedTimeSlot,
      finalPrice: finalPrice,
      defectIds: selectedDefects.map(defect => defect.id),
      verificationStatus: verificationStatus,
      verifiedName: verifiedName,
      maskedAadhaar: maskedAadhaar,
      verificationDate: verificationDate,
      payoutMethod: 'doorstep',
      payoutMethodName: 'Instant Doorside Payout',
      bonusPercentage: 0,
      bonusAmount: 0,
      finalPayoutAmount: finalPrice,
      payoutDetails: {},
      inspectionStatus: 'pending',
      payoutStatus: 'pending',
      dateCreated: new Date().toISOString()
    };

    try {
      await createBooking(newBooking as any);
      sessionStorage.removeItem(RATE_LIMIT_KEY);
    } catch (err) {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
      const data = getRateLimitData();
      if (data.count > 0) {
        sessionStorage.setItem(RATE_LIMIT_KEY, JSON.stringify({ ...data, count: data.count - 1 }));
      }
      setFormError('Failed to submit booking to server: ' + (err as Error).message);
      return;
    }

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
    setFormError(''); // Clear errors on step advance
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
                    schedulerStep === 2 ? 'Address & Schedule' : 
                    'Final Review & Doorside Payout'
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
                          <strong className="text-ink-navy">Data Collection Consent (Required)</strong> — I consent to Rephonix collecting and processing my contact details and device information solely to facilitate this trade-in booking. Data will not be shared with third parties except for pickup coordination.
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
                    </div>
                  )}

                  {/* STEP 2: Address & Schedule Slot */}
                  {schedulerStep === 2 && (
                    <div className="space-y-5 animate-fadeIn">
                      <h3 className="text-[11px] font-mono tracking-[0.25em] text-cobalt uppercase flex items-center gap-1.5 font-bold mb-3">
                        <MapPin className="w-3.5 h-3.5" /> 2. Address & Time slots
                      </h3>

                      {/* Segregated Address Input Fields */}
                      <div className="space-y-3 bg-canvas-white p-4 rounded-sm border border-ice-border">
                        <label className="text-xs font-semibold text-ink-slate block mb-1">
                          Complete Doorstep Address Details *
                        </label>

                        {/* Field 1: Flat / House / Floor No */}
                        <div>
                          <label className="text-[11px] text-zinc-500 font-medium block mb-1">Flat / House No., Floor, Door *</label>
                          <input
                            type="text"
                            required
                            value={flatNo}
                            onChange={e => setFlatNo(e.target.value)}
                            placeholder="e.g. Flat 402, 4th Floor / House No. B-12"
                            className={`w-full p-3 rounded-sm border bg-canvas-pure text-ink-navy text-sm focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all font-light ${
                              flatNo.trim() ? 'border-emerald-400' : 'border-ice-border'
                            }`}
                            style={{ minHeight: '44px' }}
                          />
                        </div>

                        {/* Field 2: Building / Apartment / Society Name */}
                        <div>
                          <label className="text-[11px] text-zinc-500 font-medium block mb-1">Building / Apartment / Society / Colony Name *</label>
                          <input
                            type="text"
                            required
                            value={buildingName}
                            onChange={e => setBuildingName(e.target.value)}
                            placeholder="e.g. Shanti Heights / DDA Pocket A Apartments"
                            className={`w-full p-3 rounded-sm border bg-canvas-pure text-ink-navy text-sm focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all font-light ${
                              buildingName.trim() ? 'border-emerald-400' : 'border-ice-border'
                            }`}
                            style={{ minHeight: '44px' }}
                          />
                        </div>

                        {/* Field 3: Locality / Sector / Area Name */}
                        <div>
                          <label className="text-[11px] text-zinc-500 font-medium block mb-1">Locality, Sector & Area Name *</label>
                          <input
                            type="text"
                            required
                            value={locality}
                            onChange={e => setLocality(e.target.value)}
                            placeholder="e.g. Tilak Nagar / Sector 14 / Janakpuri Block B"
                            className={`w-full p-3 rounded-sm border bg-canvas-pure text-ink-navy text-sm focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all font-light ${
                              locality.trim() ? 'border-emerald-400' : 'border-ice-border'
                            }`}
                            style={{ minHeight: '44px' }}
                          />
                        </div>

                        {/* Field 4: Nearby Landmark */}
                        <div>
                          <label className="text-[11px] text-zinc-500 font-medium block mb-1">
                            Nearby Landmark <span className="text-zinc-400 font-normal">(Optional)</span>
                          </label>
                          <input
                            type="text"
                            value={landmark}
                            onChange={e => setLandmark(e.target.value)}
                            placeholder="e.g. Near AS Coaching Centre / Opposite Metro Pillar 450"
                            className={`w-full p-3 rounded-sm border bg-canvas-pure text-ink-navy text-sm focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all font-light ${
                              landmark.trim() ? 'border-emerald-400' : 'border-ice-border'
                            }`}
                            style={{ minHeight: '44px' }}
                          />
                        </div>

                        {address && isAddressValid && (
                          <span className="text-[10px] text-emerald-500 mt-1 flex items-center gap-1 font-semibold">
                            ✓ Formatted Address: <span className="text-ink-navy font-normal">{address}</span>
                          </span>
                        )}
                      </div>

                      {/* Delhi Pincode Input & Live Verification with Locality Tick */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-ink-slate flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-cobalt" />
                            Delhi Pickup Pincode *
                          </label>
                          <span className="text-[10px] font-mono text-cobalt font-bold uppercase">
                            Delhi Only (110xxx)
                          </span>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            inputMode="numeric"
                            maxLength={6}
                            value={pincode}
                            onChange={e => setPincode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Type 6-digit Pincode (e.g. 110001, 110016, 110092)"
                            className={`w-full p-3 pr-10 rounded-sm border bg-canvas-white text-ink-navy text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all ${
                              pincode && isDelhiPincodeValid
                                ? 'border-emerald-500 ring-1 ring-emerald-500/30'
                                : pincode && pincode.length === 6 && !isDelhiPincodeValid
                                ? 'border-red-400 ring-1 ring-red-400/30'
                                : 'border-ice-border'
                            }`}
                            style={{ minHeight: '48px' }}
                          />
                          {pincode && pincode.length === 6 && (
                            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-base font-bold ${
                              isDelhiPincodeValid ? 'text-emerald-500' : 'text-red-500'
                            }`}>
                              {isDelhiPincodeValid ? '✓' : '✗'}
                            </span>
                          )}
                        </div>

                        {/* Live Delhi Locality Match Banner with Green Checkmark */}
                        {pincode && isDelhiPincodeValid && pincodeLocality && (
                          <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5 animate-fadeIn">
                            <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm">
                              ✓
                            </div>
                            <div>
                              <span className="font-bold text-emerald-800 dark:text-emerald-200 block text-[11px] uppercase font-mono tracking-wider">
                                Verified Delhi Service Area (Pincode {pincode})
                              </span>
                              <span className="text-[11px] font-normal text-emerald-700 dark:text-emerald-300 block mt-0.5">
                                📍 Locality: <strong>{pincodeLocality}</strong>, Delhi NCT
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Non-Delhi Pincode Warning Banner */}
                        {pincode && pincode.length === 6 && !isDelhiPincodeValid && (
                          <div className="mt-2 p-3 bg-red-500/10 border border-red-500/30 rounded-sm text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5 animate-fadeIn">
                            <div className="w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                              ✗
                            </div>
                            <div>
                              <strong className="block text-[11px] uppercase font-mono tracking-wider text-red-800 dark:text-red-200">
                                Service Unavailable for Pincode {pincode}
                              </strong>
                              <span className="text-[11px] font-light leading-relaxed block mt-0.5">
                                Doorstep pickup is currently exclusive to <strong>Delhi NCR (110xxx pincodes)</strong>. Please enter a valid 6-digit Delhi pincode starting with 110.
                              </span>
                            </div>
                          </div>
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

                  {/* STEP 3: Final Review & Confirmation Screen */}
                  {schedulerStep === 3 && (
                    <div className="space-y-5 animate-fadeIn">
                      <div className="space-y-1">
                        <h3 className="text-[11px] font-mono tracking-[0.25em] text-cobalt uppercase flex items-center gap-1.5 font-bold mb-3">
                          <CheckCircle className="w-3.5 h-3.5" /> 3. Final Review &amp; Confirmation
                        </h3>
                        <p className="text-xs text-ink-muted leading-relaxed font-light">
                          Please verify your pickup address, contact details, and scheduled doorstep inspection time before submitting.
                        </p>
                      </div>

                      {/* Instant Doorside Payout Banner */}
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-md p-4 text-xs text-emerald-800 dark:text-emerald-300 space-y-1.5 animate-fadeIn">
                        <div className="flex items-center gap-2 font-bold text-sm text-emerald-700 dark:text-emerald-300">
                          <ShieldCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                          <span>Instant Doorside Payout Guaranteed</span>
                        </div>
                        <p className="font-light leading-relaxed">
                          No upfront payment credentials required! Your full trade-in payout of <strong>{formatPrice(finalPrice)}</strong> will be transferred instantly via <strong>UPI or Bank Transfer</strong> directly at your doorstep after physical device inspection.
                        </p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Box 1: Client Specs */}
                        <div className="border border-ice-border rounded-sm p-4 bg-canvas-white space-y-1.5">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase block font-bold">1. Contact Details</span>
                          <div className="space-y-1 text-xs font-mono text-ink-navy">
                            <div><strong>Name:</strong> {name}</div>
                            <div><strong>Mobile:</strong> +91 {phone}</div>
                            <div className="truncate"><strong>Email:</strong> {email}</div>
                          </div>
                        </div>

                        {/* Box 2: Pickup Schedule */}
                        <div className="border border-ice-border rounded-sm p-4 bg-canvas-white space-y-1.5">
                          <span className="text-[8px] font-mono text-zinc-500 uppercase block font-bold">2. Doorside Pickup Schedule</span>
                          <div className="space-y-1 text-xs font-mono text-ink-navy">
                            <div><strong>Date:</strong> {selectedDate}</div>
                            <div className="truncate"><strong>Window:</strong> {selectedTimeSlot}</div>
                          </div>
                        </div>
                      </div>

                      {/* Address detail */}
                      <div className="border border-ice-border rounded-sm p-4 bg-canvas-white space-y-1.5">
                        <span className="text-[8px] font-mono text-zinc-500 uppercase block font-bold">Pickup Address &amp; Locality</span>
                        <p className="text-xs font-mono text-ink-navy leading-normal">{address}</p>
                      </div>

                      {/* Final Financial summary box */}
                      <div className="bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-lg border border-slate-200 dark:border-zinc-800 space-y-2.5 font-sans shadow-xs">
                        <div className="flex justify-between text-xs text-slate-600 dark:text-zinc-400 font-medium">
                          <span>Trade-In Valuation Price:</span>
                          <span className="text-slate-900 dark:text-white font-semibold">{formatPrice(finalPrice)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                          <span>Doorstep Inspection Fee:</span>
                          <span>FREE (₹0)</span>
                        </div>
                        <div className="flex justify-between items-center text-sm font-bold text-slate-900 dark:text-white border-t border-slate-200 dark:border-zinc-800 pt-2.5 mt-2.5">
                          <span>Instant Doorside Payout:</span>
                          <span className="text-xl text-cobalt font-extrabold font-outfit">{formatPrice(finalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Inline form error banner */}
              {formError && (
                <div className="flex items-start gap-2.5 p-3 bg-red-500/10 border border-red-500/20 rounded-sm text-xs text-red-400 font-mono mb-4 animate-fadeIn">
                  <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{formError}</span>
                  <button onClick={() => setFormError('')} className="ml-auto flex-shrink-0 text-red-400 hover:text-red-500" aria-label="Dismiss">✕</button>
                </div>
              )}

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
                    disabled={
                      schedulerStep === 1 ? !isStep1Valid : !isStep2Valid
                    }
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
                    disabled={isSubmitting}
                    className={`flex-1 bg-cobalt hover:bg-cobalt-hover text-white py-3 rounded-sm font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                      isSubmitting
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
                <div className="pb-3 border-b border-ice-border mb-4 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] font-mono tracking-[0.2em] text-slate-500 uppercase block mb-1">Audit Ledger</span>
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

                <div className="space-y-3 text-xs font-sans text-left">
                  {/* Detailed breakdown list */}
                  <div className="flex justify-between items-center py-1 text-slate-700 dark:text-zinc-300 font-medium">
                    <span>Base Value ({selectedVariant.storageGb}GB)</span>
                    <span className="text-cobalt font-bold">+{formatPrice(selectedVariant.basePrice)}</span>
                  </div>

                  {/* Deductions breakdown */}
                  {selectedDefects.length > 0 ? (
                    <div className="py-2 border-y border-slate-200 dark:border-zinc-800 space-y-1.5">
                      <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-zinc-400 uppercase font-bold tracking-wider mb-1">
                        <span>Deductions Applied</span>
                        <button
                          type="button"
                          onClick={onBack}
                          className="text-cobalt hover:underline font-semibold normal-case"
                        >
                          Edit Defects
                        </button>
                      </div>
                      {selectedDefects.map((defect, idx) => {
                        const base = selectedVariant.basePrice;
                        const deduction = defect.deductionPercentage > 0 
                          ? base * defect.deductionPercentage 
                          : defect.deductionFixed;
                        return (
                          <div key={defect.id} className="flex justify-between items-start text-slate-800 dark:text-zinc-200 font-medium">
                            <span className="leading-tight">{(idx + 1).toString().padStart(2, '0')}. {getEngineeringLabel(defect.description)}</span>
                            <span className="text-red-600 dark:text-red-400 font-semibold flex-shrink-0">-[{formatPrice(deduction)}]</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-3 border-y border-slate-200 dark:border-zinc-800 border-dashed text-center text-xs text-emerald-700 dark:text-emerald-400 font-semibold italic">
                      [No defects declared. Maximum value applies.]
                    </div>
                  )}

                  <div className="flex justify-between items-center bg-slate-100 dark:bg-zinc-900 p-3.5 rounded-lg border border-slate-200 dark:border-zinc-800 mt-4 shadow-xs">
                    <div>
                      <span className="text-[9px] text-slate-600 dark:text-zinc-400 uppercase font-bold tracking-wider block">Total Estimated Payout</span>
                      <span className="text-xl font-extrabold text-cobalt tracking-tight font-outfit">{formatPrice(totalPayoutVal)}</span>
                    </div>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-md border border-emerald-300 dark:border-emerald-500/30 font-extrabold uppercase tracking-wider">Locked</span>
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

            {/* Receipt Details with declared defects summary & Side-by-side Phone Preview */}
            <div className="w-full my-6">
              <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-lg p-5 text-xs space-y-3 font-sans text-left shadow-sm">
                <div className="flex justify-between items-center font-bold border-b border-slate-200 dark:border-zinc-800 pb-2.5 mb-2.5 text-slate-900 dark:text-white text-sm">
                  <span>Confirmation ID</span>
                  <span className="text-cobalt font-extrabold font-mono text-base">#{confirmationId}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">Device Model</span>
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">{selectedModel.name} ({selectedVariant.storageGb}GB)</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">Client Name</span>
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">{name}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">Pickup Address</span>
                  <span className="text-slate-900 dark:text-slate-100 font-semibold truncate max-w-[240px]">{address}</span>
                </div>
                
                {/* Date time booking overview */}
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-zinc-800 pt-2.5">
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">Scheduled Date</span>
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">{selectedDate}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">Time Slot Window</span>
                  <span className="text-slate-900 dark:text-slate-100 font-semibold">{selectedTimeSlot}</span>
                </div>

                {/* Declared defects summary on ticket receipt */}
                <div className="border-t border-slate-200 dark:border-zinc-800 pt-2.5 space-y-1.5">
                  <span className="text-slate-700 dark:text-zinc-300 font-semibold block">Declared Defects Summary:</span>
                  {selectedDefects.length > 0 ? (
                    <div className="space-y-1 pl-2 text-xs text-slate-800 dark:text-zinc-200 font-medium">
                      {selectedDefects.map(d => (
                        <div key={d.id} className="flex justify-between">
                          <span>• {getEngineeringLabel(d.description)}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="pl-2 text-xs text-emerald-700 dark:text-emerald-400 font-semibold italic">• No defects declared (Flawless Device)</span>
                  )}
                </div>

                <div className="flex justify-between items-center border-t border-slate-200 dark:border-zinc-800 pt-2.5">
                  <span className="text-slate-600 dark:text-zinc-400 font-medium">Payout Destination</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-bold truncate max-w-[240px]">
                    Instant Doorside Payout (UPI / Bank)
                  </span>
                </div>
                
                <div className="flex justify-between items-center border-t border-slate-200 dark:border-zinc-800 pt-3 mt-3 text-slate-900 dark:text-white">
                  <span className="font-bold text-sm">Final Locked Payout</span>
                  <span className="text-cobalt font-extrabold text-xl font-outfit">{formatPrice(totalPayoutVal)}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 rounded-lg mb-6 text-xs text-slate-800 dark:text-emerald-200 text-left shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="font-medium">Our pickup agent will call you before arrival. Please keep your device unlocked and charged.</span>
            </div>

            <div className="w-full">
              <button
                type="button"
                onClick={onSuccess}
                className="w-full bg-cobalt hover:bg-cobalt-hover text-white py-3.5 rounded-sm font-bold transition-all text-sm shadow-md cursor-pointer"
                style={{ minHeight: '48px' }}
              >
                Return to Catalog Homepage
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
