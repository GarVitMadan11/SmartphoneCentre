import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff, LogOut, AlertCircle, Clock } from 'lucide-react';
import { adminLogin, adminLogout, adminToken } from '../../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// AdminPinGate — server-authenticated PIN gate
//
// Authentication flow:
//   1. User enters PIN → POST /api/admin/auth (rate-limited: 10 attempts / 15 min)
//   2. Server validates PIN against bcrypt hash → returns signed JWT (4h expiry)
//   3. JWT stored in sessionStorage (cleared on tab close)
//   4. All subsequent admin API calls include Bearer <jwt> header automatically
//
// The PIN is never stored or logged on the frontend.
// ─────────────────────────────────────────────────────────────────────────────

const MAX_LOCAL_ATTEMPTS = 5; // client-side guard (server also enforces 10/15min)

interface AdminPinGateProps {
  children: React.ReactNode;
  onExit: () => void;
}

export const AdminPinGate: React.FC<AdminPinGateProps> = ({ children, onExit }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(() => adminToken.isValid());
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);

  // Re-check token validity on mount (handles page refresh)
  useEffect(() => {
    setIsAuthenticated(adminToken.isValid());
  }, []);

  // Countdown display for session expiry
  useEffect(() => {
    if (!isAuthenticated) return;
    const raw = sessionStorage.getItem('_rex_ate');
    if (raw) setSessionExpiry(parseInt(raw, 10));
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isLoading || pin.length < 4) return;

    setIsLoading(true);
    setError('');

    try {
      await adminLogin(pin);
      setPin('');
      setAttempts(0);
      setIsAuthenticated(true);
      const raw = sessionStorage.getItem('_rex_ate');
      if (raw) setSessionExpiry(parseInt(raw, 10));
    } catch (err: unknown) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setPin('');

      if (newAttempts >= MAX_LOCAL_ATTEMPTS) {
        setIsLocked(true);
        setError('Too many failed attempts. Please refresh the page to try again.');
      } else {
        const remaining = MAX_LOCAL_ATTEMPTS - newAttempts;
        // Check if the server rate-limited us
        const message = (err as Error).message ?? '';
        if (message.toLowerCase().includes('too many')) {
          setIsLocked(true);
          setError('Too many login attempts. Please wait 15 minutes before trying again.');
        } else {
          setError(`Incorrect PIN. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    adminLogout();
    setIsAuthenticated(false);
    setPin('');
    setError('');
    setAttempts(0);
    setIsLocked(false);
    setSessionExpiry(null);
    onExit();
  };

  const formatExpiry = (ts: number) => {
    const mins = Math.max(0, Math.round((ts - Date.now()) / 60000));
    if (mins <= 0) return 'Expiring soon';
    if (mins < 60) return `~${mins}m remaining`;
    return `~${Math.round(mins / 60)}h remaining`;
  };

  if (isAuthenticated) {
    return (
      <div>
        {/* Admin session banner */}
        <div className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-sm mb-4 text-xs font-mono">
          <span className="flex items-center gap-2 text-amber-600">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin session active — JWT authenticated</span>
            {sessionExpiry && (
              <span className="flex items-center gap-1 text-amber-500/70">
                <Clock className="w-3 h-3" />
                {formatExpiry(sessionExpiry)}
              </span>
            )}
          </span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-amber-600 hover:text-amber-700 font-bold"
          >
            <LogOut className="w-3.5 h-3.5" />
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
          <p className="text-xs text-ink-muted mt-2 text-center font-light leading-relaxed max-w-xs">
            This panel is restricted to authorized personnel. Enter your admin PIN to authenticate.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm text-xs text-red-500 font-mono text-center flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* PIN input */}
          <div>
            <label htmlFor="admin-pin-input" className="text-xs font-semibold text-ink-slate block mb-1.5">
              Admin PIN
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="admin-pin-input"
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                value={pin}
                onChange={e => {
                  setPin(e.target.value.replace(/\D/g, '').slice(0, 8));
                  if (error) setError('');
                }}
                placeholder="Enter PIN"
                disabled={isLocked || isLoading}
                autoFocus
                autoComplete="current-password"
                className={`w-full pl-10 pr-10 py-3 rounded-sm border bg-canvas-white text-ink-navy text-sm font-mono tracking-[0.25em] focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all ${
                  isLocked || isLoading ? 'opacity-50 cursor-not-allowed border-red-300' :
                  error ? 'border-red-400' : 'border-ice-border'
                }`}
                style={{ minHeight: '48px' }}
              />
              <button
                type="button"
                onClick={() => setShowPin(v => !v)}
                disabled={isLocked || isLoading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-muted hover:text-cobalt transition-colors p-1"
                aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                tabIndex={-1}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Attempt dots */}
            {attempts > 0 && !isLocked && (
              <div className="mt-2 flex gap-1 justify-center" aria-hidden="true">
                {Array.from({ length: MAX_LOCAL_ATTEMPTS }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${i < attempts ? 'bg-red-400' : 'bg-ice-border'}`}
                  />
                ))}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={pin.length < 4 || isLocked || isLoading}
            className={`w-full py-3 rounded-sm font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              pin.length < 4 || isLocked || isLoading
                ? 'bg-ice-gray text-ink-muted cursor-not-allowed'
                : 'bg-cobalt hover:bg-cobalt-hover text-white hover:scale-[1.01]'
            }`}
            style={{ minHeight: '48px' }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" aria-hidden />
                Authenticating…
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                Unlock Admin Panel
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onExit}
            disabled={isLoading}
            className="w-full py-2.5 rounded-sm border border-ice-border text-ink-slate text-sm font-semibold hover:bg-ice-gray transition-all"
          >
            ← Back to Home
          </button>
        </form>
      </div>
    </div>
  );
};
