import React, { useState } from 'react';
import { X, Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { DecryptedPdf } from '../types';
import { getDecryptedPdfViewerUrl } from '../services/api';

interface PdfViewerModalProps {
  pdf: DecryptedPdf | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ pdf, onClose }) => {
  const [loading, setLoading] = useState(true);

  if (!pdf) return null;

  const viewerUrl = getDecryptedPdfViewerUrl(pdf.url, pdf.key);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden rounded-2xl border border-pink-500/30 bg-zinc-950 shadow-2xl pink-glow"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/90">
          <div className="flex items-center gap-2.5 min-w-0 pr-4">
            <div className="p-1.5 rounded-lg bg-pink-500/15 border border-pink-500/30 text-pink-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-white truncate">
              {pdf.title}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={viewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              download={`${pdf.title}.pdf`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </a>

            <a
              href={viewerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
              title="Open in new window"
            >
              <ExternalLink className="w-4 h-4" />
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

        {/* Embedded Viewer */}
        <div className="relative flex-1 w-full bg-zinc-900 overflow-hidden flex items-center justify-center">
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-950/80 z-10">
              <Loader2 className="w-8 h-8 text-pink-500 animate-spin mb-2" />
              <p className="text-xs font-medium text-zinc-300">Loading notes PDF...</p>
            </div>
          )}

          <iframe
            src={viewerUrl}
            title={pdf.title}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
          />
        </div>
      </div>
    </div>
  );
};
