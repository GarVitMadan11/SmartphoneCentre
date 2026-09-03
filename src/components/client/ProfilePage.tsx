import React, { useState, useEffect } from 'react';
import {
  User, Phone, Mail, Calendar, ArrowLeft, LogOut, ShieldCheck, AlertCircle,
  Package, FileText, Download, Copy, Check, CheckCircle2, MapPin, ArrowRight
} from 'lucide-react';
import emailjs from '@emailjs/browser';
import {
  updateCustomerProfile, sendEmailOtp, verifyEmailOtp,
  fetchMyBookings, downloadBookingPdf, ApiBooking
} from '../../utils/api';
import { getDeviceImage, Model } from '../../data/mockDatabase';

interface ProfilePageProps {
  user: any;
  onLogout: () => void;
  onUpdateUser: (updatedUser: any) => void;
  onNavigate: (path: string) => void;
  models?: Model[];
  initialTab?: 'profile' | 'bookings' | 'invoices';
}

export default function ProfilePage({
  user,
  onLogout,
  onUpdateUser,
  onNavigate,
  models = [],
  initialTab,
}: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState<'profile' | 'bookings' | 'invoices'>('bookings');

  // Bookings list state
  const [myBookings, setMyBookings] = useState<ApiBooking[]>([]);
  const [fetchingBookings, setFetchingBookings] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Profile form state
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

  // Handle URL tab search param (e.g. /profile?tab=bookings)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabParam = params.get('tab');
    if (tabParam === 'bookings' || tabParam === 'invoices' || tabParam === 'profile') {
      setActiveTab(tabParam);
    } else if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Load customer bookings on mount
  useEffect(() => {
    loadBookings();
  }, [user]);

  const loadBookings = async () => {
    setFetchingBookings(true);
    try {
      const list = await fetchMyBookings();
      setMyBookings(list || []);
    } catch {
      setMyBookings([]);
    } finally {
      setFetchingBookings(false);
    }
  };

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const copyBookingId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusStep = (b: { inspectionStatus: string; payoutStatus: string }) => {
    if (b.payoutStatus === 'completed') return 3;
    if (b.inspectionStatus === 'approved') return 2;
    return 1;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDateStr = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

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
      const response = await sendEmailOtp(newEmail.trim());
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
    <div className="max-w-4xl mx-auto px-4 py-6 sm:py-8 text-left animate-fadeIn">
      
      {/* Header Back button & Logout */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1.5 text-xs text-cobalt hover:underline font-medium cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors font-medium border border-red-500/20 px-3 py-1.5 rounded-sm hover:bg-red-500/5 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>

      {/* Page Title */}
      <div className="mb-6">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-ink-navy font-outfit tracking-tight">
          Customer Account Dashboard
        </h2>
        <p className="text-xs text-ink-muted mt-1 font-light">
          Manage your account profile, track active trade-in bookings, and download official tax receipts.
        </p>
      </div>

      {/* Top Tab Bar Navigation */}
      <div className="flex border-b border-ice-border/60 mb-8 gap-2 text-xs font-semibold overflow-x-auto scrollbar-none pb-1">
        <button
          type="button"
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-cobalt text-white border-cobalt shadow-sm font-bold'
              : 'bg-canvas-pure text-ink-slate hover:text-ink-navy border-ice-border hover:bg-slate-50'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Your Bookings</span>
          {myBookings.length > 0 && (
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
              activeTab === 'bookings' ? 'bg-white/20 text-white' : 'bg-cobalt/10 text-cobalt'
            }`}>
              {myBookings.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('invoices')}
          className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === 'invoices'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm font-bold'
              : 'bg-canvas-pure text-ink-slate hover:text-ink-navy border-ice-border hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Invoices &amp; Receipts</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
            activeTab === 'profile'
              ? 'bg-ink-navy text-white border-ink-navy shadow-sm font-bold'
              : 'bg-canvas-pure text-ink-slate hover:text-ink-navy border-ice-border hover:bg-slate-50'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profile &amp; Security</span>
        </button>
      </div>

      {/* TAB 1: YOUR BOOKINGS */}
      {activeTab === 'bookings' && (
        <div className="space-y-6 animate-fadeIn">
          {fetchingBookings ? (
            <div className="py-16 text-center text-ink-muted space-y-3 bg-canvas-pure border border-ice-border rounded-xl">
              <div className="w-8 h-8 border-2 border-cobalt border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium">Fetching your trade-in bookings...</p>
            </div>
          ) : myBookings.length === 0 ? (
            <div className="py-16 text-center text-ink-muted space-y-4 bg-canvas-pure rounded-2xl border border-dashed border-ice-border p-8">
              <div className="w-14 h-14 rounded-2xl bg-cobalt/10 text-cobalt flex items-center justify-center mx-auto shadow-xs">
                <Package className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-lg text-ink-navy font-outfit">No Trade-In Bookings Yet</h4>
                <p className="text-xs text-ink-muted max-w-md mx-auto font-light leading-relaxed">
                  You haven't scheduled any doorstep device trade-in bookings under your account. Get an instant quote to sell your smartphone in under 60 seconds!
                </p>
              </div>
              <button
                onClick={() => onNavigate('/smartphones')}
                className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-cobalt hover:bg-cobalt-hover text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Start Instant Valuation</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myBookings.map((b) => {
                const matchedModel = models.find(m => m.id === b.modelId || m.name.toLowerCase() === b.modelName.toLowerCase());
                const deviceImg = getDeviceImage(
                  b.modelId,
                  matchedModel?.brandId || 'apple',
                  b.color,
                  matchedModel?.imageUrl
                );
                const stepNum = getStatusStep(b);

                return (
                  <div
                    key={b.id}
                    className="bg-canvas-pure border border-ice-border rounded-2xl p-5 sm:p-6 shadow-3d-card hover:shadow-premium transition-all space-y-5 text-left"
                  >
                    {/* Header Row: Booking ID, Date & Status */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-ice-border/60">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-extrabold text-cobalt bg-cobalt/10 px-3 py-1 rounded-lg border border-cobalt/20">
                          #{b.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => copyBookingId(b.id)}
                          className="text-zinc-400 hover:text-cobalt p-1 rounded transition-colors cursor-pointer"
                          title="Copy Booking ID"
                        >
                          {copiedId === b.id ? (
                            <Check className="w-4 h-4 text-emerald-500" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-[11px] font-mono text-ink-muted">
                          Booked {formatDateStr(b.dateCreated)}
                        </span>
                        <span className={`text-[10px] font-bold font-mono px-2.5 py-1 rounded-full uppercase tracking-wider ${
                          b.payoutStatus === 'completed'
                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            : b.inspectionStatus === 'approved'
                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                            : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                        }`}>
                          {b.payoutStatus === 'completed'
                            ? 'Paid Out'
                            : b.inspectionStatus === 'approved'
                            ? 'Inspection Approved'
                            : 'Pending Pickup'}
                        </span>
                      </div>
                    </div>

                    {/* Middle Row: Device Info & Agreed Price */}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 bg-white border border-ice-border rounded-xl p-2 flex items-center justify-center flex-shrink-0 shadow-xs">
                        <img
                          src={deviceImg}
                          alt={b.modelName}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-extrabold text-base sm:text-lg text-ink-navy truncate font-outfit">
                          {b.modelName}
                        </h4>
                        <p className="text-xs text-ink-muted mt-0.5 truncate font-mono">
                          Storage: {b.storageGb >= 1024 ? `${b.storageGb / 1024}TB` : `${b.storageGb}GB`}
                          {b.color && b.color !== 'Standard' ? ` • ${b.color}` : ''}
                          {b.imei ? ` • IMEI: ${b.imei}` : ''}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] font-mono text-ink-muted uppercase block font-semibold">Agreed Payout</span>
                        <span className="text-lg sm:text-xl font-black text-emerald-600 font-outfit">
                          {formatPrice(b.finalPayoutAmount || b.finalPrice)}
                        </span>
                      </div>
                    </div>

                    {/* Logistics Info: Pickup Date & Address */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50/80 border border-ice-border/40 text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-ink-muted uppercase font-bold block flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-cobalt" /> Scheduled Doorstep Pickup
                        </span>
                        <p className="font-semibold text-ink-navy mt-1">
                          {b.pickupDate} ({b.pickupTimeSlot})
                        </p>
                      </div>

                      <div>
                        <span className="text-[10px] font-mono text-ink-muted uppercase font-bold block flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-cobalt" /> Pickup Address
                        </span>
                        <p className="font-medium text-ink-navy truncate mt-1" title={b.address}>
                          {b.address}
                        </p>
                      </div>
                    </div>

                    {/* Stepper Progress */}
                    <div className="pt-2">
                      <div className="relative flex items-center justify-between text-center">
                        <div className="absolute left-4 right-4 top-4 -translate-y-1/2 h-1 bg-zinc-200 -z-0" />
                        {[
                          { title: 'Booked', desc: 'Order confirmed' },
                          { title: 'Inspected', desc: 'Doorside audit' },
                          { title: 'Paid Out', desc: 'Funds transferred' },
                        ].map((s, idx) => {
                          const sNum = idx + 1;
                          const isPassed = stepNum >= sNum;
                          return (
                            <div key={idx} className="relative z-10 flex flex-col items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                                isPassed
                                  ? 'bg-emerald-600 text-white shadow-sm'
                                  : 'bg-zinc-200 text-zinc-500'
                              }`}>
                                {isPassed ? <CheckCircle2 className="w-4.5 h-4.5" /> : sNum}
                              </div>
                              <span className="text-[10px] font-bold text-ink-navy mt-1.5">{s.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Download PDF invoice footer */}
                    <div className="pt-3 border-t border-ice-border/60 flex items-center justify-between gap-3">
                      <span className="text-[11px] text-ink-muted font-mono hidden sm:inline">Official GST &amp; Aadhaar Compliant Receipt</span>
                      <button
                        type="button"
                        onClick={() => downloadBookingPdf(b.id)}
                        className="w-full sm:w-auto px-4 py-2 rounded-xl bg-cobalt hover:bg-cobalt-hover text-white font-bold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Tax Invoice (PDF)</span>
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: INVOICES & RECEIPTS */}
      {activeTab === 'invoices' && (
        <div className="space-y-6 animate-fadeIn">
          {fetchingBookings ? (
            <div className="py-16 text-center text-ink-muted space-y-3 bg-canvas-pure border border-ice-border rounded-xl">
              <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium">Loading official tax invoices &amp; receipts...</p>
            </div>
          ) : myBookings.length === 0 ? (
            <div className="py-16 text-center bg-canvas-pure rounded-2xl border border-dashed border-ice-border p-8 space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
                <FileText className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="font-extrabold text-lg text-ink-navy font-outfit">No Tax Invoices Available Yet</h4>
                <p className="text-xs text-ink-muted max-w-md mx-auto font-light leading-relaxed">
                  Invoices and official sale receipts are generated automatically once you schedule a trade-in pickup order.
                </p>
              </div>
              <button
                onClick={() => onNavigate('/smartphones')}
                className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                <span>Book Trade-In Order</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {myBookings.map((b) => {
                const formattedPrice = formatPrice(b.finalPayoutAmount || b.finalPrice);
                return (
                  <div key={b.id} className="bg-canvas-pure border border-ice-border rounded-2xl p-5 sm:p-6 shadow-3d-card hover:shadow-premium transition-all space-y-4 text-left">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ice-border/60 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-black text-xs">
                          TAX
                        </div>
                        <div>
                          <h4 className="font-black text-base text-ink-navy tracking-tight font-outfit">OFFICIAL TAX INVOICE</h4>
                          <span className="text-[11px] font-mono text-ink-muted">Invoice Ref: INV-{b.id}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase tracking-wider">
                          OFFICIAL DOCUMENT
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50/60 p-4 rounded-xl border border-ice-border/40">
                      <div>
                        <span className="text-[10px] font-mono text-ink-muted uppercase block font-semibold">Device Model</span>
                        <span className="font-extrabold text-ink-navy text-sm">{b.modelName} ({b.storageGb}GB)</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-ink-muted uppercase block font-semibold">Booking Date</span>
                        <span className="font-semibold text-ink-navy">{formatDateStr(b.dateCreated)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-ink-muted uppercase block font-semibold">Customer Name</span>
                        <span className="font-semibold text-ink-navy">{b.customerName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-ink-muted uppercase block font-semibold">Final Agreed Payout</span>
                        <span className="font-black text-emerald-600 font-outfit text-base">{formattedPrice}</span>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-ice-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="text-[11px] text-ink-muted font-mono">Includes NIST data wipe &amp; digital transfer receipt</span>
                      <button
                        type="button"
                        onClick={() => downloadBookingPdf(b.id)}
                        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Tax Invoice (PDF)</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PROFILE & SECURITY */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start animate-fadeIn">
          
          {/* Left Side: Summary Card */}
          <div className="md:col-span-5 bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-3d-card space-y-6">
            <div className="text-center pb-4 border-b border-ice-border/40">
              <div className="w-16 h-16 bg-cobalt/10 text-cobalt border border-cobalt/20 rounded-full flex items-center justify-center mx-auto text-xl font-bold font-outfit mb-3">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
              </div>
              <h3 className="text-lg font-bold text-ink-navy font-outfit">{user?.name}</h3>
              <span className="text-[10px] font-mono tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold uppercase">
                Verified Customer Account
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
                      className="text-[9px] font-bold tracking-wider bg-amber-500/10 text-amber-600 hover:bg-amber-500/20 border border-amber-500/20 px-2 py-0.5 rounded-sm uppercase transition-colors cursor-pointer"
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
                        className="px-4 py-2.5 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[140px] cursor-pointer"
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
                          className="flex-grow py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                          {verificationLoading ? 'Verifying...' : 'Verify & Update Email'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEmailOtpSent(false);
                            setEmailOtp('');
                          }}
                          className="px-4 py-2.5 border border-ice-border hover:bg-ice-gray/20 text-ink-muted hover:text-ink-navy rounded-sm font-bold text-xs transition-all cursor-pointer"
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
                      className="px-6 py-2.5 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                    >
                      {isLoading ? 'Saving Changes...' : 'Save Settings'}
                    </button>
                  </div>

                </form>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
