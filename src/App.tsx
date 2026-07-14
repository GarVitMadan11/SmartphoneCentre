import { useState, useEffect, useRef } from 'react';
import { Model, Variant, DefectRule, MODELS, generateVariantsForModel, INITIAL_BOOKINGS } from './data/mockDatabase';
import { DeviceSelector } from './components/DeviceSelector';
import { DiagnosticWizard } from './components/DiagnosticWizard';
import { PickupScheduler } from './components/PickupScheduler';
import { SmartphoneMockup } from './components/SmartphoneMockup';
import { AdminPanel } from './components/AdminPanel';
import { 
  Award, ShieldCheck, Zap, 
  RefreshCw, TrendingUp, FileText, Menu, X,
  Code, Database, Info, GitBranch, ShieldAlert
} from 'lucide-react';

import applePhoneImg from './assets/apple_phone.png';
import samsungPhoneImg from './assets/samsung_phone.png';
import oneplusPhoneImg from './assets/oneplus_phone.png';

// ── Secure localStorage helpers ──────────────────────────────────────────────
// Only non-sensitive navigation state is persisted (activeStage, wizardStep).
// PII and financial data (model, variant, price, defects) live in React state only.

const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface StoredNavState {
  activeStage: 'select' | 'diagnose' | 'schedule' | 'admin';
  wizardStep: number;
  timestamp: number;
}

function loadNavState(): StoredNavState | null {
  try {
    const raw = localStorage.getItem('stc_nav');
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredNavState;
    // Validate shape and TTL
    if (
      typeof parsed !== 'object' || parsed === null ||
      !['select', 'diagnose', 'schedule', 'admin'].includes(parsed.activeStage) ||
      typeof parsed.wizardStep !== 'number' ||
      typeof parsed.timestamp !== 'number' ||
      Date.now() - parsed.timestamp > SESSION_TTL_MS
    ) {
      localStorage.removeItem('stc_nav');
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem('stc_nav');
    return null;
  }
}

function saveNavState(state: Omit<StoredNavState, 'timestamp'>) {
  try {
    localStorage.setItem('stc_nav', JSON.stringify({ ...state, timestamp: Date.now() }));
  } catch {
    // Silently fail if storage is full
  }
}

function clearNavState() {
  localStorage.removeItem('stc_nav');
}

// ────────────────────────────────────────────────────────────────────────────

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
              1. Business Architecture &amp; Pillars
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
                  <td className="py-2">Elevated surfaces &amp; interactive panels</td>
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
              {`BRANDS (id, name, logo)\n└── MODELS (id, brand_id, name, category, release_year)\n    ├── DEVICE_VARIANTS (id, model_id, storage_gb, color, base_price)\n    └── DEFECT_RULES (id, category, description, fixed, percentage, is_critical)\n        └── TRADE_IN_BOOKINGS (id, variant_id, customer_name, customer_phone, final_quote, address)`}
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
  // ── Navigation state — persisted in localStorage with TTL (non-sensitive) ──
  const savedNav = useRef(loadNavState());
  const [activeStage, setActiveStage] = useState<'select' | 'diagnose' | 'schedule' | 'admin'>(
    savedNav.current?.activeStage ?? 'select'
  );
  const [wizardStep, setWizardStep] = useState<number>(savedNav.current?.wizardStep ?? 0);

  // ── Sensitive state — React memory only, never persisted to storage ────────
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [selectedDefects, setSelectedDefects] = useState<DefectRule[]>([]);

  const [isSpecModalOpen, setIsSpecModalOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Admin access authorization state
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);

  const handleAdminClick = () => {
    setMobileMenuOpen(false);
    if (activeStage === 'admin') {
      setActiveStage('select');
    } else if (isAdminAuthorized) {
      setActiveStage('admin');
    } else {
      setShowAdminLogin(true);
    }
  };

  // Persist only non-sensitive navigation hints
  useEffect(() => {
    // If user is at 'select' stage with default step, don't clutter storage
    if ((activeStage === 'select' || activeStage === 'admin') && wizardStep === 0) {
      clearNavState();
    } else {
      saveNavState({ activeStage, wizardStep });
    }
  }, [activeStage, wizardStep]);

  const handleVariantSelected = (model: Model, variant: Variant) => {
    setSelectedModel(model);
    setSelectedVariant(variant);
    setSelectedDefects([]);
    setWizardStep(0);
    setFinalPrice(variant.basePrice);
    setActiveStage('diagnose');
  };

  const handleDirectSelectModel = (modelId: string) => {
    const model = MODELS.find(m => m.id === modelId);
    if (model) {
      const variants = generateVariantsForModel(model);
      if (variants && variants.length > 0) {
        handleVariantSelected(model, variants[0]);
      }
    }
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
    clearNavState();
  };

  return (
    <div className="min-h-screen bg-canvas-white text-ink-navy flex flex-col font-sans selection:bg-cobalt selection:text-white">

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-ice-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2 cursor-pointer flex-shrink-0" onClick={handleReset}>
            <div className="w-8 h-8 rounded-lg bg-cobalt flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            </div>
            <span className="text-xl font-extrabold text-ink-navy tracking-tight">Reliable<span className="text-secondary">Exchange</span></span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-semibold text-ink-slate">
            <span onClick={handleReset} className="hover:text-cobalt cursor-pointer transition-colors flex items-center gap-1 font-light">
              <ShieldCheck className="w-4 h-4 text-secondary" />
              <span className="hidden lg:inline">Trusted Partner</span>
            </span>
            <span onClick={() => {
              if (activeStage === 'select') {
                document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
              } else {
                handleReset();
                setTimeout(() => {
                  document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }
            }} className="hover:text-cobalt cursor-pointer transition-colors flex items-center gap-1 font-light">
              <RefreshCw className="w-4 h-4 text-secondary" />
              <span>How it Works</span>
            </span>
            <button 
              onClick={() => setIsSpecModalOpen(true)}
              className="px-3 py-2 rounded-sm bg-cobalt-light text-cobalt border border-ice-border hover:bg-cobalt hover:text-white transition-all flex items-center gap-1 text-xs font-mono"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">System Spec</span>
            </button>
            <button 
              onClick={handleAdminClick}
              className={`px-3 py-2 rounded-sm border transition-all flex items-center gap-1 text-xs font-mono ${
                activeStage === 'admin' 
                  ? 'bg-cobalt text-white border-cobalt shadow-sm' 
                  : 'bg-white hover:bg-zinc-100 text-ink-navy border-ice-border hover:border-cobalt/40'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Admin Panel</span>
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
            <button onClick={handleReset} className="w-full flex items-center gap-2 text-sm font-semibold text-ink-slate py-2 px-3 rounded-sm hover:bg-ice-gray transition-colors">
              <ShieldCheck className="w-4 h-4 text-secondary" /> Trusted Partner
            </button>
            <button 
              onClick={() => {
                setMobileMenuOpen(false);
                if (activeStage === 'select') {
                  document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  handleReset();
                  setTimeout(() => {
                    document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              }} 
              className="w-full flex items-center gap-2 text-sm font-semibold text-ink-slate py-2 px-3 rounded-sm hover:bg-ice-gray transition-colors"
            >
              <RefreshCw className="w-4 h-4 text-secondary" /> How it Works
            </button>
            <button
              onClick={() => {
                setIsSpecModalOpen(true);
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 text-sm font-semibold text-cobalt py-2 px-3 rounded-sm bg-cobalt-light border border-ice-border text-left"
            >
              <FileText className="w-4 h-4" /> View System Spec
            </button>
            <button
              onClick={handleAdminClick}
              className={`w-full flex items-center gap-2 text-sm font-semibold py-2 px-3 rounded-sm text-left border ${
                activeStage === 'admin' 
                  ? 'bg-cobalt text-white border-cobalt' 
                  : 'bg-canvas-white hover:bg-ice-gray text-ink-slate border-ice-border'
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> Admin Panel
            </button>
          </div>
        )}
      </header>

      {/* ── Main Layout ── */}
      <main className={`flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 ${(activeStage === 'select' || activeStage === 'admin') ? 'max-w-7xl flex flex-col' : 'max-w-7xl flex flex-col xl:grid xl:grid-cols-12 gap-6 xl:gap-8 items-start'}`}>

        {/* Active Stage Content Area */}
        <section className={(activeStage === 'select' || activeStage === 'admin') ? 'w-full space-y-16' : 'w-full xl:col-span-9 space-y-4 sm:space-y-6 min-w-0'}>

          {activeStage === 'select' && (
            <div className="space-y-16 py-4">
              {/* 1. Hero Section */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                {/* Hero Call to Action */}
                <div className="lg:col-span-7 flex flex-col items-start text-left">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary mb-6 tracking-wide uppercase">
                    ★ #1 Trusted Resale Partner
                  </span>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-ink-navy tracking-tight leading-none mb-6">
                    Sell Your Smartphone <br className="hidden sm:inline" />for the <span className="text-secondary">Best Price</span>
                  </h1>
                  <p className="text-base sm:text-lg text-ink-slate mb-8 max-w-xl font-light leading-relaxed">
                    Get an instant valuation, free doorstep pickup, and instant cash payment. No hidden deductions, guaranteed.
                  </p>

                  {/* Search Bar Suggestion */}
                  <div className="w-full max-w-lg bg-canvas-pure p-2 rounded-lg border border-ice-border flex items-center gap-2 mb-8 shadow-sm">
                    <div className="flex-1 relative">
                      <svg className="w-5 h-5 text-ink-muted absolute left-3 top-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input 
                        type="text" 
                        placeholder="Search model (e.g. iPhone 15 Pro, Galaxy S24)..." 
                        onClick={() => document.getElementById('device-selector-section')?.scrollIntoView({ behavior: 'smooth' })}
                        className="w-full pl-10 pr-4 py-3 text-sm bg-transparent text-ink-navy placeholder:text-ink-muted focus:outline-none" 
                      />
                    </div>
                    <button 
                      onClick={() => document.getElementById('device-selector-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="bg-cobalt hover:bg-cobalt-hover text-white px-5 py-3 rounded-sm text-sm font-semibold transition-all shadow-sm"
                    >
                      Find My Device
                    </button>
                  </div>

                  {/* Trust Badge Indicators */}
                  <div className="flex flex-wrap items-center gap-6 text-xs sm:text-sm font-semibold text-ink-slate">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center text-secondary text-xs">✓</div>
                      <span>Secure &amp; Encrypted</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center text-secondary text-xs">✓</div>
                      <span>Instant Payout</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-secondary/10 flex items-center justify-center text-secondary text-xs">✓</div>
                      <span>Free Doorstep Pickup</span>
                    </div>
                  </div>
                </div>

                {/* Hero Interactive Phone Panel Graphic */}
                <div className="lg:col-span-5 flex justify-center">
                  <SmartphoneMockup />
                </div>
              </div>

              {/* 2. Popular Brands & Catalog Selector section */}
              <div id="device-selector-section" className="bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-6 shadow-premium scroll-mt-20">
                <div className="mb-6 pb-4 border-b border-ice-border/40 text-left">
                  <span className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase block mb-1">
                    Catalog / Hardware Selector
                  </span>
                  <h3 className="text-3xl font-light text-ink-navy tracking-tight">
                    Select Brand &amp; Model
                  </h3>
                </div>
                <DeviceSelector onVariantSelected={handleVariantSelected} />
              </div>

              {/* 3. How It Works Section */}
              <div id="how-it-works-section" className="py-8 border-t border-b border-ice-border/40">
                <div className="text-center max-w-3xl mx-auto mb-12">
                  <h2 className="text-3xl font-extrabold text-ink-navy tracking-tight">How it Works</h2>
                  <p className="text-ink-slate mt-2 text-sm">Our transparent process ensures you get the highest value with zero hassle.</p>
                </div>

                <div className="relative">
                  {/* Connecting Line */}
                  <div className="absolute top-16 left-4 right-4 h-0.5 bg-ice-gray hidden md:block z-0"></div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                    {/* Step 1 */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-cobalt text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-cobalt/20 mb-6">
                        1
                      </div>
                      <h3 className="text-lg font-bold text-ink-navy mb-2">Check Price</h3>
                      <p className="text-sm text-ink-slate max-w-xs font-light">
                        Select your smartphone model and answer a few questions about its condition. Get a quote instantly.
                      </p>
                    </div>

                    {/* Step 2 */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-cobalt text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-cobalt/20 mb-6">
                        2
                      </div>
                      <h3 className="text-lg font-bold text-ink-navy mb-2">Schedule Pickup</h3>
                      <p className="text-sm text-ink-slate max-w-xs font-light">
                        Choose a convenient date and time slot. Our executive will visit your home or office for verification.
                      </p>
                    </div>

                    {/* Step 3 */}
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-secondary text-white flex items-center justify-center text-xl font-bold shadow-lg shadow-secondary/20 mb-6">
                        3
                      </div>
                      <h3 className="text-lg font-bold text-ink-navy mb-2">Get Paid</h3>
                      <p className="text-sm text-ink-slate max-w-xs font-light">
                        Once condition is verified at your doorstep, get paid instantly via digital bank transfer or UPI.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. Featured Deals Bento Grid */}
              <div className="space-y-8">
                <div className="text-center max-w-3xl mx-auto">
                  <h2 className="text-3xl font-extrabold text-ink-navy tracking-tight">Featured Deals</h2>
                  <p className="text-ink-slate mt-2 text-sm">Get top value for popular premium devices today</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Large Card: iPhone 15 Pro Max */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-primary to-slate-900 rounded-3xl p-8 text-white relative overflow-hidden flex flex-col justify-between min-h-[360px] shadow-xl group text-left">
                    <div className="absolute right-0 bottom-0 opacity-10 group-hover:opacity-15 transition-opacity pointer-events-none z-0">
                      <svg className="w-96 h-96 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.64.74-1.2 1.88-1.05 2.99 1.12.09 2.26-.57 3-1.43z"/>
                      </svg>
                    </div>
                    {/* Actual iPhone Image */}
                    <div className="absolute right-6 bottom-[-20px] w-56 sm:w-64 h-auto pointer-events-none group-hover:scale-105 group-hover:translate-y-[-10px] transition-all duration-500 ease-out z-10 hidden sm:block">
                      <img src={applePhoneImg} alt="iPhone 15 Pro Max" className="w-full h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]" />
                    </div>
                    <div className="z-10 relative">
                      <span className="px-3 py-1 bg-white/10 text-white rounded-full text-xs font-semibold uppercase tracking-wider border border-white/10">Top Offer Today</span>
                      <h3 className="text-3xl font-extrabold mt-6 max-w-md">Sell your iPhone 15 Pro Max</h3>
                      <p className="text-slate-300 mt-2 max-w-sm font-light">Get maximum trade-in value before the next generation release.</p>
                    </div>
                    <div className="mt-8 flex items-baseline justify-between gap-4 z-10 relative">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Valuations Up To</p>
                        <p className="text-3xl sm:text-4xl font-black text-green-400 mt-1">₹57,000</p>
                      </div>
                      <button 
                        onClick={() => handleDirectSelectModel('apple-15pm')}
                        className="bg-green-500 hover:bg-green-600 text-slate-900 px-6 py-3 rounded-lg font-bold text-sm shadow-lg shadow-green-500/20 transition-all"
                      >
                        Get Valuation
                      </button>
                    </div>
                  </div>

                  {/* Right stack (Samsung + OnePlus/Google) */}
                  <div className="flex flex-col gap-8 justify-between">
                    {/* Samsung Galaxy S24 Ultra */}
                    <div className="bg-canvas-pure border border-ice-border rounded-3xl p-6 flex flex-col justify-between min-h-[166px] shadow-sm text-left relative overflow-hidden group">
                      {/* Actual Samsung Image */}
                      <div className="absolute right-[-10px] bottom-[-20px] w-24 h-auto pointer-events-none group-hover:scale-105 group-hover:translate-y-[-5px] transition-all duration-500 ease-out z-0 opacity-40 group-hover:opacity-60">
                        <img src={samsungPhoneImg} alt="Galaxy S24 Ultra" className="w-full h-auto object-contain" />
                      </div>
                      <div className="flex justify-between items-start z-10">
                        <div>
                          <h4 className="text-lg font-bold text-ink-navy">Galaxy S24 Ultra</h4>
                          <p className="text-xs text-ink-slate mt-1">Valuations up to ₹42,000</p>
                        </div>
                      </div>
                      <span 
                        onClick={() => handleDirectSelectModel('sam-s24u')}
                        className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline cursor-pointer z-10 mt-4"
                      >
                        Get Valuation →
                      </span>
                    </div>

                    {/* OnePlus 12 */}
                    <div className="bg-canvas-pure border border-ice-border rounded-3xl p-6 flex flex-col justify-between min-h-[166px] shadow-sm text-left relative overflow-hidden group">
                      {/* Actual OnePlus Image */}
                      <div className="absolute right-[-10px] bottom-[-20px] w-24 h-auto pointer-events-none group-hover:scale-105 group-hover:translate-y-[-5px] transition-all duration-500 ease-out z-0 opacity-40 group-hover:opacity-60">
                        <img src={oneplusPhoneImg} alt="OnePlus 12" className="w-full h-auto object-contain" />
                      </div>
                      <div className="flex justify-between items-start z-10">
                        <div>
                          <h4 className="text-lg font-bold text-ink-navy">OnePlus 12</h4>
                          <p className="text-xs text-ink-slate mt-1">Valuations up to ₹24,000</p>
                        </div>
                      </div>
                      <span 
                        onClick={() => handleDirectSelectModel('op-12')}
                        className="text-xs font-bold text-secondary flex items-center gap-1 hover:underline cursor-pointer z-10 mt-4"
                      >
                        Get Valuation →
                      </span>
                    </div>
                  </div>

                  {/* Bulk Liquidation Banner */}
                  <div className="lg:col-span-3 bg-primary rounded-3xl p-8 text-white relative overflow-hidden flex flex-col md:flex-row md:items-center md:justify-between shadow-xl text-left">
                    <div className="z-10">
                      <span className="px-2.5 py-1 bg-white/10 text-green-400 rounded-full text-xs font-bold uppercase tracking-wider border border-white/5">Corporate Services</span>
                      <h3 className="text-2xl font-extrabold mt-4">Enterprise Device Liquidation</h3>
                      <p className="text-slate-300 mt-2 max-w-2xl text-sm font-light leading-relaxed">
                        Selling company devices? Get customized bulk quotes, certified hardware wiping, and direct corporate logistics.
                      </p>
                    </div>
                    <button className="mt-6 md:mt-0 bg-white hover:bg-slate-100 text-primary px-6 py-3 rounded-lg font-bold text-sm shadow-md transition-all whitespace-nowrap z-10">
                      Contact B2B Team
                    </button>
                    <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-secondary/20 blur-3xl"></div>
                  </div>
                </div>
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

          {activeStage === 'admin' && (
            <AdminPanel
              onBack={handleReset}
              initialBookings={INITIAL_BOOKINGS}
            />
          )}
        </section>

        {/* Right Sidebar (Only during diagnose and schedule workflow) */}
        {activeStage !== 'select' && activeStage !== 'admin' && (
          <aside className="w-full xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4 xl:gap-6 no-print">

            {/* Live Operations */}
            <div className="bg-canvas-pure border border-ice-border rounded-sm p-4 sm:p-5 shadow-premium">
              <div className="border-b border-ice-border/40 pb-2 mb-3 text-left">
                <span className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase block mb-1">Telemetry Feed</span>
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
                      <span className="text-[9px] sm:text-[10px] text-ink-muted font-mono tracking-wider uppercase block">{s.label}</span>
                      <span className="text-xs sm:text-sm font-bold text-ink-navy number-pop" style={{animationDelay: s.delay}}>{s.value}</span>
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-ice-border/40 text-left">
                  <div className="flex justify-between text-[9px] text-ink-muted font-mono tracking-wider mb-1.5 uppercase">
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
              <div className="border-b border-ice-border/40 pb-2 mb-2">
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
                <span className="text-[10px] font-mono tracking-[0.2em] text-ink-muted uppercase block mb-1">Support desk</span>
                <h4 className="font-light text-xl text-ink-navy">Need Help?</h4>
                <p className="mt-1 text-ink-muted text-[10px] sm:text-xs leading-relaxed font-light">Corporate trade-in, bulk logistics, or carrier lock valuations?</p>
              </div>
              <button className="w-full bg-cobalt hover:bg-cobalt-hover text-white py-2 rounded-sm font-bold text-xs transition-all">
                Connect to Helpdesk
              </button>
            </div>
          </aside>
        )}
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-canvas-pure border-t border-ice-border mt-8 sm:mt-16 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 pb-8 border-b border-ice-border/40">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-cobalt/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-cobalt" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <span className="text-xl font-extrabold text-ink-navy tracking-tight">Reliable<span className="text-secondary">Exchange</span></span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-6 md:gap-8 text-xs font-semibold text-ink-slate">
              <span onClick={handleReset} className="hover:text-cobalt cursor-pointer transition-colors">Home</span>
              <span onClick={handleAdminClick} className="hover:text-cobalt cursor-pointer transition-colors">Admin Panel</span>
              <span onClick={() => {
                if (activeStage === 'select') {
                  document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
                } else {
                  handleReset();
                  setTimeout(() => {
                    document.getElementById('how-it-works-section')?.scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              }} className="hover:text-cobalt cursor-pointer transition-colors">How it Works</span>
              <span onClick={() => setIsSpecModalOpen(true)} className="hover:text-cobalt cursor-pointer transition-colors">System Spec</span>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-xs text-ink-muted gap-4">
            <p>&copy; {new Date().getFullYear()} Reliable Exchange. All rights reserved.</p>
            <p>Built with ❤️ for secure, sustainable device recycling.</p>
          </div>
        </div>
      </footer>

      {/* Specs Modal */}
      <SpecsModal isOpen={isSpecModalOpen} onClose={() => setIsSpecModalOpen(false)} />

      {/* Admin Authorization Modal */}
      <AdminAuthModal 
        isOpen={showAdminLogin} 
        onClose={() => setShowAdminLogin(false)} 
        onSuccess={() => {
          setIsAdminAuthorized(true);
          setActiveStage('admin');
          setShowAdminLogin(false);
        }} 
      />
    </div>
  );
}

// ── Admin Security PIN Authorization Modal ─────────────────────────────────────

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function AdminAuthModal({ isOpen, onClose, onSuccess }: AdminAuthModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '9999' || pin === 'admin123') {
      setError('');
      setPin('');
      onSuccess();
    } else {
      setError('Invalid passcode. Access Denied.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-canvas-pure border border-ice-border rounded-lg max-w-sm w-full p-6 shadow-premium relative animate-fadeIn">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 className="font-outfit font-light text-lg text-ink-navy">Admin Access Gate</h3>
            <p className="text-xs text-ink-muted">Authorized staff only. Enter security PIN to proceed.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="relative">
              <input
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => {
                  setError('');
                  setPin(e.target.value);
                }}
                className="w-full px-4 py-3 bg-canvas-white border border-ice-border rounded-sm text-center text-lg font-mono tracking-[0.3em] focus:border-cobalt focus:ring-0 text-ink-navy dark:text-zinc-200"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs font-mono font-bold text-red-550">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-sm border border-ice-border text-xs font-mono text-ink-slate hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-sm bg-cobalt hover:bg-cobalt-hover text-white text-xs font-mono font-bold transition-all shadow-sm shadow-cobalt/20"
              >
                Unlock
              </button>
            </div>
          </form>
          <div className="pt-3 border-t border-dashed border-ice-border/40">
            <span className="text-[10px] font-mono text-zinc-550 dark:text-zinc-400 uppercase tracking-widest block">
              Default Demo PIN: 9999
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
