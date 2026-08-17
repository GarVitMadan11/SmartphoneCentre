import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertCircle, ShieldCheck } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { customerLogin, requestPasswordResetOtp, resetPassword } from '../../utils/api';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  onNavigate: (path: string) => void;
  redirectParam?: string | null;
}

export default function LoginPage({ onLoginSuccess, onNavigate, redirectParam }: LoginPageProps) {
  const [stage, setStage] = useState<'login' | 'forgot_request' | 'forgot_reset'>('login');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password state
  const [resetEmail, setResetEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [resetSuccess, setResetSuccess] = useState('');

  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setResetSuccess('');
    setIsLoading(true);

    try {
      const response = await customerLogin(emailOrPhone.trim(), password);
      onLoginSuccess(response.user);
      if (redirectParam === 'booking') {
        onNavigate('/smartphones'); // App will handle redirecting back to stage 'schedule'
      } else {
        onNavigate('/');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email/phone or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setError('');
    setResetSuccess('');
    setIsLoading(true);

    try {
      const response = await requestPasswordResetOtp(resetEmail.trim());
      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      if (!serviceId || !templateId || !publicKey) {
        throw new Error('EmailJS environment variables are not configured in the browser.');
      }

      const templateParams = {
        email: resetEmail.trim(),
        passcode: response.otp,
        time: '10 minutes',
      };

      try {
        await emailjs.send(serviceId, templateId, templateParams, publicKey);
      } catch (mailErr: any) {
        console.error('EmailJS forgot password send failed:', mailErr);
        throw new Error('Unable to send verification code. Please try again.');
      }

      setResetSuccess('Verification code sent successfully to your email.');
      setStage('forgot_reset');
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetOtp.trim() || !newPassword || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError('');
    setResetSuccess('');
    setIsLoading(true);

    try {
      await resetPassword(resetEmail.trim(), resetOtp.trim(), newPassword);
      setResetSuccess('Password reset successfully! Please login with your new password.');
      setStage('login');
      // Clear reset state
      setResetEmail('');
      setResetOtp('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-canvas-pure border border-ice-border rounded-xl p-8 shadow-3d-card text-left">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.svg" className="w-12 h-12 object-contain" alt="Rephonix Logo" />
          </div>
          <h2 className="text-3xl font-extrabold text-ink-navy tracking-tight font-outfit">
            {stage === 'login' && 'Welcome Back'}
            {stage === 'forgot_request' && 'Reset Password'}
            {stage === 'forgot_reset' && 'Enter Reset Code'}
          </h2>
          <p className="mt-2 text-xs text-ink-muted font-light">
            {stage === 'login' && 'Sign in to manage your bookings and submit resale orders.'}
            {stage === 'forgot_request' && 'Enter your registered email address to receive a secure verification code.'}
            {stage === 'forgot_reset' && `We sent a 6-digit verification code to ${resetEmail}.`}
          </p>
        </div>

        {/* Back navigation / Back to login */}
        {stage === 'login' ? (
          <button
            onClick={() => onNavigate('/')}
            className="flex items-center gap-1.5 text-xs text-cobalt hover:underline font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </button>
        ) : (
          <button
            onClick={() => {
              setStage('login');
              setError('');
              setResetSuccess('');
            }}
            className="flex items-center gap-1.5 text-xs text-cobalt hover:underline font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </button>
        )}

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-sm text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {resetSuccess && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-3 rounded-sm text-xs font-medium">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-500" />
            <span>{resetSuccess}</span>
          </div>
        )}

        {/* Login Stage */}
        {stage === 'login' && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              
              {/* Email/Phone */}
              <div>
                <label htmlFor="emailOrPhone" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
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
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-ink-muted hover:text-ink-navy"
                    aria-label={showPassword ? "Hide password" : "Show password"}
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
                onClick={() => {
                  setStage('forgot_request');
                  setError('');
                  setResetSuccess('');
                }}
                className="text-ink-muted hover:text-cobalt font-light transition-colors"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Signing in...' : 'Login'}
              </button>
            </div>
          </form>
        )}

        {/* Forgot Request Stage */}
        {stage === 'forgot_request' && (
          <form className="mt-8 space-y-6" onSubmit={handleRequestResetOtp}>
            <div className="space-y-4">
              <div>
                <label htmlFor="resetEmail" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    id="resetEmail"
                    name="resetEmail"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                    placeholder="Enter your email address"
                  />
                </div>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Sending code...' : 'Send Reset Code'}
              </button>
            </div>
          </form>
        )}

        {/* Forgot Reset Stage */}
        {stage === 'forgot_reset' && (
          <form className="mt-8 space-y-6" onSubmit={handleResetPassword}>
            <div className="space-y-4">
              
              {/* Code */}
              <div>
                <label htmlFor="resetOtp" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                  6-Digit Verification Code
                </label>
                <input
                  id="resetOtp"
                  name="resetOtp"
                  type="text"
                  required
                  maxLength={6}
                  value={resetOtp}
                  onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-center font-mono text-sm tracking-widest text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                  placeholder="000000"
                />
              </div>

              {/* New Password */}
              <div>
                <label htmlFor="newPassword" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                  New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                    placeholder="Enter new password (min. 6 chars)"
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
                  Confirm New Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                    <Lock className="w-4 h-4" />
                  </span>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full pl-9 pr-10 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>

            </div>

            {/* Cooldown/Resend */}
            <div className="flex justify-end text-xs font-mono">
              {cooldown > 0 ? (
                <span className="text-ink-muted font-light">
                  Resend code in <strong className="font-semibold text-cobalt">{cooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestResetOtp}
                  disabled={isLoading}
                  className="text-cobalt font-bold hover:underline"
                >
                  Resend Code
                </button>
              )}
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}

        {/* Signup Link */}
        {stage === 'login' && (
          <div className="text-center text-xs text-ink-muted font-light pt-4 border-t border-ice-border/40">
            New to Rephonix?{' '}
            <button
              onClick={() => onNavigate(`/signup${redirectParam ? `?redirect=${redirectParam}` : ''}`)}
              className="text-cobalt font-bold hover:underline"
            >
              Create Account
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
