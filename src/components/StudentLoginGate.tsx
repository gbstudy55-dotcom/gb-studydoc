import React, { useState, useRef } from 'react';
import { 
  LogIn, 
  Phone, 
  Lock, 
  Sparkles, 
  AlertCircle, 
  Loader2, 
  ShieldCheck, 
  Eye, 
  EyeOff, 
  Server, 
  CheckCircle2, 
  Radio, 
  BookOpen, 
  Send, 
  ExternalLink,
  Flame,
  KeyRound
} from 'lucide-react';
import { loginUser, PRESET_ACCOUNTS } from '../services/api';
import { UserSession } from '../types';

interface StudentLoginGateProps {
  onLoginSuccess: (session: UserSession, autoConnectBoth?: boolean) => void;
  onOpenAdminAuth: () => void;
}

export const StudentLoginGate: React.FC<StudentLoginGateProps> = ({
  onLoginSuccess,
  onOpenAdminAuth,
}) => {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Secret 10-click handler on GB STUDY logo for Admin password modal
  const [clickCount, setClickCount] = useState(0);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogoClick = () => {
    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }
    const nextCount = clickCount + 1;
    if (nextCount >= 10) {
      setClickCount(0);
      onOpenAdminAuth();
    } else {
      setClickCount(nextCount);
      clickTimerRef.current = setTimeout(() => {
        setClickCount(0);
      }, 4000);
    }
  };

  const handleFormLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || !password.trim()) {
      setError('Please enter your mobile number and password.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const session = await loginUser(phone, password);
      onLoginSuccess(session, false);
    } catch (err: any) {
      setError(err?.message || 'Login failed. Please verify your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickConnect = async (presetIndex: number) => {
    const acc = PRESET_ACCOUNTS[presetIndex];
    if (!acc) return;
    setLoading(true);
    setError(null);
    try {
      const session = await loginUser(acc.phone, acc.password);
      onLoginSuccess(session, false);
    } catch (err: any) {
      setError(err?.message || 'Unable to connect to verified server. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectBoth = async () => {
    setLoading(true);
    setError(null);
    try {
      const s1 = await loginUser(PRESET_ACCOUNTS[0].phone, PRESET_ACCOUNTS[0].password);
      const s2 = await loginUser(PRESET_ACCOUNTS[1].phone, PRESET_ACCOUNTS[1].password);
      onLoginSuccess(s1, true);
    } catch (err: any) {
      setError(err?.message || 'Failed to connect servers. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col justify-between bg-[#0b090d] text-zinc-100 selection:bg-pink-500 selection:text-white relative overflow-hidden">
      {/* Background glowing ambient light blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-pink-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-rose-600/15 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute top-[40%] right-[30%] w-[350px] h-[350px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Top minimal bar with logo and secret admin access hint */}
      <header className="relative z-10 w-full max-w-6xl mx-auto px-4 sm:px-6 py-6 flex items-center justify-between">
        <div 
          onClick={handleLogoClick}
          className="flex items-center gap-3 cursor-pointer group select-none"
          title="GB STUDY (Tap 10 times for Admin Access)"
        >
          <div className="relative w-11 h-11 rounded-2xl overflow-hidden border-2 border-pink-500/80 bg-zinc-950 p-1 pink-glow-sm group-hover:scale-105 transition-transform">
            <img src="/logo.png" alt="GB STUDY" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white group-hover:text-pink-300 transition-colors">
                GB STUDY
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30">
                PORTAL
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Bihar Board 11th & 12th</p>
          </div>
        </div>

        {clickCount > 2 && (
          <div className="text-[10px] font-mono px-2 py-1 rounded bg-zinc-900 border border-pink-500/30 text-pink-300 animate-pulse">
            Admin taps: {clickCount}/10
          </div>
        )}

        <a
          href="https://t.me/GBFreestudy"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white text-xs font-semibold transition-colors"
        >
          <Send className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
          <span>Telegram</span>
          <ExternalLink className="w-3 h-3 opacity-70" />
        </a>
      </header>

      {/* Main Container */}
      <main className="relative z-10 flex-1 flex items-center justify-center px-4 sm:px-6 py-6">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Information & Feature Highlights */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-semibold">
              <Flame className="w-3.5 h-3.5 text-pink-400 fill-pink-400" />
              <span>Student Authentication Required</span>
            </div>

            <div className="space-y-3">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
                Unlock Complete Access to <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">GB STUDY</span>
              </h1>
              <p className="text-sm sm:text-base text-zinc-300 leading-relaxed">
                Log in to your student account to access full 11th & 12th Science batches, live streams, chapter-wise handwritten notes, and recorded classes.
              </p>
            </div>

            {/* Feature Cards Grid */}
            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0 text-rose-400">
                  <Radio className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Live Stream & Upcoming Classes</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Watch live broadcasts or access upcoming schedules and completed video archives for every batch.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="w-9 h-9 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center shrink-0 text-pink-400">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">11th & 12th Science Complete Syllabus</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Physics, Chemistry, Biology, Mathematics, Hindi & English handwritten PDF notes and video solutions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center shrink-0 text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Verified Server Access</h4>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    One-click fast connection to verified servers with high-speed video streaming.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Login Card */}
          <div className="lg:col-span-6 w-full">
            <div className="relative overflow-hidden rounded-3xl border border-pink-500/30 bg-zinc-900/90 p-6 sm:p-8 shadow-2xl pink-glow">
              
              <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <LogIn className="w-5 h-5 text-pink-400" />
                    <span>Student Login</span>
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Choose 1-Click Connect or enter your credentials
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* 1-Click Quick Connectors */}
              <div className="mt-5 space-y-2.5">
                <div className="text-[11px] font-bold text-zinc-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                  <span>Quick 1-Click Server Connectors:</span>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickConnect(0)}
                    className="p-3 rounded-2xl border border-zinc-800 hover:border-pink-500/60 bg-zinc-950/80 hover:bg-zinc-900 text-left transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-pink-300 group-hover:text-pink-200 flex items-center gap-1.5">
                        <img src="/logo.png" alt="GB" className="w-4 h-4 rounded object-cover shrink-0" />
                        <span>GB Pro Server 1</span>
                      </span>
                      <Server className="w-3.5 h-3.5 text-pink-400" />
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">
                      12th Science Access
                    </div>
                  </button>

                  <button
                    type="button"
                    disabled={loading}
                    onClick={() => handleQuickConnect(1)}
                    className="p-3 rounded-2xl border border-zinc-800 hover:border-pink-500/60 bg-zinc-950/80 hover:bg-zinc-900 text-left transition-all group disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-pink-300 group-hover:text-pink-200 flex items-center gap-1.5">
                        <img src="/logo.png" alt="GB" className="w-4 h-4 rounded object-cover shrink-0" />
                        <span>GB Pro Server 2</span>
                      </span>
                      <Server className="w-3.5 h-3.5 text-pink-400" />
                    </div>
                    <div className="text-[10px] text-zinc-400 mt-1">
                      11th Science Access
                    </div>
                  </button>
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleConnectBoth}
                  className="w-full py-2.5 px-3 rounded-2xl border border-pink-500/40 bg-pink-500/10 hover:bg-pink-500/20 text-pink-300 hover:text-white font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4 text-pink-400" />
                  <span>Connect Both Servers (11th & 12th Full Access)</span>
                </button>
              </div>

              {/* Divider */}
              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-800" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-zinc-900 px-2 text-zinc-500 font-bold">Or enter credentials</span>
                </div>
              </div>

              {/* Credentials Login Form */}
              <form onSubmit={handleFormLogin} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Mobile Number / Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-zinc-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Enter mobile number"
                      className="w-full pl-10 pr-4 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
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
                      className="w-full pl-10 pr-10 py-2.5 bg-zinc-950/80 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition-colors"
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
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      <span>Login to GB STUDY</span>
                    </>
                  )}
                </button>
              </form>

              {/* Security guarantee note */}
              <div className="mt-4 pt-3 border-t border-zinc-800/80 flex items-center justify-between text-[11px] text-zinc-500">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-pink-400" />
                  Protected & Encrypted Session
                </span>
                <span>Active 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 w-full border-t border-zinc-900 bg-zinc-950/60 py-4 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>GB STUDY • Bihar Board 11th & 12th Educational Portal</span>
          <a
            href="https://t.me/GBFreestudy"
            target="_blank"
            rel="noopener noreferrer"
            className="text-pink-400 hover:text-pink-300 font-medium"
          >
            Join Telegram @GBFreestudy
          </a>
        </div>
      </footer>
    </div>
  );
};
