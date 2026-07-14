import React, { useState } from 'react';
import { Shield, X, AlertCircle, ArrowRight, ShieldCheck, Lock } from 'lucide-react';

interface DigiLockerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  onVerifySuccess: (data: { verifiedName: string; maskedAadhaar: string; verificationDate: string }) => void;
  onVerifyFailure: (errorMsg: string) => void;
}

export const DigiLockerModal: React.FC<DigiLockerModalProps> = ({
  isOpen,
  onClose,
  customerName,
  onVerifySuccess,
  onVerifyFailure
}) => {
  const [step, setStep] = useState<'aadhaar' | 'otp'>('aadhaar');
  const [aadhaar, setAadhaar] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAadhaarSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (aadhaar.length !== 12 || !/^\d+$/.test(aadhaar)) {
      setError('Please enter a valid 12-digit Aadhaar number.');
      return;
    }

    setIsSubmitting(true);
    // Simulate API delay
    setTimeout(() => {
      setIsSubmitting(false);
      setStep('otp');
    }, 800);
  };

  const handleSimulateSuccess = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const masked = `XXXX-XXXX-${aadhaar.slice(-4) || '1234'}`;
      const name = customerName.trim() ? customerName.toUpperCase() : 'VERIFIED SELLER';
      onVerifySuccess({
        verifiedName: name,
        maskedAadhaar: masked,
        verificationDate: new Date().toISOString()
      });
      // Reset state and close
      resetModal();
      onClose();
    }, 1000);
  };

  const handleSimulateFailure = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      onVerifyFailure('DigiLocker authentication failed: User rejected consent or verification timed out.');
      resetModal();
      onClose();
    }, 1000);
  };

  const resetModal = () => {
    setStep('aadhaar');
    setAadhaar('');
    setOtp('');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
      <div className="bg-canvas-pure border border-ice-border rounded-sm max-w-md w-full overflow-hidden shadow-premium text-left animate-fadeIn">
        {/* DigiLocker Official Header */}
        <div className="bg-slate-900 border-b border-ice-border p-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-2.5">
            <div className="bg-cobalt p-1.5 rounded-sm flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-outfit font-bold text-sm tracking-wide">DigiLocker Verification</h3>
              <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest block">Govt. of India API Gateway</span>
            </div>
          </div>
          <button
            onClick={() => {
              resetModal();
              onClose();
            }}
            className="p-1.5 rounded-sm text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5">
          {error && (
            <div className="bg-red-500/10 text-red-400 p-3 rounded-sm border border-red-500/20 text-xs flex items-start gap-2 animate-fadeIn">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {step === 'aadhaar' ? (
            <form onSubmit={handleAadhaarSubmit} className="space-y-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">Identity Portal</span>
                <h4 className="text-lg font-light text-ink-navy">Enter Aadhaar Number</h4>
                <p className="text-xs text-ink-muted leading-relaxed font-light">
                  Provide your 12-digit Aadhaar number. A secure verification request will be dispatched to your UIDAI registered mobile number.
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={aadhaar}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setAadhaar(val);
                  }}
                  placeholder="e.g. 123456789012"
                  className="w-full p-3.5 pr-10 rounded-sm border border-ice-border bg-canvas-white text-ink-navy text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all"
                  style={{ minHeight: '48px' }}
                  disabled={isSubmitting}
                />
                <Lock className="w-4 h-4 text-zinc-500 absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/[0.04]">
                <span className="text-[9px] text-zinc-500 font-mono flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Secure 256-bit encryption
                </span>
                <button
                  type="submit"
                  disabled={isSubmitting || aadhaar.length !== 12}
                  className={`bg-cobalt hover:bg-cobalt-hover text-white px-4 py-2 text-xs font-bold rounded-sm flex items-center gap-1.5 transition-all ${
                    isSubmitting || aadhaar.length !== 12 ? 'opacity-40 cursor-not-allowed' : 'hover:translate-x-0.5'
                  }`}
                  style={{ minHeight: '36px' }}
                >
                  {isSubmitting ? 'Sending OTP...' : 'Request OTP'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-5 animate-fadeIn">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">OTP Validation</span>
                <h4 className="text-lg font-light text-ink-navy">Enter Mobile OTP</h4>
                <p className="text-xs text-ink-muted leading-relaxed font-light">
                  A verification code has been sent to the mobile number registered with Aadhaar ending in <strong className="text-ink-navy font-mono">*{aadhaar.slice(-4)}</strong>.
                </p>
              </div>

              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setOtp(val);
                }}
                placeholder="6-digit OTP code"
                className="w-full p-3.5 text-center tracking-[0.4em] rounded-sm border border-ice-border bg-canvas-white text-ink-navy text-lg font-mono focus:outline-none focus:ring-2 focus:ring-cobalt focus:border-cobalt transition-all"
                style={{ minHeight: '48px' }}
                disabled={isSubmitting}
              />

              {/* Simulation Sandbox Panel */}
              <div className="bg-zinc-950/60 rounded-sm border border-white/[0.06] p-4 space-y-3">
                <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 block font-bold text-center">
                  🧪 Sandbox Testing Controls
                </span>
                <p className="text-[10px] font-light text-zinc-400 text-center leading-normal">
                  Click a button below to simulate the DigiLocker Aadhaar verification outcome.
                </p>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <button
                    type="button"
                    onClick={handleSimulateSuccess}
                    disabled={isSubmitting || otp.length !== 6}
                    className={`bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 px-3 rounded-sm text-xs transition-colors flex items-center justify-center gap-1 ${
                      isSubmitting || otp.length !== 6 ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    Simulate Success
                  </button>
                  <button
                    type="button"
                    onClick={handleSimulateFailure}
                    disabled={isSubmitting || otp.length !== 6}
                    className={`bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-3 rounded-sm text-xs transition-colors flex items-center justify-center gap-1 ${
                      isSubmitting || otp.length !== 6 ? 'opacity-40 cursor-not-allowed' : ''
                    }`}
                  >
                    Simulate Failure
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => {
                    setStep('aadhaar');
                    setOtp('');
                  }}
                  className="text-zinc-500 hover:text-ink-navy text-xs font-semibold font-mono"
                  disabled={isSubmitting}
                >
                  &larr; Change Aadhaar
                </button>
                <span className="text-[10px] text-zinc-500 font-mono">
                  Didn't receive code? <span className="text-cobalt hover:underline cursor-pointer">Resend</span>
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
