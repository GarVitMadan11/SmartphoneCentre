import React, { useState } from 'react';
import { Search, Home, ArrowRight, MessageCircle } from 'lucide-react';
import type { Model } from '../../data/mockDatabase';

interface NotFoundPageProps {
  onNavigate: (path: string) => void;
  models?: Model[];
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigate,
  models = [],
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredModels = searchQuery.trim().length >= 2
    ? models
        .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .slice(0, 5)
    : [];

  const handleWhatsAppHelp = () => {
    const text = encodeURIComponent("Hi Rephonix Team! I reached a broken link on your website and need help finding my device quote.");
    window.open(`https://wa.me/919034997719?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="max-w-xl w-full text-center space-y-8 animate-fadeIn">
        
        {/* Visual Badge & Code */}
        <div className="space-y-3">
          <span className="inline-block px-3.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 uppercase tracking-widest font-mono">
            404 — Page Not Found
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-ink-navy tracking-tight font-sans">
            Looking for your device?
          </h1>
          <p className="text-sm sm:text-base text-ink-slate font-light max-w-md mx-auto leading-relaxed">
            The page or model link you requested may have moved or been updated. Let's get you back on track to sell your smartphone.
          </p>
        </div>

        {/* Smart Device Search Box */}
        <div className="relative max-w-md mx-auto text-left">
          <div className="relative flex items-center bg-canvas-pure border-2 border-ice-border rounded-xl shadow-sm focus-within:border-cobalt transition-all overflow-hidden">
            <Search className="w-5 h-5 text-ink-muted ml-3.5 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search model (e.g. iPhone 14, S23 Ultra)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full py-3 px-3 text-sm bg-transparent text-ink-navy placeholder:text-slate-400 focus:outline-none font-sans"
              autoFocus
            />
          </div>

          {/* Search Suggestions Dropdown */}
          {filteredModels.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1.5 bg-canvas-pure border border-ice-border rounded-xl shadow-xl z-20 overflow-hidden divide-y divide-ice-border/60">
              {filteredModels.map((m) => (
                <button
                  key={m.id}
                  onClick={() => onNavigate(`/smartphones?q=${encodeURIComponent(m.name)}`)}
                  className="w-full px-4 py-2.5 text-left text-xs sm:text-sm font-semibold text-ink-navy hover:bg-cobalt-light hover:text-cobalt flex items-center justify-between transition-colors"
                >
                  <span>{m.name}</span>
                  <span className="text-[11px] text-emerald-600 font-bold">Instant Quote →</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <button
            onClick={() => onNavigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cobalt hover:bg-cobalt-hover text-white text-xs sm:text-sm font-bold shadow-sm transition-all active:scale-95"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </button>

          <button
            onClick={() => onNavigate('/smartphones')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-canvas-pure hover:bg-slate-50 border border-ice-border text-ink-navy text-xs sm:text-sm font-bold shadow-xs transition-all active:scale-95"
          >
            Browse All Models
            <ArrowRight className="w-4 h-4 text-cobalt" />
          </button>
        </div>

        {/* Direct WhatsApp Concierge Help */}
        <div className="pt-4 border-t border-ice-border/40 text-xs text-ink-muted">
          <span>Need immediate assistance? </span>
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

