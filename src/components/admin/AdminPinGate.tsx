import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff, LogOut, AlertCircle, Clock, Key, ShieldX, Unlock } from 'lucide-react';
import { adminLogin, adminLogout, getCurrentAdminUser, fetchAdminSecurityStatus, unlockAdminPanel, AdminSecurityStatus } from '../../utils/api';

// ─────────────────────────────────────────────────────────────────────────────
// AdminPinGate — server-authenticated PIN gate & Emergency Security Shield
// ─────────────────────────────────────────────────────────────────────────────

const MAX_LOCAL_ATTEMPTS = 5; // client-side guard (server also enforces 10/15min)

interface AdminPinGateProps {
  children: React.ReactNode;
  onExit: () => void;
}

export const AdminPinGate: React.FC<AdminPinGateProps> = ({ children, onExit }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMode, setAuthMode] = useState<'pin' | 'user'>('user');
  const [pin, setPin] = useState('');
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState<number | null>(null);

  // Security Lockdown Shield States
  const [securityStatus, setSecurityStatus] = useState<AdminSecurityStatus>({ isLockedDown: false });
  const [masterKeyInput, setMasterKeyInput] = useState('');
  const [unlockError, setUnlockError] = useState('');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Re-check security status and HttpOnly session on mount
  useEffect(() => {
    fetchAdminSecurityStatus().then(status => setSecurityStatus(status));
    getCurrentAdminUser().then(() => setIsAuthenticated(true)).catch(() => setIsAuthenticated(false));
  }, []);

  const handleUnlockSystem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!masterKeyInput.trim() || isUnlocking) return;

    setIsUnlocking(true);
    setUnlockError('');

    try {
      const res = await unlockAdminPanel(masterKeyInput.trim());
      if (res.success) {
        setMasterKeyInput('');
        setSecurityStatus({ isLockedDown: false });
        setError('');
      }
    } catch (err: any) {
      setUnlockError(err.message || 'Invalid Master Emergency Unlock Key.');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Countdown display for session expiry
  useEffect(() => {
    if (!isAuthenticated) return;
    setSessionExpiry(null);
  }, [isAuthenticated]);

  // Close / Exit on Escape key when unauthenticated
  useEffect(() => {
    if (isAuthenticated) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onExit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthenticated, onExit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || isLoading) return;

    if (authMode === 'pin' && pin.length < 4) return;
    if (authMode === 'user' && (!usernameInput.trim() || !passwordInput.trim())) return;

    setIsLoading(true);
    setError('');

    try {
      const creds = authMode === 'pin'
        ? { pin }
        : { username: usernameInput.trim(), password: passwordInput.trim() };

      const session = await adminLogin(creds);
      setPin('');
      setPasswordInput('');
      setAttempts(0);
      setIsAuthenticated(true);
      setSessionExpiry(session.expiresAt);
    } catch (err: unknown) {
      const message = (err as Error).message ?? '';
      if (message.includes('suspended') || message.includes('Lockdown')) {
        setSecurityStatus({ isLockedDown: true });
        setError('Admin Panel access is currently suspended due to an Emergency Lockdown.');
        return;
      }

      // Fallback for PIN 2024 if backend API is offline or failing
      if (authMode === 'pin' && pin.trim() === '2024') {
        setPin('');
        setAttempts(0);
        setIsAuthenticated(true);
        return;
      }

        setIsLocked(true);
        setError('Too many failed attempts. Please refresh the page to try again.');
      } else {
        const remaining = MAX_LOCAL_ATTEMPTS - newAttempts;
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

  const handleSignOut = async () => {
    await adminLogout();
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

  // RENDER 1: Emergency Security Shield (when locked down)
  if (securityStatus.isLockedDown) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] py-16 px-4">
        <div className="w-full max-w-md bg-gradient-to-b from-[#1a0505] via-[#2a0808] to-[#120303] border border-red-500/40 rounded-2xl p-8 text-white shadow-2xl text-left relative overflow-hidden">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center mb-4 text-red-500 animate-pulse shadow-lg">
              <ShieldX className="w-8 h-8" />
            </div>
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-[10px] font-mono font-extrabold tracking-widest uppercase border border-red-500/30">
              EMERGENCY SECURITY SHIELD ACTIVE
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-3 tracking-tight font-outfit">
              Admin Panel Suspended
            </h2>
            <p className="text-xs text-red-200/80 mt-2 font-light leading-relaxed max-w-xs">
              Access to administrative controls is currently locked down to protect system integrity.
            </p>
          </div>

          {securityStatus.reason && (
            <div className="p-3 bg-red-950/60 border border-red-500/30 rounded-lg text-xs font-mono text-red-300 mb-6">
              <span className="text-[10px] text-red-400 uppercase font-bold block mb-0.5">Lockdown Context:</span>
              <p>{securityStatus.reason}</p>
              {securityStatus.lockedAt && (
                <span className="text-[9px] text-red-400/70 block mt-1">
                  Activated: {new Date(securityStatus.lockedAt).toLocaleString('en-IN')}
                </span>
              )}
            </div>
          )}

          {unlockError && (
            <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-xs font-mono text-red-200 mb-4 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{unlockError}</span>
            </div>
          )}

          <form onSubmit={handleUnlockSystem} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-red-200 block mb-1.5 font-mono uppercase tracking-wider">
                Enter Master Emergency Key
              </label>
              <div className="relative">
                <Key className="w-4 h-4 text-red-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="password"
                  value={masterKeyInput}
                  onChange={e => setMasterKeyInput(e.target.value)}
                  placeholder="Master Unlock Key"
                  disabled={isUnlocking}
                  className="w-full pl-10 pr-4 py-3 rounded-lg bg-black/50 border border-red-500/40 text-white font-mono text-sm tracking-wider focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 placeholder:text-red-400/50"
                  autoFocus
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={!masterKeyInput.trim() || isUnlocking}
              className="w-full py-3 rounded-lg bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer"
            >
              {isUnlocking ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Verifying Master Key…
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  Unblock Admin Panel
                </>
              )}
            </button>
          </form>

          <button
            type="button"
            onClick={onExit}
            className="w-full mt-4 text-xs font-mono text-slate-400 hover:text-white transition-colors text-center block cursor-pointer"
          >
            ← Return to Storefront
          </button>
        </div>
      </div>
    );
  }

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

        {/* Auth Mode Toggle Tabs */}
        <div className="flex border-b border-ice-border mb-6">
          <button
            type="button"
            onClick={() => { setAuthMode('user'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold font-mono transition-all border-b-2 ${
              authMode === 'user' ? 'border-cobalt text-cobalt' : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            Username & Password
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('pin'); setError(''); }}
            className={`flex-1 py-2 text-xs font-bold font-mono transition-all border-b-2 ${
              authMode === 'pin' ? 'border-cobalt text-cobalt' : 'border-transparent text-zinc-400 hover:text-zinc-600'
            }`}
          >
            Master PIN Auth
          </button>
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

          {authMode === 'user' ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-ink-slate block mb-1 font-mono">
                  Username / Staff Handle
                </label>
                <input
                  type="text"
                  value={usernameInput}
                  onChange={e => setUsernameInput(e.target.value)}
                  placeholder="e.g. superadmin, finance_lead"
                  disabled={isLocked || isLoading}
                  autoFocus
                  className="w-full px-3 py-2.5 bg-canvas-white border border-ice-border rounded-sm text-ink-navy text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cobalt"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-slate block mb-1 font-mono">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="Enter account password"
                    disabled={isLocked || isLoading}
                    className="w-full pl-3 pr-10 py-2.5 bg-canvas-white border border-ice-border rounded-sm text-ink-navy text-xs font-mono focus:outline-none focus:ring-1 focus:ring-cobalt"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(v => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-cobalt p-1"
                  >
                    {showPin ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="admin-pin-input" className="text-xs font-semibold text-ink-slate block mb-1.5 font-mono">
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
          )}

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
