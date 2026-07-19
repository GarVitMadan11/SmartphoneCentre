import React, { useState } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff } from 'lucide-react';

// ─── IMPORTANT ────────────────────────────────────────────────────────────────
// This is a simple client-side PIN gate for demo/prototype purposes only.
// For production, replace with a real authentication system (OAuth, JWT, etc.)
// The PIN is NOT secure — move this to a server-side auth check before launch.
// ─────────────────────────────────────────────────────────────────────────────
const ADMIN_PIN = '1234';
const SESSION_KEY = 'stc_admin_auth';
const MAX_ATTEMPTS = 5;

interface AdminPinGateProps {
  children: React.ReactNode;
  onExit: () => void;
}

export const AdminPinGate: React.FC<AdminPinGateProps> = ({ children, onExit }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    try { return sessionStorage.getItem(SESSION_KEY) === 'true'; } catch { return false; }
  });
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked) return;

    if (pin === ADMIN_PIN) {
      try { sessionStorage.setItem(SESSION_KEY, 'true'); } catch { /* ignore */ }
      setIsAuthenticated(true);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setError('Too many failed attempts. Please refresh the page to try again.');
      } else {
        setError(`Incorrect PIN. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? '' : 's'} remaining.`);
      }
    }
  };

  const handleSignOut = () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setIsAuthenticated(false);
    setPin('');
    setError('');
    setAttempts(0);
    setIsLocked(false);
    onExit();
  };

  if (isAuthenticated) {
    return (
      <div>
        {/* Admin session banner */}
        <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-sm mb-4 text-xs font-mono">
          <span className="flex items-center gap-2 text-amber-500">
            <ShieldAlert className="w-3.5 h-3.5" />
            Admin session active — PIN protected
          </span>
          <button
            onClick={handleSignOut}
            className="text-amber-600 hover:text-amber-700 font-bold underline underline-offset-2"
          >
            Sign Out
          </button>
        </div>
        {children}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] py-16 px-4">
      <div className="w-full max-w-sm">
        {/* Icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-xl bg-cobalt/10 border border-cobalt/20 flex items-center justify-center mb-4">
            <Lock className="w-7 h-7 text-cobalt" />
          </div>
          <h2 className="text-2xl font-light text-ink-navy tracking-tight">Admin Access</h2>
          <p className="text-xs text-ink-muted mt-2 text-center font-light leading-relaxed">
            This panel is restricted. Enter the admin PIN to continue.<br />
            <span className="font-mono text-zinc-400">(Demo PIN: 1234)</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error banner */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm text-xs text-red-400 font-mono text-center animate-fadeIn">
              {error}
            </div>
          )}

          {/* PIN input */}
          <div>
            <label className="text-xs font-semibold text-ink-slate block mb-1.5">Admin PIN</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                value={pin}
                onChange={e => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 8));
                  if (error) setError('');
                }}
                placeholder="Enter PIN"
                disabled={isLocked}
                autoFocus
                className={`w-full pl-10 pr-10 py-3 rounded-sm border bg-canvas-white text-ink-navy text-sm font-mono tracking-[0.25em] focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all ${
                  isLocked ? 'opacity-50 cursor-not-allowed border-red-300' :
                  error ? 'border-red-400' : 'border-ice-border'
                }`}
                style={{ minHeight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPin(v => !v)}
                disabled={isLocked}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-cobalt transition-colors p-1"
                aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {attempts > 0 && !isLocked && (
              <div className="mt-1 flex gap-1 justify-center">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i < attempts ? 'bg-red-400' : 'bg-ice-border'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={pin.length < 4 || isLocked}
            className={`w-full py-3 rounded-sm font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              pin.length < 4 || isLocked
                ? 'bg-ice-gray text-ink-muted cursor-not-allowed'
                : 'bg-cobalt hover:bg-cobalt-hover text-white hover:scale-[1.01]'
            }`}
            style={{ minHeight: '48px' }}
          >
            <ShieldAlert className="w-4 h-4" />
            Unlock Admin Panel
          </button>

          <button
            type="button"
            onClick={onExit}
            className="w-full py-2.5 rounded-sm border border-ice-border text-ink-slate text-sm font-semibold hover:bg-ice-gray transition-all"
          >
            ← Back to Home
          </button>
        </form>
      </div>
    </div>
  );
};
