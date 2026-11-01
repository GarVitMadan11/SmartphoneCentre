import React, { useState, useEffect } from 'react';
import { ShieldAlert, Lock, Eye, EyeOff, LogOut, AlertCircle, Clock, Key, ShieldX, Unlock, Mail } from 'lucide-react';
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
    getCurrentAdminUser().then(user => {
      setIsAuthenticated(Boolean(user && user.id));
    }).catch(() => setIsAuthenticated(false));
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
        : { email: usernameInput.trim(), username: usernameInput.trim(), password: passwordInput.trim() };

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

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_LOCAL_ATTEMPTS) {
        setIsLocked(true);
        setError('Too many failed attempts. Please refresh the page to try again.');
      } else {
        const remaining = MAX_LOCAL_ATTEMPTS - newAttempts;
        if (message.toLowerCase().includes('too many')) {
          setIsLocked(true);
          setError('Too many login attempts. Please wait 15 minutes before trying again.');
        } else {
          setError(message || `Incorrect credentials. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`);
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
            <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-[10px] font-mono font-extrabold tracking-normal uppercase border border-red-500/30">
              EMERGENCY SECURITY SHIELD ACTIVE
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-3 tracking-tight font-sans">
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
      <div className="w-full h-screen flex flex-col overflow-hidden bg-slate-950">
        {/* Slim top Admin session banner */}
        <div className="flex items-center justify-between px-4 py-1.5 bg-slate-900 border-b border-slate-800 text-xs font-mono flex-shrink-0 z-40">
          <span className="flex items-center gap-2 text-amber-400">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Admin session active — JWT authenticated</span>
            {sessionExpiry && (
              <span className="flex items-center gap-1 text-slate-400 ml-2">
                <Clock className="w-3 h-3" />
                <span>Expires: {formatExpiry(sessionExpiry)}</span>
              </span>
            )}
          </span>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-bold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        </div>
        <div className="flex-1 w-full min-h-0 overflow-hidden">
          {children}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] py-12 px-4 relative select-none">
      {/* Background Ambient Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Glassmorphism Card */}
      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800/90 rounded-2xl p-7 sm:p-9 shadow-2xl shadow-black/80 text-white relative z-10 overflow-hidden">
        {/* Top Accent Gradient Line */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400" />

        {/* Icon & Title */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center mb-3 text-blue-400 shadow-inner shadow-blue-500/20">
            <Lock className="w-7 h-7 text-blue-400" />
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono font-bold text-blue-400 uppercase tracking-wider mb-2">
            <span>Rephonix Security</span>
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight font-sans">Admin Access</h2>
          <p className="text-xs text-slate-400 mt-1.5 text-center font-normal leading-relaxed max-w-xs">
            {authMode === 'user'
              ? 'Enter your company email and password to access administrative controls.'
              : 'Enter your 4 to 8-digit master PIN to authenticate and unlock panel.'}
          </p>
        </div>

        {/* Segmented Auth Mode Switcher */}
        <div className="flex p-1 bg-slate-950/70 border border-slate-800 rounded-xl mb-6">
          <button
            type="button"
            onClick={() => { setAuthMode('user'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'user'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Email & Password</span>
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('pin'); setError(''); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              authMode === 'pin'
                ? 'bg-blue-600 text-white shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Master PIN</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Error Banner */}
          {error && (
            <div
              role="alert"
              className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400 font-mono text-center flex items-center gap-2.5 animate-in fade-in duration-150"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
              <span className="text-left">{error}</span>
            </div>
          )}

          {authMode === 'user' ? (
            <div className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 font-mono">
                  Company Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    value={usernameInput}
                    onChange={e => setUsernameInput(e.target.value)}
                    placeholder="partner@rephonix.in or admin"
                    disabled={isLocked || isLoading}
                    autoFocus
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1.5 font-mono">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type={showPin ? 'text' : 'password'}
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    placeholder="Enter account password"
                    disabled={isLocked || isLoading}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-white placeholder:text-slate-500 text-xs sm:text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1 transition-colors cursor-pointer"
                  >
                    {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div>
              <label htmlFor="admin-pin-input" className="text-xs font-semibold text-slate-300 block mb-1.5 font-mono">
                Admin Master PIN
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="admin-pin-input"
                  type={showPin ? 'text' : 'password'}
                  inputMode="numeric"
                  value={pin}
                  onChange={e => {
                    setPin(e.target.value.replace(/\D/g, '').slice(0, 8));
                    if (error) setError('');
                  }}
                  placeholder="Enter 4 to 8-digit PIN"
                  disabled={isLocked || isLoading}
                  autoFocus
                  autoComplete="current-password"
                  className={`w-full pl-10 pr-10 py-3 rounded-xl border bg-slate-950/80 text-white placeholder:text-slate-500 text-sm font-mono tracking-[0.25em] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all shadow-inner ${
                    isLocked || isLoading ? 'opacity-50 cursor-not-allowed border-red-500/50' :
                    error ? 'border-red-400' : 'border-slate-700/80'
                  }`}
                  style={{ minHeight: '48px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(v => !v)}
                  disabled={isLocked || isLoading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors p-1 cursor-pointer"
                  aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                  tabIndex={-1}
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Attempt dots */}
              {attempts > 0 && !isLocked && (
                <div className="mt-3 flex gap-1.5 justify-center" aria-hidden="true">
                  {Array.from({ length: MAX_LOCAL_ATTEMPTS }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full transition-colors ${i < attempts ? 'bg-red-500 shadow-sm shadow-red-500/50' : 'bg-slate-700'}`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            type="submit"
            disabled={(authMode === 'pin' && pin.length < 4) || (authMode === 'user' && (!usernameInput.trim() || !passwordInput.trim())) || isLocked || isLoading}
            className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
              ((authMode === 'pin' && pin.length < 4) || (authMode === 'user' && (!usernameInput.trim() || !passwordInput.trim())) || isLocked || isLoading)
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-blue-600/30 active:scale-[0.99] cursor-pointer'
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
            className="w-full py-2.5 rounded-xl border border-slate-800/80 bg-slate-950/40 text-slate-400 hover:text-white hover:bg-slate-800/50 text-xs font-semibold transition-all cursor-pointer"
          >
            ← Back to Home
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-800/60 flex items-center justify-center gap-2 text-[10px] text-slate-500 font-mono">
          <Lock className="w-3 h-3 text-slate-500" />
          <span>256-bit TLS encrypted session</span>
        </div>
      </div>
    </div>
  );
};
