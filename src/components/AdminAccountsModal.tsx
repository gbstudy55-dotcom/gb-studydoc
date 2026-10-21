import React, { useState } from 'react';
import { 
  X, 
  LogIn, 
  Phone, 
  Lock, 
  Trash2, 
  Check, 
  ShieldCheck, 
  Plus, 
  AlertCircle, 
  Loader2, 
  Server, 
  Users, 
  LogOut, 
  Eye, 
  EyeOff,
  Sparkles
} from 'lucide-react';
import { UserSession } from '../types';
import { loginUser, PRESET_ACCOUNTS } from '../services/api';

interface AdminAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: UserSession[];
  activeSessionIndex: number;
  onSwitchSession: (index: number) => void;
  onAddSession: (session: UserSession) => void;
  onRemoveSession: (index: number) => void;
  onLogoutAll: () => void;
  onLockAdmin: () => void;
}

export const AdminAccountsModal: React.FC<AdminAccountsModalProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionIndex,
  onSwitchSession,
  onAddSession,
  onRemoveSession,
  onLogoutAll,
  onLockAdmin,
}) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCustomLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) {
      setError('Please provide both phone/email and password.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const session = await loginUser(phone, password);
      onAddSession(session);
      setPhone('');
      setPassword('');
      setSuccessMessage('Account added successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPreset = async (index: number) => {
    const preset = PRESET_ACCOUNTS[index];
    if (!preset) return;

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const session = await loginUser(preset.phone, preset.password);
      onAddSession(session);
      setSuccessMessage(`${preset.label} connected successfully!`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect preset server.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBothPresets = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const sess1 = await loginUser(PRESET_ACCOUNTS[0].phone, PRESET_ACCOUNTS[0].password);
      const sess2 = await loginUser(PRESET_ACCOUNTS[1].phone, PRESET_ACCOUNTS[1].password);
      onAddSession(sess1);
      onAddSession(sess2);
      setSuccessMessage('Both Pro Servers connected successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect servers.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden rounded-2xl border border-pink-500/40 bg-zinc-950 shadow-2xl pink-glow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl overflow-hidden border border-pink-500/40 p-0.5 bg-zinc-950 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="GB" className="w-full h-full object-cover rounded-lg" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">
                  Admin Control Panel
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-bold border border-pink-500/30 flex items-center gap-1">
                  <img src="/logo.png" alt="GB" className="w-3 h-3 rounded object-cover" />
                  <span>GB ADMIN</span>
                </span>
              </div>
              <p className="text-[11px] text-zinc-400">
                Manage accounts, add unlimited logins, switch sessions, or logout.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onLockAdmin();
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white text-xs font-semibold transition-colors"
              title="Lock Admin Mode"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Lock Admin</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 text-zinc-400 hover:text-white rounded-xl bg-zinc-800 hover:bg-zinc-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Section 1: Active Connected Accounts */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Users className="w-4 h-4 text-pink-400" />
                <span>Currently Connected Accounts ({sessions.length})</span>
              </div>
              {sessions.length > 0 && (
                <button
                  type="button"
                  onClick={onLogoutAll}
                  className="text-[11px] font-semibold text-rose-400 hover:text-rose-300 flex items-center gap-1 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Logout All Accounts</span>
                </button>
              )}
            </div>

            {sessions.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-zinc-800 text-center text-xs text-zinc-500">
                No active accounts connected. Add an account below to unlock batches.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {sessions.map((sess, idx) => {
                  const isActive = idx === activeSessionIndex;
                  return (
                    <div
                      key={sess.userId + idx}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isActive
                          ? 'border-pink-500/70 bg-pink-500/10 text-white'
                          : 'border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:border-zinc-700'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <div className="flex items-center gap-1.5">
                          <img src="/logo.png" alt="GB" className="w-4 h-4 rounded object-cover shrink-0" />
                          <span className="text-xs font-bold truncate">
                            Account {idx + 1}
                          </span>
                          {isActive && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-600 text-white font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                          ID: {sess.userId} • {sess.name}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {!isActive && (
                          <button
                            type="button"
                            onClick={() => onSwitchSession(idx)}
                            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-[11px] font-semibold transition-colors"
                          >
                            Switch
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onRemoveSession(idx)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-800 transition-colors"
                          title="Remove session"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section 2: Quick Preset Connectors */}
          <div className="space-y-2.5 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span>Quick Preset Connectors (1-Click Add)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleConnectPreset(0)}
                className="p-3 rounded-xl border border-zinc-800 hover:border-pink-500/50 bg-zinc-900/80 hover:bg-zinc-850 text-left transition-all group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-300 group-hover:text-pink-200">
                    GB Pro Server 1 (12th Science)
                  </span>
                  <Server className="w-3.5 h-3.5 text-pink-400" />
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">
                  Connect 12th Science batches & 2,638+ lectures
                </div>
              </button>

              <button
                type="button"
                disabled={loading}
                onClick={() => handleConnectPreset(1)}
                className="p-3 rounded-xl border border-zinc-800 hover:border-pink-500/50 bg-zinc-900/80 hover:bg-zinc-850 text-left transition-all group disabled:opacity-50"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-pink-300 group-hover:text-pink-200">
                    GB Pro Server 2 (11th Science)
                  </span>
                  <Server className="w-3.5 h-3.5 text-pink-400" />
                </div>
                <div className="text-[10px] text-zinc-400 mt-1">
                  Connect 11th Science live & recorded batches
                </div>
              </button>
            </div>

            <button
              type="button"
              disabled={loading}
              onClick={handleConnectBothPresets}
              className="w-full py-2.5 px-3 rounded-xl border border-pink-500/40 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Connect Both Pro Servers (11th & 12th All Batches)</span>
            </button>
          </div>

          {/* Section 3: Add Custom Account (Unlimited) */}
          <div className="space-y-3 pt-2 border-t border-zinc-800/80">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Plus className="w-4 h-4 text-pink-400" />
              <span>Add New Account (Unlimited Logins)</span>
            </div>

            <form onSubmit={handleCustomLogin} className="space-y-3 bg-zinc-900/40 border border-zinc-800/80 p-4 rounded-xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Phone / Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter mobile or email"
                      className="w-full pl-10 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter account password"
                      className="w-full pl-10 pr-10 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-zinc-400 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-pink-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Logging in & adding session...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Login & Add Account</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 border-t border-zinc-800/80 bg-zinc-900/60 flex items-center justify-between text-[11px] text-zinc-500">
          <span>GB STUDY Master Admin Access Active</span>
          <span>Security Key: Verified</span>
        </div>
      </div>
    </div>
  );
};
