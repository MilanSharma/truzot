"use client";
import Link from "next/link";
import { useState } from "react";
import { Plus, ArrowRight, Camera, CheckCircle, Trash2, X } from "lucide-react";
import { PLANS } from "@/lib/plans";
import type { Order } from "@/lib/types";

function ProjectSkeleton() {
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm animate-pulse"
        >
          <div className="h-3 w-16 bg-slate-200 rounded mb-3" />
          <div className="h-5 w-32 bg-slate-200 rounded mb-2" />
          <div className="h-3 w-24 bg-slate-200 rounded mb-6" />
          <div className="flex items-center justify-between">
            <div className="h-6 w-20 bg-slate-200 rounded" />
            <div className="h-4 w-4 bg-slate-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 animate-in zoom-in-95 fade-in duration-200">
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>
        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-500" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 text-center mb-2">
          Delete Order
        </h3>
        <p className="text-sm text-slate-500 text-center mb-6">
          Are you sure you want to delete this order? This action cannot be
          undone.
        </p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-sm font-bold text-white hover:bg-red-700 transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProjectLibrary({
  orders,
  loading = false,
  onDelete,
}: {
  orders: Order[];
  loading?: boolean;
  onDelete?: (id: string) => void;
}) {
  const [deletingOrderId, setDeletingOrderId] = useState<string | null>(null);

  if (loading) return <ProjectSkeleton />;
  return (
    <div className="animate-in fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 mb-1">
            My Projects
          </h1>
          <p className="text-sm text-slate-500 font-medium">
            Manage and download your AI photoshoots
          </p>
        </div>
        <Link
          href="/upload"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-blue-700 transition shadow-sm"
        >
          <Plus className="w-4 h-4" /> New Shoot
        </Link>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24 bg-white rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-400 to-indigo-500" />
          <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <Camera className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">
            Create your first AI models
          </h2>
          <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
            Get high-end studio pictures in under an hour without setting foot
            outside. Perfect for LinkedIn, resumes, and company pages.
          </p>
          <Link
            href="/upload"
            className="inline-flex items-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-xl text-sm font-bold hover:bg-slate-800 transition shadow-lg"
          >
            Upload Selfies <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg hover:border-blue-300 transition group relative overflow-hidden"
            >
              <Link href={`/dashboard?order=${o.id}`} className="block p-6">
                {o.status === "completed" && (
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full flex items-start justify-end p-3">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                )}
                <ArrowRight className="absolute top-4 right-4 w-5 h-5 text-slate-300 group-hover:text-blue-600 transition group-hover:translate-x-0.5" />
                <span className="text-[10px] font-black text-blue-600 tracking-widest uppercase mb-2 block">
                  {PLANS[o.plan as keyof typeof PLANS]?.name || "Shoot"}
                </span>
                <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition mb-1">
                  Order #{o.id.slice(0, 6)}
                </h3>
                <span className="text-xs text-slate-400 font-medium block mb-6">
                  {new Date(o.created_at).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-bold ${
                      o.status === "completed"
                        ? "bg-emerald-50 text-emerald-700"
                        : ["training", "generating"].includes(o.status)
                          ? "bg-indigo-50 text-indigo-700"
                          : "bg-amber-50 text-amber-700"
                    }`}
                  >
                    {o.status === "completed"
                      ? "Gallery Ready"
                      : o.status === "failed"
                        ? "Failed"
                        : "In Progress"}
                  </span>
                </div>
              </Link>
              {onDelete && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeletingOrderId(o.id);
                  }}
                  className="absolute bottom-3 right-3 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100"
                  title="Delete order"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deletingOrderId}
        onConfirm={() => {
          if (deletingOrderId && onDelete) onDelete(deletingOrderId);
          setDeletingOrderId(null);
        }}
        onCancel={() => setDeletingOrderId(null)}
      />
    </div>
  );
}
