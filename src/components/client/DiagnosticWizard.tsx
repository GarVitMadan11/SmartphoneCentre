import React, { useState, useMemo, useRef } from 'react';
import { Model, Variant, getDefectRulesForCategory, DefectRule, isAppleDevice, isSmartwatchDevice, isTabletDevice, hasSpenSupport, getBiometricType, getDeviceImage, getModelScreenDeduction, getModelWarrantyDeductionPercentage } from '../../data/mockDatabase';
import { calculateValuation } from '../../utils/valuation';
import { type AgeFactorKey } from '../../data/pricingRulesConfig';
import {
  ArrowLeft, Check, CheckCircle2, ChevronRight, Activity,
  Smartphone, Box, ShieldCheck, Printer, Receipt,
  X, Lock, Eye, EyeOff, AlertCircle, Mail, User,
  Phone, MessageSquare, ExternalLink, Headphones, Send, Bookmark,
  AlertTriangle, BatteryCharging, Radio, FileX, FileCheck, Zap, Tag
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIllustration } from './Illustrations';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { checkEmail, customerLogin, customerSignup, verifyOtp, requestPasswordResetOtp, resetPasswordWithOtp, sendQuoteAlertApi, sendPriceMatchAlertApi, sendStepLeadAlertApi, syncFirebaseUser, validateCouponApi, ApiUser } from '../../utils/api';
import { loginWithGoogle } from '../../services/firebaseAuth';
import { saveQuote, isQuoteAlreadySaved, associateGuestQuotes } from '../../utils/savedQuotes';
import { TabletDiagnosticFlow } from './TabletDiagnosticFlow';
import { AnimatedPrice } from './wizard/AnimatedPrice';
import { PriceDeltaBadge } from './wizard/PriceDeltaBadge';
import { MobileBottomHUD } from './wizard/MobileBottomHUD';

const getEngineeringLabel = (description: string) => {
  const mapping: { [key: string]: string } = {
    'Cracked Screen / Back Glass': 'Screen Restoration Fee',
    'Cracked Front Screen Glass': 'Screen Restoration Fee',
    'Back Glass Broken / Cracked': 'Rear Glass Restoration Fee',
    'Minor / Hairline Scratches': 'Surface Micro-Buffing Fee',
    'Front Glass Scratches / Bubbles': 'Glass Micro-Polishing Fee',
    'Screen Burn-in / Lines': 'Display Panel Replacement Fee',
    'Touch / Swipe Unresponsive': 'Digitizer / Touch Layer Repair',
    'True Tone Not Working': 'Original Display Certification Fee',
    'Replaced / Non-Original Screen': 'Locally Replaced Screen Deduction',
    'Inner Display Crease Damage / Bubbling': 'Flexible Folding Display Panel & Crease Assembly Repair',
    'Display Calibration / Tint Issue': 'Display Panel Recalibration Levy',
    'Hinge Faulty / Does Not Fold Flat': 'Hinge Mechanism & Folding Chassis Restoration',
    'Dented or Bent Frame': 'Chassis Structure Re-alignment',
    'Scuffed Frame / Normal Wear': 'Frame Bead-Blasting & Refinishing',
    'Air Pass / Waterproof Seal Fail': 'IP Seal & Gasket Replacement',
    'Side Buttons Faulty': 'Button Flex Cable Repair Fee',
    'Screws Stripped / Missing': 'Pentalobe Hardware Replacement',
    'Bottom Screws Stripped / Missing': 'Chassis Hardware Replacement',
    'Camera Faulty / Lens Blur': 'Optical Sensor Recalibration',
    'Camera Glass Cracked / Chipped': 'Camera Lens Glass Replacement Fee',
    'Battery Health < 80%': 'Battery Module Replacement',
    'Battery Health < 80% (Service Alert)': 'Battery Module Replacement Fee',
    'Battery Health < 80% or Service Alert': 'Battery Module Replacement Fee',
    'Battery Faulty / Rapid Drain / Sudden Shutdown': 'Battery Module Replacement Fee',
    'Non-Genuine Battery Warning': 'Original Battery Compliance Levy',
    'Battery Replaced / Duplicate Battery': 'Non-Original Battery Fee',
    'Non-OEM / Battery Warning Alert': 'Non-Original Battery Warning Levy',
    'Network, Calling & SIM Issues': 'Cellular Modem / SIM Tray Repair',
    'Wi-Fi & Bluetooth Issues': 'Antenna & Wireless Module Repair',
    '3uTools Serial Mismatch': 'Counterfeit Parts Detection Levy',
    'PC Diagnostic Serial Mismatch': 'Hardware Serial Mismatch Levy',
    'Speakers / Microphone Faulty': 'Audio Assembly Replacement Fee',
    'Auto-Restart / Unstable Device': 'PMIC / Board-Level Stabilisation',
    'Missing Original Box': 'Original Retail Box Missing Deduction',
    'Missing Original Charger / Cable': 'Original Charger Missing Deduction',
    'Missing Original Charging Cable': 'Original Charging Cable Missing Deduction',
    'Missing Original S-Pen': 'Original S-Pen Stylus Missing Deduction',
    'Missing Original S-Pen / Stylus': 'Original S-Pen Stylus Missing Deduction',
    'Missing Apple Pencil': 'Apple Pencil Stylus Missing Deduction',
    'Missing Bill / Customer Photo ID': 'Legal Compliance Documentation Fee',
    'Single SIM Regional Variant Adjustment': 'Single SIM Variant Engineering Adjustment',
    'Dual eSIM Configuration Deduction (iPhone 14–16 Pro Series)': 'US Model Dual eSIM Architecture Adjustment',
    'Dual eSIM Configuration Deduction (iPhone 17 Pro Series)': 'US Model Dual eSIM Architecture Adjustment',
    'Dual eSIM Configuration Deduction (iPhone 17–18 Pro Series)': 'US Model Dual eSIM Architecture Adjustment',
    'Dual eSIM Configuration Deduction (iPhone 17–18 Series)': 'US Model Dual eSIM Architecture Adjustment',
    'Dual eSIM Configuration Deduction (Apple iPhone Series)': 'US Model Dual eSIM Architecture Adjustment',
    'Device Does Not Turn On': 'Board-Level Hardware Failure',
    'iCloud / Apple ID Locked': 'Activation Lock — Zero Resale Value',
    'Google Account / Factory Reset Protection Locked': 'Factory Reset Protection Lock — Zero Resale Value',
    'Biometrics Faulty (Face ID)': 'TrueDepth Sensor Array Security Fee',
    'Biometrics Faulty (Touch ID)': 'Touch ID Biometric Sensor Security Fee',
    'Biometrics Faulty (Fingerprint / Face Unlock)': 'Biometric Sensor Security Fee',
    'Biometrics Faulty (Fingerprint Scanner)': 'Biometric Sensor Security Fee',
    'Face ID (TrueDepth Sensor) Faulty': 'TrueDepth Sensor Array Security Fee',
    'Touch ID (Home Button) Sensor Faulty': 'Touch ID Biometric Sensor Security Fee',
    'Fingerprint Scanner / Biometrics Faulty': 'Biometric Sensor Security Fee',
    'Battery Health 80% – 85%': 'Battery Capacity Degradation Fee',
    'Original Battery Health 80% – 85%': 'Battery Capacity Degradation Fee',
    'Battery Health 80% – 85% (Moderate Drain)': 'Battery Capacity Degradation Fee',
    'Battery Health < 80% / Heavy Drain': 'Battery Module Replacement Fee',

    // Smartwatch specific engineering fee labels
    'Cracked Watch Glass / Sapphire Dial': 'Watch Glass / Sapphire Dial Restoration',
    'Cracked Super AMOLED / Gorilla Glass': 'Super AMOLED Glass Panel Restoration',
    'Glass Lens & Bezel Micro-Scratches': 'Watch Glass & Bezel Micro-Polishing',
    'Always-On Display Burn-in / Lines': 'Watch Display Module Replacement',
    'Touchscreen / Touch Bezel Unresponsive': 'Digitizer / Rotary Touch Repair',
    'Titanium / Aluminum Casing Dented': 'Titanium Casing Structural Re-alignment',
    'Armor Aluminum / Stainless Casing Dented': 'Armor Aluminum Casing Refinishing',
    'Digital Crown / Action Button Faulty': 'Digital Crown & Action Flex Repair',
    'Rotating Bezel / Home Button Faulty': 'Rotary Bezel Mechanism Repair',
    'Water Resistance Seal Fail (50m/100m)': '50m/100m Swim Gasket & Seal Replacement',
    'Original Watch Band / Strap Missing or Heavy Damage': 'Original Watch Band Missing Deduction',
    'PPG Heart Rate & SpO2 Sensor Faulty': 'PPG Health Sensor Array Recalibration',
    'ECG App / Electrical Heart Sensor Fail': 'ECG Electrode Controller Compliance Levy',
    'ECG / BIA Body Composition Sensor Fail': 'BIA Body Composition Sensor Recalibration',
    'Fall & Crash Detection Sensors Faulty': 'Motion Gyroscope & Fall Sensor Repair',
    'Speaker, Mic or Emergency Siren Faulty': 'Audio & Emergency Siren Assembly Fee',
    'Speaker / Microphone Call Audio Faulty': 'Speaker & Microphone Assembly Fee',
    'Wireless Magnetic Receiver Charge Faulty': 'Inductive Charging Receiver Coil Repair',
    'Cellular / LTE eSIM Functionality Faulty': 'eSIM Modem Transceiver Recalibration',
    'Wi-Fi, Bluetooth & Dual-Frequency GPS Fail': 'Wireless Antenna & GPS Array Repair',
    'Missing Original Magnetic Fast Charging Puck': 'Original Magnetic Fast Charger Missing Deduction',
    'Missing Original Retail Watch Box': 'Original Watch Retail Box Missing Deduction',
    'Smartwatch Does Not Turn On': 'Watch Logic Board Hardware Failure',
    'iCloud / Apple Watch Activation Locked': 'Activation Lock — Zero Resale Value',
    'Samsung Account / Google Knox Lock Active': 'Knox Lock — Zero Resale Value',

    // Tablet specific engineering fee labels
    'Tablet Does Not Turn On': 'Logic Board Hardware Failure',
    'Cellular Network Not Working': 'Baseband Cellular Modem Repair',
    'SIM Tray Missing or Damaged': 'SIM Tray Hardware Replacement',
    'Touch Screen Not Working Properly': 'Digitizer Layer Replacement',
    'Screen Replaced at Local Shop (Non-Original)': 'Locally Replaced Screen Deduction',
    '1-2 Scratches on Screen': 'Display Glass Micro-Polishing',
    'More Than 2 Scratches on Screen': 'Display Surface Resurfacing Fee',
    'Chipped Outside Display Area': 'Bevel Edge Glass Restoration',
    'Screen Cracked / Glass Broken': 'Display Glass Restoration Fee',
    'Minor Discoloration on Screen': 'Color Profile Recalibration Fee',
    'Major Discoloration on Screen': 'Display Panel Replacement Fee',
    'Screen Shading / Fading': 'Backlight Uniformity Restoration',
    '1-2 Very Small White Spots on Screen': 'Diffuser Pressure Spot Repair',
    '3 or More White Spots / Coloured Spots': 'Sub-Pixel Defect Recovery Fee',
    'Lines Visible on Screen': 'Display Driver IC / Panel Replacement',
    'Light Leaks Around Edges of Display': 'Bezel Optical Gasket Re-sealing',
    'Front Camera Not Working': 'Front Camera Sensor Recalibration',
    'Back Camera Not Working': 'Rear Camera Sensor Replacement',
    'Camera Glass Broken / Missing': 'Camera Lens Glass Replacement',
    'Finger / Touch ID Sensor Not Working': 'Biometric Touch ID Security Fee',
    'Face Sensor (Face ID) Not Working': 'TrueDepth Sensor Array Security Fee',
    'Wi-Fi Not Working': 'Wi-Fi Transceiver Module Repair',
    'GPS Not Working': 'GPS Satellite Receiver Repair',
    'Bluetooth Not Working': 'Bluetooth Antenna Array Repair',
    'Audio Jack Not Working': '3.5mm Headphone Jack Assembly Fee',
    'Volume Button Missing / Not Working': 'Volume Button Flex Cable Repair',
    'Power Button Broken / Not Working / Missing': 'Power Button Hardware Replacement',
    'Charging Defect; Unable to Charge': 'USB-C / Power Port Repair',
    'Battery Faulty or Not Working': 'Battery Module Replacement',
    'Microphone Not Working': 'Microphone Array Assembly Fee',
    'Speaker Not Working; Faulty or Cracked Sound': 'Speaker Chamber Replacement Fee',
    '1-2 Scratches on Body': 'Body Micro-Buffing & Clean Fee',
    'More Than 2 Scratches on Body': 'Chassis Surface Bead-Blasting',
    '1-2 Minor Dents on Body': 'Chassis Edge Re-contouring',
    'Major Dent(s) or More Than 2 Dents': 'Chassis Structural Re-alignment',
    'Body Bent': 'Chassis Unbending & Frame Trueing',
    'Loose Screen': 'Display Frame Adhesive Re-bonding',
    'Both Bent and Loose Screen': 'Chassis Frame & Display Realignment',
    'Visible Gap Between Body and Back Panel': 'Enclosure Seam Re-alignment',
    'Back Panel Chipped on Edges': 'Back Panel Edge Restoration',
    'Back Panel Broken / Shattered': 'Rear Enclosure Replacement Fee',
    'Back Panel Missing': 'Chassis Housing Replacement Fee',
    'Missing Original Tablet Charger': 'Original Tablet Fast Charger Missing Deduction',
    'Missing Box With Same IMEI / Serial': 'Original Retail Box Missing Deduction',
    'Missing GST Valid Bill With Same IMEI / Serial': 'GST Tax Compliance Verification Fee'
  };
  return mapping[description] || description;
};

// Wizard flags are session-only — not persisted to localStorage

interface DiagnosticWizardProps {
  model: Model;
  variant: Variant;
  onBack: () => void;
  onComplete: (finalPrice: number, selectedDefects: DefectRule[], couponData?: { appliedCoupon?: string; bonusAmount?: number }) => void;
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

  // Dynamic Cycle Tier: Only ask for warranty if model is Tier 1 (Current/Recent Cycle <= 1 year old, releaseYear >= 2024)
  const isEligibleForWarranty = useMemo(() => {
    if (model.supportsWarrantyQuestion !== undefined) {
      return model.supportsWarrantyQuestion;
    }
    const resolvedYear = model.releaseYear ?? 2024;
    // Matured models (< 2024) trade on secondary market rates with zero warranty penalty (matches Cashify)
    if (resolvedYear < 2024) {
      return false;
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
    return true;
  }, [model, isApple]);

  const isScreenNonOriginal = useMemo(() => {
    return selectedDefects.some(d => d.id === 'defect-screen-non-original' || d.id === 'defect-screen-truetone');
  }, [selectedDefects]);

  const showWarrantyQuestion = useMemo(() => {
    return isEligibleForWarranty && !isScreenNonOriginal;
  }, [isEligibleForWarranty, isScreenNonOriginal]);

  const [deviceAge, setDeviceAge] = useState<AgeFactorKey>('under_3m');
  const [warrantyAge, setWarrantyAge] = useState<'under_3m' | '3_to_6m' | '6_to_11m' | 'out_of_warranty'>('under_3m');
  const [selectedWarrantyAge, setSelectedWarrantyAge] = useState<'under_3m' | '3_to_6m' | '6_to_11m' | null>(null);
  const [hasWarranty, setHasWarranty] = useState<boolean | null>(null);
  const [dualEsim, setDualEsim] = useState<boolean | null>(null);
  const [_warrantyStatus, setWarrantyStatus] = useState<'active' | 'expiring_soon' | 'expired' | 'unverified'>(
    isEligibleForWarranty ? 'active' : 'expired'
  );



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
      { title: 'Core Assessment', icon: ShieldCheck, desc: 'Device power & calling assessment' },
      { title: 'Display Panel', icon: Smartphone, desc: 'Touch, screen glass & burn-in' },
      { title: 'Body & Frame', icon: Smartphone, desc: 'Chassis, buttons, screws & seal' },
      { title: 'Hardware', icon: Activity, desc: 'Cameras, biometrics & audio' },
      { title: 'Connectivity', icon: Radio, desc: 'Battery, cellular, Wi-Fi & serial' },
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
  const [icloudChecked, setIcloudChecked] = useState<'clear' | 'locked' | null>('clear');
  const [powerChecked, setPowerChecked] = useState<'working' | 'dead' | null>(null);
  const [callingChecked, setCallingChecked] = useState<'working' | 'faulty' | null>(null);

  // Auto-scroll back up smoothly whenever the wizard step changes or on initial mount
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    const el = document.getElementById('wizard-top');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [step]);

  React.useEffect(() => {
    if (step > 0) {
      if (powerChecked === null) {
        const hasPowerDefect = selectedDefects.some(d => d.id === 'defect-critical-power');
        setPowerChecked(hasPowerDefect ? 'dead' : 'working');
      }
      if (callingChecked === null) {
        const hasNetDefect = selectedDefects.some(d => d.id === 'defect-func-network');
        if (hasNetDefect) setCallingChecked('faulty');
      }
    }
  }, [step, powerChecked, callingChecked, selectedDefects]);

  const handleSelectPowerOn = () => {
    setPowerChecked('working');
    setSelectedDefects(prev => prev.filter(d => d.id !== 'defect-critical-power'));
  };

  const handleSelectCalling = (status: 'working' | 'faulty') => {
    setCallingChecked(status);
    if (status === 'working') {
      setSelectedDefects(prev => prev.filter(d => d.id !== 'defect-func-network'));
    } else {
      const netRule = rules.find(r => r.id === 'defect-func-network') || {
        id: 'defect-func-network',
        category: 'connectivity' as const,
        description: 'Network, Calling & SIM Issues',
        subText: 'No cellular signal, call audio breaks, or SIM issue.',
        deductionFixed: 0,
        deductionPercentage: 0.10
      };
      setSelectedDefects(prev => [...prev.filter(d => d.id !== 'defect-func-network'), netRule]);
    }
  };

  // Dispatch immediate lead alert email to admin as soon as user reaches Step 2 (Screen Diagnostics)
  const stepTwoLeadSentRef = useRef<string | null>(null);
  React.useEffect(() => {
    if (step === 1 && model?.name && variant) {
      const sessionKey = `stc_step2_lead_${model.id}_${variant.storageGb}_${variant.ramGb || ''}`;
      if (stepTwoLeadSentRef.current === sessionKey) return;
      try {
        if (sessionStorage.getItem(sessionKey)) {
          stepTwoLeadSentRef.current = sessionKey;
          return;
        }
        sessionStorage.setItem(sessionKey, '1');
      } catch { }
      stepTwoLeadSentRef.current = sessionKey;

      sendStepLeadAlertApi({
        modelName: model.name,
        brandName: model.brandId ? model.brandId.replace(/^brand-/, '').toUpperCase() : undefined,
        storageGb: variant.storageGb,
        ramGb: variant.ramGb,
        basePrice: variant.basePrice,
        customerName: currentUser?.name || undefined,
        customerEmail: currentUser?.email || undefined,
        customerPhone: currentUser?.phone || undefined,
        deviceType,
        sourceUrl: typeof window !== 'undefined' ? window.location.href : undefined,
      }).catch((err) => {
        console.warn('[DiagnosticWizard] Step 2 lead alert notification completed/logged:', err?.message || err);
      });
    }
  }, [step, model, variant, currentUser, deviceType]);


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
      const icloudDefect = rules.find(r => r.id === 'defect-critical-icloud');
      if (icloudDefect) {
        setSelectedDefects(prev => [...prev.filter(d => d.id !== 'defect-critical-icloud'), icloudDefect]);
      }
      setStep(finalReceiptIndex);
    } else if (type === 'power') {
      setPowerChecked('dead');
      handlePowerCheck(false);
    }
  };

  // Validation check for current step
  const isStepValidated = useMemo(() => {
    if (isTablet) {
      if (step === 0) return !selectedDefects.some(d => d.id === 'defect-critical-power');
      return true;
    }
    if (step === 0) return powerChecked === 'working' && callingChecked !== null;
    if (step === 1) return true; // Screen defects - optional, defaults to perfect
    if (step === 2) return true; // Body defects - optional, defaults to perfect
    if (step === 3) return true; // Hardware defects - optional, defaults to perfect
    if (step === 4) return true; // Connectivity defects - optional, defaults to perfect
    if (step === 5) {
      const warrantyOk = !showWarrantyQuestion || (
        hasWarranty === false || (hasWarranty === true && selectedWarrantyAge !== null)
      );
      const isIphone = isApple && !isWatch && !isTablet;
      const simOk = !isIphone || dualEsim !== null;
      return warrantyOk && simOk;
    }
    return true;
  }, [isTablet, step, icloudChecked, screenConfirmed, bodyConfirmed, funcConfirmed, connectConfirmed, accConfirmed, selectedDefects, rules, showWarrantyQuestion, hasWarranty, selectedWarrantyAge, isApple, isWatch, dualEsim]);

  const simType = 'dual_sim';

  const modelScreenDeduction = useMemo(() => {
    return (model as any).screenDeduction ?? getModelScreenDeduction(model);
  }, [model]);

  const modelWarrantyDeductionPct = useMemo(() => {
    return (model as any).warrantyDeductionPercentage ?? getModelWarrantyDeductionPercentage(model);
  }, [model]);

  // Calculate live valuation via Stage 1 Rephonix Pricing Engine
  const valuation = useMemo(() => {
    return calculateValuation(variant, selectedDefects, {
      modelId: model.id,
      brandId: model.brandId,
      modelName: model.name,
      category: model.category,
      releaseYear: model.releaseYear,
      hasSpen,
      warrantyAge: isScreenNonOriginal ? 'out_of_warranty' : (hasWarranty === false ? 'out_of_warranty' : (selectedWarrantyAge || 'under_3m')),
      deviceAge: isScreenNonOriginal ? 'out_of_warranty' : (hasWarranty === false ? 'out_of_warranty' : (selectedWarrantyAge ? (selectedWarrantyAge === '6_to_11m' ? '6_to_12m' : selectedWarrantyAge) : 'under_3m')),
      dualEsim: dualEsim === true,
      screenDeduction: modelScreenDeduction,
      warrantyDeductionPercentage: modelWarrantyDeductionPct,
      supportsWarrantyQuestion: isEligibleForWarranty
    });
  }, [variant, selectedDefects, model, simType, warrantyAge, deviceAge, dualEsim, hasSpen, isScreenNonOriginal, modelScreenDeduction, modelWarrantyDeductionPct, isEligibleForWarranty, hasWarranty, selectedWarrantyAge]);

  // Stable receipt reference code — generated once per wizard session
  const receiptRef = useMemo(() => Math.random().toString(36).substr(2, 6).toUpperCase(), []);

  // Toggle selection helper
  const handleToggleDefect = (defect: DefectRule, mutuallyExclusiveId?: string | string[]) => {
    setSelectedDefects(prev => {
      const current = Array.isArray(prev) ? prev : [];
      let next = [...current];

      // Remove mutually exclusive option if present
      if (mutuallyExclusiveId) {
        const idsToRemove = Array.isArray(mutuallyExclusiveId) ? mutuallyExclusiveId : [mutuallyExclusiveId];
        next = next.filter(d => !idsToRemove.includes(d.id));
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
  const [isPriceLocked, setIsPriceLocked] = useState(false);
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [expectedPrice, setExpectedPrice] = useState('');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [contactNote, setContactNote] = useState('');
  const [isSubmittingBestPrice, setIsSubmittingBestPrice] = useState(false);
  const [bestPriceSubmitted, setBestPriceSubmitted] = useState(false);
  const [modalStage, setModalStage] = useState<'email' | 'password' | 'signup' | 'otp' | 'forgot_reset'>('email');
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleFirebaseGoogleLoginModal = async () => {
    setGoogleLoading(true);
    setModalError('');
    try {
      const { token, user: fbUser } = await loginWithGoogle();
      try {
        const synced = await syncFirebaseUser(token);
        if (synced && synced.user) {
          if (onLoginSuccess) {
            onLoginSuccess(synced.user);
          }
          setIsPriceLocked(false);
          setLockModalOpen(false);
          return;
        }
      } catch (syncErr) {
        console.warn('[Firebase Google Auth] Backend sync warning:', syncErr);
      }

      if (fbUser) {
        const fallbackUser: ApiUser = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Google User',
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || null,
          picture: fbUser.photoURL || null,
          emailVerified: Boolean(fbUser.emailVerified),
          hasGoogleLinked: true,
          hasPassword: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (onLoginSuccess) {
          onLoginSuccess(fallbackUser);
        }
        setIsPriceLocked(false);
        setLockModalOpen(false);
      }
    } catch (err: any) {
      if (err.code !== 'auth/popup-closed-by-user' && err.code !== 'auth/cancelled-popup-request') {
        setModalError(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };
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

  // Referral / Promo Coupon states
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    type: 'FLAT' | 'PERCENT';
    bonusAmount: number;
    message?: string;
  } | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');

  const finalPayoutWithCoupon = valuation.finalPrice + (appliedCoupon?.bonusAmount || 0);

  const handleApplyCoupon = async () => {
    const clean = couponInput.trim();
    if (!clean) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await validateCouponApi(
        clean,
        valuation.finalPrice,
        currentUser?.phone || undefined,
        currentUser?.email || undefined
      );
      if (res.valid && res.bonusAmount) {
        setAppliedCoupon({
          code: res.code || clean.toUpperCase(),
          type: res.type || 'FLAT',
          bonusAmount: res.bonusAmount,
          message: res.message,
        });
        setCouponInput('');
        setSaveToast(`Referral code ${res.code || clean.toUpperCase()} applied! +₹${res.bonusAmount.toLocaleString('en-IN')} bonus added.`);
        setTimeout(() => setSaveToast(null), 4000);
      } else {
        setCouponError(res.message || 'Invalid or ineligible referral code.');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Failed to validate referral code.');
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError('');
    setCouponInput('');
  };
  const [saveToast, setSaveToast] = useState<string | null>(null);

  React.useEffect(() => {
    if (step === finalReceiptIndex && model && variant && valuation.finalPrice > 0) {
      const alreadySaved = isQuoteAlreadySaved(
        model.id,
        variant.storageGb,
        selectedDefects.map(d => d.id),
        currentUser?.id
      );
      setIsQuoteSaved(alreadySaved);

      // Automatically secure the 7-day price lock quote in the Saved tab
      if (!alreadySaved) {
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
          savedPayout: finalPayoutWithCoupon,
          appliedCoupon: appliedCoupon?.code,
          couponBonus: appliedCoupon?.bonusAmount,
          savedRetentionPercentage: valuation.retentionPercentage,
          refCode: `RPX${receiptRef}`,
        });
        setIsQuoteSaved(true);
      }
    }
  }, [step, finalReceiptIndex, model, variant, selectedDefects, currentUser?.id, valuation.finalPrice, valuation.retentionPercentage, receiptRef]);

  const handleSaveQuote = () => {
    if (!currentUser) {
      setLockModalOpen(true);
      return;
    }
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
      savedPayout: finalPayoutWithCoupon,
      appliedCoupon: appliedCoupon?.code,
      couponBonus: appliedCoupon?.bonusAmount,
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
      associateGuestQuotes(currentUser.id);
    }
  }, [currentUser]);

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
        console.log(`[Password Reset OTP]: ${(res as any).otp}`);
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
        console.log(`[Resend Password Reset OTP]: ${(res as any).otp}`);
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (step < reviewStepIndex) {
      setStep(prev => prev + 1);
    } else {
      setStep(finalReceiptIndex); // Final verified receipt
    }
  };

  const handlePrevStep = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    <div id="wizard-top" className="w-full scroll-mt-24">
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
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="critical-modal-title"
              ref={criticalModalRef}
              className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-7 max-w-sm w-full shadow-xl text-center"
            >
              <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-rose-50 border border-rose-200/80 flex items-center justify-center text-rose-600" aria-hidden="true">
                {criticalModal.type === 'icloud' ? <Lock className="w-5 h-5 stroke-[2]" /> : <AlertTriangle className="w-5 h-5 stroke-[2]" />}
              </div>
              <h3 id="critical-modal-title" className="text-base sm:text-lg font-semibold text-slate-900 mb-2">
                {criticalModal.type === 'icloud'
                  ? (isApple ? 'Apple ID Still Signed In' : 'Account Lock Active')
                  : 'Device Does Not Turn On'}
              </h3>
              <p className="text-xs text-slate-500 font-normal mb-6 leading-relaxed">
                {criticalModal.type === 'icloud'
                  ? (isApple
                    ? 'Devices linked to an active Apple ID or Find My cannot be reset or transferred for trade-in. Please sign out in Settings > [Your Name] before continuing, or proceed if this device cannot be unlocked.'
                    : 'Devices with active Google Factory Reset Protection (FRP) cannot be reactivated by a new owner. Please remove your account in Settings before trading in.')
                  : 'Devices that do not power on, are stuck in a boot loop, or have severe liquid damage cannot be verified for trade-in value.'}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={dismissCriticalModal}
                  className="py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs sm:text-sm font-semibold transition-colors shadow-xs"
                >
                  Go Back
                </button>
                <button
                  type="button"
                  onClick={confirmCriticalModal}
                  className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold transition-colors shadow-xs"
                >
                  Proceed Anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Responsive Diagnostic Workspace: Side-by-Side on Desktop (lg:), Stacked on Mobile */}
      <div className={step < reviewStepIndex ? "w-full grid grid-cols-1 lg:grid-cols-12 gap-3 sm:gap-6 items-start" : "w-full max-w-4xl mx-auto"}>
        {/* Left Column (Sticky Desktop Sidebar / Mobile Top Header): Quotation & Stepper Progress (Hidden on Review/Receipt) */}
        {step < reviewStepIndex && (
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-24 space-y-4">
            <div className="bg-white border border-ice-border rounded-xl p-3 sm:p-5 shadow-xs sm:shadow-sm space-y-2.5 sm:space-y-4 text-left">
              {/* Top Header Row: Device Info + Live Payout HUD (on sm/tablet) */}
              <div className="flex flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-2.5 sm:pb-4 border-b border-ice-border/60">
                <div className="flex items-center gap-3 sm:gap-3.5 min-w-0">
                  <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-slate-50 p-1 border border-slate-200 flex items-center justify-center flex-shrink-0 shadow-xs">
                    <img
                      src={getDeviceImage(model.id, model.brandId, variant?.color, model.imageUrl)}
                      alt={model.name}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <h2 className="font-extrabold text-slate-950 text-sm sm:text-xl tracking-tight truncate">{model.name}</h2>
                      <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200 flex-shrink-0">
                        {variant.storageGb >= 1024 ? `${variant.storageGb / 1024}TB` : `${variant.storageGb}GB`}
                      </span>
                      {isTablet && variant.ramGb && (
                        <span className="text-xs font-medium bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-md border border-blue-200 flex-shrink-0">
                          {variant.ramGb}GB RAM
                        </span>
                      )}
                      {isTablet && (
                        <span className={`text-xs font-medium px-2.5 py-0.5 rounded-md border flex-shrink-0 ${variant.connectivity === 'cellular' || variant.color?.toLowerCase().includes('cellular')
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

                {/* Real-Time Live Payout HUD Badge (Mobile/Tablet < lg) */}
                {step < reviewStepIndex && (
                  <div className="hidden sm:flex lg:hidden items-center gap-3 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl flex-shrink-0 transition-all">
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className="text-xs font-medium text-slate-500">
                          Estimated Payout
                        </span>
                        <PriceDeltaBadge currentPrice={valuation.finalPrice} disabled={valuation.isCritical} />
                      </div>
                      <div className="flex items-center gap-2.5 mt-0.5">
                        <AnimatedPrice
                          value={finalPayoutWithCoupon}
                          isMasked={false}
                          isCritical={valuation.isCritical}
                          className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Desktop Dedicated Estimated Payout Card */}
              {step < reviewStepIndex && (
                <div className="hidden lg:block bg-slate-50 border border-slate-200/90 p-4 rounded-xl">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-xs font-semibold text-slate-500">
                      Estimated Payout
                    </span>
                    <PriceDeltaBadge currentPrice={valuation.finalPrice} disabled={valuation.isCritical} />
                  </div>
                  <div className="flex items-baseline gap-2 mt-1">
                    <AnimatedPrice
                      value={finalPayoutWithCoupon}
                      isMasked={false}
                      isCritical={valuation.isCritical}
                      className="text-3xl font-bold text-slate-900 tracking-tight"
                    />
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    Based on declared device condition
                  </p>
                </div>
              )}

              {/* Desktop Stepper Progress Rail (Vertical List on lg:) */}
              <div className="hidden lg:block pt-2">
                <div className="flex items-center justify-between mb-2.5 px-1">
                  <span className="text-xs font-semibold text-slate-600">
                    Evaluation Steps
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {Math.min(step + 1, reviewStepIndex + 1)} of {reviewStepIndex + 1}
                  </span>
                </div>

                <div className="space-y-1">
                  {stepsList.map((_s, idx) => {
                    const isCompleted = step > idx;
                    const isActive = step === idx;

                    const stepLabels = isTablet
                      ? ['Core Check', 'Screen & Touch', 'Hardware & Sensors', 'Body & Frame', 'Accessories & Age', 'Review Summary']
                      : [
                        'Boot & Power',
                        'Display & Screen',
                        'Body & Frame',
                        'Hardware & Sensors',
                        'Connectivity & Battery',
                        showWarrantyQuestion ? 'Docs & Warranty' : 'Packaging & Box',
                        'Review Summary'
                      ];

                    return (
                      <div
                        key={idx}
                        onClick={() => isCompleted && setStep(idx)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                          ? 'bg-blue-50 text-blue-900 font-semibold'
                          : isCompleted
                            ? 'text-slate-700 hover:bg-slate-50 cursor-pointer'
                            : 'text-slate-400 select-none'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs transition-colors flex-shrink-0 ${isCompleted
                          ? 'bg-emerald-600 text-white'
                          : isActive
                            ? 'bg-blue-600 text-white font-semibold'
                            : 'border border-slate-300 text-slate-400 bg-white'
                          }`}>
                          {isCompleted ? <Check className="w-3 h-3 stroke-[2.5]" /> : idx + 1}
                        </div>
                        <span className={`text-xs flex-1 truncate ${isActive ? 'font-semibold text-blue-900' : isCompleted ? 'font-medium text-slate-700' : 'text-slate-400'
                          }`}>
                          {stepLabels[idx]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Mobile / Tablet Horizontal Stepper Progress Indicator (Hidden on lg:) */}
              <div className="w-full lg:hidden">
                {/* Mobile Stepper Progress Bar */}
                <div className="flex sm:hidden items-center gap-3">
                  <span className="text-xs text-slate-700 font-medium flex-shrink-0">
                    Step {Math.min(step + 1, 7)}/7: {stepsList[Math.min(step, 6)]?.title}
                  </span>
                  <div className="flex-1 h-2.5 rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${Math.min(((step + 1) / 7) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* Tablet 7-Step Horizontal Stepper with Connecting Bar */}
                <div className="hidden sm:flex justify-between relative w-full pt-1">
                  {/* Connecting Track Line — Exactly centered vertically at 18px */}
                  <div className="absolute top-[22px] -translate-y-1/2 left-6 right-6 h-1 bg-slate-200 z-0 rounded-full">
                    <div
                      className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                      style={{ width: `${(Math.min(step, reviewStepIndex) / reviewStepIndex) * 100}%` }}
                    />
                  </div>

                  {stepsList.map((_s, idx) => {
                    const isCompleted = step > idx;
                    const isActive = step === idx;

                    const stepLabels = isTablet
                      ? ['Core', 'Screen', 'Hardware', 'Body', 'Accessories', 'Review']
                      : [
                        'Core',
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
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all duration-200 ${isCompleted
                            ? 'bg-emerald-600 text-white font-medium shadow-xs'
                            : isActive
                              ? 'bg-blue-600 text-white font-semibold shadow-xs'
                              : 'bg-white border border-slate-300 text-slate-500 font-medium'
                            }`}
                        >
                          {isCompleted ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : idx + 1}
                        </div>
                        <span className={`text-xs mt-1.5 transition-colors ${isActive
                          ? 'text-blue-900 font-semibold'
                          : isCompleted
                            ? 'text-slate-700 font-medium'
                            : 'text-slate-400 font-normal'
                          }`}>
                          {stepLabels[idx]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Right Column: Diagnostic Step Content Card */}
        <div className={step < reviewStepIndex ? "lg:col-span-7 xl:col-span-8 min-w-0" : "w-full"}>
          <motion.div
            layout
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={step === finalReceiptIndex ? "w-full min-h-0" : "bg-white rounded-xl border border-ice-border p-4 sm:p-7 min-h-0 sm:min-h-[440px] flex flex-col justify-between overflow-hidden shadow-sm sm:shadow-xl pb-20 sm:pb-7"}
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
                    <span className="text-xs font-semibold text-slate-500 block mb-1">
                      Step 1 of {reviewStepIndex + 1}
                    </span>
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-900 tracking-tight">
                      Basic Functionality Check
                    </h2>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">
                      Please answer these initial core checks to begin your valuation. (You do not need to sign out or reset your device now).
                    </p>
                  </div>

                  {/* Question 1: Power check */}
                  <div className="mb-6 text-left">
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-slate-900">
                        1. Does the phone switch on?
                      </h3>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Powers on */}
                      <div
                        role="radio"
                        tabIndex={0}
                        aria-checked={powerChecked === 'working'}
                        onClick={handleSelectPowerOn}
                        onKeyDown={e => handleKeyDown(e, handleSelectPowerOn)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex items-center gap-3.5 ${powerChecked === 'working'
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${powerChecked === 'working'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                          }`}>
                          {powerChecked === 'working' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-slate-900 block">
                            Yes, powers on normally
                          </span>

                        </div>
                      </div>

                      {/* Does not power on */}
                      <div
                        role="radio"
                        tabIndex={0}
                        aria-checked={powerChecked === 'dead'}
                        onClick={() => showCriticalModal('power')}
                        onKeyDown={e => handleKeyDown(e, () => showCriticalModal('power'))}
                        className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex items-center gap-3.5 ${powerChecked === 'dead'
                          ? 'border-red-600 bg-red-50/50 shadow-xs ring-1 ring-red-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${powerChecked === 'dead'
                          ? 'border-red-600 bg-red-600 text-white'
                          : 'border-slate-300 bg-white'
                          }`}>
                          {powerChecked === 'dead' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-slate-900 block">
                            No, device does not turn on
                          </span>

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Question 2: Calling check (Cashify Standard) */}
                  <div className={`transition-opacity duration-200 text-left ${powerChecked === 'working' ? 'opacity-100' : 'opacity-40 pointer-events-none'}`}>
                    <div className="mb-3">
                      <h3 className="text-sm font-semibold text-slate-900">
                        2. Are you able to make and receive calls?
                      </h3>

                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Calling works */}
                      <div
                        role="radio"
                        tabIndex={0}
                        aria-checked={callingChecked === 'working'}
                        onClick={() => handleSelectCalling('working')}
                        onKeyDown={e => handleKeyDown(e, () => handleSelectCalling('working'))}
                        className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex items-center gap-3.5 ${callingChecked === 'working'
                          ? 'border-emerald-600 bg-emerald-50/50 shadow-xs ring-1 ring-emerald-600/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${callingChecked === 'working'
                          ? 'border-emerald-600 bg-emerald-600 text-white'
                          : 'border-slate-300 bg-white'
                          }`}>
                          {callingChecked === 'working' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-slate-900 block">
                            Yes, calls work properly
                          </span>

                        </div>
                      </div>

                      {/* Calling has issues */}
                      <div
                        role="radio"
                        tabIndex={0}
                        aria-checked={callingChecked === 'faulty'}
                        onClick={() => handleSelectCalling('faulty')}
                        onKeyDown={e => handleKeyDown(e, () => handleSelectCalling('faulty'))}
                        className={`p-4 rounded-xl border transition-all cursor-pointer text-left flex items-center gap-3.5 ${callingChecked === 'faulty'
                          ? 'border-amber-500 bg-amber-50/50 shadow-xs ring-1 ring-amber-500/20'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 transition-colors ${callingChecked === 'faulty'
                          ? 'border-amber-500 bg-amber-500 text-white'
                          : 'border-slate-300 bg-white'
                          }`}>
                          {callingChecked === 'faulty' && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm text-slate-900 block">
                            No, calling or network issues
                          </span>

                        </div>
                      </div>
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
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">Screen & Display Panel</h3>
                    <p className="text-xs sm:text-sm text-slate-800 mt-2 font-medium">Examine the front screen glass and display panel carefully.</p>
                  </div>

                  {/* Display Panel Originality Check */}
                  <div className="mb-6 p-4 rounded-2xl border border-slate-200 bg-slate-50/80 shadow-xs text-left">
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
                      <span className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-blue-600" />
                        <span>Display Authenticity</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Option 1: Original Factory Display */}
                      <div
                        role="radio"
                        tabIndex={0}
                        aria-checked={!isScreenNonOriginal}
                        onClick={() => {
                          setSelectedDefects(prev => prev.filter(d => d.id !== 'defect-screen-non-original' && d.id !== 'defect-screen-truetone'));
                        }}
                        onKeyDown={e => handleKeyDown(e, () => {
                          setSelectedDefects(prev => prev.filter(d => d.id !== 'defect-screen-non-original' && d.id !== 'defect-screen-truetone'));
                        })}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-3 ${!isScreenNonOriginal
                          ? 'border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${!isScreenNonOriginal ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                          {!isScreenNonOriginal && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-black text-sm text-slate-900">Original Factory Display</h4>
                          </div>

                        </div>
                      </div>

                      {/* Option 2: Replaced / Non-Original Screen */}
                      <div
                        role="radio"
                        tabIndex={0}
                        aria-checked={isScreenNonOriginal}
                        onClick={() => {
                          const rule = rules.find(r => r.id === 'defect-screen-non-original') || {
                            id: 'defect-screen-non-original',
                            category: 'screen' as const,
                            description: 'Screen Replaced / Non-Original Display',
                            subText: 'Screen has been replaced with a duplicate or third-party display panel.',
                            deductionFixed: 0,
                            deductionPercentage: 0
                          };
                          setSelectedDefects(prev => {
                            const without = prev.filter(d => d.id !== 'defect-screen-non-original');
                            return [...without, rule];
                          });
                          setScreenConfirmed(false);
                        }}
                        onKeyDown={e => handleKeyDown(e, () => {
                          const rule = rules.find(r => r.id === 'defect-screen-non-original') || {
                            id: 'defect-screen-non-original',
                            category: 'screen' as const,
                            description: 'Screen Replaced / Non-Original Display',
                            subText: 'Screen has been replaced with a duplicate or third-party display panel.',
                            deductionFixed: 0,
                            deductionPercentage: 0
                          };
                          setSelectedDefects(prev => {
                            const without = prev.filter(d => d.id !== 'defect-screen-non-original');
                            return [...without, rule];
                          });
                          setScreenConfirmed(false);
                        })}
                        className={`p-3.5 rounded-xl border-2 cursor-pointer transition-all duration-200 flex items-center gap-3 ${isScreenNonOriginal
                          ? 'border-rose-500 bg-rose-500/10 shadow-xs ring-1 ring-rose-500/30'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/70'
                          }`}
                      >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${isScreenNonOriginal ? 'border-rose-600 bg-rose-600 text-white' : 'border-slate-300 bg-white'
                          }`}>
                          {isScreenNonOriginal && <div className="w-2 h-2 rounded-full bg-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="font-black text-sm text-rose-950">Screen Replaced / Duplicate</h4>
                          </div>

                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Instruction Line Below Display Authenticity */}
                  <p className="text-xs sm:text-sm text-slate-800 mb-4 font-medium text-left">
                    Select any display issues that apply below. If your screen is in perfect condition, simply tap Continue.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
                    {/* Screen Defect Options */}
                    {(() => {
                      const screenMutualMap: Record<string, string[]> = {
                        'defect-screen-minor-scratches': ['defect-screen-scratches', 'defect-screen-cracked'],
                        'defect-screen-scratches': ['defect-screen-minor-scratches', 'defect-screen-cracked'],
                        'defect-screen-cracked': ['defect-screen-minor-scratches', 'defect-screen-scratches'],
                      };

                      return rules.filter(r => r.category === 'screen' && r.id !== 'defect-screen-non-original' && r.id !== 'defect-screen-touch').map(defect => {
                        const isSelected = selectedDefects.some(d => d.id === defect.id);
                        const mutualIds = screenMutualMap[defect.id];

                        return (
                          <div
                            key={defect.id}
                            role="checkbox"
                            tabIndex={0}
                            aria-checked={isSelected}
                            onKeyDown={e => handleKeyDown(e, () => {
                              handleToggleDefect(defect, mutualIds);
                              setScreenConfirmed(false);
                            })}
                            onClick={() => {
                              handleToggleDefect(defect, mutualIds);
                              setScreenConfirmed(false);
                            }}
                            className={`p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex items-center gap-3 sm:gap-3.5 text-left select-none touch-manipulation active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-rose-500 ${isSelected
                              ? 'border-rose-400 bg-rose-500/10 shadow-sm ring-1 ring-rose-400/30 scale-[1.01]'
                              : 'border-ice-border bg-canvas-white hover:border-slate-300 hover:bg-slate-50/60'
                              }`}
                          >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center overflow-hidden shadow-2xs">
                              {getIllustration(defect.id, deviceType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                              </div>

                            </div>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-ice-border bg-white'
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
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">Body, Buttons & Frame</h3>
                    <p className="text-xs sm:text-sm text-slate-800 mt-2 font-medium">Select any physical body defects below. If the frame and body are in perfect condition, simply tap Continue.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 text-left">
                    {/* Body Rules */}
                    {(() => {
                      return rules.filter(r => r.category === 'body' && r.id !== 'defect-body-airpass').map(defect => {
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
                            className={`p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex items-center gap-3 sm:gap-3.5 text-left select-none touch-manipulation active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-500 ${isSelected
                              ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/30 scale-[1.01]'
                              : 'border-ice-border bg-canvas-white hover:border-slate-300 hover:bg-slate-50/60'
                              }`}
                          >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center overflow-hidden shadow-2xs">
                              {getIllustration(defect.id, deviceType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                              </div>

                            </div>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-ice-border bg-white'
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
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">Camera & Hardware</h3>
                    <p className="text-xs sm:text-sm text-slate-800 mt-2 font-medium">Select any failing camera, biometric, audio, or hardware issues below. If all features work in perfect order, simply tap Continue.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 text-left">
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
                            className={`p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex items-center gap-3 sm:gap-3.5 text-left select-none touch-manipulation active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-rose-500 ${isSelected
                              ? 'border-rose-400 bg-rose-500/10 shadow-sm ring-1 ring-rose-400/30 scale-[1.01]'
                              : 'border-ice-border bg-canvas-white hover:border-slate-300 hover:bg-slate-50/60'
                              }`}
                          >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center overflow-hidden shadow-2xs">
                              {getIllustration(defect.id, deviceType, biometricType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                              </div>

                            </div>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-ice-border bg-white'
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
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">Connectivity & Verification</h3>
                    <p className="text-xs sm:text-sm text-slate-800 mt-2 font-medium">Select any battery or wireless connectivity issues below. If battery and connectivity are in perfect condition, simply tap Continue.</p>
                  </div>

                  {/* Standard Battery Performance Assumed Banner (Compact - Title Only) */}
                  <div className="mb-6 text-left border border-emerald-500/25 bg-gradient-to-r from-emerald-50/90 via-teal-50/60 to-emerald-50/80 p-3.5 sm:p-4 rounded-2xl relative overflow-hidden shadow-xs">
                    <div className="flex items-center justify-between flex-wrap gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 text-emerald-600">
                          <BatteryCharging className="w-5 h-5" />
                        </div>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                          Standard Battery Performance Assumed
                        </h4>
                      </div>
                      {model && (
                        <a
                          href={`https://wa.me/919034997719?text=${encodeURIComponent(`Hi Rephonix Team! My ${model.name} has a degraded / replaced battery. What is the best quote you can offer?`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold transition-colors shadow-xs touch-manipulation"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Battery Degraded? Chat with Us</span>
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 text-left">
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
                            className={`p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex items-center gap-3 sm:gap-3.5 text-left select-none touch-manipulation active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-rose-500 ${isSelected
                              ? 'border-rose-400 bg-rose-500/10 shadow-sm ring-1 ring-rose-400/30 scale-[1.01]'
                              : 'border-ice-border bg-canvas-white hover:border-slate-300 hover:bg-slate-50/60'
                              }`}
                          >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center overflow-hidden shadow-2xs">
                              {getIllustration(defect.id, deviceType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                              </div>

                            </div>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-rose-600 border-rose-600 text-white' : 'border-ice-border bg-white'
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
                    <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">Accessories & Documentation</h3>
                    <p className="text-xs sm:text-sm text-slate-800 mt-2 font-medium">
                      Select any missing accessories below. If you have all original accessories and box, simply select your warranty status and tap Review.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-6 text-left">
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
                            className={`p-3 sm:p-3.5 rounded-xl border cursor-pointer transition-all duration-200 flex items-center gap-3 sm:gap-3.5 text-left select-none touch-manipulation active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-amber-500 ${isSelected
                              ? 'border-amber-500 bg-amber-500/10 shadow-sm ring-1 ring-amber-500/30 scale-[1.01]'
                              : 'border-ice-border bg-canvas-white hover:border-slate-300 hover:bg-slate-50/60'
                              }`}
                          >
                            <div className="w-12 h-12 sm:w-14 sm:h-14 flex-shrink-0 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-center overflow-hidden shadow-2xs">
                              {getIllustration(defect.id, deviceType)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                              </div>

                            </div>
                            <div className={`w-5 h-5 rounded-md border flex items-center justify-center flex-shrink-0 ${isSelected ? 'bg-amber-600 border-amber-600 text-white' : 'border-ice-border bg-white'
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
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-slate-900">
                            Is your device under brand warranty?
                          </h4>
                          {hasWarranty === null ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                              Required
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <Check className="w-3 h-3 stroke-[3]" /> Answered
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-ink-muted mb-3 font-light">
                          Devices with a valid purchase invoice under brand warranty receive higher valuation payouts.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                          {/* Option: Yes, Under Warranty */}
                          <div
                            onClick={() => {
                              setHasWarranty(true);
                              setWarrantyStatus('active');
                            }}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${hasWarranty === true
                              ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/20'
                              : 'border-ice-border bg-canvas-white hover:border-emerald-500/40 hover:bg-slate-50/60'
                              }`}
                          >
                            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${hasWarranty === true ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600' : 'bg-slate-100 border-slate-200 text-slate-500'
                              }`}>
                              <FileCheck className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h5 className="font-bold text-xs text-ink-navy">Yes, Under Warranty</h5>
                                <span className="text-[11px] font-medium bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                                  Valid Bill
                                </span>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${hasWarranty === true ? 'bg-emerald-600 text-white' : 'border border-ice-border bg-white'
                              }`}>
                              {hasWarranty === true && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>

                          {/* Option: No, Out of Warranty */}
                          <div
                            onClick={() => {
                              setHasWarranty(false);
                              setSelectedWarrantyAge(null);
                              setWarrantyAge('out_of_warranty');
                              setDeviceAge('out_of_warranty');
                              setWarrantyStatus('expired');
                            }}
                            className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${hasWarranty === false
                              ? 'border-amber-400 bg-amber-500/10 ring-1 ring-amber-400/30'
                              : 'border-ice-border bg-canvas-white hover:border-slate-300 hover:bg-slate-50/60'
                              }`}
                          >
                            <div className={`w-9 h-9 rounded-lg border flex items-center justify-center shrink-0 transition-colors ${hasWarranty === false ? 'bg-amber-500/15 border-amber-500/30 text-amber-600' : 'bg-slate-100 border-slate-200 text-slate-500'
                              }`}>
                              <FileX className="w-5 h-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h5 className="font-bold text-xs text-ink-navy">No, Out of Warranty</h5>
                                <span className="text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded">
                                  Expired / No Bill
                                </span>
                              </div>
                            </div>
                            <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${hasWarranty === false ? 'bg-amber-600 text-white' : 'border border-ice-border bg-white'
                              }`}>
                              {hasWarranty === false && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                            </div>
                          </div>
                        </div>

                        {/* Sub-duration selection when user selects "Yes, Under Warranty" */}
                        {hasWarranty === true && (
                          <div className="pt-3 border-t border-dashed border-ice-border animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center justify-between mb-2.5">
                              <p className="text-xs font-semibold text-ink-navy">
                                Select device age (with valid bill):
                              </p>
                              {selectedWarrantyAge === null ? (
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                                  Required
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                                  <Check className="w-3 h-3 stroke-[3]" /> Selected
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                              <div
                                onClick={() => {
                                  setSelectedWarrantyAge('under_3m');
                                  setWarrantyAge('under_3m');
                                  setDeviceAge('under_3m');
                                  setWarrantyStatus('active');
                                }}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${selectedWarrantyAge === 'under_3m'
                                  ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30 shadow-xs'
                                  : 'border-ice-border bg-canvas-white hover:border-emerald-500/40'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <h5 className="font-bold text-xs text-ink-navy">Under 3 Months</h5>
                                  {selectedWarrantyAge === 'under_3m' && (
                                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                                  )}
                                </div>
                              </div>

                              <div
                                onClick={() => {
                                  setSelectedWarrantyAge('3_to_6m');
                                  setWarrantyAge('3_to_6m');
                                  setDeviceAge('3_to_6m');
                                  setWarrantyStatus('active');
                                }}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${selectedWarrantyAge === '3_to_6m'
                                  ? 'border-blue-500 bg-blue-500/10 ring-1 ring-blue-500/30 shadow-xs'
                                  : 'border-ice-border bg-canvas-white hover:border-blue-400'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <h5 className="font-bold text-xs text-ink-navy">3 to 6 Months</h5>
                                  {selectedWarrantyAge === '3_to_6m' && (
                                    <Check className="w-3.5 h-3.5 text-blue-600 stroke-[2.5]" />
                                  )}
                                </div>
                              </div>

                              <div
                                onClick={() => {
                                  setSelectedWarrantyAge('6_to_11m');
                                  setWarrantyAge('6_to_11m');
                                  setDeviceAge('6_to_12m');
                                  setWarrantyStatus('expiring_soon');
                                }}
                                className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${selectedWarrantyAge === '6_to_11m'
                                  ? 'border-violet-500 bg-violet-500/10 ring-1 ring-violet-500/30 shadow-xs'
                                  : 'border-ice-border bg-canvas-white hover:border-violet-500/40'
                                  }`}
                              >
                                <div className="flex items-center justify-between">
                                  <h5 className="font-bold text-xs text-ink-navy">6 to 11 Months</h5>
                                  {selectedWarrantyAge === '6_to_11m' && (
                                    <Check className="w-3.5 h-3.5 text-violet-600 stroke-[2.5]" />
                                  )}
                                </div>
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
                      <div className="flex items-center justify-between mb-2.5">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Does your phone support physical SIM?
                        </h4>
                        {dualEsim === null ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Required
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> Answered
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setDualEsim(false)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setDualEsim(false); }}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${dualEsim === false
                            ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                            : 'border-ice-border bg-canvas-white hover:border-emerald-500/40 hover:bg-slate-50/50'
                            }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${dualEsim === false ? 'bg-emerald-500 text-white' : 'bg-emerald-500/10 text-emerald-600'
                            }`}>
                            <Check className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-ink-navy">Yes</h5>
                          </div>
                        </div>

                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setDualEsim(true)}
                          onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setDualEsim(true); }}
                          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${dualEsim === true
                            ? 'border-rose-500 bg-rose-500/10 ring-1 ring-rose-500/30'
                            : 'border-ice-border bg-canvas-white hover:border-rose-500/40 hover:bg-slate-50/50'
                            }`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${dualEsim === true ? 'bg-rose-600 text-white' : 'bg-slate-100 border border-slate-200 text-slate-500'
                            }`}>
                            <X className="w-4 h-4 stroke-[2.5]" />
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-ink-navy">No</h5>
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
                    <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">Diagnostic Summary Review</h3>
                    <p className="text-xs sm:text-sm text-slate-800 mt-1.5 font-bold leading-relaxed">
                      Review your completed {reviewStepIndex}-section diagnostic evaluation before generating your official valuation quote.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border-2 border-slate-300 bg-slate-50 shadow-xs">
                      <span className="text-xs font-medium text-slate-500 block mb-1">Selected Device</span>
                      <h4 className="font-black text-lg text-slate-950">{model.name}</h4>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        {variant.storageGb >= 1024 ? `${variant.storageGb / 1024}TB` : `${variant.storageGb}GB`} Storage
                        {isTablet && variant.ramGb ? ` • ${variant.ramGb}GB RAM` : ''}
                        {isTablet ? ` • ${variant.connectivity === 'cellular' || variant.color?.toLowerCase().includes('cellular') ? 'Wi-Fi + Cellular' : 'Wi-Fi Only'}` : (isApple && dualEsim !== null ? ` • ${dualEsim === true ? 'eSIM Only (US Model)' : 'Physical SIM'}` : '')}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border-2 border-emerald-500 bg-emerald-50 shadow-xs">
                      <span className="text-xs font-medium text-slate-500 block mb-1">Estimated Valuation</span>
                      <AnimatedPrice
                        value={finalPayoutWithCoupon}
                        className="font-bold text-2xl text-slate-900 block"
                      />
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <h4 className="text-sm font-semibold text-slate-900">
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
                            <span className="text-amber-800 font-medium text-[11px] bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              Declared
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="pt-5 sm:pt-6 border-t border-ice-border flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
                    <button
                      type="button"
                      onClick={() => setStep(reviewStepIndex - 1)}
                      className="w-full sm:w-auto px-4 py-3 sm:py-2.5 rounded-xl border-2 border-slate-300 bg-white hover:bg-slate-100 text-slate-800 hover:text-slate-950 font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-[0.99]"
                    >
                      <ArrowLeft className="w-4 h-4 shrink-0" />
                      <span>Edit Diagnostics</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setStep(finalReceiptIndex);
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
                      className="w-full sm:w-auto px-5 sm:px-6 py-3.5 sm:py-3 bg-gradient-to-r from-cobalt to-indigo-600 hover:from-cobalt-hover hover:to-indigo-700 text-white font-bold rounded-xl text-xs sm:text-sm transition-all shadow-md hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 text-center cursor-pointer"
                    >
                      <span>Confirm Diagnostics &amp; Generate Quote</span>
                      <ChevronRight className="w-4 h-4 shrink-0" />
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
                      {/* Company Header Logo & Verified Status */}
                      <div className="flex items-center justify-between pb-4 sm:pb-5 mb-5 border-b border-slate-200 print-border">
                        <div className="flex items-center gap-3">
                          <img src="/logo.svg" className="w-9 h-9 sm:w-10 sm:h-10 object-contain rounded-md print-logo-bg flex-shrink-0 shadow-xs" alt="Rephonix Logo" />
                          <div>
                            <span className="text-lg sm:text-xl font-extrabold text-slate-950 print-text-dark tracking-tight block leading-none">
                              Re<span className="text-blue-700 print-text-cobalt">phonix</span>
                            </span>
                            <span className="text-[9px] sm:text-[10px] font-sans text-slate-600 print-text-muted tracking-wider uppercase block mt-1 font-bold">
                              Official Valuation &amp; Diagnostic Certificate
                            </span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end">
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold shadow-xs">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>Verified</span>
                          </div>
                          <span className="text-[10px] font-sans text-slate-500 uppercase tracking-wider font-bold mt-1">
                            REF #{receiptRef}
                          </span>
                          <span className="hidden print:block text-[9px] font-sans text-slate-500 mt-0.5">
                            Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>

                      {/* Specification Audit Box */}
                      <div className="flex justify-between items-center mb-5 pb-4 border-b border-slate-200 print-border font-sans">
                        <div>
                          <span className="text-[10px] text-slate-600 print-text-muted uppercase block font-medium tracking-normal mb-0.5 font-bold">
                            SPECIFICATION AUDIT RECEIPT
                          </span>
                          <span className="font-extrabold text-slate-950 print-text-dark text-xl sm:text-2xl tracking-tight block">
                            {model.name}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-600 print-text-muted uppercase block font-medium tracking-normal mb-0.5 font-bold">
                            CONFIG &amp; STATUS
                          </span>
                          <span className="text-xs text-slate-900 print-text-dark font-sans font-bold block">
                            {variant.storageGb >= 1024 ? `${variant.storageGb / 1024}TB` : `${variant.storageGb}GB`}
                            {isTablet && variant.ramGb ? ` • ${variant.ramGb}GB RAM` : ''}
                            {isTablet ? ` • ${variant.connectivity === 'cellular' || variant.color?.toLowerCase().includes('cellular') ? 'Wi-Fi + Cellular' : 'Wi-Fi Only'}` : ` • ${isApple ? 'Apple iOS' : 'Android'}${isApple && dualEsim === true ? ' • eSIM Only (US Model)' : ''}`}
                          </span>
                          <span className="hidden print:inline-block text-[10px] font-sans text-emerald-700 font-bold">
                            7-Day Price Lock
                          </span>
                        </div>
                      </div>

                      {/* 6-Gate Comprehensive Diagnostic Summary (Expanded for Print) */}
                      <div className="space-y-2.5 text-xs font-sans">
                        <div className="flex justify-between items-center py-1.5 text-slate-950 print-text-dark border-b border-slate-200 print-border">
                          <span className="font-semibold">00. Base Specification ({variant.storageGb >= 1024 ? `${variant.storageGb / 1024}TB` : `${variant.storageGb}GB`}{isTablet && variant.ramGb ? `/${variant.ramGb}GB` : ''}{isTablet ? ` • ${variant.connectivity === 'cellular' || variant.color?.toLowerCase().includes('cellular') ? 'Cellular' : 'Wi-Fi'}` : ''})</span>
                          <span className="text-emerald-700 print-text-emerald font-medium text-xs">Verified Spec</span>
                        </div>

                        {/* Print-only 6-Gate Diagnostic Breakdown Matrix */}
                        <div className="hidden print:block py-2 space-y-1.5 border-b border-slate-200 print-border">
                          <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                            <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                              <span className="font-semibold text-slate-800">1. Boot &amp; Security Gate</span>
                              <span className="text-emerald-700 font-medium text-xs">Passed</span>
                            </div>
                            <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                              <span className="font-semibold text-slate-800">2. Display &amp; Touch Digitizer</span>
                              <span className="text-emerald-700 font-medium text-xs">Verified</span>
                            </div>
                            <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                              <span className="font-semibold text-slate-800">3. Camera &amp; Optical Sensors</span>
                              <span className="text-emerald-700 font-medium text-xs">Functional</span>
                            </div>
                            <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                              <span className="font-semibold text-slate-800">4. Frame &amp; Housing Integrity</span>
                              <span className="text-emerald-700 font-medium text-xs">Verified</span>
                            </div>
                            <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                              <span className="font-semibold text-slate-800">5. Battery &amp; Core Hardware</span>
                              <span className="text-emerald-700 font-medium text-xs">Passed</span>
                            </div>
                            <div className="p-2 rounded bg-slate-50 border border-slate-200 flex justify-between items-center">
                              <span className="font-semibold text-slate-800">{hasSpen ? '6. Box, S-Pen & Accessories' : '6. Original Accessories & Box'}</span>
                              <span className="text-emerald-700 font-medium text-xs">Verified</span>
                            </div>
                          </div>
                        </div>

                        {valuation.deductions.length === 0 ? (
                          <div className="text-emerald-700 print-text-emerald py-2.5 flex items-center gap-1.5 text-xs font-medium">
                            <Check className="w-4 h-4 text-emerald-600 stroke-[2.5]" /> No defects declared. Device is in mint condition.
                          </div>
                        ) : (
                          <div className="py-1 space-y-2">
                            <span className="hidden print:block text-[10px] font-sans font-bold text-slate-600 uppercase">Declared Adjustments:</span>
                            {valuation.deductions.map((d, i) => (
                              <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.15 + 0.1 }}
                                className="flex justify-between items-center text-slate-900 print-text-dark border-b border-slate-200 print-border py-1"
                              >
                                <span className="font-medium">{(i + 1).toString().padStart(2, '0')}. {getEngineeringLabel(d.description)}</span>
                                <span className="text-slate-600 text-xs font-medium">Assessment Verified</span>
                              </motion.div>
                            ))}
                          </div>
                        )}
                      </div>



                      {/* Itemized Referral / Promo Bonus if applied */}
                      {appliedCoupon && appliedCoupon.bonusAmount > 0 && (
                        <div className="flex justify-between items-center text-emerald-800 bg-emerald-50/90 border border-emerald-300 rounded-lg px-3 py-1.5 my-1.5 font-sans">
                          <span className="font-semibold text-xs flex items-center gap-1.5">
                            <Tag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            07. Referral Incentive Bonus ({appliedCoupon.code})
                          </span>
                          <span className="text-emerald-700 font-extrabold text-xs">
                            +₹{appliedCoupon.bonusAmount.toLocaleString('en-IN')} (Applied)
                          </span>
                        </div>
                      )}

                      {/* Payout Summary Box */}
                      <div className="flex justify-between items-center border-t border-slate-200 print-border pt-4 mt-4 bg-gradient-to-br from-emerald-50/70 via-slate-50 to-emerald-50/30 p-4 sm:p-5 rounded-xl border border-emerald-200/90 shadow-xs">
                        <div>
                          <span className="text-slate-600 print-text-muted block text-xs font-semibold">Total Estimated Payout</span>
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-bold mt-0.5">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                            Payout Rate Locked (7 Days)
                          </span>
                        </div>
                        <AnimatedPrice
                          value={finalPayoutWithCoupon}
                          isMasked={isPriceLocked}
                          isCritical={valuation.isCritical}
                          className="text-3xl sm:text-4xl font-extrabold text-emerald-600 print-text-emerald tracking-tight font-sans"
                        />
                      </div>

                      {/* Digital Trust & Transparency Badges */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-4 print:hidden">
                        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                          <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center flex-shrink-0 text-emerald-700">
                            <ShieldCheck className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-900 block leading-tight">7-Day Price Lock</span>
                            <span className="text-[11px] text-slate-500 leading-tight">Rate guaranteed</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                          <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-700">
                            <Lock className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-900 block leading-tight">DoD Data Wipe</span>
                            <span className="text-[11px] text-slate-500 leading-tight">Certified zero residual</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3">
                          <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0 text-amber-700">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-semibold text-slate-900 block leading-tight">Instant Payout</span>
                            <span className="text-[11px] text-slate-500 leading-tight">Direct UPI / IMPS</span>
                          </div>
                        </div>
                      </div>

                      {/* Referral / Promo Code Input Card */}
                      <div className="mt-4 pt-3.5 border-t border-slate-200 print:hidden">
                        {!appliedCoupon ? (
                          <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 sm:p-3.5">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <Tag className="w-3.5 h-3.5 text-blue-600" />
                                <span className="text-xs font-bold text-slate-800">Have a Referral or Promo Code?</span>
                              </div>
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 font-bold">Extra Cash Bonus</span>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={couponInput}
                                onChange={(e) => {
                                  setCouponInput(e.target.value.toUpperCase());
                                  setCouponError('');
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handleApplyCoupon();
                                  }
                                }}
                                placeholder="ENTER CODE (e.g. WELCOME500)"
                                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-bold uppercase tracking-wider text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                              />
                              <button
                                type="button"
                                onClick={handleApplyCoupon}
                                disabled={couponLoading || !couponInput.trim()}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0 flex items-center gap-1 shadow-xs"
                              >
                                {couponLoading ? 'Applying...' : 'Apply Code'}
                              </button>
                            </div>
                            {couponError && (
                              <p className="text-[11px] text-rose-600 font-medium mt-1.5 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3 shrink-0" />
                                <span>{couponError}</span>
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="bg-emerald-50/90 border border-emerald-300 rounded-xl p-3 flex items-center justify-between shadow-xs">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              </div>
                              <div>
                                <span className="text-xs font-extrabold text-emerald-950 block">
                                  Referral Code {appliedCoupon.code} Applied!
                                </span>
                                <span className="text-[11px] text-emerald-700 font-medium">
                                  +₹{appliedCoupon.bonusAmount.toLocaleString('en-IN')} extra payout added to your final doorside transfer.
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={handleRemoveCoupon}
                              className="text-xs text-slate-500 hover:text-rose-600 font-bold underline ml-2 cursor-pointer transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Print-Only Official Terms & Handover Sign-off Block */}
                      <div className="hidden print:block mt-6 pt-5 border-t border-slate-300 print-border font-sans">
                        <div className="grid grid-cols-2 gap-6 text-[10px] text-slate-600 mb-6">
                          <div className="space-y-1">
                            <span className="font-bold text-slate-900 block uppercase tracking-wider">Guarantee &amp; Sanitization Policy:</span>
                            <p className="leading-relaxed">
                              • Guaranteed payout locked for 7 days upon generation of reference #SCH-{receiptRef}.<br />
                              • Certified data erasure and factory wipe performed before device refurbishment.<br />
                              • Final payout processed instantly to UPI / Bank Account upon physical IMEI verification.
                            </p>
                          </div>
                          <div className="space-y-1">
                            <span className="font-bold text-slate-900 block uppercase tracking-wider">Pickup &amp; Support Verification:</span>
                            <p className="leading-relaxed">
                              • Scheduled device pickup across Delhi NCR with live tracking.<br />
                              • Dedicated Valuation Desk: +91 90349 97719 | support@rephonix.in<br />
                              • Rephonix Smart Device Exchange Services | www.rephonix.in
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-8 pt-4 border-t border-dashed border-slate-300">
                          <div>
                            <span className="text-[10px] font-sans text-slate-500 uppercase block mb-6">Customer Verification &amp; Handover</span>
                            <div className="border-b border-slate-400 w-4/5 mb-1" />
                            <span className="text-[9px] font-sans text-slate-600">Signature &amp; Date</span>
                          </div>
                          <div>
                            <span className="text-[10px] font-sans text-slate-500 uppercase block mb-6">Rephonix Verification Specialist</span>
                            <div className="border-b border-slate-400 w-4/5 mb-1" />
                            <span className="text-[9px] font-sans text-slate-600">Technician ID &amp; Digital Seal</span>
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

                      <p className="text-xs text-slate-500 mt-4 text-center">
                        Estimated Device Value. Final offer is subject to physical inspection, IMEI/device verification and diagnostic confirmation.
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
                          className="text-emerald-700 hover:text-emerald-950 ml-2 p-0.5"
                          aria-label="Dismiss"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </motion.div>
                    )}

                    {/* Unified High-Conversion Action Controls */}
                    <div className="mt-4 space-y-2.5 print:hidden">
                      {isPriceLocked ? (
                        <button
                          type="button"
                          onClick={() => setLockModalOpen(true)}
                          className="w-full bg-cobalt hover:bg-cobalt-hover text-white py-3.5 sm:py-4 px-6 rounded-xl font-bold text-sm sm:text-base text-center transition-all flex items-center justify-center gap-2 group hover:scale-[1.005] active:scale-[0.99] shadow-lg shadow-cobalt/25 cursor-pointer"
                        >
                          <Lock className="w-4 h-4 text-sky-300" />
                          <span>Unlock Price &amp; Book Free Pickup</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onComplete(finalPayoutWithCoupon, selectedDefects, { appliedCoupon: appliedCoupon?.code, bonusAmount: appliedCoupon?.bonusAmount })}
                          className="w-full bg-gradient-to-r from-cobalt via-indigo-600 to-cobalt hover:from-cobalt-hover hover:to-indigo-700 text-white py-3.5 sm:py-4 px-6 rounded-xl font-bold text-sm sm:text-base text-center transition-all flex items-center justify-center gap-2 group hover:scale-[1.005] active:scale-[0.99] shadow-lg shadow-cobalt/25 cursor-pointer"
                        >
                          <span>Book Free Doorstep Pickup (Instant ₹{formatPrice(finalPayoutWithCoupon)})</span>
                          <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}

                      <div className="grid grid-cols-3 gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => setStep(reviewStepIndex)}
                          className="py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.99]"
                        >
                          <ArrowLeft className="w-3.5 h-3.5" />
                          <span>Review</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => window.print()}
                          aria-label="Print diagnostic report and quote"
                          className="py-2.5 px-3 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-xs cursor-pointer active:scale-[0.99]"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleSaveQuote}
                          aria-label="Save quote to profile"
                          className={`py-2.5 px-3 rounded-xl border transition-colors flex items-center justify-center gap-1.5 text-xs font-bold shadow-xs cursor-pointer active:scale-[0.99] ${isQuoteSaved
                            ? 'bg-amber-50 border-amber-300 text-amber-900 font-extrabold'
                            : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isQuoteSaved ? 'text-amber-600 fill-amber-500' : 'text-slate-500'}`} />
                          <span className="truncate">{isQuoteSaved ? 'Saved (7d Lock)' : 'Save (7d Lock)'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Navigation panel */}
            {step < reviewStepIndex && (
              <div className="hidden sm:flex flex-row justify-between items-center gap-3 border-t border-slate-200 pt-5 mt-6">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-medium text-sm transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </button>

                <span className="hidden sm:inline-block text-xs font-medium text-slate-500">
                  Step {step + 1} of {reviewStepIndex + 1}
                </span>

                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={!isStepValidated}
                  className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 ${!isStepValidated
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-slate-950 hover:bg-slate-900 text-white shadow-md shadow-slate-950/20 active:scale-98 touch-manipulation'
                    }`}
                >
                  <span>{step === (reviewStepIndex - 1) ? 'Review Summary' : 'Continue'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </motion.div>
        </div>
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
                <h3 className="text-2xl font-bold mt-4 leading-tight">Login / Signup</h3>
              </div>

              <div className="my-auto flex flex-col items-center text-center space-y-4 z-10">
                <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
                  <Lock className="w-8 h-8 text-white fill-current" />
                </div>
                <p className="text-xs font-light opacity-90 leading-relaxed text-center">Verify your mobile number to unlock your diagnostic estimate and schedule device verification.</p>
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
                    <span className="text-xs font-medium text-slate-500">Selling Price:</span>
                    <span className="text-sm font-bold text-emerald-600">
                      ₹{valuation.finalPrice > 0 ? valuation.finalPrice.toLocaleString('en-IN') : '0'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Price Unlock Notice */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-md p-2.5 flex items-center gap-2 mb-5 text-emerald-800 text-xs font-semibold">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-600" />
                <span>Sign in or create account to save this locked quote to your profile</span>
              </div>

              {/* Error Box */}
              {modalError && (
                <div className="mb-4 bg-red-50 border border-red-200 text-red-600 p-2.5 rounded-md text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {modalStage === 'email' && (
                <div className="space-y-4">
                  {/* Google 1-Click Fast Auth */}
                  <button
                    type="button"
                    onClick={handleFirebaseGoogleLoginModal}
                    disabled={googleLoading}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.99] disabled:opacity-50 cursor-pointer"
                  >
                    {googleLoading ? (
                      <div className="w-4 h-4 border-2 border-cobalt border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                        <path
                          fill="#4285F4"
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                        />
                        <path
                          fill="#34A853"
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                        />
                        <path
                          fill="#FBBC05"
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                        />
                        <path
                          fill="#EA4335"
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                        />
                      </svg>
                    )}
                    <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
                  </button>

                  <div className="flex items-center gap-3">
                    <div className="flex-1 border-t border-slate-200" />
                    <span className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">or continue with email</span>
                    <div className="flex-1 border-t border-slate-200" />
                  </div>

                  {/* Stage 1: Email address entry */}
                  <form onSubmit={handleEmailSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="modalEmail" className="text-xs font-semibold text-slate-700 block mb-1.5">
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
                </div>
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
                    <label htmlFor="modalPassword" className="text-xs font-semibold text-slate-700 block mb-1.5">
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
                    <label htmlFor="modalName" className="text-xs font-semibold text-slate-700 block mb-1">
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
                    <label htmlFor="modalPhone" className="text-xs font-semibold text-slate-700 block mb-1">
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
                    <label htmlFor="modalSignupPassword" className="text-xs font-semibold text-slate-700 block mb-1">
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
                    <label htmlFor="modalOtp" className="text-xs font-semibold text-slate-700 block mb-1.5">
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
                      <label htmlFor="modalForgotOtp" className="text-xs font-sans font-bold tracking-wider text-slate-700 uppercase">
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
                    <label htmlFor="modalForgotNewPassword" className="text-xs font-semibold text-slate-700 block mb-1">
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
                    <label htmlFor="modalForgotConfirmPassword" className="text-xs font-semibold text-slate-700 block mb-1">
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
                <h3 className="text-lg font-bold text-slate-900 leading-snug">
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
                <span className="text-xs font-medium text-slate-500 block">Device</span>
                <span className="font-bold text-slate-900">{model.name} ({variant.storageGb}GB)</span>
              </div>
              <div className="text-right">
                <span className="text-xs font-medium text-slate-500 block">Current Quote</span>
                <span className="font-bold text-emerald-700 text-sm">{formatPrice(finalPayoutWithCoupon)}</span>
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
                    href={`https://wa.me/919034997719?text=${encodeURIComponent(`Hi Rephonix Team! I got an online quote of ${formatPrice(finalPayoutWithCoupon)} for my ${model.name} (${variant.storageGb}GB). Can I get a better price?`)}`}
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
                  <span className="flex-shrink mx-3 text-xs font-medium text-slate-500">Or Request Price Match</span>
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
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-sans text-slate-900 focus:ring-2 focus:ring-cobalt outline-none"
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
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-sans text-slate-900 focus:ring-2 focus:ring-cobalt outline-none"
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
