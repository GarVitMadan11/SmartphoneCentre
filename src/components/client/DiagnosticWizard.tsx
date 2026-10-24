import React, { useState, useMemo, useRef } from 'react';
import { Model, Variant, getDefectRulesForCategory, DefectRule, isAppleDevice, isSmartwatchDevice, isTabletDevice, hasSpenSupport, getBiometricType, getDeviceImage } from '../../data/mockDatabase';
import { calculateValuation } from '../../utils/valuation';
import type { AgeFactorKey } from '../../data/pricingRulesConfig';
import { 
  ArrowLeft, Check, ChevronRight, Activity, Sparkles, 
  Smartphone, Box, Zap, ShieldCheck, Printer, Receipt,
  X, Lock, Eye, EyeOff, AlertCircle, Mail, User,
  Phone, MessageSquare, ExternalLink, Headphones, Send, Bookmark
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIllustration } from './Illustrations';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import emailjs from '@emailjs/browser';
import { checkEmail, customerLogin, customerSignup, verifyOtp, requestPasswordResetOtp, resetPasswordWithOtp, sendQuoteAlertApi, sendPriceMatchAlertApi, ApiUser } from '../../utils/api';
import { saveQuote, isQuoteAlreadySaved } from '../../utils/savedQuotes';
import { TabletDiagnosticFlow } from './TabletDiagnosticFlow';
import { AnimatedPrice } from './wizard/AnimatedPrice';
import { PriceDeltaBadge } from './wizard/PriceDeltaBadge';
import { MobileBottomHUD } from './wizard/MobileBottomHUD';

const getEngineeringLabel = (description: string) => {
  const mapping: { [key: string]: string } = {
    'Cracked Screen / Back Glass':       'Screen Restoration Fee',
    'Front Glass Scratches / Bubbles':   'Glass Micro-Polishing Fee',
    'Screen Burn-in / Lines':            'Display Panel Replacement Fee',
    'Touch / Swipe Unresponsive':        'Digitizer / Touch Layer Repair',
    'True Tone Not Working':             'Original Display Certification Fee',
    'Replaced / Non-Original Screen':    'Non-OEM Display Panel Deduction',
    'Inner Display Crease Damage / Bubbling': 'Flexible Folding Display Panel & Crease Assembly Repair',
    'Display Calibration / Tint Issue':  'Display Panel Recalibration Levy',
    'Hinge Faulty / Does Not Fold Flat': 'Hinge Mechanism & Folding Chassis Restoration',
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
    'Missing Original S-Pen':            'OEM S-Pen Stylus De-allocation',
    'Missing Bill / Customer Photo ID':  'Legal Compliance Documentation Fee',
    'Single SIM Regional Variant Adjustment': 'Single SIM Variant Engineering Adjustment',
    'Dual eSIM Configuration Deduction (iPhone 14–16 Pro Series)': 'US Model Dual eSIM Architecture Adjustment',
    'Dual eSIM Configuration Deduction (iPhone 17 Pro Series)': 'US Model Dual eSIM Architecture Adjustment',
    'Dual eSIM Configuration Deduction (iPhone 17–18 Pro Series)': 'US Model Dual eSIM Architecture Adjustment',
    'Dual eSIM Configuration Deduction (iPhone 17–18 Series)': 'US Model Dual eSIM Architecture Adjustment',
    'Dual eSIM Configuration Deduction (Apple iPhone Series)': 'US Model Dual eSIM Architecture Adjustment',
    'Device Does Not Turn On':           'Board-Level Hardware Failure',
    'iCloud / Apple ID Locked':                         'Activation Lock — Zero Resale Value',
    'Google Account / Factory Reset Protection Locked': 'Factory Reset Protection Lock — Zero Resale Value',
    'Biometrics Faulty (Face ID)':                      'TrueDepth Sensor Array Security Fee',
    'Biometrics Faulty (Touch ID)':                     'Touch ID Biometric Sensor Security Fee',
    'Biometrics Faulty (Fingerprint / Face Unlock)':    'Biometric Sensor Security Fee',
    'Biometrics Faulty (Fingerprint Scanner)':          'Biometric Sensor Security Fee',
    'Face ID (TrueDepth Sensor) Faulty':                'TrueDepth Sensor Array Security Fee',
    'Touch ID (Home Button) Sensor Faulty':             'Touch ID Biometric Sensor Security Fee',
    'Fingerprint Scanner / Biometrics Faulty':          'Biometric Sensor Security Fee',
    'Battery Health 80% – 85%':                         'Battery Capacity Degradation Fee',
    'Battery Health 80% – 85% (Moderate Drain)':        'Battery Capacity Degradation Fee',
    'Battery Health < 80% (Service Alert)':             'Battery Module Replacement Fee',
    'Battery Health < 80% / Heavy Drain':               'Battery Module Replacement Fee',
    
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
    'Samsung Account / Google Knox Lock Active':         'Knox Lock — Zero Resale Value',

    // Tablet specific engineering fee labels
    'Tablet Does Not Turn On':                           'Logic Board Hardware Failure',
    'Cellular Network Not Working':                      'Baseband Cellular Modem Repair',
    'SIM Tray Missing or Damaged':                       'SIM Tray Hardware Replacement',
    'Touch Screen Not Working Properly':                 'Digitizer Layer Replacement',
    'Screen Replaced at Local Shop (Non-Original)':      'Non-OEM Display Panel Deduction',
    '1-2 Scratches on Screen':                           'Display Glass Micro-Polishing',
    'More Than 2 Scratches on Screen':                   'Display Surface Resurfacing Fee',
    'Chipped Outside Display Area':                      'Bevel Edge Glass Restoration',
    'Screen Cracked / Glass Broken':                     'Display Glass Restoration Fee',
    'Minor Discoloration on Screen':                     'Color Profile Recalibration Fee',
    'Major Discoloration on Screen':                     'Display Panel Replacement Fee',
    'Screen Shading / Fading':                           'Backlight Uniformity Restoration',
    '1-2 Very Small White Spots on Screen':              'Diffuser Pressure Spot Repair',
    '3 or More White Spots / Coloured Spots':            'Sub-Pixel Defect Recovery Fee',
    'Lines Visible on Screen':                           'Display Driver IC / Panel Replacement',
    'Light Leaks Around Edges of Display':               'Bezel Optical Gasket Re-sealing',
    'Front Camera Not Working':                          'Front Camera Sensor Recalibration',
    'Back Camera Not Working':                           'Rear Camera Sensor Replacement',
    'Camera Glass Broken / Missing':                     'Camera Lens Glass Replacement',
    'Finger / Touch ID Sensor Not Working':              'Biometric Touch ID Security Fee',
    'Face Sensor (Face ID) Not Working':                 'TrueDepth Sensor Array Security Fee',
    'Wi-Fi Not Working':                                 'Wi-Fi Transceiver Module Repair',
    'GPS Not Working':                                   'GPS Satellite Receiver Repair',
    'Bluetooth Not Working':                             'Bluetooth Antenna Array Repair',
    'Audio Jack Not Working':                            '3.5mm Headphone Jack Assembly Fee',
    'Volume Button Missing / Not Working':               'Volume Button Flex Cable Repair',
    'Power Button Broken / Not Working / Missing':       'Power Button Hardware Replacement',
    'Charging Defect; Unable to Charge':                 'USB-C / Power Port Repair',
    'Battery Faulty or Not Working':                     'Battery Module Replacement',
    'Microphone Not Working':                            'Microphone Array Assembly Fee',
    'Speaker Not Working; Faulty or Cracked Sound':      'Speaker Chamber Replacement Fee',
    '1-2 Scratches on Body':                             'Body Micro-Buffing & Clean Fee',
    'More Than 2 Scratches on Body':                     'Chassis Surface Bead-Blasting',
    '1-2 Minor Dents on Body':                           'Chassis Edge Re-contouring',
    'Major Dent(s) or More Than 2 Dents':                'Chassis Structural Re-alignment',
    'Body Bent':                                         'Chassis Unbending & Frame Trueing',
    'Loose Screen':                                      'Display Frame Adhesive Re-bonding',
    'Both Bent and Loose Screen':                        'Chassis Frame & Display Realignment',
    'Visible Gap Between Body and Back Panel':           'Enclosure Seam Re-alignment',
    'Back Panel Chipped on Edges':                       'Back Panel Edge Restoration',
    'Back Panel Broken / Shattered':                     'Rear Enclosure Replacement Fee',
    'Back Panel Missing':                                'Chassis Housing Replacement Fee',
    'Missing Original Tablet Charger':                   'OEM Fast Charger De-allocation',
    'Missing Box With Same IMEI / Serial':               'OEM Retail Box De-allocation',
    'Missing GST Valid Bill With Same IMEI / Serial':     'GST Tax Compliance Verification Fee'
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
  selectedDefects: rawSelectedDefects,
  setSelectedDefects,
  step,
  setStep,
  currentUser,
  onLoginSuccess,
  onNavigate,
}) => {
  const selectedDefects = useMemo(() => Array.isArray(rawSelectedDefects) ? rawSelectedDefects : [], [rawSelectedDefects]);
  const isApple = useMemo(() => isAppleDevice(model.brandId, model.name), [model]);
  const isWatch = useMemo(() => isSmartwatchDevice(model.brandId, model.name, model.id), [model]);
  const isTablet = useMemo(() => isTabletDevice(model.brandId, model.name, model.id), [model]);
  const hasSpen = useMemo(() => hasSpenSupport(model.brandId, model.name, model.id), [model]);
  const biometricType = useMemo(() => getBiometricType(model.brandId, model.name, model.id), [model]);
  const deviceType: 'phone' | 'watch' | 'tablet' = isWatch ? 'watch' : isTablet ? 'tablet' : 'phone';

  // Obtain rules based on model category, brand and model ID
  const rules = useMemo(() => getDefectRulesForCategory(model.category, model.brandId, model.name, model.id), [model]);

  // Only ask for warranty if model.supportsWarrantyQuestion is true (or fallback for recent devices >= 2023)
  // Dynamic Cycle Tier: Only ask for warranty if model is Tier 1 (Current/Recent Cycle <= 1 year old)
  const isEligibleForWarranty = useMemo(() => {
    if (model.supportsWarrantyQuestion !== undefined) {
      return model.supportsWarrantyQuestion;
    }
    const currentYear = new Date().getFullYear();
    const resolvedYear = model.releaseYear ?? 2024;
    // Current cycle (<= 1 year old)
    if (currentYear - resolvedYear > 1) {
      return false; // Matured baseline - no warranty question
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
      return true;
    }
    return (currentYear - resolvedYear) <= 1;
  }, [model, isApple]);

  const isScreenNonOriginal = useMemo(() => {
    return selectedDefects.some(d => d.id === 'defect-screen-non-original');
  }, [selectedDefects]);

  const showWarrantyQuestion = useMemo(() => {
    return isEligibleForWarranty && !isScreenNonOriginal;
  }, [isEligibleForWarranty, isScreenNonOriginal]);

  const [deviceAge, setDeviceAge] = useState<AgeFactorKey>('under_3m');
  const [hasWarranty, setHasWarranty] = useState<boolean | null>(null);
  const [_warrantyStatus, setWarrantyStatus] = useState<'active' | 'expiring_soon' | 'expired' | 'unverified'>(
    isEligibleForWarranty ? 'active' : 'expired'
  );

  React.useEffect(() => {
    if (isScreenNonOriginal) {
      setHasWarranty(false);
      setWarrantyAge('under_3m');
      setDeviceAge('under_3m');
      setWarrantyStatus('expired');
    }
  }, [isScreenNonOriginal]);

  const reviewStepIndex = isTablet ? 5 : 6;
  const finalReceiptIndex = isTablet ? 6 : 7;

  const stepsList = useMemo(() => {
    if (isTablet) {
      return [
        { title: 'Core Check', icon: ShieldCheck, desc: 'Power, network, SIM & warranty gate' },
        { title: 'Screen Defects', icon: Smartphone, desc: 'Touch, originality, scratches & spots' },
        { title: 'Hardware', icon: Activity, desc: 'Cameras, sensors, buttons & audio' },
        { title: 'Body Defects', icon: ShieldCheck, desc: 'Scratches, dents, bends & panels' },
        { title: 'Accessories & Age', icon: Box, desc: 'Charger, IMEI box & warranty age' },
        { title: 'Review & Valuation', icon: Receipt, desc: 'Diagnostic review & live quote' }
      ];
    }
    return [
      { title: isApple ? 'Boot & iCloud' : 'Boot & Lock', icon: ShieldCheck, desc: 'Power on & account lock gate' },
      { title: 'Display Panel', icon: Smartphone, desc: 'Touch, screen glass & burn-in' },
      { title: 'Body & Frame', icon: ShieldCheck, desc: 'Chassis, buttons, screws & seal' },
      { title: 'Hardware', icon: Activity, desc: 'Cameras, biometrics & audio' },
      { title: 'Connectivity', icon: Zap, desc: 'Battery, cellular, Wi-Fi & serial' },
      { title: showWarrantyQuestion ? 'Docs & Warranty' : 'Packaging & Box', icon: Box, desc: showWarrantyQuestion ? (hasSpen ? 'S-Pen, accessories & warranty' : 'Accessories, age & warranty') : (hasSpen ? 'Box, S-Pen, charger & invoice' : 'Original box, accessories & invoice') },
      { title: 'Review & Valuation', icon: Receipt, desc: 'Diagnostic review & breakdown' }
    ];
  }, [isTablet, isApple, showWarrantyQuestion, hasSpen]);

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
    if (isTablet) {
      if (step === 0) return !selectedDefects.some(d => d.id === 'defect-critical-power');
      return true;
    }
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
      const accOk = accConfirmed || selectedDefects.some(d => ids.includes(d.id));
      const warrantyOk = !showWarrantyQuestion || hasWarranty !== null;
      return accOk && warrantyOk;
    }
    return true;
  }, [isTablet, step, icloudChecked, screenConfirmed, bodyConfirmed, funcConfirmed, connectConfirmed, accConfirmed, selectedDefects, rules, showWarrantyQuestion, hasWarranty]);

  const [warrantyAge, setWarrantyAge] = useState<'under_3m' | '3_to_6m' | '6_to_11m' | 'out_of_warranty'>('under_3m');
  const simType = 'dual_sim';
  const [dualEsim, setDualEsim] = useState<boolean | null>(null);

  // Calculate live valuation via Stage 1 Rephonix Pricing Engine
  const valuation = useMemo(() => {
    return calculateValuation(variant, selectedDefects, {
      modelId: model.id,
      brandId: model.brandId,
      modelName: model.name,
      category: model.category,
      releaseYear: model.releaseYear,
      hasSpen,
      simType,
      warrantyAge: isScreenNonOriginal ? 'under_3m' : warrantyAge,
      deviceAge: isScreenNonOriginal ? 'under_3m' : deviceAge,
      dualEsim: dualEsim === true
    });
  }, [variant, selectedDefects, model, simType, warrantyAge, deviceAge, dualEsim, isScreenNonOriginal, hasSpen]);

  // Stable receipt reference code — generated once per wizard session
  const receiptRef = useMemo(() => Math.random().toString(36).substr(2, 6).toUpperCase(), []);

  // Toggle selection helper
  const handleToggleDefect = (defect: DefectRule, mutuallyExclusiveId?: string) => {
    setSelectedDefects(prev => {
      const current = Array.isArray(prev) ? prev : [];
      let next = [...current];

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
      setStep(finalReceiptIndex); // Jump to zero value receipt
    } else {
      // Powers on — handle icloud status
      let next = selectedDefects.filter(d => d.id !== 'defect-critical-power');
      if (icloudChecked === 'locked' && icloudDefect) {
        next = [...next.filter(d => d.id !== 'defect-critical-icloud'), icloudDefect];
        setSelectedDefects(next);
        setStep(finalReceiptIndex); // iCloud locked = zero value, skip to receipt
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
  const [modalStage, setModalStage] = useState<'email' | 'password' | 'signup' | 'otp' | 'forgot_reset'>('email');
  const [phoneInput, setPhoneInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [forgotOtpInput, setForgotOtpInput] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [forgotCooldown, setForgotCooldown] = useState(0);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [showForgotNewPassword, setShowForgotNewPassword] = useState(false);
  const [showForgotConfirmPassword, setShowForgotConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [modalError, setModalError] = useState('');
  const [modalLoading, setModalLoading] = useState(false);

  // Saved quote state
  const [isQuoteSaved, setIsQuoteSaved] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);

  React.useEffect(() => {
    if (step === finalReceiptIndex) {
      const alreadySaved = isQuoteAlreadySaved(
        model.id,
        variant.storageGb,
        selectedDefects.map(d => d.id),
        currentUser?.id
      );
      setIsQuoteSaved(alreadySaved);
    }
  }, [step, finalReceiptIndex, model.id, variant.storageGb, selectedDefects, currentUser?.id]);

  const handleSaveQuote = () => {
    saveQuote({
      userId: currentUser?.id,
      modelId: model.id,
      modelName: model.name,
      brandId: model.brandId,
      category: model.category,
      variantId: variant.id,
      storageGb: variant.storageGb,
      ramGb: variant.ramGb,
      color: variant.color,
      selectedDefectIds: selectedDefects.map(d => d.id),
      selectedDefectDescriptions: selectedDefects.map(d => d.description),
      savedBasePrice: variant.basePrice,
      savedPayout: valuation.finalPrice,
      savedRetentionPercentage: valuation.retentionPercentage,
      refCode: `RPX${receiptRef}`,
    });
    setIsQuoteSaved(true);
    setSaveToast('Quote successfully saved to your Profile! View and resume it anytime under "Saved".');
    setTimeout(() => setSaveToast(null), 5000);
  };

  React.useEffect(() => {
    if (forgotCooldown > 0) {
      const timer = setTimeout(() => setForgotCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [forgotCooldown]);

  React.useEffect(() => {
    if (currentUser) {
      setIsPriceLocked(false);
    }
  }, [currentUser]);

  React.useEffect(() => {
    if (step === reviewStepIndex && !currentUser) {
      setLockModalOpen(true);
    }
  }, [step, reviewStepIndex, currentUser]);

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

  const handleInitiateForgotPassword = async () => {
    const cleanEmail = emailInput.trim().toLowerCase();
    if (!cleanEmail) {
      setModalError('Please enter your email address first.');
      return;
    }
    setModalError('');
    setForgotSuccess('');
    setModalLoading(true);

    try {
      const res = await requestPasswordResetOtp(cleanEmail);
      if (res && (res as any).otp) {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey) {
          try {
            await emailjs.send(serviceId, templateId, {
              email: cleanEmail,
              passcode: (res as any).otp,
              time: '10 minutes',
            }, publicKey);
          } catch (e) {
            console.error('EmailJS forgot password send notice:', e);
          }
        }
      }
      setForgotOtpInput('');
      setForgotNewPassword('');
      setForgotConfirmPassword('');
      setForgotSuccess('A 6-digit verification code has been sent to your email.');
      setModalStage('forgot_reset');
      setForgotCooldown(60);
    } catch (err: any) {
      setModalError(err.message || 'Failed to send password reset code.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleResendForgotOtp = async () => {
    if (forgotCooldown > 0 || modalLoading) return;
    const cleanEmail = emailInput.trim().toLowerCase();
    setModalError('');
    setForgotSuccess('');
    setModalLoading(true);

    try {
      const res = await requestPasswordResetOtp(cleanEmail);
      if (res && (res as any).otp) {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (serviceId && templateId && publicKey) {
          try {
            await emailjs.send(serviceId, templateId, {
              email: cleanEmail,
              passcode: (res as any).otp,
              time: '10 minutes',
            }, publicKey);
          } catch (e) {
            console.error('EmailJS resend notice:', e);
          }
        }
      }
      setForgotSuccess('A new verification code has been sent to your email.');
      setForgotCooldown(60);
    } catch (err: any) {
      setModalError(err.message || 'Failed to resend code.');
    } finally {
      setModalLoading(false);
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = emailInput.trim().toLowerCase();
    const cleanOtp = forgotOtpInput.trim();

    if (cleanOtp.length !== 6) {
      setModalError('Please enter the 6-digit verification code.');
      return;
    }
    if (!forgotNewPassword) {
      setModalError('Please enter a new password.');
      return;
    }
    if (forgotNewPassword.length < 6) {
      setModalError('Password must be at least 6 characters.');
      return;
    }
    if (forgotNewPassword !== forgotConfirmPassword) {
      setModalError('Passwords do not match.');
      return;
    }

    setModalError('');
    setForgotSuccess('');
    setModalLoading(true);

    try {
      await resetPasswordWithOtp(cleanEmail, cleanOtp, forgotNewPassword);
      try {
        const loginRes = await customerLogin(cleanEmail, forgotNewPassword);
        if (loginRes.user) {
          if (onLoginSuccess) {
            onLoginSuccess(loginRes.user);
          }
          setIsPriceLocked(false);
          setLockModalOpen(false);
          return;
        }
      } catch (loginErr) {
        console.warn('Auto-login after password reset notice:', loginErr);
      }
      setPasswordInput(forgotNewPassword);
      setModalStage('password');
      setModalError('');
    } catch (err: any) {
      setModalError(err.message || 'Failed to reset password. Please check the code and try again.');
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
    if (step < reviewStepIndex) {
      setStep(prev => prev + 1);
    } else {
      setStep(finalReceiptIndex); // Final verified receipt
    }
  };

  const handlePrevStep = () => {
    if (step === finalReceiptIndex) {
      setStep(reviewStepIndex);
    } else if (step === reviewStepIndex && selectedDefects.some(d => d.isCriticalFailure)) {
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
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4"
          >
            <motion.div
              key="critical-modal-card"
              initial={{ opacity: 0, scale: 0.95, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 30 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="critical-modal-title"
              ref={criticalModalRef}
              className="bg-canvas-pure border-t sm:border border-red-500/30 rounded-t-2xl sm:rounded-xl p-6 max-w-sm w-full shadow-2xl text-center pb-8 sm:pb-6"
            >
              {/* Mobile Drag Pill */}
              <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-4 sm:hidden" />
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
      <div className="bg-white border border-ice-border rounded-xl p-4 sm:p-5 mb-6 shadow-sm space-y-5 text-left pb-24 sm:pb-5">
        {/* Top Header Row: Device Info + Live Payout HUD */}
        <div className="flex flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-ice-border/60">
          <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl bg-slate-50 p-1.5 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-xs">
              <img 
                src={getDeviceImage(model.id, model.brandId, variant?.color, model.imageUrl)} 
                alt={model.name} 
                className="w-full h-full object-contain" 
              />
            </div>

            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-mono tracking-[0.15em] text-slate-500 uppercase font-bold block">
                Evaluation Wizard
              </span>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                <h2 className="font-extrabold text-slate-950 text-lg sm:text-2xl tracking-tight truncate">{model.name}</h2>
                <span className="text-[10px] font-mono font-black tracking-wider bg-slate-100 text-slate-800 px-2 py-0.5 rounded-md border border-slate-300 flex-shrink-0">
                  {variant.storageGb >= 1024 ? `${variant.storageGb / 1024}TB` : `${variant.storageGb}GB`}
                </span>
                {isTablet && variant.ramGb && (
                  <span className="text-[10px] font-mono font-black tracking-wider bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md border border-blue-200 flex-shrink-0">
                    {variant.ramGb}GB RAM
                  </span>
                )}
                {isTablet && (
                  <span className={`text-[10px] font-mono font-black tracking-wider px-2 py-0.5 rounded-md border flex-shrink-0 ${
                    variant.connectivity === 'cellular' || variant.color?.toLowerCase().includes('cellular')
                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    {variant.connectivity === 'cellular' || variant.color?.toLowerCase().includes('cellular')
                      ? 'Wi-Fi + Cellular'
                      : 'Wi-Fi Only'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Real-Time Live Payout HUD Badge (Desktop) */}
          {step < reviewStepIndex && (
            <div className="hidden sm:flex items-center gap-3 bg-emerald-50/90 border-2 border-emerald-400 px-4 py-2.5 rounded-xl shadow-sm flex-shrink-0 transition-all relative">
              <div>
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse"></span>
                    <span className="text-[10px] font-mono tracking-widest text-emerald-950 uppercase block font-extrabold">
                      LIVE ESTIMATED PAYOUT
                    </span>
                  </div>
                  <PriceDeltaBadge currentPrice={valuation.finalPrice} disabled={!currentUser || valuation.isCritical} />
                </div>
                <div className="flex items-center gap-2.5 mt-0.5">
                  <AnimatedPrice
                    value={valuation.finalPrice}
                    isMasked={!currentUser}
                    isCritical={valuation.isCritical}
                    className="text-xl sm:text-2xl font-black text-emerald-700 font-outfit tracking-tight"
                  />
                  <span className="text-[10px] font-bold bg-emerald-600 text-white px-2.5 py-0.5 rounded-full shadow-xs tracking-tight">
                    {valuation.retentionPercentage}% Retained
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Quick Retention Chip for Mobile (Sleek, zero screen blocking) */}
          {step < reviewStepIndex && (
            <div className="flex sm:hidden items-center gap-1.5 self-center flex-shrink-0">
              <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full shadow-xs tracking-tight">
                {valuation.retentionPercentage}% Retained
              </span>
            </div>
          )}
        </div>

        {/* Bottom Row: Stepper Progress Indicator */}
        <div className="w-full">
          {/* Mobile Stepper Progress Bar */}
          <div className="flex sm:hidden items-center gap-3">
            <span className="text-[11px] text-slate-900 font-mono font-bold tracking-wider uppercase flex-shrink-0">
              Step {Math.min(step + 1, 7)}/7: {stepsList[Math.min(step, 6)]?.title}
            </span>
            <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 transition-all duration-500 rounded-full"
                style={{ width: `${Math.min(((step + 1) / 7) * 100, 100)}%` }}
              />
            </div>
          </div>

          {/* Desktop 7-Step Horizontal Stepper with Connecting Bar */}
          <div className="hidden sm:flex justify-between relative w-full pt-1">
            {/* Connecting Track Line — Exactly centered vertically at 18px */}
            <div className="absolute top-[22px] -translate-y-1/2 left-6 right-6 h-1 bg-slate-200 z-0 rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 via-emerald-500 to-emerald-600 transition-all duration-500 rounded-full"
                style={{ width: `${(Math.min(step, reviewStepIndex) / reviewStepIndex) * 100}%` }}
              />
            </div>

            {stepsList.map((_s, idx) => {
              const isCompleted = step > idx;
              const isActive = step === idx;

              const stepLabels = isTablet
                ? ['Core', 'Screen', 'Hardware', 'Body', 'Accessories', 'Review']
                : [
                    'Boot',
                    'Display',
                    'Body',
                    'Hardware',
                    'Connectivity',
                    showWarrantyQuestion ? 'Docs & Age' : 'Packaging',
                    'Review'
                  ];

              return (
                <div key={idx} className="relative z-10 flex flex-col items-center group cursor-pointer" onClick={() => isCompleted && setStep(idx)}>
                  <div 
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-extrabold text-xs transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-emerald-500 text-white shadow-sm ring-2 ring-emerald-500/30' 
                        : isActive 
                        ? 'bg-blue-600 text-white ring-4 ring-blue-500/30 font-black shadow-md scale-105' 
                        : 'bg-white border-2 border-slate-300 text-slate-700 font-bold'
                    }`}
                  >
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                  </div>
                  <span className={`text-[11px] font-bold mt-1.5 transition-colors ${
                    isActive 
                      ? 'text-blue-600 font-black' 
                      : isCompleted 
                      ? 'text-emerald-600 font-bold' 
                      : 'text-slate-700 font-bold'
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
          className="bg-white rounded-xl border border-ice-border p-5 sm:p-7 min-h-[380px] sm:min-h-[440px] flex flex-col justify-between overflow-hidden shadow-xl"
        >
          <AnimatePresence mode="wait">
            {/* Dedicated Tablet Diagnostic Flow (Cashify Question Set) */}
            {isTablet && step < reviewStepIndex && (
              <TabletDiagnosticFlow
                key={`tablet-flow-step-${step}`}
                model={model}
                variant={variant}
                step={step}
                rules={rules}
                selectedDefects={selectedDefects}
                setSelectedDefects={setSelectedDefects}
                warrantyAge={warrantyAge}
                setWarrantyAge={setWarrantyAge}
                showCriticalModal={showCriticalModal}
                hasWarranty={hasWarranty}
                setHasWarranty={setHasWarranty}
                formatPrice={formatPrice}
              />
            )}

            {/* STEP 0: Boot & iCloud Check */}
            {!isTablet && step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6 text-left">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <span className="text-[11px] font-mono tracking-[0.2em] text-slate-700 uppercase block font-bold">Step 1 of 6 // Critical Gates</span>
                  </div>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
                    {isApple ? 'Boot & iCloud Status' : 'Boot & Account Lock (Factory Reset Protection)'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-800 mt-2 font-medium">
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
            {!isTablet && step === 1 && (
              <motion.div
                key="step-1"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6 text-left">
                  <span className="text-[11px] font-mono tracking-[0.2em] text-slate-700 uppercase block mb-1 font-bold">Step 2 of 6 // Front & Back Glass</span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">Screen & Display Panel</h3>
                  <p className="text-xs sm:text-sm text-slate-800 mt-2 font-medium">Examine the front screen glass and the display panel carefully.</p>
                </div>

                {/* Screen Originality Question */}
                <div className="mb-6 text-left border border-ice-border/80 bg-slate-50/70 p-4 rounded-2xl">
                  <h4 className="text-xs font-bold text-ink-navy font-outfit uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-cobalt" />
                    <span>Is your phone screen original?</span>
                  </h4>
                  <p className="text-xs text-ink-muted mb-3.5 font-light leading-snug">
                    Please confirm whether your display panel is the original factory screen or if it has been replaced.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      role="radio"
                      tabIndex={0}
                      aria-checked={!selectedDefects.some(d => d.id === 'defect-screen-non-original')}
                      onKeyDown={e => handleKeyDown(e, () => {
                        setSelectedDefects(prev => prev.filter(d => d.id !== 'defect-screen-non-original'));
                      })}
                      onClick={() => {
                        setSelectedDefects(prev => prev.filter(d => d.id !== 'defect-screen-non-original'));
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                        !selectedDefects.some(d => d.id === 'defect-screen-non-original')
                          ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                          : 'border-ice-border bg-canvas-white hover:border-emerald-500/40 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        !selectedDefects.some(d => d.id === 'defect-screen-non-original') ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-600'
                      }`}>
                        <Check className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-ink-navy">Yes, Original Screen</h5>
                        <p className="text-[10px] text-ink-muted font-light mt-0.5">Original factory display panel installed</p>
                      </div>
                    </div>

                    <div
                      role="radio"
                      tabIndex={0}
                      aria-checked={selectedDefects.some(d => d.id === 'defect-screen-non-original')}
                      onKeyDown={e => handleKeyDown(e, () => {
                        const nonOriginalDefect = rules.find(r => r.id === 'defect-screen-non-original') || {
                          id: 'defect-screen-non-original',
                          category: 'screen',
                          description: 'Replaced / Non-Original Screen',
                          subText: 'Display panel has been changed or replaced with a local/aftermarket screen.',
                          deductionFixed: 0,
                          deductionPercentage: model.category === 'flagship' ? 0.40 : model.category === 'premium' ? 0.32 : 0.25
                        };
                        setSelectedDefects(prev => {
                          if (prev.some(d => d.id === 'defect-screen-non-original')) return prev;
                          return [...prev, nonOriginalDefect];
                        });
                      })}
                      onClick={() => {
                        const nonOriginalDefect = rules.find(r => r.id === 'defect-screen-non-original') || {
                          id: 'defect-screen-non-original',
                          category: 'screen',
                          description: 'Replaced / Non-Original Screen',
                          subText: 'Display panel has been changed or replaced with a local/aftermarket screen.',
                          deductionFixed: 0,
                          deductionPercentage: model.category === 'flagship' ? 0.40 : model.category === 'premium' ? 0.32 : 0.25
                        };
                        setSelectedDefects(prev => {
                          if (prev.some(d => d.id === 'defect-screen-non-original')) return prev;
                          return [...prev, nonOriginalDefect];
                        });
                      }}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-cobalt ${
                        selectedDefects.some(d => d.id === 'defect-screen-non-original')
                          ? 'border-amber-500 bg-amber-500/10 ring-1 ring-amber-500/30'
                          : 'border-ice-border bg-canvas-white hover:border-amber-500/40 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                        selectedDefects.some(d => d.id === 'defect-screen-non-original') ? 'bg-amber-500 text-white' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        <X className="w-4 h-4 stroke-[2.5]" />
                      </div>
                      <div>
                        <h5 className="font-bold text-xs text-ink-navy">No, Replaced / Local Screen</h5>
                        <p className="text-[10px] text-ink-muted font-light mt-0.5">Non-original or local display panel (Voids brand warranty)</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 text-left">
                  {/* Flawless Option */}
                  {(() => {
                    const isAnyPhysicalScreenDefectSelected = selectedDefects.some(d => d.category === 'screen' && d.id !== 'defect-screen-non-original');
                    const isSelected = screenConfirmed && !isAnyPhysicalScreenDefectSelected;
                    return (
                      <div
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          if (isSelected) {
                            setScreenConfirmed(false);
                          } else {
                            setSelectedDefects(prev => prev.filter(d => d.category !== 'screen' || d.id === 'defect-screen-non-original'));
                            setScreenConfirmed(true);
                            setStep(2);
                          }
                        })}
                        onClick={() => {
                          if (isSelected) {
                            setScreenConfirmed(false);
                          } else {
                            setSelectedDefects(prev => prev.filter(d => d.category !== 'screen' || d.id === 'defect-screen-non-original'));
                            setScreenConfirmed(true);
                            setStep(2);
                          }
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/30 scale-[1.01]'
                            : 'border-ice-border bg-canvas-white hover:border-emerald-500/40 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/25 flex items-center justify-center overflow-hidden shadow-xs">
                          {getIllustration('screen-flawless', deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-ink-navy">Perfect Display</h4>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">No scratches, micro-abrasions, cracks, or screen bleeding.</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Screen Defect Options */}
                  {(() => {
                    return rules.filter(r => r.category === 'screen' && r.id !== 'defect-screen-non-original').map(defect => {
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
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                          isSelected
                            ? 'border-rose-400 bg-rose-500/10 shadow-sm ring-1 ring-rose-400/30 scale-[1.01]'
                            : 'border-ice-border bg-canvas-white hover:border-slate-300 hover:bg-slate-50/60'
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
                          isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-ice-border bg-white'
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
            {!isTablet && step === 2 && (
              <motion.div
                key="step-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6 text-left">
                  <span className="text-[11px] font-mono tracking-[0.2em] text-slate-700 uppercase block mb-1 font-bold">Step 3 of 6 // Outer Enclosure & Hardware</span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">Body, Buttons & Frame</h3>
                  <p className="text-xs sm:text-sm text-slate-800 mt-2 font-medium">Check the frame, side buttons, bottom screws, and waterproof seal integrity.</p>
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
                            setStep(3);
                          }
                        })}
                        onClick={() => {
                          if (isSelected) {
                            setBodyConfirmed(false);
                          } else {
                            setSelectedDefects(prev => prev.filter(d => d.category !== 'body'));
                            setBodyConfirmed(true);
                            setStep(3);
                          }
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/30 scale-[1.01]'
                            : 'border-ice-border bg-canvas-white hover:border-emerald-500/40 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/25 flex items-center justify-center overflow-hidden shadow-xs">
                          {getIllustration('body-flawless', deviceType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-ink-navy">Perfect Frame</h4>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">No dents, bends, or paint scuffs. Device looks brand new.</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Body Rules */}
                  {(() => {
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
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/30 scale-[1.01]'
                            : 'border-ice-border bg-canvas-white hover:border-slate-300 hover:bg-slate-50/60'
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
                          isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-ice-border bg-white'
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
            {!isTablet && step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6 text-left">
                  <span className="text-[11px] font-mono tracking-[0.2em] text-slate-700 uppercase block mb-1 font-bold">Step 4 of 6 // Hardware Diagnostics</span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">Camera & Hardware</h3>
                  <p className="text-xs sm:text-sm text-slate-800 mt-2 font-medium">Select any failing camera, biometric, audio, or system stability issues that apply.</p>
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
                            setStep(4);
                          }
                        })}
                        onClick={() => {
                          if (isSelected) {
                            setFuncConfirmed(false);
                          } else {
                            setSelectedDefects(prev => prev.filter(d => !ids.includes(d.id)));
                            setFuncConfirmed(true);
                            setStep(4);
                          }
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/30 scale-[1.01]'
                            : 'border-ice-border bg-canvas-white hover:border-emerald-500/40 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/25 flex items-center justify-center overflow-hidden shadow-xs">
                          <ShieldCheck className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-ink-navy">Hardware Works Perfectly</h4>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">
                            Front/rear cameras, {
                              biometricType === 'face_id' ? 'Face ID' :
                              biometricType === 'touch_id' ? 'Touch ID' :
                              'fingerprint scanner'
                            }, speaker/mic, and system stability are perfect.
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Hardware / functionality rules */}
                  {(() => {
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
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                          isSelected
                            ? 'border-rose-400 bg-rose-500/10 shadow-sm ring-1 ring-rose-400/30 scale-[1.01]'
                            : 'border-ice-border bg-canvas-white hover:border-slate-300 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/10 border border-blue-500/20 flex items-center justify-center overflow-hidden shadow-xs">
                          {getIllustration(defect.id, deviceType, biometricType)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                          </div>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">{defect.subText}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-ice-border bg-white'
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
            {!isTablet && step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6 text-left">
                  <span className="text-[11px] font-mono tracking-[0.2em] text-slate-700 uppercase block mb-1 font-bold">Step 5 of 6 // Wireless, Power & Authenticity</span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">Connectivity & Verification</h3>
                  <p className="text-xs sm:text-sm text-slate-800 mt-2 font-medium">Verify battery condition, cellular/Wi-Fi antennas, and motherboard serial mappings.</p>
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
                            setStep(5);
                          }
                        })}
                        onClick={() => {
                          if (isSelected) {
                            setConnectConfirmed(false);
                          } else {
                            setSelectedDefects(prev => prev.filter(d => !ids.includes(d.id)));
                            setConnectConfirmed(true);
                            setStep(5);
                          }
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/30 scale-[1.01]'
                            : 'border-ice-border bg-canvas-white hover:border-emerald-500/40 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/25 flex items-center justify-center stroke-emerald-600">
                          <ShieldCheck className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-ink-navy">Connectivity & Battery Healthy</h4>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">
                            Battery is original/above 85%, cellular/Wi-Fi antennas are strong, and {isApple ? '3uTools checks pass' : 'hardware diagnostic checks pass'}.
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Connectivity & verification rules */}
                  {(() => {
                    return rules.filter(r => r.category === 'connectivity').map(defect => {
                      const isSelected = selectedDefects.some(d => d.id === defect.id);
                      const mutId = defect.id === 'defect-battery-80-85'
                        ? 'defect-battery-low'
                        : defect.id === 'defect-battery-low'
                        ? 'defect-battery-80-85'
                        : undefined;
                      return (
                      <div
                        key={defect.id}
                        role="checkbox"
                        tabIndex={0}
                        aria-checked={isSelected}
                        onKeyDown={e => handleKeyDown(e, () => {
                          handleToggleDefect(defect, mutId);
                          setConnectConfirmed(false);
                        })}
                        onClick={() => {
                          handleToggleDefect(defect, mutId);
                          setConnectConfirmed(false);
                        }}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-rose-500 ${
                          isSelected
                            ? 'border-rose-400 bg-rose-500/10 shadow-sm ring-1 ring-rose-400/30 scale-[1.01]'
                            : 'border-ice-border bg-canvas-white hover:border-slate-300 hover:bg-slate-50/60'
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
                          isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-ice-border bg-white'
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
            {!isTablet && step === 5 && (
              <motion.div
                key="step-5"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6 text-left">
                  <span className="text-[11px] font-mono tracking-[0.2em] text-slate-700 uppercase block mb-1 font-bold">Step 6 of 6 // Packaging & Verification Docs</span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">Accessories & Documentation</h3>
                  <p className="text-xs sm:text-sm text-slate-800 mt-2 font-medium">
                    Confirm if the original retail box, original charger/cable, {hasSpen ? 'original S-Pen stylus, ' : ''}and invoice are present.
                  </p>
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
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-emerald-500 ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-500/10 shadow-sm ring-1 ring-emerald-500/30 scale-[1.01]'
                            : 'border-ice-border bg-canvas-white hover:border-emerald-500/40 hover:bg-slate-50/60'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-500/10 border border-emerald-500/25 flex items-center justify-center stroke-emerald-600">
                          <Box className="w-7 h-7 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-sm text-ink-navy">All Accessories Included</h4>
                          <p className="text-xs text-ink-muted mt-1 font-light leading-snug">
                            Original box with matching IMEI, original charger/cable, {hasSpen ? 'S-Pen stylus, ' : ''}and purchasing receipt are present.
                          </p>
                        </div>
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Accessories options */}
                  {(() => {
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
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all duration-300 flex items-start gap-3.5 text-left focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                          isSelected
                            ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/30 scale-[1.01]'
                            : 'border-ice-border bg-canvas-white hover:border-slate-300 hover:bg-slate-50/60'
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
                          isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-ice-border bg-white'
                        }`}>
                          {isSelected && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  });
                })()}
                </div>

                {/* Device Age & Warranty Status Section — Only for eligible devices with original screen */}
                {showWarrantyQuestion && (
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
                            setWarrantyStatus('active');
                            if (warrantyAge === 'out_of_warranty') {
                              setWarrantyAge('under_3m');
                              setDeviceAge('under_3m');
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
                              ? 'border-amber-400 bg-amber-500/10 ring-1 ring-amber-400/30'
                              : 'border-ice-border bg-canvas-white hover:border-slate-300 hover:bg-slate-50/60'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${
                            hasWarranty === false ? 'bg-amber-500/15 border-amber-500/30 text-amber-600' : 'bg-slate-100 border-slate-200 text-slate-500'
                          }`}>
                            <Box className="w-5 h-5" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h5 className="font-bold text-xs text-ink-navy">No, Out of Warranty</h5>
                              <span className="text-[9px] font-mono font-bold bg-amber-500/15 text-amber-700 border border-amber-500/25 px-1.5 py-0.5 rounded">
                                Expired / No Bill
                              </span>
                            </div>
                            <p className="text-[11px] text-ink-muted mt-0.5 font-light leading-snug">
                              Warranty expired or purchase invoice not available.
                            </p>
                          </div>
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                            hasWarranty === false ? 'bg-amber-600 text-white' : 'border border-ice-border bg-white'
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
                                  ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30'
                                  : 'border-ice-border bg-canvas-white hover:border-blue-400'
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

                {/* Physical SIM / eSIM Question — Apple iPhone models only */}
                {isApple && !isWatch && !isTablet && (
                  <div className="mt-5 text-left border-t border-ice-border/60 pt-5">
                      <h4 className="text-xs font-bold text-ink-navy font-outfit uppercase tracking-wider mb-2.5">
                        Does your phone support physical SIM?
                      </h4>

                      <div className="grid grid-cols-2 gap-3">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setDualEsim(false)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setDualEsim(false); }}
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
                          role="button"
                          tabIndex={0}
                          onClick={() => setDualEsim(true)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setDualEsim(true); }}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                            dualEsim === true
                              ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-500/30'
                              : 'border-ice-border bg-canvas-white hover:border-rose-500/40 hover:bg-slate-50/50'
                          }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                            dualEsim === true ? 'bg-rose-600 text-white' : 'bg-slate-100 border border-slate-200 text-slate-500'
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
                )}
              </motion.div>
            )}

            {/* Diagnostic Review Stage */}
            {step === reviewStepIndex && (
              <motion.div
                key="step-review"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
                className="space-y-6 text-left"
              >
                <div className="border-b border-ice-border pb-4">
                  <span className="text-[11px] font-mono tracking-[0.2em] text-slate-700 uppercase block mb-1.5 font-bold">
                    Step {reviewStepIndex + 1} of {reviewStepIndex + 1} // Diagnostic Verification Review
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Diagnostic Summary Review</h3>
                  <p className="text-xs sm:text-sm text-slate-800 mt-1.5 font-bold leading-relaxed">
                    Review your completed {reviewStepIndex}-section diagnostic evaluation before generating your official trade-in quote.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl border-2 border-slate-300 bg-slate-50 shadow-xs">
                    <span className="text-[10px] font-mono text-slate-700 uppercase tracking-widest block mb-2 font-black">TARGET DEVICE</span>
                    <h4 className="font-black text-lg text-slate-950">{model.name}</h4>
                    <p className="text-xs text-blue-700 font-mono font-bold mt-0.5">
                      {variant.storageGb >= 1024 ? `${variant.storageGb / 1024}TB` : `${variant.storageGb}GB`} Storage
                      {isTablet && variant.ramGb ? ` • ${variant.ramGb}GB RAM` : ''}
                      {isTablet ? ` • ${variant.connectivity === 'cellular' || variant.color?.toLowerCase().includes('cellular') ? 'Wi-Fi + Cellular' : 'Wi-Fi Only'}` : (isApple && dualEsim !== null ? ` • ${dualEsim === true ? 'eSIM Only (US Model)' : 'Physical SIM'}` : '')}
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 shadow-xs">
                    <span className="text-[10px] font-mono text-emerald-950 uppercase tracking-widest block mb-2 font-black">ESTIMATED PAYOUT</span>
                    <AnimatedPrice
                      value={valuation.finalPrice}
                      className="font-black text-2xl text-emerald-700 font-outfit block"
                    />
                    <p className="text-xs text-emerald-900 mt-0.5 font-bold">
                      {valuation.retentionPercentage}% Value Retained
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <h4 className="text-xs sm:text-sm font-mono font-black text-slate-950 uppercase tracking-wider">
                    Declared Diagnostic Issues ({selectedDefects.length})
                  </h4>
                  {selectedDefects.length === 0 ? (
                    <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-950 text-xs sm:text-sm font-bold flex items-center gap-3 shadow-xs">
                      <Check className="w-5 h-5 text-emerald-700 flex-shrink-0 stroke-[2.5]" />
                      <span className="leading-relaxed font-bold text-emerald-950">All hardware, screen, frame, battery and accessory diagnostics passed. Device is in mint condition.</span>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedDefects.map((defect, i) => (
                        <div key={i} className="p-3 rounded-lg border-2 border-slate-300 bg-slate-50 flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-950">{defect.description}</span>
                          <span className="font-mono text-amber-800 font-bold text-[10px] bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
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
                    className="px-4 py-2.5 rounded-lg border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-900 hover:text-black font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs"
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
            {step === finalReceiptIndex && (
              <motion.div
                key="step-receipt"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="text-left"
              >
                <div className="max-w-2xl mx-auto print:max-w-none print:w-full">
                  <div id="printable-quote" className="bg-white text-slate-900 border-2 border-slate-200 rounded-xl overflow-hidden shadow-xl p-6 print:p-8 relative">
                    {/* Watermark badge */}
                    <div className="absolute -right-5 -top-5 w-24 h-24 rounded-full border-2 border-emerald-500/40 bg-emerald-50 flex items-center justify-center rotate-12 select-none pointer-events-none print-stamp">
                      <span className="text-[9px] font-mono text-emerald-800 font-bold uppercase tracking-widest">VERIFIED</span>
                    </div>

                    {/* Company Header Logo */}
                    <div className="flex items-center justify-between pb-5 mb-5 border-b border-slate-200 print-border">
                      <div className="flex items-center gap-3">
                        <img src="/logo.svg" className="w-10 h-10 object-contain rounded-md print-logo-bg flex-shrink-0 shadow-xs" alt="Rephonix Logo" />
                        <div>
                          <span className="text-xl font-extrabold text-slate-950 print-text-dark tracking-tight block leading-none">
                            Re<span className="text-blue-700 print-text-cobalt">phonix</span>
                          </span>
                          <span className="text-[10px] font-mono text-slate-600 print-text-muted tracking-wider uppercase block mt-1 font-bold">
                            Official Trade-In &amp; Diagnostic Valuation Certificate
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-600 print-text-muted uppercase block tracking-wider font-bold">
                          REF #{receiptRef}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-700 print-text-emerald font-bold uppercase tracking-widest block mt-0.5">
                          ✓ Verified Audit Passed
                        </span>
                        <span className="hidden print:block text-[9px] font-mono text-slate-500 mt-0.5">
                          Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Specification Audit Box */}
                    <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-200 print-border font-mono">
                      <div>
                        <span className="text-[10px] text-slate-600 print-text-muted uppercase block font-mono tracking-wider mb-0.5 font-bold">
                          SPECIFICATION AUDIT RECEIPT
                        </span>
                        <span className="font-extrabold text-slate-950 print-text-dark text-xl sm:text-2xl tracking-tight block">
                          {model.name}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-600 print-text-muted uppercase block font-mono tracking-wider mb-0.5 font-bold">
                          CONFIG &amp; STATUS
                        </span>
                        <span className="text-xs text-slate-900 print-text-dark font-mono font-bold block">
                          {variant.storageGb >= 1024 ? `${variant.storageGb / 1024}TB` : `${variant.storageGb}GB`}
                          {isTablet && variant.ramGb ? ` • ${variant.ramGb}GB RAM` : ''}
                          {isTablet ? ` • ${variant.connectivity === 'cellular' || variant.color?.toLowerCase().includes('cellular') ? 'Wi-Fi + Cellular' : 'Wi-Fi Only'}` : ` • ${isApple ? 'Apple iOS' : 'Android'}${isApple && dualEsim === true ? ' • eSIM Only (US Model)' : ''}`}
                        </span>
                        <span className="hidden print:inline-block text-[10px] font-mono text-emerald-700 font-bold">
                          7-Day Price Lock
                        </span>
                      </div>
                    </div>

                    {/* 6-Gate Comprehensive Diagnostic Summary (Expanded for Print) */}
                    <div className="space-y-2.5 text-xs font-mono">
                      <div className="flex justify-between items-center py-1.5 text-slate-950 print-text-dark border-b border-slate-200 print-border">
                        <span className="font-semibold">00. Base Specification ({variant.storageGb >= 1024 ? `${variant.storageGb / 1024}TB` : `${variant.storageGb}GB`}{isTablet && variant.ramGb ? `/${variant.ramGb}GB` : ''}{isTablet ? ` • ${variant.connectivity === 'cellular' || variant.color?.toLowerCase().includes('cellular') ? 'Cellular' : 'Wi-Fi'}` : ''})</span>
                        <span className="text-emerald-700 print-text-emerald font-bold text-xs font-mono">Verified Spec</span>
                      </div>

                      {/* Print-only 6-Gate Diagnostic Breakdown Matrix */}
                      <div className="hidden print:block py-2 space-y-1.5 border-b border-slate-200 print-border">
                        <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                          <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="font-semibold text-slate-800">1. Boot &amp; Security Gate</span>
                            <span className="text-emerald-700 font-bold text-[10px] font-mono">Passed // Unlocked</span>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="font-semibold text-slate-800">2. Display &amp; Touch Digitizer</span>
                            <span className="text-emerald-700 font-bold text-[10px] font-mono">Verified Inspected</span>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="font-semibold text-slate-800">3. Camera &amp; Optical Sensors</span>
                            <span className="text-emerald-700 font-bold text-[10px] font-mono">Verified Functional</span>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="font-semibold text-slate-800">4. Frame &amp; Housing Integrity</span>
                            <span className="text-emerald-700 font-bold text-[10px] font-mono">Condition Audited</span>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="font-semibold text-slate-800">5. Battery &amp; Core Hardware</span>
                            <span className="text-emerald-700 font-bold text-[10px] font-mono">Operational Passed</span>
                          </div>
                          <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                            <span className="font-semibold text-slate-800">{hasSpen ? '6. Box, S-Pen & Accessories' : '6. OEM Accessories & Box'}</span>
                            <span className="text-emerald-700 font-bold text-[10px] font-mono">Inventory Verified</span>
                          </div>
                        </div>
                      </div>

                      {valuation.deductions.length === 0 ? (
                        <div className="text-emerald-700 print-text-emerald italic py-2.5 flex items-center gap-1.5 font-mono text-xs font-semibold">
                          <Sparkles className="w-4 h-4 text-emerald-600 fill-emerald-500/20" /> [No defects declared. Maximum payout tier applies.]
                        </div>
                      ) : (
                        <div className="py-1 space-y-2">
                          <span className="hidden print:block text-[10px] font-mono font-bold text-slate-600 uppercase">Declared Adjustments:</span>
                          {valuation.deductions.map((d, i) => (
                            <motion.div 
                              key={i} 
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.15 + 0.1 }}
                              className="flex justify-between items-center text-slate-900 print-text-dark border-b border-slate-200 print-border py-1"
                            >
                              <span className="font-medium">{(i + 1).toString().padStart(2, '0')}. {getEngineeringLabel(d.description)}</span>
                              <span className="text-slate-600 font-mono text-[10px] uppercase font-bold">Assessment Verified</span>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Visual Valuation Retention Bar */}
                    <div className="mt-3 pt-3 border-t border-slate-200 print-border space-y-1.5">
                      <div className="flex justify-between text-xs font-mono text-slate-700 print-text-muted font-bold">
                        <span>Value Retention Ratio</span>
                        <span className="text-emerald-700 print-text-emerald font-bold">{valuation.retentionPercentage}% Retained</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 print-bar-bg rounded-full overflow-hidden flex border border-slate-200 print-border">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-700 rounded-full" 
                          style={{ width: `${Math.max(5, valuation.retentionPercentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Payout Summary Box */}
                    <div className="flex justify-between items-center border-t border-dashed border-slate-300 print-border pt-4 mt-4 bg-slate-50/80 print:bg-emerald-50/50 p-4 rounded-xl border border-slate-200 print:border-emerald-200">
                      <div>
                        <span className="text-slate-600 print-text-muted uppercase block text-xs font-mono font-bold">TOTAL ESTIMATED PAYOUT</span>
                        <span className="text-xs text-emerald-700 print-text-emerald uppercase tracking-wider block font-mono font-bold mt-0.5">✓ Payout Rate Locked</span>
                      </div>
                      <AnimatedPrice
                        value={valuation.finalPrice}
                        isMasked={isPriceLocked}
                        isCritical={valuation.isCritical}
                        className="text-3xl sm:text-4xl font-extrabold text-emerald-600 print-text-emerald tracking-tight font-mono font-outfit"
                      />
                    </div>

                    {/* Print-Only Official Terms & Handover Sign-off Block */}
                    <div className="hidden print:block mt-6 pt-5 border-t border-slate-300 print-border font-sans">
                      <div className="grid grid-cols-2 gap-6 text-[10px] text-slate-600 mb-6">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 block uppercase tracking-wider">Guarantee &amp; Sanitization Policy:</span>
                          <p className="leading-relaxed">
                            • Guaranteed payout locked for 7 days upon generation of reference #SCH-{receiptRef}.<br />
                            • Certified NIST 800-88 military-grade data wipe performed before device refurbishment.<br />
                            • Final payout processed instantly to UPI / Bank Account upon physical IMEI verification.
                          </p>
                        </div>
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 block uppercase tracking-wider">Pickup &amp; Support Verification:</span>
                          <p className="leading-relaxed">
                            • Free doorstep pickup across Delhi NCR with live tracking.<br />
                            • Dedicated Valuation Desk: +91 90349 97719 | support@rephonix.in<br />
                            • Rephonix Smart Device Exchange Services | www.rephonix.in
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-8 pt-4 border-t border-dashed border-slate-300">
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-6">Customer Verification &amp; Handover</span>
                          <div className="border-b border-slate-400 w-4/5 mb-1" />
                          <span className="text-[9px] font-mono text-slate-600">Signature &amp; Date</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-mono text-slate-500 uppercase block mb-6">Certified Diagnostic Field Officer</span>
                          <div className="border-b border-slate-400 w-4/5 mb-1" />
                          <span className="text-[9px] font-mono text-slate-600">Technician ID &amp; Digital Seal</span>
                        </div>
                      </div>
                    </div>

                    {/* Not satisfied with the price? Contact Us Banner */}
                    <div className="mt-5 bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs print:hidden">
                      <div>
                        <h4 className="font-bold text-slate-950 text-sm sm:text-base tracking-tight">
                          Not satisfied with the price?
                        </h4>
                        <p className="text-xs sm:text-sm text-slate-600 mt-0.5 font-medium">
                          Please connect with our team
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setContactModalOpen(true)}
                        className="text-blue-700 hover:text-blue-900 font-bold text-xs sm:text-sm hover:underline cursor-pointer transition-colors flex-shrink-0 self-end sm:self-auto"
                      >
                        Contact Us
                      </button>
                    </div>

                    <p className="text-[10px] text-slate-500 mt-4 italic text-center font-mono">
                      Estimated Trade-In Value. Final offer is subject to physical inspection, IMEI/device verification and diagnostic confirmation.
                    </p>
                  </div>

                  {/* Saved Quote notification banner */}
                  {saveToast && (
                    <motion.div 
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-3 p-3 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-semibold flex items-center justify-between shadow-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-600 stroke-[3] flex-shrink-0" />
                        <span>{saveToast}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setSaveToast(null)} 
                        className="text-emerald-700 hover:text-emerald-950 font-bold ml-2 text-xs"
                      >
                        ✕
                      </button>
                    </motion.div>
                  )}

                  <div className="flex flex-wrap sm:flex-nowrap gap-2.5 sm:gap-3 mt-4">
                    <button
                      type="button"
                      onClick={() => setStep(reviewStepIndex)}
                      className="px-3.5 sm:px-4 py-3 rounded-lg border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-900 hover:text-black font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Review</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => window.print()}
                      aria-label="Print diagnostic report and quote"
                      className="flex-shrink-0 px-3.5 sm:px-4 py-3 rounded-lg border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-900 hover:text-black transition-all flex items-center gap-1.5 sm:gap-2 text-xs font-bold shadow-xs"
                    >
                      <Printer className="w-4 h-4" aria-hidden="true" />
                      <span>Print</span>
                    </button>

                    {/* Save Quote Button */}
                    <button
                      type="button"
                      onClick={handleSaveQuote}
                      aria-label="Save quote to profile"
                      className={`flex-shrink-0 px-3.5 sm:px-4 py-3 rounded-lg border-2 transition-all flex items-center gap-1.5 sm:gap-2 text-xs font-bold shadow-xs cursor-pointer ${
                        isQuoteSaved 
                          ? 'bg-amber-50 border-amber-400 text-amber-900 font-extrabold' 
                          : 'border-slate-300 bg-white hover:bg-slate-100 text-slate-900 hover:text-black'
                      }`}
                    >
                      <Bookmark className={`w-4 h-4 ${isQuoteSaved ? 'text-amber-600 fill-amber-500' : 'text-slate-600'}`} />
                      <span>{isQuoteSaved ? 'Quote Saved' : 'Save Quote'}</span>
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
          {step < reviewStepIndex && (
            <div className="flex flex-row justify-between items-center gap-3 border-t border-slate-200 pt-5 mt-6">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2.5 rounded-lg border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-900 hover:text-black font-bold text-xs transition-all flex items-center gap-1.5 shadow-xs"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>
                <span className="hidden sm:inline-block text-[10px] font-mono text-slate-600 font-bold uppercase tracking-wider pl-2">
                  Step {step + 1} of {reviewStepIndex + 1}
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
                <span>{step === (reviewStepIndex - 1) ? 'Review Diagnostics' : 'Next Step'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* Cashify-style Price Lock Modal */}
      {lockModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full bg-white rounded-t-2xl sm:rounded-xl overflow-hidden shadow-2xl flex flex-col md:flex-row text-left border border-slate-200 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto my-2.5 sm:hidden flex-shrink-0" />
            {/* Close Button */}
            <button 
              type="button"
              onClick={() => setLockModalOpen(false)} 
              className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 z-10 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
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
            <div className="w-full md:w-7/12 p-6 sm:p-8 flex flex-col justify-center bg-white font-sans">
              
              {/* Product Info Box */}
              <div className="border border-slate-200 rounded-lg p-3.5 flex items-center gap-3.5 mb-5 bg-slate-50">
                <div className="w-12 h-12 bg-white border border-slate-200 rounded-md flex items-center justify-center p-1 flex-shrink-0">
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
                  <h4 className="font-bold text-sm text-slate-900 leading-tight">{model.name}</h4>
                  <p className="text-xs text-slate-600 mt-0.5">
                    {variant.storageGb ? (variant.storageGb >= 1024 ? `${variant.storageGb / 1024}TB` : `${variant.storageGb}GB`) : ''}
                    {variant.ramGb ? ` • ${variant.ramGb}GB RAM` : ''}
                    {variant.color && (variant.color.includes('Wi-Fi') || variant.color.includes('Cellular')) ? ` • ${variant.color}` : ''}
                  </p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-[10px] font-mono font-semibold text-slate-500 uppercase tracking-wider">Selling Price:</span>
                    <span className="text-sm font-extrabold text-red-600 font-mono">₹ XX,XXX</span>
                  </div>
                </div>
              </div>

              {/* Price Unlock Notice */}
              <div className="bg-blue-50 border border-blue-200 rounded-md p-2.5 flex items-center gap-2 mb-5 text-blue-700 text-xs font-semibold">
                <Lock className="w-4 h-4 flex-shrink-0 animate-pulse text-blue-700" />
                <span>Login to unlock the best price</span>
              </div>

              {/* Error Box */}
              {modalError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-2.5 rounded-md text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalStage === 'email' && (
                /* Stage 1: Email address entry */
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="modalEmail" className="text-xs font-mono font-bold tracking-wider text-slate-700 uppercase block mb-1.5">
                      Enter your email address
                    </label>
                    <div className="relative flex rounded-md overflow-hidden border border-slate-300 focus-within:border-blue-500 transition-colors">
                      <span className="bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 flex items-center border-r border-slate-300">
                        <Mail className="w-4 h-4 text-slate-500" />
                      </span>
                      <input
                        id="modalEmail"
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="w-full px-3 py-2 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
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
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500/30 border-slate-300 rounded"
                      />
                    </div>
                    <div className="ml-2.5 text-xs text-left">
                      <label htmlFor="modalTerms" className="font-normal text-slate-600">
                        I agree to the{' '}
                        <span className="text-blue-600 hover:underline cursor-pointer font-semibold" onClick={() => alert('Terms of Service: By unlocking your price, you verify device details are correctly declared.')}>
                          Terms &amp; Conditions
                        </span>{' '}
                        &amp; Privacy Policy.
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full flex justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
                  >
                    {modalLoading ? 'Checking...' : 'CONTINUE'}
                  </button>
                </form>
              )}

              {modalStage === 'password' && (
                /* Stage 2: Password entry (existing account) */
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <div className="text-left mb-2">
                    <h5 className="font-bold text-sm text-slate-900">Welcome Back!</h5>
                    <p className="text-xs text-slate-600 font-normal mt-1 leading-relaxed">
                      An account with <span className="font-semibold text-slate-900">{emailInput}</span> already exists. Please login to unlock your price.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="modalPassword" className="text-xs font-mono font-bold tracking-wider text-slate-700 uppercase block mb-1.5">
                      Enter Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="modalPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full pl-9 pr-10 py-2.5 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="Enter account password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <button 
                      type="button"
                      onClick={() => { setModalStage('email'); setModalError(''); }}
                      className="text-blue-600 hover:text-blue-700 hover:underline font-semibold"
                    >
                      Use different email
                    </button>
                    <button
                      type="button"
                      onClick={handleInitiateForgotPassword}
                      disabled={modalLoading}
                      className="text-blue-600 hover:text-blue-700 hover:underline font-semibold disabled:opacity-50"
                    >
                      {modalLoading ? 'Sending code...' : 'Forgot password?'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full flex justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
                  >
                    {modalLoading ? 'Logging in...' : 'LOGIN & UNLOCK'}
                  </button>
                </form>
              )}

              {modalStage === 'signup' && (
                /* Stage 3: Signup info fields (new account) */
                <form onSubmit={handleSignupSubmit} className="space-y-3.5">
                  <div className="text-left mb-2">
                    <h5 className="font-bold text-sm text-slate-900">Create Account</h5>
                    <p className="text-xs text-slate-600 font-normal mt-1 leading-relaxed">
                      Please fill in your details to create an account and unlock the price.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="modalName" className="text-xs font-mono font-bold tracking-wider text-slate-700 uppercase block mb-1">
                      Full Name
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <User className="w-4 h-4" />
                      </span>
                      <input
                        id="modalName"
                        type="text"
                        required
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="Enter full name"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="modalPhone" className="text-xs font-mono font-bold tracking-wider text-slate-700 uppercase block mb-1">
                      Mobile Number
                    </label>
                    <div className="relative flex rounded-md overflow-hidden border border-slate-300 focus-within:border-blue-500 transition-colors">
                      <span className="bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 flex items-center border-r border-slate-300">
                        +91
                      </span>
                      <input
                        id="modalPhone"
                        type="tel"
                        maxLength={10}
                        required
                        value={phoneInput}
                        onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
                        placeholder="Enter Mobile"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="modalSignupPassword" className="text-xs font-mono font-bold tracking-wider text-slate-700 uppercase block mb-1">
                      Create Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="modalSignupPassword"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="Min 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <button 
                      type="button"
                      onClick={() => { setModalStage('email'); setModalError(''); }}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Change email address
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full flex justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
                  >
                    {modalLoading ? 'Sending OTP...' : 'CONTINUE & SEND OTP'}
                  </button>
                </form>
              )}

              {modalStage === 'otp' && (
                /* Stage 4: OTP Verification code */
                <form onSubmit={handleOtpVerifySubmit} className="space-y-4">
                  <div className="text-left mb-2">
                    <h5 className="font-bold text-sm text-slate-900">Verify Email Address</h5>
                    <p className="text-xs text-slate-600 font-normal mt-1 leading-relaxed">
                      Please enter the 6-digit OTP code sent to <span className="font-semibold text-slate-900">{emailInput}</span>.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="modalOtp" className="text-xs font-mono font-bold tracking-wider text-slate-700 uppercase block mb-1.5">
                      Verification Code
                    </label>
                    <input
                      id="modalOtp"
                      type="text"
                      maxLength={6}
                      required
                      value={otpInput}
                      onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full tracking-[0.5em] text-center font-bold pl-3 py-2 bg-white border border-slate-300 rounded-md text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                      placeholder="000000"
                    />
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <button 
                      type="button"
                      onClick={() => { setModalStage('email'); setModalError(''); }}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Change email address
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full flex justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
                  >
                    {modalLoading ? 'Verifying OTP...' : 'VERIFY & UNLOCK'}
                  </button>
                </form>
              )}

              {modalStage === 'forgot_reset' && (
                /* Stage 5: Forgot Password Reset */
                <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5">
                  <div className="text-left mb-2">
                    <h5 className="font-bold text-sm text-slate-900">Reset Password</h5>
                    <p className="text-xs text-slate-600 font-normal mt-1 leading-relaxed">
                      Enter the 6-digit code sent to <span className="font-semibold text-slate-900">{emailInput}</span> and create your new password.
                    </p>
                  </div>

                  {forgotSuccess && (
                    <div className="bg-emerald-50 border border-emerald-300 text-emerald-700 p-2.5 rounded-md text-xs font-semibold flex items-center gap-2">
                      <Check className="w-4 h-4 flex-shrink-0" />
                      <span>{forgotSuccess}</span>
                    </div>
                  )}

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label htmlFor="modalForgotOtp" className="text-xs font-mono font-bold tracking-wider text-slate-700 uppercase">
                        6-Digit Reset Code
                      </label>
                      <button
                        type="button"
                        onClick={handleResendForgotOtp}
                        disabled={forgotCooldown > 0 || modalLoading}
                        className="text-xs text-blue-600 hover:underline font-semibold disabled:opacity-50 disabled:no-underline"
                      >
                        {forgotCooldown > 0 ? `Resend in ${forgotCooldown}s` : 'Resend code'}
                      </button>
                    </div>
                    <input
                      id="modalForgotOtp"
                      type="text"
                      maxLength={6}
                      required
                      value={forgotOtpInput}
                      onChange={(e) => setForgotOtpInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full tracking-[0.5em] text-center font-bold pl-3 py-2 bg-white border border-slate-300 rounded-md text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                      placeholder="000000"
                    />
                  </div>

                  <div>
                    <label htmlFor="modalForgotNewPassword" className="text-xs font-mono font-bold tracking-wider text-slate-700 uppercase block mb-1">
                      New Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="modalForgotNewPassword"
                        type={showForgotNewPassword ? 'text' : 'password'}
                        required
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="Min 6 characters"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotNewPassword(!showForgotNewPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                        aria-label={showForgotNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showForgotNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="modalForgotConfirmPassword" className="text-xs font-mono font-bold tracking-wider text-slate-700 uppercase block mb-1">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        id="modalForgotConfirmPassword"
                        type={showForgotConfirmPassword ? 'text' : 'password'}
                        required
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        className="w-full pl-9 pr-10 py-2 bg-white border border-slate-300 rounded-md text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 transition-all"
                        placeholder="Re-enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowForgotConfirmPassword(!showForgotConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-700"
                        aria-label={showForgotConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showForgotConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <button 
                      type="button"
                      onClick={() => { setModalStage('password'); setModalError(''); setForgotSuccess(''); }}
                      className="text-blue-600 hover:underline font-semibold"
                    >
                      Back to Login
                    </button>
                    <button 
                      type="button"
                      onClick={() => { setModalStage('email'); setModalError(''); setForgotSuccess(''); }}
                      className="text-slate-500 hover:text-slate-700 hover:underline font-medium"
                    >
                      Change email
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={modalLoading}
                    className="w-full flex justify-center py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold text-xs uppercase tracking-wider transition-all shadow-md disabled:opacity-50"
                  >
                    {modalLoading ? 'Resetting Password...' : 'RESET PASSWORD & UNLOCK'}
                  </button>
                </form>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Best Price Negotiation & Support Contact Modal */}
      {contactModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="relative max-w-lg w-full bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-2xl border border-slate-200 text-left p-6 sm:p-7 animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
            {/* Mobile Drag Indicator */}
            <div className="w-12 h-1 bg-slate-300 rounded-full mx-auto mb-3 sm:hidden" />
            {/* Close button */}
            <button 
              type="button"
              onClick={() => {
                setContactModalOpen(false);
                setBestPriceSubmitted(false);
              }} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cobalt/10 text-cobalt flex items-center justify-center flex-shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 font-outfit leading-snug">
                  Get The Best Price Guaranteed
                </h3>
                <p className="text-xs text-slate-600">
                  Have a better offer or want a custom quote? Connect with our team!
                </p>
              </div>
            </div>

            {/* Device & Valuation Summary */}
            <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 mb-5 flex justify-between items-center text-xs">
              <div>
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">DEVICE</span>
                <span className="font-bold text-slate-900">{model.name} ({variant.storageGb}GB)</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">CURRENT QUOTE</span>
                <span className="font-extrabold text-emerald-700 text-sm font-outfit">{formatPrice(valuation.finalPrice)}</span>
              </div>
            </div>

            {bestPriceSubmitted ? (
              <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-5 text-center space-y-2 my-2 animate-fadeIn">
                <div className="w-10 h-10 rounded-full bg-emerald-600 text-white mx-auto flex items-center justify-center">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="font-bold text-emerald-900 text-sm">Best Price Request Received!</h4>
                <p className="text-xs text-emerald-800">
                  Our pricing desk is evaluating your request for <strong>{model.name}</strong>. We will call/WhatsApp you at <strong>+91 {contactPhone}</strong> within 15 minutes with our best revised offer!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setContactModalOpen(false);
                    setBestPriceSubmitted(false);
                  }}
                  className="mt-2 text-xs font-bold text-emerald-800 underline hover:no-underline"
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
                  <div className="flex-grow border-t border-slate-200" />
                  <span className="flex-shrink mx-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest font-bold">Or Request Price Match</span>
                  <div className="flex-grow border-t border-slate-200" />
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
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">
                      Your Mobile / WhatsApp Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="10-digit mobile number"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-cobalt outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">
                      Your Target Expected Price (₹)
                    </label>
                    <input
                      type="number"
                      placeholder={`e.g. ₹${Math.round(valuation.finalPrice * 1.1)}`}
                      value={expectedPrice}
                      onChange={(e) => setExpectedPrice(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 focus:ring-2 focus:ring-cobalt outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-800 block mb-1">
                      Comments (Optional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="e.g. Additional details or target price notes..."
                      value={contactNote}
                      onChange={(e) => setContactNote(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-sans text-slate-900 focus:ring-2 focus:ring-cobalt outline-none resize-none"
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
                <div className="pt-2 text-center border-t border-slate-200">
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
                    className="text-xs text-slate-600 hover:text-cobalt font-semibold inline-flex items-center gap-1"
                  >
                    Or visit our full Contact Page <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Floating Bottom HUD & Quick Action */}
      <MobileBottomHUD
        step={step}
        finalPrice={valuation.finalPrice}
        retentionPercentage={valuation.retentionPercentage}
        isCritical={valuation.isCritical}
        isLoggedIn={!!currentUser}
        canProceed={isStepValidated}
        onNext={handleNextStep}
        onBack={handlePrevStep}
        reviewStepIndex={reviewStepIndex}
        nextLabel={step === (reviewStepIndex - 1) ? 'Review' : 'Next'}
      />
    </div>
  );
};
