import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { customerLogin, googleAuth, fetchAuthConfig, ApiUser } from '../../utils/api';

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
  const [linkingRequired, setLinkingRequired] = useState(false);
  const [activeClientId, setActiveClientId] = useState<string>(STATIC_GOOGLE_CLIENT_ID);
  const googleBtnRef = useRef<HTMLDivElement>(null);

  const handleRedirect = () => {
    if (redirectParam === 'booking') {
      onNavigate('/smartphones');
    } else {
      onNavigate('/');
    }
  };

  // Fetch client ID from server if static environment variable is not present
  useEffect(() => {
    if (!activeClientId) {
      fetchAuthConfig().then(res => {
        if (res.googleClientId) {
          setActiveClientId(res.googleClientId);
        }
      });
    }
  }, [activeClientId]);

  // Load Google Identity Services script and render button
  useEffect(() => {
    if (!activeClientId) return;

    let isMounted = true;

    const renderGoogleButton = () => {
      if (!isMounted || !googleBtnRef.current || !window.google?.accounts?.id) return;
      try {
        window.google.accounts.id.initialize({
          client_id: activeClientId,
          callback: handleGoogleCredential,
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        const containerWidth = googleBtnRef.current.offsetWidth || 380;
        const validWidth = Math.min(Math.max(containerWidth, 250), 400);
        window.google.accounts.id.renderButton(googleBtnRef.current, {
          theme: 'outline',
          size: 'large',
          width: validWidth,
          text: 'signin_with',
          shape: 'rectangular',
        });
      } catch (err) {
        console.warn('Google renderButton warning:', err);
      }
    };

    if (window.google?.accounts?.id) {
      renderGoogleButton();
    } else {
      let script = document.querySelector('script[src="https://accounts.google.com/gsi/client"]') as HTMLScriptElement;
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', renderGoogleButton);

      // Polling fallback in case script is already loaded or in progress
      const interval = setInterval(() => {
        if (window.google?.accounts?.id) {
          clearInterval(interval);
          renderGoogleButton();
        }
      }, 250);

      return () => {
        isMounted = false;
        clearInterval(interval);
        script.removeEventListener('load', renderGoogleButton);
      };
    }
  }, [activeClientId]);

  const handleGoogleCredential = async (response: { credential: string }) => {
    setGoogleLoading(true);
    setError('');
    setLinkingRequired(false);
    try {
      const result = await googleAuth(response.credential);
      onLoginSuccess(result.user);
      handleRedirect();
    } catch (err: any) {
      if (err.status === 409) {
        setLinkingRequired(true);
        setError('An account with this email already exists. Please log in with your password, then link Google in your account settings.');
      } else {
        setError(err.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOrPhone.trim() || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setError('');
    setLinkingRequired(false);
    setIsLoading(true);

    try {
      const response = await customerLogin(emailOrPhone.trim(), password);
      onLoginSuccess(response.user);
      handleRedirect();
    } catch (err: any) {
      setError(err.message || 'Invalid email/phone or password.');
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
          <div className={`flex items-start gap-2 ${linkingRequired ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' : 'bg-red-500/10 border-red-500/20 text-red-500'} border p-3 rounded-sm text-xs font-medium`}>
            <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Google Sign-In */}
        {activeClientId && (
          <div className="space-y-3">
            <div className="relative" style={{ minHeight: '44px' }}>
              {googleLoading ? (
                <div className="flex items-center justify-center gap-2 w-full h-11 border border-ice-border rounded-sm text-xs text-ink-muted bg-canvas-pure">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Signing in with Google...</span>
                </div>
              ) : (
                <div
                  ref={googleBtnRef}
                  id="google-signin-btn"
                  className="w-full overflow-hidden"
                />
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-ice-border/40" />
              <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase">or</span>
              <div className="flex-1 border-t border-ice-border/40" />
            </div>
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
