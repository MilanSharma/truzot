"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut,
  Briefcase,
  Sparkles,
  Zap,
  CreditCard,
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
    <aside className="w-[280px] bg-white/80 dark:bg-[#0b0d10]/80 backdrop-blur-3xl border-r border-slate-200/50 dark:border-slate-800/50 flex flex-col justify-between hidden md:flex shrink-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
      <div>
        <div className="h-20 flex items-center px-8 border-b border-slate-200/50 dark:border-slate-800/50">
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            TRUZOT
          </Link>
        </div>
        <div className="p-5 space-y-1.5 mt-2">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-3">
            Main Menu
          </p>
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 w-full text-left active:scale-95 ${active ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xl" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"}`}
          >
            <LayoutDashboard className="w-4 h-4" /> My Projects
          </Link>
          <Link
            href="/upload"
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 w-full text-left active:scale-95 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
          >
            <Sparkles className="w-4 h-4" /> New Shoot
          </Link>
          <Link
            href="/team"
            className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 w-full text-left active:scale-95 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" /> Team Workspace
            </div>
            <span className="text-[9px] bg-amber-100 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded uppercase font-bold">
              Soon
            </span>
          </Link>

          <div className="pt-6 pb-2">
            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-3 mb-3">
              Preferences
            </p>
            <Link
              href="/billing"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 w-full text-left active:scale-95 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
            >
              <CreditCard className="w-4 h-4" /> Billing & Invoices
            </Link>
            <Link
              href="/account"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 w-full text-left active:scale-95 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200"
            >
              <Settings className="w-4 h-4" /> Account Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-auto p-5">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-5 mb-6 text-white relative overflow-hidden shadow-[0_8px_30px_rgba(79,70,229,0.3)] group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:bg-white/20 transition-all duration-500" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 font-black text-sm mb-2">
              <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />{" "}
              Enterprise API
            </div>
            <p className="text-xs text-blue-100 mb-4 leading-relaxed font-medium">
              Integrate Truzot directly into your app. Generate headshots
              programmatically.
            </p>
            <Link
              href="/contact"
              className="block w-full bg-white/20 hover:bg-white/30 backdrop-blur-md transition py-2.5 rounded-xl text-xs font-bold text-center active:scale-95 border border-white/10"
            >
              Request Access
            </Link>
          </div>
        </div>

        {user && (
          <div className="flex items-center justify-between px-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-md">
                {(user.user_metadata?.full_name || user.email || "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {user.user_metadata?.full_name || "Professional"}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 truncate">
                  {user.email}
                </span>
              </div>
            </div>
            <button
              onClick={() =>
                supabase.auth.signOut().then(() => {
                  sessionStorage.clear();
                  localStorage.clear();
                  router.push("/");
                })
              }
              className="text-slate-400 hover:text-red-500 transition active:scale-95 p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
