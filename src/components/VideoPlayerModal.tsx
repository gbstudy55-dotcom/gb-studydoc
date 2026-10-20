import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  FileText, 
  Download, 
  Send, 
  ArrowLeft, 
  ArrowRight, 
  Play, 
  Pause, 
  RotateCcw, 
  RotateCw, 
  Volume2, 
  VolumeX, 
  Maximize, 
  Gauge, 
  Settings2 
} from 'lucide-react';
import type Hls from 'hls.js';
import { DecryptedVideo, FolderContentItem } from '../types';
import { getDecryptedPdfViewerUrl } from '../services/api';

interface VideoPlayerModalProps {
  video: DecryptedVideo | null;
  onClose: () => void;
  onOpenPdf: (pdfUrl: string, key?: string, title?: string) => void;
  onPrevLecture?: () => void;
  onNextLecture?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  video,
  onClose,
  onOpenPdf,
  onPrevLecture,
  onNextLecture,
  hasPrev,
  hasNext,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<any>(null);

  const [currentQualityUrl, setCurrentQualityUrl] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);

  // Initialize stream URL when video changes
  useEffect(() => {
    if (!video) return;
    setVideoError(null);
    const initialUrl = video.activeStreamUrl || (video.streamQualities?.[0]?.url) || (video.videoUrls?.[0]) || '';
    setCurrentQualityUrl(initialUrl);
  }, [video]);

  // Handle HLS stream setup safely on video element (SSR/Vite/Rolldown safe)
  useEffect(() => {
    if (!video || !currentQualityUrl || video.youtubeId || video.playerUrl) return;

    const videoEl = videoRef.current;
    if (!videoEl) return;

    if (hlsRef.current) {
      try {
        hlsRef.current.destroy();
      } catch {}
      hlsRef.current = null;
    }

    let isCancelled = false;
    const isHlsStream = currentQualityUrl.includes('.m3u8') || currentQualityUrl.includes('media-proxy');

    async function loadStream() {
      // 1. Check native HLS support first (Safari / iOS devices)
      if (videoEl?.canPlayType('application/vnd.apple.mpegurl')) {
        videoEl.src = currentQualityUrl;
        videoEl.play().catch(() => {});
        setIsPlaying(true);
        return;
      }

      // 2. If HLS stream, dynamically load HLS.js at runtime
      if (isHlsStream && typeof window !== 'undefined') {
        try {
          const hlsModule = await import('hls.js');
          const HlsClass = hlsModule.default || hlsModule;

          if (isCancelled || !videoRef.current) return;

          if (HlsClass && HlsClass.isSupported && HlsClass.isSupported()) {
            const hls = new HlsClass({
              enableWorker: true,
              lowLatencyMode: false,
              backBufferLength: 90,
            });

            hlsRef.current = hls;
            hls.loadSource(currentQualityUrl);
            hls.attachMedia(videoEl);

            hls.on(HlsClass.Events.MANIFEST_PARSED, () => {
              if (!isCancelled && videoRef.current) {
                videoRef.current.play().catch(() => {});
                setIsPlaying(true);
              }
            });

            hls.on(HlsClass.Events.ERROR, (_: any, data: any) => {
              if (data?.fatal) {
                switch (data.type) {
                  case HlsClass.ErrorTypes.NETWORK_ERROR:
                    hls.startLoad();
                    break;
                  case HlsClass.ErrorTypes.MEDIA_ERROR:
                    hls.recoverMediaError();
                    break;
                  default:
                    hls.destroy();
                    setVideoError('Error loading video stream. Please switch quality.');
                    break;
                }
              }
            });
            return;
          }
        } catch (err) {
          console.warn('HLS.js dynamic import fallback:', err);
        }
      }

      // 3. Fallback: Direct assignment
      if (!isCancelled && videoEl) {
        videoEl.src = currentQualityUrl;
        videoEl.play().catch(() => {});
        setIsPlaying(true);
      }
    }

    loadStream();

    return () => {
      isCancelled = true;
      if (hlsRef.current) {
        try {
          hlsRef.current.destroy();
        } catch {}
        hlsRef.current = null;
      }
    };
  }, [currentQualityUrl, video]);

  if (!video) return null;

  const togglePlay = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
      setIsPlaying(true);
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const skipSeconds = (seconds: number) => {
    const el = videoRef.current;
    if (el) {
      el.currentTime = Math.max(0, el.currentTime + seconds);
    }
  };

  const handleSpeedChange = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
    setShowSpeedMenu(false);
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  const handleFullscreen = () => {
    const el = videoRef.current;
    if (!el) return;
    if (el.requestFullscreen) {
      el.requestFullscreen();
    }
  };

  const isEmbedPlayer = Boolean(video.youtubeId || video.playerUrl);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/92 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl max-h-[96vh] flex flex-col overflow-hidden rounded-2xl border border-pink-500/30 bg-zinc-950 shadow-2xl pink-glow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="w-7 h-7 rounded-lg overflow-hidden border border-pink-500/40 p-0.5 bg-zinc-950 shrink-0">
              <img src="/logo.png" alt="GB STUDY" className="w-full h-full object-cover rounded" />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                {video.isLive && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-600 text-white text-[9px] font-extrabold animate-pulse shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-white" />
                    <span>LIVE NOW</span>
                  </span>
                )}
                <h2 className="text-xs sm:text-sm font-bold text-white truncate">
                  {video.title}
                </h2>
              </div>
              {video.duration && !video.isLive && (
                <span className="text-[10px] text-pink-400 font-medium">
                  Duration: {video.duration}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://t.me/GBFreestudy"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/30 text-pink-300 text-xs font-semibold"
            >
              <img src="/logo.png" alt="GB" className="w-3.5 h-3.5 rounded object-cover" />
              <span>GB Telegram</span>
            </a>

            <button
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player Display */}
        <div className="relative aspect-video w-full bg-black flex items-center justify-center overflow-hidden group">
          {video.youtubeId ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1`}
              title={video.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          ) : video.playerUrl ? (
            <iframe
              src={video.playerUrl}
              title={video.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
            />
          ) : currentQualityUrl ? (
            <div className="relative w-full h-full flex items-center justify-center">
              <video
                ref={videoRef}
                playsInline
                controls
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              >
                Your browser does not support the video tag.
              </video>

              {videoError && (
                <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center p-4 text-center z-20">
                  <p className="text-sm font-semibold text-rose-400">{videoError}</p>
                  {video.streamQualities && video.streamQualities.length > 1 && (
                    <div className="mt-3 flex gap-2">
                      {video.streamQualities.map((q) => (
                        <button
                          key={q.quality}
                          onClick={() => {
                            setVideoError(null);
                            setCurrentQualityUrl(q.url);
                          }}
                          className="px-3 py-1 rounded bg-pink-600 text-xs font-bold text-white hover:bg-pink-500"
                        >
                          Play {q.quality}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center text-zinc-400">
              <Play className="w-12 h-12 text-pink-500 mb-3 animate-pulse" />
              <p className="text-sm font-semibold text-white">Loading lecture stream...</p>
              <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                If the video does not load automatically, please view attached notes or contact Telegram support.
              </p>
            </div>
          )}
        </div>

        {/* Video Control Bar & Quality Selector for Direct/HLS Video */}
        {!isEmbedPlayer && currentQualityUrl && (
          <div className="px-4 py-2 bg-zinc-900 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Quick Seek and Playback Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={togglePlay}
                className="p-1.5 rounded-lg bg-pink-600 text-white hover:bg-pink-500 transition-colors"
                title={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
              </button>

              <button
                onClick={() => skipSeconds(-10)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Rewind 10 seconds"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => skipSeconds(10)}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Forward 10 seconds"
              >
                <RotateCw className="w-4 h-4" />
              </button>

              <button
                onClick={handleToggleMute}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Quality and Speed Dropdowns */}
            <div className="flex items-center gap-2">
              {/* Quality Switcher */}
              {video.streamQualities && video.streamQualities.length > 0 && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setShowQualityMenu(!showQualityMenu);
                      setShowSpeedMenu(false);
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-pink-400" />
                    <span>
                      {video.streamQualities.find(s => s.url === currentQualityUrl)?.quality || 'Quality'}
                    </span>
                  </button>

                  {showQualityMenu && (
                    <div className="absolute right-0 bottom-full mb-1 w-28 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-30">
                      {video.streamQualities.map((q) => (
                        <button
                          key={q.quality}
                          onClick={() => {
                            setCurrentQualityUrl(q.url);
                            setShowQualityMenu(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-pink-600/30 transition-colors font-medium ${
                            q.url === currentQualityUrl ? 'text-pink-400 font-bold bg-pink-500/10' : 'text-zinc-300'
                          }`}
                        >
                          {q.quality}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Speed Switcher */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowSpeedMenu(!showSpeedMenu);
                    setShowQualityMenu(false);
                  }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold"
                >
                  <Gauge className="w-3.5 h-3.5 text-pink-400" />
                  <span>{playbackRate}x</span>
                </button>

                {showSpeedMenu && (
                  <div className="absolute right-0 bottom-full mb-1 w-24 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl overflow-hidden z-30">
                    {[0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handleSpeedChange(rate)}
                        className={`w-full text-left px-3 py-1.5 hover:bg-pink-600/30 transition-colors font-medium ${
                          playbackRate === rate ? 'text-pink-400 font-bold bg-pink-500/10' : 'text-zinc-300'
                        }`}
                      >
                        {rate}x
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleFullscreen}
                className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
                title="Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Bottom Details, Lecture Navigation & Attached Notes */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          {/* Lecture Navigation */}
          <div className="flex items-center gap-2">
            {hasPrev && onPrevLecture && (
              <button
                onClick={onPrevLecture}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Previous Lecture</span>
              </button>
            )}

            {hasNext && onNextLecture && (
              <button
                onClick={onNextLecture}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-semibold transition-colors shadow-sm"
              >
                <span>Next Lecture</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Attached PDF / Notes Action */}
          {video.pdfUrl ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => onOpenPdf(video.pdfUrl!, video.pdfKey, `${video.title} - Notes`)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-pink-500/15 hover:bg-pink-500/25 border border-pink-500/40 text-pink-300 hover:text-white text-xs font-bold transition-all shadow-sm"
              >
                <FileText className="w-3.5 h-3.5 text-pink-400" />
                <span>View Lecture Notes (PDF)</span>
              </button>

              <a
                href={getDecryptedPdfViewerUrl(video.pdfUrl, video.pdfKey)}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="p-2 text-zinc-400 hover:text-pink-400 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                title="Download PDF"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          ) : (
            <div className="text-xs text-zinc-500">
              GB STUDY • Dedicated Learning, Guaranteed Success
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
