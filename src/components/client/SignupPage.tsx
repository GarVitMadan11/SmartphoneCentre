import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertCircle, Phone, User, CheckCircle2 } from 'lucide-react';
import { customerSignup, verifyOtp } from '../../utils/api';

interface SignupPageProps {
  onSignupSuccess: (user: any) => void;
  onNavigate: (path: string) => void;
  redirectParam?: string | null;
}

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

  // OTP Verification states
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [testOtpHelper, setTestOtpHelper] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !phone.trim() || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!termsAccepted) {
      setError('You must accept the Terms and Conditions.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await customerSignup(
        name.trim(),
        email.trim(),
        phone.trim(),
        password
      );
      if (response.status === 'otp_sent') {
        setIsOtpSent(true);
        if (response.testOtp) {
          setTestOtpHelper(response.testOtp);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Registration failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 6-digit verification code.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await verifyOtp({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        password,
        otp: otp.trim(),
      });
      onSignupSuccess(response.user);
      if (redirectParam === 'booking') {
        onNavigate('/smartphones'); // App will handle redirecting back to stage 'schedule'
      } else {
        onNavigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check the code.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-canvas-pure border border-ice-border rounded-xl p-8 shadow-3d-card text-left">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.svg" className="w-12 h-12 object-contain" alt="Rephonix Logo" />
          </div>
          <h2 className="text-3xl font-extrabold text-ink-navy tracking-tight font-outfit">
            {isOtpSent ? 'Verify Mobile' : 'Create Account'}
          </h2>
          <p className="mt-2 text-xs text-ink-muted font-light">
            {isOtpSent 
              ? `We've sent a 6-digit verification code to ${phone}`
              : 'Register to unlock instant quotes and door-step device verification.'}
          </p>
        </div>

        {/* Back navigation */}
        <button
          onClick={() => {
            if (isOtpSent) {
              setIsOtpSent(false);
              setError('');
            } else {
              onNavigate('/');
            }
          }}
          className="flex items-center gap-1.5 text-xs text-cobalt hover:underline font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {isOtpSent ? 'Back to Signup Details' : 'Back to Home'}
        </button>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-sm text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Dev OTP Helper Notice */}
        {isOtpSent && testOtpHelper && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-3 rounded-sm text-xs font-medium animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-500" />
            <span>[Test Mode] Verification code: <strong className="font-mono text-sm">{testOtpHelper}</strong></span>
          </div>
        )}

        {isOtpSent ? (
          /* OTP Verification Form */
          <form className="mt-6 space-y-6" onSubmit={handleVerifyOtp}>
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
              className="w-full flex justify-center py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed animate-in fade-in"
            >
              {isLoading ? 'Verifying OTP...' : 'Verify & Create Account'}
            </button>
          </form>
        ) : (
          /* Signup Registration Form */
          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label htmlFor="name" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                  Full Name
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                    <User className="w-4 h-4" />
                  </span>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                    placeholder="Enter full name"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              {/* Mobile Number */}
              <div>
                <label htmlFor="phone" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                    placeholder="Enter 10-digit mobile number"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
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
                    placeholder="At least 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-ink-navy"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="confirmPassword" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                  Confirm Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                    placeholder="Repeat password"
                  />
                </div>
              </div>

              {/* Terms and Conditions Checkbox */}
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="h-4 w-4 text-cobalt focus:ring-cobalt/30 border-ice-border rounded"
                  />
                </div>
                <div className="ml-3 text-xs text-left">
                  <label htmlFor="terms" className="font-light text-ink-muted">
                    I agree to the{' '}
                    <span className="text-cobalt hover:underline cursor-pointer font-medium" onClick={() => alert('Terms of Service: By booking on Rephonix, you confirm device ownership and verify all information entered is accurate.')}>
                      Terms &amp; Conditions
                    </span>{' '}
                    and Privacy Policy.
                  </label>
                </div>
              </div>

            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending verification...' : 'Create Account'}
              </button>
            </div>
          </form>
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
