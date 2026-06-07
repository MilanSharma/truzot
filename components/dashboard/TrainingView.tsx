"use client";
import { Zap, Shield } from "lucide-react";
import type { Order } from "@/lib/types";

export default function TrainingView({ order }: { order: Order }) {
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

      <div className="space-y-3">
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
          <div className="w-3 h-3 bg-blue-600 rounded-full animate-pulse" />
          <span className="text-sm font-medium text-slate-700">
            Training LoRA model on your photos...
          </span>
        </div>
        <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100 opacity-60">
          <div className="w-3 h-3 bg-slate-300 rounded-full" />
          <span className="text-sm font-medium text-slate-500">
            Generating headshots with your model (after training)
          </span>
        </div>
      </div>

      <div className="mt-10 bg-slate-50 rounded-xl p-4 border border-slate-100 text-sm text-slate-600 flex gap-3 items-start">
        <Shield className="w-5 h-5 text-emerald-500 shrink-0" />
        <p>
          You can safely close this window. We&apos;ll send an email to{" "}
          <strong>{order.email}</strong> the moment your high-resolution
          headshots are ready to view.
        </p>
      </div>
    </div>
  );
}
