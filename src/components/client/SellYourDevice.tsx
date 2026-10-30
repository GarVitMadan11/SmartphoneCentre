import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Smartphone, Award, ShieldCheck, Zap } from 'lucide-react';
import { fetchModels, type ApiUser } from '../../utils/api';
import { getMaxVariantPrice, type Model } from '../../data/mockDatabase';

/* ─────────────────────────────────────────────
   2D Premium Device Composition Cards
───────────────────────────────────────────── */
const FloatingComposition: React.FC<{ currentUser?: ApiUser | null }> = () => {
  const [iphone18MaxPrice, setIphone18MaxPrice] = useState<number | null>(null);
  const [pixelFoldMaxPrice, setPixelFoldMaxPrice] = useState<number | null>(null);
  const [iphone18Model, setIphone18Model] = useState<Model | null>(null);
  const [pixelFoldModel, setPixelFoldModel] = useState<Model | null>(null);

  useEffect(() => {
    let mounted = true;
    fetchModels().then((rawModels) => {
      if (!mounted) return;
      const models = rawModels as unknown as Model[];
      const ip18 = models.find((m) => 
        m.name.toLowerCase().includes('18 pro max') || 
        m.name.toLowerCase().includes('17 pro max') || 
        m.id === 'apple-17pm'
      );
      const pixelFold = models.find((m) => 
        m.id === 'pixel-11-pro-fold' || 
        (m.name.toLowerCase().includes('pixel 11') && m.name.toLowerCase().includes('fold')) ||
        m.id === 'goog-10p-fold' ||
        m.name.toLowerCase().includes('pixel 10 pro fold')
      );

      if (ip18) {
        setIphone18Model(ip18);
        setIphone18MaxPrice(getMaxVariantPrice(ip18));
      }
      if (pixelFold) {
        setPixelFoldModel(pixelFold);
        setPixelFoldMaxPrice(getMaxVariantPrice(pixelFold));
      }
    }).catch(() => {});

    return () => { mounted = false; };
  }, []);

  const formatPriceStr = (val: number | null, fallback: string) => {
    if (!val || val <= 0) return fallback;
    return `₹${val.toLocaleString('en-IN')}`;
  };

  return (
    <div className="relative w-full min-h-[440px] flex items-center justify-center p-2 sm:p-4">
      {/* Background ambient lighting glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cobalt/10 via-emerald-500/10 to-transparent rounded-3xl blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl flex flex-col sm:flex-row items-center justify-center gap-6">
        
        {/* ── CARD 1: iPhone 18 Pro Max ── */}
        <div className="w-full sm:w-64 h-[350px] bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative group overflow-hidden flex flex-col items-center justify-between text-center">
          <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />
          
          {/* Image - flush with dividing line below */}
          <div className="w-full h-44 flex items-end justify-center relative z-10 mt-auto">
            <img
              src={iphone18Model?.imageUrl || "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone18-pro-max.jpg"}
              alt="iPhone 18 Pro Max"
              referrerPolicy="no-referrer"
              style={{ mixBlendMode: 'multiply' }}
              className="max-h-full max-w-full object-contain object-bottom block group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Model Name & Max Price */}
          <div className="w-full pt-4 border-t border-slate-100 space-y-1 relative z-10">
            <h4 className="text-lg font-black text-slate-900 font-outfit tracking-tight">
              iPhone 18 Pro Max
            </h4>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-outfit tracking-tight">
              {formatPriceStr(iphone18MaxPrice, '₹1,69,950')}
            </div>
          </div>
        </div>

        {/* ── CARD 2: Google Pixel 11 Fold ── */}
        <div className="w-full sm:w-64 h-[350px] bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative group overflow-hidden flex flex-col items-center justify-between text-center">
          <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-all" />
          
          {/* Image - flush with dividing line below */}
          <div className="w-full h-44 flex items-end justify-center relative z-10 mt-auto">
            <img
              src={pixelFoldModel?.imageUrl || "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-11-pro-fold.jpg"}
              alt="Google Pixel 11 Fold"
              referrerPolicy="no-referrer"
              style={{ mixBlendMode: 'multiply' }}
              className="max-h-full max-w-full object-contain object-bottom block group-hover:scale-105 transition-transform duration-300"
            />
          </div>

          {/* Model Name & Max Price */}
          <div className="w-full pt-4 border-t border-slate-100 space-y-1 relative z-10">
            <h4 className="text-lg font-black text-slate-900 font-outfit tracking-tight">
              Google Pixel 11 Fold
            </h4>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-outfit tracking-tight">
              {formatPriceStr(pixelFoldMaxPrice, '₹1,04,288')}
            </div>
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
   Feature Pill
───────────────────────────────────────────── */
const FeaturePill: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 rounded-xl bg-canvas-white border border-ice-border shadow-xs hover:border-cobalt/30 transition-all">
    <div className="w-8 h-8 rounded-lg bg-cobalt/8 flex items-center justify-center text-cobalt shrink-0">
      {icon}
    </div>
    <div>
      <div className="text-[9px] font-mono tracking-wider text-ink-muted uppercase">{label}</div>
      <div className="text-xs font-bold text-ink-navy font-outfit">{value}</div>
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   Main Export
───────────────────────────────────────────── */
export const SellYourDevice: React.FC<{
  onGetValuation?: () => void;
  currentUser?: ApiUser | null;
  children?: React.ReactNode;
}> = ({ onGetValuation, currentUser, children }) => {
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
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-secondary/25 shadow-[0_2px_10px_-2px_rgba(0,110,47,0.15)] hover:border-secondary/40 hover:shadow-[0_4px_14px_-2px_rgba(0,110,47,0.2)] transition-all duration-300 mb-6 select-none group">
              <span className="relative flex h-2 w-2 flex-shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary shadow-[0_0_8px_rgba(0,110,47,0.5)]" />
              </span>
              <span className="text-[11px] font-bold font-outfit tracking-[0.16em] text-secondary uppercase">
                SELL TO REPHONIX
              </span>
            </div>

            {/* Headline — navy + green accent (matching photo) */}
            <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-ink-navy font-outfit tracking-tight leading-[1.08] mb-5">
              YOUR DEVICE<br />
              HAS{' '}
              <span className="text-secondary">VALUE.</span>
            </h2>

            {/* Sub-copy */}
            <p className="text-ink-slate text-base sm:text-lg font-light leading-relaxed mb-8 max-w-lg">
              Sell your smartphone to Rephonix. Get an instant valuation and immediate payment upon verification. No hidden deductions, guaranteed.
            </p>

            {/* Device type pills */}
            <div className="grid grid-cols-2 gap-3 mb-8 max-w-md">
              <FeaturePill icon={<Smartphone className="w-4 h-4" />} label="Smartphones" value="iPhone, Galaxy & More" />
              <FeaturePill icon={<Award className="w-4 h-4" />} label="Guarantee" value="Locked Valuation" />
              <FeaturePill icon={<Zap className="w-4 h-4" />} label="Speed" value="Instant Direct Credit" />
              <FeaturePill icon={<ShieldCheck className="w-4 h-4" />} label="Security" value="NIST 800-88 Data Wipe" />
            </div>

            {/* CTA */}
            <div className="flex flex-wrap items-center gap-4">
              <button
                type="button"
                onClick={onGetValuation}
                className="px-7 py-3.5 rounded-xl bg-cobalt hover:bg-cobalt-hover text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer group"
              >
                <span>Get Instant Valuation</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
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
            <FloatingComposition currentUser={currentUser} />
          </div>
        </div>

        {/* ══ INSERTED SEGMENT: FEATURED DEVICES BENTO ══ */}
        {children && (
          <div className="mt-16 sm:mt-24">
            {children}
          </div>
        )}

        {/* ══ HOW IT WORKS ══ */}
        <div className="mt-20 sm:mt-28">
          {/* Divider */}
          <div className="border-t border-ice-border mb-16" />

          {/* Header */}
          <div className="text-center mb-12">
            <span className="inline-flex items-center justify-center px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-cobalt/20 shadow-[0_2px_10px_-2px_rgba(0,32,69,0.08)] hover:border-cobalt/35 hover:shadow-[0_4px_14px_-2px_rgba(0,32,69,0.14)] transition-all duration-300 mb-4 select-none">
              <span className="text-[11px] font-bold font-outfit tracking-[0.18em] text-cobalt uppercase">
                PROCESS
              </span>
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
              description="Choose your smartphone and pick your brand and model."
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
              description="Confirm your schedule. We verify on-site and transfer payment instantly."
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
