import React, { useState, useMemo, useRef } from 'react';
import { Model, Variant, getDefectRulesForCategory, DefectRule, isAppleDevice, isSmartwatchDevice, isTabletDevice, getDeviceImage } from '../../data/mockDatabase';
import { calculateValuation } from '../../utils/valuation';
import { 
  ArrowLeft, Check, ChevronRight, Activity, Sparkles, 
  Smartphone, Tablet, Box, Zap, Trash2, ShieldCheck, Printer, Watch,
  X, Lock, Eye, EyeOff, AlertCircle, Mail, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIllustration } from './Illustrations';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import emailjs from '@emailjs/browser';
import { checkPhone, customerLogin, customerSignup, verifyOtp, ApiUser } from '../../utils/api';

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
}) => {
  const isApple = useMemo(() => isAppleDevice(model.brandId, model.name), [model]);
  const isWatch = useMemo(() => isSmartwatchDevice(model.brandId, model.name, model.id), [model]);
  const isTablet = useMemo(() => isTabletDevice(model.brandId, model.name, model.id), [model]);
  const deviceType: 'phone' | 'watch' | 'tablet' = isWatch ? 'watch' : isTablet ? 'tablet' : 'phone';

  // Obtain rules based on model category, brand and model ID
  const rules = useMemo(() => getDefectRulesForCategory(model.category, model.brandId, model.name, model.id), [model]);

  const stepsList = useMemo(() => {
    if (isWatch) {
      return [
        { 
          title: isApple ? 'Boot & Pair Lock' : 'Boot & Knox Lock', 
          icon: Zap, 
          desc: isApple ? 'Power on & Apple ID pair status' : 'Power on & Samsung Knox lock status' 
        },
        { title: 'Display & Watch Dial',   icon: Watch,       desc: 'Touch, Sapphire/Ion-X glass & burn-in' },
        { title: 'Casing & Crown',         icon: ShieldCheck, desc: 'Frame, Digital Crown / Bezel & Band' },
        { title: 'Health & Sensors',       icon: Activity,   desc: 'Heart rate, ECG, SpO2 & fall detection' },
        { title: 'Battery & Wireless',     icon: Zap,        desc: 'Battery health, magnetic charging & GPS' },
        { title: 'Accessories & Docs',     icon: Box,        desc: 'Charging puck, box & bill' },
      ];
    }
    if (isTablet) {
      return [
        { 
          title: isApple ? 'Boot & iCloud' : 'Boot & Account Lock', 
          icon: Zap, 
          desc: isApple ? 'Power on & Apple ID status' : 'Power on & Google Account lock status' 
        },
        { title: 'Screen & Display',       icon: Tablet,     desc: isApple ? 'Touch, True Tone & glass' : 'Touch, calibration & glass' },
        { title: 'Body & Frame',           icon: ShieldCheck, desc: 'Aluminium chassis, buttons & seal' },
        { title: 'Hardware',               icon: Activity,   desc: isApple ? 'Camera, Face ID/Touch ID, audio & restart' : 'Camera, biometrics, audio & restart' },
        { title: 'Connectivity',           icon: Zap,        desc: 'Battery, cellular, Wi-Fi & parts' },
        { title: 'Accessories & Docs',     icon: Box,        desc: 'Box, charger & bill' },
      ];
    }
    return [
      { 
        title: isApple ? 'Boot & iCloud' : 'Boot & Account Lock', 
        icon: Zap, 
        desc: isApple ? 'Power on & Apple ID status' : 'Power on & Google Account lock status' 
      },
      { title: 'Screen & Display',       icon: Smartphone, desc: isApple ? 'Touch, True Tone & glass' : 'Touch, calibration & glass' },
      { title: 'Body & Frame',           icon: ShieldCheck, desc: 'Frame, buttons, screws & seal' },
      { title: 'Hardware',               icon: Activity,   desc: isApple ? 'Camera, Face ID, audio & restart' : 'Camera, biometrics, audio & restart' },
      { title: 'Connectivity',           icon: Zap,        desc: 'Battery, network, Wi-Fi & parts' },
      { title: 'Accessories & Docs',     icon: Box,        desc: 'Box, charger & bill' },
    ];
  }, [isApple, isWatch, isTablet]);

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
    // Step 0: need icloud status chosen + will use CTA for power
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

  // Calculate live valuation
  const valuation = useMemo(() => {
    return calculateValuation(variant, selectedDefects);
  }, [variant, selectedDefects]);

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
      setStep(6); // Jump to summary
    } else {
      // Powers on — handle icloud status
      let next = selectedDefects.filter(d => d.id !== 'defect-critical-power');
      if (icloudChecked === 'locked' && icloudDefect) {
        next = [...next.filter(d => d.id !== 'defect-critical-icloud'), icloudDefect];
        setSelectedDefects(next);
        setStep(6); // iCloud locked = zero value, skip to summary
      } else {
        setSelectedDefects(next.filter(d => d.id !== 'defect-critical-icloud'));
        setStep(1);
      }
    }
  };

  // Phone Check Lock Modal states
  const [isPriceLocked, setIsPriceLocked] = useState(!currentUser);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [modalStage, setModalStage] = useState<'phone' | 'password' | 'signup' | 'otp'>('phone');
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

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneInput.length !== 10) {
      setModalError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!termsAccepted) {
      setModalError('You must agree to the Terms and Conditions.');
      return;
    }
    setModalError('');
    setModalLoading(true);

    try {
      const res = await checkPhone(phoneInput);
      if (res.exists) {
        setModalStage('password');
      } else {
        setModalStage('signup');
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to check phone number.');
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
      const res = await customerLogin(phoneInput, passwordInput);
      if (res.user) {
        if (onLoginSuccess) {
          onLoginSuccess(res.user);
        }
        setIsPriceLocked(false);
        setLockModalOpen(false);
      }
    } catch (err: any) {
      setModalError('Invalid mobile number or password.');
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
    if (step < 5) {
      setStep(prev => prev + 1);
    } else {
      setStep(6); // Summary screen
    }
  };

  const handlePrevStep = () => {
    if (step === 6 && selectedDefects.some(d => d.isCriticalFailure)) {
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

      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ice-border pb-4 sm:pb-5 mb-4 sm:mb-8 bg-canvas-pure p-4 sm:p-5 rounded-sm gap-4 text-left">
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrevStep}
            aria-label="Go back to previous step"
            className="p-2 sm:p-2.5 rounded-sm border border-ice-border hover:border-cobalt hover:bg-cobalt-light/10 text-ink-slate hover:text-cobalt transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          </button>
          
          {/* Device Vector Silhouette Badge */}
          <div className={`hidden sm:flex w-10 h-10 rounded-sm items-center justify-center flex-shrink-0 shadow-sm border ${
            isWatch
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              : isTablet
              ? 'bg-violet-500/10 border-violet-500/20 text-violet-600 dark:text-violet-400'
              : 'bg-cobalt-light border-white/[0.06] text-cobalt'
          }`}>
            {isWatch ? (
              <Watch className="w-5 h-5" aria-hidden="true" />
            ) : isTablet ? (
              <Tablet className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Smartphone className="w-5 h-5" aria-hidden="true" />
            )}
          </div>

          <div className="min-w-0">
            <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-0.5">Diagnostic wizard</span>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-light text-ink-navy text-xl sm:text-2xl tracking-tight truncate">{model.name}</span>
              <span className="text-[9px] font-mono tracking-wider bg-cobalt-light text-cobalt px-2 py-0.5 rounded-sm border border-white/[0.06] flex-shrink-0 uppercase">
                {variant.storageGb >= 1024 ? '1TB' : `${variant.storageGb}GB`}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile: thin progress bar; md+: step dots */}
        <div className="flex flex-col gap-1.5 sm:gap-0">
          {/* Mobile progress bar with step titles */}
          <div className="flex sm:hidden items-center gap-2">
            <span className="text-[10px] text-zinc-400 font-mono tracking-wider uppercase flex-shrink-0">
              Step {Math.min(step + 1, 6)}/6: {stepsList[Math.min(step, 5)]?.title}
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-ice-gray overflow-hidden">
              <div
                className="h-full bg-cobalt transition-all duration-500"
                style={{width: `${Math.min((step / 5) * 100, 100)}%`}}
              />
            </div>
          </div>
          {/* Desktop step dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {stepsList.map((_s, idx) => (
              <div key={idx} className="flex items-center">
                <div 
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-sm flex items-center justify-center font-bold text-xs border transition-all ${
                    step > idx 
                      ? 'bg-cobalt border-cobalt text-white' 
                      : step === idx 
                      ? 'bg-cobalt-light border-cobalt text-cobalt scale-110 shadow-[0_0_10px_rgba(59,130,246,0.25)]' 
                      : 'bg-canvas-white border-ice-border text-ink-muted'
                  }`}
                >
                  {step > idx ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                {idx < 5 && (
                  <div className={`w-4 sm:w-6 h-0.5 transition-all ${step > idx ? 'bg-cobalt' : 'bg-ice-border'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* On mobile: valuation mini-bar pinned above content */}
      <div className="lg:hidden bg-canvas-pure border border-ice-border rounded-sm p-3 mb-4 flex items-center justify-between text-left shadow-sm">
        <div>
          <span className="text-[9px] font-mono tracking-[0.1em] text-zinc-500 uppercase block">Live Estimate</span>
          <span className="text-lg font-bold text-cobalt font-outfit">{formatPrice(valuation.finalPrice)}</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] font-mono tracking-[0.1em] text-zinc-500 uppercase block">Base Value</span>
          <span className="text-xs font-semibold text-ink-slate">{formatPrice(variant.basePrice)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
        {/* Left column: Step Content */}
        <motion.div 
          layout 
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="lg:col-span-7 bg-canvas-pure rounded-sm border border-ice-border p-4 sm:p-6 min-h-[360px] sm:min-h-[420px] flex flex-col justify-between overflow-hidden shadow-premium"
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
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Step 1 of 6 // Critical Gates</span>
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
                    const isSelected = !isAnyScreenSelected && screenConfirmed;
                    return (
                      <div
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          setSelectedDefects(prev => prev.filter(d => d.category !== 'screen'));
                          setScreenConfirmed(true);
                        })}
                        onClick={() => {
                          setSelectedDefects(prev => prev.filter(d => d.category !== 'screen'));
                          setScreenConfirmed(true);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : !screenConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                            : 'border-ice-border bg-canvas-white opacity-50 hover:opacity-80'
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
                  {rules.filter(r => r.category === 'screen').map(defect => {
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
                          setScreenConfirmed(true);
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
                          setScreenConfirmed(true);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : !screenConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                            : 'border-ice-border bg-canvas-white opacity-50 hover:opacity-80'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-rose-500/15 to-amber-500/10 border border-rose-500/20 flex items-center justify-center overflow-hidden shadow-xs">
                          {getIllustration(defect.id, deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[9px] font-mono font-bold bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded-md border border-rose-500/20">
                              {defect.deductionPercentage > 0 ? `-${parseFloat((defect.deductionPercentage * 100).toFixed(1))}%` : `-${formatPrice(defect.deductionFixed)}`}
                            </span>
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
                  })}
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
                    const isSelected = !isAnyBodySelected && bodyConfirmed;
                    return (
                      <div
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          setSelectedDefects(prev => prev.filter(d => d.category !== 'body'));
                          setBodyConfirmed(true);
                        })}
                        onClick={() => {
                          setSelectedDefects(prev => prev.filter(d => d.category !== 'body'));
                          setBodyConfirmed(true);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : !bodyConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                            : 'border-ice-border bg-canvas-white opacity-50 hover:opacity-80'
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
                  {rules.filter(r => r.category === 'body').map(defect => {
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
                          setBodyConfirmed(true);
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
                          setBodyConfirmed(true);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : !bodyConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                            : 'border-ice-border bg-canvas-white opacity-50 hover:opacity-80'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/20 flex items-center justify-center overflow-hidden shadow-xs">
                          {getIllustration(defect.id, deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[9px] font-mono font-bold bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded-md border border-rose-500/20">
                              {defect.deductionPercentage > 0 ? `-${parseFloat((defect.deductionPercentage * 100).toFixed(1))}%` : `-${formatPrice(defect.deductionFixed)}`}
                            </span>
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
                  })}
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
                    const isSelected = !isAnySelected && funcConfirmed;
                    return (
                      <div
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          setSelectedDefects(prev => prev.filter(d => !ids.includes(d.id)));
                          setFuncConfirmed(true);
                        })}
                        onClick={() => {
                          setSelectedDefects(prev => prev.filter(d => !ids.includes(d.id)));
                          setFuncConfirmed(true);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : !funcConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                            : 'border-ice-border bg-canvas-white opacity-50 hover:opacity-80'
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
                  {rules.filter(r => ['camera', 'functionality'].includes(r.category)).map(defect => {
                    const isSelected = selectedDefects.some(d => d.id === defect.id);
                    return (
                      <div
                        key={defect.id}
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          handleToggleDefect(defect);
                          setFuncConfirmed(true);
                        })}
                        onClick={() => {
                          handleToggleDefect(defect);
                          setFuncConfirmed(true);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : !funcConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                            : 'border-ice-border bg-canvas-white opacity-50 hover:opacity-80'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center overflow-hidden shadow-xs">
                          {getIllustration(defect.id, deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[9px] font-mono font-bold bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded-md border border-rose-500/20">
                              {defect.deductionPercentage > 0 ? `-${parseFloat((defect.deductionPercentage * 100).toFixed(1))}%` : `-${formatPrice(defect.deductionFixed)}`}
                            </span>
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
                  })}
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
                    const isSelected = !isAnySelected && connectConfirmed;
                    return (
                      <div
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          setSelectedDefects(prev => prev.filter(d => !ids.includes(d.id)));
                          setConnectConfirmed(true);
                        })}
                        onClick={() => {
                          setSelectedDefects(prev => prev.filter(d => !ids.includes(d.id)));
                          setConnectConfirmed(true);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : !connectConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                            : 'border-ice-border bg-canvas-white opacity-50 hover:opacity-80'
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
                  {rules.filter(r => r.category === 'connectivity').map(defect => {
                    const isSelected = selectedDefects.some(d => d.id === defect.id);
                    return (
                      <div
                        key={defect.id}
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          handleToggleDefect(defect);
                          setConnectConfirmed(true);
                        })}
                        onClick={() => {
                          handleToggleDefect(defect);
                          setConnectConfirmed(true);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : !connectConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                            : 'border-ice-border bg-canvas-white opacity-50 hover:opacity-80'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-violet-500/15 to-purple-500/10 border border-violet-500/20 flex items-center justify-center overflow-hidden shadow-xs">
                          {getIllustration(defect.id, deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[9px] font-mono font-bold bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded-md border border-rose-500/20">
                              {defect.deductionPercentage > 0 ? `-${parseFloat((defect.deductionPercentage * 100).toFixed(1))}%` : `-${formatPrice(defect.deductionFixed)}`}
                            </span>
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
                  })}
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
                    const isSelected = !isAnySelected && accConfirmed;
                    return (
                      <div
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          setSelectedDefects(prev => prev.filter(d => !ids.includes(d.id)));
                          setAccConfirmed(true);
                        })}
                        onClick={() => {
                          setSelectedDefects(prev => prev.filter(d => !ids.includes(d.id)));
                          setAccConfirmed(true);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : !accConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                            : 'border-ice-border bg-canvas-white opacity-50 hover:opacity-80'
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
                  {rules.filter(r => r.category === 'accessories' && !r.isCriticalFailure).map(defect => {
                    const isSelected = selectedDefects.some(d => d.id === defect.id);
                    return (
                      <div
                        key={defect.id}
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          handleToggleDefect(defect);
                          setAccConfirmed(true);
                        })}
                        onClick={() => {
                          handleToggleDefect(defect);
                          setAccConfirmed(true);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/40 shadow-sm ring-1 ring-cobalt/30 scale-[1.01]'
                            : !accConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/40 hover:bg-slate-50/60'
                            : 'border-ice-border bg-canvas-white opacity-50 hover:opacity-80'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-amber-500/15 to-orange-500/10 border border-amber-500/20 flex items-center justify-center overflow-hidden shadow-xs">
                          {getIllustration(defect.id, deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[9px] font-mono font-bold bg-rose-500/10 text-rose-600 px-1.5 py-0.5 rounded-md border border-rose-500/20">
                              Deduct: {formatPrice(defect.deductionFixed)}
                            </span>
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
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 6: Live Summary (Finalized Quote breakdown) */}
            {step === 6 && (
              <motion.div
                key="step-6"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col h-full justify-between animate-morph"
              >
                <div>
                  <div className="mb-6 text-left">
                    <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Diagnostics Complete</span>
                    <h3 className="text-3xl font-light text-ink-navy tracking-tight">Valuation Ledger</h3>
                    <p className="text-xs text-ink-muted mt-2 font-light">Review the final computed trade-in receipt. Values are subject to doorside verification.</p>
                  </div>

                  {/* Animated Engineering Receipt */}
                  <div className="mb-6">
                    <div id="printable-quote" className="border border-zinc-700/80 bg-zinc-900 text-zinc-100 rounded-xl p-6 text-sm relative overflow-hidden text-left shadow-2xl">
                      {/* Price Lock Overlay */}
                      {isPriceLocked && (
                        <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
                          <div className="w-14 h-14 rounded-full bg-cobalt/20 text-cobalt flex items-center justify-center mb-4 border border-cobalt/30 animate-bounce">
                            <Lock className="w-6 h-6 text-sky-400" />
                          </div>
                          <h4 className="text-base font-bold text-white font-outfit mb-2">Price is Locked</h4>
                          <p className="text-[11px] text-zinc-400 max-w-xs mb-5 font-light leading-relaxed">Verify your mobile number to unlock the best doorstep resale valuation of your {model.name}.</p>
                          <button 
                            type="button"
                            onClick={() => setLockModalOpen(true)}
                            className="px-5 py-2 rounded-lg bg-cobalt hover:bg-cobalt-hover text-white text-[11px] font-bold transition-all shadow-premium"
                          >
                            Unlock Best Price
                          </button>
                        </div>
                      )}
                      {/* Watermark/stamp — circular badge */}
                      <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full border-2 border-emerald-400/30 bg-emerald-950/20 flex items-center justify-center rotate-12 select-none pointer-events-none print-stamp">
                        <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-widest">VERIFIED</span>
                      </div>

                      {/* Company Header Logo for Quote & Print */}
                      <div className="flex items-center justify-between pb-5 mb-5 border-b border-zinc-800 print-border">
                        <div className="flex items-center gap-3">
                          <img src="/logo.svg" className="w-9 h-9 object-contain rounded-md print-logo-bg flex-shrink-0 shadow-sm" alt="Rephonix Logo" />
                          <div>
                            <span className="text-lg font-extrabold text-white print-text-dark tracking-tight block leading-none">
                              Re<span className="text-sky-400 print-text-cobalt">phonix</span>
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400 print-text-muted tracking-wider uppercase block mt-1">
                              Official Diagnostic Valuation Quote
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] font-mono text-zinc-400 print-text-muted uppercase block tracking-wider">OFFICIAL QUOTE</span>
                          <span className="text-[10px] font-mono text-emerald-400 print-text-emerald font-bold uppercase tracking-widest block mt-0.5">✓ Verified Audit</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center mb-6 pb-5 border-b border-zinc-800 print-border font-mono">
                        <div>
                          <span className="text-[10px] text-zinc-400 print-text-muted uppercase block font-mono tracking-wider mb-1">SPECIFICATION AUDIT RECEIPT</span>
                          <span className="font-bold text-white print-text-dark text-xl tracking-tight block">{model.name}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-zinc-400 print-text-muted uppercase block font-mono tracking-wider mb-1">REF CODE</span>
                          <span className="text-xs text-zinc-200 print-text-dark font-mono font-bold">#SCH-{receiptRef}</span>
                        </div>
                      </div>

                      <div className="space-y-3 text-xs font-mono">
                        <div className="flex justify-between items-center py-2 text-zinc-200 print-text-dark border-b border-zinc-800/80 print-border">
                          <span className="font-medium">00. Base Configuration Value ({variant.storageGb}GB)</span>
                          <span className="text-emerald-400 print-text-emerald font-bold text-sm font-outfit">+{formatPrice(variant.basePrice)}</span>
                        </div>

                        {valuation.deductions.length === 0 ? (
                          <div className="text-emerald-400 print-text-emerald italic py-3 flex items-center gap-1.5 font-mono text-xs font-medium">
                            <Sparkles className="w-4 h-4 text-emerald-400 fill-emerald-400/20" /> [No defects declared. Maximum payout rate applies.]
                          </div>
                        ) : (
                          <div className="py-1 space-y-2.5">
                            {valuation.deductions.map((d, i) => (
                              <motion.div 
                                key={i} 
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.15 + 0.1 }}
                                className="flex justify-between items-center text-zinc-300 print-text-dark border-b border-zinc-800/60 print-border py-1.5"
                              >
                                <span className="font-normal">{(i + 1).toString().padStart(2, '0')}. {getEngineeringLabel(d.description)}</span>
                                <span className="text-red-400 print-text-red font-bold font-outfit text-xs">-[{formatPrice(d.totalDeducted)}]</span>
                              </motion.div>
                            ))}
                          </div>
                        )}

                        {/* Cashify-Style Standard Platform Fees */}
                        <div className="pt-2 border-t border-zinc-800/60 space-y-1.5 text-zinc-400">
                          <div className="flex justify-between items-center text-[11px]">
                            <span>Doorstep Processing Fee</span>
                            <span className="text-zinc-400 font-semibold">-₹99</span>
                          </div>
                          <div className="flex justify-between items-center text-[11px]">
                            <span>Sanchar Saathi IMEI Verification Fee</span>
                            <span className="text-zinc-400 font-semibold">-₹20</span>
                          </div>
                        </div>
                      </div>

                      {/* Visual Valuation Retention Bar */}
                      <div className="mt-4 pt-4 border-t border-zinc-800 print-border space-y-2">
                        <div className="flex justify-between text-xs font-mono text-zinc-300 print-text-muted">
                          <span>Value Retention Ratio</span>
                          <span className="text-emerald-400 print-text-emerald font-bold">{Math.round((valuation.finalPrice / variant.basePrice) * 100)}% Retained</span>
                        </div>
                        <div className="h-2.5 w-full bg-zinc-800 print-bar-bg rounded-full overflow-hidden flex border border-zinc-700/50 print-border">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-700 rounded-full" 
                            style={{ width: `${Math.max(5, Math.round((valuation.finalPrice / variant.basePrice) * 100))}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center border-t border-dashed border-zinc-700/80 print-border pt-5 mt-5">
                        <div>
                          <span className="text-zinc-400 print-text-muted uppercase block text-xs font-mono font-semibold">TOTAL ESTIMATED PAYOUT</span>
                          <span className="text-xs text-emerald-400 print-text-emerald uppercase tracking-wider block font-mono font-bold mt-0.5">✓ Payout Rate Locked</span>
                        </div>
                        <span className="text-3xl sm:text-4xl font-extrabold text-emerald-400 print-text-emerald tracking-tight font-mono font-outfit">
                          {isPriceLocked ? '₹ XX,XXX' : formatPrice(Math.max(0, valuation.finalPrice - 119))}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => {
                      if (isPriceLocked) {
                        setLockModalOpen(true);
                      } else {
                        window.print();
                      }
                    }}
                    aria-label="Print diagnostic report and quote"
                    className="flex-shrink-0 px-4 py-4 rounded-sm border border-ice-border text-ink-slate hover:border-cobalt hover:text-cobalt transition-all flex items-center gap-2 text-sm font-semibold"
                    style={{ minHeight: '48px' }}
                  >
                    <Printer className="w-4 h-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Print Quote</span>
                  </button>
                  {isPriceLocked ? (
                    <button
                      type="button"
                      onClick={() => setLockModalOpen(true)}
                      className="flex-1 bg-cobalt hover:bg-cobalt-hover text-white py-4 rounded-sm font-bold text-center transition-all flex items-center justify-center gap-2 group hover:scale-[1.01]"
                      style={{ minHeight: '48px' }}
                    >
                      <Lock className="w-4 h-4 text-sky-300" />
                      Unlock Price &amp; Book
                    </button>
                  ) : (
                    <button
                      onClick={() => onComplete(valuation.finalPrice, selectedDefects)}
                      className="flex-1 bg-cobalt hover:bg-cobalt-hover text-white py-4 rounded-sm font-bold text-center transition-all flex items-center justify-center gap-2 group hover:scale-[1.01]"
                      style={{ minHeight: '48px' }}
                    >
                      Book Instant Doorstep Payout
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation panel */}
          {step < 6 && (
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t border-white/[0.04] pt-4 sm:pt-6 mt-4 sm:mt-6">
              <button
                onClick={handlePrevStep}
                className="order-2 sm:order-1 px-5 py-2.5 rounded-sm border border-ice-border hover:bg-ice-gray text-ink-slate font-semibold text-sm transition-all"
                style={{ minHeight: '48px' }}
              >
                Back
              </button>

              <button
                onClick={handleNextStep}
                disabled={!isStepValidated}
                className={`order-1 sm:order-2 px-6 py-3 sm:py-2.5 bg-cobalt hover:bg-cobalt-hover text-white font-bold rounded-sm text-sm transition-all flex items-center justify-center gap-1.5 ${
                  !isStepValidated ? 'opacity-40 cursor-not-allowed' : 'hover:scale-[1.01]'
                }`}
                style={{ minHeight: '48px' }}
              >
                {step === 5 ? 'Generate Report' : 'Next Step'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Right column: Live price estimator — hidden on mobile (replaced by mini bar) */}
        <div className="hidden lg:flex lg:col-span-5 bg-canvas-pure rounded-sm border border-ice-border p-6 flex-col justify-between min-h-[300px] shadow-premium">
          <div>
            <div className="pb-4 border-b border-white/[0.04] mb-4 text-left">
              <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Live Valuation</span>
              <h3 className="text-xl font-light text-ink-navy">
                Quote Estimator
              </h3>
              <p className="text-xs text-ink-muted mt-1 font-light">Your quote updates in real-time as you select your device's condition details.</p>
            </div>

            {/* Price Ring meter */}
            <div className="flex flex-col items-center py-6">
              <div className="relative w-40 h-40 rounded-full flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 160 160">
                  {/* Track circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="rgba(59,130,246,0.12)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  {/* Progress circle */}
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="#3B82F6"
                    strokeWidth="8"
                    fill="transparent"
                    strokeLinecap="round"
                    strokeDasharray="440"
                    strokeDashoffset={
                      valuation.isCritical
                        ? 440
                        : 440 - (440 * (valuation.finalPrice / variant.basePrice))
                    }
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="text-center z-10 px-2">
                  <span className="text-[9px] font-mono tracking-[0.1em] text-zinc-500 uppercase block">Live Estimate</span>
                  <span className="text-2xl font-black text-ink-navy font-outfit">
                    {isPriceLocked ? '₹ XX,XXX' : formatPrice(valuation.finalPrice)}
                  </span>
                </div>
              </div>
              <span className="text-xs text-ink-slate font-light mt-3">
                Base Value: {isPriceLocked ? '₹ XX,XXX' : formatPrice(variant.basePrice)}
              </span>
            </div>
          </div>

          {/* Quick list of currently declared issues */}
          {selectedDefects.length > 0 ? (
            <div className="border-t border-white/[0.04] pt-4 mt-2 text-left">
              <span className="text-[10px] font-mono tracking-wider uppercase font-bold text-ink-slate block mb-2">Declared Issues ({selectedDefects.length})</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {selectedDefects.map(d => (
                  <span key={d.id} className="text-[10px] font-semibold bg-red-500/10 text-red-400 px-2 py-0.5 rounded-sm border border-red-500/20 flex items-center gap-1">
                    <Trash2 
                      onClick={() => handleToggleDefect(d)}
                      className="w-2.5 h-2.5 cursor-pointer text-red-400 hover:text-red-500" 
                    />
                    {d.description.length > 20 ? d.description.substring(0, 18) + '...' : d.description}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-ink-muted border-t border-white/[0.04] border-dashed font-light">
              No defects declared. Maximum value applicable.
            </div>
          )}
        </div>
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
                  <p className="text-[10px] text-ink-muted mt-0.5">{variant.storageGb}GB • {variant.color || 'Standard'}</p>
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



              {modalStage === 'phone' && (
                /* Stage 1: Phone number entry */
                <form onSubmit={handlePhoneSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="modalPhone" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                      Enter your phone number
                    </label>
                    <div className="relative flex rounded-sm overflow-hidden border border-ice-border dark:border-zinc-800 focus-within:border-cobalt transition-colors">
                      <span className="bg-slate-100 dark:bg-zinc-800 px-3 py-2 text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center border-r border-ice-border dark:border-zinc-800">
                        +91
                      </span>
                      <input
                        id="modalPhone"
                        type="tel"
                        maxLength={10}
                        required
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 bg-canvas-pure text-xs text-ink-navy dark:text-white focus:outline-none"
                        placeholder="Enter your Mobile"
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
                    <p className="text-[10px] text-ink-muted font-light mt-0.5">An account with +91 {phoneInput} already exists. Please login to unlock your price.</p>
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
                      onClick={() => { setModalStage('phone'); setModalError(''); }}
                      className="text-cobalt hover:underline font-medium"
                    >
                      Use different number
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
                    <label htmlFor="modalEmail" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                        <Mail className="w-3.5 h-3.5" />
                      </span>
                      <input
                        id="modalEmail"
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-1.5 bg-canvas-pure border border-ice-border dark:border-zinc-800 rounded-sm text-xs text-ink-navy dark:text-white focus:outline-none focus:border-cobalt transition-all"
                        placeholder="Enter email address"
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
                      onClick={() => { setModalStage('phone'); setModalError(''); }}
                      className="text-cobalt hover:underline font-medium"
                    >
                      Change phone number
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
                    <h5 className="font-bold text-xs text-ink-navy dark:text-white">Verify Phone Number</h5>
                    <p className="text-[10px] text-ink-muted font-light mt-0.5">Please enter the 6-digit OTP code sent to +91 {phoneInput}.</p>
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
                      onClick={() => { setModalStage('phone'); setModalError(''); }}
                      className="text-cobalt hover:underline font-medium"
                    >
                      Change phone number
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
    </div>
  );
};
