import React, { useState, useMemo } from 'react';
import { Model, Variant, getDefectRulesForCategory, DefectRule } from '../data/mockDatabase';
import { calculateValuation } from '../utils/valuation';
import { 
  ArrowLeft, Check, ChevronRight, Activity, Sparkles, 
  Smartphone, Box, Zap, Trash2, ShieldCheck, Printer
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIllustration } from './Illustrations';

const getEngineeringLabel = (description: string) => {
  const mapping: { [key: string]: string } = {
    'Cracked Screen / Back Glass':       'Screen Restoration Fee',
    'Front Glass Scratches / Bubbles':   'Glass Micro-Polishing Fee',
    'Screen Burn-in / Lines':            'Display Panel Replacement Fee',
    'Touch / Swipe Unresponsive':        'Digitizer / Touch Layer Repair',
    'True Tone Not Working':             'Original Display Certification Fee',
    'Dented or Bent Frame':              'Chassis Structure Re-alignment',
    'Scuffed Frame / Normal Wear':       'Frame Bead-Blasting & Refinishing',
    'Air Pass / Waterproof Seal Fail':   'IP Seal & Gasket Replacement',
    'Side Buttons Faulty':               'Button Flex Cable Repair Fee',
    'Screws Stripped / Missing':         'Pentalobe Hardware Replacement',
    'Camera Faulty / Lens Blur':         'Optical Sensor Recalibration',
    'Battery Health < 80%':              'Battery Module Replacement',
    'Non-Genuine Battery Warning':       'OEM Battery Compliance Levy',
    'Network, Calling & SIM Issues':     'Cellular Modem / SIM Tray Repair',
    'Wi-Fi & Bluetooth Issues':          'Antenna & Wireless Module Repair',
    '3uTools Serial Mismatch':           'Counterfeit Parts Detection Levy',
    'Speakers / Microphone Faulty':      'Audio Assembly Replacement Fee',
    'Auto-Restart / Unstable Device':    'PMIC / Board-Level Stabilisation',
    'Missing Original Box':              'OEM Retail Box De-allocation',
    'Missing Original Charger / Cable':  'OEM Power Adapter De-allocation',
    'Missing Bill / Customer Photo ID':  'Legal Compliance Documentation Fee',
    'Device Does Not Turn On':           'Board-Level Hardware Failure',
    'iCloud / Apple ID Locked':          'Activation Lock — Zero Resale Value',
    'Biometrics Faulty (Face ID)':       'Biometric Sensor Security Fee'
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
}

export const DiagnosticWizard: React.FC<DiagnosticWizardProps> = ({
  model,
  variant,
  onBack,
  onComplete,
  selectedDefects,
  setSelectedDefects,
  step,
  setStep
}) => {
  // Obtain rules based on model category
  const rules = useMemo(() => getDefectRulesForCategory(model.category), [model.category]);

  const stepsList = [
    { title: 'Boot & iCloud',          icon: Zap,        desc: 'Power on & Apple ID status' },
    { title: 'Screen & Display',       icon: Smartphone, desc: 'Touch, True Tone & glass' },
    { title: 'Body & Frame',           icon: ShieldCheck, desc: 'Frame, buttons, screws & seal' },
    { title: 'Hardware',               icon: Activity,   desc: 'Camera, Face ID, audio & restart' },
    { title: 'Connectivity',           icon: Zap,        desc: 'Battery, network, Wi-Fi & parts' },
    { title: 'Accessories & Docs',     icon: Box,        desc: 'Box, charger & bill' },
  ];

  // Confirmation state — session only, never persisted to localStorage
  const [screenConfirmed, setScreenConfirmed] = useState(false);
  const [bodyConfirmed, setBodyConfirmed] = useState(false);
  const [funcConfirmed, setFuncConfirmed] = useState(false);
  const [connectConfirmed, setConnectConfirmed] = useState(false);
  const [accConfirmed, setAccConfirmed] = useState(false);
  const [icloudChecked, setIcloudChecked] = useState<'clear' | 'locked' | null>(null);

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
      {/* Wizard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ice-border pb-4 sm:pb-5 mb-4 sm:mb-8 bg-canvas-pure p-4 sm:p-5 rounded-sm gap-4 text-left">
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrevStep}
            className="p-2 sm:p-2.5 rounded-sm border border-ice-border hover:border-cobalt hover:bg-cobalt-light/10 text-ink-slate hover:text-cobalt transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          {/* Phone Vector Silhouette */}
          <div className="hidden sm:flex w-10 h-10 rounded-sm bg-cobalt-light border border-white/[0.06] items-center justify-center text-cobalt flex-shrink-0 shadow-sm">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
              <rect x="5" y="2" width="14" height="20" rx="3" />
              <line x1="12" y1="18" x2="12" y2="18.01" strokeLinecap="round" strokeWidth="2" />
            </svg>
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
                  <h3 className="text-3xl font-light text-ink-navy tracking-tight">Boot & iCloud Status</h3>
                  <p className="text-xs text-ink-muted mt-2 font-light">Check Apple ID status first — a locked iCloud renders the device unsellable regardless of condition.</p>
                </div>

                {/* iCloud check — must answer first */}
                <div className="mb-5 text-left">
                  <span className="text-[9px] font-mono tracking-[0.15em] text-amber-400 uppercase block mb-2">① Check First: Settings → [Your Name] → iCloud</span>
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
                        <span className="font-semibold text-sm text-ink-navy">Apple ID Signed Out</span>
                        {icloudChecked === 'clear' && <Check className="w-3.5 h-3.5 text-emerald-500 ml-auto" />}
                      </div>
                      <p className="text-xs text-ink-muted font-light">Find My is OFF. Device can be erased and resold.</p>
                    </div>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setIcloudChecked('locked')}
                      onKeyDown={e => handleKeyDown(e, () => setIcloudChecked('locked'))}
                      className={`p-4 rounded-sm border cursor-pointer transition-all duration-200 text-left focus:outline-none focus:ring-2 focus:ring-red-500 ${
                        icloudChecked === 'locked'
                          ? 'border-red-500 bg-red-500/10'
                          : 'border-red-500/30 bg-red-500/5 hover:border-red-500/60'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-red-400 font-bold text-sm">🔒</span>
                        <span className="font-semibold text-sm text-red-400">iCloud LOCKED</span>
                        {icloudChecked === 'locked' && <Check className="w-3.5 h-3.5 text-red-400 ml-auto" />}
                      </div>
                      <p className="text-xs text-ink-muted font-light">Find My is ON. Apple ID cannot be removed. Zero resale value.</p>
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
                        {getIllustration('power-on')}
                      </div>
                      <h4 className="font-semibold text-sm text-ink-navy">Powers On</h4>
                      <p className="text-xs text-ink-muted mt-0.5 font-light">Boots to lock screen and functions normally.</p>
                    </button>
                    <button
                      onClick={() => handlePowerCheck(false)}
                      disabled={!icloudChecked}
                      className="p-5 rounded-sm border border-red-500/30 hover:border-red-500/60 bg-red-500/5 hover:bg-red-500/10 text-left transition-all duration-300 group focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed"
                      style={{ minHeight: '100px' }}
                    >
                      <div className="w-12 h-12 rounded-sm bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-3 group-hover:scale-105 transition-transform overflow-hidden">
                        {getIllustration('defect-critical-power')}
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

                <div className="space-y-3 mt-6 text-left">
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
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light scale-[1.01] opacity-100 z-10 shadow-premium'
                            : !screenConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/30 hover:scale-[1.005]'
                            : 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                        }`}
                        style={{ minHeight: '72px' }}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-sm bg-ice-gray border border-ice-border flex items-center justify-center overflow-hidden">
                          {getIllustration('screen-flawless')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-ink-navy">Flawless Display</h4>
                          <p className="text-xs text-ink-muted mt-0.5 font-light">No scratches, micro-abrasions, cracks, or screen bleeding.</p>
                        </div>
                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
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
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light scale-[1.01] opacity-100 z-10 shadow-premium'
                            : !screenConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/30 hover:scale-[1.005]'
                            : 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                        }`}
                        style={{ minHeight: '72px' }}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-sm bg-ice-gray border border-ice-border flex items-center justify-center overflow-hidden">
                          {getIllustration(defect.id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[9px] font-mono bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-sm border border-red-500/20">
                              {defect.deductionPercentage > 0 ? `-${parseFloat((defect.deductionPercentage * 100).toFixed(1))}%` : `-${formatPrice(defect.deductionFixed)}`}
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5 font-light">{defect.subText}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
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

                <div className="space-y-3 mt-6 text-left">
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
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light scale-[1.01] opacity-100 z-10 shadow-premium'
                            : !bodyConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/30 hover:scale-[1.005]'
                            : 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                        }`}
                        style={{ minHeight: '72px' }}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-sm bg-ice-gray border border-ice-border flex items-center justify-center overflow-hidden">
                          {getIllustration('body-flawless')}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-ink-navy">Flawless Frame</h4>
                          <p className="text-xs text-ink-muted mt-0.5 font-light">No dents, bends, or paint scuffs. Device looks brand new.</p>
                        </div>
                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
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
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light scale-[1.01] opacity-100 z-10 shadow-premium'
                            : !bodyConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/30 hover:scale-[1.005]'
                            : 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                        }`}
                        style={{ minHeight: '72px' }}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-sm bg-ice-gray border border-ice-border flex items-center justify-center overflow-hidden">
                          {getIllustration(defect.id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[9px] font-mono bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-sm border border-red-500/20">
                              {defect.deductionPercentage > 0 ? `-${parseFloat((defect.deductionPercentage * 100).toFixed(1))}%` : `-${formatPrice(defect.deductionFixed)}`}
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5 font-light">{defect.subText}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
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

                <div className="space-y-3 mt-6 text-left">
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
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light scale-[1.01] opacity-100 z-10 shadow-premium'
                            : !funcConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/30 hover:scale-[1.005]'
                            : 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                        }`}
                        style={{ minHeight: '72px' }}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <ShieldCheck className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-ink-navy">Hardware Works Perfectly</h4>
                          <p className="text-xs text-ink-muted mt-0.5 font-light">Front/rear cameras, Face ID, speaker/mic, and system stability are flawless.</p>
                        </div>
                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
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
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light scale-[1.01] opacity-100 z-10 shadow-premium'
                            : !funcConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/30 hover:scale-[1.005]'
                            : 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                        }`}
                        style={{ minHeight: '72px' }}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-sm bg-ice-gray border border-ice-border flex items-center justify-center overflow-hidden">
                          {getIllustration(defect.id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[9px] font-mono bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-sm border border-red-500/20">
                              {defect.deductionPercentage > 0 ? `-${parseFloat((defect.deductionPercentage * 100).toFixed(1))}%` : `-${formatPrice(defect.deductionFixed)}`}
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5 font-light">{defect.subText}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
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

                <div className="space-y-3 mt-6 text-left">
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
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light scale-[1.01] opacity-100 z-10 shadow-premium'
                            : !connectConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/30 hover:scale-[1.005]'
                            : 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                        }`}
                        style={{ minHeight: '72px' }}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <ShieldCheck className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-ink-navy">Connectivity & Battery Healthy</h4>
                          <p className="text-xs text-ink-muted mt-0.5 font-light">Battery is original/above 80%, cellular/Wi-Fi antennas are strong, and 3uTools checks pass.</p>
                        </div>
                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
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
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light scale-[1.01] opacity-100 z-10 shadow-premium'
                            : !connectConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/30 hover:scale-[1.005]'
                            : 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                        }`}
                        style={{ minHeight: '72px' }}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-sm bg-ice-gray border border-ice-border flex items-center justify-center overflow-hidden">
                          {getIllustration(defect.id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[9px] font-mono bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-sm border border-red-500/20">
                              {defect.deductionPercentage > 0 ? `-${parseFloat((defect.deductionPercentage * 100).toFixed(1))}%` : `-${formatPrice(defect.deductionFixed)}`}
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5 font-light">{defect.subText}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
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

                <div className="space-y-3 mt-6 text-left">
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
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light scale-[1.01] opacity-100 z-10 shadow-premium'
                            : !accConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/30 hover:scale-[1.005]'
                            : 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                        }`}
                        style={{ minHeight: '72px' }}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                          <Box className="w-7 h-7 text-emerald-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-sm text-ink-navy">All Accessories Included</h4>
                          <p className="text-xs text-ink-muted mt-0.5 font-light">Original box with matching IMEI, OEM charger/cable, and purchasing receipt are present.</p>
                        </div>
                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
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
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-3 text-left focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light scale-[1.01] opacity-100 z-10 shadow-premium'
                            : !accConfirmed
                            ? 'border-ice-border bg-canvas-white hover:border-cobalt/30 hover:scale-[1.005]'
                            : 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                        }`}
                        style={{ minHeight: '72px' }}
                      >
                        <div className="w-14 h-14 flex-shrink-0 rounded-sm bg-ice-gray border border-ice-border flex items-center justify-center overflow-hidden">
                          {getIllustration(defect.id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[9px] font-mono bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-sm border border-red-500/20">
                              Deduct: {formatPrice(defect.deductionFixed)}
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5 font-light">{defect.subText}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-sm border flex items-center justify-center flex-shrink-0 ${
                          isSelected ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
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
                  <div className="border border-dashed border-white/[0.12] bg-zinc-950/40 rounded-sm p-5 mb-6 text-sm relative overflow-hidden text-left shadow-inner">
                    {/* Watermark/stamp — circular badge */}
                    <div className="absolute -right-6 -top-6 w-24 h-24 rounded-full border-2 border-emerald-500/25 flex items-center justify-center rotate-12 select-none pointer-events-none">
                      <span className="text-[8px] font-mono text-emerald-500/40 uppercase tracking-widest">VERIFIED</span>
                    </div>

                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/[0.06] font-mono">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase block font-mono tracking-wider">SPECIFICATION AUDIT RECEIPT</span>
                        <span className="font-semibold text-ink-navy text-base">{model.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-zinc-500 uppercase block font-mono tracking-wider">REF CODE</span>
                        <span className="text-[10px] text-zinc-400">#SCH-{receiptRef}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center py-2 text-zinc-300 border-b border-white/[0.04]">
                        <span>00. Base Configuration Value ({variant.storageGb}GB)</span>
                        <span className="text-cobalt font-semibold font-outfit">+{formatPrice(variant.basePrice)}</span>
                      </div>

                      {valuation.deductions.length === 0 ? (
                        <div className="text-emerald-500 italic py-3 flex items-center gap-1.5 font-mono text-xs">
                          <Sparkles className="w-3.5 h-3.5 fill-emerald-500/10 text-emerald-400" /> [No defects declared. Maximum payout rate applies.]
                        </div>
                      ) : (
                        <div className="py-2 space-y-2">
                          {valuation.deductions.map((d, i) => (
                            <motion.div 
                              key={i} 
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.15 + 0.1 }}
                              className="flex justify-between items-center text-zinc-400 border-b border-white/[0.04] py-1.5"
                            >
                              <span>{(i + 1).toString().padStart(2, '0')}. {getEngineeringLabel(d.description)}</span>
                              <span className="text-red-500 font-outfit">-[{formatPrice(d.totalDeducted)}]</span>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center border-t border-dashed border-white/[0.12] pt-5 mt-5">
                      <div>
                        <span className="text-zinc-500 uppercase block text-[9px] font-mono">TOTAL ESTIMATED PAYOUT</span>
                        <span className="text-[9px] text-emerald-500 uppercase tracking-widest block font-mono font-bold">✓ Payout Rate Locked</span>
                      </div>
                      <span className="text-3xl font-light text-cobalt tracking-tight font-mono font-outfit">{formatPrice(valuation.finalPrice)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    onClick={() => window.print()}
                    className="flex-shrink-0 px-4 py-4 rounded-sm border border-ice-border text-ink-slate hover:border-cobalt hover:text-cobalt transition-all flex items-center gap-2 text-sm font-semibold"
                    title="Print / Save as PDF"
                    style={{ minHeight: '48px' }}
                  >
                    <Printer className="w-4 h-4" />
                    <span className="hidden sm:inline">Print Quote</span>
                  </button>
                  <button
                    onClick={() => onComplete(valuation.finalPrice, selectedDefects)}
                    className="flex-1 bg-cobalt hover:bg-cobalt-hover text-white py-4 rounded-sm font-bold text-center transition-all flex items-center justify-center gap-2 group hover:scale-[1.01]"
                    style={{ minHeight: '48px' }}
                  >
                    Book Instant Doorstep Payout
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
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
                  <span className="text-2xl font-black text-ink-navy font-outfit">{formatPrice(valuation.finalPrice)}</span>
                </div>
              </div>
              <span className="text-xs text-ink-slate font-light mt-3">
                Base Value: {formatPrice(variant.basePrice)}
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
    </div>
  );
};
