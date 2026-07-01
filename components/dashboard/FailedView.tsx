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
    <div className="bg-[#0E1016] rounded-3xl border border-white/10 p-10 max-w-2xl mx-auto shadow-2xl mt-12 text-center">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <X className="w-10 h-10 text-red-400" />
      </div>
      <h2 className="text-2xl font-black text-white mb-2">
        Generation Failed
      </h2>
      <p className="text-sm text-white/40 mb-8">
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
              router.refresh();
            } catch {
              toast(
                "Failed to retry. Please try again or contact support.",
                "error",
              );
            }
          }}
          className="inline-flex items-center gap-2 bg-lime-400 text-black px-6 py-3 rounded-2xl font-bold hover:bg-lime-300 transition shadow-lg shadow-lime-400/20"
        >
          <Zap className="w-4 h-4" /> Retry Generation
        </button>
        <button
          onClick={() => router.push("/upload")}
          className="inline-flex items-center gap-2 bg-white/5 text-white/70 px-6 py-3 rounded-2xl font-bold border border-white/10 hover:bg-white/10 transition"
        >
          Start New Shoot
        </button>
      </div>
      <div className="mt-6 text-xs text-white/20 flex items-center justify-center gap-1">
        <Shield className="w-3 h-3" /> If the issue persists, email{" "}
        <a href="mailto:hello@truzot.com" className="text-lime-400 underline">
          hello@truzot.com
        </a>
      </div>
    </div>
  );
}