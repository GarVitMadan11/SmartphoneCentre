import React from 'react';
import { AlertCircle, RefreshCw, Home, MessageCircle } from 'lucide-react';

interface ServerErrorPageProps {
  onReset?: () => void;
  onGoHome?: () => void;
  error?: Error | null;
}

export const ServerErrorPage: React.FC<ServerErrorPageProps> = ({
  onReset,
  onGoHome,
  error,
}) => {
  const handleReload = () => {
    if (onReset) {
      onReset();
    } else {
      window.location.reload();
    }
  };

  const handleWhatsAppHelp = () => {
    const text = encodeURIComponent("Hi Rephonix Team! I encountered an unexpected error during my phone valuation flow. Could you please assist me?");
    window.open(`https://wa.me/919034997719?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-md w-full text-center space-y-6 animate-fadeIn bg-canvas-pure border border-ice-border rounded-2xl p-8 shadow-premium">
        
        {/* Error Icon */}
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center mx-auto shadow-inner">
          <AlertCircle className="w-8 h-8 stroke-[2.2]" />
        </div>

        {/* Header */}
        <div className="space-y-2">
          <span className="inline-block px-3 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-200 uppercase tracking-widest font-mono">
            System Notice
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-ink-navy tracking-tight font-sans">
            Something went off track
          </h2>
          <p className="text-xs sm:text-sm text-ink-slate font-light leading-relaxed">
            An unexpected error occurred while loading this step. Your saved quote data is preserved in your session.
          </p>
        </div>

        {/* Technical Hint (dev / safe detail) */}
        {error?.message && (
          <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-[11px] text-slate-500 font-mono text-left truncate max-w-full">
            {error.message}
          </div>
        )}

        {/* Actions */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleReload}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-cobalt hover:bg-cobalt-hover text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-98 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            Restore Step &amp; Refresh
          </button>

          {onGoHome && (
            <button
              onClick={onGoHome}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-ink-navy text-xs sm:text-sm font-bold transition-all active:scale-98 cursor-pointer"
            >
              <Home className="w-4 h-4 text-slate-500" />
              Return to Homepage
            </button>
          )}
        </div>

        {/* WhatsApp Support Link */}
        <div className="pt-4 border-t border-ice-border/60 text-xs text-ink-muted">
          <span>Need help right now? </span>
          <button
            onClick={handleWhatsAppHelp}
            className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-bold underline cursor-pointer"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Chat on WhatsApp with +91 90349 97719
          </button>
        </div>

      </div>
    </div>
  );
};

