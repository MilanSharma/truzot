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
    <aside className="w-[280px] bg-[#0E1016] border-r border-white/10 flex flex-col justify-between hidden md:flex shrink-0 z-20">
      {/* Top section */}
      <div>
        <div className="h-20 flex items-center px-8 border-b border-white/10">
          <Link
            href="/"
            className="text-2xl font-black tracking-tighter text-white"
          >
            TRUZOT
            <span className="ml-1.5 text-[10px] font-bold text-lime-400 align-super tracking-widest">AI</span>
          </Link>
        </div>
        {user ? (
          <div className="p-5 space-y-1.5 mt-2">
            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-3">
              Main Menu
            </p>
            <Link
              href="/dashboard"
              className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 w-full text-left active:scale-95 ${
                active
                  ? "bg-lime-400 text-black shadow-lg shadow-lime-400/20"
                  : "text-white/50 hover:text-white hover:bg-white/5"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> My Projects
            </Link>
            <Link
              href="/upload"
              className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 w-full text-left active:scale-95 text-white/50 hover:text-white hover:bg-white/5"
            >
              <Sparkles className="w-4 h-4" /> New Shoot
            </Link>
            <Link
              href="/team"
              className="flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 w-full text-left active:scale-95 text-white/50 hover:text-white hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <Users className="w-4 h-4" /> Team Workspace
              </div>
              <span className="text-[9px] bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded uppercase font-bold">
                Soon
              </span>
            </Link>

            <div className="pt-6 pb-2">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest px-3 mb-3">
                Preferences
              </p>
              <Link
                href="/billing"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 w-full text-left active:scale-95 text-white/50 hover:text-white hover:bg-white/5"
              >
                <CreditCard className="w-4 h-4" /> Billing & Invoices
              </Link>
              <Link
                href="/account"
                className="flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-300 w-full text-left active:scale-95 text-white/50 hover:text-white hover:bg-white/5"
              >
                <Settings className="w-4 h-4" /> Account Settings
              </Link>
            </div>
          </div>
        ) : (
          <div className="p-5 mt-2">
            <p className="text-xs text-white/30 px-3 py-2">Guest Access</p>
            <p className="text-xs text-white/50 px-3">Create an account to access all features</p>
          </div>
        )}
      </div>

      {/* Bottom section */}
      <div className="mt-auto p-5">
        {/* Enterprise API upsell card - only show for logged in users */}
        {user && (
          <div className="bg-gradient-to-br from-lime-400/10 to-lime-400/5 rounded-2xl p-5 mb-6 relative overflow-hidden shadow-[0_8px_30px_rgba(163,230,53,0.08)] border border-lime-400/10">
            <div className="relative z-10">
              <div className="flex items-center gap-2 font-black text-sm text-lime-400 mb-2">
                <Zap className="w-4 h-4 fill-lime-400" /> Enterprise API
              </div>
              <p className="text-xs text-white/50 mb-4 leading-relaxed font-medium">
                Integrate Truzot directly into your app. Generate headshots programmatically.
              </p>
              <Link
                href="/contact"
                className="block w-full bg-lime-400/20 hover:bg-lime-400/30 backdrop-blur-md transition py-2.5 rounded-2xl text-xs font-bold text-center active:scale-95 border border-lime-400/20 text-lime-400"
              >
                Request Access
              </Link>
            </div>
          </div>
        )}

        {/* User section */}
        {user && (
          <div className="flex items-center justify-between px-2 pt-2 border-t border-white/10">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 rounded-full bg-lime-400 flex items-center justify-center text-black font-bold text-xs shrink-0 shadow-md">
                {(user.user_metadata?.full_name || user.email || "?")
                  .charAt(0)
                  .toUpperCase()}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-sm font-bold text-white truncate">
                  {user.user_metadata?.full_name || "Professional"}
                </span>
                <span className="text-[10px] font-semibold text-white/40 truncate">
                  {user.email}
                </span>
              </div>
            </div>
            <button
              onClick={() =>
                supabase.auth.signOut().then(() => {
                  sessionStorage.removeItem("truzot-upload");
                  localStorage.removeItem("truzot-upload");
                  localStorage.removeItem("truzot-upload-backup");
                  sessionStorage.removeItem("truzot-idempotency-key");
                  window.location.href = "/";
                })
              }
              className="text-white/40 hover:text-red-400 transition active:scale-95 p-2 rounded-2xl hover:bg-red-400/10 shrink-0"
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