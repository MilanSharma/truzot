"use client";
import { Download, Loader2 } from "lucide-react";

interface FloatingSelectionBarProps {
  selectedCount: number;
  downloading: boolean;
  downloadProgress?: { current: number; total: number };
  onSelectAll: () => void;
  onDownload: () => void;
  onClear: () => void;
}

export default function FloatingSelectionBar({
  selectedCount,
  downloading,
  downloadProgress,
  onSelectAll,
  onDownload,
  onClear,
}: FloatingSelectionBarProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-[#0E1016] text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-6 border border-white/10 animate-in slide-in-from-bottom-8">
      <div className="text-sm font-bold">
        <span className="text-lime-400">{selectedCount}</span> images selected
      </div>
      <div className="h-6 w-px bg-white/10" />
      <div className="flex items-center gap-3">
        <button
          onClick={onSelectAll}
          disabled={downloading}
          className="px-4 py-2 bg-white/5 text-white/70 rounded-2xl text-xs font-bold hover:bg-white/10 transition disabled:opacity-30"
        >
          Select Page
        </button>
        <button
          onClick={onDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-5 py-2 bg-lime-400 text-black rounded-2xl text-xs font-bold hover:bg-lime-300 transition shadow-sm disabled:opacity-50"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}{" "}
          {downloading
            ? downloadProgress && downloadProgress.total > 0
              ? `${downloadProgress.current}/${downloadProgress.total}`
              : "Zipping..."
            : "Download Selected"}
        </button>
        <button
          onClick={onClear}
          disabled={downloading}
          className="px-4 py-2 bg-white/5 text-white/40 rounded-2xl text-xs font-bold hover:bg-white/10 transition disabled:opacity-30"
        >
          Clear
        </button>
      </div>
    </div>
  );
}