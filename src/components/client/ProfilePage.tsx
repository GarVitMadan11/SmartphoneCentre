import React, { useState } from 'react';
import { User, Phone, Mail, Calendar, ArrowLeft, LogOut, ShieldCheck, AlertCircle } from 'lucide-react';
import { updateCustomerProfile } from '../../utils/api';

interface ProfilePageProps {
  user: any;
  onLogout: () => void;
  onUpdateUser: (updatedUser: any) => void;
  onNavigate: (path: string) => void;
}

export default function ProfilePage({ user, onLogout, onUpdateUser, onNavigate }: ProfilePageProps) {
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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
    <div className="max-w-4xl mx-auto px-4 py-8 text-left">
      
      {/* Header Back button */}
      <div className="mb-6 flex justify-between items-center">
        <button
          onClick={() => onNavigate('/')}
          className="flex items-center gap-1.5 text-xs text-cobalt hover:underline font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
        </button>
        <button
          onClick={onLogout}
          className="flex items-center gap-1.5 text-xs text-red-500 hover:text-red-600 transition-colors font-medium border border-red-500/20 px-3 py-1.5 rounded-sm hover:bg-red-500/5"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* Left Side: Summary Card */}
        <div className="md:col-span-5 bg-canvas-pure border border-ice-border rounded-xl p-6 shadow-3d-card space-y-6">
          <div className="text-center pb-4 border-b border-ice-border/40">
            <div className="w-16 h-16 bg-cobalt/10 text-cobalt border border-cobalt/20 rounded-full flex items-center justify-center mx-auto text-xl font-bold font-outfit mb-3">
              {user?.name ? user.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <h3 className="text-lg font-bold text-ink-navy font-outfit">{user?.name}</h3>
            <span className="text-[10px] font-mono tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2 py-0.5 rounded-full inline-block mt-1 font-semibold uppercase">
              Customer Account
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Email */}
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-sm bg-ice-gray/40 border border-ice-border/30 flex items-center justify-center text-ink-muted flex-shrink-0">
                <Mail className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] font-mono tracking-wider text-ink-muted uppercase block">Email Address</span>
                <span className="text-ink-navy font-medium">{user?.email}</span>
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

        {/* Right Side: Edit Form */}
        <div className="md:col-span-7 bg-canvas-pure border border-ice-border rounded-xl p-6 sm:p-8 shadow-3d-card space-y-6">
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
                className="px-6 py-2.5 bg-cobalt hover:bg-cobalt-hover text-white rounded-sm font-bold text-xs transition-all shadow-premium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving Changes...' : 'Save Settings'}
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}
