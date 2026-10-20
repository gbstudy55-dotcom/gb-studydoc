import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Folder, 
  Play, 
  FileText, 
  ExternalLink, 
  Search, 
  ChevronRight, 
  Loader2, 
  Sparkles,
  Layers,
  Radio,
  Clock,
  Tv
} from 'lucide-react';
import { BatchItem, BreadcrumbStep, FolderContentItem, UserSession } from '../types';
import { getFolderContents } from '../services/api';

interface BatchViewProps {
  batch: BatchItem;
  user: UserSession | UserSession[] | null;
  onBack: () => void;
  onPlayVideo: (courseId: string, videoId: string, allLectureItems: FolderContentItem[]) => void;
  onOpenPdf: (courseId: string, fileId: string) => void;
}

export const BatchView: React.FC<BatchViewProps> = ({
  batch,
  user,
  onBack,
  onPlayVideo,
  onOpenPdf,
}) => {
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbStep[]>([
    { id: '-1', title: 'Home' },
  ]);
  const [items, setItems] = useState<FolderContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [systemTab, setSystemTab] = useState<'LIVE' | 'UPCOMING' | 'COMPLETED' | 'ALL' | 'PDF'>('ALL');

  const currentFolder = breadcrumbs[breadcrumbs.length - 1];

  useEffect(() => {
    let isMounted = true;
    async function loadContents() {
      setLoading(true);
      const data = await getFolderContents(batch.id, currentFolder.id, user);
      if (isMounted) {
        setItems(data);
        setLoading(false);
      }
    }
    loadContents();
    return () => {
      isMounted = false;
    };
  }, [batch.id, currentFolder.id, user]);

  const handleOpenFolder = (folderId: string, title: string) => {
    setBreadcrumbs((prev) => [...prev, { id: folderId, title }]);
    setSearchQuery('');
  };

  const handleBreadcrumbClick = (index: number) => {
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
    setSearchQuery('');
  };

  const handleGoBackStep = () => {
    if (breadcrumbs.length > 1) {
      setBreadcrumbs((prev) => prev.slice(0, prev.length - 1));
      setSearchQuery('');
    } else {
      onBack();
    }
  };

  // Identify Live, Upcoming, and Completed items in current folder
  const currentLiveItems = items.filter(
    (it) => it.live_status === 1 || (Array.isArray(it.livestream_links) && it.livestream_links.length > 0)
  );

  const currentUpcomingItems = items.filter(
    (it) => it.live_status === 2 || (it.event_date && new Date(it.event_date).getTime() > Date.now())
  );

  const currentCompletedItems = items.filter(
    (it) => it.material_type === 'VIDEO' && it.live_status !== 1 && it.live_status !== 2
  );

  // Filter items based on active system tab and search query
  const displayedItems = items.filter((item) => {
    const matchesSearch = item.Title.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;

    if (systemTab === 'ALL') return true;
    if (systemTab === 'LIVE') {
      return item.live_status === 1 || (Array.isArray(item.livestream_links) && item.livestream_links.length > 0);
    }
    if (systemTab === 'UPCOMING') {
      return item.live_status === 2 || (item.event_date && new Date(item.event_date).getTime() > Date.now());
    }
    if (systemTab === 'COMPLETED') {
      return item.material_type === 'VIDEO' && item.live_status !== 1 && item.live_status !== 2;
    }
    if (systemTab === 'PDF') {
      return item.material_type === 'PDF';
    }
    return true;
  });

  const lectureItems = items.filter((it) => it.material_type === 'VIDEO' || it.live_status === 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Batch Header Bar */}
      <div className="relative overflow-hidden rounded-2xl border border-pink-500/20 bg-gradient-to-r from-zinc-900 via-zinc-900/90 to-pink-950/20 p-5 sm:p-6 pink-glow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <button
              onClick={handleGoBackStep}
              className="p-2.5 rounded-xl bg-zinc-800 hover:bg-pink-600/20 hover:border-pink-500/40 border border-zinc-700/60 text-zinc-300 hover:text-pink-300 transition-all shrink-0"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-pink-400">
                <img src="/logo.png" alt="GB" className="w-4 h-4 rounded object-cover inline-block" />
                <span>GB STUDY • LIVE STREAM & BATCH PORTAL</span>
                {batch.videos_count ? (
                  <span className="text-zinc-400 font-normal">
                    · <strong className="text-pink-300">{batch.videos_count}</strong> Total Lectures
                  </span>
                ) : null}
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight mt-0.5">
                {batch.batch_name}
              </h1>
            </div>
          </div>

          <button
            onClick={onBack}
            className="text-xs font-semibold text-zinc-400 hover:text-white px-3.5 py-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 transition-colors shrink-0"
          >
            ← All Batches Catalog
          </button>
        </div>

        {/* Breadcrumb Trail */}
        <div className="mt-4 flex flex-wrap items-center gap-1.5 text-xs text-zinc-400 border-t border-zinc-800/80 pt-3">
          <button
            onClick={onBack}
            className="hover:text-pink-400 transition-colors font-medium"
          >
            Batches
          </button>
          <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />

          {breadcrumbs.map((step, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={step.id}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />}
                {isLast ? (
                  <span className="font-bold text-pink-400 max-w-[200px] sm:max-w-xs truncate">
                    {step.title}
                  </span>
                ) : (
                  <button
                    onClick={() => handleBreadcrumbClick(idx)}
                    className="hover:text-pink-400 transition-colors font-medium max-w-[150px] truncate"
                  >
                    {step.title}
                  </button>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Live Stream, Upcoming & Completed System Command Bar */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-rose-400" />
            <h2 className="text-sm font-bold text-white tracking-tight">
              Live Stream System (Live, Upcoming & Completed)
            </h2>
          </div>
          <span className="text-[11px] text-zinc-400">
            Active for every batch
          </span>
        </div>

        {/* 3 Main Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Card 1: Live Now */}
          <button
            onClick={() => setSystemTab('LIVE')}
            className={`group relative flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all ${
              systemTab === 'LIVE'
                ? 'border-rose-500 bg-rose-950/30 text-white shadow-xl shadow-rose-500/20'
                : 'border-zinc-800 bg-zinc-900/70 hover:bg-zinc-850 hover:border-zinc-700'
            }`}
          >
            <div className="relative w-11 h-11 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
              <Radio className="w-6 h-6 text-rose-400 animate-pulse" />
              {currentLiveItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-tight text-rose-400 flex items-center gap-1.5">
                  <span>🔴 Live Classes</span>
                  <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-rose-600/40 text-rose-200">
                    Live
                  </span>
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 font-bold text-rose-300">
                  {currentLiveItems.length}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 truncate mt-1">
                {currentLiveItems.length > 0 ? 'Live stream active • Watch now' : 'Currently off-air'}
              </div>
            </div>
          </button>

          {/* Card 2: Upcoming */}
          <button
            onClick={() => setSystemTab('UPCOMING')}
            className={`group flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all ${
              systemTab === 'UPCOMING'
                ? 'border-amber-500 bg-amber-950/30 text-white shadow-xl shadow-amber-500/20'
                : 'border-zinc-800 bg-zinc-900/70 hover:bg-zinc-850 hover:border-zinc-700'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-amber-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-tight text-amber-400 flex items-center gap-1.5">
                  <span>⏰ Upcoming Schedule</span>
                  <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-amber-600/40 text-amber-200">
                    Upcoming
                  </span>
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 font-bold text-amber-300">
                  {currentUpcomingItems.length}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 truncate mt-1">
                Scheduled live classes & timetables
              </div>
            </div>
          </button>

          {/* Card 3: Completed */}
          <button
            onClick={() => setSystemTab('COMPLETED')}
            className={`group flex items-center gap-3.5 p-4 rounded-2xl border text-left transition-all ${
              systemTab === 'COMPLETED'
                ? 'border-pink-500 bg-pink-950/30 text-white shadow-xl shadow-pink-500/20'
                : 'border-zinc-800 bg-zinc-900/70 hover:bg-zinc-850 hover:border-zinc-700'
            }`}
          >
            <div className="w-11 h-11 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center shrink-0">
              <Tv className="w-6 h-6 text-pink-400" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black tracking-tight text-pink-400 flex items-center gap-1.5">
                  <span>📼 Completed Lectures</span>
                  <span className="text-[10px] uppercase font-mono px-1 py-0.2 rounded bg-pink-600/40 text-pink-200">
                    Completed
                  </span>
                </span>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-pink-500/20 border border-pink-500/30 font-bold text-pink-300">
                  {currentCompletedItems.length}
                </span>
              </div>
              <div className="text-[11px] text-zinc-400 truncate mt-1">
                Recorded live stream lectures
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900/60 border border-zinc-800 p-3 rounded-2xl">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search content in this folder..."
            className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-pink-500 transition-colors"
          />
        </div>

        {/* Tab Switchers */}
        <div className="flex items-center gap-1 p-1 bg-zinc-950 rounded-xl border border-zinc-800/80 overflow-x-auto">
          <button
            onClick={() => setSystemTab('ALL')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              systemTab === 'ALL'
                ? 'bg-pink-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            All Folders ({items.length})
          </button>

          <button
            onClick={() => setSystemTab('LIVE')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap flex items-center gap-1.5 ${
              systemTab === 'LIVE'
                ? 'bg-rose-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span>Live ({currentLiveItems.length})</span>
          </button>

          <button
            onClick={() => setSystemTab('UPCOMING')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              systemTab === 'UPCOMING'
                ? 'bg-amber-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Upcoming ({currentUpcomingItems.length})
          </button>

          <button
            onClick={() => setSystemTab('COMPLETED')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              systemTab === 'COMPLETED'
                ? 'bg-pink-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Completed ({currentCompletedItems.length})
          </button>

          <button
            onClick={() => setSystemTab('PDF')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
              systemTab === 'PDF'
                ? 'bg-pink-600 text-white shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Notes (PDF)
          </button>
        </div>
      </div>

      {/* LIVE VIEW: Special Active Stream or Off-Air Standby View */}
      {systemTab === 'LIVE' && currentLiveItems.length === 0 && !loading && (
        <div className="relative overflow-hidden rounded-3xl border border-rose-500/30 bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-rose-950/20 p-8 sm:p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-lg shadow-rose-500/10">
            <Radio className="w-8 h-8 animate-pulse" />
          </div>

          <div className="max-w-md mx-auto space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold">
              <span>LIVE STREAM STANDBY</span>
            </div>
            <h3 className="text-xl font-bold text-white tracking-tight">
              No live stream is currently active for this batch
            </h3>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              As soon as the educator goes live, the broadcast will start playing here automatically. 
              Check the upcoming schedule to see scheduled class timings.
            </p>
          </div>

          <div className="pt-3 flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => setSystemTab('UPCOMING')}
              className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/30"
            >
              ⏰ View Upcoming Schedule
            </button>
            <button
              onClick={() => setSystemTab('COMPLETED')}
              className="px-5 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition-all"
            >
              📼 Watch Completed Lectures
            </button>
            <button
              onClick={() => setSystemTab('ALL')}
              className="px-5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 text-xs font-bold transition-all"
            >
              📁 Browse All Subject Folders
            </button>
          </div>
        </div>
      )}

      {/* UPCOMING VIEW: Empty State if no scheduled class in this folder */}
      {systemTab === 'UPCOMING' && currentUpcomingItems.length === 0 && !loading && (
        <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 text-center space-y-3">
          <Clock className="w-12 h-12 text-amber-500/60 mx-auto" />
          <h3 className="text-base font-bold text-white">No upcoming live classes scheduled in this folder</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Check the class timetable or explore recorded video lectures and chapter notes.
          </p>
          <div className="pt-2">
            <button
              onClick={() => setSystemTab('ALL')}
              className="px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-semibold hover:bg-pink-500 transition-colors"
            >
              Browse All Folders
            </button>
          </div>
        </div>
      )}

      {/* Content Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Loader2 className="w-10 h-10 text-pink-500 animate-spin mb-3" />
          <p className="text-sm font-semibold text-zinc-300">Loading batch contents...</p>
          <p className="text-xs text-zinc-500 mt-1">Retrieving live lectures and chapter study materials</p>
        </div>
      ) : displayedItems.length === 0 && systemTab !== 'LIVE' && systemTab !== 'UPCOMING' ? (
        <div className="flex flex-col items-center justify-center py-16 rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 text-center p-6">
          <Layers className="w-12 h-12 text-zinc-600 mb-3" />
          <h3 className="text-base font-bold text-white">No items found</h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-sm">
            {searchQuery
              ? `No content matching "${searchQuery}".`
              : 'No items available in this category inside this folder.'}
          </p>
          {breadcrumbs.length > 1 && (
            <button
              onClick={handleGoBackStep}
              className="mt-4 px-4 py-2 rounded-xl bg-pink-600 text-white text-xs font-semibold hover:bg-pink-500 transition-colors"
            >
              ← Return to previous folder
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {displayedItems.map((item) => {
            const isFolder = item.material_type === 'FOLDER';
            const isVideo = item.material_type === 'VIDEO';
            const isPdf = item.material_type === 'PDF';
            const isLink = item.material_type === 'LINK';
            const isLiveNow = item.live_status === 1 || (Array.isArray(item.livestream_links) && item.livestream_links.length > 0);
            const isUpcoming = item.live_status === 2;

            return (
              <div
                key={item.id}
                onClick={() => {
                  if (isFolder) {
                    handleOpenFolder(item.id, item.Title);
                  } else if (isVideo || isLiveNow) {
                    onPlayVideo(batch.id, item.id, lectureItems);
                  } else if (isPdf) {
                    onOpenPdf(batch.id, item.id);
                  } else if (isLink && item.file_link) {
                    window.open(item.file_link, '_blank');
                  }
                }}
                className={`group relative flex items-center gap-3.5 p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                  isLiveNow
                    ? 'border-rose-500/80 bg-rose-950/25 hover:bg-rose-950/35 shadow-md shadow-rose-500/15'
                    : isFolder
                    ? 'border-zinc-800 bg-zinc-900/70 hover:bg-zinc-850 hover:border-pink-500/40 hover:shadow-md hover:shadow-pink-500/10'
                    : isVideo
                    ? 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-pink-500/50 hover:shadow-md hover:shadow-pink-500/10'
                    : isPdf
                    ? 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 hover:border-amber-500/50'
                    : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900'
                }`}
              >
                {/* Icon box */}
                <div
                  className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    isLiveNow
                      ? 'bg-rose-500/25 text-rose-400 border border-rose-500/50 shadow'
                      : isFolder
                      ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30'
                      : isVideo
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : isPdf
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                  }`}
                >
                  {isLiveNow ? (
                    <Radio className="w-5 h-5 animate-pulse text-rose-400" />
                  ) : isFolder ? (
                    <Folder className="w-5 h-5 fill-pink-500/20" />
                  ) : isVideo ? (
                    <Play className="w-5 h-5 fill-rose-500/40" />
                  ) : isPdf ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <ExternalLink className="w-5 h-5" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    {isLiveNow ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-extrabold animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        <span>🔴 LIVE NOW</span>
                      </span>
                    ) : isUpcoming ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-bold">
                        <Clock className="w-2.5 h-2.5" />
                        <span>UPCOMING</span>
                      </span>
                    ) : isVideo ? (
                      <span className="text-[10px] text-zinc-500 font-medium">
                        📼 Completed / Recorded
                      </span>
                    ) : null}
                  </div>

                  <h4 className="text-xs sm:text-sm font-bold text-zinc-100 group-hover:text-pink-300 transition-colors line-clamp-2 leading-snug">
                    {item.Title}
                  </h4>

                  <div className="mt-1 flex items-center gap-2 text-[11px] text-zinc-500">
                    {isFolder ? (
                      <span>Open Folder</span>
                    ) : isLiveNow ? (
                      <span className="text-rose-400 font-bold flex items-center gap-1">
                        <span>🔴 Join Live Stream</span>
                      </span>
                    ) : isUpcoming ? (
                      <span className="text-amber-400 font-medium">
                        {item.event_date ? item.event_date : 'Scheduled Live Class'}
                      </span>
                    ) : isVideo ? (
                      <span className="text-rose-400/90 font-medium flex items-center gap-1">
                        <Play className="w-3 h-3 fill-rose-400/90" />
                        <span>Play Lecture</span>
                      </span>
                    ) : isPdf ? (
                      <span className="text-amber-400/90 font-medium">Read Notes PDF</span>
                    ) : (
                      <span>Open Link</span>
                    )}

                    {item.duration ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-zinc-400 truncate">{item.duration}</span>
                      </>
                    ) : item.date_and_time && !isUpcoming ? (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{item.date_and_time}</span>
                      </>
                    ) : null}
                  </div>
                </div>

                {/* Action Arrow */}
                <div className="shrink-0 text-zinc-500 group-hover:text-pink-400 transition-colors">
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
