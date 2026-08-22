import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertCircle, Phone, User, Loader2 } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { customerSignup, verifyOtp, ApiUser } from '../../utils/api';
import { signupWithEmail, loginWithEmail } from '../../services/firebaseAuth';

interface SignupPageProps {
  onSignupSuccess: (user: ApiUser) => void;
  onNavigate: (path: string) => void;
  redirectParam?: string | null;
}

type SignupMode = 'form' | 'otp';

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
  const [mode, setMode] = useState<SignupMode>('form');
  const [otp, setOtp] = useState('');

  const handleRedirect = () => {
    if (redirectParam === 'booking') {
      onNavigate('/smartphones');
    } else {
      onNavigate('/');
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
        if (response.otp) {
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
        }

        setMode('otp');
      }
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
      // 1. Verify OTP and create user in PostgreSQL
      const response = await verifyOtp({ name: name.trim(), email: email.trim(), phone: phone.trim(), password, otp: otp.trim() });
      
      // 2. Create the user in Firebase Auth so they appear in Firebase Console -> Users
      try {
        await signupWithEmail(email.trim(), password, name.trim());
      } catch (fbErr: any) {
        if (fbErr.code === 'auth/email-already-in-use') {
          await loginWithEmail(email.trim(), password).catch(() => {});
        }
      }

      onSignupSuccess(response.user);
      handleRedirect();
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-canvas-pure border border-ice-border rounded-xl p-8 shadow-3d-card text-left">

        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.svg" className="w-12 h-12 object-contain" alt="Rephonix Logo" />
          </div>
          <h2 className="text-3xl font-extrabold text-ink-navy tracking-tight font-outfit">
            {mode === 'otp' ? 'Verify Your Email' : 'Create Account'}
          </h2>
          <p className="mt-2 text-xs text-ink-muted font-light">
            {mode === 'otp'
              ? `We've sent a 6-digit verification code to your Gmail / Email (${email}).`
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
            <div className="p-3 bg-blue-50/80 border border-blue-200/60 rounded-sm text-xs text-blue-900 flex items-start gap-2.5">
              <Mail className="w-4 h-4 text-cobalt flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-ink-navy">Check your Gmail / Email</p>
                <p className="text-[11px] text-ink-muted mt-0.5">
                  The verification code was dispatched to <strong>{email}</strong> (no SMS sent).
                </p>
              </div>
            </div>

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

            {/* Signup Form */}
            <form className="space-y-4" onSubmit={handlePhoneSubmit}>
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
                  <label htmlFor="email" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">Gmail / Email Address</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted"><Mail className="w-4 h-4" /></span>
                    <input id="email" name="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                      placeholder="Enter your Gmail / Email" />
                  </div>
                </div>

                {/* Mobile (optional) */}
                <div>
                  <label htmlFor="phone" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                    Mobile Number <span className="text-ink-muted/60 normal-case">(for pickup logistics)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted"><Phone className="w-4 h-4" /></span>
                    <input id="phone" name="phone" type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                      placeholder="10-digit mobile number" />
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
                  {isLoading ? 'Sending OTP to Email...' : 'Send Verification OTP to Email'}
                </button>
                <p className="text-center text-[10px] text-ink-muted mt-2">A 6-digit OTP will be sent directly to your Gmail / Email (no SMS).</p>
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
