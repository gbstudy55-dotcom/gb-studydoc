import React, { useState, useRef } from 'react';
import { Send, ShieldCheck, BookOpen, Layers, Lock, LogIn, ChevronDown, Check, User } from 'lucide-react';
import { UserSession } from '../types';

interface NavbarProps {
  currentTab: 'my-batches' | 'all-batches';
  onTabChange: (tab: 'my-batches' | 'all-batches') => void;
  user: UserSession | null;
  sessions: UserSession[];
  activeSessionIndex: number;
  onSwitchSession: (index: number) => void;
  isAdmin: boolean;
  onOpenStudentLogin: () => void;
  onOpenAdminAuth: () => void;
  onOpenAdminPanel: () => void;
  onLockAdmin: () => void;
  onOpenTelegram: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  user,
  sessions,
  activeSessionIndex,
  onSwitchSession,
  isAdmin,
  onOpenStudentLogin,
  onOpenAdminAuth,
  onOpenAdminPanel,
  onLockAdmin,
  onOpenTelegram,
}) => {
  const [clickCount, setClickCount] = useState(0);
  const [showAccountDropdown, setShowAccountDropdown] = useState(false);
  const clickTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Secret 10-click handler on GB STUDY logo to trigger admin password modal
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

  const getAccountLabel = (idx: number) => {
    return idx === 0 ? 'GB Pro Server 1 (12th)' : 'GB Pro Server 2 (11th)';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-pink-900/30 bg-zinc-950/85 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        
        {/* Zone 1: GB STUDY Brand Wordmark & Secret 10-Click Logo */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={handleLogoClick}
            className="relative w-10 h-10 rounded-xl overflow-hidden border border-pink-500/50 p-0.5 bg-zinc-900 shadow-md shadow-pink-500/20 active:scale-95 transition-transform cursor-pointer group"
            title={clickCount > 0 ? `Click ${10 - clickCount} more times for Admin` : 'GB STUDY (Admin: 10 Clicks)'}
          >
            <img
              src="/logo.png"
              alt="GB STUDY"
              className="w-full h-full object-cover rounded-lg"
            />
            {clickCount > 2 && (
              <span className="absolute inset-0 bg-pink-600/50 backdrop-blur-xs flex items-center justify-center text-[10px] font-black text-white rounded-lg">
                {clickCount}/10
              </span>
            )}
          </button>
          
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-pink-400 via-rose-300 to-pink-500 bg-clip-text text-transparent">
              GB STUDY
            </span>
            <span className="text-[10px] tracking-wider text-pink-400/80 uppercase font-semibold">
              Live Classes & Notes
            </span>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 bg-zinc-900/80 border border-zinc-800/80 rounded-xl">
          <button
            onClick={() => onTabChange('my-batches')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              currentTab === 'my-batches'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>My Batches (11th & 12th)</span>
          </button>

          <button
            onClick={() => onTabChange('all-batches')}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              currentTab === 'all-batches'
                ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white shadow-md shadow-pink-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Courses</span>
          </button>
        </nav>

        {/* Zone 3: Telegram CTA, Student Login & Admin Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Telegram shortcut button */}
          <button
            onClick={onOpenTelegram}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 text-xs font-semibold transition-all hover:scale-105"
            title="Join Telegram Channel"
          >
            <Send className="w-3.5 h-3.5 fill-pink-400 text-pink-400" />
            <span className="hidden sm:inline">Telegram</span>
          </button>

          {/* Student Login Button: ANYONE can log in! */}
          <button
            onClick={onOpenStudentLogin}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-pink-500/40 text-zinc-200 text-xs font-semibold transition-all"
            title="Student Login / Add Account"
          >
            <LogIn className="w-3.5 h-3.5 text-pink-400" />
            <span>Student Login</span>
          </button>

          {/* Student Status Badge (Clean, no server numbers or account details exposed) */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-pink-500/10 border border-pink-500/25 text-pink-200 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Free Study Active</span>
          </div>

          {/* Admin Mode Badge & Quick Access (Only active when Admin has unlocked with GBADMIN2026) */}
          {isAdmin && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-800">
              <button
                onClick={onOpenAdminPanel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold shadow-md shadow-pink-600/30 transition-all hover:scale-105"
                title="Admin Control Panel (Logout & Account Management)"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Panel</span>
              </button>

              <button
                onClick={onLockAdmin}
                className="p-1.5 text-zinc-400 hover:text-rose-400 rounded-lg hover:bg-zinc-900 transition-colors"
                title="Lock Admin Mode"
                aria-label="Lock Admin"
              >
                <Lock className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile subnavigation bar */}
      <div className="flex md:hidden border-t border-zinc-800/80 px-4 py-2 bg-zinc-950/90 justify-center gap-2">
        <button
          onClick={() => onTabChange('my-batches')}
          className={`flex-1 py-1.5 text-xs font-semibold text-center rounded-lg transition-all ${
            currentTab === 'my-batches'
              ? 'bg-pink-600 text-white'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
        >
          My Batches
        </button>
        <button
          onClick={() => onTabChange('all-batches')}
          className={`flex-1 py-1.5 text-xs font-semibold text-center rounded-lg transition-all ${
            currentTab === 'all-batches'
              ? 'bg-pink-600 text-white'
              : 'text-zinc-400 hover:text-white bg-zinc-900'
          }`}
        >
          All Courses
        </button>
      </div>
    </header>
  );
};
