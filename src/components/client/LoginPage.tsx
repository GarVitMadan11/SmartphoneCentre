import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { customerLogin, ApiUser } from '../../utils/api';
import { loginWithEmail, signupWithEmail } from '../../services/firebaseAuth';

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
          className="flex items-center gap-1.5 text-xs text-ink-muted hover:text-ink-navy transition-colors font-mono"
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
          <div className="p-3 bg-crimson/10 border border-crimson/20 rounded-sm flex items-start gap-2 text-crimson text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1">{error}</div>
          </div>
        )}


        {/* Email/Password Form */}
        <form className="space-y-5" onSubmit={handleSubmit}>
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
            className="w-full flex justify-center items-center gap-2 py-2.5 px-4 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {isLoading ? 'Signing in...' : 'Login'}
          </button>
        </form>

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
