import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, ShieldCheck, Loader2 } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { requestPasswordResetOtp, resetPasswordWithOtp } from '../../utils/api';

interface ForgotPasswordPageProps {
  onNavigate: (path: string) => void;
}

export default function ForgotPasswordPage({ onNavigate }: ForgotPasswordPageProps) {
  const [stage, setStage] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  React.useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleRequestResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await requestPasswordResetOtp(cleanEmail);
      if (response.otp) {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
          throw new Error('EmailJS environment variables are not configured in the browser.');
        }

        const templateParams = {
          email: cleanEmail,
          passcode: response.otp,
          time: '10 minutes',
        };

        try {
          await emailjs.send(serviceId, templateId, templateParams, publicKey);
        } catch (mailErr: any) {
          console.error('EmailJS forgot password send failed:', mailErr);
          throw new Error('Unable to send verification code. Please try again.');
        }
      }

      setSuccess('Verification code sent successfully to your email.');
      setStage('reset');
      setCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to request password reset code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim() || !newPassword || !confirmPassword) {
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
    setSuccess('');
    setIsLoading(true);

    try {
      await resetPasswordWithOtp(email.trim(), otp.trim(), newPassword);
      setSuccess('Password reset successfully! Redirecting to login...');
      // Clear reset state
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      // Delay redirection to login so the user can read the success message
      setTimeout(() => {
        onNavigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 bg-canvas-pure border border-ice-border rounded-xl p-8 shadow-3d-card text-left">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.svg" className="w-12 h-12 object-contain" alt="Rephonix Logo" />
          </div>
          <h2 className="text-2xl font-extrabold text-ink-navy tracking-tight font-outfit">
            {stage === 'request' ? 'Forgot Password?' : 'Enter Reset Code'}
          </h2>
          <p className="mt-2 text-xs text-ink-muted font-light">
            {stage === 'request'
              ? "Enter your email address and we'll send you a secure verification code."
              : `We sent a 6-digit verification code to ${email}.`}
          </p>
        </div>

        {/* Back navigation */}
        <button
          onClick={() => {
            if (stage === 'reset') {
              setStage('request');
              setError('');
              setSuccess('');
            } else {
              onNavigate('/login');
            }
          }}
          className="flex items-center gap-1.5 text-xs text-cobalt hover:underline font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>

        {/* Error Alert */}
        {error && (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-sm text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="flex items-start gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-3 rounded-sm text-xs font-medium">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-500" />
            <span>{success}</span>
          </div>
        )}

        {/* Stage 1: Request Code */}
        {stage === 'request' && (
          <form className="space-y-5" onSubmit={handleRequestResetOtp}>
            <div>
              <label htmlFor="reset-email" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted font-light">
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
              {isLoading ? 'Sending...' : 'Send Reset Code'}
            </button>
          </form>
        )}

        {/* Stage 2: Verify OTP & Enter New Password */}
        {stage === 'reset' && (
          <form className="space-y-5" onSubmit={handleResetPassword}>
            
            {/* Verification Code */}
            <div>
              <label htmlFor="reset-otp" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                6-Digit Verification Code
              </label>
              <input
                id="reset-otp"
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-center font-mono text-sm tracking-widest text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                placeholder="000000"
              />
            </div>

            {/* New Password */}
            <div>
              <label htmlFor="new-password" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted font-light">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="new-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
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

            {/* Confirm New Password */}
            <div>
              <label htmlFor="confirm-password" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                Confirm New Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted font-light">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                  placeholder="Repeat new password"
                />
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isLoading ? 'Resetting...' : 'Reset Password'}
            </button>
          </form>
        )}

      </div>
    </div>
  );
}
