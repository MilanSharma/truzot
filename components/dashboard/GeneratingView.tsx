"use client";
import {
  Sparkles,
  RefreshCw,
  Loader2,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase/client";
import ConfirmModal from "@/components/ConfirmModal";

interface GeneratingViewProps {
  count: number;
  target: number;
}

export default function GeneratingView({ count, target }: GeneratingViewProps) {
  const router = useRouter();
  const [retrying, setRetrying] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const { toast } = useToast();

  const [activeLogIndex, setActiveLogIndex] = useState(0);
  const logs = [
    "Applying dynamic studio lighting models...",
    "Rendering Corporate & Executive styles...",
    "Generating authentic outdoor backgrounds...",
    "Perfecting skin textures and micro‑expressions...",
    "Enhancing fine facial details...",
    "Packaging final gallery...",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveLogIndex((prev) => (prev + 1) % logs.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [logs.length]);

  const handleRetry = async () => {
    if (!orderId || retrying) return;
    setRetrying(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch("/api/generate/retry", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        toast("Generation resumed. This may take a few minutes.", "success");
      } else {
        throw new Error();
      }
    } catch {
      toast("Failed to resume. Ensure you have Fal.ai credits.", "error");
    } finally {
      setRetrying(false);
    }
  };

  const executeCancel = async () => {
    setConfirmOpen(false);
    setRetrying(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`/api/orders/cancel?id=${orderId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token || ""}`,
        },
      });
      if (res.ok) {
        toast("Generation cancelled. Redirecting...", "success");
        setTimeout(() => router.push("/dashboard"), 1500);
      } else {
        throw new Error();
      }
    } catch {
      toast("Failed to cancel generation.", "error");
    } finally {
      setRetrying(false);
    }
  };

  const percentage = target > 0 ? Math.round((count / target) * 100) : 0;

  return (
    <div className="bg-[var(--surface)] rounded-[2.5rem] border border-[var(--border)] shadow-2xl p-8 md:p-12 max-w-3xl mx-auto mt-12 relative overflow-hidden">
      {/* Background ambient glow — lime instead of indigo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-[var(--lime-dim)] rounded-full blur-[120px] pointer-events-none" />

      <div className="text-center relative z-10 mb-12">
        <div className="w-24 h-24 bg-[var(--lime-dim)] border border-[var(--lime-border)] rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg">
          <Sparkles className="w-12 h-12 text-[var(--lime-text)] animate-pulse" />
        </div>
        <h2 className="text-3xl font-black text-[var(--text)] mb-3 tracking-tight">
          Rendering Your Photos
        </h2>
        <p className="text-lg text-[var(--text-muted)] max-w-md mx-auto">
          Your model is trained! Now generating high‑resolution headshots in
          multiple professional styles.
        </p>
      </div>

      {/* Progress card */}
      <div className="max-w-xl mx-auto bg-[var(--bg)] rounded-[2rem] p-8 border border-[var(--border)] relative z-10 shadow-inner">
        <div className="flex justify-between items-end mb-4">
          <div>
            <div className="text-[10px] font-black text-[var(--lime-text)] uppercase tracking-widest mb-1">
              Engine Status
            </div>
            <div className="text-xl font-bold text-[var(--text)]">
              {percentage}% Complete
            </div>
          </div>
          <div className="text-sm font-bold text-[var(--text-muted)] flex items-center gap-2 bg-[var(--surface2)] px-3 py-1.5 rounded-lg border border-[var(--border)]">
            <ImageIcon className="w-4 h-4" /> {count} / {target}
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-4 bg-[var(--surface2)] rounded-full overflow-hidden mb-6 border border-[var(--border)]">
          <div
            className="h-full bg-gradient-to-r from-[var(--lime)] via-[#84CC16] to-[var(--lime)] rounded-full transition-all duration-700 ease-out relative"
            style={{ width: `${percentage}%`, backgroundSize: "200% auto" }}
          >
            <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" />
          </div>
        </div>

        {/* Animated log */}
        <div className="flex items-center gap-3 justify-center text-sm font-medium text-[var(--text-muted)] h-8">
          <Loader2 className="w-4 h-4 animate-spin text-[var(--lime-text)]" />
          <span
            className="animate-in fade-in slide-in-from-bottom-2 duration-300"
            key={activeLogIndex}
          >
            {logs[activeLogIndex]}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-10 flex flex-col items-center gap-4 relative z-10">
        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--surface2)] text-[var(--text)] border border-[var(--border)] rounded-2xl font-bold hover:bg-[var(--surface3)] transition disabled:opacity-50 shadow-sm active:scale-95"
        >
          {retrying ? (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--lime-text)]" />
          ) : (
            <RefreshCw className="w-4 h-4 text-[var(--lime-text)]" />
          )}
          {count > 0 ? "Force Resume Generation" : "Start Generation"}
        </button>
        <p className="text-xs font-semibold text-[var(--text-faint)] text-center max-w-sm">
          If generation seems stuck for more than 5 minutes, click resume to
          trigger the next batch. You can safely close this window.
        </p>
        <button
          onClick={() => setConfirmOpen(true)}
          className="text-xs text-[var(--error)] hover:underline mt-2"
        >
          Stop Processing & Cancel Order
        </button>

        {confirmOpen && (
          <ConfirmModal
            isOpen={true}
            title="Stop Processing"
            message="Are you sure you want to cancel this generation? You will be refunded automatically if you have paid."
            confirmText="Cancel Shoot"
            confirmStyle="bg-red-600 hover:bg-red-700"
            onConfirm={executeCancel}
            onCancel={() => setConfirmOpen(false)}
          />
        )}
      </div>
    </div>
  );
}