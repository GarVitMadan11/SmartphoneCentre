import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertCircle, Phone, User, CheckCircle2, Loader2, RefreshCw } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { customerSignup, verifyOtp, registerWithEmail, googleAuth, fetchAuthConfig, resendVerification, ApiUser } from '../../utils/api';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement, config: any) => void;
          prompt?: () => void;
        };
      };
    };
  }
}

const STATIC_GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || (import.meta.env as any).GOOGLE_CLIENT_ID || '') as string;

interface SignupPageProps {
  onSignupSuccess: (user: ApiUser) => void;
  onNavigate: (path: string) => void;
  redirectParam?: string | null;
}

type SignupMode = 'form' | 'otp' | 'email_sent';

export default function SignupPage({ onSignupSuccess, onNavigate, redirectParam }: SignupPageProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [mode, setMode] = useState<SignupMode>('form');
  const [otp, setOtp] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [emailForVerification, setEmailForVerification] = useState('');
  const [activeClientId, setActiveClientId] = useState<string>(STATIC_GOOGLE_CLIENT_ID);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleRedirect = () => {
    if (redirectParam === 'booking') {
      onNavigate('/smartphones');
    } else {
      onNavigate('/');
    }
  };

  useEffect(() => {
    if (!activeClientId) {
      fetchAuthConfig().then(res => {
        if (res.googleClientId) {
          setActiveClientId(res.googleClientId);
        }
      });
    }
  }, [activeClientId]);

  useEffect(() => {
    if (!activeClientId || mode !== 'form') return;

    let isMounted = true;

    const renderGoogleButton = () => {
      if (!isMounted || !googleBtnRef.current || !window.google?.accounts?.id) return;
      try {
        googleBtnRef.current.innerHTML = '';
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: handleGoogleCredential,
          auto_select: false,
        });
        const containerWidth = googleBtnRef.current.offsetWidth || 380;
        const validWidth = Math.min(Math.max(containerWidth, 250), 400);
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: validWidth,
          text: 'signup_with',
          shape: 'rectangular',
        });
      } catch (err) {
        console.warn('Google renderButton warning:', err);
      }
    };

    const attemptRender = () => {
      setTimeout(() => {
        if (isMounted) renderGoogleButton();
      }, 50);
    };

    if (window.google?.accounts?.id) {
      attemptRender();
    } else {
      let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', attemptRender);

      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          attemptRender();
        }
      }, 250);

      return () => {
        isMounted = false;
        clearInterval(interval);
        script.removeEventListener('load', attemptRender);
      };
    }
  }, [activeClientId, mode]);

  const handleGoogleCredential = async (response: { credential: string }) => {
    setGoogleLoading(true);
    setError('');
    try {
      const result = await googleAuth(response.credential);
      onSignupSuccess(result.user);
      handleRedirect();
    } catch (err: any) {
      if (err.status === 409) {
        setError('An account with this email already exists. Please log in instead.');
      } else {
        setError(err.message || 'Google sign-up failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  // Phone OTP registration flow (existing users / phone-preferred)
  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.'); return;
    }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!termsAccepted) { setError('You must accept the Terms and Conditions.'); return; }

    setError('');
    setIsLoading(true);
    try {
      const response = await customerSignup(name.trim(), email.trim(), phone.trim(), password);
      if (response.status === 'otp_sent') {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
          throw new Error('EmailJS environment variables are not configured in the browser.');
        }

        const templateParams = {
          email: email.trim(),
          passcode: response.otp,
          time: '10 minutes',
        };

        try {
          await emailjs.send(serviceId, templateId, templateParams, publicKey);
        } catch (mailErr: any) {
          console.error('EmailJS signup send failed:', mailErr);
          throw new Error('Unable to send verification code. Please try again.');
        }

        setMode('otp');
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  // Email-only registration (no phone required)
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.'); return;
    }
    if (password !== confirmPassword) { setError('Passwords do not match.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    if (!termsAccepted) { setError('You must accept the Terms and Conditions.'); return; }

    setError('');
    setIsLoading(true);
    try {
      await registerWithEmail(name.trim(), email.trim(), password);
      setEmailForVerification(email.trim().toLowerCase());
      setMode('email_sent');
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) { setError('Please enter the 6-digit verification code.'); return; }
    setError('');
    setIsLoading(true);
    try {
      const response = await verifyOtp({ name: name.trim(), email: email.trim(), phone: phone.trim(), password, otp: otp.trim() });
      onSignupSuccess(response.user);
      handleRedirect();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setResendLoading(true);
    setResendSuccess('');
    try {
      await resendVerification(emailForVerification || email.trim().toLowerCase());
      setResendSuccess('Verification email resent. Please check your inbox.');
    } catch {
      setResendSuccess('Verification email resent. Please check your inbox.');
    } finally {
      setResendLoading(false);
    }
  };

  // "Check your email" state
  if (mode === 'email_sent') {
    return (
      <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-6 bg-canvas-pure border border-ice-border rounded-xl p-8 shadow-3d-card text-left">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
            </div>
            <h2 className="text-2xl font-extrabold text-ink-navy tracking-tight font-outfit">Check Your Email</h2>
            <p className="mt-3 text-sm text-ink-muted font-light leading-relaxed">
              We've sent a verification link to<br />
              <strong className="text-ink-navy">{emailForVerification}</strong>
            </p>
          </div>
          <div className="bg-cobalt/5 border border-cobalt/15 rounded-sm p-4 text-xs text-ink-muted space-y-1">
            <p>1. Open the email from <strong>Rephonix</strong></p>
            <p>2. Click the <strong>Verify Email Address</strong> button</p>
            <p>3. Come back and sign in</p>
          </div>
          {resendSuccess && (
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-3 rounded-sm text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{resendSuccess}</span>
            </div>
          )}
          <div className="space-y-3">
            <button
              onClick={() => onNavigate(`/login${redirectParam ? `?redirect=${redirectParam}` : ''}`)}
              className="w-full flex justify-center py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium"
            >
              Go to Login
            </button>
            <button
              onClick={handleResendVerification}
              disabled={resendLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 border border-ice-border text-ink-muted hover:text-ink-navy hover:border-cobalt/40 rounded-sm font-medium text-xs transition-all disabled:opacity-50"
            >
              {resendLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Resend Verification Email
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-canvas-pure border border-ice-border rounded-xl p-8 shadow-3d-card text-left">

        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.svg" className="w-12 h-12 object-contain" alt="Rephonix Logo" />
          </div>
          <h2 className="text-3xl font-extrabold text-ink-navy tracking-tight font-outfit">
            {mode === 'otp' ? 'Verify Mobile' : 'Create Account'}
          </h2>
          <p className="mt-2 text-xs text-ink-muted font-light">
            {mode === 'otp'
              ? `We've sent a 6-digit code to ${phone}`
              : 'Register to unlock instant quotes and doorstep device verification.'}
          </p>
        </div>

        {/* Back navigation */}
        <button
          onClick={() => {
            if (mode === 'otp') { setMode('form'); setError(''); }
            else onNavigate('/');
          }}
          className="flex items-center gap-1.5 text-xs text-cobalt hover:underline font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          {mode === 'otp' ? 'Back to Signup Details' : 'Back to Home'}
        </button>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-sm text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}



        {/* OTP Form */}
        {mode === 'otp' ? (
          <form className="space-y-5" onSubmit={handleVerifyOtp}>
            <div>
              <label htmlFor="otp" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                Verification Code (6 Digits)
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full tracking-[1em] text-center font-bold pl-3 py-3 bg-canvas-pure border border-ice-border rounded-sm text-sm text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                placeholder="000000"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isLoading ? 'Verifying...' : 'Verify & Create Account'}
            </button>
          </form>
        ) : (
          <>
            {/* Google Sign-Up */}
            {activeClientId && (
              <div className="space-y-3">
                <div className="relative" style={{ minHeight: '44px' }}>
                  {googleLoading ? (
                    <div className="flex items-center justify-center gap-2 w-full h-11 border border-ice-border rounded-sm text-xs text-ink-muted bg-canvas-pure">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Signing up with Google...</span>
                    </div>
                  ) : (
                    <div ref={googleBtnRef} id="google-signup-btn" className="w-full overflow-hidden flex justify-center min-h-[40px]" />
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 border-t border-ice-border/40" />
                  <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase">or sign up with email</span>
                  <div className="flex-1 border-t border-ice-border/40" />
                </div>
              </div>
            )}

            {/* Signup Form */}
            <form className="space-y-4" onSubmit={phone.trim() ? handlePhoneSubmit : handleEmailSubmit}>
              <div className="space-y-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="name" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">Full Name</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted"><User className="w-4 h-4" /></span>
                    <input id="name" name="name" type="text" required value={name} onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                      placeholder="Enter full name" />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted"><Mail className="w-4 h-4" /></span>
                    <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                      placeholder="Enter email address" />
                  </div>
                </div>

                {/* Mobile (optional) */}
                <div>
                  <label htmlFor="phone" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                    Mobile Number <span className="text-ink-muted/60 normal-case">(optional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted"><Phone className="w-4 h-4" /></span>
                    <input id="phone" name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                      placeholder="10-digit mobile (optional)" />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted"><Lock className="w-4 h-4" /></span>
                    <input id="password" name="password" type={showPassword ? 'text' : 'password'} required value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-10 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                      placeholder="At least 8 characters" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-ink-navy">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted"><Lock className="w-4 h-4" /></span>
                    <input id="confirmPassword" name="confirmPassword" type="password" required value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                      placeholder="Repeat password" />
                  </div>
                </div>

                {/* Terms */}
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input id="terms" name="terms" type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="h-4 w-4 text-cobalt focus:ring-cobalt/30 border-ice-border rounded" />
                  </div>
                  <div className="ml-3 text-xs text-left">
                    <label htmlFor="terms" className="font-light text-ink-muted">
                      I agree to the{' '}
                      <span className="text-cobalt hover:underline cursor-pointer font-medium"
                        onClick={() => alert('Terms of Service: By booking on Rephonix, you confirm device ownership and verify all information entered is accurate.')}>
                        Terms &amp; Conditions
                      </span>{' '}
                      and Privacy Policy.
                    </label>
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <button type="submit" disabled={isLoading}
                  className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed">
                  {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {isLoading ? 'Creating account...' : phone.trim() ? 'Continue with Phone Verification' : 'Create Account'}
                </button>
                {!phone.trim() && (
                  <p className="text-center text-[10px] text-ink-muted mt-2">A verification email will be sent to you</p>
                )}
              </div>
            </form>
          </>
        )}

        {/* Login Link */}
        <div className="text-center text-xs text-ink-muted font-light pt-4 border-t border-ice-border/40">
          Already have an account?{' '}
          <button
            onClick={() => onNavigate(`/login${redirectParam ? `?redirect=${redirectParam}` : ''}`)}
            className="text-cobalt font-bold hover:underline"
          >
            Login
          </button>
        </div>

      </div>
    </div>
  );
}
