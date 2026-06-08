"use client";
import { useState, useEffect } from "react";
import { Zap, Shield, RefreshCw, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import type { Order } from "@/lib/types";

interface ProgressData {
  progress: number;
  status?: string;
  queuePosition?: number;
  step?: number;
  total?: number;
}

export default function TrainingView({ order }: { order: Order }) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [progress, setProgress] = useState<ProgressData | null>(null);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(`/api/training/progress?orderId=${order.id}`, {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          setProgress(data);
        }
      } catch {
        // ignore
      }
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [order.id]);

  const progressPct = progress?.progress ?? 0;
  const progressStatus = progress?.status;
  const statusText =
    progressStatus === "in_queue" && progress?.queuePosition
      ? `Waiting in queue (position: ${progress.queuePosition})...`
      : progressStatus === "in_progress" && progress?.step && progress?.total
        ? `Training step ${progress.step} of ${progress.total}...`
        : progressPct > 0
          ? `Training: ${progressPct}% complete`
          : "Training LoRA model on your photos...";

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ orderId: order.id }),
      });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setRetrying(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-10 max-w-2xl mx-auto shadow-sm mt-12">
      <div className="flex items-center justify-between mb-8 border-b border-slate-100 pb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Training AI Model
          </h2>
          <p className="text-sm text-slate-500">
            Learning your facial features from uploaded photos (ETA: ~15 mins)
          </p>
        </div>
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
          <Zap className="w-6 h-6 text-blue-600 animate-pulse" />
        </div>
      </div>

      {progressPct > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm text-slate-600 mb-2">
            <span>Progress</span>
            <span className="font-bold">{progressPct}%</span>
          </div>
          <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          {progressStatus === "in_queue" ? (
            <Loader2 className="w-3 h-3 text-amber-600 animate-spin" />
          ) : (
            <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
          )}
          <span className="text-sm font-medium text-slate-700">
            {statusText}
          </span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 opacity-60">
          <div className="w-3 h-3 bg-slate-300 rounded-full" />
          <span className="text-sm font-medium text-slate-500">
            Generating headshots with your model (after training)
          </span>
        </div>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition disabled:opacity-50 shadow-sm"
        >
          <RefreshCw className={`w-4 h-4 ${retrying ? "animate-spin" : ""}`} />
          {retrying ? "Retrying..." : "Stuck? Retry Training"}
        </button>
      </div>

      <div className="mt-6 bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-600 flex gap-3 items-start">
        <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
        <p>
          You can safely close this window. We&apos;ll send an email to{" "}
          <strong>{order.email || "your email on file"}</strong> the moment your
          high-resolution headshots are ready to view.
        </p>
      </div>
    </div>
  );
}
