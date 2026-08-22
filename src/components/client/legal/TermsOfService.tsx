import React from 'react';
import { FileCheck, ArrowLeft, AlertTriangle, DollarSign } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fadeIn text-ink-navy">
      <button
        onClick={onBack}
        className="inline-flex items-center gap-2 text-sm font-semibold text-cobalt hover:text-cobalt-hover transition-colors mb-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      <div className="border-b border-ice-border pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-cobalt/10 text-cobalt rounded-full text-xs font-semibold mb-3">
          <FileCheck className="w-3.5 h-3.5" />
          Trade-In Terms & Conditions
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-navy">
          Terms of Service & Trade-In Agreement
        </h1>
        <p className="text-sm text-ink-muted mt-2">
          Last Updated: August 2026 | Governing Smartphone Trade-In, Valuation & Payout Services
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-zinc-700">
        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-navy flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-600" />
            1. Valuation & Server-Authoritative Pricing
          </h2>
          <p>
            All trade-in quotes generated on Rephonix are calculated by our versioned server pricing engine based on catalog specifications and declared defect parameters. Initial estimated valuations are valid for 30 minutes or until physical doorstep inspection. Final payout amounts are subject to physical verification by an authorized agent.
          </p>
        </section>

        <section className="p-5 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-2">
          <h2 className="text-base font-bold text-ink-navy flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            2. Customer Device Ownership & Data Wipe Responsibility
          </h2>
          <p>
            By initiating a trade-in booking, you certify that you are the lawful owner of the device or authorized to sell it. Customers MUST remove all cloud accounts (Apple iCloud, Google Account, Samsung Account), disable activation locks, and perform a full factory reset prior to handing over the device to our agent. Rephonix is not responsible for data remaining on un-wiped devices.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-navy">3. Identity Verification Requirement</h2>
          <p>
            To comply with anti-fraud and law enforcement standards, seller identity verification (via government-issued ID / DigiLocker authorization) is mandatory prior to payout disbursement.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-navy">4. Doorstep Inspection & Price Adjustments</h2>
          <p>
            If physical doorstep inspection reveals undeclared defects, screen damage, or functional faults, our agent will provide a revised server-authoritative valuation. The seller retains full right to accept the revised quote or cancel the pickup without penalty.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-navy">5. Cancellation & Refunds</h2>
          <p>
            Bookings may be canceled freely at any point prior to physical device handover. Once payout has been disbursed and the device handed over, ownership transfers irrevocably to Rephonix and the sale is final.
          </p>
        </section>
      </div>
    </div>
  );
};
