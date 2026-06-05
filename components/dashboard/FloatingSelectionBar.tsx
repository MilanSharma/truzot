"use client";
import { Download } from "lucide-react";

interface FloatingSelectionBarProps {
  selectedCount: number;
  downloading: boolean;
  onSelectAll: () => void;
  onDownload: () => void;
  onClear: () => void;
}

export default function FloatingSelectionBar({
  selectedCount,
  downloading,
  onSelectAll,
  onDownload,
  onClear,
}: FloatingSelectionBarProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl z-50 flex items-center gap-6 border border-slate-700 animate-in slide-in-from-bottom-8">
      <div className="text-sm font-bold">
        <span className="text-blue-400">{selectedCount}</span> images selected
      </div>
      <div className="h-6 w-px bg-slate-700" />
      <div className="flex items-center gap-3">
        <button
          onClick={onSelectAll}
          className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition"
        >
          Select Page
        </button>
        <button
          onClick={onDownload}
          disabled={downloading}
          className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
        >
          <Download className="w-4 h-4" />{" "}
          {downloading ? "Zipping..." : "Download Selected"}
        </button>
        <button
          onClick={onClear}
          className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition"
        >
          Clear
        </button>
      </div>
    </div>
  );
}
