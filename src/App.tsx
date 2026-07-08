import { useState, useEffect } from 'react';
import { Model, Variant, DefectRule } from './data/mockDatabase';
import { DeviceSelector } from './components/DeviceSelector';
import { DiagnosticWizard } from './components/DiagnosticWizard';
import { PickupScheduler } from './components/PickupScheduler';
import { 
  Award, ShieldCheck, Zap, 
  RefreshCw, TrendingUp, FileText, Menu, X,
  Code, Database, Info, GitBranch
} from 'lucide-react';

// Helper to load/save from localStorage
const loadFromLocalStorage = <T,>(key: string, defaultValue: T): T => {
  const saved = localStorage.getItem(key);
  if (!saved) return defaultValue;
  try {
    return JSON.parse(saved) as T;
  } catch (e) {
    return defaultValue;
  }
};

interface SpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function SpecsModal({ isOpen, onClose }: SpecsModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-canvas-pure border border-ice-border rounded-lg max-w-3xl w-full max-h-[85vh] flex flex-col shadow-premium overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-ice-border bg-canvas-white">
          <div className="text-left">
            <h3 className="font-outfit font-light text-xl text-ink-navy">System Design Specification</h3>
            <span className="text-[10px] font-mono tracking-wider text-zinc-500 uppercase">SmartphoneCentre Architecture</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-sm border border-ice-border text-ink-slate hover:border-cobalt hover:text-cobalt transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        
        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left text-sm text-ink-slate leading-relaxed">
          {/* Section 1 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink-navy font-outfit font-light text-lg border-b border-white/[0.04] pb-1">
              <Info className="w-5 h-5 text-cobalt" />
              1. Business Architecture & Pillars
            </div>
            <p className="font-light">SmartphoneCentre bridges the gap between high-volume commercial supply and consumer convenience, structured across three key pillars:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="bg-canvas-white p-3 border border-ice-border rounded-sm">
                <span className="text-cobalt font-semibold block text-xs uppercase font-mono mb-1">C2B Sourcing</span>
                <p className="text-xs font-light text-zinc-500">Consumer direct digital self-diagnostic wizard for honest grading, instant dynamic valuations, and doorstep pickups.</p>
              </div>
              <div className="bg-canvas-white p-3 border border-ice-border rounded-sm">
                <span className="text-cobalt font-semibold block text-xs uppercase font-mono mb-1">B2B2C Ingestion</span>
                <p className="text-xs font-light text-zinc-500">A blind marketplace allowing vetted physical retail storefront partners to list refurbished inventory under strict grading rules.</p>
              </div>
              <div className="bg-canvas-white p-3 border border-ice-border rounded-sm">
                <span className="text-cobalt font-semibold block text-xs uppercase font-mono mb-1">B2C Storefront</span>
                <p className="text-xs font-light text-zinc-500">A masked, high-trust store (similar to Apple Certified Refurbished) featuring certified quality, warranties, and fulfillment.</p>
              </div>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink-navy font-outfit font-light text-lg border-b border-white/[0.04] pb-1">
              <Code className="w-5 h-5 text-cobalt" />
              2. Design System Specification
            </div>
            <p className="font-light">Following the Industrial Luxury visual model, the interface focuses on spatial tactile cards, micro-borders, and high-fidelity overlays.</p>
            <table className="w-full text-xs font-mono text-ink-slate border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] text-ink-navy text-left">
                  <th className="py-2">Token</th>
                  <th className="py-2">Color Space</th>
                  <th className="py-2">Role</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 text-zinc-300">Obsidian Canvas</td>
                  <td className="py-2 text-zinc-400">#09090B</td>
                  <td className="py-2">Main background canvas</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 text-zinc-300">Card Pure</td>
                  <td className="py-2 text-zinc-400">#121214</td>
                  <td className="py-2">Elevated surfaces & interactive panels</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 text-zinc-300">Industrial Cobalt</td>
                  <td className="py-2 text-zinc-400">#3B82F6 / #1D4ED8</td>
                  <td className="py-2">Brand focus, interactive states, locks</td>
                </tr>
                <tr className="border-b border-white/[0.04]">
                  <td className="py-2 text-zinc-300">Zinc Alabaster</td>
                  <td className="py-2 text-zinc-400">#F4F4F5</td>
                  <td className="py-2">Primary readable text</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Section 3 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink-navy font-outfit font-light text-lg border-b border-white/[0.04] pb-1">
              <GitBranch className="w-5 h-5 text-cobalt" />
              3. Dynamic Valuation Algorithm
            </div>
            <p className="font-light">Values are computed programmatically using base-to-defect pricing formula unique to each model variant:</p>
            <div className="bg-canvas-white p-4 rounded-sm border border-ice-border text-xs font-mono text-center text-cobalt">
              Price_Final = Price_Base - Σ ( Deduction_Fixed + ( Price_Base × Deduction_Percentage ) )
            </div>
            <div className="text-xs space-y-1 font-light text-zinc-500">
              <div>• <strong>Price_Base</strong>: Anchor price set for a flawless device variant.</div>
              <div>• <strong>Deduction_Fixed</strong>: Cash deduction applied for accessories (e.g. missing box).</div>
              <div>• <strong>Deduction_Percentage</strong>: Proportional penalty for wear/damage (e.g. 28% for flagship screen crack).</div>
              <div>• <strong>Category Caps</strong>: Screen (Max 40%), Body (Max 20%), Camera (Max 18%), Battery (Max 8%), Accessories (Max 12%). Prevent compounding deductions from driving value below an 8% baseline recycling floor.</div>
            </div>
          </div>

          {/* Section 4 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink-navy font-outfit font-light text-lg border-b border-white/[0.04] pb-1">
              <Database className="w-5 h-5 text-cobalt" />
              4. Core Relational Data Schema
            </div>
            <p className="font-light text-xs">A relational model binds brands, models, specific variants, defect rules, and customer bookings together:</p>
            <div className="bg-zinc-950 p-4 rounded-sm border border-ice-border text-xs font-mono overflow-x-auto text-zinc-300">
              {`BRANDS (id, name, logo)
└── MODELS (id, brand_id, name, category, release_year)
    ├── DEVICE_VARIANTS (id, model_id, storage_gb, color, base_price)
    └── DEFECT_RULES (id, category, description, fixed, percentage, is_critical)
        └── TRADE_IN_BOOKINGS (id, variant_id, customer_name, customer_phone, final_quote, address)`}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-ice-border bg-canvas-white flex justify-end">
          <button 
            onClick={onClose}
            className="px-5 py-2 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-sm transition-all"
          >
            Close Specifications
          </button>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [activeStage, setActiveStage] = useState<'select' | 'diagnose' | 'schedule'>(() => loadFromLocalStorage('stc_activeStage', 'select'));
  const [selectedModel, setSelectedModel] = useState<Model | null>(() => loadFromLocalStorage('stc_selectedModel', null));
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(() => loadFromLocalStorage('stc_selectedVariant', null));
  const [finalPrice, setFinalPrice] = useState<number>(() => loadFromLocalStorage('stc_finalPrice', 0));
  const [selectedDefects, setSelectedDefects] = useState<DefectRule[]>(() => loadFromLocalStorage('stc_selectedDefects', []));
  const [wizardStep, setWizardStep] = useState<number>(() => loadFromLocalStorage('stc_wizardStep', 0));
  
  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem('stc_activeStage', JSON.stringify(activeStage));
  }, [activeStage]);

  useEffect(() => {
    localStorage.setItem('stc_selectedModel', JSON.stringify(selectedModel));
  }, [selectedModel]);

  useEffect(() => {
    localStorage.setItem('stc_selectedVariant', JSON.stringify(selectedVariant));
  }, [selectedVariant]);

  useEffect(() => {
    localStorage.setItem('stc_finalPrice', JSON.stringify(finalPrice));
  }, [finalPrice]);

  useEffect(() => {
    localStorage.setItem('stc_selectedDefects', JSON.stringify(selectedDefects));
  }, [selectedDefects]);

  useEffect(() => {
    localStorage.setItem('stc_wizardStep', JSON.stringify(wizardStep));
  }, [wizardStep]);

  const handleVariantSelected = (model: Model, variant: Variant) => {
    setSelectedModel(model);
    setSelectedVariant(variant);
    setSelectedDefects([]);
    setWizardStep(0);
    setFinalPrice(variant.basePrice);
    setActiveStage('diagnose');
  };

  const handleDiagnosticsComplete = (price: number, defects: DefectRule[]) => {
    setFinalPrice(price);
    setSelectedDefects(defects);
    setActiveStage('schedule');
  };

  const handleReset = () => {
    setSelectedModel(null);
    setSelectedVariant(null);
    setSelectedDefects([]);
    setFinalPrice(0);
    setWizardStep(0);
    setActiveStage('select');
    setMobileMenuOpen(false);
    localStorage.removeItem('stc_activeStage');
    localStorage.removeItem('stc_selectedModel');
    localStorage.removeItem('stc_selectedVariant');
    localStorage.removeItem('stc_selectedDefects');
    localStorage.removeItem('stc_finalPrice');
    localStorage.removeItem('stc_wizardStep');
    localStorage.removeItem('stc_screenConfirmed');
    localStorage.removeItem('stc_bodyConfirmed');
    localStorage.removeItem('stc_funcConfirmed');
    localStorage.removeItem('stc_accConfirmed');
  };

  return (
    <div className="min-h-screen bg-canvas-white text-ink-navy flex flex-col font-sans">

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-canvas-pure/90 backdrop-blur-md border-b border-ice-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0" onClick={handleReset}>
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm bg-cobalt flex items-center justify-center text-white font-black text-base sm:text-lg">
              S
            </div>
            <div className="text-left">
              <h1 className="font-light text-base sm:text-lg tracking-tight text-ink-navy leading-none">SmartphoneCentre</h1>
              <span className="text-[8px] sm:text-[9px] font-mono tracking-[0.15em] text-zinc-500 uppercase block mt-0.5">Disruptive Trade-In</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-semibold text-ink-slate">
            <span className="hover:text-cobalt cursor-pointer transition-colors flex items-center gap-1 font-light">
              <ShieldCheck className="w-4 h-4 text-cobalt" />
              <span className="hidden lg:inline">Quality Stamp</span>
            </span>
            <span className="hover:text-cobalt cursor-pointer transition-colors flex items-center gap-1 font-light">
              <RefreshCw className="w-4 h-4 text-cobalt" />
              <span className="hidden lg:inline">How it Works</span>
            </span>
            <button 
              onClick={() => setIsSpecModalOpen(true)}
              className="px-3 py-2 rounded-sm bg-cobalt-light text-cobalt border border-white/[0.06] hover:bg-cobalt hover:text-white transition-all flex items-center gap-1 text-xs font-mono"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">System Spec</span>
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-sm border border-ice-border text-ink-slate hover:border-cobalt hover:text-cobalt transition-all"
            onClick={() => setMobileMenuOpen(o => !o)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile drop-down menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-ice-border bg-canvas-pure px-4 py-3 space-y-2 text-left">
            <button className="w-full flex items-center gap-2 text-sm font-semibold text-ink-slate py-2 px-3 rounded-sm hover:bg-ice-gray transition-colors">
              <ShieldCheck className="w-4 h-4 text-cobalt" /> Quality Stamp
            </button>
            <button className="w-full flex items-center gap-2 text-sm font-semibold text-ink-slate py-2 px-3 rounded-sm hover:bg-ice-gray transition-colors">
              <RefreshCw className="w-4 h-4 text-cobalt" /> How it Works
            </button>
            <button
              onClick={() => {
                setIsSpecModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 text-sm font-semibold text-cobalt py-2 px-3 rounded-sm bg-cobalt-light border border-white/[0.06] text-left"
            >
              <FileText className="w-4 h-4" /> View System Spec
            </button>
          </div>
        )}
      </header>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 flex flex-col xl:grid xl:grid-cols-12 gap-6 xl:gap-8 items-start">

        {/* Left: Active Flow */}
        <section className="w-full xl:col-span-9 space-y-4 sm:space-y-6 min-w-0">

          {activeStage === 'select' && (
            <div>
              {/* Hero Banner */}
              <div className="relative rounded-sm overflow-hidden mb-4 sm:mb-8 border border-white/[0.06] hero-gradient p-6 sm:p-10 flex flex-col items-start gap-4 justify-between shadow-premium">
                <div className="space-y-3 sm:space-y-4 max-w-2xl z-10 text-left">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">
                    Live Pricing Engine Active
                  </span>
                  <h2 className="text-3xl sm:text-4xl md:text-5xl font-light text-ink-navy leading-tight tracking-tight">
                    Evaluate Honestly. <br />
                    <span className="text-cobalt font-semibold">Get Paid Instantly.</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-slate leading-relaxed max-w-lg font-light">
                    Sell your device in 3 simple steps. Get an instant valuation, enjoy free doorstep pick-up, and receive on-the-spot digital payment.
                  </p>
                  <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-white/[0.04] w-full">
                    {['No Hidden Deductions', '7-Day Quote Lock', 'Free Pickup'].map(t => (
                      <div key={t} className="flex items-center gap-1.5 text-[9px] font-mono tracking-[0.1em] text-zinc-400 uppercase">
                        <span className="text-emerald-500">✓</span> {t}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Device Selector Card */}
              <div className="bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-6 shadow-premium">
                <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-white/[0.04] text-left">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">
                    Catalog / Hardware Selector
                  </span>
                  <h3 className="text-3xl font-light text-ink-navy tracking-tight">
                    Select Brand & Model
                  </h3>
                </div>
                <DeviceSelector onVariantSelected={handleVariantSelected} />
              </div>
            </div>
          )}

          {activeStage === 'diagnose' && selectedModel && selectedVariant && (
            <DiagnosticWizard
              model={selectedModel}
              variant={selectedVariant}
              onBack={handleReset}
              onComplete={handleDiagnosticsComplete}
              selectedDefects={selectedDefects}
              setSelectedDefects={setSelectedDefects}
              step={wizardStep}
              setStep={setWizardStep}
            />
          )}

          {activeStage === 'schedule' && selectedModel && selectedVariant && (
            <PickupScheduler
              finalPrice={finalPrice}
              onBack={() => setActiveStage('diagnose')}
              onSuccess={handleReset}
              selectedDefects={selectedDefects}
              selectedModel={selectedModel}
              selectedVariant={selectedVariant}
              onEditDevice={() => setActiveStage('select')}
            />
          )}
        </section>

        {/* Right: Sidebar — collapses to a 3-card row on mobile */}
        <aside className="w-full xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4 xl:gap-6 no-print">

            {/* Live Operations */}
            <div className="bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 shadow-premium">
              <div className="border-b border-white/[0.04] pb-2 mb-3 text-left">
                <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Telemetry Feed</span>
                <h4 className="font-light text-xl text-ink-navy">Live Operations</h4>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {[
                  { icon: <Zap className="w-4 h-4" />, bg: 'bg-cobalt-light text-cobalt', label: 'Avg. Agent Arrival', value: '~15 Min', delay: '0s' },
                  { icon: <TrendingUp className="w-4 h-4" />, bg: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20', label: 'Quote Accuracy', value: '99.4%', delay: '0.1s' },
                  { icon: <Award className="w-4 h-4" />, bg: 'bg-blue-500/10 text-blue-400 border border-blue-500/20', label: 'Devices Processed', value: '12,400+', delay: '0.2s' },
                ].map(s => (
                  <div key={s.label} className="flex items-center gap-3 group text-left">
                    <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-sm ${s.bg} flex items-center justify-center font-bold group-hover:scale-105 transition-transform flex-shrink-0`}>
                      {s.icon}
                    </div>
                    <div>
                      <span className="text-[9px] sm:text-[10px] text-zinc-500 font-mono tracking-wider uppercase block">{s.label}</span>
                      <span className="text-xs sm:text-sm font-bold text-ink-navy number-pop" style={{animationDelay: s.delay}}>{s.value}</span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-white/[0.04] text-left">
                  <div className="flex justify-between text-[9px] text-zinc-500 font-mono tracking-wider mb-1.5 uppercase">
                    <span>Today's Pickups</span>
                    <span className="font-bold text-cobalt">74%</span>
                  </div>
                  <div className="h-1 rounded-full bg-ice-gray overflow-hidden">
                    <div className="h-full rounded-full bg-cobalt progress-fill" style={{'--progress-width': '74%'} as React.CSSProperties} />
                  </div>
                </div>
              </div>
            </div>

            {/* Trade-In Guarantee Card */}
            <div className="bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 text-xs space-y-2 sm:space-y-3 text-left shadow-premium">
              <div className="border-b border-white/[0.04] pb-2 mb-2">
                <span className="text-[10px] font-mono tracking-[0.2em] text-cobalt uppercase block mb-1">Our Promise</span>
                <h4 className="font-light text-xl text-ink-navy">Trade-In Guarantee</h4>
              </div>
              <div className="space-y-3 text-[11px] font-light text-ink-slate leading-relaxed">
                <div className="flex gap-2 items-start">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <div>
                    <strong className="text-ink-navy block">7-Day Value Lock</strong>
                    Once you book, your quote is secured for 7 full days.
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <div>
                    <strong className="text-ink-navy block">Doorstep Verification</strong>
                    Zero hassle. We come to you and complete the deal.
                  </div>
                </div>
                <div className="flex gap-2 items-start">
                  <span className="text-emerald-500 font-bold">✓</span>
                  <div>
                    <strong className="text-ink-navy block">Secure Data Sanitation</strong>
                    Full compliance military-grade data wipe guarantee.
                  </div>
                </div>
              </div>
            </div>

            {/* Help */}
            <div className="bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 text-xs flex flex-col justify-between gap-3 text-left shadow-premium">
              <div>
                <span className="text-[10px] font-mono tracking-[0.2em] text-zinc-500 uppercase block mb-1">Support desk</span>
                <h4 className="font-light text-xl text-ink-navy">Need Help?</h4>
                <p className="mt-1 text-ink-muted text-[10px] sm:text-xs leading-relaxed font-light">Corporate trade-in, bulk logistics, or carrier lock valuations?</p>
              </div>
              <button className="w-full bg-cobalt hover:bg-cobalt-hover text-white py-2 rounded-sm font-bold text-xs transition-all">
                Connect to Helpdesk
              </button>
            </div>
          </aside>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-canvas-pure border-t border-ice-border mt-8 sm:mt-16 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-xs text-ink-muted gap-3 sm:gap-4 text-center sm:text-left">
          <span>© {new Date().getFullYear()} SmartphoneCentre Inc. All rights reserved.</span>
          <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
            <span className="hover:underline cursor-pointer">Terms & Conditions</span>
            <span className="hidden sm:inline">•</span>
            <span className="hover:underline cursor-pointer">Privacy Charter</span>
            <span className="hidden sm:inline">•</span>
            <span className="hover:underline cursor-pointer">Valuation API License</span>
          </div>
        </div>
      </footer>

      {/* Specs Modal */}
      <SpecsModal isOpen={isSpecModalOpen} onClose={() => setIsSpecModalOpen(false)} />
    </div>
  );
}
