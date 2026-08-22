import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, Sparkles, AlertCircle, Loader2, Lock, ArrowRight, Mail } from 'lucide-react';
import { ApiUser, submitPilotFeedback } from '../../utils/api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: ApiUser | null;
  onNavigate?: (path: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      setError('Please log in to submit suggestions.');
      return;
    }
    if (!name.trim()) {
      setError('Name is mandatory.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('A valid Gmail / Email address is mandatory.');
      return;
    }
    if (!feedback.trim() || feedback.trim().length < 5) {
      setError('Please describe your thoughts or suggestions in detail (at least 5 characters).');
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      // 1. Submit to backend API which sends email directly to support@rephonix.in
      await submitPilotFeedback({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        category,
        feedback: feedback.trim(),
      });

      // 2. Also keep local audit backup in browser storage
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
        // storage backup non-blocking
      }

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setFeedback('');
        onClose();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Could not send feedback to support@rephonix.in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
          className="relative w-full max-w-lg bg-canvas-pure border border-ice-border/90 rounded-2xl shadow-2xl overflow-hidden z-10 text-left"
        >
          {/* Top Accent Gradient Bar */}
          <div className="h-1.5 w-full bg-gradient-to-r from-cobalt via-sky-400 to-indigo-600" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-ink-muted hover:text-ink-navy hover:bg-slate-100 rounded-full transition-all"
            aria-label="Close Feedback Modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 sm:p-8">
            {/* Case 1: Not Logged In Prompt */}
            {!currentUser ? (
              <div className="py-6 text-center space-y-5">
                <div className="w-16 h-16 bg-cobalt/10 border border-cobalt/20 rounded-full flex items-center justify-center mx-auto text-cobalt shadow-inner">
                  <Lock className="w-8 h-8" />
                </div>
                <div className="space-y-2 max-w-sm mx-auto">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cobalt/10 text-cobalt border border-cobalt/20">
                    <Sparkles className="w-3 h-3" />
                    <span>LOGIN REQUIRED</span>
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-ink-navy">
                    Sign In to Share Feedback
                  </h3>
                  <p className="text-xs text-ink-muted font-light leading-relaxed">
                    To maintain verified recommendations during Pilot Mode, please log in with your Gmail or create an account to submit suggestions.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onNavigate) onNavigate('/login');
                    }}
                    className="w-full sm:w-auto px-6 py-2.5 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-lg transition-all shadow-premium flex items-center justify-center gap-2"
                  >
                    <span>Login / Create Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-full sm:w-auto px-4 py-2.5 text-xs text-ink-muted hover:text-ink-navy font-medium transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : isSuccess ? (
              /* Case 2: Success Confirmation */
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-xl font-bold font-outfit text-ink-navy">Feedback Dispatched!</h3>
                  <p className="text-xs text-ink-muted max-w-sm mx-auto font-light leading-relaxed">
                    Your suggestion was sent directly to <strong className="text-ink-navy">support@rephonix.in</strong>. Thank you for helping shape our platform!
                  </p>
                </div>
              </motion.div>
            ) : (
              /* Case 3: Logged In Feedback Submission Form */
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                {/* Header */}
                <div className="space-y-1 pr-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-cobalt/10 text-cobalt border border-cobalt/20">
                    <Sparkles className="w-3 h-3 text-cobalt" />
                    <span>PILOT PROGRAM FEEDBACK</span>
                  </div>
                  <h3 className="text-xl font-bold font-outfit text-ink-navy tracking-tight">
                    Help Shape the Rephonix Experience
                  </h3>
                  <p className="text-xs text-ink-muted font-light leading-relaxed">
                    All suggestions are delivered directly to <strong className="text-ink-navy">support@rephonix.in</strong>.
                  </p>
                </div>

                {/* Error Banner */}
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
                      { id: 'general', label: 'General Idea' },
                    ].map(cat => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setCategory(cat.id as any)}
                        className={`py-2 px-2.5 rounded-lg text-xs font-medium border transition-all text-center ${
                          category === cat.id
                            ? 'bg-cobalt text-white border-cobalt shadow-sm font-semibold'
                            : 'bg-slate-50 hover:bg-slate-100 text-ink-navy border-ice-border/80'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Thoughts Textarea */}
                <div className="space-y-1.5">
                  <label htmlFor="pilot-feedback" className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                    Your Thoughts &amp; Suggestions <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    id="pilot-feedback"
                    required
                    rows={4}
                    value={feedback}
                    onChange={e => setFeedback(e.target.value)}
                    placeholder="Tell us what you'd like to see, what models we should add, or what would make Rephonix better for you..."
                    className="w-full p-3 bg-canvas-pure border border-ice-border rounded-xl text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all resize-none font-sans"
                  />
                </div>

                {/* Mandatory Name & Gmail / Email Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="pilot-name" className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                      Your Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="pilot-name"
                      type="text"
                      required
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Full Name"
                      className="w-full px-3 py-2 bg-canvas-pure border border-ice-border rounded-lg text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="pilot-email" className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                      Your Gmail / Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      id="pilot-email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className="w-full px-3 py-2 bg-canvas-pure border border-ice-border rounded-lg text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                    />
                  </div>
                </div>

                {/* Notice */}
                <div className="flex items-center gap-2 text-[11px] text-ink-muted bg-slate-50 p-2.5 rounded-lg border border-ice-border/60">
                  <Mail className="w-3.5 h-3.5 text-cobalt shrink-0" />
                  <span>Will be delivered directly to <strong>support@rephonix.in</strong></span>
                </div>

                {/* Actions */}
                <div className="pt-1 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs text-ink-muted hover:text-ink-navy font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !feedback.trim() || !name.trim() || !email.trim()}
                    className="px-5 py-2.5 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-lg transition-all shadow-premium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isSubmitting ? 'Sending to Support...' : 'Send Feedback'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
export default FeedbackModal;
