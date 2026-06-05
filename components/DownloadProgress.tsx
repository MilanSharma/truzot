"use client";
import { useState, useCallback } from "react";
import { Download, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface DownloadProgressProps {
  onDownload: (
    onProgress: (current: number, total: number) => void,
  ) => Promise<void>;
  label?: string;
}

export default function DownloadProgress({
  onDownload,
  label = "Download All",
}: DownloadProgressProps) {
  const [state, setState] = useState<"idle" | "downloading" | "done" | "error">(
    "idle",
  );
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  const startDownload = useCallback(async () => {
    setState("downloading");
    setProgress({ current: 0, total: 0 });
    try {
      await onDownload((current, total) => setProgress({ current, total }));
      setState("done");
      setTimeout(() => setState("idle"), 3000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 3000);
    }
  }, [onDownload]);

  return (
    <div className="flex items-center gap-3">
      {state === "idle" && (
        <button
          onClick={startDownload}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm"
        >
          <Download className="w-4 h-4" /> {label}
        </button>
      )}
      {state === "downloading" && (
        <div className="flex items-center gap-3 px-5 py-2.5 bg-slate-100 rounded-xl">
          <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-700">
              Downloading...
            </span>
            {progress.total > 0 && (
              <div className="w-32 h-1.5 bg-slate-200 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-blue-600 rounded-full transition-all duration-300"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
            )}
          </div>
        </div>
      )}
      {state === "done" && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold">
          <CheckCircle className="w-4 h-4" /> Downloaded
        </div>
      )}
      {state === "error" && (
        <div className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-bold">
          <AlertCircle className="w-4 h-4" /> Failed
        </div>
      )}
    </div>
  );
}
