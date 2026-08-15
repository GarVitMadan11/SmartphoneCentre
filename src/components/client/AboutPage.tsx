import React from 'react';
import { ShieldCheck, Leaf, Target, Award, Sparkles } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="py-8 text-left space-y-12 animate-fadeIn max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-canvas-pure border border-ice-border rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cobalt/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-cobalt/10 text-cobalt border border-cobalt/15 tracking-widest uppercase font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cobalt" /> About Rephonix
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-ink-navy font-outfit uppercase tracking-tight leading-tight">
            Bridging Premium Tech &amp; <span className="text-cobalt">Eco-Friendly Resale</span>
          </h1>
          <p className="text-ink-slate text-base font-light mt-3 max-w-2xl leading-relaxed">
            Rephonix is India's premier electronic resale and secure recycling platform. We empower users to unlock maximum value from their pre-owned smartphones, tablets, and wearables through a secure, transparent, and completely friction-free process.
          </p>
        </div>
      </div>

      {/* Core Values Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-cobalt/10 flex items-center justify-center text-cobalt">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-ink-navy font-outfit">Our Mission</h3>
          <p className="text-sm text-ink-slate font-light leading-relaxed">
            To make electronic trade-ins transparent, convenient, and safe, diverting electronic waste from landfills and extending the useful lifecycle of technology.
          </p>
        </div>

        <div className="bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-ink-navy font-outfit">Security Pledge</h3>
          <p className="text-sm text-ink-slate font-light leading-relaxed">
            We adhere strictly to NIST SP 800-88 guidelines. Every smartphone, tablet, and watch is certified secure-erased, ensuring no customer data leaves our facility.
          </p>
        </div>

        <div className="bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-sm space-y-3">
          <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
            <Leaf className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-extrabold text-ink-navy font-outfit">Sustainability First</h3>
          <p className="text-sm text-ink-slate font-light leading-relaxed">
            We operate on a circular economy model. Every device sold to us is either securely refurbished for secondary use or recycled using authorized green-tech methods.
          </p>
        </div>
      </div>

      {/* Trust Ticker Card */}
      <div className="bg-gradient-to-br from-[#001736] via-[#00224d] to-[#00122e] border border-blue-500/30 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] opacity-[0.03] pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <h3 className="text-2xl font-bold font-outfit tracking-tight">The Rephonix Promise</h3>
            <p className="text-sm text-slate-300 font-light max-w-xl leading-relaxed">
              We eliminate the negotiation theatre. The valuation quote you receive on our platform is binding, honest, and guaranteed at your doorstep.
            </p>
          </div>
          <div className="flex items-center gap-3 bg-white/5 border border-white/10 px-5 py-4 rounded-xl flex-shrink-0">
            <Award className="w-8 h-8 text-secondary flex-shrink-0" />
            <div className="text-left">
              <span className="text-[10px] font-mono tracking-widest text-secondary uppercase font-bold block">Accredited Reseller</span>
              <span className="text-sm font-semibold text-white">100% Verified Operations</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
