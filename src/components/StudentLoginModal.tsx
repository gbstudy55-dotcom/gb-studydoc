import React, { useState } from 'react';
import { LogIn, X, Phone, Lock, Sparkles, AlertCircle, Loader2, ShieldCheck, Eye, EyeOff, Server } from 'lucide-react';
import { loginUser, PRESET_ACCOUNTS } from '../services/api';
import { UserSession } from '../types';

interface StudentLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (session: UserSession, autoConnectBoth?: boolean) => void;
}

export const StudentLoginModal: React.FC<StudentLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
}) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) {
      setError('Please enter both mobile number and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await loginUser(phone, password);
      onLoginSuccess(session, false);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Login failed! Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectPreset = async (accountIndex: number) => {
    const acc = PRESET_ACCOUNTS[accountIndex];
    if (!acc) return;
    setLoading(true);
    setError(null);
    try {
      const session = await loginUser(acc.phone, acc.password);
      onLoginSuccess(session, false);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to connect server.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBoth = async () => {
    setLoading(true);
    setError(null);
    try {
      const session1 = await loginUser(PRESET_ACCOUNTS[0].phone, PRESET_ACCOUNTS[0].password);
      const session2 = await loginUser(PRESET_ACCOUNTS[1].phone, PRESET_ACCOUNTS[1].password);
      onLoginSuccess(session1, true);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to connect servers.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-pink-500/30 bg-zinc-900/95 p-6 shadow-2xl pink-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Brand header */}
        <div className="flex flex-col items-center text-center mt-1">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-pink-500 p-1 bg-zinc-950 mb-3 pink-glow-sm">
            <img src="/logo.png" alt="GB STUDY" className="w-full h-full object-cover rounded-xl" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">Student Login</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Login with your mobile number and password to access your batches, notes & live streams.
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Fast Connect Options */}
        <div className="mt-5 space-y-2">
          <div className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1.5 px-0.5">
            <Sparkles className="w-3.5 h-3.5 text-pink-400" />
            <span>Quick 1-Click Server Connectors:</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleConnectPreset(0)}
              className="p-2.5 rounded-xl border border-zinc-800 hover:border-pink-500/60 bg-zinc-950/70 hover:bg-zinc-900 text-left transition-all group disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-300 group-hover:text-pink-200 flex items-center gap-1.5">
                  <img src="/logo.png" alt="GB" className="w-4 h-4 rounded object-cover shrink-0" />
                  <span>GB Pro Server 1</span>
                </span>
                <Server className="w-3.5 h-3.5 text-pink-400" />
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                12th Science Batches
              </div>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => handleConnectPreset(1)}
              className="p-2.5 rounded-xl border border-zinc-800 hover:border-pink-500/60 bg-zinc-950/70 hover:bg-zinc-900 text-left transition-all group disabled:opacity-50"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-pink-300 group-hover:text-pink-200 flex items-center gap-1.5">
                  <img src="/logo.png" alt="GB" className="w-4 h-4 rounded object-cover shrink-0" />
                  <span>GB Pro Server 2</span>
                </span>
                <Server className="w-3.5 h-3.5 text-pink-400" />
              </div>
              <div className="text-[10px] text-zinc-400 mt-1">
                11th Science Batches
              </div>
            </button>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={handleConnectBoth}
            className="w-full py-2 px-3 rounded-xl border border-pink-500/40 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 hover:text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Connect Both Servers (11th & 12th Full Access)</span>
          </button>
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-zinc-900 px-2 text-zinc-500 font-bold">Or enter credentials</span>
          </div>
        </div>

        {/* Standard Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Mobile Number / Email
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Phone className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter 10-digit mobile number"
                className="w-full pl-10 pr-4 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                autoComplete="username"
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
                placeholder="Enter password"
                className="w-full pl-10 pr-10 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                autoComplete="current-password"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-md shadow-pink-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Logging in...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                <span>Login to GB STUDY</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-[10px] text-zinc-500">
          Encrypted & Protected • Session will remain active
        </div>
      </div>
    </div>
  );
};
