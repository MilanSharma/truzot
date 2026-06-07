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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between hidden md:flex shrink-0 z-10">
      <div>
        <div className="h-16 flex items-center px-6 border-b border-slate-100">
          <Link
            href="/"
            className="text-xl font-black tracking-tighter bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"
          >
            TRUZOT
          </Link>
        </div>
        <div className="p-4 space-y-1">
          <Link
            href="/dashboard"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold transition w-full text-left ${active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
          >
            <LayoutDashboard className="w-4 h-4" /> My Projects
          </Link>
          <div className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-bold text-slate-400 cursor-not-allowed group">
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4" /> Team Workspace
            </div>
            <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded uppercase">
              Upgrade
            </span>
          </div>
          <Link
            href="/account"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <Settings className="w-4 h-4" /> Account Settings
          </Link>
        </div>
      </div>

      <div className="p-4 border-t border-slate-100">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-xl p-4 mb-4 text-white">
          <div className="flex items-center gap-2 font-bold text-sm mb-1">
            <Briefcase className="w-4 h-4 text-amber-400" /> For Teams
          </div>
          <p className="text-xs text-slate-300 mb-3 leading-relaxed">
            Get consistent branded headshots for your entire company.
          </p>
          <button className="w-full bg-white/10 hover:bg-white/20 transition py-1.5 rounded text-xs font-bold">
            Contact Sales
          </button>
        </div>
        {user && (
          <div className="flex items-center justify-between px-3">
            <span className="text-xs font-semibold text-slate-500 truncate max-w-[140px]">
              {user.email}
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
    </aside>
  );
}
