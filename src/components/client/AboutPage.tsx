import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  CreditCard, 
  Sparkles, 
  AlertCircle, 
  ArrowRight, 
  Lock, 
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

interface AboutPageProps {
  onNavigate?: (path: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(prev => prev === index ? null : index);
  };

  const handleStartQuote = () => {
    if (onNavigate) {
      onNavigate('/smartphones');
    } else {
      window.location.href = '/smartphones';
    }
  };

  const handleContact = () => {
    if (onNavigate) {
      onNavigate('/contact');
    } else {
      window.location.href = '/contact';
    }
  };

  return (
    <div className="py-8 text-left space-y-16 animate-fadeIn max-w-5xl mx-auto">
      {/* ── 1. Hero Header Banner ── */}
      <div className="bg-canvas-pure border border-ice-border rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cobalt/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-cobalt/10 text-cobalt border border-cobalt/15 tracking-widest uppercase font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cobalt" /> About Rephonix
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-ink-navy font-outfit tracking-tight leading-tight">
            A transparent and reliable way to sell your smartphone.
          </h1>
          <p className="text-ink-slate text-base sm:text-lg font-light mt-4 leading-relaxed">
            Rephonix was founded to eliminate the frustration, haggling, and price cuts common in the pre-owned electronics market. We provide a structured, trustworthy platform where device valuations are calculated algorithmically, physical inspections are objective, and digital payouts are instant right at your doorstep.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={handleStartQuote}
              className="inline-flex items-center gap-2 px-6 py-3 bg-cobalt hover:bg-cobalt-hover text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <span>Check Your Device Value</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleContact}
              className="inline-flex items-center gap-2 px-5 py-3 bg-canvas-pure hover:bg-slate-50 border border-ice-border text-ink-navy rounded-xl font-semibold text-xs transition-colors cursor-pointer"
            >
              <span>Contact Support</span>
            </button>
          </div>
        </div>

        {/* Operational Highlights Strip */}
        <div className="mt-10 pt-8 border-t border-ice-border/60 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1">
            <span className="text-xl sm:text-2xl font-black text-ink-navy font-outfit">5–10 Min</span>
            <p className="text-xs text-ink-slate font-light">Doorstep Diagnostics</p>
          </div>
          <div className="space-y-1">
            <span className="text-xl sm:text-2xl font-black text-ink-navy font-outfit">Instant</span>
            <p className="text-xs text-ink-slate font-light">UPI &amp; IMPS Payment</p>
          </div>
          <div className="space-y-1">
            <span className="text-xl sm:text-2xl font-black text-ink-navy font-outfit">₹0 Fee</span>
            <p className="text-xs text-ink-slate font-light">Zero-Obligation Cancellation</p>
          </div>
          <div className="space-y-1">
            <span className="text-xl sm:text-2xl font-black text-ink-navy font-outfit">100%</span>
            <p className="text-xs text-ink-slate font-light">Data Wipe Assistance</p>
          </div>
        </div>
      </div>

      {/* ── 2. The Problem We Solve ── */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cobalt">Industry Challenges</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-navy font-outfit tracking-tight mt-1">
            Why traditional device selling feels broken
          </h2>
          <p className="text-sm text-ink-slate font-light mt-1.5 max-w-2xl leading-relaxed">
            Secondary smartphone transactions have historically left sellers exposed to friction, safety concerns, and arbitrary renegotiations.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-600">
              <AlertCircle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-ink-navy font-outfit">Classifieds Insecurity</h3>
            <p className="text-sm text-ink-slate font-light leading-relaxed">
              Peer-to-peer listings require sharing personal contact info, managing dozens of lowball messages, meeting unknown buyers in public, and dealing with flaky cancellations.
            </p>
          </div>

          <div className="bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-ink-navy font-outfit">Arbitrary Counter Cuts</h3>
            <p className="text-sm text-ink-slate font-light leading-relaxed">
              Local retail shops frequently quote an attractive price over phone, only to aggressively discount it at the counter by claiming invisible or exaggerated hardware flaws.
            </p>
          </div>

          <div className="bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-ink-navy font-outfit">The Rephonix Approach</h3>
            <p className="text-sm text-ink-slate font-light leading-relaxed">
              We provide rule-based algorithmic pricing online, scheduled doorstep verification by a verified agent, and immediate digital payment prior to device handover.
            </p>
          </div>
        </div>
      </div>

      {/* ── 3. How Rephonix Compares (Side-by-Side Table) ── */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cobalt">Comparative Analysis</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-navy font-outfit tracking-tight mt-1">
            How Rephonix compares
          </h2>
          <p className="text-sm text-ink-slate font-light mt-1.5 max-w-2xl leading-relaxed">
            A clear look at how our doorstep model compares to conventional alternatives.
          </p>
        </div>

        <div className="bg-canvas-pure rounded-2xl border-l border-t border-b border-ice-border overflow-hidden relative shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-separate border-spacing-0">
              <thead>
                <tr className="bg-slate-50/70 text-ink-navy font-outfit font-bold">
                  <th className="p-4 sm:p-5 border-b border-ice-border">Feature</th>
                  <th className="p-4 sm:p-5 border-b border-ice-border text-ink-muted">P2P Classifieds</th>
                  <th className="p-4 sm:p-5 border-b border-ice-border text-ink-muted">Local Offline Shops</th>
                  <th className="p-4 sm:p-5 text-blue-600 bg-blue-50/90 font-black font-outfit text-sm sm:text-base border-t-2 border-r-2 border-l-2 border-b-2 border-blue-500 rounded-tr-2xl shadow-[-4px_0_12px_rgba(59,130,246,0.25),4px_0_12px_rgba(59,130,246,0.25),0_-4px_12px_rgba(59,130,246,0.25)] relative">
                    Rephonix
                  </th>
                </tr>
              </thead>
              <tbody className="text-ink-slate font-light">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-ink-navy border-b border-ice-border/60">Pricing Discovery</td>
                  <td className="p-4 sm:p-5 border-b border-ice-border/60">Aggressive haggling &amp; lowballs</td>
                  <td className="p-4 sm:p-5 border-b border-ice-border/60">Opaque counter estimates</td>
                  <td className="p-4 sm:p-5 font-medium text-ink-navy bg-blue-50/30 border-l-2 border-r-2 border-b border-blue-100 border-l-blue-500 border-r-blue-500 shadow-[-4px_0_10px_rgba(59,130,246,0.18),4px_0_10px_rgba(59,130,246,0.18)]">
                    Live market-calibrated algorithm
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-ink-navy border-b border-ice-border/60">Logistics &amp; Travel</td>
                  <td className="p-4 sm:p-5 border-b border-ice-border/60">Unsafe public meetups</td>
                  <td className="p-4 sm:p-5 border-b border-ice-border/60">You travel, park &amp; wait</td>
                  <td className="p-4 sm:p-5 font-medium text-ink-navy bg-blue-50/30 border-l-2 border-r-2 border-b border-blue-100 border-l-blue-500 border-r-blue-500 shadow-[-4px_0_10px_rgba(59,130,246,0.18),4px_0_10px_rgba(59,130,246,0.18)]">
                    Scheduled on-site collection at home or office
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-ink-navy border-b border-ice-border/60">Diagnostic Criteria</td>
                  <td className="p-4 sm:p-5 border-b border-ice-border/60">Subjective opinion of buyer</td>
                  <td className="p-4 sm:p-5 border-b border-ice-border/60">Unverifiable dealer claims</td>
                  <td className="p-4 sm:p-5 font-medium text-ink-navy bg-blue-50/30 border-l-2 border-r-2 border-b border-blue-100 border-l-blue-500 border-r-blue-500 shadow-[-4px_0_10px_rgba(59,130,246,0.18),4px_0_10px_rgba(59,130,246,0.18)]">
                    Standardized 5–10 min audit matrix
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-ink-navy border-b border-ice-border/60">Payment Settlement</td>
                  <td className="p-4 sm:p-5 border-b border-ice-border/60">Cash risk / delayed escrow</td>
                  <td className="p-4 sm:p-5 border-b border-ice-border/60">Unregulated cash or delays</td>
                  <td className="p-4 sm:p-5 font-medium text-ink-navy bg-blue-50/30 border-l-2 border-r-2 border-b border-blue-100 border-l-blue-500 border-r-blue-500 shadow-[-4px_0_10px_rgba(59,130,246,0.18),4px_0_10px_rgba(59,130,246,0.18)]">
                    Instant UPI / IMPS before handover
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-ink-navy border-b border-ice-border/60">If Condition Differs?</td>
                  <td className="p-4 sm:p-5 border-b border-ice-border/60">Awkward dispute &amp; wasted trip</td>
                  <td className="p-4 sm:p-5 border-b border-ice-border/60">Pressure to accept sunk travel cost</td>
                  <td className="p-4 sm:p-5 font-medium text-ink-navy bg-blue-50/30 border-l-2 border-r-2 border-b border-blue-100 border-l-blue-500 border-r-blue-500 shadow-[-4px_0_10px_rgba(59,130,246,0.18),4px_0_10px_rgba(59,130,246,0.18)]">
                    Zero-obligation: decline with ₹0 fee
                  </td>
                </tr>
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-ink-navy">Data Privacy Support</td>
                  <td className="p-4 sm:p-5">Solely on the seller</td>
                  <td className="p-4 sm:p-5">Rarely verified</td>
                  <td className="p-4 sm:p-5 font-medium text-ink-navy bg-blue-50/30 border-l-2 border-r-2 border-b-2 border-blue-500 rounded-br-2xl shadow-[-4px_0_12px_rgba(59,130,246,0.25),4px_0_12px_rgba(59,130,246,0.25),0_4px_12px_rgba(59,130,246,0.25)]">
                    Assisted cloud logout &amp; full factory reset
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ── 4. The 4-Step Journey ── */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cobalt">Customer Journey</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-navy font-outfit tracking-tight mt-1">
            How doorstep selling works
          </h2>
          <p className="text-sm text-ink-slate font-light mt-1.5 max-w-2xl leading-relaxed">
            A simple, predictable four-step process designed to respect your time and security.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-sm space-y-3 relative text-left">
            <span className="text-xs font-mono font-bold text-cobalt bg-cobalt/10 px-2 py-0.5 rounded border border-cobalt/15">
              STEP 01
            </span>
            <h3 className="text-base font-bold text-ink-navy font-outfit mt-2">Instant Valuation</h3>
            <p className="text-xs text-ink-slate font-light leading-relaxed">
              Select your smartphone model and answer a quick condition checklist to view a transparent, real-time market quote.
            </p>
          </div>

          <div className="bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-sm space-y-3 relative text-left">
            <span className="text-xs font-mono font-bold text-cobalt bg-cobalt/10 px-2 py-0.5 rounded border border-cobalt/15">
              STEP 02
            </span>
            <h3 className="text-base font-bold text-ink-navy font-outfit mt-2">Schedule Pickup</h3>
            <p className="text-xs text-ink-slate font-light leading-relaxed">
              Choose your preferred date and time slot. Our verified field technician visits your home or workplace across Delhi NCR.
            </p>
          </div>

          <div className="bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-sm space-y-3 relative text-left">
            <span className="text-xs font-mono font-bold text-cobalt bg-cobalt/10 px-2 py-0.5 rounded border border-cobalt/15">
              STEP 03
            </span>
            <h3 className="text-base font-bold text-ink-navy font-outfit mt-2">5-Min Verification</h3>
            <p className="text-xs text-ink-slate font-light leading-relaxed">
              The technician conducts an objective hardware check. When condition matches what you declared, the full quote is honored.
            </p>
          </div>

          <div className="bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-sm space-y-3 relative text-left">
            <span className="text-xs font-mono font-bold text-cobalt bg-cobalt/10 px-2 py-0.5 rounded border border-cobalt/15">
              STEP 04
            </span>
            <h3 className="text-base font-bold text-ink-navy font-outfit mt-2">Instant Settlement</h3>
            <p className="text-xs text-ink-slate font-light leading-relaxed">
              Payment is disbursed on the spot via UPI or immediate bank transfer directly to your account before you hand over the device.
            </p>
          </div>
        </div>
      </div>

      {/* ── 5. Pricing Engine & Valuation Framework ── */}
      <div className="bg-canvas-pure border border-ice-border rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="max-w-2xl">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cobalt">Valuation Mechanics</span>
          <h2 className="text-xl sm:text-2xl font-bold text-ink-navy font-outfit tracking-tight mt-1">
            Our dynamic pricing principles
          </h2>
          <p className="text-sm text-ink-slate font-light mt-1.5 leading-relaxed">
            Unlike informal dealers who invent deductions on the spot, our valuations are powered by an algorithmic engine grounded in verifiable data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink-navy font-semibold text-sm">
              <SlidersHorizontal className="w-4 h-4 text-cobalt shrink-0" />
              <span>Catalog Baseline</span>
            </div>
            <p className="text-xs text-ink-slate font-light leading-relaxed">
              Base quotes are indexed against secondary market price transactions, ensuring fair initial offers tailored to exact brand, series, and storage configurations.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink-navy font-semibold text-sm">
              <ShieldCheck className="w-4 h-4 text-cobalt shrink-0" />
              <span>Standardized Deductions</span>
            </div>
            <p className="text-xs text-ink-slate font-light leading-relaxed">
              Every deduction for screen condition, cosmetic scratches, battery wear, or accessories follows fixed mathematical rules—never dealer intuition.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-ink-navy font-semibold text-sm">
              <CreditCard className="w-4 h-4 text-cobalt shrink-0" />
              <span>No Hidden Charges</span>
            </div>
            <p className="text-xs text-ink-slate font-light leading-relaxed">
              The valuation you see is the net payout you receive. We show all components clearly upfront before you confirm any appointment.
            </p>
          </div>
        </div>
      </div>

      {/* ── 6. Guarantees: Safety, Transparency & Data Privacy ── */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cobalt">Customer Commitments</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-navy font-outfit tracking-tight mt-1">
            Our core service guarantees
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-cobalt/10 flex items-center justify-center text-cobalt">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-ink-navy font-outfit">100% No-Obligation Evaluation</h3>
            <p className="text-sm text-ink-slate font-light leading-relaxed">
              If our technician discovers an undisclosed physical or hardware defect and presents an updated valuation, you have total freedom to accept or decline. If you decline, the appointment is concluded immediately with absolutely zero cancellation fees or penalty charges.
            </p>
          </div>

          <div className="bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-ink-navy font-outfit">Complete Data Privacy &amp; Sanitization</h3>
            <p className="text-sm text-ink-slate font-light leading-relaxed">
              Your personal data security is non-negotiable. Our technicians guide you through signing out of all cloud accounts (Apple iCloud, Google Account, or Samsung Account) and performing a complete factory data reset in your presence prior to device handover.
            </p>
          </div>
        </div>
      </div>

      {/* ── 7. Transparency FAQ ── */}
      <div className="space-y-6">
        <div>
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cobalt">Got Questions?</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-navy font-outfit tracking-tight mt-1">
            Frequently asked questions
          </h2>
          <p className="text-sm text-ink-slate font-light mt-1.5 max-w-2xl leading-relaxed">
            Direct, candid answers about how Rephonix operates.
          </p>
        </div>

        <div className="space-y-3">
          {[
            {
              q: 'What happens if the device condition differs from my online declaration?',
              a: 'If our technician finds an undisclosed issue (such as a camera lens scratch or display replacement), they will explain the finding clearly and calculate an updated valuation using the exact same standard pricing engine. If you do not agree with the updated offer, you can decline on the spot—we cancel the order with zero cancellation fee.'
            },
            {
              q: 'How and when is payment processed?',
              a: 'Payment is transferred immediately at your doorstep before you hand over your phone. We disburse funds instantly via UPI (Google Pay, PhonePe, Paytm) or direct IMPS bank transfer. You can verify the transaction in your personal banking app before concluding the pickup.'
            },
            {
              q: 'What do I need to prepare before the technician arrives?',
              a: 'Please ensure your smartphone has at least 30% battery so we can run diagnostics, have your government ID ready for ownership verification, and back up any personal photos or files. Our technician will assist with account logout and factory reset.'
            },
            {
              q: 'What locations do you currently service?',
              a: 'Rephonix currently provides on-site pickup and verification services throughout the Delhi NCR region, including Delhi, Gurgaon, Noida, Greater Noida, Ghaziabad, and Faridabad.'
            },
            {
              q: 'Do you buy phones that do not turn on or have dead displays?',
              a: 'Yes, we provide quotes for devices with non-functional displays or power issues, provided the device can be verified with its original IMEI/serial number and is unlinked from owner activation locks.'
            }
          ].map((faq, idx) => (
            <div 
              key={idx}
              className="bg-canvas-pure border border-ice-border rounded-xl overflow-hidden shadow-xs transition-all"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 font-semibold text-ink-navy hover:text-cobalt transition-colors cursor-pointer"
              >
                <span className="text-sm font-outfit">{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-ink-muted shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180 text-cobalt' : ''}`} />
              </button>
              {openFaq === idx && (
                <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-ink-slate font-light leading-relaxed border-t border-ice-border/40">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── 8. Call to Action Banner ── */}
      <div className="bg-gradient-to-br from-ink-navy to-slate-900 text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden shadow-xl text-center space-y-6">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cobalt/20 blur-[90px] rounded-full pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 blur-[90px] rounded-full pointer-events-none" />

        <div className="relative z-10 max-w-2xl mx-auto space-y-3">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/15 tracking-widest uppercase font-mono">
            Get Started Today
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold font-outfit tracking-tight">
            Ready to find out what your smartphone is worth?
          </h2>
          <p className="text-white/80 text-sm font-light leading-relaxed">
            Get an instant, market-calibrated quote in under 60 seconds with no obligation to sell.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStartQuote}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-cobalt hover:bg-cobalt-hover text-white rounded-xl font-bold text-sm shadow-lg transition-all cursor-pointer"
            >
              <span>Value Your Smartphone</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleContact}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
            >
              <span>Have Questions? Contact Us</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
