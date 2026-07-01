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
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Drawer panel */}
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-[#0E1016] border-r border-white/10 shadow-2xl animate-slide-up p-6">
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-xl font-black tracking-tighter text-white"
          >
            TRUZOT
          </Link>
          <button
            onClick={onClose}
            className="text-white/40 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <Link
            href="/dashboard"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold bg-lime-400/10 text-lime-400 w-full text-left"
          >
            <LayoutDashboard className="w-4 h-4" /> My Projects
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition"
          >
            <Plus className="w-4 h-4" /> New Shoot
          </Link>
          <Link
            href="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-white/50 hover:text-white hover:bg-white/5 transition"
          >
            <ArrowRight className="w-4 h-4" /> Back to Home
          </Link>
        </div>

        {user && (
          <div className="absolute bottom-6 left-6 right-6 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white/40 truncate">
                {user.user_metadata?.full_name || user.email}
              </span>
              <button
                onClick={() =>
                  supabase.auth.signOut().then(() => {
                    sessionStorage.removeItem("truzot-upload");
                    localStorage.removeItem("truzot-upload");
                    localStorage.removeItem("truzot-upload-backup");
                    onClose();
                    window.location.href = "/";
                  })
                }
                className="text-white/40 hover:text-red-400 transition"
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