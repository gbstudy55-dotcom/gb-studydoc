import React from 'react';
import { Send, X, ExternalLink, ShieldCheck, Bell, Sparkles } from 'lucide-react';

interface TelegramModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TelegramModal: React.FC<TelegramModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-pink-500/30 bg-zinc-900/95 p-6 shadow-2xl pink-glow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top decorative pink glow */}
        <div className="absolute -top-16 -left-16 w-40 h-40 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -right-16 w-40 h-40 bg-pink-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/60 hover:bg-zinc-800 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with GB STUDY icon */}
        <div className="flex flex-col items-center text-center mt-2">
          <div className="relative mb-3">
            <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-pink-500 p-1 bg-zinc-950 pink-glow-sm">
              <img
                src="/logo.png"
                alt="GB STUDY"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div className="absolute -bottom-1 -right-1 p-1.5 bg-pink-600 rounded-full text-white shadow-lg">
              <Send className="w-4 h-4 fill-white" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/30 text-pink-400 text-xs font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>OFFICIAL TELEGRAM CHANNEL</span>
          </div>

          <h3 className="text-xl font-bold text-white tracking-tight">
            GB STUDY Official Telegram
          </h3>
          <p className="mt-1 text-xs text-zinc-300">
            Join now for instant class notifications, handwritten notes, DPPs, and test series updates!
          </p>
        </div>

        {/* Channel Benefits */}
        <div className="mt-5 space-y-2.5 bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-3.5 text-xs text-zinc-300">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Handwritten notes & formula sheets for all batches</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Bell className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Daily live class schedules & important exam alerts</span>
          </div>
          <div className="flex items-center gap-2.5">
            <Send className="w-4 h-4 text-pink-400 shrink-0" />
            <span>Direct Telegram community: <span className="text-pink-300 font-semibold">@GBFreestudy</span></span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 space-y-2.5">
          <a
            href="https://t.me/GBFreestudy"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-pink-600 to-rose-500 hover:from-pink-500 hover:to-rose-400 text-white font-bold text-xs shadow-lg shadow-pink-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Send className="w-4 h-4 fill-white" />
            <span>JOIN TELEGRAM (t.me/GBFreestudy)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
          >
            Continue to App
          </button>
        </div>
      </div>
    </div>
  );
};
