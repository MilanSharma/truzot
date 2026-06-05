"use client";
import { Sparkles } from "lucide-react";

interface GeneratingViewProps {
  count: number;
  target: number;
}

export default function GeneratingView({ count, target }: GeneratingViewProps) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-10 max-w-2xl mx-auto shadow-sm mt-12 text-center">
      <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
        <Sparkles className="w-10 h-10 text-indigo-600 animate-pulse" />
      </div>
      <h2 className="text-2xl font-bold text-slate-900 mb-2">
        Rendering Photography
      </h2>
      <p className="text-sm text-slate-500 mb-8">
        Applying professional studio lighting and tailored environments.
      </p>
      <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-6 border border-slate-100">
        <div className="flex justify-between text-sm font-bold text-slate-700 mb-3">
          <span>Render Engine Progress</span>
          <span className="text-indigo-600">
            {count} / {target}
          </span>
        </div>
        <div className="h-3 bg-slate-200 rounded-full overflow-hidden mb-3">
          <div
            className="h-full bg-indigo-600 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${target > 0 ? (count / target) * 100 : 0}%` }}
          />
        </div>
        <p className="text-xs font-semibold text-slate-400">
          Rendering in multi-thread batch processing...
        </p>
      </div>
    </div>
  );
}
