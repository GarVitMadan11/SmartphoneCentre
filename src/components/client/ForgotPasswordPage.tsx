import React, { useState } from 'react';
import { Mail, ArrowLeft, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { forgotPassword } from '../../utils/api';

interface ForgotPasswordPageProps {
  onNavigate: (path: string) => void;
}

export default function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) { setError('Please enter a valid email address.'); return; }

    setError('');
    setIsLoading(true);
    try {
      await forgotPassword(cleanEmail);
      setSubmitted(true);
    } catch (err: any) {
      // Even on error, show generic success to avoid enumeration
      setSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-canvas-pure border border-ice-border rounded-xl p-8 shadow-3d-card text-left">

        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.svg" className="w-12 h-12 object-contain" alt="Rephonix Logo" />
          </div>
          <h2 className="text-2xl font-extrabold text-ink-navy tracking-tight font-outfit">Forgot Password?</h2>
          <p className="mt-2 text-xs text-ink-muted font-light">
            Enter your email and we'll send you a secure reset link.
          </p>
        </div>

        <button onClick={() => onNavigate('/login')} className="flex items-center gap-1.5 text-xs text-cobalt hover:underline font-medium">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
        </button>

        {submitted ? (
          <div className="space-y-5">
            <div className="flex flex-col items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-5 rounded-sm text-sm font-medium text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              <div>
                <p className="font-bold">Reset link sent</p>
                <p className="text-xs font-light mt-1 text-emerald-700">
                  If an account exists for <strong>{email}</strong>, a password reset link has been sent. Please check your inbox and spam folder.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('/login')}
              className="w-full flex justify-center py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <>
            {error && (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-sm text-xs font-medium">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="reset-email" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                    placeholder="Enter your registered email"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
