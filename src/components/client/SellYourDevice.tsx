import React, { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { ArrowRight, Smartphone, Award, ShieldCheck, Zap, ClipboardCheck, Calculator, Truck, Sparkles } from 'lucide-react';
import { fetchModels, type ApiUser } from '../../utils/api';
import { getMaxVariantPrice, type Model } from '../../data/mockDatabase';

/* ─────────────────────────────────────────────
   Apple-grade 3D Perspective Tilt Card with Specular Glare
───────────────────────────────────────────── */
const Tilt3DCard: React.FC<{
  children: React.ReactNode;
  ambientColor?: string;
  className?: string;
}> = ({ children, ambientColor = 'emerald', className = '' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Buttery-smooth spring physics without jitter
  const mouseXSpring = useSpring(x, { stiffness: 220, damping: 24, mass: 0.7 });
  const mouseYSpring = useSpring(y, { stiffness: 220, damping: 24, mass: 0.7 });

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["9deg", "-9deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-9deg", "9deg"]);
  const glareX = useTransform(mouseXSpring, [-0.5, 0.5], ["0%", "100%"]);
  const glareOpacity = useTransform(mouseXSpring, [-0.5, 0, 0.5], [0.25, 0.05, 0.25]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <div
      style={{ perspective: 1100 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`w-full sm:w-64 flex justify-center ${className}`}
    >
      <motion.div
        ref={cardRef}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 350, damping: 25 }}
        className="w-full h-[290px] sm:h-[360px] bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl p-4 sm:p-6 shadow-md sm:shadow-xl hover:shadow-2xl transition-shadow duration-300 relative group overflow-hidden flex flex-col items-center justify-between text-center select-none cursor-pointer"
      >
        {/* Dynamic Specular Glare Layer */}
        <motion.div
          style={{
            left: glareX,
            opacity: glareOpacity,
          }}
          className="pointer-events-none absolute -inset-full w-[200%] h-[200%] bg-gradient-to-tr from-transparent via-white/40 to-transparent transform -rotate-45"
        />

        {/* Dynamic Ambient Halo behind Card */}
        <div
          className={`absolute -top-12 -right-12 w-40 h-40 ${
            ambientColor === 'blue' ? 'bg-blue-500/10' : 'bg-emerald-500/10'
          } rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform duration-500`}
        />

        <div style={{ transform: "translateZ(30px)", width: "100%", height: "100%" }} className="flex flex-col items-center justify-between">
          {children}
        </div>
      </motion.div>
    </div>
  );
};

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
    <div className="relative w-full min-h-0 sm:min-h-[440px] flex items-center justify-center p-1 sm:p-4">
      {/* Background ambient lighting glow */}
      <div className="absolute inset-0 bg-gradient-to-tr from-cobalt/10 via-emerald-500/10 to-transparent rounded-3xl blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-2xl flex flex-col sm:flex-row items-center justify-center gap-6">
        
        {/* ── CARD 1: iPhone 18 Pro Max with 3D Tilt ── */}
        <Tilt3DCard ambientColor="emerald">
          <div className="w-full h-32 sm:h-44 flex items-end justify-center relative z-10 mt-auto">
            <img
              src={iphone18Model?.imageUrl || "https://fdn2.gsmarena.com/vv/bigpic/apple-iphone18-pro-max.jpg"}
              alt="iPhone 18 Pro Max"
              referrerPolicy="no-referrer"
              style={{ mixBlendMode: 'multiply' }}
              className="max-h-full max-w-full object-contain object-bottom block group-hover:scale-108 transition-transform duration-300 drop-shadow-md"
            />
          </div>

          <div className="w-full pt-4 border-t border-slate-100 space-y-1 relative z-10">
            <h4 className="text-lg font-black text-slate-900 font-sans tracking-tight">
              iPhone 18 Pro Max
            </h4>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-sans tracking-tight">
              {formatPriceStr(iphone18MaxPrice, '₹1,69,950')}
            </div>
          </div>
        </Tilt3DCard>

        {/* ── CARD 2: Google Pixel 11 Fold with 3D Tilt ── */}
        <Tilt3DCard ambientColor="blue">
          <div className="w-full h-32 sm:h-44 flex items-end justify-center relative z-10 mt-auto">
            <img
              src={pixelFoldModel?.imageUrl || "https://fdn2.gsmarena.com/vv/bigpic/google-pixel-11-pro-fold.jpg"}
              alt="Google Pixel 11 Fold"
              referrerPolicy="no-referrer"
              style={{ mixBlendMode: 'multiply' }}
              className="max-h-full max-w-full object-contain object-bottom block group-hover:scale-108 transition-transform duration-300 drop-shadow-md"
            />
          </div>

          <div className="w-full pt-4 border-t border-slate-100 space-y-1 relative z-10">
            <h4 className="text-lg font-black text-slate-900 font-sans tracking-tight">
              Google Pixel 11 Fold
            </h4>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600 font-sans tracking-tight">
              {formatPriceStr(pixelFoldMaxPrice, '₹1,04,288')}
            </div>
          </div>
        </Tilt3DCard>

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
  badge?: string;
}

const ProcessStep: React.FC<StepProps> = ({ number, title, description, icon, delay, badge }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{
        type: "spring",
        stiffness: 260,
        damping: 24,
        delay: delay / 1000,
      }}
      whileHover={{ y: -4 }}
      className="relative flex-1 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs hover:shadow-lg hover:border-cobalt/40 transition-shadow duration-300 flex flex-col justify-between group select-none"
    >
      <div>
        {/* Top Header: Step Number & Icon */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold font-sans tracking-wider text-cobalt bg-cobalt/10 border border-cobalt/20 px-2.5 py-0.5 rounded-full">
            STEP {number}
          </span>
          <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200/80 text-cobalt flex items-center justify-center group-hover:bg-cobalt group-hover:text-white group-hover:border-cobalt transition-all duration-300 shadow-2xs">
            {icon}
          </div>
        </div>

        {/* Title */}
        <h4 className="text-base font-bold text-slate-900 font-sans tracking-tight mb-2 group-hover:text-cobalt transition-colors duration-200">
          {title}
        </h4>

        {/* Description */}
        <p className="text-xs text-slate-600 font-normal leading-relaxed">
          {description}
        </p>
      </div>

      {badge && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[11px] font-semibold text-slate-500">{badge}</span>
        </div>
      )}
    </motion.div>
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
      <div className="text-[9px] font-medium tracking-normal text-ink-muted uppercase">{label}</div>
      <div className="text-xs font-bold text-ink-navy font-sans">{value}</div>
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
              <span className="text-[11px] font-bold font-sans tracking-[0.16em] text-secondary uppercase">
                SELL TO REPHONIX
              </span>
            </div>

            {/* Headline — navy + green accent (matching photo) */}
            <h2 className="text-4xl sm:text-5xl lg:text-[3.5rem] font-black text-ink-navy font-sans tracking-tight leading-[1.08] mb-5">
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
          <div className="border-t border-slate-200/80 mb-14 sm:mb-16" />

          {/* Header */}
          <div className="text-center mb-10 sm:mb-12">
            <span className="inline-flex items-center justify-center px-3.5 py-1 rounded-full bg-slate-100 border border-slate-200 mb-3 select-none">
              <span className="text-[11px] font-bold font-sans tracking-wider text-slate-700 uppercase">
                HOW IT WORKS
              </span>
            </span>
            <h3 className="text-2xl sm:text-4xl font-extrabold text-slate-900 font-sans tracking-tight">
              Four steps to get <span className="text-emerald-600">paid.</span>
            </h3>
            <p className="text-slate-600 text-xs sm:text-sm mt-2 font-normal max-w-lg mx-auto leading-relaxed">
              Simple, transparent, and engineered to give you the highest guaranteed payout in minimum time.
            </p>
          </div>

          {/* Steps Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            <ProcessStep
              number="01"
              title="Select Your Device"
              description="Choose your smartphone and pick your brand and model."
              icon={<Smartphone className="w-5 h-5" />}
              delay={0}
              badge="100+ Models Supported"
            />
            <ProcessStep
              number="02"
              title="Tell Us the Condition"
              description="Answer a quick diagnostic questionnaire. Honest answers get the best offer."
              icon={<ClipboardCheck className="w-5 h-5" />}
              delay={100}
              badge="Instant AI Mapping"
            />
            <ProcessStep
              number="03"
              title="Get Your Estimate"
              description="Receive an instant estimated valuation based on market rates and device condition."
              icon={<Calculator className="w-5 h-5" />}
              delay={200}
              badge="Live Market Pricing"
            />
            <ProcessStep
              number="04"
              title="Complete the Sale"
              description="Confirm your schedule. We verify on-site and transfer payment instantly."
              icon={<Truck className="w-5 h-5" />}
              delay={300}
              badge="Spot UPI & Direct Transfer"
            />
          </div>

          {/* Bottom CTA strip with Instant Payout in background only */}
          <div className="mt-10 sm:mt-12 flex flex-col md:flex-row items-center justify-between gap-5 p-6 sm:p-7 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
            {/* Background Image 2 (Instant UPI Payout - background only) */}
            <div 
              className="hidden md:block absolute right-36 top-1/2 -translate-y-1/2 w-48 h-48 pointer-events-none select-none opacity-35"
              style={{
                maskImage: 'radial-gradient(circle at center, black 45%, transparent 85%)',
                WebkitMaskImage: 'radial-gradient(circle at center, black 45%, transparent 85%)',
                mixBlendMode: 'multiply',
              }}
              aria-hidden="true"
            >
              <img 
                src="/illustrations/instant_payout.jpg" 
                alt="" 
                className="w-full h-full object-contain filter saturate-110 contrast-105 brightness-105"
              />
            </div>

            <div className="flex items-center gap-4 text-left w-full md:w-auto relative z-10">
              <div className="w-12 h-12 rounded-xl bg-cobalt/10 border border-cobalt/20 text-cobalt flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-cobalt" />
              </div>
              <div>
                <h4 className="text-base sm:text-lg font-bold text-slate-900 font-sans tracking-tight">
                  Ready to check your device&apos;s exact value?
                </h4>
                <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                  Takes under 2 minutes • 100% free automated valuation • Zero commitment required
                </p>
              </div>
            </div>

            <button
              onClick={onGetValuation}
              className="group flex items-center justify-center gap-2.5 px-6 py-3.5 bg-cobalt hover:bg-cobalt-hover text-white font-bold text-sm rounded-xl transition-all duration-300 shadow-sm hover:shadow-md flex-shrink-0 font-sans tracking-wide cursor-pointer w-full lg:w-auto active:scale-98 relative z-10"
            >
              <span>Start Live Valuation</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </div>
        </div>

      </div>
    </section>
  );
};
