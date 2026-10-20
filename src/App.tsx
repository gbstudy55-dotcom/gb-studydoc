import React, { useState, useEffect } from 'react';
import { 
  Search, 
  BookOpen, 
  Layers, 
  Send, 
  Sparkles, 
  Loader2, 
  ArrowRight,
  ExternalLink,
  Flame,
  CheckCircle2,
  ShieldCheck,
  LogIn
} from 'lucide-react';
import { BatchItem, DecryptedPdf, DecryptedVideo, FolderContentItem, UserSession } from './types';
import { 
  getCatalogBatches, 
  fetchCombinedEnrolledBatches,
  loginUser, 
  getVideoDetails, 
  getPdfDetails, 
  PRESET_ACCOUNTS 
} from './services/api';
import { Navbar } from './components/Navbar';
import { BatchCard } from './components/BatchCard';
import { BatchView } from './components/BatchView';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { PdfViewerModal } from './components/PdfViewerModal';
import { StudentLoginModal } from './components/StudentLoginModal';
import { AdminPasswordModal } from './components/AdminPasswordModal';
import { AdminAccountsModal } from './components/AdminAccountsModal';
import { TelegramModal } from './components/TelegramModal';
import { 
  PRELOADED_SESSIONS, 
  ALL_PRELOADED_BATCHES, 
  ENROLLED_PRELOADED_BATCHES 
} from './data/defaultBatches';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'my-batches' | 'all-batches'>('my-batches');

  // Multi-session accounts state (Preloaded with verified GB Pro servers so batches appear immediately)
  const [sessions, setSessions] = useState<UserSession[]>(() => {
    try {
      const stored = localStorage.getItem('gb_study_sessions');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const legacy = localStorage.getItem('gb_study_user');
      if (legacy) return [JSON.parse(legacy)];
    } catch {}
    return PRELOADED_SESSIONS;
  });

  const [activeSessionIndex, setActiveSessionIndex] = useState<number>(0);
  const activeUser = sessions[activeSessionIndex] || sessions[0] || null;

  // Student Login Modal state (Accessible to everyone!)
  const [isStudentLoginOpen, setIsStudentLoginOpen] = useState(false);

  // Admin Mode state (Unlocked ONLY with GBADMIN2026 after 10 clicks on logo)
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('gb_study_admin_auth') === 'true';
    } catch {
      return false;
    }
  });

  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [isAdminAccountsOpen, setIsAdminAccountsOpen] = useState(false);

  // Pre-embedded batches so that 0 network delay occurs on Vercel
  const [enrolledBatches, setEnrolledBatches] = useState<BatchItem[]>(ENROLLED_PRELOADED_BATCHES);
  const [catalogBatches, setCatalogBatches] = useState<BatchItem[]>(ALL_PRELOADED_BATCHES);
  const [loadingBatches, setLoadingBatches] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');

  // Modals & Navigation state
  const [selectedBatch, setSelectedBatch] = useState<BatchItem | null>(null);
  const [currentVideo, setCurrentVideo] = useState<DecryptedVideo | null>(null);
  const [activeLectureList, setActiveLectureList] = useState<FolderContentItem[]>([]);
  const [currentLectureIndex, setCurrentLectureIndex] = useState<number>(-1);
  const [currentPdf, setCurrentPdf] = useState<DecryptedPdf | null>(null);
  const [isTelegramOpen, setIsTelegramOpen] = useState(false);
  const [videoLoading, setVideoLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);

  // Auto-connect verified GB Pro servers (11th & 12th) on boot so every student can study without needing to log in
  useEffect(() => {
    async function initVerifiedServers() {
      try {
        const existingServerIds = new Set(sessions.map((s) => s.serverId || s.userId));
        const neededPresets = PRESET_ACCOUNTS.filter((_, idx) => {
          const sId = idx === 0 ? 'server-1' : 'server-2';
          return !existingServerIds.has(sId);
        });

        if (neededPresets.length > 0) {
          const newSessions: UserSession[] = [...sessions];
          for (const acc of neededPresets) {
            try {
              const sess = await loginUser(acc.phone, acc.password);
              if (!newSessions.some((s) => (s.serverId && s.serverId === sess.serverId) || s.userId === sess.userId)) {
                newSessions.push(sess);
              }
            } catch (e) {
              console.warn('Auto-connect status:', e);
            }
          }

          if (newSessions.length > sessions.length) {
            setSessions(newSessions);
            localStorage.setItem('gb_study_sessions', JSON.stringify(newSessions));
            localStorage.setItem('gb_study_user', JSON.stringify(newSessions[0]));
          }
        }
      } catch (err) {
        console.warn('Verified servers initialization:', err);
      }
    }
    initVerifiedServers();
  }, []);

  // Fetch combined enrolled batches for all active sessions & catalog in background
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        const [catalog, combinedEnrolled] = await Promise.all([
          getCatalogBatches(),
          sessions.length > 0 ? fetchCombinedEnrolledBatches(sessions) : Promise.resolve([]),
        ]);

        if (isMounted) {
          if (Array.isArray(catalog) && catalog.length > 0) {
            setCatalogBatches(catalog);
          }
          if (Array.isArray(combinedEnrolled) && combinedEnrolled.length > 0) {
            const merged = new Map<string, BatchItem>();
            for (const b of ENROLLED_PRELOADED_BATCHES) {
              merged.set(b.id, b);
            }
            for (const b of combinedEnrolled) {
              merged.set(b.id, b);
            }
            setEnrolledBatches(Array.from(merged.values()));
          }
        }
      } catch (err) {
        console.warn('Background batches refresh notice:', err);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [sessions]);

  // Show Telegram popup once on session after 2.5 seconds dwell
  useEffect(() => {
    const hasSeenTg = sessionStorage.getItem('gb_seen_telegram_popup');
    if (!hasSeenTg) {
      const timer = setTimeout(() => {
        setIsTelegramOpen(true);
        sessionStorage.setItem('gb_seen_telegram_popup', 'true');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Student Login Success Handler (Anyone can log in and add accounts!)
  const handleStudentLoginSuccess = async (session: UserSession, autoConnectBoth?: boolean) => {
    if (autoConnectBoth) {
      const s1 = await loginUser(PRESET_ACCOUNTS[0].phone, PRESET_ACCOUNTS[0].password).catch(() => null);
      const s2 = await loginUser(PRESET_ACCOUNTS[1].phone, PRESET_ACCOUNTS[1].password).catch(() => null);
      const list = [s1, s2].filter(Boolean) as UserSession[];
      setSessions(list);
      localStorage.setItem('gb_study_sessions', JSON.stringify(list));
      localStorage.setItem('gb_study_user', JSON.stringify(list[0]));
      setActiveSessionIndex(0);
      return;
    }

    const existingIndex = sessions.findIndex((s) => s.userId === session.userId || (s.serverId && s.serverId === session.serverId));
    let updated: UserSession[];
    if (existingIndex >= 0) {
      updated = [...sessions];
      updated[existingIndex] = session;
      setActiveSessionIndex(existingIndex);
    } else {
      updated = [session, ...sessions];
      setActiveSessionIndex(0);
    }
    setSessions(updated);
    localStorage.setItem('gb_study_sessions', JSON.stringify(updated));
    localStorage.setItem('gb_study_user', JSON.stringify(updated[0]));
  };

  // Admin authentication handlers (10 Clicks on Logo -> Password GBADMIN2026)
  const handleAdminAuthSuccess = () => {
    setIsAdmin(true);
    sessionStorage.setItem('gb_study_admin_auth', 'true');
    setIsAdminAuthOpen(false);
    setIsAdminAccountsOpen(true);
  };

  const handleLockAdmin = () => {
    setIsAdmin(false);
    sessionStorage.removeItem('gb_study_admin_auth');
    setIsAdminAccountsOpen(false);
  };

  // Admin account management handlers (Only Admin can logout!)
  const handleAddSession = (session: UserSession) => {
    handleStudentLoginSuccess(session, false);
  };

  const handleRemoveSession = (index: number) => {
    const updated = sessions.filter((_, idx) => idx !== index);
    setSessions(updated);
    localStorage.setItem('gb_study_sessions', JSON.stringify(updated));
    if (updated.length > 0) {
      setActiveSessionIndex(0);
      localStorage.setItem('gb_study_user', JSON.stringify(updated[0]));
    } else {
      localStorage.removeItem('gb_study_user');
      setEnrolledBatches([]);
      setCurrentTab('all-batches');
    }
  };

  const handleLogoutAll = () => {
    setSessions([]);
    localStorage.removeItem('gb_study_sessions');
    localStorage.removeItem('gb_study_user');
    setEnrolledBatches([]);
    setCurrentTab('all-batches');
  };

  // Play video with multi-session resolution
  const handlePlayVideo = async (
    courseId: string,
    videoId: string,
    allLectureItems: FolderContentItem[]
  ) => {
    setVideoLoading(true);
    try {
      const videoData = await getVideoDetails(
        courseId,
        videoId,
        sessions
      );
      setCurrentVideo(videoData);
      setActiveLectureList(allLectureItems);
      const idx = allLectureItems.findIndex((it) => it.id === videoId);
      setCurrentLectureIndex(idx);
    } catch (err) {
      console.error('Failed to load video:', err);
    } finally {
      setVideoLoading(false);
    }
  };

  // Open PDF with multi-session resolution
  const handleOpenPdf = async (courseId: string, fileId: string) => {
    setPdfLoading(true);
    try {
      const pdfData = await getPdfDetails(
        courseId,
        fileId,
        sessions
      );
      if (pdfData) {
        setCurrentPdf(pdfData);
      } else {
        alert('The link for this notes PDF is currently unavailable.');
      }
    } catch (err) {
      console.error('Failed to load PDF:', err);
    } finally {
      setPdfLoading(false);
    }
  };

  // Previous lecture
  const handlePrevLecture = () => {
    if (currentLectureIndex > 0 && selectedBatch) {
      const prevItem = activeLectureList[currentLectureIndex - 1];
      handlePlayVideo(selectedBatch.id, prevItem.id, activeLectureList);
    }
  };

  // Next lecture
  const handleNextLecture = () => {
    if (currentLectureIndex < activeLectureList.length - 1 && selectedBatch) {
      const nextItem = activeLectureList[currentLectureIndex + 1];
      handlePlayVideo(selectedBatch.id, nextItem.id, activeLectureList);
    }
  };

  const currentPool = currentTab === 'my-batches' ? enrolledBatches : catalogBatches;
  const activePool = currentPool && currentPool.length > 0
    ? currentPool
    : (currentTab === 'my-batches' ? ENROLLED_PRELOADED_BATCHES : ALL_PRELOADED_BATCHES);
  const displayedBatches = activePool && activePool.length > 0 ? activePool : ALL_PRELOADED_BATCHES;

  const filteredBatches = displayedBatches.filter((b) => {
    const name = (b.batch_name || b.course_name || '').toLowerCase();
    const matchesSearch = name.includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (categoryFilter === 'ALL') return true;
    if (categoryFilter === '12TH') return name.includes('12th') || name.includes('12वीं');
    if (categoryFilter === '11TH') return name.includes('11th') || name.includes('11वीं');
    if (categoryFilter === 'SCIENCE') return name.includes('science') || name.includes('विज्ञान');
    if (categoryFilter === 'ARTS') return name.includes('arts') || name.includes('आर्ट्स');
    if (categoryFilter === 'COMMERCE') return name.includes('commerce') || name.includes('कॉमर्स');
    if (categoryFilter === 'CRASH') return name.includes('क्रैश') || name.includes('crash');
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col bg-[#0b090d] text-zinc-100">
      
      {/* Top Navbar with Student Login for all, and 10-Click Secret Admin Access on Logo */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(tab) => {
          setSelectedBatch(null);
          setCurrentTab(tab);
        }}
        user={activeUser}
        sessions={sessions}
        activeSessionIndex={activeSessionIndex}
        onSwitchSession={(idx) => setActiveSessionIndex(idx)}
        isAdmin={isAdmin}
        onOpenStudentLogin={() => setIsStudentLoginOpen(true)}
        onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
        onOpenAdminPanel={() => setIsAdminAccountsOpen(true)}
        onLockAdmin={handleLockAdmin}
        onOpenTelegram={() => setIsTelegramOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-20">
        {selectedBatch ? (
          <BatchView
            batch={selectedBatch}
            user={sessions}
            onBack={() => setSelectedBatch(null)}
            onPlayVideo={handlePlayVideo}
            onOpenPdf={handleOpenPdf}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            
            {/* Hero Banner Section */}
            <div className="relative overflow-hidden rounded-3xl border border-pink-500/20 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-pink-950/30 p-6 sm:p-8 lg:p-10 shadow-2xl pink-glow-sm">
              <div className="absolute top-0 right-0 w-96 h-96 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />
              
              <div className="relative z-10 max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300 text-xs font-semibold">
                  <img src="/logo.png" alt="GB" className="w-4 h-4 rounded object-cover inline-block" />
                  <span>GB STUDY • Complete 11th & 12th Study Materials & Lectures</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
                  Bihar Board 11th & 12th <span className="bg-gradient-to-r from-pink-400 to-rose-400 bg-clip-text text-transparent">Batches Unlocked</span>
                </h1>

                <p className="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl">
                  Access comprehensive Class 11th & 12th Science live & recorded lectures, 
                  chapter-wise handwritten notes (PDFs), and test series all in one place.
                </p>

                {/* Multi-Account Status Bar */}
                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  {sessions.map((sess, idx) => (
                    <div
                      key={sess.userId + idx}
                      onClick={() => setActiveSessionIndex(idx)}
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        idx === activeSessionIndex
                          ? 'border-pink-500/60 bg-pink-500/15 text-pink-200'
                          : 'border-zinc-800 bg-zinc-950/60 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <img src="/logo.png" alt="GB" className="w-3.5 h-3.5 rounded object-cover inline-block" />
                      <span>
                        GB Pro Server {idx + 1}: <strong className="text-white">{idx === 0 ? '12th Science (Full Access)' : '11th Science (Full Access)'}</strong>
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quick stats & Actions */}
                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <a
                    href="https://t.me/GBFreestudy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-lg shadow-pink-600/30 transition-all hover:scale-105"
                  >
                    <Send className="w-4 h-4 fill-white" />
                    <span>Join Official Telegram</span>
                    <ExternalLink className="w-3.5 h-3.5 opacity-80" />
                  </a>

                  {/* Student Login Button */}
                  <button
                    onClick={() => setIsStudentLoginOpen(true)}
                    className="px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-semibold transition-colors flex items-center gap-1.5 border border-zinc-700/60"
                  >
                    <LogIn className="w-3.5 h-3.5 text-pink-400" />
                    <span>Student Login / Connect</span>
                  </button>

                  {/* Admin Mode Quick Access (Only when Admin is authenticated) */}
                  {isAdmin && (
                    <button
                      onClick={() => setIsAdminAccountsOpen(true)}
                      className="px-4 py-2.5 rounded-xl bg-pink-600/20 hover:bg-pink-600/30 text-pink-200 text-xs font-bold transition-colors flex items-center gap-1.5 border border-pink-500/40"
                    >
                      <ShieldCheck className="w-4 h-4 text-pink-400" />
                      <span>Admin Control Panel</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              {/* Category Filter Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                {[
                  { id: 'ALL', label: 'All Batches' },
                  { id: '12TH', label: 'Class 12th' },
                  { id: '11TH', label: 'Class 11th' },
                  { id: 'SCIENCE', label: 'Science' },
                  { id: 'ARTS', label: 'Arts' },
                  { id: 'COMMERCE', label: 'Commerce' },
                  { id: 'CRASH', label: 'Crash Course' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                      categoryFilter === cat.id
                        ? 'bg-pink-600 text-white shadow-md shadow-pink-600/30'
                        : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search batches by name..."
                  className="w-full pl-9 pr-4 py-2 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
              </div>
            </div>

            {/* Batches Section Title */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-pink-400" />
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {currentTab === 'my-batches' ? 'My Enrolled Batches (11th & 12th Science)' : 'All Available Batches (Full Catalog)'}
                </h2>
                <span className="text-xs text-zinc-400 tabular-nums">
                  ({filteredBatches.length})
                </span>
              </div>

              {currentTab === 'my-batches' && (
                <button
                  onClick={() => setCurrentTab('all-batches')}
                  className="text-xs font-semibold text-pink-400 hover:text-pink-300 flex items-center gap-1"
                >
                  <span>View All Batches</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Batches Grid */}
            {loadingBatches ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-3" />
                <p className="text-sm font-semibold text-zinc-300">Loading batches...</p>
                <p className="text-xs text-zinc-500 mt-1">Retrieving enrolled courses from verified servers</p>
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center p-6">
                <Layers className="w-12 h-12 text-zinc-600 mb-3" />
                <h3 className="text-base font-bold text-white">No Batches Found</h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm">
                  {searchQuery
                    ? 'No batches match your search query.'
                    : 'No enrolled batches currently loaded. Check all courses catalog.'}
                </p>
                {currentTab === 'my-batches' && (
                  <button
                    onClick={() => setCurrentTab('all-batches')}
                    className="mt-4 px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-semibold hover:bg-pink-500 transition-colors"
                  >
                    View All Available Batches
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredBatches.map((batch) => (
                  <BatchCard
                    key={batch.id}
                    batch={batch}
                    onSelect={(b) => setSelectedBatch(b)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Floating Telegram Action Button */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          onClick={() => setIsTelegramOpen(true)}
          className="flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold text-xs shadow-xl shadow-pink-600/40 hover:scale-105 transition-all pink-glow"
        >
          <img src="/logo.png" alt="GB" className="w-4 h-4 rounded-full object-cover shrink-0" />
          <span>GB Telegram</span>
        </button>
      </div>

      {/* Video Player Modal */}
      <VideoPlayerModal
        video={currentVideo}
        onClose={() => setCurrentVideo(null)}
        onOpenPdf={(url, key, title) => {
          setCurrentPdf({ url, key, title: title || 'Lecture Notes' });
        }}
        onPrevLecture={handlePrevLecture}
        onNextLecture={handleNextLecture}
        hasPrev={currentLectureIndex > 0}
        hasNext={currentLectureIndex < activeLectureList.length - 1}
      />

      {/* PDF Viewer Modal */}
      <PdfViewerModal
        pdf={currentPdf}
        onClose={() => setCurrentPdf(null)}
      />

      {/* Student Login Modal (Accessible to anyone to log in and add accounts) */}
      <StudentLoginModal
        isOpen={isStudentLoginOpen}
        onClose={() => setIsStudentLoginOpen(false)}
        onLoginSuccess={handleStudentLoginSuccess}
      />

      {/* Admin Password Verification Modal (Triggered by 10 clicks on GB STUDY logo, requires GBADMIN2026) */}
      <AdminPasswordModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={handleAdminAuthSuccess}
      />

      {/* Admin Control Panel Modal (Exclusive: Only Admin can logout or manage unlimited accounts) */}
      <AdminAccountsModal
        isOpen={isAdminAccountsOpen}
        onClose={() => setIsAdminAccountsOpen(false)}
        sessions={sessions}
        activeSessionIndex={activeSessionIndex}
        onSwitchSession={(idx) => setActiveSessionIndex(idx)}
        onAddSession={handleAddSession}
        onRemoveSession={handleRemoveSession}
        onLogoutAll={handleLogoutAll}
        onLockAdmin={handleLockAdmin}
      />

      {/* Telegram Channel Popup Modal */}
      <TelegramModal
        isOpen={isTelegramOpen}
        onClose={() => setIsTelegramOpen(false)}
      />

      {/* Global Loading Overlay for Video or PDF Decryption */}
      {(videoLoading || pdfLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="flex flex-col items-center bg-zinc-900 border border-pink-500/30 p-5 rounded-2xl shadow-xl pink-glow-sm">
            <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
            <span className="text-xs font-semibold text-white">
              {videoLoading ? 'Loading lecture stream...' : 'Preparing notes PDF...'}
            </span>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-6 px-4 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="GB STUDY" className="w-5 h-5 rounded" />
            <span className="text-zinc-400 font-bold">GB STUDY</span>
            <span>• Education for Everyone</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <a
              href="https://t.me/GBFreestudy"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-pink-400 flex items-center gap-1 transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Official Telegram: @GBFreestudy</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
