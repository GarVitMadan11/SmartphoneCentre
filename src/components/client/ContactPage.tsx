import React, { useState } from 'react';
import { Mail, Phone, MapPin, Sparkles, Send, Instagram } from 'lucide-react';

interface ContactPageProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ContactPage: React.FC<ContactPageProps> = ({ onShowToast }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !message) {
      onShowToast('Please fill out all fields.', 'error');
      return;
    }
    setIsSubmitting(true);
    setTimeout(() => {
      onShowToast('Thank you for contacting us! Our team will get back to you shortly.', 'success');
      setName('');
      setEmail('');
      setPhone('');
      setMessage('');
      setIsSubmitting(false);
    }, 1000);
  };

  return (
    <div className="py-8 text-left space-y-12 animate-fadeIn max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="bg-canvas-pure border border-ice-border rounded-2xl p-6 sm:p-10 relative overflow-hidden shadow-sm">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cobalt/5 blur-[100px] rounded-full pointer-events-none" />

        <div className="relative z-10">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-cobalt/10 text-cobalt border border-cobalt/15 tracking-widest uppercase font-mono mb-4">
            <Sparkles className="w-3.5 h-3.5 text-cobalt" /> Reach Out
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-ink-navy font-outfit uppercase tracking-tight leading-tight">
            We are Here to <span className="text-cobalt">Help You</span>
          </h1>
          <p className="text-ink-slate text-base font-light mt-3 max-w-2xl leading-relaxed">
            Have questions about a quote, corporate fleet liquidation, or custom pick-up logistics? Drop us a line below or reach out directly to our support desk.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Info Grid */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-canvas-pure border border-ice-border rounded-xl p-6 space-y-6 shadow-sm">
            <h3 className="text-xl font-bold font-outfit text-ink-navy border-b border-ice-border pb-3">Corporate Desk</h3>
            
            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-cobalt/10 flex items-center justify-center text-cobalt flex-shrink-0 mt-0.5">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block">Email Support</span>
                <a href="mailto:support@rephonix.in" className="text-sm font-semibold text-ink-navy hover:text-cobalt transition-colors">support@rephonix.in</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 flex-shrink-0 mt-0.5">
                <Phone className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block">Call Support</span>
                <a href="tel:+919876543210" className="text-sm font-semibold text-ink-navy hover:text-cobalt transition-colors">+91 98765 43210</a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-600 flex-shrink-0 mt-0.5">
                <Instagram className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block">Instagram</span>
                <a 
                  href="https://www.instagram.com/rephonix.in/" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm font-semibold text-ink-navy hover:text-pink-600 transition-colors"
                >
                  @rephonix.in
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block">Headquarters</span>
                <p className="text-sm font-semibold text-ink-navy leading-relaxed">
                  Rephonix Resale Pvt Ltd,<br />
                  Tilak Nagar,<br />
                  New Delhi - 110018
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="lg:col-span-7 bg-canvas-pure border border-ice-border rounded-xl p-6 sm:p-8 shadow-sm">
          <h3 className="text-xl font-bold font-outfit text-ink-navy mb-6 border-b border-ice-border pb-3 text-left">Send Us a Message</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="contact-name" className="text-xs font-semibold text-ink-slate block mb-1">Your Name *</label>
                <input
                  id="contact-name"
                  type="text"
                  placeholder="e.g. Priyesh Shah"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-ice-border rounded-lg text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                  required
                />
              </div>
              <div>
                <label htmlFor="contact-email" className="text-xs font-semibold text-ink-slate block mb-1">Email Address *</label>
                <input
                  id="contact-email"
                  type="email"
                  placeholder="e.g. priyesh@gmail.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-ice-border rounded-lg text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="contact-phone" className="text-xs font-semibold text-ink-slate block mb-1">WhatsApp / Phone Number *</label>
              <input
                id="contact-phone"
                type="tel"
                placeholder="e.g. +91 99000 88000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-ice-border rounded-lg text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                required
              />
            </div>

            <div>
              <label htmlFor="contact-message" className="text-xs font-semibold text-ink-slate block mb-1">How can we help? *</label>
              <textarea
                id="contact-message"
                rows={4}
                placeholder="Enter details of your query..."
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-ice-border rounded-lg text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-cobalt hover:bg-cobalt-hover disabled:bg-cobalt/50 text-white px-6 py-3 rounded-lg font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <span>{isSubmitting ? 'Sending...' : 'Send Message'}</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
