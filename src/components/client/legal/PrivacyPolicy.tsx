import React from 'react';
import { ShieldCheck, Lock, Trash2, ArrowLeft } from 'lucide-react';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
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
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5" />
          Data Protection & Compliance Policy
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-ink-navy">
          Privacy & Data Protection Policy
        </h1>
        <p className="text-sm text-ink-muted mt-2">
          Effective Date: August 2026 | Compliant with DPDP Act & Industry Financial Data Standards
        </p>
      </div>

      <div className="space-y-6 text-sm leading-relaxed text-zinc-700">
        <section className="p-5 bg-zinc-50 rounded-xl border border-ice-border space-y-2">
          <h2 className="text-base font-bold text-ink-navy flex items-center gap-2">
            <Lock className="w-4 h-4 text-cobalt" />
            1. Field-Level Payout Encryption & Security
          </h2>
          <p>
            Rephonix employs field-level <strong>AES-256-GCM encryption</strong> for all sensitive financial identifiers, including bank account numbers, IFSC codes, and UPI handles. Payout details are encrypted prior to database storage and are never logged or stored in plaintext.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-navy">2. PII Data Collection & Purpose Limitation</h2>
          <p>
            We collect personal information solely for fulfilling device trade-in valuations, scheduling pickup logistics, authenticating seller identity, and disbursing final payout amounts. The information collected includes:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-zinc-600">
            <li>Customer Name, Email Address, and 10-digit Mobile Number.</li>
            <li>Pickup Address and Pin Code.</li>
            <li>Financial account details for payout processing (encrypted at rest).</li>
            <li>Device diagnostic responses and physical condition declarations.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-navy">3. Identity Verification & DigiLocker Compliance</h2>
          <p>
            Identity verification is conducted strictly in accordance with regulated electronic KYC guidelines. Verified status is granted only upon receipt of an authenticated provider callback. Verification records are cryptographically hashed and audit-logged to prevent tampering.
          </p>
        </section>

        <section className="p-5 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-2">
          <h2 className="text-base font-bold text-ink-navy flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-amber-600" />
            4. Data Retention & Deletion Rights
          </h2>
          <p>
            Sensitive payout details are automatically masked in staff dashboards and are permanently purged upon completion of transaction reconciliation (within 30 days of payout disbursement). Customers may request complete account data deletion by submitting a request to our Grievance Officer.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-base font-bold text-ink-navy">5. Grievance & Compliance Officer Contact</h2>
          <p>
            If you have questions regarding this Privacy Policy or wish to exercise your data rights, please contact our Compliance Officer:
          </p>
          <div className="p-4 bg-white rounded-lg border border-ice-border font-mono text-xs space-y-1">
            <p><strong>Email:</strong> privacy@rephonix.in</p>
            <p><strong>Grievance Office:</strong> Rephonix Regulatory & Legal Dept, HSR Layout, Sector 4, Bengaluru - 560102</p>
          </div>
        </section>
      </div>
    </div>
  );
};
