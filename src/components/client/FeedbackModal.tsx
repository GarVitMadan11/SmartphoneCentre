import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, CheckCircle2, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { ApiUser } from '../../utils/api';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: ApiUser | null;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  currentUser,
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
    if (!feedback.trim()) {
      setError('Please provide a short description of your feedback.');
      return;
    }
    setError('');
    setIsSubmitting(true);

    try {
      // Store in local pilot feedback storage for admin inspection & analytics
      const feedbackEntry = {
        id: `fb_${Date.now()}`,
        name: name.trim() || 'Anonymous Explorer',
        email: email.trim() || 'Not Provided',
        category,
        feedback: feedback.trim(),
        createdAt: new Date().toISOString(),
      };

      const existingFeedback = JSON.parse(localStorage.getItem('rephonix_pilot_feedback') || '[]');
      existingFeedback.unshift(feedbackEntry);
      localStorage.setItem('rephonix_pilot_feedback', JSON.stringify(existingFeedback.slice(0, 50)));

      // Simulate network response
      await new Promise(resolve => setTimeout(resolve, 600));

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        setFeedback('');
        onClose();
      }, 2200);
    } catch {
      setError('Could not submit feedback. Please try again.');
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
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.15 }}
          className="relative w-full max-w-lg bg-canvas-pure border border-ice-border/80 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden z-10 text-left"
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
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-10 text-center space-y-4"
              >
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-inner">
                  <CheckCircle2 className="w-9 h-9" />
                </div>
                <div>
                  <h3 className="text-xl font-bold font-outfit text-ink-navy">Thank You for Your Feedback!</h3>
                  <p className="text-xs text-ink-muted mt-1.5 max-w-sm mx-auto font-light">
                    Your suggestions directly help our engineering team shape the final release of Rephonix.
                  </p>
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
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
                    Tell us what features you’d love, what brands or models we should list next, or how we can improve.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Category Chips */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                    Feedback Category
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
                            ? 'bg-cobalt text-white border-cobalt shadow-sm'
                            : 'bg-slate-50 hover:bg-slate-100 text-ink-navy border-ice-border/80'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Feedback Input */}
                <div className="space-y-1.5">
                  <label htmlFor="pilot-feedback" className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                    Your Thoughts &amp; Ideas <span className="text-rose-500">*</span>
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

                {/* Email / Contact (Optional) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label htmlFor="pilot-name" className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                      Name (Optional)
                    </label>
                    <input
                      id="pilot-name"
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Your name"
                      className="w-full px-3 py-2 bg-canvas-pure border border-ice-border rounded-lg text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="pilot-email" className="text-[10px] font-mono uppercase tracking-wider text-ink-muted block">
                      Email for Follow-up (Optional)
                    </label>
                    <input
                      id="pilot-email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className="w-full px-3 py-2 bg-canvas-pure border border-ice-border rounded-lg text-xs text-ink-navy focus:outline-none focus:border-cobalt transition-all"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 text-xs text-ink-muted hover:text-ink-navy font-medium rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || !feedback.trim()}
                    className="px-5 py-2.5 bg-cobalt hover:bg-cobalt-hover text-white text-xs font-bold rounded-lg transition-all shadow-premium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>{isSubmitting ? 'Submitting...' : 'Send Feedback'}</span>
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
