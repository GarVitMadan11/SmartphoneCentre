import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { customerLogin } from '../../utils/api';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
  onNavigate: (path: string) => void;
  redirectParam?: string | null;
}

export default function LoginPage({ onLoginSuccess, onNavigate, redirectParam }: LoginPageProps) {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  return (
    <div className="min-h-[70vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-canvas-pure border border-ice-border rounded-xl p-8 shadow-3d-card text-left">
        
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img src="/logo.svg" className="w-12 h-12 object-contain" alt="Rephonix Logo" />
          </div>
          <h2 className="text-3xl font-extrabold text-ink-navy tracking-tight font-outfit">
            Welcome Back
          </h2>
          <p className="mt-2 text-xs text-ink-muted font-light">
            Sign in to manage your bookings and submit resale orders.
          </p>
        </div>

        {/* Back navigation */}
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1.5 text-xs text-cobalt hover:underline font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>

        {/* Error Alert */}
        {error && (
          <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-sm text-xs font-medium">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
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
              onClick={() => alert('Password reset functionality is under maintenance. Please contact support.')}
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
