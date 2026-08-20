import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, Calendar, ArrowLeft, LogOut, ShieldCheck, AlertCircle } from 'lucide-react';
import emailjs from '@emailjs/browser';
import { updateCustomerProfile, sendEmailOtp, verifyEmailOtp } from '../../utils/api';

interface ProfilePageProps {
  user: any;
  onLogout: () => void;
  onUpdateUser: (updatedUser: any) => void;
  onNavigate: (path: string) => void;
}

export default function ProfilePage({ user, onLogout, onUpdateUser, onNavigate }: ProfilePageProps) {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Email verification state
  const [isVerifyingEmail, setIsVerifyingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState(user?.email || '');
  const [emailOtp, setEmailOtp] = useState('');
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [verificationSuccess, setVerificationSuccess] = useState('');

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSendEmailOtp = async () => {
    if (!newEmail.trim()) {
      setVerificationError('Email address is required.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail.trim().toLowerCase())) {
      setVerificationError('Invalid email format.');
      return;
    }

    setVerificationError('');
    setVerificationSuccess('');
    setVerificationLoading(true);

    try {
      // 1. Get OTP from backend
      const response = await sendEmailOtp(newEmail.trim());
      
      // 2. Send email via EmailJS browser SDK (fallback if OTP is returned)
      if (response.otp) {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
          throw new Error('EmailJS environment variables are not configured in the browser.');
        }

        const templateParams = {
          email: newEmail.trim(),
          passcode: response.otp,
          time: '10 minutes',
        };

        try {
          await emailjs.send(serviceId, templateId, templateParams, publicKey);
        } catch (mailErr: any) {
          console.error('EmailJS profile send failed:', mailErr);
          throw new Error('Unable to send verification code. Please try again.');
        }
      }

      setVerificationSuccess('Verification code sent successfully to your email.');
      setEmailOtpSent(true);
      setCooldown(60);
    } catch (err: any) {
      setVerificationError(err.message || 'Failed to send verification code.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailOtp.trim()) {
      setVerificationError('Please enter the 6-digit verification code.');
      return;
    }

    setVerificationError('');
    setVerificationSuccess('');
    setVerificationLoading(true);

    try {
      const response = await verifyEmailOtp(newEmail.trim(), emailOtp.trim());
      onUpdateUser(response.user);
      setVerificationSuccess('Email address verified successfully!');
      setEmailOtp('');
      setEmailOtpSent(false);
      setIsVerifyingEmail(false);
      setSuccess('Email address verified successfully.');
    } catch (err: any) {
      setVerificationError(err.message || 'Failed to verify code.');
    } finally {
      setVerificationLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      setError('Name and phone number cannot be empty.');
      return;
    }

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await updateCustomerProfile(name.trim(), phone.trim());
      onUpdateUser(response.user);
      setSuccess('Profile updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 text-left">
      
      {/* Header Back button */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1.5 text-xs text-cobalt hover:underline font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors font-medium border border-red-500/20 px-3 py-1.5 rounded-sm hover:bg-red-500/5"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Summary Card */}
        <div className="md:col-span-5 bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-3d-card space-y-6">
          <div className="text-center pb-4 border-b border-ice-border/40">
            <div className="w-16 h-16 bg-cobalt/10 text-cobalt border border-cobalt/20 rounded-full flex items-center justify-center mx-auto text-xl font-bold font-outfit mb-3">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <h3 className="text-lg font-bold text-ink-navy font-outfit">{user?.name}</h3>
            <span className="text-[10px] font-mono tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold uppercase">
              Customer Account
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Email */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-sm bg-ice-gray/40 border border-ice-border/30 flex items-center justify-center text-ink-muted flex-shrink-0">
                  <Mail className="w-4 h-4" />
                </span>
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block">Email Address</span>
                  <span className="text-ink-navy font-medium break-all">{user?.email}</span>
                </div>
              </div>
              <div className="flex-shrink-0">
                {user?.emailVerified ? (
                  <span className="text-[9px] font-semibold tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-sm uppercase">
                    Verified
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      setIsVerifyingEmail(true);
                      setNewEmail(user?.email || '');
                      setEmailOtp('');
                      setEmailOtpSent(false);
                      setVerificationError('');
                      setVerificationSuccess('');
                    }}
                    className="text-[9px] font-bold tracking-wider bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/20 px-2 py-0.5 rounded-sm uppercase transition-colors"
                  >
                    Verify Now
                  </button>
                )}
              </div>
            </div>

            {/* Mobile */}
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-sm bg-ice-gray/40 border border-ice-border/30 flex items-center justify-center text-ink-muted flex-shrink-0">
                <Phone className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block">Mobile Number</span>
                <span className="text-ink-navy font-medium">+91 {user?.phone}</span>
              </div>
            </div>

            {/* Member Since */}
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-sm bg-ice-gray/40 border border-ice-border/30 flex items-center justify-center text-ink-muted flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block">Member Since</span>
                <span className="text-ink-navy font-medium">{formatDate(user?.createdAt)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Edit Form OR Email Verification Form */}
        <div className="md:col-span-7 space-y-6">
          {isVerifyingEmail ? (
            <div className="bg-canvas-pure border border-amber-500/20 rounded-xl p-6 sm:p-8 shadow-3d-card space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500" />
              
              <div className="border-b border-ice-border/40 pb-3 flex justify-between items-start">
                <div>
                  <h4 className="text-xl font-bold text-ink-navy tracking-tight font-outfit">Verify Email Address</h4>
                  <p className="text-xs text-ink-muted font-light mt-1">Enter your email address to receive a secure 6-digit OTP verification code.</p>
                </div>
                <button
                  onClick={() => setIsVerifyingEmail(false)}
                  className="p-1 text-ink-muted hover:text-ink-navy rounded-full hover:bg-ice-gray/40 transition-colors"
                >
                  <span className="sr-only">Close</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Feedback alerts */}
              {verificationError && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-sm text-xs font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{verificationError}</span>
                </div>
              )}

              {verificationSuccess && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 p-3 rounded-sm text-xs font-medium">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-500" />
                  <span>{verificationSuccess}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Email Input */}
                <div>
                  <label htmlFor="verify-email" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                    Email Address
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-grow">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                        <Mail className="w-4 h-4" />
                      </span>
                      <input
                        id="verify-email"
                        type="email"
                        required
                        disabled={emailOtpSent}
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all disabled:opacity-60"
                        placeholder="Enter email to verify"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={verificationLoading || cooldown > 0}
                      onClick={handleSendEmailOtp}
                      className="px-4 py-2.5 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[140px]"
                    >
                      {verificationLoading && !emailOtpSent ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : emailOtpSent ? 'Resend Code' : 'Send Code'}
                    </button>
                  </div>
                </div>

                {emailOtpSent && (
                  <form onSubmit={handleVerifyEmailOtp} className="space-y-4 pt-4 border-t border-ice-border/40 animate-in fade-in duration-200">
                    <div>
                      <label htmlFor="email-otp" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                        Verification Code (6 Digits)
                      </label>
                      <input
                        id="email-otp"
                        type="text"
                        maxLength={6}
                        required
                        value={emailOtp}
                        onChange={(e) => setEmailOtp(e.target.value.replace(/\D/g, ''))}
                        className="w-full tracking-[1em] text-center font-bold pl-3 py-3 bg-canvas-pure border border-ice-border rounded-sm text-sm text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                        placeholder="000000"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        disabled={verificationLoading || !emailOtp}
                        className="flex-grow py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {verificationLoading ? 'Verifying...' : 'Verify & Update Email'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEmailOtpSent(false);
                          setEmailOtp('');
                        }}
                        className="px-4 py-2.5 border border-ice-border hover:bg-ice-gray/20 text-ink-muted hover:text-ink-navy rounded-sm font-bold text-xs transition-all"
                      >
                        Change Email
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-canvas-pure border border-ice-border rounded-xl p-6 sm:p-8 shadow-3d-card space-y-6">
              <div className="border-b border-ice-border/40 pb-3">
                <h4 className="text-xl font-bold text-ink-navy tracking-tight font-outfit">Edit Profile Settings</h4>
                <p className="text-xs text-ink-muted font-light mt-1">Keep your contact details up to date to ensure seamless pickup scheduling.</p>
              </div>

              {/* Feedback alerts */}
              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-sm text-xs font-medium">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 p-3 rounded-sm text-xs font-medium">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                  <span>{success}</span>
                </div>
              )}

              <form className="space-y-4" onSubmit={handleUpdate}>
                
                {/* Name Input */}
                <div>
                  <label htmlFor="edit-name" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                    Full Name
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      id="edit-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>

                {/* Phone Input */}
                <div>
                  <label htmlFor="edit-phone" className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block mb-1.5">
                    Mobile Number
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-ink-muted">
                      <Phone className="w-4 h-4" />
                    </span>
                    <input
                      id="edit-phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2.5 bg-canvas-pure border border-ice-border rounded-sm text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                      placeholder="Enter 10-digit phone number"
                    />
                  </div>
                </div>

                {/* Submit */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2.5 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? 'Saving Changes...' : 'Save Settings'}
                  </button>
                </div>

              </form>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
