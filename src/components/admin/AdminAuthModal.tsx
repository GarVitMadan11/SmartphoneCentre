import React, { useState, useRef } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusTrap';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AdminAuthModal({ isOpen, onClose, onSuccess }: AdminAuthModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const modalRef = useRef<HTMLDivElement>(null);
  useFocusTrap(modalRef, isOpen);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin === '9999') {
      setError('');
      setPin('');
      onSuccess();
    } else {
      setError('Invalid passcode. Access Denied.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="admin-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
    >
      <div ref={modalRef} className="bg-canvas-pure border border-ice-border rounded-lg max-w-sm w-full p-6 shadow-premium relative animate-fadeIn">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto" aria-hidden="true">
            <ShieldAlert className="w-6 h-6 text-red-500 animate-pulse" />
          </div>
          <div className="space-y-1">
            <h3 id="admin-modal-title" className="font-outfit font-light text-lg text-ink-navy">Admin Access Gate</h3>
            <p className="text-xs text-ink-muted">Authorized staff only. Enter security PIN to proceed.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            <div className="relative">
              <input
                type="password"
                placeholder="Enter PIN"
                value={pin}
                onChange={(e) => {
                  setError('');
                  setPin(e.target.value);
                }}
                className="w-full px-4 py-3 bg-canvas-white border border-ice-border rounded-sm text-center text-lg font-mono tracking-[0.3em] focus:border-cobalt focus:ring-0 text-ink-navy dark:text-zinc-200"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-xs font-mono font-bold text-red-550">
                {error}
              </p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 px-4 rounded-sm border border-ice-border text-xs font-mono text-ink-slate hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 rounded-sm bg-cobalt hover:bg-cobalt-hover text-white text-xs font-mono font-bold transition-all shadow-sm shadow-cobalt/20"
              >
                Unlock
              </button>
            </div>
          </form>
          <div className="pt-3 border-t border-dashed border-ice-border/40">
            <span className="text-[10px] font-mono text-zinc-550 dark:text-zinc-400 uppercase tracking-widest block">
              Authorized personnel only
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
