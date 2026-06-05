"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutDashboard, Plus, ArrowRight, LogOut, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

interface MobileDrawerProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
}

export default function MobileDrawer({
  open,
  user,
  onClose,
}: MobileDrawerProps) {
  const router = useRouter();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 md:hidden animate-fade-in">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-slide-up p-6">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            TRUZOT
          </Link>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold bg-blue-50 text-blue-700"
          >
            <LayoutDashboard className="w-4 h-4" /> My Projects
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            <Plus className="w-4 h-4" /> New Shoot
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition"
          >
            <ArrowRight className="w-4 h-4" /> Back to Home
          </Link>
        </div>
        {user && (
          <div className="absolute bottom-6 left-6 right-6 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 truncate">
                {user.email}
              </span>
              <button
                onClick={() =>
                  supabase.auth.signOut().then(() => {
                    onClose();
                    router.push("/");
                  })
                }
                className="text-slate-400 hover:text-red-500 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
