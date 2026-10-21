import React, { useState } from 'react';
import { ShieldCheck, X, Lock, AlertCircle, Loader2, KeyRound } from 'lucide-react';

interface AdminPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminPasswordModal: React.FC<AdminPasswordModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    setTimeout(() => {
      // Secret Admin verification password
      if (password.trim() === 'GBADMIN2026') {
        setLoading(false);
        setPassword('');
        onSuccess();
      } else {
        setLoading(false);
        setError('Invalid Admin Password! Access Denied.');
      }
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-pink-500/40 bg-zinc-950 p-6 shadow-2xl pink-glow"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex flex-col items-center text-center mt-1">
          <div className="w-14 h-14 rounded-2xl bg-zinc-950 border border-pink-500/40 p-1 flex items-center justify-center mb-3 shadow-lg shadow-pink-500/20">
            <img src="/logo.png" alt="GB" className="w-full h-full object-cover rounded-xl" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">Admin Authentication</h2>
          <p className="mt-1 text-xs text-zinc-400">
            Enter the master admin password to unlock account management.
          </p>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Admin Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter admin password"
                className="w-full pl-10 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors font-mono"
                autoFocus
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Verify & Unlock Admin</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-4 text-center text-[10px] text-zinc-600">
          Protected Area • Authorized Personnel Only
        </div>
      </div>
    </div>
  );
};
