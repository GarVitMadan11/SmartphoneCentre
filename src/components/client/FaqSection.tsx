import { useState } from 'react';

export const FAQ_ITEMS = [
  {
    q: 'How do I know the price is genuine?',
    a: 'Our pricing engine computes quotes using market-calibrated base prices and documented deduction rules. The price you see is the price you get — we never renegotiate at pickup unless device condition is materially different from what you reported.',
  },
  {
    q: 'How quickly will I receive payment?',
    a: 'Payment is processed within minutes of our executive completing the on-site verification at your doorstep. UPI and bank transfers are instant. Cash arrangements are also available on request.',
  },
  {
    q: 'Is my personal data safe after the trade?',
    a: 'Every device undergoes a military-grade (DoD 5220.22-M) secure erase before leaving your premises. We provide a certified data destruction certificate on request. We never access your personal files.',
  },
  {
    q: 'What if I change my mind after booking?',
    a: 'You can cancel or reschedule your pickup at any time up to 2 hours before the scheduled slot at no charge. Your quote is locked for 7 days so you can rebook whenever suits you.',
  },
  {
    q: 'Which cities do you currently operate in?',
    a: 'We currently service Mumbai, Delhi NCR, Bangalore, Hyderabad, Chennai, and Pune. Coverage is expanding — contact us if you\'re in another city and we\'ll check availability.',
  },
  {
    q: 'Can I sell multiple devices at once?',
    a: 'Yes! For bulk (3+ devices) or corporate liquidations, contact our B2B team for a customized quote, certified bulk data wiping, and dedicated logistics support.',
  },
  {
    q: 'What devices do you accept?',
    a: 'We accept iPhones (up to 6 years old), Samsung Galaxy S and A series, OnePlus, Google Pixel, and Motorola devices. We continuously expand our catalog — if your model is not listed, reach out via our helpdesk.',
  },
];

export function FaqSection() {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  return (
    <div className="py-8 border-t border-ice-border/40">
      <div className="text-center max-w-2xl mx-auto mb-10">
        <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold bg-secondary/10 text-secondary mb-4 tracking-wide uppercase">Frequently Asked</span>
        <h2 className="text-3xl font-extrabold text-ink-navy tracking-tight">Common Questions</h2>
        <p className="text-ink-slate mt-2 text-sm font-light">Everything you need to know before selling your device.</p>
      </div>
      <div className="max-w-3xl mx-auto space-y-3">
        {FAQ_ITEMS.map((item, i) => (
          <div key={i} className="border border-ice-border rounded-xl overflow-hidden bg-canvas-pure">
            <button
              id={`faq-btn-${i}`}
              aria-expanded={openIdx === i}
              aria-controls={`faq-panel-${i}`}
              onClick={() => setOpenIdx(openIdx === i ? null : i)}
              className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left hover:bg-ice-gray/50 transition-colors"
            >
              <span className="text-sm font-semibold text-ink-navy">{item.q}</span>
              <svg
                className={`w-5 h-5 text-ink-muted flex-shrink-0 transition-transform duration-200 ${openIdx === i ? 'rotate-45' : ''}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            {openIdx === i && (
              <div id={`faq-panel-${i}`} role="region" aria-labelledby={`faq-btn-${i}`} className="px-5 pb-5 text-sm text-ink-slate font-light leading-relaxed border-t border-ice-border/40 pt-4 animate-fadeIn">
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default FaqSection;
