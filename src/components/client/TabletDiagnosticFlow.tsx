import React from 'react';
import { Model, Variant, DefectRule } from '../../data/mockDatabase';
import { 
  Check, X, ShieldCheck, Power, Radio, CreditCard, FileText, 
  Camera, Fingerprint, ScanFace, Wifi, MapPin, 
  Bluetooth, Headphones, Volume2, Zap, Battery, Mic, VolumeX, 
  Box, Clock, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

export interface TabletDiagnosticFlowProps {
  model: Model;
  variant: Variant;
  step: number;
  rules: DefectRule[];
  selectedDefects: DefectRule[];
  setSelectedDefects: React.Dispatch<React.SetStateAction<DefectRule[]>>;
  warrantyAge: 'under_3m' | '3_to_6m' | '6_to_11m' | 'out_of_warranty';
  setWarrantyAge: (age: 'under_3m' | '3_to_6m' | '6_to_11m' | 'out_of_warranty') => void;
  showCriticalModal: (type: 'power' | 'icloud') => void;
  hasWarranty: boolean | null;
  setHasWarranty: (val: boolean) => void;
  formatPrice: (price: number) => string;
}

export const TabletDiagnosticFlow: React.FC<TabletDiagnosticFlowProps> = ({
  model,
  variant,
  step,
  rules,
  selectedDefects: rawSelectedDefects,
  setSelectedDefects,
  warrantyAge,
  setWarrantyAge,
  showCriticalModal,
  hasWarranty,
  setHasWarranty,
}) => {
  const selectedDefects = Array.isArray(rawSelectedDefects) ? rawSelectedDefects : [];

  // Helpers to check and toggle defect rules
  const hasDefect = (id: string) => selectedDefects.some(d => d.id === id);

  const toggleDefect = (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (!rule) return;
    setSelectedDefects(prev => {
      const current = Array.isArray(prev) ? prev : [];
      const exists = current.some(d => d.id === id);
      if (exists) {
        return current.filter(d => d.id !== id);
      } else {
        return [...current, rule];
      }
    });
  };

  const setSingleChoiceDefect = (chosenId: string, groupIds: string[]) => {
    setSelectedDefects(prev => {
      const current = Array.isArray(prev) ? prev : [];
      let next = current.filter(d => !groupIds.includes(d.id));
      if (chosenId && chosenId !== 'none') {
        const rule = rules.find(r => r.id === chosenId);
        if (rule) next.push(rule);
      }
      return next;
    });
  };

  // Determine if device supports cellular
  const isCellularModel = (variant as any).connectivity === 'cellular' || model.name.toLowerCase().includes('cellular') || (variant.color && variant.color.toLowerCase().includes('cellular'));

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 0: Preliminary Gatekeeper Questions
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === 0) {
    const isPowerOff = hasDefect('defect-critical-power');
    const isNetworkFailed = hasDefect('defect-tablet-network-fail');
    const isSimTrayMissing = hasDefect('defect-tablet-missing-sim-tray');
    const isBillMissing = hasDefect('defect-acc-missing-bill');

    return (
      <motion.div
        key="tablet-step-0"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="space-y-6 text-left"
      >
        <div className="border-b border-ice-border/70 pb-4">
          <span className="text-[11px] font-mono tracking-[0.2em] text-cobalt uppercase block mb-1 font-bold">
            Step 1 of 5 // Core Diagnostic Verification
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            Basic Functionality &amp; Warranty Check
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
            Please answer these preliminary questions regarding device status and documentation.
          </p>
        </div>

        {/* 1. Does the tablet switch on? */}
        <div className="p-4 rounded-xl border border-ice-border bg-slate-50/60 transition-all">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Power className="w-4 h-4 text-emerald-600" />
                <span>Does the tablet switch on?</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                We currently only accept devices that switch on without any issues.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-100 text-amber-800">
              Mandatory
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              type="button"
              onClick={() => {
                setSelectedDefects(prev => prev.filter(d => d.id !== 'defect-critical-power'));
              }}
              className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                !isPowerOff
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-ice-border hover:border-emerald-500/40'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Yes, Powers On</span>
            </button>

            <button
              type="button"
              onClick={() => {
                showCriticalModal('power');
              }}
              className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                isPowerOff
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-white text-slate-700 border-ice-border hover:border-red-500/40'
              }`}
            >
              <X className="w-4 h-4" />
              <span>No, Won't Turn On</span>
            </button>
          </div>
        </div>

        {/* 2. Is device network working properly? (Cellular models) */}
        {isCellularModel && (
          <div className="p-4 rounded-xl border border-ice-border bg-slate-50/60 transition-all">
            <div className="mb-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Radio className="w-4 h-4 text-cobalt" />
                <span>Is your device's network working properly?</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Check your device for cellular network connectivity issues.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                type="button"
                onClick={() => setSelectedDefects(prev => prev.filter(d => d.id !== 'defect-tablet-network-fail'))}
                className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  !isNetworkFailed
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-ice-border hover:border-emerald-500/40'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Yes, Network Working</span>
              </button>

              <button
                type="button"
                onClick={() => toggleDefect('defect-tablet-network-fail')}
                className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isNetworkFailed
                    ? 'bg-red-600 text-white border-red-600 shadow-sm'
                    : 'bg-white text-slate-700 border-ice-border hover:border-red-500/40'
                }`}
              >
                <X className="w-4 h-4" />
                <span>No, Network Issues</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Is your device's SIM tray available? */}
        {isCellularModel && (
          <div className="p-4 rounded-xl border border-ice-border bg-slate-50/60 transition-all">
            <div className="mb-2">
              <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-violet-600" />
                <span>Is your device's SIM tray available?</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Check the condition and presence of the physical SIM tray.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <button
                type="button"
                onClick={() => setSelectedDefects(prev => prev.filter(d => d.id !== 'defect-tablet-missing-sim-tray'))}
                className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  !isSimTrayMissing
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-white text-slate-700 border-ice-border hover:border-emerald-500/40'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>Yes, SIM Tray Present</span>
              </button>

              <button
                type="button"
                onClick={() => toggleDefect('defect-tablet-missing-sim-tray')}
                className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                  isSimTrayMissing
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-white text-slate-700 border-ice-border hover:border-amber-500/40'
                }`}
              >
                <X className="w-4 h-4" />
                <span>No, Tray Missing / Damaged</span>
              </button>
            </div>
          </div>
        )}

        {/* 4. Do you have GST valid bill with the same IMEI? */}
        <div className="p-4 rounded-xl border border-ice-border bg-slate-50/60 transition-all">
          <div className="mb-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-600" />
              <span>Do you have GST valid bill with the same IMEI / Serial Number?</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Make sure your bill has device IMEI/Serial mentioned on it.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              type="button"
              onClick={() => setSelectedDefects(prev => prev.filter(d => d.id !== 'defect-acc-missing-bill'))}
              className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                !isBillMissing
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-ice-border hover:border-emerald-500/40'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Yes, Valid Bill Available</span>
            </button>

            <button
              type="button"
              onClick={() => toggleDefect('defect-acc-missing-bill')}
              className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                isBillMissing
                  ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                  : 'bg-white text-slate-700 border-ice-border hover:border-amber-500/40'
              }`}
            >
              <X className="w-4 h-4" />
              <span>No Valid Bill</span>
            </button>
          </div>
        </div>

        {/* 5. Is your device under manufacturer warranty? */}
        <div className="p-4 rounded-xl border border-ice-border bg-slate-50/60 transition-all">
          <div className="mb-2">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Is your device under manufacturer warranty?</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              You can get a better price for your device if it's under manufacturer warranty with a GST valid bill.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <button
              type="button"
              onClick={() => setHasWarranty(true)}
              className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                hasWarranty === true
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-ice-border hover:border-emerald-500/40'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Yes, Under Brand Warranty</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setHasWarranty(false);
                setWarrantyAge('out_of_warranty');
              }}
              className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                hasWarranty === false
                  ? 'bg-slate-700 text-white border-slate-700 shadow-sm'
                  : 'bg-white text-slate-700 border-ice-border hover:border-slate-400'
              }`}
            >
              <X className="w-4 h-4" />
              <span>No / Expired Warranty</span>
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1: Screen Defects
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === 1) {
    const isTouchUnresponsive = hasDefect('defect-screen-touch');

    const physicalGroup = [
      'defect-screen-scratches-minor',
      'defect-screen-scratches-major',
      'defect-screen-chipped',
      'defect-screen-cracked'
    ];
    const activePhysical = physicalGroup.find(id => hasDefect(id)) || 'none';

    const discolorGroup = [
      'defect-screen-discolor-minor',
      'defect-screen-discolor-major',
      'defect-screen-shading'
    ];
    const activeDiscolor = discolorGroup.find(id => hasDefect(id)) || 'none';

    const spotGroup = [
      'defect-screen-spots-white-minor',
      'defect-screen-spots-multi',
      'defect-screen-lines',
      'defect-screen-light-leaks'
    ];
    const activeSpot = spotGroup.find(id => hasDefect(id)) || 'none';

    return (
      <motion.div
        key="tablet-step-1"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="space-y-6 text-left"
      >
        <div className="border-b border-ice-border/70 pb-4">
          <span className="text-[11px] font-mono tracking-[0.2em] text-cobalt uppercase block mb-1 font-bold">
            Step 2 of 5 // Screen &amp; Touch Evaluation
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            Tell us more about your device's screen defects
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
            Please choose the appropriate condition to get an accurate price quote.
          </p>
        </div>

        {/* 1. Touch screen working */}
        <div className="p-4 rounded-xl border border-ice-border bg-slate-50/60">
          <h4 className="font-bold text-sm text-slate-900 mb-1">
            Is the tablet/iPad touch screen working properly?
          </h4>
          <p className="text-xs text-slate-500 mb-3">
            Check the touch screen functionality across the entire display.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setSelectedDefects(prev => prev.filter(d => d.id !== 'defect-screen-touch'))}
              className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                !isTouchUnresponsive
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                  : 'bg-white text-slate-700 border-ice-border hover:border-emerald-500/40'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Yes, Touch Working</span>
            </button>

            <button
              type="button"
              onClick={() => toggleDefect('defect-screen-touch')}
              className={`py-3 px-4 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                isTouchUnresponsive
                  ? 'bg-red-600 text-white border-red-600 shadow-sm'
                  : 'bg-white text-slate-700 border-ice-border hover:border-red-500/40'
              }`}
            >
              <X className="w-4 h-4" />
              <span>No, Touch Issue</span>
            </button>
          </div>
        </div>

        {/* 2. Screen Physical Condition */}
        <div className="p-4 rounded-xl border border-ice-border bg-slate-50/60">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-sm text-slate-900">Screen Physical Condition</h4>
            <span className="text-[10px] font-mono text-zinc-400">Physical Grade</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Check physical condition of Display Screen glass.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { id: 'none', label: 'No scratches on screen', desc: 'Flawless glass condition' },
              { id: 'defect-screen-scratches-minor', label: '1-2 scratches on screen', desc: 'Minor hairline scratches' },
              { id: 'defect-screen-scratches-major', label: 'More than 2 scratches on screen', desc: 'Multiple noticeable scratches' },
              { id: 'defect-screen-chipped', label: 'Chipped outside display area', desc: 'Glass chip on corner or bevel' },
              { id: 'defect-screen-cracked', label: 'Screen cracked / glass broken', desc: 'Cracked, fractured or broken glass' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSingleChoiceDefect(opt.id, physicalGroup)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  activePhysical === opt.id
                    ? 'border-cobalt bg-cobalt/5 ring-1 ring-cobalt/30'
                    : 'border-ice-border bg-white hover:border-cobalt/40'
                }`}
              >
                <div>
                  <span className="block text-xs font-bold text-slate-900">{opt.label}</span>
                  <span className="block text-[10px] text-slate-400 font-light mt-0.5">{opt.desc}</span>
                </div>
                {activePhysical === opt.id && <CheckCircle2 className="w-4 h-4 text-cobalt flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Discoloration on Screen */}
        <div className="p-4 rounded-xl border border-ice-border bg-slate-50/60">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-sm text-slate-900">Discoloration on Screen</h4>
            <span className="text-[10px] font-mono text-zinc-400">Panel Calibration</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Check tablet/iPad screen for discoloration or warm tints.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { id: 'none', label: 'No Discoloration', desc: 'Even, pristine display color' },
              { id: 'defect-screen-discolor-minor', label: 'Minor Discoloration', desc: 'Slight yellow / pinkish warm tint' },
              { id: 'defect-screen-discolor-major', label: 'Major Discoloration', desc: 'Heavy yellowing or color burn-in' },
              { id: 'defect-screen-shading', label: 'Screen Shading / Fading', desc: 'Backlight shading or faded contrast' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSingleChoiceDefect(opt.id, discolorGroup)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  activeDiscolor === opt.id
                    ? 'border-cobalt bg-cobalt/5 ring-1 ring-cobalt/30'
                    : 'border-ice-border bg-white hover:border-cobalt/40'
                }`}
              >
                <div>
                  <span className="block text-xs font-bold text-slate-900">{opt.label}</span>
                  <span className="block text-[10px] text-slate-400 font-light mt-0.5">{opt.desc}</span>
                </div>
                {activeDiscolor === opt.id && <CheckCircle2 className="w-4 h-4 text-cobalt flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Spot on Screen */}
        <div className="p-4 rounded-xl border border-ice-border bg-slate-50/60">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-sm text-slate-900">Spot on Screen</h4>
            <span className="text-[10px] font-mono text-zinc-400">Matrix Check</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Check tablet/iPad screen for visible spots or lines.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { id: 'none', label: 'No Spot On Screen', desc: 'Clean, spotless display' },
              { id: 'defect-screen-spots-white-minor', label: '1-2 very small white spots', desc: 'Faint pressure bright spots' },
              { id: 'defect-screen-spots-multi', label: '3 or more white spots or colored spots', desc: 'Noticeable dead or colored spots' },
              { id: 'defect-screen-lines', label: 'Lines visible on screen', desc: 'Vertical or horizontal colored lines' },
              { id: 'defect-screen-light-leaks', label: 'Light leaks around edges of display', desc: 'Perimeter bezel backlight glow' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSingleChoiceDefect(opt.id, spotGroup)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  activeSpot === opt.id
                    ? 'border-cobalt bg-cobalt/5 ring-1 ring-cobalt/30'
                    : 'border-ice-border bg-white hover:border-cobalt/40'
                }`}
              >
                <div>
                  <span className="block text-xs font-bold text-slate-900">{opt.label}</span>
                  <span className="block text-[10px] text-slate-400 font-light mt-0.5">{opt.desc}</span>
                </div>
                {activeSpot === opt.id && <CheckCircle2 className="w-4 h-4 text-cobalt flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2: Functional or Physical Problems (15 conditions)
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === 2) {
    const functionalItems = [
      { id: 'defect-func-front-camera', label: 'Front Camera not working', icon: Camera, desc: 'FaceTime / selfie camera failure' },
      { id: 'defect-func-back-camera', label: 'Back Camera not working', icon: Camera, desc: 'Rear camera sensor blur / blank' },
      { id: 'defect-func-camera-glass', label: 'Camera Glass Broken/Missing', icon: AlertTriangle, desc: 'Rear lens cover broken or missing' },
      { id: 'defect-func-touch-id', label: 'Finger/Touch ID Sensor not working', icon: Fingerprint, desc: 'Touch ID fails to register' },
      { id: 'defect-func-face-id', label: 'Face Sensor not working', icon: ScanFace, desc: 'Face ID / TrueDepth failure' },
      { id: 'defect-func-wifi', label: 'Wifi not working', icon: Wifi, desc: 'Cannot scan or connect to Wi-Fi' },
      { id: 'defect-func-gps', label: 'GPS not working', icon: MapPin, desc: 'Location drift / GPS failure' },
      { id: 'defect-func-bluetooth', label: 'Bluetooth not working', icon: Bluetooth, desc: 'Cannot pair Bluetooth devices' },
      { id: 'defect-func-audio-jack', label: 'Audio Jack not Working', icon: Headphones, desc: 'Headphone port loose or distorted' },
      { id: 'defect-func-volume-buttons', label: 'Volume Button Missing / Not Working', icon: Volume2, desc: 'Volume rocker jammed or broken' },
      { id: 'defect-func-power-button', label: 'Power Button Broken/ Not working / Missing', icon: Power, desc: 'Top power button unresponsive' },
      { id: 'defect-func-charging', label: 'Charging Defect; unable to charge', icon: Zap, desc: 'Port loose or fails to charge' },
      { id: 'defect-battery-low', label: 'Battery Faulty or not working', icon: Battery, desc: 'Drains rapidly or swollen' },
      { id: 'defect-func-mic', label: 'Microphone not working', icon: Mic, desc: 'Voice recording muffled or silent' },
      { id: 'defect-func-speaker', label: 'Speaker not working; faulty Or cracked sound', icon: VolumeX, desc: 'Audio rattles or distorted' }
    ];

    const hasAnyFunctionalSelected = functionalItems.some(item => hasDefect(item.id));

    return (
      <motion.div
        key="tablet-step-2"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="space-y-6 text-left"
      >
        <div className="border-b border-ice-border/70 pb-4">
          <span className="text-[11px] font-mono tracking-[0.2em] text-cobalt uppercase block mb-1 font-bold">
            Step 3 of 5 // Hardware &amp; Component Verification
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            Functional or Physical Problems
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
            Please select any problems that apply to your tablet to get an accurate quote.
          </p>
        </div>

        {/* Flawless button */}
        <div
          onClick={() => {
            const funcIds = functionalItems.map(f => f.id);
            setSelectedDefects(prev => prev.filter(d => !funcIds.includes(d.id)));
          }}
          className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
            !hasAnyFunctionalSelected
              ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500/30'
              : 'border-ice-border bg-white hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
              !hasAnyFunctionalSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-700'
            }`}>
              <Check className="w-4 h-4 stroke-[2.5]" />
            </div>
            <div>
              <h5 className="font-bold text-xs text-slate-900">None of the Above / All Hardware Fully Functional</h5>
              <p className="text-[10px] text-slate-500 mt-0.5">Cameras, sensors, buttons, audio and wireless components work perfectly.</p>
            </div>
          </div>
          {!hasAnyFunctionalSelected && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
        </div>

        {/* Functional items grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {functionalItems.map(item => {
            const isSelected = hasDefect(item.id);
            const Icon = item.icon;
            return (
              <div
                key={item.id}
                onClick={() => toggleDefect(item.id)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 text-left ${
                  isSelected
                    ? 'border-red-500 bg-red-50/60 ring-1 ring-red-500/30'
                    : 'border-ice-border bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  isSelected ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-bold text-xs text-slate-900 leading-snug">{item.label}</span>
                    <span className="text-[9px] font-mono px-1 rounded bg-slate-100 text-slate-500 flex-shrink-0">
                      Standard
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-light mt-1">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3: Body Defects
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === 3) {
    const scratchGroup = [
      'defect-body-scratches-minor',
      'defect-body-scratches-major'
    ];
    const activeScratch = scratchGroup.find(id => hasDefect(id)) || 'none';

    const dentGroup = [
      'defect-body-dents-minor',
      'defect-body-dents-major'
    ];
    const activeDent = dentGroup.find(id => hasDefect(id)) || 'none';

    const bentGroup = [
      'defect-body-bent',
      'defect-body-screen-loose',
      'defect-body-bent-and-loose'
    ];
    const activeBent = bentGroup.find(id => hasDefect(id)) || 'none';

    const panelGroup = [
      'defect-body-panel-gap',
      'defect-body-panel-chipped',
      'defect-body-panel-broken',
      'defect-body-panel-missing'
    ];
    const activePanel = panelGroup.find(id => hasDefect(id)) || 'none';

    return (
      <motion.div
        key="tablet-step-3"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="space-y-6 text-left"
      >
        <div className="border-b border-ice-border/70 pb-4">
          <span className="text-[11px] font-mono tracking-[0.2em] text-cobalt uppercase block mb-1 font-bold">
            Step 4 of 5 // Chassis &amp; Physical Body
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            Tell us more about your device's body defects
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
            Please choose the appropriate condition to get an accurate price.
          </p>
        </div>

        {/* 1. Body Scratches */}
        <div className="p-4 rounded-xl border border-ice-border bg-slate-50/60">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-sm text-slate-900">Body Scratches</h4>
            <span className="text-[10px] font-mono text-zinc-400">Enclosure Grade</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Check scratches on tablet/iPad body housing.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'none', label: 'No scratches', desc: 'Pristine metal finish' },
              { id: 'defect-body-scratches-minor', label: '1-2 scratches', desc: 'Faint hairline scuffs' },
              { id: 'defect-body-scratches-major', label: 'More than 2 scratches', desc: 'Multiple visible scratches' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSingleChoiceDefect(opt.id, scratchGroup)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  activeScratch === opt.id
                    ? 'border-cobalt bg-cobalt/5 ring-1 ring-cobalt/30'
                    : 'border-ice-border bg-white hover:border-cobalt/40'
                }`}
              >
                <div>
                  <span className="block text-xs font-bold text-slate-900">{opt.label}</span>
                  <span className="block text-[10px] text-slate-400 font-light mt-0.5">{opt.desc}</span>
                </div>
                {activeScratch === opt.id && <CheckCircle2 className="w-4 h-4 text-cobalt flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Body or Panel Dents */}
        <div className="p-4 rounded-xl border border-ice-border bg-slate-50/60">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-sm text-slate-900">Body or Panel Dents</h4>
            <span className="text-[10px] font-mono text-zinc-400">Structural Check</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Check for dents or impact marks on tablet/iPad body.</p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {[
              { id: 'none', label: 'No dents', desc: 'Flawless corner & rim contours' },
              { id: 'defect-body-dents-minor', label: '1-2 minor dents', desc: 'Small cosmetic corner dimples' },
              { id: 'defect-body-dents-major', label: 'Major dent(s) or more than 2', desc: 'Heavy impacts or deep gouges' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSingleChoiceDefect(opt.id, dentGroup)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  activeDent === opt.id
                    ? 'border-cobalt bg-cobalt/5 ring-1 ring-cobalt/30'
                    : 'border-ice-border bg-white hover:border-cobalt/40'
                }`}
              >
                <div>
                  <span className="block text-xs font-bold text-slate-900">{opt.label}</span>
                  <span className="block text-[10px] text-slate-400 font-light mt-0.5">{opt.desc}</span>
                </div>
                {activeDent === opt.id && <CheckCircle2 className="w-4 h-4 text-cobalt flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* 3. Device bent or screen loose */}
        <div className="p-4 rounded-xl border border-ice-border bg-slate-50/60">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-sm text-slate-900">Device bent or screen loose</h4>
            <span className="text-[10px] font-mono text-zinc-400">Alignment Check</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Check for structural chassis bend or loose screen adhesive.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { id: 'none', label: 'Not bent or loose screen', desc: 'Completely flat and secure' },
              { id: 'defect-body-bent', label: 'Body Bent', desc: 'Chassis visibly warped or curved' },
              { id: 'defect-body-screen-loose', label: 'Loose Screen', desc: 'Screen lifting away from frame' },
              { id: 'defect-body-bent-and-loose', label: 'Both bent and loose screen', desc: 'Structural warp with lifting digitizer' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSingleChoiceDefect(opt.id, bentGroup)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  activeBent === opt.id
                    ? 'border-cobalt bg-cobalt/5 ring-1 ring-cobalt/30'
                    : 'border-ice-border bg-white hover:border-cobalt/40'
                }`}
              >
                <div>
                  <span className="block text-xs font-bold text-slate-900">{opt.label}</span>
                  <span className="block text-[10px] text-slate-400 font-light mt-0.5">{opt.desc}</span>
                </div>
                {activeBent === opt.id && <CheckCircle2 className="w-4 h-4 text-cobalt flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Device Side/Back Panel Condition */}
        <div className="p-4 rounded-xl border border-ice-border bg-slate-50/60">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-sm text-slate-900">Device Side / Back Panel Condition</h4>
            <span className="text-[10px] font-mono text-zinc-400">Housing Grade</span>
          </div>
          <p className="text-xs text-slate-500 mb-3">Check tablet/iPad side &amp; back panels.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {[
              { id: 'none', label: 'No Defect in Panel', desc: 'Back panel tight and intact' },
              { id: 'defect-body-panel-gap', label: 'Visible gap between body and back panel', desc: 'Seam separation along edges' },
              { id: 'defect-body-panel-chipped', label: 'Back panel chipped on edges', desc: 'Corner chipped or gouged' },
              { id: 'defect-body-panel-broken', label: 'Back panel broken / shattered', desc: 'Cracked or shattered enclosure' },
              { id: 'defect-body-panel-missing', label: 'Back panel missing', desc: 'Panel detached with internals exposed' }
            ].map(opt => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setSingleChoiceDefect(opt.id, panelGroup)}
                className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                  activePanel === opt.id
                    ? 'border-cobalt bg-cobalt/5 ring-1 ring-cobalt/30'
                    : 'border-ice-border bg-white hover:border-cobalt/40'
                }`}
              >
                <div>
                  <span className="block text-xs font-bold text-slate-900">{opt.label}</span>
                  <span className="block text-[10px] text-slate-400 font-light mt-0.5">{opt.desc}</span>
                </div>
                {activePanel === opt.id && <CheckCircle2 className="w-4 h-4 text-cobalt flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 4: Accessories & Tablet Age
  // ─────────────────────────────────────────────────────────────────────────────
  if (step === 4) {
    const isChargerMissing = hasDefect('defect-acc-missing-charger');
    const isBoxMissing = hasDefect('defect-acc-missing-box');

    return (
      <motion.div
        key="tablet-step-4"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="space-y-6 text-left"
      >
        <div className="border-b border-ice-border/70 pb-4">
          <span className="text-[11px] font-mono tracking-[0.2em] text-cobalt uppercase block mb-1 font-bold">
            Step 5 of 5 // Packaging &amp; Warranty Age
          </span>
          <h3 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            Accessories &amp; Device Age
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 mt-1.5 font-medium">
            Please select the accessories you have and verify your device's warranty tier.
          </p>
        </div>

        {/* 1. Do you have the following accessories? */}
        <div className="p-4 rounded-xl border border-ice-border bg-slate-50/60">
          <h4 className="font-bold text-sm text-slate-900 mb-1">
            Do you have the following accessories?
          </h4>
          <p className="text-xs text-slate-500 mb-3.5">
            Select the original accessories that will be provided during pickup.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Charger */}
            <div
              onClick={() => toggleDefect('defect-acc-missing-charger')}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                !isChargerMissing
                  ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500/30'
                  : 'border-ice-border bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  !isChargerMissing ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900">Charger Available</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">Original power adapter &amp; charging cable</p>
                </div>
              </div>
              {!isChargerMissing ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-slate-300" />
              )}
            </div>

            {/* Box with same IMEI */}
            <div
              onClick={() => toggleDefect('defect-acc-missing-box')}
              className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                !isBoxMissing
                  ? 'border-emerald-500 bg-emerald-50/70 ring-1 ring-emerald-500/30'
                  : 'border-ice-border bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  !isBoxMissing ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                }`}>
                  <Box className="w-5 h-5" />
                </div>
                <div>
                  <h5 className="font-bold text-xs text-slate-900">Box with same IMEI / Serial</h5>
                  <p className="text-[10px] text-slate-500 mt-0.5">Original retail box with matching serial tag</p>
                </div>
              </div>
              {!isBoxMissing ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              ) : (
                <div className="w-5 h-5 rounded-full border border-slate-300" />
              )}
            </div>
          </div>
        </div>

        {/* 2. What is your tablet/iPad age? */}
        <div className="p-4 rounded-xl border border-ice-border bg-slate-50/60">
          <div className="flex items-center justify-between mb-1">
            <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-cobalt" />
              <span>What is your tablet/iPad age?</span>
            </h4>
            {hasWarranty && (
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                Under Warranty
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-3.5">
            {hasWarranty 
              ? 'Because you selected your device is under brand warranty, please specify exact age.' 
              : 'Select age bracket to apply appropriate depreciation factor.'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'under_3m', label: 'Below 3 months', desc: '100% Value + Bonus' },
              { id: '3_to_6m', label: '3 - 6 months', desc: 'Active Brand Warranty' },
              { id: '6_to_11m', label: '6 - 11 months', desc: 'Warranty Expiring Soon' },
              { id: 'out_of_warranty', label: 'Above 11 months', desc: 'Out of Warranty' }
            ].map(age => (
              <button
                key={age.id}
                type="button"
                onClick={() => setWarrantyAge(age.id as any)}
                className={`p-3.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  warrantyAge === age.id
                    ? 'border-cobalt bg-cobalt/5 ring-1 ring-cobalt/30'
                    : 'border-ice-border bg-white hover:border-cobalt/40'
                }`}
              >
                <span className="block text-xs font-bold text-slate-900 mb-1">{age.label}</span>
                <span className="block text-[10px] text-slate-400 font-light">{age.desc}</span>
                {warrantyAge === age.id && (
                  <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-cobalt">
                    <Check className="w-3.5 h-3.5" />
                    <span>Selected</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};
