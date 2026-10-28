import React from 'react';
import { Film, FileText, Award, Calendar, ArrowRight, CheckCircle2 } from 'lucide-react';
import { BatchItem } from '../types';

interface BatchCardProps {
  batch: BatchItem;
  onSelect: (batch: BatchItem) => void;
}

export const BatchCard: React.FC<BatchCardProps> = ({ batch, onSelect }) => {
  return (
    <div 
      onClick={() => onSelect(batch)}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/60 hover:bg-zinc-900 hover:border-pink-500/50 transition-all duration-300 hover:shadow-xl hover:shadow-pink-500/10 cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-zinc-950">
        {batch.thumbnail ? (
          <img
            src={batch.thumbnail}
            alt={batch.batch_name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
            referrerPolicy="no-referrer"
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/logo.png';
            }}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-zinc-900 via-pink-950/20 to-zinc-900">
            <img src="/logo.png" alt="GB STUDY" className="w-16 h-16 opacity-60" />
          </div>
        )}

        {/* Gradient Scrim */}
        <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80" />

        {/* Price / Enrolled indicator */}
        <div className="absolute top-3 right-3">
          {batch.is_enrolled ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-pink-600/90 backdrop-blur-md text-white text-xs font-bold shadow">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Enrolled (Active)</span>
            </span>
          ) : batch.price ? (
            <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-950/80 border border-zinc-700/80 backdrop-blur-md text-pink-400 text-xs font-bold">
              ₹{batch.price}
            </span>
          ) : null}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 sm:p-5">
        <h3 className="text-base font-bold text-white group-hover:text-pink-300 transition-colors line-clamp-2 leading-snug">
          {batch.batch_name}
        </h3>

        {/* Metadata */}
        <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-zinc-400">
          {batch.videos_count ? (
            <span className="inline-flex items-center gap-1">
              <Film className="w-3.5 h-3.5 text-pink-400" />
              <span className="tabular-nums">{batch.videos_count}</span> Lectures
            </span>
          ) : null}

          {batch.videos_count && batch.files_count ? <span aria-hidden="true" className="text-zinc-600">·</span> : null}

          {batch.files_count ? (
            <span className="inline-flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-pink-400" />
              <span className="tabular-nums">{batch.files_count}</span> Notes (PDFs)
            </span>
          ) : null}

          {batch.tests_count ? (
            <>
              <span aria-hidden="true" className="text-zinc-600">·</span>
              <span className="inline-flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-pink-400" />
                <span className="tabular-nums">{batch.tests_count}</span> Tests
              </span>
            </>
          ) : null}
        </div>

        {/* Date line & Verification Tag */}
        <div className="mt-2 flex flex-col gap-1 text-xs text-zinc-500">
          {batch.end_date && (
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Validity: {batch.end_date}</span>
            </div>
          )}
          {batch.is_enrolled && (
            <div className="text-[11px] text-pink-400 font-medium flex items-center gap-1.5">
              <img src="/logo.png" alt="GB" className="w-3.5 h-3.5 rounded object-cover shrink-0" />
              <span>GB Pro Verified Batch • Full Access</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="mt-auto pt-4">
          <button
            type="button"
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-zinc-800/90 group-hover:bg-gradient-to-r group-hover:from-pink-600 group-hover:to-rose-600 text-zinc-200 group-hover:text-white font-semibold text-xs transition-all shadow-sm group-hover:shadow-pink-600/30"
          >
            <span>Open Batch & Study</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
};
