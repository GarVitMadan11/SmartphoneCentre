import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, AlertCircle, Loader2, RefreshCw, ArrowLeft, MailCheck } from 'lucide-react';
import { verifyEmail, resendVerification } from '../../utils/api';

interface VerifyEmailPageProps {
  onNavigate: (path: string) => void;
  tokenParam?: string | null;
}

type VerifyState = 'loading' | 'success' | 'expired' | 'invalid' | 'no_token';

export default function VerifyEmailPage({ onNavigate, tokenParam }: VerifyEmailPageProps) {
  const [state, setState] = useState<VerifyState>(tokenParam ? 'loading' : 'no_token');
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [resendError, setResendError] = useState('');
  const hasRun = useRef(false);

  useEffect(() => {
    if (!tokenParam || hasRun.current) return;
    hasRun.current = true;

    const doVerify = async () => {
      try {
        await verifyEmail(tokenParam);
        setState('success');
      } catch (err: any) {
        const msg: string = (err.message || '').toLowerCase();
        if (msg.includes('expir')) {
          setState('expired');
        } else if (msg.includes('invalid') || msg.includes('used')) {
          setState('invalid');
        } else {
          setState('invalid');
        }
      }
    };

    doVerify();
  }, [tokenParam]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setResendError('');
    setResendLoading(true);
    try {
      await resendVerification(resendEmail.trim().toLowerCase());
      setResendSent(true);
    } catch {
      setResendSent(true); // Generic — avoid enumeration
    } finally {
      setResendLoading(false);
    }
  };

  const ResendForm = () => (
    !resendSent ? (
      <form onSubmit={handleResend} className="space-y-3 mt-4">
        <p className="text-xs text-ink-muted">Enter your email address to receive a new verification link:</p>
        <input
          type="email"
          required
          value={resendEmail}
          onChange={(e) => setResendEmail(e.target.value)}
          className="w-full px-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
          placeholder="Enter your email address"
        />
        {resendError && <p className="text-xs text-red-500">{resendError}</p>}
        <button type="submit" disabled={resendLoading}
          className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-ice-border text-ink-muted hover:text-ink-navy hover:border-cobalt/40 rounded-sm font-medium text-xs transition-all disabled:opacity-50">
          {resendLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          {resendLoading ? 'Sending...' : 'Resend Verification Email'}
        </button>
      </form>
    ) : (
      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-3 rounded-sm text-xs font-medium mt-4">
        <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
        <span>If an unverified account exists for this email, a new link has been sent. Check your inbox.</span>
      </div>
    )
  );

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-canvas-pure border border-ice-border rounded-xl p-8 shadow-3d-card text-left">

        {/* Loading */}
        {state === 'loading' && (
          <div className="text-center space-y-4 py-6">
            <Loader2 className="w-12 h-12 animate-spin text-cobalt mx-auto" />
            <h2 className="text-xl font-extrabold text-ink-navy font-outfit">Verifying Email...</h2>
            <p className="text-xs text-ink-muted">Please wait while we verify your email address.</p>
          </div>
        )}

        {/* Success */}
        {state === 'success' && (
          <div className="text-center space-y-5">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl font-extrabold text-ink-navy font-outfit">Email Verified!</h2>
              <p className="text-xs text-ink-muted font-light mt-2">Your email address has been verified. You can now sign in to your Rephonix account.</p>
            </div>
            <button
              onClick={() => onNavigate('/login')}
              className="w-full flex justify-center py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium"
            >
              Sign In Now
            </button>
          </div>
        )}

        {/* Expired */}
        {state === 'expired' && (
          <div className="space-y-4">
            <button onClick={() => onNavigate('/login')} className="flex items-center gap-1.5 text-xs text-cobalt hover:underline font-medium">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </button>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-amber-500" />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold text-ink-navy font-outfit">Link Expired</h2>
              <p className="text-xs text-ink-muted font-light mt-2">This verification link has expired. Links are valid for 24 hours. Request a new one below.</p>
            </div>
            <ResendForm />
          </div>
        )}

        {/* Invalid / used */}
        {state === 'invalid' && (
          <div className="space-y-4">
            <button onClick={() => onNavigate('/login')} className="flex items-center gap-1.5 text-xs text-cobalt hover:underline font-medium">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </button>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-8 h-8 text-red-500" />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold text-ink-navy font-outfit">Invalid Link</h2>
              <p className="text-xs text-ink-muted font-light mt-2">This verification link is invalid or has already been used. Request a new link below.</p>
            </div>
            <ResendForm />
          </div>
        )}

        {/* No token */}
        {state === 'no_token' && (
          <div className="space-y-4">
            <button onClick={() => onNavigate('/login')} className="flex items-center gap-1.5 text-xs text-cobalt hover:underline font-medium">
              <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
            </button>
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-cobalt/10 border border-cobalt/20 rounded-full flex items-center justify-center">
                  <MailCheck className="w-8 h-8 text-cobalt" />
                </div>
              </div>
              <h2 className="text-2xl font-extrabold text-ink-navy font-outfit">Verify Your Email</h2>
              <p className="text-xs text-ink-muted font-light mt-2">Didn't receive your verification email? Enter your address to resend it.</p>
            </div>
            <ResendForm />
          </div>
        )}

      </div>
    </div>
  );
}
