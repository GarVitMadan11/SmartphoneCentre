import React, { useState } from 'react';
import { Wrench, Clock, MessageCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface MaintenancePageProps {
  estimatedUptime?: string;
  onRefresh?: () => void;
}

export const MaintenancePage: React.FC<MaintenancePageProps> = ({
  estimatedUptime = 'within 30-45 minutes',
  onRefresh = () => window.location.reload(),
}) => {
  const [phoneNotify, setPhoneNotify] = useState('');
  const [notified, setNotified] = useState(false);

  const handleNotifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phoneNotify.trim().length >= 10) {
      setNotified(true);
    }
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent("Hi Rephonix! I see the website is undergoing scheduled maintenance. I'd like to check a quote or follow up on my pickup.");
    window.open(`https://wa.me/919034997719?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-canvas-obsidian flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-lg w-full bg-canvas-pure border border-ice-border rounded-3xl p-8 sm:p-10 shadow-2xl text-center space-y-8 animate-fadeIn">
        
        {/* Header Branding */}
        <div className="flex items-center justify-center gap-2">
          <img src="/logo.svg" className="w-9 h-9 object-contain rounded-md" alt="Rephonix Logo" />
          <span className="text-2xl font-black text-ink-navy tracking-tight">
            Re<span className="text-secondary">phonix</span>
          </span>
        </div>

        {/* Maintenance Visual */}
        <div className="relative mx-auto w-20 h-20 rounded-3xl bg-secondary/10 border border-secondary/25 flex items-center justify-center text-secondary shadow-inner">
          <Wrench className="w-10 h-10 stroke-[2.2] animate-bounce" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 border-2 border-white"></span>
          </span>
        </div>

        {/* Messaging */}
        <div className="space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            <span>Scheduled System Calibration</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-ink-navy tracking-tight font-sans">
            Upgrading Our Pricing Engine
          </h1>

          <p className="text-xs sm:text-sm text-ink-slate font-light leading-relaxed max-w-sm mx-auto">
            We are currently fine-tuning our live device valuation servers and catalog data to ensure the most accurate buyback payouts.
          </p>
        </div>

        {/* Estimated Uptime Banner */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-ink-navy flex items-center justify-between font-semibold">
          <span className="text-ink-slate">Expected Restoration:</span>
          <span className="text-cobalt font-bold">{estimatedUptime}</span>
        </div>

        {/* SMS / WhatsApp Notification Form */}
        {!notified ? (
          <form onSubmit={handleNotifySubmit} className="space-y-3 text-left">
            <label className="block text-[11px] font-bold text-ink-slate uppercase tracking-wider">
              Notify me when service is restored:
            </label>
            <div className="flex gap-2">
              <input
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={phoneNotify}
                onChange={(e) => setPhoneNotify(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="flex-1 py-2.5 px-3.5 text-xs bg-canvas-pure border border-ice-border rounded-xl focus:border-cobalt focus:outline-none"
              />
              <button
                type="submit"
                disabled={phoneNotify.length < 10}
                className="px-4 py-2.5 rounded-xl bg-cobalt hover:bg-cobalt-hover disabled:opacity-40 text-white text-xs font-bold transition-all shadow-sm"
              >
                Notify Me
              </button>
            </div>
          </form>
        ) : (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center justify-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>We'll ping your mobile number as soon as systems are live!</span>
          </div>
        )}

        {/* Live Support Alternative */}
        <div className="space-y-3 pt-2 border-t border-ice-border/60">
          <p className="text-xs text-ink-muted">
            Need urgent assistance or have an existing pickup scheduled?
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5">
            <button
              onClick={handleWhatsApp}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition-all"
            >
              <MessageCircle className="w-4 h-4" />
              Chat on WhatsApp
            </button>
            <button
              onClick={onRefresh}
              className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-ink-navy text-xs font-bold transition-all"
            >
              Check Again
            </button>
          </div>
        </div>

        {/* Safe Data Assurance */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>All existing quotes &amp; customer records remain 100% secure</span>
        </div>

      </div>
    </div>
  );
};

