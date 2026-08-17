import React, { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react';
import { resetPassword } from '../../utils/api';

interface ResetPasswordPageProps {
  onNavigate: (path: string) => void;
  tokenParam?: string | null;
}

export default function ResetPasswordPage({ onNavigate, tokenParam }: ResetPasswordPageProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!tokenParam) {
      setError('Invalid or missing reset link. Please request a new one.');
    }
  }, [tokenParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tokenParam) { setError('Invalid reset token.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }

    setError('');
    setIsLoading(true);
    try {
      await resetPassword(tokenParam, password);
      setSuccess(true);
    } catch (err: any) {
      if (err.status === 400) {
        const msg: string = err.message || '';
        if (msg.toLowerCase().includes('expir')) {
          setError('This reset link has expired. Please request a new one.');
        } else if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('used')) {
          setError('This reset link is invalid or has already been used. Please request a new one.');
        } else {
          setError(msg || 'Failed to reset password. Please try again.');
        }
      } else {
        setError('Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-canvas-pure border border-ice-border rounded-xl p-8 shadow-3d-card text-left">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-ink-navy font-outfit">Password Reset!</h2>
            <p className="text-xs text-ink-muted font-light">Your password has been reset successfully. You can now sign in with your new password.</p>
            <button
              onClick={() => onNavigate('/login')}
              className="w-full flex justify-center py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-canvas-pure border border-ice-border rounded-xl p-8 shadow-3d-card text-left">

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.svg" className="w-12 h-12 object-contain" alt="Rephonix Logo" />
          </div>
          <h2 className="text-2xl font-extrabold text-ink-navy tracking-tight font-outfit">Reset Password</h2>
          <p className="mt-2 text-xs text-ink-muted font-light">Enter your new password below.</p>
        </div>

        <button onClick={() => onNavigate('/forgot-password')} className="flex items-center gap-1.5 text-xs text-cobalt hover:underline font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {error && (
          <div className="flex flex-col gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-sm text-xs font-medium">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
            {(error.includes('expired') || error.includes('invalid') || error.includes('used')) && (
              <button onClick={() => onNavigate('/forgot-password')} className="text-cobalt hover:underline text-xs font-bold self-start pl-6">
                Request a new reset link
              </button>
            )}
          </div>
        )}

        {!error || !error.includes('Invalid or missing') ? (
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="new-password" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted"><Lock className="w-4 h-4" /></span>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                  placeholder="At least 8 characters"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-ink-navy"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}>
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-new-password" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">Confirm New Password</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted"><Lock className="w-4 h-4" /></span>
                <input
                  id="confirm-new-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            <button type="submit" disabled={isLoading || !tokenParam}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed">
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        ) : (
          <button onClick={() => onNavigate('/forgot-password')}
            className="w-full flex justify-center py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium">
            Request New Reset Link
          </button>
        )}
      </div>
    </div>
  );
}
