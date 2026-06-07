"use client";
import { X, Zap, Shield } from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";
import type { Order } from "@/lib/types";

export default function FailedView({ order }: { order: Order }) {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-10 max-w-2xl mx-auto shadow-sm mt-12 text-center">
      <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <X className="w-10 h-10 text-red-500" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Generation Failed
      </h2>
      <p className="text-sm text-slate-500 mb-8">
        Something went wrong during processing. You can retry or contact
        support.
      </p>
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={async () => {
            const {
              data: { session },
            } = await supabase.auth.getSession();
            try {
              const res = await fetch("/api/retry", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${session?.access_token || ""}`,
                },
                body: JSON.stringify({ orderId: order.id }),
              });
              if (!res.ok) throw new Error("Retry failed");
              window.location.reload();
            } catch {
              toast(
                "Failed to retry. Please try again or contact support.",
                "error",
              );
            }
          }}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition shadow-sm"
        >
          <Zap className="w-4 h-4" /> Retry Generation
        </button>
        <button
          onClick={() => router.push("/upload")}
          className="inline-flex items-center gap-2 bg-white text-slate-700 px-6 py-3 rounded-xl font-bold border border-slate-200 hover:bg-slate-50 transition"
        >
          Start New Shoot
        </button>
      </div>
      <div className="mt-6 text-xs text-slate-400 flex items-center justify-center gap-1">
        <Shield className="w-3 h-3" /> If the issue persists, email{" "}
        <a href="mailto:hello@truzot.com" className="text-blue-600 underline">
          hello@truzot.com
        </a>
      </div>
    </div>
  );
}
