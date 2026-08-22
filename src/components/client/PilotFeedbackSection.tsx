import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, CheckCircle2, Sparkles, AlertCircle, Loader2, Lock, ArrowRight, Mail } from 'lucide-react';
import { ApiUser, submitPilotFeedback } from '../../utils/api';

interface PilotFeedbackSectionProps {
  currentUser?: ApiUser | null;
  onNavigate: (path: string) => void;
}

export const PilotFeedbackSection: React.FC<PilotFeedbackSectionProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [category, setCategory] = useState<'suggestion' | 'model_request' | 'improvement' | 'general'>('suggestion');
  const [feedback, setFeedback] = useState('');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [name, setName] = useState(currentUser?.name || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      if (currentUser.email) setEmail(currentUser.email);
      if (currentUser.name) setName(currentUser.name);
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please log in with your account to submit feedback.');
      return;
    }
    if (!name.trim()) {
      setError('Name is required.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('A valid Gmail / Email address is required.');
      return;
    }
    if (!feedback.trim() || feedback.trim().length < 5) {
      setError('Please provide detailed feedback (at least 5 characters).');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await submitPilotFeedback({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        category,
        feedback: feedback.trim(),
      });

      // Browser audit trail
      try {
        const feedbackEntry = {
          id: `fb_${Date.now()}`,
          name: name.trim(),
          email: email.trim(),
          category,
          feedback: feedback.trim(),
          createdAt: new Date().toISOString(),
        };
        const existingFeedback = JSON.parse(localStorage.getItem('rephonix_pilot_feedback') || '[]');
        existingFeedback.unshift(feedbackEntry);
        localStorage.setItem('rephonix_pilot_feedback', JSON.stringify(existingFeedback.slice(0, 50)));
      } catch {
        // non-blocking
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setFeedback('');
      }, 3500);
    } catch (err: any) {
      setError(err.message || 'Could not send feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="pilot-feedback" className="w-full text-left my-8">
      <div className="bg-canvas-pure border border-ice-border rounded-2xl p-6 sm:p-10 shadow-3d-card relative overflow-hidden">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cobalt/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none -ml-16 -mb-16" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Context & Overview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-mono font-bold uppercase tracking-wider bg-cobalt/10 text-cobalt border border-cobalt/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span>Pilot Program Early Access</span>
            </div>

            <h3 className="text-2xl sm:text-3xl font-extrabold font-outfit text-ink-navy tracking-tight leading-tight">
              Help Shape the Future of Rephonix
            </h3>

            <p className="text-xs sm:text-sm text-ink-slate font-light leading-relaxed">
              We’re currently in <strong className="font-semibold text-ink-navy">Pilot Mode</strong>, improving every step of the trade-in experience. Tell us what device models you’d like us to list next, what features to build, and what would make Rephonix better for you.
            </p>

            <div className="pt-2 space-y-2.5 text-xs text-ink-slate">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-cobalt shrink-0" />
                <span>All messages delivered directly to <strong className="text-ink-navy">support@rephonix.in</strong></span>
              </div>
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                <span>More brands and models are being added continuously</span>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Form */}
          <div className="lg:col-span-7 bg-slate-50/80 border border-ice-border/80 rounded-xl p-5 sm:p-7">
            {!currentUser ? (
              /* Locked State: Must Log In */
              <div className="py-8 text-center space-y-4">
                <div className="w-14 h-14 bg-cobalt/10 border border-cobalt/20 rounded-full flex items-center justify-center mx-auto text-cobalt">
                  <Lock className="w-7 h-7" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                  <h4 className="text-lg font-bold font-outfit text-ink-navy">Sign In to Give Feedback</h4>
                  <p className="text-xs text-ink-muted font-light leading-relaxed">
                    To maintain verified recommendations during Pilot Mode, suggestions can only be submitted by logged-in users.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('/login?redirect=feedback')}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-lg transition-all shadow-premium"
                >
                  <span>Login / Create Account with Gmail</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : isSuccess ? (
              /* Success Confirmation */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-3"
              >
                <div className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-lg font-bold font-outfit text-ink-navy">Feedback Successfully Sent!</h4>
                <p className="text-xs text-ink-muted max-w-sm mx-auto font-light">
                  Your feedback was delivered directly to <strong className="text-ink-navy">support@rephonix.in</strong>. Thank you for helping us shape Rephonix!
                </p>
              </motion.div>
            ) : (
              /* Active Feedback Form */
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                    Feedback Category <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'suggestion', label: 'Feature Idea' },
                      { id: 'model_request', label: 'Brand / Model' },
                      { id: 'improvement', label: 'Improvement' },
                      { id: 'general', label: 'General Thoughts' },
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id as any)}
                        className={`py-2 px-2.5 rounded-lg text-xs font-medium border transition-all text-center ${
                          category === cat.id
                            ? 'bg-cobalt text-white border-cobalt shadow-sm font-semibold'
                            : 'bg-white hover:bg-slate-100 text-ink-navy border-ice-border'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label htmlFor="inpage-feedback" className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                    Your Thoughts &amp; Suggestions <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="inpage-feedback"
                    required
                    rows={4}
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Tell us what you'd like to see, what models we should add, or what would make Rephonix better for you..."
                    className="w-full p-3 bg-white border border-ice-border rounded-xl text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all resize-none font-sans"
                  />
                </div>

                {/* Mandatory Name & Email (Pre-filled) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="inpage-name" className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                      Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="inpage-name"
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full px-3 py-2 bg-white border border-ice-border rounded-lg text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="inpage-email" className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                      Gmail / Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="inpage-email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className="w-full px-3 py-2 bg-white border border-ice-border rounded-lg text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                    />
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="submit"
                    disabled={isSubmitting || !feedback.trim() || !name.trim() || !email.trim()}
                    className="w-full sm:w-auto px-6 py-2.5 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-lg transition-all shadow-premium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isSubmitting ? 'Submitting...' : 'Send Feedback to support@rephonix.in'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PilotFeedbackSection;
