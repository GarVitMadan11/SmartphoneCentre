import { useState } from 'react';
import { Model, Variant, DefectRule } from './data/mockDatabase';
import { DeviceSelector } from './components/DeviceSelector';
import { DiagnosticWizard } from './components/DiagnosticWizard';
import { PickupScheduler } from './components/PickupScheduler';
import { 
  Smartphone, Award, ShieldCheck, Zap, Info, 
  RefreshCw, TrendingUp, HelpCircle, FileText, Menu, X
} from 'lucide-react';
import premiumBanner from './assets/premium_banner.png';

export default function App() {
  const [activeStage, setActiveStage] = useState<'select' | 'diagnose' | 'schedule'>('select');
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [finalPrice, setFinalPrice] = useState<number>(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleVariantSelected = (model: Model, variant: Variant) => {
    setSelectedModel(model);
    setSelectedVariant(variant);
    setActiveStage('diagnose');
  };

  const handleDiagnosticsComplete = (price: number, _defects: DefectRule[]) => {
    setFinalPrice(price);
    setActiveStage('schedule');
  };

  const handleReset = () => {
    setSelectedModel(null);
    setSelectedVariant(null);
    setFinalPrice(0);
    setActiveStage('select');
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-canvas-white text-ink-navy flex flex-col font-sans">

      {/* ── Header ────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-canvas-pure/95 backdrop-blur-md border-b border-ice-border shadow-premium">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer flex-shrink-0" onClick={handleReset}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cobalt flex items-center justify-center text-white shadow-tactile font-black text-lg sm:text-xl">
              S
            </div>
            <div>
              <h1 className="font-extrabold text-base sm:text-lg tracking-tight text-ink-navy leading-none">SmartphoneCentre</h1>
              <span className="text-[9px] sm:text-[10px] uppercase font-bold text-cobalt tracking-widest block mt-0.5">Disruptive Trade-In</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6 text-sm font-semibold text-ink-slate">
            <span className="hover:text-cobalt cursor-pointer transition-colors flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-cobalt" />
              <span className="hidden lg:inline">Quality Stamp</span>
            </span>
            <span className="hover:text-cobalt cursor-pointer transition-colors flex items-center gap-1">
              <RefreshCw className="w-4 h-4 text-cobalt" />
              <span className="hidden lg:inline">How it Works</span>
            </span>
            <a 
              href="file:///f:/SmartphoneCentre/prd_system_design.md" 
              className="px-3 py-2 rounded-lg bg-cobalt-light text-cobalt border border-cobalt-border hover:bg-cobalt hover:text-white transition-all flex items-center gap-1 text-xs"
            >
              <FileText className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">System Spec</span>
            </a>
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg border border-ice-border text-ink-slate hover:border-cobalt hover:text-cobalt transition-all"
            onClick={() => setMobileMenuOpen(o => !o)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile drop-down menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-ice-border bg-canvas-pure px-4 py-3 space-y-2">
            <button className="w-full flex items-center gap-2 text-sm font-semibold text-ink-slate py-2 px-3 rounded-lg hover:bg-ice-gray transition-colors">
              <ShieldCheck className="w-4 h-4 text-cobalt" /> Quality Stamp
            </button>
            <button className="w-full flex items-center gap-2 text-sm font-semibold text-ink-slate py-2 px-3 rounded-lg hover:bg-ice-gray transition-colors">
              <RefreshCw className="w-4 h-4 text-cobalt" /> How it Works
            </button>
            <a
              href="file:///f:/SmartphoneCentre/prd_system_design.md"
              className="flex items-center gap-2 text-sm font-semibold text-cobalt py-2 px-3 rounded-lg bg-cobalt-light border border-cobalt-border"
            >
              <FileText className="w-4 h-4" /> View System Spec
            </a>
          </div>
        )}
      </header>

      {/* ── Main ──────────────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-4 sm:py-8 flex flex-col xl:grid xl:grid-cols-12 gap-6 xl:gap-8 items-start">

        {/* Left: Active Flow */}
        <section className="w-full xl:col-span-9 space-y-4 sm:space-y-6 min-w-0">

          {activeStage === 'select' && (
            <div>
              {/* Hero Banner */}
              <div className="relative rounded-2xl overflow-hidden mb-4 sm:mb-8 border border-cobalt-border shadow-card hero-gradient p-5 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-6">
                {/* Orbs — hidden on very small screens to avoid clutter */}
                <div className="hidden sm:block absolute -top-8 -right-8 w-48 h-48 rounded-full bg-cobalt/8 orb-float-slow pointer-events-none" />
                <div className="hidden sm:block absolute top-12 right-24 w-20 h-20 rounded-full bg-blue-300/15 orb-float-medium pointer-events-none" />
                <div className="hidden sm:block absolute -bottom-6 right-12 w-32 h-32 rounded-full bg-cobalt-light/60 pulse-ring pointer-events-none" />

                <div className="space-y-3 sm:space-y-4 max-w-lg z-10">
                  <span className="inline-flex items-center gap-1.5 text-[10px] sm:text-xs uppercase font-extrabold text-cobalt bg-white/70 backdrop-blur border border-cobalt-border px-2.5 sm:px-3 py-1 rounded-full tracking-wider shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                    Live Pricing Engine Active
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-ink-navy leading-tight tracking-tight">
                    Evaluate Honestly. <br /><span className="text-cobalt">Get Paid Instantly.</span>
                  </h2>
                  <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
                    Dynamic C2B pricing for your exact device variant. Zero hidden fees, free doorstep verification, immediate bank payout.
                  </p>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 pt-1">
                    {['No Hidden Deductions', '7-Day Quote Lock', 'Free Pickup'].map(t => (
                      <div key={t} className="flex items-center gap-1 text-[10px] sm:text-xs font-semibold text-ink-slate">
                        <span className="text-emerald-500">✓</span> {t}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Banner image — hidden on mobile */}
                <div className="hidden sm:block w-full sm:w-48 md:w-56 h-36 sm:h-44 rounded-xl overflow-hidden border border-cobalt-border flex-shrink-0 relative" style={{boxShadow: '0 0 40px rgba(29,78,216,0.12)'}}>
                  <img src={premiumBanner} alt="Premium banner" className="w-full h-full object-cover hover:scale-105 transition-all duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 via-transparent to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Device Selector Card */}
              <div className="bg-canvas-pure border border-ice-border rounded-2xl p-4 sm:p-6 canva-shadow">
                <div className="mb-4 sm:mb-6 pb-3 sm:pb-4 border-b border-ice-gray">
                  <h3 className="text-lg sm:text-xl font-bold text-ink-navy flex items-center gap-2">
                    <Smartphone className="w-4 h-4 sm:w-5 sm:h-5 text-cobalt flex-shrink-0" /> Select Brand & Model
                  </h3>
                  <p className="text-xs text-ink-muted mt-1">Pick your brand, find your model, select variant.</p>
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
            />
          )}

          {activeStage === 'schedule' && selectedModel && selectedVariant && (
            <PickupScheduler
              finalPrice={finalPrice}
              onBack={() => setActiveStage('diagnose')}
              onSuccess={handleReset}
            />
          )}
        </section>

        {/* Right: Sidebar — collapses to a 3-card row on mobile */}
        <aside className="w-full xl:col-span-3 grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-1 gap-4 xl:gap-6">

          {/* Live Operations */}
          <div className="bg-canvas-pure border border-ice-border rounded-2xl p-4 sm:p-5 canva-shadow">
            <h4 className="font-extrabold text-xs sm:text-sm text-ink-navy border-b border-ice-gray pb-2 sm:pb-3 mb-3 sm:mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              Live Operations
            </h4>
            <div className="space-y-3 sm:space-y-4">
              {[
                { icon: <Zap className="w-4 h-4" />, bg: 'bg-cobalt-light text-cobalt', label: 'Avg. Agent Arrival', value: '~15 Min', delay: '0s' },
                { icon: <TrendingUp className="w-4 h-4" />, bg: 'bg-emerald-50 text-emerald-600 border border-emerald-100', label: 'Quote Accuracy', value: '99.4%', delay: '0.1s' },
                { icon: <Award className="w-4 h-4" />, bg: 'bg-blue-50 text-blue-700 border border-blue-100', label: 'Devices Processed', value: '12,400+', delay: '0.2s' },
              ].map(s => (
                <div key={s.label} className="flex items-center gap-3 group">
                  <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-lg ${s.bg} flex items-center justify-center font-bold group-hover:scale-110 transition-transform flex-shrink-0`}>
                    {s.icon}
                  </div>
                  <div>
                    <span className="text-[9px] sm:text-[10px] text-ink-muted uppercase block">{s.label}</span>
                    <span className="text-xs sm:text-sm font-bold text-ink-navy number-pop" style={{animationDelay: s.delay}}>{s.value}</span>
                  </div>
                </div>
              ))}
              <div className="pt-2 border-t border-ice-gray">
                <div className="flex justify-between text-[9px] sm:text-[10px] text-ink-muted mb-1.5">
                  <span>Today's Pickups</span>
                  <span className="font-bold text-cobalt">74%</span>
                </div>
                <div className="h-1.5 rounded-full bg-ice-gray overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-cobalt to-blue-400 progress-fill" style={{'--progress-width': '74%'} as React.CSSProperties} />
                </div>
              </div>
            </div>
          </div>

          {/* Valuation Formula */}
          <div className="bg-canvas-pure border border-ice-border rounded-2xl p-4 sm:p-5 canva-shadow text-xs space-y-2 sm:space-y-3">
            <h4 className="font-bold text-ink-navy flex items-center gap-1.5 text-xs sm:text-sm">
              <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cobalt flex-shrink-0" /> Valuation Matrix
            </h4>
            <p className="text-ink-muted leading-relaxed text-[10px] sm:text-xs">
              Price fluctuates with component demand, refurb cost trends, and market liquidity indices.
            </p>
            <div className="bg-slate-50 p-2 sm:p-2.5 rounded-lg border border-ice-border font-mono text-[8px] sm:text-[9px] text-ink-slate">
              Price = Base - Σ(Fixed + Base × Pct)
            </div>
          </div>

          {/* Help */}
          <div className="bg-cobalt-light/40 border border-cobalt-border rounded-2xl p-4 sm:p-5 text-xs text-cobalt flex flex-col justify-between gap-3">
            <div>
              <h4 className="font-bold flex items-center gap-1 text-xs sm:text-sm"><HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 flex-shrink-0" /> Need Help?</h4>
              <p className="mt-1 text-ink-slate font-medium text-[10px] sm:text-xs leading-relaxed">Corporate trade-in, bulk logistics, or carrier lock valuations?</p>
            </div>
            <button className="w-full bg-cobalt hover:bg-cobalt-hover text-white py-2 rounded-lg font-bold text-xs shadow-sm transition-all">
              Connect to Helpdesk
            </button>
          </div>
        </aside>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="bg-canvas-pure border-t border-ice-border mt-8 sm:mt-16 py-6 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between text-[10px] sm:text-xs text-ink-muted gap-3 sm:gap-4 text-center sm:text-left">
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
    </div>
  );
}
