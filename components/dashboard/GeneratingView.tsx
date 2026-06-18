"use client";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/Toast";
import { supabase } from "@/lib/supabase/client";

interface GeneratingViewProps {
  count: number;
  target: number;
}

export default function GeneratingView({ count, target }: GeneratingViewProps) {
  const [retrying, setRetrying] = useState(false);
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order");
  const { toast } = useToast();

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

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-10 max-w-2xl mx-auto shadow-sm mt-12 text-center">
      <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-10 h-10 text-indigo-600 animate-pulse" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Rendering Photography
      </h2>
      <p className="text-sm text-slate-500 mb-8">
        Applying professional studio lighting and tailored environments.
      </p>
      <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">
          <span>Render Engine Progress</span>
          <span className="text-indigo-600 dark:text-indigo-400">
            {count} / {target}
          </span>
        </div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${target > 0 ? (count / target) * 100 : 0}%` }}
          />
        </div>

        <button
          onClick={handleRetry}
          disabled={retrying}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 dark:bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition disabled:opacity-50"
        >
          {retrying ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <RefreshCw className="w-3 h-3" />
          )}
          {count > 0 ? "Resume Generation" : "Start Generation"}
        </button>

        <p className="text-[10px] font-semibold text-slate-400 mt-4">
          Stuck? Click resume to trigger the next batch of images.
        </p>
      </div>
    </div>
  );
}
