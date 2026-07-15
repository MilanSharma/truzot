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
    <div className="bg-[var(--surface)] rounded-3xl border border-[var(--border)] p-10 max-w-2xl mx-auto shadow-2xl mt-12 text-center">
      <div className="w-20 h-20 bg-[var(--error)]/10 rounded-full flex items-center justify-center mx-auto mb-6">
        <X className="w-10 h-10 text-[var(--error)]" />
      </div>
      <h2 className="text-2xl font-black text-[var(--text)] mb-2">
        Generation Failed
      </h2>
      <p className="text-sm text-[var(--text-muted)] mb-8">
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
          className="inline-flex items-center gap-2 bg-[var(--lime)] text-[var(--lime-on)] px-6 py-3 rounded-2xl font-bold hover:brightness-110 transition shadow-lg shadow-[var(--shadow-lime)]"
        >
          <Zap className="w-4 h-4" /> Retry Generation
        </button>
        <button
          onClick={() => router.push("/upload")}
          className="inline-flex items-center gap-2 bg-[var(--surface2)] text-[var(--text)] px-6 py-3 rounded-2xl font-bold border border-[var(--border)] hover:bg-[var(--surface3)] transition"
        >
          Start New Shoot
        </button>
      </div>
      <div className="mt-6 text-xs text-[var(--text-faint)] flex items-center justify-center gap-1">
        <Shield className="w-3 h-3" /> If the issue persists, email{" "}
        <a href="mailto:hello@truzot.com" className="text-[var(--lime-text)] underline">
          hello@truzot.com
        </a>
      </div>
    </div>
  );
}