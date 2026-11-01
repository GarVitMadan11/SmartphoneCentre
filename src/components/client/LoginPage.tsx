import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertCircle, Loader2, Phone, CheckCircle2, RotateCw } from 'lucide-react';
import { customerLogin, syncFirebaseUser, ApiUser } from '../../utils/api';
import { loginWithGoogle, loginWithEmail, signupWithEmail, initRecaptchaVerifier, sendPhoneOtp, verifyPhoneOtpCode, clearRecaptchaVerifier, type ConfirmationResult } from '../../services/firebaseAuth';

interface LoginPageProps {
  onLoginSuccess: (user: ApiUser) => void;
  onNavigate: (path: string) => void;
  redirectParam?: string | null;
}

export default function LoginPage({ onLoginSuccess, onNavigate, redirectParam }: LoginPageProps) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Phone OTP States
  // Phone OTP feature flag - temporarily hidden
  const SHOW_PHONE_OTP = false;
  const [loginMethod, setLoginMethod] = useState<'phone' | 'password'>('password');
  const [phone, setPhone] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<'input' | 'verify'>('input');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Timer effect for resend cooldown
  React.useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // Clean up recaptcha on unmount
  React.useEffect(() => {
    return () => clearRecaptchaVerifier();
  }, []);

  const handleSendOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanDigits = phone.trim().replace(/\D/g, '');
    if (cleanDigits.length < 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setError('');
    setPhoneLoading(true);

    try {
      const verifier = initRecaptchaVerifier('recaptcha-login-container');
      if (!verifier) {
        throw new Error('Verification service not ready. Please refresh the page and try again.');
      }

      const confirmation = await sendPhoneOtp(cleanDigits, verifier);
      setConfirmationResult(confirmation);
      setPhoneStep('verify');
      setCountdown(30);
    } catch (err: any) {
      console.error('[Phone OTP Send Error]:', err);
      if (err.code === 'auth/invalid-phone-number') {
        setError('Invalid mobile number format. Please check and try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a few minutes before requesting another OTP.');
      } else if (err.code === 'auth/quota-exceeded') {
        setError('SMS quota temporarily reached. Please sign in with Google or Password.');
      } else if (err.message && err.message.includes('already been rendered')) {
        // Silently reset and retry with fresh verifier
        try {
          clearRecaptchaVerifier('recaptcha-login-container');
          const retryVerifier = initRecaptchaVerifier('recaptcha-login-container');
          if (retryVerifier) {
            const retryConf = await sendPhoneOtp(cleanDigits, retryVerifier);
            setConfirmationResult(retryConf);
            setPhoneStep('verify');
            setCountdown(30);
            return;
          }
        } catch (retryErr: any) {
          setError(retryErr.message || 'Verification service busy. Please try again.');
        }
      } else {
        setError(err.message || 'Failed to send OTP code. Please try again.');
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmationResult) {
      setError('Session expired. Please request a new verification code.');
      setPhoneStep('input');
      return;
    }
    const cleanOtp = phoneOtp.trim();
    if (cleanOtp.length < 6) {
      setError('Please enter the complete 6-digit verification code.');
      return;
    }

    setError('');
    setPhoneLoading(true);

    try {
      const { user: fbUser, token } = await verifyPhoneOtpCode(confirmationResult, cleanOtp);

      try {
        const synced = await syncFirebaseUser(token);
        if (synced && synced.user) {
          onLoginSuccess(synced.user);
          handleRedirect();
          return;
        }
      } catch (syncErr) {
        console.warn('[Phone OTP] Backend sync warning:', syncErr);
      }

      const fallbackUser: ApiUser = {
        id: fbUser.uid,
        name: fbUser.displayName || `User ${fbUser.phoneNumber || phone}`,
        email: fbUser.email || `${fbUser.uid}@phone.rephonix.in`,
        phone: fbUser.phoneNumber || `+91${phone.trim()}`,
        picture: fbUser.photoURL || null,
        emailVerified: true,
        hasGoogleLinked: false,
        hasPassword: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      onLoginSuccess(fallbackUser);
      handleRedirect();
    } catch (err: any) {
      console.error('[Phone OTP Verify Error]:', err);
      if (err.code === 'auth/invalid-verification-code') {
        setError('Incorrect verification code. Please check and try again.');
      } else if (err.code === 'auth/code-expired') {
        setError('Verification code has expired. Please request a new one.');
      } else {
        setError(err.message || 'OTP verification failed. Please try again.');
      }
    } finally {
      setPhoneLoading(false);
    }
  };

  const handleFirebaseGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    try {
      const { token, user: fbUser } = await loginWithGoogle();
      try {
        const synced = await syncFirebaseUser(token);
        if (synced && synced.user) {
          onLoginSuccess(synced.user);
          handleRedirect();
          return;
        }
      } catch (syncErr) {
        console.warn('[Firebase Google Auth] Backend sync warning, logging in with verified Firebase user:', syncErr);
      }

      if (fbUser) {
        const fallbackUser: ApiUser = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Google User',
          email: fbUser.email || '',
          phone: fbUser.phoneNumber || null,
          picture: fbUser.photoURL || null,
          emailVerified: Boolean(fbUser.emailVerified),
          hasGoogleLinked: true,
          hasPassword: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        onLoginSuccess(fallbackUser);
        handleRedirect();
      }
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user' || err.code === 'auth/cancelled-popup-request') {
        // User voluntarily dismissed popup
      } else {
        setError(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleRedirect = () => {
    if (redirectParam === 'booking') {
      onNavigate('/smartphones');
    } else {
      onNavigate('/');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await customerLogin(emailOrPhone.trim(), password);
      
      // If user logs in with email, ensure they exist in Firebase Auth so they appear in Firebase Console
      if (response.user.email) {
        try {
          await loginWithEmail(response.user.email, password);
        } catch (fbErr: any) {
          if (fbErr.code === 'auth/user-not-found' || fbErr.code === 'auth/invalid-credential') {
            await signupWithEmail(response.user.email, password, response.user.name).catch(() => {});
          }
        }
      }

      onLoginSuccess(response.user);
      handleRedirect();
    } catch (err: any) {
      setError(err.message || 'Invalid email/phone or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-canvas-card p-8 border border-ice-border rounded-sm shadow-premium backdrop-blur-sm relative">

        {/* Back Button */}
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-navy transition-colors font-sans"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Home</span>
        </button>

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-ice-soft text-cobalt mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-ink-navy tracking-tight">
            Welcome Back
          </h2>
          <p className="mt-1 text-xs text-ink-muted">
            Sign in to track orders, manage bookings, and view diagnostics
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/25 rounded-sm flex items-start gap-2 text-red-600 text-xs font-medium">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-500" />
            <div className="flex-1">{error}</div>
          </div>
        )}


        {/* Google Authentication */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleFirebaseGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-slate-300 hover:border-slate-400 hover:bg-slate-50 text-slate-800 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-xs active:scale-[0.99] disabled:opacity-50 cursor-pointer"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-cobalt" />
            ) : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>{googleLoading ? 'Connecting to Google...' : 'Continue with Google'}</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-ice-border/60" />
            <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase">{SHOW_PHONE_OTP ? 'or choose login method' : 'or sign in with password'}</span>
            <div className="flex-1 border-t border-ice-border/60" />
          </div>
        </div>

        {/* Login Method Tabs */}
        {SHOW_PHONE_OTP && (
        <div className="flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setLoginMethod('phone'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMethod === 'phone'
                ? 'bg-white text-ink-navy shadow-xs font-bold'
                : 'text-ink-muted hover:text-ink-navy'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Mobile OTP</span>
          </button>
          <button
            type="button"
            onClick={() => { setLoginMethod('password'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              loginMethod === 'password'
                ? 'bg-white text-ink-navy shadow-xs font-bold'
                : 'text-ink-muted hover:text-ink-navy'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Password</span>
          </button>
        </div>
        )}

        

        {/* ── Mode 1: Phone OTP Form ── */}
        {SHOW_PHONE_OTP && loginMethod === 'phone' && (
          <div className="space-y-4">
            {phoneStep === 'input' ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div>
                  <label htmlFor="loginPhone" className="text-[10px] font-medium tracking-normal text-ink-muted uppercase block mb-1.5">
                    10-Digit Mobile Number
                  </label>
                  <div className="relative flex rounded-xl border border-slate-300 overflow-hidden focus-within:border-cobalt focus-within:ring-1 focus-within:ring-cobalt/20 transition-all bg-canvas-pure">
                    <span className="px-3 py-2.5 bg-slate-50 text-xs font-bold text-slate-700 flex items-center border-r border-slate-200 select-none">
                      🇮🇳 +91
                    </span>
                    <input
                      id="loginPhone"
                      type="tel"
                      maxLength={10}
                      autoFocus
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      className="w-full px-3 py-2.5 text-xs text-ink-navy font-semibold placeholder:text-slate-400 focus:outline-none"
                      placeholder="Enter mobile number"
                    />
                  </div>
                  <p className="mt-1.5 text-[11px] text-slate-500 font-light">
                    We'll send an instant 6-digit OTP code to this mobile number.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={phoneLoading || phone.length < 10}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {phoneLoading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                  <span>{phoneLoading ? 'Sending OTP...' : 'Send Verification Code'}</span>
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl text-xs text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">Code sent via SMS</p>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Enter the 6-digit code dispatched to <strong>+91 {phone}</strong>.
                    </p>
                  </div>
                </div>

                <div>
                  <label htmlFor="loginOtp" className="text-[10px] font-medium tracking-normal text-ink-muted uppercase block mb-1.5">
                    6-Digit Verification Code
                  </label>
                  <input
                    id="loginOtp"
                    type="text"
                    maxLength={6}
                    autoFocus
                    required
                    value={phoneOtp}
                    onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, ''))}
                    className="w-full tracking-[0.75em] text-center font-bold px-3 py-3 bg-canvas-pure border border-slate-300 rounded-xl text-base text-ink-navy focus:outline-none focus:border-cobalt focus:ring-1 focus:ring-cobalt/20 transition-all"
                    placeholder="000000"
                  />
                </div>

                <button
                  type="submit"
                  disabled={phoneLoading || phoneOtp.length < 6}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  {phoneLoading && <Loader2 className="w-4 h-4 animate-spin text-white" />}
                  <span>{phoneLoading ? 'Verifying...' : 'Verify & Sign In'}</span>
                </button>

                <div className="flex items-center justify-between text-xs pt-2">
                  <button
                    type="button"
                    onClick={() => { setPhoneStep('input'); setPhoneOtp(''); setError(''); }}
                    className="text-slate-600 hover:text-slate-900 font-medium underline cursor-pointer"
                  >
                    Change Number
                  </button>

                  <button
                    type="button"
                    disabled={countdown > 0 || phoneLoading}
                    onClick={() => handleSendOtp()}
                    className="text-cobalt hover:underline font-semibold disabled:text-slate-400 disabled:no-underline flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCw className="w-3 h-3" />
                    <span>{countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── Mode 2: Password Form ── */}
        {(!SHOW_PHONE_OTP || loginMethod === 'password') && (
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4">

            {/* Email/Phone */}
            <div>
              <label htmlFor="emailOrPhone" className="text-[10px] font-medium tracking-normal text-ink-muted uppercase block mb-1.5">
                Email Address or Phone Number
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="emailOrPhone"
                  name="emailOrPhone"
                  type="text"
                  required
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                  placeholder="Enter email or mobile number"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="text-[10px] font-medium tracking-normal text-ink-muted uppercase block mb-1.5">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                  placeholder="Enter password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-ink-navy"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Links */}
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => onNavigate('/forgot-password')}
              className="text-ink-muted hover:text-cobalt font-light transition-colors"
            >
              Forgot password?
            </button>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isLoading ? 'Signing in...' : 'Sign In with Password'}
          </button>
        </form>
        )}

        {/* Container for Firebase reCAPTCHA */}
        <div id="recaptcha-login-container" />

        {/* reCAPTCHA Compliance Disclaimer */}
        <p className="text-[10px] text-center text-slate-400 leading-relaxed px-2">
          This site is protected by reCAPTCHA and the Google{' '}
          <a
            href="https://policies.google.com/privacy"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-slate-600 transition-colors"
          >
            Privacy Policy
          </a>{' '}
          and{' '}
          <a
            href="https://policies.google.com/terms"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-slate-600 transition-colors"
          >
            Terms of Service
          </a>{' '}
          apply.
        </p>

        {/* Signup Link */}
        <div className="text-center text-xs text-ink-muted font-light pt-4 border-t border-ice-border/40">
          New to Rephonix?{' '}
          <button
            onClick={() => onNavigate(`/signup${redirectParam ? `?redirect=${redirectParam}` : ''}`)}
            className="text-cobalt font-bold hover:underline"
          >
            Create Account
          </button>
        </div>

      </div>
    </div>
  );
}
