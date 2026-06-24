import React, { useState, useMemo } from 'react';
import { Model, Variant, getDefectRulesForCategory, DefectRule } from '../data/mockDatabase';
import { calculateValuation } from '../utils/valuation';
import { 
  ArrowLeft, Check, ChevronRight, Activity, Sparkles, 
  Smartphone, ShieldAlert, Box, Zap, Trash2, ShieldCheck, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-ice-border pb-4 sm:pb-5 mb-4 sm:mb-8 bg-canvas-pure p-4 sm:p-5 rounded-2xl canva-shadow gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrevStep}
            className="p-2 sm:p-2.5 rounded-xl border border-ice-border hover:border-cobalt hover:bg-cobalt-light/10 text-ink-slate hover:text-cobalt transition-all flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-ink-muted uppercase tracking-wider">Diagnostic Wizard</h2>
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5">
              <span className="font-extrabold text-ink-navy text-base sm:text-lg truncate">{model.name}</span>
              <span className="text-[10px] sm:text-xs font-semibold bg-cobalt-light text-cobalt px-2 py-0.5 rounded border border-cobalt-border flex-shrink-0">
                {variant.storageGb >= 1024 ? '1TB' : `${variant.storageGb}GB`} • {variant.color}
              </span>
            </div>
          </div>
        </div>

        {/* Mobile: thin progress bar; md+: step dots */}
        <div className="flex flex-col gap-1.5 sm:gap-0">
          {/* Mobile progress bar */}
          <div className="flex sm:hidden items-center gap-2">
            <span className="text-[10px] text-ink-muted font-semibold flex-shrink-0">
              Step {Math.min(step + 1, 5)}/5
            </span>
            <div className="flex-1 h-1.5 rounded-full bg-ice-gray overflow-hidden">
              <div
                className="h-full rounded-full bg-cobalt transition-all duration-500"
                style={{width: `${Math.min((step / 4) * 100, 100)}%`}}
              />
            </div>
          </div>
          {/* Desktop step dots */}
          <div className="hidden sm:flex items-center gap-1.5">
            {stepsList.map((_s, idx) => (
              <div key={idx} className="flex items-center">
                <div 
                  className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs border transition-all ${
                    step > idx 
                      ? 'bg-cobalt border-cobalt text-white' 
                      : step === idx 
                      ? 'bg-cobalt-light border-cobalt text-cobalt shadow-sm scale-110' 
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
      <div className="lg:hidden bg-cobalt-light/60 border border-cobalt-border rounded-xl p-3 mb-4 flex items-center justify-between">
        <div>
          <span className="text-[9px] uppercase font-bold text-cobalt block">Live Estimate</span>
          <span className="text-lg font-black text-ink-navy">{formatPrice(valuation.finalPrice)}</span>
        </div>
        <div className="text-right">
          <span className="text-[9px] text-ink-muted block">Base Value</span>
          <span className="text-xs font-semibold text-ink-slate">{formatPrice(variant.basePrice)}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
        {/* Left column: Step Content */}
        <div className="lg:col-span-7 bg-canvas-pure rounded-2xl border border-ice-border p-4 sm:p-6 canva-shadow min-h-[360px] sm:min-h-[420px] flex flex-col justify-between">
          <AnimatePresence mode="wait">
            {/* STEP 0: Power Status */}
            {step === 0 && (
              <motion.div
                key="step-0"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 1, x: 10 }}
              >
                <div className="mb-6">
                  <span className="text-xs uppercase font-extrabold text-cobalt tracking-wider mb-1 block">Step 1 of 5</span>
                  <h3 className="text-2xl font-bold text-ink-navy">Power & Boot Diagnostics</h3>
                  <p className="text-sm text-ink-muted mt-1">First, let's verify if the device starts up and functions normally.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
                  <button
                    onClick={() => handlePowerCheck(true)}
                    className="p-6 rounded-xl border border-ice-border hover:border-cobalt bg-canvas-white hover:bg-cobalt-light/10 text-left transition-all duration-300 canva-shadow group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-4 group-hover:scale-105 transition-transform">
                      <Zap className="w-6 h-6 fill-emerald-50" />
                    </div>
                    <h4 className="font-bold text-lg text-ink-navy">Powers On</h4>
                    <p className="text-xs text-ink-muted mt-1">The device boots up to the lock screen and the screen functions fully.</p>
                  </button>

                  <button
                    onClick={() => handlePowerCheck(false)}
                    className="p-6 rounded-xl border border-ice-border hover:border-red-500 bg-canvas-white hover:bg-red-50/10 text-left transition-all duration-300 canva-shadow group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-500 mb-4 group-hover:scale-105 transition-transform">
                      <ShieldAlert className="w-6 h-6" />
                    </div>
                    <h4 className="font-bold text-lg text-ink-navy">Dead / Fails to Boot</h4>
                    <p className="text-xs text-ink-muted mt-1">Device does not turn on, has heavy water damage, or is stuck on boot loop.</p>
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
                <div className="mb-6">
                  <span className="text-xs uppercase font-extrabold text-cobalt tracking-wider mb-1 block">Step 2 of 5</span>
                  <h3 className="text-2xl font-bold text-ink-navy">Screen & Display Panel</h3>
                  <p className="text-sm text-ink-muted mt-1">Examine the front screen glass and the back panel glass carefully.</p>
                </div>

                <div className="space-y-3 mt-6">
                  {/* Flawless Option */}
                  <div
                    onClick={() => setSelectedDefects(prev => prev.filter(d => d.category !== 'screen'))}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      !selectedDefects.some(d => d.category === 'screen')
                        ? 'border-cobalt bg-cobalt-light/30 shadow-sm'
                        : 'border-ice-border bg-canvas-white hover:border-cobalt/30'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-ink-navy">Flawless Display</h4>
                      <p className="text-xs text-ink-muted mt-0.5">No scratches, micro-abrasions, cracks, or screen bleeding.</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      !selectedDefects.some(d => d.category === 'screen') ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border'
                    }`}>
                      {!selectedDefects.some(d => d.category === 'screen') && <Check className="w-3 h-3" />}
                    </div>
                  </div>

                  {/* Cracked Glass Rule */}
                  {rules.filter(r => r.category === 'screen').map(defect => {
                    const isSelected = selectedDefects.some(d => d.id === defect.id);
                    return (
                      <div
                        key={defect.id}
                        onClick={() => handleToggleDefect(defect, defect.id === 'defect-screen-cracked' ? 'defect-screen-scratches' : undefined)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/30 shadow-sm'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-bold">
                              {defect.deductionPercentage > 0 ? `-${defect.deductionPercentage * 100}%` : `-${formatPrice(defect.deductionFixed)}`}
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5">{defect.subText}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
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
                <div className="mb-6">
                  <span className="text-xs uppercase font-extrabold text-cobalt tracking-wider mb-1 block">Step 3 of 5</span>
                  <h3 className="text-2xl font-bold text-ink-navy">Body Frame & Structural Status</h3>
                  <p className="text-sm text-ink-muted mt-1">Examine the aluminum/titanium frame side edges and corners.</p>
                </div>

                <div className="space-y-3 mt-6">
                  {/* Flawless Option */}
                  <div
                    onClick={() => setSelectedDefects(prev => prev.filter(d => d.category !== 'body'))}
                    className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                      !selectedDefects.some(d => d.category === 'body')
                        ? 'border-cobalt bg-cobalt-light/30 shadow-sm'
                        : 'border-ice-border bg-canvas-white hover:border-cobalt/30'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-sm text-ink-navy">Flawless Frame</h4>
                      <p className="text-xs text-ink-muted mt-0.5">No dents, bends, or paint scuffs. Device looks brand new.</p>
                    </div>
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                      !selectedDefects.some(d => d.category === 'body') ? 'bg-cobalt border-cobalt text-white' : 'border-ice-border'
                    }`}>
                      {!selectedDefects.some(d => d.category === 'body') && <Check className="w-3 h-3" />}
                    </div>
                  </div>

                  {/* Body Rules */}
                  {rules.filter(r => r.category === 'body').map(defect => {
                    const isSelected = selectedDefects.some(d => d.id === defect.id);
                    return (
                      <div
                        key={defect.id}
                        onClick={() => handleToggleDefect(defect, defect.id === 'defect-body-dented' ? 'defect-body-scuffs' : undefined)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/30 shadow-sm'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-bold">
                              {defect.deductionPercentage > 0 ? `-${defect.deductionPercentage * 100}%` : `-${formatPrice(defect.deductionFixed)}`}
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5">{defect.subText}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
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
                <div className="mb-6">
                  <span className="text-xs uppercase font-extrabold text-cobalt tracking-wider mb-1 block">Step 4 of 5</span>
                  <h3 className="text-2xl font-bold text-ink-navy">Hardware Functionality</h3>
                  <p className="text-sm text-ink-muted mt-1">Select any specific hardware component failures that apply.</p>
                </div>

                <div className="space-y-3 mt-6">
                  {rules.filter(r => ['camera', 'battery'].includes(r.category) || r.id === 'defect-critical-security').map(defect => {
                    const isSelected = selectedDefects.some(d => d.id === defect.id);
                    return (
                      <div
                        key={defect.id}
                        onClick={() => handleToggleDefect(defect)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-cobalt bg-cobalt-light/30 shadow-sm'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-bold">
                              {defect.deductionPercentage > 0 ? `-${defect.deductionPercentage * 100}%` : `-${formatPrice(defect.deductionFixed)}`}
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5">{defect.subText}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
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
                <div className="mb-6">
                  <span className="text-xs uppercase font-extrabold text-cobalt tracking-wider mb-1 block">Step 5 of 5</span>
                  <h3 className="text-2xl font-bold text-ink-navy">Original Accessories</h3>
                  <p className="text-sm text-ink-muted mt-1">Do you have the original retail box and OEM charging cable?</p>
                </div>

                <div className="space-y-3 mt-6">
                  {rules.filter(r => r.category === 'accessories' && !r.isCriticalFailure && r.id !== 'defect-critical-security').map(defect => {
                    const isSelected = selectedDefects.some(d => d.id === defect.id);
                    return (
                      <div
                        key={defect.id}
                        onClick={() => handleToggleDefect(defect)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'border-red-200 bg-red-50/20'
                            : 'border-ice-border bg-canvas-white hover:border-cobalt/30'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-sm text-ink-navy">{defect.description}</h4>
                            <span className="text-[10px] bg-red-50 text-red-500 px-1.5 py-0.5 rounded font-bold">
                              Deduct: {formatPrice(defect.deductionFixed)}
                            </span>
                          </div>
                          <p className="text-xs text-ink-muted mt-0.5">{defect.subText}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
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
                className="flex flex-col h-full justify-between"
              >
                <div>
                  <div className="mb-6">
                    <span className="text-xs uppercase font-extrabold text-emerald-600 tracking-wider mb-1 block">Diagnostics Complete</span>
                    <h3 className="text-2xl font-bold text-ink-navy">Canva-Style Valuation Report</h3>
                    <p className="text-sm text-ink-muted mt-1">Review the final computed trade-in receipt. Values are subject to doorside verification.</p>
                  </div>

                  {/* Canva Style premium receipt */}
                  <div className="border border-dashed border-slate-300 bg-slate-50/30 rounded-xl p-5 mb-6 text-sm relative overflow-hidden">
                    {/* Watermark/stamp */}
                    <div className="absolute -right-4 -top-4 w-24 h-24 rounded-full border-4 border-emerald-500/20 flex items-center justify-center rotate-12 select-none pointer-events-none">
                      <span className="text-[10px] font-extrabold text-emerald-500/30 uppercase tracking-widest">VERIFIED</span>
                    </div>

                    <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200">
                      <div>
                        <span className="text-[10px] text-ink-muted uppercase block">SmartphoneCentre Quote</span>
                        <span className="font-extrabold text-ink-navy">{model.name}</span>
                      </div>
                      <span className="text-xs font-semibold text-slate-500">REF: {Math.random().toString(36).substr(2, 9).toUpperCase()}</span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between font-semibold text-slate-600">
                        <span>Mint Base Value ({variant.storageGb}GB)</span>
                        <span>{formatPrice(variant.basePrice)}</span>
                      </div>

                      {valuation.deductions.length === 0 ? (
                        <div className="text-emerald-600 italic py-2 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 fill-emerald-600/20" /> No defects selected. You qualify for the maximum payout rate!
                        </div>
                      ) : (
                        <div className="py-2 space-y-1.5 border-t border-slate-100 mt-2">
                          <span className="text-[10px] uppercase font-bold text-red-500 block mb-1">Itemized Deductions</span>
                          {valuation.deductions.map((d, i) => (
                            <div key={i} className="flex justify-between text-slate-600 font-medium">
                              <span>- {d.description}</span>
                              <span className="text-red-500">-{formatPrice(d.totalDeducted)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-between items-center border-t border-dashed border-slate-300 pt-4 mt-4">
                      <div>
                        <span className="font-bold text-ink-navy block">Final Doorstep Offer</span>
                        <span className="text-[10px] text-emerald-600 flex items-center gap-1 mt-0.5"><Info className="w-3 h-3" /> Locked for 7 Days</span>
                      </div>
                      <span className="text-2xl font-black text-cobalt">{formatPrice(valuation.finalPrice)}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => onComplete(valuation.finalPrice, selectedDefects)}
                  className="w-full bg-cobalt hover:bg-cobalt-hover text-white py-4 rounded-xl font-extrabold text-center transition-all shadow-tactile flex items-center justify-center gap-2 group mt-4 hover:scale-[1.01]"
                >
                  Book Instant Doorstep Payout
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation panel */}
          {step < 5 && (
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 border-t border-ice-gray pt-4 sm:pt-6 mt-4 sm:mt-6">
              <button
                onClick={handlePrevStep}
                className="order-2 sm:order-1 px-5 py-2.5 rounded-xl border border-ice-border hover:bg-ice-gray text-ink-slate font-semibold text-sm transition-all"
              >
                Back
              </button>

              <button
                onClick={handleNextStep}
                className="order-1 sm:order-2 px-6 py-3 sm:py-2.5 bg-cobalt hover:bg-cobalt-hover text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-1.5 shadow-tactile"
              >
                {step === 4 ? 'Generate Report' : 'Next Step'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Right column: Live price estimator — hidden on mobile (replaced by mini bar) */}
        <div className="hidden lg:flex lg:col-span-5 bg-canvas-pure rounded-2xl border border-ice-border p-6 canva-shadow flex-col justify-between min-h-[300px]">
          <div>
            <div className="pb-4 border-b border-ice-gray mb-4">
              <h3 className="font-bold text-ink-navy flex items-center gap-2">
                <Activity className="w-5 h-5 text-cobalt" /> Live Valuation Meter
              </h3>
              <p className="text-xs text-ink-muted mt-1">Your device quote adapts dynamically based on diagnostic checkboxes.</p>
            </div>

            {/* Price Ring meter */}
            <div className="flex flex-col items-center py-6">
              <div className="relative w-40 h-40 rounded-full border-8 border-cobalt-light flex items-center justify-center shadow-inner">
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="72"
                    stroke="#1D4ED8"
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
                <div className="text-center z-10 px-2">
                  <span className="text-[10px] uppercase font-bold text-ink-muted block">Live Estimate</span>
                  <span className="text-2xl font-black text-ink-navy">{formatPrice(valuation.finalPrice)}</span>
                </div>
              </div>
              <span className="text-xs text-ink-slate font-medium mt-4 bg-ice-gray px-3 py-1 rounded-full border border-ice-border">
                Base Value: {formatPrice(variant.basePrice)}
              </span>
            </div>
          </div>

          {/* Quick list of currently declared issues */}
          {selectedDefects.length > 0 ? (
            <div className="border-t border-ice-gray pt-4 mt-2">
              <span className="text-[10px] uppercase font-bold text-ink-slate block mb-2">Declared Issues ({selectedDefects.length})</span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                {selectedDefects.map(d => (
                  <span key={d.id} className="text-[10px] font-semibold bg-red-50 text-red-600 px-2 py-0.5 rounded border border-red-100 flex items-center gap-1">
                    <Trash2 
                      onClick={() => handleToggleDefect(d)}
                      className="w-2.5 h-2.5 cursor-pointer text-red-400 hover:text-red-600" 
                    />
                    {d.description.length > 20 ? d.description.substring(0, 18) + '...' : d.description}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-xs text-ink-muted border-t border-ice-gray border-dashed">
              No defects declared. Maximum value applicable.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
