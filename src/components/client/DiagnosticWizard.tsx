import React, { useState, useMemo, useRef } from 'react';
import { Model, Variant, getDefectRulesForCategory, DefectRule, isAppleDevice, isSmartwatchDevice, isTabletDevice, getDeviceImage } from '../../data/mockDatabase';
import { calculateValuation } from '../../utils/valuation';
import type { AgeFactorKey } from '../../data/pricingRulesConfig';
import { 
  ArrowLeft, Check, ChevronRight, Activity, Sparkles, 
  Smartphone, Box, Zap, ShieldCheck, Printer, Receipt,
  X, Lock, Eye, EyeOff, AlertCircle, Mail, User,
  Phone, MessageSquare, ExternalLink, Headphones, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIllustration } from './Illustrations';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import emailjs from '@emailjs/browser';
import { checkEmail, customerLogin, customerSignup, verifyOtp, sendQuoteAlertApi, sendPriceMatchAlertApi, ApiUser } from '../../utils/api';

const getEngineeringLabel = (description: string) => {
  const mapping: { [key: string]: string } = {
    'Cracked Screen / Back Glass':       'Screen Restoration Fee',
    'Front Glass Scratches / Bubbles':   'Glass Micro-Polishing Fee',
    'Screen Burn-in / Lines':            'Display Panel Replacement Fee',
    'Touch / Swipe Unresponsive':        'Digitizer / Touch Layer Repair',
    'True Tone Not Working':             'Original Display Certification Fee',
    'Display Calibration / Tint Issue':  'Display Panel Recalibration Levy',
    'Dented or Bent Frame':              'Chassis Structure Re-alignment',
    'Scuffed Frame / Normal Wear':       'Frame Bead-Blasting & Refinishing',
    'Air Pass / Waterproof Seal Fail':   'IP Seal & Gasket Replacement',
    'Side Buttons Faulty':               'Button Flex Cable Repair Fee',
    'Screws Stripped / Missing':         'Pentalobe Hardware Replacement',
    'Bottom Screws Stripped / Missing':  'Chassis Hardware Replacement',
    'Camera Faulty / Lens Blur':         'Optical Sensor Recalibration',
    'Battery Health < 80%':              'Battery Module Replacement',
    'Non-Genuine Battery Warning':       'OEM Battery Compliance Levy',
    'Non-OEM / Battery Warning Alert':   'Battery Controller Compliance Levy',
    'Network, Calling & SIM Issues':     'Cellular Modem / SIM Tray Repair',
    'Wi-Fi & Bluetooth Issues':          'Antenna & Wireless Module Repair',
    '3uTools Serial Mismatch':           'Counterfeit Parts Detection Levy',
    'PC Diagnostic Serial Mismatch':     'Hardware Serial Mismatch Levy',
    'Speakers / Microphone Faulty':      'Audio Assembly Replacement Fee',
    'Auto-Restart / Unstable Device':    'PMIC / Board-Level Stabilisation',
    'Missing Original Box':              'OEM Retail Box De-allocation',
    'Missing Original Charger / Cable':  'OEM Power Adapter De-allocation',
    'Missing Bill / Customer Photo ID':  'Legal Compliance Documentation Fee',
    'Device Does Not Turn On':           'Board-Level Hardware Failure',
    'iCloud / Apple ID Locked':                         'Activation Lock — Zero Resale Value',
    'Google Account / Factory Reset Protection Locked': 'Factory Reset Protection Lock — Zero Resale Value',
    'Biometrics Faulty (Face ID)':                      'Biometric Sensor Security Fee',
    'Biometrics Faulty (Fingerprint / Face Unlock)':    'Biometric Sensor Security Fee',
    
    // Smartwatch specific engineering fee labels
    'Cracked Watch Glass / Sapphire Dial':               'Watch Glass / Sapphire Dial Restoration',
    'Cracked Super AMOLED / Gorilla Glass':              'Super AMOLED Glass Panel Restoration',
    'Glass Lens & Bezel Micro-Scratches':                'Watch Glass & Bezel Micro-Polishing',
    'Always-On Display Burn-in / Lines':                 'Watch Display Module Replacement',
    'Touchscreen / Touch Bezel Unresponsive':            'Digitizer / Rotary Touch Repair',
    'Titanium / Aluminum Casing Dented':                 'Titanium Casing Structural Re-alignment',
    'Armor Aluminum / Stainless Casing Dented':          'Armor Aluminum Casing Refinishing',
    'Digital Crown / Action Button Faulty':              'Digital Crown & Action Flex Repair',
    'Rotating Bezel / Home Button Faulty':               'Rotary Bezel Mechanism Repair',
    'Water Resistance Seal Fail (50m/100m)':             '50m/100m Swim Gasket & Seal Replacement',
    'Original Watch Band / Strap Missing or Heavy Damage': 'OEM Watch Band De-allocation Fee',
    'PPG Heart Rate & SpO2 Sensor Faulty':               'PPG Health Sensor Array Recalibration',
    'ECG App / Electrical Heart Sensor Fail':            'ECG Electrode Controller Compliance Levy',
    'ECG / BIA Body Composition Sensor Fail':            'BIA Body Composition Sensor Recalibration',
    'Fall & Crash Detection Sensors Faulty':             'Motion Gyroscope & Fall Sensor Repair',
    'Speaker, Mic or Emergency Siren Faulty':            'Audio & Emergency Siren Assembly Fee',
    'Speaker / Microphone Call Audio Faulty':            'Speaker & Microphone Assembly Fee',
    'Wireless Magnetic Receiver Charge Faulty':          'Inductive Charging Receiver Coil Repair',
    'Cellular / LTE eSIM Functionality Faulty':          'eSIM Modem Transceiver Recalibration',
    'Wi-Fi, Bluetooth & Dual-Frequency GPS Fail':        'Wireless Antenna & GPS Array Repair',
    'Missing Original Magnetic Fast Charging Puck':      'OEM Magnetic Fast Charger De-allocation',
    'Missing Original Retail Watch Box':                 'OEM Watch Retail Packaging De-allocation',
    'Smartwatch Does Not Turn On':                       'Watch Logic Board Hardware Failure',
    'iCloud / Apple Watch Activation Locked':            'Activation Lock — Zero Resale Value',
    'Samsung Account / Google Knox Lock Active':         'Knox Lock — Zero Resale Value'
  };
  return mapping[description] || description;
};

// Wizard flags are session-only — not persisted to localStorage

interface DiagnosticWizardProps {
  model: Model;
  variant: Variant;
  onBack: () => void;
  onComplete: (finalPrice: number, selectedDefects: DefectRule[]) => void;
  selectedDefects: DefectRule[];
  setSelectedDefects: React.Dispatch<React.SetStateAction<DefectRule[]>>;
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  currentUser?: ApiUser | null;
  onLoginSuccess?: (user: ApiUser) => void;
  onNavigate?: (path: string) => void;
}

export const DiagnosticWizard: React.FC<DiagnosticWizardProps> = ({
  model,
  variant,
  onBack,
  onComplete,
  selectedDefects,
  setSelectedDefects,
  step,
  setStep,
  currentUser,
  onLoginSuccess,
  onNavigate,
}) => {
  const isApple = useMemo(() => isAppleDevice(model.brandId, model.name), [model]);
  const isWatch = useMemo(() => isSmartwatchDevice(model.brandId, model.name, model.id), [model]);
  const isTablet = useMemo(() => isTabletDevice(model.brandId, model.name, model.id), [model]);
  const deviceType: 'phone' | 'watch' | 'tablet' = isWatch ? 'watch' : isTablet ? 'tablet' : 'phone';

  // Obtain rules based on model category, brand and model ID
  const rules = useMemo(() => getDefectRulesForCategory(model.category, model.brandId, model.name, model.id), [model]);

  // Only ask for warranty if model.supportsWarrantyQuestion is true (or fallback for recent devices >= 2023)
  const isEligibleForWarranty = useMemo(() => {
    if (model.supportsWarrantyQuestion !== undefined) {
      return model.supportsWarrantyQuestion;
    }
    const nm = model.name.toLowerCase();
    if (model.brandId === 'brand-apple' || nm.includes('iphone') || isApple) {
      if (
        nm.includes('iphone 14') ||
        nm.includes('iphone 13') ||
        nm.includes('iphone 12') ||
        nm.includes('iphone 11') ||
        nm.includes('iphone x') ||
        nm.includes('iphone xs') ||
        nm.includes('iphone xr') ||
        nm.includes('iphone 8') ||
        nm.includes('iphone 7') ||
        nm.includes('iphone 6') ||
        nm.includes('iphone se')
      ) {
        return false;
      }
      return (
        nm.includes('iphone 15') ||
        nm.includes('iphone 16') ||
        nm.includes('iphone 17') ||
        nm.includes('iphone 18') ||
        (model.releaseYear ?? 2024) >= 2023
      );
    }
    return (model.releaseYear ?? 2024) >= 2023;
  }, [model, isApple]);

  const [deviceAge, setDeviceAge] = useState<AgeFactorKey>('under_3m');
  const [hasWarranty, setHasWarranty] = useState<boolean | null>(null);
  const [_warrantyStatus, setWarrantyStatus] = useState<'active' | 'expiring_soon' | 'expired' | 'unverified'>(
    model.releaseYear >= 2025 ? 'active' : 'expired'
  );

  const stepsList = useMemo(() => [
    { title: isApple ? 'Boot & iCloud' : 'Boot & Lock', icon: ShieldCheck, desc: 'Power on & account lock gate' },
    { title: 'Display Panel', icon: Smartphone, desc: 'Touch, screen glass & burn-in' },
    { title: 'Body & Frame', icon: ShieldCheck, desc: 'Chassis, buttons, screws & seal' },
    { title: 'Hardware', icon: Activity, desc: 'Cameras, biometrics & audio' },
    { title: 'Connectivity', icon: Zap, desc: 'Battery, cellular, Wi-Fi & serial' },
    { title: isEligibleForWarranty ? 'Docs & Warranty' : 'Packaging & Box', icon: Box, desc: isEligibleForWarranty ? 'Accessories, age & warranty' : 'Original box, accessories & invoice' },
    { title: 'Review & Valuation', icon: Receipt, desc: 'Diagnostic review & breakdown' }
  ], [isApple, isEligibleForWarranty]);

  // Confirmation state — session only, never persisted to localStorage
  const [screenConfirmed, setScreenConfirmed] = useState(false);
  const [bodyConfirmed, setBodyConfirmed] = useState(false);
  const [funcConfirmed, setFuncConfirmed] = useState(false);
  const [connectConfirmed, setConnectConfirmed] = useState(false);
  const [accConfirmed, setAccConfirmed] = useState(false);
  const [icloudChecked, setIcloudChecked] = useState<'clear' | 'locked' | null>(null);

  React.useEffect(() => {
    if (step > 0 && icloudChecked === null) {
      const hasIcloudLock = selectedDefects.some(d => d.id === 'defect-critical-icloud');
      setIcloudChecked(hasIcloudLock ? 'locked' : 'clear');
    }
  }, [step, icloudChecked, selectedDefects]);

  // Critical-failure confirmation modal
  const [criticalModal, setCriticalModal] = useState<{
    visible: boolean;
    type: 'icloud' | 'power' | null;
  }>({ visible: false, type: null });
  const criticalModalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(criticalModalRef, criticalModal.visible);

  const showCriticalModal = (type: 'icloud' | 'power') => {
    setCriticalModal({ visible: true, type });
  };

  const dismissCriticalModal = () => {
    setCriticalModal({ visible: false, type: null });
  };

  const confirmCriticalModal = () => {
    const { type } = criticalModal;
    setCriticalModal({ visible: false, type: null });
    if (type === 'icloud') {
      setIcloudChecked('locked');
    } else if (type === 'power') {
      handlePowerCheck(false);
    }
  };

  // Validation check for current step
  const isStepValidated = useMemo(() => {
    if (step === 0) return icloudChecked !== null;
    if (step === 1) return screenConfirmed || selectedDefects.some(d => d.category === 'screen');
    if (step === 2) return bodyConfirmed || selectedDefects.some(d => d.category === 'body');
    if (step === 3) {
      const ids = rules.filter(r => ['camera', 'functionality'].includes(r.category)).map(r => r.id);
      return funcConfirmed || selectedDefects.some(d => ids.includes(d.id));
    }
    if (step === 4) {
      const ids = rules.filter(r => r.category === 'connectivity').map(r => r.id);
      return connectConfirmed || selectedDefects.some(d => ids.includes(d.id));
    }
    if (step === 5) {
      const ids = rules.filter(r => r.category === 'accessories' && !r.isCriticalFailure).map(r => r.id);
      return accConfirmed || selectedDefects.some(d => ids.includes(d.id));
    }
    return true;
  }, [step, icloudChecked, screenConfirmed, bodyConfirmed, funcConfirmed, connectConfirmed, accConfirmed, selectedDefects, rules]);

  const [warrantyAge, setWarrantyAge] = useState<'under_3m' | '3_to_6m' | '6_to_11m' | 'out_of_warranty'>('out_of_warranty');
  const simType = 'dual_sim';
  const [dualEsim, setDualEsim] = useState<boolean | null>(null);

  // Calculate live valuation via Stage 1 Rephonix Pricing Engine
  const valuation = useMemo(() => {
    return calculateValuation(variant, selectedDefects, {
      modelId: model.id,
      brandId: model.brandId,
      modelName: model.name,
      category: model.category,
      simType,
      warrantyAge,
      deviceAge,
      dualEsim: dualEsim === true
    });
  }, [variant, selectedDefects, model, simType, warrantyAge, deviceAge, dualEsim]);

  // Stable receipt reference code — generated once per wizard session
  const receiptRef = useMemo(() => Math.random().toString(36).substr(2, 6).toUpperCase(), []);

  // Toggle selection helper
  const handleToggleDefect = (defect: DefectRule, mutuallyExclusiveId?: string) => {
    setSelectedDefects(prev => {
      let next = [...prev];

      // Remove mutually exclusive option if present
      if (mutuallyExclusiveId) {
        next = next.filter(d => d.id !== mutuallyExclusiveId);
      }

      const exists = next.some(d => d.id === defect.id);
      if (exists) {
        return next.filter(d => d.id !== defect.id);
      } else {
        return [...next, defect];
      }
    });
  };

  const handlePowerCheck = (turnsOn: boolean) => {
    const powerDefect = rules.find(r => r.id === 'defect-critical-power')!;
    const icloudDefect = rules.find(r => r.id === 'defect-critical-icloud');
    if (!turnsOn) {
      const defects: DefectRule[] = [powerDefect];
      if (icloudChecked === 'locked' && icloudDefect) defects.push(icloudDefect);
      setSelectedDefects(defects);
      setStep(7); // Jump to zero value receipt
    } else {
      // Powers on — handle icloud status
      let next = selectedDefects.filter(d => d.id !== 'defect-critical-power');
      if (icloudChecked === 'locked' && icloudDefect) {
        next = [...next.filter(d => d.id !== 'defect-critical-icloud'), icloudDefect];
        setSelectedDefects(next);
        setStep(7); // iCloud locked = zero value, skip to receipt
      } else {
        setSelectedDefects(next.filter(d => d.id !== 'defect-critical-icloud'));
        setStep(1);
      }
    }
  };

  // Phone Check Lock Modal states
  const [isPriceLocked, setIsPriceLocked] = useState(!currentUser);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [expectedPrice, setExpectedPrice] = useState('');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [contactNote, setContactNote] = useState('');
  const [isSubmittingBestPrice, setIsSubmittingBestPrice] = useState(false);
  const [bestPriceSubmitted, setBestPriceSubmitted] = useState(false);
  const [modalStage, setModalStage] = useState<'email' | 'password' | 'signup' | 'otp'>('email');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  React.useEffect(() => {
    if (currentUser) {
      setIsPriceLocked(false);
    }
  }, [currentUser]);

  React.useEffect(() => {
    if (step === 6 && !currentUser) {
      setLockModalOpen(true);
    }
  }, [step, currentUser]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setModalError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setModalError('Please enter a valid email address.');
      return;
    }
    if (!termsAccepted) {
      setModalError('You must agree to the Terms and Conditions.');
      return;
    }
    setModalError('');
    setModalLoading(true);

    try {
      const res = await checkEmail(cleanEmail);
      if (res.exists) {
        setModalStage('password');
      } else {
        setModalStage('signup');
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to check email address.');
    } finally {
      setModalLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput) {
      setModalError('Please enter your password.');
      return;
    }
    setModalError('');
    setModalLoading(true);

    try {
      const res = await customerLogin(emailInput.trim().toLowerCase(), passwordInput);
      if (res.user) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
        setIsPriceLocked(false);
        setLockModalOpen(false);
      }
    } catch (err: any) {
      setModalError('Invalid email address or password.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameInput.trim() || !emailInput.trim() || !passwordInput) {
      setModalError('Please fill in all fields.');
      return;
    }
    if (passwordInput.length < 6) {
      setModalError('Password must be at least 6 characters.');
      return;
    }
    setModalError('');
    setModalLoading(true);

    try {
      const res = await customerSignup(nameInput.trim(), emailInput.trim(), phoneInput, passwordInput);
      if (res.status === 'otp_sent') {
        if (res.otp) {
          const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
          const templateId = import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID;
          const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

          if (!serviceId || !templateId || !publicKey) {
            throw new Error('EmailJS environment variables are not configured in the browser.');
          }

          const templateParams = {
            email: emailInput.trim(),
            passcode: res.otp,
            time: '10 minutes',
          };

          try {
            await emailjs.send(serviceId, templateId, templateParams, publicKey);
          } catch (mailErr: any) {
            console.error('EmailJS signup send failed:', mailErr);
            throw new Error('Unable to send verification code. Please try again.');
          }
        }

        setModalStage('otp');
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to initiate signup.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleOtpVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput.length !== 6) {
      setModalError('Please enter the 6-digit verification code.');
      return;
    }
    setModalError('');
    setModalLoading(true);

    try {
      const res = await verifyOtp({
        name: nameInput.trim(),
        email: emailInput.trim(),
        phone: phoneInput,
        password: passwordInput,
        otp: otpInput,
      });
      if (res.user) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
        setIsPriceLocked(false);
        setLockModalOpen(false);
      }
    } catch (err: any) {
      setModalError(err.message || 'OTP verification failed.');
    } finally {
      setModalLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleNextStep = () => {
    if (!isStepValidated) return;
    if (step < 6) {
      setStep(prev => prev + 1);
    } else {
      setStep(7); // Final verified receipt
    }
  };

  const handlePrevStep = () => {
    if (step === 7) {
      setStep(6);
    } else if (step === 6 && selectedDefects.some(d => d.isCriticalFailure)) {
      setStep(0);
    } else if (step > 0) {
      setStep(prev => prev - 1);
    } else {
      onBack();
    }
  };

  // Keyboard navigation helper
  const handleKeyDown = (e: React.KeyboardEvent, callback: () => void) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      callback();
    }
  };

  return (
    <div className="w-full">
      {/* Critical Failure Confirmation Modal */}
      <AnimatePresence>
        {criticalModal.visible && (
          <motion.div
            key="critical-modal-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              key="critical-modal-card"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="critical-modal-title"
              ref={criticalModalRef}
              className="bg-canvas-pure border border-red-500/30 rounded-sm p-6 max-w-sm w-full shadow-2xl text-center"
            >
              <div className="w-14 h-14 mx-auto mb-4 rounded-sm bg-red-500/10 border border-red-500/20 flex items-center justify-center" aria-hidden="true">
                <span className="text-2xl">&#128274;</span>
              </div>
              <h3 id="critical-modal-title" className="text-lg font-semibold text-ink-navy mb-2">
                {criticalModal.type === 'icloud'
                  ? (isApple ? 'iCloud Lock Detected' : 'Account Lock / Factory Reset Protection Detected')
                  : 'Device Dead — Cannot Power On'}
              </h3>
              <p className="text-xs text-ink-muted font-light mb-5 leading-relaxed">
                {criticalModal.type === 'icloud'
                  ? (isApple
                      ? 'Devices with Find My / iCloud lock active have zero resale value and cannot be traded in. Are you sure you want to proceed?'
                      : 'Devices with active Google Factory Reset Protection or Brand Account lock have zero resale value and cannot be traded in. Are you sure you want to proceed?')
                  : 'Devices that cannot power on, are boot-looped, or are liquid-damaged have zero resale value. Selecting this will end the diagnostic and show a \u20B90 payout.'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={dismissCriticalModal}
                  className="py-2.5 rounded-sm border border-ice-border text-ink-slate hover:bg-ice-gray text-sm font-semibold transition-all"
                >
                  Go Back
                </button>
                <button
                  onClick={confirmCriticalModal}
                  className="py-2.5 rounded-sm bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-all"
                >
                  Confirm — Zero Value
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Evaluation Wizard Header */}
      <div className="bg-canvas-pure border border-ice-border rounded-xl p-4 sm:p-5 mb-6 shadow-sm space-y-5 text-left">
        {/* Top Header Row: Device Info + Live Payout HUD */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-ice-border/60">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-slate-50 dark:bg-zinc-800/80 p-1.5 border border-ice-border flex items-center justify-center flex-shrink-0 shadow-xs">
              <img 
                src={getDeviceImage(model.id, model.brandId, variant?.color, model.imageUrl)} 
                alt={model.name} 
                className="w-full h-full object-contain mix-blend-multiply dark:mix-blend-normal" 
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono tracking-[0.15em] text-ink-muted uppercase font-semibold">Evaluation Wizard</span>
                <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  Up to {formatPrice(variant.basePrice)}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <h2 className="font-bold text-ink-navy text-xl sm:text-2xl tracking-tight truncate">{model.name}</h2>
                <span className="text-[10px] font-mono font-bold tracking-wider bg-slate-100 text-slate-700 dark:bg-zinc-800 dark:text-zinc-300 px-2 py-0.5 rounded-md border border-slate-200 dark:border-zinc-700 flex-shrink-0">
                  {variant.storageGb >= 1024 ? '1TB' : `${variant.storageGb}GB`}
                </span>
              </div>
            </div>
          </div>

          {/* Real-Time Live Payout HUD Badge */}
          {step < 6 && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/25 dark:bg-emerald-950/40 dark:border-emerald-800/50 px-4 py-2.5 rounded-xl shadow-xs flex-shrink-0">
              <div>
                <span className="text-[9px] font-mono tracking-widest text-emerald-800 dark:text-emerald-300 uppercase block font-bold">LIVE ESTIMATED PAYOUT</span>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <span className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-outfit tracking-tight">
                    {valuation.isCritical ? '₹ 0 (Locked)' : formatPrice(valuation.finalPrice)}
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs">
                    {valuation.retentionPercentage}% Retained
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Row: Stepper Progress Indicator */}
        <div className="w-full">
          {/* Mobile Stepper Progress Bar */}
          <div className="flex sm:hidden items-center gap-3">
            <span className="text-[11px] text-ink-navy font-mono font-bold tracking-wider uppercase flex-shrink-0">
              Step {Math.min(step + 1, 7)}/7: {stepsList[Math.min(step, 6)]?.title}
            </span>
            <div className="flex-1 h-2.5 rounded-full bg-ice-gray overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cobalt via-indigo-600 to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(((step + 1) / 7) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Desktop 7-Step Horizontal Stepper with Connecting Bar */}
          <div className="hidden sm:flex justify-between relative w-full pt-1">
            {/* Connecting Track Line — Exactly centered vertically at 18px (half of 36px circle height + 4px pt-1) */}
            <div className="absolute top-[22px] -translate-y-1/2 left-6 right-6 h-1 bg-slate-200 dark:bg-zinc-800 z-0 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-cobalt via-emerald-500 to-emerald-600 transition-all duration-500 rounded-full"
                style={{ width: `${(Math.min(step, 6) / 6) * 100}%` }}
              />
            </div>

            {stepsList.map((_s, idx) => {
              const isCompleted = step > idx;
              const isActive = step === idx;

              const stepLabels = [
                'Boot',
                'Display',
                'Body',
                'Hardware',
                'Connectivity',
                isEligibleForWarranty ? 'Docs & Age' : 'Packaging',
                'Review'
              ];

              return (
                <div key={idx} className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={() => isCompleted && setStep(idx)}>
                  <div 
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/20' 
                        : isActive 
                        ? 'bg-cobalt text-white ring-2 ring-cobalt/30 font-extrabold shadow-md scale-105' 
                        : 'bg-white dark:bg-zinc-900 border border-slate-300 dark:border-zinc-700 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-semibold mt-1.5 transition-colors ${
                    isActive ? 'text-cobalt font-bold' : isCompleted ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                  }`}>
                    {stepLabels[idx]}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full max-w-4xl mx-auto">
        {/* Step Content Card */}
        <motion.div 
          layout 
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="bg-canvas-pure rounded-xl border border-ice-border p-5 sm:p-7 min-h-[380px] sm:min-h-[440px] flex flex-col justify-between overflow-hidden shadow-xl"
        >
          <AnimatePresence mode="wait">
            {/* STEP 0: Boot & iCloud Check */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6 text-left">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block">Step 1 of 6 // Critical Gates</span>
                  </div>
                  <h3 className="text-3xl font-light text-ink-navy tracking-tight">
                    {isApple ? 'Boot & iCloud Status' : 'Boot & Account Lock (Factory Reset Protection)'}
                  </h3>
                  <p className="text-xs text-ink-muted mt-2 font-light">
                    {isApple
                      ? 'Check Apple ID status first — a locked iCloud renders the device unsellable regardless of condition.'
                      : 'Check Google / Account lock status first — an active Factory Reset Protection or account lock renders the device unsellable regardless of condition.'}
                  </p>
                </div>

                {/* Account check — must answer first */}
                <div className="mb-5 text-left">
                  <span className="text-[9px] font-mono tracking-[0.15em] text-amber-400 uppercase block mb-2">
                    {isApple ? '① Check First: Settings → [Your Name] → iCloud' : '① Check First: Settings → Accounts → Google / Brand Account'}
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setIcloudChecked('clear')}
                      onKeyDown={e => handleKeyDown(e, () => setIcloudChecked('clear'))}
                      className={`p-4 rounded-sm border cursor-pointer transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                        icloudChecked === 'clear'
                          ? 'border-emerald-500 bg-emerald-500/10'
                          : 'border-ice-border bg-canvas-white hover:border-emerald-500/50'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span className="font-semibold text-sm text-ink-navy">
                          {isApple ? 'Apple ID Signed Out' : 'Account / Google Signed Out'}
                        </span>
                        {icloudChecked === 'clear' && <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" />}
                      </div>
                      <p className="text-xs text-ink-muted font-light">
                        {isApple
                          ? 'Find My is OFF. Device can be erased and resold.'
                          : 'Google Factory Reset Protection & Account locks are OFF. Device can be reset and resold.'}
                      </p>
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => showCriticalModal('icloud')}
                      onKeyDown={e => handleKeyDown(e, () => showCriticalModal('icloud'))}
                      className={`p-4 rounded-sm border cursor-pointer transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        icloudChecked === 'locked'
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-red-500/30 bg-red-500/5 hover:border-red-500/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-red-400 font-bold text-sm">&#128274;</span>
                        <span className="font-semibold text-sm text-red-400">
                          {isApple ? 'iCloud LOCKED' : 'Account / Factory Reset Protection LOCKED'}
                        </span>
                        {icloudChecked === 'locked' && <Check className="w-3.5 h-3.5 text-red-400 ml-auto" />}
                      </div>
                      <p className="text-xs text-ink-muted font-light">
                        {isApple
                          ? 'Find My is ON. Apple ID cannot be removed. Zero resale value.'
                          : 'Google Factory Reset Protection or Brand Account lock is active. Cannot be removed. Zero resale value.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Power check — enabled only after icloud status selected */}
                <div className={`transition-opacity duration-300 ${icloudChecked ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                  <span className="text-[9px] font-mono tracking-[0.15em] text-zinc-500 uppercase block mb-2">② Then: Power Check</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      onClick={() => handlePowerCheck(true)}
                      disabled={!icloudChecked}
                      className="p-5 rounded-sm border border-ice-border hover:border-emerald-500/50 bg-canvas-white hover:bg-emerald-500/5 text-left transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt disabled:cursor-not-allowed"
                      style={{ minHeight: '100px' }}
                    >
                      <div className="w-12 h-12 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform overflow-hidden">
                        {getIllustration('power-on', deviceType)}
                      </div>
                      <h4 className="font-semibold text-sm text-ink-navy">Powers On</h4>
                      <p className="text-xs text-ink-muted mt-0.5 font-light">Boots to lock screen and functions normally.</p>
                    </button>
                    <button
                      onClick={() => showCriticalModal('power')}
                      disabled={!icloudChecked}
                      className="p-5 rounded-sm border border-red-500/30 hover:border-red-500/60 bg-red-500/5 hover:bg-red-500/10 text-left transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed"
                      style={{ minHeight: '100px' }}
                    >
                      <div className="w-12 h-12 rounded-sm bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform overflow-hidden">
                        {getIllustration('defect-critical-power', deviceType)}
                      </div>
                      <h4 className="font-semibold text-sm text-red-400">Dead / Fails to Boot</h4>
                      <p className="text-xs text-ink-muted mt-0.5 font-light">Does not turn on, water damaged, or stuck on boot loop.</p>
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 1: Screen Condition */}
            {step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6 text-left">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Step 2 of 6 // Front & Back Glass</span>
                  <h3 className="text-3xl font-light text-ink-navy tracking-tight">Screen & Display Panel</h3>
                  <p className="text-xs text-ink-muted mt-2 font-light">Examine the front screen glass and the back panel glass carefully.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 text-left">
                  {/* Flawless Option */}
                  {(() => {
                    const isAnyScreenSelected = selectedDefects.some(d => d.category === 'screen');
                    const isSelected = screenConfirmed && !isAnyScreenSelected;
                    return (
                      <div
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          if (isSelected) {
                            setScreenConfirmed(false);
                          } else {
                            setSelectedDefects(prev => prev.filter(d => d.category !== 'screen'));
                            setScreenConfirmed(true);
                          }
                        })}
                        onClick={() => {
                          if (isSelected) {
                            setScreenConfirmed(false);
                          } else {
                            setSelectedDefects(prev => prev.filter(d => d.category !== 'screen'));
                            setScreenConfirmed(true);
                          }
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : isAnyScreenSelected
                            ? 'border-ice-border bg-canvas-white opacity-40 hover:opacity-70'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/25 flex items-center justify-center overflow-hidden shadow-xs">
                          {getIllustration('screen-flawless', deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-ink-navy">Flawless Display</h4>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">No scratches, micro-abrasions, cracks, or screen bleeding.</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Screen Defect Options */}
                  {(() => {
                    const isAnyScreenSelected = selectedDefects.some(d => d.category === 'screen');
                    const isFlawlessSelected = screenConfirmed && !isAnyScreenSelected;
                    return rules.filter(r => r.category === 'screen').map(defect => {
                      const isSelected = selectedDefects.some(d => d.id === defect.id);
                      return (
                      <div
                        key={defect.id}
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          handleToggleDefect(
                            defect, 
                            defect.id === 'defect-screen-cracked' 
                              ? 'defect-screen-scratches' 
                              : defect.id === 'defect-screen-scratches' 
                              ? 'defect-screen-cracked' 
                              : undefined
                          );
                          setScreenConfirmed(false);
                        })}
                        onClick={() => {
                          handleToggleDefect(
                            defect, 
                            defect.id === 'defect-screen-cracked' 
                              ? 'defect-screen-scratches' 
                              : defect.id === 'defect-screen-scratches' 
                              ? 'defect-screen-cracked' 
                              : undefined
                          );
                          setScreenConfirmed(false);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : isFlawlessSelected
                            ? 'border-ice-border bg-canvas-white opacity-40 hover:opacity-70'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-rose-500/15 to-amber-500/10 border border-rose-500/20 flex items-center justify-center overflow-hidden shadow-xs">
                          {getIllustration(defect.id, deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                          </div>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">{defect.subText}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  });
                })()}
                </div>
              </motion.div>
            )}

            {/* STEP 2: Body Frame */}
            {step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6 text-left">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Step 3 of 6 // Outer Enclosure & Hardware</span>
                  <h3 className="text-3xl font-light text-ink-navy tracking-tight">Body, Buttons & Frame</h3>
                  <p className="text-xs text-ink-muted mt-2 font-light">Check the frame, side buttons, bottom screws, and waterproof seal integrity.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 text-left">
                  {/* Flawless Option */}
                  {(() => {
                    const isAnyBodySelected = selectedDefects.some(d => d.category === 'body');
                    const isSelected = bodyConfirmed && !isAnyBodySelected;
                    return (
                      <div
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          if (isSelected) {
                            setBodyConfirmed(false);
                          } else {
                            setSelectedDefects(prev => prev.filter(d => d.category !== 'body'));
                            setBodyConfirmed(true);
                          }
                        })}
                        onClick={() => {
                          if (isSelected) {
                            setBodyConfirmed(false);
                          } else {
                            setSelectedDefects(prev => prev.filter(d => d.category !== 'body'));
                            setBodyConfirmed(true);
                          }
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : isAnyBodySelected
                            ? 'border-ice-border bg-canvas-white opacity-40 hover:opacity-70'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/25 flex items-center justify-center overflow-hidden shadow-xs">
                          {getIllustration('body-flawless', deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-ink-navy">Flawless Frame</h4>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">No dents, bends, or paint scuffs. Device looks brand new.</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Body Rules */}
                  {(() => {
                    const isAnyBodySelected = selectedDefects.some(d => d.category === 'body');
                    const isFlawlessSelected = bodyConfirmed && !isAnyBodySelected;
                    return rules.filter(r => r.category === 'body').map(defect => {
                      const isSelected = selectedDefects.some(d => d.id === defect.id);
                      return (
                      <div
                        key={defect.id}
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          handleToggleDefect(
                            defect, 
                            defect.id === 'defect-body-dented' 
                              ? 'defect-body-scuffs' 
                              : defect.id === 'defect-body-scuffs' 
                              ? 'defect-body-dented' 
                              : undefined
                          );
                          setBodyConfirmed(false);
                        })}
                        onClick={() => {
                          handleToggleDefect(
                            defect, 
                            defect.id === 'defect-body-dented' 
                              ? 'defect-body-scuffs' 
                              : defect.id === 'defect-body-scuffs' 
                              ? 'defect-body-dented' 
                              : undefined
                          );
                          setBodyConfirmed(false);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : isFlawlessSelected
                            ? 'border-ice-border bg-canvas-white opacity-40 hover:opacity-70'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/20 flex items-center justify-center overflow-hidden shadow-xs">
                          {getIllustration(defect.id, deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                          </div>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">{defect.subText}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  });
                })()}
                </div>
              </motion.div>
            )}

            {/* STEP 3: Hardware Diagnostics */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6 text-left">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Step 4 of 6 // Hardware Diagnostics</span>
                  <h3 className="text-3xl font-light text-ink-navy tracking-tight">Camera & Hardware</h3>
                  <p className="text-xs text-ink-muted mt-2 font-light">Select any failing camera, biometric, audio, or system stability issues that apply.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 text-left">
                  {/* Affirmative option */}
                  {(() => {
                    const ids = rules.filter(r => ['camera', 'functionality'].includes(r.category)).map(r => r.id);
                    const isAnySelected = selectedDefects.some(d => ids.includes(d.id));
                    const isSelected = funcConfirmed && !isAnySelected;
                    return (
                      <div
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          if (isSelected) {
                            setFuncConfirmed(false);
                          } else {
                            setSelectedDefects(prev => prev.filter(d => !ids.includes(d.id)));
                            setFuncConfirmed(true);
                          }
                        })}
                        onClick={() => {
                          if (isSelected) {
                            setFuncConfirmed(false);
                          } else {
                            setSelectedDefects(prev => prev.filter(d => !ids.includes(d.id)));
                            setFuncConfirmed(true);
                          }
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : isAnySelected
                            ? 'border-ice-border bg-canvas-white opacity-40 hover:opacity-70'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/25 flex items-center justify-center overflow-hidden shadow-xs">
                          <ShieldCheck className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-ink-navy">Hardware Works Perfectly</h4>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">
                            Front/rear cameras, {isApple ? 'Face ID' : 'biometrics'}, speaker/mic, and system stability are flawless.
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Hardware / functionality rules */}
                  {(() => {
                    const ids = rules.filter(r => ['camera', 'functionality'].includes(r.category)).map(r => r.id);
                    const isAnySelected = selectedDefects.some(d => ids.includes(d.id));
                    const isAffirmativeSelected = funcConfirmed && !isAnySelected;
                    return rules.filter(r => ['camera', 'functionality'].includes(r.category)).map(defect => {
                      const isSelected = selectedDefects.some(d => d.id === defect.id);
                      return (
                      <div
                        key={defect.id}
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          handleToggleDefect(defect);
                          setFuncConfirmed(false);
                        })}
                        onClick={() => {
                          handleToggleDefect(defect);
                          setFuncConfirmed(false);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : isAffirmativeSelected
                            ? 'border-ice-border bg-canvas-white opacity-40 hover:opacity-70'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center overflow-hidden shadow-xs">
                          {getIllustration(defect.id, deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                          </div>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">{defect.subText}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  });
                })()}
                </div>
              </motion.div>
            )}

            {/* STEP 4: Connectivity & Verification */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6 text-left">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Step 5 of 6 // Wireless, Power & Authenticity</span>
                  <h3 className="text-3xl font-light text-ink-navy tracking-tight">Connectivity & Verification</h3>
                  <p className="text-xs text-ink-muted mt-2 font-light">Verify battery condition, cellular/Wi-Fi antennas, and motherboard serial mappings.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 text-left">
                  {/* Affirmative option */}
                  {(() => {
                    const ids = rules.filter(r => r.category === 'connectivity').map(r => r.id);
                    const isAnySelected = selectedDefects.some(d => ids.includes(d.id));
                    const isSelected = connectConfirmed && !isAnySelected;
                    return (
                      <div
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          if (isSelected) {
                            setConnectConfirmed(false);
                          } else {
                            setSelectedDefects(prev => prev.filter(d => !ids.includes(d.id)));
                            setConnectConfirmed(true);
                          }
                        })}
                        onClick={() => {
                          if (isSelected) {
                            setConnectConfirmed(false);
                          } else {
                            setSelectedDefects(prev => prev.filter(d => !ids.includes(d.id)));
                            setConnectConfirmed(true);
                          }
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : isAnySelected
                            ? 'border-ice-border bg-canvas-white opacity-40 hover:opacity-70'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/25 flex items-center justify-center stroke-emerald-600">
                          <ShieldCheck className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-ink-navy">Connectivity & Battery Healthy</h4>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">
                            Battery is original/above 80%, cellular/Wi-Fi antennas are strong, and {isApple ? '3uTools checks pass' : 'hardware diagnostic checks pass'}.
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Connectivity & verification rules */}
                  {(() => {
                    const ids = rules.filter(r => r.category === 'connectivity').map(r => r.id);
                    const isAnySelected = selectedDefects.some(d => ids.includes(d.id));
                    const isAffirmativeSelected = connectConfirmed && !isAnySelected;
                    return rules.filter(r => r.category === 'connectivity').map(defect => {
                      const isSelected = selectedDefects.some(d => d.id === defect.id);
                      return (
                      <div
                        key={defect.id}
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          handleToggleDefect(defect);
                          setConnectConfirmed(false);
                        })}
                        onClick={() => {
                          handleToggleDefect(defect);
                          setConnectConfirmed(false);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : isAffirmativeSelected
                            ? 'border-ice-border bg-canvas-white opacity-40 hover:opacity-70'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-violet-500/15 to-purple-500/10 border border-violet-500/20 flex items-center justify-center overflow-hidden shadow-xs">
                          {getIllustration(defect.id, deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                          </div>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">{defect.subText}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  });
                })()}
                </div>
              </motion.div>
            )}

            {/* STEP 5: Accessories & Documentation */}
            {step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6 text-left">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Step 6 of 6 // Packaging & Verification Docs</span>
                  <h3 className="text-3xl font-light text-ink-navy tracking-tight">Accessories & Documentation</h3>
                  <p className="text-xs text-ink-muted mt-2 font-light">Confirm if the original retail box, OEM charging accessories, and invoice are present.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 text-left">
                  {/* Affirmative option */}
                  {(() => {
                    const ids = rules.filter(r => r.category === 'accessories' && !r.isCriticalFailure).map(r => r.id);
                    const isAnySelected = selectedDefects.some(d => ids.includes(d.id));
                    const isSelected = accConfirmed && !isAnySelected;
                    return (
                      <div
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          if (isSelected) {
                            setAccConfirmed(false);
                          } else {
                            setSelectedDefects(prev => prev.filter(d => !ids.includes(d.id)));
                            setAccConfirmed(true);
                          }
                        })}
                        onClick={() => {
                          if (isSelected) {
                            setAccConfirmed(false);
                          } else {
                            setSelectedDefects(prev => prev.filter(d => !ids.includes(d.id)));
                            setAccConfirmed(true);
                          }
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : isAnySelected
                            ? 'border-ice-border bg-canvas-white opacity-40 hover:opacity-70'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/25 flex items-center justify-center stroke-emerald-600">
                          <Box className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-ink-navy">All Accessories Included</h4>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">Original box with matching IMEI, OEM charger/cable, and purchasing receipt are present.</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Accessories options */}
                  {(() => {
                    const ids = rules.filter(r => r.category === 'accessories' && !r.isCriticalFailure).map(r => r.id);
                    const isAnySelected = selectedDefects.some(d => ids.includes(d.id));
                    const isAffirmativeSelected = accConfirmed && !isAnySelected;
                    return rules.filter(r => r.category === 'accessories' && !r.isCriticalFailure).map(defect => {
                      const isSelected = selectedDefects.some(d => d.id === defect.id);
                      return (
                      <div
                        key={defect.id}
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          handleToggleDefect(defect);
                          setAccConfirmed(false);
                        })}
                        onClick={() => {
                          handleToggleDefect(defect);
                          setAccConfirmed(false);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : isAffirmativeSelected
                            ? 'border-ice-border bg-canvas-white opacity-40 hover:opacity-70'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/20 flex items-center justify-center overflow-hidden shadow-xs">
                          {getIllustration(defect.id, deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                          </div>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">{defect.subText}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  });
                })()}
                </div>

                {/* Device Age & Warranty Status Section — Only for iPhone 15+ and recent eligible devices */}
                {/* Device Age & Warranty Status Section — For all eligible devices */}
                {isEligibleForWarranty && (
                  <div className="mt-6 text-left border-t border-ice-border/60 pt-5">
                    <div>
                      <h4 className="text-xs font-bold text-ink-navy font-outfit uppercase tracking-wider mb-1">
                        Is your device under brand warranty?
                      </h4>
                      <p className="text-[11px] text-ink-muted mb-3 font-light">
                        Devices with a valid purchase invoice under brand warranty receive higher valuation payouts.
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {/* Option: Yes, Under Warranty */}
                        <div
                          onClick={() => {
                            setHasWarranty(true);
                            if (warrantyAge === 'out_of_warranty') {
                              setWarrantyAge('under_3m');
                              setDeviceAge('under_3m');
                              setWarrantyStatus('active');
                            }
                          }}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                            hasWarranty === true
                              ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/20'
                              : 'border-ice-border bg-canvas-white hover:border-emerald-500/40 hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-600 shrink-0">
                            <ShieldCheck className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-xs text-ink-navy">Yes, Under Warranty</h5>
                              <span className="text-[9px] font-mono font-bold bg-emerald-500/20 text-emerald-600 px-1.5 py-0.5 rounded">
                                Valid Bill
                              </span>
                            </div>
                            <p className="text-[11px] text-ink-muted mt-0.5 font-light leading-snug">
                              Device has active brand warranty &amp; purchasing invoice.
                            </p>
                          </div>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                            hasWarranty === true ? 'bg-emerald-600 text-white' : 'border border-ice-border bg-white'
                          }`}>
                            {hasWarranty === true && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Option: No, Out of Warranty */}
                        <div
                          onClick={() => {
                            setHasWarranty(false);
                            setWarrantyAge('out_of_warranty');
                            setDeviceAge('1_to_2y');
                            setWarrantyStatus('expired');
                          }}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                            hasWarranty === false
                              ? 'border-slate-500 bg-slate-100 dark:bg-zinc-800 ring-1 ring-slate-400/30'
                              : 'border-ice-border bg-canvas-white hover:border-slate-400/40 hover:bg-slate-50/60'
                          }`}
                        >
                          <div className="w-9 h-9 rounded-lg bg-slate-200 dark:bg-zinc-700 border border-slate-300 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0">
                            <Box className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-xs text-ink-navy">No, Out of Warranty</h5>
                              <span className="text-[9px] font-mono font-bold bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded">
                                Expired / No Bill
                              </span>
                            </div>
                            <p className="text-[11px] text-ink-muted mt-0.5 font-light leading-snug">
                              Warranty expired or purchase invoice not available.
                            </p>
                          </div>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                            hasWarranty === false ? 'bg-slate-700 text-white' : 'border border-ice-border bg-white'
                          }`}>
                            {hasWarranty === false && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                          </div>
                        </div>
                      </div>

                      {/* Sub-duration selection when user selects "Yes, Under Warranty" */}
                      {hasWarranty === true && (
                        <div className="pt-3 border-t border-dashed border-ice-border animate-in fade-in slide-in-from-top-2 duration-200">
                          <p className="text-xs font-semibold text-ink-navy mb-2.5">
                            Select device age (with valid bill):
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <div
                              onClick={() => {
                                setWarrantyAge('under_3m');
                                setDeviceAge('under_3m');
                                setWarrantyStatus('active');
                              }}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                                warrantyAge === 'under_3m'
                                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                                  : 'border-ice-border bg-canvas-white hover:border-emerald-500/40'
                              }`}
                            >
                              <h5 className="font-bold text-xs text-ink-navy">Under 3 Months</h5>
                              <p className="text-[11px] text-ink-muted mt-0.5 font-light">Active brand warranty with valid bill.</p>
                            </div>

                            <div
                              onClick={() => {
                                setWarrantyAge('3_to_6m');
                                setDeviceAge('3_to_6m');
                                setWarrantyStatus('active');
                              }}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                                warrantyAge === '3_to_6m'
                                  ? 'border-cobalt bg-cobalt-light/40 ring-1 ring-cobalt/30'
                                  : 'border-ice-border bg-canvas-white hover:border-cobalt/40'
                              }`}
                            >
                              <h5 className="font-bold text-xs text-ink-navy">3 to 6 Months</h5>
                              <p className="text-[11px] text-ink-muted mt-0.5 font-light">Active brand warranty with valid bill.</p>
                            </div>

                            <div
                              onClick={() => {
                                setWarrantyAge('6_to_11m');
                                setDeviceAge('6_to_12m');
                                setWarrantyStatus('expiring_soon');
                              }}
                              className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                                warrantyAge === '6_to_11m'
                                  ? 'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/30'
                                  : 'border-ice-border bg-canvas-white hover:border-violet-500/40'
                              }`}
                            >
                              <h5 className="font-bold text-xs text-ink-navy">6 to 11 Months</h5>
                              <p className="text-[11px] text-ink-muted mt-0.5 font-light">Active brand warranty with valid bill.</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dual eSIM / Physical SIM Question — Apple Pro / Pro Max iPhone 14+ only */}
                {(() => {
                  const nm = model.name.toLowerCase();
                  const isProOrProMax = nm.includes('pro max') || nm.includes(' pro');
                  const isEligible = model.brandId === 'brand-apple' && isProOrProMax && (
                    nm.includes('iphone 14') || nm.includes('iphone 15') ||
                    nm.includes('iphone 16') || nm.includes('iphone 17')
                  );
                  if (!isEligible) return null;
                  return (
                    <div className="mt-5 text-left border-t border-ice-border/60 pt-5">
                      <h4 className="text-xs font-bold text-ink-navy font-outfit uppercase tracking-wider mb-2.5">
                        Does your phone support physical SIM?
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div
                          onClick={() => setDualEsim(false)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                            dualEsim === false
                              ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                              : 'border-ice-border bg-canvas-white hover:border-emerald-500/40 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            dualEsim === false ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-600'
                          }`}>
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-ink-navy">Yes</h5>
                            <p className="text-[10px] text-ink-muted font-light mt-0.5">Has physical SIM tray</p>
                          </div>
                        </div>

                        <div
                          onClick={() => setDualEsim(true)}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                            dualEsim === true
                              ? 'border-slate-700 bg-slate-100 dark:bg-zinc-800 ring-1 ring-slate-700/30'
                              : 'border-ice-border bg-canvas-white hover:border-slate-400/40 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            dualEsim === true ? 'bg-slate-700 text-white' : 'bg-slate-200 dark:bg-zinc-700 text-slate-600'
                          }`}>
                            <X className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-ink-navy">No</h5>
                            <p className="text-[10px] text-ink-muted font-light mt-0.5">eSIM only (No physical tray)</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* STEP 6: Diagnostic Review Stage */}
            {step === 6 && (
              <motion.div
                key="step-6-review"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
                className="space-y-6 text-left"
              >
                <div className="border-b border-ice-border pb-4">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">
                    Step 7 of 7 // Diagnostic Verification Review
                  </span>
                  <h3 className="text-3xl font-light text-ink-navy tracking-tight">Diagnostic Summary Review</h3>
                  <p className="text-xs text-ink-muted mt-1 font-light">
                    Review your completed 6-section diagnostic evaluation before generating your official trade-in quote.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border border-ice-border bg-slate-50/50 dark:bg-zinc-900/50">
                    <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block mb-2">TARGET DEVICE</span>
                    <h4 className="font-bold text-lg text-ink-navy">{model.name}</h4>
                    <p className="text-xs text-cobalt font-mono font-semibold mt-0.5">
                      {variant.storageGb >= 1024 ? '1TB' : `${variant.storageGb}GB`} Storage
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 uppercase tracking-widest block mb-2">ESTIMATED PAYOUT</span>
                    <h4 className="font-black text-2xl text-emerald-600 dark:text-emerald-400 font-outfit">
                      {formatPrice(valuation.finalPrice)}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-0.5">
                      {valuation.retentionPercentage}% Value Retained
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-wider">Declared Diagnostic Issues ({selectedDefects.length})</h4>
                  {selectedDefects.length === 0 ? (
                    <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-500" />
                      <span>All hardware, screen, frame, battery and accessory diagnostics passed. Device is in mint condition.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedDefects.map((defect, i) => (
                        <div key={i} className="p-3 rounded-lg border border-ice-border bg-canvas-white flex justify-between items-center text-xs">
                          <span className="font-medium text-ink-navy">{defect.description}</span>
                          <span className="font-mono text-amber-600 dark:text-amber-400 font-semibold text-[10px] bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                            Declared
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-ice-border flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setStep(5)}
                    className="px-4 py-2.5 rounded-lg border border-ice-border hover:bg-slate-100 dark:hover:bg-zinc-800 text-ink-navy font-semibold text-xs transition-all flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    <span>Edit Diagnostics</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setStep(7);
                      if (currentUser) {
                        sendQuoteAlertApi({
                          customerName: currentUser.name || 'Registered Customer',
                          customerPhone: currentUser.phone || 'N/A',
                          customerEmail: currentUser.email,
                          modelName: model.name,
                          storageGb: variant.storageGb,
                          estimatedPayout: valuation.finalPrice,
                          retentionPercentage: valuation.retentionPercentage,
                          defects: selectedDefects.map(d => d.description),
                          refCode: `SCH-${receiptRef}`,
                        }).catch(err => console.warn('[Diagnostic Wizard] Failed to dispatch quote email alert:', err));
                      }
                    }}
                    className="px-6 py-3 bg-gradient-to-r from-cobalt to-indigo-600 hover:from-cobalt-hover hover:to-indigo-700 text-white font-bold rounded-lg text-sm transition-all shadow-md hover:scale-[1.02] flex items-center gap-2"
                  >
                    <span>Confirm Diagnostics &amp; Generate Quote</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 7: Obsidian Verified Valuation Ledger */}
            {step === 7 && (
              <motion.div
                key="step-7-receipt"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="text-left"
              >
                <div className="max-w-2xl mx-auto">
                  <div id="printable-quote" className="bg-white dark:bg-zinc-900 text-ink-navy dark:text-white border border-ice-border dark:border-zinc-800 rounded-xl overflow-hidden shadow-xl p-6 relative">
                    {/* Watermark badge */}
                    <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full border-2 border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center rotate-12 select-none pointer-events-none print-stamp">
                      <span className="text-[9px] font-mono text-emerald-700 dark:text-emerald-400 font-bold uppercase tracking-widest">VERIFIED</span>
                    </div>

                    {/* Company Header Logo */}
                    <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-200 dark:border-zinc-800 print-border">
                      <div className="flex items-center gap-3">
                        <img src="/logo.svg" className="w-9 h-9 object-contain rounded-md print-logo-bg flex-shrink-0 shadow-xs" alt="Rephonix Logo" />
                        <div>
                          <span className="text-lg font-extrabold text-ink-navy dark:text-white print-text-dark tracking-tight block leading-none">
                            Re<span className="text-cobalt dark:text-sky-400 print-text-cobalt">phonix</span>
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500 print-text-muted tracking-wider uppercase block mt-1">
                            Official Diagnostic Valuation Quote
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] font-mono text-zinc-500 print-text-muted uppercase block tracking-wider">OFFICIAL QUOTE</span>
                        <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 print-text-emerald font-bold uppercase tracking-widest block mt-0.5">✓ Verified Audit</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center mb-6 pb-5 border-b border-slate-200 dark:border-zinc-800 print-border font-mono">
                      <div>
                        <span className="text-[10px] text-zinc-500 print-text-muted uppercase block font-mono tracking-wider mb-1">SPECIFICATION AUDIT RECEIPT</span>
                        <span className="font-bold text-ink-navy dark:text-white print-text-dark text-xl tracking-tight block">{model.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-zinc-500 print-text-muted uppercase block font-mono tracking-wider mb-1">REF CODE</span>
                        <span className="text-xs text-ink-slate dark:text-zinc-200 print-text-dark font-mono font-bold">#SCH-{receiptRef}</span>
                      </div>
                    </div>

                    <div className="space-y-3 text-xs font-mono">
                      <div className="flex justify-between items-center py-2 text-ink-navy dark:text-zinc-200 print-text-dark border-b border-slate-200 dark:border-zinc-800/80 print-border">
                        <span className="font-medium">00. Base Configuration ({variant.storageGb}GB)</span>
                        <span className="text-emerald-600 dark:text-emerald-400 print-text-emerald font-semibold text-xs font-mono">Verified Spec</span>
                      </div>

                      {valuation.deductions.length === 0 ? (
                        <div className="text-emerald-600 dark:text-emerald-400 print-text-emerald italic py-3 flex items-center gap-1.5 font-mono text-xs font-medium">
                          <Sparkles className="w-4 h-4 text-emerald-500 fill-emerald-500/20" /> [No defects declared. Maximum payout rate applies.]
                        </div>
                      ) : (
                        <div className="py-1 space-y-2.5">
                          {valuation.deductions.map((d, i) => (
                            <motion.div 
                              key={i} 
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.15 + 0.1 }}
                              className="flex justify-between items-center text-ink-navy dark:text-zinc-300 print-text-dark border-b border-slate-200 dark:border-zinc-800/60 print-border py-1.5"
                            >
                              <span className="font-normal">{(i + 1).toString().padStart(2, '0')}. {getEngineeringLabel(d.description)}</span>
                              <span className="text-slate-500 dark:text-zinc-400 font-mono text-[10px] uppercase font-semibold">Assessment Verified</span>
                            </motion.div>
                          ))}
                        </div>
                      )}


                      {/* Cashify-Style Standard Platform Fees */}
                      <div className="pt-2 border-t border-slate-200 dark:border-zinc-800/60 space-y-1.5 text-zinc-500">
                        <div className="flex justify-between items-center text-[11px]">
                          <span>Doorstep Processing Fee</span>
                          <span className="text-zinc-500 font-semibold">-₹99</span>
                        </div>
                        <div className="flex justify-between items-center text-[11px]">
                          <span>Sanchar Saathi IMEI Verification Fee</span>
                          <span className="text-zinc-500 font-semibold">-₹20</span>
                        </div>
                      </div>
                    </div>

                    {/* Visual Valuation Retention Bar */}
                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-zinc-800 print-border space-y-2">
                      <div className="flex justify-between text-xs font-mono text-zinc-600 dark:text-zinc-300 print-text-muted">
                        <span>Value Retention Ratio</span>
                        <span className="text-emerald-600 dark:text-emerald-400 print-text-emerald font-bold">{valuation.retentionPercentage}% Retained</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 dark:bg-zinc-800 print-bar-bg rounded-full overflow-hidden flex border border-slate-200 dark:border-zinc-700/50 print-border">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-700 rounded-full" 
                          style={{ width: `${Math.max(5, valuation.retentionPercentage)}%` }}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center border-t border-dashed border-slate-300 dark:border-zinc-700/80 print-border pt-5 mt-5">
                      <div>
                        <span className="text-zinc-500 print-text-muted uppercase block text-xs font-mono font-semibold">TOTAL ESTIMATED PAYOUT</span>
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 print-text-emerald uppercase tracking-wider block font-mono font-bold mt-0.5">✓ Payout Rate Locked</span>
                      </div>
                      <span className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 print-text-emerald tracking-tight font-mono font-outfit">
                        {isPriceLocked ? '₹ XX,XXX' : formatPrice(valuation.finalPrice)}
                      </span>
                    </div>

                    {/* Not satisfied with the price? Contact Us Banner */}
                    <div className="mt-5 bg-[#f3f4f6] dark:bg-zinc-800/80 border border-slate-200/80 dark:border-zinc-700/60 rounded-2xl p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs print:hidden">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base tracking-tight">
                          Not satisfied with the price?
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-zinc-400 mt-0.5 font-normal">
                          Please connect with our team
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setContactModalOpen(true)}
                        className="text-cobalt dark:text-sky-400 hover:text-cobalt-hover dark:hover:text-sky-300 font-bold text-xs sm:text-sm hover:underline cursor-pointer transition-colors flex-shrink-0 self-end sm:self-auto"
                      >
                        Contact Us
                      </button>
                    </div>

                    <p className="text-[10px] text-zinc-500 mt-4 italic text-center font-mono">
                      Estimated Trade-In Value. Final offer is subject to physical inspection, IMEI/device verification and diagnostic confirmation.
                    </p>
                  </div>

                  <div className="flex gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setStep(6)}
                      className="px-4 py-3 rounded-lg border border-ice-border hover:bg-slate-100 dark:hover:bg-zinc-800 text-ink-navy font-semibold text-xs transition-all flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      aria-label="Print diagnostic report and quote"
                      className="flex-shrink-0 px-4 py-3 rounded-lg border border-ice-border text-ink-slate hover:border-cobalt hover:text-cobalt transition-all flex items-center gap-2 text-xs font-semibold"
                    >
                      <Printer className="w-4 h-4" aria-hidden="true" />
                      <span>Print Quote</span>
                    </button>

                    {isPriceLocked ? (
                      <button
                        type="button"
                        onClick={() => setLockModalOpen(true)}
                        className="flex-1 bg-cobalt hover:bg-cobalt-hover text-white py-3 rounded-lg font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 group hover:scale-[1.01]"
                      >
                        <Lock className="w-4 h-4 text-sky-300" />
                        Unlock Price &amp; Book
                      </button>
                    ) : (
                      <button
                        onClick={() => onComplete(valuation.finalPrice, selectedDefects)}
                        className="flex-1 bg-cobalt hover:bg-cobalt-hover text-white py-3 rounded-lg font-bold text-xs sm:text-sm text-center transition-all flex items-center justify-center gap-2 group hover:scale-[1.01]"
                      >
                        Book Instant Doorstep Payout
                        <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation panel */}
          {step < 6 && (
            <div className="flex flex-row justify-between items-center gap-3 border-t border-ice-border/60 pt-5 mt-6">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2.5 rounded-lg border border-ice-border hover:bg-slate-100 dark:hover:bg-zinc-800 text-ink-navy font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <span className="hidden sm:inline-block text-[10px] font-mono text-zinc-400 uppercase tracking-wider pl-2">
                  Step {step + 1} of 7
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                disabled={!isStepValidated}
                className={`px-6 py-2.5 bg-gradient-to-r from-cobalt to-indigo-600 hover:from-cobalt-hover hover:to-indigo-700 text-white font-bold rounded-lg text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
                  !isStepValidated ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                <span>{step === 5 ? 'Review Diagnostics' : 'Next Step'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Cashify-style Price Lock Modal */}
      {lockModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full bg-white dark:bg-zinc-900 rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-left border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setLockModalOpen(false)} 
              className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 z-10 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left Panel: Brand / Illustration (Hidden on mobile) */}
            <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-cobalt to-emerald-500 text-white p-8 flex-col justify-between relative overflow-hidden">
              <div className="z-10">
                <span className="text-xl font-extrabold tracking-tight">
                  Re<span className="text-sky-300">phonix</span>
                </span>
                <h3 className="text-2xl font-bold font-outfit mt-4 leading-tight">Login / Signup</h3>
              </div>
              
              <div className="my-auto flex flex-col items-center text-center space-y-4 z-10">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                  <Lock className="w-8 h-8 text-white fill-current" />
                </div>
                <p className="text-xs font-light opacity-90 leading-relaxed text-center">Verify your mobile number to unlock your diagnostic estimate and book a free doorstep inspection.</p>
              </div>

              {/* Decorative light effects */}
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-white/5 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-sky-300/10 rounded-full blur-2xl pointer-events-none" />
            </div>

            {/* Right Panel: Active Auth Forms */}
            <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-center bg-white dark:bg-zinc-900 font-sans">
              
              {/* Product Info Box */}
              <div className="border border-ice-border dark:border-zinc-800 rounded-lg p-3.5 flex items-center gap-3.5 mb-5 bg-slate-50/50 dark:bg-zinc-900/50">
                <div className="w-12 h-12 bg-white dark:bg-zinc-800 border border-ice-border dark:border-zinc-800 rounded-md flex items-center justify-center p-1 flex-shrink-0">
                  <img 
                    src={getDeviceImage(model.id, model.brandId, variant.color, model.imageUrl)} 
                    alt={model.name} 
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement;
                      const fallback = getDeviceImage('', model.brandId);
                      if (img.src !== fallback) {
                        img.src = fallback;
                      }
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-ink-navy dark:text-white leading-tight">{model.name}</h4>
                  <p className="text-[10px] text-ink-muted mt-0.5">
                    {variant.storageGb ? (variant.storageGb >= 1024 ? `${variant.storageGb / 1024}TB` : `${variant.storageGb}GB`) : ''}
                    {variant.ramGb ? ` • ${variant.ramGb}GB RAM` : ''}
                    {variant.color && (variant.color.includes('Wi-Fi') || variant.color.includes('Cellular')) ? ` • ${variant.color}` : ''}
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-wider">Selling Price:</span>
                    <span className="text-xs font-extrabold text-red-500 font-mono">₹ XX,XXX</span>
                  </div>
                </div>
              </div>

              {/* Price Unlock Notice */}
              <div className="bg-cobalt/5 dark:bg-cobalt/10 border border-cobalt/10 rounded-md p-2.5 flex items-center gap-2 mb-5 text-cobalt dark:text-sky-400 text-xs">
                <Lock className="w-3.5 h-3.5 flex-shrink-0 animate-pulse" />
                <span className="font-semibold">Login to unlock the best price</span>
              </div>

              {/* Error Box */}
              {modalError && (
                <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-500 p-2.5 rounded-sm text-[11px] font-medium flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}



              {modalStage === 'email' && (
                /* Stage 1: Email address entry */
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="modalEmail" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                      Enter your email address
                    </label>
                    <div className="relative flex rounded-sm overflow-hidden border border-ice-border dark:border-zinc-800 focus-within:border-cobalt transition-colors">
                      <span className="bg-slate-100 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center border-r border-ice-border dark:border-zinc-800">
                        <Mail className="w-3.5 h-3.5" />
                      </span>
                      <input
                        id="modalEmail"
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full px-3 py-2 bg-canvas-pure text-xs text-ink-navy dark:text-white focus:outline-none"
                        placeholder="Enter your Email"
                      />
                    </div>
                  </div>

                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="modalTerms"
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="h-4 w-4 text-cobalt focus:ring-cobalt/30 border-ice-border rounded"
                      />
                    </div>
                    <div className="ml-2.5 text-[11px] text-left">
                      <label htmlFor="modalTerms" className="font-light text-ink-muted">
                        I agree to the{' '}
                        <span className="text-cobalt hover:underline cursor-pointer font-medium" onClick={() => alert('Terms of Service: By unlocking your price, you verify device details are correctly declared.')}>
                          Terms &amp; Conditions
                        </span>{' '}
                        &amp; Privacy Policy.
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full flex justify-center py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50"
                  >
                    {modalLoading ? 'Checking...' : 'CONTINUE'}
                  </button>
                </form>
              )}

              {modalStage === 'password' && (
                /* Stage 2: Password entry (existing account) */
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="text-left mb-2">
                    <h5 className="font-bold text-xs text-ink-navy dark:text-white">Welcome Back!</h5>
                    <p className="text-[10px] text-ink-muted font-light mt-0.5">An account with {emailInput} already exists. Please login to unlock your price.</p>
                  </div>

                  <div>
                    <label htmlFor="modalPassword" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                      Enter Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                      <input
                        id="modalPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 bg-canvas-pure border border-ice-border dark:border-zinc-800 rounded-sm text-xs text-ink-navy dark:text-white focus:outline-none focus:border-cobalt transition-all"
                        placeholder="Enter account password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-ink-navy"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <button 
                      type="button"
                      onClick={() => { setModalStage('email'); setModalError(''); }}
                      className="text-cobalt hover:underline font-medium"
                    >
                      Use different email
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full flex justify-center py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50"
                  >
                    {modalLoading ? 'Logging in...' : 'LOGIN & UNLOCK'}
                  </button>
                </form>
              )}

              {modalStage === 'signup' && (
                /* Stage 3: Signup info fields (new account) */
                <form onSubmit={handleSignupSubmit} className="space-y-3">
                  <div className="text-left mb-2">
                    <h5 className="font-bold text-xs text-ink-navy dark:text-white">Create Account</h5>
                    <p className="text-[10px] text-ink-muted font-light mt-0.5">Please fill in your details to create an account and unlock the price.</p>
                  </div>

                  <div>
                    <label htmlFor="modalName" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                        <User className="w-3.5 h-3.5" />
                      </span>
                      <input
                        id="modalName"
                        type="text"
                        required
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-canvas-pure border border-ice-border dark:border-zinc-800 rounded-sm text-xs text-ink-navy dark:text-white focus:outline-none focus:border-cobalt transition-all"
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="modalPhone" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1">
                      Mobile Number
                    </label>
                    <div className="relative flex rounded-sm overflow-hidden border border-ice-border dark:border-zinc-800 focus-within:border-cobalt transition-colors">
                      <span className="bg-slate-100 dark:bg-zinc-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center border-r border-ice-border dark:border-zinc-800">
                        +91
                      </span>
                      <input
                        id="modalPhone"
                        type="tel"
                        maxLength={10}
                        required
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-1.5 bg-canvas-pure text-xs text-ink-navy dark:text-white focus:outline-none"
                        placeholder="Enter Mobile"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="modalSignupPassword" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1">
                      Create Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                        <Lock className="w-3.5 h-3.5" />
                      </span>
                      <input
                        id="modalSignupPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full pl-9 pr-10 py-1.5 bg-canvas-pure border border-ice-border dark:border-zinc-800 rounded-sm text-xs text-ink-navy dark:text-white focus:outline-none focus:border-cobalt transition-all"
                        placeholder="Min 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-ink-navy"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <button 
                      type="button"
                      onClick={() => { setModalStage('email'); setModalError(''); }}
                      className="text-cobalt hover:underline font-medium"
                    >
                      Change email address
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full flex justify-center py-2 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50"
                  >
                    {modalLoading ? 'Sending OTP...' : 'CONTINUE & SEND OTP'}
                  </button>
                </form>
              )}

              {modalStage === 'otp' && (
                /* Stage 4: OTP Verification code */
                <form onSubmit={handleOtpVerifySubmit} className="space-y-4">
                  <div className="text-left mb-2">
                    <h5 className="font-bold text-xs text-ink-navy dark:text-white">Verify Email Address</h5>
                    <p className="text-[10px] text-ink-muted font-light mt-0.5">Please enter the 6-digit OTP code sent to {emailInput}.</p>
                  </div>

                  <div>
                    <label htmlFor="modalOtp" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                      Verification Code
                    </label>
                    <input
                      id="modalOtp"
                      type="text"
                      maxLength={6}
                      required
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full tracking-[0.5em] text-center font-bold pl-3 py-2 bg-canvas-pure border border-ice-border dark:border-zinc-800 rounded-sm text-sm text-ink-navy dark:text-white focus:outline-none focus:border-cobalt transition-all"
                      placeholder="000000"
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] pt-1">
                    <button 
                      type="button"
                      onClick={() => { setModalStage('email'); setModalError(''); }}
                      className="text-cobalt hover:underline font-medium"
                    >
                      Change email address
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full flex justify-center py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50"
                  >
                    {modalLoading ? 'Verifying OTP...' : 'VERIFY & UNLOCK'}
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Best Price Negotiation & Support Contact Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden shadow-2xl border border-zinc-200 dark:border-zinc-800 text-left p-6 sm:p-7">
            {/* Close button */}
            <button 
              type="button"
              onClick={() => {
                setContactModalOpen(false);
                setBestPriceSubmitted(false);
              }} 
              className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cobalt/10 text-cobalt flex items-center justify-center flex-shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white font-outfit leading-snug">
                  Get The Best Price Guaranteed
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400">
                  Have a better offer or want a custom quote? Connect with our team!
                </p>
              </div>
            </div>

            {/* Device & Valuation Summary */}
            <div className="bg-slate-50 dark:bg-zinc-800/60 rounded-xl p-3.5 border border-slate-200 dark:border-zinc-700/60 mb-5 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-400 block">DEVICE</span>
                <span className="font-bold text-slate-800 dark:text-zinc-200">{model.name} ({variant.storageGb}GB)</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-slate-400 block">CURRENT QUOTE</span>
                <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-sm font-outfit">{formatPrice(valuation.finalPrice)}</span>
              </div>
            </div>

            {bestPriceSubmitted ? (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-5 text-center space-y-2 my-2 animate-fadeIn">
                <div className="w-10 h-10 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-emerald-800 dark:text-emerald-300 text-sm">Best Price Request Received!</h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  Our pricing desk is evaluating your request for <strong>{model.name}</strong>. We will call/WhatsApp you at <strong>+91 {contactPhone}</strong> within 15 minutes with our best revised offer!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setContactModalOpen(false);
                    setBestPriceSubmitted(false);
                  }}
                  className="mt-2 text-xs font-bold text-emerald-800 dark:text-emerald-300 underline hover:no-underline"
                >
                  Close Window
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Quick Action Channels */}
                <div className="grid grid-cols-2 gap-3">
                  <a
                    href={`https://wa.me/919034997719?text=${encodeURIComponent(`Hi Rephonix Team! I got an online quote of ${formatPrice(valuation.finalPrice)} for my ${model.name} (${variant.storageGb}GB). Can I get a better price?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-xs"
                  >
                    <MessageSquare className="w-4 h-4 fill-current" />
                    <span>WhatsApp Us</span>
                  </a>

                  <a
                    href="tel:+919034997719"
                    className="flex items-center justify-center gap-2 p-3 rounded-xl bg-cobalt hover:bg-cobalt-hover text-white font-bold text-xs transition-all shadow-xs"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Call Manager</span>
                  </a>
                </div>

                <div className="relative flex items-center my-3">
                  <div className="flex-grow border-t border-slate-200 dark:border-zinc-800" />
                  <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-400 uppercase tracking-widest">Or Request Price Match</span>
                  <div className="flex-grow border-t border-slate-200 dark:border-zinc-800" />
                </div>

                {/* Quick callback request form */}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setIsSubmittingBestPrice(true);
                    try {
                      await sendPriceMatchAlertApi({
                        customerPhone: contactPhone || currentUser?.phone || 'N/A',
                        customerEmail: currentUser?.email,
                        customerName: currentUser?.name,
                        modelName: model.name,
                        storageGb: variant.storageGb,
                        currentQuote: valuation.finalPrice,
                        expectedPrice: expectedPrice || Math.round(valuation.finalPrice * 1.1),
                        comments: contactNote || 'No additional comments',
                        refCode: `MATCH-${receiptRef}`
                      });
                    } catch (err) {
                      console.warn('[Price Match] Failed to send email alert:', err);
                    }
                    setIsSubmittingBestPrice(false);
                    setBestPriceSubmitted(true);
                  }}
                  className="space-y-3"
                >
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Your Mobile / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-cobalt outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Your Target Expected Price (₹)
                    </label>
                    <input
                      type="number"
                      placeholder={`e.g. ₹${Math.round(valuation.finalPrice * 1.1)}`}
                      value={expectedPrice}
                      onChange={(e) => setExpectedPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-cobalt outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 dark:text-zinc-300 block mb-1">
                      Comments (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Additional details or target price notes..."
                      value={contactNote}
                      onChange={(e) => setContactNote(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 rounded-lg text-xs font-sans text-slate-900 dark:text-white focus:ring-2 focus:ring-cobalt outline-none resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingBestPrice}
                    className="w-full py-2.5 bg-gradient-to-r from-cobalt to-indigo-600 hover:from-cobalt-hover hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
                  >
                    {isSubmittingBestPrice ? 'Submitting...' : 'Submit Best Price Request'}
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Full contact page link */}
                <div className="pt-2 text-center border-t border-slate-100 dark:border-zinc-800">
                  <button
                    type="button"
                    onClick={() => {
                      setContactModalOpen(false);
                      if (onNavigate) {
                        onNavigate('/contact');
                      } else {
                        window.location.href = '/contact';
                      }
                    }}
                    className="text-xs text-slate-500 dark:text-zinc-400 hover:text-cobalt dark:hover:text-sky-400 font-medium inline-flex items-center gap-1"
                  >
                    Or visit our full Contact Page <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
