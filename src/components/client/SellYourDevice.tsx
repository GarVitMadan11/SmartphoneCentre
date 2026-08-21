import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Smartphone, Tablet, ShieldCheck, Zap, Truck } from 'lucide-react';

/* ─────────────────────────────────────────────
   2D Premium Device Composition Cards
───────────────────────────────────────────── */
const FloatingComposition: React.FC = () => {
  return (
    <div className="relative w-full min-h-[380px] sm:min-h-[440px] flex items-center justify-center p-2 sm:p-4">
      {/* Background ambient lighting glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cobalt/5 via-emerald-500/5 to-transparent rounded-3xl blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-lg flex flex-col sm:flex-row items-center justify-center gap-5 sm:gap-6">
        
        {/* ── CARD 1: iPad Pro 13" (2D Premium Glass Card) ── */}
        <div className="w-full sm:w-60 bg-white dark:bg-zinc-900 border border-slate-200/90 dark:border-zinc-800 rounded-2xl p-5 shadow-xl hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 relative group overflow-hidden">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-mono font-bold tracking-widest text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-200/60 dark:border-emerald-800/60 uppercase">
              Tablet Valuation
            </span>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="text-left space-y-1">
            <h4 className="text-sm font-extrabold text-ink-navy dark:text-white font-outfit">iPad Pro 13"</h4>
            <p className="text-[11px] text-ink-slate font-mono">512GB &middot; M4 Chip</p>
          </div>

          <div className="my-4 pt-3 border-t border-slate-100 dark:border-zinc-800 flex items-baseline justify-between">
            <span className="text-[10px] font-mono uppercase text-ink-muted">Up to Payout</span>
            <span className="text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">₹72,000</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[9px] font-mono text-zinc-400">
              <span>Flawless Condition</span>
              <span>100% Top Valuation</span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full w-[90%]" />
            </div>
          </div>
        </div>

        {/* ── CARD 2: iPhone 16 Pro Max (2D Premium Glass Card) ── */}
        <div className="w-full sm:w-64 bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-2xl hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1.5 transition-all duration-300 relative group overflow-hidden sm:mt-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/20 transition-all" />
          
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] font-mono font-bold tracking-widest text-sky-400 bg-sky-950/60 px-2 py-0.5 rounded border border-sky-800/60 uppercase">
              Rephonix Certified
            </span>
            <span className="text-[9px] font-mono text-zinc-400">NIST Wiped</span>
          </div>

          <div className="text-left space-y-1">
            <h4 className="text-base font-extrabold text-white font-outfit">iPhone 16 Pro Max</h4>
            <p className="text-[11px] text-zinc-400 font-mono">256GB &middot; Excellent Grade</p>
          </div>

          <div className="my-4 pt-3 border-t border-slate-800 flex items-baseline justify-between">
            <span className="text-[10px] font-mono uppercase text-zinc-400">Estimated Valuation</span>
            <span className="text-2xl font-black text-emerald-400 font-mono">₹89,000</span>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between text-[10px] font-mono text-zinc-300">
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Doorstep Pickup
            </span>
            <span className="text-zinc-400">Instant Credit</span>
          </div>
        </div>

      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Process Step Card
───────────────────────────────────────────── */
interface StepProps {
  number: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  delay: number;
  isLast?: boolean;
}

const ProcessStep: React.FC<StepProps> = ({ number, title, description, icon, delay, isLast }) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="relative flex-1"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s ease ${delay}ms, transform 0.6s ease ${delay}ms`,
      }}
    >
      {!isLast && (
        <div className="hidden lg:block absolute top-10 left-[calc(50%+2.5rem)] right-0 h-px bg-gradient-to-r from-ice-border to-transparent z-0" />
      )}
      <div className="group relative z-10 flex flex-col items-center text-center px-2">
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-2xl bg-secondary/8 blur-md scale-110 group-hover:bg-secondary/14 transition-all duration-500" />
          <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-br from-cobalt to-[#002652] flex flex-col items-center justify-center gap-1 shadow-lg shadow-cobalt/20 group-hover:scale-105 group-hover:shadow-cobalt/30 transition-all duration-300">
            <div className="text-white/50 text-[9px] font-mono tracking-widest font-bold">{number}</div>
            <div className="text-white [&>svg]:w-6 [&>svg]:h-6">{icon}</div>
          </div>
        </div>
        <h3 className="text-sm font-bold text-ink-navy font-outfit tracking-tight mb-1.5">{title}</h3>
        <p className="text-ink-slate text-xs leading-relaxed font-light max-w-[180px]">{description}</p>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────
   Trust Badge Pill
───────────────────────────────────────────── */
const TrustBadge: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <div className="flex items-center gap-2 px-4 py-2.5 bg-canvas-white border border-ice-border rounded-full shadow-sm text-sm font-semibold text-ink-navy">
    <span className="text-secondary [&>svg]:w-4 [&>svg]:h-4">{icon}</span>
    {label}
  </div>
);

/* ─────────────────────────────────────────────
   Device Type Pill
───────────────────────────────────────────── */
const DeviceTypePill: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="group flex items-center gap-3 px-4 py-3 bg-canvas-white border border-ice-border rounded-xl shadow-sm hover:border-cobalt/30 hover:shadow-md transition-all duration-300">
    <div className="w-9 h-9 rounded-lg bg-ice-gray flex items-center justify-center text-cobalt flex-shrink-0 group-hover:bg-cobalt/10 transition-colors duration-300 [&>svg]:w-[18px] [&>svg]:h-[18px]">
      {icon}
    </div>
    <div className="text-left">
      <div className="text-[9px] font-mono tracking-wider text-ink-muted uppercase">{label}</div>
      <div className="text-xs font-bold text-ink-navy font-outfit">{value}</div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Main Export
───────────────────────────────────────────── */
export const SellYourDevice: React.FC<{ onGetValuation?: () => void }> = ({ onGetValuation }) => {
  const [heroVisible, setHeroVisible] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setHeroVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="sell-your-device-section" className="relative overflow-hidden bg-canvas-white">

      <div className="relative z-10 py-20 sm:py-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

        {/* ══ HERO ══ */}
        <div ref={heroRef} className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">

          {/* Left — copy */}
          <div
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateX(0)' : 'translateX(-32px)',
              transition: 'opacity 0.8s ease, transform 0.8s ease',
            }}
          >
            {/* Eyebrow */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secondary/10 border border-secondary/20 text-[10px] font-bold font-mono tracking-widest text-secondary uppercase mb-6">
              <div className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              SELL TO REPHONIX
            </div>

            {/* Headline — navy + green accent (matching photo) */}
            <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-ink-navy font-outfit tracking-tight leading-[1.08] mb-5">
              YOUR DEVICE<br />
              HAS{' '}
              <span className="text-secondary">VALUE.</span>
            </h2>

            {/* Sub-copy */}
            <p className="text-ink-slate text-base sm:text-lg font-light leading-relaxed mb-8 max-w-lg">
              Sell your smartphone or tablet to Rephonix. Get an instant valuation, free doorstep pickup, and immediate payment. No hidden deductions, guaranteed.
            </p>

            {/* Device type pills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              <DeviceTypePill icon={<Smartphone />} label="SMARTPHONES" value="Up to &#8377;1,10,000" />
              <DeviceTypePill icon={<Tablet />} label="TABLETS & iPADS" value="Up to &#8377;80,000" />
            </div>

            {/* CTA */}
            <button
              onClick={onGetValuation}
              className="group relative inline-flex items-center gap-3 px-8 py-4 bg-cobalt hover:bg-cobalt-hover text-white font-bold text-sm sm:text-base rounded-xl shadow-lg shadow-cobalt/20 hover:shadow-cobalt/35 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-outfit tracking-wide"
            >
              GET YOUR VALUATION
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </button>

            {/* Trust badges */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <TrustBadge icon={<ShieldCheck />} label="Secure &amp; Encrypted" />
              <TrustBadge icon={<Zap />} label="Instant Payout" />
              <TrustBadge icon={<Truck />} label="Free Doorstep Pickup" />
            </div>
          </div>

          {/* Right — device composition */}
          <div
            style={{
              opacity: heroVisible ? 1 : 0,
              transform: heroVisible ? 'translateX(0)' : 'translateX(32px)',
              transition: 'opacity 0.8s ease 0.2s, transform 0.8s ease 0.2s',
            }}
          >
            <FloatingComposition />
          </div>
        </div>

        {/* ══ HOW IT WORKS ══ */}
        <div className="mt-20 sm:mt-28">
          {/* Divider */}
          <div className="border-t border-ice-border mb-16" />

          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cobalt/8 border border-cobalt/15 text-[10px] font-bold font-mono tracking-widest text-cobalt uppercase mb-4">
              PROCESS
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-ink-navy font-outfit tracking-tight">
              Four steps to get <span className="text-secondary">paid.</span>
            </h3>
            <p className="text-ink-slate text-sm mt-2 font-light max-w-md mx-auto">
              Simple, transparent, and designed to give you the highest value in minimum time.
            </p>
          </div>

          {/* Steps */}
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-4">
            <ProcessStep
              number="01"
              title="Select Your Device"
              description="Choose your smartphone or tablet and pick your brand and model."
              icon={<Smartphone strokeWidth={1.8} />}
              delay={0}
            />
            <ProcessStep
              number="02"
              title="Tell Us the Condition"
              description="Answer a quick diagnostic questionnaire. Honest answers get the best offer."
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              }
              delay={120}
            />
            <ProcessStep
              number="03"
              title="Get Your Estimate"
              description="Receive an instant estimated valuation based on market rates and device condition."
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M12 6v6l4 2" />
                </svg>
              }
              delay={240}
            />
            <ProcessStep
              number="04"
              title="Complete the Sale"
              description="Book a free doorstep pickup. We verify on-site and transfer payment instantly."
              icon={
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              }
              delay={360}
              isLast
            />
          </div>

          {/* Bottom CTA strip */}
          <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-5 bg-canvas-white border border-ice-border rounded-2xl shadow-sm">
            <div>
              <div className="text-sm font-bold text-ink-navy font-outfit">Ready to check your device&apos;s value?</div>
              <div className="text-xs text-ink-muted font-light mt-0.5">Takes under 2 minutes. No commitment required.</div>
            </div>
            <button
              onClick={onGetValuation}
              className="group flex items-center gap-2.5 px-6 py-3 bg-cobalt hover:bg-cobalt-hover text-white font-bold text-sm rounded-xl transition-all duration-300 hover:shadow-lg flex-shrink-0 font-outfit tracking-wide"
            >
              Start Valuation
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
