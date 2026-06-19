"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Briefcase,
} from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@/lib/types";

export default function Sidebar({
  user,
  active,
}: {
  user: User | null;
  active?: boolean;
}) {
  const router = useRouter();

  return (
    <aside className="w-64 bg-[var(--bg-card)] border-r border-[var(--border-primary)] flex flex-col justify-between hidden md:flex shrink-0 z-10 overflow-y-auto">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-[var(--border-primary)]">
          <Link
            href="/dashboard"
            className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            TRUZOT
          </Link>
        </div>
        <div className="p-4 space-y-1">
          <a
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition w-full text-left ${active ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400" : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200"}`}
          >
            <LayoutDashboard className="w-4 h-4" /> My Projects
          </a>
          <a
            href="/team"
            className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition"
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" /> Team Workspace
            </div>
            <span className="text-[9px] bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase font-semibold">
              Coming Soon
            </span>
          </a>
          <Link
            href="/account"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-200 transition"
          >
            <Settings className="w-4 h-4" /> Account Settings
          </Link>
        </div>
      </div>

      <div className="mt-auto">
        <div className="p-4 border-t border-[var(--border-primary)]">
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-800 dark:to-slate-900 rounded-xl p-4 mb-4 text-white">
            <div className="flex items-center gap-2 font-bold text-sm mb-1">
              <Briefcase className="w-4 h-4 text-amber-400" /> For Teams
            </div>
            <p className="text-xs text-slate-300 mb-3 leading-relaxed">
              Get consistent branded headshots for your entire company.
            </p>
            <Link
              href="/contact"
              className="block w-full bg-white/10 hover:bg-white/20 transition py-1.5 rounded text-xs font-bold text-center"
            >
              Contact Sales
            </Link>
          </div>
          {user && (
            <div className="flex items-center justify-between px-3">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                {user.user_metadata?.full_name || user.email}
              </span>
              <button
                onClick={() =>
                  supabase.auth.signOut().then(() => {
                    sessionStorage.removeItem("truzot-upload");
                    localStorage.removeItem("truzot-upload");
                    localStorage.removeItem("truzot-upload-backup");
                    router.push("/");
                  })
                }
                className="text-slate-400 hover:text-red-500 transition"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
