import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, Shield, Check, X, AlertCircle, RefreshCw, 
  Trash2, Key, CheckCircle2, Lock, Mail, Smartphone, 
  Tablet, Watch, Zap, Truck, MessageSquare, CreditCard, ShieldCheck 
} from 'lucide-react';
import { 
  fetchAdminStaff, createAdminStaff, updateAdminStaff, deleteAdminStaff, 
  AdminStaffUser 
} from '../../../utils/api';

export const SERVICE_DEFINITIONS = [
  { key: 'smartphones', label: 'Smartphones Catalog', icon: Smartphone, group: 'Catalog & Inventory' },
  { key: 'tablets', label: 'Tablets Catalog', icon: Tablet, group: 'Catalog & Inventory' },
  { key: 'smartwatches', label: 'Smartwatches Catalog', icon: Watch, group: 'Catalog & Inventory' },
  { key: 'cashify', label: 'Cashify Market Monitor', icon: Zap, group: 'Market Intelligence' },
  { key: 'inspections', label: 'Doorstep Inspections', icon: Truck, group: 'Field Operations' },
  { key: 'support', label: 'Customer Support Desk', icon: MessageSquare, group: 'Customer Operations' },
  { key: 'finance', label: 'Payouts & Ledger Finance', icon: CreditCard, group: 'Finance & Banking' },
] as const;

export const StaffTab: React.FC = () => {
  const [staffList, setStaffList] = useState<AdminStaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal / Form state for adding staff
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('OPERATIONS_AGENT');
  const [newPermissions, setNewPermissions] = useState<string[]>(['inspections', 'support']);
  const [submitting, setSubmitting] = useState(false);

  // Edit / Password Reset modal state
  const [resetModalUser, setResetModalUser] = useState<AdminStaffUser | null>(null);
  const [newPasswordForUser, setNewPasswordForUser] = useState('');
  const [updatingUser, setUpdatingUser] = useState(false);

  const loadStaff = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchAdminStaff();
      setStaffList(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch team members.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmail.trim() || !newUsername.trim() || !newPassword.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      await createAdminStaff({
        email: newEmail.trim().toLowerCase(),
        username: newUsername.trim().toLowerCase(),
        password: newPassword.trim(),
        role: newRole,
        permissions: newRole === 'SUPER_ADMIN' 
          ? ['smartphones', 'tablets', 'smartwatches', 'cashify', 'inspections', 'support', 'finance', 'audit', 'staff']
          : newPermissions,
      });

      setSuccessMsg(`Team member ${newEmail} created successfully.`);
      setShowAddModal(false);
      setNewEmail('');
      setNewUsername('');
      setNewPassword('');
      setNewPermissions(['inspections', 'support']);
      await loadStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to create staff member.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTogglePermission = async (user: AdminStaffUser, serviceKey: string) => {
    if (user.role === 'SUPER_ADMIN') {
      alert('Master Admins already possess full access to all services.');
      return;
    }

    const currentPerms = new Set(user.permissions || []);
    if (currentPerms.has(serviceKey)) {
      currentPerms.delete(serviceKey);
    } else {
      currentPerms.add(serviceKey);
    }

    const updatedArray = Array.from(currentPerms);

    // Optimistic UI update
    setStaffList(prev => prev.map(u => u.id === user.id ? { ...u, permissions: updatedArray } : u));

    try {
      await updateAdminStaff(user.id, { permissions: updatedArray });
      setSuccessMsg(`Permissions updated for ${user.email}`);
    } catch (err: any) {
      setError(err.message || 'Failed to update service permissions.');
      await loadStaff();
    }
  };

  const handleToggleActive = async (user: AdminStaffUser) => {
    const newStatus = !user.active;
    if (!confirm(`${newStatus ? 'Activate' : 'Deactivate'} access for ${user.email}?`)) return;

    try {
      await updateAdminStaff(user.id, { active: newStatus });
      setSuccessMsg(`Account status updated for ${user.email}`);
      await loadStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to update account status.');
    }
  };

  const handleUnlockUser = async (user: AdminStaffUser) => {
    try {
      await updateAdminStaff(user.id, { password: 'UnlockAccountOnly' });
      setSuccessMsg(`Account unlocked for ${user.email}`);
      await loadStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to unlock account.');
    }
  };

  const handleDeleteUser = async (user: AdminStaffUser) => {
    if (!confirm(`Are you sure you want to permanently remove ${user.email}? This action cannot be undone.`)) return;

    try {
      await deleteAdminStaff(user.id);
      setSuccessMsg(`Account ${user.email} removed.`);
      await loadStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to delete user.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetModalUser || !newPasswordForUser.trim()) return;

    setUpdatingUser(true);
    try {
      await updateAdminStaff(resetModalUser.id, { password: newPasswordForUser.trim() });
      setSuccessMsg(`Password successfully updated for ${resetModalUser.email}`);
      setResetModalUser(null);
      setNewPasswordForUser('');
      await loadStaff();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password.');
    } finally {
      setUpdatingUser(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 font-outfit">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Users className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Staff & Service Access Control</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Founders and Master Admins maintain complete oversight. Explicitly grant or revoke access to specific operational services (Catalog, Inspections, Support, Finance) for employees and contractors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadStaff}
            disabled={loading}
            className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-slate-50 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm hover:shadow flex items-center gap-2 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            Add Staff Member
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto text-red-400 hover:text-red-700">✕</button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="ml-auto text-emerald-400 hover:text-emerald-800">✕</button>
        </div>
      )}

      {/* Staff Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Active Team Accounts ({staffList.length})
          </div>
          <div className="text-[11px] text-slate-400">
            Click service badges to toggle permissions instantly
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-6">Member Identity</th>
                <th className="py-3 px-4">Authority Tier</th>
                <th className="py-3 px-4">Service Permissions</th>
                <th className="py-3 px-4">Status & Security</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
              {staffList.map((user) => {
                const isMaster = user.role === 'SUPER_ADMIN';
                const isLocked = user.failedLoginAttempts >= 5;

                return (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Identity */}
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isMaster 
                            ? 'bg-amber-100 text-amber-700 border border-amber-300' 
                            : 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                        }`}>
                          {user.username.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{user.username}</span>
                            {isMaster && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-500 text-white tracking-wide uppercase">
                                Founder
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{user.email}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Authority Tier */}
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                        isMaster 
                          ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                          : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        <Shield className="w-3 h-3" />
                        {user.role}
                      </span>
                    </td>

                    {/* Granular Service Badges */}
                    <td className="py-4 px-4">
                      {isMaster ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
                          <ShieldCheck className="w-4 h-4" />
                          <span>All Services Authorized (Master Level)</span>
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {SERVICE_DEFINITIONS.map(svc => {
                            const hasAccess = (user.permissions || []).includes(svc.key);
                            const Icon = svc.icon;
                            return (
                              <button
                                key={svc.key}
                                onClick={() => handleTogglePermission(user, svc.key)}
                                title={`Click to ${hasAccess ? 'revoke' : 'grant'} ${svc.label}`}
                                className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                                  hasAccess
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-300 font-bold shadow-xs'
                                    : 'bg-slate-100 text-slate-400 border border-slate-200 hover:border-slate-300 line-through opacity-60'
                                }`}
                              >
                                <Icon className="w-3 h-3" />
                                <span>{svc.label.replace(' Catalog', '').replace(' Customer', '')}</span>
                                {hasAccess ? <Check className="w-2.5 h-2.5 ml-0.5" /> : <X className="w-2.5 h-2.5 ml-0.5" />}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    {/* Status & Security */}
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <button
                          onClick={() => handleToggleActive(user)}
                          disabled={isMaster}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            user.active 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          } ${!isMaster ? 'cursor-pointer hover:opacity-80' : ''}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${user.active ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          {user.active ? 'Active' : 'Suspended'}
                        </button>

                        {isLocked && (
                          <div className="flex items-center gap-1 text-[10px] text-red-600 font-semibold">
                            <Lock className="w-3 h-3" />
                            <span>Locked ({user.failedLoginAttempts} fails)</span>
                            <button
                              onClick={() => handleUnlockUser(user)}
                              className="text-indigo-600 hover:underline ml-1"
                            >
                              Unlock
                            </button>
                          </div>
                        )}

                        {user.lastLoginAt && (
                          <div className="text-[10px] text-slate-400">
                            Last seen: {new Date(user.lastLoginAt).toLocaleDateString('en-IN')}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setResetModalUser(user);
                            setNewPasswordForUser('');
                          }}
                          title="Reset Password"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                        >
                          <Key className="w-3.5 h-3.5" />
                        </button>

                        {!isMaster && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            title="Remove Member"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: ADD STAFF MEMBER ────────────────────────────────────────── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-lg p-6 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <UserPlus className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Add New Staff / Partner</h3>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Company Email</label>
                  <input
                    type="email"
                    required
                    value={newEmail}
                    onChange={e => setNewEmail(e.target.value)}
                    placeholder="e.g. employee@rephonix.in"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">Username / Handle</label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={e => setNewUsername(e.target.value)}
                    placeholder="e.g. rohit_ops"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Initial Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">Account Role</label>
                <select
                  value={newRole}
                  onChange={e => {
                    const r = e.target.value;
                    setNewRole(r);
                    if (r === 'SUPER_ADMIN') {
                      setNewPermissions(SERVICE_DEFINITIONS.map(s => s.key));
                    } else if (r === 'OPERATIONS_AGENT') {
                      setNewPermissions(['inspections', 'support']);
                    } else if (r === 'CATALOG_EDITOR') {
                      setNewPermissions(['smartphones', 'tablets', 'smartwatches', 'cashify']);
                    } else if (r === 'FINANCE_APPROVER') {
                      setNewPermissions(['finance']);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="OPERATIONS_AGENT">Operations & Field Logistics Agent</option>
                  <option value="CATALOG_EDITOR">Catalog & Pricing Manager</option>
                  <option value="FINANCE_APPROVER">Finance & Payout Approver</option>
                  <option value="SUPER_ADMIN">Master Admin / Partner (Full Unrestricted Access)</option>
                </select>
              </div>

              {/* Service Permissions Checklist */}
              {newRole !== 'SUPER_ADMIN' && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-800 block">
                    Select Services Explicitly Authorized for this Staff Member:
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {SERVICE_DEFINITIONS.map(svc => {
                      const isChecked = newPermissions.includes(svc.key);
                      const Icon = svc.icon;
                      return (
                        <label
                          key={svc.key}
                          className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs cursor-pointer transition-all ${
                            isChecked 
                              ? 'bg-indigo-50/70 border-indigo-300 font-bold text-indigo-900' 
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              if (isChecked) {
                                setNewPermissions(newPermissions.filter(k => k !== svc.key));
                              } else {
                                setNewPermissions([...newPermissions, svc.key]);
                              }
                            }}
                            className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500"
                          />
                          <Icon className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0" />
                          <span className="truncate">{svc.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Creating Account…' : 'Create Staff Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: PASSWORD RESET ─────────────────────────────────────────── */}
      {resetModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-sm">Reset Password</h3>
              <button onClick={() => setResetModalUser(null)} className="text-slate-400">✕</button>
            </div>
            <p className="text-xs text-slate-500">
              Set a new secure password for <strong className="text-slate-800">{resetModalUser.email}</strong>. This will also clear any account lockouts.
            </p>
            <form onSubmit={handleResetPassword} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPasswordForUser}
                  onChange={e => setNewPasswordForUser(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResetModalUser(null)}
                  className="px-3 py-1.5 text-xs text-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingUser}
                  className="px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl"
                >
                  {updatingUser ? 'Updating…' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffTab;
