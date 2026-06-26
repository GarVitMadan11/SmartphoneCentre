import React, { useState, useMemo } from 'react';
import { Model, Variant, getDefectRulesForCategory, DefectRule } from '../data/mockDatabase';
import { calculateValuation } from '../utils/valuation';
import { 
  ArrowLeft, Check, ChevronRight, Activity, Sparkles, 
  Smartphone, Box, Zap, Trash2, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIllustration } from './Illustrations';

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

interface DiagnosticWizardProps {
  model: Model;
  variant: Variant;
  onBack: () => void;
  onComplete: (finalPrice: number, selectedDefects: DefectRule[]) => void;
}

export const DiagnosticWizard: React.FC<DiagnosticWizardProps> = ({
  model,
  variant,
  onBack,
  onComplete
}) => {
  // Obtain rules based on model category
  const rules = useMemo(() => getDefectRulesForCategory(model.category), [model.category]);

  // Selected defect rules state
  const [selectedDefects, setSelectedDefects] = useState<DefectRule[]>([]);

  // Current wizard step index (0: Power, 1: Screen, 2: Body, 3: Functionality, 4: Accessories, 5: Live Summary)
  const [step, setStep] = useState<number>(0);

  const stepsList = [
    { title: 'Power & Boot', icon: Zap, desc: 'Does the device turn on?' },
    { title: 'Screen Condition', icon: Smartphone, desc: 'Assess screen scratches/cracks' },
    { title: 'Body Frame', icon: ShieldCheck, desc: 'Check frame dents and scuffs' },
    { title: 'Functionality & Security', icon: Activity, desc: 'Test cameras and biometrics' },
    { title: 'Box & OEM Charger', icon: Box, desc: 'Available accessories' },
  ];

  // Calculate live valuation
  const valuation = useMemo(() => {
    return calculateValuation(variant, selectedDefects);
  }, [variant, selectedDefects]);

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
    if (!turnsOn) {
      // If it doesn't turn on, mark critical power defect and skip to end
      setSelectedDefects([powerDefect]);
      setStep(5); // Jump to valuation screen directly
    } else {
      // Remove power defect if it was added
      setSelectedDefects(prev => prev.filter(d => d.id !== 'defect-critical-power'));
      setStep(1); // Proceed
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
    if (step < 4) {
      setStep(prev => prev + 1);
    } else {
      setStep(5); // Summary screen
    }
  };

  const handlePrevStep = () => {
    if (step === 5 && selectedDefects.some(d => d.id === 'defect-critical-power')) {
      // If dead phone, go back to step 0
      setStep(0);
    } else if (step > 0) {
      setStep(prev => prev - 1);
    } else {
      onBack();
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
          <div className="min-w-0">
            <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-0.5">Diagnostic wizard</span>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="font-light text-ink-navy text-xl sm:text-2xl tracking-tight truncate">{model.name}</span>
              <span className="text-[9px] font-mono tracking-wider bg-cobalt-light text-cobalt px-2 py-0.5 rounded-sm border border-white/[0.06] flex-shrink-0 uppercase">
                {variant.storageGb >= 1024 ? '1TB' : `${variant.storageGb}GB`} // {variant.color}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile: thin progress bar; md+: step dots */}
        <div className="flex flex-col gap-1.5 sm:gap-0">
          {/* Mobile progress bar */}
          <div className="flex sm:hidden items-center gap-2">
            <span className="text-[10px] text-zinc-500 font-mono tracking-wider uppercase flex-shrink-0">
              STP {Math.min(step + 1, 5)}/5
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-ice-gray overflow-hidden">
              <div
                className="h-full bg-cobalt transition-all duration-500"
                style={{width: `${Math.min((step / 4) * 100, 100)}%`}}
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
                      ? 'bg-cobalt-light border-cobalt text-cobalt scale-110' 
                      : 'bg-canvas-white border-ice-border text-ink-muted'
                  }`}
                >
                  {step > idx ? <Check className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                {idx < 4 && (
                  <div className={`w-4 sm:w-6 h-0.5 transition-all ${step > idx ? 'bg-cobalt' : 'bg-ice-border'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* On mobile: valuation mini-bar pinned above content */}
      <div className="lg:hidden bg-canvas-pure border border-ice-border rounded-sm p-3 mb-4 flex items-center justify-between text-left">
        <div>
          <span className="text-[9px] font-mono tracking-[0.1em] text-zinc-500 uppercase block">Live Estimate</span>
          <span className="text-lg font-black text-ink-navy">{formatPrice(valuation.finalPrice)}</span>
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
          className="lg:col-span-7 bg-canvas-pure rounded-sm border border-ice-border p-4 sm:p-6 min-h-[360px] sm:min-h-[420px] flex flex-col justify-between overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {/* STEP 0: Power Status */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6 text-left">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Step 1 of 5 // Power Status</span>
                  <h3 className="text-3xl font-light text-ink-navy tracking-tight">Power & Boot Diagnostics</h3>
                  <p className="text-xs text-ink-muted mt-2 font-light">First, let's verify if the device starts up and functions normally.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  <button
                    onClick={() => handlePowerCheck(true)}
                    className="p-6 rounded-sm border border-ice-border hover:border-cobalt bg-canvas-white hover:bg-cobalt-light/10 text-left transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-sm bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      {getIllustration('power-on')}
                    </div>
                    <h4 className="font-semibold text-lg text-ink-navy">Powers On</h4>
                    <p className="text-xs text-ink-muted mt-1 font-light">The device boots up to the lock screen and the screen functions fully.</p>
                  </button>

                  <button
                    onClick={() => handlePowerCheck(false)}
                    className="p-6 rounded-sm border border-ice-border hover:border-red-500 bg-canvas-white hover:bg-red-500/10 text-left transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 rounded-sm bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                      {getIllustration('defect-critical-power')}
                    </div>
                    <h4 className="font-semibold text-lg text-ink-navy">Dead / Fails to Boot</h4>
                    <p className="text-xs text-ink-muted mt-1 font-light">Device does not turn on, has heavy water damage, or is stuck on boot loop.</p>
                  </button>
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
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Step 2 of 5 // Front & Back Glass</span>
                  <h3 className="text-3xl font-light text-ink-navy tracking-tight">Screen & Display Panel</h3>
                  <p className="text-xs text-ink-muted mt-2 font-light">Examine the front screen glass and the back panel glass carefully.</p>
                </div>

                <div className="space-y-3 mt-6 text-left">
                  {/* Flawless Option */}
                  {(() => {
                    const isAnyScreenSelected = selectedDefects.some(d => d.category === 'screen');
                    const isSelected = !isAnyScreenSelected;
                    return (
                      <div
                        onClick={() => setSelectedDefects(prev => prev.filter(d => d.category !== 'screen'))}
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-4 text-left ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light scale-[1.01] opacity-100 z-10'
                            : 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 bg-ice-gray rounded-sm border border-ice-border flex items-center justify-center overflow-hidden">
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
                    const isAnyScreenSelected = selectedDefects.some(d => d.category === 'screen');
                    const isSelected = selectedDefects.some(d => d.id === defect.id);
                    return (
                      <div
                        key={defect.id}
                        onClick={() => handleToggleDefect(
                          defect, 
                          defect.id === 'defect-screen-cracked' 
                            ? 'defect-screen-scratches' 
                            : defect.id === 'defect-screen-scratches' 
                            ? 'defect-screen-cracked' 
                            : undefined
                        )}
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-4 text-left ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light scale-[1.01] opacity-100 z-10'
                            : isAnyScreenSelected
                            ? 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/30 hover:scale-[1.005]'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 bg-ice-gray rounded-sm border border-ice-border flex items-center justify-center overflow-hidden">
                          {getIllustration(defect.id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[9px] font-mono bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-sm border border-red-500/20">
                              {defect.deductionPercentage > 0 ? `-${defect.deductionPercentage * 100}%` : `-${formatPrice(defect.deductionFixed)}`}
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
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Step 3 of 5 // Outer Enclosure</span>
                  <h3 className="text-3xl font-light text-ink-navy tracking-tight">Body Frame & Chassis</h3>
                  <p className="text-xs text-ink-muted mt-2 font-light">Examine the aluminum/titanium frame side edges and corners.</p>
                </div>

                <div className="space-y-3 mt-6 text-left">
                  {/* Flawless Option */}
                  {(() => {
                    const isAnyBodySelected = selectedDefects.some(d => d.category === 'body');
                    const isSelected = !isAnyBodySelected;
                    return (
                      <div
                        onClick={() => setSelectedDefects(prev => prev.filter(d => d.category !== 'body'))}
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-4 text-left ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light scale-[1.01] opacity-100 z-10'
                            : 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 bg-ice-gray rounded-sm border border-ice-border flex items-center justify-center overflow-hidden">
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
                    const isAnyBodySelected = selectedDefects.some(d => d.category === 'body');
                    const isSelected = selectedDefects.some(d => d.id === defect.id);
                    return (
                      <div
                        key={defect.id}
                        onClick={() => handleToggleDefect(
                          defect, 
                          defect.id === 'defect-body-dented' 
                            ? 'defect-body-scuffs' 
                            : defect.id === 'defect-body-scuffs' 
                            ? 'defect-body-dented' 
                            : undefined
                        )}
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-4 text-left ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light scale-[1.01] opacity-100 z-10'
                            : isAnyBodySelected
                            ? 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/30 hover:scale-[1.005]'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 bg-ice-gray rounded-sm border border-ice-border flex items-center justify-center overflow-hidden">
                          {getIllustration(defect.id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[9px] font-mono bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-sm border border-red-500/20">
                              {defect.deductionPercentage > 0 ? `-${defect.deductionPercentage * 100}%` : `-${formatPrice(defect.deductionFixed)}`}
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

            {/* STEP 3: Functionality & Security */}
            {step === 3 && (
              <motion.div
                key="step-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6 text-left">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Step 4 of 5 // Hardware Verification</span>
                  <h3 className="text-3xl font-light text-ink-navy tracking-tight">Hardware Functionality</h3>
                  <p className="text-xs text-ink-muted mt-2 font-light">Select any specific hardware component failures that apply.</p>
                </div>

                <div className="space-y-3 mt-6 text-left">
                  {rules.filter(r => ['camera', 'battery'].includes(r.category) || r.id === 'defect-critical-security').map(defect => {
                    const isAnyFuncSelected = selectedDefects.some(d => ['camera', 'battery'].includes(d.category) || d.id === 'defect-critical-security');
                    const isSelected = selectedDefects.some(d => d.id === defect.id);
                    return (
                      <div
                        key={defect.id}
                        onClick={() => handleToggleDefect(defect)}
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-4 text-left ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light scale-[1.01] opacity-100 z-10'
                            : isAnyFuncSelected
                            ? 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/30 hover:scale-[1.005]'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 bg-ice-gray rounded-sm border border-ice-border flex items-center justify-center overflow-hidden">
                          {getIllustration(defect.id)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[9px] font-mono bg-red-500/10 text-red-400 px-1.5 py-0.5 rounded-sm border border-red-500/20">
                              {defect.deductionPercentage > 0 ? `-${defect.deductionPercentage * 100}%` : `-${formatPrice(defect.deductionFixed)}`}
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

            {/* STEP 4: Accessories */}
            {step === 4 && (
              <motion.div
                key="step-4"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6 text-left">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Step 5 of 5 // Packaging & OEM Extras</span>
                  <h3 className="text-3xl font-light text-ink-navy tracking-tight">Original Accessories</h3>
                  <p className="text-xs text-ink-muted mt-2 font-light">Do you have the original retail box and OEM charging cable?</p>
                </div>

                <div className="space-y-3 mt-6 text-left">
                  {rules.filter(r => r.category === 'accessories' && !r.isCriticalFailure && r.id !== 'defect-critical-security').map(defect => {
                    const isAnyAccSelected = selectedDefects.some(d => d.category === 'accessories' && !d.isCriticalFailure && d.id !== 'defect-critical-security');
                    const isSelected = selectedDefects.some(d => d.id === defect.id);
                    return (
                      <div
                        key={defect.id}
                        onClick={() => handleToggleDefect(defect)}
                        className={`p-3 rounded-sm border cursor-pointer transition-all duration-300 flex items-center gap-4 text-left ${
                          isSelected
                            ? 'border-red-500/40 bg-red-500/10 scale-[1.01] opacity-100 z-10'
                            : isAnyAccSelected
                            ? 'border-ice-border bg-canvas-white opacity-40 hover:opacity-75 hover:scale-[1.005]'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/30 hover:scale-[1.005]'
                        }`}
                      >
                        <div className="w-14 h-14 flex-shrink-0 bg-ice-gray rounded-sm border border-ice-border flex items-center justify-center overflow-hidden">
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
                          isSelected ? 'bg-red-500 border-red-500 text-white' : 'border-ice-border'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* STEP 5: Live Summary (Finalized Quote breakdown) */}
            {step === 5 && (
              <motion.div
                key="step-5"
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
                  <div className="border border-dashed border-white/[0.12] bg-zinc-950/40 rounded-sm p-5 mb-6 text-sm relative overflow-hidden text-left">
                    {/* Watermark/stamp */}
                    <div className="absolute -right-4 -top-4 w-24 h-24 rounded-sm border-2 border-emerald-500/20 flex items-center justify-center rotate-12 select-none pointer-events-none">
                      <span className="text-[8px] font-mono text-emerald-500/30 uppercase tracking-widest">VERIFIED</span>
                    </div>

                    <div className="flex justify-between items-center mb-6 pb-6 border-b border-white/[0.06] font-mono">
                      <div>
                        <span className="text-[9px] text-zinc-500 uppercase block font-mono tracking-wider">SPECIFICATION AUDIT RECEIPT</span>
                        <span className="font-semibold text-ink-navy text-base">{model.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[9px] text-zinc-500 uppercase block font-mono tracking-wider">REF CODE</span>
                        <span className="text-[10px] text-zinc-400">#SCH-{Math.random().toString(36).substr(2, 6).toUpperCase()}</span>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div className="flex justify-between items-center py-2 text-zinc-300 border-b border-white/[0.04]">
                        <span>00. Base Configuration Value ({variant.storageGb}GB)</span>
                        <span className="text-cobalt font-semibold">+{formatPrice(variant.basePrice)}</span>
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
                              <span className="text-red-500">-[{formatPrice(d.totalDeducted)}]</span>
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
                      <span className="text-3xl font-light text-cobalt tracking-tight font-mono">{formatPrice(valuation.finalPrice)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onComplete(valuation.finalPrice, selectedDefects)}
                  className="w-full bg-cobalt hover:bg-cobalt-hover text-white py-4 rounded-sm font-bold text-center transition-all flex items-center justify-center gap-2 group mt-4 hover:scale-[1.01]"
                >
                  Book Instant Doorstep Payout
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation panel */}
          {step < 5 && (
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t border-white/[0.04] pt-4 sm:pt-6 mt-4 sm:mt-6">
              <button
                onClick={handlePrevStep}
                className="order-2 sm:order-1 px-5 py-2.5 rounded-sm border border-ice-border hover:bg-ice-gray text-ink-slate font-semibold text-sm transition-all"
              >
                Back
              </button>

              <button
                onClick={handleNextStep}
                className="order-1 sm:order-2 px-6 py-3 sm:py-2.5 bg-cobalt hover:bg-cobalt-hover text-white font-bold rounded-sm text-sm transition-all flex items-center justify-center gap-1.5"
              >
                {step === 4 ? 'Generate Report' : 'Next Step'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </motion.div>

        {/* Right column: Live price estimator — hidden on mobile (replaced by mini bar) */}
        <div className="hidden lg:flex lg:col-span-5 bg-canvas-pure rounded-sm border border-ice-border p-6 flex-col justify-between min-h-[300px]">
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
              <div className="relative w-40 h-40 rounded-sm border-8 border-cobalt-light flex items-center justify-center">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="72"
                    stroke="#3B82F6"
                    strokeWidth="8"
                    fill="transparent"
                    strokeDasharray="452"
                    strokeDashoffset={
                      valuation.isCritical
                        ? 452
                        : 452 - (452 * (valuation.finalPrice / variant.basePrice))
                    }
                    className="transition-all duration-700 ease-out"
                  />
                </svg>
                <div className="text-center z-10 px-2 text-left">
                  <span className="text-[9px] font-mono tracking-[0.1em] text-zinc-500 uppercase block">Live Estimate</span>
                  <span className="text-2xl font-black text-ink-navy">{formatPrice(valuation.finalPrice)}</span>
                </div>
              </div>
              <span className="text-xs text-ink-slate font-light mt-4 bg-ice-gray px-3 py-1 rounded-sm border border-white/[0.06]">
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
