import React, { useState } from 'react';
import { Eye, EyeOff, Lock, Mail, ArrowLeft, AlertCircle, Loader2 } from 'lucide-react';
import { customerLogin, syncFirebaseUser, ApiUser } from '../../utils/api';
import { loginWithGoogle, loginWithEmail, signupWithEmail } from '../../services/firebaseAuth';

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

  const handleRedirect = () => {
    if (redirectParam === 'booking') {
      onNavigate('/smartphones');
    } else {
      onNavigate('/');
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

        {/* Google Authentication */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleFirebaseGoogleLogin}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 bg-canvas-pure border border-ice-border hover:border-cobalt hover:bg-slate-50 text-ink-navy rounded-sm text-xs font-semibold transition-all shadow-sm disabled:opacity-50"
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
            <div className="flex-1 border-t border-ice-border/40" />
            <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase">or</span>
            <div className="flex-1 border-t border-ice-border/40" />
          </div>
        </div>

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
